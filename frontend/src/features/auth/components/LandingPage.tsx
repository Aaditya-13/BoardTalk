import { Button } from "@/components/ui/button";
import { useGuestLogin, useCurrentUser } from "../hooks/useAuth";
import { useNavigate, Navigate } from "react-router";
import { Loader2, ArrowRight } from "lucide-react";

export function LandingPage() {
  const { data: user, isLoading } = useCurrentUser();
  const guestLogin = useGuestLogin();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If already logged in, redirect to dashboard
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

  const handleGithubLogin = () => {
    window.location.href = '/api/v1/auth/github';
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 text-center">
      <div className="max-w-2xl space-y-8">
        <div className="space-y-4">
          <h1 className="text-5xl md:text-7xl font-bold font-heading text-primary tracking-tight">
            BoardTalk
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground font-medium">
            AI-powered collaborative whiteboards for teams that move fast.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
          <Button 
            size="lg" 
            className="w-full sm:w-auto text-base" 
            onClick={handleGithubLogin}
          >
            Continue with GitHub
          </Button>
          
          <Button 
            variant="outline" 
            size="lg" 
            className="w-full sm:w-auto text-base group"
            onClick={handleGuestLogin}
            disabled={guestLogin.isPending}
          >
            {guestLogin.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Try as Guest
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
