# Review and validation

## Review cycles 1 and 2

An independent reviewer examined the scoring logic and application source against the publisher's Classic and Mini rules linked in README.md.

Two findings were fixed:
1. Fixed decimal rounding could erase very small nonzero differences. Scores and totals now use decimal coefficient arithmetic.
2. Malformed saved player values could be converted into strings. Player names must now be strings before validation.

The reviewer independently authored five regression tests. The main agent executed these alongside nine existing tests: **14 passed, 0 failed, 0 skipped**. The reviewer assessed the results and passed the reviewed scope.

## Review cycle 3: live browser

A reviewer independently designed a seven-question Mini scenario. The main agent executed it in the live browser and returned observed results for the reviewer's assessment.

| Checkpoint | Ada | Ben | Result |
| --- | ---: | ---: | --- |
| After question 3, then refresh | -16 | -15 | Names, mode, history and scores persisted |
| After question 7 | -28 | -4 | Ada wins; subtotal matches total |
| Correct question 5 answer from 80 to 82, then refresh | -16 | -16 | Shared win; correction persisted |
| Undo last question | -6 | -31 | Six completed questions; game reopened |
| Replay question 7 | -16 | -16 | Shared win restored |

Exact-answer bonuses, absolute differences, negative totals, corrections, refresh persistence, subtotals, shared winners and undo/replay all matched the expected results. The reviewer issued **PASS**, with no blocking issues found within this scope.

A visual check at a 500px browser width found no page-level horizontal overflow. This was a targeted browser check, not an exhaustive accessibility or cross-browser audit. The full 21-question Classic game is covered by automated rule tests; the live end-to-end scenario used Mini.

## Deployment

- Public repository: https://github.com/antonj997/0-100
- Live app: https://antonj997.github.io/0-100/
- Successful GitHub Actions run: https://github.com/antonj997/0-100/actions/runs/34761556534
- Deployed application commit: d6e7f77160b522e7a5b48ebac323bcc07345fb7b
- All 14 tests passed in GitHub before the successful deployment on 2026-09-13.

This subsequent report-only update does not change the deployed application.
