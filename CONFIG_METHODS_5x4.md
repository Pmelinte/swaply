# 🔧 5 Metode Complete de Configurare pentru Fiecare Tip de Autentificare

## 📋 Cuprins
1. [Email + Password - 5 Metode Configurare](#email--password)
2. [Magic Link - 5 Metode Configurare](#magic-link)
3. [Google OAuth - 5 Metode Configurare](#google-oauth)
4. [Phone / SMS - 5 Metode Configurare](#phone--sms)

---

## 🔐 Email + Password

### Metoda 1: Configurare Básică cu Validare Email
**Timp: 5 minute**

**Pași:**
1. Supabase Dashboard → Authentication → Providers → Email
2. Toggle "Enable Email Provider" = ON
3. **Enable Email Confirmations** = ON
4. Email Templates → "Confirm signup"
5. Customizează template:
   ```html
   <h2>Bun venit pe Swaply!</h2>
   <p>Click pe link pentru a confirma email-ul:</p>
   <p><a href="{{ .ConfirmationURL }}">Confirmă Email</a></p>
   ```
6. Save

**Test:** Signup → Check email → Click link → Login

---

### Metoda 2: Rate Limiting și Security
**Timp: 10 minute**

**Pași:**
1. Supabase Dashboard → Authentication → Rate Limits
2. **Email Sign-ups per hour**: 5
3. **Password Sign-ins per hour**: 10
4. **Failed Login Attempts**: 5 (then captcha/block)
5. Supabase Dashboard → Authentication → Policies
6. Activează **Breach Password Protection**
7. Minimum password strength: **Strong**

**Configurare în cod:**
```typescript
// src/lib/auth/validation.ts
export const passwordValidation = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  forbiddenPasswords: ['password', '123456', 'qwerty']
};
```

**Test:** Încearcă parolă slabă → Eroare | Prea multe încercări → Rate limit

---

### Metoda 3: Two-Factor Authentication (2FA)
**Timp: 15 minute**

**Pași:**
1. Supabase Dashboard → Authentication → MFA
2. Enable **Time-based OTP (TOTP)**
3. Configurare în cod:
   ```typescript
   // După login cu password
   const { data, error } = await supabase.auth.mfa.enroll({
     factorType: 'totp',
     friendlyName: 'Swaply 2FA'
   });
   
   // User scanează QR code
   // Verificare:
   const { error: verifyError } = await supabase.auth.mfa.verify({
     factorId: data.id,
     challengeId: challenge.id,
     code: userEnteredCode
   });
   ```

**Test:** Login → Cere cod 2FA → Introdu din Authenticator app → Success

---

### Metoda 4: Custom Email Provider (SendGrid/Mailgun)
**Timp: 20 minute**

**Pași:**
1. Supabase Dashboard → Project Settings → Auth
2. SMTP Settings → **Enable custom SMTP**
3. Configurare SendGrid:
   ```
   Host: smtp.sendgrid.net
   Port: 587
   Username: apikey
   Password: [SendGrid API Key]
   Sender Email: noreply@swaply.ro
   Sender Name: Swaply Team
   ```
4. Test email delivery
5. Customizează toate email templates cu branding Swaply

**Test:** Signup → Primește email branded → Click confirm → Funcționează

---

### Metoda 5: Social Login Fallback
**Timp: 10 minute**

**Pași:**
1. Permite signup cu email dar fără confirmare instant dacă user vine din social login
2. Configurare:
   ```typescript
   // Dacă user are email verificat din Google
   if (session.user.email_verified) {
     // Skip email confirmation
     await supabase.auth.updateUser({
       email: session.user.email,
       email_confirm: true
     });
   }
   ```
3. Link multiple providers la același account
4. Supabase Dashboard → Authentication → Settings
5. Enable "Automatic Account Linking"

**Test:** Login Google → Email auto-verified → Login cu password → Same account

---

## ✨ Magic Link

### Metoda 1: Standard Magic Link (DEPLOYED ✅)
**Timp: 2 minute**

**Pași:**
1. Supabase Dashboard → Authentication → Providers → Email
2. **Enable Magic Link** = ON (default enabled)
3. Callback URL: `https://swaply-site.vercel.app/auth/callback`
4. Email Template → "Magic Link"
5. Test în UI

**Dual Flow Support:**
```typescript
// Callback acceptă BOTH:
const code = url.searchParams.get("code");        // OAuth PKCE
const token_hash = url.searchParams.get("token_hash"); // Magic Link

const { data } = code 
  ? await supabase.auth.exchangeCodeForSession(code)
  : await supabase.auth.verifyOtp({ token_hash, type });
```

**Test:** Click "Link Magic" → Check email → Click link → Logged in

---

### Metoda 2: Custom Branded Email Template
**Timp: 15 minute**

**Pași:**
1. Supabase Dashboard → Authentication → Email Templates
2. Select "Magic Link" template
3. Design custom HTML:
   ```html
   <!DOCTYPE html>
   <html>
   <head>
     <style>
       body { font-family: Arial; background: #f3f4f6; }
       .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; }
       .button { background: #3b82f6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; }
     </style>
   </head>
   <body>
     <div class="container">
       <h1 style="color: #1e40af;">🎉 Link-ul tău magic Swaply</h1>
       <p>Bună! Click pe butonul de mai jos pentru a te autentifica instant:</p>
       <p style="text-align: center; margin: 30px 0;">
         <a href="{{ .ConfirmationURL }}" class="button">✨ Intră pe Swaply</a>
       </p>
       <p style="color: #6b7280; font-size: 14px;">
         Link-ul expiră în 1 oră. Dacă nu ai solicitat acest email, poți să-l ignori.
       </p>
     </div>
   </body>
   </html>
   ```
4. Save template

**Test:** Request magic link → Email arată branded → Click → Success

---

### Metoda 3: Link Expiry Customization
**Timp: 5 minute**

**Pași:**
1. Supabase Dashboard → Authentication → Settings
2. **Magic Link Expiry**: 3600 (1 oră default)
3. Customize în cod pentru link mai scurt:
   ```typescript
   const { error } = await supabase.auth.signInWithOtp({
     email: formData.email,
     options: {
       emailRedirectTo: `${window.location.origin}/auth/callback`,
       shouldCreateUser: true,
       // Custom expiry (NOT directly supported, handled by Supabase)
     }
   });
   ```
4. Sau configurare globală în Supabase Settings → Auth → JWT Expiry

**Test:** Request link → Wait 1 hour → Try link → Expired error

---

### Metoda 4: One-Time Password (OTP) Fallback
**Timp: 10 minute**

**Pași:**
1. Dacă Magic Link nu funcționează (email blocat, etc.), oferă OTP ca fallback
2. Implementare:
   ```typescript
   // Send OTP instead of link
   const { error } = await supabase.auth.signInWithOtp({
     email: formData.email,
     options: {
       shouldCreateUser: true,
       // OTP sent to email instead of link
     }
   });
   
   // User enters 6-digit code
   const { error: verifyError } = await supabase.auth.verifyOtp({
     email: formData.email,
     token: userCode,
     type: 'email'
   });
   ```
3. UI toggle: "Nu ai primit link-ul? → Introdu codul din email"

**Test:** Request OTP → Check email for code → Enter code → Login

---

### Metoda 5: SMS Fallback for Email Issues
**Timp: 15 minute**

**Pași:**
1. Dacă email-ul nu ajunge, oferă SMS OTP ca alternativă
2. UI flow:
   ```
   Email login fails → "Probleme cu email-ul?" 
   → "Încearcă SMS" → Phone input appears
   → Send SMS OTP → Verify code
   ```
3. Implementare:
   ```typescript
   const [showPhoneFallback, setShowPhoneFallback] = useState(false);
   
   // După 2 minute dacă nu click pe link
   useEffect(() => {
     const timer = setTimeout(() => {
       setShowPhoneFallback(true);
     }, 120000); // 2 minutes
     return () => clearTimeout(timer);
   }, [magicLinkSent]);
   ```

**Test:** Request magic link → Wait 2 min → Phone option appears → Send SMS → Success

---

## 🔴 Google OAuth

### Metoda 1: Standard OAuth Flow (DEPLOYED ✅)
**Timp: 15 minute**

**Pași:**
1. Google Cloud Console → Create Project "Swaply"
2. APIs & Services → OAuth consent screen
3. User Type: **External** → Create
4. App name: "Swaply"
5. Support email: your@email.com
6. Authorized domains: `swaply-site.vercel.app`
7. Save
8. Credentials → Create OAuth 2.0 Client ID
9. Application type: **Web application**
10. Authorized redirect URIs:
    ```
    https://swaply-site.vercel.app/auth/callback
    https://[your-project-ref].supabase.co/auth/v1/callback
    ```
11. Copy Client ID și Client Secret
12. Supabase Dashboard → Authentication → Providers → Google
13. Enable Google
14. Paste Client ID și Client Secret
15. Save

**Test:** Click "Continuă cu Google" → Select account → Redirect → Logged in

---

### Metoda 2: Popup Mode pentru Seamless UX
**Timp: 10 minute**

**Pași:**
1. Modifică flow-ul să folosească popup în loc de redirect
2. Implementare:
   ```typescript
   const handleGoogleLogin = async () => {
     const { data, error } = await supabase.auth.signInWithOAuth({
       provider: 'google',
       options: {
         redirectTo: `${window.location.origin}/auth/callback`,
         queryParams: {
           access_type: 'offline',
           prompt: 'consent',
         },
         // Popup mode configuration
         skipBrowserRedirect: false, // Keep false for full redirect
       }
     });
   };
   
   // Pentru popup mode adevărat (advanced):
   const popup = window.open(authUrl, 'google-auth', 'width=500,height=600');
   // Listen for postMessage from popup
   window.addEventListener('message', (event) => {
     if (event.data.type === 'auth-success') {
       popup.close();
       // Handle session
     }
   });
   ```

**Test:** Click Google → Popup window → Login → Popup close → Main window logged in

---

### Metoda 3: Auto Profile Sync cu Google Data
**Timp: 20 minute**

**Pași:**
1. Request additional Google scopes
2. Configurare:
   ```typescript
   const { data, error } = await supabase.auth.signInWithOAuth({
     provider: 'google',
     options: {
       scopes: 'email profile https://www.googleapis.com/auth/userinfo.profile',
       redirectTo: `${window.location.origin}/auth/callback`,
     }
   });
   ```
3. După login, sincronizează datele:
   ```typescript
   // În callback după successful login
   const { data: { user } } = await supabase.auth.getUser();
   
   // Sync profile
   await supabase.from('user_profiles').upsert({
     id: user.id,
     email: user.email,
     display_name: user.user_metadata.full_name,
     avatar_url: user.user_metadata.avatar_url,
     // Additional Google data
     google_id: user.user_metadata.sub,
   });
   ```

**Test:** Google login → Profile auto-populated → Avatar uploaded → Name synced

---

### Metoda 4: Multiple Google Accounts Support
**Timp: 10 minute**

**Pași:**
1. Permite user să aleagă contul Google de fiecare dată
2. Configurare:
   ```typescript
   const { data, error } = await supabase.auth.signInWithOAuth({
     provider: 'google',
     options: {
       redirectTo: `${window.location.origin}/auth/callback`,
       queryParams: {
         prompt: 'select_account', // Force account selection
         access_type: 'offline',
       },
     }
   });
   ```
3. Supabase va arăta account picker de fiecare dată

**Test:** Click Google → Shows all Google accounts → Select different one → Works

---

### Metoda 5: Google One Tap Sign-In
**Timp: 25 minute**

**Pași:**
1. Implementează Google One Tap pentru instant login
2. Add Google script:
   ```html
   <script src="https://accounts.google.com/gsi/client" async defer></script>
   ```
3. Implementare:
   ```typescript
   useEffect(() => {
     if (window.google) {
       window.google.accounts.id.initialize({
         client_id: 'YOUR_GOOGLE_CLIENT_ID',
         callback: handleGoogleOneTap,
         auto_select: true,
       });
       
       window.google.accounts.id.prompt();
     }
   }, []);
   
   const handleGoogleOneTap = async (response: any) => {
     // Exchange Google token for Supabase session
     const { data, error } = await supabase.auth.signInWithIdToken({
       provider: 'google',
       token: response.credential,
     });
   };
   ```

**Test:** Visit site → Google One Tap appears automatically → Click → Instant login

---

## 📱 Phone / SMS

### Metoda 1: Twilio SMS (UI DEPLOYED ✅, NEEDS CONFIG)
**Timp: 15 minute**

**Pași:**
1. Create Twilio Account: https://console.twilio.com/
2. Get credentials:
   - Account SID (34 chars, starts with AC)
   - Auth Token (32 chars)
   - Phone Number (+1234567890)
3. Supabase Dashboard → Authentication → Providers → Phone
4. Enable Phone provider
5. Select Twilio
6. Enter credentials:
   ```
   Twilio Account SID: ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   Twilio Auth Token: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   Twilio Phone Number: +1234567890
   ```
7. SMS Template:
   ```
   Codul tău Swaply: {{ .Code }}
   
   Valabil 5 minute.
   ```
8. Save

**Test:** Enter phone → Send OTP → Check SMS → Enter code → Login

---

### Metoda 2: WhatsApp Business API
**Timp: 30 minute**

**Pași:**
1. Twilio WhatsApp Setup:
   - Console → Messaging → Try it Out → Try WhatsApp
   - Get WhatsApp-enabled number
2. WhatsApp Business Account:
   - Meta Business Suite → WhatsApp
   - Verify business
   - Get API access
3. Supabase configuration (custom):
   ```typescript
   // Custom WhatsApp integration
   const sendWhatsAppOTP = async (phone: string) => {
     const otp = generateOTP();
     
     // Twilio WhatsApp API
     const response = await fetch('https://api.twilio.com/2010-04-01/Accounts/[SID]/Messages.json', {
       method: 'POST',
       headers: {
         'Authorization': 'Basic ' + btoa(`${TWILIO_SID}:${TWILIO_TOKEN}`),
         'Content-Type': 'application/x-www-form-urlencoded',
       },
       body: new URLSearchParams({
         From: 'whatsapp:+14155238886', // Twilio WhatsApp number
         To: `whatsapp:${phone}`,
         Body: `Codul tău Swaply: ${otp}. Valabil 5 minute.`,
       }),
     });
     
     // Store OTP in database for verification
     await storeOTP(phone, otp);
   };
   ```

**Test:** Enter phone → "Send via WhatsApp" → WhatsApp message → Enter code → Login

---

### Metoda 3: Vonage (Nexmo) Fallback
**Timp: 20 minute**

**Pași:**
1. Vonage Account: https://dashboard.nexmo.com/
2. Get API credentials:
   - API Key
   - API Secret
3. Buy phone number with SMS capability
4. Supabase Dashboard → Phone Provider → Select Vonage
5. Enter credentials:
   ```
   Vonage API Key: xxxxxxxx
   Vonage API Secret: xxxxxxxxxxxxxxxx
   Vonage Number: +447xxxxxxxxx
   ```
6. Implementează fallback logic:
   ```typescript
   const sendOTP = async (phone: string) => {
     // Try Twilio first
     let result = await sendTwilioSMS(phone);
     
     if (result.error) {
       // Fallback to Vonage
       result = await sendVonageSMS(phone);
     }
     
     return result;
   };
   ```

**Test:** Twilio fails → Auto-switch to Vonage → SMS received → Success

---

### Metoda 4: International SMS Support
**Timp: 15 minute**

**Pași:**
1. Twilio Geo Permissions:
   - Console → Messaging → Settings → Geo Permissions
   - Enable countries: România, US, UK, Germany, France, etc.
2. Country code validation:
   ```typescript
   const supportedCountries = ['+40', '+1', '+44', '+49', '+33'];
   
   const validatePhone = (phone: string) => {
     const hasValidPrefix = supportedCountries.some(code => 
       phone.startsWith(code)
     );
     
     if (!hasValidPrefix) {
       throw new Error('Country not supported');
     }
     
     return phone;
   };
   ```
3. UI country selector:
   ```typescript
   <select value={countryCode} onChange={e => setCountryCode(e.target.value)}>
     <option value="+40">🇷🇴 România (+40)</option>
     <option value="+1">🇺🇸 SUA (+1)</option>
     <option value="+44">🇬🇧 UK (+44)</option>
   </select>
   <input 
     type="tel" 
     placeholder="712 345 678"
     value={phoneNumber}
   />
   ```

**Test:** Select România → Enter 712345678 → SMS to +40712345678 → Success

---

### Metoda 5: Voice Call OTP Fallback
**Timp: 20 minute**

**Pași:**
1. Twilio Voice API setup
2. Implementare:
   ```typescript
   const sendVoiceOTP = async (phone: string, otp: string) => {
     const response = await fetch('https://api.twilio.com/2010-04-01/Accounts/[SID]/Calls.json', {
       method: 'POST',
       headers: {
         'Authorization': 'Basic ' + btoa(`${TWILIO_SID}:${TWILIO_TOKEN}`),
         'Content-Type': 'application/x-www-form-urlencoded',
       },
       body: new URLSearchParams({
         From: TWILIO_NUMBER,
         To: phone,
         Twiml: `
           <Response>
             <Say language="ro-RO">
               Codul tău Swaply este: 
               ${otp.split('').join(', ')}
               Repet: ${otp.split('').join(', ')}
             </Say>
           </Response>
         `,
       }),
     });
   };
   ```
3. UI toggle: "Nu ai primit SMS? → Primește apel telefonic"

**Test:** Request voice OTP → Phone rings → Listen to code → Enter → Login

---

## 📊 Rezumat

| Method | Email+Password | Magic Link | Google OAuth | Phone/SMS |
|--------|----------------|------------|--------------|-----------|
| **Metoda 1** | Basic + Email Confirm | Standard (DEPLOYED) | Standard OAuth | Twilio SMS |
| **Metoda 2** | Rate Limiting | Branded Template | Popup Mode | WhatsApp |
| **Metoda 3** | 2FA (TOTP) | Link Expiry | Profile Sync | Vonage Fallback |
| **Metoda 4** | Custom SMTP | OTP Fallback | Multiple Accounts | International |
| **Metoda 5** | Social Fallback | SMS Fallback | One Tap | Voice Call |

**Total:** 20 metode de configurare (5 × 4 auth types)
