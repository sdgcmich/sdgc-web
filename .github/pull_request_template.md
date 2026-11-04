## Change

Describe concrete behavior and affected phase/parity IDs. Link the approved scope.

## Verification

List commands actually run and the relevant `docs/verification/phase-NN.md` record.

- Source head:
- Tested commit / merge commit and tree:
- CI run and artifact:
- Acceptance criteria and direct production-code regressions:
- Negative-path assertions, including no unauthorized side effects:
- Independent reviewer and exact reviewed head:

## Remaining gaps

State legacy, external-service, migration, privacy and manual-acceptance limitations.
Distinguish passed, failed, blocked, skipped and not applicable. Never reuse stale evidence.

## Quality contract

- [ ] Read `docs/QUALITY-CONTRACT.md` and the existing project instructions.
- [ ] No production credentials/data or real external operations in tests.
- [ ] No weakened assertions, silent early returns, `.only`, blanket skips or ignored failures.
- [ ] New behavior has success, denial, failure and recovery coverage as applicable.
- [ ] Responsive, accessibility, SEO and factual-content impacts reviewed.
- [ ] Documentation accurately describes this exact candidate.
- [ ] Separate release approval is required. This PR and green CI do not authorize production changes.
