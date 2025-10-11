// Quick runtime test for the app
const testApp = async () => {
  try {
    console.log('🧪 Testing app at localhost:3000...');
    
    const response = await fetch('http://localhost:3000');
    console.log('📊 Status:', response.status);
    
    if (response.ok) {
      const text = await response.text();
      console.log('📝 Page length:', text.length, 'characters');
      
      // Check for common issues
      if (text.includes('Application error')) {
        console.log('❌ Application error detected');
      } else if (text.includes('404')) {
        console.log('❌ 404 error detected');
      } else if (text.includes('Swaply')) {
        console.log('✅ App loaded successfully - Swaply content found');
      } else {
        console.log('⚠️ Page loaded but no Swaply content found');
      }
    } else {
      console.log('❌ Server responded with error status');
    }
  } catch (error) {
    console.log('💥 Connection failed:', error.message);
  }
};

testApp();