-- Swaply Database Schema
-- Comprehensive schema for object swapping platform with vacation integration

-- ================================
-- 1. OBJECTS TABLE
-- ================================
-- Main table for items available for swapping
CREATE TABLE objects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Basic object info
    name VARCHAR(120) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    condition VARCHAR(20) NOT NULL, -- 'new', 'excellent', 'very-good', 'good', 'fair'
    estimated_value DECIMAL(10,2), -- In RON
    
    -- What user wants in exchange
    desired_items TEXT NOT NULL,
    
    -- Location and exchange preferences
    location VARCHAR(120) NOT NULL,
    exchange_preferences JSONB NOT NULL DEFAULT '{"local": false, "courier": false, "travel": false}',
    
    -- Media and status
    images JSONB NOT NULL DEFAULT '[]', -- Array of Cloudinary URLs
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active', 'swapped', 'removed'
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    views_count INTEGER DEFAULT 0,
    
    -- Search optimization
    search_vector tsvector,
    
    CONSTRAINT valid_category CHECK (category IN (
        'tech', 'books', 'jewelry', 'tools', 'gaming', 
        'home', 'sports', 'music', 'art', 'fashion', 'kids', 'other'
    )),
    CONSTRAINT valid_condition CHECK (condition IN (
        'new', 'excellent', 'very-good', 'good', 'fair'
    )),
    CONSTRAINT valid_status CHECK (status IN ('active', 'swapped', 'removed'))
);

-- ================================
-- 2. CATEGORIES TABLE
-- ================================
-- Predefined categories with metadata
CREATE TABLE categories (
    id VARCHAR(20) PRIMARY KEY,
    name_ro VARCHAR(50) NOT NULL,
    name_en VARCHAR(50) NOT NULL,
    emoji VARCHAR(10) NOT NULL,
    description_ro TEXT,
    description_en TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true
);

-- Insert default categories
INSERT INTO categories (id, name_ro, name_en, emoji, description_ro, description_en, sort_order) VALUES
('tech', 'Tech & Gadget-uri', 'Tech & Gadgets', '💻', 'Laptop-uri, telefoane, tablete, componente PC', 'Laptops, phones, tablets, PC components', 1),
('books', 'Cărți & Reviste', 'Books & Magazines', '📚', 'Cărți, reviste, materiale educaționale', 'Books, magazines, educational materials', 2),
('jewelry', 'Bijuterii & Accesorii', 'Jewelry & Accessories', '💍', 'Bijuterii, ceasuri, accesorii fashion', 'Jewelry, watches, fashion accessories', 3),
('tools', 'Unelte & DIY', 'Tools & DIY', '🔧', 'Unelte electrice, scule, echipamente DIY', 'Power tools, equipment, DIY gear', 4),
('gaming', 'Gaming & Console', 'Gaming & Consoles', '🎮', 'Console de jocuri, jocuri, accesorii gaming', 'Gaming consoles, games, gaming accessories', 5),
('home', 'Casă & Grădină', 'Home & Garden', '🏠', 'Mobilier, decorațiuni, ustensile, grădină', 'Furniture, decorations, kitchenware, garden', 6),
('sports', 'Sport & Fitness', 'Sports & Fitness', '⚽', 'Echipament sportiv, fitness, activități outdoor', 'Sports equipment, fitness, outdoor activities', 7),
('music', 'Muzică & Instrumente', 'Music & Instruments', '🎵', 'Instrumente muzicale, echipament audio', 'Musical instruments, audio equipment', 8),
('art', 'Artă & Crafturi', 'Art & Crafts', '🎨', 'Materiale artistice, crafturi, colecții', 'Art supplies, crafts, collectibles', 9),
('fashion', 'Fashion & Haine', 'Fashion & Clothing', '👗', 'Haine, încălțăminte, accesorii vestimentare', 'Clothing, shoes, fashion accessories', 10),
('kids', 'Copii & Jucării', 'Kids & Toys', '🧸', 'Jucării, articole pentru copii, echipament baby', 'Toys, children items, baby equipment', 11),
('other', 'Altele', 'Other', '🔖', 'Alte obiecte care nu se încadrează în categoriile de mai sus', 'Other items that don\'t fit above categories', 12);

-- ================================
-- 3. SWAP_REQUESTS TABLE
-- ================================
-- Requests for swapping between users
CREATE TABLE swap_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Users involved
    requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Objects involved
    requested_object_id UUID NOT NULL REFERENCES objects(id) ON DELETE CASCADE,
    offered_object_id UUID REFERENCES objects(id) ON DELETE SET NULL,
    
    -- Request details
    message TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'declined', 'completed', 'cancelled'
    
    -- Travel integration
    meeting_type VARCHAR(20), -- 'local', 'courier', 'travel'
    travel_destination VARCHAR(120), -- If meeting_type = 'travel'
    travel_dates JSONB, -- {"start": "2024-06-01", "end": "2024-06-05"}
    
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
-- 4. MESSAGES TABLE
-- ================================
-- Real-time messaging between users for swap negotiations
CREATE TABLE messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    swap_request_id UUID NOT NULL REFERENCES swap_requests(id) ON DELETE CASCADE,
    
    -- Message details
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text', -- 'text', 'image', 'system'
    
    -- Status
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_message_type CHECK (message_type IN ('text', 'image', 'system'))
);

-- ================================
-- 5. USER_PROFILES TABLE
-- ================================
-- Extended user profiles for the platform
CREATE TABLE user_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Profile info
    display_name VARCHAR(100),
    bio TEXT,
    avatar_url TEXT,
    location VARCHAR(120),
    
    -- Stats
    total_swaps INTEGER DEFAULT 0,
    successful_swaps INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 5.00, -- Average rating from 1.00 to 5.00
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
-- 6. RATINGS TABLE
-- ================================
-- User ratings and reviews after swaps
CREATE TABLE ratings (
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
    UNIQUE(swap_request_id, rater_id) -- Each user can rate once per swap
);

-- ================================
-- 7. NOTIFICATIONS TABLE
-- ================================
-- System notifications for users
CREATE TABLE notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Notification details
    type VARCHAR(30) NOT NULL, -- 'new_swap_request', 'message', 'swap_accepted', etc.
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
-- 8. TRAVEL_SUGGESTIONS TABLE
-- ================================
-- AI-generated travel suggestions for long-distance swaps
CREATE TABLE travel_suggestions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    swap_request_id UUID NOT NULL REFERENCES swap_requests(id) ON DELETE CASCADE,
    
    -- Destination details
    destination_city VARCHAR(120) NOT NULL,
    destination_country VARCHAR(60) NOT NULL,
    coordinates JSONB, -- {"lat": 44.4268, "lng": 26.1025}
    
    -- Travel info
    distance_km INTEGER,
    travel_time_hours DECIMAL(4,2),
    transport_options JSONB, -- ["plane", "train", "car"]
    
    -- Accommodation suggestions
    hotels JSONB, -- Array of hotel suggestions with prices
    airbnb JSONB, -- Array of Airbnb suggestions
    
    -- Activities and attractions
    attractions JSONB, -- Array of local attractions
    activities JSONB, -- Array of activities
    
    -- Cost estimates
    estimated_cost_min DECIMAL(10,2),
    estimated_cost_max DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'RON',
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days')
);

-- ================================
-- INDEXES FOR PERFORMANCE
-- ================================

-- Objects table indexes
CREATE INDEX idx_objects_user_id ON objects(user_id);
CREATE INDEX idx_objects_category ON objects(category);
CREATE INDEX idx_objects_status ON objects(status);
CREATE INDEX idx_objects_location ON objects USING gin(to_tsvector('romanian', location));
CREATE INDEX idx_objects_search ON objects USING gin(search_vector);
CREATE INDEX idx_objects_created_at ON objects(created_at DESC);

-- Swap requests indexes
CREATE INDEX idx_swap_requests_requester ON swap_requests(requester_id);
CREATE INDEX idx_swap_requests_owner ON swap_requests(owner_id);
CREATE INDEX idx_swap_requests_status ON swap_requests(status);
CREATE INDEX idx_swap_requests_created_at ON swap_requests(created_at DESC);

-- Messages indexes
CREATE INDEX idx_messages_swap_request ON messages(swap_request_id);
CREATE INDEX idx_messages_recipient_unread ON messages(recipient_id, is_read);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- Notifications indexes
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- ================================
-- TRIGGERS AND FUNCTIONS
-- ================================

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
CREATE TRIGGER objects_search_vector_update
    BEFORE INSERT OR UPDATE ON objects
    FOR EACH ROW
    EXECUTE FUNCTION update_objects_search_vector();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER objects_updated_at BEFORE UPDATE ON objects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER swap_requests_updated_at BEFORE UPDATE ON swap_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================
-- ROW LEVEL SECURITY (RLS)
-- ================================

-- Enable RLS on all tables
ALTER TABLE objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE swap_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Objects policies
CREATE POLICY "Users can view all active objects" ON objects FOR SELECT USING (status = 'active');
CREATE POLICY "Users can insert their own objects" ON objects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own objects" ON objects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own objects" ON objects FOR DELETE USING (auth.uid() = user_id);

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

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT 
    USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE 
    USING (auth.uid() = user_id);