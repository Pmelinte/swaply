# 🧪 TEST MANUAL - Magic Link Flow

**Data:** 2025-10-12  
**Fix:** PKCE Error - commit e9f8565  
**Site:** https://swaply-site.vercel.app

---

## ✅ CHECKLIST DE TEST

### 1. Verificare Supabase Configuration

**URL Dashboard:** https://supabase.com/dashboard/project/ooebonjoqrpouzfjiiiz/auth/url-configuration

**Verifică că ai setat:**
- [ ] **Site URL:** `https://swaply-site.vercel.app`
- [ ] **Redirect URLs:** Include `https://swaply-site.vercel.app/auth/callback`

**Exemplu Redirect URLs format corect:**
```
https://swaply-site.vercel.app/auth/callback
http://localhost:3000/auth/callback
```

**Screenshot-uri necesare:**
- [ ] Screenshot cu Site URL
- [ ] Screenshot cu Redirect URLs

---

### 2. Test Magic Link End-to-End

#### Pasul 1: Accesează Login Page

```
URL: https://swaply-site.vercel.app/login
```

**Verificări:**
- [ ] Pagina se încarcă (status 200)
- [ ] Există tab "✨ Link Magic"
- [ ] Există input pentru email

---

#### Pasul 2: Trimite Magic Link

**Acțiuni:**
1. [ ] Click pe tab "✨ Link Magic"
2. [ ] Introduce email: `___________________`
3. [ ] Click pe butonul "Trimite Link Magic"

**Rezultat așteptat:**
- [ ] Mesaj de confirmare: "Email trimis! Verifică inbox-ul."
- [ ] NU apare eroare în UI

**Dacă apare eroare:**
- Screenshot cu eroarea: ___________
- Mesaj de eroare exact: ___________

---

#### Pasul 3: Verifică Email-ul

**Unde să cauți:**
- [ ] Inbox principal
- [ ] Folder Spam/Junk
- [ ] Folder Promotions (Gmail)

**Email așteptat:**
- **Subject:** "Magic Link" sau similar
- **From:** noreply@mail.app.supabase.io sau SMTP configurat
- **Content:** Link de tip `https://swaply-site.vercel.app/auth/callback?token=...`

**Timing:**
- Ar trebui să primești email-ul în **< 30 secunde**

**Dacă NU primești email:**
- [ ] Verifică Supabase Email Settings
- [ ] Verifică rate limiting (max 3-4 emails/oră în dev mode)
- [ ] Verifică logs Supabase pentru email sending

---

#### Pasul 4: Click pe Link din Email

**Înainte de click, deschide DevTools:**
1. [ ] Apasă F12 (deschide DevTools)
2. [ ] Click pe tab "Network"
3. [ ] Bifează "Preserve log"
4. [ ] Click pe tab "Console"

**Acum click pe link din email.**

---

#### Pasul 5: Monitorizare Redirect Chain

**Ce ar trebui să vezi în Network tab:**

```
1. Request: /auth/callback?code=...
   Status: 307 Temporary Redirect
   Location: /
   
2. Request: /
   Status: 200 OK
```

**Cookies setate (Application → Cookies):**
- [ ] `sb-ooebonjoqrpouzfjiiiz-auth-token` (session token)
- [ ] `sb-ooebonjoqrpouzfjiiiz-auth-token.0` (chunked token dacă e mare)
- [ ] `sb-ooebonjoqrpouzfjiiiz-auth-token-code-verifier` (temporar, dispare după exchange)

---

#### Pasul 6: Verificare Login Success

**După redirect la homepage, verifică:**

**UI Changes:**
- [ ] În header apare butonul "Profil" sau "👤" sau numele user
- [ ] NU mai apare butonul "Autentificare"
- [ ] Bottom navigation are iconițe active (Home, Adaugă, Chat, Profil)

**Test Manual:**
- [ ] Click pe "Profil" → Ar trebui să meargă la `/profil`
- [ ] Click pe "Adaugă Obiect" → Ar trebui să meargă la `/obiecte/nou`
- [ ] Refresh page (F5) → Session persistă, rămâi logat

**Console Logs (ar trebui să vezi):**
```
🔄 Middleware: Skipping session check for auth callback
✅ Auth callback successful, user: [email]
```

---

## ❌ PROBLEME POSIBILE

### Problema 1: Eroarea PKCE încă apare

**Eroare:**
```
❌ invalid request: both auth code and code verifier should be non-empty
```

**Cauze posibile:**
1. Cookies nu sunt persistate corect
2. Browser blochează third-party cookies
3. Extensii de browser interferează

**Debug Steps:**
```powershell
# 1. Verifică logs Vercel
# Accesează: https://vercel.com/pmellintes-projects/swaply
# → Click pe deployment → Functions → Caută erori

# 2. Test în Incognito Mode
# Chrome: Ctrl+Shift+N
# Edge: Ctrl+Shift+P

# 3. Verifică că middleware skip funcționează
# Logs ar trebui să conțină:
# "🔄 Middleware: Skipping session check for auth callback"
```

---

### Problema 2: "Email link is invalid or has expired"

**Cauze:**
- Link-ul expiră după 1 oră (default Supabase)
- Link-ul poate fi folosit o singură dată
- Redirect URL nu matches cu Supabase config

**Fix:**
1. Cere un nou Magic Link
2. Verifică Supabase Redirect URLs configuration
3. Asigură-te că URL-ul site-ului este corect

---

### Problema 3: Nu primești email

**Cauze:**
- Rate limiting (Supabase free tier: ~3-4 emails/oră)
- Email în spam
- SMTP nu e configurat

**Debug:**
```
1. Accesează Supabase Dashboard
   → Authentication → Logs
   
2. Verifică dacă apare "Email sent" event

3. Dacă NU apare, verifică:
   → Project Settings → Auth → Email Templates
   → Confirmă că "Confirm signup" template e activ
```

---

### Problema 4: Redirectează la login după click

**Cauze:**
- Session nu se creează după code exchange
- Middleware redirect user neautentificat

**Debug:**
```javascript
// În Console, după click pe link, rulează:
document.cookie.split(';').filter(c => c.includes('sb-'))

// Ar trebui să vezi cookies de tip:
// "sb-ooebonjoqrpouzfjiiiz-auth-token=..."
```

**Dacă NU vezi cookies:**
- Check Vercel Function logs pentru erori
- Verifică că `exchangeCodeForSession` returnează session valid

---

## 📊 REZULTATE TEST

### Test Execution

| Step | Status | Notes |
|------|--------|-------|
| 1. Supabase Config | ⬜ | Site URL + Redirect URLs |
| 2. Login Page Load | ⬜ | Status 200 |
| 3. Send Magic Link | ⬜ | Confirmation message |
| 4. Receive Email | ⬜ | Within 30s |
| 5. Click Link | ⬜ | Redirect chain |
| 6. Login Success | ⬜ | Profil visible |
| 7. Session Persist | ⬜ | After refresh |

**Legend:**
- ⬜ Not Started
- ⏳ In Progress
- ✅ Passed
- ❌ Failed

---

### Success Criteria

**✅ TEST PASSED dacă:**
1. Email primit în < 30 secunde
2. Click pe link → redirect la homepage
3. User logat automat (vezi buton Profil)
4. Session persistă după refresh
5. NU apare eroarea PKCE

**❌ TEST FAILED dacă:**
1. Eroarea PKCE încă apare
2. Nu primești email
3. Redirectează la login după click
4. Session nu persistă

---

## 📝 RAPORTARE REZULTATE

**După ce completezi testul, raportează:**

```
✅/❌ Test Status: _________

✅/❌ PKCE Error: _________
✅/❌ Email Received: _________
✅/❌ Login Successful: _________
✅/❌ Session Persists: _________

Screenshots:
- [ ] Login page cu Magic Link tab
- [ ] Email inbox cu Magic Link
- [ ] Homepage după login (cu buton Profil vizibil)
- [ ] DevTools cookies showing session tokens

Logs:
- [ ] Console logs din browser (F12 → Console)
- [ ] Network logs (F12 → Network)
- [ ] Vercel Function logs (dacă sunt erori)
```

---

## 🎯 NEXT STEPS DUPĂ TEST

### Dacă testul PASSED ✅
1. Update `FORCE_DEPLOY.md` cu status "✅ TESTED - SUCCESS"
2. Merge `vercel-deployment` → `main` (când GitHub checks pass)
3. Documentează că Magic Link flow e functional

### Dacă testul FAILED ❌
1. Colectează logs și screenshots
2. Identifică exact la ce step eșuează
3. Raportează pentru additional debugging:
   - Error message exact
   - Browser used
   - Timestamp când s-a întâmplat
   - Console logs
   - Network logs

---

**Test Created:** 2025-10-12  
**Fix Version:** e9f8565  
**Expected Duration:** 5-10 minute  
**Tester:** ___________  
**Test Date:** ___________
