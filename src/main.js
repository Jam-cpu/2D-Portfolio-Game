// Import modular components
import { k } from "./kaboomCtx.js";
import { gameState } from "./gameState.js";
import { playRickroll, startBackgroundMusic } from "./audioManager.js";
import { initializeMainScene } from "./sceneManager.js";
import { openPDF, displayVideo, displayImage, createTerminalSystem } from "./uiComponents.js";
import { displayDialogue, setCamScale } from "./utils.js";
import { scaleFactor } from "./constants.js";
import { loadAllAssets } from "./assetManager.js";
import { createSecretRoomScene } from "./scenes/secretRoomScene.js";

// Load all game assets using the centralized asset manager
loadAllAssets();

k.setBackground(k.Color.fromHex("#311047"));

// Make imported modules globally accessible for backwards compatibility
window.gameState = gameState;
window.openPDF = openPDF;
window.displayVideo = displayVideo;
window.displayImage = displayImage;
window.playRickroll = playRickroll;

k.scene("main", async () => {
  console.log("Starting main scene...");

  // Use the new modular scene initialization
  const sceneComponents = await initializeMainScene({
    x: window.gameState?.playerData?.position?.x || 100,
    y: window.gameState?.playerData?.position?.y || 200
  });

  console.log("Main scene player position:", sceneComponents.player.pos);

  // Start background music
  startBackgroundMusic();

  // Import and setup input handling
  const { setupMainSceneInput } = await import("./input/mainSceneInput.js");
  setupMainSceneInput(sceneComponents.player, sceneComponents.terminalSystem);

  // Camera setup
  console.log("Setting up main scene camera...");
  setCamScale(k);
  k.onResize(() => { setCamScale(k); });
  k.onUpdate(() => {
    if (sceneComponents.player) {
      k.camPos(sceneComponents.player.worldPos().x, sceneComponents.player.worldPos().y + 100);
    }
  });

  // Music controls (placeholder for audio system)
  k.onKeyPress("m", () => { console.log("Fade out music"); });
  k.onKeyPress("n", () => { console.log("Fade in music"); });

  // Scene cleanup
  k.onSceneLeave(() => { console.log("Leaving main scene"); });
});

// Secret Room Scene - Now using modular implementation
k.scene("secretRoom", createSecretRoomScene());

// Start Screen Scene
k.scene("start", () =>
{
  const startText = k.add([
    k.text("Click to Start", { size: 32 }),
    k.pos(k.center()),
    k.anchor("center"),
  ]);

  // Pulse animation
  startText.onUpdate(() =>
  {
    startText.opacity = k.wave(0.5, 1, k.time() * 2);
  });

  // Click anywhere to start
  k.onClick(() =>
  {
    k.go("main");
  });

  // Or press any key to start
  k.onKeyPress(() =>
  {
    k.go("main");
  });
});

// Start with the start screen
k.go("start");
