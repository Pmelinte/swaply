// Test all Swaply tables
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ooebonjoqrpouzfjiiiz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZWJvbmpvcXJwb3V6ZmppaWl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1Nzc3ODEsImV4cCI6MjA3MDE1Mzc4MX0.WKGYWq8DVmm0tJfJMJEYPbZ4Z4Y-RnCxyrI2BOtn80o';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  const tables = [
    'profiles', 'objects', 'categories', 'swap_requests', 
    'conversations', 'messages', 'notifications', 'reviews'
  ];
  
  console.log('🔍 Checking database tables...\n');
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: EXISTS (${data.length} rows found)`);
      }
    } catch (err) {
      console.log(`💥 ${table}: ${err.message}`);
    }
  }
  
  // Test signup directly
  console.log('\n🧪 Testing signup process...');
  try {
    const { data, error } = await supabase.auth.signUp({
      email: 'test-' + Date.now() + '@example.com',
      password: 'testpass123',
      options: {
        data: {
          name: 'Test User',
          location: 'București'
        }
      }
    });
    
    if (error) {
      console.log('❌ Signup error:', error.message);
    } else {
      console.log('✅ Signup successful!', data.user?.email);
    }
  } catch (err) {
    console.log('💥 Signup failed:', err.message);
  }
}

checkTables();