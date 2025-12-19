import Phaser from 'phaser';
import Player from '../objects/Player';
import Monster from '../objects/Monster';
import SpawnManager from '../managers/SpawnManager';
import LootItem from '../objects/LootItem';
import OtherPlayer from '../objects/OtherPlayer';
import DamageTextManager from '../ui/DamageTextManager';
import UIManager from '../ui/UIManager';
import MapBuilder from '../managers/MapBuilder';
import NetworkManager from '../managers/NetworkManager';
import CombatManager from '../managers/CombatManager';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    preload() {
        // Load placeholder assets
        this.load.setBaseURL('https://labs.phaser.io');
        this.load.image('player', 'assets/sprites/phaser-dude.png');

        // Load Local Background Assets (Reset BaseURL for these)
        this.load.setBaseURL('');
        this.load.image('bg_sky', '/assets/backgrounds/sky.png');
        this.load.image('bg_hills', '/assets/backgrounds/hills.png');
        this.load.image('bg_trees', '/assets/backgrounds/trees.png');
        this.load.image('bg_trees', '/assets/backgrounds/trees.png');
        this.load.image('ground_tile', '/assets/tilesets/ground.png');
        this.load.image('hud_base', '/assets/ui/hud_base.png');
    }

    create() {
        // --- Network Manager ---
        this.otherPlayers = {};
        this.networkManager = new NetworkManager(this);
        this.networkManager.connect();

        // --- Combat Manager ---
        this.combatManager = new CombatManager(this);

        // --- PARALLAX BACKGROUNDS ---
        // 1. Sky (Static or very slow)
        const width = this.scale.width;
        const height = this.scale.height;

        this.bgSky = this.add.tileSprite(0, 0, width, height, 'bg_sky')
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setDepth(-20);

        // 2. Hills (Far background, slow scroll)
        this.bgHills = this.add.tileSprite(0, 100, width * 1.5, height, 'bg_hills')
            .setOrigin(0, 0)
            .setScrollFactor(0.15)
            .setDepth(-15);

        // 3. Trees (Near background, medium scroll)
        this.bgTrees = this.add.tileSprite(-100, 50, width * 1.2, height, 'bg_trees')
            .setOrigin(0, 0)
            .setScrollFactor(0.35)
            .setDepth(-8);

        // Soft vignette to focus the playfield
        const vignette = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.15)
            .setScrollFactor(0)
            .setDepth(50);

        const { worldWidth, worldHeight } = this.createMap();

        // Player Setup
        this.player = new Player(this, 240, 820);
        if (this.ropes && this.ropes.length > 0) {
            this.player.setRopes(this.ropes.map(r => r.sensor));
        }

        // Damage Text System
        this.damageManager = new DamageTextManager(this);

        // UI Manager
        this.uiManager = new UIManager(this);
        this.uiManager.setupEventListeners(this.player.stats);

        // ... (Debug Listener)

        // ...

        // Query Collision
        const activeMonsters = this.spawnManager.getGroup().filter(m => m.sprite.active);

        activeMonsters.forEach(monster => {
            // ... (hit check)
            if (Math.abs(mx - hitX) < attackRange / 2 + 20 && Math.abs(my - hitY) < attackHeight / 2 + 20) {
                // HIT!
                const dmg = Math.floor(Math.random() * 500) + 100; // Increased dmg for faster kills
                const isCrit = Math.random() > 0.8;

                monster.takeDamage(dmg);
                this.damageManager.show(mx, my - 50, dmg, isCrit);

                if (monster.hp <= 0) {
                    // Kill Reward
                    this.player.stats.gainExp(50); // Give 50 EXP
                }
            }
        });
        // this.input.keyboard.on('keydown-SHIFT', () => { ... });

        // Camera
        this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
        this.cameras.main.startFollow(this.player.sprite, true, 0.08, 0.08);
        this.cameras.main.setZoom(1.05);

        // --- COMBAT SYSTEM (Via SpawnManager) ---
        this.spawnManager = new SpawnManager(this);
        this.spawnManager.setSpawnPoints([
            { x: 420, y: 760 },
            { x: 720, y: 760 },
            { x: 1150, y: 560 },
            { x: 1650, y: 880 },
            { x: 2050, y: 720 },
            { x: 2450, y: 520 }
        ]);
        this.spawnManager.setup();

        this.lootItems = []; // Track active loot

        // Input for Attack & Pickup & Skills
        this.input.keyboard.on('keydown-Z', () => {
            this.performAttack();
            this.performPickup();
        });

        this.input.keyboard.on('keydown-X', () => {
            this.performSkill('magic_claw');
        });

        // Input for Player movement
        this.cursors = this.input.keyboard.createCursorKeys();

        // Decorative floating UI cues
        this.createOverlayUI();
    }

    spawnLoot(x, y, itemData) {
        const loot = new LootItem(this, x, y, itemData);
        this.lootItems.push(loot);
    }

    performPickup() {
        const pickupRange = 50;
        const px = this.player.sprite.x;
        const py = this.player.sprite.y;

        // Iterate backwards to safely remove
        for (let i = this.lootItems.length - 1; i >= 0; i--) {
            const loot = this.lootItems[i];
            if (!loot.sprite) {
                this.lootItems.splice(i, 1);
                continue;
            }

            const dist = Phaser.Math.Distance.Between(px, py, loot.sprite.position.x, loot.sprite.position.y);
            if (dist <= pickupRange) {
                // Trigger Magnet Effect
                if (!loot.isMagnetized) {
                    loot.magnetize(this.player.sprite);
                }

                // If it's dead (collected), remove it
                if (loot.isDead) {
                    this.lootItems.splice(i, 1);
                }
            }
        }
    }


    performAttack() {
        // Attack Animation (if available) - just toggle visibility or something
        // Hitbox Check
        const attackRange = 100;
        const attackHeight = 50;
        const offset = this.player.sprite.flipX ? -attackRange / 2 : attackRange / 2;

        // Define Hitbox center
        const hitX = this.player.sprite.x + offset;
        const hitY = this.player.sprite.y;

        // Visual Hitbox (Debug)
        const debugRect = this.add.rectangle(hitX, hitY, attackRange, attackHeight, 0xffff00, 0.3);
        this.tweens.add({ targets: debugRect, alpha: 0, duration: 200, onComplete: () => debugRect.destroy() });

        // Query Collision
        // Filter monsters around the hitbox
        const activeMonsters = this.spawnManager.getGroup().filter(m => m.sprite.active);
        const targets = [];

        activeMonsters.forEach(monster => {
            const mx = monster.sprite.x;
            const my = monster.sprite.y;

            // MatterJS query could be better, but simple rect check works for now
            if (Math.abs(mx - hitX) < attackRange / 2 + 20 && Math.abs(my - hitY) < attackHeight / 2 + 20) {
                targets.push(monster);
            }
        });

        // Delegate to CombatManager
        if (targets.length > 0) {
            this.combatManager.performAttack(this.player, targets, 'basic');
        }
    }

    createMap() {
        const worldWidth = 2800;
        const worldHeight = 1200;
        this.matter.world.setBounds(0, 0, worldWidth, worldHeight);

        // Initialize MapBuilder
        const mapBuilder = new MapBuilder(this);

        // Base ground split into segments以呈現楓之谷狩獵場的落差感
        mapBuilder.createPlatform(worldWidth / 2, 1020, worldWidth + 400);
        mapBuilder.createPlatform(450, 880, 540);
        mapBuilder.createPlatform(1250, 900, 680);
        mapBuilder.createPlatform(2150, 860, 620);

        // Mid platforms
        mapBuilder.createPlatform(480, 720, 360);
        mapBuilder.createPlatform(1050, 650, 320);
        mapBuilder.createPlatform(1600, 720, 380);
        mapBuilder.createPlatform(2200, 640, 420);

        // Upper platforms
        mapBuilder.createPlatform(760, 520, 260);
        mapBuilder.createPlatform(1400, 480, 320);
        mapBuilder.createPlatform(1900, 520, 260);
        mapBuilder.createPlatform(2400, 440, 360);

        // Ropes connecting the layers
        this.ropes = [
            mapBuilder.createRope(460, 800, 210),
            mapBuilder.createRope(540, 620, 210),
            mapBuilder.createRope(1120, 780, 300),
            mapBuilder.createRope(1460, 600, 260),
            mapBuilder.createRope(1920, 760, 320),
            mapBuilder.createRope(2260, 580, 280),
            mapBuilder.createRope(2560, 480, 320)
        ];

        return { worldWidth, worldHeight };
    }

    addOtherPlayer(playerId, playerInfo) {
        this.otherPlayers[playerId] = new OtherPlayer(this, playerInfo.x, playerInfo.y, playerId);
    }

    update() {
        if (this.player) {
            this.player.update();

            // Update Spawn Manager
            this.spawnManager.update(this.time.now, this.game.loop.delta);

            // Emit movement
            // Optimize: Only emit if changed? 
            const x = this.player.sprite.x;
            const y = this.player.sprite.y;
            const flipX = this.player.sprite.flipX;

            if (this.player.oldPosition && (x !== this.player.oldPosition.x || y !== this.player.oldPosition.y || flipX !== this.player.oldPosition.flipX)) {
                this.networkManager.emitPlayerMovement(x, y, flipX);
            }

            // Save old position
            this.player.oldPosition = { x, y, flipX };
        }

        // Parallax Tiling Fix:
        // TileSprites need to shift their tilePosition based on camera scroll if we want them to repeat infinitely 
        // while the camera moves.
        // HOWEVER, setScrollFactor does this automatically for position. 
        // If the map is huge, the image might run out if it's not wide enough?
        // TileSprite repeats the texture. setScrollFactor moves the Sprite itself.
        // Actually, for infinite scrolling usually we update titlePositionX = camera.scrollX * factor
        // But here we set scrollFactor on the Sprite. This means the sprite stays relative to camera.
        // But we want it to cover the world?
        // Better approach for TileSprite + Camera:
        // Fix TileSprite to camera (ScrollFactor 0), then update tilePositionX based on camera scrollX.

        this.bgSky.tilePositionX = this.cameras.main.scrollX * 0.1;
        this.bgHills.tilePositionX = this.cameras.main.scrollX * 0.3;
        this.bgTrees.tilePositionX = this.cameras.main.scrollX * 0.5;

        // Also ensure they fill the screen
        this.bgSky.setPosition(this.cameras.main.scrollX, this.cameras.main.scrollY);
        this.bgHills.setPosition(this.cameras.main.scrollX, this.cameras.main.scrollY);
        this.bgTrees.setPosition(this.cameras.main.scrollX, this.cameras.main.scrollY);
        // Wait, if I set position to camera scroll, it follows the camera.
        // AND I set scrollFactor to 0. 
        // Correct.
        this.bgSky.width = this.cameras.main.width;
        this.bgSky.height = this.cameras.main.height;
        this.bgHills.width = this.cameras.main.width;
        this.bgHills.height = this.cameras.main.height;
        this.bgTrees.width = this.cameras.main.width;
        this.bgTrees.height = this.cameras.main.height;

        // Loot Update
        this.lootItems.forEach(item => item.update());
    }

    createOverlayUI() {
        const width = this.scale.width;
        const height = this.scale.height;

        const overlay = this.add.container(0, 0).setScrollFactor(0).setDepth(1200);

        const mapPanel = this.add.rectangle(18, 14, 240, 70, 0x000000, 0.35)
            .setOrigin(0, 0)
            .setStrokeStyle(2, 0xffffff, 0.4);
        const mapTitle = this.add.text(32, 26, '維多利亞島 - 弓手村外圍', {
            fontSize: '16px',
            fontStyle: 'bold',
            fill: '#FFE9A3',
            stroke: '#2d1800',
            strokeThickness: 4
        });

        const channelInfo = this.add.text(32, 50, 'CH.1  |  微風午後', {
            fontSize: '12px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        });

        const tipPanel = this.add.rectangle(width - 220, height - 150, 200, 90, 0x0d0f14, 0.5)
            .setOrigin(0.5)
            .setStrokeStyle(2, 0xffffff, 0.25);
        const tipTitle = this.add.text(width - 310, height - 190, '遊戲提示', {
            fontSize: '12px',
            fontStyle: 'bold',
            fill: '#7ed0ff',
            stroke: '#00111e',
            strokeThickness: 3
        }).setOrigin(0, 0);
        const tips = [
            '← → 移動 | ↑ 跳躍 | ↓ 繩索',
            'Z 普攻 / 撿取  •  X 施放技能',
            '怪物掉落的楓幣會自動被吸附'
        ];
        tips.forEach((t, i) => {
            const line = this.add.text(width - 410, height - 170 + i * 18, t, {
                fontSize: '12px',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 2
            });
            overlay.add(line);
        });

        overlay.add([mapPanel, mapTitle, channelInfo, tipPanel, tipTitle]);
    }
}
