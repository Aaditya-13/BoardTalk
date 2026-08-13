import { useEffect, useState, useRef } from 'react';
import { socket } from '@/lib/socket';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Sparkles, Loader2, AlertCircle, MousePointer2, Lightbulb, PenTool, BookOpen, X, Copy, Layout } from 'lucide-react';
import { type TLStore, type Editor, toRichText } from 'tldraw';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface AIRequest {
  id: string;
  prompt: string;
  status: 'generating' | 'success' | 'error';
  error?: string;
  streamText?: string;
  type?: 'text' | 'elements';
}

export function AISidebar({ boardId, store, editor }: { boardId: string; store: TLStore; editor: Editor | null }) {
  const [requests, setRequests] = useState<AIRequest[]>(() => {
    try {
      const saved = localStorage.getItem(`ai_history_${boardId}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(`ai_history_${boardId}`, JSON.stringify(requests));
  }, [requests, boardId]);
  const [input, setInput] = useState('');
  const [showGuidebook, setShowGuidebook] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const getValidColor = (colorStr?: string) => {
    const validColors = ["black", "grey", "light-violet", "violet", "blue", "light-blue", "yellow", "orange", "green", "light-green", "light-red", "red", "white"];
    if (!colorStr) return 'black';
    const lower = colorStr.toLowerCase();
    return validColors.includes(lower) ? lower : 'black';
  };

  useEffect(() => {
    const handleGenerating = (payload: { boardId: string; requestId: string }) => {
      if (payload.boardId === boardId) {
        setRequests((prev) => prev.map(r => r.id === payload.requestId ? { ...r, status: 'generating' } : r));
      }
    };

    const handleResult = (payload: { boardId: string; requestId: string; elements: any[] }) => {
      if (payload.boardId === boardId) {
        if (payload.elements && payload.elements.length > 0) {
          setRequests((prev) => prev.map(r => r.id === payload.requestId ? { ...r, status: 'success', type: 'elements' } : r));
        } else {
          // If no elements, it might just be a text response completing
          setRequests((prev) => prev.map(r => r.id === payload.requestId ? { ...r, status: 'success' } : r));
        }

        // Add elements to canvas
        const shapesToCreate: any[] = [];
        const shapesToUpdate: any[] = [];

        payload.elements.forEach((el) => {
          const shapeId = el.id.startsWith('shape:') ? el.id : `shape:${el.id}`;
          const base = {
            id: shapeId,
            typeName: 'shape',
            x: el.x,
            y: el.y,
            rotation: 0,
            isLocked: false,
            opacity: el.style?.opacity ?? 1,
            meta: {},
            parentId: 'page:page',
          };

          const existingShape = editor?.getShape(shapeId);

          let tlShape = null;

          if (el.type === 'rectangle' || el.type === 'ellipse' || el.type === 'diamond' || el.type === 'geo') {
            const geoType = existingShape ? (existingShape as any).props.geo : (el.type === 'geo' ? 'rectangle' : el.type);
            tlShape = {
              ...base,
              type: 'geo',
              props: { geo: geoType, w: el.width, h: el.height, color: getValidColor(el.style?.stroke || el.style?.fill), richText: toRichText(el.label || '') }
            };
          } else if (el.type === 'text') {
            tlShape = {
              ...base,
              type: 'text',
              props: { richText: toRichText(el.label || ''), color: getValidColor(el.style?.fill || el.style?.stroke) }
            };
          } else if (el.type === 'sticky' || el.type === 'note') {
            tlShape = {
              ...base,
              type: 'note',
              props: { richText: toRichText(el.label || ''), color: getValidColor(el.style?.fill || 'yellow') }
            };
          } else if (el.type === 'frame') {
            tlShape = {
              ...base,
              type: 'frame',
              props: { w: el.width, h: el.height, name: el.label || '' }
            };
          } else if (el.type === 'arrow') {
            tlShape = {
              ...base,
              type: 'arrow',
              props: { start: { x: 0, y: 0 }, end: { x: el.width, y: el.height }, richText: toRichText(el.label || ''), color: getValidColor(el.style?.stroke || el.style?.fill) }
            };
          }

          if (tlShape) {
            if (existingShape) {
              shapesToUpdate.push(tlShape);
            } else {
              shapesToCreate.push(tlShape);
            }
          }
        });

        if (editor) {
          editor.markHistoryStoppingPoint('ai-generation');
          if (shapesToCreate.length > 0) editor.createShapes(shapesToCreate as any);
          if (shapesToUpdate.length > 0) editor.updateShapes(shapesToUpdate as any);

          // Create explicit bindings for arrows
          const bindings: any[] = [];
          payload.elements.forEach((el) => {
            if (el.type === 'arrow' && (el.startShapeId || el.endShapeId)) {
              const arrowId = el.id.startsWith('shape:') ? el.id : `shape:${el.id}`;

              if (el.startShapeId) {
                const targetId = el.startShapeId.startsWith('shape:') ? el.startShapeId : `shape:${el.startShapeId}`;
                bindings.push({
                  type: 'arrow',
                  fromId: arrowId,
                  toId: targetId,
                  props: { terminal: 'start', isExact: false, isPrecise: false }
                });
              }
              if (el.endShapeId) {
                const targetId = el.endShapeId.startsWith('shape:') ? el.endShapeId : `shape:${el.endShapeId}`;
                bindings.push({
                  type: 'arrow',
                  fromId: arrowId,
                  toId: targetId,
                  props: { terminal: 'end', isExact: false, isPrecise: false }
                });
              }
            }
          });

          if (bindings.length > 0) {
            editor.createBindings(bindings);
          }
        }
      }
    };

    const handleError = (payload: { boardId: string; requestId: string; message: string }) => {
      if (payload.boardId === boardId) {
        setRequests((prev) => prev.map(r => r.id === payload.requestId ? { ...r, status: 'error', error: payload.message } : r));
      }
    };

    const handleStream = (payload: { boardId: string; requestId: string; chunk: string }) => {
      if (payload.boardId === boardId) {
        setRequests((prev) => prev.map(r => r.id === payload.requestId ? {
          ...r,
          streamText: (r.streamText || '') + payload.chunk,
          type: 'text'
        } : r));
      }
    };

    const handleStreamDone = (payload: { boardId: string; requestId: string }) => {
      if (payload.boardId === boardId) {
        setRequests((prev) => prev.map(r => r.id === payload.requestId && r.type === 'text' ? { ...r, status: 'success' } : r));
      }
    };

    socket.on('ai:generating', handleGenerating);
    socket.on('ai:result', handleResult);
    socket.on('ai:error', handleError);
    socket.on('ai:stream', handleStream);
    socket.on('ai:stream:done', handleStreamDone);

    return () => {
      socket.off('ai:generating', handleGenerating);
      socket.off('ai:result', handleResult);
      socket.off('ai:error', handleError);
      socket.off('ai:stream', handleStream);
      socket.off('ai:stream:done', handleStreamDone);
    };
  }, [boardId, store]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [requests]);

  const sendCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const prompt = input.trim();

    const camera = store.get('camera:page:page' as any) as any;
    let targetY = camera ? camera.y : 0;
    const targetX = camera ? camera.x : 0;

    if (editor && camera) {
      const v = editor.getViewportPageBounds();
      const shapesInView = editor.getCurrentPageShapes().filter(s => {
        const b = editor.getShapePageBounds(s);
        if (!b) return false;
        // Simple AABB intersection
        return !(b.maxX < v.minX || b.minX > v.maxX || b.maxY < v.minY || b.minY > v.maxY);
      });

      if (shapesInView.length > 0) {
        let maxY = -Infinity;
        shapesInView.forEach(s => {
          const b = editor.getShapePageBounds(s);
          if (b) maxY = Math.max(maxY, b.maxY);
        });

        if (maxY !== -Infinity) {
          targetY = maxY + 100;

          // Pan the camera smoothly to the new generation zone
          editor.setCamera({
            x: camera.x,
            y: targetY - (v.h / 4), // Center slightly above so it draws in the middle
            z: camera.z
          }, { animation: { duration: 500 } });
        }
      }
    }

    const viewport = { x: targetX, y: targetY, w: 1000, h: 800 };

    let contextShapes: any[] = [];

    if (editor) {
      const selectedShapes = editor.getSelectedShapes();
      if (selectedShapes.length > 0) {
        // Selection Priority
        contextShapes = selectedShapes;
      } else {
        // Viewport Fallback
        const v = editor.getViewportPageBounds();
        contextShapes = editor.getCurrentPageShapes().filter(s => {
          const b = editor.getShapePageBounds(s);
          if (!b) return false;
          return !(b.maxX < v.minX || b.minX > v.maxX || b.maxY < v.minY || b.minY > v.maxY);
        });
      }
    }

    // Sanitize the shapes deterministically to remove heavy/useless data and save tokens
    const existingElements = contextShapes.map((s: any) => {
      const { id, type, x, y, rotation, props } = s;
      const sanitized: any = { id, type, x: Math.round(x), y: Math.round(y), rotation: Math.round(rotation || 0), ...props };

      // Strip out raw SVG paths and massive point arrays to keep the LLM focused and cheap
      delete sanitized.segments;
      // We keep 'text' and basic geometry fields.

      return sanitized;
    });

    const requestId = crypto.randomUUID();

    socket.emit('ai:generate', {
      boardId,
      requestId,
      prompt,
      viewport,
      existingElements
    });

    setRequests((prev) => [...prev, { id: requestId, prompt, status: 'generating' }]);
    setInput('');
    setShowGuidebook(false);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) { }
  };

  const generateStickyNotes = (text: string) => {
    if (!editor) return;

    // Clean up markdown and LaTeX
    const cleanText = text
      .replace(/\$\\(rightarrow|to)\$/g, '→')
      .replace(/\$\\(leftarrow|gets)\$/g, '←')
      .replace(/\*\*(.*?)\*\*/g, '$1') // Bold
      .replace(/\*(.*?)\*/g, '$1') // Italic
      .replace(/_{1,2}(.*?)_{1,2}/g, '$1') // Italic/Bold with underscores
      .replace(/###?\s+/g, '') // Headers
      .replace(/`(.*?)`/g, '$1'); // Inline code

    const points = cleanText.split('\n').filter(p => p.trim());

    const camera = store.get('camera:page:page' as any) as any;
    const vX = camera ? camera.x : 0;
    const vY = camera ? camera.y : 0;

    const tlShapes = points.map((p, i) => {
      const shapeId = `shape:${crypto.randomUUID()}`;
      return {
        id: shapeId,
        typeName: 'shape',
        x: vX + (i % 3) * 220 + 100,
        y: vY + Math.floor(i / 3) * 220 + 200,
        rotation: 0,
        isLocked: false,
        opacity: 1,
        meta: {},
        parentId: 'page:page',
        type: 'note',
        props: { richText: toRichText(p.replace(/^[-*•]\s*/, '').trim()), color: 'yellow' }
      };
    });

    editor.markHistoryStoppingPoint('ai-text-to-sticky');
    editor.createShapes(tlShapes as any);
  };

  return (
    <div className="flex flex-col h-full bg-card">
      <div className="p-4 border-b bg-primary/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-primary" />
          <div>
            <h4 className="font-semibold text-sm text-foreground">AI Copilot</h4>
            <p className="text-xs text-muted-foreground">Describe what you want to draw</p>
          </div>
        </div>
        {requests.length > 0 && (
          <button
            onClick={() => setShowGuidebook(!showGuidebook)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-full text-xs font-medium transition-colors"
          >
            {showGuidebook ? (
              <>
                <X className="h-3.5 w-3.5" />
                <span>Close</span>
              </>
            ) : (
              <>
                <BookOpen className="h-3.5 w-3.5" />
                <span>Guidebook</span>
              </>
            )}
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {(requests.length === 0 || showGuidebook) ? (
          <div className="flex flex-col gap-4 mt-6">
            <div className="text-center space-y-1 mb-2">
              <h3 className="font-semibold text-foreground">Welcome to Copilot</h3>
              <p className="text-xs text-muted-foreground">Here is how to get the most out of your AI assistant.</p>
            </div>

            <div className="space-y-3">
              <div className="bg-muted/30 border rounded-xl p-3 flex gap-3 items-start">
                <div className="mt-0.5 p-1.5 bg-primary/10 rounded-lg text-primary">
                  <PenTool className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-medium">Generate Diagrams</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Ask the AI to draw flowcharts, wireframes, or clusters.</p>
                  <p className="text-[10px] font-mono text-muted-foreground bg-muted p-1 rounded mt-1.5">"draw a user login flowchart"</p>
                </div>
              </div>

              <div className="bg-muted/30 border rounded-xl p-3 flex gap-3 items-start">
                <div className="mt-0.5 p-1.5 bg-blue-500/10 rounded-lg text-blue-500">
                  <MousePointer2 className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-medium">Context-Aware Updates</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Select any existing shape on the board and ask the AI to modify it.</p>
                  <p className="text-[10px] font-mono text-muted-foreground bg-muted p-1 rounded mt-1.5">"change this to say authentication"</p>
                </div>
              </div>

              <div className="bg-muted/30 border rounded-xl p-3 flex gap-3 items-start">
                <div className="mt-0.5 p-1.5 bg-amber-500/10 rounded-lg text-amber-500">
                  <Lightbulb className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-medium">Summarize & Synthesize</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Select a bunch of messy sticky notes and have the AI organize them.</p>
                  <p className="text-[10px] font-mono text-muted-foreground bg-muted p-1 rounded mt-1.5">"summarize these into 3 key points"</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          requests.map((req) => (
            <div key={req.id} className="flex flex-col gap-2 p-3 bg-muted/50 rounded-xl border">
              <p className="text-sm font-medium">"{req.prompt}"</p>

              {req.status === 'generating' && !req.streamText && (
                <div className="flex items-center gap-2 text-xs text-primary">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Generating shapes...
                </div>
              )}

              {req.type === 'text' && req.streamText && (
                <div className="flex flex-col gap-2 mt-1">
                  <div className="text-sm text-foreground prose prose-sm dark:prose-invert max-w-none leading-relaxed prose-p:leading-relaxed prose-pre:bg-muted prose-pre:text-foreground">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm, remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                    >
                      {req.streamText}
                    </ReactMarkdown>
                  </div>
                  {req.status === 'success' && (
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t">
                      <button
                        onClick={() => copyToClipboard(req.streamText!)}
                        className="flex items-center gap-1.5 px-2 py-1 hover:bg-black/5 dark:hover:bg-white/5 rounded text-xs text-muted-foreground transition-colors"
                      >
                        <Copy className="h-3 w-3" />
                        Copy
                      </button>
                      <button
                        onClick={() => generateStickyNotes(req.streamText!)}
                        className="flex items-center gap-1.5 px-2 py-1 hover:bg-black/5 dark:hover:bg-white/5 rounded text-xs text-muted-foreground transition-colors ml-auto"
                      >
                        <Layout className="h-3 w-3" />
                        Generate in Canvas
                      </button>
                    </div>
                  )}
                </div>
              )}

              {req.status === 'success' && req.type === 'elements' && (
                <div className="flex items-center gap-2 text-xs text-green-500">
                  <Sparkles className="h-3 w-3" />
                  Added to canvas
                </div>
              )}

              {req.status === 'error' && (
                req.error === 'limit_reached' ? (
                  <div className="flex flex-col gap-2 p-3 bg-primary/10 rounded-lg border border-primary/20 text-sm">
                    <p className="font-semibold text-primary">Free Limit Reached 🚀</p>
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      You've reached your free AI limit! To see advanced features, complex layouts, and more in action, please sign in or check out the demo.
                    </p>
                    <a href="#" className="text-primary hover:underline font-medium text-xs">
                      Watch Demo Video →
                    </a>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-destructive">
                    <AlertCircle className="h-3 w-3" />
                    {req.error || 'Failed to generate'}
                  </div>
                )
              )}
            </div>
          ))
        )}
      </div>

      <form onSubmit={sendCommand} className="p-3 border-t bg-background flex gap-2">
        <Input
          placeholder="What should I draw?"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" size="icon" disabled={!input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
