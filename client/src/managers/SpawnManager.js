import Monster from '../objects/Monster';

export default class SpawnManager {
    constructor(scene) {
        this.scene = scene;
        this.spawnPoints = [];
        this.pool = [];
        this.maxMonsters = 5;
        this.activeMonsters = 0;
    }

    setSpawnPoints(points) {
        this.spawnPoints = points;
    }

    setup() {
        // Pre-fill pool
        for (let i = 0; i < this.maxMonsters; i++) {
            this.spawnMonster();
        }
    }

    spawnMonster() {
        if (this.activeMonsters >= this.maxMonsters) return;

        let monster = this.pool.find(m => !m.sprite.active);

        // Get random spawn point
        const point = this.spawnPoints[Math.floor(Math.random() * this.spawnPoints.length)];

        if (!monster) {
            // Create new if pool empty (or initial fill)
            monster = new Monster(this.scene, point.x, point.y);
            monster.onDeath = (m) => this.handleMonsterDeath(m);
            this.pool.push(monster);
        } else {
            // Reuse
            monster.reset(point.x, point.y);
        }

        this.activeMonsters++;
    }

    handleMonsterDeath(monster) {
        this.activeMonsters--;
        console.log(`Monster died. Active: ${this.activeMonsters}. Respawning in 5s...`);

        // Timer for Respawn
        this.scene.time.addEvent({
            delay: 5000,
            callback: () => {
                this.spawnMonster();
            },
            callbackScope: this
        });
    }

    update(time, delta) {
        this.pool.forEach(monster => {
            if (monster.sprite.active) {
                monster.update(time, delta);
            }
        });
    }

    getGroup() {
        return this.pool;
    }
}
