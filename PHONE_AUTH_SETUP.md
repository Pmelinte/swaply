# Phone Authentication Setup Guide

## Overview
Swaply supports phone authentication with SMS OTP verification. This guide covers the complete setup process for Twilio integration with Supabase.

## Prerequisites
- Active Supabase project
- Twilio account with SMS capabilities
- Phone numbers for testing

## Implementation Status

### ✅ Completed
- **UI Components**: Phone input field, OTP input field, resend button
- **State Management**: `authMethod: 'phone'`, `otpSent`, `phone`, `otp` in formData
- **Handler Logic**: Two-step OTP flow (send → verify) in `handleSubmit`
- **Button States**: Dynamic button text ("Trimite Cod SMS" → "Verifică Cod")
- **Validation**: Phone format hints, 6-digit OTP maxLength
- **Resend Functionality**: Async resend with loading/error/success states

### ⏳ Pending
- **Supabase Configuration**: Enable phone provider in Supabase Dashboard
- **Twilio Setup**: Configure Twilio credentials in Supabase
- **SMS Templates**: Customize OTP message templates
- **Rate Limiting**: Configure SMS rate limits
- **Testing**: Test flow with real phone numbers

---

## Step-by-Step Configuration

### 1. Enable Phone Provider in Supabase

1. Go to **Supabase Dashboard** → Your Project
2. Navigate to **Authentication** → **Providers**
3. Find **Phone** in the provider list
4. Click **Enable**
5. Save changes

### 2. Configure Twilio Integration

#### 2.1 Get Twilio Credentials

1. Sign up/login at [Twilio Console](https://console.twilio.com/)
2. Get your credentials:
   - **Account SID**: Found on Console Dashboard
   - **Auth Token**: Found on Console Dashboard (click "Show" to reveal)
3. Get a phone number:
   - Go to **Phone Numbers** → **Manage** → **Buy a number**
   - Choose a number with SMS capabilities
   - Complete purchase

#### 2.2 Add Twilio to Supabase

1. In Supabase Dashboard → **Authentication** → **Providers** → **Phone**
2. Select **Twilio** as the SMS provider
3. Enter credentials:
   ```
   Twilio Account SID: ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   Twilio Auth Token: your_auth_token_here
   Twilio Phone Number: +1234567890
   ```
4. Click **Save**

### 3. Configure SMS Templates

1. In Supabase Dashboard → **Authentication** → **Email Templates**
2. Select **SMS Templates** tab
3. Customize OTP message:
   ```
   Codul tău Swaply: {{ .Code }}
   
   Valabil 5 minute. Nu împărtăși acest cod.
   ```
4. Save template

### 4. Set Rate Limits

1. In Supabase Dashboard → **Authentication** → **Rate Limits**
2. Configure limits:
   - **OTP requests per hour**: 3-5 (prevent abuse)
   - **Verification attempts**: 5 per OTP code
   - **Cooldown period**: 60 seconds between requests

### 5. Test the Flow

#### Test Case 1: Valid Phone Number + Valid OTP
```typescript
// Send OTP
const { data, error } = await supabase.auth.signInWithOtp({
  phone: '+40712345678',
  options: { shouldCreateUser: true }
});
// Expected: SMS received, no error

// Verify OTP
const { data, error } = await supabase.auth.verifyOtp({
  phone: '+40712345678',
  token: '123456',
  type: 'sms'
});
// Expected: Session created, redirect to /
```

#### Test Case 2: Invalid Phone Format
```typescript
const { data, error } = await supabase.auth.signInWithOtp({
  phone: '0712345678', // Missing country code
});
// Expected: Error - "Invalid phone number format"
```

#### Test Case 3: Invalid OTP Code
```typescript
const { data, error } = await supabase.auth.verifyOtp({
  phone: '+40712345678',
  token: '999999', // Wrong code
  type: 'sms'
});
// Expected: Error - "Invalid or expired OTP"
```

#### Test Case 4: Expired OTP
```typescript
// Wait 5+ minutes after sending OTP
const { data, error } = await supabase.auth.verifyOtp({
  phone: '+40712345678',
  token: '123456', // Expired code
  type: 'sms'
});
// Expected: Error - "Invalid or expired OTP"
```

#### Test Case 5: Resend OTP
```typescript
// Send first OTP
await supabase.auth.signInWithOtp({ phone: '+40712345678' });

// Wait 60 seconds (rate limit)
await new Promise(resolve => setTimeout(resolve, 60000));

// Send second OTP
const { data, error } = await supabase.auth.signInWithOtp({
  phone: '+40712345678',
});
// Expected: New SMS received, old code invalidated
```

---

## Alternative Providers

### WhatsApp Business (Future)
- More reliable delivery
- Higher open rates
- Requires Business API access
- Configuration similar to Twilio

### Vonage (Nexmo) (Fallback)
- Good for international coverage
- Competitive pricing
- Configure in Supabase → Phone → Vonage

---

## Implementation Code Reference

### Login Page State
```typescript
const [authMethod, setAuthMethod] = useState<'password' | 'magic' | 'phone'>('password');
const [otpSent, setOtpSent] = useState(false);
const [formData, setFormData] = useState({
  email: '',
  password: '',
  phone: '',
  otp: '',
});
```

### Send OTP Handler
```typescript
if (authMethod === 'phone') {
  if (!otpSent) {
    // Send OTP
    const { error: otpError } = await supabase.auth.signInWithOtp({
      phone: formData.phone,
      options: { shouldCreateUser: false }
    });
    if (otpError) throw otpError;
    setOtpSent(true);
    setSuccess('Cod trimis pe telefon!');
    return;
  }
}
```

### Verify OTP Handler
```typescript
if (authMethod === 'phone') {
  if (otpSent) {
    // Verify OTP
    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      phone: formData.phone,
      token: formData.otp,
      type: 'sms'
    });
    if (verifyError) throw verifyError;
    
    if (data.session) {
      sessionStorage.setItem('swaply_just_logged_in', 'true');
      router.push('/');
    }
  }
}
```

### Resend OTP Handler
```typescript
const handleResend = async () => {
  setLoading(true);
  setError('');
  try {
    const supabase = getBrowserSupabase();
    const { error: resendError } = await supabase.auth.signInWithOtp({
      phone: formData.phone,
      options: { shouldCreateUser: false }
    });
    if (resendError) throw resendError;
    setSuccess('Cod retrimis cu succes!');
  } catch (err: unknown) {
    setError(err instanceof Error ? err.message : 'Eroare la retrimitere cod');
  } finally {
    setLoading(false);
  }
};
```

---

## Verification Checklist

### Phone Input Validation
- [ ] Accept international format (+40, +1, etc.)
- [ ] Show format hint below input
- [ ] Disable field after OTP sent
- [ ] Clear field on auth method change

### OTP Input Validation
- [ ] Only show when otpSent === true
- [ ] maxLength={6} for 6-digit codes
- [ ] Center text with tracking-widest
- [ ] Clear field on resend

### Button States
- [ ] "📱 Trimite Cod SMS" when !otpSent
- [ ] "✅ Verifică Cod" when otpSent
- [ ] Loading: "Se trimite cod..." / "Se autentifică..."
- [ ] Disabled during loading

### Error Handling
- [ ] Invalid phone format
- [ ] Rate limit exceeded
- [ ] Invalid OTP code
- [ ] Expired OTP code
- [ ] Network errors

### Success Flow
- [ ] SMS received within 30 seconds
- [ ] Valid OTP code accepted
- [ ] Session created
- [ ] Redirect to / (home page)
- [ ] User logged in state persists

---

## Troubleshooting

### Issue: SMS not received
**Possible Causes:**
- Twilio credentials incorrect
- Phone number not SMS-capable
- Country not supported by Twilio
- Phone number format invalid

**Solution:**
1. Verify Twilio credentials in Supabase
2. Check Twilio logs for delivery status
3. Test with known-good phone number
4. Ensure international format (+country code)

### Issue: "Invalid or expired OTP"
**Possible Causes:**
- OTP code older than 5 minutes
- Wrong code entered
- OTP already used
- New OTP sent (invalidates old one)

**Solution:**
1. Request new OTP code
2. Enter code within 5 minutes
3. Don't request multiple codes quickly

### Issue: Rate limit error
**Possible Causes:**
- Too many requests in short time
- Exceeded hourly limit

**Solution:**
1. Wait 60 seconds between requests
2. Adjust rate limits in Supabase
3. Use cooldown timer in UI

---

## Next Steps

1. **Configure Supabase Phone Provider** (CRITICAL)
   - Enable phone authentication
   - Add Twilio credentials
   - Test with real phone number

2. **Test All Scenarios** (HIGH PRIORITY)
   - Valid phone + valid OTP
   - Invalid phone format
   - Invalid OTP code
   - Expired OTP
   - Resend functionality

3. **Implement Alternative Providers** (MEDIUM PRIORITY)
   - WhatsApp Business integration
   - Vonage fallback provider
   - Compare delivery rates

4. **Production Deployment** (AFTER TESTING)
   - Update production Supabase config
   - Add phone auth to deployment checklist
   - Monitor SMS delivery rates
   - Set up alerting for failures

---

## Cost Considerations

### Twilio Pricing (approximate)
- **SMS Cost**: $0.0075 per SMS (US)
- **Monthly Estimate**: 1000 users × 2 SMS/month = $15/month
- **Phone Number**: $1/month

### Optimization Strategies
1. **Cache phone numbers**: Reduce verification frequency for trusted devices
2. **Use Magic Links** for email users: Save SMS costs
3. **Implement rate limiting**: Prevent abuse
4. **Monitor failed attempts**: Identify fraudulent activity

---

## Security Best Practices

1. **Rate Limiting**: Prevent brute force attacks
2. **Phone Verification**: Only allow verified phone numbers
3. **OTP Expiry**: Keep short (5 minutes)
4. **No Code Display**: Never log OTP codes
5. **HTTPS Only**: Encrypt all transmission
6. **Session Management**: Short-lived tokens
7. **Logout All Devices**: On suspicious activity

---

## Documentation References

- [Supabase Phone Auth Docs](https://supabase.com/docs/guides/auth/phone-login)
- [Twilio SMS API Docs](https://www.twilio.com/docs/sms)
- [Phone Number Validation](https://www.twilio.com/docs/lookup/v2-api)
