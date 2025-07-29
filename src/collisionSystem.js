// Collision detection and interaction system
import { k } from "./kaboomCtx.js";
import { displayDialogue } from "./utils.js";

// Rupee collection system
export function createRupeeCollisionSystem(player, rupeeCounterManager) {
  // Rupee collection events
  player.onCollide("rupee", (rupee) => {
    console.log("Player collided with rupee!");
    rupee.trigger("collected", player);
  });
}

// Terminal interaction system
export function createTerminalCollisionSystem(player) {
  // Terminal collision events
  player.onCollide("terminal", (terminal) => {
    if (!player.isInDialogue) {
      terminal.trigger("interact", player);
    }
  });
}

// General interaction system for any object
export function createGeneralCollisionSystem(player) {
  // General collisions with interactive objects
  player.onCollide("interactive", (obj) => {
    if (!player.isInDialogue && obj.onInteract) {
      obj.onInteract(player);
    }
  });

  // Boundary collisions
  player.onCollide("boundary", () => {
    // Handle boundary collisions (stop movement, etc.)
    player.trigger("stop_movement");
  });
}

// Chicken AI collision system
export function createChickenCollisionSystem() {
  return {
    init(chicken) {
      // Chicken collision events
      chicken.on("collision_detected", (obj) => {
        if (obj.is("player")) {
          // Player collision behavior
          chicken.trigger("flee_from_player");
        } else if (obj.is("boundary")) {
          // Boundary collision behavior
          chicken.trigger("change_direction");
        }
      });

      chicken.on("flee_from_player", () => {
        // Calculate flee direction
        const player = k.get("player")[0];
        if (player) {
          const fleeDirection = chicken.pos.sub(player.pos).unit();
          chicken.move(fleeDirection.scale(chicken.speed * 1.5));
        }
      });

      chicken.on("change_direction", () => {
        // Random direction change
        const directions = [
          k.vec2(1, 0),
          k.vec2(-1, 0),
          k.vec2(0, 1),
          k.vec2(0, -1),
        ];
        chicken.direction = k.choose(directions);
      });

      // Setup collision detection
      chicken.onCollide((obj) => {
        chicken.trigger("collision_detected", obj);
      });
    }
  };
}

// NPC interaction system
export function createNPCCollisionSystem(player) {
  player.onCollide("npc", (npc) => {
    if (!player.isInDialogue && npc.dialogue) {
      player.isInDialogue = true;
      displayDialogue(
        npc.dialogue,
        () => {
          player.isInDialogue = false;
        }
      );
    }
  });
}

// Door/transition collision system
export function createTransitionCollisionSystem(player) {
  player.onCollide("transition", (transition) => {
    if (transition.targetScene) {
      window.gameState.transitionToScene(transition.targetScene);
    }
  });
}

// Initialize all collision systems
export function initializeCollisionSystems(player, rupeeCounterManager) {
  createRupeeCollisionSystem(player, rupeeCounterManager);
  createTerminalCollisionSystem(player);
  createGeneralCollisionSystem(player);
  createNPCCollisionSystem(player);
  createTransitionCollisionSystem(player);
}

// Entity interaction helpers
export function makeInteractive(entity, onInteract) {
  entity.use("interactive");
  entity.onInteract = onInteract;
  return entity;
}

export function makeBoundary(entity) {
  entity.use("boundary");
  return entity;
}

export function makeTransition(entity, targetScene) {
  entity.use("transition");
  entity.targetScene = targetScene;
  return entity;
}
