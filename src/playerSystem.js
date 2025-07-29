// Player system and controls
import { k } from "./kaboomCtx.js";
import { scaleFactor } from "./constants.js";

// Player movement handler with event system
export function createPlayerMovement() {
  return {
    init(player) {
      // Movement flags for mutual exclusion
      let isMovingWithMouse = false;
      let isMovingWithWASD = false;

      // Movement direction tracking
      let moveDirection = { x: 0, y: 0 };
      let keysPressed = {
        up: false,
        down: false,
        left: false,
        right: false
      };

      // Update movement direction and apply normalized movement
      function updateMovement() {
        if (player.isInDialogue || isMovingWithMouse) return;

        // Calculate movement direction based on pressed keys
        moveDirection.x = 0;
        moveDirection.y = 0;

        if (keysPressed.up) moveDirection.y -= 1;
        if (keysPressed.down) moveDirection.y += 1;
        if (keysPressed.left) moveDirection.x -= 1;
        if (keysPressed.right) moveDirection.x += 1;

        // Normalize diagonal movement to maintain constant speed
        if (moveDirection.x !== 0 && moveDirection.y !== 0) {
          const length = Math.sqrt(moveDirection.x * moveDirection.x + moveDirection.y * moveDirection.y);
          moveDirection.x /= length;
          moveDirection.y /= length;
        }

        // Apply movement if any direction is pressed
        if (moveDirection.x !== 0 || moveDirection.y !== 0) {
          isMovingWithWASD = true;
          player.move(moveDirection.x * player.speed, moveDirection.y * player.speed);
        } else {
          isMovingWithWASD = false;
        }
      }

      // Player movement events - now just set flags
      player.on("move_up", () => {
        keysPressed.up = true;
        updateMovement();
      });

      player.on("move_down", () => {
        keysPressed.down = true;
        updateMovement();
      });

      player.on("move_left", () => {
        keysPressed.left = true;
        updateMovement();
      });

      player.on("move_right", () => {
        keysPressed.right = true;
        updateMovement();
      });

      // Key release events
      player.on("stop_move_up", () => {
        keysPressed.up = false;
        updateMovement();
      });

      player.on("stop_move_down", () => {
        keysPressed.down = false;
        updateMovement();
      });

      player.on("stop_move_left", () => {
        keysPressed.left = false;
        updateMovement();
      });

      player.on("stop_move_right", () => {
        keysPressed.right = false;
        updateMovement();
      });

      // Mouse movement events
      player.on("move_to_mouse", (mousePos) => {
        if (player.isInDialogue || isMovingWithWASD) return;
        isMovingWithMouse = true;
        player.moveTo(mousePos, player.speed);
      });

      // Reset all movement flags
      player.on("stop_movement", () => {
        isMovingWithMouse = false;
        isMovingWithWASD = false;
        keysPressed.up = false;
        keysPressed.down = false;
        keysPressed.left = false;
        keysPressed.right = false;
        moveDirection.x = 0;
        moveDirection.y = 0;
      });

      // Achievement events
      player.on("achievement", (achievementType) => {
        if (achievementType === "collector") {
          console.log("Achievement unlocked: Collector! (10+ rupees)");
        } else if (achievementType === "treasure_hunter") {
          console.log("Achievement unlocked: Treasure Hunter! (50+ rupees)");
        }
      });
    }
  };
}

// Input handling system
export function setupInputHandlers(player) {
  const playerMovement = createPlayerMovement();
  playerMovement.init(player);

  // WASD keyboard controls - key down events
  k.onKeyDown("w", () => {
    player.trigger("move_up");
  });

  k.onKeyDown("s", () => {
    player.trigger("move_down");
  });

  k.onKeyDown("a", () => {
    player.trigger("move_left");
  });

  k.onKeyDown("d", () => {
    player.trigger("move_right");
  });

  // WASD keyboard controls - key release events
  k.onKeyRelease("w", () => {
    player.trigger("stop_move_up");
  });

  k.onKeyRelease("s", () => {
    player.trigger("stop_move_down");
  });

  k.onKeyRelease("a", () => {
    player.trigger("stop_move_left");
  });

  k.onKeyRelease("d", () => {
    player.trigger("stop_move_right");
  });

  // Mouse controls
  k.onMouseDown((mouseBtn) => {
    if (mouseBtn !== "left") return;
    const worldMousePos = k.toWorld(k.mousePos());
    player.trigger("move_to_mouse", worldMousePos);
  });

  k.onMouseRelease(() => {
    player.trigger("stop_movement");
  });
}

// Create player object with properties
export function createPlayer(x = 100, y = 200) {
  const player = k.add([
    k.sprite("spritesheet", { anim: "idle-down" }),
    k.area({
      shape: new k.Rect(k.vec2(0, 0), 5, 11), // Smaller hitbox (width: 6, height: 10)
      offset: k.vec2(5, 3) // Adjusted center positioning for smaller hitbox
    }),
    k.body(),
    k.pos(x, y),
    k.scale(scaleFactor),
    k.opacity(1),
    "player",
    {
      speed: 250,
      direction: "down",
      isInDialogue: false,
    },
  ]);

  // Note: Input handling is now managed by the input manager in each scene
  // setupInputHandlers(player); // Removed to prevent input conflicts

  return player;
}

// Player animation system
export function createPlayerAnimations() {
  return {
    init(player) {
      // Animation update events
      player.on("animate", (direction) => {
        if (player.isInDialogue) return;

        // Map left/right to side animation
        let animDirection = direction;
        if (direction === "left" || direction === "right") {
          animDirection = "side";
          // Handle flipping for left/right movement
          if (direction === "left") {
            player.flipX = true;
          } else if (direction === "right") {
            player.flipX = false;
          }
        }

        // Always ensure walking animation is playing when moving
        const walkAnim = `walk-${animDirection}`;
        if (player.curAnim() !== walkAnim) {
          player.play(walkAnim);
        }
        player.direction = direction;
      });

      player.on("idle", () => {
        if (player.isInDialogue) return;

        // Map left/right to side for idle animations
        let idleDirection = player.direction;
        if (player.direction === "left" || player.direction === "right") {
          idleDirection = "side";
        }

        // Always ensure idle animation is playing when stopped
        const idleAnim = `idle-${idleDirection}`;
        if (player.curAnim() !== idleAnim) {
          player.play(idleAnim);
        }
      });

      // Update animation based on movement
      player.onUpdate(() => {
        if (!player.isInDialogue && (k.isKeyDown("w") || k.isKeyDown("s") || k.isKeyDown("a") || k.isKeyDown("d") || k.isMouseDown())) {
          if (k.isKeyDown("w")) {
            player.trigger("animate", "up");
          } else if (k.isKeyDown("s")) {
            player.trigger("animate", "down");
          } else if (k.isKeyDown("a")) {
            player.trigger("animate", "left");
          } else if (k.isKeyDown("d")) {
            player.trigger("animate", "right");
          } else if (k.isMouseDown()) {
            const mousePos = k.toWorld(k.mousePos());
            const direction = mousePos.sub(player.pos);

            if (Math.abs(direction.x) > Math.abs(direction.y)) {
              player.trigger("animate", direction.x > 0 ? "right" : "left");
            } else {
              player.trigger("animate", direction.y > 0 ? "down" : "up");
            }
          }
        } else {
          player.trigger("idle");
        }
      });
    }
  };
}

// Make globally accessible for backwards compatibility
window.createPlayer = createPlayer;
