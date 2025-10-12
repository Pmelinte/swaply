# Twilio Configuration Guide - Step by Step

## 🎯 Obiectiv
Configurarea completă a Twilio pentru autentificare SMS în Swaply.

---

## 📋 Prerequisites Checklist

### Step 1: Verifică dacă ai cont Twilio
- [ ] Mergi la https://console.twilio.com/
- [ ] Dacă NU ai cont: Click pe **Sign Up** și creează cont gratuit
- [ ] Dacă ai cont: Login cu credențialele tale

### Step 2: Obține credențialele Twilio
După login în Twilio Console:

1. **Account SID** (găsești pe dashboard principal)
   ```
   Format: ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx (34 caractere)
   Locație: Twilio Console → Dashboard → Account Info
   ```

2. **Auth Token** (găsești lângă Account SID)
   ```
   Format: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx (32 caractere)
   Locație: Twilio Console → Dashboard → Account Info → Click pe "Show" lângă Auth Token
   ```

3. **Twilio Phone Number** (trebuie să cumperi sau să verifici un număr)
   ```
   Format: +1XXXXXXXXXX (pentru SUA) sau +40XXXXXXXXX (pentru România)
   Locație: Twilio Console → Phone Numbers → Manage → Buy a number
   ```

---

## 🔧 Configuration Steps

### Step 3: Adaugă Twilio în Supabase Dashboard

1. **Login în Supabase**
   - Mergi la https://supabase.com/dashboard
   - Selectează proiectul **Swaply**

2. **Enable Phone Authentication**
   - Click pe **Authentication** în sidebar
   - Click pe **Providers**
   - Scroll până găsești **Phone**
   - Toggle switch-ul pentru a activa Phone Authentication

3. **Configure Twilio Provider**
   - În secțiunea Phone settings, selectează **Twilio** ca SMS provider
   - Completează câmpurile:
     ```
     Twilio Account SID: [paste Account SID aici]
     Twilio Auth Token: [paste Auth Token aici]  
     Twilio Phone Number: [paste numărul tău Twilio aici, format: +1234567890]
     ```

4. **Save Configuration**
   - Click pe **Save** în partea de jos
   - Verifică că apare mesaj de succes

### Step 4: Verifică Phone Provider Status

După salvare, ar trebui să vezi:
- ✅ **Phone** provider cu status **Enabled**
- ✅ **Twilio** ca SMS provider activ
- ✅ Numărul de telefon Twilio configurat

---

## 📱 Test Twilio Setup

### Option A: Test direct în Twilio Console

1. Du-te la **Twilio Console** → **Try it Out** → **Send an SMS**
2. Completează:
   - **From**: Twilio phone number (același din config)
   - **To**: Numărul tău de telefon personal
   - **Message**: "Test SMS from Swaply"
3. Click **Send**
4. Verifică dacă primești SMS-ul

### Option B: Test prin Swaply UI

1. Mergi la https://swaply-site.vercel.app/login
2. Click pe **📱 Telefon** tab
3. Introdu numărul tău (format: +40712345678 pentru România)
4. Click **📱 Trimite Cod SMS**
5. Verifică inbox-ul SMS pentru codul de 6 cifre
6. Introdu codul și click **✅ Verifică Cod**

---

## 🆓 Twilio Free Trial Information

### Ce oferă Twilio Free Trial:
- **$15 credit gratuit** la înscriere
- **SMS Cost**: ~$0.0075 per SMS (US)
- **Aproximativ 2000 SMS-uri** cu creditul gratuit
- **Restricții**: Poți trimite doar către numere verificate în trial mode

### Cum să verifici un număr în Trial Mode:

1. Du-te la **Twilio Console** → **Phone Numbers** → **Verified Caller IDs**
2. Click **Add new number**
3. Introdu numărul tău de telefon
4. Primești un cod de verificare prin SMS
5. Introdu codul pentru a verifica numărul
6. Acum poți testa autentificarea cu acest număr

---

## 🎨 Customizare SMS Template (Optional)

### În Supabase Dashboard:

1. Du-te la **Authentication** → **Templates**
2. Selectează **SMS Templates** tab
3. Găsești template-ul pentru OTP:
   ```
   Default: Your OTP code is {{ .Code }}
   ```

4. Customizează pentru Swaply:
   ```
   Codul tău Swaply: {{ .Code }}
   
   Valabil 5 minute. Nu împărtăși acest cod.
   ```

5. Click **Save**

---

## 📊 Monitoring & Debugging

### Verifică SMS delivery în Twilio:

1. Du-te la **Twilio Console** → **Monitor** → **Logs** → **Messaging**
2. Vei vedea toate SMS-urile trimise:
   - ✅ **Delivered**: SMS ajuns cu succes
   - ⏳ **Queued**: În curs de livrare
   - ❌ **Failed**: Eroare la livrare (verifică motivul)

### Common Issues:

**Issue 1: "Invalid phone number"**
- **Cauză**: Format incorect (lipsește country code)
- **Soluție**: Folosește format internațional (+40, +1, etc.)

**Issue 2: "SMS not received"**
- **Cauză**: Trial mode restricție / număr neverificat
- **Soluție**: Verifică numărul în Twilio Console

**Issue 3: "Insufficient funds"**
- **Cauză**: Credit expirat
- **Soluție**: Upgrade la plan paid sau add credit

**Issue 4: "Rate limit exceeded"**
- **Cauză**: Prea multe request-uri rapid
- **Soluție**: Așteaptă 60 secunde între requests

---

## 💰 Cost Estimation (Production)

### Monthly SMS Usage:
```
1000 utilizatori × 2 SMS/lună (login + verificare) = 2000 SMS/lună
2000 SMS × $0.0075 = $15/lună pentru SMS

Twilio Phone Number: $1/lună
Total estimat: ~$16/lună
```

### Optimization Tips:
1. **Cache phone numbers**: Reduce verification frequency
2. **Prefer Magic Link**: Save SMS costs pentru email users
3. **Implement rate limiting**: Prevent abuse
4. **Monitor failed attempts**: Identify fraud

---

## ✅ Verification Checklist

După configurare, verifică:

- [ ] Twilio Account SID configurat în Supabase
- [ ] Twilio Auth Token configurat în Supabase
- [ ] Twilio Phone Number configurat în Supabase
- [ ] Phone provider enabled în Supabase
- [ ] SMS template customizat (optional)
- [ ] Test SMS trimis și primit cu succes
- [ ] Login cu phone funcționează în production
- [ ] OTP verification funcționează
- [ ] Resend code funcționează
- [ ] Rate limiting funcționează (max 3-5 requests/oră)

---

## 🚀 Next Steps After Configuration

1. **Test Phone Auth End-to-End**
   - Send OTP → Receive SMS → Verify code → Login success

2. **Configure Rate Limits în Supabase**
   - Authentication → Rate Limits
   - Set OTP requests per hour: 3-5
   - Set verification attempts: 5 per code

3. **Deploy to Production**
   - Verifică că deployment-ul Vercel a reușit
   - Test phone auth live pe https://swaply-site.vercel.app

4. **Document Results**
   - Screenshot SMS received
   - Screenshot successful login
   - Note any issues encountered

---

## 📞 Support Resources

- **Twilio Docs**: https://www.twilio.com/docs/sms
- **Supabase Phone Auth**: https://supabase.com/docs/guides/auth/phone-login
- **Twilio Console**: https://console.twilio.com/
- **Supabase Dashboard**: https://supabase.com/dashboard

---

## 🔐 Security Notes

1. **NEVER commit Twilio credentials** to Git
2. **Use environment variables** for sensitive data
3. **Enable rate limiting** to prevent abuse
4. **Monitor SMS logs** for suspicious activity
5. **Rotate Auth Token** every 90 days
6. **Use HTTPS only** for all API calls
7. **Implement OTP expiry** (5 minutes default)

---

## 📝 Final Notes

- Configuration takes ~10 minutes
- Free trial is sufficient for testing
- Upgrade to paid plan for production
- SMS delivery is usually instant (< 30 seconds)
- Keep Twilio credentials secure and private
