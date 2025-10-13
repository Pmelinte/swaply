// Gamification System Library
// Badge definitions, XP calculations, and achievement tracking

export interface BadgeType {
  id: string;
  name: string;
  title_ro: string;
  title_en: string;
  description_ro: string;
  description_en: string;
  icon: string;
  category: 'milestone' | 'social' | 'special' | 'swap';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number;
  requirement_type: 'swap_count' | 'objects_posted' | 'rating_avg' | 'level';
  requirement_value: number;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_type_id: string;
  earned_at: string;
  progress: number;
  notified: boolean;
  badge_type?: BadgeType;
}

export interface UserLevel {
  user_id: string;
  total_xp: number;
  current_level: number;
  swaps_completed: number;
  objects_posted: number;
  reviews_given: number;
  reviews_received: number;
  average_rating: number | null;
  updated_at: string;
}

export interface XPActivity {
  activity: string;
  xp: number;
  icon: string;
}

// XP Activities and Rewards
export const XP_REWARDS: Record<string, XPActivity> = {
  SWAP_COMPLETED: { activity: 'Swap finalizat', xp: 100, icon: '🔄' },
  OBJECT_POSTED: { activity: 'Obiect adăugat', xp: 25, icon: '📦' },
  REVIEW_GIVEN: { activity: 'Review dat', xp: 10, icon: '⭐' },
  PROFILE_COMPLETED: { activity: 'Profil completat', xp: 50, icon: '👤' },
  FIRST_MESSAGE: { activity: 'Prim mesaj trimis', xp: 5, icon: '💬' },
  DAILY_LOGIN: { activity: 'Login zilnic', xp: 10, icon: '📅' },
};

// Level calculation
export function calculateLevel(xp: number): number {
  // Level formula: level = floor(sqrt(xp / 100)) + 1
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

// XP needed for next level
export function xpForNextLevel(currentLevel: number): number {
  // Inverse of level formula: xp = (level - 1)^2 * 100
  return Math.pow(currentLevel, 2) * 100;
}

// Progress to next level
export function levelProgress(currentXP: number, currentLevel: number): {
  currentLevelXP: number;
  nextLevelXP: number;
  progress: number; // 0-100
} {
  const currentLevelXP = xpForNextLevel(currentLevel - 1);
  const nextLevelXP = xpForNextLevel(currentLevel);
  const xpInCurrentLevel = currentXP - currentLevelXP;
  const xpNeededForLevel = nextLevelXP - currentLevelXP;
  const progress = Math.min(100, Math.round((xpInCurrentLevel / xpNeededForLevel) * 100));

  return {
    currentLevelXP,
    nextLevelXP,
    progress,
  };
}

// Rarity colors for badges
export const RARITY_COLORS = {
  common: {
    bg: 'bg-gray-100',
    border: 'border-gray-300',
    text: 'text-gray-700',
    glow: 'shadow-gray-200',
  },
  rare: {
    bg: 'bg-blue-50',
    border: 'border-blue-300',
    text: 'text-blue-700',
    glow: 'shadow-blue-200',
  },
  epic: {
    bg: 'bg-purple-50',
    border: 'border-purple-300',
    text: 'text-purple-700',
    glow: 'shadow-purple-200',
  },
  legendary: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-300',
    text: 'text-yellow-700',
    glow: 'shadow-yellow-200',
  },
};

// Badge category colors
export const CATEGORY_COLORS = {
  milestone: 'bg-gradient-to-br from-blue-500 to-blue-600',
  social: 'bg-gradient-to-br from-green-500 to-green-600',
  special: 'bg-gradient-to-br from-purple-500 to-purple-600',
  swap: 'bg-gradient-to-br from-orange-500 to-orange-600',
};

// Badge unlocked animation
export function showBadgeUnlockedNotification(badge: BadgeType, language: 'ro' | 'en' = 'ro') {
  const title = language === 'ro' ? badge.title_ro : badge.title_en;
  const description = language === 'ro' ? badge.description_ro : badge.description_en;

  // Create notification element
  const notification = document.createElement('div');
  notification.className = `
    fixed top-4 right-4 z-50 
    bg-white rounded-lg shadow-2xl border-2 border-yellow-300
    p-4 max-w-sm
    animate-bounce-in
  `;

  notification.innerHTML = `
    <div class="flex items-start space-x-3">
      <div class="flex-shrink-0 text-4xl">
        ${badge.icon}
      </div>
      <div class="flex-1">
        <p class="text-sm font-medium text-gray-900">
          ${language === 'ro' ? '🎉 Insignă Nouă Deblochată!' : '🎉 New Badge Unlocked!'}
        </p>
        <h4 class="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-orange-600">
          ${title}
        </h4>
        <p class="text-sm text-gray-600">${description}</p>
        <p class="text-xs text-gray-500 mt-1">+${badge.points} XP</p>
      </div>
      <button class="text-gray-400 hover:text-gray-600" onclick="this.parentElement.parentElement.remove()">
        ✕
      </button>
    </div>
  `;

  document.body.appendChild(notification);

  // Auto-remove after 5 seconds
  setTimeout(() => {
    notification.remove();
  }, 5000);
}

// Level up animation
export function showLevelUpNotification(newLevel: number, language: 'ro' | 'en' = 'ro') {
  const title = language === 'ro' ? `Nivel ${newLevel} Atins!` : `Level ${newLevel} Reached!`;
  const description = language === 'ro' 
    ? 'Continuă să faci schimburi pentru a avansa!'
    : 'Keep swapping to advance!';

  const notification = document.createElement('div');
  notification.className = `
    fixed top-4 right-4 z-50 
    bg-gradient-to-br from-blue-500 to-purple-600 
    rounded-lg shadow-2xl
    p-4 max-w-sm text-white
    animate-bounce-in
  `;

  notification.innerHTML = `
    <div class="flex items-start space-x-3">
      <div class="flex-shrink-0 text-4xl">
        🎖️
      </div>
      <div class="flex-1">
        <p class="text-sm font-medium opacity-90">
          ${language === 'ro' ? '⬆️ Level Up!' : '⬆️ Level Up!'}
        </p>
        <h4 class="text-2xl font-bold">
          ${title}
        </h4>
        <p class="text-sm opacity-90">${description}</p>
      </div>
      <button class="text-white opacity-70 hover:opacity-100" onclick="this.parentElement.parentElement.remove()">
        ✕
      </button>
    </div>
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 5000);
}

// Format XP with thousand separators
export function formatXP(xp: number): string {
  return xp.toLocaleString('ro-RO');
}

// Get badge progress (for badges in progress)
export function getBadgeProgress(
  userStats: UserLevel,
  badgeType: BadgeType
): number {
  switch (badgeType.requirement_type) {
    case 'swap_count':
      return Math.min(100, Math.round((userStats.swaps_completed / badgeType.requirement_value) * 100));
    case 'objects_posted':
      return Math.min(100, Math.round((userStats.objects_posted / badgeType.requirement_value) * 100));
    case 'rating_avg':
      const targetRating = badgeType.requirement_value / 10;
      const currentRating = userStats.average_rating || 0;
      return Math.min(100, Math.round((currentRating / targetRating) * 100));
    case 'level':
      return Math.min(100, Math.round((userStats.current_level / badgeType.requirement_value) * 100));
    default:
      return 0;
  }
}

// Sort badges by rarity and earned date
export function sortBadges(badges: UserBadge[]): UserBadge[] {
  const rarityOrder = { legendary: 0, epic: 1, rare: 2, common: 3 };
  
  return badges.sort((a, b) => {
    const rarityA = rarityOrder[a.badge_type?.rarity || 'common'];
    const rarityB = rarityOrder[b.badge_type?.rarity || 'common'];
    
    if (rarityA !== rarityB) {
      return rarityA - rarityB;
    }
    
    return new Date(b.earned_at).getTime() - new Date(a.earned_at).getTime();
  });
}
