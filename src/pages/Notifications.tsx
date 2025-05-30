import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationsService } from '../services/notifications';
import { NotificationWithTicket } from '../types/notifications';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Trash2, CheckCircle2, Clock, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useLanguage } from '@/hooks/useLanguage';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

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

  const getNotificationIcon = (message: string) => {
    if (message.includes('resuelto')) {
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    } else if (message.includes('atendido')) {
      return <Clock className="h-5 w-5 text-blue-500" />;
    } else {
      return <MessageSquare className="h-5 w-5 text-purple-500" />;
    }
  };

  const getNotificationType = (message: string) => {
    if (message.includes('resuelto')) {
      return 'resolved';
    } else if (message.includes('atendido')) {
      return 'in-progress';
    } else {
      return 'comment';
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">{t('notifications')}</h1>
      <div className="space-y-4">
        {notifications.length === 0 ? (
          <Card className="bg-card">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">{t('noNotifications')}</p>
            </CardContent>
          </Card>
        ) : (
          notifications.map((notification) => {
            const type = getNotificationType(notification.message);
            return (
              <Card 
                key={notification.id}
                className={cn(
                  "cursor-pointer transition-all duration-200 hover:shadow-md",
                  !notification.is_read && "border-l-4",
                  type === 'resolved' && !notification.is_read && "border-l-green-500",
                  type === 'in-progress' && !notification.is_read && "border-l-blue-500",
                  type === 'comment' && !notification.is_read && "border-l-purple-500"
                )}
                onClick={() => handleNotificationClick(notification)}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-3">
                    {getNotificationIcon(notification.message)}
                    <CardTitle className="text-sm font-medium">
                      {notification.ticket.title}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    {!notification.is_read && (
                      <Badge variant="secondary" className="text-xs">
                        {t('new')}
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(notification.id);
                      }}
                      title={t('deleteNotification')}
                      className="h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    {notification.message}
                  </div>
                  <div className="text-xs text-muted-foreground/70 mt-2">
                    {format(new Date(notification.created_at), "PPpp", { locale: es })}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
} 