import * as THREE from 'three';

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
    
    // Create shared particle geometries and materials
    this.sparkGeo = new THREE.BufferGeometry();
    const sparkPositions = new Float32Array(300 * 3);
    this.sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));

    // Particle texture generation (glowing circle canvas texture)
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, '#FFFFFF');
    grad.addColorStop(0.4, '#FFD700');
    grad.addColorStop(1, 'rgba(255, 215, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);
    
    const texture = new THREE.CanvasTexture(canvas);

    this.goldParticleMat = new THREE.PointsMaterial({
      size: 0.4,
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
  }

  // Create Coin Burst at position
  spawnCoinBurst(pos) {
    const count = 16;
    const group = new THREE.Group();
    group.position.copy(pos);

    for (let i = 0; i < count; i++) {
      const pMat = this.goldParticleMat.clone();
      const pGeo = new THREE.SphereGeometry(0.08, 6, 6);
      const mesh = new THREE.Mesh(pGeo, pMat);
      
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 6,
        Math.random() * 5 + 2,
        (Math.random() - 0.5) * 6
      );

      group.add(mesh);
      this.particles.push({
        mesh: mesh,
        parent: group,
        velocity: velocity,
        life: 1.0,
        decay: Math.random() * 1.5 + 1.2
      });
    }

    this.scene.add(group);
  }

  // Create Speed Trail Dust
  spawnSpeedDust(pos) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 6, 6),
      this.goldParticleMat.clone()
    );
    mesh.position.copy(pos);
    mesh.position.y += 0.2;
    mesh.position.x += (Math.random() - 0.5) * 0.8;

    this.scene.add(mesh);
    this.particles.push({
      mesh: mesh,
      parent: this.scene,
      velocity: new THREE.Vector3(0, Math.random() * 0.5, -1),
      life: 0.6,
      decay: 2.0
    });
  }

  update(delta) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= p.decay * delta;

      if (p.life <= 0) {
        if (p.parent) p.parent.remove(p.mesh);
        p.mesh.geometry.dispose();
        if (p.mesh.material.map) p.mesh.material.map.dispose();
        p.mesh.material.dispose();
        this.particles.splice(i, 1);
      } else {
        p.mesh.position.addScaledVector(p.velocity, delta);
        p.mesh.material.opacity = p.life;
        p.mesh.scale.setScalar(p.life);
      }
    }
  }
}
