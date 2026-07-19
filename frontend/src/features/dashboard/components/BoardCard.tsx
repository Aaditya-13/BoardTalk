import type { Board } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { Star, MoreVertical, Pencil, Trash2, Link, Copy, Share2 } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useDeleteBoard, useToggleStarBoard, useDuplicateBoard } from "@/features/board/hooks/useBoards";
import { useNavigate } from "react-router";
import { useCurrentUser } from "@/features/auth/hooks/useAuth";
import { ShareBoardModal } from "@/features/board/components/ShareBoardModal";
import { useState } from "react";

interface BoardCardProps {
  board: Board;
}

// Generate a consistent pseudo-random bright color gradient based on the board ID
const generateGradient = (id: string) => {
  const colors = [
    ["#FFC700", "#FF8A00"], // Yellow-Orange
    ["#00D1FF", "#0055FF"], // Cyan-Blue
    ["#FF00E5", "#8A00FF"], // Pink-Purple
    ["#00E599", "#00A36C"], // Green
    ["#FF4500", "#D00000"], // Orange-Red
  ];
  
  // Simple hash
  const hash = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colorPair = colors[hash % colors.length];
  
  return `linear-gradient(135deg, ${colorPair[0]} 0%, ${colorPair[1]} 100%)`;
};

export function BoardCard({ board }: BoardCardProps) {
  const navigate = useNavigate();
  const deleteBoard = useDeleteBoard();
  const toggleStar = useToggleStarBoard();
  const duplicateBoard = useDuplicateBoard();
  const { data: user } = useCurrentUser();
  
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const isStarred = board.isStarred ?? false;
  const isShared = user && board.ownerId !== user.id;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this board?")) {
      deleteBoard.mutate(board.id);
    }
  };

  const handleToggleStar = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleStar.mutate(board.id);
  };

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`${window.location.origin}/board/${board.id}`);
    alert("Link copied to clipboard!");
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    duplicateBoard.mutate(board.id);
  };

  return (
    <div 
      className="group relative flex flex-col h-[280px] bg-white dark:bg-[#1A1A1A] rounded-[2rem] border-[3px] border-black/10 dark:border-white/10 hover:border-black/30 dark:hover:border-white/30 transition-all cursor-pointer overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1"
      onClick={() => navigate(`/board/${board.id}`)}
    >
      {/* Thumbnail Area */}
      <div 
        className="h-[160px] w-full shrink-0 relative overflow-hidden"
        style={{ background: generateGradient(board.id) }}
      >
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
        
        {/* Shared Badge */}
        {isShared && board.owner && (
          <div className="absolute top-4 left-4 flex items-center bg-white/40 dark:bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm">
            {board.owner.avatarUrl ? (
              <img src={board.owner.avatarUrl} alt={board.owner.name} className="h-5 w-5 rounded-full mr-2 border border-white/50" />
            ) : (
              <div className="h-5 w-5 rounded-full mr-2 bg-gradient-to-br from-[#00D1FF] to-[#0055FF] border border-white/50 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                {board.owner.name.charAt(0)}
              </div>
            )}
            <span className="text-xs font-bold text-black dark:text-white">Shared by {board.owner.name.split(' ')[0]}</span>
          </div>
        )}

        {/* Star Button */}
        <button 
          onClick={handleToggleStar}
          className="absolute top-4 right-4 p-2 rounded-xl bg-white/20 hover:bg-white/40 backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
        >
          <Star className={`h-5 w-5 ${isStarred ? "fill-yellow-400 text-yellow-400" : "text-white"}`} />
        </button>
      </div>

      {/* Content Area */}
      <div className="p-5 flex flex-col justify-between flex-1">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="font-extrabold text-lg text-black dark:text-white truncate">
              {board.title}
            </h3>
            <p className="text-sm font-semibold text-black/50 dark:text-white/50 truncate mt-1">
              Updated {formatDistanceToNow(new Date(board.updatedAt), { addSuffix: true })}
            </p>
          </div>

          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button 
                onClick={(e) => e.stopPropagation()}
                className="shrink-0 p-2 -mr-2 -mt-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors outline-none"
              >
                <MoreVertical className="h-5 w-5 text-black/40 dark:text-white/40" />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content 
                onClick={(e) => e.stopPropagation()}
                className="z-50 min-w-[180px] rounded-2xl border-[3px] border-black/10 dark:border-white/10 bg-white dark:bg-[#1E1E1E] p-2 shadow-xl"
                sideOffset={4}
                align="end"
              >
                <DropdownMenu.Item onClick={handleCopyLink} className="group flex cursor-pointer items-center rounded-xl px-3 py-2 text-sm font-bold text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5 outline-none transition-colors">
                  <Link className="mr-2 h-4 w-4" />
                  Copy Link
                </DropdownMenu.Item>
                <DropdownMenu.Item className="group flex cursor-pointer items-center rounded-xl px-3 py-2 text-sm font-bold text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5 outline-none transition-colors">
                  <Pencil className="mr-2 h-4 w-4" />
                  Rename
                </DropdownMenu.Item>
                <DropdownMenu.Item onClick={(e) => { e.stopPropagation(); setIsShareModalOpen(true); }} className="group flex cursor-pointer items-center rounded-xl px-3 py-2 text-sm font-bold text-[#00D1FF] hover:bg-[#00D1FF]/10 outline-none transition-colors">
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </DropdownMenu.Item>
                <div className="h-[3px] w-full bg-black/5 dark:bg-white/5 my-1 rounded-full" />
                <DropdownMenu.Item onClick={handleDuplicate} className="group flex cursor-pointer items-center rounded-xl px-3 py-2 text-sm font-bold text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5 outline-none transition-colors">
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate
                </DropdownMenu.Item>
                <DropdownMenu.Item onClick={handleDelete} className="group flex cursor-pointer items-center rounded-xl px-3 py-2 text-sm font-bold text-[#FF5F56] hover:bg-[#FF5F56]/10 outline-none transition-colors">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Board
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </div>

      <ShareBoardModal 
        boardId={board.id}
        open={isShareModalOpen}
        onOpenChange={setIsShareModalOpen}
      />
    </div>
  );
}
