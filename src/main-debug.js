import { dialogueData, scaleFactor } from "./constants";
import { k } from "./kaboomCtx";
import { displayDialogue, setCamScale } from "./utils";

// Test asset loading step by step
console.log("Starting game...");

// Load both sprites
k.loadSprite("map", "/map.png");
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

k.scene("main", () => {
  console.log("Scene started");

  // Try to add the map first
  try {
    const map = k.add([
      k.sprite("map"),
      k.pos(0),
      k.scale(scaleFactor)
    ]);
    console.log("Map added successfully");
  } catch (error) {
    console.error("Error adding map:", error);
  }

  // Try to add a player
  try {
    const player = k.add([
      k.sprite("spritesheet", { anim: "idle-down" }),
      k.area({
        shape: new k.Rect(k.vec2(0, 3), 10, 10),
      }),
      k.body(),
      k.anchor("center"),
      k.pos(400, 300), // Fixed position for testing
      k.scale(scaleFactor),
      {
        speed: 250,
        direction: "down",
        isInDialogue: false,
      },
      "player",
    ]);
    console.log("Player added successfully");
  } catch (error) {
    console.error("Error adding player:", error);
  }

  // Add some test text
  k.add([
    k.text("Map + Player test - you should see map and character", { size: 16 }),
    k.pos(50, 50),
    k.color(255, 255, 255)
  ]);
});

k.go("main");
