import test from "node:test";
import assert from "node:assert/strict";
import { createRoom, joinRoom, transition, snapshot } from "../server/game.js";
const A = "a".repeat(64),
  B = "b".repeat(64),
  C = "c".repeat(64);
const start = () =>
  transition(
    joinRoom(joinRoom(createRoom("Anna", A, "cards:2"), "Bo", B), "Cam", C),
    A,
    "start",
    {},
    1000,
  );
function score(s, q = 0) {
  for (const [t, v] of [
    [A, 10],
    [B, 20],
    [C, 30],
  ])
    s = transition(s, t, "guess", { round: q, value: v }, 1000);
  s = transition(s, A, "lock", { round: q }, 1000);
  return transition(s, A, "reveal", { round: q, value: 10 }, 1000);
}
test("answers editable until reader locks, only reader can lock/reveal", () => {
  let s = start();
  s = transition(s, A, "guess", { round: 0, value: 10 });
  s = transition(s, A, "guess", { round: 0, value: 11 });
  assert.equal(snapshot(s, A).myGuess, 11);
  assert.throws(() => transition(s, B, "lock", { round: 0 }), /READER_ONLY/);
  assert.throws(
    () => transition(s, A, "lock", { round: 0 }),
    /WAIT_FOR_PLAYERS/,
  );
  for (const t of [B, C])
    s = transition(s, t, "guess", { round: 0, value: 20 });
  assert.throws(
    () => transition(s, A, "reveal", { round: 0, value: 20 }),
    /NOT_LOCKED/,
  );
  s = transition(s, A, "lock", { round: 0 });
  assert.throws(
    () => transition(s, A, "guess", { round: 0, value: 40 }),
    /QUESTION_CLOSED/,
  );
});
test("private result, independent advance and server deadline", () => {
  let s = score(start());
  let v = snapshot(s, A, 1001);
  assert.equal(v.stage, "results");
  assert.equal(v.myRounds[0].points, -10);
  assert.equal(v.rounds.length, 0);
  assert.deepEqual(v.totals, []);
  s = transition(s, B, "next", { round: 0 }, 1002);
  assert.equal(snapshot(s, B, 1003).stage, "waiting");
  assert.equal(snapshot(s, A, 1003).stage, "results");
  assert.equal(snapshot(s, A, 21000).stage, "question");
  assert.equal(snapshot(s, A, 21000).round, 1);
});
test("host leave transfers ownership; kick invalidates access and preserves history", () => {
  let s = score(start());
  const id = s.players[0].id;
  s = transition(s, A, "leave", {}, 1002);
  assert.equal(s.hostId, s.players[1].id);
  assert.throws(() => snapshot(s, A), /SESSION_INVALID/);
  assert.throws(() => transition(s, C, "finish", {}), /HOST_ONLY/);
  s = transition(s, B, "finish", {}, 1003);
  assert.equal(snapshot(s, B).winnerIds[0], s.players[1].id);
  assert.equal(s.rounds[0].guesses[0], 10);
  assert.equal(s.players[0].id, id);
});
test("ending with no scored rounds has no winner; empty room closes", () => {
  let s = start();
  s = transition(s, A, "finish", {});
  assert.deepEqual(snapshot(s, A).winnerIds, []);
  s = transition(s, A, "leave", {});
  s = transition(s, B, "leave", {});
  s = transition(s, C, "leave", {});
  assert.equal(s.stage, "closed");
});
test("removed reader hands over and removed member cannot rejoin", () => {
  let s = start();
  s = transition(s, A, "leave", {});
  assert.equal(snapshot(s, B).readerId, s.players[1].id);
  assert.throws(() => joinRoom(s, "Anna", A), /SESSION_INVALID/);
  s = transition(s, B, "remove", { playerId: s.players[2].id });
  assert.equal(snapshot(s, B).players.length, 1);
});
test("decimal totals tie regardless of answer ordering", () => {
  let s = start();
  for (let q = 0; q < 3; q++) {
    const time = q * 30000;
    for (const [token, guesses] of [
      [A, [0.1, 0.2, 0.3]],
      [B, [0.3, 0.2, 0.1]],
      [C, [1, 1, 1]],
    ])
      s = transition(s, token, "guess", { round: q, value: guesses[q] }, time);
    s = transition(s, A, "lock", { round: q }, time);
    s = transition(s, A, "reveal", { round: q, value: 0 }, time);
    for (const token of [A, B, C])
      s = transition(s, token, "next", { round: q }, time);
  }
  s = transition(s, A, "finish", {}, 100000);
  const view = snapshot(s, A, 100000);
  assert.equal(view.myTotal, 0.6);
  assert.equal(view.winnerIds.length, 2);
});
test("host changes total cards without discarding current card or scored history", () => {
  let s = start();
  assert.throws(
    () => transition(s, B, "cards", { cards: 3 }, 1000),
    /HOST_ONLY/,
  );
  for (const cards of [0, 11, 1.5, "3"])
    assert.throws(
      () => transition(s, A, "cards", { cards }, 1000),
      /INVALID_MODE/,
    );
  s = transition(s, A, "cards", { cards: 3 }, 1000);
  assert.equal(s.limit, 21);
  s = score(s);
  const saved = JSON.stringify(s.rounds);
  s = transition(s, A, "cards", { cards: 1 }, 1001);
  assert.equal(s.limit, 7);
  assert.equal(JSON.stringify(s.rounds), saved);
  s.round = 7;
  s.stage = "question";
  assert.throws(
    () => transition(s, A, "cards", { cards: 1 }, 1002),
    /INVALID_MODE/,
  );
});
test("published player scorecards contain guesses, correct answers and points only after a whole card", () => {
  let s = score(start());
  assert.deepEqual(snapshot(s, A, 1001).ranking, []);
  s = transition(s, A, "finish", {}, 1002);
  const view = snapshot(s, A, 1002);
  assert.deepEqual(view.ranking.find((p) => p.name === "Bo").scores[0], {
    question: 1,
    guess: 20,
    answer: 10,
    points: 10,
  });
});
