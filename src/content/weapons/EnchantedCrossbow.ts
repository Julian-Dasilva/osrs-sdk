import { CACHE_ASSETS } from "../../assets/CacheAssets";
import { AttackBonuses } from "../../sdk/gear/Weapon";
import { ItemName } from "../../sdk/ItemName";
import { Random } from "../../sdk/Random";
import { Unit } from "../../sdk/Unit";
import { RangedWeapon } from "../../sdk/weapons/RangedWeapon";
import { mergeProjectileOptions, Projectile, ProjectileOptions } from "../../sdk/weapons/Projectile";

type BoltEffect = "bloodForfeit" | "armourPiercing";

const EFFECTS: Readonly<Record<BoltEffect, { readonly chance: number; readonly spotAnim: number }>> = {
  bloodForfeit: { chance: 0.06, spotAnim: CACHE_ASSETS.spotAnims.rubyBoltEffect.id },
  armourPiercing: { chance: 0.1, spotAnim: CACHE_ASSETS.spotAnims.diamondBoltEffect.id },
};

interface Bolt {
  readonly travel: number;
  readonly effect: BoltEffect | null;
}

const BOLTS: Readonly<Partial<Record<ItemName, Bolt>>> = {
  [ItemName.RUBY_BOLTS_E]: { travel: CACHE_ASSETS.spotAnims.crossbowBolt.id, effect: "bloodForfeit" },
  [ItemName.RUBY_DRAGON_BOLTS_E]: { travel: CACHE_ASSETS.spotAnims.dragonCrossbowBolt.id, effect: "bloodForfeit" },
  [ItemName.DIAMOND_BOLTS_E]: { travel: CACHE_ASSETS.spotAnims.crossbowBolt.id, effect: "armourPiercing" },
  [ItemName.ASCENSION_BOLTS]: { travel: CACHE_ASSETS.spotAnims.ascensionCrossbowBolt.id, effect: null },
  [ItemName.DIAMOND_ASCENSION_BOLTS_E]: {
    travel: CACHE_ASSETS.spotAnims.ascensionDiamondCrossbowBolt.id,
    effect: "armourPiercing",
  },
};

export class EnchantedCrossbow extends RangedWeapon {
  private bolt: Bolt | null = null;
  private procced: BoltEffect | null = null;

  get enhancedBolts(): boolean {
    return false;
  }
  get guaranteesBoltEffect(): boolean {
    return false;
  }
  get boltEffectChance(): number {
    return 1;
  }
  override compatibleAmmo(): ItemName[] {
    return [ItemName.RUBY_BOLTS_E, ItemName.RUBY_DRAGON_BOLTS_E, ItemName.DIAMOND_BOLTS_E];
  }
  override getMaxDamageCap(): number {
    return this.enhancedBolts ? 110 : 100;
  }
  override rollDamage(from: Unit, to: Unit, bonuses: AttackBonuses): void {
    const ammo = from.ammunitionFor(this);
    const bolt = ammo && this.compatibleAmmo().includes(ammo.itemName) ? (BOLTS[ammo.itemName] ?? null) : null;
    this.bolt = bolt;
    this.procced = null;
    if (!bolt) {
      this.damage = -1;
      return;
    }
    if (bolt.effect === null || (bonuses.isSpecialAttack && !this.guaranteesBoltEffect)) {
      super.rollDamage(from, to, bonuses);
      if (bonuses.isSpecialAttack && this.lastHitHit) this.damage = this.damageRoll = Math.max(1, this.damage);
      return;
    }
    const ruby = bolt.effect === "bloodForfeit";
    const cost = Math.floor(from.currentStats.hitpoint * 0.1);
    const canProc = !ruby || (cost >= 1 && from.currentStats.hitpoint > cost);
    const proc = canProc && Random.get() < EFFECTS[bolt.effect].chance * this.boltEffectChance;
    const modifiers = to.incomingAttackRollModifiers({ attacker: from, weapon: this, bonuses });
    const specialHit =
      bonuses.isSpecialAttack && (modifiers.guaranteedHit || Random.get() <= this._hitChance(from, to, bonuses));
    if (proc || (canProc && specialHit)) {
      this.lastHitHit = true;
      this.procced = bolt.effect;
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
  override registerProjectile(from: Unit, to: Unit, bonuses: AttackBonuses, options: ProjectileOptions = {}): void {
    super.registerProjectile(
      from,
      to,
      bonuses,
      mergeProjectileOptions(
        this.bolt ? { visuals: { spotAnim: { id: this.bolt.travel } } } : {},
        options,
        this.procced ? { impactSpotAnim: { id: EFFECTS[this.procced].spotAnim } } : {},
      ),
    );
  }
}
