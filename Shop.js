// Shop & Customization Manager with LocalStorage Persistence

export class ShopManager {
  constructor() {
    this.STORAGE_KEY = 'temple_run_gold_save_v1';
    
    this.data = {
      totalCoins: 0,
      highScore: 0,
      selectedSkin: 'golden_warrior',
      unlockedSkins: ['golden_warrior'],
      upgrades: {
        magnet: 1,      // Level 1-5
        shield: 1,      // Level 1-5
        multiplier: 1,  // Level 1-5
        speedDash: 1    // Level 1-5
      }
    };

    this.skinsData = [
      {
        id: 'golden_warrior',
        name: 'GOLDEN WARRIOR',
        desc: 'Traditional temple guardian with polished gold armor.',
        icon: '🛡️',
        price: 0,
        color: '#FFD700'
      },
      {
        id: 'solar_pharaoh',
        name: 'SOLAR PHARAOH',
        desc: 'Ancient sun king. Earns +20% bonus score from coins.',
        icon: '👑',
        price: 500,
        color: '#FFA500'
      },
      {
        id: 'shadow_ninja',
        name: 'SHADOW NINJA',
        desc: 'Stealth runner with glowing obsidian dark trim.',
        icon: '🥷',
        price: 1200,
        color: '#4169E1'
      },
      {
        id: 'cyber_titan',
        name: 'CYBER TITAN',
        desc: 'Futuristic black & neon gold biomech runner.',
        icon: '🤖',
        price: 2500,
        color: '#00F0FF'
      }
    ];

    this.upgradesData = [
      {
        id: 'magnet',
        name: 'GOLD MAGNET DURATION',
        icon: '🧲',
        baseCost: 200,
        desc: 'Attracts all coins in nearby lanes automatically.'
      },
      {
        id: 'shield',
        name: 'GOLDEN SHIELD AURA',
        icon: '🛡️',
        baseCost: 300,
        desc: 'Protects runner from fatal obstacle collisions.'
      },
      {
        id: 'multiplier',
        name: 'SCORE MULTIPLIER BOOST',
        icon: '⚡',
        baseCost: 400,
        desc: 'Increases global score multiplier.'
      },
      {
        id: 'speedDash',
        name: 'SUPER DASH DURATION',
        icon: '🚀',
        baseCost: 500,
        desc: 'Extends length of invincible hyper-speed dashes.'
      }
    ];

    this.loadSaveData();
  }

  loadSaveData() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.data = { ...this.data, ...parsed };
      }
    } catch (e) {
      console.warn('Could not load save data from localStorage:', e);
    }
  }

  save() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.warn('Could not save data to localStorage:', e);
    }
  }

  addCoins(amount) {
    this.data.totalCoins += amount;
    this.save();
  }

  updateHighScore(score) {
    if (score > this.data.highScore) {
      this.data.highScore = score;
      this.save();
      return true; // New High Score!
    }
    return false;
  }

  buySkin(skinId) {
    const skin = this.skinsData.find(s => s.id === skinId);
    if (!skin) return false;

    if (this.data.unlockedSkins.includes(skinId)) {
      this.data.selectedSkin = skinId;
      this.save();
      return true;
    }

    if (this.data.totalCoins >= skin.price) {
      this.data.totalCoins -= skin.price;
      this.data.unlockedSkins.push(skinId);
      this.data.selectedSkin = skinId;
      this.save();
      return true;
    }

    return false;
  }

  upgradePowerup(upgradeId) {
    const currentLevel = this.data.upgrades[upgradeId] || 1;
    if (currentLevel >= 5) return false;

    const upgradeDef = this.upgradesData.find(u => u.id === upgradeId);
    if (!upgradeDef) return false;

    const cost = upgradeDef.baseCost * currentLevel;
    if (this.data.totalCoins >= cost) {
      this.data.totalCoins -= cost;
      this.data.upgrades[upgradeId] = currentLevel + 1;
      this.save();
      return true;
    }

    return false;
  }

  getUpgradeLevel(upgradeId) {
    return this.data.upgrades[upgradeId] || 1;
  }

  getUpgradeCost(upgradeId) {
    const level = this.getUpgradeLevel(upgradeId);
    const upgradeDef = this.upgradesData.find(u => u.id === upgradeId);
    return upgradeDef ? upgradeDef.baseCost * level : 9999;
  }
}

export const shopManager = new ShopManager();
