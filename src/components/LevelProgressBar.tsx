'use client';

import { useState, useEffect } from 'react';
import { getBrowserSupabase } from '@/lib/supabase/client';
import { useI18n } from '@/lib/i18n';
import {
  UserLevel,
  calculateLevel,
  levelProgress,
  formatXP,
} from '@/lib/gamification';

interface LevelProgressBarProps {
  userId: string;
  showDetails?: boolean; // Show detailed stats
  compact?: boolean; // Compact version for header/nav
}

export default function LevelProgressBar({ 
  userId, 
  showDetails = false,
  compact = false 
}: LevelProgressBarProps) {
  const { language } = useI18n();
  const [userLevel, setUserLevel] = useState<UserLevel | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = getBrowserSupabase();

  useEffect(() => {
    loadUserLevel();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`user_level_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_levels',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          loadUserLevel();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const loadUserLevel = async () => {
    try {
      const { data, error } = await supabase
        .from('user_levels')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      setUserLevel(data || {
        user_id: userId,
        total_xp: 0,
        current_level: 1,
        swaps_completed: 0,
        objects_posted: 0,
        reviews_given: 0,
        reviews_received: 0,
        average_rating: null,
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error loading user level:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!userLevel) return null;

  const progress = levelProgress(userLevel.total_xp, userLevel.current_level);

  // Compact version for header/nav
  if (compact) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
        <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full text-white font-bold text-sm">
          {userLevel.current_level}
        </div>
        <div className="flex-1 min-w-20">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all"
              style={{ width: `${progress.progress}%` }}
            />
          </div>
        </div>
        <span className="text-xs font-medium text-gray-700">
          {formatXP(userLevel.total_xp)} XP
        </span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Level Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full text-white font-bold text-2xl shadow-lg">
            {userLevel.current_level}
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">
              {language === 'ro' ? 'Nivel' : 'Level'} {userLevel.current_level}
            </h3>
            <p className="text-sm text-gray-600">
              {formatXP(userLevel.total_xp)} XP {language === 'ro' ? 'total' : 'total'}
            </p>
          </div>
        </div>

        {/* Next Level Preview */}
        <div className="text-right">
          <p className="text-sm text-gray-600">
            {language === 'ro' ? 'Nivel următor' : 'Next level'}
          </p>
          <p className="text-lg font-bold text-blue-600">
            {formatXP(progress.nextLevelXP)} XP
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            {formatXP(userLevel.total_xp - progress.currentLevelXP)} / {formatXP(progress.nextLevelXP - progress.currentLevelXP)} XP
          </span>
          <span className="text-sm font-medium text-blue-600">
            {progress.progress}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 h-4 rounded-full transition-all duration-500 relative"
            style={{ width: `${progress.progress}%` }}
          >
            <div className="absolute inset-0 bg-white opacity-20 animate-pulse" />
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-1 text-right">
          {formatXP(progress.nextLevelXP - userLevel.total_xp)} XP {language === 'ro' ? 'până la nivel' : 'to level'} {userLevel.current_level + 1}
        </p>
      </div>

      {/* Detailed Stats */}
      {showDetails && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <div className="text-2xl mb-1">🔄</div>
            <p className="text-2xl font-bold text-blue-600">{userLevel.swaps_completed}</p>
            <p className="text-xs text-gray-600">
              {language === 'ro' ? 'Schimburi' : 'Swaps'}
            </p>
          </div>

          <div className="bg-green-50 rounded-lg p-3 text-center">
            <div className="text-2xl mb-1">📦</div>
            <p className="text-2xl font-bold text-green-600">{userLevel.objects_posted}</p>
            <p className="text-xs text-gray-600">
              {language === 'ro' ? 'Obiecte' : 'Objects'}
            </p>
          </div>

          <div className="bg-purple-50 rounded-lg p-3 text-center">
            <div className="text-2xl mb-1">⭐</div>
            <p className="text-2xl font-bold text-purple-600">
              {userLevel.average_rating ? userLevel.average_rating.toFixed(1) : '-'}
            </p>
            <p className="text-xs text-gray-600">
              {language === 'ro' ? 'Rating' : 'Rating'}
            </p>
          </div>

          <div className="bg-orange-50 rounded-lg p-3 text-center">
            <div className="text-2xl mb-1">💬</div>
            <p className="text-2xl font-bold text-orange-600">{userLevel.reviews_given}</p>
            <p className="text-xs text-gray-600">
              {language === 'ro' ? 'Review-uri' : 'Reviews'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
