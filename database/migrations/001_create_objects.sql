-- Migration 001: Create basic objects table
-- Run this first to create the core objects functionality

-- ================================
-- 1. OBJECTS TABLE
-- ================================
CREATE TABLE IF NOT EXISTS objects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Basic object info
    name VARCHAR(120) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    condition VARCHAR(20) NOT NULL,
    estimated_value DECIMAL(10,2),
    
    -- What user wants in exchange
    desired_items TEXT NOT NULL,
    
    -- Location and exchange preferences
    location VARCHAR(120) NOT NULL,
    exchange_preferences JSONB NOT NULL DEFAULT '{"local": false, "courier": false, "travel": false}',
    
    -- Media and status
    images JSONB NOT NULL DEFAULT '[]',
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    views_count INTEGER DEFAULT 0,
    
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
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(20) PRIMARY KEY,
    name_ro VARCHAR(50) NOT NULL,
    name_en VARCHAR(50) NOT NULL,
    emoji VARCHAR(10) NOT NULL,
    description_ro TEXT,
    description_en TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true
);

-- Insert default categories (use ON CONFLICT to avoid duplicates)
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
('other', 'Altele', 'Other', '🔖', 'Alte obiecte care nu se încadrează în categoriile de mai sus', 'Other items that don\'t fit above categories', 12)
ON CONFLICT (id) DO NOTHING;

-- ================================
-- 3. INDEXES
-- ================================
CREATE INDEX IF NOT EXISTS idx_objects_user_id ON objects(user_id);
CREATE INDEX IF NOT EXISTS idx_objects_category ON objects(category);
CREATE INDEX IF NOT EXISTS idx_objects_status ON objects(status);
CREATE INDEX IF NOT EXISTS idx_objects_created_at ON objects(created_at DESC);

-- ================================
-- 4. ENABLE RLS
-- ================================
ALTER TABLE objects ENABLE ROW LEVEL SECURITY;

-- Objects policies
CREATE POLICY "Users can view all active objects" ON objects FOR SELECT USING (status = 'active');
CREATE POLICY "Users can insert their own objects" ON objects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own objects" ON objects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own objects" ON objects FOR DELETE USING (auth.uid() = user_id);

-- ================================
-- 5. FUNCTIONS AND TRIGGERS
-- ================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER objects_updated_at BEFORE UPDATE ON objects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();