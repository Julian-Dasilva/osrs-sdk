import * as THREE from "three";
import { Location } from "../../src/sdk/Location";
import { Player } from "../../src/sdk/Player";
import { CardinalDirection } from "../../src/sdk/Region";
import { Settings } from "../../src/sdk/Settings";
import { Viewport } from "../../src/sdk/Viewport";
import { Viewport3d } from "../../src/sdk/Viewport3d";
import { World } from "../../src/sdk/World";
import { TestNpc } from "../../src/sdk/testing/TestNpc";
import { TestRegion } from "../../src/sdk/testing/TestRegion";
import {
  ClientCameraRotation,
  MAX_CAMERA_PITCH,
  MIN_CAMERA_PITCH,
  RELAXED_MAX_CAMERA_PITCH,
  RELAXED_MIN_CAMERA_PITCH,
} from "../../src/sdk/utils/camera/CameraRotation";
import { cameraOrbitDistance } from "../../src/sdk/utils/camera/CameraOrbit";

jest.mock("three", () => ({
  ...jest.requireActual("three"),
  GLTFLoader: class {
    setMeshoptDecoder() {
      return this;
    }
  },
}));

// jsdom's MouseEvent has no layout, so the canvas offset a browser would compute is set by hand.
function dispatch(type: "mousedown" | "mousemove", point: { x: number; y: number }, init: MouseEventInit = {}) {
  const event = new MouseEvent(type, init);
  Object.defineProperty(event, "offsetX", { value: point.x });
  Object.defineProperty(event, "offsetY", { value: point.y });
  Viewport.viewport.canvas.dispatchEvent(event);
}

async function walkOrderedBy(
  world: World,
  player: Player,
  point: { x: number; y: number },
  init: MouseEventInit = { button: 0 },
) {
  dispatch("mousedown", point, init);
  await new Promise((resolve) => setTimeout(resolve, Settings.inputDelay));
  world.tickWorld();
  return player.destinationLocation;
}

describe("2D tile projection", () => {
  let world: World;
  let player: Player;

  function mount(at: Location, rotated: "north" | "south") {
    Settings.readFromStorage();
    const region = new TestRegion(40, 40);
    world = new World();
    region.world = world;
    world.addRegion(region);
    Viewport.setupViewport(region, document.createElement("canvas"), document.createElement("div"), true);
    player = new Player(region, at);
    region.addPlayer(player);
    Viewport.viewport.setPlayer(player);
    Viewport.viewport.resize(800, 600);
    Settings.rotated = rotated;
  }

  test.each([
    [{ x: 14, y: 14 }, "north", { x: 16, y: 14 }, { x: 440, y: 300 }],
    [{ x: 14, y: 14 }, "south", { x: 16, y: 14 }, { x: 360, y: 300 }],
    [{ x: 14, y: 14 }, "north", { x: 3, y: 25 }, { x: 180, y: 520 }],
    [{ x: 14, y: 14 }, "south", { x: 3, y: 25 }, { x: 620, y: 80 }],
    [{ x: 30, y: 8 }, "north", { x: 33, y: 20 }, { x: 460, y: 540 }],
    [{ x: 30, y: 8 }, "south", { x: 33, y: 20 }, { x: 340, y: 60 }],
    [{ x: 30, y: 8 }, "north", { x: 12, y: 0 }, { x: 40, y: 140 }],
    [{ x: 30, y: 8 }, "south", { x: 12, y: 0 }, { x: 760, y: 460 }],
  ] as const)(
    "with the camera on %o facing %s, %o projects to %o and a click there walks to it",
    async (at, rotated, tile, point) => {
      mount(at, rotated);

      const projected = Viewport.viewport.projectTile(tile, world);

      expect([projected, await walkOrderedBy(world, player, projected)]).toEqual([point, tile]);
    },
  );

  test.each(["north", "south"] as const)(
    "facing %s, a tile past the canvas edge has no point, and the tile inside it does",
    (rotated) => {
      mount({ x: 14, y: 14 }, rotated);

      expect(
        [
          { x: 36, y: 14 },
          { x: 14, y: 31 },
          { x: 33, y: 28 },
        ].map((tile) => Viewport.viewport.projectTile(tile, world)),
      ).toEqual(rotated === "north" ? [null, null, { x: 780, y: 580 }] : [null, null, { x: 20, y: 20 }]);
    },
  );
});

describe("3D tile projection", () => {
  // jsdom has no WebGL context, so the viewport is built around the camera rig its constructor builds, with a renderer that only takes a size.
  function viewport3d(
    focal: { x: number; y: number },
    facing: CardinalDirection,
    pitch: number,
    canvas = { width: 800, height: 600 },
  ) {
    const viewport = Object.create(Viewport3d.prototype);
    Object.assign(viewport, {
      canvas: { width: 1, height: 1 },
      uiCanvas: { width: 1, height: 1 },
      renderer: { setSize: () => undefined },
      canvasDimensions: { width: 1, height: 1 },
      camera: new THREE.PerspectiveCamera(70, 1, 0.1, 50),
      raycaster: new THREE.Raycaster(),
      scene: new THREE.Scene(),
      pivot: new THREE.Object3D(),
      yaw: new THREE.Object3D(),
      pitch: new THREE.Object3D(),
      yawDelta: 0,
      pitchDelta: 0,
      orbitZoomOffset: 0,
      clientCameraRotation: new ClientCameraRotation(),
      projectedClickboxes: new Map(),
      pickingPointer: null,
    });
    viewport.pivot.add(viewport.yaw);
    viewport.yaw.add(viewport.pitch);
    viewport.pitch.add(viewport.camera);
    viewport.pivot.position.set(focal.x, 0, focal.y);
    viewport.pitch.rotation.x = pitch;
    viewport.camera.position.z = cameraOrbitDistance(pitch);
    viewport.setMapRotation(facing);
    viewport.resize(canvas.width, canvas.height);
    viewport.camera.updateWorldMatrix(true, false);
    return viewport as Viewport3d;
  }

  function clickedTile(viewport: Viewport3d, point: { x: number; y: number } | null) {
    if (!point) return null;
    const click = viewport.translateClick(point.x, point.y, null, null);
    return click && { x: Math.floor(click.location.x), y: Math.floor(click.location.y) };
  }

  const tiles = [
    { x: 20, y: 20 },
    { x: 22, y: 19 },
    { x: 17, y: 23 },
    { x: 23, y: 24 },
    { x: 18, y: 16 },
  ];

  const facing = {
    north: CardinalDirection.NORTH,
    south: CardinalDirection.SOUTH,
    east: CardinalDirection.EAST,
    west: CardinalDirection.WEST,
  };

  test.each([
    [{ x: 20.5, y: 19.5 }, "north", -0.7],
    [{ x: 20.5, y: 19.5 }, "south", -0.7],
    [{ x: 20.5, y: 19.5 }, "east", MIN_CAMERA_PITCH],
    [{ x: 20.5, y: 19.5 }, "west", MAX_CAMERA_PITCH],
    [{ x: 19, y: 21 }, "south", MIN_CAMERA_PITCH],
  ] as const)(
    "with the camera on %o facing %s at pitch %f, a click on each tile's projection resolves to that tile",
    (focal, toward, pitch) => {
      const viewport = viewport3d(focal, facing[toward], pitch);

      expect(tiles.map((tile) => clickedTile(viewport, viewport.projectTile(tile)))).toEqual(tiles);
    },
  );

  test("with a level camera, a floor tile behind it has no point, and a click on the tile ahead resolves to that tile", () => {
    const viewport = viewport3d({ x: 20.5, y: 19.5 }, facing.north, RELAXED_MAX_CAMERA_PITCH);

    const [behind, ahead] = [
      { x: 20, y: 40 },
      { x: 20, y: 10 },
    ].map((tile) => viewport.projectTile(tile));

    expect([behind, clickedTile(viewport, ahead)]).toEqual([null, { x: 20, y: 10 }]);
  });

  test("a tile past the canvas edge has no point, and a click on the tile inside it resolves to that tile", () => {
    const viewport = viewport3d({ x: 20.5, y: 19.5 }, facing.north, -0.7);

    const [outside, inside] = [
      { x: 0, y: 14 },
      { x: 20, y: 20 },
    ].map((tile) => viewport.projectTile(tile));

    expect([outside, clickedTile(viewport, inside)]).toEqual([null, { x: 20, y: 20 }]);
  });

  function tilesSomePixelSelects(viewport: Viewport3d, canvas: { width: number; height: number }, tiles: Location[]) {
    const selected = new Set<string>();
    for (let x = 0; x < canvas.width; x++) {
      for (let y = 0; y < canvas.height; y++) {
        const tile = clickedTile(viewport, { x, y });
        if (tile) selected.add(`${tile.x},${tile.y}`);
      }
    }
    return tiles.map((tile) => (selected.has(`${tile.x},${tile.y}`) ? tile : null));
  }

  describe("with camera pitch unclamped", () => {
    beforeEach(() => Settings.set({ relaxCameraPitch: true }));
    afterEach(() => Settings.set({ relaxCameraPitch: false }));

    const canvas = { width: 1280, height: 800 };

    function levelCameraFromTheKeyAndWheelHandlers() {
      const viewport = viewport3d({ x: 5.5, y: 0.5 }, facing.south, -0.7, canvas);
      viewport.onKeyDown(new KeyboardEvent("keydown", { key: "ArrowDown" }));
      viewport.updateCamera(1);
      viewport.onKeyUp(new KeyboardEvent("keyup", { key: "ArrowDown" }));
      viewport.onDocumentMouseWheel(new WheelEvent("wheel", { deltaY: 3062.5 }));
      viewport.updateCamera(0);
      Reflect.get(viewport, "camera").updateWorldMatrix(true, false);
      return viewport;
    }

    function mountPlayer(delegate: Viewport3d) {
      const region = new TestRegion(40, 40);
      const world = new World();
      region.world = world;
      world.addRegion(region);
      Viewport.viewport = new Viewport(delegate, document.createElement("canvas"), document.createElement("div"));
      const player = new Player(region, { x: 5, y: 0 });
      region.addPlayer(player);
      Viewport.viewport.setPlayer(player);
      Viewport.viewport.resize(canvas.width, canvas.height);
      return { world, region, player };
    }

    test("lowered to level and zoomed out by the key and wheel handlers, a tile has a point exactly when some pixel selects it", () => {
      const viewport = levelCameraFromTheKeyAndWheelHandlers();
      const camera = Reflect.get(viewport, "camera");
      const column = [0, 1, 2, 3, 4].map((y) => ({ x: 11, y }));

      expect({
        pitch: Reflect.get(viewport, "pitch").rotation.x,
        distance: camera.position.z,
        clicked: column.map((tile) => clickedTile(viewport, viewport.projectTile(tile))),
      }).toEqual({ pitch: 0, distance: 20, clicked: tilesSomePixelSelects(viewport, canvas, column) });
    });

    test("at a level camera, a press on the sky leaves the player on its tile, and a press on the floor walks there", async () => {
      const viewport = levelCameraFromTheKeyAndWheelHandlers();
      const { world, player } = mountPlayer(viewport);

      expect([
        await walkOrderedBy(world, player, { x: 640, y: 0 }),
        await walkOrderedBy(world, player, viewport.projectTile({ x: 12, y: 3 })),
      ]).toEqual([
        { x: 5, y: 0 },
        { x: 12, y: 3 },
      ]);
    });

    test("at a level camera, a mob drawn against the sky offers its attack, a press attacks it, and a Shift-press on it leaves the player on its tile, with no handler error", async () => {
      const viewport = levelCameraFromTheKeyAndWheelHandlers();
      const { world, region, player } = mountPlayer(viewport);
      const npc = new (class extends TestNpc {
        override get size() {
          return 1;
        }
      })(region, { x: 15, y: 0 }, {});
      region.addMob(npc);
      const clickbox = new THREE.Box3(new THREE.Vector3(15, -0.5, -1), new THREE.Vector3(16, 3, 0));
      Reflect.set(
        viewport,
        "knownActors",
        new Map([
          [
            npc,
            {
              getModel: () => ({
                getClickboxBounds: () => clickbox,
                getClickboxVertices: () => [clickbox.min, clickbox.max],
                getClickboxTriangles: () => [],
              }),
            },
          ],
        ]),
      );
      Reflect.get(viewport, "refreshProjectedClickboxes").call(viewport);
      const sky = viewport.projectToScreen(new THREE.Vector3(15.5, 2, -0.5));
      const handlerErrors: string[] = [];
      const recordError = (event: ErrorEvent) => handlerErrors.push(event.message);
      window.addEventListener("error", recordError);

      dispatch("mousedown", sky, { button: 2 });
      const menu = Viewport.viewport.contextMenu.menuOptions.map((option) =>
        option.text.map(({ text }) => text).join(""),
      );
      const shiftPress = await walkOrderedBy(world, player, sky, { button: 0, shiftKey: true });
      await walkOrderedBy(world, player, sky);
      window.removeEventListener("error", recordError);

      expect({ menu, shiftPress, attacking: player.aggro === npc, handlerErrors }).toEqual({
        menu: ["Attack  (level 99)"],
        shiftPress: { x: 5, y: 0 },
        attacking: true,
        handlerErrors: [],
      });
    });
  });

  const around = [
    { x: 0, y: 1 },
    ...Array.from({ length: 21 * 21 }, (_, i) => ({ x: 10 + (i % 21), y: 10 + Math.floor(i / 21) })),
  ];

  test.each([
    { width: 128, height: 80 },
    { width: 60, height: 130 },
  ])(
    "on a %o canvas at every camera the handlers allow, a tile has a point exactly when some pixel selects it",
    (canvas) => {
      for (let turn = 0; turn < 16; turn++) {
        for (const pitch of [
          RELAXED_MIN_CAMERA_PITCH,
          MIN_CAMERA_PITCH,
          -0.7,
          MAX_CAMERA_PITCH,
          -0.05,
          RELAXED_MAX_CAMERA_PITCH,
        ]) {
          for (const distance of [2, 2.3, cameraOrbitDistance(pitch), 20]) {
            const viewport = viewport3d({ x: 20.5, y: 19.5 }, facing.north, pitch, canvas);
            Reflect.get(viewport, "yaw").rotation.y = (turn * Math.PI) / 8;
            const camera = Reflect.get(viewport, "camera");
            camera.position.z = distance;
            camera.updateWorldMatrix(true, false);

            expect({
              turn,
              pitch,
              distance,
              clicked: around.map((tile) => clickedTile(viewport, viewport.projectTile(tile))),
            }).toEqual({ turn, pitch, distance, clicked: tilesSomePixelSelects(viewport, canvas, around) });
          }
        }
      }
    },
  );
});
