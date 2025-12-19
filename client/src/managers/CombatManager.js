export default class CombatManager {
    constructor(scene) {
        this.scene = scene;
    }

    // --- Main Attack Entry Point ---
    performAttack(attacker, targets, skillId = 'basic') {
        // 1. Calculate Damage Range
        const damageRange = attacker.stats.getDamageRange();

        targets.forEach(target => {
            // 2. Roll Damage
            const damage = Phaser.Math.Between(damageRange.min, damageRange.max);
            const isCrit = Math.random() < 0.1; // 10% Crit Chance (Mock)
            const finalDamage = isCrit ? Math.floor(damage * 1.5) : damage;

            // 3. Apply Damage to Target
            const dead = target.takeDamage(finalDamage);

            // 4. Show Damage Skin (Text)
            this.scene.damageManager.show(target.sprite.x, target.sprite.y - 50, finalDamage, isCrit);

            // 5. Apply "Hit Stop" (Impact Freeze)
            this.applyHitStop(100);

            // 6. Apply Screen Shake (On Crits)
            if (isCrit) {
                this.applyScreenShake(100, 0.005);
            }

            // 7. Handle Death
            if (dead) {
                // EXP
                this.scene.player.stats.gainExp(50); // Mock EXP

                // Loot (Mock Chance)
                if (Math.random() > 0.5) {
                    this.scene.spawnLoot(target.sprite.x, target.sprite.y, { itemId: 'mesos', amount: 100 });
                }
            }
        });
    }

    // --- Game Feel Effects ---

    applyHitStop(duration) {
        // "Freeze" the physics simulation or specific sprites
        // A global timeScale pause is the easiest way to feel "Impact"
        this.scene.physics.world.timeScale = 0; // Pause Physics

        // Resume after duration
        this.scene.time.delayedCall(duration, () => {
            this.scene.physics.world.timeScale = 1; // Resume
        });
    }

    applyScreenShake(duration, intensity) {
        this.scene.cameras.main.shake(duration, intensity);
    }
}
