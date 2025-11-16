// Scene setup and management utilities
import { k } from "./kaboomCtx.js";
import { createPlayer, createPlayerAnimations } from "./playerSystem.js";
import { createRupeeCounter, createRupeeCounterManager, createTerminalSystem } from "./uiComponents.js";
import { initializeCollisionSystems } from "./collisionSystem.js";
import { createTerminalDialogue } from "./dialogueSystem.js";
import { scaleFactor, dialogueData } from "./constants.js";
import { displayDialogue } from "./utils.js";
import { gameState } from "./gameState.js";
import { openPDF, displayVideo, displayImage } from "./uiComponents.js";
import { playRickroll } from "./audioManager.js";

// Create map and boundaries
export async function setupMap() {
  // Add the map
  const map = k.add([
    k.sprite("map"),
    k.pos(0),
    k.scale(scaleFactor),
  ]);

  const boundaries = [];

  // Load map data to get boundary objects
  try {
    const response = await fetch("/map.json");
    if (response.ok) {
      const mapData = await response.json();

      // Look for boundary layer
      for (const layer of mapData.layers || []) {
        if (layer.name === "Boundary") {
          console.log("Found boundary layer with", layer.objects?.length || 0, "objects");

          for (const boundary of layer.objects || []) {
            // Skip boundaries that will be handled as interactive objects
            if (boundary.name === "pot 1" || boundary.name === "pot 2") {
              console.log("Skipping boundary for interactive object:", boundary.name);
              continue;
            }

            // Create boundary object with proper scaling
            const boundaryObj = k.add([
              k.rect(boundary.width * scaleFactor, boundary.height * scaleFactor),
              k.pos(boundary.x * scaleFactor, boundary.y * scaleFactor),
              k.area(),
              k.body({ isStatic: true }),
              k.opacity(0), // Make invisible, change to 0.3 for debugging
              "boundary",
            ]);

            boundaries.push(boundaryObj);
            console.log("Created boundary at:", boundary.x * scaleFactor, boundary.y * scaleFactor, "size:", boundary.width * scaleFactor, boundary.height * scaleFactor);
          }
        }
      }
    }
  } catch (error) {
    console.warn("Could not load map boundaries, using fallback boundaries:", error);
  }

  // Fallback: Add basic screen boundaries if no boundaries found
  if (boundaries.length === 0) {
    console.log("No boundaries found in map, creating fallback boundaries");
    boundaries.push(
      // Top boundary
      k.add([
        k.rect(k.width(), 50),
        k.pos(0, -25),
        k.area(),
        k.body({ isStatic: true }),
        k.opacity(0),
        "boundary",
      ]),
      // Bottom boundary
      k.add([
        k.rect(k.width(), 50),
        k.pos(0, k.height() - 25),
        k.area(),
        k.body({ isStatic: true }),
        k.opacity(0),
        "boundary",
      ]),
      // Left boundary
      k.add([
        k.rect(50, k.height()),
        k.pos(-25, 0),
        k.area(),
        k.body({ isStatic: true }),
        k.opacity(0),
        "boundary",
      ]),
      // Right boundary
      k.add([
        k.rect(50, k.height()),
        k.pos(k.width() - 25, 0),
        k.area(),
        k.body({ isStatic: true }),
        k.opacity(0),
        "boundary",
      ])
    );
  }

  return { map, boundaries };
}

// Create interactive objects from map data
export async function createInteractiveObjects(player) {
  const interactiveObjects = [];

  try {
    const response = await fetch("/map.json");
    if (!response.ok) throw new Error("Failed to load map.json");

    const mapData = await response.json();

    // Helper function to stop player movement
    function stopPlayerMovement() {
      player.isInDialogue = true;
      if (player.stop) player.stop();
    }

    // Make functions globally accessible for dialogue buttons
    window.openPDF = openPDF;
    window.displayVideo = displayVideo;
    window.displayImage = displayImage;
    window.playRickroll = playRickroll;

    // Process all layers for interactive objects
    for (const layer of mapData.layers || []) {

      // Process boundaries for interactive objects
      if (layer.name === "Boundary") {
        for (const boundary of layer.objects || []) {
          if (boundary.name) {
            console.log("Processing boundary:", boundary.name, "at", boundary.x, boundary.y);

            // Create collision boundary
            const boundaryObj = k.add([
              k.rect(boundary.width * scaleFactor, boundary.height * scaleFactor),
              k.pos(boundary.x * scaleFactor, boundary.y * scaleFactor),
              k.area(),
              k.body({ isStatic: true }),
              k.opacity(0),
              boundary.name,
            ]);

            interactiveObjects.push(boundaryObj);

            // Special handling for pot 2 - create visual sprite and breaking mechanics
            if (boundary.name === "pot 2") {
              const potSprite = k.add([
                k.sprite("pot"),
                k.pos(
                  (boundary.x + boundary.width / 2) * scaleFactor,
                  ((boundary.y + boundary.height / 2) + 1) * scaleFactor
                ),
                k.anchor("center"),
                k.scale(scaleFactor),
                k.z(100),
                "pot",
                "foreground",
                {
                  boundaryRef: boundaryObj,
                  originalName: boundary.name
                }
              ]);

              // Pot interaction events
              potSprite.on("showDialogue", () => {
                stopPlayerMovement();

                // Play the pot breaking sound immediately when dialogue starts
                k.play("pot-shatter", { volume: 0.8 });

                displayDialogue(
                  dialogueData["pot 2"] || "Clank!",
                  () => {
                    player.isInDialogue = false;
                    potSprite.trigger("break");
                  }
                );
              });

              potSprite.on("break", () => {
                // Remove collision handler FIRST
                if (potSprite.collisionHandler) {
                  console.log("Removing pot collision handler");
                  // Note: Kaboom doesn't have a direct way to remove specific collision handlers
                  // But destroying the boundary should stop the collisions
                }

                // Remove boundary and pot to clear any solid collision
                if (potSprite.boundaryRef) {
                  console.log("Destroying pot boundary at:", potSprite.boundaryRef.pos);
                  k.destroy(potSprite.boundaryRef);
                  potSprite.boundaryRef = null;
                } else {
                  console.warn("No boundary reference found for pot!");
                }

                console.log("Destroying pot sprite");
                k.destroy(potSprite);

                // Create rupee at pot position AFTER removing boundaries
                setTimeout(() => {
                  // Debug: Check what objects still exist with "pot 2" tag
                  const remainingPotObjects = k.get("pot 2");
                  console.log("Remaining objects with 'pot 2' tag:", remainingPotObjects.length);

                  // Create unique ID for pot rupee based on pot position
                  const potRupeeId = `pot_rupee_${Math.round(potSprite.pos.x)}_${Math.round(potSprite.pos.y)}`;
                  const rupeeFromPot = createRupee(potSprite.pos.x, potSprite.pos.y, potRupeeId);
                  console.log("Created rupee from pot at:", potSprite.pos.x, potSprite.pos.y);
                }, 100); // Small delay to ensure boundaries are cleared
              });

              // Set up collision for the boundary object (not the pot sprite)
              const potCollisionHandler = () => {
                if (!player.isInDialogue) {
                  potSprite.trigger("showDialogue");
                }
              };

              player.onCollide("pot 2", potCollisionHandler);

              // Store the collision handler reference for cleanup
              potSprite.collisionHandler = potCollisionHandler;

              interactiveObjects.push(potSprite);
            } else if (boundary.name === "Lampost") {
              // Special handling for Lampost - solid collision with dialogue
              console.log("Setting up Lampost collision at:", boundary.x * scaleFactor, boundary.y * scaleFactor);

              player.onCollide(boundary.name, () => {
                if (player.isInDialogue) return;

                console.log("Lamppost collision triggered!");
                stopPlayerMovement();
                displayDialogue(
                  "lampposting ...",
                  () => {
                    player.isInDialogue = false;
                  }
                );
              });
            } else {
              // Regular interactive object collision
              player.onCollide(boundary.name, () => {
                if (player.isInDialogue) return;

                // Special handling for Mario pipe - scene transition
                if (boundary.name === "mariopipe") {
                  k.play("pipesound", { volume: 0.7 });
                  window.gameState.transitionToScene("secretRoom", { x: 400, y: 300 });
                  return;
                }

                stopPlayerMovement();

                // Play special sound for master sword
                if (boundary.name === "master sword") {
                  k.play("tp-press-start", { volume: 0.7 });
                }

                displayDialogue(
                  dialogueData[boundary.name] || `This is ${boundary.name}. No dialogue set yet.`,
                  () => {
                    player.isInDialogue = false;
                  }
                );
              });
            }
          }
        }
      }

      // Process foreground objects
      if (layer.name === "Foreground") {
        for (const entity of layer.objects || []) {

          // Create lampost
          if (entity.name === "Lampost") {
            // Create visual lamppost sprite
            const lampost = k.add([
              k.sprite("lampost"),
              k.pos(entity.x * scaleFactor, (entity.y + entity.height) * scaleFactor),
              k.anchor("botleft"),
              k.scale(scaleFactor),
              k.z(100),
              "foreground"
            ]);

            // Create separate collision box using the map.json dimensions
            const lampostCollision = k.add([
              k.rect(entity.width * scaleFactor, entity.height * scaleFactor),
              k.pos(entity.x * scaleFactor, entity.y * scaleFactor),
              k.area(),
              k.body({ isStatic: true }),
              k.opacity(0), // Invisible collision box
              k.z(1),
              "Lampost" // Tag for collision detection
            ]);

            console.log("Created lamppost collision at:", entity.x * scaleFactor, entity.y * scaleFactor,
                       "size:", entity.width * scaleFactor, entity.height * scaleFactor);

            // Set up lamppost collision
            player.onCollide("Lampost", () => {
              if (player.isInDialogue) return;

              console.log("Lamppost collision triggered!");
              stopPlayerMovement();
              displayDialogue(
                "lampposting ...",
                () => {
                  player.isInDialogue = false;
                }
              );
            });

            interactiveObjects.push(lampost);
            interactiveObjects.push(lampostCollision);
          }          // Create plant
          if (entity.name === "plant") {
            const plant = k.add([
              k.sprite("planthalf"),
              k.pos(entity.x * scaleFactor, entity.y * scaleFactor),
              k.anchor("center"),
              k.scale(scaleFactor),
              k.z(100),
              "foreground"
            ]);
            interactiveObjects.push(plant);
          }

          // Create sign
          if (entity.name === "signforeground") {
            const sign = k.add([
              k.sprite("sign"),
              k.pos(entity.x * scaleFactor, entity.y * scaleFactor),
              k.anchor("botright"),
              k.scale(scaleFactor),
              k.z(100),
              "foreground"
            ]);
            interactiveObjects.push(sign);
          }
        }
      }

      // Process chickens
      if (layer.name === "Chickens") {
        for (const entity of layer.objects || []) {
          if (entity.name === "chicken") {
            // Create two chickens with AI behavior
            const chicken1 = createChickenWithAI(entity.x * scaleFactor, entity.y * scaleFactor, false);
            const chicken2 = createChickenWithAI((entity.x * scaleFactor) + 40, (entity.y * scaleFactor) + 20, true);

            // Set up chicken collision dialogue
            [chicken1, chicken2].forEach(chicken => {
              player.onCollide("chicken", (chickenObj) => {
                if (!player.isInDialogue) {
                  stopPlayerMovement();
                  displayDialogue(
                    dialogueData["chicken"] || "Bawk bawk! 🐔",
                    () => {
                      player.isInDialogue = false;
                    }
                  );
                }
              });
            });

            interactiveObjects.push(chicken1, chicken2);
          }
        }
      }
    }

  } catch (error) {
    console.warn("Could not load interactive objects:", error);
  }

  return interactiveObjects;
}

// Helper function to create chicken with AI
function createChickenWithAI(x, y, isSecondChicken = false) {
  const chicken = k.add([
    k.sprite("chicken", { anim: "idle" }),
    k.pos(x, y),
    k.anchor("center"),
    k.scale(scaleFactor * 0.65),
    k.z(100),
    k.body(),
    k.area({
      shape: new k.Rect(k.vec2(0, 0), 8, 8),
    }),
    {
      wanderTimer: 0,
      wanderDirection: k.vec2(0, 0),
      speed: isSecondChicken ? 8 : 10,
      originalPos: k.vec2(x, y),
      maxWanderDistance: isSecondChicken ? 35 : 40,
      isMoving: false,
      pauseTimer: 0,
      isSecondChicken,
    },
    "chicken",
    "foreground"
  ]);

  // Add wander behavior
  chicken.on("startWandering", () => {
    chicken.isMoving = true;
    chicken.play("walk");
    chicken.wanderTimer = k.rand(isSecondChicken ? 0.5 : 1, isSecondChicken ? 3 : 2.5);
    chicken.trigger("calculateDirection");
  });

  chicken.on("calculateDirection", () => {
    const distanceFromOrigin = chicken.pos.dist(chicken.originalPos);

    if (distanceFromOrigin > chicken.maxWanderDistance) {
      // Return to origin if too far
      chicken.wanderDirection = chicken.originalPos.sub(chicken.pos).unit();
    } else {
      // Random direction
      const directions = [
        k.vec2(1, 0), k.vec2(-1, 0), k.vec2(0, 1), k.vec2(0, -1),
        k.vec2(1, 1).unit(), k.vec2(-1, 1).unit(), k.vec2(1, -1).unit(), k.vec2(-1, -1).unit()
      ];
      chicken.wanderDirection = k.choose(directions);
    }
  });

  chicken.on("stopWandering", () => {
    chicken.isMoving = false;
    chicken.play("idle");
    chicken.wanderDirection = k.vec2(0, 0);
    chicken.pauseTimer = k.rand(1, 3);
  });

  // Update loop
  chicken.onUpdate(() => {
    if (chicken.isMoving) {
      chicken.wanderTimer -= k.dt();
      chicken.move(chicken.wanderDirection.scale(chicken.speed));

      if (chicken.wanderTimer <= 0) {
        chicken.trigger("stopWandering");
      }
    } else {
      chicken.pauseTimer -= k.dt();
      if (chicken.pauseTimer <= 0) {
        chicken.trigger("startWandering");
      }
    }
  });

  // Start initial wander
  chicken.trigger("startWandering");

  return chicken;
}

// Create and setup player with all systems
export function setupPlayer(x = 100, y = 200) {
  const player = createPlayer(x, y);
  const playerAnimations = createPlayerAnimations();
  playerAnimations.init(player);

  // Make player globally accessible
  window.currentPlayer = player;

  return player;
}

// Setup UI overlays
export function setupUI(initialRupeeCount = 0) {
  // Create rupee counter
  const rupeeOverlay = createRupeeCounter(initialRupeeCount);
  const rupeeCounterManager = createRupeeCounterManager(rupeeOverlay.rupeeCounterOverlay, initialRupeeCount);
  rupeeCounterManager.init();

  // Make globally accessible
  window.currentRupeeManager = rupeeCounterManager;

  return {
    rupeeOverlay,
    rupeeCounterManager,
  };
}

// Create rupee collectibles
export function createRupee(x, y, id = null) {
  // Generate a unique ID if not provided (based on position)
  const rupeeId = id || `rupee_${Math.round(x)}_${Math.round(y)}`;

  // Check if this rupee has already been collected
  if (window.gameState && window.gameState.playerData.collectedRupees.has(rupeeId)) {
    console.log(`Rupee ${rupeeId} already collected, not spawning`);
    console.log("Collected rupees:", Array.from(window.gameState.playerData.collectedRupees));
    return null; // Don't create the rupee
  }

  console.log(`Creating rupee with ID: ${rupeeId} at position (${x}, ${y})`);
  console.log("Currently collected rupees:", Array.from(window.gameState?.playerData?.collectedRupees || []));

  const rupee = k.add([
    k.sprite("rupee"),
    k.pos(x, y),
    k.area({ scale: 0.5 }), // Half the size of the sprite for hitbox - NO k.body() to avoid solid collision
    k.anchor("center"),
    k.scale(scaleFactor),
    k.z(100),
    "rupee",
    {
      rupeeId: rupeeId // Store the ID on the rupee object
    }
  ]);

  console.log("Created rupee at:", x, y, "with ID:", rupeeId);

  // Direct collision detection with player
  rupee.onUpdate(() => {
    const player = k.get("player")[0];
    if (player && rupee.isColliding(player)) {
      console.log("Rupee detected collision with player!");
      rupee.trigger("collected", player);
    }
  });

  // Rupee collection event
  rupee.on("collected", (player) => {
    console.log("Rupee collected event triggered!");

    // Mark this rupee as collected in game state
    if (window.gameState && rupee.rupeeId) {
      window.gameState.playerData.collectedRupees.add(rupee.rupeeId);
      console.log(`Marked rupee ${rupee.rupeeId} as collected`);
      console.log("Total collected rupees:", window.gameState.playerData.collectedRupees.size);
      console.log("Collected IDs:", Array.from(window.gameState.playerData.collectedRupees));
    }

    k.destroy(rupee);

    // Play collection sound
    k.play("tp-get-rupee", { volume: 0.5 });

    // Update rupee counter
    if (window.currentRupeeManager) {
      window.currentRupeeManager.overlay.trigger("increment", 1);
      console.log("Rupee counter incremented");
    } else {
      console.warn("No rupee manager found!");
    }

    console.log("Rupee collected!");
  });

  return rupee;
}

// Create terminal objects
export function createTerminal(x, y, config = {}) {
  const terminal = k.add([
    k.sprite("terminal"),
    k.pos(x, y),
    k.area(),
    k.body({ isStatic: true }),
    k.scale(1),
    "terminal",
  ]);

  // Setup terminal dialogue
  createTerminalDialogue(terminal, {
    welcomeMessage: config.welcomeMessage || "Welcome to my portfolio terminal! What would you like to explore?",
    portfolioText: config.portfolioText || "📄 View Resume/CV",
    portfolioPath: config.portfolioPath || "./Curriculum Vitae.pdf",
    videoText: config.videoText || "🎥 Watch Demo Video",
    videoPath: config.videoPath || "./demo-video.mp4",
    closeText: config.closeText || "❌ Close Terminal",
  });

  return terminal;
}

// Create chicken NPC
export function createChicken(x, y) {
  const chicken = k.add([
    k.sprite("chicken", { anim: "idle" }),
    k.pos(x, y),
    k.area(),
    k.body(),
    k.scale(scaleFactor),
    "chicken",
    {
      speed: 50,
      direction: k.vec2(1, 0),
      moveTimer: 0,
      idleTime: k.rand(1, 3),
    },
  ]);

  // Chicken AI behavior
  chicken.on("wander", () => {
    if (k.rand() > 0.7) {
      const directions = [
        k.vec2(1, 0),
        k.vec2(-1, 0),
        k.vec2(0, 1),
        k.vec2(0, -1),
        k.vec2(0, 0), // Idle
      ];
      chicken.direction = k.choose(directions);

      // Update animation based on movement
      if (chicken.direction.eq(k.vec2(0, 0))) {
        chicken.play("idle");
      } else {
        chicken.play("walk");
      }
    }
  });

  // Update chicken behavior
  chicken.onUpdate(() => {
    chicken.moveTimer += k.dt();

    if (chicken.moveTimer >= chicken.idleTime) {
      chicken.trigger("wander");
      chicken.moveTimer = 0;
      chicken.idleTime = k.rand(1, 3);
    }

    // Move chicken
    if (!chicken.direction.eq(k.vec2(0, 0))) {
      chicken.move(chicken.direction.scale(chicken.speed));
    }
  });

  return chicken;
}

// Initialize complete scene
export async function initializeMainScene(playerPos = { x: 100, y: 200 }) {
  // Load main map data to find spawn points
  let mapData;
  let spawnPos = playerPos; // Default to passed position

  try {
    const response = await fetch("/map.json");
    if (response.ok) {
      mapData = await response.json();

      // Look for spawn point in map data
      const layers = mapData.layers || [];
      for (const layer of layers) {
        if (layer.name === "Foreground" || layer.name === "Spawn" || layer.name === "objects 1" || layer.name === "objects") {
          for (const entity of layer.objects || []) {
            if (entity.name === "player" || entity.name === "spawn") {
              // Found spawn point, use those coordinates
              spawnPos = {
                x: entity.x * scaleFactor,
                y: entity.y * scaleFactor
              };
              console.log("Found spawn point at:", spawnPos);
              break;
            }
          }
          if (spawnPos !== playerPos) break; // Exit outer loop if spawn found
        }
      }
    }
  } catch (error) {
    console.warn("Could not load map.json, using default spawn position:", error);
  }

  // Setup map and boundaries
  const { map, boundaries } = await setupMap();

  // Setup player at spawn position
  const player = setupPlayer(spawnPos.x, spawnPos.y);

  // Setup UI
  const ui = setupUI(window.gameState?.playerData?.rupeeCount || 0);

  // Initialize collision systems
  initializeCollisionSystems(player, ui.rupeeCounterManager);

  // Create interactive objects from map data (handles rupees, objects, chickens, etc.)
  const interactiveObjects = await createInteractiveObjects(player);

  // Create terminal system
  const terminalSystem = createTerminalSystem(player, ui.rupeeCounterManager);

  // Create rupees from map data (if not already created by interactive objects)
  const rupees = [];
  let rupeeEntitiesFound = 0; // Track how many rupee entities exist in map

  // Look for rupees in Foreground layer
  if (mapData && mapData.layers) {
    for (const layer of mapData.layers) {
      if (layer.name === "Foreground") {
        for (const entity of layer.objects || []) {
          if (entity.name === "rupee") {
            rupeeEntitiesFound++; // Count rupee entities regardless of whether they spawn
            console.log("Creating rupee at:", entity.x, entity.y);
            // Use entity coordinates and scale them properly
            // Create unique ID based on UNSCALED map position for consistency
            const rupeeId = `map_rupee_${entity.x}_${entity.y}`;
            const rupee = createRupee(entity.x * scaleFactor, entity.y * scaleFactor, rupeeId);
            if (rupee) {
              rupees.push(rupee);
            }
          }
        }
      }
    }
  }

  // Fallback: Create some sample rupees if none found in map
  if (rupeeEntitiesFound === 0) {
    console.log("No rupees found in map, creating fallback rupees");
    const fallbackRupees = [
      createRupee(300, 400, "fallback_1"),
      createRupee(500, 300, "fallback_2"),
      createRupee(700, 500, "fallback_3"),
      createRupee(200, 600, "fallback_4"),
      createRupee(800, 200, "fallback_5")
    ];
    // Only push non-null rupees
    rupees.push(...fallbackRupees.filter(r => r !== null));
  }

  return {
    map,
    boundaries,
    player,
    ui,
    rupees,
    interactiveObjects,
    terminalSystem,
  };
}
