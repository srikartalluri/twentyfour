import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameController } from '../src/controller.js';
import { createTurn, formatValue } from '../src/game.js';

function setup() {
  const jobs = new Map();
  const events = [];
  let created = 0;
  const game = createGameController({
    makeTurn: () => { created++; return createTurn([1, 2, 3, 4]); },
    onChange: (state, event) => events.push({ state, event }),
    schedule(callback, delay) { const id = jobs.size; jobs.set(id, { callback, delay, cancelled: false }); return id; },
    cancel(id) { jobs.get(id).cancelled = true; },
  });
  return { game, jobs, events, created: () => created };
}

test('a win schedules exactly one new hand after 800 ms and ignores repeated submissions', () => {
  const { game, jobs, events, created } = setup();
  game.submit('1x2x3x4');
  assert.equal(game.state.status, 'solved');
  game.submit('1x2x3x4');
  game.submit('');
  assert.equal(jobs.size, 1);
  assert.equal(jobs.get(0).delay, 800);
  assert.equal(created(), 1);
  jobs.get(0).callback();
  assert.equal(created(), 2);
  assert.equal(game.state.status, 'playing');
  assert.equal(events.at(-1).event.type, 'auto-turn');
  assert.equal(game.state.cards.length, 4);
});

test('reset during a success pause cancels and invalidates the scheduled deal', () => {
  const { game, jobs, created } = setup();
  game.submit('1x2x3x4');
  game.reset();
  assert.equal(jobs.get(0).cancelled, true);
  jobs.get(0).callback();
  assert.equal(created(), 1);
  assert.equal(game.state.status, 'playing');
  assert.deepEqual(game.state.cards.map(card => formatValue(card.value)), ['1', '2', '3', '4']);
});

test('a manual new turn during success cannot cause an extra automatic deal', () => {
  const { game, jobs, created } = setup();
  game.submit('1x2x3x4');
  game.newTurn();
  assert.equal(jobs.get(0).cancelled, true);
  jobs.get(0).callback();
  assert.equal(created(), 2);
  assert.equal(game.state.status, 'playing');
});

test('a stale callback cannot interrupt a later win', () => {
  const { game, jobs, created } = setup();
  game.submit('1x2x3x4');
  game.reset();
  game.submit('(1+3)x(2+4)');
  jobs.get(0).callback();
  assert.equal(game.state.status, 'solved');
  jobs.get(1).callback();
  assert.equal(created(), 2);
  assert.equal(game.state.status, 'playing');
});

test('partial, unsuccessful, and invalid expressions do not schedule a new turn', () => {
  const { game, jobs, events } = setup();
  assert.throws(() => game.submit('1+1'));
  assert.equal(events.length, 0);
  game.submit('3+4');
  game.submit('1+2+7');
  assert.equal(game.state.status, 'playing');
  assert.equal(jobs.size, 0);
});

test('destroy cancels a pending automatic deal', () => {
  const { game, jobs, created } = setup();
  game.submit('1x2x3x4');
  game.destroy();
  assert.equal(jobs.get(0).cancelled, true);
  jobs.get(0).callback();
  assert.equal(created(), 1);
});
