import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Comment } from "@/types";
import { notificationsService } from "@/services/notifications";
import { useUserRole } from "@/hooks/useUserRole";

// Función para transformar los campos de snake_case a camelCase
const transformCommentData = (comment: any): Comment => {
  return {
    id: comment.id,
    ticketId: comment.ticket_id,
    userId: comment.user_id,
    userName: comment.user_name,
    content: comment.content,
    createdAt: comment.created_at
  };
};

export const useComments = (ticketId: string) => {
  return useQuery({
    queryKey: ['comments', ticketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data.map(transformCommentData) as Comment[];
    }
  });
};

export const useAddComment = () => {
  const queryClient = useQueryClient();
  const { role } = useUserRole();
  
  return useMutation({
    mutationFn: async (comment: Omit<Comment, 'id' | 'createdAt'>) => {
      
      const commentData = {
        ticket_id: comment.ticketId,
        user_id: comment.userId,
        user_name: comment.userName,
        content: comment.content
      };
      
      const { data, error } = await supabase
        .from('comments')
        .insert(commentData)
        .select()
        .single();

      if (error) {
        console.error("Supabase error:", error); // Para depuración
        throw error;
      }

      // Si el comentario es de un admin, crear una notificación
      if (role === 'admin' || role === 'agent') {
        try {
          // Obtener el ID del usuario que creó el ticket
          const { data: ticketData } = await supabase
            .from('tickets')
            .select('submitted_by')
            .eq('id', comment.ticketId)
            .single();

          if (ticketData) {
            await notificationsService.createCommentNotification(
              comment.ticketId,
              ticketData.submitted_by,
              comment.content
            );
          }
        } catch (error) {
          console.error("Error creating comment notification:", error);
          // No lanzamos el error para no interrumpir el flujo principal
        }
      }

      return transformCommentData(data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.ticketId] });
    },
    onError: (error) => {
      console.error("Error in mutation:", error);
    }
  });
};

export const useEditComment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, content, ticketId }: { id: string; content: string; ticketId: string }) => {
      
      const { data, error } = await supabase
        .from('comments')
        .update({ content })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error("Supabase error on edit:", error);
        throw error;
      }
      
      return transformCommentData(data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.ticketId] });
    },
    onError: (error) => {
      console.error("Error in edit mutation:", error);
    }
  });
};
