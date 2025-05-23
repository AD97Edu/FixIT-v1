import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { toast } from 'sonner';

export interface Suggestion {
  id: string;
  user_id: string;
  title: string;
  description: string;
  created_at: string;
}

export interface NewSuggestion {
  title: string;
  description: string;
}

/**
 * Hook para manejar las sugerencias de los usuarios
 */
export function useSuggestions() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  /**
   * Crea una nueva sugerencia
   * @param suggestion Datos de la sugerencia a crear
   * @returns El ID de la sugerencia creada o null si ocurrió un error
   */
  const createSuggestion = async (suggestion: NewSuggestion): Promise<string | null> => {
    if (!user) {
      toast.error('Debes iniciar sesión para enviar sugerencias');
      return null;
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('suggestions')
        .insert({
          user_id: user.id,
          title: suggestion.title,
          description: suggestion.description
        })
        .select('id')
        .single();
      
      if (error) {
        console.error('Error creating suggestion:', error);
        toast.error('Error al crear la sugerencia');
        return null;
      }
      
      toast.success('Sugerencia enviada correctamente');
      return data.id;
    } catch (error) {
      console.error('Error in createSuggestion:', error);
      toast.error('Error al crear la sugerencia');
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Obtiene las sugerencias del usuario actual
   * @returns Lista de sugerencias o null si ocurrió un error
   */
  const getUserSuggestions = async (): Promise<Suggestion[] | null> => {
    if (!user) {
      return null;
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('suggestions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching user suggestions:', error);
        toast.error('Error al obtener las sugerencias');
        return null;
      }
      
      return data as Suggestion[];
    } catch (error) {
      console.error('Error in getUserSuggestions:', error);
      toast.error('Error al obtener las sugerencias');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    createSuggestion,
    getUserSuggestions,
    loading
  };
}
