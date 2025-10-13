'use client';

import { useState, useEffect } from 'react';
import { getBrowserSupabase } from '@/lib/supabase/client';
import { useI18n } from '@/lib/i18n';
import {
  UserBadge,
  BadgeType,
  UserLevel,
  RARITY_COLORS,
  CATEGORY_COLORS,
  sortBadges,
  getBadgeProgress,
} from '@/lib/gamification';

interface BadgeShowcaseProps {
  userId: string;
  compact?: boolean; // Show compact version (fewer badges)
}

export default function BadgeShowcase({ userId, compact = false }: BadgeShowcaseProps) {
  const { t, language } = useI18n();
  const [earnedBadges, setEarnedBadges] = useState<UserBadge[]>([]);
  const [availableBadges, setAvailableBadges] = useState<BadgeType[]>([]);
  const [userStats, setUserStats] = useState<UserLevel | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'earned' | 'available'>('earned');
  const supabase = getBrowserSupabase();

  useEffect(() => {
    loadBadges();
  }, [userId]);

  const loadBadges = async () => {
    try {
      // Load earned badges
      const { data: earned, error: earnedError } = await supabase
        .from('user_badges')
        .select(`
          *,
          badge_type:badge_types(*)
        `)
        .eq('user_id', userId);

      if (earnedError) throw earnedError;

      // Load all badge types
      const { data: available, error: availableError } = await supabase
        .from('badge_types')
        .select('*')
        .order('points', { ascending: false });

      if (availableError) throw availableError;

      // Load user stats
      const { data: stats, error: statsError } = await supabase
        .from('user_levels')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (statsError && statsError.code !== 'PGRST116') throw statsError;

      setEarnedBadges(sortBadges(earned || []));
      setAvailableBadges(available || []);
      setUserStats(stats);
    } catch (error) {
      console.error('Error loading badges:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBadgeTitle = (badge: BadgeType) => {
    return language === 'ro' ? badge.title_ro : badge.title_en;
  };

  const getBadgeDescription = (badge: BadgeType) => {
    return language === 'ro' ? badge.description_ro : badge.description_en;
  };

  const isBadgeEarned = (badgeTypeId: string) => {
    return earnedBadges.some(b => b.badge_type_id === badgeTypeId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const displayedEarnedBadges = compact ? earnedBadges.slice(0, 6) : earnedBadges;
  const displayedAvailableBadges = compact 
    ? availableBadges.filter(b => !isBadgeEarned(b.id)).slice(0, 6)
    : availableBadges.filter(b => !isBadgeEarned(b.id));

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {language === 'ro' ? '🏆 Insignele Mele' : '🏆 My Badges'}
        </h2>
        
        {!compact && (
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('earned')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'earned'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {language === 'ro' ? 'Câștigate' : 'Earned'} ({earnedBadges.length})
            </button>
            <button
              onClick={() => setActiveTab('available')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'available'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {language === 'ro' ? 'Disponibile' : 'Available'} ({availableBadges.length - earnedBadges.length})
            </button>
          </div>
        )}
      </div>

      {/* Earned Badges */}
      {(compact || activeTab === 'earned') && (
        <div>
          {earnedBadges.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {language === 'ro' ? 'Nicio insignă încă' : 'No badges yet'}
              </h3>
              <p className="text-gray-600">
                {language === 'ro' 
                  ? 'Completează schimburi pentru a câștiga prima insignă!'
                  : 'Complete swaps to earn your first badge!'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {displayedEarnedBadges.map((userBadge) => {
                const badge = userBadge.badge_type!;
                const rarity = RARITY_COLORS[badge.rarity];

                return (
                  <div
                    key={userBadge.id}
                    className={`
                      relative p-4 rounded-lg border-2 transition-transform hover:scale-105
                      ${rarity.bg} ${rarity.border} ${rarity.glow} shadow-lg
                    `}
                  >
                    {/* Badge Icon */}
                    <div className="text-5xl text-center mb-2">
                      {badge.icon}
                    </div>

                    {/* Badge Title */}
                    <h4 className={`text-sm font-bold text-center mb-1 ${rarity.text}`}>
                      {getBadgeTitle(badge)}
                    </h4>

                    {/* Badge Description */}
                    <p className="text-xs text-gray-600 text-center mb-2">
                      {getBadgeDescription(badge)}
                    </p>

                    {/* Badge Points */}
                    <div className="text-center">
                      <span className="inline-block px-2 py-1 bg-white rounded-full text-xs font-medium text-gray-700">
                        +{badge.points} XP
                      </span>
                    </div>

                    {/* Rarity Badge */}
                    <div className="absolute top-2 right-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${rarity.bg} ${rarity.text} font-medium`}>
                        {badge.rarity.toUpperCase()}
                      </span>
                    </div>

                    {/* Earned Date */}
                    <div className="text-xs text-gray-500 text-center mt-2">
                      {new Date(userBadge.earned_at).toLocaleDateString(language === 'ro' ? 'ro-RO' : 'en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {compact && earnedBadges.length > 6 && (
            <div className="text-center mt-4">
              <a href="/profil/insignele" className="text-blue-600 hover:text-blue-700 font-medium">
                {language === 'ro' ? `Vezi toate (${earnedBadges.length})` : `View all (${earnedBadges.length})`} →
              </a>
            </div>
          )}
        </div>
      )}

      {/* Available Badges */}
      {!compact && activeTab === 'available' && (
        <div>
          {displayedAvailableBadges.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {language === 'ro' ? 'Toate insignele câștigate!' : 'All badges earned!'}
              </h3>
              <p className="text-gray-600">
                {language === 'ro' 
                  ? 'Felicitări! Ai deblochat toate insignele disponibile!'
                  : 'Congratulations! You\'ve unlocked all available badges!'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {displayedAvailableBadges.map((badge) => {
                const progress = userStats ? getBadgeProgress(userStats, badge) : 0;
                const rarity = RARITY_COLORS[badge.rarity];

                return (
                  <div
                    key={badge.id}
                    className={`
                      relative p-4 rounded-lg border-2 opacity-60 hover:opacity-80 transition-opacity
                      ${rarity.bg} ${rarity.border}
                    `}
                  >
                    {/* Locked Overlay */}
                    <div className="absolute inset-0 bg-gray-900 bg-opacity-10 rounded-lg flex items-center justify-center">
                      <span className="text-4xl">🔒</span>
                    </div>

                    {/* Badge Icon (grayscale) */}
                    <div className="text-5xl text-center mb-2 filter grayscale">
                      {badge.icon}
                    </div>

                    {/* Badge Title */}
                    <h4 className={`text-sm font-bold text-center mb-1 ${rarity.text}`}>
                      {getBadgeTitle(badge)}
                    </h4>

                    {/* Badge Description */}
                    <p className="text-xs text-gray-600 text-center mb-2">
                      {getBadgeDescription(badge)}
                    </p>

                    {/* Progress Bar */}
                    {progress > 0 && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-600 text-center mt-1">{progress}%</p>
                      </div>
                    )}

                    {/* Badge Points */}
                    <div className="text-center mt-2">
                      <span className="inline-block px-2 py-1 bg-white rounded-full text-xs font-medium text-gray-700">
                        +{badge.points} XP
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
