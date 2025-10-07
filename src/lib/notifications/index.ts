import { getServerSupabase } from '@/lib/supabase/server';

interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type: 'match' | 'message' | 'swap_request' | 'system' | 'welcome' | 'rating' | 'travel' | 'achievement' | 'reminder' | 'promotional';
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

export async function notifyWelcome(userId: string, userName: string) {
  return createNotification({
    userId,
    title: 'Bun venit la Swaply! 👋',
    message: `Salut ${userName}! Ești gata să începi primul schimb? Adaugă un obiect și descoperă potriviri unice.`,
    type: 'welcome',
    data: { userName }
  });
}

export async function notifyFirstSwapAchievement(userId: string) {
  return createNotification({
    userId,
    title: 'Primul schimb realizat! 🏆',
    message: 'Felicitări! Ai completat primul tău schimb pe Swaply. Continuă să explorezi și să faci schimburi unice!',
    type: 'achievement',
    data: { achievement: 'first_swap' }
  });
}

export async function notifyRatingReminder(userId: string, swapPartner: string, objectName: string) {
  return createNotification({
    userId,
    title: 'Evaluează experiența ⭐',
    message: `Cum a fost schimbul cu ${swapPartner} pentru "${objectName}"? Lasă o evaluare pentru a ajuta comunitatea.`,
    type: 'rating',
    data: { swapPartner, objectName }
  });
}

export async function notifyWeeklyMatches(userId: string, matchCount: number) {
  return createNotification({
    userId,
    title: 'Raport săptămânal 📊',
    message: `Această săptămână am găsit ${matchCount} potriviri noi pentru obiectele tale. Vezi ce oportunități îți oferă!`,
    type: 'system',
    data: { matchCount, period: 'weekly' }
  });
}

export async function notifyPromotionalEvent(userId: string, eventName: string, discount?: string) {
  return createNotification({
    userId,
    title: `🎉 ${eventName}`,
    message: discount 
      ? `Nu rata oferta specială! ${discount} reducere la serviciile premium până la sfârșitul lunii.`
      : 'Eveniment special în curs! Descoperă funcționalități noi și oportunități exclusive.',
    type: 'promotional',
    data: { eventName, discount }
  });
}

export async function notifyObjectInterest(userId: string, objectName: string, interestedCount: number) {
  return createNotification({
    userId,
    title: 'Obiectul tău e popular! 🔥',
    message: `"${objectName}" a atras atenția! ${interestedCount} persoane sunt interesate de un schimb.`,
    type: 'system',
    data: { objectName, interestedCount }
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