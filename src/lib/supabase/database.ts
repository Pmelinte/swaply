import { getBrowserSupabase } from './client';
import type { 
  Profile, 
  SwapObject, 
  SwapRequest,
  Message,
  Notification,
  UserProfile
} from './types';

const supabase = getBrowserSupabase();

// Profile management
export const profileService = {
  async getProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
    
    return data;
  },

  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating profile:', error);
      return null;
    }
    
    return data;
  }
};

// Objects management
export const objectsService = {
  async getObjects(limit = 20): Promise<SwapObject[]> {
    const { data, error } = await supabase
      .from('objects')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching objects:', error);
      return [];
    }
    
    return data || [];
  },

  async getObject(id: string): Promise<SwapObject | null> {
    const { data, error } = await supabase
      .from('objects')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching object:', error);
      return null;
    }
    
    return data;
  },

  async getUserObjects(userId: string): Promise<SwapObject[]> {
    const { data, error } = await supabase
      .from('objects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching user objects:', error);
      return [];
    }
    
    return data || [];
  }
};

// Notifications management
export const notificationsService = {
  async getUserNotifications(userId: string, limit = 20): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
    
    return data || [];
  },

  async markAsRead(notificationId: string): Promise<boolean> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);
    
    if (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
    
    return true;
  }
};

// Real-time subscriptions
export const subscriptions = {
  subscribeToUserNotifications(userId: string, callback: (notification: Notification) => void) {
    return supabase
      .channel('user-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        callback(payload.new as Notification);
      })
      .subscribe();
  },

  subscribeToConversation(swapRequestId: string, callback: (message: any) => void) {
    return supabase
      .channel(`conversation-${swapRequestId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `swap_request_id=eq.${swapRequestId}`
      }, (payload) => {
        callback(payload.new);
      })
      .subscribe();
  }
};