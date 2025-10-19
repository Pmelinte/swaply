# Autonomy Framework – Permissions

> **Purpose**: Define clear boundaries for autonomous agent operation. Read before taking any action.

---

## ✅ GREEN ZONE – Autonomous Actions (No Approval Needed)

### File Operations
- **Read any file** in the repository
- **Create/modify files** in these directories:
  - `docs/` (documentation)
  - `scripts/` (utility scripts)
  - `tests/` (test files)
  - `types/` (TypeScript type declarations)
  - `.github/` (CI/CD workflows, PR templates)
  - `plop-templates/` (code generation templates)

### Code Quality
- Run `npm run lint` to check code style
- Run `npm run typecheck` to validate TypeScript
- Run `npm run check` (combines lint + typecheck)
- Run diagnostic scripts like `node scripts/test-10-diagnostics.js`
- Fix lint errors (unused imports, trailing commas, etc.)
- Fix TypeScript type errors (add missing types, fix type mismatches)

### Documentation
- Update `docs/agent-memory.md` with new findings
- Create new documentation files in `docs/`
- Update inline code comments
- Add JSDoc annotations to functions

### Diagnostics
- Read console logs from browser DevTools (when user provides screenshots)
- Analyze Network tab responses (when user provides details)
- Run test suites (`npm test`, `npm run test:e2e`)
- Review git history (`git log`, `git diff`)
- Check package dependencies (`npm list`, `npm outdated`)

### Proposals
- Suggest code changes with full explanations
- Propose architectural improvements
- Recommend testing strategies
- Draft commit messages
- Create TODO lists for complex tasks

---

## 🟡 YELLOW ZONE – Requires Confirmation

### Code Changes (Non-Critical)
- Modify components in `src/components/`
- Modify utility functions in `src/lib/`
- Modify API routes in `src/app/api/` (except auth-related)
- Modify page components in `src/app/` (except auth pages)
- Add new npm dependencies (explain why needed)
- Update existing dependencies (explain breaking changes)

### Configuration Changes
- Modify `next.config.ts` (explain impact)
- Modify `tailwind.config.ts` (explain styling changes)
- Modify `eslint.config.mjs` (explain rule changes)
- Modify `tsconfig.json` (explain compiler option changes)
- Add new environment variables (document in `env.example`)

### Database & Schema
- Create new database migration files
- Modify existing migrations (with clear rollback plan)
- Add new RLS policies
- Modify seed data scripts

### Testing
- Create new test files
- Modify existing tests (explain coverage impact)
- Add E2E test scenarios
- Update test configuration

### Process Improvements
- Suggest new git workflows
- Propose CI/CD pipeline changes
- Recommend new tooling (explain benefits vs. complexity)

**Confirmation Pattern**:
1. Agent explains what needs to change and why
2. Agent shows code diff or plan
3. User says "ok" / "da" / "continua" → proceed
4. User says "nu" / "stop" / "altfel" → stop and discuss alternatives

---

## 🔴 RED ZONE – Always Ask First

### Critical Code Changes
- **Authentication logic**: `src/app/auth/`, `src/lib/supabase/`, `middleware.ts`
- **Payment processing**: Any code handling money/transactions
- **Database schema core tables**: users, objects, swaps, messages
- **Security configurations**: CORS, CSP headers, auth cookies
- **Supabase RLS policies**: Changes affect data access security

### Deployment & Operations
- Commit changes to git (agent proposes, user reviews and commits)
- Push to GitHub (triggers Vercel deploy)
- Modify Vercel configuration in dashboard
- Change environment variables in production
- Database migrations in production
- Rollback deployments

### External Services
- Make API calls to Supabase (read operations OK, writes need approval)
- Send emails via SMTP/Supabase
- Upload files to Cloudinary
- Make requests to Google APIs
- Access any service with API keys

### Data Operations
- Delete user data
- Modify production database records
- Export sensitive data
- Clear caches that affect users

### Major Refactoring
- Change core architecture patterns
- Switch libraries/frameworks
- Rename widely-used functions/types
- Move files across major directory boundaries
- Delete files (except obvious temp files like `.DS_Store`)

**Ask Pattern**:
1. Agent explains the situation
2. Agent proposes options (usually 2-3 alternatives)
3. Agent highlights risks and benefits
4. Wait for explicit user decision before proceeding

---

## ⛔ FORBIDDEN – Never Do

### Absolute Prohibitions
- **Never commit/push without explicit user instruction**
- **Never modify production database directly** (no raw SQL queries outside migrations)
- **Never expose secrets** (API keys, passwords) in code or logs
- **Never delete git history** (no force push, no rebase of shared branches)
- **Never disable security features** (auth checks, CORS, RLS) without documented justification
- **Never make assumptions about user data** (always validate inputs)

### Security Rules
- Never log sensitive data (passwords, tokens, PII)
- Never disable SSL/TLS in any environment
- Never hardcode credentials (use environment variables)
- Never bypass authentication checks
- Never expose admin endpoints without proper auth

### Code Quality Rules
- Never skip TypeScript checks just to make build pass
- Never add `// @ts-ignore` without comment explaining why
- Never commit code that fails `npm run lint`
- Never ship `console.log` in production code (use proper logging)
- Never leave commented-out code blocks (delete or document why kept)

---

## 🎯 Decision Framework

When unsure which zone an action falls into, use this decision tree:

```
1. Does it affect user security or data?
   YES → 🔴 RED ZONE (ask first)
   NO → Continue to 2

2. Does it change core functionality?
   YES → 🟡 YELLOW ZONE (get confirmation)
   NO → Continue to 3

3. Is it reversible via git?
   NO → 🟡 YELLOW ZONE (get confirmation)
   YES → Continue to 4

4. Does it fix a bug or improve code quality?
   YES → ✅ GREEN ZONE (proceed autonomously)
   NO → 🟡 YELLOW ZONE (explain benefit first)
```

---

## 📋 Pre-Action Checklist

Before making any code change:

- [ ] Is this action within my GREEN ZONE permissions?
- [ ] If YELLOW/RED, have I explained the change clearly?
- [ ] Have I considered side effects and edge cases?
- [ ] Will this break existing functionality?
- [ ] Can this be tested locally before deploy?
- [ ] Have I updated relevant documentation?
- [ ] Will `npm run lint` and `npm run typecheck` pass?

---

## 🔄 Escalation Path

If blocked or uncertain:

1. **Explain the situation**: "I need to [do X], but it affects [Y]. This falls into [ZONE]."
2. **Present options**: "We could: A) [safe option], B) [optimal option], C) [alternative]."
3. **Recommend**: "I suggest [option] because [reasoning]."
4. **Wait for decision**: Do not proceed until user confirms.

If user is unavailable:
- Document the blocker in `docs/agent-memory.md` under "Active Tasks"
- Move to next available task in GREEN ZONE
- Summarize what was attempted and why it's blocked

---

## 🛡️ Safety Nets

### Before Any Deployment
1. Run `npm run lint` (must pass)
2. Run `npm run typecheck` (must pass)
3. Review git diff (`git diff --stat`)
4. Verify environment variables are set
5. Check Supabase dashboard config matches code

### Before Database Changes
1. Create migration with down migration (rollback plan)
2. Test migration on local Supabase
3. Backup production data if modifying existing tables
4. Document migration in `database/migrations/README.md`

### Before Auth Changes
1. Run `node scripts/test-10-diagnostics.js`
2. Test all auth flows locally (password, magic link, OAuth, phone)
3. Verify session persistence across page refreshes
4. Check that logout works correctly

---

## 📞 Communication Protocol

### Status Updates
- **Milestone reached**: "✅ Completed [task]. Next: [next task]."
- **Blocked**: "⚠️ Blocked on [issue]. Need [input/decision/access]."
- **Error encountered**: "❌ Error: [description]. Investigating..."
- **Ready for review**: "🔍 Changes ready. Please review: [summary]."

### Questions
- **Clarification**: "Just to confirm: you want [X], which means [Y], correct?"
- **Decision needed**: "Two options: A) [pros/cons], B) [pros/cons]. Your preference?"
- **Scope question**: "Should I also [related task], or focus only on [current task]?"

### Warnings
- **Risk detected**: "⚠️ Warning: [action] will affect [system]. Recommend [safer alternative]."
- **Breaking change**: "🚨 Breaking change: [what breaks] for [who/what]. Migration needed: [plan]."
- **Security concern**: "🔒 Security: [issue description]. Must [required action] before proceeding."

---

**End of Permissions File**  
_If in doubt, ask. Better to over-communicate than break production._
