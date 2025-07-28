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
k.loadSprite("secretRoomMap", "/secretmap.png");
k.loadSprite("lampost", "/lampost.png");
k.loadSprite("rupee", "/rupee.png");
k.loadSprite("rupeeicon", "/rupeeicon.png");
k.loadSprite("rupeeiconresize", "/rupeeiconresize.png");
k.loadSprite("pot", "/pot.png");
k.loadSprite("planthalf", "/planthalf.png");
k.loadSprite("marioPipe", "/tubo-mario-small.png");
k.loadSprite("sign", "/sign.png");

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
k.loadSound("pipesound", "/pipesound.mp3");

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

// Global function to display video overlay
window.displayVideo = function(videoPath)
{
  // Disable player movement
  if (window.currentPlayer)
  {
    window.currentPlayer.isInDialogue = true;
  }

  // Create video overlay container
  const videoOverlay = document.createElement('div');
  videoOverlay.id = 'video-overlay';
  videoOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.9);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
    cursor: pointer;
  `;

  // Create video element
  const video = document.createElement('video');
  video.src = videoPath;
  video.style.cssText = `
    max-width: 80%;
    max-height: 80%;
    background-color: black;
    border: 2px solid #00ff00;
  `;
  video.controls = true;
  video.autoplay = true;
  video.volume = 0.7;

  // Create close button
  const closeButton = document.createElement('div');
  closeButton.innerHTML = '✕';
  closeButton.style.cssText = `
    position: absolute;
    top: 20px;
    right: 30px;
    color: white;
    font-size: 30px;
    font-weight: bold;
    cursor: pointer;
    background-color: rgba(255, 0, 0, 0.7);
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    justify-content: center;
    align-items: center;
    user-select: none;
  `;

  // Add elements to overlay
  videoOverlay.appendChild(video);
  videoOverlay.appendChild(closeButton);
  document.body.appendChild(videoOverlay);

  // Close video function
  const closeVideo = () => {
    document.body.removeChild(videoOverlay);
    // Re-enable player movement
    if (window.currentPlayer)
    {
      window.currentPlayer.isInDialogue = false;
    }
  };

  // Close on overlay click (but not on video)
  videoOverlay.addEventListener('click', (e) => {
    if (e.target === videoOverlay)
    {
      closeVideo();
    }
  });

  // Close on button click
  closeButton.addEventListener('click', closeVideo);

  // Close on Escape key
  const handleKeyPress = (e) => {
    if (e.key === 'Escape')
    {
      closeVideo();
      document.removeEventListener('keydown', handleKeyPress);
    }
  };
  document.addEventListener('keydown', handleKeyPress);

  // Auto-close when video ends
  video.addEventListener('ended', closeVideo);
};

k.scene("main", async () => {
  // WASD movement controls for desktop - declare early so dialogue callbacks can access them
  let isMovingWithWASD = false;
  let isMovingWithMouse = false;
  let currentMoveDirection = "";

  // Function to stop all player movement
  function stopPlayerMovement() {
    // Stop WASD movement
    isMovingWithWASD = false;
    isMovingWithMouse = false;
    currentMoveDirection = "";

    // Stop click movement
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

  // Start background music with fade in (only if not already playing)
  if (!window.currentBackgroundMusic || window.currentBackgroundMusic.paused) {
    // const music = k.play("background-music", { volume: 0, loop: true }); // Commented out for testing

    // Store background music globally for rickroll function access
    // window.currentBackgroundMusic = music; // Commented out for testing

    // Fade in the music over 3 seconds
    // k.tween(0, 0.5, 3, (val) => {
    //   music.volume = val;
    // }); // Commented out for testing
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

  // Create FPS display background box for testing
  const fpsBackground = k.add([
    k.rect(120, 35),
    k.pos(k.width() - 130, 20), // Top right corner with padding
    k.color(0, 0, 0), // Black background
    k.opacity(0.8),
    k.fixed(),
    k.z(199), // Behind the text
  ]);

  // Create FPS display for testing
  const fpsDisplay = k.add([
    k.text("FPS: 0", {
      size: 24,
    }),
    k.pos(k.width() - 125, 30), // Top right corner, centered in box
    k.color(255, 255, 255), // White color
    k.fixed(),
    k.z(200),
  ]);

  // Manual FPS calculation
  let frameCount = 0;
  let lastTime = 0;
  let fps = 0;

  // Update FPS display every frame
  fpsDisplay.onUpdate(() => {
    frameCount++;
    const currentTime = k.time();

    // Update FPS every second
    if (currentTime - lastTime >= 1.0) {
      fps = Math.round(frameCount / (currentTime - lastTime));
      frameCount = 0;
      lastTime = currentTime;
    }

    fpsDisplay.text = `FPS: ${fps}`;
  });  // Create rupee counter with custom events
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

  // Movement event system for cleaner WASD handling
  player.on("startMoving", (direction) => {
    isMovingWithWASD = true;
    isMovingWithMouse = false; // Stop mouse movement when WASD starts
    currentMoveDirection = direction;

    // Stop any existing mouse movement
    player.stop();

    if (direction === "up" && player.curAnim() !== "walk-up") {
      player.play("walk-up");
    } else if (direction === "down" && player.curAnim() !== "walk-down") {
      player.play("walk-down");
    } else if ((direction === "left" || direction === "right") && player.curAnim() !== "walk-side") {
      player.play("walk-side");
    }

    if (direction === "left") {
      player.flipX = true;
    } else if (direction === "right") {
      player.flipX = false;
    }
  });

  player.on("stopMoving", () => {
    isMovingWithWASD = false;
    isMovingWithMouse = false;
    currentMoveDirection = "";

    if (player.direction === "down") {
      player.play("idle-down");
    } else if (player.direction === "up") {
      player.play("idle-up");
    } else {
      player.play("idle-side");
    }
  });

  player.on("blocked", (direction) => {
    isMovingWithWASD = false;
    isMovingWithMouse = false;
    currentMoveDirection = "";

    if (direction === "up") {
      player.play("idle-up");
    } else if (direction === "down") {
      player.play("idle-down");
    } else {
      player.play("idle-side");
    }

    // Still update flip direction even when blocked
    if (direction === "left") {
      player.flipX = true;
    } else if (direction === "right") {
      player.flipX = false;
    }
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
              stopPlayerMovement();
              displayDialogue(
                dialogueData["pot 2"] || "Clank!",
                () => {
                  player.isInDialogue = false;
                  // Reset movement flags when dialogue closes
                  isMovingWithWASD = false;
                  currentMoveDirection = "";
                  // Ensure player is stopped
                  player.stop();
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
                k.play("pipesound", { volume: 0.7 });

                // Transition to secret room
                window.gameState.transitionToScene("secretRoom", { x: 400, y: 300 });
                return;
              }

              player.isInDialogue = true;
              stopPlayerMovement();

              // Play special sound effect for master sword
              if (boundary.name === "master sword")
              {
                k.play("tp-press-start", { volume: 0.7 });
              }

              displayDialogue(
                dialogueData[boundary.name] || `This is ${boundary.name}. No dialogue set yet.`,
                () => {
                  player.isInDialogue = false;
                  // Reset movement flags when dialogue closes
                  isMovingWithWASD = false;
                  currentMoveDirection = "";
                  // Ensure player is stopped
                  player.stop();
                }
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

        if (entity.name === "signforeground")
        {
          // Create sign entity at the specified coordinates
          k.add([
            k.sprite("sign"),
            k.pos(
              entity.x * scaleFactor, // Use exact x coordinate
              entity.y * scaleFactor  // Use exact y coordinate
            ),
            k.anchor("botright"), // Anchor from bottom-right for precise positioning
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
              shape: new k.Rect(k.vec2(0, 0), 8, 8), // Half-size collision box (8x8 pixels centered)
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
              shape: new k.Rect(k.vec2(0, 0), 8, 8), // Half-size collision box (8x8 pixels centered)
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
              if (chicken.isSecondChicken) {
                chicken.wanderTimer = k.rand(0.5, 3);
              } else {
                chicken.wanderTimer = k.rand(1, 2.5);
              }

              chicken.trigger("calculateDirection");
            });

            chicken.on("calculateDirection", () => {
              // Calculate wander direction
              const distanceFromOriginal = chicken.pos.dist(chicken.originalPos);
              if (distanceFromOriginal > chicken.maxWanderDistance * 0.7) {
                const towardsCenter = chicken.originalPos.sub(chicken.pos).unit();
                const randomDirection = k.vec2(k.rand(-1, 1), k.rand(-1, 1)).unit();

                if (chicken.isSecondChicken) {
                  chicken.wanderDirection = towardsCenter.scale(0.5).add(randomDirection.scale(0.5)).unit();
                } else {
                  chicken.wanderDirection = towardsCenter.scale(0.7).add(randomDirection.scale(0.3)).unit();
                }
              } else {
                if (chicken.isSecondChicken) {
                  chicken.wanderDirection = k.vec2(k.rand(-1.5, 1.5), k.rand(-1.5, 1.5)).unit();
                } else {
                  chicken.wanderDirection = k.vec2(k.rand(-1, 1), k.rand(-1, 1)).unit();
                }
              }
            });

            chicken.on("stopWandering", () => {
              chicken.isMoving = false;
              chicken.wanderDirection = k.vec2(0, 0);

              // Set pause timer based on chicken type
              if (chicken.isSecondChicken) {
                chicken.pauseTimer = k.rand(1, 6);
              } else {
                chicken.pauseTimer = k.rand(2, 5);
              }

              // Randomly choose pause animation
              const anims = ["idle", "eat", "happy"];
              chicken.play(anims[Math.floor(k.rand(0, anims.length))]);
            });

            chicken.on("updateMovement", () => {
              if (chicken.isMoving) {
                chicken.wanderTimer -= k.dt();
                if (chicken.wanderTimer <= 0) {
                  chicken.trigger("stopWandering");
                } else {
                  // Check if too far from original position
                  const distanceFromOriginal = chicken.pos.dist(chicken.originalPos);
                  if (distanceFromOriginal > chicken.maxWanderDistance) {
                    chicken.wanderDirection = chicken.originalPos.sub(chicken.pos).unit();
                  }
                  chicken.move(chicken.wanderDirection.scale(chicken.speed));
                }
              } else {
                chicken.pauseTimer -= k.dt();
                if (chicken.pauseTimer <= 0) {
                  chicken.trigger("startWandering");
                }
              }
            });

            // Use event system for update loop
            chicken.onUpdate(() => {
              chicken.trigger("updateMovement");
            });

            // Player interaction with chicken - using events
            chicken.on("interactWithPlayer", () => {
              if (!player.isInDialogue) {
                player.isInDialogue = true;
                stopPlayerMovement();
                displayDialogue(
                  dialogueData.chicken || "Bawk bawk! 🐔",
                  () => {
                    player.isInDialogue = false;
                    // Reset movement flags when dialogue closes
                    isMovingWithWASD = false;
                    currentMoveDirection = "";
                    // Ensure player is stopped
                    player.stop();
                  }
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

  k.onKeyDown((key) => {
    if (player.isInDialogue) return; // Don't move during dialogue

    // Don't process WASD if mouse movement is active
    if (isMovingWithMouse) return;

    const speed = player.speed;
    let moveVector = k.vec2(0, 0);
    let direction = "";

    if (key === "w" || key === "up") {
      moveVector.y = -speed;
      direction = "up";
    } else if (key === "s" || key === "down") {
      moveVector.y = speed;
      direction = "down";
    } else if (key === "a" || key === "left") {
      moveVector.x = -speed;
      direction = "left";
    } else if (key === "d" || key === "right") {
      moveVector.x = speed;
      direction = "right";
    }

    if (direction) {
      // Store the current position before attempting to move
      const oldPos = k.vec2(player.pos.x, player.pos.y);

      // Try to move
      player.move(moveVector);

      // Check if we actually moved (not blocked by collision)
      const didMove = !player.pos.eq(oldPos);

      // Update movement state and direction
      player.direction = direction;

      // Use event system for movement logic
      if (didMove) {
        player.trigger("startMoving", direction);
      } else {
        player.trigger("blocked", direction);
      }
    }
  });

  // Handle key release for WASD movement
  k.onKeyRelease((key) => {
    if (player.isInDialogue) return;

    // Don't process key release if mouse movement is active
    if (isMovingWithMouse) return;

    // Check if any movement keys are still being pressed
    const movementKeys = ["w", "a", "s", "d", "up", "left", "down", "right"];
    const anyKeyPressed = movementKeys.some(k.isKeyDown);

    if (!anyKeyPressed) {
      // Use event system for stop movement
      player.trigger("stopMoving");
    }
  });

  k.onMouseDown((mouseBtn) => {
    if (mouseBtn !== "left" || player.isInDialogue) return;

    // Stop any WASD movement when clicking - use event system
    player.trigger("stopMoving");

    // Set mouse movement flag
    isMovingWithMouse = true;
    isMovingWithWASD = false;

    const worldMousePos = k.toWorld(k.mousePos());
    player.moveTo(worldMousePos, player.speed);

    const mouseAngle = player.pos.angle(worldMousePos);

    const lowerBound = 50;
    const upperBound = 125;

    if (mouseAngle > lowerBound && mouseAngle < upperBound && player.curAnim() !== "walk-up") {
      player.play("walk-up");
      player.direction = "up";
      return;
    }

    if (mouseAngle < -lowerBound && mouseAngle > -upperBound && player.curAnim() !== "walk-down") {
      player.play("walk-down");
      player.direction = "down";
      return;
    }

    if (Math.abs(mouseAngle) > upperBound) {
      player.flipX = false;
      if (player.curAnim() !== "walk-side") player.play("walk-side");
      player.direction = "right";
      return;
    }

    if (Math.abs(mouseAngle) < lowerBound) {
      player.flipX = true;
      if (player.curAnim() !== "walk-side") player.play("walk-side");
      player.direction = "left";
      return;
    }
  });

  k.onMouseRelease(() => {
    // Clear mouse movement flag and use event system for mouse release
    isMovingWithMouse = false;
    player.trigger("stopMoving");
  });

  // Debug mode - press B to toggle collision boundaries visibility
  k.onKeyPress("b", () => {k.debug.inspect = !k.debug.inspect;});

  // Press M to fade out music (for demonstration)
  k.onKeyPress("m", () => {fadeOutMusic();});

  // Press N to fade in music (restore music)
  k.onKeyPress("n", () => {fadeInMusic();});

  // Scene cleanup - fade out music when leaving scene
  k.onSceneLeave(() => {fadeOutMusic();});
});

// Secret Room Scene
k.scene("secretRoom", async () => {
  // WASD movement controls for desktop (Secret Room) - declare early so dialogue callbacks can access them
  let isMovingWithWASD_SecretRoom = false;
  let currentMoveDirection_SecretRoom = "";

  // Function to stop all player movement (Secret Room)
  function stopPlayerMovement_SecretRoom() {
    // Stop WASD movement
    isMovingWithWASD_SecretRoom = false;
    currentMoveDirection_SecretRoom = "";

    // Stop click movement
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
  let mapData;
  try {
    const response = await fetch("/secretmap.json");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    mapData = await response.json();
  } catch (error) {
    console.error("Secret Room: Error loading map:", error);
    // Use fallback empty map structure
    mapData = { layers: [] };
  }

  const layers = mapData.layers;
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

  // Create FPS display background box for testing (Secret Room)
  const fpsBackground = k.add([
    k.rect(120, 35),
    k.pos(k.width() - 130, 20), // Top right corner with padding
    k.color(0, 0, 0), // Black background
    k.opacity(0.8),
    k.fixed(),
    k.z(199), // Behind the text
  ]);

  // Create FPS display for testing (Secret Room)
  const fpsDisplay = k.add([
    k.text("FPS: 0", {
      size: 24,
    }),
    k.pos(k.width() - 125, 30), // Top right corner, centered in box
    k.color(255, 255, 255), // White color
    k.fixed(),
    k.z(200),
  ]);

  // Manual FPS calculation for secret room
  let frameCount_SecretRoom = 0;
  let lastTime_SecretRoom = 0;
  let fps_SecretRoom = 0;

  // Update FPS display every frame
  fpsDisplay.onUpdate(() => {
    frameCount_SecretRoom++;
    const currentTime = k.time();

    // Update FPS every second
    if (currentTime - lastTime_SecretRoom >= 1.0) {
      fps_SecretRoom = Math.round(frameCount_SecretRoom / (currentTime - lastTime_SecretRoom));
      frameCount_SecretRoom = 0;
      lastTime_SecretRoom = currentTime;
    }

    fpsDisplay.text = `FPS: ${fps_SecretRoom}`;
  });  // Create rupee counter manager for secret room
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
    k.play("pipesound", { volume: 0.7 });
    window.gameState.transitionToScene("main", { x: 200, y: 300 });
  });

  // Track if player was spawned
  let playerSpawned = false;

  // Process map layers
  for (const layer of layers)
  {
    if (layer.name === "Boundary" || layer.name === "walls")
    {
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
        if (boundary.name === "exitpipe" || boundary.name === "pipe")
        {
          boundaryObj.tags = ["exitpipe"];
        }

        // Store secret PC reference for later collision setup
        if (boundary.name === "secret pc")
        {
          boundaryObj.tags = ["secretpc"];
        }

        // Store secret TV reference for later collision setup
        if (boundary.name === "secret tv")
        {
          boundaryObj.tags = ["secrettv"];
        }
      }
      continue;
    }

    if (layer.name === "Spawn" || layer.name === "objects 1" || layer.name === "objects")
    {
      for (const entity of layer.objects || [])
      {
        if (entity.name === "player" || entity.name === "spawn" || !entity.name)
        {
          // Always use spawn coordinates from the secret room map, not saved position
          const spawnX = (map.pos.x + entity.x) * scaleFactor;
          const spawnY = (map.pos.y + entity.y) * scaleFactor;

          player.pos = k.vec2(spawnX, spawnY);
          k.add(player);
          window.currentPlayer = player;
          playerSpawned = true;

          // Immediately center camera on player
          const initialCamPos = k.vec2(player.worldPos().x, player.worldPos().y + 100);
          k.camPos(initialCamPos);

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
            if (!terminalActive && !player.isInDialogue)
            {
              k.play("tp-press-start", { volume: 0.5 });
              openTerminal();
            }
          });

          // Add secret TV collision handler
          player.onCollide("secrettv", () => {
            if (!player.isInDialogue)
            {
              player.isInDialogue = true;
              stopPlayerMovement_SecretRoom();

              // Create dialogue with play button
              const tvDialogue = `
                <div style="text-align: center; padding: 20px;">
                  <p style="margin-bottom: 20px;">This ancient "CR"TV contains mysterious footage...</p>
                  <button onclick="window.displayVideo('/teletubbies.mp4'); document.getElementById('dialogue-ui').style.display = 'none';" style="background: #00ff00; color: black; border: none; padding: 10px 20px; font-size: 16px; cursor: pointer; border-radius: 5px;">▶️ Play Video</button>
                </div>
              `;

              displayDialogue(tvDialogue, () => {
                player.isInDialogue = false;
                // Reset movement flags when dialogue closes
                isMovingWithWASD_SecretRoom = false;
                currentMoveDirection_SecretRoom = "";
                // Ensure player is stopped
                player.stop();
              });
            }
          });

          // Don't break here - we need to process other entities in this layer
        }

        if (entity.name === "secret pc")
        {
          // Create PC collision area for interaction
          const pcObj = map.add([
            k.area({
              shape: new k.Rect(k.vec2(0), entity.width || 32, entity.height || 32),
            }),
            k.body({ isStatic: true }),
            k.pos(entity.x, entity.y),
            "secretpc"
          ]);
        }

        if (entity.name === "secret tv")
        {
          // Create TV collision boundary that actually blocks player movement
          const tvBoundary = map.add([
            k.area({
              shape: new k.Rect(k.vec2(0), entity.width || 40, entity.height || 32),
            }),
            k.body({ isStatic: true }),
            k.pos(entity.x, entity.y), // Don't apply scaleFactor here since map already handles scaling
            "secrettv",
            "wall" // Add wall tag so it behaves like other collision boundaries
          ]);
        }

        if (entity.name === "pipe")
        {
          // Create pipe collision boundary for exit functionality
          const pipeBoundary = map.add([
            k.area({
              shape: new k.Rect(k.vec2(0), entity.width || 16, entity.height || 16),
            }),
            k.body({ isStatic: true }),
            k.pos(entity.x, entity.y), // Don't apply scaleFactor here since map already handles scaling
            "exitpipe" // Use exitpipe tag for collision detection
          ]);
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
  if (!playerSpawned)
  {
    player.pos = k.vec2(400, 300); // Fallback position
    k.add(player);
    window.currentPlayer = player;
    playerSpawned = true;

    // Immediately center camera on fallback player
    const fallbackCamPos = k.vec2(player.worldPos().x, player.worldPos().y + 100);
    k.camPos(fallbackCamPos);

    // Add collision handlers for fallback spawn
    player.onCollide("rupee", (rupee) => {
      player.trigger("collectRupee", rupee);
    });

    player.onCollide("exitpipe", () => {
      player.trigger("returnToMain");
    });

    player.onCollide("secretpc", () => {
      if (!terminalActive && !player.isInDialogue)
      {
        k.play("tp-press-start", { volume: 0.5 });
        openTerminal();
      }
    });

    player.onCollide("secrettv", () => {
      if (!player.isInDialogue)
      {
        player.isInDialogue = true;
        stopPlayerMovement_SecretRoom();

        // Create dialogue with play button
        const tvDialogue = `
          <div style="text-align: center; padding: 20px;">
            <p style="margin-bottom: 20px;">This ancient TV contains mysterious footage...</p>
            <button onclick="window.displayVideo('/teletubbies.mp4'); document.getElementById('dialogue-ui').style.display = 'none';"
                    style="background: #00ff00; color: black; border: none; padding: 10px 20px; font-size: 16px; cursor: pointer; border-radius: 5px;">
              ▶️ Play Video
            </button>
          </div>
        `;

        displayDialogue(tvDialogue, () => {
          player.isInDialogue = false;
          // Reset movement flags when dialogue closes
          isMovingWithWASD_SecretRoom = false;
          currentMoveDirection_SecretRoom = "";
          // Ensure player is stopped
          player.stop();
        });
      }
    });
  }

  // Terminal System with event-driven architecture
  let terminalActive = false;
  let terminalHistory = [];
  let currentInput = "";
  let historyIndex = -1;

  // Terminal state management through events
  const terminalEvents = k.make([
    {
      isActive: false,
      history: [],
      currentInput: "",
      historyIndex: -1
    }
  ]);

  terminalEvents.on("open", () => {
    terminalActive = true;
    player.isInDialogue = true;
    stopPlayerMovement_SecretRoom();

    // Show terminal UI
    [terminalBg, terminalTitle, terminalOutput, terminalPrompt, terminalInput, terminalCursor].forEach(element => {
      element.hidden = false;
    });

    // Add welcome message
    terminalHistory = [
      "Welcome to SECRET TERMINAL v1.0",
      "Type 'help' for available commands",
      ""
    ];
    terminalEvents.trigger("updateDisplay");
    terminalEvents.trigger("startCursorBlink");
  });

  terminalEvents.on("close", () => {
    terminalActive = false;
    player.isInDialogue = false;
    currentInput = "";

    // Hide terminal UI
    [terminalBg, terminalTitle, terminalOutput, terminalPrompt, terminalInput, terminalCursor].forEach(element => {
      element.hidden = true;
    });
  });

  terminalEvents.on("updateDisplay", () => {
    const maxLines = 15;
    const displayHistory = terminalHistory.slice(-maxLines);
    terminalOutput.text = displayHistory.join("\n");
    terminalInput.text = currentInput;

    // Update cursor position
    const inputWidth = terminalInput.width;
    terminalCursor.pos.x = k.width() * 0.195 + inputWidth;
  });

  terminalEvents.on("executeCommand", (command) => {
    const parts = command.trim().split(" ");
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    terminalHistory.push(`> ${command}`);

    if (terminalCommands[cmd]) {
      const result = terminalCommands[cmd](args);
      if (result) {
        terminalHistory.push(result);
      }
    } else {
      terminalHistory.push(`Command not found: ${cmd}`);
    }

    terminalHistory.push("");
    terminalEvents.trigger("updateDisplay");
  });

  terminalEvents.on("startCursorBlink", () => {
    if (terminalActive) {
      k.wait(0.5, () => {
        if (terminalActive) {
          terminalCursor.hidden = !terminalCursor.hidden;
          terminalEvents.trigger("startCursorBlink");
        }
      });
    }
  });

  // Terminal UI Elements (initially hidden)
  const terminalBg = k.add([
    k.rect(k.width() * 0.7, k.height() * 0.6),
    k.color(0, 0, 0),
    k.opacity(0.9),
    k.pos(k.width() * 0.15, k.height() * 0.2),
    k.fixed(),
    k.z(300)
  ]);
  terminalBg.hidden = true;

  const terminalTitle = k.add([
    k.text("SECRET TERMINAL v1.0", { size: 20, font: "monospace" }),
    k.pos(k.width() * 0.17, k.height() * 0.22),
    k.color(0, 255, 0),
    k.fixed(),
    k.z(301)
  ]);
  terminalTitle.hidden = true;

  const terminalOutput = k.add([
    k.text("", { size: 14, font: "monospace" }),
    k.pos(k.width() * 0.17, k.height() * 0.27),
    k.color(0, 255, 0),
    k.fixed(),
    k.z(301)
  ]);
  terminalOutput.hidden = true;

  const terminalPrompt = k.add([
    k.text("> ", { size: 14, font: "monospace" }),
    k.pos(k.width() * 0.17, k.height() * 0.72),
    k.color(0, 255, 0),
    k.fixed(),
    k.z(301)
  ]);
  terminalPrompt.hidden = true;

  const terminalInput = k.add([
    k.text("", { size: 14, font: "monospace" }),
    k.pos(k.width() * 0.195, k.height() * 0.72),
    k.color(255, 255, 255),
    k.fixed(),
    k.z(301)
  ]);
  terminalInput.hidden = true;

  const terminalCursor = k.add([
    k.text("_", { size: 14, font: "monospace" }),
    k.pos(k.width() * 0.195, k.height() * 0.72),
    k.color(255, 255, 255),
    k.fixed(),
    k.z(301)
  ]);
  terminalCursor.hidden = true;

  // Terminal Commands
  const terminalCommands = {
    help: () => {
      return "Available commands:\n" +
             "help - Show this help message\n" +
             "whoami - Show current user\n" +
             "ls - List files\n" +
             "cat [file] - Read a file\n" +
             "hack - Try to hack the system\n" +
             "rupees - Mysterious rupee command\n" +
             "exit - Close terminal";
    },
    whoami: () => "user: anonymous_hacker",
    ls: () => "secrets.txt\npasswords.db\nbackdoor.exe\nrupee_generator.py",
    cat: (args) => {
      const file = args[0];
      switch(file)
      {
        case "secrets.txt":
          return "The secret room holds many mysteries...\nSome say there are hidden rupees everywhere.";
        case "passwords.db":
          return "admin:password123\nguest:guest\nhacker:1337h4x0r";
        case "backdoor.exe":
          return "[BINARY FILE] Cannot display binary content";
        case "rupee_generator.py":
          return "# Secret Rupee Generator\ndef generate_rupees():\n    return '💰' * 10";
        default:
          return `cat: ${file}: No such file or directory`;
      }
    },
    hack: () => {
      // Give player some rupees as a reward
      if (window.rupeeCounterManager)
      {
        for (let i = 0; i < 5; i++)
        {
          window.rupeeCounterManager.overlay.trigger("increment");
        }
      }
      return "ACCESS GRANTED! Hack successful!\n💰 5 rupees transferred to your account!";
    },
    rupees: () => {
      // Give player rupees
      if (window.rupeeCounterManager)
      {
        for (let i = 0; i < 3; i++)
        {
          window.rupeeCounterManager.overlay.trigger("increment");
        }
      }
      return "🎮 Rupee cheat activated!\n💰 3 rupees added!";
    },
    exit: () => {
      closeTerminal();
      return "";
    },
    clear: () => {
      terminalHistory = [];
      updateTerminalDisplay();
      return "";
    }
  };

  function openTerminal() {
    terminalEvents.trigger("open");
  }

  function closeTerminal() {
    terminalEvents.trigger("close");
  }

  function updateTerminalDisplay() {
    terminalEvents.trigger("updateDisplay");
  }

  function executeCommand(command) {
    terminalEvents.trigger("executeCommand", command);
  }

  function startCursorBlink() {
    terminalEvents.trigger("startCursorBlink");
  }

  setCamScale(k);

  // Immediately center camera on player
  if (player && player.worldPos) {
    const initialCamPos = k.vec2(player.worldPos().x, player.worldPos().y + 100);
    k.camPos(initialCamPos);
  }

  k.onResize(() => {setCamScale(k);});
  k.onUpdate(() => {
    if (player && player.worldPos) {
      const camPos = k.vec2(player.worldPos().x, player.worldPos().y + 100);
      k.camPos(camPos);
    }
  });

  k.onKeyDown((key) => {
    if (player.isInDialogue || terminalActive) return; // Don't move during dialogue or terminal

    const speed = player.speed;
    let moveVector = k.vec2(0, 0);
    let direction = "";

    if (key === "w" || key === "up")
    {
      moveVector.y = -speed;
      direction = "up";
    }
    else if (key === "s" || key === "down")
    {
      moveVector.y = speed;
      direction = "down";
    }
    else if (key === "a" || key === "left")
    {
      moveVector.x = -speed;
      direction = "left";
    }
    else if (key === "d" || key === "right")
    {
      moveVector.x = speed;
      direction = "right";
    }

    if (direction)
    {
      // Store the current position before attempting to move
      const oldPos = k.vec2(player.pos.x, player.pos.y);

      // Try to move
      player.move(moveVector);

      // Check if we actually moved (not blocked by collision)
      const didMove = !player.pos.eq(oldPos);

      // Update movement state and direction
      player.direction = direction;

      // Only play walking animation if we actually moved
      if (didMove)
      {
        isMovingWithWASD_SecretRoom = true;
        currentMoveDirection_SecretRoom = direction;

        if (direction === "up" && player.curAnim() !== "walk-up")
        {
          player.play("walk-up");
        }
        else if (direction === "down" && player.curAnim() !== "walk-down")
        {
          player.play("walk-down");
        }
        else if ((direction === "left" || direction === "right") && player.curAnim() !== "walk-side")
        {
          player.play("walk-side");
        }

        if (direction === "left")
        {
          player.flipX = true;
        }
        else if (direction === "right")
        {
          player.flipX = false;
        }
      }
      else
      {
        // If we didn't move (blocked by collision), play idle animation
        isMovingWithWASD_SecretRoom = false;
        currentMoveDirection_SecretRoom = "";

        if (direction === "up")
        {
          player.play("idle-up");
        }
        else if (direction === "down")
        {
          player.play("idle-down");
        }
        else
        {
          player.play("idle-side");
        }

        // Still update flip direction even when blocked
        if (direction === "left")
        {
          player.flipX = true;
        }
        else if (direction === "right")
        {
          player.flipX = false;
        }
      }
    }
  });

  // Handle key release for WASD movement (Secret Room)
  k.onKeyRelease((key) => {
    if (player.isInDialogue || terminalActive) return;

    // Check if any movement keys are still being pressed
    const movementKeys = ["w", "a", "s", "d", "up", "left", "down", "right"];
    const anyKeyPressed = movementKeys.some(k.isKeyDown);

    if (!anyKeyPressed)
    {
      // Reset movement state
      isMovingWithWASD_SecretRoom = false;
      currentMoveDirection_SecretRoom = "";

      // Stop movement and play idle animation
      if (player.direction === "down")
      {
        player.play("idle-down");
      }
      else if (player.direction === "up")
      {
        player.play("idle-up");
      }
      else
      {
        player.play("idle-side");
      }
    }
  });

  // Terminal keyboard input handling
  k.onCharInput((char) => {
    if (terminalActive)
    {
      // Add printable characters to input
      if (char >= ' ' && char <= '~')
      {
        currentInput += char;
        updateTerminalDisplay();
      }
    }
  });

  k.onKeyPress("backspace", () => {
    if (terminalActive && currentInput.length > 0)
    {
      currentInput = currentInput.slice(0, -1);
      updateTerminalDisplay();
    }
  });

  k.onKeyPress("enter", () => {
    if (terminalActive)
    {
      executeCommand(currentInput);
      historyIndex = -1;
      currentInput = "";
      updateTerminalDisplay();
    }
  });

  k.onKeyPress("up", () => {
    if (terminalActive && terminalHistory.length > 0)
    {
      // Navigate command history
      if (historyIndex === -1)
      {
        historyIndex = terminalHistory.length - 1;
      }
      else if (historyIndex > 0)
      {
        historyIndex--;
      }

      // Find previous command (starts with "> ")
      for (let i = historyIndex; i >= 0; i--)
      {
        if (terminalHistory[i].startsWith("> "))
        {
          currentInput = terminalHistory[i].substring(2);
          historyIndex = i;
          updateTerminalDisplay();
          break;
        }
      }
    }
  });

  k.onKeyPress("down", () => {
    if (terminalActive && historyIndex !== -1)
    {
      // Navigate command history forward
      for (let i = historyIndex + 1; i < terminalHistory.length; i++)
      {
        if (terminalHistory[i].startsWith("> "))
        {
          currentInput = terminalHistory[i].substring(2);
          historyIndex = i;
          updateTerminalDisplay();
          return;
        }
      }
      // If no more commands, clear input
      currentInput = "";
      historyIndex = -1;
      updateTerminalDisplay();
    }
  });

  k.onKeyPress("escape", () => {
    if (terminalActive)
    {
      closeTerminal();
    }
  });

  // Mouse controls (same as main scene)
  k.onMouseDown((mouseBtn) => {
    if (mouseBtn !== "left" || player.isInDialogue) return;

    // Stop any WASD movement when clicking
    isMovingWithWASD_SecretRoom = false;
    currentMoveDirection_SecretRoom = "";

    const worldMousePos = k.toWorld(k.mousePos());
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

  // Scene cleanup
  k.onSceneLeave(() => {fadeOutMusic();});
});

k.go("main");