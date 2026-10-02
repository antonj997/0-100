import test from 'node:test';
import assert from 'node:assert/strict';
import {handler} from '../server/api.js';
const A='a'.repeat(64),B='b'.repeat(64),code='ABCDEFGH';
function memory(){const map=new Map();return {map,async create(c,state){if(map.has(c))return null;const row={state,revision:0};map.set(c,row);return structuredClone(row);},async read(c){return structuredClone(map.get(c));},async update(c,r,state){const row=map.get(c);if(row.revision!==r)return false;map.set(c,{state,revision:r+1});return true;}};}
function request(api,action,token,extra={}){return api(new Request('https://api.test',{method:'POST',body:JSON.stringify({action,code,token,...extra})})).then(async r=>({status:r.status,data:await r.json()}));}
test('API merges simultaneous answers and never leaks capability hashes',async()=>{
 const store=memory(),api=handler(store);await request(api,'create',A,{name:'Anna',mode:'7'});await request(api,'join',B,{name:'Bo'});await request(api,'start',A);
 const res=await Promise.all([request(api,'guess',A,{round:0,value:10}),request(api,'guess',B,{round:0,value:20})]);assert.equal(res[0].status,200);assert.equal(res[1].status,200);
 const view=(await request(api,'state',A)).data;assert.equal(view.answered,2);assert.equal(view.myGuess,10);assert.deepEqual(view.rounds,[]);assert.ok(!JSON.stringify(view).includes('tokenHash'));
 assert.equal(view.revision,4);assert.ok(res.every(r=>r.data.revision>=3&&r.data.revision<=4));
 const result=await request(api,'reveal',A,{round:0,value:10});assert.deepEqual(result.data.totals,[-10,10]);assert.equal(result.data.revision,5);
});
test('retries join and create safely; denied early reveal, strangers and stale rounds',async()=>{
 const store=memory(),api=handler(store);const first=await request(api,'create',A,{name:'Anna',mode:'7'});assert.deepEqual((await request(api,'create',A,{name:'Anna',mode:'7'})).data,first.data);
 await request(api,'join',B,{name:'Bo'});await request(api,'join',B,{name:'Bo'});assert.equal((await request(api,'state',A)).data.players.length,2);
 await request(api,'start',A);assert.equal((await request(api,'reveal',A,{round:0,value:10})).data.error,'WAIT_FOR_PLAYERS');assert.equal((await request(api,'state','c'.repeat(64))).status,403);assert.equal((await request(api,'guess',A,{round:1,value:10})).data.error,'STALE_QUESTION');
});
test('malformed API requests are rejected without internal errors',async()=>{
 const api=handler(memory());assert.equal((await api(new Request('https://api.test',{method:'GET'}))).status,405);
 const r=await api(new Request('https://api.test',{method:'POST',body:'not json'}));assert.equal((await r.json()).error,'INVALID_REQUEST');
 assert.equal((await request(api,'state','bad')).status,403);
});
