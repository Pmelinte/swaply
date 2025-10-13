#!/usr/bin/env pwsh
# Test Production Auth - After Main Branch Deploy
# Run this after 2 minutes from push

Write-Host "`n🔍 TESTING PRODUCTION AUTH - After Main Deploy`n" -ForegroundColor Cyan
Write-Host "Timestamp: $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Gray
Write-Host "Waiting 120 seconds for Vercel deployment...`n" -ForegroundColor Yellow

# Wait for Vercel
Start-Sleep -Seconds 120

Write-Host "`n✅ Testing starting now!`n" -ForegroundColor Green

# Test 1: Health Endpoint
Write-Host "📊 Test 1: Health Endpoint" -ForegroundColor Cyan
Write-Host "   URL: https://swaply-site.vercel.app/api/auth/health`n" -ForegroundColor Gray

$healthResponse = try {
    $result = Invoke-WebRequest -Uri "https://swaply-site.vercel.app/api/auth/health" -Method GET -UseBasicParsing -TimeoutSec 10
    $result
} catch {
    $_.Exception.Response
}

if ($healthResponse.StatusCode -eq 200) {
    Write-Host "   ✅ Health endpoint: 200 OK" -ForegroundColor Green
    Write-Host "   📄 Response:`n" -ForegroundColor Gray
    $healthResponse.Content | ConvertFrom-Json | ConvertTo-Json -Depth 5
    Write-Host "`n"
} else {
    Write-Host "   ❌ Health endpoint: $($healthResponse.StatusCode) - OLD CODE STILL LIVE!" -ForegroundColor Red
    Write-Host "   Expected: 200 JSON" -ForegroundColor Yellow
    Write-Host "   Actual: 404 (or other)" -ForegroundColor Red
    Write-Host "`n   🔧 Action: Wait longer or check Vercel dashboard`n" -ForegroundColor Yellow
}

# Test 2: Callback Headers
Write-Host "📨 Test 2: Callback Set-Cookie Headers" -ForegroundColor Cyan
Write-Host "   URL: https://swaply-site.vercel.app/auth/callback`n" -ForegroundColor Gray

$callbackResponse = try {
    Invoke-WebRequest -Uri "https://swaply-site.vercel.app/auth/callback" -Method GET -UseBasicParsing -MaximumRedirection 0 -ErrorAction Stop
} catch {
    $_.Exception.Response
}

$setCookieHeaders = $callbackResponse.Headers['Set-Cookie']

if ($setCookieHeaders -and $setCookieHeaders.Count -gt 0) {
    Write-Host "   ✅ Set-Cookie headers found: $($setCookieHeaders.Count)" -ForegroundColor Green
    Write-Host "   📄 Headers:`n" -ForegroundColor Gray
    foreach ($cookie in $setCookieHeaders) {
        Write-Host "      - $cookie" -ForegroundColor Gray
    }
    Write-Host "`n"
} else {
    Write-Host "   ❌ No Set-Cookie headers - OLD CODE STILL LIVE!" -ForegroundColor Red
    Write-Host "   Expected: 2+ Set-Cookie headers with session tokens" -ForegroundColor Yellow
    Write-Host "   Actual: None" -ForegroundColor Red
    Write-Host "`n   🔧 Action: Wait longer or check Vercel dashboard`n" -ForegroundColor Yellow
}

# Test 3: Auth Config Page
Write-Host "⚙️  Test 3: Auth Config Dashboard" -ForegroundColor Cyan
Write-Host "   URL: https://swaply-site.vercel.app/auth-config`n" -ForegroundColor Gray

$configResponse = try {
    $result = Invoke-WebRequest -Uri "https://swaply-site.vercel.app/auth-config" -Method GET -UseBasicParsing -TimeoutSec 10
    $result
} catch {
    $_.Exception.Response
}

if ($configResponse.StatusCode -eq 200) {
    Write-Host "   ✅ Auth config page: 200 OK" -ForegroundColor Green
} else {
    Write-Host "   ❌ Auth config page: $($configResponse.StatusCode) - Not deployed yet" -ForegroundColor Red
}

Write-Host "`n"

# Summary
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "📊 DEPLOYMENT VERIFICATION SUMMARY" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Gray

$healthOk = $healthResponse.StatusCode -eq 200
$cookiesOk = $setCookieHeaders -and $setCookieHeaders.Count -gt 0
$configOk = $configResponse.StatusCode -eq 200

if ($healthOk -and $cookiesOk -and $configOk) {
    Write-Host "✅ ALL TESTS PASSED - NEW CODE IS LIVE!" -ForegroundColor Green
    Write-Host "`n🎉 Magic Link and Google OAuth should now work!`n" -ForegroundColor Green
    Write-Host "📋 Next Steps:" -ForegroundColor Cyan
    Write-Host "   1. Open: https://swaply-site.vercel.app/login" -ForegroundColor Gray
    Write-Host "   2. Test Magic Link: Click 'Link Magic' → Check email → Click link" -ForegroundColor Gray
    Write-Host "   3. Test Google OAuth: Click 'Continuă cu Google' → Authorize" -ForegroundColor Gray
    Write-Host "   4. Both should redirect to /profil with session ✅`n" -ForegroundColor Gray
} elseif ($healthOk -or $cookiesOk) {
    Write-Host "⚠️  PARTIAL SUCCESS - Some tests passed" -ForegroundColor Yellow
    Write-Host "`nPossible reasons:" -ForegroundColor Yellow
    Write-Host "   - Vercel still deploying (CDN cache not updated)" -ForegroundColor Gray
    Write-Host "   - Regional CDN delay (try different location)" -ForegroundColor Gray
    Write-Host "   - Browser cache (clear cookies + cache)`n" -ForegroundColor Gray
    Write-Host "🔧 Action: Wait 1-2 more minutes and re-run this script`n" -ForegroundColor Yellow
} else {
    Write-Host "❌ ALL TESTS FAILED - OLD CODE STILL LIVE!" -ForegroundColor Red
    Write-Host "`nPossible reasons:" -ForegroundColor Red
    Write-Host "   1. Vercel deployment not started/failed" -ForegroundColor Gray
    Write-Host "   2. Wrong branch configured in Vercel" -ForegroundColor Gray
    Write-Host "   3. Build errors blocking deployment`n" -ForegroundColor Gray
    Write-Host "🔧 Actions:" -ForegroundColor Yellow
    Write-Host "   1. Check Vercel dashboard: https://vercel.com/pmelinte/swaply-site/deployments" -ForegroundColor Gray
    Write-Host "   2. Verify latest deployment shows commit 1f67f07" -ForegroundColor Gray
    Write-Host "   3. Check build logs for errors" -ForegroundColor Gray
    Write-Host "   4. Manually trigger deploy if needed`n" -ForegroundColor Gray
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Gray

# Git status
Write-Host "📝 Git Status:" -ForegroundColor Cyan
git log --oneline -3
Write-Host "`n"

# Vercel deployment check
Write-Host "🔗 Vercel Dashboard:" -ForegroundColor Cyan
Write-Host "   https://vercel.com/pmelinte/swaply-site/deployments`n" -ForegroundColor Blue

Write-Host "✅ Test complete! $(Get-Date -Format 'HH:mm:ss')`n" -ForegroundColor Green
