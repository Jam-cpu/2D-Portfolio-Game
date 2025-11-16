// Main Scene Input Handling
import { k } from "../kaboomCtx.js";
import { initInputManager, handleMovementInput, handleClickMovement } from "./inputManager.js";

export function setupMainSceneInput(player, terminalSystem) {
  // ALWAYS initialize input manager to ensure key listeners work
  console.log("Setting up main scene input...");
  initInputManager();
  console.log("Main scene input manager initialized");

  // Player movement update loop
  k.onUpdate(() => {
    handleMovementInput(player, terminalSystem);
    handleClickMovement(player, terminalSystem);
  });

  // Interaction key
  k.onKeyPress("e", () => {
    if (!player.isInDialogue && terminalSystem && !terminalSystem.isTerminalActive()) {
      // Check if player is near an interactive object
      const nearbyObjects = k.get("interactive").filter(obj => {
        const distance = player.worldPos().dist(obj.worldPos());
        return distance < 50; // Interaction range
      });

      if (nearbyObjects.length > 0) {
        const obj = nearbyObjects[0];
        if (obj.tags.includes("pc")) {
          k.play("tp-press-start", { volume: 0.5 });
          terminalSystem.openTerminal();
        }
      }
    }
  });

  // Escape key to close terminal
  k.onKeyPress("escape", () => {
    if (terminalSystem && terminalSystem.isTerminalActive()) {
      terminalSystem.closeTerminal();
    }
  });
}
