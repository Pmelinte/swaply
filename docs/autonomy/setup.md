# Autonomy Framework – Setup & Configuration

> **Purpose**: Document how to recreate access, credentials, and environment for agent autonomy. Use this when starting fresh or after credential rotation.

---

## 🔧 Local Development Setup

### Prerequisites
- Node.js 18+ installed
- npm or pnpm installed
- Git configured
- VS Code (recommended) or preferred editor

### Initial Clone & Install
```bash
git clone https://github.com/Pmelinte/swaply.git
cd swaply
npm install
```

### Environment Variables
Create `.env.local` in project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://ooebonjoqrpouzfjiiiz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[get from Supabase dashboard]

# Site URL (local development)
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Cloudinary (for image uploads)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=[get from Cloudinary dashboard]
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=[get from Cloudinary dashboard]

# Google OAuth (optional for local testing)
GOOGLE_CLIENT_ID=[get from Google Cloud Console]
GOOGLE_CLIENT_SECRET=[get from Google Cloud Console]

# Optional: Auth callback logging
NEXT_PUBLIC_LOG_AUTH_CALLBACK=1
AUTH_CALLBACK_LOGGING=1
AUTH_CALLBACK_LOG_DIR=.logs
AUTH_CALLBACK_LOG_FILE=auth-callback.log

# Optional: E2E testing (magic link emails)
E2E_MAIL_HOST=[IMAP server host]
E2E_MAIL_PORT=993
E2E_MAIL_USER=[email address]
E2E_MAIL_PASSWORD=[email password or app-specific password]
E2E_MAIL_SUBJECT=Your Magic Link
E2E_MAIL_FOLDER=INBOX
E2E_MAIL_LINK_REGEX=https?://[^\s"'<>]+
```

### Verify Setup
```bash
npm run lint       # Should pass with no errors
npm run typecheck  # Should pass with no errors
npm run dev        # Should start on localhost:3000
```

Visit `http://localhost:3000` – should see homepage without errors.

---

## 🗄️ Supabase Configuration

### Dashboard Access
- **URL**: https://supabase.com/dashboard/project/ooebonjoqrpouzfjiiiz
- **Project**: swaply
- **Region**: Europe (eu-central-1)

### Required Settings

#### Authentication → URL Configuration
```
Site URL: https://swaply-site.vercel.app
Redirect URLs: https://swaply-site.vercel.app/auth/callback
              http://localhost:3000/auth/callback (for local testing)
```

#### Authentication → Providers

**Email (Magic Link)**
- ✅ Enable Email Provider
- ✅ Confirm Email (optional, but recommended)
- Email Template: Use default Supabase template or custom template in Supabase

**Google OAuth**
- ✅ Enable Google Provider
- Client ID: [from Google Cloud Console]
- Client Secret: [from Google Cloud Console]
- Authorized redirect URIs in Google Console:
  - `https://ooebonjoqrpouzfjiiiz.supabase.co/auth/v1/callback`

**Phone (SMS via Twilio)**
- ✅ Enable Phone Provider
- Twilio Account SID: [from Twilio dashboard]
- Twilio Auth Token: [from Twilio dashboard]
- Twilio Phone Number: [your Twilio number]

### Database Schema
- **Migration files**: `database/migrations/`
- **Apply locally**: `npm run db:migrate` (if script exists) or use Supabase CLI
- **Production migrations**: Run via Supabase Dashboard → Database → Migrations

### API Keys
Get from Supabase Dashboard → Settings → API:
- `NEXT_PUBLIC_SUPABASE_URL`: Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: anon/public key (safe for client-side)
- `SUPABASE_SERVICE_ROLE_KEY`: service role key (server-side only, **never expose**)

---

## ☁️ Vercel Deployment

### Dashboard Access
- **URL**: https://vercel.com/pmelinte/swaply
- **Project**: swaply
- **Team**: pmelinte (personal account)

### Environment Variables (Production)
Set in Vercel Dashboard → Settings → Environment Variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://ooebonjoqrpouzfjiiiz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon key from Supabase]
NEXT_PUBLIC_SITE_URL=https://swaply-site.vercel.app
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=[cloudinary cloud name]
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=[cloudinary preset]
GOOGLE_CLIENT_ID=[Google OAuth client ID]
GOOGLE_CLIENT_SECRET=[Google OAuth client secret]
```

**Important**: Mark `GOOGLE_CLIENT_SECRET` and any other secrets as **secret** (checkbox in Vercel).

### Deployment Settings
- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`
- **Development Command**: `npm run dev`

### Git Integration
- **Connected Repository**: `github.com/Pmelinte/swaply`
- **Production Branch**: `main`
- **Auto-deploy**: ✅ Enabled on push to main

### Custom Domain (if configured)
- Primary: `swaply-site.vercel.app`
- Custom domain: [if any, e.g., swaply.ro]

---

## 🔑 Google OAuth Setup

### Google Cloud Console
- **Project**: Swaply
- **Console URL**: https://console.cloud.google.com

### OAuth 2.0 Client ID
Navigate to: APIs & Services → Credentials

**Create OAuth Client ID** (if not exists):
- Application type: Web application
- Name: Swaply Production
- Authorized JavaScript origins:
  - `https://swaply-site.vercel.app`
  - `http://localhost:3000` (for local testing)
- Authorized redirect URIs:
  - `https://ooebonjoqrpouzfjiiiz.supabase.co/auth/v1/callback`

Copy:
- Client ID → Use in environment variables
- Client Secret → Use in environment variables (keep secret!)

### OAuth Consent Screen
- User Type: External (or Internal if within organization)
- App Name: Swaply
- User Support Email: [your email]
- Developer Contact Email: [your email]
- Scopes: `email`, `profile` (basic scopes)
- Test Users: Add your email for testing before verification

---

## 📷 Cloudinary Setup

### Dashboard Access
- **URL**: https://cloudinary.com/console
- **Cloud Name**: [your cloud name]

### Upload Preset
Create unsigned upload preset:
1. Settings → Upload → Upload presets
2. Add upload preset
3. Signing Mode: **Unsigned**
4. Folder: `swaply/objects` (optional, for organization)
5. Copy preset name → Use as `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`

### API Credentials
From Dashboard:
- Cloud Name → `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- API Key → (not needed for unsigned uploads)
- API Secret → (not needed for unsigned uploads)

---

## 📧 Email Testing (IMAP Access for E2E Tests)

### Purpose
E2E tests need to read magic link emails to verify auth flow works end-to-end.

### Setup (Gmail Example)

#### 1. Create Test Email Account
- Create new Gmail account (e.g., `swaply.test.automation@gmail.com`)
- **Do not use your personal email** (security risk)

#### 2. Enable IMAP
- Gmail Settings → See all settings
- Forwarding and POP/IMAP → Enable IMAP
- Save changes

#### 3. Generate App Password
- Google Account → Security → 2-Step Verification (enable if not already)
- Security → App passwords
- Generate password for "Mail" app
- Copy 16-character password

#### 4. Configure Environment Variables
```env
E2E_MAIL_HOST=imap.gmail.com
E2E_MAIL_PORT=993
E2E_MAIL_USER=swaply.test.automation@gmail.com
E2E_MAIL_PASSWORD=[16-char app password]
E2E_MAIL_SUBJECT=Your Magic Link
E2E_MAIL_FOLDER=INBOX
```

### Testing IMAP Connection
```bash
node -e "
const { ImapFlow } = require('imapflow');
const client = new ImapFlow({
  host: process.env.E2E_MAIL_HOST,
  port: Number(process.env.E2E_MAIL_PORT),
  secure: true,
  auth: {
    user: process.env.E2E_MAIL_USER,
    pass: process.env.E2E_MAIL_PASSWORD
  }
});
client.connect().then(() => {
  console.log('✅ IMAP connection successful');
  return client.logout();
}).catch(err => {
  console.error('❌ IMAP connection failed:', err.message);
});
"
```

---

## 🧪 Testing Setup

### Unit Tests (if applicable)
```bash
npm test          # Run Jest tests
npm run test:watch  # Watch mode
```

### E2E Tests (Playwright)
```bash
npx playwright install        # Install browsers first time
npm run test:e2e             # Run E2E tests
npm run test:e2e:headed      # Run with browser visible
```

### Auth Diagnostics
```bash
node scripts/test-10-diagnostics.js   # 10-method auth checks
node scripts/verify-5-paths.js         # 5 verification paths
```

---

## 🔄 Credential Rotation

### When Credentials Are Rotated
If any secrets are rotated (Supabase keys, Google OAuth, etc.):

1. **Update `.env.local`** (for local development)
2. **Update Vercel environment variables** (for production)
3. **Update Supabase dashboard** (if OAuth changed)
4. **Update this file** with date of rotation and what changed
5. **Redeploy Vercel** to pick up new environment variables

### Rotation Log
Track rotations here:

| Date       | Credential                | Reason                     | Updated By |
|------------|---------------------------|----------------------------|------------|
| 2025-10-19 | Initial setup documented  | Creating autonomy framework | Agent      |
| _TBD_      | _Example: Google Secret_  | _Leaked in logs_            | _User_     |

---

## 🚨 Security Checklist

### Before Committing
- [ ] No secrets in code (no hardcoded passwords, API keys)
- [ ] `.env.local` is in `.gitignore`
- [ ] All secrets use environment variables
- [ ] No console.log of sensitive data

### Before Sharing Access
- [ ] Use app-specific passwords, not main passwords
- [ ] Limit access to minimum required (principle of least privilege)
- [ ] Document who has access and why

### Regular Audits
- [ ] Review Vercel environment variables every 3 months
- [ ] Check Supabase API logs for suspicious activity
- [ ] Rotate Google OAuth secret yearly
- [ ] Review GitHub repository access (collaborators)

---

## 📚 Additional Resources

### Documentation
- Next.js 15 Docs: https://nextjs.org/docs
- Supabase Docs: https://supabase.com/docs
- Vercel Docs: https://vercel.com/docs
- Google OAuth 2.0: https://developers.google.com/identity/protocols/oauth2

### Internal Docs
- `docs/agent-memory.md` – Project memory
- `.github/copilot-instructions.md` – Coding conventions
- `AUTH_PKCE_FIX.md` – Auth fix details
- `DEPLOYMENT_SUCCESS.md` – Deployment guide

---

## 🆘 Troubleshooting Setup

### Can't Connect to Supabase
1. Check `NEXT_PUBLIC_SUPABASE_URL` matches dashboard
2. Check `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct (not service role key)
3. Verify Supabase project is active (not paused for inactivity)
4. Check network/firewall settings

### Google OAuth Not Working
1. Verify redirect URIs in Google Console match exactly
2. Check OAuth consent screen is published
3. Confirm Client ID and Secret are correct
4. Ensure Supabase has same Client ID/Secret configured

### Magic Links Not Sending
1. Check Supabase email settings (SMTP configured?)
2. Verify site URL in Supabase dashboard
3. Check spam folder
4. Review Supabase logs for email send errors

### IMAP Connection Fails
1. Verify IMAP is enabled in email account
2. Check app password (not regular password)
3. Verify host/port are correct for your email provider
4. Check firewall allows outbound port 993

---

**End of Setup File**  
_Keep credentials secure. Never commit secrets to git._
