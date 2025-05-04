import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AdminRouteProps {
  children: ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        // Verificar si el usuario está autenticado
        const { data: session } = await supabase.auth.getSession();
        
        if (!session.session) {
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        // Obtener metadatos del usuario para verificar el rol
        const { data: user } = await supabase.auth.getUser();
        
        if (!user || !user.user) {
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        // MODO DESARROLLO: Permitir acceso a cualquier usuario autenticado 
        // para poder probar la funcionalidad (quitar esto en producción)
        //setIsAdmin(true);
        //setLoading(false);
        
        // MODO PRODUCCIÓN: Descomentar esto en producción
        // Verificar si el usuario tiene rol de administrador
         const userRole = user.user.app_metadata?.role;
         setIsAdmin(userRole === 'admin');
         setLoading(false);
      } catch (error) {
        console.error("Error verificando rol de administrador:", error);
        toast.error("Error al verificar permisos de administrador");
        setIsAdmin(false);
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, []);

  if (loading) {
    // Puedes mostrar un spinner o mensaje de carga aquí
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    toast.error("Acceso denegado: Se requieren permisos de administrador");
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default AdminRoute; 