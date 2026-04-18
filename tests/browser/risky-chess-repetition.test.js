// Risky Chess — threefold repetition resolved by board material.
//
// 1. d4 e5  2. dxe5 h5  3. a4 Rh6  4. Ra3 Rh8  5. Ra1 Rh6
// 6. Ra3 Rh8  7. Ra1 Rh6  8. Ra3$
//
// White has 51 board points (all pieces + 8 pawns including captured e-pawn).
// Black has 50 board points (all pieces + 7 pawns, lost e-pawn).
// White wins by 1 point via threefold repetition.

import { test } from "@playwright/test";

import { TwoPlayerGame } from "./harness.js";

test.describe("Risky Chess — repetition decided by board material", () => {
  let game;

  test.beforeAll(async ({ browser }) => {
    game = await TwoPlayerGame.create(browser, "risky", "white");
  });

  test.afterAll(async () => {
    await game?.close();
  });

  test("white wins by 1 point on threefold repetition", async () => {
    await game.play(
      "d4",
      "e5",
      "dxe5",
      "h5",
      "a4",
      "Rh6",
      "Ra3",
      "Rh8",
      "Ra1",
      "Rh6",
      "Ra3",
      "Rh8",
      "Ra1",
      "Rh6",
      "Ra3$"
    );

    await game.assertGameOver("white", "You Win!", "by repetition — 1 points ahead");
    await game.assertGameOver("black", "You Lose", "by repetition — 1 points behind");
  });
});
