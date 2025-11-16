// Asset loading and management system
import { k } from "./kaboomCtx.js";

// Load all game assets
export function loadAllAssets() {
  const baseUrl = import.meta.env.BASE_URL;

  // Load player sprite sheet with movement animations
  k.loadSprite("spritesheet", `${baseUrl}spritesheet.png`, {
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
  k.loadSprite("map", `${baseUrl}map.png`);
  k.loadSprite("secretRoomMap", `${baseUrl}secretmap.png`);
  k.loadSprite("lampost", `${baseUrl}lampost.png`);
  k.loadSprite("rupee", `${baseUrl}rupee.png`);
  k.loadSprite("rupeeicon", `${baseUrl}rupeeicon.png`);
  k.loadSprite("rupeeiconresize", `${baseUrl}rupeeiconresize.png`);
  k.loadSprite("pot", `${baseUrl}pot.png`);
  k.loadSprite("planthalf", `${baseUrl}planthalf.png`);
  k.loadSprite("marioPipe", `${baseUrl}tubo-mario-small.png`);
  k.loadSprite("sign", `${baseUrl}sign.png`);

  // Load chicken sprite sheet with various animations
  k.loadSprite("chicken", `${baseUrl}Chicken Sprite Sheet.png`, {
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
  k.loadSound("background-music", `${baseUrl}Eterna City (Night).mp3`);
  k.loadSound("tp-press-start", `${baseUrl}TP_PressStart.wav`);
  k.loadSound("tp-get-rupee", `${baseUrl}TP_Get_Rupee.wav`);
  k.loadSound("rickroll", `${baseUrl}rickroll.mp3`);
  k.loadSound("pot-shatter", `${baseUrl}OOT_Pot_Shatter.wav`);
  k.loadSound("pipesound", `${baseUrl}pipesound.mp3`);
}

// Asset preloading with progress tracking
export async function preloadAssets(onProgress) {
  const totalAssets = 16; // Update this count if you add more assets
  let loadedAssets = 0;

  const updateProgress = () => {
    loadedAssets++;
    if (onProgress) {
      onProgress(loadedAssets / totalAssets);
    }
  };

  // You can add promise-based loading here if needed
  // For now, just call the synchronous loader
  loadAllAssets();

  // Simulate progress for demonstration
  for (let i = 0; i < totalAssets; i++) {
    updateProgress();
  }
}
