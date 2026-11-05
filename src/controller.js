import { applyExpression, createTurn, resetTurn } from './game.js';

// Own the pending deal in one place. Clearing AND invalidating it prevents
// stale callbacks from replacing a manually reset or newly dealt hand.
export function createGameController({
  onChange = () => {},
  makeTurn = createTurn,
  schedule = setTimeout,
  cancel = clearTimeout,
} = {}) {
  let state = makeTurn();
  let pending = null;
  let generation = 0;

  function cancelDeal() {
    generation++;
    if (pending !== null) cancel(pending);
    pending = null;
  }

  function newTurn(automatic = false) {
    cancelDeal();
    state = makeTurn();
    onChange(state, { type: automatic ? 'auto-turn' : 'new-turn' });
    return state;
  }

  return {
    get state() { return state; },
    submit(text) {
      if (state.status === 'solved') return state;
      state = applyExpression(state, text);
      if (state.status === 'solved') {
        const scheduledGeneration = generation;
        pending = schedule(() => {
          if (scheduledGeneration !== generation) return;
          newTurn(true);
        }, 800);
      }
      onChange(state, { type: 'submit', expression: text.trim() });
      return state;
    },
    reset() {
      cancelDeal();
      state = resetTurn(state);
      onChange(state, { type: 'reset' });
      return state;
    },
    newTurn,
    destroy: cancelDeal,
  };
}
