import {createRoom,joinRoom,transition,snapshot} from './game.js';
const allowed=new Set(['create','join','state','start','guess','reveal','next','remove']);
export const cors={'Access-Control-Allow-Origin':'https://antonj997.github.io','Access-Control-Allow-Headers':'content-type, apikey','Access-Control-Allow-Methods':'POST, OPTIONS','Vary':'Origin'};
const errorStatus=code=>code==='ROOM_NOT_FOUND'?404:code==='SESSION_INVALID'?403:code==='SERVER_ERROR'?500:code==='BUSY'?503:409;
export async function tokenHash(token){
 if(typeof token!=='string'||!/^[a-f0-9]{64}$/.test(token))throw new Error('SESSION_INVALID');
 const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token));return [...new Uint8Array(bytes)].map(n=>n.toString(16).padStart(2,'0')).join('');
}
export function handler(store){return async req=>{
 const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json','Cache-Control':'no-store'}});
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
 if(req.method!=='POST')return reply({error:'METHOD_NOT_ALLOWED'},405);
 try{
  if(Number(req.headers.get('content-length'))>4096)return reply({error:'INVALID_REQUEST'},413);
  const raw=await req.text();if(raw.length>4096)return reply({error:'INVALID_REQUEST'},413);
  const body=JSON.parse(raw);if(!body||typeof body!=='object'||!allowed.has(body.action))throw new Error('INVALID_ACTION');
  if(typeof body.code!=='string'||!/^[A-Z2-9]{8}$/.test(body.code))throw new Error('INVALID_CODE');
  const hash=await tokenHash(body.token);
  if(body.action==='create'){
   const state=createRoom(body.name,hash,body.mode);const row=await store.create(body.code,state);
   // Retry the same create safely when its response was lost.
   if(!row){const existing=await store.read(body.code);if(!existing||existing.state.players[0].tokenHash!==hash)throw new Error('CODE_TAKEN');return reply({code:body.code,revision:existing.revision,...snapshot(existing.state,hash)});}
   return reply({code:body.code,revision:row.revision,...snapshot(row.state,hash)});
  }
  for(let attempt=0;attempt<6;attempt++){
   const row=await store.read(body.code);if(!row)throw new Error('ROOM_NOT_FOUND');
   if(body.action==='state')return reply({code:body.code,revision:row.revision,...snapshot(row.state,hash)});
   const state=body.action==='join'?joinRoom(row.state,body.name,hash):transition(row.state,hash,body.action,body);
   if(state===row.state)return reply({code:body.code,revision:row.revision,...snapshot(state,hash)});
   if(await store.update(body.code,row.revision,state))return reply({code:body.code,revision:row.revision+1,...snapshot(state,hash)});
  }
  throw new Error('BUSY');
 }catch(err){const code=err instanceof SyntaxError?'INVALID_REQUEST':err.message;
  const safe=new Set(['INVALID_ACTION','INVALID_CODE','INVALID_REQUEST','INVALID_NAME','INVALID_MODE','INVALID_NUMBER','SESSION_INVALID','CODE_TAKEN','ROOM_NOT_FOUND','GAME_STARTED','NAME_TAKEN','ROOM_FULL','HOST_ONLY','NEED_PLAYERS','STALE_QUESTION','QUESTION_CLOSED','ANSWER_LOCKED','READER_ONLY','WAIT_FOR_PLAYERS','GAME_FINISHED','WAIT_FOR_RESULT','BUSY']);
  const error=safe.has(code)?code:'SERVER_ERROR';return reply({error},errorStatus(error));}
};}
