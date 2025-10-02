-- Migration 002: Create user profiles and swap system
-- Run this after 001_create_objects.sql

-- ================================
-- 1. USER_PROFILES TABLE
-- ================================
CREATE TABLE IF NOT EXISTS user_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Profile info
    display_name VARCHAR(100),
    bio TEXT,
    avatar_url TEXT,
    location VARCHAR(120),
    
    -- Stats
    total_swaps INTEGER DEFAULT 0,
    successful_swaps INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 5.00,
    total_ratings INTEGER DEFAULT 0,
    
    -- Preferences
    notification_preferences JSONB DEFAULT '{"email": true, "push": true, "sms": false}',
    exchange_preferences JSONB DEFAULT '{"local": true, "courier": true, "travel": false}',
    
    -- Verification
    is_verified BOOLEAN DEFAULT false,
    phone_verified BOOLEAN DEFAULT false,
    email_verified BOOLEAN DEFAULT false,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- 2. SWAP_REQUESTS TABLE
-- ================================
CREATE TABLE IF NOT EXISTS swap_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Users involved
    requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Objects involved
    requested_object_id UUID NOT NULL REFERENCES objects(id) ON DELETE CASCADE,
    offered_object_id UUID REFERENCES objects(id) ON DELETE SET NULL,
    
    -- Request details
    message TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    
    -- Travel integration
    meeting_type VARCHAR(20),
    travel_destination VARCHAR(120),
    travel_dates JSONB,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    
    CONSTRAINT valid_status CHECK (status IN (
        'pending', 'accepted', 'declined', 'completed', 'cancelled'
    )),
    CONSTRAINT valid_meeting_type CHECK (meeting_type IN ('local', 'courier', 'travel')),
    CONSTRAINT different_users CHECK (requester_id != owner_id)
);

-- ================================
-- 3. MESSAGES TABLE
-- ================================
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    swap_request_id UUID NOT NULL REFERENCES swap_requests(id) ON DELETE CASCADE,
    
    -- Message details
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text',
    
    -- Status
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_message_type CHECK (message_type IN ('text', 'image', 'system'))
);

-- ================================
-- 4. RATINGS TABLE
-- ================================
CREATE TABLE IF NOT EXISTS ratings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    swap_request_id UUID NOT NULL REFERENCES swap_requests(id) ON DELETE CASCADE,
    
    -- Rating details
    rater_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rated_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    
    -- Categories
    communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
    item_accuracy_rating INTEGER CHECK (item_accuracy_rating >= 1 AND item_accuracy_rating <= 5),
    timeliness_rating INTEGER CHECK (timeliness_rating >= 1 AND timeliness_rating <= 5),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT different_users CHECK (rater_id != rated_user_id),
    UNIQUE(swap_request_id, rater_id)
);

-- ================================
-- 5. INDEXES
-- ================================
CREATE INDEX IF NOT EXISTS idx_swap_requests_requester ON swap_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_swap_requests_owner ON swap_requests(owner_id);
CREATE INDEX IF NOT EXISTS idx_swap_requests_status ON swap_requests(status);
CREATE INDEX IF NOT EXISTS idx_swap_requests_created_at ON swap_requests(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_swap_request ON messages(swap_request_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_unread ON messages(recipient_id, is_read);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- ================================
-- 6. ENABLE RLS
-- ================================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE swap_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view all profiles" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON user_profiles FOR UPDATE USING (auth.uid() = user_id);

-- Swap requests policies
CREATE POLICY "Users can view swap requests they're involved in" ON swap_requests FOR SELECT 
    USING (auth.uid() = requester_id OR auth.uid() = owner_id);
CREATE POLICY "Users can create swap requests" ON swap_requests FOR INSERT 
    WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Users can update swap requests they're involved in" ON swap_requests FOR UPDATE 
    USING (auth.uid() = requester_id OR auth.uid() = owner_id);

-- Messages policies
CREATE POLICY "Users can view messages they're involved in" ON messages FOR SELECT 
    USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
CREATE POLICY "Users can send messages" ON messages FOR INSERT 
    WITH CHECK (auth.uid() = sender_id);

-- Ratings policies
CREATE POLICY "Users can view ratings" ON ratings FOR SELECT USING (true);
CREATE POLICY "Users can create ratings" ON ratings FOR INSERT 
    WITH CHECK (auth.uid() = rater_id);

-- ================================
-- 7. TRIGGERS
-- ================================
CREATE TRIGGER user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER swap_requests_updated_at BEFORE UPDATE ON swap_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();