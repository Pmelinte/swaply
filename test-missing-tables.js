// Create missing tables with direct SQL
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ooebonjoqrpouzfjiiiz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZWJvbmpvcXJwb3V6ZmppaWl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1Nzc3ODEsImV4cCI6MjA3MDE1Mzc4MX0.WKGYWq8DVmm0tJfJMJEYPbZ4Z4Y-RnCxyrI2BOtn80o';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createMissingTables() {
  console.log('🔄 Creating missing database tables...');

  try {
    // Test connection first
    const { data: existing } = await supabase.from('profiles').select('count').limit(1);
    console.log('✅ Connection successful, existing profiles:', existing);

    // Just test if swap_requests exists
    console.log('🔍 Testing swap_requests table...');
    const { data, error } = await supabase
      .from('swap_requests')
      .select('id')
      .limit(1);

    if (error) {
      console.log('❌ swap_requests table missing:', error.message);
      console.log('💡 Need to create tables manually in Supabase dashboard');
      console.log('🌐 Go to: https://supabase.com/dashboard/project/ooebonjoqrpouzfjiiiz/editor');
    } else {
      console.log('✅ swap_requests table exists!');
    }

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

createMissingTables();