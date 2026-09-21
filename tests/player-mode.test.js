import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,saveRound,restore,reader} from '../public/scoring.js';
test('one card per player has seven questions per reader',()=>{for(const count of [2,3,4,8]){const g=createGame(Array.from({length:count},(_,i)=>`P${i}`),'players');assert.equal(g.limit,count*7);assert.equal(g.mode,'players');for(let q=0;q<g.limit;q++)assert.equal(reader(g,q),g.players[Math.floor(q/7)]);assert.equal(reader(g,g.limit),null);}});
test('player mode survives saving including three player 21-question game',()=>{let g=createGame(['A','B','C'],'players');g=saveRound(g,[20,30,40],30);assert.deepEqual(restore(JSON.stringify(g)),g);assert.throws(()=>restore(JSON.stringify({...g,limit:7})));});
test('old saved games and classic mode remain compatible',()=>{const g=createGame(['A','B'],7);assert.deepEqual(restore(JSON.stringify(g)),g);assert.equal(reader(g,0),null);});
