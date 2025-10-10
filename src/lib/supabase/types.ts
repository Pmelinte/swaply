// Types pentru baza de date Supabase - schema simplificată compatibilă cu codul actual

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          location: string | null;
          rating: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          location?: string | null;
          rating?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          location?: string | null;
          rating?: number;
          updated_at?: string;
        };
      };
      objects: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string;
          category: string;
          condition: string;
          estimated_value: number | null;
          desired_items: string;
          location: string;
          exchange_preferences: Record<string, any>;
          images: string[];
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          name: string;
          description: string;
          category: string;
          condition: string;
          estimated_value?: number | null;
          desired_items: string;
          location: string;
          exchange_preferences?: Record<string, any>;
          images?: string[];
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          description?: string;
          category?: string;
          condition?: string;
          estimated_value?: number | null;
          desired_items?: string;
          location?: string;
          exchange_preferences?: Record<string, any>;
          images?: string[];
          status?: string;
          updated_at?: string;
        };
      };
      swap_requests: {
        Row: {
          id: string;
          requested_item_id: string;
          offered_item_id: string;
          requester_id: string;
          owner_id: string;
          message: string;
          meeting_type: string;
          travel_suggestion: Record<string, any> | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          requested_item_id: string;
          offered_item_id: string;
          requester_id: string;
          owner_id: string;
          message: string;
          meeting_type: string;
          travel_suggestion?: Record<string, any> | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: string;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          swap_request_id: string;
          sender_id: string;
          recipient_id: string;
          content: string;
          message_type: string;
          is_read: boolean;
          created_at: string;
          sender?: {
            user_profiles?: {
              display_name?: string;
              avatar_url?: string;
            };
            email?: string;
          };
        };
        Insert: {
          swap_request_id: string;
          sender_id: string;
          recipient_id: string;
          content: string;
          message_type?: string;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          is_read?: boolean;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          content: string;
          metadata: Record<string, any>;
          read: boolean;
          created_at: string;
          data?: Record<string, any>;
        };
        Insert: {
          user_id: string;
          type: string;
          title: string;
          content: string;
          metadata?: Record<string, any>;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          read?: boolean;
          updated_at?: string;
        };
      };
      swaps: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          category: string | null;
          location: string | null;
          images: any[];
          created_at: string;
        };
        Insert: {
          user_id: string;
          title: string;
          description?: string | null;
          category?: string | null;
          location?: string | null;
          images?: any[];
          created_at?: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          category?: string | null;
          location?: string | null;
          images?: any[];
        };
      };
      user_profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          email: string;
          created_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          email: string;
          created_at?: string;
        };
        Update: {
          display_name?: string | null;
          avatar_url?: string | null;
          email?: string;
        };
      };
      notification_preferences: {
        Row: {
          id: string;
          user_id: string;
          push_enabled: boolean;
          email_enabled: boolean;
          in_app_enabled: boolean;
          types: Record<string, any>;
          quiet_hours: Record<string, any>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          push_enabled?: boolean;
          email_enabled?: boolean;
          in_app_enabled?: boolean;
          types?: Record<string, any>;
          quiet_hours?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          push_enabled?: boolean;
          email_enabled?: boolean;
          in_app_enabled?: boolean;
          types?: Record<string, any>;
          quiet_hours?: Record<string, any>;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      increment_object_views: {
        Args: {
          object_id: string;
        };
        Returns: void;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// Type helpers pentru utilizare în aplicație
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type SwapObject = Database['public']['Tables']['objects']['Row'];
export type SwapRequest = Database['public']['Tables']['swap_requests']['Row'];
export type Message = Database['public']['Tables']['messages']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row'];
export type UserProfile = Database['public']['Tables']['user_profiles']['Row'];
export type NotificationPreferences = Database['public']['Tables']['notification_preferences']['Row'];

// Insert types
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type SwapObjectInsert = Database['public']['Tables']['objects']['Insert'];
export type SwapRequestInsert = Database['public']['Tables']['swap_requests']['Insert'];
export type MessageInsert = Database['public']['Tables']['messages']['Insert'];
export type NotificationInsert = Database['public']['Tables']['notifications']['Insert'];

// Update types
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
export type SwapObjectUpdate = Database['public']['Tables']['objects']['Update'];
export type SwapRequestUpdate = Database['public']['Tables']['swap_requests']['Update'];
export type MessageUpdate = Database['public']['Tables']['messages']['Update'];
export type NotificationUpdate = Database['public']['Tables']['notifications']['Update'];