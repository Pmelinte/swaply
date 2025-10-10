-- Functions și Triggers pentru Supabase

-- Function pentru updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pentru updated_at
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON public.profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_objects_updated_at 
  BEFORE UPDATE ON public.objects 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_swap_requests_updated_at 
  BEFORE UPDATE ON public.swap_requests 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function pentru crearea automată a profilului la signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, location)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'location', 'România')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pentru crearea automată a profilului
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function pentru actualizarea rating-ului utilizatorului
CREATE OR REPLACE FUNCTION update_user_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles 
  SET rating = (
    SELECT COALESCE(AVG(rating), 5.0) 
    FROM public.reviews 
    WHERE reviewed_id = NEW.reviewed_id
  )
  WHERE id = NEW.reviewed_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pentru actualizarea rating-ului
CREATE TRIGGER update_rating_after_review
  AFTER INSERT OR UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION update_user_rating();

-- Function pentru actualizarea statisticilor de swap
CREATE OR REPLACE FUNCTION update_swap_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Update requester stats
    UPDATE public.profiles 
    SET 
      total_swaps = total_swaps + 1,
      successful_swaps = successful_swaps + 1
    WHERE id = NEW.requester_id;
    
    -- Update owner stats
    UPDATE public.profiles 
    SET 
      total_swaps = total_swaps + 1,
      successful_swaps = successful_swaps + 1
    WHERE id = NEW.owner_id;
    
    -- Mark objects as swapped
    UPDATE public.objects 
    SET status = 'swapped' 
    WHERE id IN (NEW.requester_object_id, NEW.requested_object_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pentru actualizarea statisticilor
CREATE TRIGGER update_swap_statistics
  AFTER UPDATE ON public.swap_requests
  FOR EACH ROW EXECUTE FUNCTION update_swap_stats();

-- Function pentru actualizarea view count
CREATE OR REPLACE FUNCTION increment_object_views()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.objects 
  SET views_count = views_count + 1 
  WHERE id = NEW.object_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function pentru actualizarea conversației
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations 
  SET last_message_at = NEW.created_at 
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pentru conversații
CREATE TRIGGER update_conversation_timestamp
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message();

-- Function pentru crearea notificărilor automate
CREATE OR REPLACE FUNCTION create_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Notificare pentru cerere de swap nouă
  IF TG_TABLE_NAME = 'swap_requests' AND TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      NEW.owner_id,
      'swap_request',
      'Cerere de schimb nouă',
      'Ai primit o cerere de schimb pentru unul dintre obiectele tale',
      json_build_object('swap_request_id', NEW.id, 'requester_id', NEW.requester_id)
    );
  END IF;
  
  -- Notificare pentru mesaj nou
  IF TG_TABLE_NAME = 'messages' AND TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications (user_id, type, title, message, data)
    SELECT 
      CASE 
        WHEN c.user1_id = NEW.sender_id THEN c.user2_id 
        ELSE c.user1_id 
      END,
      'message',
      'Mesaj nou',
      'Ai primit un mesaj nou',
      json_build_object('conversation_id', NEW.conversation_id, 'message_id', NEW.id)
    FROM public.conversations c
    WHERE c.id = NEW.conversation_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pentru notificări
CREATE TRIGGER create_swap_request_notification
  AFTER INSERT ON public.swap_requests
  FOR EACH ROW EXECUTE FUNCTION create_notification();

CREATE TRIGGER create_message_notification
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION create_notification();