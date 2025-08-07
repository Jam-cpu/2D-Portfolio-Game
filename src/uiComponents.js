// UI components and overlays
import { k } from "./kaboomCtx.js";
import { displayPDF } from "./utils.js";

// Create FPS display component
export function createFPSDisplay() {
  // Create FPS display background box
  const fpsBackground = k.add([
    k.rect(120, 35),
    k.pos(k.width() - 130, 20), // Top right corner with padding
    k.color(0, 0, 0), // Black background
    k.opacity(0.8),
    k.fixed(),
    k.z(199), // Behind the text
  ]);

  // Create FPS display text
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
  });

  return { fpsBackground, fpsDisplay };
}

// Create rupee counter overlay
export function createRupeeCounter(initialCount = 0) {
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
    k.text(initialCount.toString(), {
      size: 45,
    }),
    k.pos(73, 35),
    k.color(0, 255, 153), // Green color
    k.fixed(),
    k.z(200),
  ]);

  return { rupeeIconOverlay, rupeeCounterOverlay };
}

// Create rupee counter manager with events
export function createRupeeCounterManager(overlay, initialCount = 0) {
  const rupeeCounterManager = {
    count: initialCount,
    overlay: overlay,

    // Method to increment rupee count
    increment(amount = 1) {
      this.count += amount;
      window.gameState.playerData.rupeeCount = this.count; // Update global state
      this.overlay.text = this.count.toString(); // Update display directly

      // Trigger achievements or special effects
      if (this.count >= 10 && this.count < 20) {
        if (window.currentPlayer) {
          window.currentPlayer.trigger("achievement", "collector");
        }
      } else if (this.count >= 50) {
        if (window.currentPlayer) {
          window.currentPlayer.trigger("achievement", "treasure_hunter");
        }
      }
    },

    // Event handlers
    init() {
      this.overlay.on("update", () => {
        this.overlay.text = this.count.toString();
      });

      this.overlay.on("increment", (amount = 1) => {
        this.increment(amount); // Use the increment method
      });

      // Initialize display
      this.overlay.text = this.count.toString();
    }
  };

  return rupeeCounterManager;
}

// Global function to handle PDF opening from dialogue buttons
export function openPDF(pdfPath) {
  displayPDF(pdfPath, () => {
    // Re-enable player movement after PDF closes
    if (window.currentPlayer) {
      window.currentPlayer.isInDialogue = false;
    }
  });
}

// Global function to display video overlay
export function displayVideo(videoPath) {
  // Disable player movement
  if (window.currentPlayer) {
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
    if (window.currentPlayer) {
      window.currentPlayer.isInDialogue = false;
    }
  };

  // Close on overlay click (but not on video)
  videoOverlay.addEventListener('click', (e) => {
    if (e.target === videoOverlay) {
      closeVideo();
    }
  });

  // Close on button click
  closeButton.addEventListener('click', closeVideo);

  // Close on Escape key
  const handleKeyPress = (e) => {
    if (e.key === 'Escape') {
      closeVideo();
      document.removeEventListener('keydown', handleKeyPress);
    }
  };
  document.addEventListener('keydown', handleKeyPress);

  // Auto-close when video ends
  video.addEventListener('ended', closeVideo);
}

// Global function to display image overlay
export function displayImage(imagePath) {
  // Disable player movement
  if (window.currentPlayer) {
    window.currentPlayer.isInDialogue = true;
  }

  // Create image overlay container
  const imageOverlay = document.createElement('div');
  imageOverlay.id = 'image-overlay';
  imageOverlay.style.cssText = `
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

  // Create image element
  const img = document.createElement('img');
  img.src = imagePath;
  img.style.cssText = `
    max-width: 80%;
    max-height: 80%;
    object-fit: contain;
    border: 2px solid #00ff00;
    background-color: black;
    border-radius: 5px;
  `;

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
  imageOverlay.appendChild(img);
  imageOverlay.appendChild(closeButton);
  document.body.appendChild(imageOverlay);

  // Close image function
  const closeImage = () => {
    document.body.removeChild(imageOverlay);
    // Re-enable player movement
    if (window.currentPlayer) {
      window.currentPlayer.isInDialogue = false;
    }
  };

  // Close on overlay click (but not on image)
  imageOverlay.addEventListener('click', (e) => {
    if (e.target === imageOverlay) {
      closeImage();
    }
  });

  // Close on button click
  closeButton.addEventListener('click', closeImage);

  // Close on Escape key
  const handleKeyPress = (e) => {
    if (e.key === 'Escape') {
      closeImage();
      document.removeEventListener('keydown', handleKeyPress);
    }
  };
  document.addEventListener('keydown', handleKeyPress);
}

// Terminal System for Secret Room
export function createTerminalSystem(player, rupeeCounterManager) {
  let terminalActive = false;
  let terminalHistory = [];
  let currentInput = "";
  let historyIndex = -1;

  // Terminal UI Elements (initially hidden) - Made square and narrower
  const terminalBg = k.add([
    k.rect(k.height() * 0.6, k.height() * 0.6), // Square dimensions using height for both
    k.color(0, 0, 0),
    k.opacity(0.9),
    k.pos(k.width() * 0.5 - (k.height() * 0.3), k.height() * 0.2), // Center horizontally
    k.fixed(),
    k.z(300)
  ]);
  terminalBg.hidden = true;

  const terminalTitle = k.add([
    k.text("SECRET TERMINAL v1.0", { size: 20, font: "monospace" }),
    k.pos(k.width() * 0.5 - (k.height() * 0.28), k.height() * 0.22), // Adjusted for centered square
    k.color(0, 255, 0),
    k.fixed(),
    k.z(301)
  ]);
  terminalTitle.hidden = true;

  const terminalOutput = k.add([
    k.text("", { size: 14, font: "monospace" }),
    k.pos(k.width() * 0.5 - (k.height() * 0.28), k.height() * 0.27), // Adjusted for centered square
    k.color(0, 255, 0),
    k.fixed(),
    k.z(301)
  ]);
  terminalOutput.hidden = true;

  const terminalPrompt = k.add([
    k.text("> ", { size: 14, font: "monospace" }),
    k.pos(k.width() * 0.5 - (k.height() * 0.28), k.height() * 0.72), // Adjusted for centered square
    k.color(0, 255, 0),
    k.fixed(),
    k.z(301)
  ]);
  terminalPrompt.hidden = true;

  const terminalInput = k.add([
    k.text("", { size: 14, font: "monospace" }),
    k.pos(k.width() * 0.5 - (k.height() * 0.255), k.height() * 0.72), // Adjusted for centered square
    k.color(255, 255, 255),
    k.fixed(),
    k.z(301)
  ]);
  terminalInput.hidden = true;

  const terminalCursor = k.add([
    k.text("_", { size: 14, font: "monospace" }),
    k.pos(k.width() * 0.5 - (k.height() * 0.255), k.height() * 0.72), // Adjusted for centered square
    k.color(255, 255, 255),
    k.fixed(),
    k.z(301)
  ]);
  terminalCursor.hidden = true;

  // Terminal state management through events
  const terminalEvents = k.make([
    {
      isActive: false,
      history: [],
      currentInput: "",
      historyIndex: -1
    }
  ]);

  // Terminal Commands
  const terminalCommands = {
    help: () => {
      return "Available commands:\n" +
             "help - Show this help message\n" +
             "whoami - Show current user\n" +
             "ls - List files\n" +
             "cat [file] - Read a file\n" +
             "hack - Try to hack the system\n" +
             "exit - Close terminal";
    },
    whoami: () => "user: anonymous_hacker",
    ls: () => "secrets.txt\npasswords.db\nbackdoor.exe",
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
        default:
          return `cat: ${file}: No such file or directory`;
      }
    },
    hack: () => {
      // Give player some rupees as a reward
      if (rupeeCounterManager) {
        rupeeCounterManager.increment(5);
      }
      return "ACCESS GRANTED! Hack successful!\n💰 5 rupees transferred to your account!";
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

  // Helper function to stop player movement
  function stopPlayerMovement()
  {
    if (player)
    {
      player.stop();
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
  }

  // Terminal event handlers
  terminalEvents.on("open", () => {
    terminalActive = true;
    if (player) {
      player.isInDialogue = true;
      stopPlayerMovement();
    }

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
    if (player) {
      player.isInDialogue = false;
    }
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
    terminalCursor.pos.x = (k.width() * 0.5 - (k.height() * 0.255)) + inputWidth;
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

  // Public API
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

  function isTerminalActive() {
    return terminalActive;
  }

  // Input handlers for terminal
  function handleCharInput(char) {
    if (terminalActive)
    {
      // Add printable characters to input
      if (char >= ' ' && char <= '~')
      {
        currentInput += char;
        updateTerminalDisplay();
      }
    }
  }

  function handleBackspace() {
    if (terminalActive && currentInput.length > 0)
    {
      currentInput = currentInput.slice(0, -1);
      updateTerminalDisplay();
    }
  }

  function handleEnter() {
    if (terminalActive)
    {
      executeCommand(currentInput);
      historyIndex = -1;
      currentInput = "";
      updateTerminalDisplay();
    }
  }

  function handleArrowUp() {
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
  }

  function handleArrowDown() {
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
  }

  function handleEscape() {
    if (terminalActive)
    {
      closeTerminal();
    }
  }

  return {
    openTerminal,
    closeTerminal,
    isTerminalActive,
    handleCharInput,
    handleBackspace,
    handleEnter,
    handleArrowUp,
    handleArrowDown,
    handleEscape,
    elements: {
      terminalBg,
      terminalTitle,
      terminalOutput,
      terminalPrompt,
      terminalInput,
      terminalCursor
    }
  };
}

// Make globally accessible for backwards compatibility
window.openPDF = openPDF;
window.displayVideo = displayVideo;
window.displayImage = displayImage;
