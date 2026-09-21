import * as THREE from 'three';

export class Chaser {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.distanceBehind = 6.5; // Default distance
    this.targetDistance = 6.5;
    this.animTime = 0;

    this.buildChaserMesh();
  }

  buildChaserMesh() {
    const obsidianMat = new THREE.MeshStandardMaterial({
      color: 0x050508,
      metalness: 0.9,
      roughness: 0.1
    });

    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xDAA520,
      metalness: 0.8,
      roughness: 0.3
    });

    const redGlowMat = new THREE.MeshBasicMaterial({
      color: 0xFF2200
    });

    // Body
    const bodyGeo = new THREE.BoxGeometry(1.2, 1.4, 0.8);
    this.body = new THREE.Mesh(bodyGeo, obsidianMat);
    this.body.position.y = 1.2;
    this.group.add(this.body);

    // Spikes on back
    for (let i = 0; i < 4; i++) {
      const spikeGeo = new THREE.ConeGeometry(0.15, 0.6, 4);
      const spike = new THREE.Mesh(spikeGeo, goldMat);
      spike.position.set(0, 1.6 + i * 0.15, -0.4 - i * 0.15);
      spike.rotation.x = -Math.PI * 0.3;
      this.group.add(spike);
    }

    // Demon Head
    const headGeo = new THREE.BoxGeometry(0.8, 0.7, 0.7);
    const head = new THREE.Mesh(headGeo, obsidianMat);
    head.position.set(0, 2.0, 0.3);
    this.group.add(head);

    // Horns
    const hornGeo = new THREE.ConeGeometry(0.12, 0.7, 5);
    const leftHorn = new THREE.Mesh(hornGeo, goldMat);
    leftHorn.position.set(-0.35, 2.4, 0.3);
    leftHorn.rotation.z = 0.3;
    const rightHorn = new THREE.Mesh(hornGeo, goldMat);
    rightHorn.position.set(0.35, 2.4, 0.3);
    rightHorn.rotation.z = -0.3;
    this.group.add(leftHorn);
    this.group.add(rightHorn);

    // Fiery Red Eyes
    const eyeGeo = new THREE.SphereGeometry(0.1, 8, 8);
    const leftEye = new THREE.Mesh(eyeGeo, redGlowMat);
    leftEye.position.set(-0.2, 2.05, 0.66);
    const rightEye = new THREE.Mesh(eyeGeo, redGlowMat);
    rightEye.position.set(0.2, 2.05, 0.66);
    this.group.add(leftEye);
    this.group.add(rightEye);

    // Arms & Claws
    const armGeo = new THREE.BoxGeometry(0.3, 1.1, 0.3);
    this.leftArm = new THREE.Mesh(armGeo, obsidianMat);
    this.leftArm.position.set(-0.8, 1.1, 0.2);
    this.rightArm = new THREE.Mesh(armGeo, obsidianMat);
    this.rightArm.position.set(0.8, 1.1, 0.2);
    this.group.add(this.leftArm);
    this.group.add(this.rightArm);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.35, 1.0, 0.35);
    this.leftLeg = new THREE.Mesh(legGeo, obsidianMat);
    this.leftLeg.position.set(-0.35, 0.5, 0);
    this.rightLeg = new THREE.Mesh(legGeo, obsidianMat);
    this.rightLeg.position.set(0.35, 0.5, 0);
    this.group.add(this.leftLeg);
    this.group.add(this.rightLeg);
  }

  creepCloser() {
    this.targetDistance = 2.8; // Move right behind player on stumble
  }

  retreat() {
    this.targetDistance = 6.5; // Normal distance
  }

  update(delta, playerPos, gameSpeed) {
    this.animTime += delta * (gameSpeed / 12) * 14;

    // Smoothly interpolate distance behind player
    this.distanceBehind += (this.targetDistance - this.distanceBehind) * 3 * delta;

    this.group.position.x += (playerPos.x - this.group.position.x) * 6 * delta;
    this.group.position.z = playerPos.z - this.distanceBehind;
    this.group.position.y = playerPos.y;

    // Running animation
    const angle = Math.sin(this.animTime) * 0.8;
    this.leftLeg.rotation.x = angle;
    this.rightLeg.rotation.x = -angle;
    this.leftArm.rotation.x = -angle * 0.9;
    this.rightArm.rotation.x = angle * 0.9;
  }

  reset() {
    this.distanceBehind = 6.5;
    this.targetDistance = 6.5;
    this.group.position.set(0, 0, -6.5);
  }
}
