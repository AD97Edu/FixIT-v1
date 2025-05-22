import { ReactNode, useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UserTicketsRouteProps {
  children: ReactNode;
}

/**
 * Componente que verifica que los usuarios normales solo puedan acceder a sus propios tickets
 * Admin y agent pueden acceder a cualquier ticket
 */
export function UserTicketsRoute({ children }: UserTicketsRouteProps) {
  const { id } = useParams<{ id: string }>();
  const { role, loading: roleLoading } = useUserRole();
  const { user, loading: authLoading } = useAuth();
  const [canAccess, setCanAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkTicketAccess = async () => {
      if (roleLoading || authLoading || !id) {
        return;
      }

      // Admin y agent pueden acceder a cualquier ticket
      if (role === 'admin' || role === 'agent') {
        setCanAccess(true);
        setLoading(false);
        return;
      }

      // Usuario normal: verificar que el ticket le pertenezca
      if (role === 'user' && user?.id) {
        try {
          const { data, error } = await supabase
            .from('tickets')
            .select('id')
            .eq('id', id)
            .eq('submitted_by', user.id)
            .single();

          if (error) {
            setCanAccess(false);
          } else {
            setCanAccess(!!data);
          }
        } catch (error) {
          console.error('Error checking ticket access:', error);
          setCanAccess(false);
        }
      } else {
        setCanAccess(false);
      }

      setLoading(false);
    };

    checkTicketAccess();
  }, [id, role, user?.id, roleLoading, authLoading]);

  if (loading || roleLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!canAccess) {
    toast.error("No tienes permiso para ver este ticket");
    return <Navigate to="/tickets" replace />;
  }

  return <>{children}</>;
}

export default UserTicketsRoute;
