// Swaply Notifications - Service Layer
// Real-time notification management with Supabase integration

import { getBrowserSupabase } from '@/lib/supabase/client';
import { getServerSupabase } from '@/lib/supabase/server';
import type { 
  BaseNotification, 
  RichNotification, 
  NotificationPreferences,
  NotificationType 
} from './types';
import { NotificationCreator, DEFAULT_PREFERENCES } from './templates';

export class NotificationService {
  private static instance: NotificationService;
  private subscribers: Map<string, (notifications: RichNotification[]) => void> = new Map();
  private userNotifications: Map<string, RichNotification[]> = new Map();

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Real-time subscription management
  async subscribeToUserNotifications(
    userId: string, 
    callback: (notifications: RichNotification[]) => void
  ) {
    this.subscribers.set(userId, callback);
    
    const supabase = getBrowserSupabase();
    
    // Subscribe to real-time changes
    const subscription = supabase
      .channel(`notifications_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        async (payload) => {
          await this.handleRealtimeUpdate(userId, payload);
        }
      )
      .subscribe();

    // Load initial notifications
    await this.loadUserNotifications(userId);

    return () => {
      this.subscribers.delete(userId);
      supabase.removeChannel(subscription);
    };
  }

  private async handleRealtimeUpdate(userId: string, payload: any) {
    // Reload and notify subscribers
    await this.loadUserNotifications(userId);
  }

  private async loadUserNotifications(userId: string) {
    try {
      const supabase = getBrowserSupabase();
      
      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const richNotifications: RichNotification[] = notifications?.map(notif => ({
        ...notif,
        actions: notif.data?.actions || [],
        image_url: notif.data?.image_url,
        category: notif.data?.category,
        tag: notif.data?.tag,
        badge_count: notif.data?.badge_count
      })) || [];

      this.userNotifications.set(userId, richNotifications);
      
      // Notify subscribers
      const callback = this.subscribers.get(userId);
      if (callback) {
        callback(richNotifications);
      }

      // Update browser notification count
      this.updateBrowserBadge(richNotifications.filter(n => !n.read).length);
      
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  }

  private updateBrowserBadge(count: number) {
    if ('navigator' in window && 'setAppBadge' in navigator) {
      (navigator as any).setAppBadge(count > 0 ? count : null);
    }
  }

  // Create and send notifications
  async createNotification(notification: Omit<RichNotification, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const supabase = await getServerSupabase();
      
      const newNotification = {
        ...notification,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        data: {
          ...notification.data,
          actions: notification.actions,
          image_url: notification.image_url,
          category: notification.category,
          tag: notification.tag,
          badge_count: notification.badge_count
        }
      };

      const { data, error } = await supabase
        .from('notifications')
        .insert([newNotification])
        .select()
        .single();

      if (error) throw error;

      // Send browser push notification if enabled
      await this.sendBrowserNotification(newNotification);

      return data;
    } catch (error) {
      console.error('Failed to create notification:', error);
      throw error;
    }
  }

  private async sendBrowserNotification(notification: RichNotification) {
    if (!('Notification' in window)) return;
    
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    new Notification(notification.title, {
      body: notification.message,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      tag: notification.tag || notification.type,
      data: notification.data
    });
  }

  // Mark notifications as read
  async markAsRead(notificationIds: string[]) {
    try {
      const supabase = getBrowserSupabase();
      
      const { error } = await supabase
        .from('notifications')
        .update({ 
          read: true, 
          updated_at: new Date().toISOString() 
        })
        .in('id', notificationIds);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
    }
  }

  async markAllAsRead(userId: string) {
    try {
      const supabase = getBrowserSupabase();
      
      const { error } = await supabase
        .from('notifications')
        .update({ 
          read: true, 
          updated_at: new Date().toISOString() 
        })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }

  // Delete notifications
  async deleteNotification(notificationId: string) {
    try {
      const supabase = getBrowserSupabase();
      
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  }

  // Notification preferences
  async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      const supabase = getBrowserSupabase();
      
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (!data) {
        // Create default preferences
        const defaultPrefs: NotificationPreferences = {
          user_id: userId,
          ...DEFAULT_PREFERENCES,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { data: newPrefs } = await supabase
          .from('notification_preferences')
          .insert([defaultPrefs])
          .select()
          .single();

        return newPrefs || defaultPrefs;
      }

      return data;
    } catch (error) {
      console.error('Failed to get user preferences:', error);
      // Return defaults on error
      return {
        user_id: userId,
        ...DEFAULT_PREFERENCES,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }
  }

  async updateUserPreferences(
    userId: string, 
    preferences: Partial<Omit<NotificationPreferences, 'user_id' | 'created_at' | 'updated_at'>>
  ) {
    try {
      const supabase = getBrowserSupabase();
      
      const { error } = await supabase
        .from('notification_preferences')
        .upsert([{
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString()
        }]);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to update user preferences:', error);
      throw error;
    }
  }

  // Helper methods for common notification types
  async notifyNewMatch(userId: string, matchData: {
    count: number;
    desired_item: string;
    match_ids: string[];
  }) {
    const notification = NotificationCreator.createMatchNotification(userId, matchData);
    return this.createNotification(notification);
  }

  async notifyNewMessage(userId: string, messageData: {
    sender_id: string;
    sender_name: string;
    message_preview: string;
    chat_id: string;
  }) {
    const notification = NotificationCreator.createMessageNotification(userId, messageData);
    return this.createNotification(notification);
  }

  async notifySwapRequest(userId: string, swapData: {
    requester_id: string;
    requester_name: string;
    requested_item: string;
    offered_item: string;
    swap_request_id: string;
  }) {
    const notification = NotificationCreator.createSwapRequestNotification(userId, swapData);
    return this.createNotification(notification);
  }

  async notifySwapAccepted(userId: string, swapData: {
    accepter_id: string;
    accepter_name: string;
    item_name: string;
    swap_id: string;
  }) {
    const notification = NotificationCreator.createSwapAcceptedNotification(userId, swapData);
    return this.createNotification(notification);
  }

  async notifyAchievement(userId: string, achievementData: {
    achievement_name: string;
    achievement_description: string;
    achievement_icon: string;
    achievement_id: string;
  }) {
    const notification = NotificationCreator.createAchievementNotification(userId, achievementData);
    return this.createNotification(notification);
  }

  async sendReminder(userId: string, reminderData: {
    reminder_text: string;
    reminder_url?: string;
    reminder_type: 'response' | 'rating' | 'profile' | 'general';
  }) {
    const notification = NotificationCreator.createReminderNotification(userId, reminderData);
    return this.createNotification(notification);
  }

  // Get notification statistics
  async getNotificationStats(userId: string) {
    try {
      const supabase = getBrowserSupabase();
      
      const { data, error } = await supabase
        .from('notifications')
        .select('type, read')
        .eq('user_id', userId);

      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        unread: data?.filter(n => !n.read).length || 0,
        byType: {} as Record<NotificationType, { total: number; unread: number }>
      };

      data?.forEach(notification => {
        const type = notification.type as NotificationType;
        if (!stats.byType[type]) {
          stats.byType[type] = { total: 0, unread: 0 };
        }
        stats.byType[type].total++;
        if (!notification.read) {
          stats.byType[type].unread++;
        }
      });

      return stats;
    } catch (error) {
      console.error('Failed to get notification stats:', error);
      return { total: 0, unread: 0, byType: {} };
    }
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();