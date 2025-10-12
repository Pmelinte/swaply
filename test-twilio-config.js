/**
 * Twilio Configuration Test Script
 * 
 * Run this after configuring Twilio in Supabase Dashboard to verify everything works.
 * 
 * Usage:
 *   node test-twilio-config.js
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n🔧 Twilio Configuration Verification Script\n');
console.log('This script will guide you through verifying your Twilio setup.\n');

const steps = [
  {
    name: 'Twilio Account Created',
    question: 'Do you have a Twilio account? (y/n): ',
    help: '👉 If not, go to https://console.twilio.com/ and sign up'
  },
  {
    name: 'Credentials Retrieved',
    question: 'Have you retrieved Account SID and Auth Token? (y/n): ',
    help: '👉 Find them at: Twilio Console → Dashboard → Account Info'
  },
  {
    name: 'Phone Number Available',
    question: 'Do you have a Twilio phone number with SMS capability? (y/n): ',
    help: '👉 Get one at: Twilio Console → Phone Numbers → Buy a number'
  },
  {
    name: 'Supabase Configuration',
    question: 'Have you configured Twilio in Supabase Dashboard? (y/n): ',
    help: '👉 Go to: Supabase Dashboard → Authentication → Providers → Phone'
  },
  {
    name: 'Phone Provider Enabled',
    question: 'Is Phone provider enabled in Supabase? (y/n): ',
    help: '👉 Check: Supabase Dashboard → Authentication → Providers → Phone (toggle ON)'
  },
  {
    name: 'SMS Template Customized',
    question: 'Have you customized the SMS template? (y/n - optional): ',
    help: '👉 Optional: Supabase Dashboard → Authentication → Templates → SMS',
    optional: true
  },
  {
    name: 'Test SMS Sent',
    question: 'Have you sent a test SMS from Twilio Console? (y/n): ',
    help: '👉 Test at: Twilio Console → Try it Out → Send an SMS'
  }
];

let currentStep = 0;
const results = {};

function askQuestion(step) {
  return new Promise((resolve) => {
    rl.question(step.question, (answer) => {
      const isYes = answer.toLowerCase().trim() === 'y';
      results[step.name] = isYes;
      
      if (!isYes && !step.optional) {
        console.log(`\n❌ ${step.help}\n`);
      } else if (isYes) {
        console.log(`✅ ${step.name} - Complete\n`);
      } else {
        console.log(`⏭️  ${step.name} - Skipped (optional)\n`);
      }
      
      resolve();
    });
  });
}

async function runChecklist() {
  console.log('='.repeat(60));
  console.log('TWILIO CONFIGURATION CHECKLIST');
  console.log('='.repeat(60));
  console.log('\n');

  for (const step of steps) {
    await askQuestion(step);
    currentStep++;
  }

  console.log('\n' + '='.repeat(60));
  console.log('VERIFICATION SUMMARY');
  console.log('='.repeat(60));
  console.log('\n');

  const completed = Object.values(results).filter(v => v).length;
  const total = steps.filter(s => !s.optional).length;
  const percentage = Math.round((completed / total) * 100);

  console.log(`Progress: ${completed}/${total} steps completed (${percentage}%)\n`);

  let allRequired = true;
  steps.forEach(step => {
    const status = results[step.name];
    const icon = status ? '✅' : (step.optional ? '⏭️' : '❌');
    const label = step.optional ? ' (optional)' : '';
    console.log(`${icon} ${step.name}${label}`);
    
    if (!status && !step.optional) {
      allRequired = false;
    }
  });

  console.log('\n' + '='.repeat(60));
  
  if (allRequired) {
    console.log('\n✨ SUCCESS! Twilio configuration is complete!\n');
    console.log('Next steps:');
    console.log('1. Go to https://swaply-site.vercel.app/login');
    console.log('2. Click on 📱 Telefon tab');
    console.log('3. Enter your phone number (format: +40712345678)');
    console.log('4. Click "Trimite Cod SMS"');
    console.log('5. Check your SMS inbox for 6-digit code');
    console.log('6. Enter code and click "Verifică Cod"');
    console.log('7. You should be logged in! 🎉\n');
  } else {
    console.log('\n⚠️  Configuration incomplete. Please complete the missing steps above.\n');
    console.log('Refer to TWILIO_SETUP_GUIDE.md for detailed instructions.\n');
  }

  console.log('='.repeat(60));
  console.log('\n');
  
  rl.close();
}

// Manual test instructions
function printManualTestInstructions() {
  console.log('\n📋 MANUAL TEST CHECKLIST\n');
  console.log('After completing configuration, test these scenarios:\n');
  
  const tests = [
    'Test 1: Valid phone number + valid OTP',
    'Test 2: Invalid phone format (missing country code)',
    'Test 3: Invalid OTP code (wrong 6 digits)',
    'Test 4: Expired OTP (wait 5+ minutes)',
    'Test 5: Resend OTP functionality',
    'Test 6: Multiple devices (send OTP, verify on different device)',
    'Test 7: Rate limiting (send multiple OTPs quickly)'
  ];

  tests.forEach((test, index) => {
    console.log(`  ${index + 1}. ${test}`);
  });

  console.log('\n📊 Expected Results:\n');
  console.log('  ✅ Test 1: SMS received, code works, login successful');
  console.log('  ❌ Test 2: Error "Invalid phone number format"');
  console.log('  ❌ Test 3: Error "Invalid or expired OTP"');
  console.log('  ❌ Test 4: Error "Invalid or expired OTP"');
  console.log('  ✅ Test 5: New SMS received, old code invalidated');
  console.log('  ✅ Test 6: Code works on different device');
  console.log('  ⚠️  Test 7: Rate limit error after 3-5 attempts\n');
}

// Twilio credentials validation
function validateCredentials() {
  console.log('\n🔐 CREDENTIALS FORMAT VALIDATION\n');
  
  rl.question('Enter your Twilio Account SID (or press Enter to skip): ', (accountSid) => {
    if (accountSid.trim()) {
      if (accountSid.startsWith('AC') && accountSid.length === 34) {
        console.log('✅ Account SID format is valid\n');
      } else {
        console.log('❌ Account SID format is INVALID');
        console.log('   Expected: ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx (34 characters)\n');
      }
    }

    rl.question('Enter your Twilio Auth Token (or press Enter to skip): ', (authToken) => {
      if (authToken.trim()) {
        if (authToken.length === 32) {
          console.log('✅ Auth Token format is valid\n');
        } else {
          console.log('❌ Auth Token format is INVALID');
          console.log('   Expected: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx (32 characters)\n');
        }
      }

      rl.question('Enter your Twilio Phone Number (or press Enter to skip): ', (phoneNumber) => {
        if (phoneNumber.trim()) {
          if (phoneNumber.startsWith('+') && phoneNumber.length >= 10) {
            console.log('✅ Phone Number format is valid\n');
          } else {
            console.log('❌ Phone Number format is INVALID');
            console.log('   Expected: +1234567890 (with country code)\n');
          }
        }

        console.log('\n💡 Tip: Store these credentials securely in Supabase Dashboard only.');
        console.log('   NEVER commit them to Git or share them publicly.\n');

        rl.close();
      });
    });
  });
}

// Main menu
function showMenu() {
  console.log('Choose an option:\n');
  console.log('1. Run configuration checklist');
  console.log('2. View manual test instructions');
  console.log('3. Validate Twilio credentials format');
  console.log('4. Exit\n');

  rl.question('Enter choice (1-4): ', (choice) => {
    console.log('\n');
    
    switch(choice.trim()) {
      case '1':
        runChecklist();
        break;
      case '2':
        printManualTestInstructions();
        rl.close();
        break;
      case '3':
        validateCredentials();
        break;
      case '4':
        console.log('👋 Goodbye!\n');
        rl.close();
        break;
      default:
        console.log('Invalid choice. Please enter 1-4.\n');
        showMenu();
    }
  });
}

// Start the script
showMenu();
