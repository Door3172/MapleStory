import Phaser from 'phaser';

export default class LootItem {
    constructor(scene, x, y, itemData) {
        this.scene = scene;
        this.itemData = itemData; // { itemId, amount, etc. }

        // Use a simple shape texture for now
        // 'star' or 'orb'
        const color = itemData.itemId === 'mesos' ? 0xffd700 : 0xff0000;

        // Generate a texture if not exists (or use graphics)
        // Using a small circle for physics body
        this.sprite = scene.matter.add.circle(x, y, 10, {
            label: 'loot',
            friction: 0.005,
            restitution: 0.6 // Bouncy!
        });

        // Visual
        this.graphic = scene.add.circle(x, y, 10, color);

        // Link visual to physics
        this.scene.events.on('update', this.update, this);

        // Apply Pop Force
        // Upward (-Y) and Random X
        const forceX = (Math.random() - 0.5) * 0.005; // -0.0025 to 0.0025
        const forceY = -0.008 - Math.random() * 0.004; // -0.008 to -0.012

        this.scene.matter.body.applyForce(this.sprite, { x: this.sprite.position.x, y: this.sprite.position.y }, { x: forceX, y: forceY });
    }

    // Called when player triggers pickup or is close enough
    magnetize(target) {
        this.magnetTarget = target;
        this.isMagnetized = true;
        // Disable gravity/physics for the magnet effect so it flies straight
        this.scene.matter.body.setStatic(this.sprite, false);
        this.scene.matter.body.setInertia(this.sprite, Infinity); // Stop rotation
        this.sprite.setIgnoreGravity(true);
        this.sprite.setFrictionAir(0);
    }

    update() {
        if (!this.sprite || !this.graphic) return;

        if (this.isMagnetized && this.magnetTarget) {
            // Vacuum Logic: Lerp towards target
            const speed = 0.15; // Fast pickup
            const tx = this.magnetTarget.x;
            const ty = this.magnetTarget.y - 20; // Aim for chest

            const dx = tx - this.sprite.position.x;
            const dy = ty - this.sprite.position.y;

            // Move manually (Physics override)
            this.sprite.position.x += dx * speed;
            this.sprite.position.y += dy * speed;

            // Check if close enough to consume
            if (Phaser.Math.Distance.Between(this.sprite.position.x, this.sprite.position.y, tx, ty) < 20) {
                this.collect();
            }
        }

        // Sync Graphic
        this.graphic.setPosition(this.sprite.position.x, this.sprite.position.y);
    }

    collect() {
        // Trigger actual pickup logic
        console.log(`Collected ${this.itemData.itemId}`);

        // Visual Pop?

        // Destroy
        this.scene.events.off('update', this.update, this);
        this.scene.matter.world.remove(this.sprite);
        this.graphic.destroy();
        this.sprite = null;

        // Notify Scene to remove from array (Callback?)
        // Ideally, Scene checks for 'active' property or we dispatch an event
        this.isDead = true;
    }

    destroy() {
        if (this.scene) this.scene.events.off('update', this.update, this);
        if (this.sprite) this.scene.matter.world.remove(this.sprite);
        if (this.graphic) this.graphic.destroy();
        this.sprite = null;
    }
}
