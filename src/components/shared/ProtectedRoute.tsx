import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { Spinner } from "@/components/ui/Spinner";

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
  recruiterOnly?: boolean;
}

export function ProtectedRoute({ children, adminOnly, recruiterOnly }: ProtectedRouteProps) {
  const { isAuthenticated, isInitializing, user } = useAuthStore();
  const location = useLocation();

  if (isInitializing) return (
    <div className="fixed inset-0 flex items-center justify-center">
      <Spinner className="w-8 h-8 text-[var(--color-primary)]" />
    </div>
  );

  if (!isAuthenticated) {
    const loginPage = recruiterOnly ? "/auth/recruiter-login" : "/auth/login"
    return <Navigate to={loginPage} state={{ from: location }} replace />;
  }

  if (adminOnly && user?.role !== "admin") {
    return <Navigate to={user?.role === 'recruiter' ? "/recruiter/dashboard" : "/dashboard"} replace />;
  }

  if (recruiterOnly && user?.role !== "recruiter" && user?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}