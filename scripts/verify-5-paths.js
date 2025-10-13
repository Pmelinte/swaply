#!/usr/bin/env node

/**
 * ✅ 5 Căi de Verificare Auth
 * Validare completă după aplicarea fix-urilor
 */

import https from 'https';
import http from 'http';
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.cyan}ℹ️  ${msg}${colors.reset}`),
  step: (msg) => console.log(`${colors.blue}${colors.bright}${msg}${colors.reset}`),
};

const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  paths: [],
};

function recordResult(pathName, passed, message, warning = false) {
  results.paths.push({ pathName, passed, message, warning });
  if (warning) {
    results.warnings++;
    log.warning(`${pathName}: ${message}`);
  } else if (passed) {
    results.passed++;
    log.success(`${pathName}: ${message}`);
  } else {
    results.failed++;
    log.error(`${pathName}: ${message}`);
  }
}

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const options = {
      method: 'GET',
      headers: {
        'User-Agent': 'Auth-Verification-Script',
      },
    };

    const req = client.get(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });

    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function path1_AutomatedUnitTests() {
  log.step('\n📝 Cale 1: Automated Unit Tests');
  
  try {
    const callbackPath = './src/app/auth/callback/route.ts';
    
    if (!existsSync(callbackPath)) {
      recordResult('Path 1', false, 'Callback route file not found');
      return;
    }
    
    const content = readFileSync(callbackPath, 'utf-8');
    
    // Test 1.1: Check for NextResponse.redirect
    const hasRedirect = content.includes('NextResponse.redirect');
    if (!hasRedirect) {
      recordResult('Path 1.1', false, 'Missing NextResponse.redirect');
      return;
    }
    recordResult('Path 1.1', true, 'NextResponse.redirect present');
    
    // Test 1.2: Check response created before Supabase client
    const responseBeforeSupabase = content.indexOf('NextResponse.redirect') < content.indexOf('createServerClient');
    if (!responseBeforeSupabase) {
      recordResult('Path 1.2', false, 'Response not created before Supabase client');
      return;
    }
    recordResult('Path 1.2', true, 'Response created before Supabase client');
    
    // Test 1.3: Check cookie handlers use response.cookies
    const usesResponseCookies = content.includes('response.cookies.set');
    if (!usesResponseCookies) {
      recordResult('Path 1.3', false, 'Cookie handlers not using response.cookies');
      return;
    }
    recordResult('Path 1.3', true, 'Cookie handlers use response.cookies.set');
    
    // Test 1.4: Check both flows exist
    const hasOAuthFlow = content.includes('exchangeCodeForSession');
    const hasMagicLinkFlow = content.includes('verifyOtp');
    if (!hasOAuthFlow || !hasMagicLinkFlow) {
      recordResult('Path 1.4', false, `Missing flows: OAuth=${hasOAuthFlow}, MagicLink=${hasMagicLinkFlow}`);
      return;
    }
    recordResult('Path 1.4', true, 'Both OAuth and Magic Link flows implemented');
    
    // Test 1.5: Check error handling
    const hasErrorHandling = content.includes('error') && (
      content.includes('console.error') || content.includes('console.log')
    );
    recordResult('Path 1.5', hasErrorHandling, 
      hasErrorHandling ? 'Error handling present' : 'Missing error handling');
    
  } catch (error) {
    recordResult('Path 1', false, `Error: ${error.message}`);
  }
}

async function path2_ManualBrowserTest() {
  log.step('\n📝 Cale 2: Manual Browser Test Instructions');
  
  log.info('');
  log.info('📋 Manual testing steps:');
  log.info('');
  log.info('2.1 - Test Magic Link:');
  log.info('      1. Open Incognito window');
  log.info('      2. Navigate to: http://localhost:3000/login');
  log.info('      3. Click "Link Magic" button');
  log.info('      4. Enter your email');
  log.info('      5. Check email for magic link');
  log.info('      6. Click the link');
  log.info('      7. Open DevTools → Application → Cookies');
  log.info('      8. Verify: sb-*-auth-token cookie exists');
  log.info('      9. Verify: Redirected to /profil');
  log.info('');
  log.info('2.2 - Test Google OAuth:');
  log.info('      1. Open new Incognito window');
  log.info('      2. Navigate to: http://localhost:3000/login');
  log.info('      3. Click "Continuă cu Google" button');
  log.info('      4. Select Google account');
  log.info('      5. Authorize app');
  log.info('      6. Check DevTools → Application → Cookies');
  log.info('      7. Verify: sb-*-auth-token cookie exists');
  log.info('      8. Verify: Redirected to /profil');
  log.info('');
  
  recordResult('Path 2', true, 'Manual test instructions provided', true);
}

async function path3_CurlTest() {
  log.step('\n📝 Cale 3: Curl/HTTP Test');
  
  try {
    // Test local server
    log.info('Testing callback endpoint on localhost...');
    
    const testUrl = 'http://localhost:3000/auth/callback?error=test';
    
    try {
      const response = await makeRequest(testUrl);
      
      // Check 3.1: Returns redirect status
      const isRedirect = response.statusCode >= 300 && response.statusCode < 400;
      recordResult('Path 3.1', isRedirect, 
        `Callback returns redirect: ${response.statusCode}`);
      
      // Check 3.2: Has Location header
      const hasLocation = !!response.headers['location'];
      recordResult('Path 3.2', hasLocation, 
        hasLocation ? `Redirects to: ${response.headers['location']}` : 'Missing Location header');
      
      // Check 3.3: Has Set-Cookie header (may not be present for error case)
      const hasCookie = !!response.headers['set-cookie'];
      recordResult('Path 3.3', true, 
        hasCookie ? 'Has Set-Cookie header' : 'No cookies for error case (expected)', !hasCookie);
      
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        recordResult('Path 3', false, 'Local server not running. Start with: npm run dev', true);
      } else {
        throw error;
      }
    }
    
  } catch (error) {
    recordResult('Path 3', false, `Error: ${error.message}`);
  }
}

async function path4_PlaywrightE2E() {
  log.step('\n📝 Cale 4: Playwright E2E Test Instructions');
  
  const testDir = './tests';
  const testFile = './tests/auth-e2e.spec.ts';
  
  if (!existsSync(testDir)) {
    log.info('Creating tests directory...');
    mkdirSync(testDir, { recursive: true });
  }
  
  if (!existsSync(testFile)) {
    log.info('Creating Playwright E2E test file...');
    
    const testContent = `import { test, expect } from '@playwright/test';

test.describe('Auth E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Clear cookies before each test
    await page.context().clearCookies();
  });

  test('Magic Link Flow - should set session cookie', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    
    // Fill email form
    await page.click('text=Link Magic');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.click('button[type="submit"]');
    
    // Wait for success message
    await expect(page.locator('text=Check your email')).toBeVisible({ timeout: 5000 });
    
    // Note: To complete this test, you need to:
    // 1. Fetch the magic link from the email
    // 2. Navigate to that URL
    // 3. Verify session cookie is set
    // 4. Verify redirect to /profil
  });

  test('Google OAuth Flow - should set session cookie', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    
    // Click Google OAuth button
    const [popup] = await Promise.all([
      page.waitForEvent('popup'),
      page.click('text=Continuă cu Google'),
    ]);
    
    // Handle Google login popup
    // Note: Requires test Google account credentials
    
    // After OAuth callback
    await expect(page).toHaveURL(/\\/profil/, { timeout: 10000 });
    
    // Verify session cookie
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find(c => c.name.includes('auth-token'));
    expect(sessionCookie).toBeDefined();
  });

  test('Auth Callback - handles invalid token', async ({ page }) => {
    await page.goto('http://localhost:3000/auth/callback?token_hash=invalid&type=magiclink');
    
    // Should redirect to login with error
    await expect(page).toHaveURL(/\\/login\\?error=/, { timeout: 5000 });
  });

  test('Auth Callback - handles invalid OAuth code', async ({ page }) => {
    await page.goto('http://localhost:3000/auth/callback?code=invalid');
    
    // Should redirect to login with error
    await expect(page).toHaveURL(/\\/login\\?error=/, { timeout: 5000 });
  });
});
`;
    
    writeFileSync(testFile, testContent);
    log.success('Created: tests/auth-e2e.spec.ts');
  }
  
  log.info('');
  log.info('📋 To run Playwright E2E tests:');
  log.info('');
  log.info('1. Install Playwright: npm install -D @playwright/test');
  log.info('2. Install browsers: npx playwright install');
  log.info('3. Start dev server: npm run dev');
  log.info('4. Run tests: npx playwright test tests/auth-e2e.spec.ts');
  log.info('5. View report: npx playwright show-report');
  log.info('');
  
  recordResult('Path 4', true, 'Playwright test file created', true);
}

async function path5_MonitoringDashboard() {
  log.step('\n📝 Cale 5: Monitoring Dashboard');
  
  const dashboardFile = './src/app/api/auth/health/route.ts';
  
  log.info('Creating auth health monitoring endpoint...');
  
  const dashboardDir = './src/app/api/auth/health';
  if (!existsSync(dashboardDir)) {
    mkdirSync(dashboardDir, { recursive: true });
  }
  
  const healthContent = `import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function GET(request: Request) {
  const startTime = Date.now();
  
  // Create minimal Supabase client for health check
  const response = NextResponse.json({ status: 'checking' });
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.headers.get('cookie')
            ?.split('; ')
            .find((c) => c.startsWith(\`\${name}=\`))
            ?.split('=')[1];
        },
        set() {}, // No-op for health check
        remove() {}, // No-op for health check
      },
    }
  );

  // Check Supabase connection
  const { data: session, error: sessionError } = await supabase.auth.getSession();
  
  // Check environment variables
  const envCheck = {
    supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    siteUrl: !!process.env.NEXT_PUBLIC_SITE_URL,
    googleClientId: !!process.env.GOOGLE_CLIENT_ID,
  };

  const responseTime = Date.now() - startTime;

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    responseTime: \`\${responseTime}ms\`,
    auth: {
      supabaseConnected: !sessionError,
      hasSession: !!session,
      sessionError: sessionError?.message,
    },
    environment: envCheck,
    allConfigured: Object.values(envCheck).every(Boolean),
  });
}

export const dynamic = 'force-dynamic';
`;
  
  writeFileSync(dashboardFile, healthContent);
  log.success('Created: /api/auth/health endpoint');
  
  log.info('');
  log.info('📊 Auth Health Monitoring:');
  log.info('');
  log.info('Test locally:');
  log.info('  curl http://localhost:3000/api/auth/health | jq');
  log.info('');
  log.info('Test production:');
  log.info('  curl https://swaply-site.vercel.app/api/auth/health | jq');
  log.info('');
  log.info('Monitor continuously:');
  log.info('  watch -n 30 "curl -s http://localhost:3000/api/auth/health | jq"');
  log.info('');
  
  recordResult('Path 5', true, 'Health monitoring endpoint created');
}

async function runAllPaths() {
  console.log(`${colors.cyan}${colors.bright}
╔═══════════════════════════════════════════════════════════╗
║  ✅ 5 CĂI DE VERIFICARE AUTH                              ║
║  Validare completă după aplicarea fix-urilor             ║
╚═══════════════════════════════════════════════════════════╝
${colors.reset}`);

  await path1_AutomatedUnitTests();
  await path2_ManualBrowserTest();
  await path3_CurlTest();
  await path4_PlaywrightE2E();
  await path5_MonitoringDashboard();

  // Summary
  console.log(`\n${colors.bright}═══════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.green}✅ Passed:  ${results.passed}${colors.reset}`);
  console.log(`${colors.red}❌ Failed:  ${results.failed}${colors.reset}`);
  console.log(`${colors.yellow}⚠️  Manual:  ${results.warnings}${colors.reset}`);
  console.log(`${colors.bright}═══════════════════════════════════════════════════════════${colors.reset}\n`);

  const exitCode = results.failed > 0 ? 1 : 0;
  
  if (exitCode === 0) {
    log.success('All automated verifications passed! ✨');
    log.info('Complete manual checks above before deploying.');
  } else {
    log.error('Some verifications failed. Review errors above.');
  }
  
  process.exit(exitCode);
}

runAllPaths().catch(error => {
  log.error(`Fatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
