import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";
import { getHomeRouteForRole } from "@/utils/roleRedirects";

interface UserRouteProps {
  children: ReactNode;
}

/**
 * Componente que protege rutas para que solo accedan usuarios con rol 'user'
 * Los usuarios admin podrán acceder a todas las rutas
 */
export function UserRoute({ children }: UserRouteProps) {
  const { role, loading } = useUserRole();
  const [canAccess, setCanAccess] = useState<boolean | null>(null);
  useEffect(() => {
    if (!loading) {
      // Solo los usuarios comunes pueden acceder a estas rutas
      setCanAccess(role === 'user');
    }
  }, [role, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!canAccess) {
    toast.error("No tienes permisos para acceder a esta página");
    return <Navigate to={getHomeRouteForRole(role)} replace />;
  }

  return <>{children}</>;
}

export default UserRoute;
