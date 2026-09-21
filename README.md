# 0–100 Scorekeeper

A mobile-friendly, dependency-free scorekeeper for the physical 0–100 trivia card game. Add players or teams, enter guesses, reveal the answer, and let the app keep score.

## Features

- Named players or teams, with duplicate-name validation.
- Classic (21 questions) and Mini (7 questions).
- Absolute difference scoring; an exact answer earns **−10**, including negative totals.
- Round subtotals every 7 questions, cumulative totals, live rankings and shared wins.
- Edit any question, undo the last question, and play again.
- Current committed game saved in localStorage on the current browser/device. Unsubmitted guesses are not saved. No account, backend, tracking, or cross-device syncing.
- Accessible form labels, keyboard controls, responsive layout, and no external assets.

Use physical question cards; this project does not reproduce the commercial question deck. All guesses should be written down privately before anyone reveals the answer. The app is a shared scorepad, not a private multiplayer guessing system.

## Rules

The publisher's [Classic rules](https://playmig.com/produkter/0-100-orange/) specify guesses from 0 to 100, absolute differences, −10 for exact guesses, subtotals after every 7 questions, and the lowest total winning after 21. [Mini](https://playmig.com/produkter/0-100-mini/) ends after 7 questions. Decimal answers are accepted; tied lowest totals are displayed as shared wins (no invented tiebreaker).

Independent project; not affiliated with PlayMIG.

## Run locally

Requires Node.js 18+ for tests and Python 3 for the local server. There are no npm dependencies to install.

```sh
npm test
npm start
```

Open http://localhost:4173. The public/ directory is the complete static app and works at any subdirectory path.

## GitHub Pages

Create a public repository, push to main, then select **Settings → Pages → Source → GitHub Actions**. The included workflow runs the tests and publishes only public/. The page URL will be shown by the deployment and in Pages settings.

## Validation

14 automated tests pass, including five independently designed reviewer regressions. Two review cycles resolved two findings. See [REVIEW.md](REVIEW.md) for evidence and the remaining browser/deployment checks.

## Scorecard redesign

Swedish is the default language; SV / EN switches language and remembers the choice. Warm off-white paper and pastel red rows follow the physical scorecard. Use the player selector to inspect each full scorecard; click a completed question number to correct it.

Choose **Ett kort per spelare / One card per player** for seven questions per player. Readers rotate after each card in player order, so four players play 28 questions. Everyone answers, including the reader. Classic 21-question and short 7-question modes remain available. Finishing celebrates the lowest-scoring player (or tied players), with reduced-motion support.
