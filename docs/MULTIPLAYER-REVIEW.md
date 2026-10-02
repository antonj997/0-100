# Multiplayer review — 2026-10-02

Deployed to the dedicated Supabase project `vpatfbtblletjedqrebk`.

27 automated tests pass, including nine multiplayer state/API tests. The API tests use a versioned in-memory store and exercise simultaneous submissions, privacy, access checks, stale rounds, idempotent reconnect requests and revision increments. State tests cover complete games, reader rotation, exact-answer bonuses and ties.

An independent reviewer completed three review iterations (maximum three requested). Iteration one found stale polling responses could overwrite later commands or restore a departed room, and invitation links targeted the local entry point. Both were fixed. Iteration two confirmed delayed responses cannot undo a guess, reopen a departed room or overwrite a new session; lower revisions are ignored and invitations target the multiplayer entry point. Iteration three found no deployment blockers. No remaining concrete defects were found.

Syntax and whitespace checks pass. A live seven-question game was completed through the published UI with two independent player sessions. Verified invitation join, hidden answers, reader-only correct-answer control, answer gating, concurrent submissions, reload/reconnect, synchronized scores, total calculation (20 and 38), winner and confetti.

Database grants were inspected: anon and authenticated have no access; service_role has access. The security advisor reports only informational RLS-without-policy, intentional because the table is exclusively accessed by the server function. See https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy. Actual iPhone hardware was not available; browser checks used a desktop viewport.
