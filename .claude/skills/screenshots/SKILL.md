---
name: screenshots
description: Take or retake the variant screenshots in assets/images (shown on the home page and in the README). Use when adding a new variant, when the board or page design changes, or when asked to update the screenshots.
---

# Variant screenshots

Each variant has one screenshot in `assets/images/`, named in its `screenshot` field in `js/variants.js`. The home page shows it beside the rules, and the README shows it under the variant's heading. Chess960 has its own, `chess-960.webp`.

They're all made the same way by `scripts/screenshots.js`, so they match:

- just the board, at its full 480px width, with 24px around it for its shadow
- a transparent background, so they suit light and dark pages (the README on GitHub, the home page in either theme)
- 2× pixel density (about 1046px square)
- WebP at quality 0.85, about 40 KB each. Not JPEG (no transparency) and not PNG (four times the size). Playwright only saves PNG, so the script has the browser re-encode it.
- white to move, with one white piece selected so its moves show what makes the variant different
- the last move highlighted, as in a real game

## Taking them

```sh
npm run screenshots            # all of them
npm run screenshots -- risky   # only the files whose name contains "risky"
```

The script starts its own server on port 3848, opens a bot game for each shot, sets up the position through `window.engine` and `window.ui` (exposed on localhost only, see `game.html`), clicks the piece to select it, and saves the board. It doesn't need Firebase or `.env`.

## Adding a shot for a new variant

1. Make sure the variant has a `screenshot` path in `js/variants.js`, e.g. `assets/images/mirror-chess.webp`.
2. Add an entry to `SHOTS` in `scripts/screenshots.js`, with a comment saying what it shows:

   ```js
   {
     file: "mirror-chess.webp",
     variant: "mirror", // a variant key, as in game.html#bot:<key>:white
     // The knight jumps to the mirrored square
     moves: ["e2e4", "e7e5", "g1f3", "b8c6"], // from–to pairs, white first
     select: "f3", // the white piece to select
   },
   ```

   For a position you can't reach by normal moves (like a promoted piece), give `pieces` instead of `moves`. Start from `startingPieces()` and change it; see the Superchess shot.

3. Pick a position that shows the variant's rule as clearly as possible:
   - Select a piece whose highlighted moves show the rule: capture rings on the squares that are only possible in this variant, dots where it can go.
   - Keep it to a few moves from the start, so the board is easy to read.
   - The moves must end with white to move (an even number of moves). The script stops with an error if a move is illegal in that variant or it's black's turn.

4. Run `npm run screenshots -- <name>`.

## Checking them

Look at every image you took (open it with the Read tool) before calling it done. Check that:

- the board shows the position you meant, with the right piece selected (yellow square)
- the move dots and capture rings show the variant's rule
- the last move is highlighted (in Dark Chess the opponent's last move stays hidden; that's correct)
- the corners are rounded and the background is transparent, with a soft shadow

If the board or page design changes, retake all of them so they stay alike.
