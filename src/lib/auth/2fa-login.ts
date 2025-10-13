/**
 * 2FA Login Flow Library
 * 
 * Handles Two-Factor Authentication during login
 * Integrates with existing 2FA system from feature/2fa
 */

import { getBrowserSupabase } from '@/lib/supabase/client';
import * as speakeasy from 'speakeasy';

/**
 * Check if user has 2FA enabled
 */
export async function userHas2FAEnabled(userId: string): Promise<boolean> {
  try {
    const supabase = getBrowserSupabase();
    const { data, error } = await supabase.rpc('user_has_2fa_enabled', {
      p_user_id: userId,
    });

    if (error) {
      console.error('Error checking 2FA status:', error);
      return false;
    }

    return data || false;
  } catch (error) {
    console.error('Error checking 2FA status:', error);
    return false;
  }
}

/**
 * Verify TOTP code
 * 
 * @param userId - User ID
 * @param token - 6-digit TOTP code
 * @returns TRUE if valid, FALSE otherwise
 */
export async function verifyTOTP(
  userId: string,
  token: string
): Promise<boolean> {
  try {
    const supabase = getBrowserSupabase();

    // Get user's 2FA secret
    const { data: user2FA, error } = await supabase
      .from('user_2fa')
      .select('secret')
      .eq('user_id', userId)
      .eq('enabled', true)
      .single();

    if (error || !user2FA) {
      console.error('Error fetching 2FA secret:', error);
      return false;
    }

    // Verify TOTP using speakeasy
    const verified = speakeasy.totp.verify({
      secret: user2FA.secret,
      encoding: 'base32',
      token: token,
      window: 2, // Allow 2 time steps (±60 seconds)
    });

    return verified;
  } catch (error) {
    console.error('Error verifying TOTP:', error);
    return false;
  }
}

/**
 * Verify backup code
 * 
 * @param userId - User ID  
 * @param code - 10-character backup code
 * @returns TRUE if valid and not used, FALSE otherwise
 */
export async function verifyBackupCode(
  userId: string,
  code: string
): Promise<boolean> {
  try {
    const supabase = getBrowserSupabase();

    const { data, error } = await supabase.rpc('validate_backup_code', {
      backup_code: code.trim(),
    });

    if (error) {
      console.error('Error validating backup code:', error);
      return false;
    }

    return data || false;
  } catch (error) {
    console.error('Error validating backup code:', error);
    return false;
  }
}

/**
 * Complete 2FA login
 * 
 * Re-authenticates user after successful 2FA verification
 * This is needed because we sign out after initial password login
 * 
 * @param email - User email
 * @param password - User password (should be stored temporarily)
 */
export async function complete2FALogin(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getBrowserSupabase();

    // Re-authenticate with password
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 2FA Login Flow Types
 */
export interface LoginWith2FAParams {
  email: string;
  password: string;
}

export interface LoginWith2FAResult {
  requires2FA: boolean;
  userId?: string;
  error?: string;
}

/**
 * Initiate login with 2FA check
 * 
 * @param params - Email and password
 * @returns Login result with 2FA requirement
 */
export async function initiateLoginWith2FA(
  params: LoginWith2FAParams
): Promise<LoginWith2FAResult> {
  try {
    const supabase = getBrowserSupabase();

    // Attempt password authentication
    const { data, error } = await supabase.auth.signInWithPassword({
      email: params.email,
      password: params.password,
    });

    if (error) {
      return { requires2FA: false, error: error.message };
    }

    if (!data?.user) {
      return { requires2FA: false, error: 'Authentication failed' };
    }

    // Check if user has 2FA enabled
    const has2FA = await userHas2FAEnabled(data.user.id);

    if (has2FA) {
      // Sign out temporarily - will re-authenticate after 2FA verification
      await supabase.auth.signOut();

      return {
        requires2FA: true,
        userId: data.user.id,
      };
    }

    // No 2FA required - login complete
    return {
      requires2FA: false,
      userId: data.user.id,
    };
  } catch (error) {
    return {
      requires2FA: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
