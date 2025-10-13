/**
 * Personalization Library
 * User interest tracking, recommendations, collections, and preferences
 */

import { createClient } from '@/lib/supabase/client';

// ============================================================================
// TYPES
// ============================================================================

export interface UserInterest {
  id: string;
  user_id: string;
  category_id: string;
  interest_score: number;
  confidence: number;
  from_onboarding: boolean;
  from_objects_posted: number;
  from_objects_viewed: number;
  from_searches: number;
  from_swaps_completed: number;
  first_signal_at: string;
  last_signal_at: string;
  decay_rate: number;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  
  // Notifications
  notify_new_matches: boolean;
  notify_messages: boolean;
  notify_swap_updates: boolean;
  notify_promotions: boolean;
  quiet_hours: QuietHour[];
  
  // Categories
  preferred_categories: string[];
  muted_categories: string[];
  
  // Feed
  feed_algorithm: 'balanced' | 'popular' | 'personalized' | 'recent';
  show_nearby_first: boolean;
  max_feed_distance_km: number;
  
  // Privacy
  show_location_publicly: boolean;
  show_online_status: boolean;
  allow_ai_recommendations: boolean;
  
  // Onboarding
  onboarding_completed: boolean;
  onboarding_completed_at: string | null;
  onboarding_skipped: boolean;
  
  // Continue Context
  last_viewed_object_id: string | null;
  last_viewed_at: string | null;
  last_search_query: string | null;
  last_search_at: string | null;
  
  // UI
  language: string;
  theme: 'light' | 'dark' | 'system';
  compact_view: boolean;
  
  created_at: string;
  updated_at: string;
}

export interface QuietHour {
  start: string; // "22:00"
  end: string;   // "08:00"
  days: number[]; // [0,1,2,3,4,5,6] (0=Sunday)
}

export interface UserCollection {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  object_ids: string[];
  object_count: number;
  is_public: boolean;
  shared_with: string[];
  is_auto_collection: boolean;
  auto_criteria: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface PersonalizationEvent {
  id?: string;
  user_id: string;
  event_type: 'object_view' | 'object_like' | 'search' | 'category_browse' | 
              'match_accept' | 'swap_complete' | 'collection_add' | 'onboarding_answer';
  object_id?: string;
  category_id?: string;
  search_query?: string;
  event_data?: Record<string, any>;
  interest_signals?: Record<string, any>;
  session_id?: string;
  time_spent_seconds?: number;
}

export interface OnboardingResponses {
  id?: string;
  user_id: string;
  purpose: 'declutter' | 'find_items' | 'eco_friendly' | 'save_money' | 'community';
  interested_categories: string[];
  value_range_min: number | null;
  value_range_max: number | null;
  max_distance_km: number;
  swap_frequency: 'daily' | 'weekly' | 'monthly' | 'occasionally';
  discovered_via: string | null;
  additional_notes: string | null;
}

export interface PersonalizedRecommendation {
  object_id: string;
  title: string;
  category_id: string;
  interest_score: number;
  match_score: number;
  match_reasons: string[];
}

export interface InterestSummary {
  category_id: string;
  category_name: string;
  interest_score: number;
  confidence: number;
  signal_sources: {
    onboarding: boolean;
    posted: number;
    viewed: number;
    searches: number;
    swaps: number;
  };
  last_signal_at: string;
}

export interface ContinueContext {
  last_viewed_object: {
    id: string | null;
    viewed_at: string | null;
  };
  last_search: {
    query: string | null;
    searched_at: string | null;
  };
  has_context: boolean;
}

// ============================================================================
// USER INTERESTS
// ============================================================================

/**
 * Get user's interests
 */
export async function getUserInterests(
  userId: string,
  minScore: number = 0
): Promise<UserInterest[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('user_interests')
    .select('*')
    .eq('user_id', userId)
    .gte('interest_score', minScore)
    .order('interest_score', { ascending: false });

  if (error) {
    console.error('Error fetching user interests:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get user interest summary with category details
 */
export async function getUserInterestSummary(
  userId: string,
  limit: number = 10
): Promise<InterestSummary[]> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc('get_user_interest_summary', {
    p_user_id: userId,
    p_limit: limit,
  });

  if (error) {
    console.error('Error fetching interest summary:', error);
    throw error;
  }

  return data || [];
}

/**
 * Update interest score for a category
 */
export async function updateInterestScore(
  userId: string,
  categoryId: string,
  signalType: 'onboarding' | 'object_posted' | 'object_viewed' | 'search' | 'swap_completed',
  increment: number = 5.0
): Promise<number> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc('update_interest_score', {
    p_user_id: userId,
    p_category_id: categoryId,
    p_signal_type: signalType,
    p_increment: increment,
  });

  if (error) {
    console.error('Error updating interest score:', error);
    throw error;
  }

  return data;
}

/**
 * Track object view and update interests
 */
export async function trackObjectView(
  userId: string,
  objectId: string,
  categoryId: string,
  timeSpentSeconds: number = 0
): Promise<void> {
  // Update interest score
  await updateInterestScore(userId, categoryId, 'object_viewed', 3.0);

  // Record event
  await trackPersonalizationEvent({
    user_id: userId,
    event_type: 'object_view',
    object_id: objectId,
    category_id: categoryId,
    time_spent_seconds: timeSpentSeconds,
    interest_signals: {
      categories: [categoryId],
    },
  });

  // Update last viewed in preferences
  await updateLastViewed(userId, objectId);
}

/**
 * Track search and update interests
 */
export async function trackSearch(
  userId: string,
  query: string,
  categoryIds: string[] = []
): Promise<void> {
  // Update interests for searched categories
  for (const categoryId of categoryIds) {
    await updateInterestScore(userId, categoryId, 'search', 2.0);
  }

  // Record event
  await trackPersonalizationEvent({
    user_id: userId,
    event_type: 'search',
    search_query: query,
    interest_signals: {
      categories: categoryIds,
      keywords: query.toLowerCase().split(' '),
    },
  });

  // Update last search in preferences
  await updateLastSearch(userId, query);
}

// ============================================================================
// RECOMMENDATIONS
// ============================================================================

/**
 * Get personalized recommendations for user
 */
export async function getPersonalizedRecommendations(
  userId: string,
  limit: number = 20,
  offset: number = 0,
  excludeOwn: boolean = true
): Promise<PersonalizedRecommendation[]> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc('get_personalized_recommendations', {
    p_user_id: userId,
    p_limit: limit,
    p_offset: offset,
    p_exclude_own: excludeOwn,
  });

  if (error) {
    console.error('Error fetching recommendations:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get recommendations based on feed algorithm preference
 */
export async function getFeedRecommendations(
  userId: string,
  limit: number = 20
): Promise<PersonalizedRecommendation[]> {
  const preferences = await getUserPreferences(userId);

  if (!preferences?.allow_ai_recommendations) {
    // Fallback to recent items
    return getRecentObjects(limit);
  }

  switch (preferences.feed_algorithm) {
    case 'personalized':
      return getPersonalizedRecommendations(userId, limit);
    
    case 'popular':
      return getPopularObjects(limit);
    
    case 'recent':
      return getRecentObjects(limit);
    
    case 'balanced':
    default:
      // Mix of personalized and popular
      const [personalized, popular] = await Promise.all([
        getPersonalizedRecommendations(userId, limit / 2),
        getPopularObjects(limit / 2),
      ]);
      return [...personalized, ...popular];
  }
}

async function getRecentObjects(limit: number): Promise<PersonalizedRecommendation[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('objects')
    .select('id, title, category_id')
    .eq('status', 'available')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(limit);

  return (data || []).map(obj => ({
    object_id: obj.id,
    title: obj.title,
    category_id: obj.category_id,
    interest_score: 0,
    match_score: 50,
    match_reasons: ['Recently posted'],
  }));
}

async function getPopularObjects(limit: number): Promise<PersonalizedRecommendation[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('objects')
    .select('id, title, category_id')
    .eq('status', 'available')
    .is('deleted_at', null)
    .order('views_count', { ascending: false })
    .limit(limit);

  return (data || []).map(obj => ({
    object_id: obj.id,
    title: obj.title,
    category_id: obj.category_id,
    interest_score: 0,
    match_score: 60,
    match_reasons: ['Popular item'],
  }));
}

// ============================================================================
// USER PREFERENCES
// ============================================================================

/**
 * Get user preferences
 */
export async function getUserPreferences(
  userId: string
): Promise<UserPreferences | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching preferences:', error);
    throw error;
  }

  return data;
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(
  preferences: Partial<UserPreferences>
): Promise<UserPreferences> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('user_preferences')
    .upsert(preferences, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) {
    console.error('Error updating preferences:', error);
    throw error;
  }

  return data;
}

/**
 * Get default preferences for a user
 */
export function getDefaultPreferences(userId: string): Partial<UserPreferences> {
  return {
    user_id: userId,
    notify_new_matches: true,
    notify_messages: true,
    notify_swap_updates: true,
    notify_promotions: false,
    quiet_hours: [],
    preferred_categories: [],
    muted_categories: [],
    feed_algorithm: 'balanced',
    show_nearby_first: true,
    max_feed_distance_km: 500,
    show_location_publicly: true,
    show_online_status: true,
    allow_ai_recommendations: true,
    onboarding_completed: false,
    onboarding_skipped: false,
    language: 'ro',
    theme: 'system',
    compact_view: false,
  };
}

/**
 * Check if user is in quiet hours
 */
export async function isInQuietHours(userId: string): Promise<boolean> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc('is_in_quiet_hours', {
    p_user_id: userId,
  });

  if (error) {
    console.error('Error checking quiet hours:', error);
    return false;
  }

  return data || false;
}

/**
 * Update last viewed object
 */
async function updateLastViewed(userId: string, objectId: string): Promise<void> {
  await updateUserPreferences({
    user_id: userId,
    last_viewed_object_id: objectId,
    last_viewed_at: new Date().toISOString(),
  });
}

/**
 * Update last search query
 */
async function updateLastSearch(userId: string, query: string): Promise<void> {
  await updateUserPreferences({
    user_id: userId,
    last_search_query: query,
    last_search_at: new Date().toISOString(),
  });
}

/**
 * Get continue where you left off context
 */
export async function getContinueContext(
  userId: string
): Promise<ContinueContext> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc('get_continue_context', {
    p_user_id: userId,
  });

  if (error) {
    console.error('Error fetching continue context:', error);
    return {
      last_viewed_object: { id: null, viewed_at: null },
      last_search: { query: null, searched_at: null },
      has_context: false,
    };
  }

  return data;
}

// ============================================================================
// COLLECTIONS
// ============================================================================

/**
 * Get user's collections
 */
export async function getUserCollections(
  userId: string,
  includeShared: boolean = false
): Promise<UserCollection[]> {
  const supabase = createClient();

  let query = supabase
    .from('user_collections')
    .select('*')
    .order('created_at', { ascending: false });

  if (includeShared) {
    query = query.or(`user_id.eq.${userId},shared_with.cs.{${userId}}`);
  } else {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching collections:', error);
    throw error;
  }

  return data || [];
}

/**
 * Create a collection
 */
export async function createCollection(
  collection: Omit<UserCollection, 'id' | 'created_at' | 'updated_at' | 'object_count'>
): Promise<UserCollection> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('user_collections')
    .insert(collection)
    .select()
    .single();

  if (error) {
    console.error('Error creating collection:', error);
    throw error;
  }

  return data;
}

/**
 * Add object to collection
 */
export async function addToCollection(
  collectionId: string,
  objectId: string
): Promise<UserCollection> {
  const supabase = createClient();

  // Get current collection
  const { data: collection } = await supabase
    .from('user_collections')
    .select('object_ids')
    .eq('id', collectionId)
    .single();

  if (!collection) {
    throw new Error('Collection not found');
  }

  // Add object if not already in collection
  const objectIds = collection.object_ids || [];
  if (!objectIds.includes(objectId)) {
    objectIds.push(objectId);
  }

  // Update collection
  const { data, error } = await supabase
    .from('user_collections')
    .update({ object_ids: objectIds })
    .eq('id', collectionId)
    .select()
    .single();

  if (error) {
    console.error('Error adding to collection:', error);
    throw error;
  }

  return data;
}

/**
 * Remove object from collection
 */
export async function removeFromCollection(
  collectionId: string,
  objectId: string
): Promise<UserCollection> {
  const supabase = createClient();

  // Get current collection
  const { data: collection } = await supabase
    .from('user_collections')
    .select('object_ids')
    .eq('id', collectionId)
    .single();

  if (!collection) {
    throw new Error('Collection not found');
  }

  // Remove object
  const objectIds = (collection.object_ids || []).filter(id => id !== objectId);

  // Update collection
  const { data, error } = await supabase
    .from('user_collections')
    .update({ object_ids: objectIds })
    .eq('id', collectionId)
    .select()
    .single();

  if (error) {
    console.error('Error removing from collection:', error);
    throw error;
  }

  return data;
}

/**
 * Delete a collection
 */
export async function deleteCollection(collectionId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from('user_collections')
    .delete()
    .eq('id', collectionId);

  if (error) {
    console.error('Error deleting collection:', error);
    throw error;
  }
}

// ============================================================================
// ONBOARDING
// ============================================================================

/**
 * Submit onboarding responses
 */
export async function submitOnboarding(
  responses: OnboardingResponses
): Promise<void> {
  const supabase = createClient();

  // Insert responses
  const { error: insertError } = await supabase
    .from('onboarding_responses')
    .insert(responses);

  if (insertError) {
    console.error('Error submitting onboarding:', insertError);
    throw insertError;
  }

  // Process responses to create interests
  const { error: processError } = await supabase.rpc('process_onboarding_responses', {
    p_user_id: responses.user_id,
  });

  if (processError) {
    console.error('Error processing onboarding:', processError);
    throw processError;
  }
}

/**
 * Check if user has completed onboarding
 */
export async function hasCompletedOnboarding(userId: string): Promise<boolean> {
  const preferences = await getUserPreferences(userId);
  return preferences?.onboarding_completed || false;
}

/**
 * Skip onboarding
 */
export async function skipOnboarding(userId: string): Promise<void> {
  await updateUserPreferences({
    user_id: userId,
    onboarding_skipped: true,
  });
}

// ============================================================================
// EVENTS TRACKING
// ============================================================================

/**
 * Track personalization event
 */
export async function trackPersonalizationEvent(
  event: PersonalizationEvent
): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from('personalization_events')
    .insert(event);

  if (error) {
    console.error('Error tracking event:', error);
    // Don't throw - event tracking should not break user flow
  }
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Format interest score as label
 */
export function getInterestLabel(score: number): {
  label: string;
  color: string;
} {
  if (score >= 80) {
    return { label: 'Strongly interested', color: '#10B981' };
  } else if (score >= 60) {
    return { label: 'Very interested', color: '#3B82F6' };
  } else if (score >= 40) {
    return { label: 'Interested', color: '#F59E0B' };
  } else if (score >= 20) {
    return { label: 'Somewhat interested', color: '#6B7280' };
  } else {
    return { label: 'Low interest', color: '#9CA3AF' };
  }
}

/**
 * Get icon for collection
 */
export function getCollectionIcon(collection: UserCollection): string {
  return collection.icon || 'Folder';
}

/**
 * Get color for collection
 */
export function getCollectionColor(collection: UserCollection): string {
  return collection.color || '#3B82F6';
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Interests
  getUserInterests,
  getUserInterestSummary,
  updateInterestScore,
  trackObjectView,
  trackSearch,
  
  // Recommendations
  getPersonalizedRecommendations,
  getFeedRecommendations,
  
  // Preferences
  getUserPreferences,
  updateUserPreferences,
  getDefaultPreferences,
  isInQuietHours,
  getContinueContext,
  
  // Collections
  getUserCollections,
  createCollection,
  addToCollection,
  removeFromCollection,
  deleteCollection,
  
  // Onboarding
  submitOnboarding,
  hasCompletedOnboarding,
  skipOnboarding,
  
  // Events
  trackPersonalizationEvent,
  
  // Utilities
  getInterestLabel,
  getCollectionIcon,
  getCollectionColor,
};
