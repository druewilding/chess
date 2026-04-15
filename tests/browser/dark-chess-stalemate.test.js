// Dark Chess — stalemate reveals board during history review.
//
// The fastest known stalemate (Sam Floyd, 10 moves) is played in a Dark Chess
// game and the test verifies that once the game ends in stalemate, both
// players can freely review every position with the board fully revealed
// and no move-notation entries hidden.
//
// Move sequence (White stalemating Black in 10 moves):
//   1. e3 a5  2. Qh5 Ra6  3. Qxa5 h5  4. Qxc7 Rah6  5. h4 f6
//   6. Qxd7+ Kf7  7. Qxb7 Qd3  8. Qxb8 Qh7  9. Qxc8 Kg6  10. Qe6$  (stalemate)

import { test } from "@playwright/test";

import { TwoPlayerGame } from "./harness.js";

test.describe("Dark Chess — stalemate reveals board in history review", () => {
  let game;

  test.beforeAll(async ({ browser }) => {
    game = await TwoPlayerGame.create(browser, "dark", "white");
  });

  test.afterAll(async () => {
    await game?.close();
  });

  test("board and move notation are fully revealed after stalemate", async () => {
    // 10-move stalemate sequence (19 half-moves; White's last move stalemating Black)
    await game.play(
      "e3", // 1. white
      "a5", // 1. black
      "Qh5", // 2. white
      "Ra6", // 2. black
      "Qxa5", // 3. white
      "h5", // 3. black
      "Qxc7", // 4. white
      "Rah6", // 4. black
      "h4", // 5. white
      "f6", // 5. black
      "Qxd7+", // 6. white
      "Kf7", // 6. black
      "Qxb7", // 7. white
      "Qd3", // 7. black
      "Qxb8", // 8. white
      "Qh7", // 8. black
      "Qxc8", // 9. white
      "Kg6", // 9. black
      "Qe6$" // 10. white — stalemate
    );

    // Both players should see the game-over overlay showing a draw
    await game.assertGameOver("white", "Draw");
    await game.assertGameOver("black", "Draw");

    // ── White's perspective ────────────────────────────────────────

    await game.dismissGameOver("white");

    // Board and notation should be fully revealed at the live position
    await game.assertBoardRevealed("white");
    await game.assertMoveNotationRevealed("white");

    // Navigate to the starting position and step through all 19 half-moves
    await game.goToMove("white", 0);
    await game.assertBoardRevealed("white");

    for (let i = 0; i < 19; i++) {
      await game.pages["white"].click("#btn-review-next");
      await game.pages["white"].waitForTimeout(200);
      await game.assertBoardRevealed("white");
    }

    await game.goToLive("white");
    await game.assertMoveNotationRevealed("white");

    // ── Black's perspective ────────────────────────────────────────

    await game.dismissGameOver("black");

    await game.assertBoardRevealed("black");
    await game.assertMoveNotationRevealed("black");

    await game.goToMove("black", 0);
    await game.assertBoardRevealed("black");

    for (let i = 0; i < 19; i++) {
      await game.pages["black"].click("#btn-review-next");
      await game.pages["black"].waitForTimeout(200);
      await game.assertBoardRevealed("black");
    }

    await game.goToLive("black");
    await game.assertMoveNotationRevealed("black");
  });
});
