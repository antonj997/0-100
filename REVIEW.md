# Review and validation

## Scope

An independent reviewer examined `public/scoring.js`, `public/app.js`, and `package.json` against the publisher's Classic and Mini rules linked in README.md.

## Review cycle 1

The source audit found scoring, the exact-answer −10 bonus, negative totals, shared wins, seven-question subtotals, game limits, score corrections, and undo consistent with the supplied rules.

Two findings were fixed:

1. Fixed decimal rounding could erase very small nonzero differences. Scoring and totals now use decimal coefficient arithmetic.
2. Malformed saved player values could be converted into strings. Player names now must be strings before trimming and validation.

The main agent's nine automated game tests passed. The reviewer's browser and shell tool calls stalled, so the reviewer did not independently execute those tests.

## Review cycle 2

The reviewer independently authored five regression tests. Because the reviewer’s execution tools stalled, the main agent executed them alongside the original nine tests: **14 passed, 0 failed, 0 skipped**. The reviewer assessed the reported execution results and passed the reviewed scope. Both original findings passed their regression cases. No third cycle was indicated.

Independent cases cover hand-calculated Classic totals and standings, shared winners after corrections, tiny decimal differences and summation, malformed saved player names, and Mini boundaries and correction after completion.

## Remaining validation

Browser interaction and visual testing have not completed because the preview could not be reached. GitHub repository creation and Pages deployment have not completed because secure GitHub authentication was not completed. The included workflow is prepared but has not run on GitHub.

This report distinguishes source review and rule tests from real-browser verification; the latter remains a release check.
