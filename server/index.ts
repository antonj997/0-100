import { handler } from "./api.js";
import { createStore } from "./store.js";
const base = Deno.env.get("SUPABASE_URL");
const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
if (!base || !key) throw new Error("Missing server configuration");
Deno.serve(handler(createStore(base, key)));
