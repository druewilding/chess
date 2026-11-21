import { describe, expect, it } from "vitest";

import { ChessEngine } from "../js/chess-engine.js";
import {
  currentEngineFlags,
  engineFlags,
  parseVariantKey,
  setUpEngine,
  variantKey,
  variantName,
  VARIANTS,
} from "../js/variants.js";

describe("variants", () => {
  it("names each variant after an engine flag", () => {
    const engine = new ChessEngine();
    for (const variant of VARIANTS) {
      expect(engine).toHaveProperty(variant.id);
    }
  });

  it("gives every variant what the pages need", () => {
    for (const variant of VARIANTS) {
      expect(variant.name).toBeTruthy();
      expect(variant.tagline).toBeTruthy();
      expect(variant.tagline).not.toMatch(/\.$/);
      expect(variant.rules).toBeTruthy();
      expect(variant.colour).toHaveLength(2);
      expect(variant.screenshot).toMatch(/^assets\/images\/.+\.png$/);
    }
  });

  it("reads variant keys, with and without Chess960", () => {
    expect(parseVariantKey("risky")).toMatchObject({ variant: { id: "risky" }, is960: false });
    expect(parseVariantKey("risky-960")).toMatchObject({ variant: { id: "risky" }, is960: true });
    expect(() => parseVariantKey("knightmare")).toThrow(/Unknown variant: "knightmare"/);
  });

  it("builds variant keys", () => {
    expect(variantKey("dark", false)).toBe("dark");
    expect(variantKey("dark", true)).toBe("dark-960");
  });

  it("names variants for display", () => {
    expect(variantName("iceskate")).toBe("Ice Skate Chess");
    expect(variantName("iceskate-960")).toBe("Ice Skate Chess960");
    expect(variantName("superchess-960")).toBe("Superchess960");
  });

  it("turns on exactly one engine flag", () => {
    expect(engineFlags("angry")).toEqual({
      iceskate: false,
      angry: true,
      risky: false,
      dark: false,
      superchess: false,
    });
  });

  it("sets up an engine for a variant, replacing the previous one", () => {
    const engine = new ChessEngine({ dark: true });
    setUpEngine(engine, "superchess");
    expect(currentEngineFlags(engine)).toEqual(engineFlags("superchess"));
    expect(engine.getPiece(0, 4)).toMatchObject({ type: "king" });
  });

  it("shuffles the back rank for Chess960", () => {
    const engine = new ChessEngine();
    setUpEngine(engine, "risky-960");
    expect(engine.risky).toBe(true);
    const backRank = [0, 1, 2, 3, 4, 5, 6, 7].map((file) => engine.getPiece(7, file).type);
    expect(backRank.toSorted()).toEqual(["bishop", "bishop", "king", "knight", "knight", "queen", "rook", "rook"]);
  });
});
