import { BrowserRouter, Routes, Route } from "react-router";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { BoardLayout } from "@/components/layout/BoardLayout";
import { ProtectedRoute } from "@/features/auth/components/ProtectedRoute";
import { LandingPage } from "@/features/auth/components/LandingPage";
import { DashboardPage } from "@/features/dashboard/components/DashboardPage";
import { BoardPage } from "@/features/board/components/BoardPage";
import { JoinPage } from "@/features/board/components/JoinPage";

export function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        
        {/* Protected Dashboard Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<DashboardPage filter="all" />} />
            <Route path="/dashboard/shared" element={<DashboardPage filter="shared" />} />
            <Route path="/dashboard/starred" element={<DashboardPage filter="starred" />} />
            <Route path="/dashboard/trash" element={<DashboardPage filter="trash" />} />
          </Route>
          
          {/* Protected Board Routes */}
          <Route element={<BoardLayout />}>
            <Route path="/board/:boardId" element={<BoardPage />} />
          </Route>
          
          <Route path="/invite/:token" element={<JoinPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
