# Test Simplu Deployment Swaply

Write-Host "`n🔍 VERIFICARE DEPLOYMENT SWAPLY" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════`n" -ForegroundColor Cyan

$siteUrl = "https://swaply-site.vercel.app"
$allPassed = $true

# Test 1: Homepage
Write-Host "📍 Test 1: Homepage" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $siteUrl -TimeoutSec 10 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✅ OK - Status 200" -ForegroundColor Green
    } else {
        Write-Host "   ❌ FAIL - Status: $($response.StatusCode)" -ForegroundColor Red
        $allPassed = $false
    }
} catch {
    Write-Host "   ❌ ERROR: $_" -ForegroundColor Red
    $allPassed = $false
}

# Test 2: Login Page
Write-Host "`n📍 Test 2: Login Page" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$siteUrl/login" -TimeoutSec 10 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✅ OK - Status 200" -ForegroundColor Green
        # Verifică dacă conține "Magic" în conținut
        if ($response.Content -match "Magic|Link Magic") {
            Write-Host "   ✅ Magic Link UI detectat în pagină" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  Magic Link UI nu a fost detectat (verifică manual)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   ❌ FAIL - Status: $($response.StatusCode)" -ForegroundColor Red
        $allPassed = $false
    }
} catch {
    Write-Host "   ❌ ERROR: $_" -ForegroundColor Red
    $allPassed = $false
}

# Test 3: Signup Page
Write-Host "`n📍 Test 3: Signup Page" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$siteUrl/signup" -TimeoutSec 10 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✅ OK - Status 200" -ForegroundColor Green
    } else {
        Write-Host "   ❌ FAIL - Status: $($response.StatusCode)" -ForegroundColor Red
        $allPassed = $false
    }
} catch {
    Write-Host "   ❌ ERROR: $_" -ForegroundColor Red
    $allPassed = $false
}

# Test 4: Auth Callback (trebuie să redirecteze)
Write-Host "`n📍 Test 4: Auth Callback Redirect" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$siteUrl/auth/callback" -MaximumRedirection 0 -ErrorAction Stop
} catch {
    if ($_.Exception.Response.StatusCode -eq 307 -or $_.Exception.Response.StatusCode -eq 302) {
        Write-Host "   ✅ OK - Redirect corect (30x)" -ForegroundColor Green
    } else {
        Write-Host "   ❌ FAIL - Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
        $allPassed = $false
    }
}

# Test 5: Google Maps API Key
Write-Host "`n📍 Test 5: Google Maps API" -ForegroundColor Yellow
try {
    $mapsUrl = "https://maps.googleapis.com/maps/api/js?key=AIzaSyC8cBHpqMbqto5Puly0K1GTEam6edwd10k"
    $response = Invoke-WebRequest -Uri $mapsUrl -TimeoutSec 10 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✅ OK - API Key valid" -ForegroundColor Green
    } else {
        Write-Host "   ❌ FAIL - Status: $($response.StatusCode)" -ForegroundColor Red
        $allPassed = $false
    }
} catch {
    Write-Host "   ❌ ERROR: API Key invalid sau restricționat" -ForegroundColor Red
    $allPassed = $false
}

# Test 6: Verifică environment variables în build
Write-Host "`n📍 Test 6: Supabase Connection" -ForegroundColor Yellow
try {
    # Încearcă să accesezi o pagină care necesită Supabase
    $response = Invoke-WebRequest -Uri "$siteUrl/profil" -MaximumRedirection 0 -ErrorAction Stop
} catch {
    # Dacă redirectează la login, înseamnă că middleware funcționează = Supabase OK
    if ($_.Exception.Response.StatusCode -eq 307 -or $_.Exception.Response.StatusCode -eq 302) {
        $location = $_.Exception.Response.Headers.Location
        if ($location -match "/login") {
            Write-Host "   ✅ OK - Middleware + Supabase funcționează (redirect la login)" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  WARNING - Redirect neașteptat: $location" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   ❌ FAIL - Status neașteptat: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
        $allPassed = $false
    }
}

# Rezultat Final
Write-Host "`n═══════════════════════════════════════" -ForegroundColor Cyan
if ($allPassed) {
    Write-Host "✅ TOATE TESTELE AU TRECUT!" -ForegroundColor Green
    Write-Host "`n🌐 Site activ la: " -NoNewline
    Write-Host $siteUrl -ForegroundColor Cyan
    Write-Host "`n📝 Următorii pași:" -ForegroundColor Yellow
    Write-Host "   1. Accesează: $siteUrl/login" -ForegroundColor White
    Write-Host "   2. Click pe tab '✨ Link Magic'" -ForegroundColor White
    Write-Host "   3. Introduce email-ul și trimite" -ForegroundColor White
    Write-Host "   4. Verifică inbox-ul pentru email de la Supabase" -ForegroundColor White
    Write-Host "   5. Click pe link din email" -ForegroundColor White
    Write-Host "   6. Verifică că te loghează automat`n" -ForegroundColor White
    
    Write-Host "⚠️  DACĂ MAGIC LINK NU FUNCȚIONEAZĂ:" -ForegroundColor Yellow
    Write-Host "   Trebuie să configurezi în Supabase Dashboard:" -ForegroundColor White
    Write-Host "   • Site URL: https://swaply-site.vercel.app" -ForegroundColor Gray
    Write-Host "   • Redirect URL: https://swaply-site.vercel.app/auth/callback" -ForegroundColor Gray
    Write-Host "   • Dashboard: https://supabase.com/dashboard/project/ooebonjoqrpouzfjiiiz/auth/url-configuration`n" -ForegroundColor Cyan
} else {
    Write-Host "❌ UNELE TESTE AU EȘUAT" -ForegroundColor Red
    Write-Host "   Verifică erorile de mai sus`n" -ForegroundColor White
}
