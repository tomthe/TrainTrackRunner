# Using This Project With Other LLMs

This project is a static browser game. There is no build step.

## Project shape

- `index.html` loads the UI shell and starts `game.js` as an ES module.
- `styles.css` handles the HUD, overlay, and responsive layout.
- `game.js` contains all gameplay, rendering, input, spawning, and scoring logic.

## Important implementation detail

Three.js is loaded as an ES module inside `game.js`:

```js
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.min.js";
```

If another LLM edits this project, it should keep that module-based setup. Do not switch back to `three.core.min.js` or to code that expects a global `THREE` variable.

## How another LLM should work on it

1. Read `index.html`, `styles.css`, and `game.js` first.
2. Preserve the no-build static setup unless a change explicitly requires tooling.
3. Serve the folder over HTTP for testing instead of opening the file directly.
4. Check the browser console after changes and fix runtime errors, not just syntax errors.

## Current gameplay expectations

- Desktop mode uses one shared line with 4 tracks for both players.
- Touch mode uses a single runner with swipe controls.
- Players can jump onto train roofs and run along them.
- Power-ups currently include `Jet-Pack` and `Magnet`.