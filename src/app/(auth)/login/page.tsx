'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getBrowserSupabase } from '@/lib/supabase/client';

const resolveSiteUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');

  if (envUrl && envUrl.startsWith('http')) {
    return envUrl;
  }

  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return '';
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get('redirect') ?? '/';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [authMethod, setAuthMethod] = useState<'password' | 'magic' | 'phone'>('password');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    phone: '',
    otp: '',
  });
  const [otpSent, setOtpSent] = useState(false);

  // PKCE is now automatically persisted in localStorage via browser.ts configuration
  // No need for manual persistence logic

  // Check for errors from callback
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError(`❌ ${decodeURIComponent(errorParam)}`);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const supabase = getBrowserSupabase();
      const siteUrl = resolveSiteUrl();

      if (!siteUrl) {
        throw new Error('Nu putem determina domeniul pentru redirect. Verifică NEXT_PUBLIC_SITE_URL.');
      }

      const callbackUrl = `${siteUrl}/auth/callback?next=${encodeURIComponent(redirectTarget)}`;
      console.log('📨 signInWithOtp will use redirect:', callbackUrl);
      
      if (authMethod === 'magic') {
        // Magic Link authentication - let Supabase handle flow type automatically

          const { error } = await supabase.auth.signInWithOtp({
          email: formData.email,
          options: {
              emailRedirectTo: callbackUrl,
            shouldCreateUser: false, // Don't create user automatically
          },
        });

        if (error) {
          if (error.message.includes('User not found')) {
            setError('❌ Nu există cont cu acest email. Te rugăm să te înregistrezi mai întâi.');
          } else {
            setError(`❌ ${error.message}`);
          }
        } else {
          // Show success message for magic link
          setSuccess('✅ Link-ul magic a fost trimis pe email! Verifică-ți inbox-ul (și folderul Spam). Link-ul este valabil 60 de minute.');
        }
      } else if (authMethod === 'phone') {
        // Phone authentication
        if (!otpSent) {
          // Send OTP
          const { error } = await supabase.auth.signInWithOtp({
            phone: formData.phone,
            options: {
              shouldCreateUser: false,
              emailRedirectTo: callbackUrl,
            },
          });

          if (error) {
            setError(`❌ ${error.message}`);
          } else {
            setOtpSent(true);
            setSuccess('✅ Codul de verificare a fost trimis pe telefon! Introdu codul primit.');
          }
        } else {
          // Verify OTP
          const { error } = await supabase.auth.verifyOtp({
            phone: formData.phone,
            token: formData.otp,
            type: 'sms',
          });

          if (error) {
            setError(`❌ ${error.message}`);
          } else {
            sessionStorage.setItem('swaply_just_logged_in', 'true');
            router.push(redirectTarget);
            router.refresh();
          }
        }
      } else {
        // Password authentication
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            setError('Email sau parolă incorecte');
          } else if (error.message.includes('Email not confirmed')) {
            setError('Te rugăm să îți confirmi emailul înainte să te autentifici');
          } else {
            setError(error.message);
          }
        } else if (data?.user) {
          // Check if user has 2FA enabled
          const { data: has2FA } = await supabase.rpc('user_has_2fa_enabled', {
            p_user_id: data.user.id,
          });

          if (has2FA) {
            // User has 2FA enabled - redirect to verification page
            // Sign out temporarily (will complete auth after 2FA verification)
            await supabase.auth.signOut();
            router.push(`/verify-2fa?userId=${data.user.id}&redirect=${encodeURIComponent(redirectTarget)}`);
          } else {
            // No 2FA - complete authentication
            sessionStorage.setItem('swaply_just_logged_in', 'true');
            router.push(redirectTarget);
            router.refresh();
          }
        }
      }
    } catch (err) {
      setError('A apărut o eroare neașteptată');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const supabase = getBrowserSupabase();
      const siteUrl = resolveSiteUrl();

      if (!siteUrl) {
        throw new Error('Nu putem determina domeniul pentru redirect. Verifică NEXT_PUBLIC_SITE_URL.');
      }

      const oauthRedirect = `${siteUrl}/auth/callback?next=${encodeURIComponent(redirectTarget)}`;
      console.log('🔗 signInWithOAuth will use redirect:', oauthRedirect);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: oauthRedirect,
        },
      });

      if (error) {
        setError('Eroare la autentificarea cu Google');
      }
    } catch (err) {
      setError('A apărut o eroare neașteptată');
      console.error('Google login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Bun venit înapoi!
            </h1>
            <p className="text-gray-600">
              Autentifică-te pentru a continua schimburile
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 text-sm">{success}</p>
            </div>
          )}

          {/* Auth Method Toggle */}
          <div className="mb-6">
            <div className="grid grid-cols-3 gap-2 p-1 bg-gray-100 rounded-lg">
              <button
                type="button"
                onClick={() => {
                  setAuthMethod('password');
                  setOtpSent(false);
                  setError('');
                  setSuccess('');
                }}
                className={`py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  authMethod === 'password'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                🔐 Parolă
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMethod('magic');
                  setOtpSent(false);
                  setError('');
                  setSuccess('');
                }}
                className={`py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  authMethod === 'magic'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                ✨ Link
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMethod('phone');
                  setOtpSent(false);
                  setError('');
                  setSuccess('');
                }}
                className={`py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  authMethod === 'phone'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                📱 Telefon
              </button>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {authMethod !== 'phone' && (
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required={authMethod === 'password' || authMethod === 'magic'}
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="exemplu@email.com"
                />
              </div>
            )}

            {authMethod === 'phone' && (
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Număr de telefon
                </label>
                <input
                  id="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+40 712 345 678"
                  disabled={otpSent}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Format: +40 (România), +1 (SUA), etc.
                </p>
              </div>
            )}

            {authMethod === 'phone' && otpSent && (
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                  Cod de verificare
                </label>
                <input
                  id="otp"
                  type="text"
                  required
                  value={formData.otp}
                  onChange={(e) => setFormData(prev => ({ ...prev, otp: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest"
                  placeholder="123456"
                  maxLength={6}
                />
                <button
                  type="button"
                  onClick={async () => {
                    setLoading(true);
                    setError('');
                    try {
                      const supabase = getBrowserSupabase();
                      const { error: resendError } = await supabase.auth.signInWithOtp({
                        phone: formData.phone,
                        options: { shouldCreateUser: false }
                      });
                      if (resendError) throw resendError;
                      setSuccess('Cod retrimis cu succes!');
                    } catch (err: unknown) {
                      setError(err instanceof Error ? err.message : 'Eroare la retrimitere cod');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-700 underline"
                >
                  Retrimite codul
                </button>
              </div>
            )}

            {authMethod === 'password' && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Parola
                </label>
                <input
                  id="password"
                  type="password"
                  required={authMethod === 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>
            )}

            {authMethod === 'magic' && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  📧 Vei primi un link magic pe email pentru autentificare instant, fără parolă!
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  {authMethod === 'magic' ? 'Se trimite...' : authMethod === 'phone' && !otpSent ? 'Se trimite cod...' : 'Se autentifică...'}
                </div>
              ) : (
                authMethod === 'magic' 
                  ? '✨ Trimite Link Magic' 
                  : authMethod === 'phone' && !otpSent 
                    ? '📱 Trimite Cod SMS' 
                    : authMethod === 'phone' && otpSent 
                      ? '✅ Verifică Cod' 
                      : '🔐 Autentificare'
              )}
            </button>

            {/* Forgot Password Link - only show for password auth */}
            {authMethod === 'password' && (
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => {
                    const email = formData.email;
                    if (!email) {
                      setError('Introdu email-ul mai întâi pentru a reseta parola');
                      return;
                    }
                    setLoading(true);
                    // Call reset password action
                    const form = new FormData();
                    form.append('email', email);
                    import('./reset-actions').then(({ resetPassword }) => {
                      resetPassword(form).finally(() => setLoading(false));
                    });
                  }}
                  disabled={loading}
                  className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
                >
                  Ai uitat parola?
                </button>
              </div>
            )}
          </form>

          {/* Divider */}
          <div className="mt-6 mb-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">sau</span>
              </div>
            </div>
          </div>

          {/* Google Login */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuă cu Google
          </button>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Nu ai cont?{' '}
              <Link href="/signup" className="text-blue-600 hover:text-blue-700 font-medium">
                Înregistrează-te aici
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Se încarcă...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}