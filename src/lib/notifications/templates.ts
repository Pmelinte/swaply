// Swaply Notifications - Templates and Creators
// Romanian localized notification templates with smart data integration

import type { 
  NotificationTemplate, 
  NotificationType, 
  BaseNotification,
  RichNotification,
  NotificationPreferences
} from './types';

// Romanian notification templates
export const NOTIFICATION_TEMPLATES: Record<NotificationType, NotificationTemplate> = {
  match: {
    type: 'match',
    title_template: '🎯 Potriviri noi găsite!',
    message_template: 'Am găsit {count} obiecte care ar putea să te intereseze pentru "{desired_item}"',
    action_url: '/match',
    icon: '🎯',
    priority: 'high'
  },
  message: {
    type: 'message',
    title_template: '💬 Mesaj nou de la {sender_name}',
    message_template: '{message_preview}',
    action_url: '/chat?with={sender_id}',
    icon: '💬',
    priority: 'high'
  },
  swap_request: {
    type: 'swap_request',
    title_template: '🤝 Cerere de schimb',
    message_template: '{requester_name} vrea să schimbe "{requested_item}" cu "{offered_item}"',
    action_url: '/cereri',
    icon: '🤝',
    priority: 'urgent'
  },
  swap_accepted: {
    type: 'swap_accepted',
    title_template: '✅ Cerere acceptată!',
    message_template: '{accepter_name} a acceptat să schimbe "{item_name}". Contactează-l pentru detalii!',
    action_url: '/chat?with={accepter_id}',
    icon: '✅',
    priority: 'urgent'
  },
  swap_declined: {
    type: 'swap_declined',
    title_template: '❌ Cerere refuzată',
    message_template: '{decliner_name} a refuzat cererea de schimb pentru "{item_name}"',
    action_url: '/obiecte',
    icon: '❌',
    priority: 'medium'
  },
  swap_completed: {
    type: 'swap_completed',
    title_template: '🎉 Schimb finalizat!',
    message_template: 'Felicitări! Schimbul cu {partner_name} a fost finalizat cu succes.',
    action_url: '/profil',
    icon: '🎉',
    priority: 'high'
  },
  welcome: {
    type: 'welcome',
    title_template: '👋 Bun venit la Swaply!',
    message_template: 'Explorează mii de obiecte și începe primul tău schimb. Adaugă-ți primul obiect!',
    action_url: '/obiecte/nou',
    icon: '👋',
    priority: 'medium'
  },
  rating: {
    type: 'rating',
    title_template: '⭐ Evaluează schimbul',
    message_template: 'Cum a fost experiența cu {partner_name}? Ajută comunitatea cu review-ul tău.',
    action_url: '/rating?swap={swap_id}',
    icon: '⭐',
    priority: 'medium'
  },
  travel: {
    type: 'travel',
    title_template: '✈️ Destinații pentru schimb',
    message_template: 'Am găsit {destination_count} destinații perfecte pentru schimbul cu {partner_name}!',
    action_url: '/travel?swap={swap_id}',
    icon: '✈️',
    priority: 'low'
  },
  achievement: {
    type: 'achievement',
    title_template: '🏆 Achievement deblocat!',
    message_template: 'Felicitări! Ai deblocat "{achievement_name}" - {achievement_description}',
    action_url: '/profil/achievements',
    icon: '🏆',
    priority: 'medium'
  },
  reminder: {
    type: 'reminder',
    title_template: '⏰ Nu uita!',
    message_template: '{reminder_text}',
    action_url: '{reminder_url}',
    icon: '⏰',
    priority: 'medium'
  },
  promotional: {
    type: 'promotional',
    title_template: '🎁 {promo_title}',
    message_template: '{promo_message}',
    action_url: '{promo_url}',
    icon: '🎁',
    priority: 'low'
  },
  system: {
    type: 'system',
    title_template: '🔧 {system_title}',
    message_template: '{system_message}',
    action_url: '/info',
    icon: '🔧',
    priority: 'medium'
  },
  feedback: {
    type: 'feedback',
    title_template: '📝 Spune-ne părerea!',
    message_template: 'Te rugăm să ne ajuți să îmbunătățim Swaply cu feedback-ul tău.',
    action_url: '/contact',
    icon: '📝',
    priority: 'low'
  }
};

// Template string replacement utility
function replaceTemplate(template: string, data: Record<string, any>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return data[key]?.toString() || match;
  });
}

// Notification creator functions
export class NotificationCreator {
  static createMatchNotification(
    userId: string, 
    data: { 
      count: number; 
      desired_item: string; 
      match_ids: string[] 
    }
  ): RichNotification {
    const template = NOTIFICATION_TEMPLATES.match;
    
    return {
      id: crypto.randomUUID(),
      user_id: userId,
      type: 'match',
      title: template.title_template,
      message: replaceTemplate(template.message_template, data),
      data: { match_ids: data.match_ids },
      read: false,
      priority: template.priority,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      actions: [
        {
          id: 'view_matches',
          label: 'Vezi potrivirile',
          action_type: 'navigate',
          url: '/match'
        },
        {
          id: 'dismiss',
          label: 'Respinge',
          action_type: 'dismiss'
        }
      ],
      badge_count: data.count
    };
  }

  static createMessageNotification(
    userId: string,
    data: {
      sender_id: string;
      sender_name: string;
      message_preview: string;
      chat_id: string;
    }
  ): RichNotification {
    const template = NOTIFICATION_TEMPLATES.message;
    
    return {
      id: crypto.randomUUID(),
      user_id: userId,
      type: 'message',
      title: replaceTemplate(template.title_template, data),
      message: data.message_preview.substring(0, 100) + (data.message_preview.length > 100 ? '...' : ''),
      data: { sender_id: data.sender_id, chat_id: data.chat_id },
      read: false,
      priority: template.priority,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tag: `chat_${data.chat_id}`,
      actions: [
        {
          id: 'reply',
          label: 'Răspunde',
          action_type: 'navigate',
          url: `/chat?with=${data.sender_id}`
        },
        {
          id: 'mark_read',
          label: 'Marchează citit',
          action_type: 'api_call',
          api_endpoint: '/api/notifications/mark-read',
          method: 'POST'
        }
      ]
    };
  }

  static createSwapRequestNotification(
    userId: string,
    data: {
      requester_id: string;
      requester_name: string;
      requested_item: string;
      offered_item: string;
      swap_request_id: string;
    }
  ): RichNotification {
    const template = NOTIFICATION_TEMPLATES.swap_request;
    
    return {
      id: crypto.randomUUID(),
      user_id: userId,
      type: 'swap_request',
      title: template.title_template,
      message: replaceTemplate(template.message_template, data),
      data: { 
        requester_id: data.requester_id, 
        swap_request_id: data.swap_request_id 
      },
      read: false,
      priority: template.priority,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      actions: [
        {
          id: 'accept',
          label: 'Acceptă',
          action_type: 'api_call',
          api_endpoint: '/api/swaps/accept',
          method: 'POST',
          payload: { swap_request_id: data.swap_request_id }
        },
        {
          id: 'decline',
          label: 'Refuză',
          action_type: 'api_call',
          api_endpoint: '/api/swaps/decline', 
          method: 'POST',
          payload: { swap_request_id: data.swap_request_id }
        },
        {
          id: 'view_details',
          label: 'Vezi detalii',
          action_type: 'navigate',
          url: '/cereri'
        }
      ]
    };
  }

  static createSwapAcceptedNotification(
    userId: string,
    data: {
      accepter_id: string;
      accepter_name: string;
      item_name: string;
      swap_id: string;
    }
  ): RichNotification {
    const template = NOTIFICATION_TEMPLATES.swap_accepted;
    
    return {
      id: crypto.randomUUID(),
      user_id: userId,
      type: 'swap_accepted',
      title: template.title_template,
      message: replaceTemplate(template.message_template, data),
      data: { accepter_id: data.accepter_id, swap_id: data.swap_id },
      read: false,
      priority: template.priority,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      actions: [
        {
          id: 'start_chat',
          label: 'Începe chat',
          action_type: 'navigate',
          url: `/chat?with=${data.accepter_id}`
        },
        {
          id: 'view_swap',
          label: 'Vezi schimbul',
          action_type: 'navigate',
          url: `/swap/${data.swap_id}`
        }
      ]
    };
  }

  static createAchievementNotification(
    userId: string,
    data: {
      achievement_name: string;
      achievement_description: string;
      achievement_icon: string;
      achievement_id: string;
    }
  ): RichNotification {
    const template = NOTIFICATION_TEMPLATES.achievement;
    
    return {
      id: crypto.randomUUID(),
      user_id: userId,
      type: 'achievement',
      title: template.title_template,
      message: replaceTemplate(template.message_template, data),
      data: { achievement_id: data.achievement_id },
      read: false,
      priority: template.priority,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      actions: [
        {
          id: 'view_achievements',
          label: 'Vezi toate',
          action_type: 'navigate',
          url: '/profil/achievements'
        },
        {
          id: 'share',
          label: 'Distribuie',
          action_type: 'api_call',
          api_endpoint: '/api/achievements/share',
          method: 'POST',
          payload: { achievement_id: data.achievement_id }
        }
      ]
    };
  }

  static createReminderNotification(
    userId: string,
    data: {
      reminder_text: string;
      reminder_url?: string;
      reminder_type: 'response' | 'rating' | 'profile' | 'general';
    }
  ): RichNotification {
    const template = NOTIFICATION_TEMPLATES.reminder;
    
    return {
      id: crypto.randomUUID(),
      user_id: userId,
      type: 'reminder',
      title: template.title_template,
      message: data.reminder_text,
      data: { reminder_type: data.reminder_type },
      read: false,
      priority: template.priority,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      actions: data.reminder_url ? [
        {
          id: 'action',
          label: 'Vezi',
          action_type: 'navigate',
          url: data.reminder_url
        }
      ] : undefined
    };
  }
}

// Default notification preferences for new users
export const DEFAULT_PREFERENCES: Omit<NotificationPreferences, 'user_id' | 'created_at' | 'updated_at'> = {
  push_enabled: true,
  email_enabled: false,
  in_app_enabled: true,
  types: {
    match: true,
    message: true,
    swap_request: true,
    swap_accepted: true,
    swap_declined: true,
    swap_completed: true,
    welcome: true,
    rating: true,
    travel: false,
    achievement: true,
    reminder: true,
    promotional: false,
    system: true,
    feedback: false
  },
  quiet_hours: {
    enabled: true,
    start_time: '22:00',
    end_time: '08:00'
  }
};