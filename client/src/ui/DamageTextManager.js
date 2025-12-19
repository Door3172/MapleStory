import Phaser from 'phaser';

export default class DamageTextManager {
    constructor(scene) {
        this.scene = scene;
        this.pool = [];
    }

    /**
     * Spawns a floating damage number.
     * @param {number} x - World X position.
     * @param {number} y - World Y position.
     * @param {number|string} amount - The damage amount to display.
     * @param {boolean} isCritical - Whether to style as a critical hit.
     */
    show(x, y, amount, isCritical = false) {
        let text = this.getPooledText();

        // Reset properties
        text.setPosition(x, y);
        text.setText(amount.toString());
        text.setScale(0.5);
        text.setAlpha(1);
        text.setVisible(true);
        text.active = true;

        // Styling (MapleStory "Vibe")
        // Standard: Orange/Yellow gradient style
        // Critical: Red/Purple or larger
        const color = isCritical ? '#ff0000' : '#ffaa00';
        const stroke = '#ffffff';
        const fontSize = isCritical ? '32px' : '24px';

        text.setStyle({
            fontFamily: '"Arial Black", "Arial", sans-serif',
            fontSize: fontSize,
            color: color,
            stroke: stroke,
            strokeThickness: 4,
            shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 0, stroke: true, fill: true }
        });

        // Animation: Pop up and float
        this.scene.tweens.add({
            targets: text,
            y: y - 80, // Float up
            scale: { from: 0.5, to: 1.2 }, // Pop effect
            duration: 800,
            ease: 'Back.out', // Bouncy pop
            onComplete: () => {
                // Fade out phase
                this.scene.tweens.add({
                    targets: text,
                    alpha: 0,
                    y: y - 100,
                    duration: 300,
                    onComplete: () => {
                        this.returnToPool(text);
                    }
                });
            }
        });

        // Secondary scale bounce for "impact" feel
        this.scene.tweens.add({
            targets: text,
            scale: isCritical ? 1.5 : 1.0,
            duration: 150,
            yoyo: true,
            repeat: 0,
            ease: 'Sine.inOut'
        });
    }

    getPooledText() {
        if (this.pool.length > 0) {
            return this.pool.pop();
        }
        // Create new text object if pool is empty
        const text = this.scene.add.text(0, 0, '', {});
        text.setDepth(100); // Ensure it's above other game objects
        text.setOrigin(0.5, 0.5);
        return text;
    }

    returnToPool(text) {
        text.setVisible(false);
        text.active = false;
        this.pool.push(text);
    }
}
