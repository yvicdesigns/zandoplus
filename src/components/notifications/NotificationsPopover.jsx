import React from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Bell, MessageSquare, CheckCheck, Zap, AlertTriangle, User, Megaphone } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationsContext';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

const NotificationItem = ({ notification, onRead }) => {
  const getIcon = (type) => {
    switch (type) {
      case 'new_message':
        // Check if it's a bulk message
        if (notification.content?.message?.includes('Zando+')) {
          return <Megaphone className="w-5 h-5 text-purple-500" />;
        }
        return <MessageSquare className="w-5 h-5 text-blue-500" />;
      case 'boost_activated':
        return <Zap className="w-5 h-5 text-yellow-500" />;
      case 'boost_expired':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'verification_approved':
        return <CheckCheck className="w-5 h-5 text-green-500" />;
      case 'verification_rejected':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'new_order':
        return <User className="w-5 h-5 text-green-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const handleClick = () => {
    onRead(notification.id);
  };
  
  const linkTo = notification.link || '#!';

  return (
    <Link to={linkTo} onClick={handleClick} className="block">
      <div className={`p-3 hover:bg-gray-50 rounded-lg transition-colors duration-150 flex items-start space-x-3 ${!notification.is_read ? 'bg-purple-50' : ''}`}>
        <div className="flex-shrink-0 mt-1">{getIcon(notification.type)}</div>
        <div className="flex-1">
          <p className="text-sm text-gray-700">{notification.content?.message}</p>
          <p className="text-xs text-gray-500 mt-1">
            {new Date(notification.created_at).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        {!notification.is_read && <div className="w-2.5 h-2.5 bg-purple-500 rounded-full mt-1.5 flex-shrink-0"></div>}
      </div>
    </Link>
  );
};

const NotificationsPopover = () => {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-6 h-6 text-gray-600 hover:text-purple-600 transition-colors" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 md:w-96 p-2" align="end">
        <div className="flex items-center justify-between p-2 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="link" size="sm" onClick={markAllAsRead} className="text-purple-600">
              <CheckCheck className="w-4 h-4 mr-1" />
              Tout marquer comme lu
            </Button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="p-4 text-center text-sm text-gray-500">Chargement...</div>
          ) : notifications.length > 0 ? (
            <div className="p-1">
              {notifications.map((notif) => (
                <NotificationItem key={notif.id} notification={notif} onRead={markAsRead} />
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-gray-500">
              <Bell className="w-10 h-10 mx-auto text-gray-300 mb-2" />
              Aucune notification pour le moment.
            </div>
          )}
        </div>
        <div className="p-2 border-t text-center">
            <Link to="/settings#notifications">
                <Button variant="ghost" size="sm" className="w-full">
                    Gérer les notifications
                </Button>
            </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationsPopover;