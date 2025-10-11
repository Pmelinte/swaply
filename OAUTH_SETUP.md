# OAuth Authentication Setup Guide

## Overview
Acest ghid te ajută să configurezi autentificarea cu Google, Facebook, Apple și Phone în Supabase pentru Swaply.

---

## ✅ Ce funcționează ACUM (fără setup suplimentar):

### 1. **Email/Password Login**
- ✅ Login: `/login`
- ✅ Signup: `/signup`
- ✅ Logout: Buton în meniul top-right (⋯)
- ✅ Password reset: Integrat în Supabase

**Cum testezi:**
```bash
1. Deschide http://localhost:3000
2. Click "Înregistrează-te" 
3. Creează cont cu email + password
4. Confirmă emailul (check inbox)
5. Login cu credențialele create
6. Click ⋯ (top-right) → "Deconectare"
```

---

## 🔧 Ce NECESITĂ configurare manuală:

### 2. **Google OAuth**

#### Pasul 1: Google Cloud Console
1. Mergi la [Google Cloud Console](https://console.cloud.google.com)
2. Creează un nou proiect sau selectează unul existent
3. Activează "Google+ API"
4. Mergi la "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Configurează "OAuth consent screen":
   - User Type: External
   - App name: Swaply
   - User support email: [email-ul tău]
   - Developer contact: [email-ul tău]

6. Creează OAuth Client ID:
   - Application type: Web application
   - Authorized JavaScript origins:
     ```
     http://localhost:3000
     https://[your-vercel-domain].vercel.app
     ```
   - Authorized redirect URIs:
     ```
     https://[your-supabase-project].supabase.co/auth/v1/callback
     ```

7. **COPIAZĂ** Client ID și Client Secret

#### Pasul 2: Supabase Configuration
1. Deschide [Supabase Dashboard](https://app.supabase.com)
2. Selectează proiectul tău
3. Mergi la: **Authentication** → **Providers** → **Google**
4. Enable Google
5. Lipește:
   - **Client ID** (de la Google)
   - **Client Secret** (de la Google)
6. Save

#### Pasul 3: Cod (deja pregătit)
În `src/app/(auth)/login/page.tsx`, adaugă buton:
```tsx
// Deja există în cod, dar trebuie decommentat după configurare
<button
  onClick={async () => {
    const supabase = getBrowserSupabase();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
  }}
  className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
>
  <span>🔵</span> Continuă cu Google
</button>
```

---

### 3. **Facebook OAuth**

#### Pasul 1: Facebook Developers
1. Mergi la [Facebook Developers](https://developers.facebook.com)
2. Creează o nouă aplicație (App Type: Consumer)
3. Mergi la "Add Product" → selectează "Facebook Login"
4. Configurează Facebook Login:
   - Valid OAuth Redirect URIs:
     ```
     https://[your-supabase-project].supabase.co/auth/v1/callback
     ```

5. Mergi la **Settings** → **Basic**
6. **COPIAZĂ** App ID și App Secret

#### Pasul 2: Supabase Configuration
1. Dashboard → **Authentication** → **Providers** → **Facebook**
2. Enable Facebook
3. Lipește:
   - **App ID**
   - **App Secret**
4. Save

#### Pasul 3: Cod
```tsx
<button
  onClick={async () => {
    const supabase = getBrowserSupabase();
    await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
  }}
  className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
>
  <span>🔵</span> Continuă cu Facebook
</button>
```

---

### 4. **Apple Sign In**

#### Pasul 1: Apple Developer
1. Mergi la [Apple Developer](https://developer.apple.com)
2. Certificates, Identifiers & Profiles → Identifiers
3. Creează nou Service ID:
   - Description: Swaply
   - Identifier: com.swaply.auth
4. Configure "Sign in with Apple":
   - Return URLs:
     ```
     https://[your-supabase-project].supabase.co/auth/v1/callback
     ```

5. Creează Key pentru "Sign in with Apple"
6. **COPIAZĂ**: Service ID, Team ID, Key ID, și descarcă fișierul .p8

#### Pasul 2: Supabase Configuration
1. Dashboard → **Authentication** → **Providers** → **Apple**
2. Enable Apple
3. Lipește:
   - **Service ID**
   - **Team ID**
   - **Key ID**
   - **Private Key** (conținutul fișierului .p8)
4. Save

#### Pasul 3: Cod
```tsx
<button
  onClick={async () => {
    const supabase = getBrowserSupabase();
    await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
  }}
  className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
>
  <span>🍎</span> Continuă cu Apple
</button>
```

---

### 5. **Phone Authentication**

⚠️ **IMPORTANT:** Phone auth necesită plan plătit la Supabase SAU configurare Twilio

#### Opțiunea A: Supabase Pro (cel mai simplu)
1. Upgrade plan Supabase la Pro ($25/lună)
2. Dashboard → **Authentication** → **Providers** → **Phone**
3. Enable Phone
4. Configurare automată

#### Opțiunea B: Twilio (custom)
1. Creează cont [Twilio](https://www.twilio.com)
2. Get: Account SID, Auth Token, Phone Number
3. Supabase → **Settings** → **Auth** → **SMS Provider**
4. Configurează Twilio credentials

#### Cod
```tsx
// Phone number input
<input
  type="tel"
  placeholder="+40 XXX XXX XXX"
  onChange={(e) => setPhoneNumber(e.target.value)}
/>

// Send OTP
<button
  onClick={async () => {
    const supabase = getBrowserSupabase();
    const { error } = await supabase.auth.signInWithOtp({
      phone: phoneNumber,
    });
    if (!error) {
      setStep('verify-otp');
    }
  }}
>
  Trimite cod
</button>

// Verify OTP
<button
  onClick={async () => {
    const supabase = getBrowserSupabase();
    const { error } = await supabase.auth.verifyOtp({
      phone: phoneNumber,
      token: otpCode,
      type: 'sms'
    });
  }}
>
  Verifică
</button>
```

---

## 🔐 Two-Factor Authentication (2FA)

### Cum funcționează:
1. User se loghează normal (email/password/OAuth)
2. Dacă 2FA e activat → cere cod TOTP
3. User introduce codul din app (Google Authenticator, Authy, etc.)

### Setup în Supabase:
1. Dashboard → **Authentication** → **Configuration**
2. Enable "Multi-Factor Authentication"
3. Alege: **TOTP** (Time-based One-Time Password)

### Cod pentru activare 2FA:
```tsx
// User activează 2FA din profil
const enable2FA = async () => {
  const supabase = getBrowserSupabase();
  
  // Generate QR code
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp'
  });
  
  if (data) {
    // Afișează QR code pentru user să scaneze
    setQrCode(data.totp.qr_code);
    setSecret(data.totp.secret);
  }
};

// User verifică codul
const verify2FA = async (code: string) => {
  const supabase = getBrowserSupabase();
  
  const { data, error } = await supabase.auth.mfa.verify({
    factorId: factorId,
    code: code
  });
  
  if (!error) {
    alert('2FA activat cu succes!');
  }
};
```

### Login cu 2FA:
```tsx
const loginWith2FA = async () => {
  // Step 1: Login normal
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (data?.user && !error) {
    // Step 2: Check if 2FA is required
    const { data: factors } = await supabase.auth.mfa.listFactors();
    
    if (factors && factors.totp && factors.totp.length > 0) {
      // Cere codul 2FA
      setNeedsTotp(true);
    }
  }
};

// User introduce codul TOTP
const verifyTotp = async (code: string) => {
  const { data, error } = await supabase.auth.mfa.challengeAndVerify({
    factorId: factorId,
    code: code
  });
  
  if (!error) {
    router.push('/'); // Success!
  }
};
```

---

## 🚀 Vercel Deployment

### Pasul 1: Pregătire
```bash
# Verifică că totul compilează
npm run build

# Testează build local
npm start
```

### Pasul 2: Environment Variables
Creează fișier `.env.production`:
```env
NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_cloudinary_preset
```

### Pasul 3: Vercel Dashboard
1. Mergi la [Vercel Dashboard](https://vercel.com)
2. Click "Add New" → "Project"
3. Import repository-ul GitHub
4. Configurează:
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
5. Adaugă Environment Variables (din `.env.production`)
6. Click "Deploy"

### Pasul 4: După Deploy
1. Configurează domain custom (opțional)
2. Update Supabase Redirect URLs:
   - Dashboard → **Authentication** → **URL Configuration**
   - Add: `https://your-app.vercel.app/auth/callback`
3. Update OAuth Redirect URIs în Google/Facebook/Apple

---

## ✅ Testing Checklist

După ce ai configurat totul:

### Email/Password
- [ ] Signup cu email nou
- [ ] Verificare email
- [ ] Login cu credențialele noi
- [ ] Logout din meniul top-right
- [ ] Site revine la logged-out state

### Google OAuth
- [ ] Click "Continuă cu Google"
- [ ] Selectează contul Google
- [ ] Redirect la Swaply
- [ ] Verifică că user e logat
- [ ] Logout

### Facebook OAuth
- [ ] Click "Continuă cu Facebook"
- [ ] Autorizează aplicația
- [ ] Redirect la Swaply
- [ ] Verifică că user e logat
- [ ] Logout

### Apple Sign In
- [ ] Click "Continuă cu Apple"
- [ ] Autorizează cu Face ID/Touch ID
- [ ] Redirect la Swaply
- [ ] Verifică că user e logat
- [ ] Logout

### Phone Auth
- [ ] Introduce număr de telefon
- [ ] Primește SMS cu cod
- [ ] Introduce codul
- [ ] Verifică că user e logat
- [ ] Logout

### 2FA
- [ ] Activează 2FA din profil
- [ ] Scanează QR code cu authenticator app
- [ ] Logout
- [ ] Login → cere codul 2FA
- [ ] Introduce codul din app
- [ ] Verifică că e logat

---

## 📞 Support

Dacă ai probleme:
1. Check Supabase logs: Dashboard → **Logs** → **Auth Logs**
2. Check browser console pentru erori
3. Verifică că toate redirect URIs sunt configurate corect

**IMPORTANT:** Toate OAuth providers necesită HTTPS în producție (funcționează doar pe localhost în development).
