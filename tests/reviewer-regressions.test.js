// Independent reviewer-authored regression cases; executed by the main agent.
import test from 'node:test';
import assert from 'node:assert/strict';
import {number,score,createGame,saveRound,totals,ranking,restore} from '../public/scoring.js';

test('Reviewer: Classic subtotals and winner calculated independently',()=>{
  let game=createGame(['Alice','Bob','Cara'],21);
  for(let i=0;i<7;i++)game=saveRound(game,[0,50,100],0);
  for(let i=0;i<7;i++)game=saveRound(game,[25,50,75],50);
  for(let i=0;i<7;i++)game=saveRound(game,[0,99,100],100);
  assert.equal(game.rounds.length,21);
  assert.deepEqual(totals(game,0,7),[-70,350,700]);
  assert.deepEqual(totals(game,7,14),[175,-70,175]);
  assert.deepEqual(totals(game,14,21),[700,7,-70]);
  assert.deepEqual(totals(game),[805,287,805]);
  assert.deepEqual(ranking(game).map(({name,total,rank})=>({name,total,rank})),[
    {name:'Bob',total:287,rank:1},{name:'Alice',total:805,rank:2},{name:'Cara',total:805,rank:2}
  ]);
  assert.throws(()=>saveRound(game,[0,0,0],0));
  assert.deepEqual(restore(JSON.stringify(game)),game);
});
test('Reviewer: corrections recompute shared winners without mutation',()=>{
  const original=saveRound(createGame(['A','B','C'],7),[40,60,50],50);
  assert.deepEqual(totals(original),[10,10,-10]);
  const corrected=saveRound(original,[50,60,50],50,0);
  assert.equal(corrected.rounds.length,1);assert.deepEqual(totals(corrected),[-10,10,-10]);
  assert.deepEqual(ranking(corrected).map(({name,rank})=>[name,rank]),[['A',1],['C',1],['B',3]]);
  assert.deepEqual(totals(original),[10,10,-10]);
  const changedAnswer=saveRound(corrected,[50,60,50],60,0);
  assert.deepEqual(totals(changedAnswer),[10,-10,10]);assert.equal(ranking(changedAnswer)[0].name,'B');
});
test('Reviewer: tiny nonexact decimal differences survive scoring and summation',()=>{
  assert.equal(score(1e-9,0),1e-9);assert.equal(score(0,1e-20),1e-20);
  assert.equal(score(0.1,0.3),0.2);assert.equal(score(0.3,0.1),0.2);assert.equal(score(1e-9,1e-9),-10);
  let game=createGame(['Tiny','Exact'],7);
  for(let i=0;i<7;i++)game=saveRound(game,[1e-9,0],0);
  assert.deepEqual(totals(game),[7e-9,-70]);assert.deepEqual(totals(restore(JSON.stringify(game))),[7e-9,-70]);
});
test('Reviewer: malformed player values cannot be restored or coerced',()=>{
  for(const invalid of [null,{},42,true,['Nested']]){
    assert.throws(()=>createGame(['Alice',invalid],7));
    assert.throws(()=>restore(JSON.stringify({version:1,players:['Alice',invalid],limit:7,rounds:[]})));
  }
  assert.throws(()=>createGame(null,7));assert.throws(()=>createGame(['Alice',' alice '],7));
  assert.deepEqual(createGame([' Alice ',' Bob '],7).players,['Alice','Bob']);
});
test('Reviewer: Mini boundaries, invalid entries, completion and correction',()=>{
  assert.equal(number('0'),0);assert.equal(number('100'),100);
  assert.equal(score(0,100),100);assert.equal(score(100,0),100);
  assert.equal(score(0,0),-10);assert.equal(score(100,100),-10);
  for(const invalid of ['',' ',null,true,NaN,Infinity,-1,101])assert.throws(()=>number(invalid));
  let game=createGame(['A','B'],7);
  assert.throws(()=>saveRound(game,[20],20));assert.throws(()=>saveRound(game,[20,30],101));
  assert.throws(()=>saveRound(game,[20,30],20,-1));assert.throws(()=>saveRound(game,[20,30],20,1));
  assert.equal(game.rounds.length,0);
  for(let i=0;i<7;i++)game=saveRound(game,[0,100],0);
  assert.deepEqual(totals(game),[-70,700]);assert.throws(()=>saveRound(game,[0,100],0));
  const corrected=saveRound(game,[0,100],100,6);
  assert.equal(corrected.rounds.length,7);assert.deepEqual(totals(corrected),[40,590]);assert.deepEqual(totals(game),[-70,700]);
});
