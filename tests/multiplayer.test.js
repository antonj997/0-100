import test from "node:test";
import assert from "node:assert/strict";
import { createRoom, joinRoom, transition, snapshot } from "../server/game.js";
const A = "a".repeat(64),
  B = "b".repeat(64),
  C = "c".repeat(64);
function ready(mode = "7") {
  return transition(
    joinRoom(createRoom("Anna", A, mode), "Bo", B),
    A,
    "start",
    {},
    0,
  );
}
test("ten cards rotate readers, publish only completed cards, and finish with correct winner", () => {
  let s = ready("cards:10");
  for (let q = 0; q < 70; q++) {
    const clock = q * 30000,
      reader = Math.floor(q / 7) % 2 ? B : A;
    assert.equal(
      snapshot(s, A, clock).readerId,
      s.players[Math.floor(q / 7) % 2].id,
    );
    s = transition(s, A, "guess", { round: q, value: 10 }, clock);
    s = transition(s, B, "guess", { round: q, value: 20 }, clock);
    s = transition(s, reader, "lock", { round: q }, clock);
    s = transition(s, reader, "reveal", { round: q, value: 10 }, clock);
    const v = snapshot(s, A, clock);
    assert.equal(v.rounds.length, Math.floor((q + 1) / 7) * 7);
    s = transition(s, A, "next", { round: q }, clock);
    s = transition(s, B, "next", { round: q }, clock);
    if (q % 7 === 6 && q < 69)
      s = transition(s, A, "next", { round: q }, clock);
  }
  const view = snapshot(s, A, 2100000);
  assert.equal(view.stage, "finished");
  assert.deepEqual(view.totals, [-700, 700]);
  assert.deepEqual(view.winnerIds, [s.players[0].id]);
});
test("lobby permissions, unique names, mode bounds and idempotent join", () => {
  let s = createRoom("Anna", A, "21");
  assert.throws(() => transition(s, A, "start", {}), /NEED_PLAYERS/);
  s = joinRoom(s, "Bo", B);
  assert.deepEqual(joinRoom(s, "Different", B), s);
  assert.throws(() => joinRoom(s, "anna", C), /NAME_TAKEN/);
  assert.throws(() => transition(s, B, "start", {}), /HOST_ONLY/);
  for (let n = 1; n <= 10; n++) assert.equal(ready(`cards:${n}`).limit, n * 7);
  for (const mode of ["cards:0", "cards:11", "cards:1.5", "cards:01", null, 10])
    assert.throws(() => createRoom("Anna", A, mode), /INVALID_MODE/);
});
test("invalid inputs, stranger access and peer guesses remain protected", () => {
  let s = ready();
  for (const value of ["", null, [], {}, -1, 101, "NaN"])
    assert.throws(
      () => transition(s, A, "guess", { round: 0, value }),
      /INVALID_NUMBER/,
    );
  s = transition(s, B, "guess", { round: 0, value: 83 });
  const v = snapshot(s, A);
  assert.equal(v.myGuess, null);
  assert.equal(v.players[1].answered, true);
  assert.ok(!JSON.stringify(v).includes("83"));
  assert.ok(!JSON.stringify(v).includes(B));
  assert.throws(() => snapshot(s, C), /SESSION_INVALID/);
  assert.throws(
    () => transition(s, B, "guess", { round: 1, value: 1 }),
    /STALE_QUESTION/,
  );
  assert.throws(() => joinRoom(s, "C", C), /GAME_STARTED/);
});
test("automatic card count is capped at ten for twelve players", () => {
  let s = createRoom("Anna", A, "players");
  for (let i = 1; i < 12; i++)
    s = joinRoom(s, `Player ${i}`, i.toString(16).padStart(64, "0"));
  assert.equal(transition(s, A, "start", {}).limit, 70);
  assert.throws(() => joinRoom(s, "extra", C), /ROOM_FULL/);
});
test("partial card early finish includes scored questions and shared winners", () => {
  let s = ready();
  for (const t of [A, B])
    s = transition(s, t, "guess", { round: 0, value: 10 }, 0);
  s = transition(s, A, "lock", { round: 0 }, 0);
  s = transition(s, A, "reveal", { round: 0, value: 10 }, 0);
  s = transition(s, A, "finish", {}, 1);
  assert.deepEqual(snapshot(s, A, 1).totals, [-10, -10]);
  assert.equal(snapshot(s, A, 1).winnerIds.length, 2);
});
