'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { notificationService } from '@/lib/notifications/service';
import type { RichNotification } from '@/lib/notifications/types';

interface NotificationSystemProps {
  userId: string;
}

export default function NotificationSystem({ userId }: NotificationSystemProps) {
  const [notifications, setNotifications] = useState<RichNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<'all' | 'unread' | 'matches' | 'messages'>('all');
  const [browserNotificationsEnabled, setBrowserNotificationsEnabled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Request browser notification permission
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setBrowserNotificationsEnabled(permission === 'granted');
    }
  }, []);

  // Show browser notification
  const showBrowserNotification = useCallback((notification: RichNotification) => {
    if (!browserNotificationsEnabled || document.visibilityState === 'visible') return;

    const icon = getNotificationIcon(notification.type);
    new Notification(notification.title, {
      body: notification.message,
      icon: `/notification-icon.png`,
      badge: `/notification-badge.png`,
      tag: notification.id,
      requireInteraction: notification.priority === 'high',
      data: notification.data
    });
  }, [browserNotificationsEnabled]);

  useEffect(() => {
    if (!userId) return;

    // Check browser notification permission
    if ('Notification' in window && Notification.permission === 'granted') {
      setBrowserNotificationsEnabled(true);
    }

    // Subscribe to real-time notifications  
    const unsubscribe = notificationService.subscribeToUserNotifications(
      userId,
      (newNotifications) => {
        const previousCount = unreadCount;
        const newCount = newNotifications.filter(n => !n.read).length;
        
        setNotifications(newNotifications);
        setUnreadCount(newCount);

        // Show browser notification for new notifications
        if (newCount > previousCount) {
          const latestNotification = newNotifications.find(n => !n.read);
          if (latestNotification) {
            showBrowserNotification(latestNotification);
          }
        }
      }
    );

    return () => {
      unsubscribe?.then(unsub => unsub?.());
    };
  }, [userId, unreadCount, showBrowserNotification]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getTimeAgo = (dateString: string) => {
    const now = new Date().getTime();
    const notifTime = new Date(dateString).getTime();
    const diffMinutes = Math.floor((now - notifTime) / (1000 * 60));

    if (diffMinutes < 1) return 'Acum';
    if (diffMinutes < 60) return `${diffMinutes}m`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h`;
    return `${Math.floor(diffMinutes / 1440)}z`;
  };

  const getNotificationIcon = (type: string) => {
    const icons = {
      match: '🎯',
      message: '💬',
      swap_request: '🤝',
      swap_accepted: '✅',
      swap_declined: '❌', 
      swap_completed: '🎉',
      welcome: '👋',
      rating: '⭐',
      travel: '✈️',
      achievement: '🏆',
      reminder: '⏰',
      promotional: '🎁',
      system: '🔧',
      feedback: '📝'
    };
    return icons[type as keyof typeof icons] || '📢';
  };

  const getNotificationPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'border-red-500 bg-red-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      case 'low': return 'border-green-500 bg-green-50';
      default: return 'border-blue-500 bg-blue-50';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread': return !notification.read;
      case 'matches': return notification.type === 'match';
      case 'messages': return notification.type === 'message';
      default: return true;
    }
  });

  const handleNotificationClick = async (notification: RichNotification) => {
    // Mark as read if unread
    if (!notification.read) {
      await notificationService.markAsRead([notification.id]);
    }

    // Handle notification actions based on type
    switch (notification.type) {
      case 'match':
        if (notification.data?.objectId) {
          window.location.href = `/match?object=${notification.data.objectId}`;
        }
        break;
      case 'message':
        if (notification.data?.chatId) {
          window.location.href = `/chat/${notification.data.chatId}`;
        }
        break;
      case 'swap_request':
        if (notification.data?.swapId) {
          window.location.href = `/swap/${notification.data.swapId}`;
        }
        break;
      case 'travel':
        if (notification.data?.destination) {
          window.location.href = `/travel?destination=${notification.data.destination}`;
        }
        break;
      case 'rating':
        if (notification.data?.swapId) {
          window.location.href = `/swap/${notification.data.swapId}/rate`;
        }
        break;
    }

    setIsOpen(false);
  };

  const markAllAsRead = async () => {
    await notificationService.markAllAsRead(userId);
  };

  const deleteNotification = async (notificationId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    await notificationService.deleteNotification(notificationId);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg transition-colors"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[500px] overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">Notificări</h3>
              <div className="flex items-center space-x-2">
                {!browserNotificationsEnabled && (
                  <button
                    onClick={requestNotificationPermission}
                    className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                    title="Activează notificările browser"
                  >
                    🔔 Activează
                  </button>
                )}
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Marchează toate
                  </button>
                )}
              </div>
            </div>

            {/* Filter buttons */}
            <div className="flex space-x-2">
              {[
                { key: 'all', label: 'Toate', count: notifications.length },
                { key: 'unread', label: 'Necitite', count: unreadCount },
                { key: 'matches', label: 'Potriviri', count: notifications.filter(n => n.type === 'match').length },
                { key: 'messages', label: 'Mesaje', count: notifications.filter(n => n.type === 'message').length }
              ].map(({ key, label, count }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key as any)}
                  className={`text-xs px-3 py-1 rounded-full transition-colors ${
                    filter === key
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {label} {count > 0 && `(${count})`}
                </button>
              ))}
            </div>
          </div>

          {/* Notifications list */}
          <div className="max-h-80 overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <div className="text-4xl mb-2">
                  {filter === 'all' ? '📭' : filter === 'unread' ? '✅' : '🔍'}
                </div>
                <p>
                  {filter === 'all' ? 'Nu ai notificări' :
                   filter === 'unread' ? 'Toate notificările sunt citite' :
                   `Nu ai notificări de tip "${filter}"`}
                </p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 border-l-4 cursor-pointer hover:bg-gray-50 transition-colors relative group ${
                    !notification.read 
                      ? getNotificationPriorityColor(notification.priority) 
                      : 'bg-white border-gray-300'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 text-xl">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-medium ${
                          !notification.read ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {notification.title}
                        </p>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500 flex-shrink-0">
                            {getTimeAgo(notification.created_at)}
                          </span>
                          <button
                            onClick={(e) => deleteNotification(notification.id, e)}
                            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                            title="Șterge notificarea"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      <p className={`text-sm mt-1 ${
                        !notification.read ? 'text-gray-800' : 'text-gray-600'
                      }`}>
                        {notification.message}
                      </p>

                      {/* Action buttons for specific notification types */}
                      {notification.type === 'swap_request' && notification.data?.swapId && (
                        <div className="flex space-x-2 mt-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = `/swap/${notification.data?.swapId}/accept`;
                            }}
                            className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200"
                          >
                            Acceptă
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = `/swap/${notification.data?.swapId}/decline`;
                            }}
                            className="text-xs px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                          >
                            Respinge
                          </button>
                        </div>
                      )}

                      {notification.type === 'rating' && notification.data?.swapId && (
                        <div className="mt-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = `/swap/${notification.data?.swapId}/rate`;
                            }}
                            className="text-xs px-3 py-1 bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200"
                          >
                            Evaluează acum ⭐
                          </button>
                        </div>
                      )}
                    </div>

                    {!notification.read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer with settings */}
          <div className="p-3 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{filteredNotifications.length} notificări</span>
              <button
                onClick={() => window.location.href = '/settings/notifications'}
                className="text-blue-600 hover:text-blue-800"
              >
                Setări notificări
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
