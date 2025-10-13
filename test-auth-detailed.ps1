#!/usr/bin/env pwsh
# Detailed Auth Testing - Magic Link & Google OAuth

Write-Host "`n🔍 DETAILED AUTH TESTING`n" -ForegroundColor Cyan

# Test Magic Link Flow Simulation
Write-Host "📧 Test 1: Magic Link Simulation" -ForegroundColor Yellow
Write-Host "   Testing callback with token_hash parameter...`n" -ForegroundColor Gray

$magicLinkUrl = "https://swaply-site.vercel.app/auth/callback?token_hash=test_token&type=magiclink&next=/profil"

try {
    $response = Invoke-WebRequest -Uri $magicLinkUrl -Method GET -MaximumRedirection 0 -ErrorAction Stop
} catch {
    $response = $_.Exception.Response
}

Write-Host "   Status: $($response.StatusCode)" -ForegroundColor $(if ($response.StatusCode -eq 307) { "Green" } else { "Red" })
Write-Host "   Location: $($response.Headers['Location'])" -ForegroundColor Gray

$cookies = $response.Headers['Set-Cookie']
if ($cookies) {
    Write-Host "   ✅ Set-Cookie headers: $($cookies.Count)" -ForegroundColor Green
    foreach ($cookie in $cookies) {
        Write-Host "      - $($cookie.Split(';')[0])" -ForegroundColor Gray
    }
} else {
    Write-Host "   ❌ No Set-Cookie headers!" -ForegroundColor Red
}

Write-Host "`n"

# Test Google OAuth Flow Simulation
Write-Host "🔐 Test 2: Google OAuth Simulation" -ForegroundColor Yellow
Write-Host "   Testing callback with code parameter...`n" -ForegroundColor Gray

$oauthUrl = "https://swaply-site.vercel.app/auth/callback?code=test_oauth_code&next=/profil"

try {
    $response2 = Invoke-WebRequest -Uri $oauthUrl -Method GET -MaximumRedirection 0 -ErrorAction Stop
} catch {
    $response2 = $_.Exception.Response
}

Write-Host "   Status: $($response2.StatusCode)" -ForegroundColor $(if ($response2.StatusCode -eq 307) { "Green" } else { "Red" })
Write-Host "   Location: $($response2.Headers['Location'])" -ForegroundColor Gray

$cookies2 = $response2.Headers['Set-Cookie']
if ($cookies2) {
    Write-Host "   ✅ Set-Cookie headers: $($cookies2.Count)" -ForegroundColor Green
    foreach ($cookie in $cookies2) {
        Write-Host "      - $($cookie.Split(';')[0])" -ForegroundColor Gray
    }
} else {
    Write-Host "   ❌ No Set-Cookie headers!" -ForegroundColor Red
}

Write-Host "`n"

# Check Supabase Configuration
Write-Host "⚙️  Test 3: Supabase Configuration Check" -ForegroundColor Yellow
Write-Host "   Checking auth-config page...`n" -ForegroundColor Gray

$configResponse = Invoke-WebRequest -Uri "https://swaply-site.vercel.app/auth-config" -UseBasicParsing

if ($configResponse.StatusCode -eq 200) {
    Write-Host "   ✅ Auth config accessible" -ForegroundColor Green
    
    # Parse for configuration details
    $content = $configResponse.Content
    if ($content -match "Google OAuth.*configured") {
        Write-Host "   ✅ Google OAuth configured" -ForegroundColor Green
    }
    if ($content -match "Magic Link.*enabled") {
        Write-Host "   ✅ Magic Link enabled" -ForegroundColor Green
    }
} else {
    Write-Host "   ❌ Auth config not accessible" -ForegroundColor Red
}

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Gray

# Instructions
Write-Host "📋 NEXT: Manual Browser Testing Required" -ForegroundColor Cyan
Write-Host "`n1. Magic Link Test:" -ForegroundColor Yellow
Write-Host "   - Open: https://swaply-site.vercel.app/login" -ForegroundColor Gray
Write-Host "   - Click 'Link Magic'" -ForegroundColor Gray
Write-Host "   - Enter email and submit" -ForegroundColor Gray
Write-Host "   - Check email inbox" -ForegroundColor Gray
Write-Host "   - Click the magic link" -ForegroundColor Gray
Write-Host "   - OBSERVE: Where does it redirect? Any errors in URL?" -ForegroundColor Gray

Write-Host "`n2. Google OAuth Test:" -ForegroundColor Yellow
Write-Host "   - Open Incognito: https://swaply-site.vercel.app/login" -ForegroundColor Gray
Write-Host "   - Click 'Continuă cu Google'" -ForegroundColor Gray
Write-Host "   - Authorize with Google account" -ForegroundColor Gray
Write-Host "   - OBSERVE: Where does it redirect? Any errors?" -ForegroundColor Gray

Write-Host "`n3. Check Browser Console (F12):" -ForegroundColor Yellow
Write-Host "   - Look for errors in Console tab" -ForegroundColor Gray
Write-Host "   - Check Network tab for /auth/callback request" -ForegroundColor Gray
Write-Host "   - Look at Response Headers for Set-Cookie" -ForegroundColor Gray

Write-Host "`n4. Report Back:" -ForegroundColor Yellow
Write-Host "   - What URL do you see after clicking magic link/Google?" -ForegroundColor Gray
Write-Host "   - Any error message displayed on page?" -ForegroundColor Gray
Write-Host "   - Any console errors (red text)?" -ForegroundColor Gray
Write-Host "   - Screenshot if possible" -ForegroundColor Gray

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Gray
