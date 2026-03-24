# Blackjack

> **Built with [OpenCode](https://opencode.ai)** — Vibecoded with AI assistance.

A browser-based Blackjack game with a dark theme.

## Features

- Full 52-card deck
- Ace handling (11 or 1 automatically)
- Hit / Stand
- Double Down
- Split (when dealt pairs)
- Dealer AI (hits until 17+)
- Blackjack detection (21 on first 2 cards)
- Bankroll tracking with localStorage persistence
- Session statistics

## Rules

- Starting bankroll: $1,000
- Bet range: $1 - $100
- Blackjack pays 3:2
- Dealer stands on 17+
- Double down on 9, 10, or 11 with 2 cards
- Split any pair with matching value

## Play Locally

Simply open `docs/index.html` in any modern browser.

## GitHub Pages

This game is configured for GitHub Pages hosting.

1. Push to GitHub
2. Go to Repository Settings → Pages
3. Source: Deploy from a branch → `main` / `docs` folder
4. Your game will be live at: `https://yourusername.github.io/blackj/`

## Tech Stack

- Vanilla JavaScript (no frameworks)
- HTML5 / CSS3
- localStorage for persistence

## License

MIT
