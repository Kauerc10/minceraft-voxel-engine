// High-Detail 6-Face Pixel-Art Textured 3D Mobs (Zombie, Skeleton, Creeper, Cow, Pig, Sheep) & Live 3D Inventory Player Preview
import * as THREE from 'three';
import { BLOCK, ITEMS } from './items.js';
import { createBoxPixelMaterials, create3DItemMesh } from './textures.js';
import { sound } from './audio.js';

function makePixelBox(w, h, d, baseHex, variance, seed, facePainters = {}, yOffset = 0) {
  const geo = new THREE.BoxGeometry(w, h, d);
  if (yOffset !== 0) geo.translate(0, yOffset, 0);
  const mats = createBoxPixelMaterials(baseHex, variance, seed, facePainters);
  return new THREE.Mesh(geo, mats);
}

export class MobEntity {
  constructor(type, x, y, z, atlasTexture = null, atlasCanvas = null) {
    this.type = type;
    this.atlasTexture = atlasTexture;
    this.atlasCanvas = atlasCanvas;
    this.pos = new THREE.Vector3(x, y, z);
    this.vel = new THREE.Vector3(0, 0, 0);
    this.yaw = Math.random() * Math.PI * 2;
    this.targetYaw = this.yaw;

    this.hostile = type === 'zombie' || type === 'skeleton' || type === 'creeper';
    this.maxHp = this.hostile ? 20 : 10;
    this.hp = this.maxHp;
    this.dead = false;
    this.deathTimer = 0;
    this.hurtTimer = 0;
    this.attackCooldown = 0;
    this.creeperFuse = 0;
    this.aiTimer = 0;
    this.moveSpeed = this.hostile ? 2.5 : 1.5;
    this.walkPhase = Math.random() * 10;
    this.onGround = false;

    this.group = new THREE.Group();
    this.limbs = {};
    this.materials = [];
    this.buildModel();
    this.group.position.copy(this.pos);
  }

  registerMesh(mesh, parent = this.group) {
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const m of mats) {
      this.materials.push({ mat: m, origColor: m.color.getHex() });
    }
    parent.add(mesh);
    return mesh;
  }

  buildModel() {
    if (this.type === 'zombie') {
      // Zombie Head with 8x8 Pixel Face
      this.limbs.head = this.registerMesh(
        makePixelBox(0.5, 0.5, 0.5, '#4b7a38', 22, 101, {
          front: (ctx) => {
            // Forehead hair/shadow
            ctx.fillStyle = '#2e5220';
            ctx.fillRect(0, 0, 8, 2);
            // Hollow Zombie Eyes
            ctx.fillStyle = '#111a0d';
            ctx.fillRect(1, 3, 2, 1);
            ctx.fillRect(5, 3, 2, 1);
            // Darker nose & mouth
            ctx.fillStyle = '#2d4d20';
            ctx.fillRect(3, 4, 2, 1);
            ctx.fillStyle = '#1f3616';
            ctx.fillRect(2, 6, 4, 1);
          },
          top: (ctx) => {
            ctx.fillStyle = '#335924';
            ctx.fillRect(0, 0, 8, 8);
          }
        }, 0.25)
      );
      this.limbs.head.position.set(0, 1.38, 0);

      // Torn Cyan Tunic Body
      this.limbs.body = this.registerMesh(
        makePixelBox(0.5, 0.72, 0.26, '#288585', 20, 102, {
          front: (ctx) => {
            ctx.fillStyle = '#3b662b';
            ctx.fillRect(2, 0, 4, 1); // Neck skin
            ctx.fillStyle = '#1a5c5c';
            ctx.fillRect(1, 5, 2, 3);
            ctx.fillRect(5, 6, 2, 2);
          }
        })
      );
      this.limbs.body.position.set(0, 1.02, 0);

      // Outstretched Green Zombie Arms with Cyan Sleeves
      const armPainter = {
        top: (ctx) => { ctx.fillStyle = '#288585'; ctx.fillRect(0, 0, 8, 8); },
        front: (ctx) => { ctx.fillStyle = '#288585'; ctx.fillRect(0, 0, 8, 3); },
        right: (ctx) => { ctx.fillStyle = '#288585'; ctx.fillRect(0, 0, 8, 3); },
        left: (ctx) => { ctx.fillStyle = '#288585'; ctx.fillRect(0, 0, 8, 3); },
      };
      this.limbs.armL = this.registerMesh(makePixelBox(0.24, 0.7, 0.24, '#4b7a38', 18, 103, armPainter, -0.28));
      this.limbs.armL.position.set(-0.37, 1.32, 0);
      this.limbs.armL.rotation.x = -Math.PI / 2.1;

      this.limbs.armR = this.registerMesh(makePixelBox(0.24, 0.7, 0.24, '#4b7a38', 18, 104, armPainter, -0.28));
      this.limbs.armR.position.set(0.37, 1.32, 0);
      this.limbs.armR.rotation.x = -Math.PI / 2.1;

      // Indigo Pants + Shoes
      const legPainter = {
        front: (ctx) => { ctx.fillStyle = '#474747'; ctx.fillRect(0, 6, 8, 2); },
      };
      this.limbs.legL = this.registerMesh(makePixelBox(0.24, 0.66, 0.24, '#362e75', 18, 105, legPainter, -0.33));
      this.limbs.legL.position.set(-0.13, 0.66, 0);
      this.limbs.legR = this.registerMesh(makePixelBox(0.24, 0.66, 0.24, '#362e75', 18, 106, legPainter, -0.33));
      this.limbs.legR.position.set(0.13, 0.66, 0);

    } else if (this.type === 'skeleton') {
      // Detailed 8x8 Pixel Skull
      this.limbs.head = this.registerMesh(
        makePixelBox(0.5, 0.5, 0.5, '#d6d6d6', 16, 201, {
          front: (ctx) => {
            ctx.fillStyle = '#222222';
            ctx.fillRect(1, 3, 2, 2); // Left eye socket
            ctx.fillRect(5, 3, 2, 2); // Right eye socket
            ctx.fillStyle = '#383838';
            ctx.fillRect(3, 5, 2, 1); // Nasal cavity
            ctx.fillStyle = '#1c1c1c';
            ctx.fillRect(1, 6, 6, 1); // Mouth line
            ctx.fillStyle = '#b0b0b0';
            ctx.fillRect(2, 6, 1, 1);
            ctx.fillRect(4, 6, 1, 1);
          }
        }, 0.25)
      );
      this.limbs.head.position.set(0, 1.38, 0);

      // Ribcage Body
      this.limbs.body = this.registerMesh(
        makePixelBox(0.46, 0.7, 0.24, '#cfcfcf', 14, 202, {
          front: (ctx) => {
            ctx.fillStyle = '#262626';
            for (let y = 1; y <= 5; y += 2) {
              ctx.fillRect(1, y, 2, 1);
              ctx.fillRect(5, y, 2, 1);
            }
            ctx.fillRect(2, 6, 4, 1);
          },
          back: (ctx) => {
            ctx.fillStyle = '#333333';
            for (let y = 1; y <= 6; y += 2) {
              ctx.fillRect(1, y, 2, 1);
              ctx.fillRect(5, y, 2, 1);
            }
          }
        })
      );
      this.limbs.body.position.set(0, 1.02, 0);

      // Thin Bone Arms + 3D Extruded Bow in Right Hand!
      this.limbs.armL = this.registerMesh(makePixelBox(0.13, 0.7, 0.13, '#d4d4d4', 12, 203, {}, -0.3));
      this.limbs.armL.position.set(-0.32, 1.32, 0);
      this.limbs.armL.rotation.x = -Math.PI / 2.4;

      this.limbs.armR = this.registerMesh(makePixelBox(0.13, 0.7, 0.13, '#d4d4d4', 12, 204, {}, -0.3));
      this.limbs.armR.position.set(0.32, 1.32, 0);
      this.limbs.armR.rotation.x = -Math.PI / 2.3;

      const bowMesh = create3DItemMesh(ITEMS.bow, this.atlasTexture, this.atlasCanvas);
      if (bowMesh) {
        bowMesh.position.set(0, -0.52, 0.14);
        bowMesh.rotation.y = Math.PI / 2;
        this.limbs.armR.add(bowMesh);
      }

      this.limbs.legL = this.registerMesh(makePixelBox(0.13, 0.66, 0.13, '#cccccc', 12, 205, {}, -0.33));
      this.limbs.legL.position.set(-0.13, 0.66, 0);
      this.limbs.legR = this.registerMesh(makePixelBox(0.13, 0.66, 0.13, '#cccccc', 12, 206, {}, -0.33));
      this.limbs.legR.position.set(0.13, 0.66, 0);

    } else if (this.type === 'creeper') {
      // Iconic Speckled Green Creeper Head & Face
      this.limbs.head = this.registerMesh(
        makePixelBox(0.5, 0.5, 0.5, '#50b53f', 36, 301, {
          front: (ctx) => {
            ctx.fillStyle = '#0d0d0d';
            ctx.fillRect(1, 2, 2, 2); // Left eye
            ctx.fillRect(5, 2, 2, 2); // Right eye
            ctx.fillRect(3, 4, 2, 3); // Nose & center mouth
            ctx.fillRect(2, 5, 1, 3); // Left mouth frown
            ctx.fillRect(5, 5, 1, 3); // Right mouth frown
          }
        }, 0.25)
      );
      this.limbs.head.position.set(0, 1.16, 0);

      this.limbs.body = this.registerMesh(makePixelBox(0.46, 0.76, 0.26, '#48a838', 36, 302));
      this.limbs.body.position.set(0, 0.78, 0);

      const footPainter = {
        front: (ctx) => {
          ctx.fillStyle = '#182b14';
          ctx.fillRect(1, 6, 2, 2);
          ctx.fillRect(5, 6, 2, 2);
        }
      };
      this.limbs.legL = this.registerMesh(makePixelBox(0.24, 0.4, 0.24, '#48a838', 34, 303, footPainter, -0.2));
      this.limbs.legL.position.set(-0.14, 0.4, 0.2);
      this.limbs.legR = this.registerMesh(makePixelBox(0.24, 0.4, 0.24, '#48a838', 34, 304, footPainter, -0.2));
      this.limbs.legR.position.set(0.14, 0.4, 0.2);
      this.limbs.armL = this.registerMesh(makePixelBox(0.24, 0.4, 0.24, '#48a838', 34, 305, footPainter, -0.2));
      this.limbs.armL.position.set(-0.14, 0.4, -0.2);
      this.limbs.armR = this.registerMesh(makePixelBox(0.24, 0.4, 0.24, '#48a838', 34, 306, footPainter, -0.2));
      this.limbs.armR.position.set(0.14, 0.4, -0.2);

    } else if (this.type === 'pig') {
      // Pink Pig with 3D Protruding Snout & Outward Eyes
      this.limbs.head = this.registerMesh(
        makePixelBox(0.48, 0.48, 0.48, '#f09bb2', 16, 401, {
          front: (ctx) => {
            // Eyes on outer edges
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(1, 3, 1, 1);
            ctx.fillRect(6, 3, 1, 1);
            ctx.fillStyle = '#111111';
            ctx.fillRect(0, 3, 1, 1);
            ctx.fillRect(7, 3, 1, 1);
          }
        })
      );
      this.limbs.head.position.set(0, 0.86, 0.56);

      // 3D Protruding Pig Snout!
      const snout = this.registerMesh(
        makePixelBox(0.24, 0.18, 0.1, '#ffadc2', 10, 402, {
          front: (ctx) => {
            ctx.fillStyle = '#6e283b';
            ctx.fillRect(1, 3, 2, 3);
            ctx.fillRect(5, 3, 2, 3);
          }
        }),
        this.limbs.head
      );
      snout.position.set(0, -0.07, 0.27);

      this.limbs.body = this.registerMesh(makePixelBox(0.62, 0.52, 0.94, '#eb94ab', 18, 403));
      this.limbs.body.position.set(0, 0.66, 0);

      const hoofPainter = {
        front: (ctx) => { ctx.fillStyle = '#a8596e'; ctx.fillRect(0, 6, 8, 2); }
      };
      this.limbs.legL = this.registerMesh(makePixelBox(0.22, 0.4, 0.22, '#eb94ab', 14, 404, hoofPainter, -0.2));
      this.limbs.legL.position.set(-0.18, 0.4, 0.32);
      this.limbs.legR = this.registerMesh(makePixelBox(0.22, 0.4, 0.22, '#eb94ab', 14, 405, hoofPainter, -0.2));
      this.limbs.legR.position.set(0.18, 0.4, 0.32);
      this.limbs.armL = this.registerMesh(makePixelBox(0.22, 0.4, 0.22, '#eb94ab', 14, 406, hoofPainter, -0.2));
      this.limbs.armL.position.set(-0.18, 0.4, -0.32);
      this.limbs.armR = this.registerMesh(makePixelBox(0.22, 0.4, 0.22, '#eb94ab', 14, 407, hoofPainter, -0.2));
      this.limbs.armR.position.set(0.18, 0.4, -0.32);

    } else if (this.type === 'cow') {
      // Brown & White Patched Dairy Cow with 3D Horns!
      this.limbs.head = this.registerMesh(
        makePixelBox(0.46, 0.46, 0.44, '#4d3624', 16, 501, {
          front: (ctx) => {
            ctx.fillStyle = '#e6e6e6';
            ctx.fillRect(3, 1, 2, 4); // White blaze
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(1, 3, 1, 1);
            ctx.fillRect(6, 3, 1, 1);
            ctx.fillStyle = '#111111';
            ctx.fillRect(0, 3, 1, 1);
            ctx.fillRect(7, 3, 1, 1);
            // Muzzle
            ctx.fillStyle = '#cfa893';
            ctx.fillRect(1, 5, 6, 3);
            ctx.fillStyle = '#331c12';
            ctx.fillRect(2, 6, 1, 1);
            ctx.fillRect(5, 6, 1, 1);
          }
        })
      );
      this.limbs.head.position.set(0, 0.98, 0.58);

      // 3D Horns on Left & Right of Head
      const hornL = this.registerMesh(makePixelBox(0.08, 0.18, 0.08, '#2b2623', 8, 502), this.limbs.head);
      hornL.position.set(-0.26, 0.18, -0.05);
      const hornR = this.registerMesh(makePixelBox(0.08, 0.18, 0.08, '#2b2623', 8, 503), this.limbs.head);
      hornR.position.set(0.26, 0.18, -0.05);

      const patchPainter = (ctx) => {
        ctx.fillStyle = '#dedede';
        ctx.fillRect(1, 1, 3, 3);
        ctx.fillRect(5, 4, 3, 3);
      };
      this.limbs.body = this.registerMesh(
        makePixelBox(0.68, 0.58, 0.98, '#4a3321', 18, 504, {
          top: patchPainter,
          right: patchPainter,
          left: patchPainter,
        })
      );
      this.limbs.body.position.set(0, 0.74, 0);

      this.limbs.legL = this.registerMesh(makePixelBox(0.22, 0.46, 0.22, '#4a3321', 14, 505, {}, -0.23));
      this.limbs.legL.position.set(-0.2, 0.46, 0.34);
      this.limbs.legR = this.registerMesh(makePixelBox(0.22, 0.46, 0.22, '#4a3321', 14, 506, {}, -0.23));
      this.limbs.legR.position.set(0.2, 0.46, 0.34);
      this.limbs.armL = this.registerMesh(makePixelBox(0.22, 0.46, 0.22, '#4a3321', 14, 507, {}, -0.23));
      this.limbs.armL.position.set(-0.2, 0.46, -0.34);
      this.limbs.armR = this.registerMesh(makePixelBox(0.22, 0.46, 0.22, '#4a3321', 14, 508, {}, -0.23));
      this.limbs.armR.position.set(0.2, 0.46, -0.34);

    } else {
      // Fluffy Sheep with Layered 3D Wool Coat + Derpy Eyes
      this.limbs.head = this.registerMesh(
        makePixelBox(0.44, 0.44, 0.48, '#e8e8e8', 18, 601, {
          front: (ctx) => {
            ctx.fillStyle = '#c9b39b';
            ctx.fillRect(1, 2, 6, 5);
            // Derpy sheep eyes
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(2, 3, 1, 1);
            ctx.fillRect(5, 3, 1, 1);
            ctx.fillStyle = '#111111';
            ctx.fillRect(1, 3, 1, 1);
            ctx.fillRect(6, 3, 1, 1);
            // Pink nose
            ctx.fillStyle = '#e08998';
            ctx.fillRect(3, 5, 2, 2);
          }
        })
      );
      this.limbs.head.position.set(0, 0.94, 0.56);

      // Thick Fluffy Wool Coat Body
      this.limbs.body = this.registerMesh(makePixelBox(0.72, 0.62, 1.02, '#efefef', 22, 602));
      this.limbs.body.position.set(0, 0.72, 0);

      const sheepLegPainter = {
        front: (ctx) => {
          ctx.fillStyle = '#c9b39b';
          ctx.fillRect(0, 4, 8, 4);
        }
      };
      this.limbs.legL = this.registerMesh(makePixelBox(0.22, 0.44, 0.22, '#efefef', 18, 603, sheepLegPainter, -0.22));
      this.limbs.legL.position.set(-0.2, 0.44, 0.32);
      this.limbs.legR = this.registerMesh(makePixelBox(0.22, 0.44, 0.22, '#efefef', 18, 604, sheepLegPainter, -0.22));
      this.limbs.legR.position.set(0.2, 0.44, 0.32);
      this.limbs.armL = this.registerMesh(makePixelBox(0.22, 0.44, 0.22, '#efefef', 18, 605, sheepLegPainter, -0.22));
      this.limbs.armL.position.set(-0.2, 0.44, -0.32);
      this.limbs.armR = this.registerMesh(makePixelBox(0.22, 0.44, 0.22, '#efefef', 18, 606, sheepLegPainter, -0.22));
      this.limbs.armR.position.set(0.2, 0.44, -0.32);
    }
  }

  damage(amount, knockbackDir, onDropCallback) {
    if (this.dead) return;
    this.hp -= amount;
    this.hurtTimer = 0.32;
    sound.hitMob();

    if (knockbackDir) {
      this.vel.x = knockbackDir.x * 6.5;
      this.vel.y = 4.6;
      this.vel.z = knockbackDir.z * 6.5;
    }

    if (!this.hostile) {
      this.moveSpeed = 3.8;
      this.aiTimer = 2.5;
      this.targetYaw = Math.atan2(knockbackDir?.x || 1, knockbackDir?.z || 1);
    }

    if (this.hp <= 0) {
      this.dead = true;
      this.deathTimer = 0.45;
      if (onDropCallback) {
        onDropCallback(this);
      }
    }
  }

  update(dt, world, playerPos, onPlayerDamage, onShootArrow, onExplode) {
    if (this.dead) {
      this.deathTimer -= dt;
      this.group.rotation.z = Math.min(Math.PI / 2, (0.45 - this.deathTimer) * 4);
      return this.deathTimer <= 0;
    }

    if (this.hurtTimer > 0) {
      this.hurtTimer -= dt;
      for (const m of this.materials) {
        m.mat.color.setHex(this.hurtTimer > 0 ? 0xff4444 : m.origColor);
      }
    }

    this.attackCooldown = Math.max(0, this.attackCooldown - dt);

    const dx = playerPos.x - this.pos.x;
    const dy = playerPos.y - this.pos.y;
    const dz = playerPos.z - this.pos.z;
    const dist = Math.hypot(dx, dy, dz);

    let moving = false;

    if (this.hostile && dist < 18) {
      this.targetYaw = Math.atan2(dx, dz);

      if (this.type === 'creeper') {
        if (dist < 2.8) {
          if (this.creeperFuse === 0) sound.creeperHiss();
          this.creeperFuse += dt;
          const flash = Math.floor(this.creeperFuse * 10) % 2 === 0;
          for (const m of this.materials) {
            m.mat.color.setHex(flash ? 0xffffff : m.origColor);
          }
          const swell = 1 + this.creeperFuse * 0.22;
          this.group.scale.set(swell, swell, swell);
          if (this.creeperFuse >= 1.45) {
            this.dead = true;
            onExplode(this.pos.x, this.pos.y + 0.5, this.pos.z);
            return true;
          }
        } else {
          this.creeperFuse = Math.max(0, this.creeperFuse - dt);
          this.group.scale.set(1, 1, 1);
          moving = true;
        }
      } else if (this.type === 'skeleton') {
        if (dist > 6.5) {
          moving = true;
        } else if (this.attackCooldown <= 0) {
          this.attackCooldown = 2.3;
          onShootArrow(
            new THREE.Vector3(this.pos.x, this.pos.y + 1.4, this.pos.z),
            new THREE.Vector3(dx, dy + 0.3, dz).normalize(),
            false
          );
        }
      } else {
        if (dist > 1.35) {
          moving = true;
        } else if (this.attackCooldown <= 0) {
          this.attackCooldown = 1.1;
          onPlayerDamage(3, 'Zumbi');
        }
      }
    } else {
      this.aiTimer -= dt;
      if (this.aiTimer <= 0) {
        this.aiTimer = 2 + Math.random() * 4;
        this.isWandering = Math.random() < 0.65;
        this.targetYaw += (Math.random() - 0.5) * 2.4;
        if (!this.hostile) this.moveSpeed = 1.5;
      }
      moving = Boolean(this.isWandering);
    }

    const diff = ((this.targetYaw - this.yaw + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    this.yaw += diff * Math.min(1, dt * 8);
    this.group.rotation.y = this.yaw;

    // Independent Head-Tracking when player is close!
    if (this.limbs.head && dist < 8.5) {
      const angleToPlayer = Math.atan2(dx, dz) - this.yaw;
      const normAngle = ((angleToPlayer + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      this.limbs.head.rotation.y = Math.max(-0.7, Math.min(0.7, normAngle));
    } else if (this.limbs.head) {
      this.limbs.head.rotation.y *= 0.9;
    }

    if (moving) {
      const mx = Math.sin(this.yaw) * this.moveSpeed;
      const mz = Math.cos(this.yaw) * this.moveSpeed;
      this.vel.x += (mx - this.vel.x) * Math.min(1, dt * 8);
      this.vel.z += (mz - this.vel.z) * Math.min(1, dt * 8);
      this.walkPhase += dt * this.moveSpeed * 4.2;
    } else {
      this.vel.x *= 0.82;
      this.vel.z *= 0.82;
    }

    const inWater = world.getBlock(this.pos.x, this.pos.y + 0.4, this.pos.z) === BLOCK.WATER;
    const inLava = world.getBlock(this.pos.x, this.pos.y + 0.4, this.pos.z) === BLOCK.LAVA;
    if (inLava) {
      this.damage(4 * dt, null, null);
    }

    this.vel.y -= (inWater ? 6 : 24) * dt;
    if (inWater && this.vel.y < 1.5) this.vel.y += 12 * dt;

    const nextX = this.pos.x + this.vel.x * dt;
    if (!world.isSolid(nextX, this.pos.y + 0.2, this.pos.z) && !world.isSolid(nextX, this.pos.y + 1.1, this.pos.z)) {
      this.pos.x = nextX;
    } else if (this.onGround) {
      this.vel.y = 7.4;
      this.onGround = false;
    }

    const nextZ = this.pos.z + this.vel.z * dt;
    if (!world.isSolid(this.pos.x, this.pos.y + 0.2, nextZ) && !world.isSolid(this.pos.x, this.pos.y + 1.1, nextZ)) {
      this.pos.z = nextZ;
    } else if (this.onGround) {
      this.vel.y = 7.4;
      this.onGround = false;
    }

    const nextY = this.pos.y + this.vel.y * dt;
    if (this.vel.y <= 0 && world.isSolid(this.pos.x, nextY, this.pos.z)) {
      this.pos.y = Math.floor(nextY) + 1;
      this.vel.y = 0;
      this.onGround = true;
    } else {
      this.pos.y = nextY;
      this.onGround = false;
    }

    const swing = moving ? Math.sin(this.walkPhase) * 0.65 : 0;
    if (this.limbs.legL) this.limbs.legL.rotation.x = swing;
    if (this.limbs.legR) this.limbs.legR.rotation.x = -swing;
    if (!this.hostile) {
      if (this.limbs.armL) this.limbs.armL.rotation.x = -swing;
      if (this.limbs.armR) this.limbs.armR.rotation.x = swing;
    } else if (this.type === 'zombie') {
      const bob = Math.sin(performance.now() * 0.005) * 0.08;
      this.limbs.armL.rotation.x = -Math.PI / 2.1 + bob;
      this.limbs.armR.rotation.x = -Math.PI / 2.1 - bob;
    }

    this.group.position.copy(this.pos);
    return false;
  }
}

// Live 3D Pixel-Art Player Character Preview inside the Inventory Modal (Images 2 & 3!)
export class PlayerPreviewRenderer {
  constructor(canvas, atlasTexture, atlasCanvas) {
    this.canvas = canvas;
    this.atlasTexture = atlasTexture;
    this.atlasCanvas = atlasCanvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false });
    this.renderer.setSize(112, 190, false);
    this.renderer.setClearColor(0x000000, 1);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(34, 112 / 190, 0.1, 20);
    this.camera.position.set(0, 1.05, 3.6);
    this.camera.lookAt(0, 0.98, 0);

    const amb = new THREE.AmbientLight(0xffffff, 0.82);
    const dir = new THREE.DirectionalLight(0xffffff, 0.75);
    dir.position.set(2, 4, 3);
    this.scene.add(amb, dir);

    this.root = new THREE.Group();
    this.scene.add(this.root);

    this.lastHeldId = null;
    this.heldObject = null;
    this.buildSteveModel();
  }

  buildSteveModel() {
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 1.42, 0);
    this.root.add(this.headGroup);

    // Pixel-art Steve/Gamer Head (like Image 2)
    const headMesh = makePixelBox(0.48, 0.48, 0.48, '#d4a37b', 12, 701, {
      front: (ctx) => {
        // Brown hair fringe
        ctx.fillStyle = '#3b2313';
        ctx.fillRect(0, 0, 8, 2);
        ctx.fillRect(0, 2, 1, 1);
        ctx.fillRect(7, 2, 1, 1);
        // Eyes
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(1, 3, 2, 1);
        ctx.fillRect(5, 3, 2, 1);
        ctx.fillStyle = '#264259';
        ctx.fillRect(2, 3, 1, 1);
        ctx.fillRect(5, 3, 1, 1);
        // Nose / Mouth
        ctx.fillStyle = '#b57f58';
        ctx.fillRect(3, 4, 2, 1);
      },
      top: (ctx) => { ctx.fillStyle = '#3b2313'; ctx.fillRect(0, 0, 8, 8); },
      back: (ctx) => { ctx.fillStyle = '#3b2313'; ctx.fillRect(0, 0, 8, 5); },
      left: (ctx) => { ctx.fillStyle = '#3b2313'; ctx.fillRect(0, 0, 8, 4); },
      right: (ctx) => { ctx.fillStyle = '#3b2313'; ctx.fillRect(0, 0, 8, 4); },
    }, 0.24);
    this.headGroup.add(headMesh);

    // Helmet Armor Mesh
    this.helmetMesh = makePixelBox(0.55, 0.52, 0.55, '#4eedeb', 18, 702, {
      front: (ctx) => {
        ctx.fillStyle = '#111111';
        ctx.fillRect(1, 3, 6, 4);
        ctx.fillStyle = '#4eedeb';
        ctx.fillRect(3, 3, 2, 2); // Nose guard
      }
    }, 0.25);
    this.helmetMesh.visible = false;
    this.headGroup.add(this.helmetMesh);

    // Gamer Tunic Torso (Black + Cyan pattern from Image 2!)
    this.torso = makePixelBox(0.48, 0.7, 0.26, '#141414', 10, 703, {
      front: (ctx) => {
        ctx.fillStyle = '#1cd4e8';
        ctx.fillRect(1, 1, 2, 4);
        ctx.fillRect(5, 1, 2, 4);
        ctx.fillRect(3, 3, 2, 2);
      }
    });
    this.torso.position.set(0, 1.07, 0);
    this.root.add(this.torso);

    // Chestplate Armor Mesh
    this.chestMesh = makePixelBox(0.54, 0.72, 0.32, '#4eedeb', 18, 704);
    this.chestMesh.position.set(0, 1.07, 0);
    this.chestMesh.visible = false;
    this.root.add(this.chestMesh);

    // Right Arm + Held 3D Item Holder
    this.armR = new THREE.Group();
    this.armR.position.set(-0.36, 1.38, 0);
    this.armR.add(makePixelBox(0.22, 0.68, 0.22, '#d4a37b', 12, 705, {
      top: (ctx) => { ctx.fillStyle = '#141414'; ctx.fillRect(0, 0, 8, 8); },
      front: (ctx) => { ctx.fillStyle = '#141414'; ctx.fillRect(0, 0, 8, 3); },
    }, -0.3));
    this.shoulderR = makePixelBox(0.26, 0.28, 0.26, '#4eedeb', 16, 706, {}, -0.12);
    this.shoulderR.visible = false;
    this.armR.add(this.shoulderR);

    this.heldAnchor = new THREE.Group();
    this.heldAnchor.position.set(0, -0.52, 0.2);
    this.armR.add(this.heldAnchor);
    this.root.add(this.armR);

    // Left Arm + Off-hand Shield
    this.armL = new THREE.Group();
    this.armL.position.set(0.36, 1.38, 0);
    this.armL.add(makePixelBox(0.22, 0.68, 0.22, '#d4a37b', 12, 707, {
      top: (ctx) => { ctx.fillStyle = '#141414'; ctx.fillRect(0, 0, 8, 8); },
      front: (ctx) => { ctx.fillStyle = '#141414'; ctx.fillRect(0, 0, 8, 3); },
    }, -0.3));
    this.shoulderL = makePixelBox(0.26, 0.28, 0.26, '#4eedeb', 16, 708, {}, -0.12);
    this.shoulderL.visible = false;
    this.armL.add(this.shoulderL);

    this.shieldMesh = makePixelBox(0.08, 0.56, 0.34, '#8a6236', 16, 709, {
      right: (ctx) => {
        ctx.strokeStyle = '#b0b0b0';
        ctx.strokeRect(0.5, 0.5, 7, 7);
      }
    });
    this.shieldMesh.position.set(0.14, -0.45, 0.16);
    this.shieldMesh.visible = false;
    this.armL.add(this.shieldMesh);
    this.root.add(this.armL);

    // Legs (Cyan Jeans like Image 2)
    this.legR = makePixelBox(0.23, 0.72, 0.23, '#1cb5cf', 14, 710, {}, -0.36);
    this.legR.position.set(-0.12, 0.72, 0);
    this.legL = makePixelBox(0.23, 0.72, 0.23, '#1cb5cf', 14, 711, {}, -0.36);
    this.legL.position.set(0.12, 0.72, 0);
    this.root.add(this.legR, this.legL);

    // Leggings & Boots Armor
    this.leggingsR = makePixelBox(0.25, 0.48, 0.25, '#dcdcdc', 14, 712, {}, -0.24);
    this.leggingsR.position.set(-0.12, 0.72, 0);
    this.leggingsL = makePixelBox(0.25, 0.48, 0.25, '#dcdcdc', 14, 713, {}, -0.24);
    this.leggingsL.position.set(0.12, 0.72, 0);
    this.root.add(this.leggingsR, this.leggingsL);

    this.bootsR = makePixelBox(0.27, 0.26, 0.27, '#dcdcdc', 14, 714, {}, -0.58);
    this.bootsR.position.set(-0.12, 0.72, 0);
    this.bootsL = makePixelBox(0.27, 0.26, 0.27, '#dcdcdc', 14, 715, {}, -0.58);
    this.bootsL.position.set(0.12, 0.72, 0);
    this.root.add(this.bootsR, this.bootsL);
  }

  setMeshTint(mesh, tier) {
    const col = tier === 'diamond' ? 0x55f2f0 : tier === 'gold' ? 0xfcee4b : 0xe2e2e2;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const m of mats) m.color.setHex(col);
  }

  render(mouseX, mouseY, armorSlots, heldStack, offhandStack) {
    const rect = this.canvas.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const nx = Math.max(-1, Math.min(1, (mouseX - cx) / 180));
    const ny = Math.max(-1, Math.min(1, (mouseY - cy) / 180));

    this.root.rotation.y = nx * 0.55;
    this.headGroup.rotation.y = nx * 0.45;
    this.headGroup.rotation.x = ny * 0.45;

    const helm = armorSlots[0] ? ITEMS[armorSlots[0].id] : null;
    this.helmetMesh.visible = Boolean(helm);
    if (helm) this.setMeshTint(this.helmetMesh, helm.tier);

    const chest = armorSlots[1] ? ITEMS[armorSlots[1].id] : null;
    this.chestMesh.visible = Boolean(chest);
    this.shoulderL.visible = Boolean(chest);
    this.shoulderR.visible = Boolean(chest);
    if (chest) {
      this.setMeshTint(this.chestMesh, chest.tier);
      this.setMeshTint(this.shoulderL, chest.tier);
      this.setMeshTint(this.shoulderR, chest.tier);
    }

    const legs = armorSlots[2] ? ITEMS[armorSlots[2].id] : null;
    this.leggingsL.visible = Boolean(legs);
    this.leggingsR.visible = Boolean(legs);
    if (legs) {
      this.setMeshTint(this.leggingsL, legs.tier);
      this.setMeshTint(this.leggingsR, legs.tier);
    }

    const boots = armorSlots[3] ? ITEMS[armorSlots[3].id] : null;
    this.bootsL.visible = Boolean(boots);
    this.bootsR.visible = Boolean(boots);
    if (boots) {
      this.setMeshTint(this.bootsL, boots.tier);
      this.setMeshTint(this.bootsR, boots.tier);
    }

    // Real 3D Held Item / Block in Preview Hand!
    const heldId = heldStack ? heldStack.id : null;
    if (heldId !== this.lastHeldId) {
      this.lastHeldId = heldId;
      while (this.heldAnchor.children.length > 0) {
        this.heldAnchor.remove(this.heldAnchor.children[0]);
      }
      if (heldId && ITEMS[heldId]) {
        const mesh3d = create3DItemMesh(ITEMS[heldId], this.atlasTexture, this.atlasCanvas);
        if (mesh3d) {
          mesh3d.scale.set(0.65, 0.65, 0.65);
          this.heldAnchor.add(mesh3d);
        }
      }
    }
    this.armR.rotation.x = heldId ? -0.45 : 0;

    const offDef = offhandStack ? ITEMS[offhandStack.id] : null;
    this.shieldMesh.visible = Boolean(offDef);

    this.renderer.render(this.scene, this.camera);
  }
}
