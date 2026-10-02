# ♟ Pep Chess

### Browser chess powered by Stockfish

Play against Stockfish, challenge another player online, analyze your games, review your history and install the app for offline play.

![Stockfish](https://img.shields.io/badge/Engine-Stockfish%2019-4B7399?style=flat-square)
![PWA](https://img.shields.io/badge/PWA-Ready-success?style=flat-square)
![Offline](https://img.shields.io/badge/Offline-Ready-success?style=flat-square)
![Multiplayer](https://img.shields.io/badge/Online%20Multiplayer-Ready-success?style=flat-square)

---

## About

**Pep Chess** is a lightweight browser chess application built around Stockfish.

You can play against the engine directly on your device, challenge another player online, analyze positions and review previous games.

Stockfish runs in the browser through WebAssembly, so local games and analysis do not require a chess server.

No account is required for local play.

---

## Features

### Play Against Stockfish

- Stockfish.js 19
- 8 difficulty levels
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

Play against another person directly from Pep Chess.

- Create an online game
- Invite another player with a link
- Join using a game code
- Player nicknames
- Synchronized moves
- Chess clocks
- Draw offers
- Resignation
- Online game history
- Rematches

Online game synchronization is handled through Firebase Firestore.

An internet connection is required for multiplayer games.

### Game Analysis

Analyze games and positions with Stockfish without leaving the app.

- Engine evaluation
- Multiple Stockfish lines
- Move-by-move navigation
- Explore alternative moves
- Return to earlier positions
- Continue analysis from any position
- Board arrows
- Square highlighting

### Game History

Completed games are stored locally in your browser.

You can reopen previous games, replay the moves and analyze the position afterward.

No account is required.

### PWA and Offline Play

Pep Chess can be installed as a Progressive Web App.

After the required files and chess engine have been cached, local games against Stockfish can be played without an internet connection.

---

## Chess Engine

Pep Chess uses **Stockfish.js 19** compiled to WebAssembly.

The engine runs directly inside the browser and handles:

- computer moves
- position evaluation
- game analysis
- principal variations

Pep Chess has 8 engine difficulty levels.

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

## Time Controls

Pep Chess includes several ready-to-use time controls:

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

## Board Tools

Pep Chess includes tools for exploring and marking positions directly on the board.

- Premoves
- Colored arrows
- Square highlighting
- Last-move highlighting
- Check indication
- Automatic board orientation based on your side

Board annotations can be used during position analysis.

---

## Online Architecture

Online multiplayer uses **Firebase Firestore** to synchronize game state between players.

The online mode handles:

- game creation
- joining games
- move synchronization
- player information
- chess clocks
- draw offers
- resignation
- game state
- game history

The chess rules themselves are still handled locally by the application.

---

## Offline Support

Pep Chess uses a Service Worker to cache the files required for local play.

| Feature | Offline |
|---|:---:|
| Play against Stockfish | ✅ |
| Chess clock | ✅ |
| Game analysis | ✅ |
| Game history | ✅ |
| Board annotations | ✅ |
| PWA | ✅ |
| Online multiplayer | ✅ |

Online multiplayer requires an internet connection.

---

## Tech Stack

| Component | Technology |
|---|---|
| Chess rules and move generation | chess.js |
| Chess engine | Stockfish.js 19 |
| Engine runtime | WebAssembly |
| Interface | HTML, CSS, JavaScript |
| Online multiplayer | Firebase Firestore |
| Offline support | Service Worker |
| Installation | PWA |

Pep Chess keeps most of the application inside a single `index.html` file, including the interface, chess integration, Stockfish integration and multiplayer client.

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

Using a local HTTP server is recommended because Service Workers and PWA functionality are restricted when the application is opened directly through `file://`.

---

## Project Structure

```text
pep-chess/
├── index.html
├── manifest.json
├── service-worker.js
├── icon-192.png
├── icon-512.png
└── icon-maskable-512.png
```

### `index.html`

Contains the main application, interface, chess logic integration, Stockfish engine integration and online multiplayer client.

### `manifest.json`

Defines Pep Chess as an installable Progressive Web App.

### `service-worker.js`

Caches application files for offline local play.

---

## Project Status

| Component | Status |
|---|:---:|
| Stockfish gameplay | ✅ Ready |
| Online multiplayer | ✅ Ready |
| Chess clocks | ✅ Ready |
| Game analysis | ✅ Ready |
| Game history | ✅ Ready |
| Premoves | ✅ Ready |
| Board annotations | ✅ Ready |
| PWA | ✅ Ready |
| Offline play | ✅ Ready |

---

## Built With

Pep Chess uses open-source software including:

- [chess.js](https://github.com/jhlywa/chess.js)
- [Stockfish](https://stockfishchess.org/)
- [Stockfish.js](https://github.com/nmrugg/stockfish.js)
- [Firebase](https://firebase.google.com/)

Third-party components remain subject to their respective licenses.

---

## License

Pep Chess does not currently include a separate project license.

Third-party components remain subject to their respective licenses.

---

# ♙ Pep Chess

**Play locally. Play online. Analyze. Improve.**
