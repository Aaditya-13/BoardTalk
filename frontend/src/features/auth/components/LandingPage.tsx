import { Button } from "@/components/ui/button";
import { useGuestLogin, useCurrentUser, useDevLogin } from "../hooks/useAuth";
import { useNavigate, Navigate } from "react-router";
import { Loader2, ArrowRight, Sparkles, Wand2, Users, Mic, Zap, MessageSquare, Shield, Sun, Moon } from "lucide-react";
import { Tldraw } from 'tldraw';
import 'tldraw/tldraw.css';
import { motion } from 'framer-motion';
import { useTheme } from '@/providers/ThemeProvider';

const features = [
  {
    icon: Users,
    color: "bg-[#FFC700]",
    title: "Real-time Sync",
    description: "Collaborate instantly. Changes appear sub-second across all devices with our custom WebSockets engine."
  },
  {
    icon: Wand2,
    color: "bg-[#00D1FF]",
    title: "AI Copilot",
    description: "Type what you want, and let our AI generate flowcharts, UI wireframes, and diagrams directly on the canvas."
  },
  {
    icon: Mic,
    color: "bg-[#FFA8E2]",
    title: "Voice Rooms",
    description: "Built-in WebRTC voice channels. Jump into a voice call instantly without leaving your whiteboard session."
  },
  {
    icon: MessageSquare,
    color: "bg-[#00E599]",
    title: "Live Chat",
    description: "Contextual discussions and text chat synchronously alongside your visual collaboration."
  },
  {
    icon: Zap,
    color: "bg-[#FF7A00]",
    title: "Lightning Fast",
    description: "Engineered on modern tech (Vite, Socket.io, React) for a buttery smooth 60fps drawing experience."
  },
  {
    icon: Shield,
    color: "bg-[#8F00FF]",
    title: "Enterprise Security",
    description: "Your canvases are automatically synced, backed up, and protected with enterprise-grade encryption."
  }
];

const Cursor = ({ color, name, top, left, delay, rotate = 0 }: any) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.5, x: 50, y: 50 }}
    animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
    transition={{ delay, duration: 0.8, type: "spring", bounce: 0.5 }}
    className="absolute z-20 pointer-events-none hidden md:flex flex-col items-start"
    style={{ top, left, rotate }}
  >
    <svg width="24" height="36" viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-md">
      <path d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z" fill={color} stroke="white" strokeWidth="2"/>
    </svg>
    <div className="px-2 py-0.5 text-[11px] font-bold text-white rounded-full ml-3 mt-1 shadow-md" style={{ backgroundColor: color }}>
      {name}
    </div>
  </motion.div>
);

const StickyNote = ({ color, rotate, top, left, delay, children }: any) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.5, rotate: rotate - 20 }}
    animate={{ opacity: 1, scale: 1, rotate }}
    transition={{ delay, duration: 0.6, type: "spring" }}
    className="absolute hidden md:flex items-center justify-center p-4 shadow-xl z-0 rounded-sm"
    style={{ backgroundColor: color, top, left, width: 140, height: 140, rotate }}
  >
    <span className="font-sans font-bold text-lg text-black/80 text-center leading-tight">
      {children}
    </span>
  </motion.div>
);

export function LandingPage() {
  const { data: user, isLoading } = useCurrentUser();
  const guestLogin = useGuestLogin();
  const devLogin = useDevLogin();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#FDFBF7] dark:bg-[#121212]">
        <Loader2 className="h-8 w-8 animate-spin text-black dark:text-white" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleGuestLogin = () => {
    guestLogin.mutate(undefined, {
      onSuccess: () => navigate("/dashboard")
    });
  };

  const handleDevLogin = (name: string) => {
    devLogin.mutate(name, {
      onSuccess: () => navigate("/dashboard"),
    });
  };

  const handleGoogleLogin = () => {
    window.location.href = '/api/v1/auth/google';
  };
  
  const handleGithubLogin = () => {
    window.location.href = '/api/v1/auth/github';
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-[#121212] flex flex-col text-black dark:text-white selection:bg-yellow-200 dark:selection:bg-yellow-500/30 font-sans overflow-x-hidden transition-colors duration-300">
      
      {/* Playful Dotted Background */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-40 dark:opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(#D1D1D1_2px,transparent_2px)] dark:bg-[radial-gradient(#ffffff33_2px,transparent_2px)] [background-size:24px_24px]" />
      </div>

      {/* Header */}
      <header className="relative z-50 py-6">
        <div className="container mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-2xl bg-black dark:bg-white flex items-center justify-center shadow-md">
              <Sparkles className="text-white dark:text-black h-5 w-5" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-black dark:text-white">BoardTalk</span>
          </div>
          <nav className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-full">
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button variant="ghost" className="hidden sm:flex text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-full font-bold" onClick={handleGithubLogin}>
              Log in with GitHub
            </Button>
            <Button onClick={handleGoogleLogin} className="bg-black dark:bg-white text-white dark:text-black hover:bg-black/80 dark:hover:bg-white/90 rounded-full shadow-lg font-bold px-6">
              Sign In
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 pt-12 pb-16 md:pt-24 md:pb-24">
        <div className="container mx-auto px-6 relative">
          
          {/* Floating UI Elements (FigJam Vibe) */}
          <StickyNote color="#FFE8A3" rotate={-8} top="5%" left="15%" delay={0.2}>
            Draw together! ✍️
          </StickyNote>
          <StickyNote color="#FFC4E1" rotate={12} top="40%" left="80%" delay={0.4}>
            Say hi to AI 🤖
          </StickyNote>
          
          <Cursor color="#00D1FF" name="Sarah" top="20%" left="25%" delay={0.5} rotate={-15} />
          <Cursor color="#FF0000" name="Alex" top="60%" left="75%" delay={0.7} rotate={10} />
          <Cursor color="#00E599" name="AI Agent" top="30%" left="65%" delay={0.9} rotate={-5} />

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto space-y-8 relative z-10"
          >
            <div className="inline-flex items-center rounded-full border-2 border-black/10 dark:border-white/10 bg-white dark:bg-[#1E1E1E] px-5 py-2 text-sm font-extrabold shadow-sm">
              <span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#00E599] animate-pulse" />
              Multiplayer Whiteboarding for Teams
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-extrabold tracking-tight leading-[1.05] pb-2">
              Where teams <br /> think out loud.
            </h1>
            
            <p className="text-lg md:text-2xl text-black/60 dark:text-white/60 font-semibold max-w-2xl mx-auto leading-relaxed">
              BoardTalk is the playful, lightning-fast whiteboard for engineering teams. Brainstorm, wireframe, and chat in real time.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
              <Button 
                size="lg" 
                className="w-full sm:w-auto h-16 px-10 text-xl font-bold bg-[#FF4500] hover:bg-[#FF4500]/90 text-white rounded-full shadow-[0_8px_0_rgb(200,50,0)] hover:shadow-[0_4px_0_rgb(200,50,0)] hover:translate-y-1 transition-all" 
                onClick={handleGoogleLogin}
              >
                Start for free with Google
              </Button>
              
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full sm:w-auto h-16 px-10 text-xl font-bold border-2 border-black/20 dark:border-white/20 bg-white dark:bg-transparent hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-all group"
                onClick={handleGuestLogin}
                disabled={guestLogin.isPending}
              >
                {guestLogin.isPending ? (
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                ) : null}
                Go to Dashboard 🚀
                <ArrowRight className="ml-2 h-6 w-6 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Interactive Canvas Preview Mockup */}
        <motion.div 
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8, type: 'spring' }}
          className="container mx-auto px-6 pt-24 pb-16"
        >
          <div className="relative mx-auto max-w-6xl rounded-3xl border-[3px] border-black/10 dark:border-white/10 bg-white dark:bg-[#1E1E1E] shadow-2xl overflow-hidden">
            {/* Mockup Header (Browser Chrome) */}
            <div className="flex items-center justify-between px-6 py-4 border-b-[3px] border-black/5 dark:border-white/5 bg-[#FDFBF7] dark:bg-[#121212]">
              <div className="flex space-x-2">
                <div className="w-3.5 h-3.5 rounded-full bg-[#FF5F56] border border-black/10 dark:border-black/50" />
                <div className="w-3.5 h-3.5 rounded-full bg-[#FFBD2E] border border-black/10 dark:border-black/50" />
                <div className="w-3.5 h-3.5 rounded-full bg-[#27C93F] border border-black/10 dark:border-black/50" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="bg-black/5 dark:bg-white/5 rounded-full px-6 py-1.5 text-xs font-bold text-black/40 dark:text-white/40">
                  boardtalk.app/room/brainstorm
                </div>
              </div>
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-[#00D1FF] border-2 border-white flex items-center justify-center text-white text-xs font-bold z-30">S</div>
                <div className="w-8 h-8 rounded-full bg-[#FF0000] border-2 border-white flex items-center justify-center text-white text-xs font-bold z-20">A</div>
                <div className="w-8 h-8 rounded-full bg-[#FFC700] border-2 border-white flex items-center justify-center text-white text-xs font-bold z-10">+3</div>
              </div>
            </div>
            {/* Tldraw Canvas */}
            <div className="h-[500px] md:h-[700px] w-full relative bg-[#FDFBF7] dark:bg-zinc-900">
              <Tldraw autoFocus={false} />
            </div>
            
            {/* Dev Login Section */}
            <div className="pt-8 border-t-[3px] border-black/5 dark:border-white/5">
              <p className="text-sm font-bold text-black/40 dark:text-white/40 mb-4 uppercase tracking-widest">Test Accounts (Dev Mode)</p>
              <div className="flex flex-wrap justify-center gap-3">
                {['Alice', 'Bob', 'Charlie'].map((name) => (
                  <Button 
                    key={name}
                    variant="outline" 
                    className="h-12 px-6 font-bold border-2 border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 rounded-full"
                    onClick={() => handleDevLogin(name)}
                    disabled={devLogin.isPending}
                  >
                    {devLogin.isPending && devLogin.variables === name ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Users className="mr-2 h-4 w-4" />
                    )}
                    Log in as {name}
                  </Button>
                ))}
              </div>
            </div>

          </div>
        </motion.div>
      </main>

      {/* Features Bento Grid */}
      <section id="features" className="relative z-10 py-24 bg-white dark:bg-[#1E1E1E] border-t-[3px] border-black/5 dark:border-white/5">
        <div className="container mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-20 space-y-4"
          >
            <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight">Everything you need to build.</h2>
            <p className="text-xl text-black/50 dark:text-white/50 font-bold">Simple, colorful, and wildly powerful.</p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, type: "spring", bounce: 0.4 }}
                className="group p-8 rounded-[2rem] border-[3px] border-black/5 dark:border-white/10 bg-[#FDFBF7] dark:bg-[#121212] hover:border-black/20 dark:hover:border-white/20 hover:shadow-xl transition-all duration-300"
              >
                <div className={`h-16 w-16 rounded-2xl ${feature.color} flex items-center justify-center mb-6 shadow-sm group-hover:-translate-y-1 transition-transform duration-300`}>
                  <feature.icon className="h-8 w-8 text-black" />
                </div>
                <h3 className="text-2xl font-extrabold mb-3">{feature.title}</h3>
                <p className="text-black/60 dark:text-white/60 font-semibold leading-relaxed text-lg">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t-[3px] border-black/5 dark:border-white/5 bg-[#FDFBF7] dark:bg-[#121212] py-16 text-center">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="h-8 w-8 rounded-xl bg-black dark:bg-white flex items-center justify-center">
              <Sparkles className="text-white dark:text-black h-4 w-4" />
            </div>
            <span className="font-extrabold text-2xl">BoardTalk</span>
          </div>
          <p className="text-black/40 dark:text-white/40 font-bold mb-8">© {new Date().getFullYear()} BoardTalk Inc. Crafted with ❤️.</p>
          <div className="flex justify-center gap-8 text-sm font-bold text-black/50 dark:text-white/50">
            <a href="#" className="hover:text-black dark:hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-black dark:hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-black dark:hover:text-white transition-colors">Twitter</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
