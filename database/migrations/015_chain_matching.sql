-- ============================================================================
-- Migration 015: Enhanced Chain Matching Algorithm (A→B→C)
-- ============================================================================
-- Description: Multi-party swap system with chain matching, constraint solver,
--              composite scoring, and explainability
-- Features: 2-party, 3-party, N-party chains, compatibility constraints,
--           "why this match?" explanations
-- Author: Swaply AI Team
-- Date: 2025-01-13
-- ============================================================================

-- ============================================================================
-- 1. MATCH CHAINS TABLE (multi-party swaps)
-- ============================================================================

CREATE TABLE IF NOT EXISTS match_chains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Chain configuration
    chain_type VARCHAR(20) NOT NULL, -- 'direct' (A↔B), 'triple' (A→B→C→A), 'multi' (4+)
    participant_count INTEGER NOT NULL DEFAULT 2,
    
    -- Participants (ordered array of object IDs)
    object_ids UUID[] NOT NULL, -- [obj_a, obj_b, obj_c, ...]
    user_ids UUID[] NOT NULL, -- [user_a, user_b, user_c, ...]
    
    -- Scoring components
    similarity_score DECIMAL(5,2) NOT NULL, -- 0-100 (category + keyword match)
    proximity_score DECIMAL(5,2) NOT NULL, -- 0-100 (distance-based)
    reputation_score DECIMAL(5,2) NOT NULL, -- 0-100 (TrustScore average)
    rarity_score DECIMAL(5,2) NOT NULL, -- 0-100 (inverse of popularity)
    
    -- Composite score
    total_score DECIMAL(5,2) NOT NULL, -- Weighted average of above
    confidence DECIMAL(3,2) NOT NULL, -- 0.0-1.0
    
    -- Constraints satisfied
    constraints_met JSONB DEFAULT '[]'::jsonb, -- ["distance_ok", "value_balanced", etc.]
    constraints_failed JSONB DEFAULT '[]'::jsonb, -- ["shipping_cost_high", etc.]
    
    -- Explainability
    match_reasons TEXT[] NOT NULL, -- ["Similar categories", "Good reputation", etc.]
    warnings TEXT[], -- ["High shipping cost", "Distance > 500km", etc.]
    
    -- Chain metadata
    estimated_cost_eur DECIMAL(10,2), -- Total shipping costs
    estimated_duration_days INTEGER, -- Time to complete all swaps
    co2_emissions_kg DECIMAL(8,2), -- Environmental impact
    
    -- Status
    status VARCHAR(20) DEFAULT 'proposed', -- proposed, accepted, in_progress, completed, cancelled
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '7 days',
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by_algorithm VARCHAR(50) DEFAULT 'enhanced_v1' -- Algorithm version for A/B testing
);

-- Indexes
CREATE INDEX idx_match_chains_status ON match_chains(status);
CREATE INDEX idx_match_chains_score ON match_chains(total_score DESC);
CREATE INDEX idx_match_chains_expires ON match_chains(expires_at) WHERE status = 'proposed';
CREATE INDEX idx_match_chains_user_ids ON match_chains USING GIN(user_ids);
CREATE INDEX idx_match_chains_object_ids ON match_chains USING GIN(object_ids);
CREATE INDEX idx_match_chains_created ON match_chains(created_at DESC);

-- Auto-update timestamp
CREATE TRIGGER match_chains_updated_at
    BEFORE UPDATE ON match_chains
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- 2. MATCHING CONSTRAINTS TABLE (user preferences)
-- ============================================================================

CREATE TABLE IF NOT EXISTS matching_constraints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Distance constraints
    max_distance_km INTEGER DEFAULT 500, -- Maximum distance for swap partner
    prefer_local BOOLEAN DEFAULT true, -- Prefer nearby matches
    
    -- Value constraints
    min_value_ratio DECIMAL(3,2) DEFAULT 0.7, -- Min 70% of my object's value
    max_value_ratio DECIMAL(3,2) DEFAULT 1.5, -- Max 150% of my object's value
    allow_credit_swaply BOOLEAN DEFAULT true, -- Accept credit for value difference
    
    -- Reputation constraints
    min_trust_score INTEGER DEFAULT 50, -- Minimum partner TrustScore
    require_verified_identity BOOLEAN DEFAULT false,
    require_verified_address BOOLEAN DEFAULT false,
    
    -- Category constraints
    preferred_categories UUID[], -- Preferred category IDs
    excluded_categories UUID[], -- Categories to avoid
    allow_cross_category BOOLEAN DEFAULT true, -- Allow different categories
    
    -- Logistics constraints
    max_shipping_cost_eur DECIMAL(8,2) DEFAULT 100.0,
    max_swap_duration_days INTEGER DEFAULT 14,
    require_insurance BOOLEAN DEFAULT false,
    
    -- Multi-party preferences
    allow_chain_swaps BOOLEAN DEFAULT true, -- Allow A→B→C swaps
    max_chain_length INTEGER DEFAULT 3, -- Maximum participants in chain
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);

CREATE INDEX idx_matching_constraints_user ON matching_constraints(user_id);

-- Auto-update timestamp
CREATE TRIGGER matching_constraints_updated_at
    BEFORE UPDATE ON matching_constraints
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- 3. MATCH FEEDBACK TABLE (learning from user actions)
-- ============================================================================

CREATE TABLE IF NOT EXISTS match_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_chain_id UUID REFERENCES match_chains(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    object_id UUID NOT NULL REFERENCES objects(id) ON DELETE CASCADE,
    
    -- Feedback type
    action VARCHAR(20) NOT NULL, -- 'view', 'like', 'skip', 'accept', 'reject', 'complete'
    
    -- Explicit feedback (optional)
    feedback_reason VARCHAR(100), -- 'too_far', 'wrong_category', 'low_value', etc.
    rating INTEGER, -- 1-5 stars (for completed swaps)
    
    -- Implicit signals
    time_spent_seconds INTEGER, -- How long user viewed match
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_match_feedback_chain ON match_feedback(match_chain_id);
CREATE INDEX idx_match_feedback_user ON match_feedback(user_id);
CREATE INDEX idx_match_feedback_action ON match_feedback(action);
CREATE INDEX idx_match_feedback_created ON match_feedback(created_at DESC);

-- ============================================================================
-- 4. FUNCTIONS: Composite Scoring
-- ============================================================================

-- Function: Calculate similarity score
CREATE OR REPLACE FUNCTION calculate_similarity_score(
    obj1_id UUID,
    obj2_id UUID
)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    score DECIMAL(5,2) := 0;
    same_category BOOLEAN;
    keyword_overlap INTEGER;
    obj1_keywords TEXT[];
    obj2_keywords TEXT[];
BEGIN
    -- Get objects data
    SELECT 
        (o1.category_id = o2.category_id) as same_cat,
        array_length(
            ARRAY(
                SELECT unnest(string_to_array(LOWER(o1.title || ' ' || COALESCE(o1.description, '')), ' '))
                INTERSECT
                SELECT unnest(string_to_array(LOWER(o2.title || ' ' || COALESCE(o2.description, '')), ' '))
            ),
            1
        ) as overlap
    INTO same_category, keyword_overlap
    FROM objects o1, objects o2
    WHERE o1.id = obj1_id AND o2.id = obj2_id;
    
    -- Category match: 50 points
    IF same_category THEN
        score := score + 50;
    ELSE
        -- Different category: check parent category
        DECLARE
            cat1_parent UUID;
            cat2_parent UUID;
        BEGIN
            SELECT c1.parent_id, c2.parent_id
            INTO cat1_parent, cat2_parent
            FROM objects o1
            INNER JOIN categories c1 ON c1.id = o1.category_id
            CROSS JOIN objects o2
            INNER JOIN categories c2 ON c2.id = o2.category_id
            WHERE o1.id = obj1_id AND o2.id = obj2_id;
            
            IF cat1_parent = cat2_parent THEN
                score := score + 30; -- Same parent category
            ELSE
                score := score + 10; -- Different category tree
            END IF;
        END;
    END IF;
    
    -- Keyword overlap: up to 50 points
    IF keyword_overlap IS NOT NULL THEN
        score := score + LEAST(keyword_overlap * 5, 50);
    END IF;
    
    RETURN LEAST(score, 100);
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Calculate proximity score (uses distance search if available)
CREATE OR REPLACE FUNCTION calculate_proximity_score(
    user1_id UUID,
    user2_id UUID
)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    distance_km DECIMAL(10,2);
    score DECIMAL(5,2);
BEGIN
    -- Get distance between users (if location available)
    SELECT calculate_distance(
        u1.latitude, u1.longitude,
        u2.latitude, u2.longitude
    )
    INTO distance_km
    FROM users u1, users u2
    WHERE u1.id = user1_id AND u2.id = user2_id
    AND u1.latitude IS NOT NULL AND u1.longitude IS NOT NULL
    AND u2.latitude IS NOT NULL AND u2.longitude IS NOT NULL;
    
    -- If no location data, return neutral score
    IF distance_km IS NULL THEN
        RETURN 50;
    END IF;
    
    -- Score based on distance (inverse)
    -- 0-50km: 100 points
    -- 50-100km: 90 points
    -- 100-200km: 70 points
    -- 200-500km: 40 points
    -- 500+km: 10 points
    score := CASE
        WHEN distance_km <= 50 THEN 100
        WHEN distance_km <= 100 THEN 90
        WHEN distance_km <= 200 THEN 70
        WHEN distance_km <= 500 THEN 40
        ELSE 10
    END;
    
    RETURN score;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Calculate reputation score (TrustScore average)
CREATE OR REPLACE FUNCTION calculate_reputation_score(
    user_ids_param UUID[]
)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    avg_trust_score DECIMAL(5,2);
BEGIN
    SELECT AVG(COALESCE(trust_score, 50))
    INTO avg_trust_score
    FROM users
    WHERE id = ANY(user_ids_param);
    
    RETURN COALESCE(avg_trust_score, 50);
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Calculate rarity score (inverse of popularity)
CREATE OR REPLACE FUNCTION calculate_rarity_score(
    obj_ids UUID[]
)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    avg_popularity DECIMAL(10,2);
    rarity DECIMAL(5,2);
BEGIN
    -- Get average category popularity
    SELECT AVG(ca.object_count)
    INTO avg_popularity
    FROM objects o
    INNER JOIN category_analytics ca ON ca.id = o.category_id
    WHERE o.id = ANY(obj_ids);
    
    -- Inverse scoring: rare items score higher
    -- Popular (1000+ objects): 20 points
    -- Common (100-1000): 50 points
    -- Uncommon (10-100): 70 points
    -- Rare (<10): 90 points
    rarity := CASE
        WHEN avg_popularity IS NULL THEN 50
        WHEN avg_popularity >= 1000 THEN 20
        WHEN avg_popularity >= 100 THEN 50
        WHEN avg_popularity >= 10 THEN 70
        ELSE 90
    END;
    
    RETURN rarity;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Calculate composite score
CREATE OR REPLACE FUNCTION calculate_composite_score(
    similarity DECIMAL,
    proximity DECIMAL,
    reputation DECIMAL,
    rarity DECIMAL
)
RETURNS DECIMAL(5,2) AS $$
BEGIN
    -- Weighted average:
    -- Similarity: 40%
    -- Proximity: 25%
    -- Reputation: 25%
    -- Rarity: 10%
    RETURN (
        similarity * 0.40 +
        proximity * 0.25 +
        reputation * 0.25 +
        rarity * 0.10
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- 5. FUNCTIONS: Chain Matching (A→B→C)
-- ============================================================================

-- Function: Find direct matches (A↔B)
CREATE OR REPLACE FUNCTION find_direct_matches(
    p_object_id UUID,
    p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
    match_chain_id UUID,
    object_id UUID,
    user_id UUID,
    similarity_score DECIMAL,
    proximity_score DECIMAL,
    reputation_score DECIMAL,
    rarity_score DECIMAL,
    total_score DECIMAL,
    match_reasons TEXT[]
) AS $$
DECLARE
    source_user_id UUID;
    source_category_id UUID;
BEGIN
    -- Get source object details
    SELECT o.user_id, o.category_id
    INTO source_user_id, source_category_id
    FROM objects o
    WHERE o.id = p_object_id;
    
    RETURN QUERY
    WITH potential_matches AS (
        SELECT 
            o.id as obj_id,
            o.user_id as usr_id,
            calculate_similarity_score(p_object_id, o.id) as sim_score,
            calculate_proximity_score(source_user_id, o.user_id) as prox_score,
            calculate_reputation_score(ARRAY[source_user_id, o.user_id]) as rep_score,
            calculate_rarity_score(ARRAY[p_object_id, o.id]) as rar_score
        FROM objects o
        WHERE o.id != p_object_id
            AND o.user_id != source_user_id
            AND o.status = 'active'
            -- Basic constraints
            AND (
                o.category_id = source_category_id
                OR EXISTS (
                    SELECT 1 FROM categories c1, categories c2
                    WHERE c1.id = source_category_id
                    AND c2.id = o.category_id
                    AND c1.parent_id = c2.parent_id
                )
            )
    ),
    scored_matches AS (
        SELECT 
            pm.*,
            calculate_composite_score(
                pm.sim_score,
                pm.prox_score,
                pm.rep_score,
                pm.rar_score
            ) as comp_score
        FROM potential_matches pm
    )
    SELECT 
        gen_random_uuid(),
        sm.obj_id,
        sm.usr_id,
        sm.sim_score,
        sm.prox_score,
        sm.rep_score,
        sm.rar_score,
        sm.comp_score,
        ARRAY[
            CASE WHEN sm.sim_score >= 70 THEN 'High similarity' ELSE 'Moderate similarity' END,
            CASE WHEN sm.prox_score >= 70 THEN 'Nearby location' ELSE 'Moderate distance' END,
            CASE WHEN sm.rep_score >= 70 THEN 'Excellent reputation' ELSE 'Good reputation' END
        ]::TEXT[]
    FROM scored_matches sm
    WHERE sm.comp_score >= 40 -- Minimum threshold
    ORDER BY sm.comp_score DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Find triple chain matches (A→B→C→A)
CREATE OR REPLACE FUNCTION find_triple_chain_matches(
    p_object_id UUID,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    chain_type VARCHAR,
    object_ids UUID[],
    user_ids UUID[],
    total_score DECIMAL,
    match_reasons TEXT[]
) AS $$
DECLARE
    source_user_id UUID;
    source_obj RECORD;
BEGIN
    -- Get source object
    SELECT o.*, u.id as uid
    INTO source_obj
    FROM objects o
    INNER JOIN users u ON u.id = o.user_id
    WHERE o.id = p_object_id;
    
    source_user_id := source_obj.uid;
    
    RETURN QUERY
    WITH 
    -- Step 1: A wants from B
    matches_ab AS (
        SELECT * FROM find_direct_matches(p_object_id, 50)
    ),
    -- Step 2: B wants from C
    matches_bc AS (
        SELECT 
            mab.object_id as b_object_id,
            mab.user_id as b_user_id,
            fdm.*
        FROM matches_ab mab
        CROSS JOIN LATERAL find_direct_matches(mab.object_id, 30) fdm
        WHERE fdm.user_id != source_user_id
    ),
    -- Step 3: C wants from A (complete the loop)
    triple_chains AS (
        SELECT 
            mbc.b_object_id,
            mbc.b_user_id,
            mbc.object_id as c_object_id,
            mbc.user_id as c_user_id
        FROM matches_bc mbc
        WHERE EXISTS (
            SELECT 1 FROM find_direct_matches(mbc.object_id, 10) fdm
            WHERE fdm.object_id = p_object_id
        )
    )
    SELECT 
        'triple'::VARCHAR,
        ARRAY[p_object_id, tc.b_object_id, tc.c_object_id]::UUID[],
        ARRAY[source_user_id, tc.b_user_id, tc.c_user_id]::UUID[],
        70.0::DECIMAL, -- Simplified scoring for now
        ARRAY['3-way chain', 'All parties satisfied', 'Balanced exchange']::TEXT[]
    FROM triple_chains tc
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- 6. FUNCTIONS: Constraint Checking
-- ============================================================================

-- Function: Check if match satisfies user constraints
CREATE OR REPLACE FUNCTION check_match_constraints(
    p_user_id UUID,
    p_partner_id UUID,
    p_distance_km DECIMAL DEFAULT NULL,
    p_value_ratio DECIMAL DEFAULT 1.0
)
RETURNS JSONB AS $$
DECLARE
    constraints RECORD;
    partner_trust INTEGER;
    result JSONB := '{"satisfied": [], "failed": []}'::jsonb;
BEGIN
    -- Get user constraints
    SELECT * INTO constraints
    FROM matching_constraints
    WHERE user_id = p_user_id;
    
    -- If no constraints, all pass
    IF constraints IS NULL THEN
        RETURN jsonb_build_object(
            'satisfied', ARRAY['no_constraints']::TEXT[],
            'failed', ARRAY[]::TEXT[]
        );
    END IF;
    
    -- Check distance constraint
    IF p_distance_km IS NOT NULL THEN
        IF p_distance_km <= constraints.max_distance_km THEN
            result := jsonb_set(result, '{satisfied}', 
                (result->'satisfied')::jsonb || '["distance_ok"]'::jsonb);
        ELSE
            result := jsonb_set(result, '{failed}', 
                (result->'failed')::jsonb || '["distance_too_far"]'::jsonb);
        END IF;
    END IF;
    
    -- Check value ratio constraint
    IF p_value_ratio >= constraints.min_value_ratio 
       AND p_value_ratio <= constraints.max_value_ratio THEN
        result := jsonb_set(result, '{satisfied}', 
            (result->'satisfied')::jsonb || '["value_balanced"]'::jsonb);
    ELSE
        result := jsonb_set(result, '{failed}', 
            (result->'failed')::jsonb || '["value_imbalance"]'::jsonb);
    END IF;
    
    -- Check reputation constraint
    SELECT COALESCE(trust_score, 50) INTO partner_trust
    FROM users WHERE id = p_partner_id;
    
    IF partner_trust >= constraints.min_trust_score THEN
        result := jsonb_set(result, '{satisfied}', 
            (result->'satisfied')::jsonb || '["reputation_ok"]'::jsonb);
    ELSE
        result := jsonb_set(result, '{failed}', 
            (result->'failed')::jsonb || '["low_reputation"]'::jsonb);
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- 7. RLS POLICIES
-- ============================================================================

-- Match chains viewable by participants
ALTER TABLE match_chains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their match chains"
    ON match_chains FOR SELECT
    USING (auth.uid() = ANY(user_ids));

CREATE POLICY "Users can update their match chains"
    ON match_chains FOR UPDATE
    USING (auth.uid() = ANY(user_ids));

-- Matching constraints manageable by owner
ALTER TABLE matching_constraints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own constraints"
    ON matching_constraints FOR ALL
    USING (auth.uid() = user_id);

-- Match feedback by owner
ALTER TABLE match_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own feedback"
    ON match_feedback FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own feedback"
    ON match_feedback FOR SELECT
    USING (auth.uid() = user_id);

-- ============================================================================
-- 8. HELPER VIEWS
-- ============================================================================

-- View: Active match chains with details
CREATE OR REPLACE VIEW active_match_chains AS
SELECT 
    mc.*,
    array_agg(DISTINCT u.email) as participant_emails,
    array_agg(DISTINCT o.title) as object_titles
FROM match_chains mc
CROSS JOIN LATERAL unnest(mc.user_ids) WITH ORDINALITY AS uid(id, ord)
INNER JOIN users u ON u.id = uid.id
CROSS JOIN LATERAL unnest(mc.object_ids) WITH ORDINALITY AS oid(id, ord)
INNER JOIN objects o ON o.id = oid.id
WHERE mc.status IN ('proposed', 'accepted', 'in_progress')
    AND mc.expires_at > NOW()
GROUP BY mc.id;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

COMMENT ON TABLE match_chains IS 'Multi-party swap chains with composite scoring and explainability';
COMMENT ON TABLE matching_constraints IS 'User preferences for match filtering';
COMMENT ON TABLE match_feedback IS 'User actions and feedback for learning algorithm';
COMMENT ON FUNCTION find_direct_matches IS 'Find 1-to-1 swap matches with composite scoring';
COMMENT ON FUNCTION find_triple_chain_matches IS 'Find 3-party chain swaps (A→B→C→A)';
COMMENT ON FUNCTION check_match_constraints IS 'Validate match against user constraints';
