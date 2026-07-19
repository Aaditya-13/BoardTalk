import { Navigate, Outlet } from 'react-router';
import { useCurrentUser } from '../hooks/useAuth';
import { Loader2 } from 'lucide-react';

export function ProtectedRoute() {
  const { data: user, isLoading, isError } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !user) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
