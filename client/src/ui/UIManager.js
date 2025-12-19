import Phaser from 'phaser';

export default class UIManager {
    constructor(scene) {
        this.scene = scene;
        this.createHUD();
    }

    createHUD() {
        // Container for UI (Fixed to camera)
        this.container = this.scene.add.container(0, 0);
        this.container.setScrollFactor(0);
        this.container.setDepth(1000);

        const width = this.scene.scale.width;
        const height = this.scene.scale.height;

        // 1. HUD Background (The Base Image)
        // Image is wide. Let's place it at bottom center.
        const hudBg = this.scene.add.image(width / 2, height, 'hud_base');
        hudBg.setOrigin(0.5, 1); // Anchor bottom-center
        // Scale it? If image is 1920 but game is 800 width, we might need to scale or slice.
        // Assuming generated image is roughly wide format.
        // Let's force width to match screen (stretch) or keeping aspect ratio.
        // For now, let's just place it.
        // hudBg.setDisplaySize(width, 100); // Standard height?
        this.container.add(hudBg);

        // 2. Character Info (Left Side)
        // Avatar Placeholder (Square)
        // Position relative to HUD Bottom-Left (approx)
        const leftBaseX = 20;
        const bottomY = height - 80;

        // Level (Gold/Yellow text)
        this.levelText = this.scene.add.text(leftBaseX + 60, bottomY + 20, 'Lv. 1', {
            fontSize: '14px', fill: '#FFCC00', fontStyle: 'bold', stroke: '#000000', strokeThickness: 3
        });
        this.container.add(this.levelText);

        // Name (White)
        this.nameText = this.scene.add.text(leftBaseX + 60, bottomY + 40, 'Mapler', {
            fontSize: '12px', fill: '#ffffff', stroke: '#000000', strokeThickness: 2
        });
        this.container.add(this.nameText);

        // HP/MP Bars (Bottom Center - Classic Style usually had HP MP side by side or stacked)
        // Our generated image has a center bar. Let's use that for EXP.
        // And place HP/MP above it or integrated.

        // HP Bar (Red Gradient)
        this.hpBarCtx = this.scene.add.graphics();
        this.container.add(this.hpBarCtx);

        // MP Bar (Blue Gradient)
        this.mpBarCtx = this.scene.add.graphics();
        this.container.add(this.mpBarCtx);

        this.hpText = this.scene.add.text(width / 2 - 100, height - 75, 'HP 50/50', { fontSize: '12px', fill: '#ffffff', stroke: '#000000', strokeThickness: 2 });
        this.mpText = this.scene.add.text(width / 2 + 50, height - 75, 'MP 10/10', { fontSize: '12px', fill: '#ffffff', stroke: '#000000', strokeThickness: 2 });
        this.container.add(this.hpText);
        this.container.add(this.mpText);

        // 3. EXP Bar (Center Long Bar)
        // Assume the "empty bar" in the image is at bottom-middle.
        const expBarWidth = 400; // Estimated from image prompt
        const expBarHeight = 15;
        const expX = width / 2 - expBarWidth / 2;
        const expY = height - 30; // Near bottom

        // EXP Background (Dark)
        const expBg = this.scene.add.rectangle(width / 2, expY, expBarWidth, expBarHeight, 0x111111).setOrigin(0.5);
        this.container.add(expBg);

        // EXP Fill (Gold/Green)
        this.expBar = this.scene.add.rectangle(expX, expY, 0, expBarHeight, 0xDDDD00).setOrigin(0, 0.5); // Left-aligned
        this.container.add(this.expBar);

        this.expText = this.scene.add.text(width / 2, expY, '0.00%', { fontSize: '10px', fill: '#ffffff', stroke: '#000000', strokeThickness: 2 }).setOrigin(0.5);
        this.container.add(this.expText);
    }

    setupEventListeners(statManager) {
        statManager.on('statChange', (stats) => {
            this.updateHP(stats.hp, stats.maxHp);
            this.updateMP(stats.mp, stats.maxMp);
        });

        statManager.on('expChange', (exp, maxExp) => {
            this.updateEXP(exp, maxExp);
        });

        statManager.on('levelUp', (level) => {
            this.levelText.setText(`Lv. ${level}`);
            // Flash Effect?
        });

        // Initial Update
        this.updateHP(statManager.hp, statManager.maxHp);
        this.updateMP(statManager.mp, statManager.maxMp);
        this.updateEXP(statManager.exp, statManager.maxExp);
    }

    updateHP(current, max) {
        const percent = Phaser.Math.Clamp(current / max, 0, 1);

        // Redraw HP Bar with gradient effect
        this.hpBarCtx.clear();
        this.hpBarCtx.fillStyle(0x333333, 0.8);
        this.hpBarCtx.fillRect(this.scene.scale.width / 2 - 150, this.scene.scale.height - 90, 140, 15); // BG

        this.hpBarCtx.fillStyle(0xFF0000, 1);
        this.hpBarCtx.fillRect(this.scene.scale.width / 2 - 150, this.scene.scale.height - 90, 140 * percent, 15); // FG

        this.hpText.setText(`HP ${Math.floor(current)}/${max}`);
    }

    updateMP(current, max) {
        const percent = Phaser.Math.Clamp(current / max, 0, 1);

        this.mpBarCtx.clear();
        this.mpBarCtx.fillStyle(0x333333, 0.8);
        this.mpBarCtx.fillRect(this.scene.scale.width / 2 + 10, this.scene.scale.height - 90, 140, 15); // BG

        this.mpBarCtx.fillStyle(0x0000FF, 1);
        this.mpBarCtx.fillRect(this.scene.scale.width / 2 + 10, this.scene.scale.height - 90, 140 * percent, 15); // FG

        this.mpText.setText(`MP ${Math.floor(current)}/${max}`);
    }

    updateEXP(current, max) {
        const percent = Phaser.Math.Clamp(current / max, 0, 1);
        const expBarWidth = 400; // Match createHUD
        this.expBar.width = expBarWidth * percent;
        this.expText.setText(`${(percent * 100).toFixed(2)}%`);
    }
}
