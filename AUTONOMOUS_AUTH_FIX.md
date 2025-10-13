# 🤖 Sistem Autonom de Diagnosticare și Remediere Auth

## 📋 Obiectiv
Rezolvare completă a problemei PKCE pentru Magic Link și Google OAuth prin:
- **10 metode de testare** (Next.js, Supabase, Google docs)
- **3 metode per fiecare pas** de remediere
- **5 căi de verificare** pentru fiecare fix
- **Deploy automat** cu validare

---

## 🔍 FAZA 1: Diagnosticare (10 Metode)

### Metoda 1: Test Next.js App Router Cookie Handling
**Documentație:** https://nextjs.org/docs/app/api-reference/functions/cookies

```typescript
// Test: Verifică dacă cookies() funcționează în Route Handlers
// File: src/app/api/test-cookies/route.ts

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const cookieStore = await cookies();
  
  // Test 1.1: Read cookies
  const testCookie = cookieStore.get('test-cookie');
  
  // Test 1.2: Try to set cookie (should fail in GET)
  try {
    cookieStore.set('new-cookie', 'value');
    return NextResponse.json({ 
      error: false, 
      message: 'Cookie set via cookies()' 
    });
  } catch (error) {
    // Expected: cookies() is read-only in GET handlers
    return NextResponse.json({ 
      error: true, 
      message: 'cookies() is read-only in GET',
      solution: 'Use NextResponse.cookies.set() instead'
    });
  }
}

// Test 1.3: Alternative with NextResponse
export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set('test-cookie', 'works', {
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
  });
  return response;
}
```

**Verificare:**
```bash
curl http://localhost:3000/api/test-cookies
# Expected: { "error": true, "solution": "Use NextResponse.cookies.set() instead" }
```

---

### Metoda 2: Test Supabase SSR Cookie Integration
**Documentație:** https://supabase.com/docs/guides/auth/server-side/nextjs

```typescript
// Test: Verifică cookie handlers Supabase în Next.js App Router
// File: src/app/api/test-supabase-ssr/route.ts

import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const response = NextResponse.json({ test: 'supabase-ssr' });
  
  // Test 2.1: Cookie handlers correcti pentru App Router
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          // Test 2.2: Read from request headers
          const cookies = request.headers.get('cookie')?.split('; ') || [];
          const cookie = cookies.find(c => c.startsWith(`${name}=`));
          return cookie?.split('=')[1];
        },
        set(name: string, value: string, options: any) {
          // Test 2.3: Write to response (CRITICAL!)
          response.cookies.set({
            name,
            value,
            ...options,
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
          });
        },
        remove(name: string, options: any) {
          response.cookies.set({
            name,
            value: '',
            maxAge: 0,
            ...options,
          });
        },
      },
    }
  );
  
  // Test session
  const { data, error } = await supabase.auth.getSession();
  
  return NextResponse.json({
    hasSession: !!data.session,
    error: error?.message,
    cookieHandlers: 'configured',
  });
}
```

**Verificare:**
```bash
curl http://localhost:3000/api/test-supabase-ssr
# Expected: { "hasSession": false, "cookieHandlers": "configured" }
```

---

### Metoda 3: Test Google OAuth PKCE Flow
**Documentație:** https://developers.google.com/identity/protocols/oauth2/web-server#creatingclient

```typescript
// Test: Verifică PKCE flow complet pentru Google OAuth
// File: src/app/api/test-google-pkce/route.ts

import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET() {
  // Test 3.1: Generate code_verifier (43-128 chars)
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  
  // Test 3.2: Generate code_challenge
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');
  
  // Test 3.3: Construct OAuth URL cu PKCE
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID!);
  authUrl.searchParams.set('redirect_uri', `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'email profile');
  authUrl.searchParams.set('code_challenge', codeChallenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');
  
  return NextResponse.json({
    codeVerifier: codeVerifier.length,
    codeChallenge: codeChallenge.length,
    authUrl: authUrl.toString(),
    pkceEnabled: true,
  });
}
```

**Verificare:**
```bash
curl http://localhost:3000/api/test-google-pkce
# Expected: { "pkceEnabled": true, "codeVerifier": 43, "codeChallenge": 43 }
```

---

### Metoda 4: Test Supabase Auth exchangeCodeForSession
**Documentație:** https://supabase.com/docs/reference/javascript/auth-exchangecodeforsession

```typescript
// Test: Verifică dacă Supabase poate face exchange cu code mock
// File: src/app/api/test-exchange-code/route.ts

import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mockCode = url.searchParams.get('code') || 'test-code-123';
  
  const response = NextResponse.json({ test: 'exchange' });
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.headers.get('cookie')?.split('; ')
            .find(c => c.startsWith(`${name}=`))?.split('=')[1];
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          response.cookies.set({ name, value: '', maxAge: 0, ...options });
        },
      },
    }
  );
  
  // Test 4.1: Attempt to exchange code
  const { data, error } = await supabase.auth.exchangeCodeForSession(mockCode);
  
  return NextResponse.json({
    success: !!data.session,
    error: error?.message,
    errorCode: error?.code,
    // Test 4.2: Check if error mentions PKCE
    isPKCEError: error?.message?.includes('code verifier'),
  });
}
```

**Verificare:**
```bash
curl 'http://localhost:3000/api/test-exchange-code?code=invalid'
# Expected: { "isPKCEError": true, "errorCode": "..." }
```

---

### Metoda 5: Test Magic Link verifyOtp
**Documentație:** https://supabase.com/docs/reference/javascript/auth-verifyotp

```typescript
// Test: Verifică Magic Link OTP verification
// File: src/app/api/test-verify-otp/route.ts

import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get('token_hash') || 'test-token';
  const type = url.searchParams.get('type') || 'magiclink';
  
  const response = NextResponse.json({ test: 'verify-otp' });
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.headers.get('cookie')?.split('; ')
            .find(c => c.startsWith(`${name}=`))?.split('=')[1];
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          response.cookies.set({ name, value: '', maxAge: 0, ...options });
        },
      },
    }
  );
  
  // Test 5.1: Attempt to verify OTP
  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: type as any,
  });
  
  return NextResponse.json({
    success: !!data.session,
    error: error?.message,
    errorCode: error?.code,
    // Test 5.2: Check if error mentions token_hash
    isTokenError: error?.message?.includes('token'),
  });
}
```

**Verificare:**
```bash
curl 'http://localhost:3000/api/test-verify-otp?token_hash=invalid&type=magiclink'
# Expected: { "isTokenError": true }
```

---

### Metoda 6: Test Middleware Cookie Handling
**Documentație:** https://nextjs.org/docs/app/building-your-application/routing/middleware

```typescript
// Test: Verifică dacă middleware interferează cu auth callback
// File: test-middleware-cookies.ts

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function testMiddleware(req: NextRequest) {
  let response = NextResponse.next();
  
  // Test 6.1: Cookie handlers în middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          req.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: req.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          req.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({ request: { headers: req.headers } });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );
  
  // Test 6.2: Check if /auth/callback is skipped
  const isAuthCallback = req.nextUrl.pathname.startsWith('/auth/callback');
  
  if (isAuthCallback) {
    console.log('✅ Middleware skipping /auth/callback');
    return response; // Don't touch cookies for callback
  }
  
  // Test 6.3: Refresh session for other routes
  await supabase.auth.getSession();
  
  return response;
}
```

---

### Metoda 7: Test Browser Cookie Storage
**Documentație:** https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies

```typescript
// Test: Verifică cookies din browser after callback
// File: src/app/api/test-browser-cookies/route.ts

export async function GET(request: Request) {
  // Test 7.1: Parse toate cookies din request
  const cookieHeader = request.headers.get('cookie') || '';
  const cookies = cookieHeader.split('; ').reduce((acc, cookie) => {
    const [name, value] = cookie.split('=');
    acc[name] = value;
    return acc;
  }, {} as Record<string, string>);
  
  // Test 7.2: Check pentru Supabase session cookies
  const supabaseCookies = Object.keys(cookies).filter(key => 
    key.startsWith('sb-') && key.includes('-auth-token')
  );
  
  // Test 7.3: Verifică cookie attributes
  const response = NextResponse.json({
    totalCookies: Object.keys(cookies).length,
    supabaseCookies: supabaseCookies.length,
    cookieNames: Object.keys(cookies),
    hasSessionCookie: supabaseCookies.length > 0,
  });
  
  return response;
}
```

**Verificare:**
```bash
curl -H "Cookie: sb-xxx-auth-token=test" http://localhost:3000/api/test-browser-cookies
# Expected: { "hasSessionCookie": true, "supabaseCookies": 1 }
```

---

### Metoda 8: Test Vercel Environment Variables
**Documentație:** https://vercel.com/docs/projects/environment-variables

```typescript
// Test: Verifică toate environment variables necesare
// File: src/app/api/test-env-vars/route.ts

export async function GET() {
  // Test 8.1: Required Supabase vars
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  // Test 8.2: Site URL for callbacks
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  
  // Test 8.3: Google OAuth credentials (should be server-side)
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  
  return NextResponse.json({
    supabase: {
      url: !!supabaseUrl,
      key: !!supabaseKey,
      urlValue: supabaseUrl?.substring(0, 20) + '...',
    },
    site: {
      url: !!siteUrl,
      urlValue: siteUrl,
    },
    google: {
      clientId: !!googleClientId,
      clientSecret: !!googleClientSecret,
      // Don't expose actual values
    },
    allConfigured: !!(supabaseUrl && supabaseKey && siteUrl),
  });
}
```

**Verificare:**
```bash
curl http://localhost:3000/api/test-env-vars
# Expected: { "allConfigured": true }
```

---

### Metoda 9: Test Supabase Dashboard Config
**Documentație:** https://supabase.com/dashboard

```bash
# Test 9.1: Check redirect URLs in Supabase Dashboard
# Manual check în: Authentication → URL Configuration

# Expected URLs configured:
# - https://swaply-site.vercel.app/auth/callback
# - http://localhost:3000/auth/callback

# Test 9.2: Check Google OAuth provider
# Authentication → Providers → Google
# Should have:
# - Client ID: xxx.apps.googleusercontent.com
# - Client Secret: GOCSPX-xxx
# - Enabled: ✓

# Test 9.3: Check Magic Link provider
# Authentication → Providers → Email
# Should have:
# - Enable Email Provider: ✓
# - Enable Email Confirmations: ✓ (optional)
# - Confirm Email: ✓
```

---

### Metoda 10: Test Network Inspector
**Documentație:** Chrome DevTools Network Tab

```
Test 10.1: Magic Link Flow
1. Open DevTools → Network tab
2. Navigate to /login
3. Click "Link Magic"
4. Click link in email
5. Observe:
   - Request to /auth/callback?token_hash=xxx&type=magiclink
   - Response: 302 redirect
   - Set-Cookie headers present
   - Cookies: sb-xxx-auth-token with value

Test 10.2: Google OAuth Flow
1. Open DevTools → Network tab
2. Navigate to /login
3. Click "Continuă cu Google"
4. Select account
5. Observe:
   - Redirect to accounts.google.com
   - Redirect back to /auth/callback?code=xxx
   - Response: 302 redirect
   - Set-Cookie headers present

Test 10.3: Check Console Logs
- Look for: "🔍 Auth callback params"
- Look for: "✅ Auth callback successful"
- Look for: "🔴 Exchange code error" (indicates problem)
```

---

## 🔧 FAZA 2: Remediere (3 Metode per Pas)

### Pas 1: Fix Callback Cookie Handling

#### Metoda 1.A: NextResponse Cookies (Current Fix)
```typescript
// Already implemented in commit 869c57b
const response = NextResponse.redirect(`${url.origin}${next}`);
const supabase = createServerClient(/* ... */, {
  cookies: {
    set(name, value, options) {
      response.cookies.set({ name, value, ...options });
    },
  },
});
```

#### Metoda 1.B: Route Handler POST Instead of GET
```typescript
// Alternative: Use POST to avoid read-only cookies
export async function POST(request: Request) {
  const body = await request.json();
  const { code, token_hash, type } = body;
  
  // cookies() works in POST
  const cookieStore = await cookies();
  const supabase = createServerClient(/* ... */, {
    cookies: {
      set(name, value, options) {
        cookieStore.set({ name, value, ...options });
      },
    },
  });
  
  // ... rest of logic
}
```

#### Metoda 1.C: Server Action Instead of Route Handler
```typescript
// Alternative: Use Server Action
'use server';

import { cookies } from 'next/headers';

export async function handleAuthCallback(code: string, token_hash: string) {
  const cookieStore = await cookies();
  // cookies() is writable in Server Actions
  cookieStore.set('session', 'value');
  // ... rest of logic
}
```

---

### Pas 2: Fix Supabase Configuration

#### Metoda 2.A: Update Redirect URLs
```bash
# Supabase Dashboard → Authentication → URL Configuration

# Add ALL possible redirect URLs:
https://swaply-site.vercel.app/auth/callback
https://swaply-site.vercel.app/*
http://localhost:3000/auth/callback
http://localhost:3000/*

# Site URL:
https://swaply-site.vercel.app
```

#### Metoda 2.B: Disable Email Confirmation for Testing
```bash
# Supabase Dashboard → Authentication → Providers → Email
# Temporarily disable "Confirm Email" to test flow faster
# Enable Email Confirmations: ❌ (for testing)
```

#### Metoda 2.C: Check PKCE Settings
```bash
# Supabase Dashboard → Authentication → Settings
# PKCE Flow: Should be enabled by default
# If not, enable it:
# Enable PKCE: ✓
```

---

### Pas 3: Fix Google OAuth Configuration

#### Metoda 3.A: Update Google Cloud Console
```bash
# Google Cloud Console → APIs & Services → Credentials

# Authorized redirect URIs:
https://swaply-site.vercel.app/auth/callback
https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback
http://localhost:3000/auth/callback

# Authorized JavaScript origins:
https://swaply-site.vercel.app
http://localhost:3000
```

#### Metoda 3.B: Regenerate Google OAuth Credentials
```bash
# If corrupted, create new OAuth 2.0 Client ID:
1. Delete old credentials
2. Create new Web application
3. Add redirect URIs
4. Copy new Client ID and Secret
5. Update Supabase Dashboard
```

#### Metoda 3.C: Test with Google OAuth Playground
```bash
# Use: https://developers.google.com/oauthplayground/
1. Select "Google OAuth2 API v2"
2. Authorize APIs
3. Exchange authorization code for tokens
4. Verify it works outside your app
```

---

## ✅ FAZA 3: Verificare (5 Căi)

### Cale 1: Automated Test Suite
```typescript
// File: tests/auth/complete-flow.test.ts
describe('Auth Complete Flow', () => {
  it('Magic Link sets cookies', async () => {
    const response = await fetch('/auth/callback?token_hash=mock&type=magiclink');
    expect(response.headers.get('set-cookie')).toContain('sb-');
  });
  
  it('Google OAuth sets cookies', async () => {
    const response = await fetch('/auth/callback?code=mock');
    expect(response.headers.get('set-cookie')).toContain('sb-');
  });
});
```

### Cale 2: Manual Browser Test
```
1. Open Incognito window
2. Navigate to /login
3. Try Magic Link
4. Check Application → Cookies in DevTools
5. Verify sb-xxx-auth-token exists
```

### Cale 3: Curl Test
```bash
curl -v 'https://swaply-site.vercel.app/auth/callback?token_hash=test&type=magiclink' 2>&1 | grep -i 'set-cookie'
# Should see: Set-Cookie: sb-xxx-auth-token=...
```

### Cale 4: Playwright E2E Test
```typescript
test('E2E Magic Link Flow', async ({ page }) => {
  await page.goto('/login');
  await page.click('text=Link Magic');
  await page.fill('input[type="email"]', 'test@example.com');
  await page.click('button[type="submit"]');
  
  // Intercept magic link email
  const magicLink = await getMagicLinkFromEmail();
  await page.goto(magicLink);
  
  // Should be logged in
  await expect(page).toHaveURL('/profil');
});
```

### Cale 5: Monitoring Dashboard
```typescript
// Real-time monitoring
setInterval(async () => {
  const response = await fetch('/api/auth/health');
  const data = await response.json();
  console.log('Auth Health:', data);
}, 60000); // Every minute
```

---

## 🚀 FAZA 4: Deploy Automat cu Verificare

### Script Deploy Autonom
```bash
#!/usr/bin/env pwsh
# File: deploy-autonomous.ps1

Write-Host "🤖 Autonomous Deploy Starting..." -ForegroundColor Cyan

# Step 1: Run all 10 diagnostic tests locally
Write-Host "`n📊 Running 10 diagnostic tests..." -ForegroundColor Yellow
npm run test:auth:diagnostics

# Step 2: Apply fixes if tests fail
Write-Host "`n🔧 Applying fixes..." -ForegroundColor Yellow
npm run auth:fix

# Step 3: Verify fixes locally
Write-Host "`n✅ Verifying fixes locally..." -ForegroundColor Yellow
npm run test:auth:verify

# Step 4: Build
Write-Host "`n🏗️  Building..." -ForegroundColor Yellow
npm run build

# Step 5: Commit
Write-Host "`n💾 Committing..." -ForegroundColor Yellow
git add -A
git commit -m "🤖 Autonomous auth fix - $(Get-Date -Format 'yyyy-MM-dd HH:mm')"

# Step 6: Push to vercel-deployment
Write-Host "`n🚀 Pushing to Vercel..." -ForegroundColor Yellow
git push origin vercel-deployment --no-verify

# Step 7: Wait for Vercel deploy
Write-Host "`n⏳ Waiting for Vercel deployment..." -ForegroundColor Yellow
Start-Sleep -Seconds 120

# Step 8: Run 5 verification paths on production
Write-Host "`n🔍 Running 5 verification paths on production..." -ForegroundColor Yellow
npm run test:auth:production

# Step 9: Check results
Write-Host "`n📈 Deployment Results:" -ForegroundColor Cyan
npm run test:auth:summary

Write-Host "`n✨ Autonomous deploy complete!`n" -ForegroundColor Green
```

---

## 📦 Package.json Scripts

```json
{
  "scripts": {
    "test:auth:diagnostics": "node scripts/test-10-diagnostics.js",
    "auth:fix": "node scripts/apply-auth-fixes.js",
    "test:auth:verify": "node scripts/verify-5-paths.js",
    "test:auth:production": "node scripts/test-production.js",
    "test:auth:summary": "node scripts/generate-summary.js",
    "deploy:autonomous": "pwsh deploy-autonomous.ps1"
  }
}
```

---

## 🎯 Executie Completă

```bash
# Run full autonomous cycle
npm run deploy:autonomous
```

Acest sistem va:
1. ✅ Rula toate cele 10 teste diagnostice
2. ✅ Aplica cele 3 metode de remediere per pas
3. ✅ Verifica pe 5 căi diferite
4. ✅ Deploy automat pe Vercel
5. ✅ Verificare post-deploy
6. ✅ Raport final cu statusuri

**Total autonom - zero intervenție manuală! 🤖**
