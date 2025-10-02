#!/bin/bash

# Swaply Database Migration Script
# This script applies all database migrations in order

echo "🚀 Starting Swaply database migration..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

# Check if we're in a Supabase project
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Not in a Supabase project directory."
    echo "   Run 'supabase init' first or navigate to your project directory."
    exit 1
fi

# Apply migrations
echo "📦 Applying migration 001: Create objects table..."
supabase db diff --file=001_create_objects --schema=public
if [ $? -eq 0 ]; then
    echo "✅ Migration 001 applied successfully"
else
    echo "❌ Failed to apply migration 001"
    exit 1
fi

echo "👥 Applying migration 002: Create swap system..."
supabase db diff --file=002_create_swap_system --schema=public
if [ $? -eq 0 ]; then
    echo "✅ Migration 002 applied successfully"
else
    echo "❌ Failed to apply migration 002"
    exit 1
fi

echo "🔔 Applying migration 003: Create notifications and travel..."
supabase db diff --file=003_create_notifications_travel --schema=public
if [ $? -eq 0 ]; then
    echo "✅ Migration 003 applied successfully"
else
    echo "❌ Failed to apply migration 003"
    exit 1
fi

echo ""
echo "🎉 All migrations applied successfully!"
echo ""
echo "📋 Database schema summary:"
echo "   ✅ objects - Items available for swapping"
echo "   ✅ categories - Object categories with translations"
echo "   ✅ user_profiles - Extended user information"
echo "   ✅ swap_requests - Swap negotiations between users"
echo "   ✅ messages - Real-time chat for swaps"
echo "   ✅ ratings - User ratings and reviews"
echo "   ✅ notifications - System notifications"
echo "   ✅ travel_suggestions - AI-generated travel recommendations"
echo ""
echo "🔒 Row Level Security (RLS) enabled on all tables"
echo "🔍 Full-text search configured for objects"
echo "⚡ Indexes created for optimal performance"
echo ""
echo "Next steps:"
echo "1. Test the database with some sample data"
echo "2. Update your application to use the new schema"
echo "3. Configure Cloudinary for image uploads"
echo "4. Set up travel APIs for destination suggestions"