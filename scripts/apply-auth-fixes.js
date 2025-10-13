#!/usr/bin/env node

/**
 * 🔧 Aplicare Automată Fix-uri Auth
 * 3 metode pentru fiecare pas de remediere
 */

import { readFileSync, writeFileSync, existsSync, copyFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';

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

const fixes = {
  applied: [],
  skipped: [],
  failed: [],
};

function recordFix(fixName, status, message) {
  if (status === 'applied') {
    fixes.applied.push({ fixName, message });
    log.success(`${fixName}: ${message}`);
  } else if (status === 'skipped') {
    fixes.skipped.push({ fixName, message });
    log.warning(`${fixName}: ${message}`);
  } else {
    fixes.failed.push({ fixName, message });
    log.error(`${fixName}: ${message}`);
  }
}

async function fix1A_NextResponseCookies() {
  log.step('\n🔧 Fix 1.A: NextResponse Cookies Pattern');
  
  try {
    const callbackPath = './src/app/auth/callback/route.ts';
    
    if (!existsSync(callbackPath)) {
      recordFix('Fix 1.A', 'failed', 'Callback route not found');
      return;
    }
    
    let content = readFileSync(callbackPath, 'utf-8');
    
    // Check if already fixed
    if (content.includes('response.cookies.set') && content.includes('NextResponse.redirect')) {
      recordFix('Fix 1.A', 'skipped', 'Already using NextResponse.cookies pattern');
      return;
    }
    
    // Apply fix
    log.info('Rewriting callback to use NextResponse.cookies...');
    
    const fixedContent = `import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const token_hash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type');
  const next = url.searchParams.get('next') || '/profil';
  
  console.log('🔍 Auth callback params:', { 
    hasCode: !!code, 
    hasTokenHash: !!token_hash, 
    type 
  });

  // CRITICAL: Create response FIRST, before Supabase client
  const response = NextResponse.redirect(\`\${url.origin}\${next}\`);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const cookies = request.headers.get('cookie')?.split('; ') || [];
          const cookie = cookies.find((c) => c.startsWith(\`\${name}=\`));
          return cookie?.split('=')[1];
        },
        set(name: string, value: string, options: any) {
          // Set cookie on response object
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

  // Handle OAuth PKCE or Magic Link
  if (code) {
    // OAuth flow (Google, etc.)
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('🔴 Exchange code error:', error);
      return NextResponse.redirect(\`\${url.origin}/login?error=\${encodeURIComponent(error.message)}\`);
    }
    
    console.log('✅ OAuth session created');
  } else if (token_hash && type) {
    // Magic Link flow
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as any,
    });
    
    if (error) {
      console.error('🔴 Verify OTP error:', error);
      return NextResponse.redirect(\`\${url.origin}/login?error=\${encodeURIComponent(error.message)}\`);
    }
    
    console.log('✅ Magic Link session created');
  } else {
    console.error('🔴 No code or token_hash provided');
    return NextResponse.redirect(\`\${url.origin}/login?error=invalid_request\`);
  }

  return response;
}
`;

    writeFileSync(callbackPath, fixedContent);
    recordFix('Fix 1.A', 'applied', 'Rewrote callback with NextResponse.cookies pattern');
    
  } catch (error) {
    recordFix('Fix 1.A', 'failed', `Error: ${error.message}`);
  }
}

async function fix1B_AlternativePOST() {
  log.step('\n🔧 Fix 1.B: Alternative POST Handler (Backup Method)');
  
  // This is a backup method - only apply if requested
  log.info('This fix is optional - creates POST endpoint for auth callback');
  log.info('Current GET handler should work with Fix 1.A');
  recordFix('Fix 1.B', 'skipped', 'Optional - GET handler with NextResponse is preferred');
}

async function fix1C_ServerAction() {
  log.step('\n🔧 Fix 1.C: Server Action Alternative (Backup Method)');
  
  // This is another backup method
  log.info('This fix is optional - converts callback to Server Action');
  log.info('Route Handler with NextResponse is the standard approach');
  recordFix('Fix 1.C', 'skipped', 'Optional - Route Handler is standard for OAuth callbacks');
}

async function fix2A_RedirectURLs() {
  log.step('\n🔧 Fix 2.A: Supabase Redirect URLs Configuration');
  
  log.info('📋 Manual configuration required in Supabase Dashboard:');
  log.info('');
  log.info('1. Go to: https://supabase.com/dashboard');
  log.info('2. Select your project');
  log.info('3. Navigate to: Authentication → URL Configuration');
  log.info('4. Set Site URL to: https://swaply-site.vercel.app');
  log.info('5. Add Redirect URLs:');
  log.info('   - https://swaply-site.vercel.app/auth/callback');
  log.info('   - https://swaply-site.vercel.app/**');
  log.info('   - http://localhost:3000/auth/callback');
  log.info('   - http://localhost:3000/**');
  log.info('6. Save changes');
  log.info('');
  
  recordFix('Fix 2.A', 'skipped', 'Manual configuration required in Supabase Dashboard');
}

async function fix2B_EmailConfirmation() {
  log.step('\n🔧 Fix 2.B: Email Confirmation Settings');
  
  log.info('📋 Optional: Disable email confirmation for faster testing:');
  log.info('');
  log.info('1. Go to: Supabase Dashboard → Authentication → Providers → Email');
  log.info('2. Temporarily disable "Confirm Email" for testing');
  log.info('3. Re-enable after auth is working');
  log.info('');
  
  recordFix('Fix 2.B', 'skipped', 'Optional configuration for testing');
}

async function fix2C_PKCESettings() {
  log.step('\n🔧 Fix 2.C: PKCE Flow Configuration');
  
  log.info('📋 Verify PKCE is enabled (should be default):');
  log.info('');
  log.info('1. Go to: Supabase Dashboard → Authentication → Settings');
  log.info('2. Verify: PKCE Flow is enabled');
  log.info('3. If not enabled, enable it');
  log.info('');
  
  recordFix('Fix 2.C', 'skipped', 'PKCE should be enabled by default');
}

async function fix3A_GoogleCloudConsole() {
  log.step('\n🔧 Fix 3.A: Google Cloud Console Configuration');
  
  log.info('📋 Manual configuration required in Google Cloud Console:');
  log.info('');
  log.info('1. Go to: https://console.cloud.google.com');
  log.info('2. Navigate to: APIs & Services → Credentials');
  log.info('3. Select your OAuth 2.0 Client ID');
  log.info('4. Add Authorized redirect URIs:');
  log.info('   - https://swaply-site.vercel.app/auth/callback');
  log.info('   - https://[YOUR-SUPABASE-PROJECT-REF].supabase.co/auth/v1/callback');
  log.info('   - http://localhost:3000/auth/callback');
  log.info('5. Add Authorized JavaScript origins:');
  log.info('   - https://swaply-site.vercel.app');
  log.info('   - http://localhost:3000');
  log.info('6. Save changes');
  log.info('');
  
  recordFix('Fix 3.A', 'skipped', 'Manual configuration required in Google Cloud Console');
}

async function fix3B_RegenerateCredentials() {
  log.step('\n🔧 Fix 3.B: Regenerate Google OAuth Credentials (If Corrupted)');
  
  log.info('📋 Only if current credentials are corrupted:');
  log.info('');
  log.info('1. Go to: Google Cloud Console → Credentials');
  log.info('2. Delete old OAuth 2.0 Client ID');
  log.info('3. Create new OAuth 2.0 Client ID (Web application)');
  log.info('4. Configure redirect URIs (see Fix 3.A)');
  log.info('5. Copy new Client ID and Client Secret');
  log.info('6. Update in Supabase Dashboard');
  log.info('7. Update in .env.local (if using server-side)');
  log.info('');
  
  recordFix('Fix 3.B', 'skipped', 'Only needed if credentials corrupted');
}

async function fix3C_OAuthPlayground() {
  log.step('\n🔧 Fix 3.C: Test with Google OAuth Playground');
  
  log.info('📋 Verify credentials work outside your app:');
  log.info('');
  log.info('1. Go to: https://developers.google.com/oauthplayground/');
  log.info('2. Click gear icon → Use your own OAuth credentials');
  log.info('3. Enter your Client ID and Client Secret');
  log.info('4. Select: Google OAuth2 API v2 → https://www.googleapis.com/auth/userinfo.profile');
  log.info('5. Authorize APIs');
  log.info('6. Exchange authorization code for tokens');
  log.info('7. Verify it works');
  log.info('');
  
  recordFix('Fix 3.C', 'skipped', 'Optional external verification');
}

async function createBackupFile(filePath) {
  const backupPath = filePath.replace(/\.ts$/, '.backup.ts');
  if (existsSync(filePath)) {
    copyFileSync(filePath, backupPath);
    log.info(`📄 Backup created: ${backupPath}`);
  }
}

async function runAllFixes() {
  console.log(`${colors.cyan}${colors.bright}
╔═══════════════════════════════════════════════════════════╗
║  🔧 APLICARE AUTOMATĂ FIX-URI AUTH                        ║
║  3 Metode pentru fiecare pas de remediere                 ║
╚═══════════════════════════════════════════════════════════╝
${colors.reset}`);

  // Create backup before applying fixes
  log.step('\n💾 Creating backups...');
  await createBackupFile('./src/app/auth/callback/route.ts');

  // Apply fixes
  await fix1A_NextResponseCookies();
  await fix1B_AlternativePOST();
  await fix1C_ServerAction();
  
  await fix2A_RedirectURLs();
  await fix2B_EmailConfirmation();
  await fix2C_PKCESettings();
  
  await fix3A_GoogleCloudConsole();
  await fix3B_RegenerateCredentials();
  await fix3C_OAuthPlayground();

  // Summary
  console.log(`\n${colors.bright}═══════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.green}✅ Applied: ${fixes.applied.length}${colors.reset}`);
  console.log(`${colors.yellow}⚠️  Skipped: ${fixes.skipped.length}${colors.reset}`);
  console.log(`${colors.red}❌ Failed:  ${fixes.failed.length}${colors.reset}`);
  console.log(`${colors.bright}═══════════════════════════════════════════════════════════${colors.reset}\n`);

  if (fixes.applied.length > 0) {
    log.success('Fixes applied! Next steps:');
    log.info('1. Review changes in src/app/auth/callback/route.ts');
    log.info('2. Complete manual configurations (Supabase Dashboard, Google Console)');
    log.info('3. Run: npm run test:auth:verify');
    log.info('4. Run: npm run build');
  }

  if (fixes.skipped.length > 0) {
    log.warning('Some fixes require manual configuration - see logs above');
  }

  const exitCode = fixes.failed.length > 0 ? 1 : 0;
  process.exit(exitCode);
}

runAllFixes().catch(error => {
  log.error(`Fatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
