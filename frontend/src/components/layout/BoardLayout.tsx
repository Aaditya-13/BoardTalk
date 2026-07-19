import { Outlet } from "react-router"

export function BoardLayout() {
  return (
    <div className="h-screen w-screen bg-background overflow-hidden flex flex-col relative">
      <main className="flex-1 w-full h-full relative z-0">
        <Outlet />
      </main>
    </div>
  )
}
