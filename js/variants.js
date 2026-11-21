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
    // Who made the variant up, shown as a "by Luna" badge
    by: "Luna",
    // Light and dark versions of the variant's colour
    colour: ["#1f6fc5", "#6aaaf5"],
    rules: `Like regular chess, except sliding pieces (bishops, rooks, and queens) <strong>cannot stop early</strong>.
      They must travel as far as possible in their chosen direction, stopping only when they hit the edge of the
      board or a friendly piece, or capture an enemy piece. They <em>may</em> stop at an intermediate square to block
      check, as this is the furthest they can go in this situation.`,
    screenshot: "assets/images/ice-skate-chess.webp",
    // A 3×3 corner of a board showing one move, for the list of variants.
    // Made with the screenshots and icons by `npm run screenshots`.
    icon: "assets/images/icons/iceskate.webp",
  },
  {
    id: "angry",
    name: "Angry Chess",
    tagline: "You can capture your own pieces",
    colour: ["#c2362c", "#f07a70"],
    rules: `Like regular chess, except you can <strong>capture your own pieces</strong>! Every piece is a valid target,
      except your own king. Be careful: sacrificing your own material can open lines, but it can also backfire
      spectacularly.`,
    screenshot: "assets/images/angry-chess.webp",
    icon: "assets/images/icons/angry.webp",
  },
  {
    id: "risky",
    name: "Risky Chess",
    tagline: "No check, kings can be captured, most points wins",
    by: "Luna",
    colour: ["#b0670a", "#f0a742"],
    rules: `Like regular chess, except there is <strong>no check or checkmate</strong>. You can threaten the
      opponent's king, but they are free to ignore it, or might not even notice. You can even move your own king into
      danger! The game ends when a king is <strong>captured</strong>, but the capturer doesn't necessarily win. The
      winner is whoever has the <strong>most points</strong> from captured pieces (king = 12 pts). If the points are
      equal, the game is a draw.`,
    screenshot: "assets/images/risky-chess.webp",
    icon: "assets/images/icons/risky.webp",
  },
  {
    id: "dark",
    name: "Dark Chess",
    tagline: "Enemies stay hidden until your pieces light them up",
    colour: ["#6a43b8", "#a888ea"],
    rules: `Standard chess, but the board is <strong>shrouded in darkness</strong>. You can always see your own
      pieces, but enemy pieces are completely hidden. Tap one of your pieces to <strong>shine a torch</strong>: its
      legal moves light up, revealing any enemies lurking in the path.`,
    screenshot: "assets/images/dark-chess.webp",
    icon: "assets/images/icons/dark.webp",
  },
  {
    id: "superchess",
    name: "Superchess",
    tagline: "Promote to an Amazon: a queen and a knight in one",
    colour: ["#23824a", "#5cc98a"],
    rules: `The same as standard chess, until you get to promotion, at which point you can claim an
      <strong>Amazon</strong>, a powerful piece combining the abilities of both a queen and a knight.`,
    screenshot: "assets/images/superchess.webp",
    icon: "assets/images/icons/superchess.webp",
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

/** A "by Luna" badge for a variant someone made up, or null. */
export function creditBadge(variant) {
  if (!variant.by) return null;
  const badge = document.createElement("span");
  badge.className = "klods-badge credit-badge";
  badge.textContent = `by ${variant.by}`;
  return badge;
}

/** The variant's icon, as an element. */
export function variantIcon(variant) {
  const icon = document.createElement("img");
  icon.className = "variant-icon";
  icon.src = variant.icon;
  icon.alt = "";
  applyVariantColour(icon, variant);
  return icon;
}
