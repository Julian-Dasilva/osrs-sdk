# Supply effects

The SDK catalog builds each potion dose by its own item ID. Inventory clicks queue the effect for the next world tick. Food and potion reuse delays are three ticks. Halibut shares the combo-food channel with karambwan, with a two-tick attack delay. Ordinary foods add three ticks to attack delay. The wiki sources are [Food revision 15373716](https://oldschool.runescape.wiki/w/Food?oldid=15373716) and [Potions revision 15385885](https://oldschool.runescape.wiki/w/Potions?oldid=15385885).

`src/content/items/SupplyValues.ts` holds the readonly effects and their wiki revisions. Prayer restores floor(base Prayer × 0.25) + 7. Ranging boosts floor(base Ranged × 0.1) + 4. Super combat and divine super combat boost Attack, Strength and Defence by floor(base level × 0.15) + 5. Sanfew restores floor(base level × 0.3) + 4 to drained combat stats and Prayer, without healing or removing boosts.

Manta ray heals 22, halibut heals 20, giant krill heals 17, and leftovers heals 5. Food never overheals. Divine super combat costs 10 HP, refuses consumption at 10 HP or below, prevents natural melee-stat decay for 500 ticks, and removes remaining melee boosts on expiry. Ordinary boosts decay every 100 ticks. Preserve adds 50 ticks after it has been active for 25 ticks.

Alliance log is a carried record, not a consumable. Its raid-performance transcript is outside the combat simulator. Sanfew's poison and disease immunity, nail-beast use, parasite cure, and Prayer-restoration equipment modifiers are outside this fight and remain unsimulated. The trainer does not carry the Prayer cape, holy wrench, or ring of the gods.

Inventory PNGs bundled with these classes come from the corresponding OSRS Wiki file pages, retrieved on 2026-10-30. They follow the SDK's existing bundled inventory-image convention. No cache assets or models are included.
