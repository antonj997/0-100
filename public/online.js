import { endpoint } from "./online-config.js";
import { celebrate, stopCelebration } from "./celebration.js?v=3";
const $ = (s) => document.querySelector(s),
  esc = (s) =>
    String(s).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
const words = {
  sv: {
    title: "Spela tillsammans",
    create: "Skapa spel",
    join: "Gå med",
    name: "Ditt namn",
    code: "Spelkod",
    length: "Antal rundor (kort)",
    card: "kort",
    singleCard: "kort",
    you: "du",
    host: "Värd",
    language: "Språk",
    questions: "frågor",
    mini: "7 frågor",
    classic: "21 frågor",
    cards: "Ett kort per spelare (max 10)",
    submit: "Lämna svar",
    guess: "Ditt svar",
    answer: "Rätt svar",
    cardHint: "Från frågekortet",
    score: "Visa resultat",
    start: "Starta spelet",
    invite: "Dela spelkod",
    copy: "Kopiera länk",
    copied: "Länk kopierad",
    waiting: "Väntar på att spelet ska starta",
    hostWait: "Starta när alla har gått med.",
    players: "Spelare",
    ready: "har svarat",
    pending: "väntar",
    reads: "Läser",
    question: "Fråga",
    locked: "Ditt svar är lämnat",
    waitAnswers: "Väntar på allas svar",
    readerWait: "Kortläsaren anger rätt svar",
    next: "Nästa fråga",
    waitNext: "Väntar på nästa fråga",
    diff: "Diff / poäng",
    total: "Summa",
    result: "Resultat",
    winner: "Vinnare",
    tie: "Delad seger",
    leave: "Lämna spel",
    leaveCopy:
      "Du kan återansluta på den här telefonen. Spelet fortsätter för de andra.",
    cancel: "Avbryt",
    close: "Stäng",
    remove: "Ta bort",
    rules: "Regler",
    ruleText:
      "Alla svarar på sin egen telefon, även kortläsaren. När alla har lämnat sina svar anger kortläsaren rätt svar från det fysiska kortet. Skillnaden ger poäng; exakt rätt ger −10. Lägst totalsumma vinner. Kortläsaren byts efter sju frågor, i spelarordning.",
    saved: "Återansluter från den här enheten",
    connecting: "Ansluter…",
    offline: "Kontakten bröts. Försöker ansluta igen…",
    retry: "Försök igen",
    resume: "Återanslut till spel",
    notConfigured: "Flerspelarläget väntar på serveranslutning.",
    local: "Poängräknare på en telefon",
    history: "Tidigare frågor",
    current: "Senaste frågan",
    complete: "Spelet är klart",
    storage: "Din webbläsare kan inte spara anslutningen. Håll fliken öppen.",
  },
  en: {
    title: "Play together",
    create: "Create game",
    join: "Join",
    name: "Your name",
    code: "Game code",
    length: "Rounds (cards)",
    card: "cards",
    singleCard: "card",
    you: "you",
    host: "Host",
    language: "Language",
    questions: "questions",
    mini: "7 questions",
    classic: "21 questions",
    cards: "One card per player (max 10)",
    submit: "Submit answer",
    guess: "Your answer",
    answer: "Correct answer",
    cardHint: "From the question card",
    score: "Show results",
    start: "Start game",
    invite: "Share game code",
    copy: "Copy link",
    copied: "Link copied",
    waiting: "Waiting for the game to start",
    hostWait: "Start once everyone has joined.",
    players: "Players",
    ready: "answered",
    pending: "waiting",
    reads: "Reading",
    question: "Question",
    locked: "Your answer is submitted",
    waitAnswers: "Waiting for everyone’s answers",
    readerWait: "The reader enters the correct answer",
    next: "Next question",
    waitNext: "Waiting for the next question",
    diff: "Diff / points",
    total: "Total",
    result: "Results",
    winner: "Winner",
    tie: "Shared win",
    leave: "Leave game",
    leaveCopy:
      "You can reconnect on this phone. The game continues for the others.",
    cancel: "Cancel",
    close: "Close",
    remove: "Remove",
    rules: "Rules",
    ruleText:
      "Everyone answers on their own phone, including the reader. Once all answers are submitted, the reader enters the correct answer from the physical card. Points equal the difference; an exact answer scores −10. Lowest total wins. The reader changes after seven questions, in player order.",
    saved: "Reconnects from this device",
    connecting: "Connecting…",
    offline: "Connection lost. Reconnecting…",
    retry: "Try again",
    resume: "Reconnect to game",
    notConfigured: "Multiplayer is waiting for a server connection.",
    local: "Scorekeeper on one phone",
    history: "Earlier questions",
    current: "Latest question",
    complete: "Game finished",
    storage: "Your browser cannot save this session. Keep this tab open.",
  },
};
const errors = {
  INVALID_NAME: [
    "Ange ett namn med 1–40 tecken.",
    "Enter a name of 1–40 characters.",
  ],
  INVALID_NUMBER: [
    "Ange ett tal mellan 0 och 100.",
    "Enter a number from 0 to 100.",
  ],
  INVALID_CODE: [
    "Ange den åtta tecken långa spelkoden.",
    "Enter the eight-character game code.",
  ],
  ROOM_NOT_FOUND: [
    "Spelet finns inte eller har gått ut.",
    "The game does not exist or has expired.",
  ],
  SESSION_INVALID: [
    "Du är inte längre med i det här spelet.",
    "You are no longer in this game.",
  ],
  GAME_STARTED: ["Spelet har redan startat.", "The game has already started."],
  NAME_TAKEN: [
    "Namnet används redan i spelet.",
    "That name is already in use.",
  ],
  ROOM_FULL: [
    "Spelet har redan 12 spelare.",
    "The game already has 12 players.",
  ],
  HOST_ONLY: [
    "Bara den som skapade spelet kan göra detta.",
    "Only the game creator can do this.",
  ],
  NEED_PLAYERS: [
    "Minst två spelare behöver gå med.",
    "At least two players need to join.",
  ],
  READER_ONLY: [
    "Bara kortläsaren kan göra detta.",
    "Only the reader can do this.",
  ],
  WAIT_FOR_PLAYERS: [
    "Vänta tills alla har svarat.",
    "Wait until everyone has answered.",
  ],
  ANSWER_LOCKED: [
    "Ditt svar är redan lämnat.",
    "Your answer is already submitted.",
  ],
  STALE_QUESTION: [
    "Frågan har ändrats. Spelet uppdateras.",
    "The question has changed. Refreshing game.",
  ],
  QUESTION_CLOSED: ["Frågan är avslutad.", "The question is closed."],
  GAME_FINISHED: ["Spelet är klart.", "The game is finished."],
  WAIT_FOR_RESULT: [
    "Vänta tills rätt svar har angetts.",
    "Wait for the correct answer.",
  ],
  CODE_TAKEN: [
    "Spelkoden är upptagen. Skapa ett nytt spel.",
    "The code is in use. Create a new game.",
  ],
  BUSY: [
    "Flera svar kom samtidigt. Försök igen.",
    "Several answers arrived at once. Try again.",
  ],
  INVALID_MODE: ["Välj 1–10 kort.", "Choose 1–10 cards."],
  INVALID_ACTION: [
    "Åtgärden kunde inte utföras. Försök igen.",
    "The action could not be completed. Try again.",
  ],
  INVALID_REQUEST: [
    "Förfrågan kunde inte behandlas. Försök igen.",
    "The request could not be processed. Try again.",
  ],
  METHOD_NOT_ALLOWED: [
    "Förfrågan stöds inte.",
    "This request is not supported.",
  ],
  SERVER_ERROR: [
    "Servern kunde inte behandla förfrågan. Försök igen.",
    "The server could not process the request. Try again.",
  ],
  NETWORK: [
    "Kunde inte ansluta. Kontrollera internet och försök igen.",
    "Could not connect. Check the internet and try again.",
  ],
};

Object.assign(words.sv, {
  lock: "Lås svaren",
  edit: "Spara ändring",
  editable: "Du kan ändra tills frågan låses.",
  lockedRound: "Svaren är låsta",
  lockFirst: "Lås svaren innan du skriver rätt svar.",
  publish: "Visa rätt svar",
  yourCard: "Ditt spelkort",
  private: "Bara du ser detta",
  continue: "Gå vidare nu",
  seconds: "Nästa skärm om",
  waitGroup: "Väntar på de andra spelarna",
  cardDone: "Kortet är klart",
  standings: "Ställningen",
  lowest: "Lägst poäng leder",
  finish: "Avsluta spelet",
  finishConfirm: "Avsluta nu? Bara färdigrättade frågor räknas.",
  leaveConfirm:
    "Lämna spelet? Ledarrollen går vidare om du är ledare. Du kan inte återansluta med den här spelarsessionen.",
  kickConfirm: "Ta bort spelaren? Spelaren förlorar åtkomst till spelet.",
  noWinner: "Inga frågor har rättats. Ingen vinnare utses.",
  openRooms: "Spel att gå med i",
  noRooms: "Inga öppna spel just nu.",
  roomLoadError: "Kunde inte hämta spelen. Försök igen.",
  createdBy: "Skapat av",
  inProgress: "Pågår",
  expires: "Gäller i högst fem timmar",
  sms: "SMS",
  shareLink: "Dela inbjudan",
  removed: "Lämnat spelet",
  nextCard: "Starta nästa kort",
  totalScore: "Totalpoäng",
  of: "av",
  ownAnswer: "Ditt svar",
  points: "Poäng",
});
Object.assign(words.en, {
  lock: "Lock answers",
  edit: "Save change",
  editable: "You can edit until answers are locked.",
  lockedRound: "Answers are locked",
  lockFirst: "Lock answers before entering the correct answer.",
  publish: "Reveal correct answer",
  yourCard: "Your scorecard",
  private: "Only you can see this",
  continue: "Continue now",
  seconds: "Next screen in",
  waitGroup: "Waiting for the other players",
  cardDone: "Card complete",
  standings: "Standings",
  lowest: "Lowest score leads",
  finish: "End game",
  finishConfirm: "End now? Only scored questions count.",
  leaveConfirm:
    "Leave the game? Leadership transfers if you are the host. This player session cannot reconnect.",
  kickConfirm: "Remove this player? They will lose access to the game.",
  noWinner: "No questions were scored. No winner is declared.",
  openRooms: "Games to join",
  noRooms: "No open games right now.",
  roomLoadError: "Could not load games. Try again.",
  createdBy: "Created by",
  inProgress: "In progress",
  expires: "Available for up to five hours",
  sms: "SMS",
  shareLink: "Share invitation",
  removed: "Left the game",
  nextCard: "Start next card",
  totalScore: "Total score",
  of: "of",
  ownAnswer: "Your answer",
  points: "Points",
});
errors.NOT_LOCKED = ["Lås svaren först.", "Lock answers first."];

const storageKey = "zero100-online-session";
let lang = "sv",
  session = null,
  room = null,
  busy = false,
  connectionLost = false,
  lastFinished = false,
  polling = false,
  notice = "",
  storageFailed = false,
  generation = 0;
let rooms = [],
  roomsError = false,
  listing = false,
  serverOffset = 0;
let nameDraft = "",
  codeDraft = new URL(location.href).searchParams.get("code") || "",
  modeDraft = "players",
  guessDraft = "",
  correctDraft = "",
  entryTab = "create";
try {
  lang = localStorage.getItem("zero-100-language") === "en" ? "en" : "sv";
  session = JSON.parse(localStorage.getItem(storageKey) || "null");
  if (
    session &&
    (!/^[A-Z2-9]{8}$/.test(session.code) ||
      !/^[a-f0-9]{64}$/.test(session.token))
  )
    session = null;
} catch {}
if (codeDraft) {
  codeDraft = codeDraft.toUpperCase();
  entryTab = "join";
  if (session?.code !== codeDraft) session = null;
}
const t = (k) => words[lang][k],
  fmt = (n) =>
    String(n)
      .replace("-", "−")
      .replace(".", lang === "sv" ? "," : ".");
function errorText(code) {
  return errors[code]?.[lang === "sv" ? 0 : 1] || t("offline");
}
function randomHex() {
  return [...crypto.getRandomValues(new Uint8Array(32))]
    .map((n) => n.toString(16).padStart(2, "0"))
    .join("");
}
function newCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return [...crypto.getRandomValues(new Uint8Array(8))]
    .map((n) => alphabet[n % 32])
    .join("");
}
function saveSession() {
  try {
    session
      ? localStorage.setItem(storageKey, JSON.stringify(session))
      : localStorage.removeItem(storageKey);
  } catch {
    storageFailed = true;
    $("#storage-note").textContent = t("storage");
  }
}
async function api(action, extra = {}) {
  const controller = new AbortController(),
    timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...session, action, ...extra }),
      signal: controller.signal,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "NETWORK");
    return data;
  } catch (e) {
    if (e.name === "AbortError" || e instanceof TypeError)
      throw new Error("NETWORK");
    throw e;
  } finally {
    clearTimeout(timeout);
  }
}
function headers() {
  document.documentElement.lang = lang;
  document.title = `0–100 · ${t("title")}`;
  for (const l of ["sv", "en"]) {
    $(`#${l}`).setAttribute("aria-pressed", String(lang === l));
    $(`#${l}`).onclick = () => {
      lang = l;
      try {
        localStorage.setItem("zero-100-language", lang);
      } catch {}
      render();
    };
  }
  $("nav").setAttribute("aria-label", t("language"));
  $("#storage-note").textContent = t(
    storageFailed ? "storage" : connectionLost ? "offline" : "saved",
  );
  $("#rules-open").textContent = t("rules");
  $("#rules-open").onclick = () => {
    const d = $("#rules");
    d.setAttribute("aria-label", t("rules"));
    d.innerHTML = `<h2>${t("rules")}</h2><p>${t("ruleText")}</p><button id="rules-close">${t("close")}</button>`;
    $("#rules-close").onclick = () => d.close();
    d.showModal();
  };
}
function landing() {
  $("#app").innerHTML =
    `<section class="paper setup"><h1>${t("title")}</h1>${!endpoint ? `<p>${t("notConfigured")}</p><a href="./local.html">${t("local")}</a>` : `<div class="online-tabs"><button id="create-tab" aria-pressed="${entryTab === "create"}">${t("create")}</button><button id="join-tab" aria-pressed="${entryTab === "join"}">${t("join")}</button></div><form id="connect-form"><label for="my-name">${t("name")}</label><input id="my-name" required maxlength="40" autocomplete="nickname" enterkeyhint="next" value="${esc(nameDraft)}">${entryTab === "join" ? `<label for="room-code">${t("code")}</label><input id="room-code" required maxlength="8" autocomplete="off" autocapitalize="characters" spellcheck="false" enterkeyhint="go" value="${esc(codeDraft)}">` : `<label for="game-length">${t("length")}</label><select id="game-length"><option value="players">${t("cards")}</option>${Array.from({ length: 10 }, (_, i) => `<option value="cards:${i + 1}">${i + 1} ${t(i === 0 ? "singleCard" : "card")} · ${(i + 1) * 7} ${t("questions")}</option>`).join("")}</select>`}<p id="connection-error" class="error" role="alert">${esc(notice ? errorText(notice) : "")}</p><button class="primary wide" ${busy ? "disabled" : ""}>${busy ? t("connecting") : t(entryTab)}</button></form>${session ? `<button id="resume" class="text-button">${t("resume")} · ${esc(session.code)}</button>` : ""}`}</section>`;
  $("#app").innerHTML += directory();
  bindDirectory();
  if (!endpoint) return;
  for (const kind of ["create", "join"])
    $(`#${kind}-tab`).onclick = () => {
      entryTab = kind;
      landing();
    };
  $("#my-name").oninput = (e) => (nameDraft = e.target.value);
  if ($("#room-code"))
    $("#room-code").oninput = (e) => (codeDraft = e.target.value.toUpperCase());
  if ($("#game-length")) {
    $("#game-length").value = modeDraft;
    $("#game-length").onchange = (e) => (modeDraft = e.target.value);
  }
  $("#my-name").onkeydown = (e) => {
    if (e.key === "Enter" && entryTab === "join") {
      e.preventDefault();
      $("#room-code").focus();
    }
  };
  $("#connect-form").onsubmit = async (e) => {
    e.preventDefault();
    if (busy) return;
    busy = true;
    const previous = session;
    const candidate = {
      code: entryTab === "create" ? newCode() : codeDraft.trim().toUpperCase(),
      token: randomHex(),
      pending: { action: entryTab, name: nameDraft.trim(), mode: modeDraft },
    };
    session = candidate;
    const requestGeneration = ++generation;
    saveSession();
    landing();
    try {
      notice = "";
      accept(
        await api(entryTab, { name: nameDraft.trim(), mode: modeDraft }),
        requestGeneration,
      );
    } catch (err) {
      notice = err.message;
      if (err.message !== "NETWORK") session = previous;
      saveSession();
      landing();
    } finally {
      busy = false;
      render();
    }
  };
  if ($("#resume")) $("#resume").onclick = () => refresh(true);
}
function gameTop() {
  return `<div class="page-heading"><h1>${t("code")} <span class="room-code">${esc(room.code)}</span></h1><button id="leave">${t("leave")}</button></div><p id="online-connection" class="online-connection" role="status">${connectionLost ? t("offline") : ""}</p>${room.stage !== "lobby" ? `<div class="card-heading"><h2>${t("card").replace(/^./, (c) => c.toUpperCase())} ${room.card} ${t("of")} ${room.cardCount}</h2><p>${t("question")} ${(room.round % 7) + 1} ${t("of")} 7</p><div class="question-progress" aria-hidden="true">${Array.from({ length: 7 }, (_, i) => `<span class="${i <= room.round % 7 ? "done" : ""}"></span>`).join("")}</div></div>` : ""}`;
}

function playerList() {
  return `<ul class="online-players">${room.players.map((p) => `<li><span>${esc(p.name)}${p.id === room.meId ? " <small>(" + t("you") + ")</small>" : ""}</span><span data-status="${p.id}">${room.stage === "lobby" ? (p.id === room.hostId ? t("host") : "") : t(p.answered ? "ready" : "pending")}</span>${room.stage !== "finished" && room.meId === room.hostId && p.id !== room.hostId ? `<button data-remove="${p.id}" aria-label="${t("remove")} ${esc(p.name)}">${t("remove")}</button>` : ""}</li>`).join("")}</ul>`;
}
function lobby() {
  return `<section class="paper entry"><h2>${t("players")} <span class="muted">${room.players.length}/12</span></h2>${playerList()}${room.meId === room.hostId ? `<p class="help">${t("hostWait")}</p><button id="start" class="primary wide" ${room.players.length < 2 ? "disabled" : ""}>${t("start")}</button>` : `<p>${t("waiting")}</p>`}${shareControls()}</section>`;
}
function question() {
  const reader = room.players.find((p) => p.id === room.readerId),
    locked = room.stage === "locked";
  return `<section class="paper entry"><p class="reader">${t("reads")}: <strong>${esc(reader?.name || "")}</strong></p><form id="guess-form"><label for="my-guess">${t("guess")} · 0–100</label><input id="my-guess" inputmode="decimal" autocomplete="off" required value="${esc(guessDraft || String(room.myGuess ?? ""))}" ${locked ? "disabled" : ""}><button class="primary" ${locked || busy ? "disabled" : ""}>${t(room.myGuess === null ? "submit" : "edit")}</button></form><p class="help">${t(locked ? "lockedRound" : "editable")}</p><p>${room.answered} / ${room.players.length} ${t("ready")}</p>${playerList()}${room.meId === room.readerId ? `${!locked ? `<button id="lock" class="primary wide" ${room.allAnswered && !busy ? "" : "disabled"}>${t("lock")}</button>` : ""}<form id="correct-form"><div class="answer-row"><label for="correct-answer">${t("answer")}</label><input id="correct-answer" inputmode="decimal" required value="${esc(correctDraft)}" ${locked ? "" : "disabled"}></div><p class="help">${t(locked ? "cardHint" : "lockFirst")}</p><button class="primary wide" ${locked && !busy ? "" : "disabled"}>${t("publish")}</button></form>` : ""}<p id="game-error" class="error" role="alert">${esc(notice ? errorText(notice) : "")}</p></section>`;
}

function results() {
  if (room.stage === "results" || room.stage === "waiting") {
    const last = room.myRounds.at(-1);
    return `<section class="paper entry personal-result"><h2>${t(room.stage === "waiting" ? "waitGroup" : "yourCard")}</h2><p class="help">${t("private")}</p>${room.stage === "results" ? `<p class="result-points">${fmt(last?.points ?? 0)} <small>${t("points")}</small></p><div class="answer-pair"><p>${t("ownAnswer")}<strong>${fmt(last?.guess ?? "—")}</strong></p><p>${t("answer")}<strong>${fmt(last?.answer ?? "—")}</strong></p></div>${ownSheet()}<button id="next-question" class="primary wide">${t("continue")}</button>` : ""}<p class="help" role="timer">${t("seconds")} <span id="countdown">${Math.max(0, Math.ceil((room.deadline - Date.now() - serverOffset) / 1000))}</span> s</p></section>`;
  }
  const done = room.stage === "finished",
    winners = room.players.filter((p) => room.winnerIds.includes(p.id));
  return `<section class="paper entry"><h2>${t(done ? "complete" : "cardDone")}</h2>${done ? `<div class="winner"><p>${t(winners.length > 1 ? "tie" : "winner")}</p><h2>${esc(winners.map((p) => p.name).join(" & ") || t("noWinner"))}</h2></div>` : ""}<h3>${t("standings")}</h3><p class="help">${t("lowest")} · ${t("totalScore")}</p>${rankings()}${!done && room.meId === room.hostId ? `<button id="next-question" class="primary wide">${t("nextCard")}</button>` : !done ? `<p>${t("waitNext")}</p>` : ""}<p id="game-error" class="error" role="alert">${esc(notice ? errorText(notice) : "")}</p></section>`;
}
function ownSheet() {
  return `<table><thead><tr><th>${t("question")}</th><th>${t("guess")}</th><th>${t("answer")}</th><th>${t("points")}</th></tr></thead><tbody>${room.myRounds
    .slice(Math.floor(room.round / 7) * 7)
    .map(
      (r) =>
        `<tr><th>${r.question % 7 || 7}</th><td>${fmt(r.guess ?? "—")}</td><td>${fmt(r.answer)}</td><td>${fmt(r.points ?? "—")}</td></tr>`,
    )
    .join("")}</tbody></table>`;
}
function rankings() {
  let rank = 0,
    last = null;
  return room.ranking
    .map((p, i) => {
      if (last !== p.total) rank = i + 1;
      last = p.total;
      return `<details class="ranking-row"><summary><span>${rank}</span><strong>${esc(p.name)}${p.active ? "" : ` · ${t("removed")}`}</strong><b>${fmt(p.total)}</b></summary><table><thead><tr><th>${t("card")}</th><th>${t("question")}</th><th>${t("points")}</th></tr></thead><tbody>${p.points.map((v, q) => `<tr><td>${Math.floor(q / 7) + 1}</td><td>${(q % 7) + 1}</td><td>${fmt(v ?? "—")}</td></tr>`).join("")}</tbody></table></details>`;
    })
    .join("");
}

function scoreHistory() {
  return room.stage !== "lobby" && room.stage !== "finished"
    ? `<details class="paper online-history"><summary>${t("players")}</summary>${playerList()}</details>${room.meId === room.hostId ? `<button id="finish" class="text-button">${t("finish")}</button>` : ""}`
    : "";
}

function render() {
  headers();
  if (!room) {
    landing();
    return;
  }
  const active = document.activeElement?.id;
  $("#app").innerHTML =
    gameTop() +
    `<div class="online-layout">${room.stage === "lobby" ? lobby() : ["question", "locked"].includes(room.stage) ? question() : results()}${scoreHistory()}</div>`;
  bind();
  if (active && $(`#${active}`)) $(`#${active}`).focus();
}
function bind() {
  $("#leave").onclick = () =>
    confirmAction(t("leaveConfirm"), () => command("leave"));
  if ($("#start")) $("#start").onclick = () => command("start");
  if ($("#lock"))
    $("#lock").onclick = () => command("lock", { round: room.round });
  if ($("#finish"))
    $("#finish").onclick = () =>
      confirmAction(t("finishConfirm"), () => command("finish"));
  document
    .querySelectorAll("[data-remove]")
    .forEach(
      (b) =>
        (b.onclick = () =>
          confirmAction(t("kickConfirm"), () =>
            command("remove", { playerId: b.dataset.remove }),
          )),
    );
  if ($("#guess-form")) {
    $("#my-guess").oninput = (e) => {
      guessDraft = e.target.value;
      notice = "";
      $("#game-error").textContent = "";
    };
    $("#guess-form").onsubmit = (e) => {
      e.preventDefault();
      command("guess", { value: $("#my-guess").value, round: room.round });
    };
  }
  if ($("#correct-form")) {
    $("#correct-answer").oninput = (e) => {
      correctDraft = e.target.value;
      notice = "";
      $("#game-error").textContent = "";
    };
    $("#correct-form").onsubmit = (e) => {
      e.preventDefault();
      command("reveal", { value: correctDraft, round: room.round });
    };
  }
  if ($("#next-question"))
    $("#next-question").onclick = () => command("next", { round: room.round });
  if ($("#copy-link")) $("#copy-link").onclick = () => copyLink();
  if ($("#share"))
    $("#share").onclick = async () => {
      const url = new URL("./multiplayer.html", location.href);
      url.searchParams.set("code", room.code);
      try {
        if (navigator.share)
          await navigator.share({
            title: "0–100",
            text: `${t("code")}: ${room.code}`,
            url: url.href,
          });
        else {
          await navigator.clipboard.writeText(url.href);
          $("#share-status").textContent = t("copied");
        }
      } catch {
        const d = $("#confirm");
        d.innerHTML = `<h2>${t("copy")}</h2><input aria-label="${t("copy")}" value="${esc(url.href)}" readonly><button id="close-share">${t("close")}</button>`;
        $("#close-share").onclick = () => d.close();
        d.showModal();
        d.querySelector("input").select();
      }
    };
}
function accept(next, requestGeneration = generation) {
  if (requestGeneration !== generation || next.code !== session?.code) return;
  if (room && room.code === next.code && next.revision < room.revision) return;
  const previous = room;
  connectionLost = false;
  serverOffset = next.serverNow - Date.now();
  if (session) delete session.pending;

  if (!previous || next.round !== previous.round) {
    guessDraft = "";
    correctDraft = "";
  }
  const { serverNow: ignored, ...stableNext } = next;
  const { serverNow: oldIgnored, ...stablePrevious } = previous || {};
  const unchanged =
    previous && JSON.stringify(stablePrevious) === JSON.stringify(stableNext);
  room = next;
  saveSession();
  if (unchanged) {
    headers();
    if ($("#online-connection")) $("#online-connection").textContent = "";
  } else render();
  if (next.stage === "finished" && !lastFinished) celebrate();
  lastFinished = next.stage === "finished";
}
async function command(action, payload = {}) {
  if (busy) return;
  busy = true;
  const requestGeneration = ++generation;
  const buttons = [...document.querySelectorAll("#app button")];
  buttons.forEach((b) => (b.disabled = true));
  try {
    notice = "";
    const response = await api(action, payload);
    if (action === "leave") {
      generation++;
      room = null;
      session = null;
      connectionLost = false;
      saveSession();
      stopCelebration();
      loadRooms();
    } else accept(response, requestGeneration);
  } catch (e) {
    notice = e.message;
  } finally {
    busy = false;
    render();
    if (notice) refresh();
  }
}
async function refresh(initial = false) {
  if (!session || !endpoint || polling || busy) return;
  polling = true;
  const requestGeneration = generation;
  try {
    const pending = session.pending;
    accept(
      await api(pending?.action || "state", pending || {}),
      requestGeneration,
    );
  } catch (e) {
    if (requestGeneration !== generation) return;
    connectionLost = true;
    if (["SESSION_INVALID", "ROOM_NOT_FOUND"].includes(e.message)) {
      room = null;
      session = null;
      notice = e.message;
      saveSession();
      render();
    } else if (room) {
      $("#online-connection").textContent = t("offline");
    } else if (initial) {
      notice = e.message;
      render();
    }
  } finally {
    polling = false;
  }
}
render();
if (session && endpoint) refresh(true);
if (typeof fetch === "function") loadRooms();
setInterval(() => {
  if (room && !document.hidden) refresh();
}, 2000);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && room) refresh();
});
window.addEventListener("online", () => {
  if (session) refresh(true);
});

function inviteURL() {
  const url = new URL("./multiplayer.html", location.href);
  url.searchParams.set("code", room.code);
  return url.href;
}
function shareControls() {
  return `<div class="share-actions"><button id="share" class="primary wide">${t("shareLink")}</button><a class="button-link" href="sms:?body=${encodeURIComponent("0–100 " + inviteURL())}">${t("sms")}</a><button id="copy-link">${t("copy")}</button></div><span id="share-status" role="status"></span>`;
}
async function copyLink() {
  try {
    await navigator.clipboard.writeText(inviteURL());
    $("#share-status").textContent = t("copied");
  } catch {
    const d = $("#confirm");
    d.innerHTML = `<h2>${t("copy")}</h2><input aria-label="${t("copy")}" value="${esc(inviteURL())}" readonly><button id="close-copy">${t("close")}</button>`;
    $("#close-copy").onclick = () => d.close();
    d.showModal();
    d.querySelector("input").select();
  }
}
function confirmAction(message, action) {
  const d = $("#confirm");
  d.innerHTML = `<h2>${esc(message)}</h2><div class="actions"><button id="cancel-action">${t("cancel")}</button><button id="confirm-action" class="primary">${t("continue")}</button></div>`;
  $("#cancel-action").onclick = () => d.close();
  $("#confirm-action").onclick = () => {
    d.close();
    action();
  };
  d.showModal();
}
function directory() {
  return `<section id="directory" class="paper room-directory"><h2>${t("openRooms")}</h2><p class="help">${t("expires")}</p>${roomsError ? `<p class="error">${t("roomLoadError")}</p><button id="reload-rooms">${t("retry")}</button>` : rooms.length ? rooms.map((r) => `<div class="directory-row"><div><strong>${esc(r.creatorName)}</strong><p>${t("createdBy")} ${esc(r.creatorName)} · ${r.players} ${t("players").toLowerCase()}</p></div>${r.joinable ? `<button data-join="${esc(r.code)}">${t("join")}</button>` : `<span>${t("inProgress")}</span>`}</div>`).join("") : `<p>${t("noRooms")}</p>`}</section>`;
}
function bindDirectory() {
  document.querySelectorAll("[data-join]").forEach(
    (b) =>
      (b.onclick = () => {
        codeDraft = b.dataset.join;
        entryTab = "join";
        landing();
        $("#my-name").focus();
      }),
  );
  if ($("#reload-rooms")) $("#reload-rooms").onclick = () => loadRooms();
}
async function loadRooms() {
  if (listing || !endpoint) return;
  listing = true;
  try {
    const data = await api("list");
    rooms = data.rooms;
    roomsError = false;
  } catch {
    roomsError = true;
  } finally {
    listing = false;
    if (!room) {
      const el = $("#directory");
      if (el) {
        el.outerHTML = directory();
        bindDirectory();
      }
    }
  }
}
setInterval(() => {
  if (room?.deadline && $("#countdown"))
    $("#countdown").textContent = Math.max(
      0,
      Math.ceil((room.deadline - Date.now() - serverOffset) / 1000),
    );
}, 1000);

setInterval(() => {
  if (!room && !document.hidden) loadRooms();
}, 10000);
