/**
 * Google Analytics 4 Integration
 * 
 * Usage:
 * 1. Add NEXT_PUBLIC_GA_MEASUREMENT_ID to .env.local
 * 2. Import and use trackEvent() for custom events
 * 
 * Events tracked:
 * - Page views (automatic)
 * - Object creation
 * - Swap requests
 * - Matches found
 * - Chat messages
 * - User signups
 * - Search queries
 */

declare global {
  interface Window {
    gtag?: (
      command: string,
      targetId: string,
      config?: Record<string, unknown>
    ) => void;
  }
}

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '';

/**
 * Check if Google Analytics is enabled
 */
export const isAnalyticsEnabled = (): boolean => {
  return !!GA_MEASUREMENT_ID && typeof window !== 'undefined' && !!window.gtag;
};

/**
 * Track page view
 */
export const trackPageView = (url: string) => {
  if (!isAnalyticsEnabled()) return;
  
  window.gtag?.('config', GA_MEASUREMENT_ID, {
    page_path: url,
  });
};

/**
 * Event types for type safety
 */
export type AnalyticsEvent =
  | 'page_view'
  | 'signup'
  | 'login'
  | 'logout'
  | 'object_created'
  | 'object_edited'
  | 'object_deleted'
  | 'swap_request_sent'
  | 'swap_request_accepted'
  | 'swap_request_rejected'
  | 'swap_completed'
  | 'match_found'
  | 'chat_message_sent'
  | 'search_performed'
  | 'filter_applied'
  | 'notification_clicked'
  | 'rating_submitted'
  | 'badge_earned'
  | 'level_up'
  | 'profile_updated'
  | '2fa_enabled'
  | '2fa_disabled';

/**
 * Event parameters interface
 */
export interface EventParams {
  category?: string;
  label?: string;
  value?: number;
  object_id?: string;
  swap_id?: string;
  user_id?: string;
  search_term?: string;
  [key: string]: string | number | boolean | undefined;
}

/**
 * Track custom event
 */
export const trackEvent = (
  eventName: AnalyticsEvent,
  params?: EventParams
) => {
  if (!isAnalyticsEnabled()) {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics]', eventName, params);
    }
    return;
  }

  window.gtag?.('event', eventName, params);
};

/**
 * Convenience functions for common events
 */

export const analytics = {
  /**
   * Track user signup
   */
  trackSignup: (method: 'email' | 'google' | 'magic_link') => {
    trackEvent('signup', {
      category: 'authentication',
      label: method,
    });
  },

  /**
   * Track user login
   */
  trackLogin: (method: 'email' | 'google' | 'magic_link') => {
    trackEvent('login', {
      category: 'authentication',
      label: method,
    });
  },

  /**
   * Track object creation
   */
  trackObjectCreated: (objectId: string, category: string) => {
    trackEvent('object_created', {
      category: 'objects',
      object_id: objectId,
      label: category,
    });
  },

  /**
   * Track swap request
   */
  trackSwapRequest: (swapId: string, objectCategory: string) => {
    trackEvent('swap_request_sent', {
      category: 'swaps',
      swap_id: swapId,
      label: objectCategory,
    });
  },

  /**
   * Track swap completion
   */
  trackSwapCompleted: (swapId: string) => {
    trackEvent('swap_completed', {
      category: 'swaps',
      swap_id: swapId,
      value: 1,
    });
  },

  /**
   * Track match found
   */
  trackMatchFound: (objectId: string, matchScore: number) => {
    trackEvent('match_found', {
      category: 'matching',
      object_id: objectId,
      value: matchScore,
    });
  },

  /**
   * Track search
   */
  trackSearch: (query: string, resultsCount: number) => {
    trackEvent('search_performed', {
      category: 'search',
      search_term: query,
      value: resultsCount,
    });
  },

  /**
   * Track filter usage
   */
  trackFilter: (filterType: string, filterValue: string) => {
    trackEvent('filter_applied', {
      category: 'search',
      label: `${filterType}: ${filterValue}`,
    });
  },

  /**
   * Track rating submission
   */
  trackRating: (swapId: string, rating: number) => {
    trackEvent('rating_submitted', {
      category: 'engagement',
      swap_id: swapId,
      value: rating,
    });
  },

  /**
   * Track badge earned
   */
  trackBadgeEarned: (badgeId: string, badgeName: string) => {
    trackEvent('badge_earned', {
      category: 'gamification',
      label: badgeName,
    });
  },

  /**
   * Track level up
   */
  trackLevelUp: (newLevel: number) => {
    trackEvent('level_up', {
      category: 'gamification',
      value: newLevel,
    });
  },

  /**
   * Track 2FA actions
   */
  track2FAEnabled: () => {
    trackEvent('2fa_enabled', {
      category: 'security',
    });
  },

  track2FADisabled: () => {
    trackEvent('2fa_disabled', {
      category: 'security',
    });
  },

  /**
   * Track chat message
   */
  trackChatMessage: (conversationId: string) => {
    trackEvent('chat_message_sent', {
      category: 'communication',
      label: conversationId,
    });
  },

  /**
   * Track notification interaction
   */
  trackNotificationClick: (notificationType: string) => {
    trackEvent('notification_clicked', {
      category: 'notifications',
      label: notificationType,
    });
  },
};

/**
 * Hook for tracking page views in Next.js
 * Usage: Call in app/layout.tsx or _app.tsx
 */
export const usePageTracking = () => {
  if (typeof window === 'undefined') return;

  const handleRouteChange = (url: string) => {
    trackPageView(url);
  };

  // For App Router
  if (typeof window !== 'undefined') {
    // Track initial page view
    trackPageView(window.location.pathname);

    // Listen for route changes (works with Next.js navigation)
    window.addEventListener('popstate', () => {
      handleRouteChange(window.location.pathname);
    });
  }
};
