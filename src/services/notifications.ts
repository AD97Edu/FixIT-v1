import { supabase } from '@/integrations/supabase/client';
import { Notification, NotificationWithTicket } from '../types/notifications';
import { useLanguage } from '@/hooks/useLanguage';

export const notificationsService = {
  async getNotifications(): Promise<NotificationWithTicket[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        ticket:tickets (
          title,
          status
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as NotificationWithTicket[];
  },

  async markAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) throw error;
  },

  async deleteNotification(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) throw error;
  },

  async createTicketResolvedNotification(ticketId: string, userId: string): Promise<void> {
    try {
      // Primero verificamos que el ticket existe
      const { data: ticketData, error: ticketError } = await supabase
        .from('tickets')
        .select('title')
        .eq('id', ticketId)
        .single();

      if (ticketError) {
        console.error('Error fetching ticket:', ticketError);
        throw new Error('Ticket not found');
      }

      if (!ticketData) {
        throw new Error('Ticket not found');
      }

      // Verificamos que el usuario existe
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();

      if (userError || !userData) {
        console.error('Error fetching user:', userError);
        throw new Error('User not found');
      }

      // Si todo está bien, creamos la notificación
      const { error: insertError } = await supabase
        .from('notifications')
        .insert({
          ticket_id: ticketId,
          user_id: userId,
          message: `El ticket "${ticketData.title}" ha sido resuelto`,
          is_read: false
        });

      if (insertError) {
        console.error('Error creating notification:', insertError);
        throw insertError;
      }
    } catch (error) {
      console.error('Error in createTicketResolvedNotification:', error);
      throw error;
    }
  }
}; 