#!/usr/bin/env node

/**
 * 🔍 10 Metode de Diagnosticare Auth
 * Testează Next.js, Supabase, Google OAuth
 */

import { readFileSync, existsSync } from 'fs';
import { config } from 'dotenv';

config(); // Load .env.local

const colors = {
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
  tests: [],
};

function recordResult(testName, passed, message, warning = false) {
  results.tests.push({ testName, passed, message, warning });
  if (warning) {
    results.warnings++;
    log.warning(`${testName}: ${message}`);
  } else if (passed) {
    results.passed++;
    log.success(`${testName}: ${message}`);
  } else {
    results.failed++;
    log.error(`${testName}: ${message}`);
  }
}

async function test1_NextJSCookies() {
  log.step('\n📝 Test 1: Next.js cookies() Behavior');
  
  try {
    const callbackPath = './src/app/auth/callback/route.ts';
    
    if (!existsSync(callbackPath)) {
      recordResult('Test 1', false, 'Callback route not found');
      return;
    }
    
    const content = readFileSync(callbackPath, 'utf-8');
    
    // Check 1.1: Should NOT use cookies() from next/headers in GET
    const usesCookiesImport = content.includes("import { cookies } from 'next/headers'");
    const usesNextResponse = content.includes('NextResponse');
    const usesResponseCookies = content.includes('response.cookies.set');
    
    if (usesCookiesImport && !usesNextResponse) {
      recordResult('Test 1.1', false, 'Using cookies() without NextResponse - will fail in GET handler');
    } else if (usesNextResponse && usesResponseCookies) {
      recordResult('Test 1.1', true, 'Correctly using NextResponse.cookies');
    } else {
      recordResult('Test 1.1', false, 'Cookie handling unclear', true);
    }
    
    // Check 1.2: Verify cookie handlers exist
    const hasCookieHandlers = content.includes('cookies: {') && content.includes('set(') && content.includes('get(');
    recordResult('Test 1.2', hasCookieHandlers, 
      hasCookieHandlers ? 'Cookie handlers defined' : 'Missing cookie handlers');
    
    // Check 1.3: Check for proper httpOnly, sameSite, secure flags
    const hasHttpOnly = content.includes('httpOnly');
    const hasSameSite = content.includes('sameSite');
    const hasSecure = content.includes('secure');
    
    recordResult('Test 1.3', hasHttpOnly && hasSameSite, 
      `Security flags: httpOnly=${hasHttpOnly}, sameSite=${hasSameSite}, secure=${hasSecure}`);
    
  } catch (error) {
    recordResult('Test 1', false, `Error: ${error.message}`);
  }
}

async function test2_SupabaseSSR() {
  log.step('\n📝 Test 2: Supabase SSR Integration');
  
  try {
    const callbackPath = './src/app/auth/callback/route.ts';
    const content = readFileSync(callbackPath, 'utf-8');
    
    // Check 2.1: Uses createServerClient from @supabase/ssr
    const usesServerClient = content.includes('createServerClient');
    recordResult('Test 2.1', usesServerClient, 
      usesServerClient ? 'Using @supabase/ssr' : 'Not using Supabase SSR');
    
    // Check 2.2: Has exchangeCodeForSession for OAuth
    const hasExchangeCode = content.includes('exchangeCodeForSession');
    recordResult('Test 2.2', hasExchangeCode, 
      hasExchangeCode ? 'OAuth PKCE flow implemented' : 'Missing exchangeCodeForSession');
    
    // Check 2.3: Has verifyOtp for Magic Link
    const hasVerifyOtp = content.includes('verifyOtp');
    recordResult('Test 2.3', hasVerifyOtp, 
      hasVerifyOtp ? 'Magic Link flow implemented' : 'Missing verifyOtp');
    
  } catch (error) {
    recordResult('Test 2', false, `Error: ${error.message}`);
  }
}

async function test3_GoogleOAuthPKCE() {
  log.step('\n📝 Test 3: Google OAuth PKCE Configuration');
  
  try {
    // Check 3.1: Environment variables
    const hasGoogleClientId = !!process.env.GOOGLE_CLIENT_ID;
    const hasGoogleSecret = !!process.env.GOOGLE_CLIENT_SECRET;
    
    recordResult('Test 3.1', hasGoogleClientId && hasGoogleSecret, 
      `Google OAuth credentials: ClientID=${hasGoogleClientId}, Secret=${hasGoogleSecret}`);
    
    // Check 3.2: Supabase config for Google provider
    log.info('Check Supabase Dashboard → Authentication → Providers → Google');
    log.info('Required: Client ID and Client Secret configured');
    recordResult('Test 3.2', true, 'Manual check required in Supabase Dashboard', true);
    
    // Check 3.3: Redirect URIs in code
    const callbackPath = './src/app/auth/callback/route.ts';
    if (existsSync(callbackPath)) {
      const content = readFileSync(callbackPath, 'utf-8');
      const hasRedirectLogic = content.includes('redirect') && content.includes('url.origin');
      recordResult('Test 3.3', hasRedirectLogic, 
        hasRedirectLogic ? 'Redirect logic present' : 'Missing redirect logic');
    }
    
  } catch (error) {
    recordResult('Test 3', false, `Error: ${error.message}`);
  }
}

async function test4_ExchangeCodeFlow() {
  log.step('\n📝 Test 4: exchangeCodeForSession Implementation');
  
  try {
    const callbackPath = './src/app/auth/callback/route.ts';
    const content = readFileSync(callbackPath, 'utf-8');
    
    // Check 4.1: Extracts code from URL params
    const extractsCode = content.includes('searchParams.get') && content.includes('code');
    recordResult('Test 4.1', extractsCode, 
      extractsCode ? 'Extracts code parameter' : 'Not extracting code parameter');
    
    // Check 4.2: Calls exchangeCodeForSession
    const callsExchange = content.includes('exchangeCodeForSession(code)');
    recordResult('Test 4.2', callsExchange, 
      callsExchange ? 'Calls exchangeCodeForSession' : 'Missing exchangeCodeForSession call');
    
    // Check 4.3: Handles errors
    const hasErrorHandling = content.includes('error') && content.includes('console.');
    recordResult('Test 4.3', hasErrorHandling, 
      hasErrorHandling ? 'Has error handling' : 'Missing error handling');
    
  } catch (error) {
    recordResult('Test 4', false, `Error: ${error.message}`);
  }
}

async function test5_MagicLinkVerify() {
  log.step('\n📝 Test 5: Magic Link verifyOtp Implementation');
  
  try {
    const callbackPath = './src/app/auth/callback/route.ts';
    const content = readFileSync(callbackPath, 'utf-8');
    
    // Check 5.1: Extracts token_hash from URL
    const extractsToken = content.includes('token_hash');
    recordResult('Test 5.1', extractsToken, 
      extractsToken ? 'Extracts token_hash parameter' : 'Not extracting token_hash');
    
    // Check 5.2: Calls verifyOtp
    const callsVerify = content.includes('verifyOtp');
    recordResult('Test 5.2', callsVerify, 
      callsVerify ? 'Calls verifyOtp' : 'Missing verifyOtp call');
    
    // Check 5.3: Handles type parameter (magiclink, signup, etc.)
    const handlesType = content.includes('type');
    recordResult('Test 5.3', handlesType, 
      handlesType ? 'Handles type parameter' : 'Missing type parameter handling');
    
  } catch (error) {
    recordResult('Test 5', false, `Error: ${error.message}`);
  }
}

async function test6_MiddlewareCookies() {
  log.step('\n📝 Test 6: Middleware Cookie Interference');
  
  try {
    const middlewarePath = './middleware.ts';
    
    if (!existsSync(middlewarePath)) {
      recordResult('Test 6', false, 'middleware.ts not found');
      return;
    }
    
    const content = readFileSync(middlewarePath, 'utf-8');
    
    // Check 6.1: Skips /auth/callback route
    const skipsCallback = content.includes('/auth/callback') && content.includes('authRoutes');
    recordResult('Test 6.1', skipsCallback, 
      skipsCallback ? 'Middleware skips /auth/callback' : 'Middleware may interfere with callback');
    
    // Check 6.2: Has proper cookie handlers
    const hasCookieHandlers = content.includes('cookies:');
    recordResult('Test 6.2', hasCookieHandlers, 
      hasCookieHandlers ? 'Middleware has cookie handlers' : 'Missing cookie handlers in middleware');
    
  } catch (error) {
    recordResult('Test 6', false, `Error: ${error.message}`);
  }
}

async function test7_BrowserCookieStorage() {
  log.step('\n📝 Test 7: Browser Cookie Configuration');
  
  try {
    const callbackPath = './src/app/auth/callback/route.ts';
    const content = readFileSync(callbackPath, 'utf-8');
    
    // Check 7.1: Sets httpOnly for security
    const setsHttpOnly = content.match(/httpOnly\s*:\s*true/);
    recordResult('Test 7.1', !!setsHttpOnly, 
      setsHttpOnly ? 'Cookies are httpOnly' : 'Warning: httpOnly not set');
    
    // Check 7.2: Uses sameSite for CSRF protection
    const setsSameSite = content.match(/sameSite\s*:\s*['"]lax['"]/);
    recordResult('Test 7.2', !!setsSameSite, 
      setsSameSite ? 'SameSite policy configured' : 'Warning: SameSite not set');
    
    // Check 7.3: Sets secure in production
    const setsSecure = content.includes('secure');
    recordResult('Test 7.3', setsSecure, 
      setsSecure ? 'Secure flag configured' : 'Warning: Secure flag not set');
    
  } catch (error) {
    recordResult('Test 7', false, `Error: ${error.message}`);
  }
}

async function test8_EnvironmentVariables() {
  log.step('\n📝 Test 8: Environment Variables');
  
  try {
    // Check 8.1: Supabase credentials
    const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasSupabaseKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    recordResult('Test 8.1', hasSupabaseUrl && hasSupabaseKey, 
      `Supabase: URL=${hasSupabaseUrl}, Key=${hasSupabaseKey}`);
    
    // Check 8.2: Site URL for callbacks
    const hasSiteUrl = !!process.env.NEXT_PUBLIC_SITE_URL;
    recordResult('Test 8.2', hasSiteUrl, 
      hasSiteUrl ? `Site URL: ${process.env.NEXT_PUBLIC_SITE_URL}` : 'Missing NEXT_PUBLIC_SITE_URL');
    
    // Check 8.3: Google OAuth (optional for Magic Link)
    const hasGoogle = !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;
    recordResult('Test 8.3', true, 
      hasGoogle ? 'Google OAuth configured' : 'Google OAuth not configured (OK if only using Magic Link)', !hasGoogle);
    
  } catch (error) {
    recordResult('Test 8', false, `Error: ${error.message}`);
  }
}

async function test9_SupabaseDashboard() {
  log.step('\n📝 Test 9: Supabase Dashboard Configuration');
  
  log.info('Manual checks required in Supabase Dashboard:');
  log.info('');
  log.info('9.1 - Authentication → URL Configuration:');
  log.info('      - Site URL: https://swaply-site.vercel.app');
  log.info('      - Redirect URLs: https://swaply-site.vercel.app/auth/callback');
  log.info('');
  log.info('9.2 - Authentication → Providers → Google:');
  log.info('      - Enabled: ✓');
  log.info('      - Client ID: [your-client-id].apps.googleusercontent.com');
  log.info('      - Client Secret: GOCSPX-[your-secret]');
  log.info('');
  log.info('9.3 - Authentication → Providers → Email:');
  log.info('      - Enable Email Provider: ✓');
  log.info('      - Confirm Email: ✓ (optional)');
  
  recordResult('Test 9', true, 'Manual verification required', true);
}

async function test10_NetworkInspector() {
  log.step('\n📝 Test 10: Network Inspector Simulation');
  
  log.info('Manual test in browser DevTools:');
  log.info('');
  log.info('10.1 - Magic Link Flow:');
  log.info('       1. Open DevTools → Network tab');
  log.info('       2. Navigate to /login');
  log.info('       3. Click Magic Link button');
  log.info('       4. Click link in email');
  log.info('       5. Check: /auth/callback response has Set-Cookie headers');
  log.info('');
  log.info('10.2 - Google OAuth Flow:');
  log.info('       1. Open DevTools → Network tab');
  log.info('       2. Navigate to /login');
  log.info('       3. Click Google OAuth button');
  log.info('       4. Select account');
  log.info('       5. Check: /auth/callback response has Set-Cookie headers');
  log.info('');
  log.info('10.3 - Console Logs:');
  log.info('       - Look for: "🔍 Auth callback params"');
  log.info('       - Look for: "✅ Auth callback successful"');
  log.info('       - Avoid: "🔴 Exchange code error"');
  
  recordResult('Test 10', true, 'Manual verification required in browser', true);
}

async function runAllTests() {
  console.log(`${colors.cyan}${colors.bright}
╔═══════════════════════════════════════════════════════════╗
║  🔍 10 METODE DE DIAGNOSTICARE AUTH                       ║
║  Testing: Next.js + Supabase + Google OAuth              ║
╚═══════════════════════════════════════════════════════════╝
${colors.reset}`);

  await test1_NextJSCookies();
  await test2_SupabaseSSR();
  await test3_GoogleOAuthPKCE();
  await test4_ExchangeCodeFlow();
  await test5_MagicLinkVerify();
  await test6_MiddlewareCookies();
  await test7_BrowserCookieStorage();
  await test8_EnvironmentVariables();
  await test9_SupabaseDashboard();
  await test10_NetworkInspector();

  // Summary
  console.log(`\n${colors.bright}═══════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.green}✅ Passed:  ${results.passed}${colors.reset}`);
  console.log(`${colors.red}❌ Failed:  ${results.failed}${colors.reset}`);
  console.log(`${colors.yellow}⚠️  Warnings: ${results.warnings}${colors.reset}`);
  console.log(`${colors.bright}═══════════════════════════════════════════════════════════${colors.reset}\n`);

  // Exit code
  const exitCode = results.failed > 0 ? 1 : 0;
  
  if (exitCode === 0) {
    log.success('All automated tests passed! ✨');
    log.info('Review manual check warnings above.');
  } else {
    log.error('Some tests failed. Review errors above.');
    log.info('Run: npm run auth:fix to apply fixes');
  }
  
  process.exit(exitCode);
}

runAllTests().catch(error => {
  log.error(`Fatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
