import { Unit } from "../../sdk/Unit";
import { Projectile } from "../../sdk/weapons/Projectile";

const DRAINED_STATS = ["attack", "strength", "defence"] as const;

export class SmashProjectile extends Projectile {
  override beforeHit(): void {
    super.beforeHit();
    if (this.to instanceof Unit && this.damage > 0) {
      this.to.currentStats.defence -= Math.floor(this.to.currentStats.defence * 0.3);
    }
  }
}

export class WeakenProjectile extends Projectile {
  private readonly rolledDamage = this.damage;
  successful = false;
  override beforeHit(): void {
    super.beforeHit();
    if (!(this.to instanceof Unit) || !this.successful || (this.rolledDamage > 0 && this.damage === 0)) return;
    const fraction = this.to.demonbaneMultiplier > 0 ? 0.15 : 0.05;
    for (const stat of DRAINED_STATS) {
      this.to.currentStats[stat] = Math.max(
        0,
        this.to.currentStats[stat] - Math.floor(this.to.stats[stat] * fraction) - 1,
      );
    }
  }
}
