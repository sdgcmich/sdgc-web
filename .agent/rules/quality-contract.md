---
trigger: always_on
---

# Quality contract for local Antigravity work

Read `AGENTS.md`, the existing project rule, the approved plan and `docs/QUALITY-CONTRACT.md` before each slice. This file follows the repository's current rule convention; it is not a substitute for protected GitHub checks.

- Reuse the approved design. Fix one dependency-ordered slice at a time.
- Add a regression against actual implementation. Observe red for the intended reason, fix, then prove green. When execution is unavailable, record blocked, not passed.
- Prove denied operations leave data unchanged. UI visibility is not authorization.
- Use only the disposable local Supabase stack and synthetic data. Never reset/link/migrate hosted data or introduce external payment/mail/upload credentials to CI.
- Never weaken, skip or replace a failing requirement to obtain a green badge. Investigate implementation versus fixture/environment causes and record the distinction.
- Run all applicable mandatory checks. Record source head, tested commit/tree, exact commands, outcomes, CI URL and remaining manual/hosted work.
- Preserve private audit details and secrets outside this public repository. Public verification evidence must be redacted.
- Consolidated local acceptance belongs to the final candidate, not repeated operator handoffs for each small slice.
- Development, PR creation and green CI do not authorize merge, production deployment, migration, real email, payment, scheduler activation or live storage operations. Require separately bounded exact-head authorization.
