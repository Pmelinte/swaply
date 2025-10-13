-- ============================================================================
-- FRAUD DETECTION SYSTEM
-- Automatic detection of suspicious activity and moderation queue
-- ============================================================================

-- ============================================================================
-- TABLES
-- ============================================================================

-- Fraud signals detected by automated rules
CREATE TABLE IF NOT EXISTS fraud_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  signal_type TEXT NOT NULL CHECK (signal_type IN (
    'velocity_posting',      -- Too many posts in short time
    'velocity_messaging',    -- Too many messages in short time
    'device_fingerprint',    -- Suspicious device patterns
    'ip_pattern',            -- VPN, proxy, or suspicious IP
    'suspicious_text',       -- Spam keywords, external links
    'fake_photos',           -- Stock photos or duplicates
    'trust_score_drop',      -- Sudden reputation decline
    'multiple_accounts',     -- Same device/IP, multiple accounts
    'policy_violation'       -- Terms of service violations
  )),
  severity TEXT NOT NULL DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  
  -- Context
  object_id UUID REFERENCES objects(id) ON DELETE CASCADE,
  related_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Signal data
  signal_data JSONB NOT NULL DEFAULT '{}',
  -- Examples:
  -- velocity: { posts_count: 10, time_window_minutes: 15 }
  -- suspicious_text: { keywords: ["купить", "whatsapp", "telegram"], external_links: 2 }
  -- ip_pattern: { ip: "...", country: "RU", is_vpn: true }
  
  -- Auto-resolution
  auto_resolved BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  resolution_note TEXT,
  
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Moderation queue for manual review
CREATE TABLE IF NOT EXISTS moderation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Item to moderate
  object_id UUID NOT NULL REFERENCES objects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Priority (0-100, calculated from fraud signals)
  priority_score INTEGER NOT NULL DEFAULT 0 CHECK (priority_score >= 0 AND priority_score <= 100),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'approved', 'rejected', 'escalated')),
  
  -- Assignment
  assigned_to UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ,
  
  -- Review
  reviewed_at TIMESTAMPTZ,
  review_decision TEXT CHECK (review_decision IN ('approve', 'reject', 'flag_user', 'ban_user', 'request_verification')),
  review_notes TEXT,
  
  -- Flags count (from other users)
  user_flags_count INTEGER NOT NULL DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User flags (reports from other users)
CREATE TABLE IF NOT EXISTS user_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- What is being flagged
  flagged_object_id UUID REFERENCES objects(id) ON DELETE CASCADE,
  flagged_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Who flagged
  flagged_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Reason
  flag_type TEXT NOT NULL CHECK (flag_type IN (
    'inappropriate_content',  -- Offensive, adult, violent
    'spam',                   -- Commercial spam, ads
    'scam',                   -- Fraudulent activity
    'fake_item',              -- Item doesn't exist or misrepresented
    'stolen',                 -- Suspected stolen goods
    'dangerous',              -- Dangerous items (weapons, drugs)
    'duplicate',              -- Duplicate posting
    'other'                   -- Other reason
  )),
  reason_details TEXT,
  
  -- Evidence
  evidence_urls TEXT[], -- Screenshots, links
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'validated', 'dismissed')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  
  -- Prevent duplicate flags
  CONSTRAINT unique_flag_per_user UNIQUE (flagged_object_id, flagged_by),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Moderation actions log
CREATE TABLE IF NOT EXISTS moderation_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  moderator_id UUID NOT NULL REFERENCES auth.users(id),
  action_type TEXT NOT NULL CHECK (action_type IN (
    'approve_object',
    'reject_object',
    'delete_object',
    'flag_user',
    'warn_user',
    'suspend_user',
    'ban_user',
    'restore_object',
    'escalate'
  )),
  
  -- Target
  target_object_id UUID REFERENCES objects(id),
  target_user_id UUID REFERENCES auth.users(id),
  
  -- Context
  reason TEXT NOT NULL,
  notes TEXT,
  duration_days INTEGER, -- For suspensions
  
  -- Audit
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Fraud signals
CREATE INDEX IF NOT EXISTS idx_fraud_signals_user ON fraud_signals(user_id);
CREATE INDEX IF NOT EXISTS idx_fraud_signals_object ON fraud_signals(object_id);
CREATE INDEX IF NOT EXISTS idx_fraud_signals_severity ON fraud_signals(severity) WHERE NOT auto_resolved;
CREATE INDEX IF NOT EXISTS idx_fraud_signals_type ON fraud_signals(signal_type);
CREATE INDEX IF NOT EXISTS idx_fraud_signals_recent ON fraud_signals(detected_at DESC) WHERE NOT auto_resolved;

-- Moderation queue
CREATE INDEX IF NOT EXISTS idx_moderation_queue_status ON moderation_queue(status) WHERE status IN ('pending', 'in_review');
CREATE INDEX IF NOT EXISTS idx_moderation_queue_priority ON moderation_queue(priority_score DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_assigned ON moderation_queue(assigned_to) WHERE status = 'in_review';
CREATE INDEX IF NOT EXISTS idx_moderation_queue_object ON moderation_queue(object_id);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_user ON moderation_queue(user_id);

-- User flags
CREATE INDEX IF NOT EXISTS idx_user_flags_object ON user_flags(flagged_object_id);
CREATE INDEX IF NOT EXISTS idx_user_flags_user ON user_flags(flagged_user_id);
CREATE INDEX IF NOT EXISTS idx_user_flags_by ON user_flags(flagged_by);
CREATE INDEX IF NOT EXISTS idx_user_flags_status ON user_flags(status);

-- Moderation actions
CREATE INDEX IF NOT EXISTS idx_moderation_actions_moderator ON moderation_actions(moderator_id);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_target_user ON moderation_actions(target_user_id);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_recent ON moderation_actions(created_at DESC);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Detect velocity abuse (posting too fast)
CREATE OR REPLACE FUNCTION detect_velocity_abuse(
  p_user_id UUID,
  p_time_window_minutes INTEGER DEFAULT 60,
  p_max_posts INTEGER DEFAULT 10
) RETURNS BOOLEAN AS $$
DECLARE
  v_posts_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO v_posts_count
  FROM objects
  WHERE user_id = p_user_id
    AND created_at > NOW() - (p_time_window_minutes || ' minutes')::INTERVAL;
  
  IF v_posts_count >= p_max_posts THEN
    -- Create fraud signal
    INSERT INTO fraud_signals (user_id, signal_type, severity, signal_data)
    VALUES (
      p_user_id,
      'velocity_posting',
      CASE
        WHEN v_posts_count >= p_max_posts * 2 THEN 'critical'
        WHEN v_posts_count >= p_max_posts * 1.5 THEN 'high'
        ELSE 'medium'
      END,
      jsonb_build_object(
        'posts_count', v_posts_count,
        'time_window_minutes', p_time_window_minutes,
        'threshold', p_max_posts
      )
    );
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Calculate priority score for moderation queue
CREATE OR REPLACE FUNCTION calculate_priority_score(p_object_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_score INTEGER := 0;
  v_user_id UUID;
  v_signal_count INTEGER;
  v_flag_count INTEGER;
  v_user_trust_score DECIMAL;
BEGIN
  -- Get user_id
  SELECT user_id INTO v_user_id FROM objects WHERE id = p_object_id;
  IF v_user_id IS NULL THEN RETURN 0; END IF;
  
  -- Fraud signals (30 points max)
  SELECT COUNT(*)
  INTO v_signal_count
  FROM fraud_signals
  WHERE (user_id = v_user_id OR object_id = p_object_id)
    AND NOT auto_resolved
    AND detected_at > NOW() - INTERVAL '30 days';
  
  v_score := v_score + LEAST(v_signal_count * 10, 30);
  
  -- User flags (40 points max)
  SELECT COUNT(*)
  INTO v_flag_count
  FROM user_flags
  WHERE flagged_object_id = p_object_id
    AND status IN ('pending', 'validated');
  
  v_score := v_score + LEAST(v_flag_count * 20, 40);
  
  -- Low trust score (30 points max)
  SELECT trust_score INTO v_user_trust_score
  FROM users WHERE id = v_user_id;
  
  IF v_user_trust_score IS NOT NULL THEN
    v_score := v_score + GREATEST(0, 30 - FLOOR(v_user_trust_score / 3));
  END IF;
  
  RETURN LEAST(v_score, 100);
END;
$$ LANGUAGE plpgsql;

-- Auto-flag suspicious content
CREATE OR REPLACE FUNCTION auto_flag_suspicious(p_object_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_object RECORD;
  v_suspicious BOOLEAN := FALSE;
  v_reasons TEXT[] := ARRAY[]::TEXT[];
  v_spam_keywords TEXT[] := ARRAY[
    'купить', 'whatsapp', 'telegram', 'viber', 'купить', 'продать',
    'bitcoin', 'crypto', 'forex', 'investment', 'guaranteed profit',
    'click here', 'free money', 'earn fast', 'work from home'
  ];
  v_keyword TEXT;
BEGIN
  SELECT * INTO v_object FROM objects WHERE id = p_object_id;
  IF v_object.id IS NULL THEN RETURN FALSE; END IF;
  
  -- Check for spam keywords
  FOREACH v_keyword IN ARRAY v_spam_keywords LOOP
    IF LOWER(v_object.title) LIKE '%' || v_keyword || '%' OR
       LOWER(v_object.description) LIKE '%' || v_keyword || '%' THEN
      v_suspicious := TRUE;
      v_reasons := array_append(v_reasons, 'spam_keyword: ' || v_keyword);
    END IF;
  END LOOP;
  
  -- Check for phone numbers in description
  IF v_object.description ~ '\d{10,}' THEN
    v_suspicious := TRUE;
    v_reasons := array_append(v_reasons, 'phone_number_in_description');
  END IF;
  
  -- Check for URLs
  IF v_object.description ~ 'https?://' THEN
    v_suspicious := TRUE;
    v_reasons := array_append(v_reasons, 'external_url');
  END IF;
  
  -- If suspicious, create signal
  IF v_suspicious THEN
    INSERT INTO fraud_signals (user_id, object_id, signal_type, severity, signal_data)
    VALUES (
      v_object.user_id,
      p_object_id,
      'suspicious_text',
      'medium',
      jsonb_build_object('reasons', v_reasons)
    );
    
    -- Add to moderation queue
    INSERT INTO moderation_queue (object_id, user_id, priority_score)
    VALUES (p_object_id, v_object.user_id, calculate_priority_score(p_object_id))
    ON CONFLICT DO NOTHING;
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Update moderation queue priority
CREATE OR REPLACE FUNCTION update_moderation_priority(p_object_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE moderation_queue
  SET priority_score = calculate_priority_score(p_object_id),
      updated_at = NOW()
  WHERE object_id = p_object_id
    AND status IN ('pending', 'in_review');
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-check new objects for suspicious content
CREATE OR REPLACE FUNCTION trigger_auto_flag_new_object()
RETURNS TRIGGER AS $$
BEGIN
  -- Check velocity
  PERFORM detect_velocity_abuse(NEW.user_id);
  
  -- Check content
  PERFORM auto_flag_suspicious(NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_flag_new_object
AFTER INSERT ON objects
FOR EACH ROW
EXECUTE FUNCTION trigger_auto_flag_new_object();

-- Update moderation priority when new flag added
CREATE OR REPLACE FUNCTION trigger_update_priority_on_flag()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.flagged_object_id IS NOT NULL THEN
    -- Update flag count
    UPDATE moderation_queue
    SET user_flags_count = user_flags_count + 1,
        updated_at = NOW()
    WHERE object_id = NEW.flagged_object_id;
    
    -- Update priority
    PERFORM update_moderation_priority(NEW.flagged_object_id);
    
    -- Create moderation queue entry if doesn't exist
    INSERT INTO moderation_queue (object_id, user_id, priority_score)
    SELECT NEW.flagged_object_id, o.user_id, calculate_priority_score(NEW.flagged_object_id)
    FROM objects o WHERE o.id = NEW.flagged_object_id
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_priority_on_flag
AFTER INSERT ON user_flags
FOR EACH ROW
EXECUTE FUNCTION trigger_update_priority_on_flag();

-- Update timestamps
CREATE TRIGGER update_fraud_signals_updated_at
BEFORE UPDATE ON fraud_signals
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_moderation_queue_updated_at
BEFORE UPDATE ON moderation_queue
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Fraud signals: Only admins and moderators
ALTER TABLE fraud_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all fraud signals" ON fraud_signals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'moderator')
    )
  );

-- Moderation queue: Only admins and moderators
ALTER TABLE moderation_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Moderators can view moderation queue" ON moderation_queue
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Moderators can update moderation queue" ON moderation_queue
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'moderator')
    )
  );

-- User flags: Users can flag, moderators can view all
ALTER TABLE user_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create flags" ON user_flags
  FOR INSERT WITH CHECK (flagged_by = auth.uid());

CREATE POLICY "Users can view own flags" ON user_flags
  FOR SELECT USING (flagged_by = auth.uid());

CREATE POLICY "Moderators can view all flags" ON user_flags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Moderators can update flags" ON user_flags
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'moderator')
    )
  );

-- Moderation actions: Only admins and moderators
ALTER TABLE moderation_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Moderators can create actions" ON moderation_actions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Moderators can view actions" ON moderation_actions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'moderator')
    )
  );

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Moderation queue with aggregated data
CREATE OR REPLACE VIEW moderation_queue_view AS
SELECT
  mq.*,
  o.title AS object_title,
  o.status AS object_status,
  u.full_name AS user_name,
  u.email AS user_email,
  u.trust_score AS user_trust_score,
  
  -- Fraud signals count
  (SELECT COUNT(*)
   FROM fraud_signals fs
   WHERE (fs.object_id = mq.object_id OR fs.user_id = mq.user_id)
     AND NOT fs.auto_resolved
  ) AS fraud_signals_count,
  
  -- Recent flags
  (SELECT jsonb_agg(
     jsonb_build_object(
       'id', uf.id,
       'type', uf.flag_type,
       'reason', uf.reason_details,
       'flagged_by', uf.flagged_by,
       'created_at', uf.created_at
     )
   )
   FROM user_flags uf
   WHERE uf.flagged_object_id = mq.object_id
     AND uf.status = 'pending'
   ORDER BY uf.created_at DESC
   LIMIT 5
  ) AS recent_flags

FROM moderation_queue mq
JOIN objects o ON o.id = mq.object_id
JOIN users u ON u.id = mq.user_id;

-- User risk profile
CREATE OR REPLACE VIEW user_risk_profile AS
SELECT
  u.id AS user_id,
  u.full_name,
  u.email,
  u.trust_score,
  
  -- Risk score (0-100)
  (
    -- Active fraud signals (40 points)
    (SELECT COUNT(*) * 10
     FROM fraud_signals fs
     WHERE fs.user_id = u.id
       AND NOT fs.auto_resolved
       AND fs.detected_at > NOW() - INTERVAL '30 days'
     LIMIT 4
    ) +
    
    -- Flags received (30 points)
    (SELECT COUNT(*) * 10
     FROM user_flags uf
     WHERE uf.flagged_user_id = u.id
       AND uf.status IN ('pending', 'validated')
     LIMIT 3
    ) +
    
    -- Low trust score (30 points)
    GREATEST(0, 30 - FLOOR(u.trust_score / 3))
  ) AS risk_score,
  
  -- Stats
  (SELECT COUNT(*) FROM objects WHERE user_id = u.id) AS objects_count,
  (SELECT COUNT(*) FROM fraud_signals WHERE user_id = u.id) AS fraud_signals_count,
  (SELECT COUNT(*) FROM user_flags WHERE flagged_user_id = u.id) AS flags_received

FROM users u;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE fraud_signals IS 'Automated fraud detection signals';
COMMENT ON TABLE moderation_queue IS 'Manual moderation queue with priority scoring';
COMMENT ON TABLE user_flags IS 'User-reported content flags';
COMMENT ON TABLE moderation_actions IS 'Audit log of moderator actions';
COMMENT ON FUNCTION detect_velocity_abuse IS 'Detect users posting too frequently';
COMMENT ON FUNCTION calculate_priority_score IS 'Calculate moderation priority (0-100)';
COMMENT ON FUNCTION auto_flag_suspicious IS 'Auto-detect spam/scam content';
