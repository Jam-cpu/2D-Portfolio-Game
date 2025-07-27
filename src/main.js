import { dialogueData, scaleFactor } from "./constants";
import { k } from "./kaboomCtx";
import { displayDialogue, displayPDF, setCamScale } from "./utils";

// Load player sprite sheet with movement animations
k.loadSprite("spritesheet", "/spritesheet.png", {
  sliceX: 39,
  sliceY: 31,
  anims: {
    "idle-down": 936,
    "walk-down": { from: 936, to: 939, loop: true, speed: 8 },
    "idle-side": 975,
    "walk-side": { from: 975, to: 978, loop: true, speed: 8 },
    "idle-up": 1014,
    "walk-up": { from: 1014, to: 1017, loop: true, speed: 8 },
  },
});

// Load environment and UI sprites
k.loadSprite("map", "/map.png");
k.loadSprite("secretRoomMap", "/Secret room map.png");
k.loadSprite("lampost", "/lampost.png");
k.loadSprite("rupee", "/rupee.png");
k.loadSprite("rupeeicon", "/rupeeicon.png");
k.loadSprite("rupeeiconresize", "/rupeeiconresize.png");
k.loadSprite("pot", "/pot.png");
k.loadSprite("planthalf", "/planthalf.png");
k.loadSprite("marioPipe", "/tubo-mario-small.png");

// Load chicken sprite sheet with various animations
k.loadSprite("chicken", "/Chicken Sprite Sheet.png", {
  sliceX: 8,
  sliceY: 10,
  anims: {
    idle : { from: 0,  to: 7,  loop: true, speed: 4 },
    eat  : { from: 8,  to: 15, loop: true, speed: 4 },
    walk : { from: 16, to: 23, loop: true, speed: 6 },
    happy: { from: 24, to: 31, loop: true, speed: 4 },
    flap : { from: 32, to: 39, loop: true, speed: 6 },
  },
});

// Load audio files
k.loadSound("background-music", "/Eterna City (Night).mp3");
k.loadSound("tp-press-start", "/TP_PressStart.wav");
k.loadSound("tp-get-rupee", "/TP_Get_Rupee.wav");
k.loadSound("rickroll", "/rickroll.mp3");
k.loadSound("pot-shatter", "/OOT_Pot_Shatter.wav");

k.setBackground(k.Color.fromHex("#311047"));

// Global game state for scene transitions
window.gameState = {
  currentScene: "main",
  playerData: {
    rupeeCount: 0,
    position: { x: 0, y: 0 }
  },

  // Scene transition with fade effect
  transitionToScene(sceneName, playerPos = null) {
    // Store current player data
    if (window.currentPlayer) {
      this.playerData.rupeeCount = window.rupeeCounterManager ? window.rupeeCounterManager.count : 0;
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

// Global function to handle PDF opening from dialogue buttons
window.openPDF = function(pdfPath)
{
  displayPDF(pdfPath, () => {
    // Re-enable player movement after PDF closes
    if (window.currentPlayer)
    {
      window.currentPlayer.isInDialogue = false;
    }
  });
};

// Global function to play rickroll sound from dialogue buttons
let isRickrollPlaying = false;
window.playRickroll = function()
{
  // Don't play if already playing
  if (isRickrollPlaying)
  {
    return;
  }

  isRickrollPlaying = true;

  // Fade out background music
  if (window.currentBackgroundMusic)
  {
    k.tween(window.currentBackgroundMusic.volume, 0, 0.5, (val) => {
      window.currentBackgroundMusic.volume = val;
    });
  }

  // Play rickroll
  const rickrollSound = k.play("rickroll", { volume: 0.7 });

  // When rickroll finishes, restore background music and reset flag
  rickrollSound.onEnd(() => {
    isRickrollPlaying = false;

    // Fade background music back in
    if (window.currentBackgroundMusic)
    {
      k.tween(0, 0.5, 1, (val) => {
        window.currentBackgroundMusic.volume = val;
      });
    }
  });
};

k.scene("main", async () => {
  console.log("🏠 MAIN SCENE STARTING...");

  // Start background music with fade in (only if not already playing)
  if (!window.currentBackgroundMusic || window.currentBackgroundMusic.paused) {
    console.log("Starting main scene background music");
    const music = k.play("background-music", { volume: 0, loop: true });

    // Store background music globally for rickroll function access
    window.currentBackgroundMusic = music;

    // Fade in the music over 3 seconds
    k.tween(0, 0.5, 3, (val) => {
      music.volume = val;
    });
  } else {
    console.log("Background music already playing, continuing...");
  }

  // Function to fade out music
  function fadeOutMusic()
  {
    if (window.currentBackgroundMusic) {
      k.tween(window.currentBackgroundMusic.volume, 0, 2, (val) => {
        window.currentBackgroundMusic.volume = val;
      }, k.easings.easeOutQuad);
    }
  }

  // Function to fade in music
  function fadeInMusic()
  {
    if (window.currentBackgroundMusic) {
      k.tween(window.currentBackgroundMusic.volume, 0.5, 2, (val) => {
        window.currentBackgroundMusic.volume = val;
      }, k.easings.easeInQuad);
    }
  }

  const mapData = await fetch("/map.json").then((res) => res.json());
  const layers = mapData.layers;

  const map = k.add([k.sprite("map"), k.pos(0), k.scale(scaleFactor)]);

  // Create rupee icon overlay
  const rupeeIconOverlay = k.add([
    k.sprite("rupeeiconresize"),
    k.pos(16, 30),
    k.scale(1.2),
    k.fixed(),
    k.z(200),
  ]);

  // Create rupee counter text overlay
  const rupeeCounterOverlay = k.add([
    k.text("0", {
      size: 45,
    }),
    k.pos(73, 35),
    k.color(0, 255, 153), // Green color
    k.fixed(),
    k.z(200),
  ]);

  // Create rupee counter with custom events
  const rupeeCounterManager = {
    count: window.gameState.playerData.rupeeCount || 0,
    overlay: rupeeCounterOverlay,

    // Event handlers
    init() {
      this.overlay.on("update", () => {
        this.overlay.text = this.count.toString();
      });

      this.overlay.on("increment", (amount = 1) => {
        this.count += amount;
        window.gameState.playerData.rupeeCount = this.count; // Update global state
        this.overlay.trigger("update");

        // Trigger achievements or special effects
        if (this.count >= 10 && this.count < 20) {
          player.trigger("achievement", "collector");
        } else if (this.count >= 50) {
          player.trigger("achievement", "treasure_hunter");
        }
      });

      // Initialize display
      this.overlay.trigger("update");
    }
  };

  // Make rupee counter globally accessible
  window.rupeeCounterManager = rupeeCounterManager;

  // Initialize rupee counter events
  rupeeCounterManager.init();

  const player = k.make([
    k.sprite("spritesheet", { anim: "idle-down" }),
    k.area({ shape: new k.Rect(k.vec2(0, 3), 10, 10) }),
    k.body(),
    k.anchor("center"),
    k.pos(),
    k.scale(scaleFactor),
    k.z(50), // Set z-index so lamppost can render in front
    {
      speed: 250,
      direction: "down",
      isInDialogue: false,
    },
    "player",
  ]);

  // Setup player custom events
  player.on("collectRupee", (rupee) => {
    // Play rupee pickup sound
    k.play("tp-get-rupee", { volume: 0.8 });
    // Make the rupee disappear
    rupee.destroy();
    // Update counter through event system
    rupeeCounterManager.overlay.trigger("increment");
  });

  player.on("hitPot", (pot) => {
    if (pot.originalName === "pot 2" && !player.isInDialogue) {
      pot.trigger("showDialogue");
    } else if (pot.originalName !== "pot 2") {
      pot.trigger("break");
    }
  });

  player.on("achievement", (type) => {
    // Could add visual effects, sounds, or notifications here
    console.log(`Achievement unlocked: ${type}!`);
    // Future: Display achievement popup, play special sound, etc.
  });

  for (const layer of layers)
  {
    if (layer.name === "Boundary")
    {
      for (const boundary of layer.objects)
      {
        // Add collision for ALL objects (walls and interactive objects)
        const boundaryObj = map.add([
          k.area({
            shape: new k.Rect(k.vec2(0), boundary.width, boundary.height),
          }),
          k.body({ isStatic: true }),
          k.pos(boundary.x, boundary.y),
          boundary.name || "wall", // Use "wall" for unnamed objects
        ]);

        // Only add dialogue for objects that have names (interactive objects)
        if (boundary.name)
        {
          // Special handling for pot 2 - create visual sprite
          if (boundary.name === "pot 2")
          {
            // Create pot sprite centered in the boundary box, moved down by 3 pixels
            const potSprite = k.add([
              k.sprite("pot"),
              k.pos(
                (boundary.x + boundary.width / 2) * scaleFactor, // Center horizontally in boundary box
                ((boundary.y + boundary.height / 2) + 1) * scaleFactor // Center vertically and move down 3 pixels
              ),
              k.anchor("center"), // Anchor from center to ensure proper centering
              k.scale(scaleFactor),
              k.z(100), // Higher z-index than player (50) to render in front
              k.area(), // Add collision area for player interaction
              "pot", // Tag for collision detection
              "foreground",
              {
                boundaryRef: boundaryObj, // Store reference to boundary for removal
                originalName: boundary.name // Store the original boundary name for dialogue
              }
            ]);

            // Setup pot custom events
            potSprite.on("showDialogue", () => {
              player.isInDialogue = true;
              displayDialogue(
                dialogueData["pot 2"] || "Clank!",
                () => {
                  player.isInDialogue = false;
                  potSprite.trigger("break");
                }
              );
            });

            potSprite.on("break", () => {
              // Play pot shatter sound
              k.play("pot-shatter", { volume: 0.8 });

              // Create a rupee at the pot's position immediately
              const rupeeFromPot = k.add([
                k.sprite("rupee"),
                k.pos(potSprite.pos.x, potSprite.pos.y), // Same position as the pot
                k.anchor("center"),
                k.scale(scaleFactor),
                k.z(100),
                k.area(),
                "rupee",
                "foreground"
              ]);

              // Remove the boundary collision if it exists
              if (potSprite.boundaryRef)
              {
                potSprite.boundaryRef.destroy();
              }
              // Make the pot disappear
              potSprite.destroy();
            });
          }
          else
          {
            // Regular dialogue handling for other objects
            player.onCollide(boundary.name, () => {
              // Special handling for Mario pipe - scene transition
              if (boundary.name === "mariopipe") {
                // Play pipe sound effect
                k.play("tp-press-start", { volume: 0.7 });

                // Transition to secret room
                window.gameState.transitionToScene("secretRoom", { x: 400, y: 300 });
                return;
              }

              player.isInDialogue = true;

              // Play special sound effect for master sword
              if (boundary.name === "master sword")
              {
                k.play("tp-press-start", { volume: 0.7 });
              }

              displayDialogue(
                dialogueData[boundary.name] || `This is ${boundary.name}. No dialogue set yet.`,
                () => {player.isInDialogue = false;}
              );
            });
          }
        }
      }
      continue;
    }

    if (layer.name === "Spawn")
    {
      for (const entity of layer.objects)
      {
        if (entity.name === "player" || !entity.name)
        {
          // Player spawn (first unnamed or named "player" spawn point)
          // Use saved position if returning from another scene, otherwise use map spawn
          if (window.gameState.currentScene === "main" && window.gameState.playerData.position.x !== 0) {
            player.pos = k.vec2(
              window.gameState.playerData.position.x,
              window.gameState.playerData.position.y
            );
          } else {
            player.pos = k.vec2(
              (map.pos.x + entity.x) * scaleFactor,
              (map.pos.y + entity.y) * scaleFactor
            );
          }

          k.add(player);
          // Make player available globally for PDF overlay
          window.currentPlayer = player;

          // Add rupee pickup collision handler
          player.onCollide("rupee", (rupee) => {
            player.trigger("collectRupee", rupee);
          });

          // Add pot breaking collision handler
          player.onCollide("pot", (pot) => {
            player.trigger("hitPot", pot);
          });

        }
      }
    }

    if (layer.name === "Foreground")
    {
      for (const entity of layer.objects)
      {
        if (entity.name === "Lampost")
        {
          // Create lamppost entity that renders in front of player
          k.add([
            k.sprite("lampost"),
            k.pos(entity.x * scaleFactor, (entity.y + entity.height) * scaleFactor), // Position from bottom of boundary box
            k.anchor("botleft"), // Anchor from bottom-left instead of top-left
            k.scale(scaleFactor),
            k.z(100), // Higher z-index than player (50) to render in front
            "foreground"
          ]);
        }

        if (entity.name === "rupee")
        {
          // Create rupee entity centered in the boundary box
          const rupeeObj = k.add([
            k.sprite("rupee"),
            k.pos(
              (entity.x + entity.width / 2) * scaleFactor, // Center horizontally in boundary box
              (entity.y + entity.height / 2) * scaleFactor // Center vertically in boundary box
            ),
            k.anchor("center"), // Anchor from center to ensure proper centering
            k.scale(scaleFactor),
            k.z(100), // Higher z-index than player (50) to render in front
            k.area(), // Add collision area for pickup detection
            "rupee", // Tag for collision detection
            "foreground"
          ]);
        }

        if (entity.name === "plant")
        {
          // Create plant entity at the pin point coordinates
          k.add([
            k.sprite("planthalf"),
            k.pos(
              entity.x * scaleFactor, // Use pin point x coordinate
              entity.y * scaleFactor  // Use pin point y coordinate
            ),
            k.anchor("center"), // Anchor from center to ensure proper centering
            k.scale(scaleFactor),
            k.z(100), // Higher z-index than player (50) to render in front
            "foreground"
          ]);
        }
      }
    }

    if (layer.name === "Chickens")
    {
      for (const entity of layer.objects)
      {
        if (entity.name === "chicken")
        {
          // Create first animated chicken
          const chicken1 = k.add([
            k.sprite("chicken", { anim: "idle" }),
            k.pos(
              entity.x * scaleFactor, // Use exact pin position
              entity.y * scaleFactor  // Use exact pin position
            ),
            k.anchor("center"),
            k.scale(scaleFactor * 0.65), // Make chicken a bit smaller
            k.z(100),
            k.body(), // Add physics body so chicken collides with walls/static boundaries
            k.area({
              shape: new k.Rect(k.vec2(-6, -6), 12, 12), // Bigger collision box (12x12 pixels centered)
            }),
            {
              wanderTimer: 0,
              wanderDirection: k.vec2(0, 0),
              speed: 10,
              originalPos: k.vec2(entity.x * scaleFactor, entity.y * scaleFactor), // Store original position
              maxWanderDistance: 40, // Max distance from original position
              isMoving: false,
              pauseTimer: 0,
            },
            "chicken",
            "foreground"
          ]);

          // Create second animated chicken 7 pixels away
          const chicken2 = k.add([
            k.sprite("chicken", { anim: "idle" }),
            k.pos(
              (entity.x * scaleFactor) + 7, // 7 pixels to the right
              entity.y * scaleFactor  // Same y position
            ),
            k.anchor("center"),
            k.scale(scaleFactor * 0.65), // Make chicken a bit smaller
            k.z(100),
            k.body(), // Add physics body so chicken collides with walls/static boundaries
            k.area({
              shape: new k.Rect(k.vec2(-6, -6), 12, 12), // Bigger collision box (12x12 pixels centered)
            }),
            {
              wanderTimer: 0,
              wanderDirection: k.vec2(0, 0),
              speed: 8, // Slightly different speed
              originalPos: k.vec2((entity.x * scaleFactor) + 7, entity.y * scaleFactor), // Store original position
              maxWanderDistance: 35, // Slightly smaller wander area
              isMoving: false,
              pauseTimer: 0,
              isSecondChicken: true, // Mark as second chicken for different behavior
            },
            "chicken",
            "foreground"
          ]);

          // Add wander behavior to both chickens
          [chicken1, chicken2].forEach((chicken) => {
            // Setup chicken custom events
            chicken.on("startWandering", () => {
              chicken.isMoving = true;
              chicken.play("walk");

              // Set random wander timer based on chicken type
              if (chicken.isSecondChicken)
              {
                chicken.wanderTimer = k.rand(0.5, 3);
              }
              else
              {
                chicken.wanderTimer = k.rand(1, 2.5);
              }

              // Calculate wander direction
              const distanceFromOriginal = chicken.pos.dist(chicken.originalPos);
              if (distanceFromOriginal > chicken.maxWanderDistance * 0.7)
              {
                const towardsCenter = chicken.originalPos.sub(chicken.pos).unit();
                const randomDirection = k.vec2(k.rand(-1, 1), k.rand(-1, 1)).unit();

                if (chicken.isSecondChicken)
                {
                  chicken.wanderDirection = towardsCenter.scale(0.5).add(randomDirection.scale(0.5)).unit();
                }
                else
                {
                  chicken.wanderDirection = towardsCenter.scale(0.7).add(randomDirection.scale(0.3)).unit();
                }
              }
              else
              {
                if (chicken.isSecondChicken)
                {
                  chicken.wanderDirection = k.vec2(k.rand(-1.5, 1.5), k.rand(-1.5, 1.5)).unit();
                }
                else
                {
                  chicken.wanderDirection = k.vec2(k.rand(-1, 1), k.rand(-1, 1)).unit();
                }
              }
            });

            chicken.on("stopWandering", () => {
              chicken.isMoving = false;
              chicken.wanderDirection = k.vec2(0, 0);

              // Set pause timer based on chicken type
              if (chicken.isSecondChicken)
              {
                chicken.pauseTimer = k.rand(1, 6);
              }
              else
              {
                chicken.pauseTimer = k.rand(2, 5);
              }

              // Randomly choose pause animation
              const anims = ["idle", "eat", "happy"];
              chicken.play(anims[Math.floor(k.rand(0, anims.length))]);
            });

            // Simplified onUpdate - just timer management and movement
            chicken.onUpdate(() => {
              if (chicken.isMoving)
              {
                chicken.wanderTimer -= k.dt();
                if (chicken.wanderTimer <= 0)
                {
                  chicken.trigger("stopWandering");
                }
                else
                {
                  // Check if too far from original position
                  const distanceFromOriginal = chicken.pos.dist(chicken.originalPos);
                  if (distanceFromOriginal > chicken.maxWanderDistance)
                  {
                    chicken.wanderDirection = chicken.originalPos.sub(chicken.pos).unit();
                  }
                  chicken.move(chicken.wanderDirection.scale(chicken.speed));
                }
              }
              else
              {
                chicken.pauseTimer -= k.dt();
                if (chicken.pauseTimer <= 0)
                {
                  chicken.trigger("startWandering");
                }
              }
            });

            // Player interaction with chicken - using events
            chicken.on("interactWithPlayer", () => {
              if (!player.isInDialogue)
              {
                player.isInDialogue = true;
                displayDialogue(
                  dialogueData.chicken || "Bawk bawk! 🐔",
                  () => {player.isInDialogue = false;}
                );
              }
            });
          });

          // Setup player-chicken collision outside the forEach loop
          player.onCollide("chicken", (chicken) => {
            chicken.trigger("interactWithPlayer");
          });
        }
      }
    }
  }



  setCamScale(k);

  k.onResize(() => {setCamScale(k);});

  k.onUpdate(() => {k.camPos(player.worldPos().x, player.worldPos().y + 100);});

  k.onMouseDown((mouseBtn) => {
    if (mouseBtn !== "left" || player.isInDialogue) return;

    const worldMousePos = k.toWorld(k.mousePos());
    player.moveTo(worldMousePos, player.speed);

    const mouseAngle = player.pos.angle(worldMousePos);

    const lowerBound = 50;
    const upperBound = 125;

    if (
      mouseAngle > lowerBound &&
      mouseAngle < upperBound &&
      player.curAnim() !== "walk-up"
    )
    {
      player.play("walk-up");
      player.direction = "up";
      return;
    }

    if (mouseAngle < -lowerBound &&
        mouseAngle > -upperBound &&
        player.curAnim() !== "walk-down")
    {
      player.play("walk-down");
      player.direction = "down";
      return;
    }

    if (Math.abs(mouseAngle) > upperBound)
    {
      player.flipX = false;
      if (player.curAnim() !== "walk-side") player.play("walk-side");
      player.direction = "right";
      return;
    }

    if (Math.abs(mouseAngle) < lowerBound)
    {
      player.flipX = true;
      if (player.curAnim() !== "walk-side") player.play("walk-side");
      player.direction = "left";
      return;
    }
  });

  k.onMouseRelease(() => {
    if (player.direction === "down")
    {
      player.play("idle-down");
      return;
    }
    if (player.direction === "up")
    {
      player.play("idle-up");
      return;
    }

    player.play("idle-side");
  });

  // Debug mode - press D to toggle collision boundaries visibility
  k.onKeyPress("d", () => {k.debug.inspect = !k.debug.inspect;});

  // Press M to fade out music (for demonstration)
  k.onKeyPress("m", () => {fadeOutMusic();});

  // Press N to fade in music (restore music)
  k.onKeyPress("n", () => {fadeInMusic();});

  // Scene cleanup - fade out music when leaving scene
  k.onSceneLeave(() => {fadeOutMusic();});
});

// Secret Room Scene
k.scene("secretRoom", async () => {
  console.log("🎮 SECRET ROOM SCENE STARTING...");

  // Stop background music in secret room
  if (window.currentBackgroundMusic) {
    console.log("Stopping background music for secret room");
    window.currentBackgroundMusic.stop();
    window.currentBackgroundMusic = null;
  }

  // Function to fade out music
  function fadeOutMusic()
  {
    if (window.currentBackgroundMusic) {
      k.tween(window.currentBackgroundMusic.volume, 0, 2, (val) => {
        window.currentBackgroundMusic.volume = val;
      }, k.easings.easeOutQuad);
    }
  }

  // Function to fade in music
  function fadeInMusic()
  {
    if (window.currentBackgroundMusic) {
      k.tween(window.currentBackgroundMusic.volume, 0.5, 2, (val) => {
        window.currentBackgroundMusic.volume = val;
      }, k.easings.easeInQuad);
    }
  }

  // Load secret room map data
  console.log("Secret Room: Starting to load map data...");

  let mapData;
  try {
    const response = await fetch("/Secret room map.tmj");
    console.log("Secret Room: Fetch response status:", response.status);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    mapData = await response.json();
    console.log("Secret Room: Map data loaded successfully");
  } catch (error) {
    console.error("Secret Room: Error loading map:", error);
    // Use fallback empty map structure
    mapData = { layers: [] };
  }

  const layers = mapData.layers;

  console.log("Secret Room: Map loaded, layers:", layers.length);
  console.log("Secret Room: Layer names:", layers.map(l => l.name));
  console.log("Secret Room: All layer data:", layers);

  const map = k.add([k.sprite("secretRoomMap"), k.pos(0), k.scale(scaleFactor)]);

  // Create rupee icon overlay
  const rupeeIconOverlay = k.add([
    k.sprite("rupeeiconresize"),
    k.pos(16, 30),
    k.scale(1.2),
    k.fixed(),
    k.z(200),
  ]);

  // Create rupee counter text overlay
  const rupeeCounterOverlay = k.add([
    k.text(window.gameState.playerData.rupeeCount.toString(), {
      size: 45,
    }),
    k.pos(73, 35),
    k.color(0, 255, 153),
    k.fixed(),
    k.z(200),
  ]);

  // Create rupee counter manager for secret room
  const rupeeCounterManager = {
    count: window.gameState.playerData.rupeeCount,
    overlay: rupeeCounterOverlay,

    init() {
      this.overlay.on("update", () => {
        this.overlay.text = this.count.toString();
      });

      this.overlay.on("increment", (amount = 1) => {
        this.count += amount;
        window.gameState.playerData.rupeeCount = this.count;
        this.overlay.trigger("update");
      });

      this.overlay.trigger("update");
    }
  };

  window.rupeeCounterManager = rupeeCounterManager;
  rupeeCounterManager.init();

  const player = k.make([
    k.sprite("spritesheet", { anim: "idle-down" }),
    k.area({ shape: new k.Rect(k.vec2(0, 3), 10, 10) }),
    k.body(),
    k.anchor("center"),
    k.pos(),
    k.scale(scaleFactor),
    k.z(50),
    {
      speed: 250,
      direction: "down",
      isInDialogue: false,
    },
    "player",
  ]);

  // Setup player custom events for secret room
  player.on("collectRupee", (rupee) => {
    k.play("tp-get-rupee", { volume: 0.8 });
    rupee.destroy();
    rupeeCounterManager.overlay.trigger("increment");
  });

  player.on("returnToMain", () => {
    console.log("Secret Room: Returning to main scene");
    k.play("tp-press-start", { volume: 0.7 });
    window.gameState.transitionToScene("main", { x: 200, y: 300 });
  });

  // Track if player was spawned
  let playerSpawned = false;

  console.log("Secret Room: About to process layers for player spawn...");

  // Process map layers
  for (const layer of layers)
  {
    console.log("Secret Room: Processing layer:", layer.name, "type:", layer.type);

    if (layer.name === "Boundary" || layer.name === "walls")
    {
      console.log("Secret Room: Processing boundary layer with", layer.objects?.length || 0, "objects");
      for (const boundary of layer.objects || [])
      {
        // Add collision for boundary objects
        const boundaryObj = map.add([
          k.area({
            shape: new k.Rect(k.vec2(0), boundary.width, boundary.height),
          }),
          k.body({ isStatic: true }),
          k.pos(boundary.x, boundary.y),
          boundary.name || "wall",
        ]);

        // Store exit pipe reference for later collision setup
        if (boundary.name === "exitpipe")
        {
          boundaryObj.tags = ["exitpipe"];
        }
      }
      continue;
    }

    if (layer.name === "Spawn" || layer.name === "objects 1" || layer.name === "Object Layer 1")
    {
      console.log("Secret Room: Processing spawn layer:", layer.name, "with", layer.objects?.length || 0, "objects");

      for (const entity of layer.objects || [])
      {
        console.log("Secret Room: Found entity:", entity.name, "at", entity.x, entity.y);

        if (entity.name === "player" || entity.name === "spawn" || !entity.name)
        {
          // Always use spawn coordinates from the secret room map, not saved position
          const spawnX = (map.pos.x + entity.x) * scaleFactor;
          const spawnY = (map.pos.y + entity.y) * scaleFactor;

          player.pos = k.vec2(spawnX, spawnY);
          console.log("Secret Room: Setting player position to:", spawnX, spawnY);
          console.log("Secret Room: Calculated from - map.pos:", map.pos, "entity pos:", entity.x, entity.y, "scaleFactor:", scaleFactor);

          k.add(player);
          window.currentPlayer = player;
          playerSpawned = true;

          console.log("Secret Room: Player added to scene");
          console.log("Secret Room: Player final position:", player.pos);
          console.log("Secret Room: Player world position:", player.worldPos());
          console.log("Secret Room: Player exists in scene:", k.get("player").length > 0);

          // Immediately center camera on player
          const initialCamPos = k.vec2(player.worldPos().x, player.worldPos().y + 100);
          k.camPos(initialCamPos);
          console.log("Secret Room: Camera immediately centered on player at:", initialCamPos);

          // Add rupee pickup collision handler
          player.onCollide("rupee", (rupee) => {
            player.trigger("collectRupee", rupee);
          });

          // Add exit pipe collision handler
          player.onCollide("exitpipe", () => {
            console.log("Secret Room: Player hit exit pipe");
            player.trigger("returnToMain");
          });

          break; // Exit loop once player is spawned
        }
      }
    }

    if (layer.name === "Foreground")
    {
      for (const entity of layer.objects)
      {
        if (entity.name === "rupee")
        {
          // Create rupee entity in secret room
          const rupeeObj = k.add([
            k.sprite("rupee"),
            k.pos(
              (entity.x + entity.width / 2) * scaleFactor,
              (entity.y + entity.height / 2) * scaleFactor
            ),
            k.anchor("center"),
            k.scale(scaleFactor),
            k.z(100),
            k.area(),
            "rupee",
            "foreground"
          ]);
        }

        // Add special secret room items here
        if (entity.name === "treasure")
        {
          // Special treasure that gives multiple rupees
          const treasureObj = k.add([
            k.sprite("rupee"), // Using rupee sprite for now, you can change this
            k.pos(
              (entity.x + entity.width / 2) * scaleFactor,
              (entity.y + entity.height / 2) * scaleFactor
            ),
            k.anchor("center"),
            k.scale(scaleFactor * 1.5), // Make it bigger
            k.z(100),
            k.area(),
            "treasure",
            "foreground",
            {
              value: 10 // Worth 10 rupees
            }
          ]);

          player.onCollide("treasure", (treasure) => {
            k.play("tp-get-rupee", { volume: 1.0 });
            for (let i = 0; i < treasure.value; i++) {
              rupeeCounterManager.overlay.trigger("increment");
            }
            treasure.destroy();
          });
        }
      }
    }
  }

  // Fallback: If no spawn point was found, place player at center of map
  if (!playerSpawned) {
    console.log("Secret Room: No spawn point found, using fallback position");
    player.pos = k.vec2(400, 300); // Fallback position
    k.add(player);
    window.currentPlayer = player;
    playerSpawned = true;
    console.log("Secret Room: Player spawned at fallback position:", player.pos);
    console.log("Secret Room: Player exists after fallback:", k.get("player").length > 0);

    // Immediately center camera on fallback player
    const fallbackCamPos = k.vec2(player.worldPos().x, player.worldPos().y + 100);
    k.camPos(fallbackCamPos);
    console.log("Secret Room: Camera centered on fallback player at:", fallbackCamPos);

    // Add collision handlers for fallback spawn
    player.onCollide("rupee", (rupee) => {
      player.trigger("collectRupee", rupee);
    });

    player.onCollide("exitpipe", () => {
      console.log("Secret Room: Player hit exit pipe");
      player.trigger("returnToMain");
    });
  }

  console.log("Secret Room: Final player spawn check - spawned:", playerSpawned);
  console.log("Secret Room: Players in scene:", k.get("player").length);
  console.log("Secret Room: All objects in scene:", k.get("*").length);

  setCamScale(k);

  // Immediately center camera on player
  if (player && player.worldPos) {
    const initialCamPos = k.vec2(player.worldPos().x, player.worldPos().y + 100);
    k.camPos(initialCamPos);
    console.log("Secret Room: Camera immediately positioned at:", initialCamPos);
  }

  k.onResize(() => {setCamScale(k);});
  k.onUpdate(() => {
    if (player && player.worldPos) {
      const camPos = k.vec2(player.worldPos().x, player.worldPos().y + 100);
      k.camPos(camPos);
    }
  });

  console.log("Secret Room: Camera setup complete");
  console.log("Secret Room: Player final check - position:", player.pos);
  console.log("Secret Room: Player final check - in scene:", k.get("player").length > 0);

  // Mouse controls (same as main scene)
  k.onMouseDown((mouseBtn) => {
    console.log("Secret Room: Mouse clicked:", mouseBtn, "Player in dialogue:", player.isInDialogue);

    if (mouseBtn !== "left" || player.isInDialogue) return;

    const worldMousePos = k.toWorld(k.mousePos());
    console.log("Secret Room: Moving player to:", worldMousePos, "Current player pos:", player.pos);

    player.moveTo(worldMousePos, player.speed);

    const mouseAngle = player.pos.angle(worldMousePos);
    const lowerBound = 50;
    const upperBound = 125;

    if (mouseAngle > lowerBound && mouseAngle < upperBound && player.curAnim() !== "walk-up")
    {
      player.play("walk-up");
      player.direction = "up";
      return;
    }

    if (mouseAngle < -lowerBound && mouseAngle > -upperBound && player.curAnim() !== "walk-down")
    {
      player.play("walk-down");
      player.direction = "down";
      return;
    }

    if (Math.abs(mouseAngle) > upperBound)
    {
      player.flipX = false;
      if (player.curAnim() !== "walk-side") player.play("walk-side");
      player.direction = "right";
      return;
    }

    if (Math.abs(mouseAngle) < lowerBound)
    {
      player.flipX = true;
      if (player.curAnim() !== "walk-side") player.play("walk-side");
      player.direction = "left";
      return;
    }
  });

  k.onMouseRelease(() => {
    if (player.direction === "down")
    {
      player.play("idle-down");
      return;
    }
    if (player.direction === "up")
    {
      player.play("idle-up");
      return;
    }
    player.play("idle-side");
  });

  // Debug mode
  k.onKeyPress("d", () => {k.debug.inspect = !k.debug.inspect;});

  // Music controls
  k.onKeyPress("m", () => {fadeOutMusic();});
  k.onKeyPress("n", () => {fadeInMusic();});

  // Return to main scene with R key (for testing)
  k.onKeyPress("r", () => {
    player.trigger("returnToMain");
  });

  // Scene cleanup
  k.onSceneLeave(() => {fadeOutMusic();});
});

k.go("main");