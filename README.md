# Pep Games

### Browser chess and draughts

Play chess against Stockfish, challenge other players online, play draughts, track your rating, review your games and analyze chess positions directly in the browser.

![Stockfish](https://img.shields.io/badge/Chess%20Engine-Stockfish%2019-4B7399?style=flat-square)
![Chess](https://img.shields.io/badge/Game-Chess-success?style=flat-square)
![Draughts](https://img.shields.io/badge/Game-Draughts-success?style=flat-square)
![Multiplayer](https://img.shields.io/badge/Online%20Multiplayer-Ready-success?style=flat-square)
![Profiles](https://img.shields.io/badge/User%20Profiles-Ready-success?style=flat-square)
![Rating](https://img.shields.io/badge/Player%20Rating-Ready-success?style=flat-square)
![PWA](https://img.shields.io/badge/PWA-Ready-success?style=flat-square)

---

## About

**Pep Games** is a lightweight browser board game application with support for chess and draughts.

Chess can be played against Stockfish or another player online. The app also includes Stockfish analysis, configurable time controls, game history and board tools.

Draughts, also known as checkers, has its own game mode and supports online multiplayer.

Authenticated users also get a player profile with a rating and persistent game history.

Local play does not require an account.

---

## Play

### Chess

Play chess directly in your browser.

- Play against Stockfish
- 8 engine difficulty levels
- Play as White, Black or a random color
- Online multiplayer
- Invite links
- Game codes
- Chess clocks
- Preset time controls
- Custom time controls
- Increment support
- Premoves
- Move history
- Draw offers
- Resignation
- Rematches
- Stockfish analysis
- Board annotations

### Draughts / Checkers

Pep Games also includes a separate draughts game mode.

- Play draughts in the browser
- Online multiplayer
- Create games
- Invite another player
- Join online games
- Synchronized moves
- Play without installing a separate application

Play draughts here:

https://pepdominator.github.io/pep-chess/draughts/

---

## Online Multiplayer

Both **chess and draughts support online multiplayer**.

Create a game and invite another player to join.

Online play supports:

- Game creation
- Invite links
- Game codes
- Player synchronization
- Synchronized moves
- Game state synchronization
- Resignation
- Game completion
- Player profiles
- Rating for authenticated users
- Saved game history

Online synchronization uses **Firebase Firestore**.

An internet connection is required for multiplayer games.

---

## User Accounts and Rating

Creating an account is optional, but authenticated users get additional features.

### Player Rating

Authenticated players have a rating connected to their profile.

This makes it possible to track online performance over time rather than treating every game as an isolated match.

### Player Profile

The profile keeps your playing history in one place.

Authenticated users can:

- View their current rating
- See previous games
- Open games from their history
- Review completed matches
- Return to previous chess positions
- Open chess games for Stockfish analysis

Local games can still be played without signing in.

---

## Game History

Game history is available directly inside Pep Games.

For authenticated users, previous games are also available from the player profile.

You can open a completed game, replay its moves and review the result.

Chess games can be opened directly in Stockfish analysis mode, making it easy to revisit mistakes, explore different moves and check alternative positions.

---

## Chess Engine

Chess mode uses **Stockfish.js 19** compiled to WebAssembly.

Stockfish runs directly inside the browser and handles:

- Computer moves
- Position evaluation
- Chess analysis
- Principal variations

Pep Games includes 8 Stockfish difficulty levels.

| Level | Stockfish Skill |
|:---:|:---:|
| 1 | 0 |
| 2 | 3 |
| 3 | 6 |
| 4 | 9 |
| 5 | 12 |
| 6 | 15 |
| 7 | 18 |
| 8 | 20 |

---

## Chess Analysis

Chess games and positions can be analyzed with Stockfish directly inside the application.

You can:

- See the engine evaluation
- View multiple Stockfish lines
- Navigate move by move
- Explore alternative moves
- Return to earlier positions
- Continue analysis from any position
- Draw arrows on the board
- Highlight squares
- Open completed games from your profile for analysis

---

## Chess Time Controls

Chess mode includes several ready-to-use time controls:

| Time | Increment |
|---:|---:|
| 1 min | 0 sec |
| 2 min | 1 sec |
| 3 min | 0 sec |
| 3 min | 2 sec |
| 5 min | 0 sec |
| 5 min | 3 sec |
| 10 min | 0 sec |
| 10 min | 5 sec |
| 15 min | 10 sec |
| 30 min | 0 sec |
| 30 min | 20 sec |

You can also create a custom time control with your own base time and increment.

---

## Chess Board Tools

Chess mode includes tools for exploring and marking positions directly on the board.

- Premoves
- Colored arrows
- Square highlighting
- Last-move highlighting
- Check indication
- Automatic board orientation based on your side

Board annotations can also be used during position analysis.

---

## PWA and Offline Play

Pep Games can be installed as a Progressive Web App.

The application uses a Service Worker to cache files required for local play.

After the required files have been cached, supported local features can work without an internet connection.

| Feature | Offline |
|---|:---:|
| Chess against Stockfish | ✅ |
| Chess clocks | ✅ |
| Chess analysis | ✅ |
| Local game history | ✅ |
| Board annotations | ✅ |
| PWA | ✅ |
| Chess multiplayer | ❌ |
| Draughts multiplayer | ❌ |
| Online rating | ❌ |
| Profile synchronization | ❌ |

Online features require an internet connection.

---

## Online Architecture

Pep Games uses **Firebase Firestore** for online synchronization.

The online system handles:

- Game creation
- Joining games
- Player information
- Move synchronization
- Game state
- Game completion
- User profiles
- Player ratings
- Persistent online game history

Both chess and draughts use the browser application for game logic and Firebase for synchronization between players.

---

## Tech Stack

| Component | Technology |
|---|---|
| Chess rules and move generation | chess.js |
| Chess engine | Stockfish.js 19 |
| Engine runtime | WebAssembly |
| Draughts game | JavaScript |
| Interface | HTML, CSS, JavaScript |
| Online multiplayer | Firebase Firestore |
| User profiles and rating | Firebase |
| Offline support | Service Worker |
| Installation | PWA |

---

## Running Locally

Clone the repository:

```bash
git clone https://github.com/PepDominator/pep-chess.git
cd pep-chess
```

Start a local HTTP server.

For example, with Python:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

Chess:

```text
http://localhost:8000/
```

Draughts:

```text
http://localhost:8000/draughts/
```

Using a local HTTP server is recommended because Service Workers and PWA functionality are restricted when the application is opened directly through `file://`.

---

## Project Structure

```text
pep-chess/
├── index.html
├── draughts/
│   └── ...
├── manifest.json
├── service-worker.js
├── icon-192.png
├── icon-512.png
└── icon-maskable-512.png
```

### `index.html`

Contains the main chess application, interface, chess logic integration, Stockfish integration and chess multiplayer client.

### `draughts/`

Contains the draughts game mode and its online multiplayer logic.

### `manifest.json`

Defines Pep Games as an installable Progressive Web App.

### `service-worker.js`

Caches application files for offline local play.

---

## Project Status

| Component | Status |
|---|:---:|
| Chess | ✅ Ready |
| Draughts / Checkers | ✅ Ready |
| Stockfish gameplay | ✅ Ready |
| Chess multiplayer | ✅ Ready |
| Draughts multiplayer | ✅ Ready |
| User accounts | ✅ Ready |
| Player profiles | ✅ Ready |
| Player rating | ✅ Ready |
| Profile game history | ✅ Ready |
| Chess analysis | ✅ Ready |
| Chess clocks | ✅ Ready |
| Premoves | ✅ Ready |
| Board annotations | ✅ Ready |
| PWA | ✅ Ready |
| Offline play | ✅ Ready |

---

## Built With

Pep Games uses open-source software including:

- [chess.js](https://github.com/jhlywa/chess.js)
- [Stockfish](https://stockfishchess.org/)
- [Stockfish.js](https://github.com/nmrugg/stockfish.js)
- [Firebase](https://firebase.google.com/)

Third-party components remain subject to their respective licenses.

---

## License

Pep Games does not currently include a separate project license.

Third-party components remain subject to their respective licenses.

---

# Pep Games

**Chess. Draughts. Rating. History. Analysis. Online or offline.**
