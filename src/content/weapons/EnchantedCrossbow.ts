import { AttackBonuses } from "../../sdk/gear/Weapon";
import { ItemName } from "../../sdk/ItemName";
import { Random } from "../../sdk/Random";
import { Unit } from "../../sdk/Unit";
import { RangedWeapon } from "../../sdk/weapons/RangedWeapon";
import { Projectile } from "../../sdk/weapons/Projectile";

export class EnchantedCrossbow extends RangedWeapon {
  get enhancedBolts(): boolean {
    return false;
  }
  get guaranteesBoltEffect(): boolean {
    return false;
  }
  override compatibleAmmo(): ItemName[] {
    return [ItemName.RUBY_BOLTS_E, ItemName.RUBY_DRAGON_BOLTS_E, ItemName.DIAMOND_BOLTS_E];
  }
  override getMaxDamageCap(): number {
    return this.enhancedBolts ? 110 : 100;
  }
  override rollDamage(from: Unit, to: Unit, bonuses: AttackBonuses): void {
    const ammo = from.ammunitionFor(this);
    if (!ammo || !this.compatibleAmmo().includes(ammo.itemName)) {
      this.damage = -1;
      return;
    }
    if (bonuses.isSpecialAttack && !this.guaranteesBoltEffect) {
      super.rollDamage(from, to, bonuses);
      if (this.lastHitHit) this.damage = this.damageRoll = Math.max(1, this.damage);
      return;
    }
    const ruby = ammo.itemName === ItemName.RUBY_BOLTS_E || ammo.itemName === ItemName.RUBY_DRAGON_BOLTS_E;
    const cost = Math.floor(from.currentStats.hitpoint * 0.1);
    const canProc = !ruby || (cost >= 1 && from.currentStats.hitpoint > cost);
    const proc = canProc && Random.get() < (ruby ? 0.06 : 0.1);
    const modifiers = to.incomingAttackRollModifiers({ attacker: from, weapon: this, bonuses });
    const specialHit =
      bonuses.isSpecialAttack && (modifiers.guaranteedHit || Random.get() <= this._hitChance(from, to, bonuses));
    if (proc || (canProc && specialHit)) {
      this.lastHitHit = true;
      if (ruby) {
        this.damageRoll = this.damage = Math.min(
          this.getMaxDamageCap(),
          Math.floor(to.currentStats.hitpoint * (this.enhancedBolts ? 0.22 : 0.2)),
        );
        from.addProjectile(
          new Projectile(this, cost, from, from, "rubyboltspec", { setDelay: 1, visuals: { hidden: true } }),
        );
      } else {
        const maximum = Math.floor(this._maxHit(from, to, bonuses) * (this.enhancedBolts ? 1.26 : 1.15));
        this.damageRoll = this.damage = modifiers.maxDamage ? maximum : Math.floor(Random.get() * (maximum + 1));
      }
    } else if (bonuses.isSpecialAttack) {
      this.lastHitHit = false;
      this.damageRoll = this.damage = 0;
    } else {
      super.rollDamage(from, to, bonuses);
    }
  }
}
