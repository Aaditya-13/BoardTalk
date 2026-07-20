import { useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { useAcceptInvite } from "../hooks/useInvites";
import { Loader2 } from "lucide-react";

export function JoinPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const acceptInvite = useAcceptInvite();

  useEffect(() => {
    if (!token) {
      navigate('/dashboard');
      return;
    }

    acceptInvite.mutateAsync(token)
      .then((result) => {
        navigate(`/board/${result.board.id}`);
      })
      .catch((_err) => {
        // Just go to dashboard, the join modal can be used if it failed, or we can show an error toast
        // In a real app we'd show a dedicated error page, but this is fine for now
        navigate('/dashboard');
        alert("Failed to join workspace. Link may be invalid or expired.");
      });
  }, [token, navigate, acceptInvite]);

  return (
    <div className="flex w-full h-screen items-center justify-center bg-white dark:bg-[#121212]">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-[#00D1FF]" />
        <h2 className="text-2xl font-extrabold text-black dark:text-white">
          Joining Workspace...
        </h2>
      </div>
    </div>
  );
}
