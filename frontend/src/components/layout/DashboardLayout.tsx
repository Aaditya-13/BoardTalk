import { Outlet, useNavigate, useLocation } from "react-router"
import { useTheme } from "@/providers/ThemeProvider"
import { Button } from "@/components/ui/button"
import { Moon, Sun, Sparkles, LayoutDashboard, Star, Users, Trash2, LogOut, Settings } from "lucide-react"
import { useCurrentUser, useLogout } from "@/features/auth/hooks/useAuth"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import * as Avatar from "@radix-ui/react-avatar"
import { useState } from "react"
import { SettingsModal } from "@/features/user/components/SettingsModal"


export function DashboardLayout() {
  const { theme, setTheme } = useTheme()
  const { data: user } = useCurrentUser()
  const logout = useLogout()
  const navigate = useNavigate()
  const location = useLocation()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  const handleLogout = () => {
    logout.mutate()
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-[#121212] flex flex-col transition-colors duration-300 selection:bg-yellow-200 dark:selection:bg-yellow-500/30">
      
      {/* Playful Dotted Background */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-40 dark:opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(#D1D1D1_2px,transparent_2px)] dark:bg-[radial-gradient(#ffffff33_2px,transparent_2px)] [background-size:24px_24px]" />
      </div>

      <header className="relative z-20 w-full border-b-[3px] border-black/5 dark:border-white/5 bg-[#FDFBF7]/80 dark:bg-[#121212]/80 backdrop-blur-md">
        <div className="container mx-auto flex h-20 items-center justify-between px-6">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <div className="h-10 w-10 rounded-2xl bg-black dark:bg-white flex items-center justify-center shadow-md">
              <Sparkles className="text-white dark:text-black h-5 w-5" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-black dark:text-white">BoardTalk</span>
          </div>
          
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-full h-10 w-10"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              <span className="sr-only">Toggle theme</span>
            </Button>
            
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="outline-none focus:ring-4 ring-black/10 dark:ring-white/10 rounded-full transition-all">
                  <Avatar.Root className="inline-flex h-10 w-10 select-none items-center justify-center overflow-hidden rounded-full bg-black/10 dark:bg-white/10 border-2 border-transparent hover:border-black/20 dark:hover:border-white/20 transition-all">
                    <Avatar.Image
                      className="h-full w-full object-cover"
                      src={user?.avatarUrl || undefined}
                      alt={user?.name}
                    />
                    <Avatar.Fallback className="text-black dark:text-white font-bold text-sm">
                      {user?.name?.charAt(0) || 'U'}
                    </Avatar.Fallback>
                  </Avatar.Root>
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className="z-50 min-w-[220px] rounded-2xl border-[3px] border-black/10 dark:border-white/10 bg-white dark:bg-[#1E1E1E] p-2 shadow-xl will-change-[opacity,transform] data-[side=bottom]:animate-slideUpAndFade"
                  sideOffset={8}
                >
                  <div className="px-3 py-2 mb-2 border-b-[3px] border-black/5 dark:border-white/5">
                    <p className="font-bold text-black dark:text-white">{user?.name || 'Guest User'}</p>
                    <p className="text-sm font-semibold text-black/50 dark:text-white/50">{user?.email || 'Guest'}</p>
                  </div>
                  
                  <DropdownMenu.Item 
                    onClick={() => setIsSettingsOpen(true)}
                    className="group flex cursor-pointer select-none items-center rounded-xl px-3 py-2 text-sm font-bold text-black dark:text-white outline-none hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenu.Item>
                  <DropdownMenu.Item 
                    onClick={handleLogout}
                    className="group flex cursor-pointer select-none items-center rounded-xl px-3 py-2 text-sm font-bold text-[#FF5F56] outline-none hover:bg-[#FF5F56]/10 transition-colors mt-1"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        </div>
      </header>

      <div className="flex-1 container mx-auto px-6 py-8 flex gap-8 relative z-10">
        {/* Sidebar */}
        <aside className="hidden md:flex w-64 flex-col gap-2 shrink-0">
          <nav className="flex flex-col gap-2 sticky top-28">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/dashboard')}
              className={`justify-start px-4 h-12 rounded-xl font-bold transition-all ${location.pathname === '/dashboard' ? 'bg-black/5 dark:bg-white/10 text-black dark:text-white' : 'text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'}`}
            >
              <LayoutDashboard className="mr-3 h-5 w-5" />
              All Boards
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => navigate('/dashboard/starred')}
              className={`justify-start px-4 h-12 rounded-xl font-bold transition-all ${location.pathname === '/dashboard/starred' ? 'bg-black/5 dark:bg-white/10 text-black dark:text-white' : 'text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'}`}
            >
              <Star className="mr-3 h-5 w-5" />
              Starred
            </Button>
            <Button 
              variant="ghost" 
              className="justify-start px-4 h-12 rounded-xl font-bold text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
            >
              <Users className="mr-3 h-5 w-5" />
              Shared with me
            </Button>
            <div className="h-[3px] w-full bg-black/5 dark:bg-white/5 my-2 rounded-full" />
            <Button 
              variant="ghost" 
              onClick={() => navigate('/dashboard/trash')}
              className={`justify-start px-4 h-12 rounded-xl font-bold transition-all ${location.pathname === '/dashboard/trash' ? 'bg-black/5 dark:bg-white/10 text-black dark:text-white' : 'text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'}`}
            >
              <Trash2 className="mr-3 h-5 w-5" />
              Trash
            </Button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>

      <SettingsModal open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
    </div>
  )
}
