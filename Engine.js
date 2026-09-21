import * as THREE from 'three';
import { PlayerController } from './PlayerController.js';
import { TrackManager } from './TrackManager.js';
import { Chaser } from './Chaser.js';
import { ParticleSystem } from './ParticleSystem.js';
import { audioSystem } from './AudioSystem.js';
import { shopManager } from './Shop.js';

export class GameEngine {
  constructor(canvas) {
    this.canvas = canvas;

    // Game States: 'MENU', 'PLAYING', 'PAUSED', 'GAMEOVER'
    this.state = 'MENU';

    // Game Parameters
    this.baseSpeed = 16.0;
    this.gameSpeed = 16.0;
    this.maxSpeed = 34.0;
    this.distance = 0;
    this.score = 0;
    this.coinsCollected = 0;
    this.multiplier = 1;

    // Camera Shake
    this.shakeIntensity = 0;

    // Setup Three.js Scene, Camera, Renderer
    this.initThree();

    // Instantiate Subsystems
    this.player = new PlayerController(this.scene);
    this.track = new TrackManager(this.scene);
    this.chaser = new Chaser(this.scene);
    this.particles = new ParticleSystem(this.scene);

    // Initial Track Creation
    this.track.reset();

    // Event Listeners
    window.addEventListener('resize', () => this.onWindowResize());

    // Bind Render Loop
    this.lastTime = performance.now();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  initThree() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x07070A);
    this.scene.fog = new THREE.FogExp2(0x07070A, 0.018);

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      65,
      window.innerWidth / window.innerHeight,
      0.1,
      200
    );
    this.camera.position.set(0, 3.5, -6.5);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Dynamic Lighting
    const ambientLight = new THREE.AmbientLight(0x222233, 1.2);
    this.scene.add(ambientLight);

    // Golden Sunlight
    this.sunLight = new THREE.DirectionalLight(0xFFD700, 2.0);
    this.sunLight.position.set(20, 40, -10);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 1024;
    this.sunLight.shadow.mapSize.height = 1024;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 100;
    this.sunLight.shadow.camera.left = -20;
    this.sunLight.shadow.camera.right = 20;
    this.sunLight.shadow.camera.top = 20;
    this.sunLight.shadow.camera.bottom = -20;
    this.scene.add(this.sunLight);

    // Blue Rim Light for Contrast
    const rimLight = new THREE.DirectionalLight(0x00F0FF, 0.8);
    rimLight.position.set(-15, 10, 20);
    this.scene.add(rimLight);
  }

  startRun() {
    this.state = 'PLAYING';
    this.gameSpeed = this.baseSpeed;
    this.distance = 0;
    this.score = 0;
    this.coinsCollected = 0;
    this.multiplier = shopManager.getUpgradeLevel('multiplier');
    
    this.player.reset();
    this.track.reset();
    this.chaser.reset();
    
    // Refresh character mesh based on shop skin
    this.player.buildCharacterMesh();

    audioSystem.startMusic();
  }

  pause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
    }
  }

  resume() {
    if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
    }
  }

  gameOver(reason) {
    this.state = 'GAMEOVER';
    audioSystem.playCrash();
    audioSystem.stopMusic();

    this.shakeIntensity = 0.8;

    const isNewRecord = shopManager.updateHighScore(Math.floor(this.score));
    shopManager.addCoins(this.coinsCollected);

    if (this.onGameOverCallback) {
      this.onGameOverCallback({
        score: Math.floor(this.score),
        coins: this.coinsCollected,
        distance: Math.floor(this.distance),
        isNewRecord: isNewRecord,
        reason: reason
      });
    }
  }

  animate(now) {
    requestAnimationFrame(this.animate);

    const delta = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    if (this.state === 'PLAYING') {
      this.updateGameLogic(delta);
    }

    // Always update camera follow & rendering
    this.updateCamera(delta);
    this.particles.update(delta);
    this.renderer.render(this.scene, this.camera);
  }

  updateGameLogic(delta) {
    // Increase game speed gradually over time
    if (this.player.hasSpeedDash) {
      this.gameSpeed = this.baseSpeed * 1.8;
      this.particles.spawnSpeedDust(this.player.group.position);
    } else {
      this.gameSpeed = Math.min(this.baseSpeed + (this.distance * 0.005), this.maxSpeed);
    }

    // Advance Distance & Score
    const moveDistance = this.gameSpeed * delta;
    this.distance += moveDistance;
    this.player.group.position.z += moveDistance;
    this.score += moveDistance * 2 * this.multiplier;

    // Update Subsystems
    this.player.update(delta, this.gameSpeed);
    this.track.update(delta, this.player.group.position, this.player);
    this.chaser.update(delta, this.player.group.position, this.gameSpeed);

    // Update Sunlight position with player
    this.sunLight.position.z = this.player.group.position.z - 10;
    this.sunLight.target.position.set(0, 0, this.player.group.position.z);
    this.sunLight.target.updateMatrixWorld();

    // Check Collisions
    this.checkCoinCollisions();
    this.checkPowerupCollisions();
    this.checkObstacleCollisions();

    // Update HUD Callback
    if (this.onHUDUpdateCallback) {
      this.onHUDUpdateCallback({
        score: Math.floor(this.score),
        coins: this.coinsCollected,
        distance: Math.floor(this.distance),
        multiplier: this.multiplier,
        powerups: this.player.powerupTimers
      });
    }
  }

  checkCoinCollisions() {
    const pPos = this.player.group.position;
    const playerRadius = 0.8;

    for (let i = this.track.coins.length - 1; i >= 0; i--) {
      const coin = this.track.coins[i];
      const dist = coin.position.distanceTo(pPos);

      if (dist < playerRadius + 0.4) {
        // Collect Coin!
        const value = this.player.hasDoubleCoins ? 2 : 1;
        this.coinsCollected += value;
        this.score += 50 * value;

        audioSystem.playCoin();
        this.particles.spawnCoinBurst(coin.position);

        this.scene.remove(coin);
        this.track.coins.splice(i, 1);
      }
    }
  }

  checkPowerupCollisions() {
    const pPos = this.player.group.position;

    for (let i = this.track.powerups.length - 1; i >= 0; i--) {
      const orb = this.track.powerups[i];
      const dist = orb.position.distanceTo(pPos);

      if (dist < 1.2) {
        const type = orb.userData.type;
        const upgradeLevel = shopManager.getUpgradeLevel(type);
        const duration = 6 + (upgradeLevel * 2);

        this.player.activatePowerup(type, duration);
        audioSystem.playPowerup();

        this.scene.remove(orb);
        this.track.powerups.splice(i, 1);
      }
    }
  }

  checkObstacleCollisions() {
    if (this.player.hasSpeedDash) return; // Invincible during dash!

    const pPos = this.player.group.position;
    const playerX = pPos.x;
    const playerY = this.player.positionY;
    const playerZ = pPos.z;

    for (let i = 0; i < this.track.obstacles.length; i++) {
      const obs = this.track.obstacles[i];
      const obsPos = obs.position;
      const type = obs.userData.type;

      // Z distance check
      if (Math.abs(obsPos.z - playerZ) < 0.6) {
        // X lane distance check
        if (Math.abs(obsPos.x - playerX) < 1.0) {
          
          let collided = false;
          if (type === 'jump_over' && playerY < 0.7) {
            collided = true; // Didn't jump high enough!
          } else if (type === 'slide_under' && (!this.player.isSliding || playerY > 0.4)) {
            collided = true; // Didn't slide under!
          } else if (type === 'full') {
            collided = true; // Hit wall directly!
          }

          if (collided) {
            const status = this.player.hitObstacle();
            if (status === 'shield_saved') {
              audioSystem.playCrash();
              this.shakeIntensity = 0.5;
              this.chaser.creepCloser();
              setTimeout(() => this.chaser.retreat(), 3000);
            } else {
              this.gameOver(type === 'slide_under' ? 'Smashed into high barrier' : 'Crashed into temple obstacle');
            }
            break;
          }
        }
      }
    }
  }

  updateCamera(delta) {
    const targetZ = this.player.group.position.z - 6.5;
    const targetY = this.player.positionY + 3.5;

    // Smooth Camera Lag
    this.camera.position.z += (targetZ - this.camera.position.z) * 12 * delta;
    this.camera.position.y += (targetY - this.camera.position.y) * 8 * delta;
    this.camera.position.x += (this.player.group.position.x * 0.4 - this.camera.position.x) * 10 * delta;

    // Camera Shake Effect
    if (this.shakeIntensity > 0) {
      this.camera.position.x += (Math.random() - 0.5) * this.shakeIntensity;
      this.camera.position.y += (Math.random() - 0.5) * this.shakeIntensity;
      this.shakeIntensity -= 2.0 * delta;
    }

    // Dynamic FOV Speed Zoom
    const targetFOV = this.player.hasSpeedDash ? 80 : 65;
    this.camera.fov += (targetFOV - this.camera.fov) * 5 * delta;
    this.camera.updateProjectionMatrix();

    this.camera.lookAt(
      this.player.group.position.x * 0.5,
      this.player.positionY + 1.5,
      this.player.group.position.z + 5
    );
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}
