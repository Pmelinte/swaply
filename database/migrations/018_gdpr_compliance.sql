-- ============================================================================
-- GDPR COMPLIANCE TOOLS
-- Data export, erasure, consent management, audit logging
-- ============================================================================

-- ============================================================================
-- TABLES
-- ============================================================================

-- GDPR data requests (export/erasure)
CREATE TABLE IF NOT EXISTS gdpr_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  request_type TEXT NOT NULL CHECK (request_type IN ('export', 'erasure', 'rectification', 'portability')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  
  -- Request details
  reason TEXT,
  data_categories TEXT[], -- Which data to export/delete
  
  -- Processing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES auth.users(id), -- Admin who processed
  
  -- Export data
  data_export_url TEXT, -- Signed URL for download
  export_expires_at TIMESTAMPTZ, -- URL expiration (72 hours default)
  
  -- Erasure confirmation
  anonymization_completed BOOLEAN DEFAULT FALSE,
  backup_retained_until TIMESTAMPTZ, -- Legal backup retention (30 days)
  
  -- Audit
  ip_address INET,
  user_agent TEXT,
  
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Data retention policies
CREATE TABLE IF NOT EXISTS data_retention_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  data_type TEXT NOT NULL UNIQUE, -- 'objects', 'messages', 'swap_requests', 'notifications', etc.
  retention_days INTEGER NOT NULL, -- How long to keep
  auto_delete BOOLEAN NOT NULL DEFAULT FALSE, -- Automatic deletion when expired
  
  -- Grace period before deletion
  grace_period_days INTEGER DEFAULT 7,
  
  -- Legal basis
  legal_basis TEXT, -- 'contract', 'consent', 'legitimate_interest', etc.
  notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Consent log
CREATE TABLE IF NOT EXISTS consent_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  consent_type TEXT NOT NULL CHECK (consent_type IN (
    'terms_of_service',
    'privacy_policy',
    'marketing_emails',
    'analytics',
    'personalization',
    'location_sharing',
    'photo_usage',
    'data_sharing_partners'
  )),
  
  granted BOOLEAN NOT NULL,
  
  -- Version tracking
  policy_version TEXT, -- '1.0', '2.0', etc.
  
  -- Context
  consent_method TEXT CHECK (consent_method IN ('explicit', 'implicit', 'updated', 'withdrawn')),
  ip_address INET,
  user_agent TEXT,
  
  -- Withdrawal
  withdrawn_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit log (all sensitive operations)
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Who
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- What
  action_type TEXT NOT NULL CHECK (action_type IN (
    'data_access',
    'data_export',
    'data_delete',
    'data_update',
    'consent_given',
    'consent_withdrawn',
    'privacy_settings_changed',
    'account_deleted',
    'password_changed',
    'email_changed',
    'admin_access',
    'moderation_action'
  )),
  
  -- Target
  target_table TEXT,
  target_id UUID,
  affected_data JSONB, -- What was changed (without sensitive values)
  
  -- Context
  reason TEXT,
  ip_address INET,
  user_agent TEXT,
  
  -- Result
  success BOOLEAN NOT NULL DEFAULT TRUE,
  error_message TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Data processing agreements (for third-party processors)
CREATE TABLE IF NOT EXISTS data_processors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  processor_name TEXT NOT NULL,
  processor_type TEXT NOT NULL CHECK (processor_type IN ('cloud_storage', 'analytics', 'email', 'cdn', 'payment', 'other')),
  
  -- Contact
  contact_email TEXT,
  dpo_email TEXT, -- Data Protection Officer
  
  -- Agreement
  agreement_url TEXT,
  agreement_signed_at DATE,
  
  -- Data categories processed
  data_categories TEXT[] NOT NULL,
  processing_purposes TEXT[] NOT NULL,
  
  -- Location
  data_location TEXT, -- EU, US, etc.
  standard_clauses BOOLEAN DEFAULT FALSE, -- SCCs
  
  active BOOLEAN NOT NULL DEFAULT TRUE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_gdpr_requests_user ON gdpr_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_gdpr_requests_status ON gdpr_requests(status) WHERE status IN ('pending', 'processing');
CREATE INDEX IF NOT EXISTS idx_gdpr_requests_type ON gdpr_requests(request_type);

CREATE INDEX IF NOT EXISTS idx_consent_log_user ON consent_log(user_id);
CREATE INDEX IF NOT EXISTS idx_consent_log_type ON consent_log(consent_type);
CREATE INDEX IF NOT EXISTS idx_consent_log_granted ON consent_log(granted) WHERE granted = TRUE;
CREATE INDEX IF NOT EXISTS idx_consent_log_recent ON consent_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_admin ON audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_recent ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_target ON audit_log(target_table, target_id);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Request data export
CREATE OR REPLACE FUNCTION request_data_export(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
  v_request_id UUID;
BEGIN
  INSERT INTO gdpr_requests (user_id, request_type)
  VALUES (p_user_id, 'export')
  RETURNING id INTO v_request_id;
  
  -- Log audit
  INSERT INTO audit_log (user_id, action_type, reason)
  VALUES (p_user_id, 'data_export', 'User requested data export');
  
  RETURN v_request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Process data export (generate JSON)
CREATE OR REPLACE FUNCTION process_data_export(p_request_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_export_data JSONB;
BEGIN
  -- Get user_id
  SELECT user_id INTO v_user_id
  FROM gdpr_requests
  WHERE id = p_request_id;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Request not found';
  END IF;
  
  -- Build export JSON
  v_export_data := jsonb_build_object(
    'user', (SELECT row_to_json(u.*) FROM users u WHERE u.id = v_user_id),
    'objects', (SELECT jsonb_agg(row_to_json(o.*)) FROM objects o WHERE o.user_id = v_user_id),
    'swap_requests_sent', (SELECT jsonb_agg(row_to_json(sr.*)) FROM swap_requests sr WHERE sr.requester_id = v_user_id),
    'swap_requests_received', (SELECT jsonb_agg(row_to_json(sr.*)) FROM swap_requests sr WHERE sr.owner_id = v_user_id),
    'messages_sent', (SELECT jsonb_agg(row_to_json(m.*)) FROM messages m WHERE m.sender_id = v_user_id),
    'messages_received', (SELECT jsonb_agg(row_to_json(m.*)) FROM messages m WHERE m.receiver_id = v_user_id),
    'notifications', (SELECT jsonb_agg(row_to_json(n.*)) FROM notifications n WHERE n.user_id = v_user_id),
    'user_interests', (SELECT jsonb_agg(row_to_json(ui.*)) FROM user_interests ui WHERE ui.user_id = v_user_id),
    'user_preferences', (SELECT row_to_json(up.*) FROM user_preferences up WHERE up.user_id = v_user_id),
    'user_collections', (SELECT jsonb_agg(row_to_json(uc.*)) FROM user_collections uc WHERE uc.user_id = v_user_id),
    'consent_log', (SELECT jsonb_agg(row_to_json(cl.*)) FROM consent_log cl WHERE cl.user_id = v_user_id),
    'export_date', NOW()
  );
  
  -- Update request
  UPDATE gdpr_requests
  SET status = 'completed',
      completed_at = NOW()
  WHERE id = p_request_id;
  
  RETURN v_export_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Request data erasure (anonymization)
CREATE OR REPLACE FUNCTION request_data_erasure(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
  v_request_id UUID;
BEGIN
  INSERT INTO gdpr_requests (user_id, request_type)
  VALUES (p_user_id, 'erasure')
  RETURNING id INTO v_request_id;
  
  -- Log audit
  INSERT INTO audit_log (user_id, action_type, reason)
  VALUES (p_user_id, 'data_delete', 'User requested data erasure');
  
  RETURN v_request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Process data erasure
CREATE OR REPLACE FUNCTION process_data_erasure(p_request_id UUID)
RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
  v_anonymous_email TEXT;
BEGIN
  -- Get user_id
  SELECT user_id INTO v_user_id
  FROM gdpr_requests
  WHERE id = p_request_id;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Request not found';
  END IF;
  
  -- Generate anonymous email
  v_anonymous_email := 'deleted_' || substr(md5(random()::text), 1, 16) || '@deleted.swaply.ro';
  
  -- Anonymize user data (keep for legal/statistical purposes)
  UPDATE users
  SET
    email = v_anonymous_email,
    full_name = 'Deleted User',
    phone = NULL,
    avatar_url = NULL,
    bio = NULL,
    location = NULL,
    address = NULL,
    latitude = NULL,
    longitude = NULL,
    account_status = 'deleted'
  WHERE id = v_user_id;
  
  -- Delete sensitive data
  DELETE FROM user_preferences WHERE user_id = v_user_id;
  DELETE FROM user_interests WHERE user_id = v_user_id;
  DELETE FROM personalization_events WHERE user_id = v_user_id;
  DELETE FROM notifications WHERE user_id = v_user_id;
  DELETE FROM messages WHERE sender_id = v_user_id OR receiver_id = v_user_id;
  
  -- Anonymize objects (keep for swap history)
  UPDATE objects
  SET
    title = 'Deleted Object',
    description = 'This object has been deleted.',
    images = ARRAY[]::TEXT[],
    status = 'deleted'
  WHERE user_id = v_user_id;
  
  -- Update request
  UPDATE gdpr_requests
  SET
    status = 'completed',
    completed_at = NOW(),
    anonymization_completed = TRUE,
    backup_retained_until = NOW() + INTERVAL '30 days'
  WHERE id = p_request_id;
  
  -- Log audit
  INSERT INTO audit_log (user_id, action_type, success)
  VALUES (v_user_id, 'account_deleted', TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check consent
CREATE OR REPLACE FUNCTION has_consent(
  p_user_id UUID,
  p_consent_type TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_has_consent BOOLEAN;
BEGIN
  SELECT granted INTO v_has_consent
  FROM consent_log
  WHERE user_id = p_user_id
    AND consent_type = p_consent_type
    AND withdrawn_at IS NULL
  ORDER BY created_at DESC
  LIMIT 1;
  
  RETURN COALESCE(v_has_consent, FALSE);
END;
$$ LANGUAGE plpgsql;

-- Get retention policy for data type
CREATE OR REPLACE FUNCTION get_retention_policy(p_data_type TEXT)
RETURNS INTEGER AS $$
DECLARE
  v_retention_days INTEGER;
BEGIN
  SELECT retention_days INTO v_retention_days
  FROM data_retention_policies
  WHERE data_type = p_data_type;
  
  -- Default: 2 years
  RETURN COALESCE(v_retention_days, 730);
END;
$$ LANGUAGE plpgsql;

-- Clean expired data (called by cron job)
CREATE OR REPLACE FUNCTION clean_expired_data()
RETURNS TABLE(data_type TEXT, deleted_count INTEGER) AS $$
BEGIN
  -- Delete old deleted objects
  RETURN QUERY
  WITH deleted_objects AS (
    DELETE FROM objects
    WHERE status = 'deleted'
      AND updated_at < NOW() - (SELECT get_retention_policy('deleted_objects') || ' days')::INTERVAL
    RETURNING 'deleted_objects' AS dt, 1 AS dc
  )
  SELECT dt, COUNT(dc)::INTEGER FROM deleted_objects GROUP BY dt;
  
  -- Delete old notifications
  RETURN QUERY
  WITH deleted_notifs AS (
    DELETE FROM notifications
    WHERE created_at < NOW() - (SELECT get_retention_policy('notifications') || ' days')::INTERVAL
    RETURNING 'notifications' AS dt, 1 AS dc
  )
  SELECT dt, COUNT(dc)::INTEGER FROM deleted_notifs GROUP BY dt;
  
  -- Delete old personalization events
  RETURN QUERY
  WITH deleted_events AS (
    DELETE FROM personalization_events
    WHERE created_at < NOW() - (SELECT get_retention_policy('personalization_events') || ' days')::INTERVAL
    RETURNING 'personalization_events' AS dt, 1 AS dc
  )
  SELECT dt, COUNT(dc)::INTEGER FROM deleted_events GROUP BY dt;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Log all data access
CREATE OR REPLACE FUNCTION trigger_log_data_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log sensitive operations
  IF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD.* IS DISTINCT FROM NEW.*) THEN
    INSERT INTO audit_log (
      user_id,
      action_type,
      target_table,
      target_id,
      affected_data
    ) VALUES (
      auth.uid(),
      CASE TG_OP
        WHEN 'DELETE' THEN 'data_delete'
        WHEN 'UPDATE' THEN 'data_update'
      END,
      TG_TABLE_NAME,
      OLD.id,
      CASE TG_OP
        WHEN 'DELETE' THEN to_jsonb(OLD)
        WHEN 'UPDATE' THEN jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW))
      END
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply to sensitive tables
CREATE TRIGGER audit_users_changes
AFTER UPDATE OR DELETE ON users
FOR EACH ROW
EXECUTE FUNCTION trigger_log_data_access();

-- Update timestamps
CREATE TRIGGER update_gdpr_requests_updated_at
BEFORE UPDATE ON gdpr_requests
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_retention_policies_updated_at
BEFORE UPDATE ON data_retention_policies
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_processors_updated_at
BEFORE UPDATE ON data_processors
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- GDPR requests: Users can view/create own, admins can view all
ALTER TABLE gdpr_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own GDPR requests" ON gdpr_requests
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create GDPR requests" ON gdpr_requests
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all GDPR requests" ON gdpr_requests
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'dpo'))
  );

CREATE POLICY "Admins can update GDPR requests" ON gdpr_requests
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'dpo'))
  );

-- Consent log: Users can view own, admins can view all
ALTER TABLE consent_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own consent log" ON consent_log
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create consent log" ON consent_log
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all consent logs" ON consent_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'dpo'))
  );

-- Audit log: Only admins
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit log" ON audit_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'dpo'))
  );

-- Data retention policies: Read-only for all, admins can edit
ALTER TABLE data_retention_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view retention policies" ON data_retention_policies
  FOR SELECT USING (TRUE);

CREATE POLICY "Admins can manage retention policies" ON data_retention_policies
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- Data processors: Read-only for all
ALTER TABLE data_processors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view data processors" ON data_processors
  FOR SELECT USING (TRUE);

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Default retention policies
INSERT INTO data_retention_policies (data_type, retention_days, auto_delete, legal_basis) VALUES
  ('deleted_objects', 30, TRUE, 'No longer needed'),
  ('notifications', 90, TRUE, 'User convenience'),
  ('personalization_events', 180, TRUE, 'Legitimate interest'),
  ('messages', 730, FALSE, 'Contract fulfillment'),
  ('swap_history', 2555, FALSE, 'Legal obligation (7 years)'),
  ('audit_log', 2555, FALSE, 'Legal obligation')
ON CONFLICT (data_type) DO NOTHING;

-- Data processors (update with actual processors)
INSERT INTO data_processors (processor_name, processor_type, data_categories, processing_purposes, data_location) VALUES
  ('Supabase', 'cloud_storage', ARRAY['user_data', 'objects', 'messages'], ARRAY['hosting', 'database'], 'EU'),
  ('Cloudinary', 'cdn', ARRAY['images'], ARRAY['image_hosting', 'optimization'], 'EU'),
  ('Vercel', 'cloud_storage', ARRAY['none'], ARRAY['hosting', 'cdn'], 'Global')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE gdpr_requests IS 'GDPR data export and erasure requests';
COMMENT ON TABLE data_retention_policies IS 'Data retention policies per data type';
COMMENT ON TABLE consent_log IS 'User consent tracking for GDPR compliance';
COMMENT ON TABLE audit_log IS 'Audit log of all sensitive operations';
COMMENT ON TABLE data_processors IS 'Third-party data processors (GDPR Article 28)';

COMMENT ON FUNCTION request_data_export IS 'Create data export request';
COMMENT ON FUNCTION process_data_export IS 'Generate JSON export of user data';
COMMENT ON FUNCTION request_data_erasure IS 'Create data erasure request';
COMMENT ON FUNCTION process_data_erasure IS 'Anonymize/delete user data';
COMMENT ON FUNCTION has_consent IS 'Check if user has given specific consent';
COMMENT ON FUNCTION get_retention_policy IS 'Get retention period for data type';
COMMENT ON FUNCTION clean_expired_data IS 'Delete data past retention period (cron job)';
