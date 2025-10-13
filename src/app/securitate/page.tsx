'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getBrowserSupabase } from '@/lib/supabase/client';
import { useI18n } from '@/lib/i18n';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

export default function SecurityPage() {
  const router = useRouter();
  const { locale } = useI18n();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [secret, setSecret] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const supabase = getBrowserSupabase();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);
      await check2FAStatus(user.id);
    } catch (error) {
      console.error('Auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  const check2FAStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_2fa')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setTwoFAEnabled(data.enabled);
        setSecret(data.secret);
      }
    } catch (error) {
      console.error('Error checking 2FA status:', error);
    }
  };

  const generateSecret = async () => {
    try {
      const newSecret = speakeasy.generateSecret({
        name: `Swaply (${user.email})`,
        issuer: 'Swaply',
        length: 32,
      });

      setSecret(newSecret.base32);

      // Generate QR code
      const qrUrl = await QRCode.toDataURL(newSecret.otpauth_url || '');
      setQrCodeUrl(qrUrl);

      // Generate backup codes
      const { data: codes } = await supabase.rpc('generate_backup_codes');
      setBackupCodes(codes || []);

      setError(null);
    } catch (error) {
      console.error('Error generating secret:', error);
      setError(locale === 'ro' 
        ? 'Eroare la generarea secretului'
        : 'Error generating secret');
    }
  };

  const enable2FA = async () => {
    if (!secret || !verificationCode) {
      setError(locale === 'ro' 
        ? 'Te rog introdu codul de verificare'
        : 'Please enter verification code');
      return;
    }

    try {
      // Verify code
      const verified = speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: verificationCode,
        window: 2,
      });

      if (!verified) {
        setError(locale === 'ro' 
          ? 'Cod invalid. Încearcă din nou.'
          : 'Invalid code. Try again.');
        return;
      }

      // Save to database
      const { error: dbError } = await supabase
        .from('user_2fa')
        .upsert({
          user_id: user.id,
          secret: secret,
          enabled: true,
          backup_codes: backupCodes,
        });

      if (dbError) throw dbError;

      setTwoFAEnabled(true);
      setShowBackupCodes(true);
      setSuccess(locale === 'ro' 
        ? '2FA activat cu succes!'
        : '2FA enabled successfully!');
      setVerificationCode('');
      setQrCodeUrl(null);
    } catch (error: any) {
      console.error('Error enabling 2FA:', error);
      setError(error.message || (locale === 'ro' 
        ? 'Eroare la activarea 2FA'
        : 'Error enabling 2FA'));
    }
  };

  const disable2FA = async () => {
    if (!confirm(locale === 'ro' 
      ? 'Sigur vrei să dezactivezi 2FA?'
      : 'Are you sure you want to disable 2FA?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('user_2fa')
        .update({ enabled: false })
        .eq('user_id', user.id);

      if (error) throw error;

      setTwoFAEnabled(false);
      setSecret(null);
      setQrCodeUrl(null);
      setBackupCodes([]);
      setSuccess(locale === 'ro' 
        ? '2FA dezactivat'
        : '2FA disabled');
    } catch (error: any) {
      console.error('Error disabling 2FA:', error);
      setError(error.message || (locale === 'ro' 
        ? 'Eroare la dezactivarea 2FA'
        : 'Error disabling 2FA'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🔐 {locale === 'ro' ? 'Securitate' : 'Security'}
          </h1>
          <p className="text-gray-600">
            {locale === 'ro' 
              ? 'Configurează autentificarea în doi pași'
              : 'Configure two-factor authentication'}
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-600">{success}</p>
          </div>
        )}

        {/* 2FA Status Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {locale === 'ro' ? 'Autentificare în Doi Pași' : 'Two-Factor Authentication'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {twoFAEnabled 
                  ? (locale === 'ro' ? 'Activat ✓' : 'Enabled ✓')
                  : (locale === 'ro' ? 'Dezactivat' : 'Disabled')}
              </p>
            </div>
            <div className={`text-4xl ${twoFAEnabled ? 'text-green-500' : 'text-gray-300'}`}>
              {twoFAEnabled ? '🔒' : '🔓'}
            </div>
          </div>

          {!twoFAEnabled && !qrCodeUrl && (
            <div className="space-y-4">
              <p className="text-gray-700">
                {locale === 'ro' 
                  ? 'Protejează-ți contul cu autentificare în doi pași. Vei avea nevoie de o aplicație de autentificare precum Google Authenticator sau Authy.'
                  : 'Protect your account with two-factor authentication. You\'ll need an authenticator app like Google Authenticator or Authy.'}
              </p>
              <button
                onClick={generateSecret}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                {locale === 'ro' ? 'Activează 2FA' : 'Enable 2FA'}
              </button>
            </div>
          )}

          {!twoFAEnabled && qrCodeUrl && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">
                  {locale === 'ro' ? 'Pasul 1: Scanează codul QR' : 'Step 1: Scan QR Code'}
                </h3>
                <div className="flex justify-center bg-white p-4 rounded-lg border border-gray-200">
                  <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64" />
                </div>
                <p className="text-sm text-gray-600 mt-3 text-center">
                  {locale === 'ro' 
                    ? 'Sau introdu manual codul:'
                    : 'Or enter the code manually:'}
                </p>
                <p className="text-center font-mono text-sm bg-gray-100 p-3 rounded mt-2 break-all">
                  {secret}
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">
                  {locale === 'ro' ? 'Pasul 2: Verifică codul' : 'Step 2: Verify Code'}
                </h3>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-center text-2xl font-mono tracking-widest focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={enable2FA}
                disabled={verificationCode.length !== 6}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {locale === 'ro' ? 'Confirmă și Activează' : 'Confirm and Enable'}
              </button>
            </div>
          )}

          {twoFAEnabled && (
            <div className="space-y-4">
              <p className="text-gray-700">
                {locale === 'ro' 
                  ? '2FA este activ. Contul tău este protejat cu autentificare în doi pași.'
                  : '2FA is active. Your account is protected with two-factor authentication.'}
              </p>
              <button
                onClick={disable2FA}
                className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
              >
                {locale === 'ro' ? 'Dezactivează 2FA' : 'Disable 2FA'}
              </button>
            </div>
          )}
        </div>

        {/* Backup Codes */}
        {showBackupCodes && backupCodes.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">
              ⚠️ {locale === 'ro' ? 'Coduri de Rezervă' : 'Backup Codes'}
            </h3>
            <p className="text-sm text-gray-700 mb-4">
              {locale === 'ro' 
                ? 'Salvează aceste coduri într-un loc sigur. Poți folosi fiecare cod o singură dată dacă pierzi accesul la aplicația de autentificare.'
                : 'Save these codes in a safe place. You can use each code once if you lose access to your authenticator app.'}
            </p>
            <div className="grid grid-cols-2 gap-3 bg-white p-4 rounded border border-yellow-300">
              {backupCodes.map((code, index) => (
                <div
                  key={index}
                  className="font-mono text-sm bg-gray-50 p-2 rounded text-center"
                >
                  {code}
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowBackupCodes(false)}
              className="mt-4 text-sm text-gray-600 hover:text-gray-800"
            >
              {locale === 'ro' ? 'Am salvat codurile ✓' : 'I saved the codes ✓'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
