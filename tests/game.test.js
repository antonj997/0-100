import test from 'node:test';
import assert from 'node:assert/strict';
import {number,score,createGame,saveRound,totals,ranking,restore} from '../public/scoring.js';

test('official examples: absolute differences, exact bonus and boundaries',()=>{
  assert.equal(score(35,50),15); assert.equal(score(65,50),15);
  assert.equal(score(50,50),-10); assert.equal(score(0,0),-10);
  assert.equal(score(100,100),-10); assert.equal(score(0,100),100);
});
test('reject missing, nonnumeric and out-of-range answers',()=>{
  for(const value of ['', ' ', null, undefined, true, {}, [], NaN, Infinity, -1,101]) assert.throws(()=>number(value));
  assert.equal(number('0'),0); assert.equal(number('100'),100); assert.equal(number('0,5'),0.5);
});
test('a full classic game sums three separate seven-question rounds',()=>{
  let game=createGame(['Ada','Bea','Cy']);
  for(let i=0;i<7;i++)game=saveRound(game,[50,40,100],50);
  for(let i=0;i<7;i++)game=saveRound(game,[0,20,40],10);
  for(let i=0;i<7;i++)game=saveRound(game,[100,100,100],100);
  assert.deepEqual(totals(game,0,7),[-70,70,350]);
  assert.deepEqual(totals(game,7,14),[70,70,210]);
  assert.deepEqual(totals(game,14,21),[-70,-70,-70]);
  assert.deepEqual(totals(game),[-70,70,490]);
  assert.equal(ranking(game)[0].name,'Ada');
  assert.throws(()=>saveRound(game,[0,0,0],0));
});
test('Mini stops after seven and allows tied negative winners',()=>{
  let game=createGame(['A','B','C'],7);
  for(let i=0;i<7;i++)game=saveRound(game,[20,20,21],20);
  assert.deepEqual(totals(game),[-70,-70,7]);
  assert.deepEqual(ranking(game).map(p=>p.rank),[1,1,3]);
  assert.throws(()=>saveRound(game,[1,1,1],1));
});
test('correcting an old question recalculates scores without adding a question',()=>{
  let game=createGame(['A','B']);game=saveRound(game,[20,25],20);game=saveRound(game,[40,40],40);
  const corrected=saveRound(game,[20,25],25,0);
  assert.equal(corrected.rounds.length,2);assert.deepEqual(totals(corrected),[-5,-20]);
  assert.deepEqual(totals(game),[-20,-5]);assert.equal(ranking(corrected)[0].name,'B');
});
test('complete games permit correction and reopening after undo',()=>{
  let game=createGame(['A','B'],7);for(let i=0;i<7;i++)game=saveRound(game,[50,40],50);
  const corrected=saveRound(game,[50,40],40,6);assert.deepEqual(totals(corrected),[-50,50]);
  const undone={...corrected,rounds:corrected.rounds.slice(0,-1)};
  assert.deepEqual(totals(undone),[-60,60]);assert.equal(saveRound(undone,[50,40],50).rounds.length,7);
});
test('saved games retain guesses, scores, players and mode',()=>{
  const game=saveRound(createGame(['Åsa','李'],7),[0,100],50);
  const saved=restore(JSON.stringify(game));assert.deepEqual(saved,game);assert.deepEqual(totals(saved),[50,50]);
  for(const value of ['bad','{}','null',JSON.stringify({...game,version:2}),JSON.stringify({...game,rounds:[{guesses:[50],answer:50}]})])assert.throws(()=>restore(value));
});
test('decimal differences and tiny differences are retained',()=>{
  assert.equal(score(0.1,0.3),0.2);assert.equal(score(1e-9,0),1e-9);
  let game=createGame(['A','B'],7);for(let i=0;i<7;i++)game=saveRound(game,[0.1,1e-9],0);
  assert.deepEqual(totals(game),[0.7,7e-9]);
});
test('player and question validation prevents incomplete games',()=>{
  for(const players of [[],['A'],['A',' '],[' A','a'],['A','b'.repeat(41)]])assert.throws(()=>createGame(players));
  assert.throws(()=>createGame(['A','B'],14));
  const game=createGame([' A ','B']);assert.deepEqual(game.players,['A','B']);
  assert.throws(()=>saveRound(game,[20],20));assert.throws(()=>saveRound(game,[20,30],20,-1));
  assert.throws(()=>saveRound(game,[20,30],20,1));assert.throws(()=>saveRound(game,[20,30],20,0.5));
});
