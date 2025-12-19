import Phaser from 'phaser';
import ExpTable from '../data/ExpTable.json';

export default class StatManager extends Phaser.Events.EventEmitter {
    constructor(player) {
        super();
        this.player = player;

        // Base Stats
        this.str = 4;
        this.dex = 4;
        this.int = 4;
        this.luk = 4;

        // Vitals
        this.maxHp = 50;
        this.maxMp = 10;
        this.hp = 50;
        this.mp = 10;

        // Progression
        this.level = 1;
        this.exp = 0;
        this.maxExp = this.getMaxExpForLevel(1);
    }

    getMaxExpForLevel(lvl) {
        const entry = ExpTable.find(e => e.level === lvl);
        return entry ? entry.exp : 999999999;
    }

    gainExp(amount) {
        this.exp += amount;
        this.emit('expChange', this.exp, this.maxExp);
        console.log(`Gained ${amount} EXP. Total: ${this.exp}/${this.maxExp}`);

        while (this.exp >= this.maxExp) {
            this.levelUp();
        }
    }

    levelUp() {
        this.exp -= this.maxExp;
        this.level++;
        this.maxExp = this.getMaxExpForLevel(this.level);

        // Increase Stats (Maple-like algorithm)
        this.maxHp += Math.floor(Math.random() * 20) + 10;
        this.maxMp += Math.floor(Math.random() * 5) + 5;
        this.str += 5; // Auto-assign for now (Warrior build)

        // Full Heal
        this.hp = this.maxHp;
        this.mp = this.maxMp;

        console.log(`LEVEL UP! Now Level ${this.level}. MaxHP: ${this.maxHp}`);
        this.emit('levelUp', this.level);
        this.emit('statChange', { hp: this.hp, maxHp: this.maxHp, mp: this.mp, maxMp: this.maxMp });
    }

    takeDamage(amount) {
        this.hp = Math.max(0, this.hp - amount);
        this.emit('statChange', { hp: this.hp, maxHp: this.maxHp, mp: this.mp, maxMp: this.maxMp });
        return this.hp <= 0;
    }

    consumeMp(amount) {
        if (this.mp >= amount) {
            this.mp -= amount;
            this.emit('statChange', { hp: this.hp, maxHp: this.maxHp, mp: this.mp, maxMp: this.maxMp });
            return true;
        }
        return false;
    }

    // --- Combat Formulas (Pre-Big Bang Style) ---
    getDamageRange() {
        // Simple formula for Warrior-style:
        // Max = ((STR * 4.0) + DEX) / 100 * WeaponAtt
        // Min = ((STR * 0.9 * 4.0 * Mastery) + DEX) / 100 * WeaponAtt

        // Mock Weapon Attack (Start with 15)
        const weaponAtt = 15;
        const mastery = 0.6; // 60% mastery

        // Calculate Max
        // Formula: MaxDamage = ((STR * 4.0) + DEX) * WeaponAttack / 100
        const maxDmg = Math.floor(((this.str * 4.0) + this.dex) * weaponAtt / 100);

        // Calculate Min
        // Formula: MinDamage = ((STR * 0.9 * 4.0 * mastery) + DEX) * WeaponAttack / 100
        const minDmg = Math.floor(((this.str * 3.6 * mastery) + this.dex) * weaponAtt / 100);

        return { min: minDmg, max: maxDmg };
    }
}
