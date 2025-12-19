import Phaser from 'phaser';

export default class DamageTextManager {
    constructor(scene) {
        this.scene = scene;
        this.pool = [];
    }

    show(x, y, damage, isCrit) {
        let textObj = this.pool.find(t => !t.active);

        if (!textObj) {
            textObj = this.scene.add.text(0, 0, '', {
                fontFamily: '"Arial Black", "Arial", sans-serif',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 4,
                shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 0, stroke: true, fill: true }
            }).setOrigin(0.5);
            textObj.setDepth(2000); // Above UI if possible, or below? Usually below HUD but above units.
            this.pool.push(textObj);
        }

        textObj.setActive(true);
        textObj.setVisible(true);
        textObj.setPosition(x, y - 40); // Spawn a bit higher
        textObj.setText(damage.toString());
        textObj.setAlpha(1);
        textObj.setScale(0.5); // Start small for pop

        // Style based on Crit
        if (isCrit) {
            textObj.setFontSize(32);
            textObj.setFill('#ff0000'); // Red
            textObj.setStroke('#ffffff', 4); // White outline for crit
        } else {
            textObj.setFontSize(24);
            textObj.setFill('#ffcc00'); // Orange/Yellow
            textObj.setStroke('#000000', 3);
        }

        // Animation: "Pop" up and float
        // MapleStyle: Pops up aggressively, then drifts up and fades.

        // 1. Pop Scale
        this.scene.tweens.add({
            targets: textObj,
            scale: 1.0,
            duration: 150,
            ease: 'Back.out'
        });

        // 2. Float Up and Fade
        this.scene.tweens.add({
            targets: textObj,
            y: y - 100, // Float up
            alpha: 0,
            duration: 800,
            delay: 100, // Sustain briefly
            ease: 'Quad.out',
            onComplete: () => {
                textObj.setActive(false);
                textObj.setVisible(false);
            }
        });
    }
}
