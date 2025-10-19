import { test, expect } from '@playwright/test';
import { waitForMagicLinkEmail, mailEnvironmentReady } from '../utils/mailbox';

/**
 * E2E Test: Magic Link Authentication Flow
 * 
 * This test verifies the complete magic link flow:
 * 1. User requests magic link on login page
 * 2. System sends email with magic link
 * 3. User clicks magic link
 * 4. System authenticates user via PKCE flow
 * 5. User is redirected to authenticated area
 * 
 * Prerequisites:
 * - E2E_MAIL_* environment variables configured
 * - Test email account accessible via IMAP
 * - Supabase auth configured with magic link enabled
 */

test.describe('Magic Link Authentication', () => {
  test.beforeAll(() => {
    if (!mailEnvironmentReady()) {
      throw new Error(
        'IMAP credentials not configured. Set E2E_MAIL_HOST, E2E_MAIL_USER, E2E_MAIL_PASSWORD'
      );
    }
  });

  test('should complete magic link login flow', async ({ page, context }) => {
    const testEmail = process.env.E2E_MAIL_USER;
    
    if (!testEmail) {
      throw new Error('E2E_MAIL_USER not set');
    }

    // Step 1: Navigate to login page
    await page.goto('/login');
    await expect(page).toHaveURL(/\/login/);

    // Step 2: Fill email and request magic link
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
    await emailInput.fill(testEmail);

    // Find and click the magic link button (look for text containing "magic")
    const magicLinkButton = page.locator('button').filter({ 
      hasText: /magic|link|trimite/i 
    });
    await expect(magicLinkButton).toBeVisible();
    
    // Record timestamp before sending request
    const requestTimestamp = new Date();
    requestTimestamp.setSeconds(requestTimestamp.getSeconds() - 5); // 5 sec buffer
    
    await magicLinkButton.click();

    // Step 3: Wait for confirmation message
    await expect(page.locator('text=/check.*email|verifica.*email/i')).toBeVisible({
      timeout: 10000
    });

    console.log('📧 Magic link requested. Waiting for email...');

    // Step 4: Wait for magic link email (max 60 seconds)
    const emailResult = await waitForMagicLinkEmail({
      timeoutMs: 60000,
      pollIntervalMs: 2000,
      since: requestTimestamp,
      subject: /magic link|swaply/i
    });

    console.log(`✉️ Email received with link: ${emailResult.link}`);

    // Step 5: Open magic link in new context to simulate real user flow
    const newPage = await context.newPage();
    
    // Enable console logging to catch PKCE restoration
    newPage.on('console', msg => {
      const text = msg.text();
      if (text.includes('pkceRestored') || text.includes('Auth callback')) {
        console.log(`🔍 Browser console: ${text}`);
      }
    });

    await newPage.goto(emailResult.link);

    // Step 6: Wait for auth callback to complete
    // The page should redirect to either home or the 'next' parameter destination
    await newPage.waitForURL(/\/(home|obiecte|profil|$)/, { 
      timeout: 15000,
      waitUntil: 'networkidle'
    });

    console.log(`✅ Redirected to: ${newPage.url()}`);

    // Step 7: Verify user is authenticated
    // Check for authenticated UI elements (e.g., user menu, logout button)
    const authenticatedElements = [
      newPage.locator('text=/logout|deconectare/i'),
      newPage.locator('text=/profil|profile/i'),
      newPage.locator('[data-testid="user-menu"]')
    ];

    let foundAuthElement = false;
    for (const element of authenticatedElements) {
      try {
        await expect(element).toBeVisible({ timeout: 5000 });
        foundAuthElement = true;
        console.log('✅ Found authenticated UI element');
        break;
      } catch {
        // Try next element
      }
    }

    expect(foundAuthElement).toBeTruthy();

    // Step 8: Verify no PKCE errors in console
    const logs = await newPage.evaluate(() => {
      return (window as unknown as { __authLogs?: string[] }).__authLogs || [];
    });

    const pkceErrors = logs.filter(log => 
      log.includes('code challenge') || 
      log.includes('PKCE') && log.includes('error')
    );

    expect(pkceErrors).toHaveLength(0);

    // Step 9: Verify session persistence by reloading page
    await newPage.reload({ waitUntil: 'networkidle' });
    
    // Should still be authenticated after reload
    await expect(newPage).not.toHaveURL(/\/login/);
    
    console.log('✅ Session persisted after page reload');

    // Cleanup
    await newPage.close();
  });

  test('should handle expired magic link gracefully', async ({ page }) => {
    const expiredLink = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?token_hash=expired123&type=email`;
    
    await page.goto(expiredLink);
    
    // Should redirect to login with error
    await expect(page).toHaveURL(/\/login.*error/);
    
    const errorMessage = page.locator('text=/expired|invalid|error/i');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
    
    console.log('✅ Expired link handled correctly');
  });

  test('health check endpoint should report auth status', async ({ request }) => {
    const response = await request.get('/api/health/auth');
    
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    
    expect(data).toMatchObject({
      status: 'healthy',
      auth: {
        pkceConfigured: true,
        storageConfig: {
          storageKey: 'swaply.auth',
          storageType: 'localStorage'
        }
      }
    });
    
    console.log('✅ Health check passed:', JSON.stringify(data, null, 2));
  });
});
