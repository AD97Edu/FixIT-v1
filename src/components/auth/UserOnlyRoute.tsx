import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";
import { getHomeRouteForRole } from "@/utils/roleRedirects";

interface UserOnlyRouteProps {
  children: ReactNode;
}

/**
 * Componente que protege rutas para que solo accedan usuarios con rol 'user'
 * Los administradores y agentes serán redirigidos a sus respectivas vistas principales
 */
export function UserOnlyRoute({ children }: UserOnlyRouteProps) {
  const { role, loading } = useUserRole();
  
  // Eliminamos el estado local para evitar problemas de sincronización
  // y evaluamos directamente si el usuario tiene acceso basado en su rol
  
  if (loading) {
    console.log('UserOnlyRoute - Cargando...');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const hasAccess = role === 'user';
  console.log('UserOnlyRoute - Rol actual:', role);
  console.log('UserOnlyRoute - ¿Tiene acceso?:', hasAccess);

  if (!hasAccess) {
    console.log('UserOnlyRoute - Acceso denegado. Rol:', role);
    toast.error("Esta sección es exclusiva para usuarios");
    // Redirigir al admin o agent a su página principal
    return <Navigate to={getHomeRouteForRole(role)} replace />;
  }

  return <>{children}</>;
}

export default UserOnlyRoute;
