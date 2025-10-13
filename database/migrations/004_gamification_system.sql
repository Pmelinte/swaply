-- Gamification System Schema
-- Badges, Achievements, and XP tracking

-- Badge Types Table
CREATE TABLE IF NOT EXISTS badge_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  title_ro TEXT NOT NULL,
  title_en TEXT NOT NULL,
  description_ro TEXT NOT NULL,
  description_en TEXT NOT NULL,
  icon TEXT NOT NULL, -- Emoji or icon identifier
  category TEXT NOT NULL, -- 'swap', 'social', 'milestone', 'special'
  rarity TEXT NOT NULL DEFAULT 'common', -- 'common', 'rare', 'epic', 'legendary'
  points INTEGER NOT NULL DEFAULT 0, -- XP points awarded
  requirement_type TEXT NOT NULL, -- 'swap_count', 'rating_avg', 'objects_posted', etc.
  requirement_value INTEGER NOT NULL, -- Threshold value
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User Badges Table (earned badges)
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_type_id UUID NOT NULL REFERENCES badge_types(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  progress INTEGER DEFAULT 100, -- Progress percentage (100 = earned)
  notified BOOLEAN DEFAULT false, -- Whether user was notified
  UNIQUE(user_id, badge_type_id)
);

-- User XP and Level Table
CREATE TABLE IF NOT EXISTS user_levels (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_xp INTEGER NOT NULL DEFAULT 0,
  current_level INTEGER NOT NULL DEFAULT 1,
  swaps_completed INTEGER NOT NULL DEFAULT 0,
  objects_posted INTEGER NOT NULL DEFAULT 0,
  reviews_given INTEGER NOT NULL DEFAULT 0,
  reviews_received INTEGER NOT NULL DEFAULT 0,
  average_rating DECIMAL(3,2),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX idx_user_badges_earned_at ON user_badges(earned_at DESC);
CREATE INDEX idx_badge_types_category ON badge_types(category);

-- RLS Policies
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE badge_types ENABLE ROW LEVEL SECURITY;

-- Badge Types: Public read (everyone can see available badges)
CREATE POLICY "Badge types are viewable by everyone"
ON badge_types FOR SELECT
USING (true);

-- User Badges: Users can view their own badges
CREATE POLICY "Users can view own badges"
ON user_badges FOR SELECT
USING (auth.uid() = user_id);

-- User Badges: System can insert badges (via functions)
CREATE POLICY "System can award badges"
ON user_badges FOR INSERT
WITH CHECK (true);

-- User Levels: Users can view their own level
CREATE POLICY "Users can view own level"
ON user_levels FOR SELECT
USING (auth.uid() = user_id);

-- User Levels: Users can view other users' levels (for leaderboard)
CREATE POLICY "Users can view all levels"
ON user_levels FOR SELECT
USING (true);

-- User Levels: System can update levels
CREATE POLICY "System can update levels"
ON user_levels FOR UPDATE
USING (true);

-- Function to calculate level from XP
CREATE OR REPLACE FUNCTION calculate_level(xp INTEGER)
RETURNS INTEGER AS $$
BEGIN
  -- Level formula: level = floor(sqrt(xp / 100)) + 1
  -- Level 1: 0-99 XP
  -- Level 2: 100-399 XP
  -- Level 3: 400-899 XP
  -- Level 4: 900-1599 XP
  -- etc.
  RETURN FLOOR(SQRT(xp::FLOAT / 100)) + 1;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to award XP and check for new badges
CREATE OR REPLACE FUNCTION award_xp(
  p_user_id UUID,
  p_xp_amount INTEGER,
  p_activity TEXT DEFAULT NULL
)
RETURNS TABLE(new_total_xp INTEGER, new_level INTEGER, level_up BOOLEAN) AS $$
DECLARE
  v_old_level INTEGER;
  v_new_level INTEGER;
  v_new_total_xp INTEGER;
  v_level_up BOOLEAN := false;
BEGIN
  -- Get current level and XP
  SELECT current_level, total_xp INTO v_old_level, v_new_total_xp
  FROM user_levels
  WHERE user_id = p_user_id;
  
  -- If user doesn't exist in user_levels, create entry
  IF NOT FOUND THEN
    INSERT INTO user_levels (user_id, total_xp, current_level)
    VALUES (p_user_id, p_xp_amount, calculate_level(p_xp_amount))
    RETURNING total_xp, current_level INTO v_new_total_xp, v_new_level;
    
    v_level_up := true;
  ELSE
    -- Update XP
    v_new_total_xp := v_new_total_xp + p_xp_amount;
    v_new_level := calculate_level(v_new_total_xp);
    v_level_up := v_new_level > v_old_level;
    
    UPDATE user_levels
    SET 
      total_xp = v_new_total_xp,
      current_level = v_new_level,
      updated_at = now()
    WHERE user_id = p_user_id;
  END IF;
  
  -- Check for new badge achievements (will be triggered by other functions)
  
  RETURN QUERY SELECT v_new_total_xp, v_new_level, v_level_up;
END;
$$ LANGUAGE plpgsql;

-- Function to check and award badges based on criteria
CREATE OR REPLACE FUNCTION check_and_award_badges(p_user_id UUID)
RETURNS SETOF user_badges AS $$
DECLARE
  v_badge_type RECORD;
  v_user_stats RECORD;
  v_new_badge user_badges%ROWTYPE;
BEGIN
  -- Get user stats
  SELECT * INTO v_user_stats
  FROM user_levels
  WHERE user_id = p_user_id;
  
  -- If user stats don't exist, create them
  IF NOT FOUND THEN
    INSERT INTO user_levels (user_id)
    VALUES (p_user_id)
    RETURNING * INTO v_user_stats;
  END IF;
  
  -- Check each badge type
  FOR v_badge_type IN 
    SELECT * FROM badge_types
  LOOP
    -- Check if user already has this badge
    IF NOT EXISTS (
      SELECT 1 FROM user_badges 
      WHERE user_id = p_user_id AND badge_type_id = v_badge_type.id
    ) THEN
      -- Check requirement
      CASE v_badge_type.requirement_type
        WHEN 'swap_count' THEN
          IF v_user_stats.swaps_completed >= v_badge_type.requirement_value THEN
            INSERT INTO user_badges (user_id, badge_type_id)
            VALUES (p_user_id, v_badge_type.id)
            RETURNING * INTO v_new_badge;
            RETURN NEXT v_new_badge;
          END IF;
          
        WHEN 'objects_posted' THEN
          IF v_user_stats.objects_posted >= v_badge_type.requirement_value THEN
            INSERT INTO user_badges (user_id, badge_type_id)
            VALUES (p_user_id, v_badge_type.id)
            RETURNING * INTO v_new_badge;
            RETURN NEXT v_new_badge;
          END IF;
          
        WHEN 'rating_avg' THEN
          IF v_user_stats.average_rating >= (v_badge_type.requirement_value::FLOAT / 10) THEN
            INSERT INTO user_badges (user_id, badge_type_id)
            VALUES (p_user_id, v_badge_type.id)
            RETURNING * INTO v_new_badge;
            RETURN NEXT v_new_badge;
          END IF;
          
        WHEN 'level' THEN
          IF v_user_stats.current_level >= v_badge_type.requirement_value THEN
            INSERT INTO user_badges (user_id, badge_type_id)
            VALUES (p_user_id, v_badge_type.id)
            RETURNING * INTO v_new_badge;
            RETURN NEXT v_new_badge;
          END IF;
      END CASE;
    END IF;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Seed initial badge types
INSERT INTO badge_types (name, title_ro, title_en, description_ro, description_en, icon, category, rarity, points, requirement_type, requirement_value) VALUES
  ('first_swap', 'Primul Swap', 'First Swap', 'Ai finalizat primul schimb!', 'Completed your first swap!', '🎉', 'milestone', 'common', 50, 'swap_count', 1),
  ('swap_veteran', 'Veteran al Schimburilor', 'Swap Veteran', 'Ai finalizat 10 schimburi', 'Completed 10 swaps', '⭐', 'milestone', 'rare', 200, 'swap_count', 10),
  ('swap_master', 'Maestru al Schimburilor', 'Swap Master', 'Ai finalizat 50 de schimburi', 'Completed 50 swaps', '🏆', 'milestone', 'epic', 1000, 'swap_count', 50),
  ('swap_legend', 'Legendă a Schimburilor', 'Swap Legend', 'Ai finalizat 100 de schimburi!', 'Completed 100 swaps!', '👑', 'milestone', 'legendary', 5000, 'swap_count', 100),
  
  ('collector', 'Colecționar', 'Collector', 'Ai postat 5 obiecte', 'Posted 5 objects', '📦', 'social', 'common', 25, 'objects_posted', 5),
  ('curator', 'Curator', 'Curator', 'Ai postat 20 de obiecte', 'Posted 20 objects', '🎨', 'social', 'rare', 100, 'objects_posted', 20),
  ('merchant', 'Negustor', 'Merchant', 'Ai postat 50 de obiecte', 'Posted 50 objects', '🏪', 'social', 'epic', 500, 'objects_posted', 50),
  
  ('five_star', 'Cinci Stele', 'Five Star', 'Rating mediu de 5.0', 'Average rating of 5.0', '⭐', 'special', 'epic', 500, 'rating_avg', 50),
  ('trusted_trader', 'Comerciant de Încredere', 'Trusted Trader', 'Rating mediu peste 4.5', 'Average rating above 4.5', '🛡️', 'special', 'rare', 200, 'rating_avg', 45),
  
  ('level_5', 'Nivel 5', 'Level 5', 'Ai atins nivelul 5', 'Reached level 5', '🎖️', 'milestone', 'common', 100, 'level', 5),
  ('level_10', 'Nivel 10', 'Level 10', 'Ai atins nivelul 10', 'Reached level 10', '💎', 'milestone', 'rare', 500, 'level', 10),
  ('level_20', 'Nivel 20', 'Level 20', 'Ai atins nivelul 20', 'Reached level 20', '🌟', 'milestone', 'epic', 2000, 'level', 20),
  
  ('early_adopter', 'Adoptator Timpuriu', 'Early Adopter', 'Printre primii 100 utilizatori', 'Among first 100 users', '🚀', 'special', 'legendary', 1000, 'swap_count', 1),
  ('explorer', 'Explorator', 'Explorer', 'Ai schimbat în 3 orașe diferite', 'Swapped in 3 different cities', '🗺️', 'social', 'rare', 300, 'swap_count', 3)
ON CONFLICT (name) DO NOTHING;

-- Trigger to automatically check badges after swap completion
CREATE OR REPLACE FUNCTION trigger_check_badges_after_swap()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Award XP to both users
    PERFORM award_xp(NEW.requester_id, 100, 'swap_completed');
    PERFORM award_xp(NEW.owner_id, 100, 'swap_completed');
    
    -- Update swap count
    UPDATE user_levels SET swaps_completed = swaps_completed + 1 WHERE user_id IN (NEW.requester_id, NEW.owner_id);
    
    -- Check for new badges
    PERFORM check_and_award_badges(NEW.requester_id);
    PERFORM check_and_award_badges(NEW.owner_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_badges_after_swap
AFTER UPDATE ON swap_requests
FOR EACH ROW
EXECUTE FUNCTION trigger_check_badges_after_swap();

-- Trigger to check badges after object posted
CREATE OR REPLACE FUNCTION trigger_check_badges_after_object_posted()
RETURNS TRIGGER AS $$
BEGIN
  -- Award XP
  PERFORM award_xp(NEW.user_id, 25, 'object_posted');
  
  -- Update object count
  UPDATE user_levels SET objects_posted = objects_posted + 1 WHERE user_id = NEW.user_id;
  
  -- Check for new badges
  PERFORM check_and_award_badges(NEW.user_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_badges_after_object
AFTER INSERT ON objects
FOR EACH ROW
EXECUTE FUNCTION trigger_check_badges_after_object_posted();
