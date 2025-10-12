#!/usr/bin/env pwsh
# Swaply - Verificare Automată Completă
# Data: 2025-10-12

Write-Host "`n╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     SWAPLY - VERIFICARE AUTOMATĂ COMPLETĂ             ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

$ErrorCount = 0
$SuccessCount = 0

# Test 1: Git Sync
Write-Host "[1/10] Verificare sincronizare Git..." -ForegroundColor Yellow
$localHash = git rev-parse HEAD
$remoteHash = git ls-remote origin vercel-fresh-deploy | Select-String "refs/heads/vercel-fresh-deploy" | ForEach-Object { $_.ToString().Split()[0] }

if ($localHash -eq $remoteHash) {
    Write-Host "  ✅ Local și remote sincronizate: $($localHash.Substring(0,7))" -ForegroundColor Green
    $SuccessCount++
} else {
    Write-Host "  ❌ Diferență între local și remote!" -ForegroundColor Red
    Write-Host "     Local:  $localHash" -ForegroundColor Red
    Write-Host "     Remote: $remoteHash" -ForegroundColor Red
    $ErrorCount++
}

# Test 2: Login Page - Magic Link Tab
Write-Host "`n[2/10] Verificare Login Page - Magic Link Tab..." -ForegroundColor Yellow
$loginContent = Get-Content "src/app/(auth)/login/page.tsx" -Raw
if ($loginContent -match "✨ Link Magic" -and $loginContent -match "authMethod === 'magic'") {
    Write-Host "  ✅ Magic Link tab prezent în cod" -ForegroundColor Green
    $SuccessCount++
} else {
    Write-Host "  ❌ Magic Link tab LIPSEȘTE!" -ForegroundColor Red
    $ErrorCount++
}

# Test 3: Suspense Wrapper
Write-Host "`n[3/10] Verificare Suspense Wrapper..." -ForegroundColor Yellow
if ($loginContent -match "Suspense" -and $loginContent -match "export default function LoginPage") {
    Write-Host "  ✅ Suspense wrapper implementat corect" -ForegroundColor Green
    $SuccessCount++
} else {
    Write-Host "  ❌ Suspense wrapper LIPSEȘTE!" -ForegroundColor Red
    $ErrorCount++
}

# Test 4: Google Maps Component
Write-Host "`n[4/10] Verificare Google Maps Component..." -ForegroundColor Yellow
if (Test-Path "src/components/GoogleMapWithUsers.tsx") {
    $mapContent = Get-Content "src/components/GoogleMapWithUsers.tsx" -Raw
    if ($mapContent -match "useJsApiLoader" -and $mapContent -match "GoogleMap") {
        Write-Host "  ✅ Google Maps component valid" -ForegroundColor Green
        $SuccessCount++
    } else {
        Write-Host "  ❌ Google Maps component incomplet!" -ForegroundColor Red
        $ErrorCount++
    }
} else {
    Write-Host "  ❌ Google Maps component LIPSEȘTE!" -ForegroundColor Red
    $ErrorCount++
}

# Test 5: Homepage Integration
Write-Host "`n[5/10] Verificare Homepage Google Maps Integration..." -ForegroundColor Yellow
$homeContent = Get-Content "src/app/page.tsx" -Raw
if ($homeContent -match "GoogleMapWithUsers" -and $homeContent -match "activeUsers") {
    Write-Host "  ✅ Google Maps integrat în homepage" -ForegroundColor Green
    $SuccessCount++
} else {
    Write-Host "  ❌ Google Maps nu este integrat în homepage!" -ForegroundColor Red
    $ErrorCount++
}

# Test 6: Auth Callback
Write-Host "`n[6/10] Verificare Auth Callback Error Handling..." -ForegroundColor Yellow
$callbackContent = Get-Content "src/app/auth/callback/route.ts" -Raw
if ($callbackContent -match "exchangeCodeForSession" -and $callbackContent -match "try.*catch") {
    Write-Host "  ✅ Auth callback cu error handling complet" -ForegroundColor Green
    $SuccessCount++
} else {
    Write-Host "  ❌ Auth callback fără error handling adecvat!" -ForegroundColor Red
    $ErrorCount++
}

# Test 7: Middleware
Write-Host "`n[7/10] Verificare Middleware Session Refresh..." -ForegroundColor Yellow
$middlewareContent = Get-Content "middleware.ts" -Raw
if ($middlewareContent -match "getSession" -and $middlewareContent -match "createMiddlewareClient") {
    Write-Host "  ✅ Middleware cu session refresh implementat" -ForegroundColor Green
    $SuccessCount++
} else {
    Write-Host "  ❌ Middleware fără session refresh!" -ForegroundColor Red
    $ErrorCount++
}

# Test 8: Environment Variables
Write-Host "`n[8/10] Verificare Environment Variables..." -ForegroundColor Yellow
if (Test-Path ".env.local") {
    $envContent = Get-Content ".env.local" -Raw
    $requiredVars = @(
        "NEXT_PUBLIC_SUPABASE_URL",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY",
        "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME",
        "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"
    )
    $missingVars = @()
    foreach ($var in $requiredVars) {
        if ($envContent -notmatch $var) {
            $missingVars += $var
        }
    }
    if ($missingVars.Count -eq 0) {
        Write-Host "  ✅ Toate variabilele de mediu sunt setate" -ForegroundColor Green
        $SuccessCount++
    } else {
        Write-Host "  ❌ Variabile lipsă: $($missingVars -join ', ')" -ForegroundColor Red
        $ErrorCount++
    }
} else {
    Write-Host "  ❌ Fișierul .env.local LIPSEȘTE!" -ForegroundColor Red
    $ErrorCount++
}

# Test 9: Build Local
Write-Host "`n[9/10] Testare Build Local..." -ForegroundColor Yellow
Write-Host "  ⏳ Rulare npm run build..." -ForegroundColor Gray
$buildOutput = npm run build 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ Build local reușit!" -ForegroundColor Green
    $SuccessCount++
} else {
    Write-Host "  ❌ Build local EȘUAT!" -ForegroundColor Red
    Write-Host "  Ultimele 10 linii din output:" -ForegroundColor Yellow
    $buildOutput | Select-Object -Last 10 | ForEach-Object { Write-Host "    $_" -ForegroundColor Gray }
    $ErrorCount++
}

# Test 10: Package.json
Write-Host "`n[10/10] Verificare package.json..." -ForegroundColor Yellow
if (Test-Path "package.json") {
    $packageContent = Get-Content "package.json" -Raw | ConvertFrom-Json
    if ($packageContent.dependencies.'@react-google-maps/api' -and 
        $packageContent.dependencies.'@supabase/auth-helpers-nextjs' -and
        $packageContent.dependencies.'next') {
        Write-Host "  ✅ Toate dependențele critice sunt prezente" -ForegroundColor Green
        $SuccessCount++
    } else {
        Write-Host "  ❌ Lipsesc dependențe critice!" -ForegroundColor Red
        $ErrorCount++
    }
} else {
    Write-Host "  ❌ package.json LIPSEȘTE!" -ForegroundColor Red
    $ErrorCount++
}

# Raport Final
Write-Host "`n╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                  RAPORT FINAL                          ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "Teste Reușite: " -NoNewline
Write-Host "$SuccessCount/10" -ForegroundColor Green

Write-Host "Teste Eșuate:  " -NoNewline
if ($ErrorCount -gt 0) {
    Write-Host "$ErrorCount/10" -ForegroundColor Red
} else {
    Write-Host "$ErrorCount/10" -ForegroundColor Green
}

$percentage = [math]::Round(($SuccessCount / 10) * 100, 2)
Write-Host "`nRată Succes: " -NoNewline
if ($percentage -eq 100) {
    Write-Host "$percentage%" -ForegroundColor Green
} elseif ($percentage -ge 80) {
    Write-Host "$percentage%" -ForegroundColor Yellow
} else {
    Write-Host "$percentage%" -ForegroundColor Red
}

# Commit Info
Write-Host "`n╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║              INFORMAȚII DEPLOYMENT                     ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

$currentCommit = git log -1 --oneline
$currentBranch = git branch --show-current

Write-Host "Branch:  " -NoNewline -ForegroundColor Yellow
Write-Host $currentBranch -ForegroundColor White

Write-Host "Commit:  " -NoNewline -ForegroundColor Yellow
Write-Host $currentCommit -ForegroundColor White

Write-Host "`nVercel Dashboard: " -NoNewline -ForegroundColor Yellow
Write-Host "https://vercel.com/pmellintes-projects/swaply" -ForegroundColor Cyan

Write-Host "`n╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║           PAȘI URMĂTORI (OBLIGATORIU!)                ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "1. Deschide Vercel Dashboard:" -ForegroundColor Yellow
Write-Host "   https://vercel.com/pmellintes-projects/swaply`n" -ForegroundColor Cyan

Write-Host "2. Verifică că deployment-ul folosește commit-ul:" -ForegroundColor Yellow
Write-Host "   $($localHash.Substring(0,7))`n" -ForegroundColor White

Write-Host "3. Verifică Environment Variables în Settings > Environment Variables:" -ForegroundColor Yellow
Write-Host "   ✓ NEXT_PUBLIC_SUPABASE_URL" -ForegroundColor Gray
Write-Host "   ✓ NEXT_PUBLIC_SUPABASE_ANON_KEY" -ForegroundColor Gray
Write-Host "   ✓ NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME" -ForegroundColor Gray
Write-Host "   ✓ NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET" -ForegroundColor Gray
Write-Host "   ✓ NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`n" -ForegroundColor Gray

Write-Host "4. Dacă build-ul eșuează, verifică Build Logs pentru:" -ForegroundColor Yellow
Write-Host "   - TypeScript errors" -ForegroundColor Gray
Write-Host "   - Missing dependencies" -ForegroundColor Gray
Write-Host "   - Environment variable errors`n" -ForegroundColor Gray

Write-Host "5. După deployment SUCCESS, testează:" -ForegroundColor Yellow
Write-Host "   - https://swaply-five.vercel.app/login" -ForegroundColor Cyan
Write-Host "   - Tab 'Link Magic' trebuie să fie vizibil" -ForegroundColor Gray
Write-Host "   - Toggle între 'Parolă' și 'Link Magic' trebuie să funcționeze" -ForegroundColor Gray
Write-Host "   - Google Maps pe homepage trebuie să se încarce`n" -ForegroundColor Gray

if ($percentage -eq 100) {
    Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║    ✅ TOATE VERIFICĂRILE AU TRECUT CU SUCCES! ✅       ║" -ForegroundColor Green
    Write-Host "║                                                        ║" -ForegroundColor Green
    Write-Host "║  Codul local este 100% pregătit pentru deployment!    ║" -ForegroundColor Green
    Write-Host "║  Verifică acum Vercel Dashboard pentru status build.  ║" -ForegroundColor Green
    Write-Host "╚════════════════════════════════════════════════════════╝`n" -ForegroundColor Green
    exit 0
} else {
    Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Red
    Write-Host "║    ⚠️  ATENȚIE: UNELE VERIFICĂRI AU EȘUAT! ⚠️         ║" -ForegroundColor Red
    Write-Host "║                                                        ║" -ForegroundColor Red
    Write-Host "║  Revizuiește erorile de mai sus înainte de deploy.   ║" -ForegroundColor Red
    Write-Host "╚════════════════════════════════════════════════════════╝`n" -ForegroundColor Red
    exit 1
}
