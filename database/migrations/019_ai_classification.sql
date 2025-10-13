-- ============================================================================
-- AI CLASSIFICATION INFRASTRUCTURE
-- OpenAI-ready with graceful degradation to keyword matching
-- ============================================================================

-- ============================================================================
-- TABLES
-- ============================================================================

-- Classification queue
CREATE TABLE IF NOT EXISTS ai_classification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  object_id UUID NOT NULL REFERENCES objects(id) ON DELETE CASCADE,
  
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  priority INTEGER NOT NULL DEFAULT 0, -- Higher = more urgent
  
  -- Processing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Classification cache (results storage)
CREATE TABLE IF NOT EXISTS classification_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  object_id UUID NOT NULL UNIQUE REFERENCES objects(id) ON DELETE CASCADE,
  
  -- Embeddings (for semantic search)
  embeddings vector(1536), -- OpenAI text-embedding-3-small dimension
  
  -- Predictions
  category_predictions JSONB NOT NULL, -- Array of {category_id, score, confidence}
  predicted_category_id UUID REFERENCES categories(id),
  
  -- Method used
  method TEXT NOT NULL CHECK (method IN ('openai', 'clip', 'keyword')),
  confidence_score DECIMAL(5,2), -- 0-100
  
  cached_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_classification_queue_status ON ai_classification_queue(status, priority DESC) WHERE status IN ('pending', 'processing');
CREATE INDEX IF NOT EXISTS idx_classification_queue_object ON ai_classification_queue(object_id);

CREATE INDEX IF NOT EXISTS idx_classification_cache_object ON classification_cache(object_id);
CREATE INDEX IF NOT EXISTS idx_classification_cache_category ON classification_cache(predicted_category_id);

-- Vector index (if pgvector extension is available)
-- CREATE INDEX IF NOT EXISTS idx_classification_embeddings ON classification_cache USING ivfflat (embeddings vector_cosine_ops);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Queue object for classification
CREATE OR REPLACE FUNCTION queue_for_classification(
  p_object_id UUID,
  p_priority INTEGER DEFAULT 0
) RETURNS UUID AS $$
DECLARE
  v_queue_id UUID;
BEGIN
  INSERT INTO ai_classification_queue (object_id, priority)
  VALUES (p_object_id, p_priority)
  RETURNING id INTO v_queue_id;
  
  RETURN v_queue_id;
END;
$$ LANGUAGE plpgsql;

-- Get classification from cache
CREATE OR REPLACE FUNCTION get_classification_from_cache(p_object_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_cache RECORD;
BEGIN
  SELECT * INTO v_cache
  FROM classification_cache
  WHERE object_id = p_object_id;
  
  IF v_cache.id IS NULL THEN
    RETURN NULL;
  END IF;
  
  RETURN jsonb_build_object(
    'predictions', v_cache.category_predictions,
    'predicted_category_id', v_cache.predicted_category_id,
    'method', v_cache.method,
    'confidence', v_cache.confidence_score,
    'cached_at', v_cache.cached_at
  );
END;
$$ LANGUAGE plpgsql;

-- Update classification cache
CREATE OR REPLACE FUNCTION update_classification_cache(
  p_object_id UUID,
  p_predictions JSONB,
  p_method TEXT,
  p_embeddings vector DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  v_predicted_category_id UUID;
  v_confidence_score DECIMAL;
BEGIN
  -- Extract top prediction
  SELECT (p_predictions->0->>'category_id')::UUID INTO v_predicted_category_id;
  SELECT (p_predictions->0->>'score')::DECIMAL INTO v_confidence_score;
  
  INSERT INTO classification_cache (
    object_id,
    category_predictions,
    predicted_category_id,
    method,
    confidence_score,
    embeddings
  ) VALUES (
    p_object_id,
    p_predictions,
    v_predicted_category_id,
    p_method,
    v_confidence_score,
    p_embeddings
  )
  ON CONFLICT (object_id) DO UPDATE SET
    category_predictions = EXCLUDED.category_predictions,
    predicted_category_id = EXCLUDED.predicted_category_id,
    method = EXCLUDED.method,
    confidence_score = EXCLUDED.confidence_score,
    embeddings = EXCLUDED.embeddings,
    cached_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Find similar objects by embeddings
CREATE OR REPLACE FUNCTION find_similar_objects(
  p_embedding vector,
  p_limit INTEGER DEFAULT 10
) RETURNS TABLE(
  object_id UUID,
  similarity FLOAT
) AS $$
BEGIN
  IF p_embedding IS NULL THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT
    cc.object_id,
    1 - (cc.embeddings <=> p_embedding) AS similarity
  FROM classification_cache cc
  WHERE cc.embeddings IS NOT NULL
  ORDER BY cc.embeddings <=> p_embedding
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update timestamps
CREATE TRIGGER update_classification_queue_updated_at
BEFORE UPDATE ON ai_classification_queue
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Queue: Read-only for users, admins can manage
ALTER TABLE ai_classification_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view classification queue" ON ai_classification_queue
  FOR SELECT USING (TRUE);

CREATE POLICY "Admins can manage classification queue" ON ai_classification_queue
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'moderator'))
  );

-- Cache: Read-only for everyone
ALTER TABLE classification_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view classification cache" ON classification_cache
  FOR SELECT USING (TRUE);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE ai_classification_queue IS 'Queue for objects pending AI classification';
COMMENT ON TABLE classification_cache IS 'Cached AI classification results with embeddings';
COMMENT ON FUNCTION queue_for_classification IS 'Add object to classification queue';
COMMENT ON FUNCTION get_classification_from_cache IS 'Get cached classification results';
COMMENT ON FUNCTION update_classification_cache IS 'Update classification cache with new predictions';
COMMENT ON FUNCTION find_similar_objects IS 'Find similar objects using vector embeddings';
