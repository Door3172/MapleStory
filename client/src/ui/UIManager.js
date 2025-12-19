import Phaser from 'phaser';

export default class UIManager {
    constructor(scene) {
        this.scene = scene;
        this.createHUD();
    }

    createHUD() {
        // Container for UI elements (fixed to camera)
        this.container = this.scene.add.container(0, 0);
        this.container.setScrollFactor(0);
        this.container.setDepth(1000); // Top layer

        const width = this.scene.scale.width;
        const height = this.scene.scale.height;

        // Bottom Bar Background (Gray/Black)
        const barHeight = 60;
        const bg = this.scene.add.rectangle(width / 2, height - barHeight / 2, width, barHeight, 0x333333);
        bg.setAlpha(0.8);
        this.container.add(bg);

        // HP Bar (Red)
        // Label
        const hpLabel = this.scene.add.text(20, height - 45, 'HP', { fontSize: '16px', fill: '#ffffff', fontStyle: 'bold' });
        this.container.add(hpLabel);

        // Bar Background
        const hpBg = this.scene.add.rectangle(50, height - 35, 200, 20, 0x000000).setOrigin(0, 0.5);
        this.container.add(hpBg);

        // Bar Fill
        this.hpBar = this.scene.add.rectangle(50, height - 35, 200, 20, 0xff0000).setOrigin(0, 0.5);
        this.container.add(this.hpBar);

        // HP Value
        this.hpText = this.scene.add.text(150, height - 35, '1000/1000', { fontSize: '12px', fill: '#ffffff' }).setOrigin(0.5);
        this.container.add(this.hpText);


        // MP Bar (Blue)
        // Label
        const mpLabel = this.scene.add.text(270, height - 45, 'MP', { fontSize: '16px', fill: '#ffffff', fontStyle: 'bold' });
        this.container.add(mpLabel);

        // Bar Background
        const mpBg = this.scene.add.rectangle(300, height - 35, 200, 20, 0x000000).setOrigin(0, 0.5);
        this.container.add(mpBg);

        // Bar Fill
        this.mpBar = this.scene.add.rectangle(300, height - 35, 200, 20, 0x0000ff).setOrigin(0, 0.5);
        this.container.add(this.mpBar);

        // MP Value
        this.mpText = this.scene.add.text(400, height - 35, '500/500', { fontSize: '12px', fill: '#ffffff' }).setOrigin(0.5);
        this.container.add(this.mpText);


        // Quick Slot / Chat Placeholder
        const chatBg = this.scene.add.rectangle(width - 150, height - 30, 280, 50, 0xffffff, 0.2).setOrigin(0.5);
        const chatText = this.scene.add.text(width - 150, height - 35, '[All] Chat Log...', { fontSize: '12px', fill: '#cccc' }).setOrigin(0.5);
        this.container.add(chatBg);
        this.container.add(chatText);

        // EXP Bar (Yellow) - Absolute Bottom
        const expBg = this.scene.add.rectangle(width / 2, height - 5, width, 10, 0x444444).setOrigin(0.5);
        this.container.add(expBg);

        this.expBar = this.scene.add.rectangle(0, height - 5, 0, 10, 0xffd700).setOrigin(0, 0.5); // Left-aligned
        this.container.add(this.expBar);

        // Level Text
        this.levelText = this.scene.add.text(40, height - 70, 'Lv.1', { fontSize: '18px', fill: '#ffffff', fontStyle: 'bold' });
        this.container.add(this.levelText);
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
            this.levelText.setText(`Lv.${level}`);
            // Flash Effect?
        });

        // Initial Update
        this.updateHP(statManager.hp, statManager.maxHp);
        this.updateMP(statManager.mp, statManager.maxMp);
        this.updateEXP(statManager.exp, statManager.maxExp);
    }

    updateHP(current, max) {
        const percent = Phaser.Math.Clamp(current / max, 0, 1);
        this.hpBar.width = 200 * percent;
        this.hpText.setText(`${Math.floor(current)}/${max}`);
    }

    updateMP(current, max) {
        const percent = Phaser.Math.Clamp(current / max, 0, 1);
        this.mpBar.width = 200 * percent;
        this.mpText.setText(`${Math.floor(current)}/${max}`);
    }

    updateEXP(current, max) {
        const percent = Phaser.Math.Clamp(current / max, 0, 1);
        this.expBar.width = this.scene.scale.width * percent;
    }
}
