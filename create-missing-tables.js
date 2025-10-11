// Execute missing database tables
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://ooebonjoqrpouzfjiiiz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZWJvbmpvcXJwb3V6ZmppaWl6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyODUxNDI5NCwiZXhwIjoyMDQ0MDkwMjk0fQ.ZXKkjjwPu_1qf7mTBaUItdoBnEb6NJqCXcTUrAKPE6w';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createMissingTables() {
  console.log('🔄 Creating missing database tables...');

  // Categories table
  const categoriesSQL = `
    CREATE TABLE IF NOT EXISTS public.categories (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      name text NOT NULL UNIQUE,
      description text,
      icon text,
      color text,
      parent_id uuid REFERENCES public.categories(id),
      sort_order integer DEFAULT 0,
      created_at timestamp with time zone DEFAULT now()
    );
  `;

  // Swap requests table
  const swapRequestsSQL = `
    CREATE TABLE IF NOT EXISTS public.swap_requests (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      requester_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
      owner_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
      requested_item_id uuid REFERENCES public.objects(id) ON DELETE CASCADE NOT NULL,
      offered_item_id uuid REFERENCES public.objects(id) ON DELETE CASCADE,
      status swap_status DEFAULT 'pending',
      message text,
      counter_offer_message text,
      meeting_location text,
      meeting_time timestamp with time zone,
      created_at timestamp with time zone DEFAULT now(),
      updated_at timestamp with time zone DEFAULT now(),
      completed_at timestamp with time zone
    );
  `;

  // Conversations table  
  const conversationsSQL = `
    CREATE TABLE IF NOT EXISTS public.conversations (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      swap_request_id uuid REFERENCES public.swap_requests(id) ON DELETE CASCADE,
      participant1_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
      participant2_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
      last_message_at timestamp with time zone DEFAULT now(),
      created_at timestamp with time zone DEFAULT now()
    );
  `;

  // Notifications table
  const notificationsSQL = `
    CREATE TABLE IF NOT EXISTS public.notifications (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
      type notification_type NOT NULL,
      title text NOT NULL,
      message text NOT NULL,
      data jsonb DEFAULT '{}',
      read boolean DEFAULT false,
      created_at timestamp with time zone DEFAULT now()
    );
  `;

  // Reviews table
  const reviewsSQL = `
    CREATE TABLE IF NOT EXISTS public.reviews (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      swap_request_id uuid REFERENCES public.swap_requests(id) ON DELETE CASCADE NOT NULL,
      reviewer_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
      reviewee_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
      rating integer CHECK (rating >= 1 AND rating <= 5) NOT NULL,
      comment text,
      created_at timestamp with time zone DEFAULT now()
    );
  `;

  try {
    console.log('📋 Creating categories table...');
    const { error: categoriesError } = await supabase.rpc('exec_sql', { sql: categoriesSQL });
    if (categoriesError && !categoriesError.message.includes('already exists')) {
      console.error('❌ Categories error:', categoriesError);
    } else {
      console.log('✅ Categories table ready');
    }

    console.log('📋 Creating swap_requests table...');
    const { error: swapRequestsError } = await supabase.rpc('exec_sql', { sql: swapRequestsSQL });
    if (swapRequestsError && !swapRequestsError.message.includes('already exists')) {
      console.error('❌ Swap requests error:', swapRequestsError);
    } else {
      console.log('✅ Swap requests table ready');
    }

    console.log('📋 Creating conversations table...');
    const { error: conversationsError } = await supabase.rpc('exec_sql', { sql: conversationsSQL });
    if (conversationsError && !conversationsError.message.includes('already exists')) {
      console.error('❌ Conversations error:', conversationsError);
    } else {
      console.log('✅ Conversations table ready');
    }

    console.log('📋 Creating notifications table...');
    const { error: notificationsError } = await supabase.rpc('exec_sql', { sql: notificationsSQL });
    if (notificationsError && !notificationsError.message.includes('already exists')) {
      console.error('❌ Notifications error:', notificationsError);
    } else {
      console.log('✅ Notifications table ready');
    }

    console.log('📋 Creating reviews table...');
    const { error: reviewsError } = await supabase.rpc('exec_sql', { sql: reviewsSQL });
    if (reviewsError && !reviewsError.message.includes('already exists')) {
      console.error('❌ Reviews error:', reviewsError);
    } else {
      console.log('✅ Reviews table ready');
    }

    console.log('🎉 All tables created successfully!');

  } catch (error) {
    console.error('💥 Error creating tables:', error);
  }
}

createMissingTables();