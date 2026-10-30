"use strict";

import { SUPPLY_VALUES } from "../content/items/SupplyValues";
import { Player } from "./Player";

const COMBAT_STATS = ["attack", "strength", "defence", "range", "magic"] as const;
type BoostedStat = (typeof COMBAT_STATS)[number];
type CombatBoost = { kind: "normal" } | { kind: "divine"; expiresAt: number };

export class PlayerRegenTimer {
  player: Player;
  spec: number;
  private specInterval = 50;
  hitpoint: number;
  private combatBoost: CombatBoost = { kind: "normal" };
  private statTimer: number = SUPPLY_VALUES.statDecay.ticks;
  private preserveTicks = 0;
  private statExtended = false;

  boostStats(stats: readonly BoostedStat[], fraction: number, flat: number): void {
    for (const stat of stats) {
      const amount = Math.floor(this.player.stats[stat] * fraction) + flat;
      this.player.currentStats[stat] = Math.min(
        this.player.stats[stat] + amount,
        this.player.currentStats[stat] + amount,
      );
    }
  }

  startDivineCombat(duration: number): void {
    this.combatBoost = { kind: "divine", expiresAt: this.player.region.world.globalTickCounter + duration };
  }

  private tickBoosts(): void {
    switch (this.combatBoost.kind) {
      case "divine":
        if (this.player.region.world.globalTickCounter >= this.combatBoost.expiresAt) {
          for (const stat of ["attack", "strength", "defence"] as const) {
            this.player.currentStats[stat] = Math.min(this.player.stats[stat], this.player.currentStats[stat]);
          }
          this.combatBoost = { kind: "normal" };
        }
        break;
      case "normal":
        break;
      default: {
        const unhandled: never = this.combatBoost;
        return unhandled;
      }
    }
    this.preserveTicks = this.player.prayerController.isPrayerActiveByName("Preserve") ? this.preserveTicks + 1 : 0;
    if (--this.statTimer > 0) return;
    if (!this.statExtended && this.preserveTicks >= SUPPLY_VALUES.preserve.activation) {
      this.statTimer = SUPPLY_VALUES.preserve.extension;
      this.statExtended = true;
      return;
    }
    this.statTimer = SUPPLY_VALUES.statDecay.ticks;
    this.statExtended = false;
    for (const stat of COMBAT_STATS) {
      if (stat !== "range" && stat !== "magic" && this.combatBoost.kind === "divine") continue;
      if (this.player.currentStats[stat] > this.player.stats[stat]) this.player.currentStats[stat]--;
    }
  }

  constructor(player: Player) {
    this.player = player;
    this.spec = 50;
    this.hitpoint = 100;
  }

  specUsed() {
    if (this.spec <= 0) {
      this.spec = this.specInterval;
    }
  }

  regen() {
    this.specRegen();
    this.hitpointRegen();
    this.tickBoosts();
  }

  updateSpecInterval(): void {
    const interval = this.player.equipment.ring?.specialAttackRegenTicks ?? 50;
    if (interval === this.specInterval) return;
    this.spec = interval < this.specInterval ? Math.min(this.spec, interval) : interval;
    this.specInterval = interval;
  }

  specRegen() {
    this.updateSpecInterval();
    this.spec--;
    if (this.spec === 0) {
      this.spec = this.specInterval;
      this.player.currentStats.specialAttack += 10;
      this.player.currentStats.specialAttack = Math.min(100, this.player.currentStats.specialAttack);
    }
  }

  hitpointRegen() {
    this.hitpoint--;
    if (this.hitpoint === 0) {
      this.hitpoint = 100;
      const currentHp = this.player.currentStats.hitpoint;
      const lvlHp = this.player.stats.hitpoint;
      const diff = currentHp === lvlHp ? 0 : currentHp > lvlHp ? -1 : 1;
      this.player.currentStats.hitpoint += diff;
    }
  }
}
