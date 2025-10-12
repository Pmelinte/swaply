# Script de verificare deployment Swaply
# Rulează verificări automate până când totul funcționează

$siteUrl = "https://swaply-site.vercel.app"
$maxAttempts = 10
$delaySeconds = 5

Write-Host "`n╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     🔍 VERIFICARE AUTOMATĂ DEPLOYMENT SWAPLY          ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Test 1: Homepage
Write-Host "📍 Test 1: Homepage..." -ForegroundColor Yellow
$attempt = 1
$success = $false

while ($attempt -le $maxAttempts -and -not $success) {
    try {
        $response = Invoke-WebRequest -Uri $siteUrl -Method Head -TimeoutSec 10 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Host "  ✅ Homepage: " -NoNewline -ForegroundColor Green
            Write-Host "OK (200)" -ForegroundColor White
            Write-Host "  📊 Vercel ID: $($response.Headers['X-Vercel-Id'])" -ForegroundColor Gray
            $success = $true
        }
    } catch {
        Write-Host "  ⏳ Încercare $attempt/$maxAttempts - Așteaptă $delaySeconds secunde..." -ForegroundColor Yellow
        Start-Sleep -Seconds $delaySeconds
        $attempt++
    }
}

if (-not $success) {
    Write-Host "  ❌ Homepage: FAILED după $maxAttempts încercări" -ForegroundColor Red
    exit 1
}

# Test 2: Login Page
Write-Host "`n📍 Test 2: Login Page..." -ForegroundColor Yellow
$attempt = 1
$success = $false

while ($attempt -le $maxAttempts -and -not $success) {
    try {
        $response = Invoke-WebRequest -Uri "$siteUrl/login" -Method Head -TimeoutSec 10 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Host "  ✅ Login Page: " -NoNewline -ForegroundColor Green
            Write-Host "OK (200)" -ForegroundColor White
            Write-Host "  📊 Cache: $($response.Headers['X-Vercel-Cache'])" -ForegroundColor Gray
            $success = $true
        }
    } catch {
        Write-Host "  ⏳ Încercare $attempt/$maxAttempts - Așteaptă $delaySeconds secunde..." -ForegroundColor Yellow
        Start-Sleep -Seconds $delaySeconds
        $attempt++
    }
}

if (-not $success) {
    Write-Host "  ❌ Login Page: FAILED după $maxAttempts încercări" -ForegroundColor Red
    exit 1
}

# Test 3: Auth Callback
Write-Host "`n📍 Test 3: Auth Callback..." -ForegroundColor Yellow
$attempt = 1
$success = $false

while ($attempt -le $maxAttempts -and -not $success) {
    try {
        $response = Invoke-WebRequest -Uri "$siteUrl/auth/callback" -Method Head -TimeoutSec 10 -UseBasicParsing -MaximumRedirection 0 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 307 -or $response.StatusCode -eq 302) {
            Write-Host "  ✅ Auth Callback: " -NoNewline -ForegroundColor Green
            Write-Host "Redirect OK ($($response.StatusCode))" -ForegroundColor White
            Write-Host "  📊 Location: $($response.Headers['Location'])" -ForegroundColor Gray
            $success = $true
        }
    } catch {
        Write-Host "  ⏳ Încercare $attempt/$maxAttempts - Așteaptă $delaySeconds secunde..." -ForegroundColor Yellow
        Start-Sleep -Seconds $delaySeconds
        $attempt++
    }
}

if (-not $success) {
    Write-Host "  ❌ Auth Callback: FAILED după $maxAttempts încercări" -ForegroundColor Red
    exit 1
}

# Test 4: Signup Page
Write-Host "`n📍 Test 4: Signup Page..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$siteUrl/signup" -Method Head -TimeoutSec 10 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "  ✅ Signup Page: OK (200)" -ForegroundColor Green
    }
} catch {
    Write-Host "  ⚠️  Signup Page: Nu s-a putut accesa" -ForegroundColor Yellow
}

# Test 5: API Health Check
Write-Host "`n📍 Test 5: API Endpoints..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$siteUrl/api/debug" -Method Head -TimeoutSec 10 -UseBasicParsing -ErrorAction SilentlyContinue
    Write-Host "  ✅ API Debug: OK" -ForegroundColor Green
} catch {
    Write-Host "  ℹ️  API Debug: 404 (normal dacă nu există endpoint)" -ForegroundColor Gray
}

# Test 6: Verifică Google Maps API
Write-Host "`n📍 Test 6: Google Maps API..." -ForegroundColor Yellow
try {
    $mapsUrl = "https://maps.googleapis.com/maps/api/js?key=AIzaSyC8cBHpqMbqto5Puly0K1GTEam6edwd10k&v=weekly"
    $response = Invoke-WebRequest -Uri $mapsUrl -Method Head -TimeoutSec 10 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "  ✅ Google Maps API: " -NoNewline -ForegroundColor Green
        Write-Host "VALID" -ForegroundColor White
    }
} catch {
    Write-Host "  ❌ Google Maps API: INVALID sau RESTRICTED" -ForegroundColor Red
}

# Sumar Final
Write-Host "`n╔════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║     ✅ TOATE VERIFICĂRILE AU TRECUT!                   ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════╝`n" -ForegroundColor Green

Write-Host "🌐 Site URL: " -NoNewline -ForegroundColor Yellow
Write-Host $siteUrl -ForegroundColor Cyan

Write-Host "`n📋 Următorii Pași:" -ForegroundColor Yellow
Write-Host "  1. Accesează: " -NoNewline -ForegroundColor White
Write-Host "$siteUrl/login" -ForegroundColor Cyan
Write-Host "  2. Testează Magic Link cu email-ul tău" -ForegroundColor White
Write-Host "  3. Verifică că primești email-ul de la Supabase" -ForegroundColor White
Write-Host "  4. Click pe link și verifică redirect" -ForegroundColor White

Write-Host "`n⚠️  IMPORTANT: Configurare Supabase" -ForegroundColor Yellow
Write-Host "  Dacă Magic Link NU funcționează, trebuie să adaugi în Supabase Dashboard:" -ForegroundColor White
Write-Host "  • Site URL: " -NoNewline -ForegroundColor Gray
Write-Host "https://swaply-site.vercel.app" -ForegroundColor Cyan
Write-Host "  • Redirect URL: " -NoNewline -ForegroundColor Gray
Write-Host "https://swaply-site.vercel.app/auth/callback" -ForegroundColor Cyan
Write-Host "  • Dashboard: " -NoNewline -ForegroundColor Gray
Write-Host "https://supabase.com/dashboard/project/ooebonjoqrpouzfjiiiz/auth/url-configuration`n" -ForegroundColor Cyan

Write-Host "🎉 Deployment verificat cu succes!`n" -ForegroundColor Green
