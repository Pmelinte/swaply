import { 
  notifyWelcome,
  notifyNewMatch,
  notifySwapRequest,
  notifyNewMessage,
  notifyFirstSwapAchievement,
  notifyRatingReminder,
  notifyWeeklyMatches,
  notifyPromotionalEvent,
  notifyObjectInterest,
  notifyTravelSuggestion
} from '@/lib/notifications';

/**
 * Generează notificări demo pentru a popula sistemul și demonstra diversitatea
 */
export async function generateDemoNotifications(userId: string) {
  const notifications = [
    // Welcome notification
    () => notifyWelcome(userId, 'Alexandru'),
    
    // Match notifications
    () => notifyNewMatch(userId, { 
      objectName: 'Canapea vintage din piele',
      matchScore: 95,
      partnerName: 'Maria D.'
    }),
    
    () => notifyNewMatch(userId, { 
      objectName: 'Bicicletă montană',
      matchScore: 87,
      partnerName: 'Andrei C.'
    }),
    
    // Swap request notifications
    () => notifySwapRequest(userId, 'Elena P.', 'Set de cărti de joc rare'),
    () => notifySwapRequest(userId, 'Mihai R.', 'Aparat foto vintage'),
    
    // Message notifications
    () => notifyNewMessage(userId, 'Diana M.', 'Schimb smartphone'),
    () => notifyNewMessage(userId, 'Radu T.', 'Cărți de programare'),
    
    // Achievement notification
    () => notifyFirstSwapAchievement(userId),
    
    // Rating reminders
    () => notifyRatingReminder(userId, 'Ana V.', 'Boxe wireless'),
    () => notifyRatingReminder(userId, 'Cristian L.', 'Plantă suculentă'),
    
    // Weekly report
    () => notifyWeeklyMatches(userId, 12),
    
    // Object interest
    () => notifyObjectInterest(userId, 'Chitară electrică Fender', 8),
    () => notifyObjectInterest(userId, 'Mașină de cafea espresso', 5),
    
    // Travel suggestions
    () => notifyTravelSuggestion(userId, 'București', 15),
    () => notifyTravelSuggestion(userId, 'Cluj-Napoca', 8),
    
    // Promotional events
    () => notifyPromotionalEvent(userId, 'Luna Schimburilor Verzi', '20%'),
    () => notifyPromotionalEvent(userId, 'Weekend Special Swaply'),
  ];

  // Generate notifications with small delays to simulate real-time arrival
  for (let i = 0; i < notifications.length; i++) {
    try {
      await notifications[i]();
      console.log(`Demo notification ${i + 1} created successfully`);
      
      // Small delay between notifications
      if (i < notifications.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error(`Error creating demo notification ${i + 1}:`, error);
    }
  }
  
  return {
    total: notifications.length,
    message: `${notifications.length} notificări demo au fost create cu succes!`
  };
}

/**
 * Șterge toate notificările pentru un utilizator (pentru curățare)
 */
export async function clearAllNotifications(userId: string) {
  try {
    const { getServerSupabase } = await import('@/lib/supabase/server');
    const supabase = await getServerSupabase();
    
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId);
      
    if (error) throw error;
    
    return { success: true, message: 'Toate notificările au fost șterse.' };
  } catch (error) {
    console.error('Error clearing notifications:', error);
    return { success: false, message: 'Eroare la ștergerea notificărilor.' };
  }
}