# 🧪 5 Metode Complete de Testare pentru Fiecare Tip de Autentificare

## 📋 Cuprins
1. [Email + Password - 5 Metode Testare](#email--password)
2. [Magic Link - 5 Metode Testare](#magic-link)
3. [Google OAuth - 5 Metode Testare](#google-oauth)
4. [Phone / SMS - 5 Metode Testare](#phone--sms)

---

## 🔐 Email + Password

### Metoda 1: Manual Testing (Happy Path)
**Scop:** Validare funcționalitate de bază

**Pași:**
1. **Signup:**
   ```
   Email: test@example.com
   Password: SecurePass123!
   Confirm Password: SecurePass123!
   ```
   ✅ Expected: Email de confirmare trimis

2. **Email Confirmation:**
   - Check inbox → Click link
   ✅ Expected: Redirect la /login cu mesaj "Email confirmat"

3. **Login:**
   ```
   Email: test@example.com
   Password: SecurePass123!
   ```
   ✅ Expected: Redirect la /profil cu session activă

4. **Verify Session:**
   ```typescript
   const { data: { user } } = await supabase.auth.getUser();
   console.log(user); // Should have email, id, etc.
   ```
   ✅ Expected: User object cu date complete

5. **Logout:**
   - Click "Deconectează-te"
   ✅ Expected: Redirect la /login, session cleared

**Rezultat:** ✅ PASS / ❌ FAIL

---

### Metoda 2: Automated E2E Testing (Playwright)
**Scop:** Testare automată repetabilă

**Setup:**
```bash
npm install -D @playwright/test
npx playwright install
```

**Test Suite:**
```typescript
// tests/auth/email-password.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Email + Password Authentication', () => {
  test('should complete full signup flow', async ({ page }) => {
    // 1. Navigate to signup
    await page.goto('/signup');
    
    // 2. Fill form
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'SecurePass123!');
    await page.fill('input[name="confirmPassword"]', 'SecurePass123!');
    
    // 3. Submit
    await page.click('button[type="submit"]');
    
    // 4. Check success message
    await expect(page.locator('text=Verifică email-ul')).toBeVisible();
  });
  
  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'SecurePass123!');
    await page.click('button[type="submit"]');
    
    // Should redirect to profile
    await expect(page).toHaveURL('/profil');
    await expect(page.locator('text=Profil')).toBeVisible();
  });
  
  test('should reject invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'WrongPassword!');
    await page.click('button[type="submit"]');
    
    // Should show error
    await expect(page.locator('text=Credențiale invalide')).toBeVisible();
  });
});
```

**Run:**
```bash
npx playwright test tests/auth/email-password.spec.ts
```

**Rezultat:** ✅ PASS / ❌ FAIL

---

### Metoda 3: Security Testing
**Scop:** Validare securitate și edge cases

**Test Cases:**

| Test | Input | Expected Result |
|------|-------|-----------------|
| **Weak Password** | `password123` | ❌ Eroare: "Parolă prea slabă" |
| **SQL Injection** | `admin'--` | ❌ Eroare validare sau escaped |
| **XSS Attempt** | `<script>alert('xss')</script>` | ❌ Sanitized/escaped |
| **Rate Limiting** | 10 requests/minute | ❌ Blocat după 5 încercări |
| **Password Reuse** | Same as previous | ❌ Breach detection |
| **Brute Force** | 100 wrong passwords | ❌ Account locked |
| **Email Enumeration** | test@example.com (existing) | ✅ Generic message (no leak) |

**Execution:**
```bash
# Run security scan
npm run test:security

# Or manual:
node scripts/test-security.js
```

**Script Example:**
```javascript
// scripts/test-security.js
async function testWeakPassword() {
  const weakPasswords = ['password', '123456', 'qwerty', 'admin'];
  
  for (const pass of weakPasswords) {
    const { error } = await supabase.auth.signUp({
      email: 'test@example.com',
      password: pass,
    });
    
    if (!error || !error.message.includes('weak')) {
      console.error('❌ Weak password accepted:', pass);
      return false;
    }
  }
  
  console.log('✅ All weak passwords rejected');
  return true;
}
```

**Rezultat:** ✅ PASS / ❌ FAIL

---

### Metoda 4: Load Testing (k6)
**Scop:** Testare performanță sub load

**Setup:**
```bash
# Install k6
winget install k6
```

**Load Test Script:**
```javascript
// tests/load/auth-load.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Ramp up to 10 users
    { duration: '1m', target: 50 },    // Stay at 50 users
    { duration: '30s', target: 100 },  // Spike to 100
    { duration: '1m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.01'],   // Less than 1% errors
  },
};

export default function () {
  const payload = JSON.stringify({
    email: `user${__VU}@example.com`,
    password: 'SecurePass123!',
  });
  
  const params = {
    headers: { 'Content-Type': 'application/json' },
  };
  
  // Test signup
  const signupRes = http.post(
    'https://swaply-site.vercel.app/api/auth/signup',
    payload,
    params
  );
  
  check(signupRes, {
    'signup successful': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  sleep(1);
  
  // Test login
  const loginRes = http.post(
    'https://swaply-site.vercel.app/api/auth/login',
    payload,
    params
  );
  
  check(loginRes, {
    'login successful': (r) => r.status === 200,
    'session cookie present': (r) => r.cookies['sb-access-token'] !== undefined,
  });
  
  sleep(1);
}
```

**Run:**
```bash
k6 run tests/load/auth-load.js
```

**Success Criteria:**
- ✅ 95% requests < 500ms
- ✅ Error rate < 1%
- ✅ Throughput > 100 req/s

**Rezultat:** ✅ PASS / ❌ FAIL

---

### Metoda 5: Integration Testing cu Database
**Scop:** Validare integrare cu Supabase

**Test Cases:**
```typescript
// tests/integration/auth-db.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

describe('Email + Password Database Integration', () => {
  let testUserId: string;
  const testEmail = `test-${Date.now()}@example.com`;
  
  it('should create user in auth.users', async () => {
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: 'SecurePass123!',
    });
    
    expect(error).toBeNull();
    expect(data.user).toBeDefined();
    expect(data.user?.email).toBe(testEmail);
    
    testUserId = data.user!.id;
  });
  
  it('should create profile in user_profiles', async () => {
    // Wait for trigger to fire
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', testUserId)
      .single();
    
    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data.email).toBe(testEmail);
  });
  
  it('should enforce RLS policies', async () => {
    // Try to read another user's profile (should fail)
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .neq('id', testUserId)
      .limit(1);
    
    // Should return empty or error due to RLS
    expect(data?.length).toBe(0);
  });
  
  afterAll(async () => {
    // Cleanup test user
    await supabase.auth.admin.deleteUser(testUserId);
  });
});
```

**Run:**
```bash
npm run test:integration
```

**Rezultat:** ✅ PASS / ❌ FAIL

---

## ✨ Magic Link

### Metoda 1: Manual Testing (Happy Path)
**Scop:** Validare funcționalitate de bază

**Pași:**
1. **Request Magic Link:**
   ```
   Navigate to /login
   Click "Link Magic"
   Enter email: test@example.com
   Click "Trimite Link"
   ```
   ✅ Expected: "Verifică email-ul pentru link-ul magic"

2. **Check Email:**
   - Open inbox
   - Find email "Link-ul tău magic Swaply"
   - Email should contain clickable button/link
   ✅ Expected: Email received < 30 seconds

3. **Click Magic Link:**
   - Click link in email
   - Should redirect to /auth/callback
   ✅ Expected: Redirect la /profil, logged in

4. **Verify Session:**
   ```typescript
   const { data: { session } } = await supabase.auth.getSession();
   console.log(session); // Should exist
   ```
   ✅ Expected: Valid session with token

5. **Test Link Expiry:**
   - Wait 1 hour
   - Try clicking old link
   ✅ Expected: "Link-ul a expirat"

**Rezultat:** ✅ PASS / ❌ FAIL

---

### Metoda 2: Automated Callback Testing
**Scop:** Validare dual flow (Magic Link + OAuth)

**Test Script:**
```typescript
// tests/auth/magic-link-callback.test.ts
import { describe, it, expect } from 'vitest';

describe('Magic Link Callback Dual Flow', () => {
  it('should handle token_hash flow (Magic Link)', async () => {
    const token_hash = 'pkce_abc123def456';
    const type = 'magiclink';
    
    const response = await fetch(
      `https://swaply-site.vercel.app/auth/callback?token_hash=${token_hash}&type=${type}`
    );
    
    // Should not error on missing 'code'
    expect(response.status).not.toBe(500);
    
    // Should set session cookie
    const cookies = response.headers.get('set-cookie');
    expect(cookies).toContain('sb-access-token');
  });
  
  it('should handle code flow (OAuth)', async () => {
    const code = 'oauth_code_xyz789';
    
    const response = await fetch(
      `https://swaply-site.vercel.app/auth/callback?code=${code}`
    );
    
    // Should not error on missing 'token_hash'
    expect(response.status).not.toBe(500);
  });
  
  it('should reject missing both code and token_hash', async () => {
    const response = await fetch(
      'https://swaply-site.vercel.app/auth/callback'
    );
    
    // Should redirect to error
    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toContain('error=');
  });
});
```

**Run:**
```bash
npm run test tests/auth/magic-link-callback.test.ts
```

**Rezultat:** ✅ PASS / ❌ FAIL

---

### Metoda 3: Email Deliverability Testing
**Scop:** Verificare ajungere email

**Tools:**
- [Mail-tester.com](https://www.mail-tester.com/) - Spam score
- [MXToolbox](https://mxtoolbox.com/) - DNS check
- [SendForensics](https://sendforensics.com/) - Deliverability

**Pași:**
1. **Send Test Email:**
   ```
   Request magic link to your email
   ```

2. **Check Spam Score:**
   - Forward email to [email protected]
   - Check score (should be > 8/10)
   ✅ Expected: Score > 8, not in spam

3. **Test Multiple Providers:**
   | Provider | Deliverability | Spam Folder | Time |
   |----------|----------------|-------------|------|
   | Gmail | ✅ Inbox | ❌ No | < 10s |
   | Outlook | ✅ Inbox | ❌ No | < 15s |
   | Yahoo | ✅ Inbox | ❌ No | < 20s |
   | ProtonMail | ✅ Inbox | ❌ No | < 30s |

4. **SPF/DKIM Check:**
   ```bash
   # Check DNS records
   nslookup -type=TXT swaply.ro
   ```
   ✅ Expected: SPF and DKIM records present

5. **Template Rendering:**
   - Check email on desktop
   - Check on mobile
   - Check in dark mode
   ✅ Expected: Renders correctly everywhere

**Rezultat:** ✅ PASS / ❌ FAIL

---

### Metoda 4: Security & Edge Cases
**Scop:** Testare vulnerabilități

**Test Cases:**

| Test | Action | Expected Result |
|------|--------|-----------------|
| **Link Reuse** | Click same link twice | ❌ Second click fails |
| **Link Tampering** | Modify token_hash | ❌ Invalid token error |
| **Type Confusion** | Send type=signup instead of magiclink | ❌ Rejected |
| **Email Injection** | Email: `test@example.com\r\nBcc: [email protected]` | ❌ Sanitized |
| **CSRF** | Request from different origin | ❌ Blocked by CORS |
| **Timing Attack** | Measure response time for valid/invalid | ✅ Constant time |

**Execution:**
```javascript
// tests/security/magic-link-security.js
async function testLinkReuse() {
  const { data } = await supabase.auth.signInWithOtp({
    email: 'test@example.com'
  });
  
  // Get link from email (mock)
  const magicLink = 'https://swaply-site.vercel.app/auth/callback?token_hash=abc&type=magiclink';
  
  // First click
  const res1 = await fetch(magicLink);
  console.log('First click:', res1.status); // Should be 302 (redirect)
  
  // Second click (reuse)
  const res2 = await fetch(magicLink);
  console.log('Second click:', res2.status); // Should be 400/401
  
  if (res2.status !== 400 && res2.status !== 401) {
    console.error('❌ Link reuse not prevented!');
    return false;
  }
  
  console.log('✅ Link reuse prevented');
  return true;
}
```

**Rezultat:** ✅ PASS / ❌ FAIL

---

### Metoda 5: Cross-Browser Compatibility
**Scop:** Validare pe toate browserele

**Test Matrix:**

| Browser | Version | OS | Status |
|---------|---------|----|----|
| Chrome | Latest | Windows | ✅ |
| Firefox | Latest | Windows | ✅ |
| Edge | Latest | Windows | ✅ |
| Safari | Latest | macOS | ✅ |
| Chrome Mobile | Latest | Android | ✅ |
| Safari Mobile | Latest | iOS | ✅ |

**Automated Testing:**
```typescript
// tests/cross-browser/magic-link.spec.ts
import { test, devices } from '@playwright/test';

for (const device of ['Desktop Chrome', 'Desktop Firefox', 'Desktop Safari', 'iPhone 14', 'Pixel 7']) {
  test.use(devices[device]);
  
  test(`Magic Link on ${device}`, async ({ page }) => {
    await page.goto('/login');
    await page.click('text=Link Magic');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.click('button:has-text("Trimite Link")');
    
    await page.waitForSelector('text=Verifică email-ul');
    // Simulate email click (mock)
    await page.goto('/auth/callback?token_hash=mock&type=magiclink');
    
    // Should be logged in
    await page.waitForURL('/profil');
  });
}
```

**Run:**
```bash
npx playwright test tests/cross-browser/magic-link.spec.ts --project=chromium firefox webkit
```

**Rezultat:** ✅ PASS / ❌ FAIL

---

## 🔴 Google OAuth

### Metoda 1: Manual Testing (Happy Path)
**Scop:** Validare OAuth flow complet

**Pași:**
1. **Initiate OAuth:**
   ```
   Navigate to /login
   Click "Continuă cu Google"
   ```
   ✅ Expected: Redirect la Google consent screen

2. **Google Login:**
   - Enter Google credentials
   - Or select existing account
   ✅ Expected: Google authentication successful

3. **Grant Permissions:**
   - Review permissions (email, profile)
   - Click "Allow"
   ✅ Expected: Redirect back to app

4. **Callback Handling:**
   - URL: `/auth/callback?code=4/0AZab...`
   - Should exchange code for session
   ✅ Expected: Redirect la /profil, logged in

5. **Verify Profile:**
   - Check profile page
   - Verify name from Google
   - Verify avatar from Google
   ✅ Expected: Profile auto-populated

**Rezultat:** ✅ PASS / ❌ FAIL

---

### Metoda 2: Automated OAuth Flow Testing
**Scop:** E2E test cu Google credentials

**Setup:**
```bash
npm install -D playwright
```

**Test Script:**
```typescript
// tests/auth/google-oauth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Google OAuth', () => {
  test('should complete OAuth flow', async ({ page, context }) => {
    // 1. Start OAuth
    await page.goto('/login');
    
    // 2. Click Google button
    const [popup] = await Promise.all([
      context.waitForEvent('page'),
      page.click('text=Continuă cu Google')
    ]);
    
    // 3. Wait for Google page
    await popup.waitForLoadState();
    expect(popup.url()).toContain('accounts.google.com');
    
    // 4. Fill Google credentials (use test account)
    await popup.fill('input[type="email"]', process.env.GOOGLE_TEST_EMAIL!);
    await popup.click('button:has-text("Next")');
    await popup.fill('input[type="password"]', process.env.GOOGLE_TEST_PASSWORD!);
    await popup.click('button:has-text("Next")');
    
    // 5. Handle consent (if shown)
    try {
      await popup.click('button:has-text("Allow")', { timeout: 5000 });
    } catch {
      // Already consented
    }
    
    // 6. Wait for redirect back
    await page.waitForURL('/profil');
    
    // 7. Verify logged in
    await expect(page.locator('text=Profil')).toBeVisible();
  });
});
```

**Run:**
```bash
GOOGLE_TEST_EMAIL=test@gmail.com GOOGLE_TEST_PASSWORD=xxx npx playwright test tests/auth/google-oauth.spec.ts
```

**Rezultat:** ✅ PASS / ❌ FAIL

---

### Metoda 3: PKCE Flow Validation
**Scop:** Verificare securitate PKCE

**Test Script:**
```typescript
// tests/auth/pkce-validation.test.ts
import { describe, it, expect } from 'vitest';
import crypto from 'crypto';

describe('PKCE Flow Validation', () => {
  it('should generate valid code_verifier', () => {
    const verifier = crypto.randomBytes(32).toString('base64url');
    
    expect(verifier).toHaveLength(43); // Base64url of 32 bytes
    expect(verifier).toMatch(/^[A-Za-z0-9_-]+$/); // Only allowed chars
  });
  
  it('should generate valid code_challenge', () => {
    const verifier = crypto.randomBytes(32).toString('base64url');
    const challenge = crypto
      .createHash('sha256')
      .update(verifier)
      .digest('base64url');
    
    expect(challenge).toHaveLength(43);
  });
  
  it('should reject invalid code_verifier', async () => {
    const code = 'valid_oauth_code';
    const invalidVerifier = 'short'; // Too short
    
    const response = await fetch('/auth/callback', {
      method: 'POST',
      body: JSON.stringify({ code, code_verifier: invalidVerifier }),
    });
    
    expect(response.status).toBe(400);
  });
  
  it('should validate code and verifier together', async () => {
    // Simulate callback with mismatched code/verifier
    const response = await fetch(
      '/auth/callback?code=abc123'
      // Missing code_verifier
    );
    
    // Should error: "both auth code and code verifier should be non-empty"
    expect(response.status).toBe(302);
    const location = response.headers.get('location');
    expect(location).toContain('error=');
  });
});
```

**Rezultat:** ✅ PASS / ❌ FAIL

---

### Metoda 4: OAuth Security Testing
**Scop:** Testare vulnerabilități OAuth

**Test Cases:**

| Attack Vector | Test | Expected Result |
|---------------|------|-----------------|
| **CSRF** | Missing state parameter | ❌ Rejected |
| **Code Injection** | Malicious redirect_uri | ❌ Blocked by Google |
| **Token Theft** | Intercept code in URL | ✅ PKCE prevents misuse |
| **Replay Attack** | Reuse authorization code | ❌ Code invalidated after use |
| **Phishing** | Fake consent screen | ✅ Google domain validation |

**Execution:**
```javascript
// tests/security/oauth-security.js
async function testCSRF() {
  // Try OAuth without state parameter
  const response = await fetch(
    'https://accounts.google.com/o/oauth2/v2/auth?' +
    'client_id=YOUR_CLIENT_ID&' +
    'redirect_uri=https://swaply-site.vercel.app/auth/callback&' +
    'response_type=code&' +
    'scope=email profile'
    // Missing: state=random_string
  );
  
  // Google should require state for security
  // Or our callback should validate it
}

async function testCodeReuse() {
  const code = 'used_code_abc123';
  
  // First use
  await supabase.auth.exchangeCodeForSession(code);
  
  // Try to reuse
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  
  if (!error) {
    console.error('❌ Code reuse not prevented!');
    return false;
  }
  
  console.log('✅ Code reuse prevented');
  return true;
}
```

**Rezultat:** ✅ PASS / ❌ FAIL

---

### Metoda 5: Performance & Load Testing
**Scop:** Testare OAuth sub load

**k6 Script:**
```javascript
// tests/load/oauth-load.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 20 },
    { duration: '2m', target: 50 },
    { duration: '1m', target: 0 },
  ],
};

export default function () {
  // Simulate OAuth callback with mock code
  const code = `mock_code_${__VU}_${Date.now()}`;
  
  const response = http.get(
    `https://swaply-site.vercel.app/auth/callback?code=${code}`,
    {
      redirects: 0, // Don't follow redirects
    }
  );
  
  check(response, {
    'callback responds': (r) => r.status === 302 || r.status === 400,
    'response time < 1s': (r) => r.timings.duration < 1000,
  });
  
  sleep(2);
}
```

**Run:**
```bash
k6 run tests/load/oauth-load.js
```

**Success Criteria:**
- ✅ Handles 50 concurrent OAuth callbacks
- ✅ Response time < 1s for 95% of requests
- ✅ No memory leaks

**Rezultat:** ✅ PASS / ❌ FAIL

---

## 📱 Phone / SMS

### Metoda 1: Manual Testing (Happy Path)
**Scop:** Validare SMS flow complet

**Pași:**
1. **Enter Phone Number:**
   ```
   Navigate to /login
   Click "Telefon"
   Enter: +40 712 345 678
   Click "Trimite Cod"
   ```
   ✅ Expected: "Cod trimis pe SMS"

2. **Receive SMS:**
   - Check phone for SMS
   - Should receive within 30 seconds
   - Format: "Codul tău Swaply: 123456. Valabil 5 minute."
   ✅ Expected: SMS received

3. **Enter OTP:**
   ```
   Enter: 1 2 3 4 5 6 (from SMS)
   Click "Verifică"
   ```
   ✅ Expected: Redirect la /profil, logged in

4. **Test Resend:**
   - Wait 60 seconds (cooldown)
   - Click "Retrimite Cod"
   ✅ Expected: New SMS received

5. **Test Expiry:**
   - Wait 5 minutes
   - Try entering old code
   ✅ Expected: "Cod expirat"

**Rezultat:** ✅ PASS / ❌ FAIL

---

### Metoda 2: Automated SMS Testing (Twilio Test Credentials)
**Scop:** Test fără a trimite SMS real

**Setup:**
```bash
# Use Twilio test credentials
TWILIO_ACCOUNT_SID=ACxxxTESTxxx
TWILIO_AUTH_TOKEN=test_token
TWILIO_PHONE_NUMBER=+15005550006 # Twilio magic number
```

**Test Script:**
```typescript
// tests/auth/phone-sms.test.ts
import { describe, it, expect } from 'vitest';

describe('Phone SMS Authentication', () => {
  it('should send SMS with test credentials', async () => {
    const testPhone = '+15005550006'; // Twilio test number
    
    const { error } = await supabase.auth.signInWithOtp({
      phone: testPhone,
    });
    
    expect(error).toBeNull();
    // Twilio doesn't actually send SMS to test numbers
  });
  
  it('should verify OTP', async () => {
    const testPhone = '+15005550006';
    const testOTP = '123456'; // Any 6-digit code works with test number
    
    const { data, error } = await supabase.auth.verifyOtp({
      phone: testPhone,
      token: testOTP,
      type: 'sms',
    });
    
    expect(error).toBeNull();
    expect(data.session).toBeDefined();
  });
  
  it('should reject invalid OTP', async () => {
    const { error } = await supabase.auth.verifyOtp({
      phone: '+15005550006',
      token: '000000', // Invalid
      type: 'sms',
    });
    
    expect(error).toBeDefined();
    expect(error?.message).toContain('invalid');
  });
});
```

**Rezultat:** ✅ PASS / ❌ FAIL

---

### Metoda 3: International Number Validation
**Scop:** Test numere internaționale

**Test Cases:**

| Country | Number | Format | Valid? |
|---------|--------|--------|--------|
| România | +40712345678 | E.164 | ✅ |
| SUA | +12025551234 | E.164 | ✅ |
| UK | +447911123456 | E.164 | ✅ |
| Germania | +4915123456789 | E.164 | ✅ |
| Invalid | 0712345678 | Local | ❌ |
| Invalid | +40 712 345 | Too short | ❌ |

**Test Script:**
```typescript
// tests/validation/phone-validation.test.ts
import { describe, it, expect } from 'vitest';
import { parsePhoneNumber } from 'libphonenumber-js';

describe('Phone Number Validation', () => {
  const validNumbers = [
    '+40712345678',
    '+12025551234',
    '+447911123456',
  ];
  
  const invalidNumbers = [
    '0712345678',     // Missing country code
    '+40 712 345',    // Too short
    '+99912345678',   // Invalid country code
  ];
  
  it('should accept valid international numbers', () => {
    validNumbers.forEach(number => {
      const parsed = parsePhoneNumber(number);
      expect(parsed?.isValid()).toBe(true);
    });
  });
  
  it('should reject invalid numbers', () => {
    invalidNumbers.forEach(number => {
      try {
        const parsed = parsePhoneNumber(number);
        expect(parsed?.isValid()).toBe(false);
      } catch (error) {
        // Expected to throw for invalid format
        expect(error).toBeDefined();
      }
    });
  });
});
```

**Rezultat:** ✅ PASS / ❌ FAIL

---

### Metoda 4: SMS Deliverability Testing
**Scop:** Verificare ajungere SMS

**Test Matrix:**

| Carrier | Country | Delivery | Time | Cost |
|---------|---------|----------|------|------|
| Orange | România | ✅ | < 5s | $0.05 |
| Vodafone | România | ✅ | < 5s | $0.05 |
| Digi | România | ✅ | < 10s | $0.05 |
| AT&T | SUA | ✅ | < 10s | $0.01 |
| Verizon | SUA | ✅ | < 10s | $0.01 |

**Monitoring:**
```javascript
// scripts/monitor-sms-delivery.js
async function monitorSMSDelivery() {
  const twilio = require('twilio')(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
  
  // Get recent SMS logs
  const messages = await twilio.messages.list({
    dateSentAfter: new Date(Date.now() - 3600000), // Last hour
    limit: 100,
  });
  
  const stats = {
    sent: 0,
    delivered: 0,
    failed: 0,
    avgTime: 0,
  };
  
  messages.forEach(msg => {
    stats.sent++;
    if (msg.status === 'delivered') stats.delivered++;
    if (msg.status === 'failed') stats.failed++;
    
    const sentTime = new Date(msg.dateSent);
    const deliveredTime = new Date(msg.dateUpdated);
    stats.avgTime += (deliveredTime - sentTime) / 1000;
  });
  
  stats.avgTime = stats.avgTime / stats.delivered;
  
  console.log('SMS Delivery Stats:', stats);
  return stats;
}
```

**Rezultat:** ✅ PASS / ❌ FAIL

---

### Metoda 5: Security & Rate Limiting
**Scop:** Prevenire abuz SMS

**Test Cases:**

| Test | Action | Expected Result |
|------|--------|-----------------|
| **Rate Limit** | 5 SMS în 1 minut | ❌ Blocat după 3 |
| **Daily Limit** | 10 SMS per user/day | ❌ Blocat după 10 |
| **IP Limit** | 20 SMS per IP/hour | ❌ Blocat după 20 |
| **Cost Control** | Total $50/hour | ❌ Alert + stop |
| **Fake Numbers** | +99999999999 | ❌ Invalid number |
| **Premium Numbers** | +900... | ❌ Blocked |

**Implementation:**
```typescript
// middleware/sms-rate-limit.ts
import { rateLimit } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';

export const smsRateLimit = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'sms-limit:',
  }),
  windowMs: 60 * 1000, // 1 minute
  max: 3, // Max 3 SMS per minute per phone
  keyGenerator: (req) => req.body.phone,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Prea multe cereri. Încearcă din nou în 1 minut.',
    });
  },
});

// Cost monitoring
let hourlyCost = 0;
const HOURLY_LIMIT = 50; // $50

export async function checkCostLimit() {
  if (hourlyCost >= HOURLY_LIMIT) {
    // Send alert
    await sendAlert('SMS cost limit reached!');
    throw new Error('SMS cost limit exceeded');
  }
}

// Track cost after each SMS
export async function trackSMSCost(cost: number) {
  hourlyCost += cost;
  
  // Reset hourly
  setTimeout(() => {
    hourlyCost = 0;
  }, 3600000);
}
```

**Test:**
```bash
# Run security tests
npm run test:security:sms
```

**Rezultat:** ✅ PASS / ❌ FAIL

---

## 📊 Rezumat Complet

### Rezumat pe Auth Type

| Auth Type | Metoda 1 | Metoda 2 | Metoda 3 | Metoda 4 | Metoda 5 |
|-----------|----------|----------|----------|----------|----------|
| **Email+Password** | Manual Happy Path | E2E Playwright | Security Testing | Load Testing (k6) | DB Integration |
| **Magic Link** | Manual Happy Path | Callback Testing | Email Deliverability | Security & Edge Cases | Cross-Browser |
| **Google OAuth** | Manual Happy Path | Automated OAuth E2E | PKCE Validation | OAuth Security | Load Testing |
| **Phone/SMS** | Manual Happy Path | Twilio Test Mode | International Numbers | SMS Deliverability | Rate Limiting |

### Coverage Matrix

| Test Type | Email | Magic | Google | Phone | Total |
|-----------|-------|-------|--------|-------|-------|
| **Manual** | ✅ | ✅ | ✅ | ✅ | 4/4 |
| **Automated** | ✅ | ✅ | ✅ | ✅ | 4/4 |
| **Security** | ✅ | ✅ | ✅ | ✅ | 4/4 |
| **Performance** | ✅ | ❌ | ✅ | ✅ | 3/4 |
| **Integration** | ✅ | ✅ | ✅ | ✅ | 4/4 |

**Total:** 20 metode de testare (5 × 4 auth types)

### Quick Commands

```bash
# Run all auth tests
npm run test:auth

# Run specific auth type
npm run test:auth:email
npm run test:auth:magic
npm run test:auth:google
npm run test:auth:phone

# Run security tests
npm run test:security

# Run load tests
k6 run tests/load/auth-load.js

# Run cross-browser tests
npx playwright test --project=chromium firefox webkit
```
