import { Button } from "@/components/ui/button";
import { useGuestLogin, useCurrentUser } from "../hooks/useAuth";
import { useNavigate, Navigate } from "react-router";
import { Loader2, ArrowRight, Sparkles, Wand2 } from "lucide-react";

export function LandingPage() {
  const { data: user, isLoading } = useCurrentUser();
  const guestLogin = useGuestLogin();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#030014]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleGuestLogin = () => {
    guestLogin.mutate(undefined, {
      onSuccess: () => {
        navigate("/dashboard");
      }
    });
  };

  const handleGoogleLogin = () => {
    window.location.href = '/api/v1/auth/google';
  };
  
  const handleGithubLogin = () => {
    window.location.href = '/api/v1/auth/github';
  };

  return (
    <div className="relative min-h-screen bg-[#030014] flex flex-col overflow-hidden text-white">
      {/* Background Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[40%] -left-[10%] w-[70%] h-[70%] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute top-[20%] -right-[20%] w-[60%] h-[60%] rounded-full bg-accent/20 blur-[120px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 container mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="text-primary h-6 w-6" />
          <span className="font-heading font-bold text-xl tracking-tight text-white">BoardTalk</span>
        </div>
        <nav className="flex items-center gap-4">
          <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/10 border-transparent" onClick={handleGithubLogin}>
            GitHub
          </Button>
          <Button onClick={handleGoogleLogin} className="bg-white text-black hover:bg-gray-200">
            Sign In
          </Button>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex items-center justify-center container mx-auto px-6 pb-20">
        <div className="max-w-4xl text-center space-y-8 animate-fade-in-up">
          <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-4 backdrop-blur-md">
            <Wand2 className="mr-2 h-4 w-4" />
            Introducing AI-Powered Canvases
          </div>
          
          <h1 className="text-6xl md:text-8xl font-bold font-heading tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-gray-500">
            Think, draw, and <br /> create together.
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-400 font-medium max-w-2xl mx-auto">
            BoardTalk is the modern whiteboard for engineering teams. Bring your ideas to life with real-time collaboration, instant AI wireframing, and voice chats.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Button 
              size="lg" 
              className="w-full sm:w-auto h-14 px-8 text-lg font-medium bg-primary hover:bg-primary/90 text-white shadow-[0_0_40px_rgba(170,59,255,0.4)] transition-all hover:shadow-[0_0_60px_rgba(170,59,255,0.6)]" 
              onClick={handleGoogleLogin}
            >
              Start for free with Google
            </Button>
            
            <Button 
              variant="outline" 
              size="lg" 
              className="w-full sm:w-auto h-14 px-8 text-lg font-medium border-gray-700 bg-gray-900/50 hover:bg-gray-800 text-white backdrop-blur-md group"
              onClick={handleGuestLogin}
              disabled={guestLogin.isPending}
            >
              {guestLogin.isPending ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : null}
              Try as Guest
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1 text-gray-400" />
            </Button>
          </div>
        </div>
      </main>
      
      {/* Decorative bottom fade */}
      <div className="h-32 w-full bg-gradient-to-t from-[#030014] to-transparent absolute bottom-0 z-20 pointer-events-none" />
    </div>
  );
}
