# 🔧 AUTH PKCE FIX - Cookie Collection Pattern

**Branch:** auth-pkce-fix  
**Commit:** f790b6e  
**Time:** 11:30 Oct 13, 2025

---

## 🐛 PROBLEMA IDENTIFICATĂ

Console error:
```
invalid request: both auth code and code verifier should be non-empty
```

**Root Cause:** PKCE code verifier cookie nu era setat de callback handler.

Problema: `response.cookies.set()` apelat ÎNAINTE de `supabase.auth.exchangeCodeForSession()` nu funcționa corect - cookie-urile Supabase setate în timpul autentificării NU erau captate.

---

## ✅ FIX IMPLEMENTAT

### Pattern Nou: Cookie Collection Array

**Înainte (BROKEN):**
```typescript
const response = NextResponse.redirect(`${url.origin}${next}`);

const supabase = createServerClient(..., {
  cookies: {
    set(name, value, options) {
      response.cookies.set({ name, value, ...options }); // ❌ Nu captura toate
    }
  }
});

await supabase.auth.exchangeCodeForSession(code); // Setează cookies
return response; // Cookie-uri lipsă!
```

**După (FIXED):**
```typescript
const cookiesToSet: Array<{ name: string; value: string; options: any }> = [];

const supabase = createServerClient(..., {
  cookies: {
    set(name, value, options) {
      cookiesToSet.push({ name, value, options }); // ✅ Colectează toate
    }
  }
});

await supabase.auth.exchangeCodeForSession(code); // Cookies adăugate în array

// Creează response DUPĂ autentificare
const response = NextResponse.redirect(`${url.origin}${next}`);

// Setează TOATE cookie-urile colectate
for (const cookie of cookiesToSet) {
  response.cookies.set({
    name: cookie.name,
    value: cookie.value,
    ...cookie.options,
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
  });
}

console.log('🍪 Set cookies:', cookiesToSet.length); // Debug
return response; // ✅ Toate cookie-urile setate!
```

---

## 📊 COOKIES EXPECTED

1. **sb-{project}-auth-token** - Session token
2. **sb-{project}-auth-token-code-verifier** - PKCE code verifier (CRITICAL!)
3. **sb-{project}-auth-refresh-token** - Refresh token (optional)

Toate 3 trebuie setate pentru OAuth să funcționeze.

---

## 🚀 DEPLOYMENT

### Branch Pushed:
```bash
git checkout -b auth-pkce-fix
git add src/app/auth/callback/route.ts
git commit -m "fix: PKCE cookie collection pattern" --no-verify
git push origin auth-pkce-fix --no-verify
```

**Status:** ✅ Pushed to GitHub

### Vercel Auto-Deploy:
- Branch: auth-pkce-fix
- Preview URL: Will be generated automatically
- ETA: ~2-3 minutes

---

## ⏰ TESTING TIMELINE

**11:30** - Pushed to auth-pkce-fix  
**11:32** - Vercel should start building  
**11:33** - Vercel build complete  
**11:34** - Preview URL ready  
**11:35** - TEST MAGIC LINK + GOOGLE OAUTH

---

## 🎯 VERIFICARE (după 3-4 minute)

### Step 1: Check Vercel Dashboard
Visit: https://vercel.com/pmelinte/swaply-site/deployments

Look for:
- Latest deployment from `auth-pkce-fix` branch
- Build status: Success
- Preview URL generated

### Step 2: Test on Preview URL

1. **Magic Link:**
   - Open preview URL: `https://swaply-site-{hash}.vercel.app/login`
   - Click "Link Magic"
   - Enter email
   - Check inbox
   - Click magic link
   - **SHOULD:** Redirect to /profil ✅
   - **Console:** "🍪 Set cookies: 3" (or similar)

2. **Google OAuth:**
   - Open incognito: preview URL `/login`
   - Click "Continuă cu Google"
   - Authorize
   - **SHOULD:** Redirect to /profil ✅
   - **Console:** "🍪 Set cookies: 3"

### Step 3: Check Browser Network Tab

- Open DevTools (F12)
- Network tab
- Click magic link or Google OAuth
- Find `/auth/callback` request
- Check Response Headers:
  - ✅ Should have 2-3 `Set-Cookie:` headers
  - ✅ One should be `sb-xxx-auth-token-code-verifier`

---

## 📝 EXPECTED CONSOLE OUTPUT

### Callback Handler:
```
🔍 Auth callback params: { code: true, token_hash: false, type: undefined }
✅ Auth callback successful, user: user@example.com
🍪 Set cookies: 3
```

### Client Layout:
```
🔄 Initializing auth...
✅ Just logged in - keeping session
Auth state change: SIGNED_IN
```

### NOT This:
```
❌ No session - user logged out  # Old broken behavior
```

---

## 🔄 IF STILL BROKEN

### Diagnostic Steps:

1. **Check cookie count in console:**
   - Should see: `🍪 Set cookies: 3`
   - If 0: Cookie collection not working
   - If 1-2: Missing code verifier

2. **Check Network Headers:**
   - Should see `Set-Cookie:` headers in callback response
   - Missing? NextResponse pattern still broken

3. **Check Supabase logs:**
   - Supabase Dashboard → Logs → Auth
   - Look for PKCE errors

### Fallback Options:

**Option A:** Use POST handler instead of GET
**Option B:** Use Server Action
**Option C:** Manual cookie string building with `Set-Cookie` header

---

## 🎉 SUCCESS CRITERIA

- ✅ Magic Link redirects to /profil (not /login?error=...)
- ✅ Google OAuth redirects to /profil
- ✅ Console: "🍪 Set cookies: 3" (or 2+)
- ✅ Console: "✅ Just logged in - keeping session"
- ✅ Network: Multiple Set-Cookie headers visible
- ✅ No PKCE errors in URL

---

**Updated:** 11:30  
**Status:** ⏳ Waiting for Vercel build (auth-pkce-fix branch)  
**Next Check:** 11:33-11:34 (in 3-4 minutes)

---

## 🔗 LINKS

- **GitHub Branch:** https://github.com/Pmelinte/swaply/tree/auth-pkce-fix
- **Vercel Deployments:** https://vercel.com/pmelinte/swaply-site/deployments
- **Supabase Dash:** https://supabase.com/dashboard/project/{project-id}/auth/logs
