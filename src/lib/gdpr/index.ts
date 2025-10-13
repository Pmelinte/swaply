/**
 * GDPR Compliance Library
 * Data export, erasure, consent management
 */

import { getBrowserSupabase } from '@/lib/supabase/client';

// ============================================================================
// TYPES
// ============================================================================

export type GDPRRequestType = 'export' | 'erasure' | 'rectification' | 'portability';
export type GDPRRequestStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export type ConsentType =
  | 'terms_of_service'
  | 'privacy_policy'
  | 'marketing_emails'
  | 'analytics'
  | 'personalization'
  | 'location_sharing'
  | 'photo_usage'
  | 'data_sharing_partners';

export interface GDPRRequest {
  id: string;
  user_id: string;
  request_type: GDPRRequestType;
  status: GDPRRequestStatus;
  reason?: string;
  data_export_url?: string;
  export_expires_at?: string;
  anonymization_completed?: boolean;
  requested_at: string;
  completed_at?: string;
}

export interface ConsentRecord {
  id: string;
  user_id: string;
  consent_type: ConsentType;
  granted: boolean;
  policy_version?: string;
  consent_method?: 'explicit' | 'implicit' | 'updated' | 'withdrawn';
  withdrawn_at?: string;
  created_at: string;
}

export interface DataProcessor {
  id: string;
  processor_name: string;
  processor_type: string;
  contact_email?: string;
  dpo_email?: string;
  data_categories: string[];
  processing_purposes: string[];
  data_location: string;
  active: boolean;
}

export interface RetentionPolicy {
  data_type: string;
  retention_days: number;
  auto_delete: boolean;
  legal_basis?: string;
}

// ============================================================================
// DATA EXPORT
// ============================================================================

/**
 * Request data export
 */
export async function requestDataExport(reason?: string): Promise<GDPRRequest> {
  const supabase = getBrowserSupabase();
  
  const { data, error } = await supabase
    .rpc('request_data_export', {
      p_user_id: (await supabase.auth.getUser()).data.user?.id,
    });
  
  if (error) throw error;
  
  // Get created request
  const { data: request, error: fetchError } = await supabase
    .from('gdpr_requests')
    .select('*')
    .eq('id', data)
    .single();
  
  if (fetchError) throw fetchError;
  return request;
}

/**
 * Get export requests for current user
 */
export async function getMyExportRequests(): Promise<GDPRRequest[]> {
  const supabase = getBrowserSupabase();
  
  const { data, error } = await supabase
    .from('gdpr_requests')
    .select('*')
    .eq('request_type', 'export')
    .order('requested_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

/**
 * Download export data
 */
export async function downloadExportData(requestId: string): Promise<Blob> {
  const supabase = getBrowserSupabase();
  
  // Get export URL
  const { data: request, error } = await supabase
    .from('gdpr_requests')
    .select('data_export_url')
    .eq('id', requestId)
    .single();
  
  if (error || !request?.data_export_url) {
    throw new Error('Export not ready yet');
  }
  
  // Download file
  const response = await fetch(request.data_export_url);
  if (!response.ok) throw new Error('Failed to download export');
  
  return await response.blob();
}

// ============================================================================
// DATA ERASURE
// ============================================================================

/**
 * Request data erasure (account deletion)
 */
export async function requestDataErasure(reason?: string): Promise<GDPRRequest> {
  const supabase = getBrowserSupabase();
  
  const { data, error } = await supabase
    .rpc('request_data_erasure', {
      p_user_id: (await supabase.auth.getUser()).data.user?.id,
    });
  
  if (error) throw error;
  
  // Get created request
  const { data: request, error: fetchError } = await supabase
    .from('gdpr_requests')
    .select('*')
    .eq('id', data)
    .single();
  
  if (fetchError) throw fetchError;
  return request;
}

/**
 * Cancel erasure request (within grace period)
 */
export async function cancelErasureRequest(requestId: string): Promise<void> {
  const supabase = getBrowserSupabase();
  
  const { error } = await supabase
    .from('gdpr_requests')
    .update({ status: 'cancelled' })
    .eq('id', requestId)
    .eq('status', 'pending');
  
  if (error) throw error;
}

// ============================================================================
// CONSENT MANAGEMENT
// ============================================================================

/**
 * Record consent
 */
export async function giveConsent(
  consentType: ConsentType,
  policyVersion?: string
): Promise<ConsentRecord> {
  const supabase = getBrowserSupabase();
  const userId = (await supabase.auth.getUser()).data.user?.id;
  
  const { data, error } = await supabase
    .from('consent_log')
    .insert({
      user_id: userId,
      consent_type: consentType,
      granted: true,
      policy_version: policyVersion,
      consent_method: 'explicit',
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * Withdraw consent
 */
export async function withdrawConsent(consentType: ConsentType): Promise<void> {
  const supabase = getBrowserSupabase();
  const userId = (await supabase.auth.getUser()).data.user?.id;
  
  const { error } = await supabase
    .from('consent_log')
    .insert({
      user_id: userId,
      consent_type: consentType,
      granted: false,
      consent_method: 'withdrawn',
      withdrawn_at: new Date().toISOString(),
    });
  
  if (error) throw error;
}

/**
 * Check if user has given consent
 */
export async function hasConsent(consentType: ConsentType): Promise<boolean> {
  const supabase = getBrowserSupabase();
  const userId = (await supabase.auth.getUser()).data.user?.id;
  
  const { data, error } = await supabase
    .rpc('has_consent', {
      p_user_id: userId,
      p_consent_type: consentType,
    });
  
  if (error) {
    console.error('Error checking consent:', error);
    return false;
  }
  
  return data || false;
}

/**
 * Get all consent records for current user
 */
export async function getMyConsents(): Promise<ConsentRecord[]> {
  const supabase = getBrowserSupabase();
  
  const { data, error } = await supabase
    .from('consent_log')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

/**
 * Get latest consent for each type
 */
export async function getCurrentConsents(): Promise<Map<ConsentType, boolean>> {
  const supabase = getBrowserSupabase();
  
  const { data, error } = await supabase
    .from('consent_log')
    .select('consent_type, granted, created_at')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  
  // Get latest for each type
  const consents = new Map<ConsentType, boolean>();
  data?.forEach(record => {
    if (!consents.has(record.consent_type)) {
      consents.set(record.consent_type, record.granted);
    }
  });
  
  return consents;
}

// ============================================================================
// AUDIT LOG
// ============================================================================

/**
 * Get audit log for current user
 */
export async function getMyAuditLog(limit: number = 50): Promise<any[]> {
  const supabase = getBrowserSupabase();
  
  const { data, error } = await supabase
    .from('audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  return data || [];
}

// ============================================================================
// DATA PROCESSORS
// ============================================================================

/**
 * Get list of data processors
 */
export async function getDataProcessors(): Promise<DataProcessor[]> {
  const supabase = getBrowserSupabase();
  
  const { data, error } = await supabase
    .from('data_processors')
    .select('*')
    .eq('active', true)
    .order('processor_name');
  
  if (error) throw error;
  return data || [];
}

// ============================================================================
// RETENTION POLICIES
// ============================================================================

/**
 * Get data retention policies
 */
export async function getRetentionPolicies(): Promise<RetentionPolicy[]> {
  const supabase = getBrowserSupabase();
  
  const { data, error } = await supabase
    .from('data_retention_policies')
    .select('*')
    .order('data_type');
  
  if (error) throw error;
  return data || [];
}

// ============================================================================
// PRIVACY DASHBOARD
// ============================================================================

/**
 * Get complete privacy overview
 */
export async function getPrivacyOverview() {
  const [
    exportRequests,
    consents,
    auditLog,
    processors,
    retentionPolicies,
  ] = await Promise.all([
    getMyExportRequests(),
    getCurrentConsents(),
    getMyAuditLog(10),
    getDataProcessors(),
    getRetentionPolicies(),
  ]);
  
  return {
    exportRequests,
    consents,
    auditLog,
    processors,
    retentionPolicies,
  };
}

// ============================================================================
// ADMIN FUNCTIONS
// ============================================================================

/**
 * Get all GDPR requests (admin only)
 */
export async function getAllGDPRRequests(
  status?: GDPRRequestStatus,
  limit: number = 50
): Promise<GDPRRequest[]> {
  const supabase = getBrowserSupabase();
  
  let query = supabase
    .from('gdpr_requests')
    .select('*')
    .order('requested_at', { ascending: false })
    .limit(limit);
  
  if (status) {
    query = query.eq('status', status);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data || [];
}

/**
 * Process export request (admin only)
 */
export async function processExportRequest(requestId: string): Promise<void> {
  const supabase = getBrowserSupabase();
  
  // Call function to generate export
  const { data: exportData, error: exportError } = await supabase
    .rpc('process_data_export', {
      p_request_id: requestId,
    });
  
  if (exportError) throw exportError;
  
  // In production, upload to cloud storage and set data_export_url
  console.log('Export data generated:', exportData);
}

/**
 * Process erasure request (admin only)
 */
export async function processErasureRequest(requestId: string): Promise<void> {
  const supabase = getBrowserSupabase();
  
  const { error } = await supabase
    .rpc('process_data_erasure', {
      p_request_id: requestId,
    });
  
  if (error) throw error;
}

// ============================================================================
// BACKWARD COMPATIBILITY WRAPPERS
// ============================================================================

/**
 * @deprecated Use requestDataErasure instead
 * Wrapper for backward compatibility with old page components
 */
export async function requestDataDeletion(userId: string, confirmationCode?: string): Promise<GDPRRequest> {
  // Old signature had userId param, new one doesn't (uses auth context)
  return requestDataErasure(confirmationCode ? `Confirmed: ${confirmationCode}` : undefined);
}

/**
 * @deprecated Use getMyConsents instead
 * Wrapper for backward compatibility with old page components
 */
export async function getConsentLog(userId?: string): Promise<ConsentRecord[]> {
  // Old signature had userId param, new one doesn't (uses auth context)
  return getMyConsents();
}

/**
 * @deprecated Use giveConsent/withdrawConsent instead
 * Wrapper for backward compatibility with old page components
 */
export async function updateConsent(
  userId: string, 
  consentType: ConsentType, 
  granted: boolean
): Promise<void> {
  // Old signature had userId and granted params, new API split into give/withdraw
  if (granted) {
    await giveConsent(consentType);
  } else {
    await withdrawConsent(consentType);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Export
  requestDataExport,
  getMyExportRequests,
  downloadExportData,
  
  // Erasure
  requestDataErasure,
  cancelErasureRequest,
  
  // Consent
  giveConsent,
  withdrawConsent,
  hasConsent,
  getMyConsents,
  getCurrentConsents,
  
  // Audit
  getMyAuditLog,
  
  // Processors
  getDataProcessors,
  
  // Retention
  getRetentionPolicies,
  
  // Overview
  getPrivacyOverview,
  
  // Admin
  getAllGDPRRequests,
  processExportRequest,
  processErasureRequest,
};
