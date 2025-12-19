import Phaser from 'phaser';

export default class OtherPlayer {
    constructor(scene, x, y, playerId) {
        this.scene = scene;
        this.playerId = playerId;
        this.targetX = x;
        this.targetY = y;

        // Visual Sprite (Matter sensor to avoid collisions)
        this.sprite = scene.matter.add.sprite(x, y, 'player', null, {
            isSensor: true,
            isStatic: true,
            label: 'otherPlayer'
        });

        // Name Tag
        this.nameText = scene.add.text(x, y - 40, `User ${playerId.substr(0, 4)}`, {
            fontSize: '12px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
    }

    // Called when network update is received
    updatePosition(playerInfo) {
        this.targetX = playerInfo.x;
        this.targetY = playerInfo.y;
        this.sprite.setFlipX(playerInfo.flipX);
    }

    // Called every frame by GameScene update loop
    update() {
        if (this.sprite) {
            // Linear Interpolation (Lerp) for smooth movement
            // Factor 0.2 = fast smooth, 0.05 = slow smooth
            const lerpFactor = 0.2;
            const newX = Phaser.Math.Linear(this.sprite.x, this.targetX, lerpFactor);
            const newY = Phaser.Math.Linear(this.sprite.y, this.targetY, lerpFactor);

            this.sprite.setPosition(newX, newY);

            // Sync nametag
            this.nameText.setPosition(newX, newY - 40);
        }
    }

    destroy() {
        if (this.sprite) this.sprite.destroy();
        if (this.nameText) this.nameText.destroy();
    }
}
