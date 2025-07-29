// Secret Room Scene Input Handling
import { k } from "../kaboomCtx.js";
import { initInputManager, handleMovementInput, handleClickMovement } from "./inputManager.js";

export function setupSecretRoomInput(player, terminalSystem) {
  // ALWAYS initialize input manager for secret room to ensure key listeners work
  console.log("Setting up secret room input...");
  initInputManager();
  console.log("Secret room input manager initialized");

  // Player movement update loop
  k.onUpdate(() => {
    console.log("Secret room onUpdate executing"); // Debug: Check if this runs
    if (!player) {
      console.log("Secret room: No player reference in onUpdate");
      return;
    }
    console.log("Secret room: Calling movement handlers"); // Debug: Check if we reach the handlers
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
        if (obj.tags.includes("secretpc")) {
          k.play("tp-press-start", { volume: 0.5 });
          terminalSystem.openTerminal();
        }
      }
    }
  });

  // Terminal toggle
  k.onKeyPress("t", () => {
    if (!player.isInDialogue && terminalSystem) {
      if (terminalSystem.isTerminalActive()) {
        terminalSystem.closeTerminal();
      } else {
        k.play("tp-press-start", { volume: 0.5 });
        terminalSystem.openTerminal();
      }
    }
  });

  // Escape key to close terminal
  k.onKeyPress("escape", () => {
    if (terminalSystem && terminalSystem.isTerminalActive()) {
      terminalSystem.closeTerminal();
    }
  });

  // Terminal input handling
  k.onCharInput((char) => {
    if (terminalSystem && terminalSystem.isTerminalActive()) {
      terminalSystem.handleCharInput(char);
    }
  });

  k.onKeyPress("backspace", () => {
    if (terminalSystem && terminalSystem.isTerminalActive()) {
      terminalSystem.handleBackspace();
    }
  });

  k.onKeyPress("enter", () => {
    if (terminalSystem && terminalSystem.isTerminalActive()) {
      terminalSystem.handleEnter();
    } else if (!player.isInDialogue) {
      // Quick exit from secret room only if terminal is not active
      player.trigger("returnToMain");
    }
  });

  k.onKeyPress("up", () => {
    if (terminalSystem && terminalSystem.isTerminalActive()) {
      terminalSystem.handleArrowUp();
    }
  });

  k.onKeyPress("down", () => {
    if (terminalSystem && terminalSystem.isTerminalActive()) {
      terminalSystem.handleArrowDown();
    }
  });
}
