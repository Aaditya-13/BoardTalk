import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCreateBoard } from "@/features/board/hooks/useBoards";
import { useNavigate } from "react-router";

interface CreateBoardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateBoardModal({ open, onOpenChange }: CreateBoardModalProps) {
  const [title, setTitle] = useState("");
  const createBoard = useCreateBoard();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    createBoard.mutate(
      { title: title.trim() },
      {
        onSuccess: (newBoard) => {
          onOpenChange(false);
          setTitle("");
          navigate(`/board/${newBoard.id}`);
        },
      }
    );
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-md translate-x-[-50%] translate-y-[-50%] gap-6 border-[3px] border-black/10 dark:border-white/10 bg-white dark:bg-[#1A1A1A] p-8 rounded-[2rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          
          <div className="flex flex-col space-y-2 text-center sm:text-left">
            <Dialog.Title className="text-2xl font-extrabold text-black dark:text-white">
              Create a new board
            </Dialog.Title>
            <Dialog.Description className="text-sm font-semibold text-black/50 dark:text-white/50">
              Give your new collaborative space a catchy name.
            </Dialog.Description>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <input
                type="text"
                placeholder="e.g. Brainstorming Q3"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
                className="flex h-14 w-full rounded-2xl border-[3px] border-black/10 dark:border-white/10 bg-transparent px-4 py-2 text-lg font-bold shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-black/30 dark:placeholder:text-white/30 focus-visible:outline-none focus-visible:border-[#FF4500] dark:focus-visible:border-[#FF4500] disabled:cursor-not-allowed disabled:opacity-50 text-black dark:text-white"
              />
            </div>
            
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-4">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => onOpenChange(false)}
                className="mt-2 sm:mt-0 h-12 rounded-xl font-bold hover:bg-black/5 dark:hover:bg-white/5"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={!title.trim() || createBoard.isPending}
                className="h-12 rounded-xl bg-[#00D1FF] hover:bg-[#00B8E6] text-black font-extrabold px-8 shadow-[0_4px_0_0_#00A3CC] active:shadow-[0_0px_0_0_#00A3CC] active:translate-y-1 transition-all"
              >
                {createBoard.isPending && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                Create Board
              </Button>
            </div>
          </form>

          <Dialog.Close asChild>
            <button
              className="absolute right-6 top-6 rounded-full opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground p-2 hover:bg-black/5 dark:hover:bg-white/10"
              aria-label="Close"
            >
              <X className="h-5 w-5 text-black dark:text-white" />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
