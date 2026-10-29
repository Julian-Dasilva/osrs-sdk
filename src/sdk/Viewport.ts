"use strict";
import { Settings } from "./Settings";
import { ClickController } from "./ClickController";
import { Player } from "./Player";
import { ContextMenu } from "./ContextMenu";
import { World } from "./World";
import { ControlPanelController } from "./ControlPanelController";
import { MapController } from "./MapController";
import { XpDropController } from "./XpDropController";
import { ImageLoader } from "./utils/ImageLoader";
import ButtonActiveIcon from "../assets/images/interface/button_active.png";
import { CardinalDirection, Region } from "./Region";
import { Viewport3d } from "./Viewport3d";
import { Location } from "./Location";
import { Mob } from "./Mob";
import { Item } from "./Item";
import { Viewport2d } from "./Viewport2d";
import { Trainer } from "./Trainer";
import { Component } from "./ui/Component";
import { ToggleButton } from "./ui/ToggleButton";
import { ScreenPoint } from "./rendering/utils/projectedClickbox";
import { FixedLayout } from "./FixedLayout";

type ViewportEntitiesClick = {
  type: "entities";
  mobs: Mob[];
  players: Player[];
  groundItems: Item[];
  location: Location | null;
};

type ViewportCoordinateClick = {
  type: "coordinate";
  location: Location;
};

type ViewportClickResult = ViewportEntitiesClick | ViewportCoordinateClick | null;

type ViewportDrawResult =
  | { kind: "copy"; canvas: OffscreenCanvas; flip: boolean; offsetX: number; offsetY: number }
  | { kind: "layered"; uiCanvas: OffscreenCanvas };

const BOSS_BAR_WIDTH = 300;
const BOSS_BAR_HEIGHT = 50;
const BOSS_BAR_TOP = 36;
const BOSS_BAR_HORIZONTAL_OFFSET = -60;
const BOSS_BAR_INNER_PADDING = 2;

export interface ViewportDelegate {
  initialise(world: World, region: Region): Promise<void>;
  // resolves once the first frame that draws the world has reached the screen
  firstFramePresented(): Promise<void>;
  // resolves with the error if the render that draws the world fails
  firstFrameFailed(): Promise<Error>;
  reset();
  clientTick?(region: Region, timestamp?: number): void;

  draw(world: World, region: Region): ViewportDrawResult;

  // translate the click (relative to the viewport) to a location in the world or something that got clicked
  translateClick(offsetX: number, offsetY: number, world: World, viewport: Viewport): ViewportClickResult;

  // the inverse of translateClick for the floor: a point whose click resolves to the tile, or null if no point on the canvas does
  projectTile(tile: Location, world: World, viewport: Viewport): ScreenPoint | null;

  getMapRotation(): number;

  setMapRotation(direction: CardinalDirection);

  resize?(width: number, height: number): void;

  // fixed mode: where the delegate's own canvas, if it has one, sits over the frame's game view (CSS pixels from the page)
  place?(box: Readonly<{ left: number; top: number; width: number; height: number }> | null): void;
}

export class Viewport {
  static viewport: Viewport;
  static setupViewport(region: Region, canvas: HTMLCanvasElement, resizeTarget: Element, force2d = false) {
    const faceInitialSouth = region.initialFacing === CardinalDirection.SOUTH;
    // called after Settings have been initialized
    Viewport.viewport = new Viewport(
      Settings.use3dView && !force2d ? new Viewport3d(faceInitialSouth, canvas) : new Viewport2d(),
      canvas,
      resizeTarget,
    );
  }

  activeButtonImage: HTMLImageElement = ImageLoader.createImage(ButtonActiveIcon);
  contextMenu: ContextMenu = new ContextMenu();

  private clickController: ClickController;
  private resizeObserver: ResizeObserver | null = null;
  /** The canvas's style as mounted, restored when fixed mode turns off. */
  private readonly fullAreaStyle: string;
  private fixedPlaced = false;
  private laidOutFixed = false;
  private unsubscribeSettings: (() => void) | null = null;
  width: number;
  height: number;

  public components: Component[] = [];

  constructor(
    private delegate: ViewportDelegate,
    readonly canvas: HTMLCanvasElement,
    private readonly resizeTarget: Element,
  ) {
    this.fullAreaStyle = canvas.style.cssText;
    if (typeof ResizeObserver === "undefined") {
      throw new Error("ResizeObserver is required to mount a viewport");
    }
    this.resizeObserver = new ResizeObserver(([entry]) => {
      this.resize(entry.contentRect.width, entry.contentRect.height);
    });
    this.resizeObserver.observe(this.resizeTarget);
    this.laidOutFixed = Settings.fixedMode;
    this.unsubscribeSettings = Settings.subscribe(() => {
      if (Settings.fixedMode === this.laidOutFixed) return;
      this.laidOutFixed = Settings.fixedMode;
      this.relayout();
    });
  }

  /**
   * Return all objects or world coordinates at the given position (relative to the top-left of the viewport).
   * The location is null when the position shows no floor, and the result is null when it shows nothing.
   */
  translateClick(offsetX: number, offsetY: number, world: World): ViewportClickResult {
    if (!FixedLayout.enabled) return this.delegate.translateClick(offsetX, offsetY, world, this);
    const game = FixedLayout.gameView(FixedLayout.scaleOf(this.canvas.width));
    const x = offsetX - game.x;
    const y = offsetY - game.y;
    // In fixed mode only the game view shows the world; the frame around it shows nothing to click.
    if (x < 0 || y < 0 || x >= game.width || y >= game.height) return null;
    return this.delegate.translateClick(x, y, world, this);
  }

  /**
   * Return a whole-pixel point (relative to the top-left of the viewport) whose click resolves to the given tile's floor,
   * or null when no point on the canvas does. UI drawn over the viewport is not considered.
   */
  projectTile(tile: Location, world: World): ScreenPoint | null {
    const point = this.delegate.projectTile(tile, world, this);
    if (point === null || !FixedLayout.enabled) return point;
    const game = FixedLayout.gameView(FixedLayout.scaleOf(this.canvas.width));
    return { x: point.x + game.x, y: point.y + game.y };
  }

  get context() {
    return this.canvas.getContext("2d") as CanvasRenderingContext2D;
  }

  setPlayer(player: Player) {
    Trainer.setPlayer(player);
    if (!this.clickController) {
      this.clickController = new ClickController(this);
      this.clickController.registerClickActions();
    }
    Trainer.setClickController(this.clickController);
  }

  /** Recalculate viewport and backing-canvas dimensions from the playable area. */
  resize(width: number, height: number) {
    width = Math.max(1, Math.round(width));
    height = Math.max(1, Math.round(height));
    if (!Trainer.player?.region) return;
    if (FixedLayout.enabled) {
      this.resizeFixed(width, height);
      return;
    }
    if (this.fixedPlaced) {
      this.canvas.style.cssText = this.fullAreaStyle;
      this.delegate.place?.(null);
      this.fixedPlaced = false;
    }
    Settings._tileSize = width / Trainer.player.region.width;
    this.width = width / Settings.tileSize;
    this.height = height / Settings.tileSize;
    if (width !== this.canvas.width || height !== this.canvas.height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    this.delegate.resize?.(width, height);
  }

  /** Lays the viewport out again for the current playable area, as after a resize; call it after changing `Settings.fixedMode`. */
  relayout() {
    const area = this.resizeTarget.getBoundingClientRect();
    this.resize(area.width, area.height);
  }

  /**
   * Fixed mode: the canvas becomes the 765 by 503 frame scaled to fit the playable area and centred in it, and the
   * delegate renders only the frame's game view. The UI controllers read the canvas's size, so they lay out in the frame.
   */
  private resizeFixed(areaWidth: number, areaHeight: number) {
    const { left, top, scale } = FixedLayout.place(areaWidth, areaHeight);
    this.fixedPlaced = true;
    const width = Math.round(765 * scale);
    const height = Math.round(503 * scale);
    this.canvas.style.inset = "auto";
    this.canvas.style.left = `${left}px`;
    this.canvas.style.top = `${top}px`;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    if (width !== this.canvas.width || height !== this.canvas.height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    const game = FixedLayout.gameView(FixedLayout.scaleOf(width));
    const gameWidth = Math.round(game.width);
    const gameHeight = Math.round(game.height);
    Settings._tileSize = gameWidth / Trainer.player.region.width;
    this.width = gameWidth / Settings.tileSize;
    this.height = gameHeight / Settings.tileSize;
    this.delegate.place?.({
      left: left + Math.round(game.x),
      top: top + Math.round(game.y),
      width: gameWidth,
      height: gameHeight,
    });
    this.delegate.resize?.(gameWidth, gameHeight);
  }

  // called after all graphics have loaded
  async initialise() {
    await this.delegate.initialise(Trainer.player.region.world, Trainer.player.region);
    return;
  }

  reset(region: Region) {
    this.delegate.reset();
    this.delegate.setMapRotation(region.initialFacing);
    this.components = [];
  }

  dispose() {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.unsubscribeSettings?.();
    this.unsubscribeSettings = null;
  }

  getViewport(tickPercent: number) {
    if (Trainer.player.dying > -1) {
      tickPercent = 0;
    }
    const { x, y } = Trainer.player.getPerceivedLocation(tickPercent);
    const viewportX = x + 0.5 - this.width / 2;
    const viewportY = y + 0.5 - this.height / 2;
    return { viewportX, viewportY };
  }

  drawText(text: string, x: number, y: number) {
    x = Math.floor(x);
    y = Math.floor(y);
    this.context.fillStyle = "#000";
    this.context.fillText(text, x - 2, y - 2);
    this.context.fillText(text, x + 2, y - 2);
    this.context.fillText(text, x, y);
    this.context.fillText(text, x, y - 4);
    this.context.fillStyle = "#FFFFFF";
    this.context.fillText(text, x, y - 2);
  }

  tick() {
    if (MapController.controller && Trainer.player) {
      MapController.controller.updateOrbsMask(Trainer.player.currentStats, Trainer.player.stats);
    }
  }

  clientTick(timestamp?: number) {
    if (Trainer.player) {
      this.delegate.clientTick?.(Trainer.player.region, timestamp);
    }
  }

  getMapRotation() {
    return this.delegate.getMapRotation();
  }

  rotateSouth() {
    this.delegate.setMapRotation(CardinalDirection.SOUTH);
  }

  rotateNorth() {
    this.delegate.setMapRotation(CardinalDirection.NORTH);
  }

  rotateEast() {
    this.delegate.setMapRotation(CardinalDirection.EAST);
  }

  rotateWest() {
    this.delegate.setMapRotation(CardinalDirection.WEST);
  }

  getDelegate() {
    return this.delegate;
  }

  draw(world: World): void {
    this.context.globalAlpha = 1;
    this.context.fillStyle = "#3B3224";
    this.context.restore();
    this.context.save();
    const { width, height } = this.canvas;
    const frame = this.delegate.draw(world, Trainer.player.region);
    switch (frame.kind) {
      case "copy":
        this.context.fillStyle = "black";
        this.context.fillRect(0, 0, width, height);
        if (frame.flip) {
          this.context.rotate(Math.PI);
          this.context.translate(-width, -height);
        }
        this.context.drawImage(frame.canvas, frame.offsetX, frame.offsetY);
        break;
      case "layered":
        this.context.clearRect(0, 0, width, height);
        if (FixedLayout.enabled) {
          const game = FixedLayout.gameView(FixedLayout.scaleOf(width));
          this.context.drawImage(frame.uiCanvas, Math.round(game.x), Math.round(game.y));
        } else {
          this.context.drawImage(frame.uiCanvas, 0, 0);
        }
        break;
      default: {
        const unhandled: never = frame;
        return unhandled;
      }
    }
    this.context.restore();
    this.context.save();

    if (FixedLayout.enabled) {
      const scale = FixedLayout.scaleOf(width);
      FixedLayout.drawFrame(this.context, scale);
      const game = FixedLayout.gameView(scale);
      this.context.save();
      this.context.translate(game.x, 0);
      this.drawBossHealthBar(Trainer.player.region, game.width);
      this.context.restore();
    } else {
      this.drawBossHealthBar(Trainer.player.region, width);
    }

    // draw control panel
    ControlPanelController.controller.draw(this.context);
    XpDropController.controller.draw(this.context, width - 140 - MapController.controller.width, 0, world.tickPercent);
    MapController.controller.draw(this.context);
    this.clickController.drawHoverTooltip(this.context);
    this.contextMenu.draw(this.context);

    this.components.forEach((component) => component.draw(this.context, Settings.maxUiScale, 0, 0));

    if (this.clickController.clickAnimation) {
      this.clickController.clickAnimation.draw(this.context, world.fps);
    }

    this.context.restore();
    this.context.save();
    this.context.textAlign = "left";
    if (world.getReadyTimer > 0 && !world.isPaused) {
      this.context.font = "72px OSRS";
      this.context.textAlign = "center";
      const anchor = Viewport.countdownAnchor(width, height);
      this.drawText(`GET READY...${world.getReadyTimer}`, anchor.x, anchor.y);
    }
    this.context.restore();
  }

  /** Where the countdown is centred: 50 pixels above the middle of the game view, which fixed mode insets in its frame. */
  static countdownAnchor(width: number, height: number): Readonly<{ x: number; y: number }> {
    if (!FixedLayout.enabled) return { x: width / 2, y: height / 2 - 50 };
    const game = FixedLayout.gameView(FixedLayout.scaleOf(width));
    return { x: game.x + game.width / 2, y: game.y + game.height / 2 - 50 };
  }

  private drawBossHealthBar(region: Region, viewportWidth: number) {
    const boss = region.primaryBoss;
    if (!boss || !Settings.displayBossHealthBar) return;

    const width = Math.min(BOSS_BAR_WIDTH, viewportWidth - 16);
    const centeredX = (viewportWidth - width) / 2 + BOSS_BAR_HORIZONTAL_OFFSET;
    const x = Math.round(Math.max(8, Math.min(centeredX, viewportWidth - width - 8)));
    const y = BOSS_BAR_TOP;
    const current = Math.max(0, boss.currentStats.hitpoint);
    const maximum = Math.max(1, boss.stats.hitpoint);
    const healthRatio = Math.min(1, current / maximum);

    this.context.save();
    this.context.fillStyle = "#090806";
    this.context.fillRect(x, y, width, BOSS_BAR_HEIGHT);
    this.context.fillStyle = "#211e18";
    this.context.fillRect(x + 4, y + 4, width - 8, BOSS_BAR_HEIGHT - 8);

    this.context.font = "18px Stats_11";
    this.context.textAlign = "center";
    this.context.fillStyle = "black";
    this.context.fillText(boss.mobName(), x + width / 2 + 1, y + 18 + 1);
    this.context.fillStyle = "#d87532";
    this.context.fillText(boss.mobName(), x + width / 2, y + 18);

    const barX = x + BOSS_BAR_INNER_PADDING;
    const barY = y + 24;
    const barWidth = width - BOSS_BAR_INNER_PADDING * 2;
    const barHeight = 24;
    this.context.fillStyle = "#050403";
    this.context.fillRect(barX, barY, barWidth, barHeight);
    this.context.fillStyle = "#e00000";
    this.context.fillRect(
      barX + BOSS_BAR_INNER_PADDING,
      barY + BOSS_BAR_INNER_PADDING,
      barWidth - BOSS_BAR_INNER_PADDING * 2,
      barHeight - BOSS_BAR_INNER_PADDING * 2,
    );
    this.context.fillStyle = "#00d900";
    this.context.fillRect(
      barX + BOSS_BAR_INNER_PADDING,
      barY + BOSS_BAR_INNER_PADDING,
      Math.round((barWidth - BOSS_BAR_INNER_PADDING * 2) * healthRatio),
      barHeight - BOSS_BAR_INNER_PADDING * 2,
    );

    const textX = x + width / 2;
    const textY = barY + 17;
    this.context.fillStyle = "black";
    this.context.fillText(`${current} / ${maximum} (${(healthRatio * 100).toFixed(1)}%)`, textX + 1, textY + 1);
    this.context.fillStyle = "white";
    this.context.fillText(`${current} / ${maximum} (${(healthRatio * 100).toFixed(1)}%)`, textX, textY);
    this.context.restore();
  }
}
