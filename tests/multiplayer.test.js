import test from 'node:test';
import assert from 'node:assert/strict';
import {createRoom,joinRoom,transition,snapshot} from '../server/game.js';
const A='a'.repeat(64), B='b'.repeat(64), C='c'.repeat(64);
function ready(mode='7'){let s=createRoom('Anna',A,mode);s=joinRoom(s,'Bo',B);return transition(s,A,'start',{});}
test('each player must answer; only reader can score and guesses stay private',()=>{
 let s=ready();s=transition(s,A,'guess',{round:0,value:'20,5'});
 assert.throws(()=>transition(s,A,'reveal',{round:0,value:20.5}),/WAIT_FOR_PLAYERS/);
 assert.throws(()=>transition(s,B,'reveal',{round:0,value:20.5}),/READER_ONLY/);
 const hidden=snapshot(s,B);assert.equal(hidden.myGuess,null);assert.equal(hidden.players[0].answered,true);assert.ok(!JSON.stringify(hidden).includes(A));assert.ok(!JSON.stringify(hidden).includes('20.5'));
 s=transition(s,B,'guess',{round:0,value:30});s=transition(s,A,'reveal',{round:0,value:20.5});
 assert.deepEqual(snapshot(s,A).totals,[-10,9.5]);assert.deepEqual(snapshot(s,B).rounds[0].guesses,[20.5,30]);
});
test('stale commands cannot spill into later questions; result requires explicit advance',()=>{
 let s=ready();s=transition(s,A,'guess',{round:0,value:0});s=transition(s,B,'guess',{round:0,value:100});s=transition(s,A,'reveal',{round:0,value:0});
 assert.throws(()=>transition(s,A,'guess',{round:0,value:1}),/QUESTION_CLOSED/);
 assert.throws(()=>transition(s,B,'next',{round:0}),/READER_ONLY/);
 s=transition(s,A,'next',{round:0});assert.equal(snapshot(s,A).round,1);
 assert.throws(()=>transition(s,B,'guess',{round:0,value:1}),/STALE_QUESTION/);
});
test('player-card mode rotates readers and ends with correct winners',()=>{
 let s=ready('players');assert.equal(s.limit,14);
 for(let q=0;q<14;q++){const token=q<7?A:B;assert.equal(snapshot(s,A).readerId,q<7?s.players[0].id:s.players[1].id);s=transition(s,A,'guess',{round:q,value:10});s=transition(s,B,'guess',{round:q,value:20});s=transition(s,token,'reveal',{round:q,value:10});if(q<13)s=transition(s,token,'next',{round:q});}
 const view=snapshot(s,A);assert.equal(view.stage,'finished');assert.deepEqual(view.totals,[-140,140]);assert.deepEqual(view.winnerIds,[s.players[0].id]);assert.throws(()=>transition(s,B,'next',{round:13}),/GAME_FINISHED/);
});
test('lobby permissions, unique names and idempotent join',()=>{
 let s=createRoom('Anna',A,'21');assert.throws(()=>transition(s,A,'start',{}),/NEED_PLAYERS/);
 s=joinRoom(s,'Bo',B);assert.deepEqual(joinRoom(s,'Different',B),s);assert.throws(()=>joinRoom(s,'anna',C),/NAME_TAKEN/);assert.throws(()=>transition(s,B,'start',{}),/HOST_ONLY/);
 const kicked=transition(s,A,'remove',{playerId:s.players[1].id});assert.equal(kicked.players.length,1);assert.throws(()=>snapshot(kicked,B),/SESSION_INVALID/);
 s=transition(s,A,'start',{});assert.throws(()=>joinRoom(s,'C',C),/GAME_STARTED/);assert.throws(()=>transition(s,A,'remove',{playerId:s.players[1].id}),/GAME_STARTED/);
});
test('submitted answer locks; invalid range and malformed values rejected',()=>{
 let s=ready();for(const value of ['',null,[],{},-1,101,'NaN'])assert.throws(()=>transition(s,A,'guess',{round:0,value}),/INVALID_NUMBER/);
 s=transition(s,A,'guess',{round:0,value:10});assert.throws(()=>transition(s,A,'guess',{round:0,value:20}),/ANSWER_LOCKED/);assert.deepEqual(transition(s,A,'guess',{round:0,value:10}),s);
});
test('snapshot has no hidden tokens or unanswered peer guesses for any member',()=>{
 let s=ready();s=transition(s,B,'guess',{round:0,value:83});const view=snapshot(s,A);assert.equal(view.myGuess,null);assert.equal(view.rounds.length,0);assert.equal(view.players[1].answered,true);assert.ok(!JSON.stringify(view).includes('83'));assert.ok(!JSON.stringify(view).includes(B));assert.throws(()=>snapshot(s,C),/SESSION_INVALID/);
});

 test('custom cards accept 1–10 only and set seven questions per card',()=>{
  for(let cards=1;cards<=10;cards++)assert.equal(ready(`cards:${cards}`).limit,cards*7);
  for(const mode of ['cards:0','cards:11','cards:1.5','cards:01','cards:-1','cards:','cards:100',null,10])assert.throws(()=>createRoom('Anna',A,mode),/INVALID_MODE/);
 });
 test('ten cards rotate readers and finish exactly after 70 questions',()=>{
  let s=ready('cards:10');
  for(let q=0;q<70;q++){
   const reader=Math.floor(q/7)%2===0?A:B;
   assert.equal(snapshot(s,A).readerId,s.players[Math.floor(q/7)%2].id);
   s=transition(s,A,'guess',{round:q,value:10});s=transition(s,B,'guess',{round:q,value:20});
   s=transition(s,reader,'reveal',{round:q,value:10});assert.equal(s.stage,q===69?'finished':'results');
   if(q<69)s=transition(s,reader,'next',{round:q});
  }
  assert.deepEqual(snapshot(s,A).totals,[-700,700]);
 });
 test('automatic card count is capped at ten for twelve players',()=>{
  let s=createRoom('Anna',A,'players');for(let i=1;i<12;i++)s=joinRoom(s,`Player ${i}`,i.toString(16).padStart(64,'0'));
  assert.equal(transition(s,A,'start',{}).limit,70);
 });
