# Gobble Dash

[![Make.fun competition](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/c/turkey-run-game-01)
[![Rank](https://make.fun/badge/turkey-run-game-01/sriwedari577/best-turkey-escape-game/rank.svg)](https://make.fun/c/turkey-run-game-01)
[![Reward](https://make.fun/badge/turkey-run-game-01/sriwedari577/best-turkey-escape-game/reward.svg)](https://make.fun/c/turkey-run-game-01)

Gobble Dash is a turkey escape game for the [Make.fun turkey escape game competition](https://make.fun/c/turkey-run-game-01). Tom the turkey runs from the farmyard, through the barn, past the kitchen ovens, and out the gate to freedom — chased by Farmer Jed, dodging thrown carving knives and flaring ovens, hiding in hay bales, and grabbing corn on the way.

## How to play

Open `game/index.html` in a desktop browser (no network needed, no build step), or run `node serve.ts` and open http://localhost:8080.

- Move: Arrow keys / A D, or steer with the mouse
- Jump: Space / W / Up, or click
- Hide in a hay bale: Down / S (hold still while Farmer Jed searches)
- Pause: P · Sound: M

Score comes from distance, corn (+25), and fences jumped (+10). Three lives. Escape through the FREEDOM gate, or get caught for dinner — either way, run again from the end screen.

## Layout

- `main.ts` — hands the game in: copies `game/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored Make.fun library.
- `game/` — the playable game as static files (plain JavaScript, no libraries).
- `screenshots/` — real renders of the game's own code: title, kitchen play, the barn hide-and-search, and the escaped end screen at the freedom gate.
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged.
