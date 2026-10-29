"use strict";
import { AccountControls } from "./controlpanels/AccountControls";
import { FixedLayout, SIDE_PANEL, GAME_VIEW } from "./FixedLayout";
import { AncientsSpellbookControls } from "./controlpanels/AncientsSpellbookControls";
import { BaseControls } from "./controlpanels/BaseControls";
import { ClanChatControls } from "./controlpanels/ClanChatControls";
import { CombatControls } from "./controlpanels/CombatControls";
import { EmotesControls } from "./controlpanels/EmotesControls";
import { EmptyControls } from "./controlpanels/EmptyControls";
import { EquipmentControls } from "./controlpanels/EquipmentControls";
import { FriendsControls } from "./controlpanels/FriendsControls";
import { InventoryControls } from "./controlpanels/InventoryControls";
import { MusicControls } from "./controlpanels/MusicControls";
import { PrayerControls } from "./controlpanels/PrayerControls";
import { QuestsControls } from "./controlpanels/QuestsControls";
import { SettingsControls } from "./controlpanels/SettingsControls";
import { StatsControls } from "./controlpanels/StatsControls";
import { Settings } from "./Settings";
import { Location } from "./Location";
import { Chrome } from "./Chrome";
import { MapController } from "./MapController";
import { BoostPanel } from "./BoostPanel";
import type { MultiColorTextBlock } from "./ContextMenu";

interface TabPosition {
  x: number;
  y: number;
}

const BASE_WIDTH = 33 * 7;
const BASE_HEIGHT = 36 * 2 + 275;

const PANEL_BORDER = 7;

export class ControlPanelController {
  static controls = Object.freeze({
    COMBAT: new CombatControls(),
    INVENTORY: new InventoryControls(),
    PRAYER: new PrayerControls(),
    EQUIPMENT: new EquipmentControls(),
    STATS: new StatsControls(),
    ANCIENTSSPELLBOOK: new AncientsSpellbookControls(),
    SETTINGS: new SettingsControls(),
  });

  static controller = new ControlPanelController();

  desktopControls: BaseControls[];
  mobileControls: BaseControls[];
  controls: BaseControls[];
  selectedControl: BaseControls;

  public width: number;
  public height: number;

  private boostPanel = new BoostPanel();

  isUsingExternalUI = false;

  constructor() {
    this.width = BASE_WIDTH;
    this.height = BASE_HEIGHT;

    this.desktopControls = [
      ControlPanelController.controls.COMBAT,
      ControlPanelController.controls.STATS,
      new QuestsControls(),
      ControlPanelController.controls.INVENTORY,
      ControlPanelController.controls.EQUIPMENT,
      ControlPanelController.controls.PRAYER,
      ControlPanelController.controls.ANCIENTSSPELLBOOK,
      new EmptyControls(),
      new FriendsControls(),
      new AccountControls(),
      new ClanChatControls(),
      ControlPanelController.controls.SETTINGS,
      new EmotesControls(),
      new MusicControls(),
    ];

    this.mobileControls = [
      ControlPanelController.controls.COMBAT,
      ControlPanelController.controls.PRAYER,
      ControlPanelController.controls.ANCIENTSSPELLBOOK,
      new EmotesControls(),
      new ClanChatControls(),
      new FriendsControls(),
      new AccountControls(),

      // break
      ControlPanelController.controls.INVENTORY,
      ControlPanelController.controls.EQUIPMENT,
      ControlPanelController.controls.STATS,
      new QuestsControls(),
      new MusicControls(),
      ControlPanelController.controls.SETTINGS,
      new EmptyControls(),
    ];
    this.controls = Settings.mobileCheck() ? this.mobileControls : this.desktopControls;

    this.selectedControl = ControlPanelController.controls.PRAYER;
    document.addEventListener("keydown", (event) => {
      if (Settings.is_keybinding) {
        return;
      }

      if (this.isUsingExternalUI) {
        return;
      }

      this.controls.forEach((control) => {
        if (control.keyBinding === event.key) {
          this.selectedControl = control;
          event.preventDefault();
        }
      });
    });
  }

  getTabScale() {
    const { width, height } = Chrome.size();
    if (FixedLayout.enabled) {
      // Fixed mode: the canvas is the frame, so tabs and panel take the frame's scale and the panel fills its 190 by 261 box.
      const scale = FixedLayout.scaleOf(width);
      Settings.controlPanelScale = scale;
      this.width = BASE_WIDTH * scale;
      this.height = BASE_HEIGHT * scale;
      return scale;
    }

    const controlAreaHeight = height - MapController.controller.height;
    let scaleRatio = controlAreaHeight / 7 / 36;

    let maxScaleRatio = Settings.maxUiScale;
    if (Settings.mobileCheck() && width > 600) {
      maxScaleRatio = Settings.maxUiScale * 1.1;
    }

    if (scaleRatio > maxScaleRatio) {
      scaleRatio = maxScaleRatio;
    }

    // not the best place for these setters...
    Settings.controlPanelScale = scaleRatio * 0.915;
    this.width = BASE_WIDTH * scaleRatio;
    this.height = BASE_HEIGHT * scaleRatio;

    return scaleRatio;
  }

  boostPosition() {
    const { width, height } = Chrome.size();
    const scale = this.getTabScale();
    if (FixedLayout.enabled) {
      return { x: (GAME_VIEW.x + 4) * scale, y: (GAME_VIEW.y + GAME_VIEW.height - 4) * scale };
    }
    if (Settings.mobileCheck()) {
      const mapHeight = 170 * Settings.minimapScale;
      const spacer = (height - mapHeight - 36 * scale * 7) / 2;
      return { x: 15, y: mapHeight + spacer };
    } else {
      return {
        x: width - 231 * scale + 28,
        y: height - 72 * scale,
      };
    }
  }

  tabPosition(i: number): TabPosition {
    // let scale = Settings.controlPanelScale
    const { width, height } = Chrome.size();
    const scale = this.getTabScale();
    if (FixedLayout.enabled) return FixedLayout.tabPosition(i, scale);

    if (Settings.mobileCheck()) {
      const mapHeight = 170 * Settings.minimapScale;
      const spacer = (height - mapHeight - 36 * scale * 7) / 2;
      if (i < 7) {
        return { x: 15, y: mapHeight + spacer + i * 36 * scale };
      } else {
        return {
          x: width - 33 * scale - 15,
          y: mapHeight + spacer + (i - 7) * 36 * scale,
        };
      }
    } else {
      const x = i % 7;
      const y = Math.floor(i / 7);
      return {
        x: width - 231 * scale + x * 33 * scale,
        y: height - 72 * scale + y * 36 * scale,
      };
    }
  }
  cursorMovedTo(e: MouseEvent) {
    const scale = Settings.controlPanelScale;
    if (this.selectedControl) {
      const x = e.offsetX;
      const y = e.offsetY;

      const panelWidth = 204 * scale;
      const panelHeight = 275 * scale;
      const panelPosition = this.controlPosition(this.selectedControl);
      const panelX = panelPosition.x;
      const panelY = panelPosition.y;
      if (panelX < x && x < panelX + panelWidth) {
        if (panelY < y && y < panelY + panelHeight) {
          const relativeX = x - panelX;
          const relativeY = y - panelY;
          this.selectedControl.cursorMovedto(relativeX, relativeY);
        }
      }
    }
  }

  hoverAction(e: MouseEvent): MultiColorTextBlock[] | null {
    if (!this.selectedControl) return null;
    const scale = Settings.controlPanelScale;
    const panelPosition = this.controlPosition(this.selectedControl);
    const panelWidth = 204 * scale;
    const panelHeight = 275 * scale;
    if (
      e.offsetX < panelPosition.x ||
      e.offsetX >= panelPosition.x + panelWidth ||
      e.offsetY < panelPosition.y ||
      e.offsetY >= panelPosition.y + panelHeight
    ) {
      return null;
    }
    return this.selectedControl.hoverAction(e.offsetX - panelPosition.x, e.offsetY - panelPosition.y);
  }
  controlPanelRightClick(e: MouseEvent): boolean {
    let intercepted = false;

    const scale = Settings.controlPanelScale;
    const x = e.offsetX;
    const y = e.offsetY;

    const panelWidth = 204 * scale;
    const panelHeight = 275 * scale;
    const panelPosition = this.controlPosition(this.selectedControl);
    const panelX = panelPosition.x;
    const panelY = panelPosition.y;
    if (panelX < x && x < panelX + panelWidth) {
      if (panelY < y && y < panelY + panelHeight) {
        const relativeX = x - panelX;
        const relativeY = y - panelY;
        intercepted = true;
        this.selectedControl.panelRightClick(relativeX, relativeY);
      }
    }

    return intercepted;
  }

  controlPanelClickUp(e: MouseEvent): boolean {
    const scale = Settings.controlPanelScale;
    if (!this.selectedControl) {
      return false;
    }

    let intercepted = false;

    const x = e.offsetX;
    const y = e.offsetY;

    const panelWidth = 204 * scale;
    const panelHeight = 275 * scale;
    const panelPosition = this.controlPosition(this.selectedControl);
    const panelX = panelPosition.x;
    const panelY = panelPosition.y;
    if (panelX < x && x < panelX + panelWidth) {
      if (panelY < y && y < panelY + panelHeight) {
        const relativeX = x - panelX;
        const relativeY = y - panelY;
        intercepted = true;
        this.selectedControl.panelClickUp(relativeX, relativeY);
      }
    }
    this.selectedControl.onMouseUp();

    return intercepted;
  }

  setActiveControl(index: keyof (typeof ControlPanelController)["controls"]) {
    this.selectedControl = ControlPanelController.controls[index];
  }

  controlPanelClickDown(e: MouseEvent): boolean {
    let intercepted = false;

    const scale = this.getTabScale();

    const x = e.offsetX;
    const y = e.offsetY;

    this.controls.forEach((control: BaseControls, index: number) => {
      const tabPosition = this.tabPosition(index);
      if (tabPosition.x <= x && x < tabPosition.x + 33 * scale) {
        if (tabPosition.y <= y && y < tabPosition.y + 36 * scale) {
          intercepted = true;
          if (this.controls[index] === this.selectedControl) {
            this.selectedControl = null;
            return;
          }
          this.selectedControl = this.controls[index];
        }
      }
    });

    if (!this.selectedControl) {
      return intercepted;
    }

    const panelWidth = 204 * scale;
    const panelHeight = 275 * scale;
    const panelPosition = this.controlPosition(this.selectedControl);
    const panelX = panelPosition.x;
    const panelY = panelPosition.y;
    if (panelX < x && x < panelX + panelWidth) {
      if (panelY < y && y < panelY + panelHeight) {
        const relativeX = x - panelX;
        const relativeY = y - panelY;
        intercepted = true;
        this.selectedControl.panelClickDown(relativeX, relativeY);
      }
    }

    return intercepted;
  }

  controlPosition(control: BaseControls): Location {
    const scale = this.getTabScale();
    const { width, height } = Chrome.size();
    if (FixedLayout.enabled) {
      // The panel sprite has a 7 pixel border of its own; the frame supplies the border, so the sprite's inside meets the box.
      return { x: (SIDE_PANEL.x - PANEL_BORDER) * scale, y: (SIDE_PANEL.y - PANEL_BORDER) * scale };
    }

    if (Settings.mobileCheck()) {
      const mapHeight = 170 * Settings.minimapScale;
      const spacer = (height - mapHeight - 36 * scale * 7) / 2;
      if (this.selectedControl.appearsOnLeftInMobile) {
        // left side mobile
        return { x: 33 * scale + 15, y: mapHeight + spacer };
      } else {
        // right side mobile
        return {
          x: width - 33 * scale - 15 - 200 * Settings.controlPanelScale,
          y: mapHeight + spacer,
        };
      }
    } else {
      // desktop compact
      return {
        x: width - 188 * scale,
        y: height - 72 * scale - 251 * scale,
      };
    }
  }

  onWorldTick() {
    this.controls.forEach((control) => {
      control.onWorldTick();
    });
  }

  draw(context: CanvasRenderingContext2D) {
    context.fillStyle = "#000";
    const scale = this.getTabScale();

    if (this.selectedControl && this.selectedControl.draw) {
      const position = this.controlPosition(this.selectedControl);
      if (FixedLayout.enabled) {
        context.save();
        context.beginPath();
        context.rect(SIDE_PANEL.x * scale, SIDE_PANEL.y * scale, SIDE_PANEL.width * scale, SIDE_PANEL.height * scale);
        context.clip();
        this.selectedControl.draw(context, this, position.x, position.y);
        context.restore();
      } else {
        this.selectedControl.draw(context, this, position.x, position.y);
      }
    }

    // TODO: make this rendering configurable
    const boostPosition = this.boostPosition();
    this.boostPanel.draw(context, scale, boostPosition.x, boostPosition.y);

    let selectedPosition: TabPosition = null;

    this.controls.forEach((control, index) => {
      const tabPosition = this.tabPosition(index);
      if (control.tabImage) {
        context.drawImage(
          control.tabImage,
          tabPosition.x,
          tabPosition.y,
          control.tabImage.width * scale,
          control.tabImage.height * scale,
        );
      }

      if (control.isAvailable === false) {
        context.fillStyle = "#00000099";
        context.fillRect(tabPosition.x, tabPosition.y, 33 * scale, 36 * scale);
      }

      if (control === this.selectedControl) {
        selectedPosition = tabPosition;
      }
    });

    if (selectedPosition && FixedLayout.enabled) {
      // The open tab's red stone, as the fixed client lights it; the SDK's tab sprites carry their own stone underneath.
      context.save();
      context.globalAlpha = 0.65;
      FixedLayout.drawSelectedStone(context, this.controls.indexOf(this.selectedControl), scale);
      context.restore();
    } else if (selectedPosition) {
      context.strokeStyle = "#00FF0073";
      context.lineWidth = 3;
      context.strokeRect(selectedPosition.x, selectedPosition.y, 33 * scale, 36 * scale);
    }
  }
}
