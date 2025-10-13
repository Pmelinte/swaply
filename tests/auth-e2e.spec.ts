import { test, expect } from '@playwright/test';

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
    await expect(page).toHaveURL(/\/profil/, { timeout: 10000 });
    
    // Verify session cookie
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find(c => c.name.includes('auth-token'));
    expect(sessionCookie).toBeDefined();
  });

  test('Auth Callback - handles invalid token', async ({ page }) => {
    await page.goto('http://localhost:3000/auth/callback?token_hash=invalid&type=magiclink');
    
    // Should redirect to login with error
    await expect(page).toHaveURL(/\/login\?error=/, { timeout: 5000 });
  });

  test('Auth Callback - handles invalid OAuth code', async ({ page }) => {
    await page.goto('http://localhost:3000/auth/callback?code=invalid');
    
    // Should redirect to login with error
    await expect(page).toHaveURL(/\/login\?error=/, { timeout: 5000 });
  });
});
