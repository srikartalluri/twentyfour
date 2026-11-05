# twentyfour

A small, responsive arithmetic game built with vanilla JavaScript, HTML, CSS, and Vite. No runtime dependencies, accounts, or backend.

## Run locally

```sh
npm install
npm run dev
```

Open the Local URL printed in your terminal.

```sh
npm test          # Arithmetic, card accounting, and automatic-turn tests
npm run build    # Production files in dist/
npm run preview  # Preview the production build
```

Vite requires Node.js 20.19+ or 22.12+. Use a current supported Node.js LTS release.

## Play

Each turn draws four random numbers from 1–13. Repeats and unsolvable hands are possible.

Type an expression and press Enter or Combine. Use `+`, `-`, `x`, `X`, `*`, `/`, and parentheses. Each expression combines at least two available cards, with each card used once. For example, `3+4` replaces the 3 and 4 cards with a 7. You can also solve the whole hand at once.

Fraction cards are exact: a card displayed as `(1/3)` can be used by typing `(1/3)`. Parenthesized fractions matching an available fraction card refer to that single card; unparenthesized division uses separate cards. Negative cards are typed as displayed, such as `-2`. Arbitrary unary negation, decimal literals, powers, and implicit multiplication are not supported.

Combine all four original cards into one 24 to win. The game shows the result for 800 ms, then automatically deals the next hand. Reset board restores the current turn’s initial cards; New turn immediately deals another hand. Either action cancels a pending automatic deal.

## Structure

- `src/game.js`: pure card accounting, expression parser, and exact BigInt rational arithmetic.
- `src/controller.js`: turn transitions and cancellable automatic dealing.
- `src/main.js` and `src/styles.css`: accessible DOM interface and responsive styling.
- `test/`: built-in Node.js tests; no additional test dependencies.

All state stays in memory. Refreshing starts a new turn.
