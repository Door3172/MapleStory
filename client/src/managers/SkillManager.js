import Phaser from 'phaser';

export default class SkillManager {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        this.skills = {
            'magic_claw': {
                id: 'magic_claw',
                name: 'Magic Claw',
                mpCost: 10,
                cooldown: 500, // ms
                damageMultiplier: 1.5,
                hitCount: 2,
                range: 150,
                lastCast: 0
            }
        };
    }

    canCast(skillId) {
        const skill = this.skills[skillId];
        if (!skill) return false;

        const now = this.scene.time.now;

        // Check Cooldown
        if (now - skill.lastCast < skill.cooldown) {
            console.log(`Skill ${skill.name} is on cooldown!`);
            return false;
        }

        // Check MP
        if (this.player.stats.mp < skill.mpCost) {
            console.log(`Not enough MP for ${skill.name}!`);
            return false;
        }

        return true;
    }

    getSkill(skillId) {
        return this.skills[skillId];
    }

    // Called when skill is actually used successfully
    useSkill(skillId) {
        const skill = this.skills[skillId];
        if (!skill) return;

        // Consume MP
        this.player.stats.consumeMp(skill.mpCost);

        // Set Cooldown
        skill.lastCast = this.scene.time.now;

        return skill;
    }
}
