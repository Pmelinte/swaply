-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create custom types
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE object_status AS ENUM ('active', 'inactive', 'reserved', 'swapped');
CREATE TYPE object_condition AS ENUM ('new', 'like-new', 'good', 'fair', 'poor');
CREATE TYPE swap_status AS ENUM ('pending', 'accepted', 'declined', 'completed', 'cancelled');
CREATE TYPE notification_type AS ENUM ('match', 'message', 'swap_request', 'swap_accepted', 'swap_declined', 'swap_completed', 'system');

-- Extend auth.users with profiles
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email text UNIQUE NOT NULL,
  name text,
  avatar_url text,
  bio text,
  location text,
  phone text,
  date_of_birth date,
  status user_status DEFAULT 'active',
  rating numeric(3,2) DEFAULT 5.0,
  total_swaps integer DEFAULT 0,
  successful_swaps integer DEFAULT 0,
  verified boolean DEFAULT false,
  preferences jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Objects/Items table
CREATE TABLE public.objects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  category text NOT NULL,
  subcategory text,
  condition object_condition NOT NULL,
  estimated_value numeric(10,2),
  status object_status DEFAULT 'active',
  images jsonb DEFAULT '[]',
  tags text[],
  location text,
  latitude numeric(10,8),
  longitude numeric(11,8),
  available_for_swap boolean DEFAULT true,
  swap_preferences jsonb DEFAULT '{}',
  views_count integer DEFAULT 0,
  likes_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Categories reference table
CREATE TABLE public.categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  icon text,
  parent_id uuid REFERENCES public.categories(id),
  sort_order integer DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Swap requests
CREATE TABLE public.swap_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  owner_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  requester_object_id uuid REFERENCES public.objects(id) ON DELETE CASCADE NOT NULL,
  requested_object_id uuid REFERENCES public.objects(id) ON DELETE CASCADE NOT NULL,
  status swap_status DEFAULT 'pending',
  message text,
  meeting_location text,
  meeting_date timestamp with time zone,
  notes jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone
);

-- Messages/Chat system
CREATE TABLE public.conversations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  user2_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  swap_request_id uuid REFERENCES public.swap_requests(id) ON DELETE SET NULL,
  last_message_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user1_id, user2_id)
);

CREATE TABLE public.messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  message_type text DEFAULT 'text',
  attachments jsonb DEFAULT '[]',
  read_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- Notifications system
CREATE TABLE public.notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type notification_type NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  data jsonb DEFAULT '{}',
  read_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- User favorites/likes
CREATE TABLE public.user_favorites (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  object_id uuid REFERENCES public.objects(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, object_id)
);

-- Reviews/Ratings
CREATE TABLE public.reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  reviewer_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reviewed_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  swap_request_id uuid REFERENCES public.swap_requests(id) ON DELETE CASCADE NOT NULL,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(reviewer_id, reviewed_id, swap_request_id)
);

-- Create indexes for performance
CREATE INDEX idx_objects_user_id ON public.objects(user_id);
CREATE INDEX idx_objects_category ON public.objects(category);
CREATE INDEX idx_objects_status ON public.objects(status);
CREATE INDEX idx_objects_location ON public.objects(location);
CREATE INDEX idx_objects_created_at ON public.objects(created_at DESC);

CREATE INDEX idx_swap_requests_requester ON public.swap_requests(requester_id);
CREATE INDEX idx_swap_requests_owner ON public.swap_requests(owner_id);
CREATE INDEX idx_swap_requests_status ON public.swap_requests(status);

CREATE INDEX idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);

CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id, read_at) WHERE read_at IS NULL;