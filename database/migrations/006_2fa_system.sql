-- Two-Factor Authentication Schema

-- 2FA Secrets Table
CREATE TABLE IF NOT EXISTS user_2fa (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  secret TEXT NOT NULL,
  enabled BOOLEAN DEFAULT false,
  backup_codes TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index
CREATE INDEX idx_user_2fa_user_id ON user_2fa(user_id);

-- RLS Policies
ALTER TABLE user_2fa ENABLE ROW LEVEL SECURITY;

-- Users can only view their own 2FA settings
CREATE POLICY "Users can view own 2FA"
ON user_2fa FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own 2FA settings
CREATE POLICY "Users can insert own 2FA"
ON user_2fa FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own 2FA settings
CREATE POLICY "Users can update own 2FA"
ON user_2fa FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own 2FA settings
CREATE POLICY "Users can delete own 2FA"
ON user_2fa FOR DELETE
USING (auth.uid() = user_id);

-- Function to generate backup codes
CREATE OR REPLACE FUNCTION generate_backup_codes()
RETURNS TEXT[] AS $$
DECLARE
  codes TEXT[] := '{}';
  i INTEGER;
BEGIN
  FOR i IN 1..10 LOOP
    codes := array_append(codes, upper(substring(md5(random()::text) from 1 for 8)));
  END LOOP;
  RETURN codes;
END;
$$ LANGUAGE plpgsql;

-- Function to validate backup code
CREATE OR REPLACE FUNCTION validate_backup_code(
  p_user_id UUID,
  p_code TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_codes TEXT[];
  v_code_upper TEXT;
BEGIN
  v_code_upper := upper(p_code);
  
  SELECT backup_codes INTO v_codes
  FROM user_2fa
  WHERE user_id = p_user_id
  AND enabled = true;
  
  IF v_code_upper = ANY(v_codes) THEN
    -- Remove used code
    UPDATE user_2fa
    SET backup_codes = array_remove(backup_codes, v_code_upper)
    WHERE user_id = p_user_id;
    
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
