# Card Games

> **Built with [OpenCode](https://opencode.ai)** — Vibecoded with AI assistance.

A collection of browser-based card games with a dark theme.

## Games

### Blackjack
A classic casino card game with betting and strategy.

**Play:** [https://welkerc.github.io/blackj/blackjack/](https://welkerc.github.io/blackj/blackjack/)

**Features:**
- Full 52-card deck
- Ace handling (11 or 1 automatically)
- Hit / Stand / Double Down / Split
- Dealer AI (hits until 17+)
- Blackjack detection (21 on first 2 cards)
- Bankroll tracking with localStorage persistence
- Session statistics

**Rules:**
- Starting bankroll: $1,000
- Bet range: $1 - $100
- Blackjack pays 3:2

---

### War
A simple card game of luck vs the dealer.

**Play:** [https://welkerc.github.io/blackj/war/](https://welkerc.github.io/blackj/war/)

**Features:**
- Full 52-card deck
- War mechanic when cards tie
- Multiple wars possible
- Session statistics
- localStorage persistence

**Rules:**
- Higher card wins both
- Ties trigger war (3 face-down + 1 face-up)
- Game ends when one player has all cards

---

## Play Locally

Open any game folder in a browser:
- `blackjack/index.html`
- `war/index.html`

## GitHub Pages

This repo is configured for GitHub Pages hosting.

1. Push to GitHub
2. Go to Repository Settings → Pages
3. Source: Deploy from a branch → `main` / `docs` folder
4. Access games at:
   - `https://yourusername.github.io/blackj/blackjack/`
   - `https://yourusername.github.io/blackj/war/`

## Tech Stack

- Vanilla JavaScript (no frameworks)
- HTML5 / CSS3
- localStorage for persistence

## License

MIT
