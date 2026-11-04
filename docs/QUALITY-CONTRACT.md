# SDGC quality contract

Status: proposed configuration, not installed or release-approved. Designed against `4578bb3a550c9347b675192d2f32941f858bb8a1`. Keep the existing architecture, approved plans, project rules and verification ledger.

## What this enforces

- `repository-contract`: native policy tests, nonempty timestamped migrations, local-reset command, tracked environment/credential patterns and SHA-pinned remote actions.
- `frontend`: existing formatting, lint, types, unit tests, runtime audit and build, plus full development/runtime high-severity dependency audit.
- `database`: disposable runner Supabase only; environment guard before reset/provision; existing lint, pgTAP, generated-type diff and integration checks; existing browser suite; new mandatory browser contract.
- `quality-gate`: always evaluates all three required jobs and emits source-head/tested-merge/tree evidence. Any failed, cancelled, missing or skipped job fails the gate. Receipt always says `release_authorized: false`.
- Existing CodeQL remains a separate required check. Pins are reviewed immutable commits; Dependabot updates still need review.

The new browser file has 21 tests on each of the current Chromium desktop and Chromium-emulated-mobile projects: 42 required results, zero skipped/flaky/failed/global errors. Layout covers 320, 360, 390, 414, 768, 1024, 1280, 1440 and 1920 CSS pixels. Image bytes are stubbed; this does not validate imagery. Emulated iPhone is not Safari or a real device.

Three new database regressions test anonymous confirmed-ticket insertion without SELECT, anonymous member-profile credential lookup, and ordinary-admin self-escalation. These do not cover the entire security audit. They are intended to reveal existing defects, not bless them. Neither these integration tests nor the new Playwright suite has been executed against the application in preparation of this proposal.

## Safe local verification order

Use a disposable local workspace. The application runtime needs the repository's Node 24/npm versions, Docker and Supabase. The proposal's dependency-free helper was checked under Node 22.23.1; that is not an application runtime certification.

```sh
npm ci
node --test scripts/ci-contract.test.mjs
node scripts/ci-contract.mjs repository
npm run check
npm audit --omit=dev --audit-level=high
npm audit --audit-level=high
npm run db:start
npm run db:env
node scripts/ci-contract.mjs local-env
# STOP unless the guard succeeds and this database is disposable.
npm run db:reset
npm run db:provision
npm run db:lint
npm run db:test
npm run db:types
git diff --exit-code -- src/types/database.ts
npm run test:integration
npm run build
npx playwright install --with-deps chromium
mkdir -p artifacts
PLAYWRIGHT_JSON_OUTPUT_NAME=artifacts/existing-browser.json npx playwright test --grep-invert '@quality-contract' --retries=0 --reporter=line,json
PLAYWRIGHT_JSON_OUTPUT_NAME=artifacts/quality-browser.json npx playwright test tests/e2e/quality-contract.spec.ts --project=chromium --project=mobile --retries=0 --reporter=line,json --output=test-results/quality
node scripts/ci-contract.mjs browser-report artifacts/quality-browser.json
npm run db:stop
```

The command block uses POSIX environment assignment; PowerShell users must set `$env:PLAYWRIGHT_JSON_OUTPUT_NAME` explicitly. Always stop the local stack during failure cleanup. Do not continue after a failed guard. Never use remote reset or supply production credentials. No real Stripe, email, upload or migration action belongs in this job.

The current local environment generator still supports legacy Supabase keys. Do not add new legacy-key dependencies. Migrate bootstrap/client wiring separately to current publishable/secret keys and JWKS-based JWT verification, then regenerate local-only fixtures. Current compatibility is not a recommendation to configure legacy production keys.

## Remaining regression families

Antigravity must add actual implementation tests for each remediated behavior:

1. Gate authorization, role/AAL policy, paid-only admission, duplicate/undo/revoked/wrong-event states and audit/no-write denial.
2. Session/order/owner/amount/currency binding; `complete` but unpaid checkout never fulfills; async settlement, duplicate and out-of-order events, provider/database failures.
3. Gift pending/paid/redeemed/refunded lifecycle; coupon reservation/commit/release under concurrency.
4. Direct RLS/RPC privilege matrix; payment-membership consistency; last-admin races; avatar ownership; opt-out preservation.
5. Safe receipts, notification retries/outbox, media deletion lifecycle and accurate totals under pagination/error.
6. Calendar DST/last-minute boundaries, ICS escaping, truthful structured prices, per-page canonicals and sitemap routing.

Tests must call production code or the final migrated database, not reimplement the expected rule inside the test. Setup errors fail explicitly. Cleanup targets only synthetic records and must be attempted on failures. Do not enable optional live-service tests just to remove their intentional skips. Those are separately authorized hosted acceptance, not this isolated gate.

## Repository-owner setup

After the first proposal run, the owner must select the actual emitted check names. Expected names: `quality-gate`, `Analyze (actions)`, `Analyze (javascript-typescript)`. Requiring the three underlying CI jobs too is reasonable defense in depth.

Protect main with required PRs, an independent approval, code-owner review for sensitive paths, dismissal of stale approvals, current required checks and no routine bypass/force push. A PR author cannot self-approve. CODEOWNERS routes reviews; it does not enforce them without rules. Enable available secret scanning and push protection, review Actions permissions and approved actions, and keep previews away from production credentials. Settings hidden from a collaborator remain unknown until the owner verifies them.

Merge queue is not enabled by this package. Add `merge_group` execution and matching evidence binding before enabling one. Do not merge the existing dependency PR blindly; reconcile its workflow changes with this proposal.

## Evidence and limits

- Test artifacts: seven days; receipts: fourteen days. Synthetic/redacted only. These are not database backups.
- Lightweight regex checks are not a full YAML parser, full-history secret scan or protection against a malicious contributor editing the workflow itself. Native GitHub protection and independent review are mandatory.
- A committed credential-pattern failure requires owner rotation/revocation and safe redaction. Deleting text does not revoke a credential; history rewriting is a separate operation.
- Newly introduced requirements may correctly make this baseline red. Do not merge until defects are fixed or a narrowly scoped, justified contract change is independently reviewed. Do not globally exclude failing files.
- First hosted CI execution still must establish formatter, TypeScript, YAML/action compatibility and complete application test results.
- Manual acceptance still includes real images, long content, keyboard/screen reader, zoom/reflow, reduced motion, real iOS/Safari and Android, authenticated roles and hosted provider behavior.
- Release needs current-head independent review, owner-approved configuration, applicable backup plus restricted isolated restore, rollback readiness and monitoring owner. Production smoke occurs only after separately authorized deployment. No CI receipt grants release authority.
