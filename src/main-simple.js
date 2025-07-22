import { dialogueData, scaleFactor } from "./constants";
import { k } from "./kaboomCtx";
import { displayDialogue, setCamScale } from "./utils";

k.loadSprite("spritesheet", "/spritesheet.png",
{
  sliceX: 39,
  sliceY: 31,
  anims:
  {
    "idle-down": 936,
    "walk-down": { from: 936, to: 939, loop: true, speed: 8 },
    "idle-side": 975,
    "walk-side": { from: 975, to: 978, loop: true, speed: 8 },
    "idle-up": 1014,
    "walk-up": { from: 1014, to: 1017, loop: true, speed: 8 },
  },
});

k.loadSprite("map", "/map.png");

k.setBackground(k.Color.fromHex("#311047"));

k.scene("main", () =>
{
  // Add the map
  const map = k.add([k.sprite("map"), k.pos(0), k.scale(scaleFactor)]);

  // Create the player
  const player = k.add([
    k.sprite("spritesheet", { anim: "idle-down" }),
    k.area(
    {
      shape: new k.Rect(k.vec2(0, 3), 10, 10),
    }),
    k.body(),
    k.anchor("center"),
    k.pos(400, 300), // Starting position
    k.scale(scaleFactor),
    {
      speed: 250,
      direction: "down",
      isInDialogue: false,
    },
    "player",
  ]);

  // Set up camera
  setCamScale(k);

  k.onResize(() =>
  {
    setCamScale(k);
  });

  k.onUpdate(() =>
  {
    k.camPos(player.worldPos().x, player.worldPos().y + 100);
  });

  // Handle mouse input for movement
  k.onMouseDown((mouseBtn) =>
  {
    if (mouseBtn !== "left" || player.isInDialogue) return;

    const worldMousePos = k.toWorld(k.mousePos());
    player.moveTo(worldMousePos, player.speed);

    const mouseAngle = player.pos.angle(worldMousePos);

    const lowerBound = 50;
    const upperBound = 125;

    if (
      mouseAngle > lowerBound &&
      mouseAngle < upperBound &&
      player.curAnim() !== "walk-up"
    )
    {
      player.play("walk-up");
      player.direction = "up";
      return;
    }

    if (
      mouseAngle < -lowerBound &&
      mouseAngle > -upperBound &&
      player.curAnim() !== "walk-down"
    )
    {
      player.play("walk-down");
      player.direction = "down";
      return;
    }

    if (Math.abs(mouseAngle) > upperBound)
    {
      player.flipX = false;
      if (player.curAnim() !== "walk-side") player.play("walk-side");
      player.direction = "right";
      return;
    }

    if (Math.abs(mouseAngle) < lowerBound)
    {
      player.flipX = true;
      if (player.curAnim() !== "walk-side") player.play("walk-side");
      player.direction = "left";
      return;
    }
  });

  k.onMouseRelease(() =>
  {
    if (player.direction === "down")
    {
      player.play("idle-down");
      return;
    }
    if (player.direction === "up")
    {
      player.play("idle-up");
      return;
    }

    player.play("idle-side");
  });

  // Add a simple test collision
  const testObject = k.add([
    k.rect(50, 50),
    k.color(255, 0, 0),
    k.pos(200, 200),
    k.area(),
    k.body({ isStatic: true }),
    "test-object"
  ]);

  player.onCollide("test-object", () =>
  {
    player.isInDialogue = true;
    displayDialogue(
      "This is a test object! The collision system works.",
      () => (player.isInDialogue = false)
    );
  });
});

k.go("main");
