import Phaser from 'phaser';
import StatManager from '../managers/StatManager';
import SkillManager from '../managers/SkillManager';

export default class Player {
    constructor(scene, x, y) {
        this.scene = scene;

        // Stats
        this.stats = new StatManager(this);
        this.skillManager = new SkillManager(scene, this);

        // Create Matter Sprite with chamfer for smooth slope walking
        // Chamfer makes the corners rounded
        this.sprite = scene.matter.add.sprite(x, y, 'player', null, {
            chamfer: { radius: 10 },
            friction: 0, // Friction against ground (0 for smooth slope movement)
            frictionStatic: 0,
            frictionAir: 0.01
        });

        this.sprite.setFixedRotation(); // Prevent tipping over

        // Movement Config
        this.speed = 8; // Increased from 4 for faster movement
        this.jumpForce = 12; // Adjusted for better slope traversal
        this.canDoubleJump = false;

        // Input
        this.cursors = scene.input.keyboard.createCursorKeys();

        // State
        this.isClimbing = false;
        this.ropes = []; // Array of rope bodies
        // We will do a simple raycast or bounds check for now in update
    }

    setRopes(ropes) {
        this.ropes = ropes;
    }

    update() {
        const { left, right, up, down } = this.cursors;
        const velocity = this.sprite.body.velocity;
        const sprite = this.sprite;

        // --- CLIMBING LOGIC ---
        if (this.isClimbing) {
            sprite.setIgnoreGravity(true);
            sprite.setVelocityX(0); // Lock horizontal

            // Climb Up/Down
            if (up.isDown) {
                sprite.setVelocityY(-this.speed / 1.5);
            } else if (down.isDown) {
                sprite.setVelocityY(this.speed / 1.5);
            } else {
                sprite.setVelocityY(0);
            }

            // Jump off rope
            if (Phaser.Input.Keyboard.JustDown(this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE))) {
                this.isClimbing = false;
                sprite.setIgnoreGravity(false);
                sprite.setVelocityY(-this.jumpForce);
                // Optional: Push away slightly?
            }
            // Check if still on rope (simple bounds check or sensor)
            // For now, if we move off the rope vertically? 
            // We'll rely on the player explicitly jumping off for now, 
            // OR check overlap every frame.
            const isOverlappingRope = this.scene.matter.overlap(sprite, this.ropes);
            if (!isOverlappingRope) {
                // Disengage if we slide off the top/bottom
                // Careful: sprite might be slightly out of bounds.
                // Ideally snap to center.
            }
            return; // Skip normal movement
        }

        // --- NORMAL MOVEMENT LOGIC ---

        // Check for Rope Interaction
        if (up.isDown && !this.isClimbing) {
            // Use Matter.Query for precise collision check against sensors
            const collisions = Phaser.Physics.Matter.Matter.Query.collides(this.sprite.body, this.ropes);
            const isOverlappingRope = collisions.length > 0;

            // Debug Log
            if (Phaser.Input.Keyboard.JustDown(up)) {
                console.log('Up pressed. Overlap:', isOverlappingRope, 'Ropes:', this.ropes.length);
                if (this.ropes.length > 0) {
                    console.log('Rope Bounds:', this.ropes[0].bounds);
                    console.log('Player Bounds:', sprite.body.bounds);
                }
            }

            if (isOverlappingRope) {
                console.log('Climb triggered!');
                this.isClimbing = true;
                sprite.setIgnoreGravity(true);
                sprite.setVelocity(0, 0);

                // Snap to rope X
                // The collision object contains bodyA and bodyB. One is the player, one is the rope.
                // We need to find which one is the rope.
                const ropeBody = collisions[0].bodyA === this.sprite.body ? collisions[0].bodyB : collisions[0].bodyA;
                if (ropeBody) {
                    sprite.x = ropeBody.position.x;
                }
                return;
            }
        }

        // Apply Gravity (Restore if was climbing)
        sprite.setIgnoreGravity(false);

        // Ground Check
        const isGrounded = Math.abs(velocity.y) < 0.2; // Simple check

        if (isGrounded) {
            this.canDoubleJump = true;
        }

        // Horizontal Movement
        if (left.isDown) {
            sprite.setVelocityX(-this.speed);
            sprite.setFlipX(true);
        } else if (right.isDown) {
            sprite.setVelocityX(this.speed);
            sprite.setFlipX(false);
        } else {
            sprite.setVelocityX(0);
        }

        // Jumping (Up or Space)
        const jumpKey = up; // Use Up for jump in normal mode if not climbing? 
        // MapleStory uses SPACE for jump usually, UP for portals/ropes.
        // Let's support SPACE for jump as well.
        const space = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        if (Phaser.Input.Keyboard.JustDown(space) || Phaser.Input.Keyboard.JustDown(up)) {
            // If Up is pressed, we might have handled rope above. 
            // If we are here, we are not climbing.
            // If Up was pressed but no rope, we Jump? 
            // MapleStory: Up is NOT jump. Alt/Space is jump. 
            // User prompt: "Climb ladders (Up/Down keys)". 
            // "Jump off them" -> Implies Jump key.
            // "Player... walk, jump, and double-jump".

            // I will use SPACE for Jump to separate concerns. 
            // If UP is pressed, it's only for Portals/Ropes.

            if (Phaser.Input.Keyboard.JustDown(space)) { // Only jump on Space
                if (isGrounded) {
                    sprite.setVelocityY(-this.jumpForce);
                } else if (this.canDoubleJump) {
                    sprite.setVelocityY(-this.jumpForce * 0.8);
                    this.canDoubleJump = false;

                    // Visual effect? (TODO)
                    this.scene.tweens.add({
                        targets: this.sprite,
                        angle: 360,
                        duration: 400
                    });
                }
            }
        }
    }
}
