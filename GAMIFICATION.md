# Gamification System - Implementation Guide

## ✅ Implementation Complete

### Overview
Comprehensive gamification system with badges, achievements, XP points, and levels to increase user engagement and retention. Includes 14 pre-defined badges across 4 categories with automatic tracking and real-time notifications.

---

## 🎯 Features Implemented

### 1. **Badge System**
- **14 Pre-defined Badges** across 4 categories:
  - **Milestone**: First Swap, Swap Veteran, Swap Master, Swap Legend, Level achievements
  - **Social**: Collector, Curator, Merchant, Explorer
  - **Special**: Five Star, Trusted Trader, Early Adopter
- **4 Rarity Levels**: Common, Rare, Epic, Legendary
- **Automatic Badge Awarding**: Triggered by database events
- **Progress Tracking**: View progress on locked badges

### 2. **XP and Leveling System**
- **Activity-Based XP Rewards**:
  - Swap Completed: +100 XP
  - Object Posted: +25 XP
  - Review Given: +10 XP
  - Profile Completed: +50 XP
  - First Message: +5 XP
  - Daily Login: +10 XP
- **Level Calculation**: `level = floor(sqrt(xp / 100)) + 1`
- **Progress Bar**: Real-time XP progress with visual feedback
- **Level-Up Notifications**: Animated notifications on level advancement

### 3. **User Stats Dashboard**
- Total XP and current level
- Swaps completed
- Objects posted
- Average rating
- Reviews given/received
- Badge collection count

### 4. **Visual Components**
- `BadgeShowcase`: Display earned and available badges
- `LevelProgressBar`: XP progress with level display
- Rarity-based colors and animations
- Compact versions for header/navigation
- Real-time updates via Supabase subscriptions

---

## 🗄️ Database Schema

### Tables Created

#### `badge_types`
```sql
- id (UUID, PK)
- name (TEXT, UNIQUE) -- Identifier like 'first_swap'
- title_ro (TEXT) -- Romanian title
- title_en (TEXT) -- English title
- description_ro (TEXT)
- description_en (TEXT)
- icon (TEXT) -- Emoji or icon identifier
- category (TEXT) -- 'swap', 'social', 'milestone', 'special'
- rarity (TEXT) -- 'common', 'rare', 'epic', 'legendary'
- points (INTEGER) -- XP awarded
- requirement_type (TEXT) -- 'swap_count', 'objects_posted', 'rating_avg', 'level'
- requirement_value (INTEGER) -- Threshold
- created_at (TIMESTAMP)
```

#### `user_badges`
```sql
- id (UUID, PK)
- user_id (UUID, FK to auth.users)
- badge_type_id (UUID, FK to badge_types)
- earned_at (TIMESTAMP)
- progress (INTEGER) -- 0-100%
- notified (BOOLEAN) -- Notification sent
- UNIQUE(user_id, badge_type_id)
```

#### `user_levels`
```sql
- user_id (UUID, PK, FK to auth.users)
- total_xp (INTEGER)
- current_level (INTEGER)
- swaps_completed (INTEGER)
- objects_posted (INTEGER)
- reviews_given (INTEGER)
- reviews_received (INTEGER)
- average_rating (DECIMAL)
- updated_at (TIMESTAMP)
```

### Database Functions

#### `calculate_level(xp INTEGER) → INTEGER`
Calculates level from XP using formula: `floor(sqrt(xp / 100)) + 1`

#### `award_xp(user_id, xp_amount, activity) → (new_total_xp, new_level, level_up)`
Awards XP to user, updates level, and returns level-up status

#### `check_and_award_badges(user_id) → SETOF user_badges`
Checks all badge requirements and awards eligible badges

### Database Triggers

#### `trigger_check_badges_after_swap()`
- Triggers on `swap_requests` UPDATE when status changes to 'completed'
- Awards 100 XP to both users
- Increments swap count
- Checks for new badge achievements

#### `trigger_check_badges_after_object_posted()`
- Triggers on `objects` INSERT
- Awards 25 XP to user
- Increments object count
- Checks for new badge achievements

---

## 📊 Badge Definitions

### Milestone Badges
| Badge | Icon | Rarity | XP | Requirement |
|-------|------|--------|-----|-------------|
| Primul Swap | 🎉 | Common | 50 | 1 swap completed |
| Veteran al Schimburilor | ⭐ | Rare | 200 | 10 swaps completed |
| Maestru al Schimburilor | 🏆 | Epic | 1000 | 50 swaps completed |
| Legendă a Schimburilor | 👑 | Legendary | 5000 | 100 swaps completed |
| Nivel 5 | 🎖️ | Common | 100 | Reach level 5 |
| Nivel 10 | 💎 | Rare | 500 | Reach level 10 |
| Nivel 20 | 🌟 | Epic | 2000 | Reach level 20 |

### Social Badges
| Badge | Icon | Rarity | XP | Requirement |
|-------|------|--------|-----|-------------|
| Colecționar | 📦 | Common | 25 | 5 objects posted |
| Curator | 🎨 | Rare | 100 | 20 objects posted |
| Negustor | 🏪 | Epic | 500 | 50 objects posted |
| Explorator | 🗺️ | Rare | 300 | Swaps in 3 cities |

### Special Badges
| Badge | Icon | Rarity | XP | Requirement |
|-------|------|--------|-----|-------------|
| Cinci Stele | ⭐ | Epic | 500 | 5.0 average rating |
| Comerciant de Încredere | 🛡️ | Rare | 200 | 4.5+ average rating |
| Adoptator Timpuriu | 🚀 | Legendary | 1000 | First 100 users |

---

## 💻 Component Usage

### BadgeShowcase Component
```tsx
import BadgeShowcase from '@/components/BadgeShowcase';

// Full showcase (profile page)
<BadgeShowcase userId={userId} />

// Compact version (6 badges)
<BadgeShowcase userId={userId} compact={true} />
```

**Features**:
- Tabbed interface (Earned / Available)
- Rarity-based styling
- Progress bars for locked badges
- Earned date display
- Hover animations

### LevelProgressBar Component
```tsx
import LevelProgressBar from '@/components/LevelProgressBar';

// Full version with stats
<LevelProgressBar userId={userId} showDetails={true} />

// Compact version for header
<LevelProgressBar userId={userId} compact={true} />
```

**Features**:
- Animated progress bar
- Real-time XP updates
- Level-up animations
- Detailed stats grid
- Next level preview

---

## 🎨 Styling System

### Rarity Colors
```typescript
const RARITY_COLORS = {
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
```

### Category Colors
```typescript
const CATEGORY_COLORS = {
  milestone: 'bg-gradient-to-br from-blue-500 to-blue-600',
  social: 'bg-gradient-to-br from-green-500 to-green-600',
  special: 'bg-gradient-to-br from-purple-500 to-purple-600',
  swap: 'bg-gradient-to-br from-orange-500 to-orange-600',
};
```

---

## 🔔 Notification System

### Badge Unlocked Notification
```typescript
import { showBadgeUnlockedNotification } from '@/lib/gamification';

showBadgeUnlockedNotification(badge, 'ro');
```

**Features**:
- Animated entrance (bounce-in)
- Auto-dismiss after 5 seconds
- Manual close button
- XP display
- Rarity styling

### Level Up Notification
```typescript
import { showLevelUpNotification } from '@/lib/gamification';

showLevelUpNotification(newLevel, 'ro');
```

**Features**:
- Gradient background
- Animated entrance
- Auto-dismiss after 5 seconds
- Congratulatory message

---

## 🚀 Integration Examples

### Award XP After Swap Completion
```typescript
// Server action in swap confirmation
import { getBrowserSupabase } from '@/lib/supabase/client';

const completeSwap = async (swapId: string) => {
  const supabase = getBrowserSupabase();
  
  // Update swap status (trigger will handle XP)
  await supabase
    .from('swap_requests')
    .update({ status: 'completed' })
    .eq('id', swapId);
  
  // Fetch new badges (if any)
  const { data: newBadges } = await supabase.rpc('check_and_award_badges', {
    p_user_id: userId
  });
  
  // Show notifications
  newBadges?.forEach(badge => {
    showBadgeUnlockedNotification(badge.badge_type, language);
  });
};
```

### Manual XP Award
```typescript
// Award XP for specific activity
const { data } = await supabase.rpc('award_xp', {
  p_user_id: userId,
  p_xp_amount: 50,
  p_activity: 'profile_completed'
});

if (data?.level_up) {
  showLevelUpNotification(data.new_level, language);
}
```

### Check Badge Progress
```typescript
import { getBadgeProgress } from '@/lib/gamification';

const progress = getBadgeProgress(userStats, badgeType);
console.log(`Progress: ${progress}%`);
```

---

## 🧪 Testing Checklist

### Database Tests
- [x] Badge types table created with 14 badges
- [x] User badges table with unique constraint
- [x] User levels table with XP tracking
- [x] `award_xp` function works correctly
- [x] `check_and_award_badges` function works
- [x] Triggers fire on swap completion
- [x] Triggers fire on object posting

### Component Tests
- [ ] BadgeShowcase loads earned badges
- [ ] BadgeShowcase shows locked badges
- [ ] Progress bars display correctly
- [ ] LevelProgressBar shows correct XP
- [ ] Real-time updates work
- [ ] Compact versions render correctly

### Functional Tests
- [ ] User earns badge on first swap
- [ ] Level increases when reaching XP threshold
- [ ] Badge notification appears
- [ ] Level-up notification appears
- [ ] Multiple badges can be earned at once
- [ ] Progress tracking updates in real-time

### Edge Cases
- [ ] User with no XP (new account)
- [ ] User reaches max level
- [ ] Badge already earned (no duplicate)
- [ ] Negative XP (should not be possible)
- [ ] Concurrent badge awards

---

## 📈 Analytics & Metrics

### Key Metrics to Track
- **Badge Distribution**: % of users with each badge
- **Average Level**: Mean user level
- **XP Velocity**: XP earned per day/week
- **Engagement**: Correlation between level and activity
- **Badge Completion**: % users who earned all badges

### Queries for Analytics
```sql
-- Badge distribution
SELECT bt.name, COUNT(ub.id) as earned_count
FROM badge_types bt
LEFT JOIN user_badges ub ON bt.id = ub.badge_type_id
GROUP BY bt.id, bt.name
ORDER BY earned_count DESC;

-- Average user level
SELECT AVG(current_level) as avg_level, AVG(total_xp) as avg_xp
FROM user_levels;

-- Top users leaderboard
SELECT user_id, total_xp, current_level, swaps_completed
FROM user_levels
ORDER BY total_xp DESC
LIMIT 10;

-- Badge completion rate
SELECT 
  COUNT(DISTINCT user_id) as total_users,
  COUNT(DISTINCT user_id) FILTER (WHERE badge_count = 14) as completed_users
FROM (
  SELECT user_id, COUNT(*) as badge_count
  FROM user_badges
  GROUP BY user_id
) subquery;
```

---

## 🔮 Future Enhancements

### Potential Additions
1. **Daily/Weekly Challenges**: Time-limited objectives for bonus XP
2. **Leaderboards**: Global and friend leaderboards
3. **Seasonal Badges**: Limited-time badges for events
4. **Badge Collections**: Group badges into sets with completion bonuses
5. **Prestige System**: Reset level for exclusive rewards
6. **Custom Badges**: User-created badges for communities
7. **Badge Sharing**: Share achievements on social media
8. **XP Multipliers**: Temporary boosts from streaks or events
9. **Achievement Paths**: Guided progression systems
10. **NFT Badges**: Blockchain-backed badge ownership (Web3)

### Advanced Features
```typescript
// Daily challenge example
interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  requirement: string;
  xp_reward: number;
  expires_at: string;
}

// Leaderboard example
interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  total_xp: number;
  level: number;
  badges_earned: number;
}
```

---

## 📚 Resources

### Related Files
- `database/migrations/004_gamification_system.sql` - Schema and functions
- `src/lib/gamification/index.ts` - Core gamification library
- `src/components/BadgeShowcase.tsx` - Badge display component
- `src/components/LevelProgressBar.tsx` - XP/Level component

### External Resources
- [Gamification Design Patterns](https://www.interaction-design.org/literature/article/gamification-designing-for-motivation)
- [XP System Design](https://gamedev.stackexchange.com/questions/13638/what-is-the-most-efficient-xp-curve)
- [Badge System Best Practices](https://uxdesign.cc/gamification-in-ux-design-d7db23d8b7e6)

---

## 🎉 Success Criteria

- ✅ 14 badges defined and seeded in database
- ✅ XP system with automatic awarding
- ✅ Level calculation and progression
- ✅ Badge showcase component with earned/available tabs
- ✅ Level progress bar with real-time updates
- ✅ Automatic badge checking on triggers
- ✅ Notification system for badges and level-ups
- ✅ Progress tracking for locked badges
- ✅ Rarity-based styling system
- ✅ Bilingual support (Romanian/English)

---

**Implementation Time**: ~60 minutes  
**Status**: ✅ Complete  
**Branch**: `feature/gamification-system`  
**Database Migration**: `004_gamification_system.sql`

---

*Last Updated: 2024 - Swaply Platform*
