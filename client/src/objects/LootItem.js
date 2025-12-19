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

    update() {
        if (this.sprite && this.graphic) {
            this.graphic.setPosition(this.sprite.position.x, this.sprite.position.y);
        }
    }

    destroy() {
        this.scene.events.off('update', this.update, this);
        this.scene.matter.world.remove(this.sprite);
        this.graphic.destroy();
        this.sprite = null;
    }
}
