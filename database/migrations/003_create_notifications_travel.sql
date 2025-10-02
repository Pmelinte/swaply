-- Migration 003: Create notifications and travel system
-- Run this after 002_create_swap_system.sql

-- ================================
-- 1. NOTIFICATIONS TABLE
-- ================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Notification details
    type VARCHAR(30) NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    
    -- Related entities
    related_object_id UUID REFERENCES objects(id) ON DELETE SET NULL,
    related_swap_request_id UUID REFERENCES swap_requests(id) ON DELETE SET NULL,
    related_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Status
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Action URL for notification clicks
    action_url VARCHAR(500)
);

-- ================================
-- 2. TRAVEL_SUGGESTIONS TABLE
-- ================================
CREATE TABLE IF NOT EXISTS travel_suggestions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    swap_request_id UUID NOT NULL REFERENCES swap_requests(id) ON DELETE CASCADE,
    
    -- Destination details
    destination_city VARCHAR(120) NOT NULL,
    destination_country VARCHAR(60) NOT NULL,
    coordinates JSONB,
    
    -- Travel info
    distance_km INTEGER,
    travel_time_hours DECIMAL(4,2),
    transport_options JSONB,
    
    -- Accommodation suggestions
    hotels JSONB,
    airbnb JSONB,
    
    -- Activities and attractions
    attractions JSONB,
    activities JSONB,
    
    -- Cost estimates
    estimated_cost_min DECIMAL(10,2),
    estimated_cost_max DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'RON',
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days')
);

-- ================================
-- 3. INDEXES
-- ================================
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- ================================
-- 4. ENABLE RLS
-- ================================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT 
    USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE 
    USING (auth.uid() = user_id);

-- ================================
-- 5. SEARCH FUNCTIONALITY
-- ================================

-- Add search vector column to objects if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'objects' AND column_name = 'search_vector') THEN
        ALTER TABLE objects ADD COLUMN search_vector tsvector;
    END IF;
END $$;

-- Function to update search vector
CREATE OR REPLACE FUNCTION update_objects_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('romanian', 
        COALESCE(NEW.name, '') || ' ' || 
        COALESCE(NEW.description, '') || ' ' ||
        COALESCE(NEW.desired_items, '') || ' ' ||
        COALESCE(NEW.location, '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update search vector
DROP TRIGGER IF EXISTS objects_search_vector_update ON objects;
CREATE TRIGGER objects_search_vector_update
    BEFORE INSERT OR UPDATE ON objects
    FOR EACH ROW
    EXECUTE FUNCTION update_objects_search_vector();

-- Create search index
CREATE INDEX IF NOT EXISTS idx_objects_search ON objects USING gin(search_vector);

-- Update existing objects with search vector
UPDATE objects SET search_vector = to_tsvector('romanian', 
    COALESCE(name, '') || ' ' || 
    COALESCE(description, '') || ' ' ||
    COALESCE(desired_items, '') || ' ' ||
    COALESCE(location, '')
) WHERE search_vector IS NULL;