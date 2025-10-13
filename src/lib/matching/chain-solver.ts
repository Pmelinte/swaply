/**
 * Chain Matching Library
 * Multi-party swap matching with constraint solving and composite scoring
 */

import { createClient } from '@/lib/supabase/client';

// ============================================================================
// TYPES
// ============================================================================

export type ChainType = 'direct' | 'triple' | 'multi';
export type MatchStatus = 'proposed' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';

export interface MatchChain {
  id: string;
  chain_type: ChainType;
  participant_count: number;
  object_ids: string[];
  user_ids: string[];
  
  // Scoring
  similarity_score: number;
  proximity_score: number;
  reputation_score: number;
  rarity_score: number;
  total_score: number;
  confidence: number;
  
  // Constraints
  constraints_met: string[];
  constraints_failed: string[];
  
  // Explainability
  match_reasons: string[];
  warnings: string[] | null;
  
  // Metadata
  estimated_cost_eur: number | null;
  estimated_duration_days: number | null;
  co2_emissions_kg: number | null;
  
  // Status
  status: MatchStatus;
  expires_at: string;
  created_at: string;
  updated_at: string;
  created_by_algorithm: string;
}

export interface DirectMatch {
  match_chain_id: string;
  object_id: string;
  user_id: string;
  similarity_score: number;
  proximity_score: number;
  reputation_score: number;
  rarity_score: number;
  total_score: number;
  match_reasons: string[];
}

export interface TripleChainMatch {
  chain_type: 'triple';
  object_ids: string[];
  user_ids: string[];
  total_score: number;
  match_reasons: string[];
}

export interface MatchingConstraints {
  id?: string;
  user_id: string;
  
  // Distance
  max_distance_km: number;
  prefer_local: boolean;
  
  // Value
  min_value_ratio: number;
  max_value_ratio: number;
  allow_credit_swaply: boolean;
  
  // Reputation
  min_trust_score: number;
  require_verified_identity: boolean;
  require_verified_address: boolean;
  
  // Categories
  preferred_categories: string[] | null;
  excluded_categories: string[] | null;
  allow_cross_category: boolean;
  
  // Logistics
  max_shipping_cost_eur: number;
  max_swap_duration_days: number;
  require_insurance: boolean;
  
  // Multi-party
  allow_chain_swaps: boolean;
  max_chain_length: number;
}

export interface MatchFeedback {
  id?: string;
  match_chain_id: string;
  user_id: string;
  object_id: string;
  action: 'view' | 'like' | 'skip' | 'accept' | 'reject' | 'complete';
  feedback_reason?: string;
  rating?: number; // 1-5
  time_spent_seconds?: number;
}

export interface ConstraintCheckResult {
  satisfied: string[];
  failed: string[];
}

// ============================================================================
// DIRECT MATCHING (A↔B)
// ============================================================================

/**
 * Find direct swap matches for an object
 * @param objectId - Source object ID
 * @param limit - Maximum results
 */
export async function findDirectMatches(
  objectId: string,
  limit: number = 20
): Promise<DirectMatch[]> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc('find_direct_matches', {
    p_object_id: objectId,
    p_limit: limit,
  });

  if (error) {
    console.error('Error finding direct matches:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get recommended matches with constraint filtering
 * @param objectId - Source object ID
 * @param userId - User ID for constraint check
 * @param limit - Maximum results
 */
export async function getRecommendedMatches(
  objectId: string,
  userId: string,
  limit: number = 20
): Promise<DirectMatch[]> {
  // Get user constraints
  const constraints = await getMatchingConstraints(userId);

  // Get all potential matches
  const allMatches = await findDirectMatches(objectId, limit * 2);

  // Filter by constraints if they exist
  if (!constraints) {
    return allMatches.slice(0, limit);
  }

  const filtered: DirectMatch[] = [];

  for (const match of allMatches) {
    // Check constraints
    const constraintResult = await checkMatchConstraints(
      userId,
      match.user_id,
      null, // Distance calculated in proximity_score
      1.0 // Value ratio (TODO: calculate from object values)
    );

    // Only include if no critical constraints failed
    const criticalFailures = constraintResult.failed.filter(
      (f) => f === 'low_reputation' || f === 'distance_too_far'
    );

    if (criticalFailures.length === 0) {
      filtered.push(match);
    }

    if (filtered.length >= limit) break;
  }

  return filtered;
}

// ============================================================================
// CHAIN MATCHING (A→B→C)
// ============================================================================

/**
 * Find 3-party chain matches (A→B→C→A)
 * @param objectId - Source object ID
 * @param limit - Maximum chains
 */
export async function findTripleChainMatches(
  objectId: string,
  limit: number = 10
): Promise<TripleChainMatch[]> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc('find_triple_chain_matches', {
    p_object_id: objectId,
    p_limit: limit,
  });

  if (error) {
    console.error('Error finding triple chain matches:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get all available matches (direct + chains)
 * @param objectId - Source object ID
 * @param userId - User ID for preferences
 * @param includeChains - Whether to include chain matches
 */
export async function getAllMatches(
  objectId: string,
  userId: string,
  includeChains: boolean = true
): Promise<{
  direct: DirectMatch[];
  chains: TripleChainMatch[];
}> {
  const [direct, chains] = await Promise.all([
    getRecommendedMatches(objectId, userId, 20),
    includeChains ? findTripleChainMatches(objectId, 10) : Promise.resolve([]),
  ]);

  return { direct, chains };
}

// ============================================================================
// CONSTRAINT MANAGEMENT
// ============================================================================

/**
 * Get user's matching constraints
 */
export async function getMatchingConstraints(
  userId: string
): Promise<MatchingConstraints | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('matching_constraints')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows
    console.error('Error fetching constraints:', error);
    throw error;
  }

  return data;
}

/**
 * Create or update matching constraints
 */
export async function upsertMatchingConstraints(
  constraints: Partial<MatchingConstraints>
): Promise<MatchingConstraints> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('matching_constraints')
    .upsert(constraints, {
      onConflict: 'user_id',
    })
    .select()
    .single();

  if (error) {
    console.error('Error upserting constraints:', error);
    throw error;
  }

  return data;
}

/**
 * Get default constraints for a user
 */
export function getDefaultConstraints(userId: string): Partial<MatchingConstraints> {
  return {
    user_id: userId,
    max_distance_km: 500,
    prefer_local: true,
    min_value_ratio: 0.7,
    max_value_ratio: 1.5,
    allow_credit_swaply: true,
    min_trust_score: 50,
    require_verified_identity: false,
    require_verified_address: false,
    allow_cross_category: true,
    max_shipping_cost_eur: 100.0,
    max_swap_duration_days: 14,
    require_insurance: false,
    allow_chain_swaps: true,
    max_chain_length: 3,
  };
}

/**
 * Check if match satisfies constraints
 */
export async function checkMatchConstraints(
  userId: string,
  partnerId: string,
  distanceKm: number | null = null,
  valueRatio: number = 1.0
): Promise<ConstraintCheckResult> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc('check_match_constraints', {
    p_user_id: userId,
    p_partner_id: partnerId,
    p_distance_km: distanceKm,
    p_value_ratio: valueRatio,
  });

  if (error) {
    console.error('Error checking constraints:', error);
    throw error;
  }

  return data || { satisfied: [], failed: [] };
}

// ============================================================================
// MATCH CHAIN MANAGEMENT
// ============================================================================

/**
 * Create a match chain proposal
 */
export async function createMatchChain(
  chain: Partial<MatchChain>
): Promise<MatchChain> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('match_chains')
    .insert({
      ...chain,
      status: 'proposed',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating match chain:', error);
    throw error;
  }

  return data;
}

/**
 * Get match chain by ID
 */
export async function getMatchChain(chainId: string): Promise<MatchChain | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('match_chains')
    .select('*')
    .eq('id', chainId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching match chain:', error);
    throw error;
  }

  return data;
}

/**
 * Get user's match chains
 */
export async function getUserMatchChains(
  userId: string,
  status?: MatchStatus
): Promise<MatchChain[]> {
  const supabase = createClient();

  let query = supabase
    .from('match_chains')
    .select('*')
    .contains('user_ids', [userId])
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching user match chains:', error);
    throw error;
  }

  return data || [];
}

/**
 * Update match chain status
 */
export async function updateMatchChainStatus(
  chainId: string,
  status: MatchStatus
): Promise<MatchChain> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('match_chains')
    .update({ status })
    .eq('id', chainId)
    .select()
    .single();

  if (error) {
    console.error('Error updating match chain status:', error);
    throw error;
  }

  return data;
}

/**
 * Accept a match chain
 */
export async function acceptMatchChain(chainId: string): Promise<MatchChain> {
  return updateMatchChainStatus(chainId, 'accepted');
}

/**
 * Reject a match chain
 */
export async function rejectMatchChain(chainId: string): Promise<MatchChain> {
  return updateMatchChainStatus(chainId, 'cancelled');
}

// ============================================================================
// FEEDBACK & LEARNING
// ============================================================================

/**
 * Record match feedback
 */
export async function recordMatchFeedback(
  feedback: Omit<MatchFeedback, 'id'>
): Promise<MatchFeedback> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('match_feedback')
    .insert(feedback)
    .select()
    .single();

  if (error) {
    console.error('Error recording feedback:', error);
    throw error;
  }

  return data;
}

/**
 * Track match view (implicit feedback)
 */
export async function trackMatchView(
  matchChainId: string,
  userId: string,
  objectId: string,
  timeSpentSeconds: number
): Promise<void> {
  await recordMatchFeedback({
    match_chain_id: matchChainId,
    user_id: userId,
    object_id: objectId,
    action: 'view',
    time_spent_seconds: timeSpentSeconds,
  });
}

/**
 * Like a match
 */
export async function likeMatch(
  matchChainId: string,
  userId: string,
  objectId: string
): Promise<void> {
  await recordMatchFeedback({
    match_chain_id: matchChainId,
    user_id: userId,
    object_id: objectId,
    action: 'like',
  });
}

/**
 * Skip a match (negative feedback)
 */
export async function skipMatch(
  matchChainId: string,
  userId: string,
  objectId: string,
  reason?: string
): Promise<void> {
  await recordMatchFeedback({
    match_chain_id: matchChainId,
    user_id: userId,
    object_id: objectId,
    action: 'skip',
    feedback_reason: reason,
  });
}

// ============================================================================
// SCORING UTILITIES
// ============================================================================

/**
 * Get human-readable score interpretation
 */
export function getScoreInterpretation(score: number): {
  label: string;
  color: string;
  description: string;
} {
  if (score >= 80) {
    return {
      label: 'Excellent Match',
      color: '#10B981', // green
      description: 'Highly recommended swap with great compatibility',
    };
  } else if (score >= 60) {
    return {
      label: 'Good Match',
      color: '#3B82F6', // blue
      description: 'Good compatibility, worth considering',
    };
  } else if (score >= 40) {
    return {
      label: 'Fair Match',
      color: '#F59E0B', // yellow
      description: 'Moderate compatibility, some trade-offs',
    };
  } else {
    return {
      label: 'Weak Match',
      color: '#EF4444', // red
      description: 'Low compatibility, might not be suitable',
    };
  }
}

/**
 * Format match reasons for display
 */
export function formatMatchReasons(reasons: string[]): string[] {
  const reasonMap: Record<string, string> = {
    'High similarity': '🎯 Categorii foarte similare',
    'Moderate similarity': '🔍 Categorii compatibile',
    'Nearby location': '📍 Locație apropiată',
    'Moderate distance': '🗺️ Distanță rezonabilă',
    'Excellent reputation': '⭐ Reputație excelentă',
    'Good reputation': '👍 Reputație bună',
    'Rare items': '💎 Obiecte rare',
    'Balanced exchange': '⚖️ Schimb echilibrat',
  };

  return reasons.map((reason) => reasonMap[reason] || reason);
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Direct matching
  findDirectMatches,
  getRecommendedMatches,
  
  // Chain matching
  findTripleChainMatches,
  getAllMatches,
  
  // Constraints
  getMatchingConstraints,
  upsertMatchingConstraints,
  getDefaultConstraints,
  checkMatchConstraints,
  
  // Chain management
  createMatchChain,
  getMatchChain,
  getUserMatchChains,
  updateMatchChainStatus,
  acceptMatchChain,
  rejectMatchChain,
  
  // Feedback
  recordMatchFeedback,
  trackMatchView,
  likeMatch,
  skipMatch,
  
  // Utilities
  getScoreInterpretation,
  formatMatchReasons,
};
