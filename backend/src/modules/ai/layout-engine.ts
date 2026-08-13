import { randomUUID } from "node:crypto";
import type { BoardElement } from "./types.js";
import type { IntentPayload, IntentElement } from "./types.js";

interface Viewport {
  x: number;
  y: number;
  w: number;
  h: number;
}

// ---------------------------------------------------------------------------
// Text Measurement Heuristic
// ---------------------------------------------------------------------------
function measureText(text: string | undefined): { width: number; height: number } {
  if (!text) return { width: 0, height: 0 };
  const lines = text.split('\n');
  const maxLineLength = Math.max(...lines.map(l => l.length));
  // Default font in tldraw 'm' is quite large, ~18px per char width, 36px line height
  return {
    width: maxLineLength * 18,
    height: lines.length * 36
  };
}

// ---------------------------------------------------------------------------
// Layout Engines
// ---------------------------------------------------------------------------

function routeWireframe(elements: IntentElement[], viewport: Viewport, existingMap: Map<string, any>): BoardElement[] {
  const result: BoardElement[] = [];
  const PADDING = 24;
  const GAP = 16;
  const idMap = new Map<string, string>(); // LLM ID -> UUID

  // 1. Assign real UUIDs
  for (const el of elements) {
    idMap.set(el.id, el.id.startsWith("e") ? randomUUID() : el.id);
  }

  // Helper to get real ID
  const getRealId = (llmId: string) => idMap.get(llmId) || llmId;

  // 2. Build tree
  const rootElements = elements.filter(e => !e.parentId);
  const childrenMap = new Map<string, IntentElement[]>();
  for (const el of elements) {
    if (el.parentId) {
      if (!childrenMap.has(el.parentId)) childrenMap.set(el.parentId, []);
      childrenMap.get(el.parentId)!.push(el);
    }
  }

  // 3. Recursive Layout Function
  function layoutNode(node: IntentElement, x: number, y: number): { width: number, height: number, childrenEls: BoardElement[] } {
    const existing = existingMap.get(node.id);
    const lockedX = existing && existing.x !== undefined ? existing.x : x;
    const lockedY = existing && existing.y !== undefined ? existing.y : y;

    let currentX = lockedX + PADDING;
    let currentY = lockedY + PADDING;
    let maxWidth = 0;
    let maxHeight = 0;
    
    const children = childrenMap.get(node.id) || [];
    const childrenEls: BoardElement[] = [];

    const isHorizontal = node.layoutHint === "horizontal";

    for (const child of children) {
      const childLayout = layoutNode(child, currentX, currentY);
      
      const childExisting = existingMap.get(child.id);
      
      let childType: any = "rectangle";
      if (child.type === "text") childType = "text";
      else if (child.type === "input" || child.type === "button") childType = "rectangle";

      const childFinalX = childExisting && childExisting.x !== undefined ? childExisting.x : currentX;
      const childFinalY = childExisting && childExisting.y !== undefined ? childExisting.y : currentY;

      childrenEls.push({
        id: getRealId(child.id),
        type: childExisting && childExisting.type ? childExisting.type : childType,
        x: childFinalX,
        y: childFinalY,
        width: childLayout.width,
        height: childLayout.height,
        label: child.label,
        style: child.style || (child.type === "button" ? { fill: "blue", stroke: "blue" } : undefined)
      });
      
      // Now push its children
      childrenEls.push(...childLayout.childrenEls);

      if (!childExisting) {
        if (isHorizontal) {
          currentX += childLayout.width + GAP;
          maxHeight = Math.max(maxHeight, childLayout.height);
          maxWidth += childLayout.width + GAP;
        } else {
          currentY += childLayout.height + GAP;
          maxWidth = Math.max(maxWidth, childLayout.width);
          maxHeight += childLayout.height + GAP;
        }
      }
    }

    // Base size from text if no children
    let baseWidth = 100;
    let baseHeight = 40;
    if (children.length === 0) {
      const textMetrics = measureText(node.label);
      baseWidth = Math.max(100, textMetrics.width + PADDING * 2);
      baseHeight = Math.max(40, textMetrics.height + PADDING);
    } else {
      if (isHorizontal) maxWidth -= GAP;
      else maxHeight -= GAP;
      
      baseWidth = maxWidth + PADDING * 2;
      baseHeight = maxHeight + PADDING * 2;
    }

    if (children.length > 0 && node.label) {
       const textMetrics = measureText(node.label);
       baseWidth = Math.max(baseWidth, textMetrics.width + PADDING * 2);
    }

    if (existing && existing.w && existing.h) {
       // if we have existing size, try to respect it if we are just a leaf node, 
       // but if we have children we probably need to resize to fit them.
       if (children.length === 0) {
         baseWidth = existing.w;
         baseHeight = existing.h;
       }
    }

    return { width: baseWidth, height: baseHeight, childrenEls };
  }

  // 4. Layout Roots
  let currentRootY = viewport.y + viewport.h / 4;
  let startX = viewport.x + viewport.w / 4;

  for (const root of rootElements) {
    const existing = existingMap.get(root.id);
    const rootX = existing && existing.x !== undefined ? existing.x : startX;
    const rootY = existing && existing.y !== undefined ? existing.y : currentRootY;
    
    const layout = layoutNode(root, rootX, rootY);
    
    result.push({
      id: getRealId(root.id),
      type: existing && existing.type ? existing.type : "frame",
      x: rootX,
      y: rootY,
      width: layout.width,
      height: layout.height,
      label: root.label,
      style: root.style
    });

    result.push(...layout.childrenEls);
    if (!existing) {
      currentRootY += layout.height + PADDING * 2;
    }
  }

  return result;
}

function routeFlowchart(elements: IntentElement[], viewport: Viewport, existingMap: Map<string, any>): BoardElement[] {
  const result: BoardElement[] = [];
  const idMap = new Map<string, string>();
  for (const el of elements) {
    idMap.set(el.id, el.id.startsWith("e") ? randomUUID() : el.id);
  }
  const getRealId = (llmId: string) => idMap.get(llmId) || llmId;

  let x = viewport.x + 100;
  let y = viewport.y + 100;
  const GAP = 100; // Gap between elements

  let rowMaxHeight = 0;

  const placedNodes = new Map<string, { x: number, y: number, w: number, h: number }>();

  // Flowchart grid with dynamic sizes
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    if (el.type === "arrow") continue;
    
    const existing = existingMap.get(el.id);
    const textMetrics = measureText(el.label);
    
    const width = existing && existing.w ? existing.w : Math.max(150, textMetrics.width + 48);
    const height = existing && existing.h ? existing.h : Math.max(80, textMetrics.height + 48);
    
    const finalX = existing && existing.x !== undefined ? existing.x : x;
    const finalY = existing && existing.y !== undefined ? existing.y : y;

    result.push({
      id: getRealId(el.id),
      type: existing && existing.type ? existing.type : "rectangle",
      x: finalX,
      y: finalY,
      width,
      height,
      label: el.label,
      style: el.style
    });
    
    placedNodes.set(el.id, { x: finalX, y: finalY, w: width, h: height });
    
    if (!existing) {
      x += width + GAP;
      rowMaxHeight = Math.max(rowMaxHeight, height);

      if (x > viewport.x + viewport.w - width) {
        x = viewport.x + 100;
        y += rowMaxHeight + GAP;
        rowMaxHeight = 0;
      }
    }
  }

  // Generate Arrows from connections
  for (const el of elements) {
    if (el.connections && el.connections.length > 0) {
      const source = placedNodes.get(el.id);
      if (!source) continue;

      for (const targetId of el.connections) {
        const target = placedNodes.get(targetId);
        if (!target) continue;

        const startX = source.x + source.w / 2;
        const startY = source.y + source.h / 2;
        const endX = target.x + target.w / 2;
        const endY = target.y + target.h / 2;

        const minX = Math.min(startX, endX);
        const minY = Math.min(startY, endY);

        result.unshift({ // unshift so arrows render behind nodes
          id: randomUUID(),
          type: "arrow",
          x: minX,
          y: minY,
          width: Math.max(1, Math.abs(endX - startX)),
          height: Math.max(1, Math.abs(endY - startY)),
          points: [
            { x: startX - minX, y: startY - minY },
            { x: endX - minX, y: endY - minY }
          ],
          startShapeId: getRealId(el.id),
          endShapeId: getRealId(targetId)
        });
      }
    }
  }

  return result;
}

function routeCluster(elements: IntentElement[], viewport: Viewport, existingMap: Map<string, any>): BoardElement[] {
  // Simple radial placement
  const result: BoardElement[] = [];
  const idMap = new Map<string, string>();
  for (const el of elements) {
    idMap.set(el.id, el.id.startsWith("e") ? randomUUID() : el.id);
  }
  const getRealId = (llmId: string) => idMap.get(llmId) || llmId;

  const centerX = viewport.x + viewport.w / 2;
  const centerY = viewport.y + viewport.h / 2;
  const radius = 200;

  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    const existing = existingMap.get(el.id);
    
    const angle = (i / elements.length) * Math.PI * 2;
    const gridX = centerX + Math.cos(angle) * radius - 75; // -75 to center the sticky
    const gridY = centerY + Math.sin(angle) * radius - 75;
    
    const finalX = existing && existing.x !== undefined ? existing.x : gridX;
    const finalY = existing && existing.y !== undefined ? existing.y : gridY;

    result.push({
      id: getRealId(el.id),
      type: existing && existing.type ? existing.type : "sticky",
      x: finalX,
      y: finalY,
      width: existing && existing.w ? existing.w : 150,
      height: existing && existing.h ? existing.h : 150,
      label: el.label,
      style: el.style
    });
  }

  return result;
}

export function routeIntentLayout(payload: IntentPayload, viewport: Viewport, existingElements: any[] = []): BoardElement[] {
  const existingMap = new Map<string, any>();
  for (const el of existingElements) {
    const rawId = el.id.startsWith("shape:") ? el.id.replace("shape:", "") : el.id;
    existingMap.set(rawId, el);
    existingMap.set(el.id, el);
  }

  switch (payload.intent) {
    case "wireframe":
      return routeWireframe(payload.elements, viewport, existingMap);
    case "flowchart":
      return routeFlowchart(payload.elements, viewport, existingMap);
    case "cluster":
      return routeCluster(payload.elements, viewport, existingMap);
    default:
      // Fallback
      return routeCluster(payload.elements, viewport, existingMap);
  }
}
