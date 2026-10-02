# ♟ Pep Chess

### Browser chess powered by Stockfish

Play against Stockfish, analyze your games, review your history and install the app for offline play.

> [!NOTE]
> Pep Chess is built as a lightweight browser application. The chess engine runs directly on your device through WebAssembly.

---

## ✨ Features

### ♟ Play Against Stockfish

- Stockfish.js 19
- 8 difficulty levels
- Play as White, Black or a random color
- Preset time controls
- Custom time controls
- Increment support
- Premoves
- Move history
- Draw offers
- Resignation and rematches

### 🔎 Game Analysis

Analyze positions without leaving the app.

- Live engine evaluation
- Multiple Stockfish lines
- Move-by-move navigation
- Explore alternative moves
- Continue from previous positions
- Board arrows and square highlights

### 📚 Game History

Completed games are saved locally in your browser.

You can open previous games, replay the moves and analyze the final result.

No account is required.

### 📱 PWA and Offline Play

Pep Chess can be installed as a Progressive Web App.

After the application has been loaded and cached, you can play against Stockfish even without an internet connection.

---

## 🌐 Online Multiplayer

> [!WARNING]
> **Online multiplayer is currently a work in progress.**
>
> It is experimental and may contain bugs, synchronization issues or incomplete behavior.

The current multiplayer implementation allows two players to create and join a game through an invite link or game code.

Online synchronization is handled through Firebase Firestore.

Current multiplayer work includes:

- game creation through invite links
- joining by link or game code
- player nicknames
- synchronized moves
- chess clocks
- draw offers
- resignations
- online game history

The online mode is still under development and should not yet be considered stable.

---

## 🤖 Chess Engine

Pep Chess uses **Stockfish.js 19** compiled to WebAssembly.

The engine runs directly inside the browser and is used for:

- computer moves
- position evaluation
- post-game analysis
- principal variations

The playing strength can be adjusted across 8 difficulty levels.

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

## ⏱ Time Controls

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

## 🖍 Board Tools

Pep Chess includes simple tools for exploring positions directly on the board.

- Premoves
- Colored arrows
- Square highlighting
- Last-move highlighting
- Check indication
- Board orientation based on your side

Board annotations support multiple colors, making them useful during analysis.

---

## 💾 Offline Support

The application uses a Service Worker to cache the files needed for local play.

| Feature | Offline |
|---|:---:|
| Play against Stockfish | ✅ |
| Chess clock | ✅ |
| Game analysis | ✅ |
| Game history | ✅ |
| Board annotations | ✅ |
| PWA | ✅ |
| Online multiplayer | ❌ |

Online multiplayer requires an internet connection.

---

## 🛠 Tech Stack

| Component | Technology |
|---|---|
| Chess rules and move generation | chess.js |
| Chess engine | Stockfish.js 19 |
| Engine runtime | WebAssembly |
| Interface | HTML, CSS, JavaScript |
| Online multiplayer | Firebase Firestore |
| Offline support | Service Worker |
| Installation | PWA |

The project intentionally keeps most of the application inside a single `index.html` file, including the chess logic integration, interface and embedded Stockfish engine.

---

## 🚀 Running Locally

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

Using an HTTP server is recommended because Service Workers and PWA functionality are restricted when the application is opened directly through `file://`.

---

## 📁 Project Structure

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

Contains the main application, user interface, chess logic integration, Stockfish engine and online game client.

### `manifest.json`

Defines Pep Chess as an installable Progressive Web App.

### `service-worker.js`

Caches the application files so local games can continue to work offline.

---

## 🚧 Project Status

| Component | Status |
|---|:---:|
| Stockfish gameplay | ✅ Ready |
| Chess clocks | ✅ Ready |
| Game analysis | ✅ Ready |
| Game history | ✅ Ready |
| Premoves | ✅ Ready |
| Board annotations | ✅ Ready |
| PWA | ✅ Ready |
| Offline play | ✅ Ready |
| Online multiplayer | 🚧 WIP |

The main focus right now is improving and stabilizing online multiplayer.

---

## 🧩 Built With

Pep Chess uses open-source software including:

- **chess.js** for chess rules and move validation
- **Stockfish** for the chess engine
- **Stockfish.js** for running Stockfish in the browser

Stockfish.js 19 is distributed under the GPLv3 license. chess.js includes its respective BSD license notice in the project source.

---

## 📜 License

Pep Chess does not currently include a separate project license.

Third-party components remain subject to their respective licenses.

---

## ♙ Pep Chess

**Play. Analyze. Improve.**
