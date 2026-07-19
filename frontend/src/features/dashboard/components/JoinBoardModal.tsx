import * as Dialog from "@radix-ui/react-dialog";
import { X, LogIn, Loader2 } from "lucide-react";
import { useState } from "react";
import { useAcceptInvite } from "@/features/board/hooks/useInvites";
import { useNavigate } from "react-router";

interface JoinBoardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JoinBoardModal({ open, onOpenChange }: JoinBoardModalProps) {
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const acceptInvite = useAcceptInvite();
  const navigate = useNavigate();

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;

    setError(null);
    try {
      // The backend accepts the token, we don't need to know the board ID in advance.
      // We will parse the URL if they pasted a full link, otherwise we just use the raw token/code.
      let finalToken = token.trim();
      
      // If they pasted a full URL, extract the token
      if (finalToken.includes('/invite/')) {
        const parts = finalToken.split('/invite/');
        if (parts.length > 1) {
          finalToken = parts[1].split(/[/?#]/)[0];
        }
      }

      const result = await acceptInvite.mutateAsync(finalToken);
      
      onOpenChange(false);
      navigate(`/board/${result.board.id}`);
      
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to join workspace. Invalid or expired code.");
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-in fade-in" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] bg-white dark:bg-[#1A1A1A] rounded-[2rem] border-[3px] border-black/10 dark:border-white/10 shadow-2xl p-6 outline-none">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-2xl font-extrabold text-black dark:text-white flex items-center">
              Join Workspace
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-colors">
                <X className="h-6 w-6 text-black dark:text-white" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleJoin} className="space-y-6">
            <div>
              <label htmlFor="token" className="block text-sm font-bold text-black/70 dark:text-white/70 mb-2">
                Join Code or Link
              </label>
              <input
                id="token"
                type="text"
                autoComplete="off"
                placeholder="Paste code or link here..."
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full h-12 px-4 border-[3px] border-black/10 dark:border-white/10 rounded-xl leading-5 bg-transparent text-black dark:text-white placeholder:text-black/30 dark:placeholder:text-white/30 focus:outline-none focus:border-[#00D1FF] transition-colors font-bold"
                required
              />
              {error && (
                <p className="mt-2 text-sm font-bold text-[#FF5F56]">{error}</p>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={acceptInvite.isPending || !token.trim()}
                className="w-full h-12 bg-[#00D1FF] hover:bg-[#00B8E6] text-black font-extrabold rounded-xl shadow-[0_4px_0_0_#00A3CC] active:shadow-[0_0px_0_0_#00A3CC] active:translate-y-1 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-y-0 disabled:shadow-[0_4px_0_0_#00A3CC]"
              >
                {acceptInvite.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <LogIn className="h-5 w-5 mr-2" />
                    Join
                  </>
                )}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
