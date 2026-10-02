# Shared 0–100 game

Players create or join a room using an eight-character code. The creator participates and starts the game once everyone is present. Names are unique within a room; 2–12 players.

All players, including the reader, submit their own guess. Current guesses remain private until scoring. The reader can enter the physical card’s correct answer only after all players have submitted. The server rejects early scoring and operations from anyone other than the reader. Results show guesses, differences (−10 for an exact answer), and accumulated totals on every phone. The reader advances to the next question.

Reader order follows player order, changing after seven questions. Game lengths remain 7, 21, or seven questions per player. A lobby host can remove a player before starting. After starting, the roster is fixed. A player can reconnect in the same browser using the stored session. Players cannot be silently skipped; their answer is required.

GitHub Pages serves the static UI. A Supabase Edge Function owns access to a dedicated room table. Each device receives a cryptographically random capability token; only its SHA-256 hash is stored. The server returns sanitized snapshots, never other players’ tokens or unrevealed guesses. No account or login is required.

The room row is versioned. Every write uses compare-and-swap and retries with fresh state on conflicts so simultaneous answers cannot overwrite each other. Commands carry the expected question index to reject delayed submissions to a later question. Snapshots poll once per two seconds while visible; reconnect refreshes the current state. Polling is deliberately used rather than depending on an unconfigured realtime publication.

Rooms expire after 24 hours; expired records are removed when new rooms are created. Data includes player nicknames and answers only. Tokens stay on the device and are sent only to the API.

Deployed to the dedicated Supabase project `vpatfbtblletjedqrebk`, Edge Function `zero100`. Both `index.html` and `multiplayer.html` load the shared app; `local.html` retains the single-phone scorekeeper.

Live browser checks completed a seven-question game using two independently authenticated player sessions. Verified private guesses, disabled answer input until everyone submits, simultaneous submissions, synchronized results, exact-answer scoring, reconnect after reload, accumulated scores and winner celebration. Reader rotation and complete player-card games are covered by automated tests.
