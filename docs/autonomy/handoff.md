# Autonomy Framework – Session Handoff

> **Purpose**: Standardize how sessions start, continue, and end. Ensures continuity across agent restarts.

---

## 🚀 Session Start Protocol

### 1. Context Loading (First 3 Actions)
Every new session must begin with:

```markdown
1. Read `docs/agent-memory.md` (full file, all sections)
2. Read `docs/autonomy/tasks.md` (check "Active Tasks" section)
3. Read `docs/autonomy/permissions.md` (refresh boundaries)
```

**Rationale**: Agent has no memory across sessions. These files are the persistent "brain."

### 2. Status Check
After reading context files, agent should:

- Check git status: `git status --short`
- Check last commit: `git log --oneline -1`
- Check for uncommitted changes
- Check if there's a build/deploy in progress (ask user)

### 3. Greeting & Confirmation
Agent greets user and confirms direction:

```markdown
Template:
"Hi! I've loaded the context from our last session on [date]. 
I see we were working on [task from tasks.md].
Current status: [status from tasks.md]

Should I:
A) Continue with [current task]
B) Start something new
C) Review/test what was completed last session

What would you like to focus on today?"
```

**If user is unclear**, agent should:
- Summarize the top 3 priority tasks from `tasks.md`
- Ask which one to tackle first
- Never assume or start work without direction

---

## 🔄 During Session Protocol

### Progress Tracking
As work proceeds, agent should:

- **Every ~30 minutes of conversation**: Ask "Should I update the memory file with our progress?"
- **When reaching a milestone**: Announce completion and offer to update docs
- **When blocked**: Immediately update `tasks.md` with blocker details

### Communication Style
- **Status updates**: Use emoji indicators (✅ ⚠️ ❌ 🔍 ⏳)
- **Questions**: Always present 2-3 options when asking for decisions
- **Warnings**: Clearly mark risks with 🚨 or ⚠️
- **Technical details**: Provide, but also offer plain-language summary

### Context Preservation
If conversation gets long (>50 messages):
- Agent suggests: "We've covered a lot. Should I summarize our discussion in the memory file?"
- Capture key decisions, new findings, and blockers
- Don't wait until end of session to preserve context

---

## 📝 Memory Update Protocol

### When to Update
Update `docs/agent-memory.md` when:
- Major task is completed
- New issue/bug is discovered
- Configuration changes are made
- User explicitly says "actualizează memoria" or "update memory"
- Session is about to end (user says "bye" or "gata pentru azi")

### What to Update
Depending on what changed:

#### If Code Was Modified
Update sections:
- **Core Project Knowledge** (if architecture changed)
- **Active Tasks** (mark completed, add new blockers)
- **Known Issues & Workarounds** (if bug discovered)
- **Important Files Reference** (if new key files created)

#### If Testing/Deployment Happened
Update sections:
- **Deployment** (add findings from production test)
- **Success Criteria** (check off items)
- **Known Issues** (if new problems found)

#### If Requirements Changed
Update sections:
- **Active Tasks** (add new tasks, reprioritize)
- **Success Criteria** (adjust goals)
- **User Preferences** (if new preferences expressed)

### Update Format
Always include:
- **Last Updated** timestamp at top of file
- **Session Summary** (2-3 sentences about what was done)
- Specific changes in relevant sections
- Mark completed checklist items with `[x]`

---

## 🛑 Session End Protocol

### 1. Final Summary (Agent Provides)
```markdown
Template:
"📊 Session Summary:

**What We Did:**
- [✅] Task 1: [brief description]
- [⏳] Task 2: [status] - [blocker if any]

**What's Ready:**
- [List items ready for user action: commit, deploy, test, etc.]

**Next Steps:**
1. [Immediate next action]
2. [Follow-up action]
3. [Optional: future consideration]

**Updated Files:**
- [List files modified this session]

Should I update the memory file before we finish?"
```

### 2. Documentation Update
If user approves:
- Update `docs/agent-memory.md` with session details
- Update `docs/autonomy/tasks.md` task statuses
- Commit message suggestion: "docs: update agent memory after [brief description] session"

### 3. Handoff Checklist
Before ending session, ensure:

- [ ] All code changes explained
- [ ] Lint/typecheck passed (if code was changed)
- [ ] Blockers documented in `tasks.md`
- [ ] Memory file updated with timestamp
- [ ] Next steps clearly stated
- [ ] User knows what action is needed from them (if any)

### 4. Goodbye Message
```markdown
"All set! Context saved for next session. 
When we resume, I'll pick up from: [specific task/state].
[If action needed: Don't forget to [action] when ready.]
Have a great day!"
```

---

## 🔧 Troubleshooting Handoffs

### Problem: User Returns, Agent Has No Context
**Cause**: Memory file wasn't updated last session, or agent didn't read it.

**Solution**:
1. Agent reads `docs/agent-memory.md` immediately
2. If insufficient context: "I see the memory file is outdated. Can you briefly recap where we left off?"
3. User provides 2-3 sentences
4. Agent updates memory file with user's recap before proceeding

### Problem: Work Was Lost / Repeated
**Cause**: Changes weren't committed to git.

**Solution**:
1. Check `git status` for uncommitted work
2. If present: "I see uncommitted changes from [date]. Should we commit these or review them first?"
3. If not present: "The memory file shows we worked on [X], but I don't see committed changes. Did we deploy, or should we redo?"

### Problem: Multiple Sessions in Same Day
**Cause**: User comes back after short break.

**Solution**:
- Agent still reads memory file (might be updated by other tools/users)
- Agent asks: "Welcome back! Should I continue where we left off, or new task?"
- Update memory file at end of day, not after every micro-session

---

## 📋 Session Types

### Type 1: Development Session
**Characteristics**: Writing/modifying code, fixing bugs, adding features

**Protocol**:
- Start: Check lint/typecheck status
- During: Frequent small commits (suggest commit messages)
- End: Ensure code is in clean state (lint passing, no syntax errors)

### Type 2: Planning Session
**Characteristics**: Discussing architecture, planning features, writing docs

**Protocol**:
- Start: Load relevant docs (design docs, roadmaps)
- During: Create/update documentation files
- End: Capture all decisions in memory file, update tasks.md

### Type 3: Debugging Session
**Characteristics**: Investigating issues, analyzing logs, testing fixes

**Protocol**:
- Start: Document the bug/issue clearly
- During: Keep detailed notes of findings
- End: Update "Known Issues" section, document solution or workaround

### Type 4: Review Session
**Characteristics**: Reviewing code, testing features, verifying deployments

**Protocol**:
- Start: Load checklist of items to review
- During: Check off items, note any failures
- End: Update success criteria, document any new bugs found

---

## 🎯 Quality Checks

### Before Marking Task "Complete"
- [ ] Code changes reviewed and explained
- [ ] Tests pass (or test plan documented)
- [ ] Documentation updated
- [ ] No new lint/type errors introduced
- [ ] User explicitly approved/acknowledged completion

### Before Ending Session
- [ ] User's immediate question answered
- [ ] No orphaned changes (all code has context/comments)
- [ ] Blockers documented if progress stalled
- [ ] Next steps are actionable (not vague)

### Before Updating Memory
- [ ] Timestamp updated at top of file
- [ ] Session summary reflects actual work done
- [ ] Checklist items marked correctly
- [ ] No sensitive data included (passwords, keys, PII)

---

## 📞 Communication Templates

### Starting a Long Task
```markdown
"I'm about to [task description]. This will take ~[time estimate].
I'll update you with progress after each major step.
If I encounter issues, I'll pause and ask for input.
Sound good?"
```

### Mid-Task Update
```markdown
"✅ Progress update: Completed [step X].
Currently working on: [step Y]
Next: [step Z]
No blockers so far."
```

### Encountering a Blocker
```markdown
"⚠️ Blocked: [description of issue]
Attempted: [what I tried]
Options:
A) [workaround option]
B) [alternative approach]
C) [escalate to user for decision]
Your preference?"
```

### Requesting Memory Update
```markdown
"We've made good progress. Should I update the memory file now?
Summary to capture:
- [key point 1]
- [key point 2]
- [decision made]
This will help future sessions pick up seamlessly."
```

---

## 🔄 Continuous Improvement

### After Each Session
Agent (via user reflection or self-assessment):
- Was handoff smooth?
- Did we lose any context?
- Were the right files updated?
- Could next session start faster?

### Adjusting the Protocol
If repeated issues occur:
- User can request protocol changes: "From now on, also update [X] file"
- Agent can suggest improvements: "I notice we often forget [Y]. Should I add it to the checklist?"
- Update this file accordingly

---

**End of Handoff Protocol**  
_Good handoffs = no repeated work = more progress._
