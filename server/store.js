export const ROOM_LIFETIME_MS = 5 * 60 * 60 * 1000;
export function createStore(
  base,
  key,
  { fetcher = fetch, clock = Date.now } = {},
) {
  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
  async function request(query, options = {}) {
    const res = await fetcher(`${base}/rest/v1/zero100_rooms${query}`, {
      ...options,
      headers,
    });
    if (res.status === 409) return null;
    if (!res.ok) throw new Error("SERVER_ERROR");
    return res.json();
  }
  const live = () =>
    `expires_at=gt.${encodeURIComponent(new Date(clock()).toISOString())}&created_at=gt.${encodeURIComponent(new Date(clock() - ROOM_LIFETIME_MS).toISOString())}`;
  return {
    async list() {
      return (
        (await request(
          `?${live()}&select=code,state,created_at,expires_at&order=created_at.desc&limit=100`,
        )) || []
      );
    },
    async create(code, state) {
      const now = clock();
      await request(
        `?or=(expires_at.lte.${encodeURIComponent(new Date(now).toISOString())},created_at.lte.${encodeURIComponent(new Date(now - ROOM_LIFETIME_MS).toISOString())})`,
        { method: "DELETE" },
      ).catch(() => {});
      const rows = await request("", {
        method: "POST",
        body: JSON.stringify({
          code,
          state,
          created_at: new Date(now).toISOString(),
          expires_at: new Date(now + ROOM_LIFETIME_MS).toISOString(),
        }),
      });
      return rows?.[0] ?? null;
    },
    async read(code) {
      return (
        (
          await request(`?code=eq.${code}&${live()}&select=state,revision`)
        )?.[0] ?? null
      );
    },
    async update(code, revision, state) {
      const rows = await request(
        `?code=eq.${code}&revision=eq.${revision}&${live()}`,
        {
          method: "PATCH",
          body: JSON.stringify({ state, revision: revision + 1 }),
        },
      );
      return rows?.length === 1;
    },
    async remove(code, revision) {
      const rows = await request(
        `?code=eq.${code}&revision=eq.${revision}&${live()}`,
        { method: "DELETE" },
      );
      return rows?.length === 1;
    },
  };
}
