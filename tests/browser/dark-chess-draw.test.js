// Dark Chess — agreed draw reveals board during history review.
//
// Regression test for the bug where a Dark Chess game ending by agreed draw
// (or any game-over path that doesn't play a final move, such as resignation
// received from Firebase) would re-hide the board when reviewing history,
// because the last positionSnapshot still had gameOver: false.
//
// After the fix, syncSnapshots() patches the last snapshot's gameOver flag,
// so goToPosition() correctly keeps darkRevealed = true throughout review.

import { test } from "@playwright/test";

import { TwoPlayerGame } from "./harness.js";

test.describe("Dark Chess — agreed draw reveals board in history review", () => {
  let game;

  test.beforeAll(async ({ browser }) => {
    game = await TwoPlayerGame.create(browser, "dark", "white");
  });

  test.afterAll(async () => {
    await game?.close();
  });

  test("board and move notation are fully revealed after agreeing a draw", async () => {
    // Play a short game: 1.e4 e5 2.Nf3 Nc6
    await game.play("e4", "e5", "Nf3", "Nc6");

    // White offers a draw, black accepts
    await game.offerDraw("white");
    await game.acceptDraw("black");

    // Both players should see the game-over overlay with "Draw"
    await game.assertGameOver("white", "Draw");
    await game.assertGameOver("black", "Draw");

    // ── White's perspective ────────────────────────────────────────

    await game.dismissGameOver("white");

    // Board should be fully revealed at the live (post-game) position
    await game.assertBoardRevealed("white");
    await game.assertMoveNotationRevealed("white");

    // Navigate to the very start (position 0) — all pieces on the board, none shrouded
    await game.goToMove("white", 0);
    await game.assertBoardRevealed("white");

    // Step through all 4 moves and assert the board stays fully revealed
    for (let i = 1; i <= 4; i++) {
      await game.goToMove("white", i);
      await game.assertBoardRevealed("white");
    }

    // Return to live position; move notation should still have no hidden entries
    await game.goToLive("white");
    await game.assertMoveNotationRevealed("white");

    // ── Black's perspective ────────────────────────────────────────

    await game.dismissGameOver("black");

    await game.assertBoardRevealed("black");
    await game.assertMoveNotationRevealed("black");

    await game.goToMove("black", 0);
    await game.assertBoardRevealed("black");

    for (let i = 1; i <= 4; i++) {
      await game.goToMove("black", i);
      await game.assertBoardRevealed("black");
    }

    await game.goToLive("black");
    await game.assertMoveNotationRevealed("black");
  });
});
