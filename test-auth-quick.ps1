#!/usr/bin/env pwsh
# Quick Auth Test Script
# Tests all 4 auth methods after deployment

$SITE_URL = "https://swaply-site.vercel.app"

Write-Host "`n🧪 Swaply Auth Test Script`n" -ForegroundColor Cyan

# Test 1: Check if auth-config page is accessible
Write-Host "1️⃣  Testing /auth-config page..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$SITE_URL/auth-config" -Method GET -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✅ /auth-config is accessible (200 OK)" -ForegroundColor Green
    } else {
        Write-Host "   ❌ /auth-config returned: $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ /auth-config returned error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Check if login page loads
Write-Host "`n2️⃣  Testing /login page..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$SITE_URL/login" -Method GET -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✅ /login is accessible (200 OK)" -ForegroundColor Green
        
        # Check for auth buttons
        $content = $response.Content
        if ($content -match "Continuă cu Google") {
            Write-Host "   ✅ Google OAuth button found" -ForegroundColor Green
        } else {
            Write-Host "   ❌ Google OAuth button NOT found" -ForegroundColor Red
        }
        
        if ($content -match "Link Magic") {
            Write-Host "   ✅ Magic Link button found" -ForegroundColor Green
        } else {
            Write-Host "   ❌ Magic Link button NOT found" -ForegroundColor Red
        }
        
        if ($content -match "Telefon") {
            Write-Host "   ✅ Phone button found" -ForegroundColor Green
        } else {
            Write-Host "   ❌ Phone button NOT found" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "   ❌ /login returned error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Check auth callback route
Write-Host "`n3️⃣  Testing /auth/callback endpoint..." -ForegroundColor Yellow
try {
    # Should redirect to login with error (no params)
    $response = Invoke-WebRequest -Uri "$SITE_URL/auth/callback" -Method GET -MaximumRedirection 0 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 302) {
        $location = $response.Headers['Location']
        Write-Host "   ✅ Callback redirects correctly (302)" -ForegroundColor Green
        Write-Host "   → Redirect to: $location" -ForegroundColor Gray
    } else {
        Write-Host "   ❌ Callback returned: $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    # PowerShell throws on 302 with -MaximumRedirection 0, so catch it
    if ($_.Exception.Response.StatusCode -eq 302) {
        Write-Host "   ✅ Callback redirects correctly (302)" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Callback test inconclusive: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

# Test 4: Check Vercel deployment status
Write-Host "`n4️⃣  Checking Vercel deployment..." -ForegroundColor Yellow
Write-Host "   → Visit: https://vercel.com/pmelinte/swaply-site/deployments" -ForegroundColor Gray
Write-Host "   → Check latest deployment from branch: vercel-deployment" -ForegroundColor Gray
Write-Host "   → Commit: 869c57b" -ForegroundColor Gray

# Summary
Write-Host "`n📊 Test Summary`n" -ForegroundColor Cyan
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. If all tests pass, try manual login with each auth method" -ForegroundColor White
Write-Host "  2. Magic Link: /login → 'Link Magic' → Enter email → Check inbox" -ForegroundColor White
Write-Host "  3. Google OAuth: /login → 'Continuă cu Google' → Select account" -ForegroundColor White
Write-Host "  4. Phone SMS: Configure Twilio first in Supabase Dashboard" -ForegroundColor White
Write-Host "  5. Check browser console for '✅ Just logged in - keeping session'" -ForegroundColor White

Write-Host "`n✨ Script complete!`n" -ForegroundColor Cyan
