// Takes the variant pictures in assets/images, from the real board so they match
// the game exactly:
//
// - a screenshot per variant: the whole board, set up to show off what makes the
//   variant different, on a transparent background so it suits light and dark
//   pages alike
// - an icon per variant (assets/images/icons): a 3×3 corner of a board showing
//   one move, for the list of variants on the home page
//
//   npm run screenshots              # all of them
//   npm run screenshots -- risky     # just the ones whose file name contains "risky"
//   npm run screenshots -- icons     # just the icons
//
// Each shot opens a bot game on a local server, sets up a position on the engine
// (window.engine and window.ui are exposed on localhost), selects a piece so its
// moves show, and captures the board. No Firebase config is needed.

import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";

import { chromium } from "@playwright/test";

const PORT = 3848;
const BASE = `http://localhost:${PORT}`;

// The board is drawn at its full 480px width, with room around it for its shadow
const VIEWPORT = { width: 900, height: 900 };
const MARGIN = 24;
const SCALE = 2;
const WEBP_QUALITY = 0.85;

// Icons are shown at about a third of their size, so they hide the coordinates
// and draw the capture rings and move dots heavier to stay readable
const ICON_STYLE = `
  .coord { display: none; }
  .square.legal-capture::after { border-width: 7px; }
  .square.legal-move::after { width: 34%; height: 34%; }
`;

const BACK_RANK = ["rook", "knight", "bishop", "queen", "king", "bishop", "knight", "rook"];

/** A board from a list of pieces: { e4: "white pawn", ... }. Empty squares are left out. */
function board(pieces) {
  return Object.entries(pieces).map(([square, piece]) => {
    const [color, type] = piece.split(" ");
    return { square, color, type };
  });
}

/** The standard starting position as a list of pieces, ready to change. */
function startingPieces(backRank = BACK_RANK) {
  const pieces = {};
  "abcdefgh".split("").forEach((file, i) => {
    pieces[`${file}8`] = `black ${backRank[i]}`;
    pieces[`${file}7`] = "black pawn";
    pieces[`${file}2`] = "white pawn";
    pieces[`${file}1`] = `white ${backRank[i]}`;
  });
  return pieces;
}

// One entry per image. Each shot either plays `moves` (from–to pairs, white
// first, ending with white to move) or sets up `pieces`, then selects `select`.
// A shot with `crop` (the top-left and bottom-right squares, e.g. "a3:c1") is an
// icon: just those squares, without coordinates.
const SHOTS = [
  {
    file: "ice-skate-chess.webp",
    variant: "iceskate",
    // The queen can only stop at the far end of each line
    moves: ["d2d4", "e7e5", "d1d3", "e5d4"],
    select: "d3",
  },
  {
    file: "angry-chess.webp",
    variant: "angry",
    // The queen can capture her own pawns
    moves: ["d2d4", "d7d5", "d1d3", "c8f5"],
    select: "d3",
  },
  {
    file: "risky-chess.webp",
    variant: "risky",
    // No check: the queen can take the king
    moves: ["c2c4", "d7d5", "d1a4", "d5c4"],
    select: "a4",
  },
  {
    file: "dark-chess.webp",
    variant: "dark",
    // The queen's torch lights up the pawns in her path
    moves: ["c2c3", "d7d5", "d2d4", "e7e6", "d1b3", "g8f6", "b3c4", "f8e7"],
    select: "c4",
  },
  {
    file: "superchess.webp",
    variant: "superchess",
    // A promoted Amazon moves like a queen and a knight
    pieces: (() => {
      const pieces = startingPieces();
      delete pieces.b2;
      delete pieces.b7;
      pieces.b5 = "white amazon";
      return pieces;
    })(),
    select: "b5",
  },
  {
    file: "chess-960.webp",
    variant: "iceskate-960",
    // A shuffled back rank
    pieces: startingPieces(["bishop", "bishop", "knight", "rook", "king", "rook", "queen", "knight"]),
  },

  // Icons: the bottom-left 3×3 corner of a board, with the kings kept outside it
  {
    file: "icons/iceskate.webp",
    variant: "iceskate",
    // The rook can only stop at the far end of each line
    pieces: { a1: "white rook", a4: "white pawn", d1: "white king", h8: "black king" },
    select: "a1",
    crop: "a3:c1",
  },
  {
    file: "icons/angry.webp",
    variant: "angry",
    // The knight can capture its own pawn
    pieces: { a1: "white knight", b3: "white pawn", e1: "white king", e8: "black king" },
    select: "a1",
    crop: "a3:c1",
  },
  {
    file: "icons/risky.webp",
    variant: "risky",
    // The queen can capture the king
    pieces: { c1: "white queen", a3: "black king", h1: "white king" },
    select: "c1",
    crop: "a3:c1",
  },
  {
    file: "icons/dark.webp",
    variant: "dark",
    // The bishop's torch reveals a hidden knight
    pieces: { a1: "white bishop", c3: "black knight", e1: "white king", h8: "black king" },
    select: "a1",
    crop: "a3:c1",
  },
  {
    file: "icons/superchess.webp",
    variant: "superchess",
    // An Amazon can go anywhere around it
    pieces: { b2: "white amazon", e1: "white king", e8: "black king" },
    select: "b2",
    crop: "a3:c1",
  },
];

/** Turn "e4" into the engine's { rank, file }: rank 0 is the 8th rank. */
function square(name) {
  return { rank: 8 - Number(name[1]), file: "abcdefgh".indexOf(name[0]) };
}

async function setUpPosition(page, shot) {
  const moves = (shot.moves ?? []).map((move) => [square(move.slice(0, 2)), square(move.slice(2, 4))]);
  const pieces = shot.pieces ? board(shot.pieces).map((p) => ({ ...p, ...square(p.square) })) : null;

  const problem = await page.evaluate(
    ({ moves, pieces }) => {
      const engine = window.engine;
      if (pieces) {
        const position = Array.from({ length: 8 }, () => Array(8).fill(null));
        for (const { rank, file, color, type } of pieces) position[rank][file] = { color, type };
        engine.reset(position);
      }
      let lastMove = null;
      for (const [from, to] of moves) {
        lastMove = engine.makeMove(from.rank, from.file, to.rank, to.file);
        if (!lastMove) return `illegal move from ${JSON.stringify(from)} to ${JSON.stringify(to)}`;
      }
      if (engine.turn !== "white") return "the position must end with white to move";

      // Redraw the board from the engine, highlighting the last move
      window.ui.lastMove = lastMove;
      window.ui.render();
      return null;
    },
    { moves, pieces }
  );
  if (problem) throw new Error(`${shot.file}: ${problem}`);
}

async function takeShot(browser, shot) {
  // Icons are shown small, so 1× (180px) is already sharp enough
  const deviceScaleFactor = shot.crop ? 1 : SCALE;
  const page = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor, colorScheme: "light" });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto(`${BASE}/game.html#bot:${shot.variant}:white`);
  await page.waitForSelector("#chess-board .square");
  await page.waitForFunction(() => document.getElementById("game-status").textContent.includes("Your turn"));

  await setUpPosition(page, shot);
  if (shot.select) {
    const { rank, file } = square(shot.select);
    await page.click(`#chess-board .square[data-rank="${rank}"][data-file="${file}"]`);
  }

  // Transparent page, and no animations mid-capture
  await page.addStyleTag({
    content: `html, body, .page { background: transparent; }
      *, *::before, *::after { transition: none; animation: none; }
      ${shot.crop ? ICON_STYLE : ""}`,
  });
  await page.waitForTimeout(300);

  const png = await page.screenshot({ omitBackground: true, clip: await clipFor(page, shot) });
  const path = `assets/images/${shot.file}`;
  await mkdir(path.slice(0, path.lastIndexOf("/")), { recursive: true });
  await writeFile(path, await toWebp(page, png));
  await page.close();

  if (errors.length) throw new Error(`${shot.file}: page errors: ${errors.join(", ")}`);
  console.log(`✓ ${path}`);
}

/** The area to capture: the board with room for its shadow, or just the cropped squares. */
async function clipFor(page, shot) {
  const squareBox = async (name) => {
    const { rank, file } = square(name);
    return page.locator(`#chess-board .square[data-rank="${rank}"][data-file="${file}"]`).boundingBox();
  };

  if (shot.crop) {
    const [topLeft, bottomRight] = shot.crop.split(":");
    const from = await squareBox(topLeft);
    const to = await squareBox(bottomRight);
    return { x: from.x, y: from.y, width: to.x + to.width - from.x, height: to.y + to.height - from.y };
  }

  const box = await page.locator("#chess-board").boundingBox();
  return {
    x: box.x - MARGIN,
    y: box.y - MARGIN,
    width: box.width + MARGIN * 2,
    height: box.height + MARGIN * 2,
  };
}

/**
 * Playwright only saves PNG or JPEG, and JPEG can't be transparent, so the
 * browser re-encodes the PNG as WebP: transparent, and a fraction of the size.
 */
async function toWebp(page, png) {
  const dataUrl = await page.evaluate(
    async ({ base64, quality }) => {
      const image = new Image();
      image.src = `data:image/png;base64,${base64}`;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      canvas.getContext("2d").drawImage(image, 0, 0);
      return canvas.toDataURL("image/webp", quality);
    },
    { base64: png.toString("base64"), quality: WEBP_QUALITY }
  );
  if (!dataUrl.startsWith("data:image/webp")) throw new Error("This browser can't encode WebP");
  return Buffer.from(dataUrl.split(",")[1], "base64");
}

async function waitForServer() {
  for (let i = 0; i < 50; i++) {
    try {
      await fetch(BASE);
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }
  throw new Error(`The local server didn't start on port ${PORT}`);
}

const filter = process.argv[2];
const shots = filter ? SHOTS.filter((shot) => shot.file.includes(filter)) : SHOTS;
if (shots.length === 0) {
  console.error(`No screenshots match "${filter}"`);
  process.exit(1);
}

const server = spawn("npx", ["serve", ".", "-l", String(PORT), "--no-clipboard"], { stdio: "ignore" });
try {
  await waitForServer();
  const browser = await chromium.launch();
  try {
    for (const shot of shots) await takeShot(browser, shot);
  } finally {
    await browser.close();
  }
} finally {
  server.kill();
}
