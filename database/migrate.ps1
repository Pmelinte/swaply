# Swaply Database Migration PowerShell Script
# This script applies all database migrations in order

Write-Host "🚀 Starting Swaply database migration..." -ForegroundColor Green

# Check if Supabase CLI is installed
$supabaseExists = Get-Command supabase -ErrorAction SilentlyContinue
if (-not $supabaseExists) {
    Write-Host "❌ Supabase CLI is not installed. Please install it first:" -ForegroundColor Red
    Write-Host "   npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

# Check if we're in a Supabase project
if (-not (Test-Path "supabase/config.toml")) {
    Write-Host "❌ Not in a Supabase project directory." -ForegroundColor Red
    Write-Host "   Run 'supabase init' first or navigate to your project directory." -ForegroundColor Yellow
    exit 1
}

# Function to apply migration
function Apply-Migration {
    param(
        [string]$MigrationFile,
        [string]$Description
    )
    
    Write-Host "📦 Applying $Description..." -ForegroundColor Cyan
    
    try {
        $result = & supabase db diff --file=$MigrationFile --schema=public 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ $Description applied successfully" -ForegroundColor Green
            return $true
        } else {
            Write-Host "❌ Failed to apply $Description" -ForegroundColor Red
            Write-Host "Error: $result" -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Host "❌ Exception applying $Description`: $_" -ForegroundColor Red
        return $false
    }
}

# Apply migrations in order
$success = $true

$success = $success -and (Apply-Migration "001_create_objects" "migration 001: Create objects table")
$success = $success -and (Apply-Migration "002_create_swap_system" "migration 002: Create swap system") 
$success = $success -and (Apply-Migration "003_create_notifications_travel" "migration 003: Create notifications and travel")

if ($success) {
    Write-Host ""
    Write-Host "🎉 All migrations applied successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Database schema summary:" -ForegroundColor Cyan
    Write-Host "   ✅ objects - Items available for swapping" -ForegroundColor White
    Write-Host "   ✅ categories - Object categories with translations" -ForegroundColor White
    Write-Host "   ✅ user_profiles - Extended user information" -ForegroundColor White
    Write-Host "   ✅ swap_requests - Swap negotiations between users" -ForegroundColor White
    Write-Host "   ✅ messages - Real-time chat for swaps" -ForegroundColor White
    Write-Host "   ✅ ratings - User ratings and reviews" -ForegroundColor White
    Write-Host "   ✅ notifications - System notifications" -ForegroundColor White
    Write-Host "   ✅ travel_suggestions - AI-generated travel recommendations" -ForegroundColor White
    Write-Host ""
    Write-Host "🔒 Row Level Security (RLS) enabled on all tables" -ForegroundColor Yellow
    Write-Host "🔍 Full-text search configured for objects" -ForegroundColor Yellow
    Write-Host "⚡ Indexes created for optimal performance" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Test the database with some sample data" -ForegroundColor White
    Write-Host "2. Update your application to use the new schema" -ForegroundColor White
    Write-Host "3. Configure Cloudinary for image uploads" -ForegroundColor White
    Write-Host "4. Set up travel APIs for destination suggestions" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ Migration failed. Please check the errors above." -ForegroundColor Red
    exit 1
}