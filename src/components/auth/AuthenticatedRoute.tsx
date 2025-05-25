import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";
import { getHomeRouteForRole } from "@/utils/roleRedirects";

interface AuthenticatedRouteProps {
  children: ReactNode;
}

/**
 * Componente que protege rutas para usuarios con cualquier rol válido.
 * Todos los usuarios autenticados (admin, agent, user) pueden acceder.
 */
export function AuthenticatedRoute({ children }: AuthenticatedRouteProps) {
  const { role, loading } = useUserRole();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Evaluamos directamente si el usuario tiene un rol válido
  const hasValidRole = role === 'user' || role === 'admin' || role === 'agent';

  if (!hasValidRole) {
    toast.error("No tienes permisos para acceder a esta página");
    return <Navigate to={getHomeRouteForRole(role)} replace />;
  }

  return <>{children}</>;
}

export default AuthenticatedRoute;
