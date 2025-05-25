import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { Suggestion, SuggestionWithProfile } from '@/types';
import { toast } from 'sonner';

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
  };  /**
   * Obtiene todas las sugerencias (para administradores)
   * @returns Lista de todas las sugerencias con información del usuario o null si ocurrió un error
   */  const getAllSuggestions = async (): Promise<SuggestionWithProfile[] | null> => {
    try {
      setLoading(true);
      
      // Utilizamos la función SQL que hemos creado en Supabase
      const { data: suggestionsData, error: suggestionsError } = await supabase
        .rpc('get_suggestions_with_profiles');
      
      if (suggestionsError) {
        console.error('Error fetching all suggestions:', suggestionsError);
        toast.error('Error al obtener las sugerencias');
        return null;
      }

      if (!suggestionsData || suggestionsData.length === 0) {
        return [];
      }
      
      // Transformamos los datos al formato esperado por la interfaz SuggestionWithProfile
      const suggestionsWithProfiles = suggestionsData.map(suggestion => ({
        ...suggestion,
        profiles: {
          full_name: suggestion.full_name
        }
      }));
      
      // Eliminamos la propiedad full_name que ya no necesitamos
      suggestionsWithProfiles.forEach(suggestion => {
        delete suggestion.full_name;
      });
      
      return suggestionsWithProfiles as SuggestionWithProfile[];
    } catch (error) {
      console.error('Error in getAllSuggestions:', error);
      toast.error('Error al obtener las sugerencias');
      return null;
    } finally {
      setLoading(false);
    }
  };
  /**
 * Elimina una sugerencia usando la función RPC alternativa
 * @param id ID de la sugerencia a eliminar
 * @returns true si se eliminó correctamente, false en caso contrario
 */
const deleteSuggestion = async (id: string): Promise<boolean> => {
  try {
    setLoading(true);
    
    // Utilizamos la función RPC alternativa
    const { data, error } = await supabase
      .rpc('delete_suggestion_alternative', { 
      target_suggestion_id: id 
      });
    
    if (error) {
      console.error('Error deleting suggestion:', error);
      toast.error('Error al eliminar la sugerencia');
      return false;
    }
    
    if (data === true) {
      toast.success('Sugerencia eliminada correctamente');
      return true;
    } else {
      toast.error('No tienes permiso para eliminar esta sugerencia');
      return false;
    }
  } catch (error) {
    console.error('Error in deleteSuggestion:', error);
    toast.error('Error al eliminar la sugerencia');
    return false;
  } finally {
    setLoading(false);
  }
};

  return {
    createSuggestion,
    getUserSuggestions,
    getAllSuggestions,
    deleteSuggestion,
    loading
  };
}
