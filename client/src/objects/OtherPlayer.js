import Phaser from 'phaser';

export default class OtherPlayer {
    constructor(scene, x, y, playerId) {
        this.scene = scene;
        this.playerId = playerId;

        // Use the same sprite as the main player for now
        this.sprite = scene.add.sprite(x, y, 'player');
        this.sprite.setOrigin(0.5, 0.5);

        // Add a label/name tag
        this.nameText = scene.add.text(x, y - 40, `Player ${playerId.substr(0, 4)}`, {
            fontSize: '12px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        // Physics?
        // For other players, we usually don't run full physics on the client side to avoid desync/fighting.
        // We just interpolate their position. 
        // But for simplicity, we can just move the sprite directly.
    }

    update(x, y, flipX) {
        this.sprite.setPosition(x, y);
        this.sprite.setFlipX(flipX);
        this.nameText.setPosition(x, y - 40);
    }

    destroy() {
        this.sprite.destroy();
        this.nameText.destroy();
    }
}
