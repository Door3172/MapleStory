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
        // Check game dimensions or use a large width
        const width = this.scale.width;
        const height = this.scale.height;

        this.bgSky = this.add.tileSprite(0, 0, width, height, 'bg_sky')
            .setOrigin(0, 0)
            .setScrollFactor(0); // Static to camera

        // 2. Hills (Far background, slow scroll)
        // Positioned lower, maybe?
        this.bgHills = this.add.tileSprite(0, 0, width, height, 'bg_hills')
            .setOrigin(0, 0)
            .setScrollFactor(0.2); // Moves at 20% speed

        // 3. Trees (Near background, medium scroll)
        this.bgTrees = this.add.tileSprite(0, 0, width, height, 'bg_trees')
            .setOrigin(0, 0)
            .setScrollFactor(0.5)
            .setDepth(-5); // Behind player, in front of hills? 
        // Actually, usually Sky < Hills < Map < Trees(Foreground)?
        // Creating depth: Sky(-20) -> Hills(-15) -> Trees(-10) -> Map/Player(0)

        this.bgSky.setDepth(-20);
        this.bgHills.setDepth(-15);
        this.bgTrees.setDepth(-10);

        // Assets for easier debugging
        // this.add.rectangle(0, 0, 2000, 1000, 0x87CEEB).setOrigin(0).setDepth(-10); // Sky REPLACED BY BG

        this.createMap();

        // Player Setup
        this.player = new Player(this, 100, 300);
        // We set ropes after creating map, or pass them if available
        if (this.rope) {
            this.player.setRopes([this.rope]);
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
        this.cameras.main.setBounds(0, 0, 2000, 1000);
        this.cameras.main.startFollow(this.player.sprite);

        // --- COMBAT SYSTEM (Via SpawnManager) ---
        this.spawnManager = new SpawnManager(this);
        this.spawnManager.setSpawnPoints([
            { x: 400, y: 300 },
            { x: 600, y: 300 },
            { x: 800, y: 300 },
            { x: 1000, y: 300 },
            { x: 1200, y: 300 }
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
        this.matter.world.setBounds(0, 0, 2000, 1000);

        // Initialize MapBuilder
        const mapBuilder = new MapBuilder(this);

        // --- Heneysys Hunting Ground 1 Layout ---

        // 1. Ground Floor (Main walk area)
        // Two large sections with a gap? Or one continuous? 
        // Let's do one main ground with some variation.
        mapBuilder.createPlatform(1000, 950, 2000); // Main Ground at y=950, width 2000

        // 2. Layer 1 Platforms (Low)
        mapBuilder.createPlatform(400, 750, 300);
        mapBuilder.createPlatform(1400, 750, 300);

        // 3. Layer 2 Platforms (High)
        mapBuilder.createPlatform(900, 550, 400);

        // 4. Ropes (Connecting layers)
        // Rope 1: Ground to Layer 1 (Left)
        this.ropes = [];
        this.ropes.push(this.matter.add.rectangle(400, 850, 20, 200, { isSensor: true, isStatic: true, label: 'rope' })); // y-center: 850 (950 to 750)

        // Rope 2: Layer 1 (Left) to Layer 2
        this.ropes.push(this.matter.add.rectangle(500, 650, 20, 200, { isSensor: true, isStatic: true, label: 'rope' }));

        // Rope 3: Ground to Layer 1 (Right)
        this.ropes.push(this.matter.add.rectangle(1400, 850, 20, 200, { isSensor: true, isStatic: true, label: 'rope' }));

        if (this.player) {
            this.player.setRopes(this.ropes);
        }
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
}
