// Test auto-approve signup
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ooebonjoqrpouzfjiiiz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZWJvbmpvcXJwb3V6ZmppaWl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1Nzc3ODEsImV4cCI6MjA3MDE1Mzc4MX0.WKGYWq8DVmm0tJfJMJEYPbZ4Z4Y-RnCxyrI2BOtn80o';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAutoApprove() {
  console.log('🧪 Testing auto-approve signup...\n');
  
  const testEmail = `autotest-${Date.now()}@example.com`;
  const testPassword = 'password123';
  
  try {
    // Test signup
    console.log(`📧 Testing signup with: ${testEmail}`);
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          name: 'Auto Test User',
          location: 'București'
        }
      }
    });
    
    if (signupError) {
      console.log('❌ Signup error:', signupError.message);
      return;
    }
    
    console.log('✅ Signup successful!');
    console.log('📊 User data:', {
      id: signupData.user?.id,
      email: signupData.user?.email,
      email_confirmed_at: signupData.user?.email_confirmed_at,
      created_at: signupData.user?.created_at
    });
    
    // Test immediate login
    console.log('\n🔐 Testing immediate login...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    if (loginError) {
      console.log('❌ Login error:', loginError.message);
      if (loginError.message.includes('Email not confirmed')) {
        console.log('⚠️  Auto-approve NOT activated - need to enable in dashboard');
      }
    } else {
      console.log('✅ Login successful immediately after signup!');
      console.log('🎯 Auto-approve is working correctly!');
    }
    
  } catch (err) {
    console.log('💥 Test failed:', err.message);
  }
}

testAutoApprove();