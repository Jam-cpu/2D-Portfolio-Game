// Audio management system
import { k } from "./kaboomCtx.js";

// Global audio state
let isRickrollPlaying = false;
let rickrollRefusalCount = 0;
const rickrollRefusalMessages = ["No", "Nope", "Nah", "lmao"];

// Music control functions
export function fadeOutMusic() {
  if (window.currentBackgroundMusic) {
    k.tween(window.currentBackgroundMusic.volume, 0, 2, (val) => {
      window.currentBackgroundMusic.volume = val;
    }, k.easings.easeOutQuad);
  }
}

export function fadeInMusic() {
  if (window.currentBackgroundMusic) {
    k.tween(window.currentBackgroundMusic.volume, 0.5, 2, (val) => {
      window.currentBackgroundMusic.volume = val;
    }, k.easings.easeInQuad);
  }
}

// Start background music with fade in
export function startBackgroundMusic() {
  if (!window.currentBackgroundMusic || window.currentBackgroundMusic.paused) {
    const music = k.play("background-music", { volume: 0, loop: true });

    // Store background music globally for rickroll function access
    window.currentBackgroundMusic = music;

    // Fade in the music over 3 seconds
    k.tween(0, 0.5, 3, (val) => {
      music.volume = val;
    });
  }
}

// Stop background music
export function stopBackgroundMusic() {
  if (window.currentBackgroundMusic) {
    window.currentBackgroundMusic.stop();
    window.currentBackgroundMusic = null;
  }
}

// Global function to play rickroll sound from dialogue buttons
export function playRickroll() {
  // If already playing, show refusal message instead
  if (isRickrollPlaying) {
    const message = rickrollRefusalMessages[rickrollRefusalCount % rickrollRefusalMessages.length];
    rickrollRefusalCount++;

    // Update the dialogue content by finding the dialogue UI and appending the message
    const dialogueElement = document.getElementById('dialogue');
    if (dialogueElement) {
      // Add the refusal message on a new line
      dialogueElement.innerHTML += '<br>' + message;
    }
    return;
  }

  isRickrollPlaying = true;
  rickrollRefusalCount = 0; // Reset refusal count when starting new song

  // Fade out background music
  if (window.currentBackgroundMusic) {
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
    if (window.currentBackgroundMusic) {
      k.tween(0, 0.5, 1, (val) => {
        window.currentBackgroundMusic.volume = val;
      });
    }
  });
}

// Make globally accessible for backwards compatibility
window.playRickroll = playRickroll;
