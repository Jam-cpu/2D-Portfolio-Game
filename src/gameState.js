// Global game state management
import { k } from "./kaboomCtx.js";

export const gameState = {
  currentScene: "main",
  playerData: {
    rupeeCount: 0,
    position: { x: 0, y: 0 }
  },

  // Scene transition with fade effect
  transitionToScene(sceneName, playerPos = null) {
    // Store current player data
    if (window.currentPlayer) {
      this.playerData.rupeeCount = window.currentRupeeManager ? window.currentRupeeManager.count : 0;
      this.playerData.position = {
        x: window.currentPlayer.pos.x,
        y: window.currentPlayer.pos.y
      };
    }

    // Set spawn position for next scene
    if (playerPos) {
      this.playerData.position = playerPos;
    }

    this.currentScene = sceneName;

    // Fade out current scene and transition
    const fadeOverlay = k.add([
      k.rect(k.width(), k.height()),
      k.color(0, 0, 0),
      k.opacity(0),
      k.fixed(),
      k.z(1000)
    ]);

    k.tween(0, 1, 0.5, (val) => {
      fadeOverlay.opacity = val;
    }).onEnd(() => {
      k.go(sceneName);
    });
  }
};

// Make globally accessible for backwards compatibility
window.gameState = gameState;
