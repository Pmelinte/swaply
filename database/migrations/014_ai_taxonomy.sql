-- ============================================================================
-- Migration 014: AI Taxonomy Foundation - International Categories
-- ============================================================================
-- Description: International product classification system based on UNSPSC, 
--              HS/HTS codes, ISIC, and OpenStreetMap taxonomy
-- Features: Multi-level categories, translations, aliases, fuzzy search
-- Author: Swaply AI Team
-- Date: 2025-01-13
-- ============================================================================

-- ============================================================================
-- 1. CATEGORIES TABLE (hierarchical structure)
-- ============================================================================

CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Hierarchical structure
    parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    level INTEGER NOT NULL DEFAULT 0, -- 0=root, 1=main, 2=sub, 3=detail
    path TEXT NOT NULL, -- e.g., "electronics/computers/laptops"
    
    -- International codes
    unspsc_code VARCHAR(10), -- United Nations Standard Products and Services Code
    hs_code VARCHAR(10), -- Harmonized System (customs/trade)
    isic_code VARCHAR(5), -- International Standard Industrial Classification
    
    -- Core data
    code VARCHAR(50) UNIQUE NOT NULL, -- Internal unique identifier
    name_en TEXT NOT NULL, -- English name (base language)
    description_en TEXT,
    
    -- Metadata
    icon_name VARCHAR(50), -- lucide-react icon name
    color VARCHAR(20), -- hex color for UI
    is_active BOOLEAN DEFAULT true,
    is_service BOOLEAN DEFAULT false, -- true for services, false for physical goods
    is_housing BOOLEAN DEFAULT false, -- true for housing/accommodation
    
    -- SEO & search
    keywords TEXT[], -- search keywords
    search_vector TSVECTOR, -- full-text search
    popularity_score INTEGER DEFAULT 0, -- usage count
    
    -- Constraints & rules
    requires_verification BOOLEAN DEFAULT false, -- high-value items
    requires_shipping BOOLEAN DEFAULT true, -- false for digital/local services
    max_value_eur DECIMAL(10,2), -- recommended max value
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_path ON categories USING GIST(path gist_trgm_ops);
CREATE INDEX idx_categories_code ON categories(code);
CREATE INDEX idx_categories_level ON categories(level);
CREATE INDEX idx_categories_active ON categories(is_active) WHERE is_active = true;
CREATE INDEX idx_categories_search ON categories USING GIN(search_vector);
CREATE INDEX idx_categories_keywords ON categories USING GIN(keywords);
CREATE INDEX idx_categories_unspsc ON categories(unspsc_code) WHERE unspsc_code IS NOT NULL;
CREATE INDEX idx_categories_hs ON categories(hs_code) WHERE hs_code IS NOT NULL;

-- Full-text search trigger
CREATE OR REPLACE FUNCTION update_category_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('simple', COALESCE(NEW.name_en, '')), 'A') ||
        setweight(to_tsvector('simple', COALESCE(NEW.description_en, '')), 'B') ||
        setweight(to_tsvector('simple', COALESCE(array_to_string(NEW.keywords, ' '), '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER categories_search_vector_update
    BEFORE INSERT OR UPDATE OF name_en, description_en, keywords
    ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_category_search_vector();

-- Auto-update timestamp
CREATE TRIGGER categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- 2. CATEGORY TRANSLATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS category_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    
    -- Language
    language_code VARCHAR(5) NOT NULL, -- ISO 639-1 (en, ro, es, fr, de, etc.)
    
    -- Translated content
    name TEXT NOT NULL,
    description TEXT,
    keywords TEXT[], -- localized keywords
    
    -- Quality & verification
    translation_source VARCHAR(20) DEFAULT 'manual', -- manual, ai, community
    is_verified BOOLEAN DEFAULT false,
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(category_id, language_code)
);

CREATE INDEX idx_category_translations_category ON category_translations(category_id);
CREATE INDEX idx_category_translations_language ON category_translations(language_code);
CREATE INDEX idx_category_translations_verified ON category_translations(is_verified) WHERE is_verified = true;

-- ============================================================================
-- 3. CATEGORY ALIASES TABLE (synonyms & variations)
-- ============================================================================

CREATE TABLE IF NOT EXISTS category_aliases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    
    -- Alias data
    alias TEXT NOT NULL,
    language_code VARCHAR(5) NOT NULL,
    
    -- Type of alias
    alias_type VARCHAR(20) DEFAULT 'synonym', -- synonym, abbreviation, misspelling, brand, slang
    
    -- Metadata
    usage_count INTEGER DEFAULT 0, -- how often used in search
    confidence_score DECIMAL(3,2) DEFAULT 1.0, -- 0.0-1.0
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(alias, language_code)
);

CREATE INDEX idx_category_aliases_category ON category_aliases(category_id);
CREATE INDEX idx_category_aliases_alias ON category_aliases USING GIST(alias gist_trgm_ops);
CREATE INDEX idx_category_aliases_language ON category_aliases(language_code);
CREATE INDEX idx_category_aliases_type ON category_aliases(alias_type);

-- ============================================================================
-- 4. OBJECT CATEGORIES (link objects to taxonomy)
-- ============================================================================

-- Add category relationship to objects table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'objects' AND column_name = 'category_id'
    ) THEN
        ALTER TABLE objects ADD COLUMN category_id UUID REFERENCES categories(id);
        CREATE INDEX idx_objects_category ON objects(category_id);
    END IF;
    
    -- Add AI classification fields
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'objects' AND column_name = 'ai_category_confidence'
    ) THEN
        ALTER TABLE objects ADD COLUMN ai_category_confidence DECIMAL(3,2); -- 0.0-1.0
        ALTER TABLE objects ADD COLUMN ai_classification_method VARCHAR(20); -- 'manual', 'keyword', 'embedding', 'image'
        ALTER TABLE objects ADD COLUMN category_override_by UUID REFERENCES users(id);
    END IF;
END $$;

-- ============================================================================
-- 5. FUNCTIONS: Category Management
-- ============================================================================

-- Function: Get category tree (hierarchical)
CREATE OR REPLACE FUNCTION get_category_tree(
    p_parent_id UUID DEFAULT NULL,
    p_language VARCHAR(5) DEFAULT 'en',
    p_max_depth INTEGER DEFAULT 3
)
RETURNS TABLE (
    id UUID,
    parent_id UUID,
    level INTEGER,
    path TEXT,
    code VARCHAR,
    name TEXT,
    description TEXT,
    icon_name VARCHAR,
    color VARCHAR,
    is_service BOOLEAN,
    is_housing BOOLEAN,
    children_count BIGINT,
    object_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE category_tree AS (
        -- Base case: root or specified parent
        SELECT 
            c.id,
            c.parent_id,
            c.level,
            c.path,
            c.code,
            COALESCE(ct.name, c.name_en) as name,
            COALESCE(ct.description, c.description_en) as description,
            c.icon_name,
            c.color,
            c.is_service,
            c.is_housing,
            0 as depth
        FROM categories c
        LEFT JOIN category_translations ct ON ct.category_id = c.id 
            AND ct.language_code = p_language
        WHERE c.parent_id IS NOT DISTINCT FROM p_parent_id
            AND c.is_active = true
        
        UNION ALL
        
        -- Recursive case: children
        SELECT 
            c.id,
            c.parent_id,
            c.level,
            c.path,
            c.code,
            COALESCE(ct.name, c.name_en),
            COALESCE(ct.description, c.description_en),
            c.icon_name,
            c.color,
            c.is_service,
            c.is_housing,
            ct_parent.depth + 1
        FROM categories c
        INNER JOIN category_tree ct_parent ON c.parent_id = ct_parent.id
        LEFT JOIN category_translations ct ON ct.category_id = c.id 
            AND ct.language_code = p_language
        WHERE c.is_active = true
            AND ct_parent.depth < p_max_depth
    )
    SELECT 
        ct.id,
        ct.parent_id,
        ct.level,
        ct.path,
        ct.code,
        ct.name,
        ct.description,
        ct.icon_name,
        ct.color,
        ct.is_service,
        ct.is_housing,
        (SELECT COUNT(*) FROM categories WHERE parent_id = ct.id AND is_active = true) as children_count,
        (SELECT COUNT(*) FROM objects WHERE category_id = ct.id) as object_count
    FROM category_tree ct
    ORDER BY ct.level, ct.name;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Fuzzy search categories
CREATE OR REPLACE FUNCTION search_categories(
    p_query TEXT,
    p_language VARCHAR(5) DEFAULT 'en',
    p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    path TEXT,
    icon_name VARCHAR,
    similarity_score REAL,
    match_type VARCHAR -- 'exact', 'prefix', 'fuzzy', 'alias', 'keyword'
) AS $$
DECLARE
    clean_query TEXT := LOWER(TRIM(p_query));
BEGIN
    RETURN QUERY
    WITH scored_categories AS (
        -- Exact match on name
        SELECT 
            c.id,
            COALESCE(ct.name, c.name_en) as name,
            COALESCE(ct.description, c.description_en) as description,
            c.path,
            c.icon_name,
            1.0::REAL as score,
            'exact'::VARCHAR as match_type,
            1 as priority
        FROM categories c
        LEFT JOIN category_translations ct ON ct.category_id = c.id 
            AND ct.language_code = p_language
        WHERE c.is_active = true
            AND (LOWER(c.name_en) = clean_query OR LOWER(ct.name) = clean_query)
        
        UNION ALL
        
        -- Prefix match
        SELECT 
            c.id,
            COALESCE(ct.name, c.name_en),
            COALESCE(ct.description, c.description_en),
            c.path,
            c.icon_name,
            0.9::REAL,
            'prefix'::VARCHAR,
            2
        FROM categories c
        LEFT JOIN category_translations ct ON ct.category_id = c.id 
            AND ct.language_code = p_language
        WHERE c.is_active = true
            AND (
                LOWER(c.name_en) LIKE clean_query || '%' 
                OR LOWER(ct.name) LIKE clean_query || '%'
            )
        
        UNION ALL
        
        -- Fuzzy match (trigram similarity)
        SELECT 
            c.id,
            COALESCE(ct.name, c.name_en),
            COALESCE(ct.description, c.description_en),
            c.path,
            c.icon_name,
            GREATEST(
                similarity(LOWER(c.name_en), clean_query),
                similarity(LOWER(COALESCE(ct.name, '')), clean_query)
            ),
            'fuzzy'::VARCHAR,
            3
        FROM categories c
        LEFT JOIN category_translations ct ON ct.category_id = c.id 
            AND ct.language_code = p_language
        WHERE c.is_active = true
            AND (
                LOWER(c.name_en) % clean_query 
                OR LOWER(ct.name) % clean_query
            )
        
        UNION ALL
        
        -- Alias match
        SELECT 
            c.id,
            COALESCE(ct.name, c.name_en),
            COALESCE(ct.description, c.description_en),
            c.path,
            c.icon_name,
            ca.confidence_score,
            'alias'::VARCHAR,
            4
        FROM category_aliases ca
        INNER JOIN categories c ON c.id = ca.category_id
        LEFT JOIN category_translations ct ON ct.category_id = c.id 
            AND ct.language_code = p_language
        WHERE c.is_active = true
            AND LOWER(ca.alias) % clean_query
            AND ca.language_code IN (p_language, 'en')
        
        UNION ALL
        
        -- Keyword match
        SELECT 
            c.id,
            COALESCE(ct.name, c.name_en),
            COALESCE(ct.description, c.description_en),
            c.path,
            c.icon_name,
            0.7::REAL,
            'keyword'::VARCHAR,
            5
        FROM categories c
        LEFT JOIN category_translations ct ON ct.category_id = c.id 
            AND ct.language_code = p_language
        WHERE c.is_active = true
            AND (
                clean_query = ANY(c.keywords) 
                OR clean_query = ANY(ct.keywords)
            )
    )
    SELECT DISTINCT ON (sc.id)
        sc.id,
        sc.name,
        sc.description,
        sc.path,
        sc.icon_name,
        sc.score as similarity_score,
        sc.match_type
    FROM scored_categories sc
    ORDER BY sc.id, sc.priority, sc.score DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Auto-suggest category from keywords
CREATE OR REPLACE FUNCTION suggest_category_from_keywords(
    p_title TEXT,
    p_description TEXT DEFAULT '',
    p_language VARCHAR(5) DEFAULT 'en',
    p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
    category_id UUID,
    category_name TEXT,
    category_path TEXT,
    confidence_score DECIMAL,
    matched_keywords TEXT[]
) AS $$
DECLARE
    combined_text TEXT := LOWER(p_title || ' ' || p_description);
    ts_query TSQUERY := plainto_tsquery('simple', combined_text);
BEGIN
    RETURN QUERY
    WITH keyword_matches AS (
        SELECT 
            c.id,
            COALESCE(ct.name, c.name_en) as name,
            c.path,
            ts_rank(c.search_vector, ts_query) as rank,
            ARRAY(
                SELECT unnest(c.keywords) 
                WHERE position(LOWER(unnest) in combined_text) > 0
            ) as matched
        FROM categories c
        LEFT JOIN category_translations ct ON ct.category_id = c.id 
            AND ct.language_code = p_language
        WHERE c.is_active = true
            AND c.search_vector @@ ts_query
    )
    SELECT 
        km.id,
        km.name,
        km.path,
        ROUND((km.rank + (array_length(km.matched, 1) * 0.1))::NUMERIC, 2) as confidence,
        km.matched
    FROM keyword_matches km
    WHERE array_length(km.matched, 1) > 0
    ORDER BY confidence DESC, km.name
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Get category breadcrumb (path)
CREATE OR REPLACE FUNCTION get_category_breadcrumb(
    p_category_id UUID,
    p_language VARCHAR(5) DEFAULT 'en'
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    path TEXT,
    level INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE breadcrumb AS (
        SELECT 
            c.id,
            COALESCE(ct.name, c.name_en) as name,
            c.path,
            c.level,
            c.parent_id
        FROM categories c
        LEFT JOIN category_translations ct ON ct.category_id = c.id 
            AND ct.language_code = p_language
        WHERE c.id = p_category_id
        
        UNION ALL
        
        SELECT 
            c.id,
            COALESCE(ct.name, c.name_en),
            c.path,
            c.level,
            c.parent_id
        FROM categories c
        INNER JOIN breadcrumb b ON c.id = b.parent_id
        LEFT JOIN category_translations ct ON ct.category_id = c.id 
            AND ct.language_code = p_language
    )
    SELECT b.id, b.name, b.path, b.level
    FROM breadcrumb b
    ORDER BY b.level;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- 6. SEED DATA: Base Categories (UNSPSC-inspired)
-- ============================================================================

-- Root categories
INSERT INTO categories (code, name_en, description_en, level, path, icon_name, color, unspsc_code) VALUES
('electronics', 'Electronics & Computers', 'Electronic devices, computers, phones, and accessories', 0, 'electronics', 'Laptop', '#3B82F6', '43'),
('home-garden', 'Home & Garden', 'Furniture, home decor, appliances, and garden equipment', 0, 'home-garden', 'Home', '#10B981', '52'),
('fashion', 'Fashion & Accessories', 'Clothing, shoes, bags, and accessories', 0, 'fashion', 'ShoppingBag', '#EC4899', '53'),
('sports', 'Sports & Outdoors', 'Sports equipment, outdoor gear, fitness items', 0, 'sports', 'Bike', '#F59E0B', '49'),
('vehicles', 'Vehicles & Parts', 'Cars, motorcycles, bicycles, and vehicle parts', 0, 'vehicles', 'Car', '#EF4444', '25'),
('books-media', 'Books, Movies & Music', 'Books, movies, music, games, and collectibles', 0, 'books-media', 'Book', '#8B5CF6', '55'),
('toys-kids', 'Toys & Kids', 'Toys, baby items, kids clothing and equipment', 0, 'toys-kids', 'Baby', '#F472B6', '60'),
('tools', 'Tools & Equipment', 'Hand tools, power tools, industrial equipment', 0, 'tools', 'Wrench', '#6B7280', '27'),
('services', 'Services', 'Local services, repairs, installations, consulting', 0, 'services', 'Briefcase', '#06B6D4', '70'),
('housing', 'Housing & Real Estate', 'Houses, apartments, rooms for exchange or rent', 0, 'housing', 'Building', '#14B8A6', '72')
ON CONFLICT (code) DO NOTHING;

-- Electronics subcategories
INSERT INTO categories (parent_id, code, name_en, level, path, icon_name, unspsc_code) 
SELECT id, 'computers', 'Computers & Laptops', 1, 'electronics/computers', 'Monitor', '43211500'
FROM categories WHERE code = 'electronics'
ON CONFLICT (code) DO NOTHING;

INSERT INTO categories (parent_id, code, name_en, level, path, icon_name, unspsc_code)
SELECT id, 'phones', 'Mobile Phones & Tablets', 1, 'electronics/phones', 'Smartphone', '43191500'
FROM categories WHERE code = 'electronics'
ON CONFLICT (code) DO NOTHING;

INSERT INTO categories (parent_id, code, name_en, level, path, icon_name, unspsc_code)
SELECT id, 'tv-audio', 'TV, Audio & Video', 1, 'electronics/tv-audio', 'Tv', '52161500'
FROM categories WHERE code = 'electronics'
ON CONFLICT (code) DO NOTHING;

INSERT INTO categories (parent_id, code, name_en, level, path, icon_name, unspsc_code)
SELECT id, 'cameras', 'Cameras & Photography', 1, 'electronics/cameras', 'Camera', '45121500'
FROM categories WHERE code = 'electronics'
ON CONFLICT (code) DO NOTHING;

-- Home & Garden subcategories
INSERT INTO categories (parent_id, code, name_en, level, path, icon_name, unspsc_code)
SELECT id, 'furniture', 'Furniture', 1, 'home-garden/furniture', 'Armchair', '56101500'
FROM categories WHERE code = 'home-garden'
ON CONFLICT (code) DO NOTHING;

INSERT INTO categories (parent_id, code, name_en, level, path, icon_name, unspsc_code)
SELECT id, 'appliances', 'Home Appliances', 1, 'home-garden/appliances', 'Refrigerator', '52141500'
FROM categories WHERE code = 'home-garden'
ON CONFLICT (code) DO NOTHING;

INSERT INTO categories (parent_id, code, name_en, level, path, icon_name, unspsc_code)
SELECT id, 'garden', 'Garden & Outdoor', 1, 'home-garden/garden', 'Flower', '27111500'
FROM categories WHERE code = 'home-garden'
ON CONFLICT (code) DO NOTHING;

-- Fashion subcategories
INSERT INTO categories (parent_id, code, name_en, level, path, icon_name)
SELECT id, 'clothing', 'Clothing', 1, 'fashion/clothing', 'Shirt'
FROM categories WHERE code = 'fashion'
ON CONFLICT (code) DO NOTHING;

INSERT INTO categories (parent_id, code, name_en, level, path, icon_name)
SELECT id, 'shoes', 'Shoes & Footwear', 1, 'fashion/shoes', 'Footprints'
FROM categories WHERE code = 'fashion'
ON CONFLICT (code) DO NOTHING;

INSERT INTO categories (parent_id, code, name_en, level, path, icon_name)
SELECT id, 'accessories', 'Bags & Accessories', 1, 'fashion/accessories', 'Watch'
FROM categories WHERE code = 'fashion'
ON CONFLICT (code) DO NOTHING;

-- Sports subcategories
INSERT INTO categories (parent_id, code, name_en, level, path, icon_name)
SELECT id, 'fitness', 'Fitness Equipment', 1, 'sports/fitness', 'Dumbbell'
FROM categories WHERE code = 'sports'
ON CONFLICT (code) DO NOTHING;

INSERT INTO categories (parent_id, code, name_en, level, path, icon_name)
SELECT id, 'outdoor', 'Camping & Hiking', 1, 'sports/outdoor', 'Tent'
FROM categories WHERE code = 'sports'
ON CONFLICT (code) DO NOTHING;

-- Vehicles subcategories
INSERT INTO categories (parent_id, code, name_en, level, path, icon_name)
SELECT id, 'bicycles', 'Bicycles', 1, 'vehicles/bicycles', 'Bike'
FROM categories WHERE code = 'vehicles'
ON CONFLICT (code) DO NOTHING;

INSERT INTO categories (parent_id, code, name_en, level, path, icon_name)
SELECT id, 'car-parts', 'Car Parts & Accessories', 1, 'vehicles/car-parts', 'Settings'
FROM categories WHERE code = 'vehicles'
ON CONFLICT (code) DO NOTHING;

-- Services subcategories (mark as services)
INSERT INTO categories (parent_id, code, name_en, level, path, icon_name, is_service, requires_shipping)
SELECT id, 'repairs', 'Repairs & Maintenance', 1, 'services/repairs', 'Tool', true, false
FROM categories WHERE code = 'services'
ON CONFLICT (code) DO NOTHING;

INSERT INTO categories (parent_id, code, name_en, level, path, icon_name, is_service, requires_shipping)
SELECT id, 'installations', 'Installation Services', 1, 'services/installations', 'Plug', true, false
FROM categories WHERE code = 'services'
ON CONFLICT (code) DO NOTHING;

-- Housing subcategories (mark as housing)
INSERT INTO categories (parent_id, code, name_en, level, path, icon_name, is_housing, requires_shipping)
SELECT id, 'houses', 'Houses', 1, 'housing/houses', 'Home', true, false
FROM categories WHERE code = 'housing'
ON CONFLICT (code) DO NOTHING;

INSERT INTO categories (parent_id, code, name_en, level, path, icon_name, is_housing, requires_shipping)
SELECT id, 'apartments', 'Apartments', 1, 'housing/apartments', 'Building2', true, false
FROM categories WHERE code = 'housing'
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- 7. SEED DATA: Romanian Translations
-- ============================================================================

INSERT INTO category_translations (category_id, language_code, name, description) 
SELECT id, 'ro', 'Electronică & Calculatoare', 'Dispozitive electronice, calculatoare, telefoane și accesorii'
FROM categories WHERE code = 'electronics'
ON CONFLICT (category_id, language_code) DO NOTHING;

INSERT INTO category_translations (category_id, language_code, name, description)
SELECT id, 'ro', 'Casă & Grădină', 'Mobilă, decorațiuni, electrocasnice și echipamente de grădină'
FROM categories WHERE code = 'home-garden'
ON CONFLICT (category_id, language_code) DO NOTHING;

INSERT INTO category_translations (category_id, language_code, name, description)
SELECT id, 'ro', 'Modă & Accesorii', 'Haine, încălțăminte, genți și accesorii'
FROM categories WHERE code = 'fashion'
ON CONFLICT (category_id, language_code) DO NOTHING;

INSERT INTO category_translations (category_id, language_code, name, description)
SELECT id, 'ro', 'Sport & Activități în Aer Liber', 'Echipament sportiv, echipament outdoor, articole fitness'
FROM categories WHERE code = 'sports'
ON CONFLICT (category_id, language_code) DO NOTHING;

INSERT INTO category_translations (category_id, language_code, name, description)
SELECT id, 'ro', 'Vehicule & Piese Auto', 'Mașini, motociclete, biciclete și piese auto'
FROM categories WHERE code = 'vehicles'
ON CONFLICT (category_id, language_code) DO NOTHING;

INSERT INTO category_translations (category_id, language_code, name, description)
SELECT id, 'ro', 'Cărți, Filme & Muzică', 'Cărți, filme, muzică, jocuri și colecții'
FROM categories WHERE code = 'books-media'
ON CONFLICT (category_id, language_code) DO NOTHING;

INSERT INTO category_translations (category_id, language_code, name, description)
SELECT id, 'ro', 'Jucării & Copii', 'Jucării, articole pentru bebeluși, îmbrăcăminte copii'
FROM categories WHERE code = 'toys-kids'
ON CONFLICT (category_id, language_code) DO NOTHING;

INSERT INTO category_translations (category_id, language_code, name, description)
SELECT id, 'ro', 'Unelte & Echipamente', 'Scule manuale, scule electrice, echipamente industriale'
FROM categories WHERE code = 'tools'
ON CONFLICT (category_id, language_code) DO NOTHING;

INSERT INTO category_translations (category_id, language_code, name, description)
SELECT id, 'ro', 'Servicii', 'Servicii locale, reparații, instalări, consultanță'
FROM categories WHERE code = 'services'
ON CONFLICT (category_id, language_code) DO NOTHING;

INSERT INTO category_translations (category_id, language_code, name, description)
SELECT id, 'ro', 'Locuințe & Imobiliare', 'Case, apartamente, camere pentru schimb sau închiriere'
FROM categories WHERE code = 'housing'
ON CONFLICT (category_id, language_code) DO NOTHING;

-- ============================================================================
-- 8. SEED DATA: Common Aliases (synonyms)
-- ============================================================================

-- Electronics aliases
INSERT INTO category_aliases (category_id, alias, language_code, alias_type)
SELECT id, 'laptop', 'en', 'synonym' FROM categories WHERE code = 'computers'
UNION ALL
SELECT id, 'notebook', 'en', 'synonym' FROM categories WHERE code = 'computers'
UNION ALL
SELECT id, 'pc', 'en', 'abbreviation' FROM categories WHERE code = 'computers'
UNION ALL
SELECT id, 'smartphone', 'en', 'synonym' FROM categories WHERE code = 'phones'
UNION ALL
SELECT id, 'mobile', 'en', 'synonym' FROM categories WHERE code = 'phones'
UNION ALL
SELECT id, 'telefon', 'ro', 'synonym' FROM categories WHERE code = 'phones'
UNION ALL
SELECT id, 'televizor', 'ro', 'synonym' FROM categories WHERE code = 'tv-audio'
UNION ALL
SELECT id, 'aparat foto', 'ro', 'synonym' FROM categories WHERE code = 'cameras'
ON CONFLICT (alias, language_code) DO NOTHING;

-- Home aliases
INSERT INTO category_aliases (category_id, alias, language_code, alias_type)
SELECT id, 'mobilier', 'ro', 'synonym' FROM categories WHERE code = 'furniture'
UNION ALL
SELECT id, 'electrocasnice', 'ro', 'synonym' FROM categories WHERE code = 'appliances'
UNION ALL
SELECT id, 'gradina', 'ro', 'synonym' FROM categories WHERE code = 'garden'
ON CONFLICT (alias, language_code) DO NOTHING;

-- Fashion aliases
INSERT INTO category_aliases (category_id, alias, language_code, alias_type)
SELECT id, 'haine', 'ro', 'synonym' FROM categories WHERE code = 'clothing'
UNION ALL
SELECT id, 'pantofi', 'ro', 'synonym' FROM categories WHERE code = 'shoes'
UNION ALL
SELECT id, 'incaltaminte', 'ro', 'synonym' FROM categories WHERE code = 'shoes'
ON CONFLICT (alias, language_code) DO NOTHING;

-- Vehicles aliases
INSERT INTO category_aliases (category_id, alias, language_code, alias_type)
SELECT id, 'bike', 'en', 'synonym' FROM categories WHERE code = 'bicycles'
UNION ALL
SELECT id, 'bicicleta', 'ro', 'synonym' FROM categories WHERE code = 'bicycles'
UNION ALL
SELECT id, 'piese auto', 'ro', 'synonym' FROM categories WHERE code = 'car-parts'
ON CONFLICT (alias, language_code) DO NOTHING;

-- Services aliases
INSERT INTO category_aliases (category_id, alias, language_code, alias_type)
SELECT id, 'reparatii', 'ro', 'synonym' FROM categories WHERE code = 'repairs'
UNION ALL
SELECT id, 'instalari', 'ro', 'synonym' FROM categories WHERE code = 'installations'
ON CONFLICT (alias, language_code) DO NOTHING;

-- ============================================================================
-- 9. ANALYTICS: Category Usage View
-- ============================================================================

CREATE OR REPLACE VIEW category_analytics AS
SELECT 
    c.id,
    c.code,
    c.name_en,
    c.level,
    c.path,
    c.popularity_score,
    COUNT(o.id) as object_count,
    COUNT(DISTINCT o.user_id) as unique_users,
    AVG(o.ai_category_confidence) as avg_confidence,
    MAX(o.created_at) as last_used,
    COUNT(o.id) FILTER (WHERE o.created_at > NOW() - INTERVAL '7 days') as objects_last_7d,
    COUNT(o.id) FILTER (WHERE o.created_at > NOW() - INTERVAL '30 days') as objects_last_30d
FROM categories c
LEFT JOIN objects o ON o.category_id = c.id
WHERE c.is_active = true
GROUP BY c.id, c.code, c.name_en, c.level, c.path, c.popularity_score
ORDER BY object_count DESC;

-- ============================================================================
-- 10. RLS POLICIES
-- ============================================================================

-- Categories are publicly readable
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories are viewable by everyone"
    ON categories FOR SELECT
    USING (is_active = true);

-- Category translations are publicly readable
ALTER TABLE category_translations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Category translations are viewable by everyone"
    ON category_translations FOR SELECT
    USING (true);

-- Category aliases are publicly readable
ALTER TABLE category_aliases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Category aliases are viewable by everyone"
    ON category_aliases FOR SELECT
    USING (true);

-- Only admins can modify categories
CREATE POLICY "Only admins can insert categories"
    ON categories FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND is_admin = true
        )
    );

CREATE POLICY "Only admins can update categories"
    ON categories FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND is_admin = true
        )
    );

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

COMMENT ON TABLE categories IS 'International product classification system based on UNSPSC, HS, ISIC standards';
COMMENT ON TABLE category_translations IS 'Multilingual category names and descriptions';
COMMENT ON TABLE category_aliases IS 'Synonyms, abbreviations, and variations for category search';
COMMENT ON FUNCTION search_categories IS 'Fuzzy search categories with exact/prefix/trigram/alias matching';
COMMENT ON FUNCTION suggest_category_from_keywords IS 'Auto-suggest category based on object title/description';
COMMENT ON FUNCTION get_category_tree IS 'Get hierarchical category tree with translations';
COMMENT ON FUNCTION get_category_breadcrumb IS 'Get category path from root to specified category';
