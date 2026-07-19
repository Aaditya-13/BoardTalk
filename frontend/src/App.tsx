import { ThemeProvider } from "@/providers/ThemeProvider"

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="boardtalk-theme">
      {/* React Router will go here */}
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold font-heading text-primary">BoardTalk</h1>
          <p className="text-muted-foreground text-lg">Collaboration simplified.</p>
        </div>
      </div>
    </ThemeProvider>
  )
}

export default App
