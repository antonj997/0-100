import { number, score, decimalSum } from "../public/scoring.js";
const fail = (code) => {
  throw new Error(code);
};
export const activePlayers = (s) => s.players.filter((p) => p.active !== false);
const member = (s, hash) =>
  activePlayers(s).find((p) => p.tokenHash === hash) || fail("SESSION_INVALID");
const validName = (value) =>
  typeof value === "string" && value.trim() && value.trim().length <= 40
    ? value.trim()
    : fail("INVALID_NAME");
function value(input) {
  try {
    return number(input);
  } catch {
    fail("INVALID_NUMBER");
  }
}
function reader(s) {
  const list = activePlayers(s);
  if (!list.length) return null;
  const preferred =
    s.readerOrder?.[Math.floor(s.round / 7) % s.readerOrder.length];
  return list.find((p) => p.id === preferred)?.id || list[0].id;
}
export function normalize(state) {
  const s = structuredClone(state);
  s.version = 2;
  s.advanced ??= [];
  s.drafts ??= {};
  s.readerOrder ??= s.players.map((p) => p.id);
  s.creatorName ??= s.players[0]?.name || "";
  if (s.stage === "results" && !s.deadline) s.deadline = 0;
  if (s.stage === "results" && !s.review)
    s.review = {
      round: s.round,
      deadline: s.deadline,
      advanced: [...s.advanced],
    };
  return s;
}
export function createRoom(name, hash, mode) {
  if (
    !["7", "21", "players"].includes(mode) &&
    !(typeof mode === "string" && /^cards:(?:[1-9]|10)$/.test(mode))
  )
    fail("INVALID_MODE");
  if (!/^[a-f0-9]{64}$/.test(hash)) fail("SESSION_INVALID");
  const p = {
    id: hash.slice(0, 24),
    name: validName(name),
    tokenHash: hash,
    active: true,
  };
  return {
    version: 2,
    players: [p],
    hostId: p.id,
    creatorName: p.name,
    mode,
    limit: null,
    stage: "lobby",
    round: 0,
    guesses: {},
    rounds: [],
    advanced: [],
    readerOrder: [],
  };
}
export function joinRoom(state, name, hash) {
  const old = state.players.find((p) => p.tokenHash === hash);
  if (old) {
    if (old.active === false) fail("SESSION_INVALID");
    return state;
  }
  if (state.stage !== "lobby") fail("GAME_STARTED");
  if (!/^[a-f0-9]{64}$/.test(hash)) fail("SESSION_INVALID");
  const n = validName(name);
  if (
    activePlayers(state).some(
      (p) => p.name.toLocaleLowerCase() === n.toLocaleLowerCase(),
    )
  )
    fail("NAME_TAKEN");
  if (activePlayers(state).length >= 12) fail("ROOM_FULL");
  return {
    ...state,
    players: [
      ...state.players,
      { id: hash.slice(0, 24), name: n, tokenHash: hash, active: true },
    ],
  };
}
function advance(s, now) {
  if (s.rounds.length >= s.limit) {
    s.stage = "finished";
    return;
  }
  if (s.rounds.length % 7 === 0) {
    s.stage = "card";
    s.cardReview = { round: s.round, deadline: now + 15000, advanced: [] };
    return;
  }
  s.round = s.rounds.length;
  s.stage = "question";
  s.guesses = {};
  s.drafts = {};
  s.advanced = [];
  s.deadline = null;
}
function startNextCard(s) {
  s.round = s.rounds.length;
  s.stage = "question";
  s.guesses = {};
  s.drafts = {};
  s.advanced = [];
  s.deadline = null;
}
export function tick(state, now = Date.now()) {
  const s = normalize(state);
  if (s.review && now >= s.review.deadline) {
    const deadline = s.review.deadline;
    s.review = null;
    if (s.stage === "results") advance(s, deadline);
  }
  if (s.cardReview && now >= s.cardReview.deadline) {
    s.cardReview = null;
    if (s.stage === "card") startNextCard(s);
  }
  return s;
}
export function transition(
  state,
  hash,
  action,
  payload = {},
  now = Date.now(),
) {
  const s = tick(state, now),
    me = member(s, hash);
  if (["leave", "remove"].includes(action)) {
    if (action === "remove" && me.id !== s.hostId) fail("HOST_ONLY");
    const id = action === "leave" ? me.id : payload.playerId;
    if (action === "remove" && id === s.hostId) fail("HOST_ONLY");
    const target = s.players.find((p) => p.id === id);
    if (!target) fail("SESSION_INVALID");
    target.active = false;
    delete s.guesses[id];
    delete s.drafts[id];
    const remaining = activePlayers(s);
    if (!remaining.length) {
      s.stage = "closed";
      s.hostId = null;
    } else if (s.hostId === id) s.hostId = remaining[0].id;
    return s;
  }
  if (action === "finish") {
    if (me.id !== s.hostId) fail("HOST_ONLY");
    s.stage = "finished";
    s.endedEarly = true;
    s.review = null;
    s.cardReview = null;
    s.guesses = {};
    s.drafts = {};
    return s;
  }
  if (action === "cards") {
    if (me.id !== s.hostId) fail("HOST_ONLY");
    if (s.stage === "finished") fail("GAME_FINISHED");
    const cards = payload.cards;
    if (
      !Number.isInteger(cards) ||
      cards < 1 ||
      cards > 10 ||
      (s.stage !== "lobby" && cards < Math.floor(s.round / 7) + 1)
    )
      fail("INVALID_MODE");
    s.mode = `cards:${cards}`;
    if (s.stage !== "lobby") {
      s.limit = cards * 7;
      if (s.stage === "card" && s.rounds.length >= s.limit) {
        s.stage = "finished";
        s.review = null;
        s.cardReview = null;
      }
    }
    return s;
  }
  if (action === "start") {
    if (me.id !== s.hostId) fail("HOST_ONLY");
    if (s.stage !== "lobby") fail("GAME_STARTED");
    const list = activePlayers(s);
    if (list.length < 2) fail("NEED_PLAYERS");
    s.readerOrder = list.map((p) => p.id);
    s.limit =
      s.mode === "players"
        ? Math.min(list.length, 10) * 7
        : s.mode.startsWith("cards:")
          ? Number(s.mode.slice(6)) * 7
          : Number(s.mode);
    s.stage = "question";
    return s;
  }
  if (action === "next") {
    // Acknowledge only this player's view, even if another player already advanced the shared question.
    if (
      s.review &&
      payload.round === s.review.round &&
      (payload.phase === "results" || (payload.phase == null && !s.review.advanced.includes(me.id)))
    ) {
      s.review.advanced = [...new Set([...s.review.advanced, me.id])];
      if (s.stage === "results") advance(s, now);
      return s;
    }
    if (
      s.cardReview &&
      payload.round === s.cardReview.round &&
      (payload.phase === "card" || (payload.phase == null && !s.cardReview.advanced.includes(me.id)))
    ) {
      s.cardReview.advanced = [...new Set([...s.cardReview.advanced, me.id])];
      if (s.stage === "card") startNextCard(s);
      return s;
    }
    if (payload.phase == null && s.stage === "card" && payload.round === s.round) {
      startNextCard(s);
      return s;
    }
  }
  if(action==='next' && payload.phase==='results' && Number.isInteger(payload.round) && payload.round>=0 && payload.round<s.rounds.length)return s;
  if (s.stage === "finished") fail("GAME_FINISHED");
  if (!Number.isInteger(payload.round) || payload.round !== s.round)
    fail("STALE_QUESTION");
  if (action === "next") fail("WAIT_FOR_RESULT");
  if (action === "edit") {
    if (s.stage !== "question") fail("QUESTION_CLOSED");
    if (Object.hasOwn(s.guesses, me.id)) {
      s.drafts[me.id] = s.guesses[me.id];
      delete s.guesses[me.id];
    }
    return s;
  }
  if (action === "guess") {
    if (s.stage !== "question") fail("QUESTION_CLOSED");
    const guess = value(payload.value);
    if (Object.hasOwn(s.guesses, me.id) && s.guesses[me.id] !== guess)
      fail("ANSWER_LOCKED");
    s.guesses[me.id] = guess;
    delete s.drafts[me.id];
    return s;
  }
  if (["lock", "reveal"].includes(action)) {
    if (me.id !== reader(s)) fail("READER_ONLY");
    if (action === "lock") {
      if (s.stage === "locked") return s;
      if (s.stage !== "question") fail("QUESTION_CLOSED");
      if (activePlayers(s).some((p) => !Object.hasOwn(s.guesses, p.id)))
        fail("WAIT_FOR_PLAYERS");
      s.stage = "locked";
      return s;
    }
    if (s.stage !== "locked") fail("NOT_LOCKED");
    const answer = value(payload.value);
    s.rounds.push({
      answer,
      guesses: s.players.map((p) =>
        p.active === false ? null : (s.guesses[p.id] ?? null),
      ),
    });
    s.stage = "results";
    s.deadline = now + 15000;
    s.review = { round: s.round, deadline: s.deadline, advanced: [] };
    s.cardReview = null;
    s.advanced = [];
    return s;
  }
  fail("INVALID_ACTION");
}
export function snapshot(state, hash, now = Date.now()) {
  const s = tick(state, now),
    me = member(s, hash),
    index = s.players.findIndex((p) => p.id === me.id),
    list = activePlayers(s),
    mine = s.rounds.map((r, i) => ({
      question: i + 1,
      answer: r.answer,
      guess: r.guesses[index] ?? null,
      points:
        r.guesses[index] == null ? null : score(r.guesses[index], r.answer),
    }));
  const finished = s.stage === "finished",
    visibleCount = finished
      ? s.rounds.length
      : Math.floor(s.rounds.length / 7) * 7;
  const published = s.rounds.slice(0, visibleCount).map((r) => ({
    ...r,
    points: r.guesses.map((g) => (g == null ? null : score(g, r.answer))),
  }));
  const ranking = s.players
    .map((p, i) => ({
      id: p.id,
      name: p.name,
      active: p.active !== false,
      total: decimalSum(published.map((r) => r.points[i] ?? 0)),
      points: published.map((r) => r.points[i]),
      scores: published.map((r, q) => ({
        question: q + 1,
        guess: r.guesses[i] ?? null,
        answer: r.answer,
        points: r.points[i] ?? null,
      })),
    }))
    .sort((a, b) => a.total - b.total || a.name.localeCompare(b.name));
  const eligible = ranking.filter((p) => p.active),
    best = eligible[0]?.total;
  let stage = s.stage,
    round = s.round;
  let viewDeadline = null;
  if (s.cardReview && !s.cardReview.advanced.includes(me.id)) {
    stage = "card";
    round = s.cardReview.round;
    viewDeadline = s.cardReview.deadline;
  }
  if (s.review && !s.review.advanced.includes(me.id)) {
    stage = "results";
    round = s.review.round;
    viewDeadline = s.review.deadline;
  }
  const answered = list.filter((p) => Object.hasOwn(s.guesses, p.id)).length;
  return {
    version: 2,
    stage,
    mode: s.mode,
    limit: s.limit,
    round,
    card: Math.floor(round / 7) + 1,
    cardCount: s.limit ? s.limit / 7 : null,
    meId: me.id,
    hostId: s.hostId,
    readerId: reader({ ...s, round }),
    creatorName: s.creatorName,
    players: list.map((p) => ({
      id: p.id,
      name: p.name,
      answered: Object.hasOwn(s.guesses, p.id),
    })),
    myGuess:
      stage === "results"
        ? (mine[round]?.guess ?? null)
        : (s.guesses[me.id] ?? null),
    myDraft: s.drafts[me.id] ?? null,
    answered,
    allAnswered: answered === list.length,
    myRounds: mine,
    myTotal: decimalSum(mine.map((r) => r.points ?? 0)),
    rounds: published,
    totals: visibleCount
      ? s.players.map((p) => ranking.find((r) => r.id === p.id).total)
      : [],
    ranking: visibleCount ? ranking : [],
    deadline: viewDeadline,
    serverNow: now,
    winnerIds:
      finished && s.rounds.length
        ? eligible.filter((p) => p.total === best).map((p) => p.id)
        : [],
    endedEarly: s.endedEarly || false,
  };
}
