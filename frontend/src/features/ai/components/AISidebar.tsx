import { useEffect, useState, useRef } from 'react';
import { socket } from '@/lib/socket';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { type TLStore, type Editor, toRichText } from 'tldraw';

interface AIRequest {
  id: string;
  prompt: string;
  status: 'generating' | 'success' | 'error';
  error?: string;
}

export function AISidebar({ boardId, store, editor }: { boardId: string; store: TLStore; editor: Editor | null }) {
  const [requests, setRequests] = useState<AIRequest[]>([]);
  const [input, setInput] = useState('');
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
        setRequests((prev) => prev.map(r => r.id === payload.requestId ? { ...r, status: 'success' } : r));
        
        // Add elements to canvas
        const tlShapes = payload.elements.map((el) => {
          const shapeId = `shape:${el.id}`;
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

          if (el.type === 'rectangle' || el.type === 'ellipse' || el.type === 'diamond') {
            return {
              ...base,
              type: 'geo',
              props: { geo: el.type, w: el.width, h: el.height, color: getValidColor(el.style?.stroke || el.style?.fill), richText: toRichText(el.label || '') }
            };
          } else if (el.type === 'text') {
            return {
              ...base,
              type: 'text',
              props: { richText: toRichText(el.label || ''), color: getValidColor(el.style?.fill || el.style?.stroke) }
            };
          } else if (el.type === 'sticky') {
            return {
              ...base,
              type: 'note',
              props: { richText: toRichText(el.label || ''), color: getValidColor(el.style?.fill || 'yellow') }
            };
          } else if (el.type === 'frame') {
            return {
              ...base,
              type: 'frame',
              props: { w: el.width, h: el.height, name: el.label || '' }
            };
          } else if (el.type === 'arrow') {
            return {
              ...base,
              type: 'arrow',
              props: { start: { x: 0, y: 0 }, end: { x: el.width, y: el.height }, richText: toRichText(el.label || ''), color: getValidColor(el.style?.stroke || el.style?.fill) }
            };
          }
          return null;
        }).filter(Boolean);

        if (editor) {
          editor.markHistoryStoppingPoint('ai-generation');
          editor.createShapes(tlShapes as any);
        }
      }
    };

    const handleError = (payload: { boardId: string; requestId: string; message: string }) => {
      if (payload.boardId === boardId) {
        setRequests((prev) => prev.map(r => r.id === payload.requestId ? { ...r, status: 'error', error: payload.message } : r));
      }
    };

    socket.on('ai:generating', handleGenerating);
    socket.on('ai:result', handleResult);
    socket.on('ai:error', handleError);

    return () => {
      socket.off('ai:generating', handleGenerating);
      socket.off('ai:result', handleResult);
      socket.off('ai:error', handleError);
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
    const viewport = camera ? { x: camera.x, y: camera.y, w: 1000, h: 800 } : undefined;
    
    // Grab some context (up to 20 shapes) to send to Gemini
    const existingElements = Array.from(store.allRecords())
      .filter((r: any) => r.typeName === 'shape')
      .slice(0, 20);

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
  };

  return (
    <div className="flex flex-col h-full bg-card">
      <div className="p-4 border-b bg-primary/5 flex items-center gap-3">
        <Sparkles className="h-5 w-5 text-primary" />
        <div>
          <h4 className="font-semibold text-sm text-foreground">AI Copilot</h4>
          <p className="text-xs text-muted-foreground">Describe what you want to draw</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {requests.length === 0 ? (
          <div className="text-center text-muted-foreground mt-10 text-sm">
            Try: "Draw a simple login form with email and password fields"
          </div>
        ) : (
          requests.map((req) => (
            <div key={req.id} className="flex flex-col gap-2 p-3 bg-muted/50 rounded-xl border">
              <p className="text-sm font-medium">"{req.prompt}"</p>
              
              {req.status === 'generating' && (
                <div className="flex items-center gap-2 text-xs text-primary">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Generating shapes...
                </div>
              )}
              
              {req.status === 'success' && (
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
