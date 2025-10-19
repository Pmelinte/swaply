# Agent Memory – Swaply Project

> **Purpose**: Long-term context storage for GitHub Copilot sessions. Read this file at the start of every new session to restore knowledge without re-asking.

---

## 📅 Last Updated
**Date**: 2025-10-19  
**Session Summary**: Fixed PKCE auth persistence, prepared deployment verification.

---

## 🧠 Core Project Knowledge

### Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Auth**: Supabase (PKCE flow for OAuth, magic links, password, phone OTP, 2FA)
- **Styling**: TailwindCSS
- **Deployment**: Vercel (production: `https://swaply-site.vercel.app`)
- **i18n**: Context-based (Romanian primary, English secondary), cookie persistence
- **Database**: Supabase PostgreSQL
- **Image Storage**: Cloudinary

### Key Architecture Patterns
- **Route Groups**: `(auth)` for login/signup, `(main)` for app pages with bottom nav
- **Layout Hierarchy**: Root layout → ClientLayout → route group layouts
- **File Structure**: `app/[route]/page.tsx` pattern
- **Client vs Server**: `getBrowserSupabase()` for client, `getServerSupabase()` for server
- **Middleware**: Session refresh on every request (`middleware.ts`)
- **Server Actions**: Direct `formAction={actionFunction}` on forms, not `onSubmit`
- **State Management**: React Context for i18n, local state with `useState`

---

## 🔐 Authentication System

### Current Auth State (2025-10-19)
**Problem**: Magic link and Google OAuth were failing with `code challenge does not match previously saved code verifier` (400 error from Supabase)

**Root Cause**: PKCE `code_verifier` stored in `sessionStorage` was lost during redirects (especially cross-tab/window redirects for OAuth)

**Solution Applied**:
1. Modified `src/lib/supabase/browser.ts`:
   - Created singleton Supabase client
   - Configured `auth.storage: localStorage` (instead of default sessionStorage)
   - Set `storageKey: 'swaply.auth'` for stable persistence
   - Enabled `persistSession: true`, `autoRefreshToken: true`, `detectSessionInUrl: true`

2. Fixed lint error in `src/app/api/debug/auth/route.ts` (removed unused catch param)

3. Added TypeScript types for `mailparser` module in `types/mailparser.d.ts`

4. Fixed type guards in `tests/utils/mailbox.ts` for email parsing

**Status**: Code changes committed, lint + typecheck passing. **Awaiting Vercel deployment** to test in production.

### Auth Flow Details

#### Magic Link Flow
1. User enters email on `/login` page
2. `signInWithOtp()` sends email with magic link
3. Link contains `token_hash` parameter
4. User clicks → redirected to `/auth/callback?token_hash=...&type=magiclink&next=/`
5. Callback page:
   - Attempts `verifyOtp({ token_hash, type })`
   - If that fails but `code` exists, tries `exchangeCodeForSession(code)`
   - On success, redirects to `next` parameter (default `/`)

#### Google OAuth Flow
1. User clicks Google button on `/login`
2. `signInWithOAuth({ provider: 'google' })` redirects to Google
3. User authorizes → Google redirects back with `code` parameter
4. `/auth/callback?code=...&next=/` receives the authorization code
5. Callback page:
   - Calls `exchangeCodeForSession(code)` to exchange PKCE code for session
   - Requires `code_verifier` from storage (now in localStorage)
   - On success, sets cookies and redirects to `next`

#### PKCE Storage Strategy
- **Before fix**: `sessionStorage` (lost on redirect/new tab)
- **After fix**: `localStorage` via Supabase client config
- **Fallback**: Login page also copies PKCE keys to `localStorage` with `swaply_pkce_` prefix on `pagehide`/`beforeunload` events
- **Restoration**: Callback page calls `restorePkceStateFromLocalStorage()` to copy back to `sessionStorage` if needed

### Auth Callback Implementation
- **File**: `src/app/auth/callback/page.tsx`
- **Type**: Client component with `<Suspense>` wrapper
- **Deduplication**: Uses `useRef` to prevent double execution
- **Logging**: Sends events to `/api/debug/auth` when `NEXT_PUBLIC_LOG_AUTH_CALLBACK=1`
- **Error Handling**: Redirects to `/login?error=...` with sanitized error messages
- **Redirect Preservation**: Keeps `next` parameter through error redirects

### Supabase Dashboard Configuration
**URL**: Authentication → URL Configuration
- Site URL: `https://swaply-site.vercel.app`
- Redirect URLs: `https://swaply-site.vercel.app/auth/callback`

**Providers**:
- Email (magic link): ✅ Enabled
- Google OAuth: ✅ Enabled (Client ID + Secret configured)
- Phone (SMS/OTP): ✅ Enabled (Twilio integration)

---

## 🚀 Deployment

### Vercel Setup
- **Project**: swaply
- **Production Branch**: `main`
- **Auto-deploy**: Enabled on push to main
- **Build Command**: `npm run build`
- **Environment Variables**: Set in Vercel dashboard

### Required Environment Variables (Production)
```env
NEXT_PUBLIC_SITE_URL=https://swaply-site.vercel.app
NEXT_PUBLIC_SUPABASE_URL=https://ooebonjoqrpouzfjiiiz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon key from Supabase]
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=[cloudinary cloud name]
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=[cloudinary preset]
GOOGLE_CLIENT_ID=[from Google Cloud Console]
GOOGLE_CLIENT_SECRET=[from Google Cloud Console]
```

### Deployment Process
1. Ensure `npm run lint` and `npm run typecheck` pass locally
2. Commit changes to `main` branch
3. Push to GitHub
4. Vercel auto-deploys (monitor in Vercel dashboard)
5. Wait for "Ready" status
6. Test on production URL

---

## 🛠️ Development Commands

```bash
# Development
npm run dev              # Start dev server (localhost:3000)

# Quality checks (run before deploy)
npm run lint             # ESLint (max-warnings=0)
npm run typecheck        # TypeScript validation
npm run check            # Both lint + typecheck

# Build
npm run build            # Production build

# Code generation (Plop)
npm run plop page        # Create new page
npm run plop component   # Create new component
npm run plop hook        # Create custom hook
npm run plop api         # Create API route

# Testing
npm run test:auth        # Auth flow tests
node scripts/test-10-diagnostics.js  # 10-method auth diagnostics
```

### Diagnostic Scripts
- `scripts/test-10-diagnostics.js`: Automated checks for auth callback, PKCE, OAuth config, middleware
- `scripts/verify-5-paths.js`: Five verification pathways post-fix
- Output includes automated checks + manual verification steps for Supabase dashboard

---

## 🐛 Known Issues & Workarounds

### Google Maps Warnings (Non-Critical)
- Console shows "initMap is not a function" and "API loaded multiple times"
- **Cause**: Multiple `LoadScript` instances in React components
- **Impact**: Visual noise in console, but doesn't affect functionality
- **TODO**: Consolidate to single LoadScript with constant `libraries` array

### Manifest.json Parse Error (Non-Critical)
- Error: "Line 115, column 1, Unexpected token"
- **Cause**: Likely trailing comma in `public/manifest.json`
- **Impact**: PWA install might be affected
- **TODO**: Validate and fix JSON syntax

### Service Worker Warnings
- "A listener indicated an asynchronous response..." 
- **Cause**: Could be browser extension or SW event handler
- **Impact**: None observed, likely external
- **TODO**: Review `public/sw.js` for async response patterns

---

## 📋 Active Tasks

### Immediate (Post-Deployment)
1. **Verify Auth Fixes on Production**
   - Test magic link flow end-to-end
   - Test Google OAuth flow end-to-end
   - Check console for `pkceRestored: true` in callback
   - Confirm no 400 errors from `/auth/v1/token?grant_type=pkce`
   - Document results in this file

2. **Clean Up Console Warnings**
   - Fix Google Maps multiple load issue
   - Fix manifest.json syntax error
   - Review service worker listeners

### Backlog
- Implement advanced search features
- Continue gamification system
- Distance-based matching algorithm
- Rating reminders system
- Two-factor authentication improvements

---

## 🔑 Permissions & Autonomy Rules

### What Agent CAN Do Autonomously
- Read any file in the repository
- Run `npm run lint`, `npm run typecheck`, diagnostic scripts
- Create/modify files in `docs/`, `scripts/`, `tests/` directories
- Create type declarations in `types/`
- Fix lint/type errors in any file
- Update this memory file (`docs/agent-memory.md`)
- Propose code changes with full explanations

### What Agent MUST Ask Before Doing
- Modifying authentication logic (`src/app/auth/`, `src/lib/supabase/`)
- Changing database schema or migrations
- Modifying environment variable requirements
- Deploying to Vercel (commit + push)
- Deleting files
- Major refactoring (>100 lines changed in core files)

### What Agent CANNOT Do
- Access production database directly
- Read emails or IMAP (no credentials available in session)
- Make API calls to external services without explicit instruction
- Remember context across sessions (must read this file instead)

---

## 📖 Historical Context

### Major Milestones
1. **Initial Setup**: Next.js 15 + Supabase + Tailwind architecture
2. **Sprint 1**: Basic object listing, user profiles, auth flows
3. **Sprint 2**: Matching algorithm, chat system, notifications
4. **Sprint 3**: Gamification, ratings, travel suggestions
5. **Current Sprint**: Auth stability fixes (PKCE persistence)

### Key Decisions
- **Why localStorage for PKCE**: sessionStorage is cleared on cross-tab redirects; localStorage persists across tabs/windows
- **Why singleton Supabase client**: Avoids multiple auth state instances competing
- **Why client-side callback**: Supabase SSR helpers require client component for `exchangeCodeForSession`
- **Why Suspense wrapper**: `useSearchParams` requires Suspense in client components (Next.js 15 requirement)

### Previous Issues Resolved
- Hydration errors with Google Maps (fixed with proper initialization)
- Magic link template rendering issues (moved to Supabase email templates)
- OAuth redirect loops (fixed by preserving `next` parameter)
- PKCE verifier loss (fixed in current session, pending production verification)

---

## 🎯 Success Criteria

### For Current Auth Fix
- [ ] Magic link login works without errors
- [ ] Google OAuth login works without errors
- [ ] Console shows `pkceRestored: true` in callback
- [ ] No 400 errors from Supabase token endpoint
- [ ] Session persists after redirect
- [ ] User lands on intended page (via `next` parameter)

### For Full Project
- Users can sign up and log in via multiple methods
- Object swapping flows work end-to-end
- Matching algorithm suggests relevant swaps
- Real-time notifications work
- Gamification system tracks points/badges
- Mobile-responsive on all pages
- No critical console errors in production

---

## 🔄 Session Handoff Protocol

### At Start of New Session
1. **Agent reads this file first** (`docs/agent-memory.md`)
2. Agent checks todo list status (`manage_todo_list` read)
3. Agent asks user: "What should we work on today?" or confirms continuation of active task
4. If unclear, agent reviews "Active Tasks" section above

### During Session
- When reaching a milestone, agent asks: "Should I update the memory file?"
- User can say "actualizează memoria" anytime to trigger update
- Agent adds new findings to relevant sections (don't duplicate, just append/update)

### At End of Session
- Agent summarizes what was done
- Agent updates "Last Updated" timestamp and "Session Summary" at top
- Agent marks completed tasks in "Active Tasks" section
- Agent notes any new blockers or next steps

---

## 📝 Notes & Tips

### For Future Sessions
- Always run `npm run lint` and `npm run typecheck` before suggesting code is ready for deploy
- Check `scripts/test-10-diagnostics.js` output to validate auth changes
- When debugging auth, look at Network tab for actual Supabase API responses
- PKCE errors usually mean storage issue, not code logic
- Google Maps errors are cosmetic, ignore unless user complains

### Common Pitfalls
- Don't modify auth callback without testing both magic link AND OAuth flows
- Don't assume sessionStorage persists across redirects
- Don't skip TypeScript checks (even if build ignores them, they catch real bugs)
- Don't forget to preserve `next` parameter in error redirects

### User Preferences (Inferred)
- Prefers detailed explanations over quick fixes
- Values code quality (lint/typecheck must pass)
- Wants to understand root causes, not just symptoms
- Appreciates transparency about what agent can/cannot do
- Frustrated by repetitive work or losing context between sessions

---

## 🔗 Important Files Reference

### Authentication
- `src/lib/supabase/browser.ts` - Browser Supabase client (singleton with localStorage)
- `src/lib/supabase/server.ts` - Server Supabase client
- `src/app/auth/callback/page.tsx` - OAuth/magic link callback handler
- `src/app/(auth)/login/page.tsx` - Login form with all auth methods
- `middleware.ts` - Session refresh middleware

### Configuration
- `.env.local` - Local environment variables (not in repo)
- `vercel.json` - Vercel deployment config
- `next.config.ts` - Next.js configuration
- `tailwind.config.ts` - Tailwind CSS configuration

### Documentation
- `.github/copilot-instructions.md` - Project conventions and patterns
- `docs/agent-memory.md` - This file (long-term context)
- `AUTH_PKCE_FIX.md` - Detailed auth PKCE fix documentation
- `DEPLOYMENT_SUCCESS.md` - Deployment guide

### Testing
- `scripts/test-10-diagnostics.js` - 10-method auth diagnostics
- `scripts/verify-5-paths.js` - Verification pathways
- `tests/utils/mailbox.ts` - E2E magic link email polling

---

## 🆘 Emergency Contacts

### If Session Breaks
1. Re-read this file (`docs/agent-memory.md`)
2. Check git log: `git log --oneline -20`
3. Check uncommitted changes: `git status`
4. Ask user: "I see we were working on [X]. Should I continue or start fresh?"

### If Build Fails
1. Check `npm run lint` output
2. Check `npm run typecheck` output
3. Review Vercel deployment logs in dashboard
4. Check recent commits for breaking changes

### If Auth Still Fails After Deploy
1. Open browser DevTools → Network tab
2. Reproduce login flow
3. Find `/auth/v1/token?grant_type=pkce` request
4. Copy full response body
5. Check console for callback logs (look for `🔁`, `✅`, `❌` emojis)
6. Report findings to user with specific error messages

---

**End of Agent Memory File**  
_This file should be the first thing read in every new session._
