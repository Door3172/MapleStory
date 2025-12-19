export default class MapBuilder {
    constructor(scene) {
        this.scene = scene;
    }

    // Create a flat platform
    createPlatform(x, y, width) {
        // 1. Visuals
        const height = 64; // Asset height approx
        const tileSprite = this.scene.add.tileSprite(x, y, width, height, 'ground_tile');

        // 2. Physics
        const body = this.scene.matter.add.rectangle(x, y, width, height, {
            isStatic: true,
            friction: 0,
            frictionStatic: 0,
            label: 'ground'
        });

        // 3. Sync Visuals
        // Matter bodies are centered. TileSprite is centered by default.
        // Ensure depth is correct
        tileSprite.setDepth(-1); // Behind player

        return { sprite: tileSprite, body: body };
    }

    // Helper to create multiple platforms from data
    buildMap(layoutData) {
        layoutData.forEach(p => {
            this.createPlatform(p.x, p.y, p.width);
        });
    }
}
