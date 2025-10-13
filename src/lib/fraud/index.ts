/**
 * Fraud Detection Library
 * Client-side fraud detection and reporting
 */

import { getBrowserSupabase } from '@/lib/supabase/client';

// ============================================================================
// TYPES
// ============================================================================

export type FraudSignalType =
  | 'velocity_posting'
  | 'velocity_messaging'
  | 'device_fingerprint'
  | 'ip_pattern'
  | 'suspicious_text'
  | 'fake_photos'
  | 'trust_score_drop'
  | 'multiple_accounts'
  | 'policy_violation';

export type FraudSeverity = 'low' | 'medium' | 'high' | 'critical';

export type FlagType =
  | 'inappropriate_content'
  | 'spam'
  | 'scam'
  | 'fake_item'
  | 'stolen'
  | 'dangerous'
  | 'duplicate'
  | 'other';

export type ModerationStatus = 'pending' | 'in_review' | 'approved' | 'rejected' | 'escalated';

export interface FraudSignal {
  id: string;
  user_id: string;
  signal_type: FraudSignalType;
  severity: FraudSeverity;
  object_id?: string;
  related_user_id?: string;
  signal_data: Record<string, any>;
  auto_resolved: boolean;
  detected_at: string;
}

export interface ModerationQueueItem {
  id: string;
  object_id: string;
  user_id: string;
  priority_score: number;
  status: ModerationStatus;
  assigned_to?: string;
  reviewed_at?: string;
  user_flags_count: number;
  created_at: string;
}

export interface UserFlag {
  id: string;
  flagged_object_id?: string;
  flagged_user_id?: string;
  flagged_by: string;
  flag_type: FlagType;
  reason_details?: string;
  evidence_urls?: string[];
  status: 'pending' | 'reviewed' | 'validated' | 'dismissed';
  created_at: string;
}

// ============================================================================
// USER FLAGS (REPORTING)
// ============================================================================

/**
 * Report an object
 */
export async function reportObject(
  objectId: string,
  flagType: FlagType,
  reasonDetails?: string,
  evidenceUrls?: string[]
) {
  const supabase = getBrowserSupabase();
  
  const { data, error } = await supabase
    .from('user_flags')
    .insert({
      flagged_object_id: objectId,
      flag_type: flagType,
      reason_details: reasonDetails,
      evidence_urls: evidenceUrls,
      flagged_by: (await supabase.auth.getUser()).data.user?.id,
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * Report a user
 */
export async function reportUser(
  userId: string,
  flagType: FlagType,
  reasonDetails?: string,
  evidenceUrls?: string[]
) {
  const supabase = getBrowserSupabase();
  
  const { data, error } = await supabase
    .from('user_flags')
    .insert({
      flagged_user_id: userId,
      flag_type: flagType,
      reason_details: reasonDetails,
      evidence_urls: evidenceUrls,
      flagged_by: (await supabase.auth.getUser()).data.user?.id,
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * Get user's submitted flags
 */
export async function getMyFlags(): Promise<UserFlag[]> {
  const supabase = getBrowserSupabase();
  
  const { data, error } = await supabase
    .from('user_flags')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

// ============================================================================
// MODERATION (ADMIN/MODERATOR ONLY)
// ============================================================================

/**
 * Get moderation queue
 */
export async function getModerationQueue(
  status?: ModerationStatus,
  limit: number = 50
): Promise<any[]> {
  const supabase = getBrowserSupabase();
  
  let query = supabase
    .from('moderation_queue_view')
    .select('*')
    .order('priority_score', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(limit);
  
  if (status) {
    query = query.eq('status', status);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data || [];
}

/**
 * Assign moderation item to self
 */
export async function assignToSelf(queueItemId: string) {
  const supabase = getBrowserSupabase();
  const userId = (await supabase.auth.getUser()).data.user?.id;
  
  const { error } = await supabase
    .from('moderation_queue')
    .update({
      assigned_to: userId,
      assigned_at: new Date().toISOString(),
      status: 'in_review',
    })
    .eq('id', queueItemId);
  
  if (error) throw error;
}

/**
 * Approve object
 */
export async function approveObject(
  queueItemId: string,
  objectId: string,
  notes?: string
) {
  const supabase = getBrowserSupabase();
  const userId = (await supabase.auth.getUser()).data.user?.id;
  
  // Update queue
  await supabase
    .from('moderation_queue')
    .update({
      status: 'approved',
      reviewed_at: new Date().toISOString(),
      review_decision: 'approve',
      review_notes: notes,
    })
    .eq('id', queueItemId);
  
  // Log action
  await supabase
    .from('moderation_actions')
    .insert({
      moderator_id: userId,
      action_type: 'approve_object',
      target_object_id: objectId,
      reason: notes || 'Approved after review',
    });
}

/**
 * Reject object
 */
export async function rejectObject(
  queueItemId: string,
  objectId: string,
  reason: string,
  notes?: string
) {
  const supabase = getBrowserSupabase();
  const userId = (await supabase.auth.getUser()).data.user?.id;
  
  // Update queue
  await supabase
    .from('moderation_queue')
    .update({
      status: 'rejected',
      reviewed_at: new Date().toISOString(),
      review_decision: 'reject',
      review_notes: notes,
    })
    .eq('id', queueItemId);
  
  // Update object status
  await supabase
    .from('objects')
    .update({ status: 'deleted' })
    .eq('id', objectId);
  
  // Log action
  await supabase
    .from('moderation_actions')
    .insert({
      moderator_id: userId,
      action_type: 'reject_object',
      target_object_id: objectId,
      reason,
      notes,
    });
}

/**
 * Flag user (warning)
 */
export async function flagUser(
  queueItemId: string,
  userId: string,
  reason: string,
  notes?: string
) {
  const supabase = getBrowserSupabase();
  const moderatorId = (await supabase.auth.getUser()).data.user?.id;
  
  // Update queue
  await supabase
    .from('moderation_queue')
    .update({
      status: 'approved',
      reviewed_at: new Date().toISOString(),
      review_decision: 'flag_user',
      review_notes: notes,
    })
    .eq('id', queueItemId);
  
  // Create fraud signal
  await supabase
    .from('fraud_signals')
    .insert({
      user_id: userId,
      signal_type: 'policy_violation',
      severity: 'medium',
      signal_data: { reason, notes, moderator_id: moderatorId },
    });
  
  // Log action
  await supabase
    .from('moderation_actions')
    .insert({
      moderator_id: moderatorId,
      action_type: 'flag_user',
      target_user_id: userId,
      reason,
      notes,
    });
}

/**
 * Ban user
 */
export async function banUser(
  queueItemId: string,
  userId: string,
  reason: string,
  durationDays?: number,
  notes?: string
) {
  const supabase = getBrowserSupabase();
  const moderatorId = (await supabase.auth.getUser()).data.user?.id;
  
  // Update queue
  await supabase
    .from('moderation_queue')
    .update({
      status: 'rejected',
      reviewed_at: new Date().toISOString(),
      review_decision: 'ban_user',
      review_notes: notes,
    })
    .eq('id', queueItemId);
  
  // Update user status
  await supabase
    .from('users')
    .update({
      account_status: durationDays ? 'suspended' : 'banned',
      suspended_until: durationDays
        ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString()
        : null,
    })
    .eq('id', userId);
  
  // Log action
  await supabase
    .from('moderation_actions')
    .insert({
      moderator_id: moderatorId,
      action_type: durationDays ? 'suspend_user' : 'ban_user',
      target_user_id: userId,
      reason,
      notes,
      duration_days: durationDays,
    });
}

/**
 * Get user risk profile
 */
export async function getUserRiskProfile(userId: string) {
  const supabase = getBrowserSupabase();
  
  const { data, error } = await supabase
    .from('user_risk_profile')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * Get fraud signals for user
 */
export async function getUserFraudSignals(userId: string): Promise<FraudSignal[]> {
  const supabase = getBrowserSupabase();
  
  const { data, error } = await supabase
    .from('fraud_signals')
    .select('*')
    .eq('user_id', userId)
    .order('detected_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

// ============================================================================
// CLIENT-SIDE DETECTION
// ============================================================================

/**
 * Check if text contains spam keywords
 */
export function containsSpamKeywords(text: string): string[] {
  const spamKeywords = [
    'купить', 'whatsapp', 'telegram', 'viber',
    'bitcoin', 'crypto', 'forex', 'investment',
    'guaranteed profit', 'click here', 'free money',
    'earn fast', 'work from home',
  ];
  
  const found: string[] = [];
  const lowerText = text.toLowerCase();
  
  spamKeywords.forEach(keyword => {
    if (lowerText.includes(keyword)) {
      found.push(keyword);
    }
  });
  
  return found;
}

/**
 * Check if text contains phone numbers
 */
export function containsPhoneNumber(text: string): boolean {
  const phonePattern = /\d{10,}/g;
  return phonePattern.test(text);
}

/**
 * Check if text contains URLs
 */
export function containsURL(text: string): boolean {
  const urlPattern = /https?:\/\/[^\s]+/g;
  return urlPattern.test(text);
}

/**
 * Validate object before submission
 */
export function validateObjectContent(
  title: string,
  description: string
): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];
  
  const spamKeywords = containsSpamKeywords(title + ' ' + description);
  if (spamKeywords.length > 0) {
    warnings.push(`Conține cuvinte suspicioase: ${spamKeywords.join(', ')}`);
  }
  
  if (containsPhoneNumber(description)) {
    warnings.push('Nu include numărul de telefon în descriere');
  }
  
  if (containsURL(description)) {
    warnings.push('Nu include link-uri externe în descriere');
  }
  
  return {
    valid: warnings.length === 0,
    warnings,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Reporting
  reportObject,
  reportUser,
  getMyFlags,
  
  // Moderation
  getModerationQueue,
  assignToSelf,
  approveObject,
  rejectObject,
  flagUser,
  banUser,
  getUserRiskProfile,
  getUserFraudSignals,
  
  // Client-side detection
  containsSpamKeywords,
  containsPhoneNumber,
  containsURL,
  validateObjectContent,
};
