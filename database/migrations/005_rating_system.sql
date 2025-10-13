-- Rating & Review System Schema

-- Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  swap_request_id UUID NOT NULL REFERENCES swap_requests(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(swap_request_id, reviewer_id) -- One review per user per swap
);

-- Create indexes
CREATE INDEX idx_reviews_swap_id ON reviews(swap_request_id);
CREATE INDEX idx_reviews_reviewer_id ON reviews(reviewer_id);
CREATE INDEX idx_reviews_reviewee_id ON reviews(reviewee_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);

-- RLS Policies
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Users can view reviews about themselves
CREATE POLICY "Users can view reviews about them"
ON reviews FOR SELECT
USING (auth.uid() = reviewee_id OR auth.uid() = reviewer_id);

-- Users can view reviews they wrote
CREATE POLICY "Users can view their reviews"
ON reviews FOR SELECT
USING (auth.uid() = reviewer_id);

-- Users can create reviews for completed swaps
CREATE POLICY "Users can create reviews"
ON reviews FOR INSERT
WITH CHECK (
  auth.uid() = reviewer_id AND
  EXISTS (
    SELECT 1 FROM swap_requests
    WHERE id = swap_request_id
    AND status = 'completed'
    AND (requester_id = auth.uid() OR owner_id = auth.uid())
    AND reviewer_id != reviewee_id
  )
);

-- Users can update their own reviews
CREATE POLICY "Users can update own reviews"
ON reviews FOR UPDATE
USING (auth.uid() = reviewer_id);

-- Function to calculate average rating
CREATE OR REPLACE FUNCTION calculate_average_rating(p_user_id UUID)
RETURNS DECIMAL(3,2) AS $$
DECLARE
  v_avg_rating DECIMAL(3,2);
BEGIN
  SELECT AVG(rating)::DECIMAL(3,2) INTO v_avg_rating
  FROM reviews
  WHERE reviewee_id = p_user_id;
  
  RETURN COALESCE(v_avg_rating, 0);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update user_levels average_rating after review
CREATE OR REPLACE FUNCTION trigger_update_rating_after_review()
RETURNS TRIGGER AS $$
BEGIN
  -- Update reviewee's average rating
  UPDATE user_levels
  SET 
    average_rating = calculate_average_rating(NEW.reviewee_id),
    reviews_received = reviews_received + 1
  WHERE user_id = NEW.reviewee_id;
  
  -- Update reviewer's reviews_given count
  UPDATE user_levels
  SET reviews_given = reviews_given + 1
  WHERE user_id = NEW.reviewer_id;
  
  -- Award XP for giving review
  PERFORM award_xp(NEW.reviewer_id, 10, 'review_given');
  
  -- Check for new badges
  PERFORM check_and_award_badges(NEW.reviewee_id);
  PERFORM check_and_award_badges(NEW.reviewer_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rating_after_review
AFTER INSERT ON reviews
FOR EACH ROW
EXECUTE FUNCTION trigger_update_rating_after_review();

-- Function to check if user can review a swap
CREATE OR REPLACE FUNCTION can_review_swap(
  p_swap_id UUID,
  p_reviewer_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_swap_status TEXT;
  v_is_participant BOOLEAN;
  v_already_reviewed BOOLEAN;
  v_other_user_id UUID;
BEGIN
  -- Check if swap exists and is completed
  SELECT status INTO v_swap_status
  FROM swap_requests
  WHERE id = p_swap_id;
  
  IF v_swap_status IS NULL OR v_swap_status != 'completed' THEN
    RETURN FALSE;
  END IF;
  
  -- Check if user is a participant
  SELECT EXISTS (
    SELECT 1 FROM swap_requests
    WHERE id = p_swap_id
    AND (requester_id = p_reviewer_id OR owner_id = p_reviewer_id)
  ) INTO v_is_participant;
  
  IF NOT v_is_participant THEN
    RETURN FALSE;
  END IF;
  
  -- Check if user already reviewed this swap
  SELECT EXISTS (
    SELECT 1 FROM reviews
    WHERE swap_request_id = p_swap_id
    AND reviewer_id = p_reviewer_id
  ) INTO v_already_reviewed;
  
  IF v_already_reviewed THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
