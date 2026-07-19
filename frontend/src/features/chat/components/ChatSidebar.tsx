import { useEffect, useState, useRef } from 'react';
import { socket } from '@/lib/socket';
import { useCurrentUser } from '@/features/auth/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, User } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ChatMessage {
  id: string;
  boardId: string;
  userId: string;
  content: string;
  createdAt: string;
  user: {
    name: string;
    avatarUrl: string | null;
  };
}

export function ChatSidebar({ boardId }: { boardId: string }) {
  const { data: currentUser } = useCurrentUser();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleHistory = (payload: { boardId: string; messages: ChatMessage[] }) => {
      if (payload.boardId === boardId) {
        setMessages(payload.messages.reverse()); // Assume backend sends recent first, we want chronological
      }
    };

    const handleNewMessage = (payload: { boardId: string; message: ChatMessage }) => {
      if (payload.boardId === boardId) {
        setMessages((prev) => [...prev, payload.message]);
      }
    };

    socket.on('chat:history', handleHistory);
    socket.on('chat:message', handleNewMessage);

    return () => {
      socket.off('chat:history', handleHistory);
      socket.off('chat:message', handleNewMessage);
    };
  }, [boardId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    socket.emit('chat:message', { boardId, content: input.trim() });
    setInput('');
  };

  return (
    <div className="flex flex-col h-full bg-card">
      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground mt-10">No messages yet. Say hello!</div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.userId === currentUser?.id;
            return (
              <div key={msg.id} className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
                <div className="flex items-center gap-2 mb-1">
                  {!isMe && (
                    <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold overflow-hidden">
                      {msg.user?.avatarUrl ? (
                        <img src={msg.user.avatarUrl} alt="avatar" />
                      ) : (
                        <User className="h-4 w-4" />
                      )}
                    </div>
                  )}
                  <span className="text-xs text-muted-foreground">{msg.user?.name || 'Unknown'}</span>
                </div>
                <div
                  className={cn(
                    "px-3 py-2 rounded-xl max-w-[90%] text-sm",
                    isMe ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-muted rounded-tl-none"
                  )}
                >
                  {msg.content}
                </div>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={sendMessage} className="p-3 border-t bg-background flex gap-2">
        <Input
          placeholder="Type a message..."
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
