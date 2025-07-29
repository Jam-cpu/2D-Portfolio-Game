// Input Manager - Centralized input handling system
import { k } from "../kaboomCtx.js";

// Common input state
export const inputState = {
  keys: {
    w: false,
    a: false,
    s: false,
    d: false,
    up: false,
    down: false,
    left: false,
    right: false
  },
  mouse: {
    isPressed: false,
    position: { x: 0, y: 0 },
    worldPosition: { x: 0, y: 0 }
  }
};

// Movement constants
export const MOVEMENT_CONFIG = {
  diagonalSpeedReduction: 0.7,
  animationSwitchThreshold: 2
};

// Initialize input manager
export function initInputManager() {
  // Mouse tracking
  k.onMouseMove((mousePos) => {
    inputState.mouse.position = mousePos;
    inputState.mouse.worldPosition = k.toWorld(mousePos);
  });

  k.onMousePress(() => {
    inputState.mouse.isPressed = true;
  });

  k.onMouseRelease(() => {
    inputState.mouse.isPressed = false;
  });

  // Keyboard tracking
  const keyMap = {
    'w': 'w',
    'a': 'a',
    's': 's',
    'd': 'd',
    'up': 'up',
    'down': 'down',
    'left': 'left',
    'right': 'right'
  };

  Object.keys(keyMap).forEach(key => {
    k.onKeyPress(key, () => {
      inputState.keys[keyMap[key]] = true;
    });

    k.onKeyRelease(key, () => {
      inputState.keys[keyMap[key]] = false;
    });
  });
}

// Get current movement direction based on input
export function getCurrentDirection() {
  const keys = inputState.keys;

  // WASD priority
  if (keys.w || keys.up) {
    if (keys.a || keys.left) return "up-left";
    if (keys.d || keys.right) return "up-right";
    return "up";
  }
  if (keys.s || keys.down) {
    if (keys.a || keys.left) return "down-left";
    if (keys.d || keys.right) return "down-right";
    return "down";
  }
  if (keys.a || keys.left) return "left";
  if (keys.d || keys.right) return "right";

  return null;
}

// Check if any movement key is pressed
export function isMovementKeyPressed() {
  const keys = inputState.keys;
  return keys.w || keys.a || keys.s || keys.d || keys.up || keys.down || keys.left || keys.right;
}

// Calculate movement vector with proper diagonal handling
export function getMovementVector(direction, speed = 250) {
  const vectors = {
    "up": k.vec2(0, -1),
    "down": k.vec2(0, 1),
    "left": k.vec2(-1, 0),
    "right": k.vec2(1, 0),
    "up-left": k.vec2(-1, -1).scale(MOVEMENT_CONFIG.diagonalSpeedReduction),
    "up-right": k.vec2(1, -1).scale(MOVEMENT_CONFIG.diagonalSpeedReduction),
    "down-left": k.vec2(-1, 1).scale(MOVEMENT_CONFIG.diagonalSpeedReduction),
    "down-right": k.vec2(1, 1).scale(MOVEMENT_CONFIG.diagonalSpeedReduction)
  };

  const vector = vectors[direction] || k.vec2(0, 0);
  // Scale by speed but don't apply delta time here - let Kaboom handle that
  return vector.scale(speed);
}

// Get animation name for direction
export function getAnimationForDirection(direction) {
  const animationMap = {
    "up": "walk-up",
    "up-left": "walk-up",
    "up-right": "walk-up",
    "down": "walk-down",
    "down-left": "walk-down",
    "down-right": "walk-down",
    "left": "walk-side",
    "right": "walk-side"
  };

  return animationMap[direction] || "idle-down";
}

// Get idle animation for direction
export function getIdleAnimationForDirection(direction) {
  const idleMap = {
    "up": "idle-up",
    "up-left": "idle-up",
    "up-right": "idle-up",
    "down": "idle-down",
    "down-left": "idle-down",
    "down-right": "idle-down",
    "left": "idle-side",
    "right": "idle-side"
  };

  return idleMap[direction] || "idle-down";
}

// Update player direction for sprite flipping
export function updatePlayerDirection(player, direction) {
  if (!player) return;

  // Update player direction property
  if (direction === "left" || direction === "down-left" || direction === "up-left") {
    player.direction = "left";
    player.flipX = true;
  } else if (direction === "right" || direction === "down-right" || direction === "up-right") {
    player.direction = "right";
    player.flipX = false;
  } else if (direction === "up" || direction === "up-left" || direction === "up-right") {
    player.direction = "up";
  } else if (direction === "down" || direction === "down-left" || direction === "down-right") {
    player.direction = "down";
  }
}

// Common input handling for movement (animations handled by player system)
export function handleMovementInput(player, terminalSystem, stopPlayerMovement) {
  if (!player || player.isInDialogue || (terminalSystem && terminalSystem.isTerminalActive())) {
    return;
  }

  // Check if any keyboard movement keys are pressed
  const direction = getCurrentDirection();

  if (!direction) {
    return false;
  }

  if (direction) {
    // Keyboard movement takes priority - use keyboard input
    const keys = inputState.keys;
    const speed = player.speed || 250;

    let moveX = 0;
    let moveY = 0;

    // Calculate movement for each axis
    if (keys.w || keys.up) moveY = -speed;
    if (keys.s || keys.down) moveY = speed;
    if (keys.a || keys.left) moveX = -speed;
    if (keys.d || keys.right) moveX = speed;

    // Normalize diagonal movement to prevent speed increase
    if (moveX !== 0 && moveY !== 0) {
      const length = Math.sqrt(moveX * moveX + moveY * moveY);
      moveX = (moveX / length) * speed;
      moveY = (moveY / length) * speed;
    }

    // Apply movement
    player.move(moveX, moveY);

    // Note: Animations are handled by the player's built-in animation system
    return true; // Return true to indicate keyboard movement was applied
  }

  return false; // Return false to indicate no keyboard movement
}

// Handle click movement (animations handled by player system)
export function handleClickMovement(player, terminalSystem) {
  if (!player || player.isInDialogue || (terminalSystem && terminalSystem.isTerminalActive())) {
    return;
  }

  // Only handle mouse movement if no keyboard keys are pressed
  if (!isMovementKeyPressed() && inputState.mouse.isPressed) {
    const worldPos = k.vec2(inputState.mouse.worldPosition.x, inputState.mouse.worldPosition.y);
    const playerPos = player.worldPos();
    const distance = worldPos.dist(playerPos);

    if (distance > 5) {
      const direction = worldPos.sub(playerPos).unit();
      const speed = player.speed || 250;
      // Move towards the mouse position
      player.move(direction.x * speed, direction.y * speed);
      // Note: Animations are handled by the player's built-in animation system
    }
  }
}
