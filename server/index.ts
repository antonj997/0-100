import {handler} from './api.js';
const base=Deno.env.get('SUPABASE_URL');
const key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
if(!base||!key)throw new Error('Missing server configuration');
const headers={apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json',Prefer:'return=representation'};
async function request(query:string,options:RequestInit={}){
 const res=await fetch(`${base}/rest/v1/zero100_rooms${query}`,{...options,headers});
 if(res.status===409)return null;
 if(!res.ok)throw new Error('SERVER_ERROR');
 return await res.json();
}
const store={
 async create(code:string,state:unknown){
  // Opportunistic cleanup; never blocks a new room on cleanup failure.
  await fetch(`${base}/rest/v1/zero100_rooms?expires_at=lt.${encodeURIComponent(new Date().toISOString())}`,{method:'DELETE',headers}).catch(()=>{});
  const rows=await request('',{method:'POST',body:JSON.stringify({code,state})});return rows?.[0]??null;
 },
 async read(code:string){const rows=await request(`?code=eq.${code}&expires_at=gt.${encodeURIComponent(new Date().toISOString())}&select=state,revision`);return rows?.[0]??null;},
 async update(code:string,revision:number,state:unknown){const rows=await request(`?code=eq.${code}&revision=eq.${revision}&expires_at=gt.${encodeURIComponent(new Date().toISOString())}`,{method:'PATCH',body:JSON.stringify({state,revision:revision+1})});return rows?.length===1;}
};
Deno.serve(handler(store));
