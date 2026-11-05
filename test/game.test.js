import test from 'node:test';
import assert from 'node:assert/strict';
import { applyExpression, createTurn, equal, formatValue, GameError, rational, resetTurn } from '../src/game.js';

const values = state => state.cards.map(card => formatValue(card.value));

test('partial expressions consume only the referenced cards and preserve the original hand', () => {
  const original = createTurn([1, 2, 3, 4]);
  const next = applyExpression(original, '3+4');
  assert.deepEqual(values(next), ['1', '2', '7']);
  assert.deepEqual(values(original), ['1', '2', '3', '4']);
  assert.deepEqual(next.cards[2].sourceIds, [2, 3]);
});

for (const operator of ['x', 'X', '*', '×']) {
  test(`supports ${operator} for multiplication and wins with all four cards`, () => {
    const next = applyExpression(createTurn([1, 2, 3, 4]), `1${operator}2${operator}3${operator}4`);
    assert.equal(next.status, 'solved');
    assert.deepEqual(values(next), ['24']);
  });
}

test('honors parentheses and standard precedence', () => {
  assert.deepEqual(values(applyExpression(createTurn([1, 2, 3, 4]), '1+2+3x4')), ['15']);
  assert.equal(applyExpression(createTurn([1, 2, 3, 4]), '(1+3)x(2+4)').status, 'solved');
  assert.deepEqual(values(applyExpression(createTurn([8, 4, 2, 1]), '8/4/2')), ['1', '1']);
  assert.deepEqual(values(applyExpression(createTurn([8, 4, 2, 1]), '8-4-2')), ['2', '1']);
});

test('keeps fractions exact through the classic 3, 3, 8, 8 hand', () => {
  let state = createTurn([3, 3, 8, 8]);
  state = applyExpression(state, '8/3');
  assert.deepEqual(values(state), ['(8/3)', '3', '8']);
  state = applyExpression(state, '3-(8/3)');
  assert.deepEqual(values(state), ['(1/3)', '8']);
  state = applyExpression(state, '8/(1/3)');
  assert.equal(state.status, 'solved');
  assert.deepEqual(values(state), ['24']);
});

test('a complete fractional expression also solves exactly', () => {
  const state = applyExpression(createTurn([3, 3, 8, 8]), '8/(3-8/3)');
  assert.equal(state.status, 'solved');
});

test('parenthesized fractions are normal divisions when no matching result card exists', () => {
  const state = applyExpression(createTurn([1, 3, 2, 4]), '(1/3)+2');
  assert.deepEqual(values(state), ['(7/3)', '4']);
});

test('parenthesized fractions reference one result card while bare division uses separate cards', () => {
  let state = applyExpression(createTurn([1, 3, 1, 3]), '1/3');
  assert.deepEqual(values(state), ['(1/3)', '1', '3']);
  state = applyExpression(state, '1/3+(1/3)');
  assert.deepEqual(values(state), ['(2/3)']);
  assert.equal(state.cards[0].sourceIds.length, 4);
});

test('a fractional card cannot be used twice', () => {
  const state = applyExpression(createTurn([1, 3, 2, 4]), '1/3');
  assert.throws(() => applyExpression(state, '(1/3)+(1/3)'), /already used/);
  assert.throws(() => applyExpression(state, '(1/3)'), /at least two/);
});

test('negative, zero, and negative fractional result cards can be reused', () => {
  let state = applyExpression(createTurn([1, 3, 2, 4]), '1-3');
  assert.deepEqual(values(state), ['-2', '2', '4']);
  state = applyExpression(state, '-2+2');
  assert.deepEqual(values(state), ['0', '4']);
  state = applyExpression(state, '0/4');
  assert.deepEqual(values(state), ['0']);
  assert.equal(state.status, 'playing');

  state = applyExpression(createTurn([1, 3, 2, 4]), '(1-3)/4');
  assert.deepEqual(values(state), ['(-1/2)', '2']);
  assert.deepEqual(values(applyExpression(state, '2+(-1/2)')), ['(3/2)']);
});

test('duplicate numbers are distinct cards', () => {
  const state = createTurn([3, 3, 8, 8]);
  assert.equal(new Set(state.cards.map(card => card.id)).size, 4);
  assert.deepEqual(values(applyExpression(state, '3+3')), ['6', '8', '8']);
  assert.throws(() => applyExpression(state, '3+3+3'), /already used/);
});

test('partial 24 does not win and a non-24 final card does not win', () => {
  assert.equal(applyExpression(createTurn([12, 12, 1, 2]), '12+12').status, 'playing');
  const state = applyExpression(createTurn([1, 2, 3, 4]), '1+2+3+4');
  assert.equal(state.cards.length, 1);
  assert.equal(state.status, 'playing');
});

test('reset restores original values, IDs, order, and playing status', () => {
  const original = createTurn([3, 3, 8, 8]);
  const solved = applyExpression(original, '8/(3-8/3)');
  assert.deepEqual(resetTurn(solved), original);
});

test('random draws cover endpoints and allow repeated values', t => {
  let cursor = 0;
  const draws = [0, 0.1, 0.5, 0.999999];
  t.mock.method(Math, 'random', () => draws[cursor++ % draws.length]);
  assert.deepEqual(values(createTurn()), ['1', '2', '7', '13']);
  t.mock.method(Math, 'random', () => 0);
  assert.deepEqual(values(createTurn()), ['1', '1', '1', '1']);
});

test('a solved hand rejects further engine submissions', () => {
  const state = applyExpression(createTurn([1, 2, 3, 4]), '1x2x3x4');
  assert.throws(() => applyExpression(state, '24+24'), /Solved/);
});

test('rational normalization handles signs and zero exactly', () => {
  assert.deepEqual(rational(0, -8), { n: 0n, d: 1n });
  assert.ok(equal(rational(4, -6), rational(-2, 3)));
  assert.equal(formatValue(rational(12, 6)), '2');
});

const invalid = [
  ['', /Type an expression/],
  ['   ', /Type an expression/],
  ['1', /at least two/],
  ['(1)', /at least two/],
  ['1+1', /already used/],
  ['9+2', /isn’t on the board/],
  ['1++2', /card value/],
  ['1+', /card value/],
  ['(1+2', /Close every/],
  ['1+2)', /parentheses/],
  ['1 2', /operation between/],
  ['1(2+3)', /operation between/],
  ['1.5+2', /Use only/],
  ['2**3', /card value/],
  ['2^3', /Use only/],
  ['-1+2', /isn’t on the board/],
  ['-(1+2)', /card value/],
  ['Math.random()', /Use only/],
  ['<script>alert(1)</script>', /Use only/],
  ['1'.repeat(17), /numbers shown/],
  [' '.repeat(257) + '1+2', /257 characters/],
  ['('.repeat(33) + '1+2' + ')'.repeat(33), /fewer nested/],
];

for (const [expression, expected] of invalid) {
  test(`rejects ${JSON.stringify(expression).slice(0, 50)} without changing the board`, () => {
    const state = createTurn([1, 2, 3, 4]);
    const before = structuredClone(state);
    assert.throws(() => applyExpression(state, expression), expected);
    assert.deepEqual(state, before);
  });
}

test('division by zero leaves a hand unchanged', () => {
  const state = createTurn([1, 2, 2, 4]);
  const before = structuredClone(state);
  assert.throws(() => applyExpression(state, '4/(2-2)'), error => error instanceof GameError && /zero/.test(error.message));
  assert.deepEqual(state, before);
});
