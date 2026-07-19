import { useState } from "react";
import { useBoards } from "@/features/board/hooks/useBoards";
import { BoardCard } from "./BoardCard";
import { CreateBoardModal } from "./CreateBoardModal";
import { JoinBoardModal } from "./JoinBoardModal";
import { Plus, Search, Loader2, LogIn } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCurrentUser } from "@/features/auth/hooks/useAuth";

export function DashboardPage({ filter = 'all' }: { filter?: 'all' | 'shared' | 'starred' | 'trash' }) {
  const [searchQuery, setSearchQuery] = useState("");
  // Pass 'all' to useBoards if filter is 'shared', because backend doesn't have a specific /shared route yet
  const { data: fetchedBoards, isLoading } = useBoards(searchQuery, filter === 'shared' ? 'all' : filter);
  const { data: user } = useCurrentUser();
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  
  const boards = filter === 'shared' && user
    ? fetchedBoards?.filter((b) => b.ownerId !== user.id)
    : fetchedBoards;
  
  const getTitle = () => {
    if (filter === 'shared') return 'Shared with me';
    if (filter === 'starred') return 'Starred Boards';
    if (filter === 'trash') return 'Trash';
    return 'All Boards';
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between pb-6 border-b-[3px] border-black/5 dark:border-white/5">
        <h1 className="text-3xl font-extrabold text-black dark:text-white">{getTitle()}</h1>
        
        <div className="flex w-full sm:w-auto items-center gap-4">
          <div className="relative flex-1 sm:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-black/30 dark:text-white/30" />
            </div>
            <input
              type="text"
              placeholder="Search boards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border-[3px] border-black/10 dark:border-white/10 rounded-2xl leading-5 bg-white dark:bg-[#1A1A1A] text-black dark:text-white placeholder:text-black/30 dark:placeholder:text-white/30 focus:outline-none focus:border-[#00D1FF] dark:focus:border-[#00D1FF] transition-colors font-bold"
            />
          </div>
          
          <button
            onClick={() => setIsJoinModalOpen(true)}
            className="flex-shrink-0 flex items-center justify-center bg-white dark:bg-[#1A1A1A] text-black dark:text-white border-[3px] border-black/10 dark:border-white/10 hover:border-black/30 dark:hover:border-white/30 h-12 px-6 rounded-2xl font-extrabold transition-all"
          >
            <LogIn className="mr-2 h-5 w-5" />
            Join Board
          </button>
          
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex-shrink-0 flex items-center justify-center bg-[#FF4500] hover:bg-[#E63E00] text-white h-12 px-6 rounded-2xl font-extrabold shadow-[0_4px_0_0_#CC3700] active:shadow-[0_0px_0_0_#CC3700] active:translate-y-1 transition-all"
          >
            <Plus className="mr-2 h-5 w-5" />
            New Board
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 pb-12">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-[#FF4500]" />
            <p className="font-bold text-black/50 dark:text-white/50">Loading your workspace...</p>
          </div>
        ) : boards && boards.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {boards.map((board) => (
                <motion.div
                  key={board.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <BoardCard board={board} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[50vh] max-w-md mx-auto text-center space-y-6">
            <div className="w-32 h-32 bg-[#FFC700] rounded-[3rem] rotate-12 flex items-center justify-center shadow-lg border-[3px] border-black/10">
              <Plus className="h-16 w-16 text-black -rotate-12" />
            </div>
            <div>
              <h2 className="text-3xl font-extrabold text-black dark:text-white mb-2">No boards found</h2>
              <p className="text-lg font-semibold text-black/50 dark:text-white/50 mb-8">
                {searchQuery 
                  ? "We couldn't find any boards matching your search. Try a different keyword." 
                  : "It's pretty quiet in here. Create your first board to start bringing ideas to life!"}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="inline-flex items-center justify-center bg-[#00D1FF] hover:bg-[#00B8E6] text-black h-14 px-8 rounded-2xl font-extrabold text-lg shadow-[0_4px_0_0_#00A3CC] active:shadow-[0_0px_0_0_#00A3CC] active:translate-y-1 transition-all"
                >
                  Create your first board
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <CreateBoardModal 
        open={isCreateModalOpen} 
        onOpenChange={setIsCreateModalOpen} 
      />

      <JoinBoardModal
        open={isJoinModalOpen}
        onOpenChange={setIsJoinModalOpen}
      />
    </div>
  );
}
