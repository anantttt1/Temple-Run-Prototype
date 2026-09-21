import { GameEngine } from './game/Engine.js';
import { shopManager } from './game/Shop.js';
import { audioSystem } from './game/AudioSystem.js';

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  const engine = new GameEngine(canvas);

  // UI Element References
  const startMenu = document.getElementById('start-menu');
  const gameHud = document.getElementById('game-hud');
  const pauseModal = document.getElementById('pause-modal');
  const gameOverScreen = document.getElementById('game-over-screen');
  const shopModal = document.getElementById('shop-modal');
  const controlsModal = document.getElementById('controls-modal');

  // Stats Text Elements
  const menuHighScore = document.getElementById('menu-high-score');
  const menuTotalCoins = document.getElementById('menu-total-coins');
  
  const hudScore = document.getElementById('hud-score');
  const hudCoins = document.getElementById('hud-coins');
  const hudMultiplier = document.getElementById('hud-multiplier');
  const hudDistance = document.getElementById('hud-distance');
  const distanceFill = document.getElementById('distance-fill');
  const powerupBar = document.getElementById('powerup-bar');

  const goScore = document.getElementById('go-score');
  const goCoins = document.getElementById('go-coins');
  const goDistance = document.getElementById('go-distance');
  const goEarned = document.getElementById('go-earned');
  const goReason = document.getElementById('game-over-reason');
  const newRecordBadge = document.getElementById('new-record-badge');

  // Shop Elements
  const shopCoinsTotal = document.getElementById('shop-coins-total');
  const skinsGrid = document.getElementById('skins-grid');
  const upgradesList = document.getElementById('upgrades-list');
  const tabSkins = document.getElementById('tab-skins');
  const tabUpgrades = document.getElementById('tab-upgrades');
  const skinsContent = document.getElementById('shop-skins-content');
  const upgradesContent = document.getElementById('shop-upgrades-content');

  // Refresh Menu Stats
  function updateMenuStats() {
    menuHighScore.textContent = shopManager.data.highScore.toLocaleString();
    menuTotalCoins.textContent = `🪙 ${shopManager.data.totalCoins.toLocaleString()}`;
    shopCoinsTotal.textContent = `🪙 ${shopManager.data.totalCoins.toLocaleString()}`;
  }
  updateMenuStats();

  // Engine Callbacks
  engine.onHUDUpdateCallback = (data) => {
    hudScore.textContent = data.score.toLocaleString();
    hudCoins.textContent = `🪙 ${data.coins}`;
    hudMultiplier.textContent = `x${data.multiplier}`;
    hudDistance.textContent = `${data.distance}m`;

    const progressPercent = Math.min((data.distance / 2000) * 100, 100);
    distanceFill.style.width = `${progressPercent}%`;

    // Render Active Powerup Timers
    powerupBar.innerHTML = '';
    const powerupDefs = {
      shield: { name: 'SHIELD', icon: '🛡️' },
      magnet: { name: 'MAGNET', icon: '🧲' },
      speedDash: { name: 'SPEED DASH', icon: '🚀' },
      doubleCoins: { name: 'DOUBLE COINS', icon: '🪙' }
    };

    Object.keys(data.powerups).forEach(key => {
      const timeRemaining = data.powerups[key];
      if (timeRemaining > 0) {
        const def = powerupDefs[key];
        const pct = (timeRemaining / 12) * 100;
        
        const pill = document.createElement('div');
        pill.className = 'powerup-pill';
        pill.innerHTML = `
          <span>${def.icon} ${def.name}</span>
          <div class="powerup-progress">
            <div class="powerup-progress-fill" style="width: ${pct}%"></div>
          </div>
        `;
        powerupBar.appendChild(pill);
      }
    });
  };

  engine.onGameOverCallback = (result) => {
    gameHud.classList.add('hidden');
    gameOverScreen.classList.remove('hidden');

    goScore.textContent = result.score.toLocaleString();
    goCoins.textContent = result.coins;
    goDistance.textContent = `${result.distance}m`;
    goEarned.textContent = `+🪙 ${result.coins}`;
    goReason.textContent = result.reason;

    if (result.isNewRecord) {
      newRecordBadge.classList.remove('hidden');
    } else {
      newRecordBadge.classList.add('hidden');
    }

    updateMenuStats();
  };

  // Button Event Listeners
  document.getElementById('btn-play').addEventListener('click', () => {
    startMenu.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    gameHud.classList.remove('hidden');
    engine.startRun();
  });

  document.getElementById('btn-retry').addEventListener('click', () => {
    gameOverScreen.classList.add('hidden');
    gameHud.classList.remove('hidden');
    engine.startRun();
  });

  document.getElementById('btn-pause').addEventListener('click', () => {
    engine.pause();
    pauseModal.classList.remove('hidden');
  });

  document.getElementById('btn-resume').addEventListener('click', () => {
    pauseModal.classList.add('hidden');
    engine.resume();
  });

  document.getElementById('btn-restart-pause').addEventListener('click', () => {
    pauseModal.classList.add('hidden');
    engine.startRun();
  });

  document.getElementById('btn-quit').addEventListener('click', () => {
    pauseModal.classList.add('hidden');
    gameHud.classList.add('hidden');
    startMenu.classList.remove('hidden');
    engine.state = 'MENU';
    audioSystem.stopMusic();
    updateMenuStats();
  });

  // Shop Open / Close
  document.getElementById('btn-shop').addEventListener('click', () => openShop());
  document.getElementById('btn-go-shop').addEventListener('click', () => {
    gameOverScreen.classList.add('hidden');
    openShop();
  });
  document.getElementById('btn-close-shop').addEventListener('click', () => {
    shopModal.classList.add('hidden');
    if (engine.state === 'MENU') startMenu.classList.remove('hidden');
    updateMenuStats();
  });

  // Controls Modal
  document.getElementById('btn-controls').addEventListener('click', () => {
    controlsModal.classList.remove('hidden');
  });
  document.getElementById('btn-close-controls').addEventListener('click', () => {
    controlsModal.classList.add('hidden');
  });

  // Audio Toggles
  const sfxBtn = document.getElementById('btn-toggle-sfx');
  const musicBtn = document.getElementById('btn-toggle-music');

  sfxBtn.addEventListener('click', () => {
    audioSystem.sfxEnabled = !audioSystem.sfxEnabled;
    sfxBtn.textContent = audioSystem.sfxEnabled ? 'ON' : 'OFF';
    sfxBtn.classList.toggle('active', audioSystem.sfxEnabled);
  });

  musicBtn.addEventListener('click', () => {
    audioSystem.musicEnabled = !audioSystem.musicEnabled;
    musicBtn.textContent = audioSystem.musicEnabled ? 'ON' : 'OFF';
    musicBtn.classList.toggle('active', audioSystem.musicEnabled);
  });

  // Shop Tabs
  tabSkins.addEventListener('click', () => {
    tabSkins.classList.add('active');
    tabUpgrades.classList.remove('active');
    skinsContent.classList.add('active');
    upgradesContent.classList.remove('active');
  });

  tabUpgrades.addEventListener('click', () => {
    tabUpgrades.classList.add('active');
    tabSkins.classList.remove('active');
    upgradesContent.classList.add('active');
    skinsContent.classList.remove('active');
  });

  function openShop() {
    shopModal.classList.remove('hidden');
    renderShopSkins();
    renderShopUpgrades();
    updateMenuStats();
  }

  function renderShopSkins() {
    skinsGrid.innerHTML = '';
    shopManager.skinsData.forEach(skin => {
      const isUnlocked = shopManager.data.unlockedSkins.includes(skin.id);
      const isSelected = shopManager.data.selectedSkin === skin.id;

      const card = document.createElement('div');
      card.className = 'skin-card';
      card.innerHTML = `
        <div class="skin-preview-box" style="border-color: ${skin.color}">
          <span>${skin.icon}</span>
        </div>
        <div class="skin-title">${skin.name}</div>
        <div class="skin-desc">${skin.desc}</div>
        <button class="btn-primary gold-btn shop-btn-action">
          ${isSelected ? 'EQUIPPED ✓' : isUnlocked ? 'EQUIP' : `BUY 🪙 ${skin.price}`}
        </button>
      `;

      const btn = card.querySelector('.shop-btn-action');
      btn.addEventListener('click', () => {
        if (shopManager.buySkin(skin.id)) {
          audioSystem.playPowerup();
          renderShopSkins();
          updateMenuStats();
        }
      });

      skinsGrid.appendChild(card);
    });
  }

  function renderShopUpgrades() {
    upgradesList.innerHTML = '';
    shopManager.upgradesData.forEach(upg => {
      const currentLevel = shopManager.getUpgradeLevel(upg.id);
      const cost = shopManager.getUpgradeCost(upg.id);

      let dotsHtml = '';
      for (let i = 1; i <= 5; i++) {
        dotsHtml += `<div class="dot ${i <= currentLevel ? 'filled' : ''}"></div>`;
      }

      const item = document.createElement('div');
      item.className = 'upgrade-item';
      item.innerHTML = `
        <div class="upgrade-info">
          <div class="upgrade-icon">${upg.icon}</div>
          <div>
            <div class="upgrade-title">${upg.name}</div>
            <div class="upgrade-level-dots">${dotsHtml}</div>
          </div>
        </div>
        <button class="btn-secondary shop-upgrade-btn">
          ${currentLevel >= 5 ? 'MAX LEVEL' : `UPGRADE 🪙 ${cost}`}
        </button>
      `;

      const btn = item.querySelector('.shop-upgrade-btn');
      btn.addEventListener('click', () => {
        if (shopManager.upgradePowerup(upg.id)) {
          audioSystem.playPowerup();
          renderShopUpgrades();
          updateMenuStats();
        }
      });

      upgradesList.appendChild(item);
    });
  }

  // Input Handling (Keyboard & Touch Swipes)
  window.addEventListener('keydown', (e) => {
    if (engine.state !== 'PLAYING') return;

    switch (e.code) {
      case 'ArrowLeft':
      case 'KeyA':
        if (engine.player.moveLeft()) audioSystem.playTurn();
        break;
      case 'ArrowRight':
      case 'KeyD':
        if (engine.player.moveRight()) audioSystem.playTurn();
        break;
      case 'ArrowUp':
      case 'KeyW':
      case 'Space':
        if (engine.player.jump()) audioSystem.playJump();
        break;
      case 'ArrowDown':
      case 'KeyS':
        if (engine.player.slide()) audioSystem.playSlide();
        break;
      case 'Escape':
      case 'KeyP':
        engine.pause();
        pauseModal.classList.remove('hidden');
        break;
    }
  });

  // Mobile / Touch Swipe Gestures
  let touchStartX = 0;
  let touchStartY = 0;

  window.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  });

  window.addEventListener('touchend', (e) => {
    if (engine.state !== 'PLAYING') return;

    const diffX = e.changedTouches[0].clientX - touchStartX;
    const diffY = e.changedTouches[0].clientY - touchStartY;

    if (Math.abs(diffX) > Math.abs(diffY)) {
      // Horizontal swipe
      if (Math.abs(diffX) > 30) {
        if (diffX < 0) {
          if (engine.player.moveLeft()) audioSystem.playTurn();
        } else {
          if (engine.player.moveRight()) audioSystem.playTurn();
        }
      }
    } else {
      // Vertical swipe
      if (Math.abs(diffY) > 30) {
        if (diffY < 0) {
          if (engine.player.jump()) audioSystem.playJump();
        } else {
          if (engine.player.slide()) audioSystem.playSlide();
        }
      }
    }
  });

  // Virtual Arcade Buttons
  document.getElementById('vbtn-left').addEventListener('click', () => {
    if (engine.state === 'PLAYING' && engine.player.moveLeft()) audioSystem.playTurn();
  });

  document.getElementById('vbtn-right').addEventListener('click', () => {
    if (engine.state === 'PLAYING' && engine.player.moveRight()) audioSystem.playTurn();
  });

  document.getElementById('vbtn-up').addEventListener('click', () => {
    if (engine.state === 'PLAYING' && engine.player.jump()) audioSystem.playJump();
  });

  document.getElementById('vbtn-down').addEventListener('click', () => {
    if (engine.state === 'PLAYING' && engine.player.slide()) audioSystem.playSlide();
  });
});
