import { useEffect, useState, useRef } from 'react';
import { socket } from '@/lib/socket';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { useBoardSync } from '@/features/board/hooks/useBoardSync';

interface AIRequest {
  id: string;
  prompt: string;
  status: 'generating' | 'success' | 'error';
  error?: string;
}

export function AISidebar({ boardId }: { boardId: string }) {
  const [requests, setRequests] = useState<AIRequest[]>([]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Need to get the store to apply generated elements, but actually the AI service in backend
  // modifies the board itself or sends the elements back in ai:result.
  // Wait, backend `ai:result` sends `elements`. We should insert them.
  const storeWithStatus = useBoardSync(boardId);

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
        if (storeWithStatus.status === 'synced-remote') {
          storeWithStatus.store.put(payload.elements);
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
  }, [boardId, storeWithStatus]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [requests]);

  const sendCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    const prompt = input.trim();
    // Assuming backend uses a pseudo-requestId derived from chat or we can just track the prompt optimistically
    // We'll create an optimistic request. When ai:generating arrives, it has the real requestId.
    // For simplicity, we just send it via chat:message with /ai prefix.
    socket.emit('chat:message', { boardId, content: `/ai ${prompt}` });
    
    setRequests((prev) => [...prev, { id: Date.now().toString(), prompt, status: 'generating' }]);
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
                <div className="flex items-center gap-2 text-xs text-destructive">
                  <AlertCircle className="h-3 w-3" />
                  {req.error || 'Failed to generate'}
                </div>
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
