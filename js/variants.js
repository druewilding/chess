// Every variant, described once. The home page, the game page and the bot all
// read from this list, so adding a variant means: the rule in chess-engine.js,
// one entry here, and a screenshot in assets/images.
//
// Each entry's `id` is also the name of the ChessEngine flag that turns the
// variant on (e.g. `new ChessEngine({ risky: true })`).
//
// A game's variant key is the id, plus "-960" for Chess960: "risky-960".

export const VARIANTS = [
  {
    id: "iceskate",
    name: "Ice Skate Chess",
    tagline: "Sliding pieces can't stop until they hit something",
    by: "my sibling Luna",
    // Light and dark versions of the variant's colour
    colour: ["#1f6fc5", "#6aaaf5"],
    rules: `Like regular chess, except sliding pieces (bishops, rooks, and queens) <strong>cannot stop early</strong>.
      They must travel as far as possible in their chosen direction, stopping only when they hit the edge of the
      board or a friendly piece, or capture an enemy piece. They <em>may</em> stop at an intermediate square to block
      check, as this is the furthest they can go in this situation.`,
    screenshot: "assets/images/ice-skate-chess.png",
    // A 4×4 corner of a board for the variant's icon: squares are numbered 0–15
    // from the top left, pieces are "colour/type", path squares are tinted and
    // target squares are highlighted.
    icon: { pieces: { 12: "white/rook", 3: "black/rook" }, path: [8, 4], target: [0] },
  },
  {
    id: "angry",
    name: "Angry Chess",
    tagline: "You can capture your own pieces",
    colour: ["#c2362c", "#f07a70"],
    rules: `Like regular chess, except you can <strong>capture your own pieces</strong>! Every piece is a valid target,
      except your own king. Be careful: sacrificing your own material can open lines, but it can also backfire
      spectacularly.`,
    screenshot: "assets/images/angry-chess.png",
    icon: { pieces: { 9: "white/knight", 2: "white/pawn", 15: "white/king" }, target: [2] },
  },
  {
    id: "risky",
    name: "Risky Chess",
    tagline: "No check, kings can be captured, most points wins",
    by: "my sibling Luna",
    colour: ["#b0670a", "#f0a742"],
    rules: `Like regular chess, except there is <strong>no check or checkmate</strong>. You can threaten the
      opponent's king, but they are free to ignore it, or might not even notice. You can even move your own king into
      danger! The game ends when a king is <strong>captured</strong>, but the capturer doesn't necessarily win. The
      winner is whoever has the <strong>most points</strong> from captured pieces (king = 12 pts). If the points are
      equal, the game is a draw.`,
    screenshot: "assets/images/risky-chess.png",
    icon: { pieces: { 1: "black/king", 13: "white/queen" }, path: [9, 5], target: [1] },
  },
  {
    id: "dark",
    name: "Dark Chess",
    tagline: "Enemies stay hidden until your pieces light them up",
    colour: ["#6a43b8", "#a888ea"],
    rules: `Standard chess, but the board is <strong>shrouded in darkness</strong>. You can always see your own
      pieces, but enemy pieces are completely hidden. Tap one of your pieces to <strong>shine a torch</strong>: its
      legal moves light up, revealing any enemies lurking in the path.`,
    screenshot: "assets/images/dark-chess.png",
    icon: {
      pieces: { 13: "white/bishop", 7: "black/knight" },
      path: [10],
      target: [7],
      shroud: [0, 1, 2, 3, 4, 5, 6, 8, 9, 11, 12, 14, 15],
    },
  },
  {
    id: "superchess",
    name: "Superchess",
    tagline: "Promote to an Amazon: a queen and a knight in one",
    colour: ["#23824a", "#5cc98a"],
    rules: `The same as standard chess, until you get to promotion, at which point you can claim an
      <strong>Amazon</strong>, a powerful piece combining the abilities of both a queen and a knight.`,
    screenshot: "assets/images/superchess.png",
    icon: { pieces: { 5: "white/pawn", 1: "white/amazon" }, path: [5], target: [1] },
  },
];

export const CHESS960_RULES = `Also known as <strong>Fischer Random Chess</strong>. The back rank pieces are shuffled
  into one of 960 possible starting positions, so opening theory goes out the window. Castling still works: the king
  and rook end up on their usual squares, regardless of where they started.`;

/** Split a variant key like "risky-960" into its variant and whether it's Chess960. */
export function parseVariantKey(key) {
  const is960 = key.endsWith("-960");
  const id = is960 ? key.slice(0, -4) : key;
  const variant = VARIANTS.find((v) => v.id === id);
  if (!variant) throw new Error(`Unknown variant: "${key}"`);
  return { variant, is960 };
}

/** Build a variant key from an id and the Chess960 setting. */
export function variantKey(id, is960) {
  return is960 ? `${id}-960` : id;
}

/** The display name for a variant key, e.g. "Risky Chess960". */
export function variantName(key) {
  const { variant, is960 } = parseVariantKey(key);
  return is960 ? `${variant.name}960` : variant.name;
}

/** The engine options that turn on a variant: one flag per variant, only one of them true. */
export function engineFlags(id) {
  return Object.fromEntries(VARIANTS.map((v) => [v.id, v.id === id]));
}

/** The engine flags currently set on an engine. */
export function currentEngineFlags(engine) {
  return Object.fromEntries(VARIANTS.map((v) => [v.id, Boolean(engine[v.id])]));
}

/** Set an engine up for a variant key and put the pieces on their starting squares. */
export function setUpEngine(engine, key) {
  const { variant, is960 } = parseVariantKey(key);
  Object.assign(engine, engineFlags(variant.id));
  if (is960) {
    engine.setup960();
  } else {
    engine.reset();
  }
}

/** Give an element the variant's colour as `--variant`, for light and dark. */
export function applyVariantColour(element, variant) {
  const [light, dark] = variant.colour;
  element.style.setProperty("--variant", `light-dark(${light}, ${dark})`);
}

/** The variant's little board icon, as an element. */
export function variantIcon(variant) {
  const { pieces = {}, path = [], target = [], shroud = [] } = variant.icon;
  const board = document.createElement("span");
  board.className = "variant-icon";
  board.setAttribute("aria-hidden", "true");
  applyVariantColour(board, variant);
  for (let i = 0; i < 16; i++) {
    const square = document.createElement("span");
    const isLight = (Math.floor(i / 4) + (i % 4)) % 2 === 0;
    square.className = `variant-icon__square ${isLight ? "light" : "dark"}`;
    if (shroud.includes(i)) square.classList.add("variant-icon__square--shroud");
    if (path.includes(i)) square.classList.add("variant-icon__square--path");
    if (target.includes(i)) square.classList.add("variant-icon__square--target");
    if (pieces[i]) {
      const img = document.createElement("img");
      img.src = `assets/pieces/${pieces[i]}.webp`;
      img.alt = "";
      square.appendChild(img);
    }
    board.appendChild(square);
  }
  return board;
}
