// Quick test script pentru debugging
console.log('🧪 Quick App Test - ' + new Date());

// Test environment variables
console.log('Environment check:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing');
console.log('- SUPABASE_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');

// Test basic server connection
const testServer = async () => {
  try {
    const response = await fetch('http://localhost:3000');
    console.log('🌐 Server status:', response.status);
    console.log('✅ App is accessible');
  } catch (error) {
    console.log('❌ Server not responding:', error.message);
  }
};

testServer();