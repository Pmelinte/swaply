#!/usr/bin/env pwsh
# Monitor Vercel Deployment - auth-pkce-fix branch

Write-Host "`n🔍 MONITORING VERCEL DEPLOYMENT`n" -ForegroundColor Cyan
Write-Host "Branch: auth-pkce-fix" -ForegroundColor Yellow
Write-Host "Commit: f790b6e" -ForegroundColor Yellow
Write-Host "Pushed: $(Get-Date -Format 'HH:mm:ss')`n" -ForegroundColor Gray

Write-Host "⏰ Waiting 180 seconds for Vercel build...`n" -ForegroundColor Yellow
Start-Sleep -Seconds 180

Write-Host "✅ Starting tests...`n" -ForegroundColor Green

# Test 1: Production Health (should still be old)
Write-Host "📊 Test 1: Production Health (main branch)" -ForegroundColor Cyan
$prodHealth = try {
    $result = Invoke-WebRequest -Uri "https://swaply-site.vercel.app/api/auth/health" -UseBasicParsing -TimeoutSec 10
    $result
} catch {
    $_.Exception.Response
}

if ($prodHealth.StatusCode -eq 200) {
    Write-Host "   ✅ Production health: 200 OK" -ForegroundColor Green
    $json = $prodHealth.Content | ConvertFrom-Json
    Write-Host "   Supabase: $($json.auth.supabaseConnected)" -ForegroundColor Gray
} else {
    Write-Host "   ❌ Production health: $($prodHealth.StatusCode)" -ForegroundColor Red
}

Write-Host "`n"

# Test 2: Check for preview deployment
Write-Host "📦 Test 2: Preview Deployment Check" -ForegroundColor Cyan
Write-Host "   Visit Vercel dashboard to get preview URL:" -ForegroundColor Gray
Write-Host "   https://vercel.com/pmelinte/swaply-site/deployments`n" -ForegroundColor Blue

Write-Host "   Look for deployment from 'auth-pkce-fix' branch" -ForegroundColor Gray
Write-Host "   Copy the preview URL (starts with swaply-site-git-...)`n" -ForegroundColor Gray

# Instructions
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Gray
Write-Host "📋 NEXT STEPS - Manual Testing Required`n" -ForegroundColor Cyan

Write-Host "1. Get Preview URL:" -ForegroundColor Yellow
Write-Host "   - Open: https://vercel.com/pmelinte/swaply-site/deployments" -ForegroundColor Gray
Write-Host "   - Find deployment from 'auth-pkce-fix' branch" -ForegroundColor Gray
Write-Host "   - Click 'Visit' to get preview URL" -ForegroundColor Gray
Write-Host "   - URL format: https://swaply-site-git-auth-pkce-fix-{user}.vercel.app`n" -ForegroundColor Gray

Write-Host "2. Test Magic Link on Preview:" -ForegroundColor Yellow
Write-Host "   - Open preview URL + /login" -ForegroundColor Gray
Write-Host "   - Click 'Link Magic'" -ForegroundColor Gray
Write-Host "   - Enter email" -ForegroundColor Gray
Write-Host "   - Check inbox" -ForegroundColor Gray
Write-Host "   - Click magic link" -ForegroundColor Gray
Write-Host "   - OBSERVE:" -ForegroundColor Gray
Write-Host "     • Should redirect to /profil ✅" -ForegroundColor Gray
Write-Host "     • Console should show: '🍪 Set cookies: X' (X >= 2)" -ForegroundColor Gray
Write-Host "     • Console: '✅ Just logged in - keeping session'`n" -ForegroundColor Gray

Write-Host "3. Test Google OAuth on Preview:" -ForegroundColor Yellow
Write-Host "   - Open incognito: preview URL + /login" -ForegroundColor Gray
Write-Host "   - Click 'Continuă cu Google'" -ForegroundColor Gray
Write-Host "   - Authorize with Google account" -ForegroundColor Gray
Write-Host "   - OBSERVE:" -ForegroundColor Gray
Write-Host "     • Should redirect to /profil ✅" -ForegroundColor Gray
Write-Host "     • Console: '🍪 Set cookies: X'" -ForegroundColor Gray
Write-Host "     • NO error in URL`n" -ForegroundColor Gray

Write-Host "4. Check Network Tab (F12):" -ForegroundColor Yellow
Write-Host "   - Open DevTools" -ForegroundColor Gray
Write-Host "   - Network tab" -ForegroundColor Gray
Write-Host "   - Find /auth/callback request" -ForegroundColor Gray
Write-Host "   - Response Headers should show:" -ForegroundColor Gray
Write-Host "     • Set-Cookie: sb-xxx-auth-token=..." -ForegroundColor Gray
Write-Host "     • Set-Cookie: sb-xxx-auth-token-code-verifier=... ← CRITICAL!" -ForegroundColor Gray

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Gray

Write-Host "✅ IF PREVIEW WORKS:" -ForegroundColor Green
Write-Host "   → Merge auth-pkce-fix to main" -ForegroundColor Gray
Write-Host "   → Or change Vercel production branch to auth-pkce-fix`n" -ForegroundColor Gray

Write-Host "❌ IF PREVIEW STILL BROKEN:" -ForegroundColor Red
Write-Host "   → Report back with:" -ForegroundColor Gray
Write-Host "     • Console output (especially cookie count)" -ForegroundColor Gray
Write-Host "     • Network headers screenshot" -ForegroundColor Gray
Write-Host "     • Error message in URL`n" -ForegroundColor Gray

Write-Host "🔗 Quick Links:" -ForegroundColor Cyan
Write-Host "   • Vercel: https://vercel.com/pmelinte/swaply-site/deployments" -ForegroundColor Blue
Write-Host "   • GitHub: https://github.com/Pmelinte/swaply/tree/auth-pkce-fix" -ForegroundColor Blue

Write-Host "`n✅ Monitoring complete! $(Get-Date -Format 'HH:mm:ss')`n" -ForegroundColor Green
