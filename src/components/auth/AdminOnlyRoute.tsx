import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";
import { getHomeRouteForRole } from "@/utils/roleRedirects";

interface AdminOnlyRouteProps {
  children: ReactNode;
}

/**
 * Componente que protege rutas para que solo accedan usuarios con rol 'admin'
 */
export function AdminOnlyRoute({ children }: AdminOnlyRouteProps) {
  const { role, loading } = useUserRole();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (role !== 'admin') {
    toast.error("Acceso denegado: Se requieren permisos de administrador");
    return <Navigate to={getHomeRouteForRole(role)} replace />;
  }

  return <>{children}</>;
}

export default AdminOnlyRoute;
