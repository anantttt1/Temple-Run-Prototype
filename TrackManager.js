import * as THREE from 'three';

export class TrackManager {
  constructor(scene) {
    this.scene = scene;

    this.segmentLength = 12; // Length of each track piece
    this.activeSegments = [];
    this.maxSegments = 16;
    this.currentZ = 0;

    this.coins = [];
    this.obstacles = [];
    this.powerups = [];
    this.decorations = [];

    // Shared Geometries & Materials
    this.initSharedAssets();
  }

  initSharedAssets() {
    // Road Material (Polished Obsidian Black Marble)
    this.roadMat = new THREE.MeshStandardMaterial({
      color: 0x0C0C14,
      metalness: 0.9,
      roughness: 0.15
    });

    // Gold Trim Material
    this.goldMat = new THREE.MeshStandardMaterial({
      color: 0xFFD700,
      metalness: 0.85,
      roughness: 0.2,
      emissive: 0xFFD700,
      emissiveIntensity: 0.25
    });

    // Wall Material
    this.wallMat = new THREE.MeshStandardMaterial({
      color: 0x161622,
      metalness: 0.5,
      roughness: 0.5
    });

    // High-contrast hazard materials keep obstacles readable against the dark track.
    this.hurdleMat = new THREE.MeshStandardMaterial({
      color: 0xFF7A00,
      metalness: 0.35,
      roughness: 0.32,
      emissive: 0x7A2100,
      emissiveIntensity: 0.8
    });
    this.barrierMat = new THREE.MeshStandardMaterial({
      color: 0x00D9FF,
      metalness: 0.35,
      roughness: 0.28,
      emissive: 0x006B80,
      emissiveIntensity: 0.9
    });
    this.pillarMat = new THREE.MeshStandardMaterial({
      color: 0xFF2851,
      metalness: 0.3,
      roughness: 0.3,
      emissive: 0x750018,
      emissiveIntensity: 0.85
    });
    this.obstacleEdgeMat = new THREE.LineBasicMaterial({
      color: 0xFFF4B0,
      transparent: true,
      opacity: 0.95
    });

    // Coin Mesh Template
    const coinGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.08, 16);
    coinGeo.rotateX(Math.PI / 2);
    this.coinMeshTemplate = new THREE.Mesh(coinGeo, this.goldMat);

    // Powerup Orbs Geometry
    this.powerupGeo = new THREE.SphereGeometry(0.45, 16, 16);
  }

  // Create single track segment at Z position
  createSegment(zPos, segmentType = 'straight') {
    const segment = new THREE.Group();
    segment.position.z = zPos;

    // Main Road (Width: 8 units for 3 lanes)
    const roadGeo = new THREE.BoxGeometry(8, 0.4, this.segmentLength);
    const road = new THREE.Mesh(roadGeo, this.roadMat);
    road.position.y = -0.2;
    road.receiveShadow = true;
    segment.add(road);

    // Left Gold Trim Rail
    const railGeo = new THREE.BoxGeometry(0.3, 0.5, this.segmentLength);
    const leftRail = new THREE.Mesh(railGeo, this.goldMat);
    leftRail.position.set(-4, 0.05, 0);
    segment.add(leftRail);

    // Right Gold Trim Rail
    const rightRail = new THREE.Mesh(railGeo, this.goldMat);
    rightRail.position.set(4, 0.05, 0);
    segment.add(rightRail);

    // Decorative Side Statues / Torches
    if (Math.random() < 0.4) {
      this.addTorches(segment);
    }

    // Temple Archways
    if (Math.random() < 0.25) {
      this.addTempleArch(segment);
    }

    // Spawn Obstacles & Items (Skip first 2 segments for smooth start)
    if (zPos > 24) {
      this.spawnSegmentItems(segment, zPos);
    }

    this.scene.add(segment);
    this.activeSegments.push(segment);
  }

  addTorches(segment) {
    const torchGeo = new THREE.CylinderGeometry(0.2, 0.25, 2.0, 8);
    const fireGeo = new THREE.SphereGeometry(0.25, 8, 8);
    const fireMat = new THREE.MeshBasicMaterial({ color: 0xFF6600 });

    [-4.3, 4.3].forEach(x => {
      const pillar = new THREE.Mesh(torchGeo, this.goldMat);
      pillar.position.set(x, 1.0, 0);
      const fire = new THREE.Mesh(fireGeo, fireMat);
      fire.position.set(x, 2.1, 0);
      
      const light = new THREE.PointLight(0xFF8800, 1.5, 8);
      light.position.set(x, 2.1, 0);
      
      segment.add(pillar);
      segment.add(fire);
      segment.add(light);
    });
  }

  addTempleArch(segment) {
    const archGroup = new THREE.Group();
    
    // Pillar Left & Right
    const pillarGeo = new THREE.BoxGeometry(0.8, 4.5, 0.8);
    const pLeft = new THREE.Mesh(pillarGeo, this.wallMat);
    pLeft.position.set(-4.2, 2.25, 0);
    const pRight = new THREE.Mesh(pillarGeo, this.wallMat);
    pRight.position.set(4.2, 2.25, 0);

    // Top Beam
    const beamGeo = new THREE.BoxGeometry(9.6, 0.8, 1.0);
    const beam = new THREE.Mesh(beamGeo, this.goldMat);
    beam.position.set(0, 4.4, 0);

    archGroup.add(pLeft);
    archGroup.add(pRight);
    archGroup.add(beam);

    segment.add(archGroup);
  }

  spawnSegmentItems(segment, zPos) {
    const laneX = [-2.4, 0, 2.4];
    const rand = Math.random();

    if (rand < 0.5) {
      // Spawn Obstacle
      const obsType = Math.floor(Math.random() * 3);
      const laneIndex = Math.floor(Math.random() * 3);
      const targetX = laneX[laneIndex];

      let obsMesh;
      if (obsType === 0) {
        // Low Hurdle (Jump over)
        const geo = new THREE.BoxGeometry(2.2, 0.7, 0.4);
        obsMesh = new THREE.Mesh(geo, this.hurdleMat);
        obsMesh.position.set(targetX, 0.35, 0);
        obsMesh.userData = { type: 'jump_over', height: 0.7 };
      } else if (obsType === 1) {
        // High Barrier (Slide under)
        const geo = new THREE.BoxGeometry(2.2, 1.2, 0.4);
        obsMesh = new THREE.Mesh(geo, this.barrierMat);
        obsMesh.position.set(targetX, 1.9, 0);
        obsMesh.userData = { type: 'slide_under', height: 1.2 };
      } else {
        // Full Pillar Obstacle (Change lane)
        const geo = new THREE.BoxGeometry(2.2, 2.5, 0.6);
        obsMesh = new THREE.Mesh(geo, this.pillarMat);
        obsMesh.position.set(targetX, 1.25, 0);
        obsMesh.userData = { type: 'full', height: 2.5 };
      }

      obsMesh.castShadow = true;
      obsMesh.receiveShadow = true;
      const edgeLines = new THREE.LineSegments(
        new THREE.EdgesGeometry(obsMesh.geometry),
        this.obstacleEdgeMat
      );
      edgeLines.scale.setScalar(1.02);
      obsMesh.add(edgeLines);

      obsMesh.position.z = zPos;
      this.scene.add(obsMesh);
      this.obstacles.push(obsMesh);
    }

    // Spawn Coins Line in open lanes
    const coinLaneIndex = Math.floor(Math.random() * 3);
    const coinX = laneX[coinLaneIndex];
    const coinCount = 5;

    for (let i = 0; i < coinCount; i++) {
      const coin = this.coinMeshTemplate.clone();
      const zOffset = -this.segmentLength / 2 + (i * 2.2);
      coin.position.set(coinX, 0.7, zPos + zOffset);
      this.scene.add(coin);
      this.coins.push(coin);
    }

    // Rare Powerup Spawn
    if (Math.random() < 0.15) {
      const types = ['magnet', 'shield', 'speedDash', 'doubleCoins'];
      const pType = types[Math.floor(Math.random() * types.length)];
      
      let pMat;
      if (pType === 'magnet') pMat = new THREE.MeshBasicMaterial({ color: 0x00F0FF });
      else if (pType === 'shield') pMat = new THREE.MeshBasicMaterial({ color: 0xFFD700 });
      else if (pType === 'speedDash') pMat = new THREE.MeshBasicMaterial({ color: 0xFF0055 });
      else pMat = new THREE.MeshBasicMaterial({ color: 0x9900FF });

      const pOrb = new THREE.Mesh(this.powerupGeo, pMat);
      const pLane = laneX[Math.floor(Math.random() * 3)];
      pOrb.position.set(pLane, 1.2, zPos);
      pOrb.userData = { type: pType };

      this.scene.add(pOrb);
      this.powerups.push(pOrb);
    }
  }

  update(delta, playerPos, playerController) {
    // Generate new track ahead as player advances
    while (this.currentZ < playerPos.z + (this.maxSegments * this.segmentLength)) {
      this.createSegment(this.currentZ);
      this.currentZ += this.segmentLength;
    }

    // Remove old segments far behind player
    for (let i = this.activeSegments.length - 1; i >= 0; i--) {
      const seg = this.activeSegments[i];
      if (seg.position.z < playerPos.z - 20) {
        this.scene.remove(seg);
        this.activeSegments.splice(i, 1);
      }
    }

    // Spin Coins & Magnet Attraction
    for (let i = this.coins.length - 1; i >= 0; i--) {
      const coin = this.coins[i];
      coin.rotation.y += 3 * delta;

      // Magnet power-up effect
      if (playerController.hasMagnet) {
        const dist = coin.position.distanceTo(playerPos);
        if (dist < 10) {
          coin.position.lerp(playerPos, 12 * delta);
        }
      }

      // Cleanup coins far behind
      if (coin.position.z < playerPos.z - 15) {
        this.scene.remove(coin);
        this.coins.splice(i, 1);
      }
    }

    // Spin Powerup Orbs
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const orb = this.powerups[i];
      orb.rotation.y += 2 * delta;
      orb.position.y = 1.2 + Math.sin(Date.now() * 0.005) * 0.15;

      if (orb.position.z < playerPos.z - 15) {
        this.scene.remove(orb);
        this.powerups.splice(i, 1);
      }
    }

    // Cleanup obstacles behind
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      if (obs.position.z < playerPos.z - 15) {
        this.scene.remove(obs);
        this.obstacles.splice(i, 1);
      }
    }
  }

  reset() {
    // Clear all segments, coins, obstacles, powerups
    this.activeSegments.forEach(s => this.scene.remove(s));
    this.coins.forEach(c => this.scene.remove(c));
    this.obstacles.forEach(o => this.scene.remove(o));
    this.powerups.forEach(p => this.scene.remove(p));

    this.activeSegments = [];
    this.coins = [];
    this.obstacles = [];
    this.powerups = [];
    this.currentZ = 0;

    // Re-initialize first segments
    for (let i = 0; i < 8; i++) {
      this.createSegment(this.currentZ);
      this.currentZ += this.segmentLength;
    }
  }
}
