import { ThemeProvider } from "@/providers/ThemeProvider"
import { QueryProvider } from "@/providers/QueryProvider"
import { Router } from "@/app/Router"

function App() {
  return (
    <QueryProvider>
      <ThemeProvider defaultTheme="system" storageKey="boardtalk-theme">
        <Router />
      </ThemeProvider>
    </QueryProvider>
  )
}

export default App
