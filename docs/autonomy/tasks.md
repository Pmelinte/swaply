# Autonomy Framework – Task Management

> **Purpose**: Track work items, priorities, and dependencies. Update after each completed task.

---

## 📋 Active Tasks

### 🔥 High Priority (Blocking)

#### 1. Verify Auth Fixes on Production
**Status**: Ready for testing  
**Assignee**: User (manual testing required)  
**Blocked By**: Vercel deployment  
**Description**: After deploying the PKCE localStorage fix, verify:
- Magic link login works without errors
- Google OAuth login works without errors
- Console shows `pkceRestored: true` in `/auth/callback`
- No 400 errors from `/auth/v1/token?grant_type=pkce`

**Acceptance Criteria**:
- [ ] Magic link: User receives email, clicks link, logs in successfully
- [ ] Google OAuth: User clicks Google button, authorizes, logs in successfully
- [ ] No console errors related to PKCE
- [ ] Session persists after page refresh
- [ ] User lands on intended destination (e.g., `/` or original `next` param)

**Next Steps**:
1. User commits recent changes (`browser.ts`, `route.ts`, `mailparser.d.ts`, `mailbox.ts`)
2. User pushes to `main` branch
3. Vercel auto-deploys
4. User tests both flows on `https://swaply-site.vercel.app`
5. User reports results → update `docs/agent-memory.md` with findings

---

### ⚙️ Medium Priority (Quality Improvements)

#### 2. Fix Google Maps Console Warnings
**Status**: Not started  
**Assignee**: Agent  
**Blocked By**: None  
**Description**: Clean up console errors related to Google Maps:
- "initMap is not a function"
- "API loaded multiple times"
- "Element with name 'gmp-*' already defined"
- Performance warning about LoadScript reloading

**Root Cause**: Multiple `LoadScript` instances with dynamic `libraries` array prop.

**Solution**:
1. Move `libraries` array outside component (make it constant)
2. Ensure only one `LoadScript` wrapper in app hierarchy
3. Remove `callback=initMap` parameter (React Google Maps handles initialization)
4. Verify no duplicate Google Maps script tags in HTML

**Files to Check**:
- Search for `LoadScript` usage: `grep -r "LoadScript" src/`
- Search for Google Maps API script tags: `grep -r "maps.googleapis.com" src/`

**Acceptance Criteria**:
- [ ] No Google Maps errors in browser console
- [ ] Maps render correctly on all pages that use them
- [ ] No performance warnings about LoadScript

---

#### 3. Fix Manifest.json Parse Error
**Status**: Not started  
**Assignee**: Agent (can fix autonomously)  
**Blocked By**: None  
**Description**: Console error: "Manifest: Line 115, column 1, Unexpected token."

**Root Cause**: Invalid JSON syntax in `public/manifest.json` (likely trailing comma).

**Solution**:
1. Read `public/manifest.json`
2. Validate JSON syntax (look for trailing commas, unclosed brackets)
3. Fix and test locally

**Acceptance Criteria**:
- [ ] Manifest validates with `node -e "JSON.parse(fs.readFileSync('public/manifest.json'))"`
- [ ] No manifest errors in browser console
- [ ] PWA installation works correctly

---

### 📚 Low Priority (Backlog)

#### 4. Advanced Search Features
**Status**: Not started  
**Planned Sprint**: Future  
**Description**: Implement advanced object search with filters:
- Category filters
- Location-based search (distance radius)
- Keyword search in title/description
- Sort by: newest, closest, most relevant

**Reference Doc**: `ADVANCED_SEARCH.md`

---

#### 5. Rating Reminders System
**Status**: Not started  
**Planned Sprint**: Future  
**Description**: Send reminders to users to rate completed swaps.

**Reference Doc**: `RATING_REMINDERS.md`

---

#### 6. Distance-Based Matching
**Status**: Not started  
**Planned Sprint**: Future  
**Description**: Enhance matching algorithm to consider geographic proximity.

**Reference Doc**: `DISTANCE_SEARCH.md`

---

## ✅ Recently Completed

### 2025-10-19: PKCE Auth Persistence Fix
**Problem**: Magic link and Google OAuth failing with "code challenge does not match previously saved code verifier"

**Solution**: Modified `src/lib/supabase/browser.ts` to use localStorage singleton client with stable `storageKey`

**Files Changed**:
- `src/lib/supabase/browser.ts` (singleton + localStorage config)
- `src/app/api/debug/auth/route.ts` (removed unused catch param)
- `types/mailparser.d.ts` (added module declaration)
- `tests/utils/mailbox.ts` (fixed type guards)

**Status**: ✅ Code complete, lint/typecheck passing, awaiting deployment verification

---

### 2025-10-19: Autonomy Framework Creation
**Deliverables**:
- `docs/agent-memory.md` (comprehensive project memory)
- `docs/autonomy/permissions.md` (autonomous operation rules)
- `docs/autonomy/tasks.md` (this file)

**Status**: ✅ Complete

---

## 🚧 Blocked Tasks

_(None currently)_

---

## 📊 Task Categories

### Bug Fixes
- Console warnings (Google Maps, Manifest)
- Type errors
- Lint errors

### Features
- Advanced search
- Rating reminders
- Distance matching
- Admin dashboard
- Two-factor authentication enhancements

### Infrastructure
- E2E test suite
- Performance monitoring
- Error tracking
- Analytics integration

### Documentation
- API documentation
- Component library
- Deployment guides
- Troubleshooting guides

---

## 🔄 Task Workflow

### States
1. **Not Started**: Defined but no work begun
2. **In Progress**: Actively being worked on
3. **Blocked**: Waiting for external dependency (user input, deployment, etc.)
4. **Ready for Review**: Code complete, awaiting approval
5. **Completed**: Done and verified

### Transitions
```
Not Started → In Progress → Ready for Review → Completed
                ↓
             Blocked → In Progress (when unblocked)
```

### Task Creation
When a new task is identified:
1. Add to appropriate priority section
2. Assign status: "Not started"
3. Note any dependencies or blockers
4. Link to related docs/issues
5. Define acceptance criteria

### Task Completion
When a task is done:
1. Move to "Recently Completed" section
2. Document what was changed
3. Update `docs/agent-memory.md` if needed
4. Update status in any linked tracking systems

---

## 🎯 Sprint Planning

### Current Sprint (2025-10-19)
**Goal**: Stabilize authentication flows

**Tasks**:
- [x] Fix PKCE persistence issue
- [x] Create autonomy framework
- [ ] Verify auth fixes in production
- [ ] Clean up console warnings

**Target Completion**: End of week

---

### Next Sprint (Planned)
**Goal**: Quality improvements and UX polish

**Proposed Tasks**:
- Fix remaining console errors/warnings
- Improve error messages (user-facing)
- Add loading states to all async operations
- Performance audit (Lighthouse)
- Accessibility audit (WCAG 2.1)

---

## 📝 Notes

### Adding New Tasks
User can add tasks by saying:
- "Add task: [description]"
- "New task: [title] - [details]"
- Agent will format and add to appropriate priority level

### Updating Task Status
Agent updates this file after:
- Completing a task
- Encountering a blocker
- User provides new information about a task

### Task Dependencies
Use "Blocked By" field to track dependencies. Example:
```
Task A: Implement feature X
Blocked By: Task B (API endpoint must exist first)
```

---

**End of Task Management File**  
_Keep this file synchronized with actual work state._
