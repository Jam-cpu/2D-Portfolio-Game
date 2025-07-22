import { k } from "./kaboomCtx";

// Simple test to see if Kaboom is working
k.scene("test", () => {
  // Add a simple rectangle to test if Kaboom canvas is working
  k.add([
    k.rect(100, 100),
    k.color(255, 0, 0),
    k.pos(100, 100)
  ]);

  // Add some text
  k.add([
    k.text("Kaboom Test - Click to see red square", { size: 24 }),
    k.pos(50, 50),
    k.color(255, 255, 255)
  ]);
});

k.go("test");
