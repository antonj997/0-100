import test from "node:test";
import assert from "node:assert/strict";
import { handler } from "../server/api.js";
import { createStore, ROOM_LIFETIME_MS } from "../server/store.js";
const A = "a".repeat(64),
  B = "b".repeat(64),
  code = "ABCDEFGH";
function memory() {
  const map = new Map();
  return {
    map,
    async list() {
      return [...map].map(([code, r]) => ({
        code,
        ...r,
        created_at: new Date(0).toISOString(),
        expires_at: new Date(18000000).toISOString(),
      }));
    },
    async create(c, state) {
      if (map.has(c)) return null;
      const r = { state, revision: 0 };
      map.set(c, r);
      return structuredClone(r);
    },
    async read(c) {
      return structuredClone(map.get(c));
    },
    async update(c, r, state) {
      if (map.get(c)?.revision !== r) return false;
      map.set(c, { state, revision: r + 1 });
      return true;
    },
    async remove(c, r) {
      if (map.get(c)?.revision !== r) return false;
      return map.delete(c);
    },
  };
}
const req = async (api, action, token = A, extra = {}) => {
  const r = await api(
    new Request("https://test", {
      method: "POST",
      body: JSON.stringify({ action, code, token, ...extra }),
    }),
  );
  return { status: r.status, ...(await r.json()) };
};
test("lobby discovery, host handover, kick and last leave delete", async () => {
  const store = memory(),
    api = handler(store, { clock: () => 1000 });
  await req(api, "create", A, { name: "Anna", mode: "7" });
  await req(api, "join", B, { name: "Bo" });
  const list = await req(api, "list");
  assert.equal(list.rooms[0].creatorName, "Anna");
  assert.ok(!JSON.stringify(list).includes("tokenHash"));
  await req(api, "leave");
  assert.equal((await req(api, "state", A)).status, 403);
  assert.equal(
    (await req(api, "state", B)).hostId,
    (await req(api, "state", B)).meId,
  );
  await req(api, "leave", B);
  assert.equal(store.map.size, 0);
});
test("concurrent answer updates preserve both answers; lock is enforced", async () => {
  const api = handler(memory(), { clock: () => 1000 });
  await req(api, "create", A, { name: "Anna", mode: "7" });
  await req(api, "join", B, { name: "Bo" });
  await req(api, "start");
  const responses = await Promise.all([
    req(api, "guess", A, { round: 0, value: 10 }),
    req(api, "guess", B, { round: 0, value: 20 }),
  ]);
  assert.ok(responses.every((r) => r.status === 200));
  await req(api, "lock", A, { round: 0 });
  assert.equal(
    (await req(api, "guess", B, { round: 0, value: 30 })).error,
    "QUESTION_CLOSED",
  );
  const result = await req(api, "reveal", A, { round: 0, value: 10 });
  assert.deepEqual(result.totals, []);
  assert.equal(result.myRounds[0].points, -10);
});
test("REST store enforces five hours at writes and all reads", async () => {
  const calls = [];
  const store = createStore("https://test", "test-key", {
    clock: () => 20000000,
    fetcher: async (url, options) => {
      calls.push({ url, options });
      return new Response(JSON.stringify([]), { status: 200 });
    },
  });
  await store.create(code, {});
  const body = JSON.parse(calls.at(-1).options.body);
  assert.equal(
    Date.parse(body.expires_at) - Date.parse(body.created_at),
    ROOM_LIFETIME_MS,
  );
  await store.read(code);
  await store.list();
  await store.update(code, 0, {});
  await store.remove(code, 0);
  for (const c of calls.slice(-4)) {
    assert.match(c.url, /expires_at=gt/);
    assert.match(c.url, /created_at=gt/);
  }
});
