import Phaser from 'phaser';

export default class Monster {
    constructor(scene, x, y, key = 'slime') {
        this.scene = scene;
        this.key = key; // Save key for reuse

        // Create Matter Sprite
        // For now using 'player' sprite tinted green if 'slime' asset missing
        const texture = this.scene.textures.exists('slime') ? 'slime' : 'player';

        this.sprite = scene.matter.add.sprite(x, y, texture, null, {
            label: 'monster'
        });

        if (texture === 'player') {
            this.sprite.setTint(0x00ff00); // Green Slime
            this.sprite.setScale(0.8);
        }

        this.sprite.setFixedRotation();
        this.sprite.setFriction(0.005);
        this.sprite.setBounce(0.1);

        // Link sprite to this instance for collision retrieval
        this.sprite.gameObject = this;

        this.dropTable = [
            { itemId: 'mesos', chance: 1.0, amount: 100 }, // Guarantee mesos for testing
            { itemId: 'potion_red', chance: 0.3, amount: 1 }
        ];

        this.setupStats();
    }

    setupStats() {
        this.hp = 1000;
        this.maxHp = 1000;
        // Simple wandering logic
        this.moveTimer = 0;
        this.moveDirection = 0;
        this.sprite.setAlpha(1);
        this.sprite.setActive(true);
        this.sprite.setVisible(true);
        // Reset Physics
        this.sprite.setCollisionCategory(1); // Default category
    }

    reset(x, y) {
        this.sprite.setPosition(x, y);
        this.sprite.setVelocity(0, 0);
        this.setupStats();
    }

    update(time, delta) {
        if (!this.sprite.active) return;

        // Simple AI: Wander left/right
        this.moveTimer -= delta;
        if (this.moveTimer <= 0) {
            this.moveTimer = 2000 + Math.random() * 2000;
            this.moveDirection = Math.random() > 0.5 ? 1 : -1;
            if (Math.random() > 0.7) this.moveDirection = 0; // Idle
        }

        if (this.moveDirection !== 0) {
            this.sprite.setVelocityX(this.moveDirection * 2);
            this.sprite.setFlipX(this.moveDirection < 0);
        }
    }

    takeDamage(amount) {
        if (!this.sprite.active) return;

        this.hp -= amount;

        // Flash Red
        this.scene.tweens.add({
            targets: this.sprite,
            alpha: 0.5,
            duration: 50,
            yoyo: true,
            repeat: 1
        });

        // Knockback (simple)
        const kbDir = Math.random() > 0.5 ? 1 : -1;
        this.sprite.setVelocity(-kbDir * 5, -5);

        if (this.hp <= 0) {
            this.die();
        }
    }

    die() {
        // Death animation or poof
        this.scene.tweens.add({
            targets: this.sprite,
            alpha: 0,
            scale: 0.1,
            duration: 200,
            onComplete: () => {
                // Instead of destroy, we disable
                this.sprite.setActive(false);
                this.sprite.setVisible(false);
                this.sprite.setPosition(-1000, -1000); // Move away
                this.sprite.setVelocity(0, 0);

                // Drop Loot
                this.dropTable.forEach(drop => {
                    if (Math.random() <= drop.chance) {
                        this.scene.spawnLoot(this.sprite.x, this.sprite.y, drop);
                    }
                });

                // Notify SpawnManager if assigned
                if (this.onDeath) this.onDeath(this);
            }
        });
    }
}
