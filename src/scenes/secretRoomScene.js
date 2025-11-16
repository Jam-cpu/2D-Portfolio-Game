// Secret Room Scene - Complete scene logic separated from main.js
import { k } from "../kaboomCtx.js";
import { createTerminalSystem, createFPSDisplay, createRupeeCounter, createRupeeCounterManager } from "../uiComponents.js";
import { displayDialogue, setCamScale } from "../utils.js";
import { scaleFactor } from "../constants.js";
import { createPlayer, createPlayerAnimations } from "../playerSystem.js";

export function createSecretRoomScene() {
  return async () => {

    // Clear any existing player reference
    window.currentPlayer = null;

    // Function to stop all player movement (Secret Room)
    function stopPlayerMovement_SecretRoom() {
      // Stop any movement
      if (window.currentPlayer) {
        window.currentPlayer.stop();
      }

      // Play appropriate idle animation
      if (window.currentPlayer) {
        if (window.currentPlayer.direction === "down") {
          window.currentPlayer.play("idle-down");
        } else if (window.currentPlayer.direction === "up") {
          window.currentPlayer.play("idle-up");
        } else {
          window.currentPlayer.play("idle-side");
        }
      }
    }

    // Stop background music in secret room
    if (window.currentBackgroundMusic) {
      window.currentBackgroundMusic.stop();
      window.currentBackgroundMusic = null;
    }

    // Function to fade out music
    function fadeOutMusic() {
      if (window.currentBackgroundMusic) {
        k.tween(window.currentBackgroundMusic.volume, 0, 2, (val) => {
          window.currentBackgroundMusic.volume = val;
        }, k.easings.easeOutQuad);
      }
    }

    // Function to fade in music
    function fadeInMusic() {
      if (window.currentBackgroundMusic) {
        k.tween(window.currentBackgroundMusic.volume, 0.5, 2, (val) => {
          window.currentBackgroundMusic.volume = val;
        }, k.easings.easeInQuad);
      }
    }

    // Add Secret Room specific map
    const map = k.add([k.sprite("secretRoomMap"), k.pos(0), k.scale(scaleFactor)]);

    // Create FPS display using the centralized component
    const fpsDisplay = createFPSDisplay();

    // Create proper rupee counter using centralized component
    const rupeeCounter = createRupeeCounter(window.gameState.playerData.rupeeCount);
    const rupeeCounterManager = createRupeeCounterManager(rupeeCounter.rupeeCounterOverlay, window.gameState.playerData.rupeeCount);
    rupeeCounterManager.init();

    // Make globally accessible
    window.currentRupeeManager = rupeeCounterManager;

    // Create player using modular system (ensures proper animations and input handling)
    // Important: Create a NEW player object for secret room to avoid "already has parent" error
    let playerSpawnX = 400;
    let playerSpawnY = 300;

    const player = createPlayer(playerSpawnX, playerSpawnY); // Initial position - will be updated if spawn found
    const playerAnimations = createPlayerAnimations();
    playerAnimations.init(player);

    // Player is already added by createPlayer, just set reference
    window.currentPlayer = player;

    // Initialize player state for secret room
    player.isInDialogue = false;

    // Setup player custom events for secret room
    player.on("collectRupee", (rupee) => {
      k.play("tp-get-rupee", { volume: 0.8 });
      rupee.destroy();
      rupeeCounterManager.increment();
    });

    player.on("returnToMain", () => {
      k.play("pipesound", { volume: 0.7 }); // Add pipe sound like in main scene
      stopPlayerMovement_SecretRoom();
      // Use the gameState transition system for proper fade effect
      window.gameState.transitionToScene("main", { x: 200, y: 300 });
    });

    // Parse secret room map and create boundaries - simplified version
    try {
      const response = await fetch("/secretmap.json");
      if (response.ok) {
        const mapData = await response.json();

        // Process map layers
        for (const layer of mapData.layers || []) {
          // Process walls layer for collision detection
          if (layer.name === "walls") {

            for (const wall of layer.objects || []) {
              // Create collision walls from map data
              const wallObj = k.add([
                k.area({
                  shape: new k.Rect(k.vec2(0), wall.width * scaleFactor, wall.height * scaleFactor),
                }),
                k.body({ isStatic: true }), // Make walls solid
                k.pos(wall.x * scaleFactor, wall.y * scaleFactor),
                k.opacity(0), // Invisible walls
                k.z(1),
                "wall"
              ]);
            }
          }

          // Look for "objects" layer for interactive objects
          if (layer.name === "objects") {

            for (const entity of layer.objects || []) {
              if (entity.name === "spawn") {
                const spawnX = entity.x * scaleFactor;
                const spawnY = entity.y * scaleFactor;

                // Set player position - use direct position setting for more reliable positioning
                player.pos.x = spawnX;
                player.pos.y = spawnY;

                // Add some buffer space to ensure player isn't stuck in walls
                // Move player slightly away from any nearby walls
                const wallCheckRadius = 20;
                const nearbyWalls = k.get("wall").filter(wall => {
                  const distance = player.worldPos().dist(wall.worldPos());
                  return distance < wallCheckRadius;
                });

                if (nearbyWalls.length > 0) {
                  // Try to move player slightly away from walls
                  player.pos.y += 20; // Move down a bit to avoid being stuck
                }
              }

              // Create interactive collision objects with proper scaling and positioning
              if (entity.name === "secret pc") {
                const pcObj = k.add([
                  k.area({
                    shape: new k.Rect(k.vec2(0), entity.width * scaleFactor || 32, entity.height * scaleFactor || 32),
                  }),
                  k.body({ isStatic: true }), // Make it solid
                  k.pos((entity.x) * scaleFactor, (entity.y) * scaleFactor),
                  k.z(10),
                  "secretpc",
                  "interactive"
                ]);
              }

              if (entity.name === "secret tv") {
                const tvObj = k.add([
                  k.area({
                    shape: new k.Rect(k.vec2(0), entity.width * scaleFactor || 40, entity.height * scaleFactor || 32),
                  }),
                  k.body({ isStatic: true }), // Make it solid
                  k.pos((entity.x) * scaleFactor, (entity.y) * scaleFactor),
                  k.z(10),
                  "secrettv",
                  "interactive"
                ]);
              }

              if (entity.name === "pipe") {
                const pipeObj = k.add([
                  k.area({
                    shape: new k.Rect(k.vec2(0), entity.width * scaleFactor || 16, entity.height * scaleFactor || 16),
                  }),
                  k.body({ isStatic: true }), // Make it solid
                  k.pos((entity.x) * scaleFactor, (entity.y) * scaleFactor),
                  k.z(10),
                  "exitpipe",
                  "interactive"
                ]);
              }
            }
          }
        }
      }
    } catch (error) {
      console.warn("Could not load secret room map data:", error);
      // If map loading fails, create basic test objects

      // Add test PC
      k.add([
        k.rect(64, 32),
        k.pos(200, 200),
        k.area(),
        k.color(0, 255, 0),
        k.opacity(0.7),
        "secretpc"
      ]);

      // Add test exit pipe
      k.add([
        k.rect(32, 32),
        k.pos(700, 500),
        k.area(),
        k.color(0, 0, 255),
        k.opacity(0.7),
        "exitpipe"
      ]);

      // Add basic walls
      k.add([k.rect(800, 20), k.pos(0, 0), k.area(), k.body({ isStatic: true }), k.opacity(0), "wall"]);
      k.add([k.rect(800, 20), k.pos(0, 580), k.area(), k.body({ isStatic: true }), k.opacity(0), "wall"]);
      k.add([k.rect(20, 600), k.pos(0, 0), k.area(), k.body({ isStatic: true }), k.opacity(0), "wall"]);
      k.add([k.rect(20, 600), k.pos(780, 0), k.area(), k.body({ isStatic: true }), k.opacity(0), "wall"]);
    }

    // Create terminal system
    const terminalSystem = createTerminalSystem(player, rupeeCounterManager);

    // Setup collision handlers after terminal system is created
    const setupCollisionHandlers = () => {
      console.log("Setting up collision handlers...");

      // Add rupee pickup collision handler
      player.onCollide("rupee", (rupee) => {
        player.trigger("collectRupee", rupee);
      });

      // Add exit pipe collision handler
      player.onCollide("exitpipe", () => {
        player.trigger("returnToMain");
      });

      // Add secret PC collision handler
      player.onCollide("secretpc", () => {
        if (!terminalSystem.isTerminalActive() && !player.isInDialogue) {
          k.play("tp-press-start", { volume: 0.5 });
          terminalSystem.openTerminal();
        }
      });

      // Add secret TV collision handler
      player.onCollide("secrettv", () => {
        if (!player.isInDialogue) {
          player.isInDialogue = true;
          stopPlayerMovement_SecretRoom();

          const tvDialogue = `
            <div style="text-align: center; padding: 20px;">
              <p style="margin-bottom: 20px;">This ancient "CR"TV contains mysterious footage...</p>
              <button onclick="window.displayVideo('/terry davis.mp4'); document.getElementById('dialogue-ui').style.display = 'none';" style="background: #00ff00; color: black; border: none; padding: 10px 20px; font-size: 16px; cursor: pointer; border-radius: 5px;">▶️ Play Video</button>
            </div>
          `;

          displayDialogue(tvDialogue, () => {
            player.isInDialogue = false;
            player.stop();
          });
        }
      });
    };

    // Setup collision handlers
    setupCollisionHandlers();

    // Setup camera system properly - use same scale as main scene
    setCamScale(k);

    // Immediately center camera on player
    if (player && player.worldPos) {
      const initialCamPos = k.vec2(player.worldPos().x, player.worldPos().y + 100);
      k.camPos(initialCamPos);
    }

    // Camera following system
    k.onResize(() => {
      setCamScale(k); // Use same scale as main scene
    });

    k.onUpdate(() => {
      if (player && player.worldPos) {
        const camPos = k.vec2(player.worldPos().x, player.worldPos().y + 100);
        k.camPos(camPos);
      }
    });

    // Import and setup input handling
    const { setupSecretRoomInput } = await import("../input/secretRoomInput.js");
    setupSecretRoomInput(player, terminalSystem);

    // Debug mode
    k.onKeyPress("b", () => { k.debug.inspect = !k.debug.inspect; });

    // Music controls
    k.onKeyPress("m", () => { fadeOutMusic(); });
    k.onKeyPress("n", () => { fadeInMusic(); });

    // Scene cleanup
    k.onSceneLeave(() => { fadeOutMusic(); });
  };
}
