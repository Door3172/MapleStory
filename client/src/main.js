import Phaser from 'phaser';
import GameScene from './scenes/GameScene';

const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: 800,
    height: 600,
    backgroundColor: '#87CEEB', // Sky blue default
    physics: {
        default: 'matter',
        matter: {
            gravity: { y: 1 }, // Standard gravity
            debug: true // Enable debug for development
        }
    },
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [GameScene]
};

const game = new Phaser.Game(config);

export default game;
