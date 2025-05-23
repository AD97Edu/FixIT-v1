import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { toast } from 'sonner';

export type UserRole = 'admin' | 'agent' | 'user' | null;

/**
 * Hook para obtener el rol de un usuario desde la tabla usuario_rol
 * @returns Objeto con el rol del usuario y estado de carga
 */
export function useUserRole() {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Consultar el rol del usuario en la tabla usuario_rol
        const { data, error } = await supabase
          .from('usuario_rol')
          .select('rol')
          .eq('user_id', user.id)
          .single();
        
        if (error) {
          // Si no hay resultados, asumimos que el rol es 'user'
          if (error.code === 'PGRST116') {
            setRole('user');
          } else {
            console.error('Error fetching user role:', error);
            toast.error('Error al obtener el rol de usuario');
            setRole(null);
          }
        } else if (data) {
          setRole(data.rol as UserRole);
        } else {
          setRole('user'); // Rol por defecto
        }
      } catch (error) {
        console.error('Error in useUserRole hook:', error);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  return { role, loading, isAdmin: role === 'admin' };
} 