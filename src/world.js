// Chunked Procedural Voxel World Engine with Biomes, Caves, Ores, AO Meshing & Water/Lava Fluid Physics
import * as THREE from 'three';
import { BLOCK, BLOCK_BY_ID } from './items.js';
import { getTileUV } from './textures.js';
import { sound } from './audio.js';

export const CHUNK_SIZE = 16;
export const WORLD_HEIGHT = 64;
export const SEA_LEVEL = 21;

// Fast deterministic seeded noise
class SeededNoise {
  constructor(seedStr = 'argon-2026') {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < seedStr.length; i++) {
      h ^= seedStr.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    this.seed = h >>> 0;
    this.perm = new Uint8Array(512);
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    let s = this.seed || 123456789;
    for (let i = 255; i > 0; i--) {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
      const j = s % (i + 1);
      const tmp = p[i];
      p[i] = p[j];
      p[j] = tmp;
    }
    for (let i = 0; i < 512; i++) this.perm[i] = p[i & 255];
  }

  fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  lerp(t, a, b) {
    return a + t * (b - a);
  }

  grad2(hash, x, y) {
    const h = hash & 7;
    const u = h < 4 ? x : y;
    const v = h < 4 ? y : x;
    return ((h & 1) ? -u : u) + ((h & 2) ? -2.0 * v : 2.0 * v);
  }

  noise2D(x, y) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    x -= Math.floor(x);
    y -= Math.floor(y);
    const u = this.fade(x);
    const v = this.fade(y);
    const A = this.perm[X] + Y;
    const B = this.perm[X + 1] + Y;
    return (
      this.lerp(
        v,
        this.lerp(u, this.grad2(this.perm[A], x, y), this.grad2(this.perm[B], x - 1, y)),
        this.lerp(u, this.grad2(this.perm[A + 1], x, y - 1), this.grad2(this.perm[B + 1], x - 1, y - 1))
      ) * 0.5
    );
  }

  fbm2D(x, y, octaves = 4, lacunarity = 2, gain = 0.5) {
    let total = 0;
    let freq = 1;
    let amp = 1;
    let maxVal = 0;
    for (let i = 0; i < octaves; i++) {
      total += this.noise2D(x * freq, y * freq) * amp;
      maxVal += amp;
      amp *= gain;
      freq *= lacunarity;
    }
    return total / maxVal;
  }

  hash2(x, z) {
    let h = (Math.imul(x, 374761393) + Math.imul(z, 668265263) + this.seed) >>> 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }
}

const FACES = [
  { // +X (Right)
    dir: [1, 0, 0],
    faceKey: 'side',
    shade: 0.78,
    corners: [
      { pos: [1, 0, 1], uv: [0, 0] },
      { pos: [1, 0, 0], uv: [1, 0] },
      { pos: [1, 1, 0], uv: [1, 1] },
      { pos: [1, 1, 1], uv: [0, 1] },
    ],
  },
  { // -X (Left)
    dir: [-1, 0, 0],
    faceKey: 'side',
    shade: 0.78,
    corners: [
      { pos: [0, 0, 0], uv: [0, 0] },
      { pos: [0, 0, 1], uv: [1, 0] },
      { pos: [0, 1, 1], uv: [1, 1] },
      { pos: [0, 1, 0], uv: [0, 1] },
    ],
  },
  { // +Y (Top)
    dir: [0, 1, 0],
    faceKey: 'top',
    shade: 1.0,
    corners: [
      { pos: [0, 1, 1], uv: [0, 0] },
      { pos: [1, 1, 1], uv: [1, 0] },
      { pos: [1, 1, 0], uv: [1, 1] },
      { pos: [0, 1, 0], uv: [0, 1] },
    ],
  },
  { // -Y (Bottom)
    dir: [0, -1, 0],
    faceKey: 'bottom',
    shade: 0.55,
    corners: [
      { pos: [0, 0, 0], uv: [0, 0] },
      { pos: [1, 0, 0], uv: [1, 0] },
      { pos: [1, 0, 1], uv: [1, 1] },
      { pos: [0, 0, 1], uv: [0, 1] },
    ],
  },
  { // +Z (Front)
    dir: [0, 0, 1],
    faceKey: 'front',
    shade: 0.88,
    corners: [
      { pos: [0, 0, 1], uv: [0, 0] },
      { pos: [1, 0, 1], uv: [1, 0] },
      { pos: [1, 1, 1], uv: [1, 1] },
      { pos: [0, 1, 1], uv: [0, 1] },
    ],
  },
  { // -Z (Back)
    dir: [0, 0, -1],
    faceKey: 'side',
    shade: 0.88,
    corners: [
      { pos: [1, 0, 0], uv: [0, 0] },
      { pos: [0, 0, 0], uv: [1, 0] },
      { pos: [0, 1, 0], uv: [1, 1] },
      { pos: [1, 1, 0], uv: [0, 1] },
    ],
  },
];

export class VoxelWorld {
  constructor(scene, atlasTexture, seedStr = 'argon-2026') {
    this.scene = scene;
    this.atlasTexture = atlasTexture;
    this.seedStr = seedStr;
    this.noise = new SeededNoise(seedStr);

    this.chunks = new Map(); // key "cx,cz" -> Uint8Array(16*64*16)
    this.meshes = new Map(); // key "cx,cz" -> { opaque: Mesh, trans: Mesh }
    this.dirtyChunks = new Set();
    this.modifications = new Map(); // key "x,y,z" -> blockId (for save/load)

    // Fluid cellular automata queue
    this.fluidQueue = [];
    this.fluidTimer = 0;

    this.opaqueMat = new THREE.MeshLambertMaterial({
      map: this.atlasTexture,
      vertexColors: true,
      alphaTest: 0.1,
    });

    this.transMat = new THREE.MeshLambertMaterial({
      map: this.atlasTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.78,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
  }

  chunkKey(cx, cz) {
    return `${cx},${cz}`;
  }

  index(lx, y, lz) {
    return y * CHUNK_SIZE * CHUNK_SIZE + lz * CHUNK_SIZE + lx;
  }

  getBiomeAt(wx, wz) {
    const temp = this.noise.fbm2D(wx * 0.006 + 50, wz * 0.006 + 50, 2);
    const humid = this.noise.fbm2D(wx * 0.006 - 90, wz * 0.006 - 90, 2);
    const distOrigin = Math.hypot(wx, wz);
    if (distOrigin < 28) return 'Cherry Grove';
    if (temp > 0.25 && humid < 0) return 'Desert';
    if (temp < -0.22) return 'Snowy Peaks';
    if (humid > 0.12) return 'Cherry Grove';
    return 'Forest Plains';
  }

  getSurfaceHeight(wx, wz) {
    const base = this.noise.fbm2D(wx * 0.012, wz * 0.012, 4);
    const detail = this.noise.noise2D(wx * 0.04, wz * 0.04) * 3;
    const biome = this.getBiomeAt(wx, wz);
    let h = Math.floor(23 + base * 16 + detail);
    if (biome === 'Snowy Peaks') h += Math.floor(Math.max(0, (base + 0.2) * 14));
    return Math.max(5, Math.min(WORLD_HEIGHT - 10, h));
  }

  ensureChunk(cx, cz) {
    const key = this.chunkKey(cx, cz);
    if (this.chunks.has(key)) return this.chunks.get(key);

    const data = new Uint8Array(CHUNK_SIZE * WORLD_HEIGHT * CHUNK_SIZE);
    this.chunks.set(key, data);
    this.generateChunkTerrain(cx, cz, data);
    return data;
  }

  generateChunkTerrain(cx, cz, data) {
    const wx0 = cx * CHUNK_SIZE;
    const wz0 = cz * CHUNK_SIZE;

    for (let lz = 0; lz < CHUNK_SIZE; lz++) {
      for (let lx = 0; lx < CHUNK_SIZE; lx++) {
        const wx = wx0 + lx;
        const wz = wz0 + lz;
        const biome = this.getBiomeAt(wx, wz);
        const h = this.getSurfaceHeight(wx, wz);

        for (let y = 0; y < WORLD_HEIGHT; y++) {
          let block = BLOCK.AIR;

          if (y === 0) {
            block = BLOCK.BEDROCK;
          } else if (y < h - 3) {
            // Check 3D cave worm
            const cave =
              Math.abs(this.noise.noise2D(wx * 0.055 + y * 0.03, wz * 0.055)) +
              Math.abs(this.noise.noise2D(wx * 0.055, wz * 0.055 + y * 0.04));

            if (y > 4 && y < h - 5 && cave < 0.075) {
              block = y <= 8 ? BLOCK.LAVA : BLOCK.AIR;
            } else {
              // Ores distribution
              const oreRoll = this.noise.hash2(wx * 13 + y * 31, wz * 17 - y * 7);
              if (y < 14 && oreRoll < 0.012) block = BLOCK.DIAMOND_ORE;
              else if (y < 22 && oreRoll < 0.022) block = BLOCK.GOLD_ORE;
              else if (y < 36 && oreRoll < 0.045) block = BLOCK.IRON_ORE;
              else if (oreRoll < 0.075) block = BLOCK.COAL_ORE;
              else block = BLOCK.STONE;
            }
          } else if (y < h) {
            block = biome === 'Desert' ? BLOCK.SANDSTONE : BLOCK.DIRT;
          } else if (y === h) {
            if (h <= SEA_LEVEL + 1 && biome !== 'Snowy Peaks') {
              block = BLOCK.SAND;
            } else if (biome === 'Desert') {
              block = BLOCK.SAND;
            } else if (biome === 'Snowy Peaks' || h > 36) {
              block = BLOCK.SNOW_GRASS;
            } else if (biome === 'Cherry Grove' && this.noise.hash2(wx * 3, wz * 3) < 0.42) {
              block = BLOCK.CHERRY_GRASS;
            } else {
              block = BLOCK.GRASS;
            }
          } else if (y <= SEA_LEVEL) {
            block = BLOCK.WATER;
          }

          // Expose stone cliffs on steep hillsides for authentic survival mining
          if (y === h && h > 25 && this.noise.hash2(wx + 77, wz - 33) < 0.12) {
            block = this.noise.hash2(wx, wz) < 0.25 ? BLOCK.COAL_ORE : BLOCK.STONE;
          }

          if (block !== BLOCK.AIR) {
            data[this.index(lx, y, lz)] = block;
          }
        }
      }
    }

    // Surface lava spring in chunk (dramatic lava feature!)
    if (cx === 0 && cz === -1) {
      const lx = 8, lz = 8;
      const sy = this.getSurfaceHeight(wx0 + lx, wz0 + lz);
      if (sy > SEA_LEVEL + 1) {
        data[this.index(lx, sy, lz)] = BLOCK.LAVA;
        data[this.index(lx + 1, sy, lz)] = BLOCK.COBBLESTONE;
        data[this.index(lx - 1, sy, lz)] = BLOCK.COBBLESTONE;
        data[this.index(lx, sy, lz + 1)] = BLOCK.COBBLESTONE;
        data[this.index(lx, sy - 1, lz)] = BLOCK.COBBLESTONE;
      }
    }

    // Trees & Cacti (keep clear corridor around panorama & spawn)
    for (let lz = 3; lz < CHUNK_SIZE - 3; lz++) {
      for (let lx = 3; lx < CHUNK_SIZE - 3; lx++) {
        const wx = wx0 + lx;
        const wz = wz0 + lz;
        if (Math.hypot(wx, wz) < 7) continue;

        const h = this.getSurfaceHeight(wx, wz);
        if (h <= SEA_LEVEL + 1 || h >= WORLD_HEIGHT - 9) continue;

        const topBlock = data[this.index(lx, h, lz)];
        const treeRoll = this.noise.hash2(wx, wz);
        const biome = this.getBiomeAt(wx, wz);

        if (biome === 'Desert' && topBlock === BLOCK.SAND && treeRoll < 0.018) {
          for (let cy = 1; cy <= 3; cy++) {
            data[this.index(lx, h + cy, lz)] = BLOCK.CACTUS;
          }
        } else if (
          (topBlock === BLOCK.GRASS || topBlock === BLOCK.CHERRY_GRASS || topBlock === BLOCK.SNOW_GRASS) &&
          treeRoll < 0.026
        ) {
          const isCherry = biome === 'Cherry Grove' || (treeRoll < 0.014 && biome !== 'Snowy Peaks');
          const logBlock = isCherry ? BLOCK.CHERRY_LOG : BLOCK.OAK_LOG;
          const leafBlock = isCherry ? BLOCK.CHERRY_LEAVES : BLOCK.OAK_LEAVES;
          const trunkH = 4 + Math.floor(this.noise.hash2(wx + 9, wz + 9) * 2);

          for (let ty = 1; ty <= trunkH; ty++) {
            data[this.index(lx, h + ty, lz)] = logBlock;
          }

          for (let dy = trunkH - 1; dy <= trunkH + 2; dy++) {
            const radius = dy >= trunkH + 1 ? 1 : 2;
            for (let dz = -radius; dz <= radius; dz++) {
              for (let dx = -radius; dx <= radius; dx++) {
                if (Math.abs(dx) === 2 && Math.abs(dz) === 2 && dy === trunkH) continue;
                const tx = lx + dx;
                const ty = h + dy;
                const tz = lz + dz;
                if (data[this.index(tx, ty, tz)] === BLOCK.AIR) {
                  data[this.index(tx, ty, tz)] = leafBlock;
                }
              }
            }
          }
        }
      }
    }

    // Re-apply user modifications in this chunk
    for (const [mKey, blockId] of this.modifications.entries()) {
      const [mx, my, mz] = mKey.split(',').map(Number);
      if (Math.floor(mx / CHUNK_SIZE) === cx && Math.floor(mz / CHUNK_SIZE) === cz) {
        const lx = ((mx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
        const lz = ((mz % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
        if (my >= 0 && my < WORLD_HEIGHT) {
          data[this.index(lx, my, lz)] = blockId;
        }
      }
    }
  }

  getBlock(wx, wy, wz) {
    const x = Math.floor(wx);
    const y = Math.floor(wy);
    const z = Math.floor(wz);
    if (y < 0 || y >= WORLD_HEIGHT) return BLOCK.AIR;

    const cx = Math.floor(x / CHUNK_SIZE);
    const cz = Math.floor(z / CHUNK_SIZE);
    const key = this.chunkKey(cx, cz);
    const chunk = this.chunks.get(key);
    if (!chunk) return BLOCK.AIR;

    const lx = ((x % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const lz = ((z % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    return chunk[this.index(lx, y, lz)];
  }

  setBlock(wx, wy, wz, blockId, recordMod = true) {
    const x = Math.floor(wx);
    const y = Math.floor(wy);
    const z = Math.floor(wz);
    if (y < 0 || y >= WORLD_HEIGHT) return false;

    const cx = Math.floor(x / CHUNK_SIZE);
    const cz = Math.floor(z / CHUNK_SIZE);
    const chunk = this.ensureChunk(cx, cz);
    const lx = ((x % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const lz = ((z % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;

    const prev = chunk[this.index(lx, y, lz)];
    if (prev === blockId) return false;

    chunk[this.index(lx, y, lz)] = blockId;
    if (recordMod) {
      this.modifications.set(`${x},${y},${z}`, blockId);
    }

    this.markChunkDirty(cx, cz);
    if (lx === 0) this.markChunkDirty(cx - 1, cz);
    if (lx === CHUNK_SIZE - 1) this.markChunkDirty(cx + 1, cz);
    if (lz === 0) this.markChunkDirty(cx, cz - 1);
    if (lz === CHUNK_SIZE - 1) this.markChunkDirty(cx, cz + 1);

    // Trigger fluid updates around modified voxel
    this.scheduleFluidAround(x, y, z);
    return true;
  }

  markChunkDirty(cx, cz) {
    const key = this.chunkKey(cx, cz);
    if (this.chunks.has(key)) {
      this.dirtyChunks.add(key);
    }
  }

  scheduleFluidAround(x, y, z) {
    const neighbors = [
      [x, y, z],
      [x + 1, y, z],
      [x - 1, y, z],
      [x, y + 1, z],
      [x, y - 1, z],
      [x, y, z + 1],
      [x, y, z - 1],
    ];
    for (const [nx, ny, nz] of neighbors) {
      const b = this.getBlock(nx, ny, nz);
      if (b === BLOCK.WATER || b === BLOCK.LAVA) {
        this.fluidQueue.push({ x: nx, y: ny, z: nz, type: b, depth: 0 });
      }
    }
  }

  updateFluids(dt) {
    this.fluidTimer += dt;
    if (this.fluidTimer < 0.18 || this.fluidQueue.length === 0) return;
    this.fluidTimer = 0;

    const batch = this.fluidQueue.splice(0, 24);
    for (const node of batch) {
      const current = this.getBlock(node.x, node.y, node.z);
      if (current !== BLOCK.WATER && current !== BLOCK.LAVA) continue;

      // Check water + lava interaction first -> Obsidian / Cobblestone!
      const dirs = [
        [1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1], [0, -1, 0], [0, 1, 0]
      ];
      for (const [dx, dy, dz] of dirs) {
        const nb = this.getBlock(node.x + dx, node.y + dy, node.z + dz);
        if ((current === BLOCK.WATER && nb === BLOCK.LAVA) || (current === BLOCK.LAVA && nb === BLOCK.WATER)) {
          const targetX = current === BLOCK.LAVA ? node.x : node.x + dx;
          const targetY = current === BLOCK.LAVA ? node.y : node.y + dy;
          const targetZ = current === BLOCK.LAVA ? node.z : node.z + dz;
          this.setBlock(targetX, targetY, targetZ, dy !== 0 ? BLOCK.OBSIDIAN : BLOCK.COBBLESTONE);
          sound.sizzle();
        }
      }

      // Flow downward if air below
      if (node.y > 1 && this.getBlock(node.x, node.y - 1, node.z) === BLOCK.AIR) {
        this.setBlock(node.x, node.y - 1, node.z, current);
        this.fluidQueue.push({ x: node.x, y: node.y - 1, z: node.z, type: current, depth: 0 });
        continue;
      }

      // Spread horizontally up to 3 blocks if sitting on solid block
      const maxSpread = current === BLOCK.WATER ? 3 : 2;
      if (node.depth < maxSpread && this.getBlock(node.x, node.y - 1, node.z) !== BLOCK.AIR) {
        for (const [dx, , dz] of [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1]]) {
          const nx = node.x + dx;
          const nz = node.z + dz;
          if (this.getBlock(nx, node.y, nz) === BLOCK.AIR && this.getBlock(nx, node.y - 1, nz) !== BLOCK.AIR) {
            this.setBlock(nx, node.y, nz, current);
            this.fluidQueue.push({ x: nx, y: node.y, z: nz, type: current, depth: node.depth + 1 });
          }
        }
      }
    }
  }

  isSolid(wx, wy, wz) {
    const id = this.getBlock(wx, wy, wz);
    if (id === BLOCK.AIR || id === BLOCK.WATER || id === BLOCK.LAVA || id === BLOCK.TORCH) return false;
    return true;
  }

  isOpaque(wx, wy, wz) {
    const id = this.getBlock(wx, wy, wz);
    if (id === BLOCK.AIR || id === BLOCK.TORCH) return false;
    const def = BLOCK_BY_ID[id];
    if (!def) return false;
    return !def.transparent && !def.isFluid;
  }

  // Build Opaque + Transparent/Fluid meshes for a chunk
  buildChunkMesh(cx, cz) {
    const key = this.chunkKey(cx, cz);
    const chunk = this.chunks.get(key);
    if (!chunk) return;

    const old = this.meshes.get(key);
    if (old) {
      if (old.opaque) {
        this.scene.remove(old.opaque);
        old.opaque.geometry.dispose();
      }
      if (old.trans) {
        this.scene.remove(old.trans);
        old.trans.geometry.dispose();
      }
    }

    const opPos = [], opNorm = [], opUv = [], opCol = [], opIdx = [];
    const trPos = [], trNorm = [], trUv = [], trCol = [], trIdx = [];

    const wx0 = cx * CHUNK_SIZE;
    const wz0 = cz * CHUNK_SIZE;

    for (let y = 0; y < WORLD_HEIGHT; y++) {
      for (let lz = 0; lz < CHUNK_SIZE; lz++) {
        for (let lx = 0; lx < CHUNK_SIZE; lx++) {
          const blockId = chunk[this.index(lx, y, lz)];
          if (blockId === BLOCK.AIR) continue;

          const def = BLOCK_BY_ID[blockId];
          if (!def) continue;

          const wx = wx0 + lx;
          const wz = wz0 + lz;
          const isTrans = Boolean(def.transparent || def.isFluid);

          const posArr = isTrans ? trPos : opPos;
          const normArr = isTrans ? trNorm : opNorm;
          const uvArr = isTrans ? trUv : opUv;
          const colArr = isTrans ? trCol : opCol;
          const idxArr = isTrans ? trIdx : opIdx;

          // Special slim mesh for Torch
          if (blockId === BLOCK.TORCH) {
            this.appendTorchGeometry(wx, y, wz, def.faces.side, opPos, opNorm, opUv, opCol, opIdx);
            continue;
          }

          for (const face of FACES) {
            const nx = wx + face.dir[0];
            const ny = y + face.dir[1];
            const nz = wz + face.dir[2];
            const neighborId = this.getBlock(nx, ny, nz);

            if (isTrans) {
              if (neighborId === blockId) continue;
              if (this.isOpaque(nx, ny, nz)) continue;
            } else {
              if (this.isOpaque(nx, ny, nz)) continue;
            }

            const tileIdx = def.faces[face.faceKey] ?? def.faces.side;
            const [u0, v0, u1, v1] = getTileUV(tileIdx);
            const ndx = posArr.length / 3;

            const topOffset = (def.isFluid && this.getBlock(wx, y + 1, wz) === BLOCK.AIR) ? -0.12 : 0;

            for (const corner of face.corners) {
              const px = wx + corner.pos[0];
              const py = y + corner.pos[1] + (corner.pos[1] === 1 ? topOffset : 0);
              const pz = wz + corner.pos[2];
              posArr.push(px, py, pz);
              normArr.push(face.dir[0], face.dir[1], face.dir[2]);

              const u = corner.uv[0] === 0 ? u0 : u1;
              const v = corner.uv[1] === 0 ? v0 : v1;
              uvArr.push(u, v);

              // Subtle vertex ambient occlusion
              let ao = 1.0;
              if (face.dir[1] >= 0 && !def.light) {
                const sx = corner.pos[0] === 1 ? 1 : -1;
                const sz = corner.pos[2] === 1 ? 1 : -1;
                if (this.isOpaque(wx + sx, y + 1, wz) || this.isOpaque(wx, y + 1, wz + sz)) {
                  ao = 0.82;
                }
              }
              const s = def.light ? 1.0 : face.shade * ao;
              colArr.push(s, s, s);
            }

            idxArr.push(ndx, ndx + 1, ndx + 2, ndx, ndx + 2, ndx + 3);
          }
        }
      }
    }

    const holder = { opaque: null, trans: null };

    if (opPos.length > 0) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(opPos, 3));
      geo.setAttribute('normal', new THREE.Float32BufferAttribute(opNorm, 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(opUv, 2));
      geo.setAttribute('color', new THREE.Float32BufferAttribute(opCol, 3));
      geo.setIndex(opIdx);
      holder.opaque = new THREE.Mesh(geo, this.opaqueMat);
      this.scene.add(holder.opaque);
    }

    if (trPos.length > 0) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(trPos, 3));
      geo.setAttribute('normal', new THREE.Float32BufferAttribute(trNorm, 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(trUv, 2));
      geo.setAttribute('color', new THREE.Float32BufferAttribute(trCol, 3));
      geo.setIndex(trIdx);
      holder.trans = new THREE.Mesh(geo, this.transMat);
      this.scene.add(holder.trans);
    }

    this.meshes.set(key, holder);
  }

  appendTorchGeometry(wx, y, wz, tileIdx, posArr, normArr, uvArr, colArr, idxArr) {
    const [u0, v0, u1, v1] = getTileUV(tileIdx);
    const minX = wx + 0.42, maxX = wx + 0.58;
    const minY = y, maxY = y + 0.65;
    const minZ = wz + 0.42, maxZ = wz + 0.58;

    for (const face of FACES) {
      const ndx = posArr.length / 3;
      for (const c of face.corners) {
        posArr.push(
          c.pos[0] ? maxX : minX,
          c.pos[1] ? maxY : minY,
          c.pos[2] ? maxZ : minZ
        );
        normArr.push(face.dir[0], face.dir[1], face.dir[2]);
        uvArr.push(c.uv[0] ? u1 : u0, c.uv[1] ? v1 : v0);
        colArr.push(1, 1, 1);
      }
      idxArr.push(ndx, ndx + 1, ndx + 2, ndx, ndx + 2, ndx + 3);
    }
  }

  updateChunksAround(px, pz, radius = 3) {
    const pcx = Math.floor(px / CHUNK_SIZE);
    const pcz = Math.floor(pz / CHUNK_SIZE);

    for (let dz = -radius; dz <= radius; dz++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (dx * dx + dz * dz > (radius + 0.5) * (radius + 0.5)) continue;
        const cx = pcx + dx;
        const cz = pcz + dz;
        const key = this.chunkKey(cx, cz);
        if (!this.chunks.has(key)) {
          this.ensureChunk(cx, cz);
          this.dirtyChunks.add(key);
        }
      }
    }

    // Rebuild up to 2 dirty chunks per frame for buttery-smooth 60fps
    let built = 0;
    for (const key of Array.from(this.dirtyChunks)) {
      this.dirtyChunks.delete(key);
      const [cx, cz] = key.split(',').map(Number);
      this.buildChunkMesh(cx, cz);
      built++;
      if (built >= 3) break;
    }
  }

  // Fast Voxel DDA Raycast (ignores fluids unless includeFluids=true for bucket scooping)
  raycast(origin, dir, maxDist = 6.0, includeFluids = false) {
    let x = Math.floor(origin.x);
    let y = Math.floor(origin.y);
    let z = Math.floor(origin.z);

    const stepX = Math.sign(dir.x);
    const stepY = Math.sign(dir.y);
    const stepZ = Math.sign(dir.z);

    const tDeltaX = stepX !== 0 ? Math.abs(1 / dir.x) : Infinity;
    const tDeltaY = stepY !== 0 ? Math.abs(1 / dir.y) : Infinity;
    const tDeltaZ = stepZ !== 0 ? Math.abs(1 / dir.z) : Infinity;

    let tMaxX = stepX > 0 ? (x + 1 - origin.x) * tDeltaX : (origin.x - x) * tDeltaX;
    let tMaxY = stepY > 0 ? (y + 1 - origin.y) * tDeltaY : (origin.y - y) * tDeltaY;
    let tMaxZ = stepZ > 0 ? (z + 1 - origin.z) * tDeltaZ : (origin.z - z) * tDeltaZ;

    let normal = { x: 0, y: 0, z: 0 };
    let dist = 0;

    while (dist <= maxDist) {
      const blockId = this.getBlock(x, y, z);
      if (blockId !== BLOCK.AIR) {
        const def = BLOCK_BY_ID[blockId];
        if (includeFluids || !def?.isFluid) {
          return { x, y, z, blockId, normal, dist };
        }
      }

      if (tMaxX < tMaxY) {
        if (tMaxX < tMaxZ) {
          x += stepX;
          dist = tMaxX;
          tMaxX += tDeltaX;
          normal = { x: -stepX, y: 0, z: 0 };
        } else {
          z += stepZ;
          dist = tMaxZ;
          tMaxZ += tDeltaZ;
          normal = { x: 0, y: 0, z: -stepZ };
        }
      } else {
        if (tMaxY < tMaxZ) {
          y += stepY;
          dist = tMaxY;
          tMaxY += tDeltaY;
          normal = { x: 0, y: -stepY, z: 0 };
        } else {
          z += stepZ;
          dist = tMaxZ;
          tMaxZ += tDeltaZ;
          normal = { x: 0, y: 0, z: -stepZ };
        }
      }
    }
    return null;
  }

  // Explosion crater (Creeper / TNT)
  explode(cx, cy, cz, radius = 3.2, onBlockDrop = null) {
    sound.explosion();
    const r = Math.ceil(radius);
    for (let dy = -r; dy <= r; dy++) {
      for (let dz = -r; dz <= r; dz++) {
        for (let dx = -r; dx <= r; dx++) {
          const d = Math.hypot(dx, dy, dz);
          if (d <= radius) {
            const bx = Math.floor(cx + dx);
            const by = Math.floor(cy + dy);
            const bz = Math.floor(cz + dz);
            const bid = this.getBlock(bx, by, bz);
            if (bid !== BLOCK.AIR && bid !== BLOCK.BEDROCK && bid !== BLOCK.OBSIDIAN) {
              const def = BLOCK_BY_ID[bid];
              this.setBlock(bx, by, bz, BLOCK.AIR);
              if (onBlockDrop && def?.drop && Math.random() < 0.45) {
                onBlockDrop(bx + 0.5, by + 0.5, bz + 0.5, def.drop, 1);
              }
            }
          }
        }
      }
    }
  }
}
