/**
 * STUB TYPES - These are placeholder types until database migrations are applied
 * 
 * After migrations 014-019 are applied, regenerate actual types with:
 * npx supabase gen types typescript --linked > src/lib/supabase/database.types.ts
 * 
 * Then remove this file and update imports.
 */

export interface Database {
  public: {
    Tables: {
      // Sprint 3 Feature 1: AI Taxonomy
      taxonomy_categories: {
        Row: {
          id: string;
          name: string;
          parent_id: string | null;
          level: number;
          unspsc_code: string | null;
          hs_code: string | null;
          isic_code: string | null;
          requires_shipping: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['taxonomy_categories']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['taxonomy_categories']['Insert']>;
      };
      
      // Sprint 3 Feature 2: Chain Matching
      match_chains: {
        Row: {
          id: string;
          chain_type: 'triple' | 'quad' | 'custom';
          participant_count: number;
          object_ids: string[];
          status: 'pending' | 'active' | 'completed' | 'cancelled';
          expires_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['match_chains']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['match_chains']['Insert']>;
      };
      
      matching_constraints: {
        Row: {
          user_id: string;
          max_distance_km: number | null;
          min_value_ratio: number;
          max_value_ratio: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['matching_constraints']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['matching_constraints']['Insert']>;
      };
      
      match_feedback: {
        Row: {
          id: string;
          match_id: string;
          user_id: string;
          feedback_type: 'accepted' | 'rejected' | 'counter_offer';
          reason: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['match_feedback']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['match_feedback']['Insert']>;
      };
      
      // Sprint 3 Feature 3: Personalization
      user_interests: {
        Row: {
          user_id: string;
          category_id: string;
          interest_score: number;
          last_updated: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_interests']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['user_interests']['Insert']>;
      };
      
      user_preferences: {
        Row: {
          user_id: string;
          max_distance_km: number | null;
          preferred_categories: string[];
          quiet_hours_start: string | null;
          quiet_hours_end: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_preferences']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['user_preferences']['Insert']>;
      };
      
      user_collections: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          object_ids: string[];
          object_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_collections']['Row'], 'id' | 'created_at' | 'updated_at' | 'object_count'>;
        Update: Partial<Database['public']['Tables']['user_collections']['Insert']>;
      };
      
      onboarding_responses: {
        Row: {
          user_id: string;
          purpose: string[];
          interested_categories: string[];
          value_range_min: number;
          value_range_max: number;
          max_distance_km: number;
          frequency: string;
          languages: string[];
          completed_at: string;
        };
        Insert: Database['public']['Tables']['onboarding_responses']['Row'];
        Update: Partial<Database['public']['Tables']['onboarding_responses']['Insert']>;
      };
      
      personalization_events: {
        Row: {
          id: string;
          user_id: string;
          event_type: 'object_viewed' | 'object_posted' | 'search' | 'swap_completed';
          event_data: any;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['personalization_events']['Row'], 'id' | 'created_at'>;
        Update: never;
      };
      
      // Sprint 3 Feature 5: Fraud Detection
      fraud_signals: {
        Row: {
          id: string;
          user_id: string;
          signal_type: string;
          severity: 'low' | 'medium' | 'high' | 'critical';
          signal_data: any;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['fraud_signals']['Row'], 'id' | 'created_at'>;
        Update: never;
      };
      
      user_flags: {
        Row: {
          id: string;
          flagged_user_id: string | null;
          flagged_object_id: string | null;
          flag_type: string;
          status: 'pending' | 'in_review' | 'approved' | 'rejected';
          reason_details: string | null;
          flagged_by: string | null;
          created_at: string;
          reviewed_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['user_flags']['Row'], 'id' | 'created_at' | 'reviewed_at'>;
        Update: Partial<Database['public']['Tables']['user_flags']['Row']>;
      };
      
      moderation_actions: {
        Row: {
          id: string;
          moderator_id: string | null;
          action_type: string;
          target_user_id: string | null;
          target_object_id: string | null;
          reason: string;
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['moderation_actions']['Row'], 'id' | 'created_at'>;
        Update: never;
      };
      
      // Sprint 3 Feature 6: GDPR Compliance
      gdpr_requests: {
        Row: {
          id: string;
          user_id: string;
          request_type: 'export' | 'erasure';
          status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
          data_export_url: string | null;
          created_at: string;
          completed_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['gdpr_requests']['Row'], 'id' | 'created_at' | 'completed_at'>;
        Update: Partial<Database['public']['Tables']['gdpr_requests']['Row']>;
      };
      
      consent_log: {
        Row: {
          id: string;
          user_id: string;
          consent_type: string;
          granted: boolean;
          policy_version: string | null;
          consent_method: string;
          withdrawn_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['consent_log']['Row'], 'id' | 'created_at'>;
        Update: never;
      };
      
      gdpr_audit_log: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          details: any;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['gdpr_audit_log']['Row'], 'id' | 'created_at'>;
        Update: never;
      };
      
      // Sprint 3 Feature 8: AI Classification
      ai_classification_queue: {
        Row: {
          id: string;
          object_id: string;
          priority: number;
          status: 'pending' | 'processing' | 'completed' | 'failed';
          retry_count: number;
          error_message: string | null;
          created_at: string;
          processed_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['ai_classification_queue']['Row'], 'id' | 'created_at' | 'processed_at'>;
        Update: Partial<Database['public']['Tables']['ai_classification_queue']['Row']>;
      };
      
      ai_classification_cache: {
        Row: {
          id: string;
          input_hash: string;
          classification_result: any;
          confidence_score: number;
          expires_at: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['ai_classification_cache']['Row'], 'id' | 'created_at'>;
        Update: never;
      };
      
      // Existing tables (add minimal stubs for existing ones)
      objects: {
        Row: any;
        Insert: any;
        Update: any;
      };
      
      users: {
        Row: any;
        Insert: any;
        Update: any;
      };
      
      notifications: {
        Row: any;
        Insert: any;
        Update: any;
      };
      
      notification_preferences: {
        Row: any;
        Insert: any;
        Update: any;
      };
      
      reviews: {
        Row: any;
        Insert: any;
        Update: any;
      };
      
      swap_requests: {
        Row: any;
        Insert: any;
        Update: any;
      };
      
      [key: string]: {
        Row: any;
        Insert: any;
        Update: any;
      };
    };
    
    Views: {
      [key: string]: {
        Row: any;
      };
    };
    
    Functions: {
      find_direct_matches: {
        Args: { p_object_id: string; p_limit: number };
        Returns: any[];
      };
      
      find_triple_chain_matches: {
        Args: { p_object_id: string; p_limit: number };
        Returns: any[];
      };
      
      check_match_constraints: {
        Args: { 
          p_user_id: string; 
          p_partner_id: string; 
          p_distance_km: number | null; 
          p_value_ratio: number;
        };
        Returns: boolean;
      };
      
      get_user_interest_summary: {
        Args: { p_user_id: string; p_limit: number };
        Returns: any[];
      };
      
      update_interest_score: {
        Args: {
          p_user_id: string;
          p_category_id: string;
          p_signal_type: string;
          p_increment: number;
        };
        Returns: void;
      };
      
      get_personalized_recommendations: {
        Args: {
          p_user_id: string;
          p_limit: number;
          p_offset: number;
          p_exclude_own: boolean;
        };
        Returns: any[];
      };
      
      is_in_quiet_hours: {
        Args: { p_user_id: string };
        Returns: boolean;
      };
      
      get_continue_context: {
        Args: { p_user_id: string };
        Returns: any;
      };
      
      process_onboarding_responses: {
        Args: { p_user_id: string };
        Returns: void;
      };
      
      get_category_tree: {
        Args: {
          p_parent_id: string | null;
          p_language: string;
          p_max_depth: number;
        };
        Returns: any[];
      };
      
      get_category_breadcrumb: {
        Args: {
          p_category_id: string;
          p_language: string;
        };
        Returns: any[];
      };
      
      search_categories: {
        Args: {
          p_query: string;
          p_language: string;
          p_limit: number;
        };
        Returns: any[];
      };
      
      suggest_category_from_keywords: {
        Args: {
          p_title: string;
          p_description: string;
          p_language: string;
          p_limit: number;
        };
        Returns: any[];
      };
      
      request_data_export: {
        Args: { p_user_id: string };
        Returns: any;
      };
      
      request_data_erasure: {
        Args: { p_user_id: string };
        Returns: any;
      };
      
      has_consent: {
        Args: {
          p_user_id: string;
          p_consent_type: string;
        };
        Returns: boolean;
      };
      
      process_data_export: {
        Args: { p_request_id: string };
        Returns: void;
      };
      
      process_data_erasure: {
        Args: { p_request_id: string };
        Returns: void;
      };
      
      user_has_2fa_enabled: {
        Args: { p_user_id: string };
        Returns: any;
      };
      
      validate_backup_code: {
        Args: { backup_code: string };
        Returns: any;
      };
      
      can_review_swap: {
        Args: {
          p_swap_id: string;
          p_reviewer_id: string;
        };
        Returns: boolean;
      };
      
      [key: string]: {
        Args: any;
        Returns: any;
      };
    };
    
    Enums: {
      [key: string]: string;
    };
  };
}
