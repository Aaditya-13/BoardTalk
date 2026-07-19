import { useBoards, useCreateBoard } from "@/features/board/hooks/useBoards";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import { useNavigate } from "react-router";

export function DashboardPage() {
  const { data: boards, isLoading } = useBoards();
  const createBoard = useCreateBoard();
  const navigate = useNavigate();

  const handleCreateBoard = () => {
    createBoard.mutate(
      { title: "Untitled Board" },
      {
        onSuccess: (newBoard) => {
          navigate(`/board/${newBoard.id}`);
        },
      }
    );
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold font-heading tracking-tight">Your Boards</h2>
        <Button onClick={handleCreateBoard} disabled={createBoard.isPending}>
          {createBoard.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          New Board
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : boards?.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-xl border-border bg-muted/10">
          <h3 className="text-xl font-medium text-foreground mb-2">No boards yet</h3>
          <p className="text-muted-foreground mb-6">Create your first board to start collaborating.</p>
          <Button onClick={handleCreateBoard} variant="outline">
            Create a Board
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {boards?.map((board) => (
            <div 
              key={board.id} 
              className="group border rounded-xl overflow-hidden bg-card text-card-foreground shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col"
              onClick={() => navigate(`/board/${board.id}`)}
            >
              <div className="h-32 bg-muted/50 border-b relative">
                {/* Thumbnail placeholder */}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                  {board.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Updated {new Date(board.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
