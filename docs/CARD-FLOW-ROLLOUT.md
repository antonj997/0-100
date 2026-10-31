# Card flow v2 — review and rollout

This branch is NOT deployed. Production Supabase and main remain unchanged.

## Local preview
Run `node scripts/preview.mjs` and open http://127.0.0.1:4173 in separate browser profiles. The preview uses the real API and state machine with memory storage; it never contacts Supabase. Data disappears when the preview stops.

## Behavior decisions
- Waiting lobbies accept direct joining; running lobbies are visible but closed to newcomers.
- Explicit leave transfers ownership to the earliest remaining active member. Losing network connectivity does not remove membership.
- Kicked/left player records stay for historical scoring, but their sessions cannot access the game and they cannot win. Empty rooms are deleted with a revision check.
- All answers must exist before the reader locks. Editing and locking use optimistic concurrency; a late edit is rejected after locking wins the race.
- Players may leave their private result immediately for a waiting screen. The shared next phase opens when everyone advances or the server's 20-second deadline passes. Completed-card summaries wait for the host to start the next card.
- Only completed cards disclose other players' scores. Early finish discloses all scored questions and discards the open question. Exact decimal ties share the victory.
- Five-hour expiry is measured from creation. API reads reject expired rooms even before physical cleanup. Expired rows are removed opportunistically on room creation; a separate scheduled cleanup can be added later if physical deletion must happen at the exact deadline.
- Public discovery exposes creator display name, room code, participant count and status, as requested. It does not expose tokens, answers or score state. No late joining.

## Coordinated release after approval
1. Run the full suite and inspect the mobile preview.
2. Apply the five-hour default change in server/setup.sql through the normal migration workflow. Existing rows are also capped by created_at in API reads.
3. Deploy the `zero100` function with server/index.ts, server/api.js, server/game.js, server/store.js and public/scoring.js included. Preserve current verify_jwt=false because game capabilities are checked inside the handler.
4. Deploy the frontend from the approved branch to Pages. Frontend and backend must be rolled out together; old tabs should reload. The v2 server normalizes existing stored states without rewriting historical arrays, but old clients cannot run the new lock/reveal protocol.
5. Smoke-test two real devices: sharing, edit-lock race, private result, a full card, host departure and early finish. SMS/system sharing requires real supported devices; desktop automation verifies the controls, not delivery to another app.

## Validation
41 automated assertions/tests initially passed, including a full 70-question game, private snapshots, concurrent writes, expiry filters, host transfer, removed-reader fallback, early winners and decimal ties. Real Chromium exercised create/join/edit/lock/reveal/private result/advance/finish with mobile and desktop captures. A fresh reviewer identified the decimal-tie and restored-input issues; both received failing regression tests and fixes.

## Simpler scorecard and management update
The playing surface is a seven-row scorecard. The current question is highlighted, guesses and the reader's correct answer are entered directly in their cells, and Summa shows the player's cumulative scored total. Between cards the default view is a compact total ranking; completed-card history expands into each player's full scorecard.

Manage game contains member removal, total card count, early finish, sharing and leave. Only the host can change card count (1–10, never below the started card); completed history is preserved. Finishing the already completed final card after shortening the game is allowed.

Validation after this update: 46 automated tests plus Chromium mobile/desktop flow including in-game card-count editing and a full seven-question card. Review caught and fixed lobby card-count display. CI now runs on pull requests/manual dispatch only, with independent Node 22/24 results and cancellation of superseded runs. Uploads use one atomic tree/commit/ref update, avoiding the earlier intermediate incomplete commits that generated failure emails.

## Explicit submission and independent progression (follow-up)
Submitted answers are readonly. Edit withdraws readiness on the server, preserves only that player's private draft, and requires resubmission. A compact named status strip shows every active player's ready/not-ready state. Concurrent edit and reader-lock requests use the existing revision guard: the winner is applied and the losing action is rejected safely.

This follow-up supersedes the earlier shared waiting screen and 20-second timing. Each player can move straight from their own result to the next question and submit immediately. Other players keep their previous result until they continue or 15 seconds elapse. Card summaries are also independently dismissible, with a 15-second automatic transition. The server retains per-player acknowledgements so one player's Next cannot skip another player's screen or erase an already submitted next-round guess.

Validation: 54 automated tests; Chromium verifies readonly submission, edit/readiness withdrawal, resubmission, direct next-question submission while a peer still sees results, and full-card completion. This follow-up requires a coordinated frontend/backend release after its PR is approved.

Independent review caught a delayed Next request crossing the result-to-card deadline. Phase-specific acknowledgement now prevents it from skipping the summary; a failing regression test reproduces and verifies the fix.
