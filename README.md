# Pep Games

### Classic board games and puzzles in your browser

Play chess against Stockfish, challenge other players in international draughts, solve Sudoku and enjoy Russian-language crosswords.

Pep Games works as a collection of independent browser games with a shared design, player accounts, profiles and offline support.

---

## Games

Pep Games currently includes four game modes:

| Game | Description |
|---|---|
| Chess | Play against Stockfish 19 or challenge another player online |
| International Draughts | 10×10 draughts against Scan 3.1 or another player online |
| Sudoku | Four difficulty levels, notes, hints and a daily puzzle |
| Crosswords | Russian-language crosswords with thousands of words, multiple themes and difficulty levels |

---

## Chess

Pep Chess provides a full browser chess experience.

### Play Against Stockfish

- Stockfish 19
- 8 engine difficulty levels
- Play as White, Black or a random color
- Preset time controls
- Custom time controls
- Increment support
- Premoves
- Move history
- Draw offers
- Resignation
- Rematches

### Online Multiplayer

Chess can also be played against another person online.

- Create online games
- Invite players with a link
- Join using a game code
- Open game lobby
- Quick opponent search
- Player nicknames
- Synchronized chess clocks
- Draw offers
- Resignation
- Rematches
- Game chat

### Chess Analysis

Finished chess games can be analyzed directly with Stockfish.

- Engine evaluation
- Multiple analysis lines
- Move-by-move navigation
- Alternative move exploration
- Board arrows
- Square highlighting
- Analysis of games opened from your profile

---

## International Draughts

Pep Draughts implements international draughts on a 10×10 board.

The game uses **Scan 3.1** as its computer opponent.

### Features

- International 10×10 rules
- Flying kings
- Majority capture rule
- Play against Scan 3.1
- Multiple engine difficulty levels
- Online multiplayer
- Invite links and game codes
- Quick opponent search
- Open game lobby
- Time controls
- Game history
- Game review
- Engine analysis of completed games

---

## Sudoku

Pep Sudoku is a complete Sudoku module that generates puzzles directly on the player's device.

### Difficulty Levels

- Easy
- Medium
- Hard
- Expert

### Features

- Sudoku of the Day
- Automatically generated puzzles
- Notes / pencil marks
- Hints
- Mistake counter
- Timer
- Pause
- Undo and redo
- Cell checking
- Puzzle checking
- Local statistics
- Offline play

The daily Sudoku gives every player a puzzle for the day while regular games can be generated at any time.

---

## Russian Crosswords

Pep Crossword is a dedicated crossword module built around **Russian-language words and clues**.

The crossword database contains more than **3,000 words with questions**.

### Crossword Options

- 21 themes
- 5 difficulty levels
- From 6 to 60 words per crossword
- Small, medium, large, huge and super-sized puzzles
- Crossword of the Day
- Random crossword generation

### Gameplay

- Russian-language clues and answers
- Across and down clues
- Word navigation
- Crossword timer
- Pause
- Check current word
- Check the entire crossword
- Reveal one letter
- Reveal a word
- View all clues
- Progress tracking
- Statistics

Crosswords are generated as a full Pep Games module rather than as a separate external service.

---

## Daily Puzzles

Pep Games includes daily puzzle modes for both Sudoku and crosswords.

### Sudoku of the Day

A daily Sudoku puzzle is available directly from the Sudoku menu.

### Crossword of the Day

A daily Russian crossword is available from the Crossword menu.

This gives Pep Games both competitive multiplayer games and puzzles that can be played alone for a few minutes at any time.

---

## User Accounts

Signing in is optional.

Players can use Google authentication to create a shared Pep Games profile.

Authenticated users can access:

- Player profile
- Chess rating
- Draughts rating
- Persistent game history
- Previous online games
- Game review
- Chess analysis from history
- Draughts game review

Local play does not require an account.

---

## Player Rating

Competitive ratings are available for **Chess and International Draughts**.

Ratings use the Elo system and are calculated separately for each game.

Each game also has separate ratings for:

| Category | Time |
|---|---|
| Bullet | Up to 3 minutes |
| Blitz | Up to 8 minutes |
| Rapid | Up to 25 minutes |
| Classical | Longer games |

A game counts as rated when both players are signed in and the match satisfies the rating requirements.

Sudoku and Crosswords use puzzle statistics instead of Elo ratings.

---

## Player Profile

The shared Pep Games profile keeps competitive game history in one place.

Players can:

- View their ratings
- View previous Chess games
- View previous Draughts games
- Open completed matches
- Replay moves
- Review results
- Analyze completed Chess games
- Review completed Draughts games

---

## Offline Play

Pep Games is designed as a Progressive Web App.

The games can be installed and supported local modes can continue to work after the required files have been cached.

| Feature | Offline |
|---|:---:|
| Chess against Stockfish | ✅ |
| Chess analysis | ✅ |
| International Draughts against Scan | ✅ |
| Sudoku | ✅ |
| Crosswords | ✅ |
| Local game history | ✅ |
| PWA | ✅ |
| Chess multiplayer | ❌ |
| Draughts multiplayer | ❌ |
| Online rating | ❌ |
| Cloud profile synchronization | ❌ |

Online multiplayer and cloud features require an internet connection.

---

## Architecture

Pep Games acts as the main hub.

Each game is implemented as its own module:

```text
pep-chess/
├── index.html
├── chess/
├── draughts/
├── sudoku/
├── crossword/
├── manifest.json
├── service-worker.js
├── icon-192.png
├── icon-512.png
└── icon-maskable-512.png
```

### Main Hub

The root application provides:

- Game selection
- Shared settings
- Google authentication
- Player profiles
- Chess and Draughts leaderboards
- Shared navigation
- PWA support

### Chess

Contains the chess interface, Stockfish integration, online multiplayer, rating and game analysis.

### Draughts

Contains international draughts, Scan 3.1 integration, online multiplayer, rating and game review.

### Sudoku

Contains puzzle generation, four difficulty levels, notes, hints, daily Sudoku and statistics.

### Crossword

Contains Russian crossword generation, the word and clue database, themes, difficulty settings, daily crosswords and statistics.

---

## Technology

| Component | Technology |
|---|---|
| Interface | HTML, CSS, JavaScript |
| Chess rules | chess.js |
| Chess engine | Stockfish 19 |
| Chess engine runtime | WebAssembly |
| Draughts engine | Scan 3.1 |
| Multiplayer | Firebase Firestore |
| Authentication | Firebase Authentication |
| Profiles and ratings | Firebase |
| Sudoku generation | Client-side JavaScript |
| Crossword generation | Client-side JavaScript |
| Offline support | Service Workers |
| Installation | PWA |

---

## Running Locally

Clone the repository and start a local HTTP server.

For example:

```bash
git clone <repository>
cd pep-chess
python -m http.server 8000
```

Then open the local server in your browser.

Game modules are available under:

```text
/chess/
/draughts/
/sudoku/
/crossword/
```

A local HTTP server is recommended because Service Workers and other PWA features are restricted when files are opened directly through `file://`.

---

## Project Status

| Component | Status |
|---|:---:|
| Pep Games Hub | ✅ Ready |
| Chess | ✅ Ready |
| International Draughts | ✅ Ready |
| Sudoku | ✅ Ready |
| Russian Crosswords | ✅ Ready |
| Stockfish gameplay | ✅ Ready |
| Scan gameplay | ✅ Ready |
| Chess multiplayer | ✅ Ready |
| Draughts multiplayer | ✅ Ready |
| User accounts | ✅ Ready |
| Player profiles | ✅ Ready |
| Chess rating | ✅ Ready |
| Draughts rating | ✅ Ready |
| Game history | ✅ Ready |
| Chess analysis | ✅ Ready |
| Draughts review | ✅ Ready |
| Sudoku of the Day | ✅ Ready |
| Crossword of the Day | ✅ Ready |
| PWA | ✅ Ready |
| Offline play | ✅ Ready |

---

## Built With

Pep Games uses open-source software including:

- chess.js
- Stockfish
- Stockfish.js
- Scan
- Firebase

Third-party components remain subject to their respective licenses.

---

## License

Pep Games does not currently include a separate project license.

Third-party components remain subject to their respective licenses.

---

# Pep Games

**Chess. Draughts. Sudoku. Crosswords. Play, compete and solve.**
