import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationsService } from '../services/notifications';
import { NotificationWithTicket } from '../types/notifications';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useLanguage } from '@/hooks/useLanguage';
import { toast } from 'sonner';

export default function Notifications() {
  const [notifications, setNotifications] = useState<NotificationWithTicket[]>([]);
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await notificationsService.getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
      toast.error(t('error'));
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await notificationsService.deleteNotification(notificationId);
      setNotifications(notifications.filter(n => n.id !== notificationId));
      toast.success(t('notificationDeleted'));
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error(t('error'));
    }
  };

  const handleNotificationClick = async (notification: NotificationWithTicket) => {
    try {
      if (!notification.is_read) {
        await notificationsService.markAsRead(notification.id);
        setNotifications(notifications.map(n => 
          n.id === notification.id ? { ...n, is_read: true } : n
        ));
      }
      navigate(`/tickets/${notification.ticket_id}`);
    } catch (error) {
      console.error('Error handling notification click:', error);
      toast.error(t('error'));
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">{t('notifications')}</h1>
      <div className="space-y-4">
        {notifications.length === 0 ? (
          <p className="text-gray-500 text-center">{t('noNotifications')}</p>
        ) : (
          notifications.map((notification) => (
            <Card 
              key={notification.id}
              className={`cursor-pointer transition-colors ${
                !notification.is_read ? 'bg-blue-50' : ''
              }`}
              onClick={() => handleNotificationClick(notification)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {notification.ticket.title}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(notification.id);
                  }}
                  title={t('deleteNotification')}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-500">
                  {notification.message}
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  {format(new Date(notification.created_at), "PPpp", { locale: es })}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
} 