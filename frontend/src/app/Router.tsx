import { BrowserRouter, Routes, Route } from "react-router";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { BoardLayout } from "@/components/layout/BoardLayout";
import { ProtectedRoute } from "@/features/auth/components/ProtectedRoute";

// Placeholder Pages
const LandingPage = () => (
  <div className="flex flex-col items-center justify-center h-screen space-y-4">
    <h1 className="text-4xl font-bold font-heading text-primary">BoardTalk</h1>
    <p className="text-muted-foreground">Collaboration simplified.</p>
  </div>
);
const DashboardPage = () => <div className="p-8">Dashboard Content</div>;
const BoardPage = () => <div className="flex-1 w-full h-full bg-muted/20 flex items-center justify-center text-muted-foreground">Canvas Area</div>;

export function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        
        {/* Protected Dashboard Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
          </Route>
          
          {/* Protected Board Routes */}
          <Route element={<BoardLayout />}>
            <Route path="/board/:boardId" element={<BoardPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
