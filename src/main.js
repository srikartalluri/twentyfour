import './styles.css';
import { formatValue, GameError } from './game.js';
import { createGameController } from './controller.js';
import { initTheme } from './theme.js';

const cleanupTheme = initTheme();

const board = document.querySelector('#board');
const input = document.querySelector('#expression');
const inputShell = document.querySelector('#input-shell');
const submitButton = document.querySelector('#submit-expression');
const feedback = document.querySelector('#feedback');

function setFeedback(message, type = 'neutral') {
  feedback.textContent = message;
  feedback.dataset.type = type;
  inputShell.classList.toggle('has-error', type === 'error');
  input.setAttribute('aria-invalid', String(type === 'error'));
}

function render(state, event = { type: 'initial' }) {
  const solved = state.status === 'solved';
  const fragment = document.createDocumentFragment();
  state.cards.forEach(card => {
    const element = document.createElement('li');
    element.className = `number-card${card.expression ? ' is-result' : ''}${solved ? ' is-solved' : ''}`;
    element.dataset.cardId = card.id;
    const formatted = formatValue(card.value);
    element.setAttribute('aria-label', `${formatted}${card.expression ? ', combined result' : ''}`);

    const corner = document.createElement('span');
    corner.className = 'card-corner';
    corner.textContent = card.expression ? '↳' : '✳';
    corner.setAttribute('aria-hidden', 'true');

    const value = document.createElement('span');
    value.className = `card-value${formatted.length > 4 ? ' is-long' : ''}${formatted.length > 8 ? ' is-extra-long' : ''}`;
    value.textContent = formatted;

    const caption = document.createElement('span');
    caption.className = 'card-caption';
    caption.textContent = solved ? 'NICELY DONE' : card.expression ? 'COMBINED' : 'MAKE IT COUNT';
    element.append(corner, value, caption);
    fragment.append(element);
  });
  board.replaceChildren(fragment);
  board.classList.toggle('is-solved', solved);
  input.readOnly = solved;
  submitButton.disabled = solved;
  submitButton.innerHTML = solved ? 'Solved! <span aria-hidden="true">✓</span>' : 'Combine <span aria-hidden="true">↵</span>';
  input.value = '';
  input.placeholder = state.cards.length >= 2
    ? `e.g. ${formatValue(state.cards[0].value)} + ${formatValue(state.cards[1].value)}`
    : 'A fresh start is one tap away';

  if (solved) setFeedback('Solved! A fresh hand is on its way…', 'success');
  else if (state.cards.length === 1) setFeedback('Not quite 24. Reset to try another path, or start a new turn.');
  else if (event.type === 'reset') setFeedback('Back to your original four. Try a different path.');
  else if (event.type === 'auto-turn') setFeedback('Nicely done. Here are four new possibilities.', 'success');
  else if (event.type === 'new-turn') setFeedback('Four new numbers. A fresh possibility.');
  else if (event.type === 'submit') setFeedback('Keep going. Use your new result just like any other card.');
  else setFeedback('Start anywhere. Combine two cards, or solve it all at once.');
}

const game = createGameController({ onChange: render });
render(game.state);

document.querySelector('#expression-form').addEventListener('submit', event => {
  event.preventDefault();
  if (input.readOnly) return;
  try {
    game.submit(input.value);
  } catch (error) {
    if (!(error instanceof GameError)) throw error;
    setFeedback(error.message, 'error');
  }
  input.focus({ preventScroll: true });
});

document.querySelector('#reset-board').addEventListener('click', () => {
  game.reset();
  input.focus({ preventScroll: true });
});

document.querySelector('#new-turn').addEventListener('click', () => {
  game.newTurn();
  input.focus({ preventScroll: true });
});

input.addEventListener('input', () => {
  if (input.getAttribute('aria-invalid') === 'true') {
    setFeedback('Use the values currently on your cards.');
  }
});

// Hot reload should never leave an old controller's automatic deal running.
if (import.meta.hot) import.meta.hot.dispose(() => {
  game.destroy();
  cleanupTheme();
});
