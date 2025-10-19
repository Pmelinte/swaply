'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getBrowserSupabase } from '@/lib/supabase/client';

const PKCE_STORAGE_PREFIX = 'swaply_pkce_';
const LOG_ENDPOINT = '/api/debug/auth';
const LOGGING_ENABLED = process.env.NEXT_PUBLIC_LOG_AUTH_CALLBACK === '1';

function reportAuthEvent(event: string, details: Record<string, unknown>) {
  if (!LOGGING_ENABLED || typeof window === 'undefined') {
    return;
  }

  try {
    const payload = JSON.stringify({
      event,
      details,
      sentAt: new Date().toISOString(),
    });

    const nav = window.navigator;
    if (nav && typeof nav.sendBeacon === 'function') {
      const blob = new Blob([payload], { type: 'application/json' });
      nav.sendBeacon(LOG_ENDPOINT, blob);
    } else {
      void fetch(LOG_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      });
    }
  } catch (error) {
    console.warn('⚠️ Auth debug log failed.', error);
  }
}

function restorePkceStateFromLocalStorage() {
  if (typeof window === 'undefined') {
    return false;
  }

  let restored = false;
  try {
    Object.keys(window.localStorage)
      .filter((key) => key.startsWith(PKCE_STORAGE_PREFIX))
      .forEach((key) => {
        const value = window.localStorage.getItem(key);
        if (value) {
          const sessionKey = key.replace(PKCE_STORAGE_PREFIX, '');
          window.sessionStorage.setItem(sessionKey, value);
          restored = true;
        }
      });
  } catch (error) {
    console.warn('⚠️ PKCE restore failed.', error);
  }

  return restored;
}

function clearPkceState() {
  if (typeof window === 'undefined') {
    return;
  }

  Object.keys(window.localStorage)
    .filter((key) => key.startsWith(PKCE_STORAGE_PREFIX))
    .forEach((key) => window.localStorage.removeItem(key));
}

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasHandledRef = useRef(false);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('Se procesează autentificarea...');
  const pkceRestoredRef = useRef(false);

  useEffect(() => {
    if (hasHandledRef.current) {
      return;
    }
    hasHandledRef.current = true;

    pkceRestoredRef.current = restorePkceStateFromLocalStorage();
    const initDetails = {
      pathname: typeof window !== 'undefined' ? window.location.pathname : null,
      pkceRestored: pkceRestoredRef.current,
    };
    console.log('🔁 Auth callback initialized.', initDetails);
    reportAuthEvent('callback:init', initDetails);

    const supabase = getBrowserSupabase();
    const code = searchParams.get('code');
    const tokenHash = searchParams.get('token_hash');
    const type = searchParams.get('type');
    const errorDescription = searchParams.get('error_description');
    const rawNext = searchParams.get('next');
    let decodedNext = '/';
    if (rawNext) {
      try {
        decodedNext = decodeURIComponent(rawNext);
      } catch {
        decodedNext = '/';
      }
    }
    const next = decodedNext.startsWith('/') ? decodedNext : '/';

    const redirectWithError = (errorMessage: string) => {
      setStatus('error');
      setMessage(errorMessage);
      const errorUrl = new URL('/login', window.location.origin);
      errorUrl.searchParams.set('error', errorMessage);
      if (next && next !== '/') {
        errorUrl.searchParams.set('redirect', next);
      }
      clearPkceState();
      reportAuthEvent('callback:error', {
        errorMessage,
        next,
      });
      router.replace(`${errorUrl.pathname}${errorUrl.search}`);
    };

    const completeAuth = async () => {
      try {
        const allowedTypes = new Set<
          'magiclink' | 'signup' | 'invite' | 'recovery' | 'email_change' | 'email'
        >(['magiclink', 'signup', 'invite', 'recovery', 'email_change', 'email']);
        const resolveOtpType = (
          rawType: string | null
        ): 'magiclink' | 'signup' | 'invite' | 'recovery' | 'email_change' | 'email' =>
          allowedTypes.has(rawType as any)
            ? (rawType as 'magiclink' | 'signup' | 'invite' | 'recovery' | 'email_change' | 'email')
            : 'magiclink';

        const attemptVerifyOtp = async () => {
          if (!tokenHash) {
            return { error: new Error('Lipsea token-ul magic link.') } as const;
          }

          const emailOtpType = resolveOtpType(type);
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: emailOtpType,
          });

          if (error) {
            console.error('🔴 Supabase verifyOtp error:', error);
            reportAuthEvent('callback:verifyOtp:error', {
              type: emailOtpType,
              message: error.message,
            });
          } else {
            console.log('✅ Supabase verifyOtp succeeded via fallback.', {
              type: emailOtpType,
            });
            reportAuthEvent('callback:verifyOtp:success', {
              type: emailOtpType,
            });
          }

          return { error } as const;
        };

        let otpAlreadyVerified = false;

        if (tokenHash) {
          const verifyDetails = { type };
          console.log('🔄 Attempting verifyOtp with token_hash before PKCE exchange.', verifyDetails);
          reportAuthEvent('callback:verifyOtp:start', verifyDetails);
          const { error } = await attemptVerifyOtp();

          if (error) {
            if (errorDescription) {
              console.warn('⚠️ verifyOtp failed with server error description, will continue with PKCE.', {
                errorDescription,
                error,
              });
              reportAuthEvent('callback:verifyOtp:error', {
                errorDescription,
                message: error.message,
              });
            }
          } else {
            otpAlreadyVerified = true;
          }
        }

        if (!otpAlreadyVerified) {
          if (errorDescription) {
            console.warn('⚠️ Supabase callback received error_description.', { errorDescription });
            reportAuthEvent('callback:errorDescription', { errorDescription });
          }

          if (code) {
            const exchangeDetails = {
              pkceRestored: pkceRestoredRef.current,
            };
            console.log('🔄 Supabase exchangeCodeForSession start.', exchangeDetails);
            reportAuthEvent('callback:exchange:start', exchangeDetails);
            const { error } = await supabase.auth.exchangeCodeForSession(code);

            if (error) {
              console.error('🔴 Supabase exchangeCodeForSession error:', error);
              reportAuthEvent('callback:exchange:error', {
                message: error.message,
                name: error.name,
              });

              if (tokenHash) {
                const fallbackResult = await attemptVerifyOtp();
                if (fallbackResult.error) {
                  redirectWithError(error.message);
                  return;
                } else {
                  otpAlreadyVerified = true;
                }
              } else {
                redirectWithError(error.message);
                return;
              }
            } else {
              otpAlreadyVerified = true;
              console.log('✅ Supabase exchangeCodeForSession succeeded.');
              reportAuthEvent('callback:exchange:success', exchangeDetails);
            }
          } else if (!tokenHash) {
            redirectWithError('Parametri de autentificare lipsă.');
            return;
          }
        }

        setStatus('success');
        setMessage('Autentificare reușită. Redirecționare...');
        clearPkceState();
        reportAuthEvent('callback:success', { next });
        router.replace(next);
        router.refresh();
      } catch (err) {
        const fallbackMessage = err instanceof Error ? err.message : 'Eroare necunoscută la autentificare.';
        reportAuthEvent('callback:exception', {
          message: err instanceof Error ? err.message : String(err),
        });
        redirectWithError(fallbackMessage);
      }
    };

    void completeAuth();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center space-y-4">
        <div
          className={`mx-auto h-16 w-16 rounded-full flex items-center justify-center text-3xl ${
            status === 'success' ? 'bg-green-100 text-green-600' : status === 'error' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
          }`}
        >
          {status === 'success' ? '✅' : status === 'error' ? '⚠️' : '🔄'}
        </div>
        <h1 className="text-2xl font-semibold text-gray-900">
          {status === 'success' ? 'Autentificare reușită' : status === 'error' ? 'Autentificare eșuată' : 'Se verifică autentificarea'}
        </h1>
        <p className="text-gray-600 text-sm leading-relaxed">{message}</p>
        {status === 'error' && (
          <button
            type="button"
            onClick={() => router.replace('/login')}
            className="mt-2 inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Înapoi la autentificare
          </button>
        )}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center space-y-4">
            <div className="mx-auto h-16 w-16 rounded-full flex items-center justify-center text-3xl bg-blue-100 text-blue-600">
              🔄
            </div>
            <h1 className="text-2xl font-semibold text-gray-900">Se verifică autentificarea</h1>
            <p className="text-gray-600 text-sm leading-relaxed">Se procesează autentificarea...</p>
          </div>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
