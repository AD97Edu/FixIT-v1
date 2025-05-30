export interface Notification {
  id: string;
  user_id: string;
  ticket_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface NotificationWithTicket extends Notification {
  ticket: {
    title: string;
    status: string;
  };
} 