import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";
import { getHomeRouteForRole } from "@/utils/roleRedirects";

interface AdminOrAgentRouteProps {
  children: ReactNode;
}

/**
 * Componente que protege rutas para que solo accedan usuarios con rol 'admin'
 * Los usuarios normales ('user') serán redirigidos a su vista de tickets
 */
export function AdminOrAgentRoute({ children }: AdminOrAgentRouteProps) {
  const { role, loading } = useUserRole();
  const [canAccess, setCanAccess] = useState<boolean | null>(null);

  useEffect(() => {
    if (!loading) {
      // Sólo admin puede acceder a estas rutas
      setCanAccess(role === 'admin');
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
    // Solo mostramos el mensaje de error si el usuario tiene un rol definido
    // pero no tiene permiso (por ejemplo, si es 'user')
    if (role && role !== 'admin') {
      toast.error("No tienes permisos para acceder a esta página");
    }
    // Redirigir al usuario a su página correspondiente según su rol
    return <Navigate to={getHomeRouteForRole(role)} replace />;
  }

  return <>{children}</>;
}

export default AdminOrAgentRoute;
