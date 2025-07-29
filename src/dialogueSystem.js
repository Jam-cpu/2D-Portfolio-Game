// Dialogue and interaction system
import { k } from "./kaboomCtx.js";

// Create dialogue system
export function createDialogueSystem() {
  return {
    // Create a dialogue UI
    createDialogue(text, onClose) {
      // Disable player movement
      const player = k.get("player")[0];
      if (player) {
        player.isInDialogue = true;
      }

      // Create dialogue background
      const dialogueBg = k.add([
        k.rect(k.width() - 100, 150),
        k.pos(50, k.height() - 200),
        k.color(0, 0, 0),
        k.opacity(0.8),
        k.outline(4, k.Color.WHITE),
        k.fixed(),
        k.z(300),
      ]);

      // Create dialogue text
      const dialogueText = k.add([
        k.text(text, {
          size: 20,
          width: k.width() - 150,
        }),
        k.pos(70, k.height() - 180),
        k.color(255, 255, 255),
        k.fixed(),
        k.z(301),
      ]);

      // Create close instruction
      const closeInstruction = k.add([
        k.text("Press SPACE to continue...", {
          size: 16,
        }),
        k.pos(70, k.height() - 80),
        k.color(150, 150, 150),
        k.fixed(),
        k.z(301),
      ]);

      // Close dialogue function
      const closeDialogue = () => {
        k.destroy(dialogueBg);
        k.destroy(dialogueText);
        k.destroy(closeInstruction);

        // Re-enable player movement
        if (player) {
          player.isInDialogue = false;
        }

        if (onClose) {
          onClose();
        }
      };

      // Handle input to close dialogue
      const handleKeyPress = k.onKeyPress("space", () => {
        closeDialogue();
        handleKeyPress.cancel();
      });

      return {
        close: closeDialogue,
        background: dialogueBg,
        text: dialogueText,
        instruction: closeInstruction,
      };
    },

    // Create choice dialogue
    createChoiceDialogue(text, choices, onChoice) {
      // Disable player movement
      const player = k.get("player")[0];
      if (player) {
        player.isInDialogue = true;
      }

      const dialogueHeight = 200 + (choices.length * 30);

      // Create dialogue background
      const dialogueBg = k.add([
        k.rect(k.width() - 100, dialogueHeight),
        k.pos(50, k.height() - dialogueHeight - 50),
        k.color(0, 0, 0),
        k.opacity(0.8),
        k.outline(4, k.Color.WHITE),
        k.fixed(),
        k.z(300),
      ]);

      // Create dialogue text
      const dialogueText = k.add([
        k.text(text, {
          size: 20,
          width: k.width() - 150,
        }),
        k.pos(70, k.height() - dialogueHeight - 30),
        k.color(255, 255, 255),
        k.fixed(),
        k.z(301),
      ]);

      // Create choice buttons
      const choiceElements = [];
      choices.forEach((choice, index) => {
        const choiceButton = k.add([
          k.rect(k.width() - 200, 25),
          k.pos(70, k.height() - 150 + (index * 30)),
          k.color(50, 50, 100),
          k.outline(2, k.Color.WHITE),
          k.area(),
          k.fixed(),
          k.z(300),
        ]);

        const choiceText = k.add([
          k.text(`${index + 1}. ${choice.text}`, {
            size: 16,
          }),
          k.pos(80, k.height() - 145 + (index * 30)),
          k.color(255, 255, 255),
          k.fixed(),
          k.z(301),
        ]);

        choiceElements.push({ button: choiceButton, text: choiceText });

        // Handle choice selection
        choiceButton.onClick(() => {
          this.closeChoiceDialogue(dialogueBg, dialogueText, choiceElements, player);
          if (choice.action) {
            choice.action();
          }
          if (onChoice) {
            onChoice(index, choice);
          }
        });

        // Keyboard shortcuts
        k.onKeyPress(`${index + 1}`, () => {
          this.closeChoiceDialogue(dialogueBg, dialogueText, choiceElements, player);
          if (choice.action) {
            choice.action();
          }
          if (onChoice) {
            onChoice(index, choice);
          }
        });
      });

      return {
        background: dialogueBg,
        text: dialogueText,
        choices: choiceElements,
      };
    },

    // Close choice dialogue
    closeChoiceDialogue(background, text, choices, player) {
      k.destroy(background);
      k.destroy(text);
      choices.forEach(choice => {
        k.destroy(choice.button);
        k.destroy(choice.text);
      });

      // Re-enable player movement
      if (player) {
        player.isInDialogue = false;
      }
    },
  };
}

// Terminal dialogue system
export function createTerminalDialogue(terminal, terminalConfig) {
  const dialogueSystem = createDialogueSystem();

  terminal.on("interact", (player) => {
    player.isInDialogue = true;

    // Create terminal-specific dialogue with choices
    const choices = [
      {
        text: terminalConfig.portfolioText || "View Portfolio",
        action: () => {
          if (window.openPDF) {
            window.openPDF(terminalConfig.portfolioPath || "./Curriculum Vitae.pdf");
          }
        }
      },
      {
        text: terminalConfig.videoText || "Watch Video",
        action: () => {
          if (window.displayVideo) {
            window.displayVideo(terminalConfig.videoPath || "./demo-video.mp4");
          }
        }
      },
      {
        text: terminalConfig.closeText || "Close Terminal",
        action: () => {
          // Just close the dialogue
        }
      }
    ];

    dialogueSystem.createChoiceDialogue(
      terminalConfig.welcomeMessage || "Welcome to the terminal! What would you like to do?",
      choices,
      (choiceIndex, choice) => {
        console.log(`Terminal choice selected: ${choice.text}`);
      }
    );
  });
}

// NPC dialogue system
export function createNPCDialogue(npc, dialogueText) {
  const dialogueSystem = createDialogueSystem();

  npc.dialogue = dialogueText;

  npc.on("interact", (player) => {
    dialogueSystem.createDialogue(dialogueText, () => {
      console.log("NPC dialogue closed");
    });
  });
}

// Interactive object dialogue
export function createInteractiveDialogue(object, dialogueText, actions = []) {
  const dialogueSystem = createDialogueSystem();

  object.on("interact", (player) => {
    if (actions.length > 0) {
      dialogueSystem.createChoiceDialogue(dialogueText, actions);
    } else {
      dialogueSystem.createDialogue(dialogueText);
    }
  });
}

// Make globally accessible for backwards compatibility
const globalDialogueSystem = createDialogueSystem();
window.displayDialogue = globalDialogueSystem.createDialogue.bind(globalDialogueSystem);
