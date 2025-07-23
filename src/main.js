import { dialogueData, scaleFactor } from "./constants";
import { k } from "./kaboomCtx";
import { displayDialogue, displayPDF, setCamScale } from "./utils";

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

k.loadSprite("map",     "/map.png");
k.loadSprite("lampost", "/lampost.png");
k.loadSprite("rupee",   "/rupee.png");
k.loadSprite("chicken", "/Chicken Sprite Sheet.png", {
  sliceX: 8,
  sliceY: 10,
  anims: {
    "idle": { from: 0, to: 7, loop: true, speed: 4 },
    "eat": { from: 8, to: 15, loop: true, speed: 4 },
    "walk": { from: 16, to: 23, loop: true, speed: 6 },
    "happy": { from: 24, to: 31, loop: true, speed: 4 },
    "flap": { from: 32, to: 39, loop: true, speed: 6 }, // Example: add flap animation as looped
  }
});

k.loadSound("background-music", "/Eterna City (Night).mp3");
k.loadSound("tp-press-start",   "/TP_PressStart.wav");
k.loadSound("tp-get-rupee",     "/TP_Get_Rupee.wav");

k.setBackground(k.Color.fromHex("#311047"));

// Global function to handle PDF opening from dialogue buttons
window.openPDF = (pdfPath) =>
{
  displayPDF(pdfPath, () =>
  {
    // Re-enable player movement after PDF closes
    if (window.currentPlayer)
    {
      window.currentPlayer.isInDialogue = false;
    }
  });
};

k.scene("main", async () =>
{
  // Start background music with fade in
  const music = k.play("background-music", {volume: 0, loop: true});

  // Fade in the music over 3 seconds
  k.tween(0, 0.5, 3, (val) => { music.volume = val; });

  // Function to fade out music
  const fadeOutMusic = () =>
  {
    k.tween(music.volume, 0, 2, (val) => { music.volume = val; }, k.easings.easeOutQuad);
  };

  // Function to fade in music
  const fadeInMusic = () =>
  {
    k.tween(music.volume, 0.5, 2, (val) => { music.volume = val; }, k.easings.easeInQuad);
  };

  const mapData = await fetch("/map.json").then((res) => res.json());
  const layers = mapData.layers;

  const map = k.add([k.sprite("map"), k.pos(0), k.scale(scaleFactor)]);

  const player = k.make([
    k.sprite("spritesheet", { anim: "idle-down" }),
    k.area({shape: new k.Rect(k.vec2(0, 3), 10, 10)}),
    k.body(),
    k.anchor("center"),
    k.pos(),
    k.scale(scaleFactor),
    k.z(50), // Set z-index so lamppost can render in front
    {
      speed: 250,
      direction: "down",
      isInDialogue: false,
    },
    "player",
  ]);

  for (const layer of layers)
  {
    if (layer.name === "Boundary")
    {
      for (const boundary of layer.objects)
      {
        // Add collision for ALL objects (walls and interactive objects)
        map.add([
          k.area(
          {
            shape: new k.Rect(k.vec2(0), boundary.width, boundary.height),
          }),
          k.body({ isStatic: true }),
          k.pos(boundary.x, boundary.y),
          boundary.name || "wall", // Use "wall" for unnamed objects
        ]);

        // Only add dialogue for objects that have names (interactive objects)
        if (boundary.name)
        {
          player.onCollide(boundary.name, () =>
          {
            player.isInDialogue = true;

            // Play special sound effect for master sword
            if (boundary.name === "master sword")
            {
              k.play("tp-press-start", { volume: 0.7 });
            }

            displayDialogue(
              dialogueData[boundary.name] || `This is ${boundary.name}. No dialogue set yet.`,
              () => (player.isInDialogue = false)
            );
          });
        }
      }
      continue;
    }

    if (layer.name === "Spawn")
    {
      for (const entity of layer.objects)
      {
        if (entity.name === "player" || !entity.name)
        {
          // Player spawn (first unnamed or named "player" spawn point)
          player.pos = k.vec2(
            (map.pos.x + entity.x) * scaleFactor,
            (map.pos.y + entity.y) * scaleFactor
          );
          k.add(player);
          // Make player available globally for PDF overlay
          window.currentPlayer = player;

          // Add rupee pickup collision handler
          player.onCollide("rupee", (rupee) =>
          {
            // Play rupee pickup sound
            k.play("tp-get-rupee", { volume: 0.8 });
            // Make the rupee disappear
            rupee.destroy();
          });
        }
      }
    }

    if (layer.name === "Foreground")
    {
      for (const entity of layer.objects)
      {
        if (entity.name === "Lampost")
        {
          // Create lamppost entity that renders in front of player
          k.add([
            k.sprite("lampost"),
            k.pos(entity.x * scaleFactor, (entity.y + entity.height) * scaleFactor), // Position from bottom of boundary box
            k.anchor("botleft"), // Anchor from bottom-left instead of top-left
            k.scale(scaleFactor),
            k.z(100), // Higher z-index than player (50) to render in front
            "foreground"
          ]);
        }

        if (entity.name === "rupee")
        {
          // Create rupee entity centered in the boundary box
          const rupeeObj = k.add([
            k.sprite("rupee"),
            k.pos(
              (entity.x + entity.width / 2) * scaleFactor, // Center horizontally in boundary box
              (entity.y + entity.height / 2) * scaleFactor // Center vertically in boundary box
            ),
            k.anchor("center"), // Anchor from center to ensure proper centering
            k.scale(scaleFactor),
            k.z(100), // Higher z-index than player (50) to render in front
            k.area(), // Add collision area for pickup detection
            "rupee", // Tag for collision detection
            "foreground"
          ]);
        }
      }
    }

    if (layer.name === "Chickens")
    {
      for (const entity of layer.objects)
      {
        if (entity.name === "chicken")
        {
          // Create animated chicken
          const chicken = k.add([
            k.sprite("chicken", { anim: "idle" }),
            k.pos(
              entity.x * scaleFactor, // Use exact pin position
              entity.y * scaleFactor  // Use exact pin position
            ),
            k.anchor("center"),
            k.scale(scaleFactor * 0.65), // Make chicken a bit smaller
            k.z(100),
            k.body(), // Add physics body so chicken collides with walls/static boundaries
            k.area({
              shape: new k.Rect(k.vec2(-4, -4), 8, 8), // Even smaller collision box
            }),
            {
              wanderTimer: 0,
              wanderDirection: k.vec2(0, 0),
              speed: 10,
              originalPos: k.vec2(entity.x * scaleFactor, entity.y * scaleFactor), // Store original position
              maxWanderDistance: 40, // Max distance from original position
              isMoving: false,
              pauseTimer: 0,
            },
            "chicken",
            "foreground"
          ]);

          // Make chicken wander around in small area
          chicken.onUpdate(() =>
          {
            if (chicken.isMoving)
            {
              chicken.wanderTimer -= k.dt();
              if (chicken.wanderTimer <= 0)
              {
                chicken.isMoving = false;
                chicken.pauseTimer = k.rand(2, 5);
                chicken.wanderDirection = k.vec2(0, 0);
                // Randomly choose pause animation
                const anims = ["idle", "eat", "happy"];
                chicken.play(anims[Math.floor(k.rand(0, anims.length))]);
              }
              else
              {
                const distanceFromOriginal = chicken.pos.dist(chicken.originalPos);
                if (distanceFromOriginal > chicken.maxWanderDistance)
                {
                  chicken.wanderDirection = chicken.originalPos.sub(chicken.pos).unit();
                }
                chicken.move(chicken.wanderDirection.scale(chicken.speed));
                // Use walk animation while moving
                chicken.play("walk");
              }
            }
            else
            {
              chicken.pauseTimer -= k.dt();
              if (chicken.pauseTimer <= 0)
              {
                chicken.isMoving = true;
                chicken.wanderTimer = k.rand(1, 2.5);
                const distanceFromOriginal = chicken.pos.dist(chicken.originalPos);
                if (distanceFromOriginal > chicken.maxWanderDistance * 0.7)
                {
                  const towardsCenter = chicken.originalPos.sub(chicken.pos).unit();
                  const randomDirection = k.vec2(k.rand(-1, 1), k.rand(-1, 1)).unit();
                  chicken.wanderDirection = towardsCenter.scale(0.7).add(randomDirection.scale(0.3)).unit();
                }
                else
                {
                  chicken.wanderDirection = k.vec2(k.rand(-1, 1), k.rand(-1, 1)).unit();
                }
              }
            }
          });

          // Player interaction with chicken
          player.onCollide("chicken", () =>
          {
            if (!player.isInDialogue)
            {
              player.isInDialogue = true;
              displayDialogue(
                dialogueData["chicken"] || "Bawk bawk! 🐔",
                () => (player.isInDialogue = false)
              );
            }
          });
        }
      }
    }
  }



  setCamScale(k);

  k.onResize(() => { setCamScale(k); });

  k.onUpdate(() => { k.camPos(player.worldPos().x, player.worldPos().y + 100); });

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

  // Debug mode - press D to toggle collision boundaries visibility
  k.onKeyPress("d", () => { k.debug.inspect = !k.debug.inspect; });

  // Press M to fade out music (for demonstration)
  k.onKeyPress("m", () => { fadeOutMusic(); });

  // Press N to fade in music (restore music)
  k.onKeyPress("n", () => { fadeInMusic(); });

  // Scene cleanup - fade out music when leaving scene
  k.onSceneLeave(() => { fadeOutMusic(); });
});

k.go("main");