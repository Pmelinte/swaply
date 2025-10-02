import { getServerSupabase } from '@/lib/supabase/server';

interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type: 'match' | 'message' | 'swap_request' | 'system';
  data?: any;
}

export async function createNotification({
  userId,
  title,
  message,
  type,
  data
}: CreateNotificationParams) {
  try {
    const supabase = await getServerSupabase();
    
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        message,
        type,
        data,
        read: false
      });

    if (error) {
      console.error('Error creating notification:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error creating notification:', error);
    return false;
  }
}

// Specific notification creators
export async function notifyNewMatch(userId: string, matchData: any) {
  return createNotification({
    userId,
    title: 'Potrivire nouă găsită! 🎯',
    message: `Am găsit o potrivire perfectă pentru obiectul tău "${matchData.objectName}". Verifică acum!`,
    type: 'match',
    data: matchData
  });
}

export async function notifyNewMessage(userId: string, senderName: string, swapTitle: string) {
  return createNotification({
    userId,
    title: 'Mesaj nou 💬',
    message: `${senderName} ți-a trimis un mesaj despre "${swapTitle}".`,
    type: 'message',
    data: { senderName, swapTitle }
  });
}

export async function notifySwapRequest(userId: string, requesterName: string, objectName: string) {
  return createNotification({
    userId,
    title: 'Cerere de schimb nouă 🔄',
    message: `${requesterName} vrea să facă schimb pentru "${objectName}". Răspunde cât mai curând!`,
    type: 'swap_request',
    data: { requesterName, objectName }
  });
}

export async function notifySwapAccepted(userId: string, accepterName: string, objectName: string) {
  return createNotification({
    userId,
    title: 'Schimb acceptat! ✅',
    message: `${accepterName} a acceptat schimbul pentru "${objectName}". Coordonează detaliile!`,
    type: 'swap_request',
    data: { accepterName, objectName }
  });
}

export async function notifySwapRejected(userId: string, objectName: string) {
  return createNotification({
    userId,
    title: 'Schimb respins 😔',
    message: `Din păcate, cererea ta de schimb pentru "${objectName}" a fost respinsă.`,
    type: 'swap_request',
    data: { objectName }
  });
}

export async function notifyTravelSuggestion(userId: string, destination: string, matchCount: number) {
  return createNotification({
    userId,
    title: 'Sugestie de călătorie ✈️',
    message: `Am găsit ${matchCount} potriviri în ${destination}! Planifică o călătorie și fă schimburi unice.`,
    type: 'system',
    data: { destination, matchCount }
  });
}

export async function notifySystemUpdate(userId: string, title: string, message: string) {
  return createNotification({
    userId,
    title,
    message,
    type: 'system'
  });
}

// Bulk notifications
export async function notifyMultipleUsers(userIds: string[], notification: Omit<CreateNotificationParams, 'userId'>) {
  const promises = userIds.map(userId => 
    createNotification({ ...notification, userId })
  );
  
  const results = await Promise.allSettled(promises);
  const successCount = results.filter(r => r.status === 'fulfilled' && r.value).length;
  
  return {
    total: userIds.length,
    success: successCount,
    failed: userIds.length - successCount
  };
}