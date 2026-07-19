import { Outlet } from "react-router"

export function BoardLayout() {
  return (
    <div className="h-screen w-screen bg-background overflow-hidden flex flex-col relative">
      <header className="absolute top-0 left-0 right-0 z-50 h-16 pointer-events-none flex items-start justify-between p-4">
        {/* We use pointer-events-none on the header and auto on children so clicks pass through to canvas */}
        <div className="flex items-center gap-2 pointer-events-auto bg-background/80 backdrop-blur-md px-4 py-2 rounded-lg shadow-sm border border-border/50 transition-all hover:bg-background/95">
           <span className="font-heading font-bold text-primary">BoardTalk</span>
           <div className="w-px h-4 bg-border mx-2" />
           <span className="text-sm font-medium text-foreground">Untitled Board</span>
        </div>
        
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Voice controls and Participants will go here */}
        </div>
      </header>
      <main className="flex-1 w-full h-full relative z-0">
        <Outlet />
      </main>
      
      {/* Right Sidebar container will go here */}
    </div>
  )
}
