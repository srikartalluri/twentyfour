export class GameError extends Error {
  constructor(message) {
    super(message);
    this.name = 'GameError';
  }
}

const abs = (value) => value < 0n ? -value : value;

export function rational(numerator, denominator = 1n) {
  let n = BigInt(numerator);
  let d = BigInt(denominator);
  if (d === 0n) throw new GameError('You can’t divide by zero. Try another operation.');
  if (d < 0n) { n = -n; d = -d; }
  let a = abs(n);
  let b = d;
  while (b !== 0n) [a, b] = [b, a % b];
  return { n: n / a, d: d / a };
}

export const equal = (a, b) => a.n === b.n && a.d === b.d;
export const formatValue = ({ n, d }) => d === 1n ? String(n) : `(${n}/${d})`;

function calculate(a, operator, b) {
  switch (operator) {
    case '+': return rational(a.n * b.d + b.n * a.d, a.d * b.d);
    case '-': return rational(a.n * b.d - b.n * a.d, a.d * b.d);
    case '*': return rational(a.n * b.n, a.d * b.d);
    case '/': return rational(a.n * b.d, a.d * b.n);
    default: throw new GameError('Use only +, -, x, *, /, and parentheses.');
  }
}

export function createTurn(values = Array.from({ length: 4 }, () => 1 + Math.floor(Math.random() * 13))) {
  if (values.length !== 4 || values.some(value => !Number.isInteger(value) || value < 1 || value > 13)) {
    throw new RangeError('A turn needs four integers from 1 through 13.');
  }
  const originalCards = values.map((value, index) => ({
    id: `original-${index}`,
    value: rational(value),
    sourceIds: [index],
    expression: null,
  }));
  return { originalCards, cards: [...originalCards], status: 'playing', nextId: 0 };
}

export function resetTurn(state) {
  return { ...state, cards: [...state.originalCards], status: 'playing', nextId: 0 };
}

function tokenize(text) {
  if (!text.trim()) throw new GameError('Type an expression using at least two of your cards.');
  if (text.length > 256) throw new GameError('Keep your expression under 257 characters.');
  const normalized = text.replace(/[xX×]/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
  const tokens = [];
  let position = 0;
  while (position < normalized.length) {
    const character = normalized[position];
    if (/\s/.test(character)) { position++; continue; }
    const digits = normalized.slice(position).match(/^\d+/)?.[0];
    if (digits) {
      if (digits.length > 16) throw new GameError('Use the numbers shown on your cards.');
      tokens.push({ type: 'number', value: digits });
      position += digits.length;
    } else if ('+-*/()'.includes(character)) {
      tokens.push({ type: character });
      position++;
    } else {
      throw new GameError('Use only card values, +, -, x, *, /, and parentheses.');
    }
  }
  return tokens;
}

// Card references are resolved while parsing, so numbers cannot be invented or reused.
function parseExpression(text, cards) {
  const tokens = tokenize(text);
  const used = new Set();
  let position = 0;
  let depth = 0;
  const peek = () => tokens[position]?.type;

  function consumeCard(value) {
    const matching = cards.filter(card => equal(card.value, value));
    const card = matching.find(candidate => !used.has(candidate.id));
    if (!card) {
      if (matching.length) throw new GameError(`You’ve already used ${formatValue(value)}. Each card can be used once.`);
      throw new GameError(`${formatValue(value)} isn’t on the board. Use your available cards.`);
    }
    used.add(card.id);
    return card.value;
  }

  // A displayed fractional card, e.g. (1/3), is an atomic reference. Without
  // a matching card, the same notation is an ordinary grouped division.
  function fractionReference() {
    let cursor = position + 1;
    const sign = tokens[cursor]?.type === '-' ? (cursor++, -1n) : 1n;
    if (tokens[cursor]?.type !== 'number' || tokens[cursor + 1]?.type !== '/' ||
        tokens[cursor + 2]?.type !== 'number' || tokens[cursor + 3]?.type !== ')') return null;
    const denominator = BigInt(tokens[cursor + 2].value);
    if (denominator === 0n) return null;
    const value = rational(sign * BigInt(tokens[cursor].value), denominator);
    if (value.d === 1n || !cards.some(card => equal(card.value, value))) return null;
    position = cursor + 4;
    return consumeCard(value);
  }

  function primary() {
    if (peek() === '(') {
      const fraction = fractionReference();
      if (fraction) return fraction;
      position++;
      if (++depth > 32) throw new GameError('Try using fewer nested parentheses.');
      const value = addition();
      if (peek() !== ')') throw new GameError('Close every opening parenthesis.');
      position++;
      depth--;
      return value;
    }
    // A negative literal may reference a negative result card. Unary negation
    // of an arbitrary number or group is deliberately not an extra operation.
    const sign = peek() === '-' ? (position++, -1n) : 1n;
    if (peek() !== 'number') throw new GameError('Place a card value between each pair of operations.');
    return consumeCard(rational(sign * BigInt(tokens[position++].value)));
  }

  function multiplication() {
    let value = primary();
    while (peek() === '*' || peek() === '/') {
      const operator = tokens[position++].type;
      value = calculate(value, operator, primary());
    }
    return value;
  }

  function addition() {
    let value = multiplication();
    while (peek() === '+' || peek() === '-') {
      const operator = tokens[position++].type;
      value = calculate(value, operator, multiplication());
    }
    return value;
  }

  const value = addition();
  if (position !== tokens.length) throw new GameError('Put an operation between cards and check your parentheses.');
  if (used.size < 2) throw new GameError('Combine at least two available cards.');
  return { value, used };
}

export function applyExpression(state, text) {
  if (state.status !== 'playing') throw new GameError('Solved! Your next hand is on its way.');
  const { value, used } = parseExpression(text, state.cards);
  const consumed = state.cards.filter(card => used.has(card.id));
  const result = {
    id: `result-${state.nextId}`,
    value,
    sourceIds: consumed.flatMap(card => card.sourceIds),
    expression: text.trim(),
  };
  const cards = [];
  let inserted = false;
  for (const card of state.cards) {
    if (!used.has(card.id)) cards.push(card);
    else if (!inserted) { cards.push(result); inserted = true; }
  }
  const won = cards.length === 1 && result.sourceIds.length === 4 && equal(value, rational(24));
  return { ...state, cards, status: won ? 'solved' : 'playing', nextId: state.nextId + 1 };
}
