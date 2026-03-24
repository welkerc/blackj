# Card Games

> **Built with [OpenCode](https://opencode.ai)** — Vibecoded with AI assistance.

A collection of browser-based card and dice games with a dark theme.

## Games

### Blackjack
A classic casino card game with betting and strategy.

**Play:** [https://welkerc.github.io/CardGames/blackjack/](https://welkerc.github.io/CardGames/blackjack/)

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

### Clear the Deck
A fast-paced card game where you race to play all your cards.

**Play:** [https://welkerc.github.io/CardGames/cleardeck/](https://welkerc.github.io/CardGames/cleardeck/)

**Features:**
- Solo or vs AI opponents
- Full game rules with face-down/face-up cards
- Clear the Deck mechanic (4+ same value)
- Wild tens (clear deck, but 25 points if held)
- Multi-round scoring
- Lowest score wins

**Rules:**
- Play cards matching or lower than previous play
- 4+ of same value clears the deck
- Higher value = take the pile
- Tens are wild (25 points if held at end)

---

### Klondike
Classic single-player solitaire with Draw 1 or Draw 3 modes.

**Play:** [https://welkerc.github.io/CardGames/klondike/](https://welkerc.github.io/CardGames/klondike/)

**Features:**
- Draw 1 or Draw 3 mode selection
- Click-to-move or drag cards between piles
- Double-click to auto-move to foundation
- Undo support (up to 50 moves)
- Hint system highlights valid moves
- Move counter and games won tracking

**Rules:**
- Build foundations Ace to King by suit
- Build tableau down in alternating colors
- Only Kings can fill empty columns
- Draw 1 is easier, Draw 3 is more challenging

---

### War
A simple card game of luck vs the dealer.

**Play:** [https://welkerc.github.io/CardGames/war/](https://welkerc.github.io/CardGames/war/)

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

### Zilch
A push-your-luck dice game where you bank points or risk zilching!

**Play:** [https://welkerc.github.io/CardGames/zilch/](https://welkerc.github.io/CardGames/zilch/)

**Features:**
- Roll 6 dice and select scoring combinations
- Bank points or roll for more
- Zilch = lose all turn points!
- Score all 6 dice = roll again
- High score tracking with localStorage

**Rules:**
- 1 = 100 points, 5 = 50 points
- Three of a kind = Number × 100
- Three 1s = 1000, Three pairs = 1000, Straight = 1000
- First to 10,000 wins!

---

## Play Locally

Open any game folder in a browser:
- `docs/blackjack/index.html`
- `docs/cleardeck/index.html`
- `docs/klondike/index.html`
- `docs/war/index.html`
- `docs/zilch/index.html`

## GitHub Pages

This repo is configured for GitHub Pages hosting.

1. Push to GitHub
2. Go to Repository Settings → Pages
3. Source: Deploy from a branch → `main` / `docs` folder
4. Access games at:
   - `https://welkerc.github.io/CardGames/blackjack/`
   - `https://welkerc.github.io/CardGames/cleardeck/`
   - `https://welkerc.github.io/CardGames/klondike/`
   - `https://welkerc.github.io/CardGames/war/`
   - `https://welkerc.github.io/CardGames/zilch/`

## Tech Stack

- Vanilla JavaScript (no frameworks)
- HTML5 / CSS3
- localStorage for persistence

## License

MIT
