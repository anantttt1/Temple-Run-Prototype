import * as THREE from 'three';
import { shopManager } from './Shop.js';

export class PlayerController {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.scene.add(this.group);

    // Gameplay Parameters
    this.laneWidth = 2.4;
    this.currentLane = 0; // -1: Left, 0: Center, 1: Right
    this.targetX = 0;
    
    // Physics & State
    this.positionY = 0;
    this.velocityY = 0;
    this.gravity = -28;
    this.jumpForce = 9.5;
    
    this.isJumping = false;
    this.isSliding = false;
    this.slideTimer = 0;
    this.slideDuration = 0.75;
    
    this.rotationY = 0; // 0, PI/2, PI, -PI/2
    this.targetRotationY = 0;
    
    // Active Powerups
    this.hasShield = false;
    this.hasMagnet = false;
    this.hasSpeedDash = false;
    this.hasDoubleCoins = false;

    this.powerupTimers = {
      shield: 0,
      magnet: 0,
      speedDash: 0,
      doubleCoins: 0
    };

    // Build Procedural 3D Character Mesh
    this.buildCharacterMesh();
  }

  buildCharacterMesh() {
    // Clear previous mesh if any
    while(this.group.children.length > 0) {
      const obj = this.group.children[0];
      this.group.remove(obj);
    }

    const skinId = shopManager.data.selectedSkin;
    const skinDef = shopManager.skinsData.find(s => s.id === skinId) || shopManager.skinsData[0];
    const themeColor = new THREE.Color(skinDef.color);

    // Materials
    const goldMat = new THREE.MeshStandardMaterial({
      color: themeColor,
      metalness: 0.85,
      roughness: 0.2,
      emissive: themeColor,
      emissiveIntensity: 0.2
    });

    const obsidianMat = new THREE.MeshStandardMaterial({
      color: 0x111118,
      metalness: 0.9,
      roughness: 0.1
    });

    const glowMat = new THREE.MeshBasicMaterial({
      color: themeColor
    });

    // Character Container
    this.characterGroup = new THREE.Group();
    this.group.add(this.characterGroup);

    // Torso
    const torsoGeo = new THREE.BoxGeometry(0.7, 1.0, 0.4);
    this.torso = new THREE.Mesh(torsoGeo, goldMat);
    this.torso.position.y = 1.0;
    this.torso.castShadow = true;
    this.characterGroup.add(this.torso);

    // Chest Emblem / Idol Rune
    const emblemGeo = new THREE.OctahedronGeometry(0.2);
    const emblem = new THREE.Mesh(emblemGeo, glowMat);
    emblem.position.set(0, 1.1, 0.22);
    this.characterGroup.add(emblem);

    // Head
    const headGeo = new THREE.SphereGeometry(0.3, 12, 12);
    this.head = new THREE.Mesh(headGeo, obsidianMat);
    this.head.position.y = 1.7;
    this.head.castShadow = true;
    this.characterGroup.add(this.head);

    // Golden Crown / Helmet
    const crownGeo = new THREE.ConeGeometry(0.32, 0.4, 6);
    const crown = new THREE.Mesh(crownGeo, goldMat);
    crown.position.set(0, 2.0, 0);
    this.characterGroup.add(crown);

    // Glowing Eyes
    const eyeGeo = new THREE.BoxGeometry(0.08, 0.04, 0.08);
    const leftEye = new THREE.Mesh(eyeGeo, glowMat);
    leftEye.position.set(-0.1, 1.72, 0.26);
    const rightEye = new THREE.Mesh(eyeGeo, glowMat);
    rightEye.position.set(0.1, 1.72, 0.26);
    this.characterGroup.add(leftEye);
    this.characterGroup.add(rightEye);

    // Arms
    const armGeo = new THREE.BoxGeometry(0.2, 0.8, 0.2);
    this.leftArm = new THREE.Mesh(armGeo, obsidianMat);
    this.leftArm.position.set(-0.5, 1.0, 0);
    this.leftArm.castShadow = true;
    this.rightArm = new THREE.Mesh(armGeo, obsidianMat);
    this.rightArm.position.set(0.5, 1.0, 0);
    this.rightArm.castShadow = true;
    this.characterGroup.add(this.leftArm);
    this.characterGroup.add(this.rightArm);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.24, 0.9, 0.24);
    this.leftLeg = new THREE.Mesh(legGeo, goldMat);
    this.leftLeg.position.set(-0.2, 0.45, 0);
    this.leftLeg.castShadow = true;
    this.rightLeg = new THREE.Mesh(legGeo, goldMat);
    this.rightLeg.position.set(0.2, 0.45, 0);
    this.rightLeg.castShadow = true;
    this.characterGroup.add(this.leftLeg);
    this.characterGroup.add(this.rightLeg);

    // Golden Shield Aura Mesh
    const shieldGeo = new THREE.SphereGeometry(1.4, 16, 16);
    const shieldMat = new THREE.MeshPhysicalMaterial({
      color: 0xFFD700,
      transmission: 0.6,
      opacity: 0.7,
      transparent: true,
      roughness: 0.1,
      ior: 1.4,
      emissive: 0xFFD700,
      emissiveIntensity: 0.5
    });
    this.shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    this.shieldMesh.position.y = 1.0;
    this.shieldMesh.visible = false;
    this.group.add(this.shieldMesh);

    this.animTime = 0;
  }

  jump() {
    if (!this.isJumping && !this.isSliding) {
      this.isJumping = true;
      this.velocityY = this.jumpForce;
      return true;
    }
    return false;
  }

  slide() {
    if (!this.isSliding) {
      this.isSliding = true;
      this.slideTimer = this.slideDuration;
      if (this.isJumping) {
        // Fast drop if in mid-air
        this.velocityY = -this.jumpForce * 1.5;
      }
      return true;
    }
    return false;
  }

  moveLeft() {
    if (this.currentLane > -1) {
      this.currentLane--;
      this.targetX = -this.currentLane * this.laneWidth;
      return true;
    }
    return false;
  }

  moveRight() {
    if (this.currentLane < 1) {
      this.currentLane++;
      this.targetX = -this.currentLane * this.laneWidth;
      return true;
    }
    return false;
  }

  activatePowerup(type, duration) {
    this.powerupTimers[type] = duration;
    if (type === 'shield') {
      this.hasShield = true;
      this.shieldMesh.visible = true;
    } else if (type === 'magnet') {
      this.hasMagnet = true;
    } else if (type === 'speedDash') {
      this.hasSpeedDash = true;
    } else if (type === 'doubleCoins') {
      this.hasDoubleCoins = true;
    }
  }

  update(delta, gameSpeed) {
    this.animTime += delta * (gameSpeed / 12) * 12;

    // Update Powerup Timers
    Object.keys(this.powerupTimers).forEach(key => {
      if (this.powerupTimers[key] > 0) {
        this.powerupTimers[key] -= delta;
        if (this.powerupTimers[key] <= 0) {
          this.powerupTimers[key] = 0;
          if (key === 'shield') {
            this.hasShield = false;
            this.shieldMesh.visible = false;
          } else if (key === 'magnet') {
            this.hasMagnet = false;
          } else if (key === 'speedDash') {
            this.hasSpeedDash = false;
          } else if (key === 'doubleCoins') {
            this.hasDoubleCoins = false;
          }
        }
      }
    });

    // Smooth Lane Interpolation
    const currentX = this.group.position.x;
    this.group.position.x += (this.targetX - currentX) * 14 * delta;

    // Jump Gravity Physics
    if (this.isJumping || this.positionY > 0) {
      this.positionY += this.velocityY * delta;
      this.velocityY += this.gravity * delta;

      if (this.positionY <= 0) {
        this.positionY = 0;
        this.velocityY = 0;
        this.isJumping = false;
      }
    }

    // Slide Timer
    if (this.isSliding) {
      this.slideTimer -= delta;
      if (this.slideTimer <= 0) {
        this.isSliding = false;
      }
    }

    // Apply Position & Animations
    this.group.position.y = this.positionY;

    if (this.isSliding) {
      // Slide scale & rotation
      this.characterGroup.scale.set(1.0, 0.45, 1.0);
      this.characterGroup.rotation.x = -Math.PI * 0.35;
    } else {
      this.characterGroup.scale.set(1.0, 1.0, 1.0);
      this.characterGroup.rotation.x = 0;

      // Running Limb Animation
      const limbAngle = Math.sin(this.animTime) * 0.7;
      this.leftLeg.rotation.x = limbAngle;
      this.rightLeg.rotation.x = -limbAngle;
      this.leftArm.rotation.x = -limbAngle * 0.8;
      this.rightArm.rotation.x = limbAngle * 0.8;
    }

    // Pulse Shield if active
    if (this.hasShield) {
      const pulse = 1.0 + Math.sin(this.animTime * 3) * 0.05;
      this.shieldMesh.scale.set(pulse, pulse, pulse);
    }
  }

  hitObstacle() {
    if (this.hasShield) {
      this.hasShield = false;
      this.powerupTimers.shield = 0;
      this.shieldMesh.visible = false;
      return 'shield_saved'; // Blocked by shield!
    }
    return 'dead';
  }

  reset() {
    this.currentLane = 0;
    this.targetX = 0;
    this.group.position.set(0, 0, 0);
    this.positionY = 0;
    this.velocityY = 0;
    this.isJumping = false;
    this.isSliding = false;
    this.hasShield = false;
    this.hasMagnet = false;
    this.hasSpeedDash = false;
    this.hasDoubleCoins = false;
    this.shieldMesh.visible = false;
    
    Object.keys(this.powerupTimers).forEach(k => this.powerupTimers[k] = 0);
  }
}