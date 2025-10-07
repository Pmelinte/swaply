// Swaply Notifications - Type Definitions
// Comprehensive notification system with 10+ types

export interface BaseNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export type NotificationType = 
  | 'match'           // New matching objects found
  | 'message'         // New chat message received
  | 'swap_request'    // Someone wants to swap with you
  | 'swap_accepted'   // Your swap request was accepted
  | 'swap_declined'   // Your swap request was declined
  | 'swap_completed'  // Swap was successfully completed
  | 'welcome'         // Welcome new users
  | 'rating'          // Request to rate completed swap
  | 'travel'          // Travel suggestions for swaps
  | 'achievement'     // User achievements unlocked
  | 'reminder'        // Various reminders (respond to request, etc.)
  | 'promotional'     // App promotions and features
  | 'system'          // System maintenance, updates
  | 'feedback';       // Feedback requests

export interface NotificationPreferences {
  user_id: string;
  push_enabled: boolean;
  email_enabled: boolean;
  in_app_enabled: boolean;
  types: {
    match: boolean;
    message: boolean;
    swap_request: boolean;
    swap_accepted: boolean;
    swap_declined: boolean;
    swap_completed: boolean;
    welcome: boolean;
    rating: boolean;
    travel: boolean;
    achievement: boolean;
    reminder: boolean;
    promotional: boolean;
    system: boolean;
    feedback: boolean;
  };
  quiet_hours: {
    enabled: boolean;
    start_time: string; // "22:00"
    end_time: string;   // "08:00"
  };
  created_at: string;
  updated_at: string;
}

export interface NotificationTemplate {
  type: NotificationType;
  title_template: string;
  message_template: string;
  action_url?: string;
  icon: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface NotificationAction {
  id: string;
  label: string;
  action_type: 'navigate' | 'api_call' | 'dismiss';
  url?: string;
  api_endpoint?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  payload?: Record<string, any>;
}

export interface RichNotification extends BaseNotification {
  actions?: NotificationAction[];
  image_url?: string;
  category?: string;
  tag?: string; // For grouping similar notifications
  badge_count?: number;
}