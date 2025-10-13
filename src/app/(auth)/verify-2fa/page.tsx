'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getBrowserSupabase } from '@/lib/supabase/client';
import { useI18n } from '@/lib/i18n';
import { verifyTOTP, verifyBackupCode } from '@/lib/auth/2fa-login';

/**
 * 2FA Verification Page
 * 
 * Shown after successful email/password login if user has 2FA enabled
 * 
 * Flow:
 * 1. User logs in with email/password
 * 2. Login action checks if 2FA enabled
 * 3. If enabled, redirects here with temporary session token
 * 4. User enters 6-digit code from authenticator app
 * 5. On success, completes authentication
 * 
 * Backup codes:
 * - User can enter 10-character backup code instead
 * - Each backup code can be used only once
 */

function Verify2FAForm() {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Get user ID from search params (passed from login)
    const userIdParam = searchParams.get('userId');
    const errorParam = searchParams.get('error');
    
    if (userIdParam) {
      setUserId(userIdParam);
    } else if (!errorParam) {
      // No user ID and no error - redirect to login
      router.push('/login?error=Missing+2FA+session');
    }
    
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
  }, [searchParams, router]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId) {
      setError('Sesiune expirată. Te rugăm să te autentifici din nou.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const supabase = getBrowserSupabase();

      if (useBackupCode) {
        // Verify backup code
        const isValid = await verifyBackupCode(userId, code.trim());

        if (!isValid) {
          setError('❌ Cod de backup invalid sau deja utilizat');
          setCode('');
          return;
        }

        // Backup code valid - complete authentication
        // Need to re-authenticate user since we signed out after initial login
        // For now, redirect to login with success message
        router.push('/login?success=2FA+verified+successfully');
      } else {
        // Verify TOTP code
        const isValid = await verifyTOTP(userId, code.trim());

        if (!isValid) {
          setError('❌ Cod invalid. Verifică aplicația de autentificare.');
          setCode('');
          return;
        }

        // TOTP code valid - complete authentication
        // Need to re-authenticate user
        router.push('/login?success=2FA+verified+successfully');
      }
    } catch (err) {
      console.error('2FA verification error:', err);
      setError('❌ Eroare la verificare. Te rugăm să încerci din nou.');
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    
    if (useBackupCode) {
      // Backup codes are 10 characters
      if (value.length <= 10) {
        setCode(value);
      }
    } else {
      // TOTP codes are 6 digits
      if (value.length <= 6) {
        setCode(value);
      }
    }
    
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="h-8 w-8 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
            {t('auth.verify2FA') || 'Verificare 2FA'}
          </h2>
          <p className="text-sm text-gray-600">
            {useBackupCode
              ? 'Introdu un cod de backup de 10 caractere'
              : 'Introdu codul de 6 cifre din aplicația de autentificare'}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg
                className="h-5 w-5 text-red-400 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Verification Form */}
        <form onSubmit={handleVerify} className="mt-8 space-y-6">
          <div>
            <label htmlFor="code" className="sr-only">
              {useBackupCode ? 'Cod de backup' : 'Cod de verificare'}
            </label>
            <input
              id="code"
              name="code"
              type="text"
              required
              value={code}
              onChange={handleCodeChange}
              className="appearance-none relative block w-full px-4 py-4 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest font-mono"
              placeholder={useBackupCode ? '••••••••••' : '• • • • • •'}
              autoComplete="off"
              maxLength={useBackupCode ? 10 : 6}
              disabled={loading}
              autoFocus
            />
            <p className="mt-2 text-xs text-gray-500 text-center">
              {useBackupCode
                ? `${code.length}/10 caractere`
                : `${code.length}/6 cifre`}
            </p>
          </div>

          {/* Verify Button */}
          <button
            type="submit"
            disabled={loading || (useBackupCode ? code.length !== 10 : code.length !== 6)}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                {t('auth.verifying') || 'Se verifică...'}
              </span>
            ) : (
              <>
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <svg
                    className="h-5 w-5 text-blue-500 group-hover:text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </span>
                {t('auth.verify') || 'Verifică'}
              </>
            )}
          </button>

          {/* Toggle Backup Code */}
          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={() => {
                setUseBackupCode(!useBackupCode);
                setCode('');
                setError('');
              }}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              {useBackupCode
                ? '← Înapoi la cod de verificare'
                : 'Folosește cod de backup'}
            </button>
          </div>

          {/* Help Text */}
          <div className="mt-6 text-center space-y-2">
            <p className="text-xs text-gray-600">
              {useBackupCode ? (
                <>
                  Codurile de backup au fost generate când ai activat 2FA.
                  <br />
                  Fiecare cod poate fi folosit o singură dată.
                </>
              ) : (
                <>
                  Deschide aplicația de autentificare (Google Authenticator, Authy, etc.)
                  <br />
                  și introdu codul de 6 cifre afișat pentru Swaply.
                </>
              )}
            </p>
          </div>

          {/* Back to Login */}
          <div className="text-center pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← Înapoi la autentificare
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Verify2FAPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    }>
      <Verify2FAForm />
    </Suspense>
  );
}
