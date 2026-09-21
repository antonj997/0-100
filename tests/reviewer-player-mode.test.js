import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame, saveRound, reader, totals, ranking, restore} from '../public/scoring.js';

test('Reviewer: two complete player cards rotate readers and support winner-changing corrections', () => {
  let game = createGame(['Anna', 'Bo'], 'players');
  assert.equal(game.limit, 14);
  for (let question = 0; question < 14; question++) {
    assert.equal(reader(game), question < 7 ? 'Anna' : 'Bo');
    game = saveRound(game, question < 7 ? [0, 10] : [9, 0], 0);
    if (question === 6) {
      assert.deepEqual(totals(game), [-70, 70]);
      game = restore(JSON.stringify(game));
      assert.equal(reader(game), 'Bo');
    }
  }
  assert.equal(reader(game), null);
  assert.deepEqual(totals(game, 7, 14), [63, -70]);
  assert.deepEqual(totals(game), [-7, 0]);
  assert.equal(ranking(game)[0].name, 'Anna');
  assert.throws(() => saveRound(game, [0, 0], 0), /complete/);
  assert.deepEqual(restore(JSON.stringify(game)), game);

  const corrected = saveRound(game, [0, 10], 10, 0);
  assert.equal(corrected.rounds.length, 14);
  assert.deepEqual(totals(corrected), [13, -20]);
  assert.equal(ranking(corrected)[0].name, 'Bo');
  assert.deepEqual(totals(game), [-7, 0]);
  const restored = restore(JSON.stringify(corrected));
  assert.deepEqual(restored, corrected);
  assert.equal(reader(restored, 6), 'Anna');
  assert.equal(reader(restored, 7), 'Bo');
  assert.equal(reader(restored), null);
  assert.deepEqual(ranking(restored), ranking(corrected));
  assert.throws(() => saveRound(restored, [0, 0], 0), /complete/);
});
