// Procedural 16x16 Pixel-Art Texture Atlas, 3D Extruded Item Meshes, 6-Face Mob Skin Generator & Authentic MINCERAFT Logo
import * as THREE from 'three';

export const ATLAS_COLS = 16;
export const ATLAS_ROWS = 16;
export const TILE_SIZE = 16;

export const TEX = {
  GRASS_TOP: 0,
  GRASS_SIDE: 1,
  DIRT: 2,
  STONE: 3,
  COBBLESTONE: 4,
  BEDROCK: 5,
  OAK_LOG_SIDE: 6,
  OAK_LOG_TOP: 7,
  OAK_PLANKS: 8,
  OAK_LEAVES: 9,
  CHERRY_LOG_SIDE: 10,
  CHERRY_LEAVES: 11,
  SAND: 12,
  SANDSTONE_SIDE: 13,
  SANDSTONE_TOP: 14,
  SNOW: 15,
  SNOWY_GRASS_SIDE: 16,
  COAL_ORE: 17,
  IRON_ORE: 18,
  GOLD_ORE: 19,
  DIAMOND_ORE: 20,
  CRAFTING_TOP: 21,
  CRAFTING_SIDE: 22,
  FURNACE_FRONT: 23,
  FURNACE_LIT: 24,
  FURNACE_SIDE: 25,
  FURNACE_TOP: 26,
  GLASS: 27,
  WATER: 28,
  LAVA: 29,
  OBSIDIAN: 30,
  TNT_SIDE: 31,
  TNT_TOP: 32,
  TNT_BOTTOM: 33,
  CACTUS_SIDE: 34,
  CACTUS_TOP: 35,
  TORCH: 36,
  GOLD_BLOCK: 37,
  DIAMOND_BLOCK: 38,
  IRON_BLOCK: 39,
  SPRUCE_PLANKS: 40,
  BRICKS: 41,
  CHERRY_PETALS: 42,
};

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function clampByte(v) {
  return Math.max(0, Math.min(255, Math.round(v)));
}

function paintNoiseTile(ctx, tileIndex, baseHex, variance = 18, seed = 100) {
  const col = tileIndex % ATLAS_COLS;
  const row = Math.floor(tileIndex / ATLAS_COLS);
  const ox = col * TILE_SIZE;
  const oy = row * TILE_SIZE;
  const rng = mulberry32(seed + tileIndex * 97);
  const [r, g, b] = hexToRgb(baseHex);

  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const delta = (rng() - 0.5) * variance * 2;
      ctx.fillStyle = `rgb(${clampByte(r + delta)},${clampByte(g + delta)},${clampByte(b + delta)})`;
      ctx.fillRect(ox + x, oy + y, 1, 1);
    }
  }
  return { ox, oy, rng };
}

function paintOreSpots(ctx, tileIndex, spotColors) {
  const { ox, oy, rng } = paintNoiseTile(ctx, tileIndex, '#7c7c7c', 16, 400 + tileIndex);
  ctx.fillStyle = '#656565';
  for (let i = 0; i < 12; i++) {
    ctx.fillRect(ox + Math.floor(rng() * 14) + 1, oy + Math.floor(rng() * 14) + 1, 2, 1);
  }
  const coords = [
    [3, 4], [4, 4], [4, 5],
    [10, 3], [11, 3], [10, 4],
    [6, 9], [7, 9], [7, 10], [8, 9],
    [11, 11], [12, 11], [11, 12],
    [3, 11], [4, 12]
  ];
  coords.forEach(([x, y], idx) => {
    ctx.fillStyle = spotColors[idx % spotColors.length];
    ctx.fillRect(ox + x, oy + y, 1, 1);
  });
}

export function buildTextureAtlas() {
  const canvas = document.createElement('canvas');
  canvas.width = ATLAS_COLS * TILE_SIZE;
  canvas.height = ATLAS_ROWS * TILE_SIZE;
  const ctx = canvas.getContext('2d');

  // 0: GRASS_TOP (Lush green)
  paintNoiseTile(ctx, TEX.GRASS_TOP, '#5ca832', 16, 11);

  // 42: CHERRY_PETALS (Grass with pink cherry blossoms on the ground like Screenshot 2!)
  {
    const { ox, oy, rng } = paintNoiseTile(ctx, TEX.CHERRY_PETALS, '#5ca832', 16, 420);
    for (let i = 0; i < 22; i++) {
      ctx.fillStyle = i % 3 === 0 ? '#ffd6e7' : '#f279a6';
      const px = Math.floor(rng() * 14) + 1;
      const py = Math.floor(rng() * 14) + 1;
      ctx.fillRect(ox + px, oy + py, 1, 1);
      if (i % 2 === 0) ctx.fillRect(ox + px + 1, oy + py, 1, 1);
    }
  }

  // 2: DIRT
  paintNoiseTile(ctx, TEX.DIRT, '#866043', 20, 22);

  // 1: GRASS_SIDE
  {
    const { ox, oy, rng } = paintNoiseTile(ctx, TEX.GRASS_SIDE, '#866043', 20, 33);
    for (let x = 0; x < 16; x++) {
      const grassDepth = 2 + Math.floor(rng() * 3);
      for (let y = 0; y < grassDepth; y++) {
        const d = (rng() - 0.5) * 20;
        ctx.fillStyle = `rgb(${clampByte(92 + d)},${clampByte(168 + d)},${clampByte(50 + d)})`;
        ctx.fillRect(ox + x, oy + y, 1, 1);
      }
    }
  }

  // 3: STONE
  {
    const { ox, oy, rng } = paintNoiseTile(ctx, TEX.STONE, '#7d7d7d', 15, 44);
    for (let i = 0; i < 18; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#686868' : '#8e8e8e';
      ctx.fillRect(ox + Math.floor(rng() * 14), oy + Math.floor(rng() * 15), 2, 1);
    }
  }

  // 4: COBBLESTONE
  {
    const { ox, oy, rng } = paintNoiseTile(ctx, TEX.COBBLESTONE, '#6d6d6d', 26, 55);
    ctx.fillStyle = '#3f3f3f';
    for (let y = 0; y < 16; y += 4) {
      for (let x = 0; x < 16; x += 4) {
        const jx = (x + Math.floor(rng() * 2)) % 16;
        const jy = (y + Math.floor(rng() * 2)) % 16;
        ctx.fillRect(ox + jx, oy + jy, 3, 1);
        ctx.fillRect(ox + jx, oy + jy, 1, 3);
      }
    }
  }

  // 5: BEDROCK
  paintNoiseTile(ctx, TEX.BEDROCK, '#333333', 42, 66);

  // 6 & 7: OAK LOG SIDE & TOP
  {
    const { ox, oy, rng } = paintNoiseTile(ctx, TEX.OAK_LOG_SIDE, '#675032', 14, 77);
    for (let x = 0; x < 16; x += 2) {
      ctx.fillStyle = x % 4 === 0 ? '#4f3c22' : '#785e3c';
      for (let y = 0; y < 16; y++) {
        if (rng() > 0.25) ctx.fillRect(ox + x, oy + y, 1, 1);
      }
    }
    const top = paintNoiseTile(ctx, TEX.OAK_LOG_TOP, '#a68556', 10, 78);
    ctx.strokeStyle = '#675032';
    ctx.lineWidth = 2;
    ctx.strokeRect(top.ox + 1, top.oy + 1, 14, 14);
    ctx.strokeStyle = '#8b6e44';
    ctx.lineWidth = 1;
    ctx.strokeRect(top.ox + 4, top.oy + 4, 8, 8);
  }

  // 8: OAK PLANKS
  {
    const { ox, oy } = paintNoiseTile(ctx, TEX.OAK_PLANKS, '#a2824e', 12, 88);
    ctx.fillStyle = '#7e6236';
    for (let y = 3; y < 16; y += 4) {
      ctx.fillRect(ox, oy + y, 16, 1);
    }
    ctx.fillRect(ox + 7, oy, 1, 3);
    ctx.fillRect(ox + 12, oy + 4, 1, 3);
    ctx.fillRect(ox + 4, oy + 8, 1, 3);
    ctx.fillRect(ox + 10, oy + 12, 1, 3);
  }

  // 9: OAK LEAVES
  {
    const { ox, oy, rng } = paintNoiseTile(ctx, TEX.OAK_LEAVES, '#3b8222', 24, 99);
    ctx.fillStyle = '#245214';
    for (let i = 0; i < 35; i++) {
      ctx.fillRect(ox + Math.floor(rng() * 16), oy + Math.floor(rng() * 16), 1, 1);
    }
  }

  // 10 & 11: CHERRY LOG SIDE & CHERRY LEAVES
  {
    const { ox, oy, rng } = paintNoiseTile(ctx, TEX.CHERRY_LOG_SIDE, '#2c171d', 12, 101);
    for (let y = 0; y < 16; y += 3) {
      ctx.fillStyle = '#1b0d11';
      ctx.fillRect(ox + Math.floor(rng() * 8), oy + y, 6, 1);
    }
    const { ox: lx, oy: ly, rng: lrng } = paintNoiseTile(ctx, TEX.CHERRY_LEAVES, '#f09bb8', 22, 102);
    for (let i = 0; i < 45; i++) {
      ctx.fillStyle = i % 3 === 0 ? '#ffe8f0' : '#d1688d';
      ctx.fillRect(lx + Math.floor(lrng() * 16), ly + Math.floor(lrng() * 16), 1, 1);
    }
  }

  // 12, 13, 14: SAND & SANDSTONE
  paintNoiseTile(ctx, TEX.SAND, '#dcd098', 14, 120);
  {
    const { ox, oy } = paintNoiseTile(ctx, TEX.SANDSTONE_SIDE, '#d6c78b', 12, 130);
    ctx.fillStyle = '#b8a86b';
    ctx.fillRect(ox, oy + 3, 16, 1);
    ctx.fillRect(ox, oy + 7, 16, 1);
    ctx.fillRect(ox, oy + 12, 16, 1);
  }
  paintNoiseTile(ctx, TEX.SANDSTONE_TOP, '#dfd29b', 10, 140);

  // 15 & 16: SNOW & SNOWY GRASS SIDE
  paintNoiseTile(ctx, TEX.SNOW, '#f4f9fc', 8, 150);
  {
    const { ox, oy, rng } = paintNoiseTile(ctx, TEX.SNOWY_GRASS_SIDE, '#866043', 20, 160);
    for (let x = 0; x < 16; x++) {
      const d = 3 + Math.floor(rng() * 3);
      for (let y = 0; y < d; y++) {
        ctx.fillStyle = y === d - 1 ? '#dce7ed' : '#f4f9fc';
        ctx.fillRect(ox + x, oy + y, 1, 1);
      }
    }
  }

  // 17..20: ORES
  paintOreSpots(ctx, TEX.COAL_ORE, ['#1c1c1c', '#2e2e2e']);
  paintOreSpots(ctx, TEX.IRON_ORE, ['#d8af93', '#bf9275']);
  paintOreSpots(ctx, TEX.GOLD_ORE, ['#fcee4b', '#e0b81b']);
  paintOreSpots(ctx, TEX.DIAMOND_ORE, ['#5decf5', '#2ccbd6', '#b8faff']);

  // 21 & 22: CRAFTING TABLE TOP & SIDE
  {
    const { ox, oy } = paintNoiseTile(ctx, TEX.CRAFTING_TOP, '#a2824e', 10, 210);
    ctx.strokeStyle = '#4e381c';
    ctx.strokeRect(ox + 1, oy + 1, 14, 14);
    ctx.fillStyle = '#5c4322';
    for (let i = 4; i <= 12; i += 4) {
      ctx.fillRect(ox + i, oy + 2, 1, 12);
      ctx.fillRect(ox + 2, oy + i, 12, 1);
    }
    const side = paintNoiseTile(ctx, TEX.CRAFTING_SIDE, '#9c7a44', 12, 220);
    ctx.fillStyle = '#4f381c';
    ctx.fillRect(side.ox, side.oy, 16, 3);
    ctx.fillStyle = '#b8b8b8';
    ctx.fillRect(side.ox + 3, side.oy + 5, 3, 6);
    ctx.fillStyle = '#5e3c1b';
    ctx.fillRect(side.ox + 10, side.oy + 5, 3, 7);
  }

  // 23..26: FURNACE
  {
    for (const t of [TEX.FURNACE_FRONT, TEX.FURNACE_LIT, TEX.FURNACE_SIDE, TEX.FURNACE_TOP]) {
      const { ox, oy } = paintNoiseTile(ctx, t, '#757575', 16, 230 + t);
      ctx.strokeStyle = '#4c4c4c';
      ctx.strokeRect(ox + 0.5, oy + 0.5, 15, 15);
    }
    const drawFurnaceFront = (t, lit) => {
      const col = t % ATLAS_COLS;
      const row = Math.floor(t / ATLAS_COLS);
      const ox = col * 16;
      const oy = row * 16;
      ctx.fillStyle = '#262626';
      ctx.fillRect(ox + 3, oy + 3, 10, 5);
      ctx.fillRect(ox + 3, oy + 10, 10, 4);
      if (lit) {
        ctx.fillStyle = '#ff6a00';
        ctx.fillRect(ox + 4, oy + 10, 8, 4);
        ctx.fillStyle = '#ffdd44';
        ctx.fillRect(ox + 5, oy + 11, 6, 2);
      }
    };
    drawFurnaceFront(TEX.FURNACE_FRONT, false);
    drawFurnaceFront(TEX.FURNACE_LIT, true);
  }

  // 27: GLASS
  {
    const col = TEX.GLASS % ATLAS_COLS;
    const row = Math.floor(TEX.GLASS / ATLAS_COLS);
    const ox = col * 16;
    const oy = row * 16;
    ctx.clearRect(ox, oy, 16, 16);
    ctx.fillStyle = 'rgba(200, 240, 255, 0.18)';
    ctx.fillRect(ox, oy, 16, 16);
    ctx.fillStyle = '#daf4ff';
    ctx.fillRect(ox, oy, 16, 1);
    ctx.fillRect(ox, oy + 15, 16, 1);
    ctx.fillRect(ox, oy, 1, 16);
    ctx.fillRect(ox + 15, oy, 1, 16);
    ctx.fillRect(ox + 3, oy + 3, 2, 1);
    ctx.fillRect(ox + 3, oy + 4, 1, 2);
    ctx.fillRect(ox + 11, oy + 11, 2, 1);
  }

  // 28: WATER
  {
    const { ox, oy } = paintNoiseTile(ctx, TEX.WATER, '#2368d8', 16, 280);
    ctx.fillStyle = '#4287f5';
    for (let y = 2; y < 16; y += 4) {
      ctx.fillRect(ox + (y % 6), oy + y, 8, 1);
    }
  }

  // 29: LAVA
  {
    const { ox, oy, rng } = paintNoiseTile(ctx, TEX.LAVA, '#e34c0e', 28, 290);
    for (let i = 0; i < 36; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#ffae00' : '#ffd93b';
      ctx.fillRect(ox + Math.floor(rng() * 14), oy + Math.floor(rng() * 14), 2, 2);
    }
  }

  // 30: OBSIDIAN
  paintNoiseTile(ctx, TEX.OBSIDIAN, '#191229', 16, 300);

  // 31..33: TNT
  {
    const { ox, oy } = paintNoiseTile(ctx, TEX.TNT_SIDE, '#c93022', 14, 310);
    ctx.fillStyle = '#eeeeee';
    ctx.fillRect(ox, oy + 5, 16, 6);
    ctx.fillStyle = '#111111';
    ctx.fillRect(ox + 2, oy + 6, 3, 4);
    ctx.fillRect(ox + 6, oy + 6, 3, 4);
    ctx.fillRect(ox + 11, oy + 6, 3, 4);
    paintNoiseTile(ctx, TEX.TNT_TOP, '#d43b2c', 18, 320);
    paintNoiseTile(ctx, TEX.TNT_BOTTOM, '#8f281e', 14, 330);
  }

  // 34 & 35: CACTUS
  {
    const { ox, oy } = paintNoiseTile(ctx, TEX.CACTUS_SIDE, '#187524', 14, 340);
    ctx.fillStyle = '#0e4a15';
    for (let x = 2; x < 16; x += 4) ctx.fillRect(ox + x, oy, 1, 16);
    ctx.fillStyle = '#d9e3a8';
    for (let y = 3; y < 15; y += 5) {
      ctx.fillRect(ox + 1, oy + y, 1, 1);
      ctx.fillRect(ox + 14, oy + y, 1, 1);
    }
    paintNoiseTile(ctx, TEX.CACTUS_TOP, '#22872f', 12, 350);
  }

  // 36: TORCH
  {
    const { ox, oy } = paintNoiseTile(ctx, TEX.TORCH, '#7a5a34', 10, 360);
    ctx.fillStyle = '#ffbb00';
    ctx.fillRect(ox + 6, oy + 2, 4, 4);
    ctx.fillStyle = '#ffff77';
    ctx.fillRect(ox + 7, oy + 3, 2, 2);
  }

  // 37..41: MINERAL BLOCKS & PLANKS & BRICKS
  paintNoiseTile(ctx, TEX.GOLD_BLOCK, '#f7d22a', 18, 370);
  paintNoiseTile(ctx, TEX.DIAMOND_BLOCK, '#4eedeb', 16, 380);
  paintNoiseTile(ctx, TEX.IRON_BLOCK, '#dedede', 12, 390);
  paintNoiseTile(ctx, TEX.SPRUCE_PLANKS, '#6e5031', 12, 400);
  {
    const { ox, oy } = paintNoiseTile(ctx, TEX.BRICKS, '#9e493c', 14, 410);
    ctx.fillStyle = '#b5ada1';
    for (let y = 3; y < 16; y += 4) {
      ctx.fillRect(ox, oy + y, 16, 1);
      const shift = (y / 4) % 2 === 0 ? 0 : 4;
      ctx.fillRect(ox + shift, oy + y - 3, 1, 3);
      ctx.fillRect(ox + shift + 8, oy + y - 3, 1, 3);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;

  // Also inject CSS stone button pattern & menu pixel icons
  injectMenuButtonGraphics(canvas);

  return { texture, canvas };
}

function injectMenuButtonGraphics(atlasCanvas) {
  // Stone button tile
  const c = document.createElement('canvas');
  c.width = 16;
  c.height = 16;
  const ctx = c.getContext('2d');
  const sx = (TEX.STONE % ATLAS_COLS) * 16;
  const sy = Math.floor(TEX.STONE / ATLAS_COLS) * 16;
  ctx.drawImage(atlasCanvas, sx, sy, 16, 16, 0, 0, 16, 16);
  document.documentElement.style.setProperty('--btn-stone-pattern', `url(${c.toDataURL()})`);

  // Speech bubble + Globe icon (Left icon button in Screenshot 2)
  const makePixelIcon = (pattern, pal) => {
    const ic = document.createElement('canvas');
    ic.width = 16;
    ic.height = 16;
    const ictx = ic.getContext('2d');
    for (let y = 0; y < pattern.length; y++) {
      for (let x = 0; x < pattern[y].length; x++) {
        const ch = pattern[y][x];
        if (ch !== '.' && pal[ch]) {
          ictx.fillStyle = pal[ch];
          ictx.fillRect(x, y, 1, 1);
        }
      }
    }
    return ic.toDataURL();
  };

  const globeEl = document.getElementById('icon-globe');
  if (globeEl) {
    globeEl.src = makePixelIcon([
      '...DDDDDDDDDD...',
      '..DWWWWWWWWWWd..',
      '.DWWBBBBBBBBWWd.',
      '.DWBBGGGBBGGWWd.',
      '.DWBGGGGGBGGGWD.',
      '.DWBBGGGBBBBBWD.',
      '.DWBBBBBBGGGBWD.',
      '.DWWBBBBGGGGBWd.',
      '.DWWBBBBBBBBWWd.',
      '..DWWWWWWWWWWd..',
      '...DDWWWWDDDD...',
      '..DWWD..........',
      '.DWWd...........',
      '.DDD............',
    ], { D: '#1b1b1b', d: '#555555', W: '#ffffff', B: '#3455d1', G: '#58b835' });
  }

  // Accessibility Person Icon (Right icon button in Screenshot 2)
  const a11yEl = document.getElementById('icon-a11y');
  if (a11yEl) {
    a11yEl.src = makePixelIcon([
      '.....DDDDDD.....',
      '.....DWWWWd.....',
      '.....DWDDWd.....',
      '.....DWWWWd.....',
      '.DDDDDDDDDDDDDD.',
      '.DWWWWWWWWWWWWd.',
      '.DDDDDDWWdDDDDD.',
      '.....DWWWWd.....',
      '.....DWWWWd.....',
      '.....DWWdWd.....',
      '.....DWWdWd.....',
      '.....DWWdWd.....',
      '.....DDDDDD.....',
    ], { D: '#1b1b1b', d: '#888888', W: '#ffffff' });
  }
}

export function getTileUV(tileIndex) {
  const col = tileIndex % ATLAS_COLS;
  const row = Math.floor(tileIndex / ATLAS_COLS);
  const pad = 0.0015;
  const u0 = (col + pad) / ATLAS_COLS;
  const u1 = (col + 1 - pad) / ATLAS_COLS;
  const v1 = 1 - (row + pad) / ATLAS_ROWS;
  const v0 = 1 - (row + 1 - pad) / ATLAS_ROWS;
  return [u0, v0, u1, v1];
}

export function buildCrackTextures() {
  const textures = [];
  for (let stage = 0; stage < 10; stage++) {
    const c = document.createElement('canvas');
    c.width = 16;
    c.height = 16;
    const ctx = c.getContext('2d');
    ctx.strokeStyle = 'rgba(15, 15, 15, 0.85)';
    ctx.lineWidth = 1;
    const rng = mulberry32(900);
    const branches = (stage + 1) * 2;
    for (let b = 0; b < branches; b++) {
      let x = 8;
      let y = 8;
      ctx.beginPath();
      ctx.moveTo(x, y);
      for (let s = 0; s < stage + 2; s++) {
        x += (rng() - 0.5) * 6;
        y += (rng() - 0.5) * 6;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(c);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    textures.push(tex);
  }
  return textures;
}

// Render Authentic "MINCERAFT" + "JAVA EDITION" Logo matching Screenshot 2!
export function renderMinceraftLogo(canvas) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // High-resolution pixel art letter patterns for M I N C E R A(Creeper) F T
  const letters = [
    // M
    [
      '111100001111',
      '111110011111',
      '111111111111',
      '111101101111',
      '111100001111',
      '111100001111',
      '111100001111',
      '111100001111',
      '111100001111',
    ],
    // I
    [
      '111111',
      '011110',
      '011110',
      '011110',
      '011110',
      '011110',
      '011110',
      '011110',
      '111111',
    ],
    // N
    [
      '1111000111',
      '1111100111',
      '1111110111',
      '1110111111',
      '1110011111',
      '1110001111',
      '1110001111',
      '1110001111',
      '1110001111',
    ],
    // C
    [
      '111111111',
      '111111111',
      '111100000',
      '111100000',
      '111100000',
      '111100000',
      '111100000',
      '111111111',
      '111111111',
    ],
    // E
    [
      '111111111',
      '111111111',
      '111100000',
      '111111100',
      '111111100',
      '111100000',
      '111100000',
      '111111111',
      '111111111',
    ],
    // R
    [
      '111111110',
      '111111111',
      '111100111',
      '111100111',
      '111111110',
      '111111100',
      '111101110',
      '111100111',
      '111100111',
    ],
    // A (With exact Creeper Face Cutout in center!)
    [
      '0111111110',
      '1111111111',
      '1110011001',
      '1110011001',
      '1111100111',
      '1111000011',
      '1111011011',
      '1111000011',
      '1111000011',
    ],
    // F
    [
      '111111111',
      '111111111',
      '111100000',
      '111111100',
      '111111100',
      '111100000',
      '111100000',
      '111100000',
      '111100000',
    ],
    // T
    [
      '1111111111',
      '1111111111',
      '0001111000',
      '0001111000',
      '0001111000',
      '0001111000',
      '0001111000',
      '0001111000',
      '0001111000',
    ],
  ];

  const px = 8;
  const gap = 6;
  const totalCols = letters.reduce((acc, l) => acc + l[0].length, 0);
  const totalW = totalCols * px + (letters.length - 1) * gap;
  const startX = Math.floor((canvas.width - totalW) / 2);
  const startY = 12;
  const centerX = canvas.width / 2;

  // 1. Draw perspective converging 3D extrusion & thick black outline
  for (let depth = 30; depth >= 0; depth--) {
    let curX = startX;
    for (let li = 0; li < letters.length; li++) {
      const grid = letters[li];
      const cols = grid[0].length;
      for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < cols; c++) {
          if (grid[r][c] !== '1') continue;
          const baseX = curX + c * px;
          const baseY = startY + r * (px + 2);
          // Perspective convergence toward center
          const pullX = ((centerX - baseX) / centerX) * (depth * 0.45);
          const x = Math.round(baseX + pullX);
          const y = Math.round(baseY + depth);

          if (depth > 0) {
            // Black outer border around 3D extrusion
            ctx.fillStyle = '#0c0c0c';
            ctx.fillRect(x - 4, y - 4, px + 8, px + 6);
            ctx.fillStyle = depth > 22 ? '#2c2c2c' : depth > 10 ? '#4d4d4d' : '#686868';
            ctx.fillRect(x, y, px, px + 2);
          } else {
            // Black outline around front face
            ctx.fillStyle = '#0c0c0c';
            ctx.fillRect(x - 4, y - 4, px + 8, px + 8);
          }
        }
      }
      curX += cols * px + gap;
    }
  }

  // 2. Draw Front Stone Face with Cracks & Highlights
  let curX = startX;
  for (let li = 0; li < letters.length; li++) {
    const grid = letters[li];
    const cols = grid[0].length;
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c] !== '1') continue;
        const x = curX + c * px;
        const y = startY + r * (px + 2);

        const shade = r < 2 ? '#e2e2e2' : r > 6 ? '#a0a0a0' : (c + r + li) % 3 === 0 ? '#c2c2c2' : '#d2d2d2';
        ctx.fillStyle = shade;
        ctx.fillRect(x, y, px, px + 2);

        // Top highlight bevel
        if (r === 0 || grid[r - 1][c] !== '1') {
          ctx.fillStyle = '#f5f5f5';
          ctx.fillRect(x, y, px, 3);
        }
        // Stone cracks
        if ((c === 2 && r === 3) || (c === 5 && r === 6)) {
          ctx.fillStyle = '#737373';
          ctx.fillRect(x + 2, y, 2, px);
        }
      }
    }
    curX += cols * px + gap;
  }

  // 3. Draw "JAVA EDITION" directly underneath in bold block letters (No gray box!)
  const subText = 'JAVA EDITION';
  ctx.font = 'bold 42px "VT323", monospace';
  ctx.textAlign = 'center';
  const sy = 152;
  // Thick 3D black shadow/extrusion
  ctx.fillStyle = '#111111';
  for (let dy = 0; dy <= 7; dy++) {
    for (let dx = -3; dx <= 3; dx++) {
      ctx.fillText(subText, centerX + dx, sy + dy);
    }
  }
  ctx.fillStyle = '#707070';
  ctx.fillText(subText, centerX, sy + 3);
  ctx.fillStyle = '#cccccc';
  ctx.fillText(subText, centerX, sy);
}

// =================== 6-FACE PROCEDURAL PIXEL-ART MOB & ARMOR SKIN BUILDER ===================
export function makePixelCanvasTexture(width, height, drawFn) {
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  drawFn(ctx, width, height);
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export function fillPixelNoise(ctx, w, h, baseHex, variance = 16, seed = 42) {
  const rng = mulberry32(seed);
  const [r, g, b] = hexToRgb(baseHex);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const d = (rng() - 0.5) * variance * 2;
      ctx.fillStyle = `rgb(${clampByte(r + d)},${clampByte(g + d)},${clampByte(b + d)})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }
}

// Create a 6-material array [Right, Left, Top, Bottom, Front, Back] for Three.js BoxGeometry
export function createBoxPixelMaterials(baseHex, variance, seed, facePainters = {}) {
  const faces = ['right', 'left', 'top', 'bottom', 'front', 'back'];
  return faces.map((f, i) => {
    const tex = makePixelCanvasTexture(8, 8, (ctx) => {
      fillPixelNoise(ctx, 8, 8, baseHex, variance, seed + i * 19);
      if (facePainters[f]) facePainters[f](ctx);
    });
    return new THREE.MeshLambertMaterial({ map: tex });
  });
}

// =================== 3D EXTRUDED PIXEL ITEM & BLOCK MESH GENERATOR ===================
const item3DCache = new Map();

export function create3DItemMesh(item, atlasTexture, atlasCanvas) {
  if (!item) return null;
  if (item3DCache.has(item.id)) {
    return item3DCache.get(item.id).clone();
  }

  let resultMesh;

  if (item.isBlock && item.faces) {
    // True 3D UV-mapped Block Mesh using the Texture Atlas!
    const geo = new THREE.BoxGeometry(0.42, 0.42, 0.42);
    const uvAttr = geo.attributes.uv;
    // BoxGeometry face order: +X (right), -X (left), +Y (top), -Y (bottom), +Z (front), -Z (back)
    const faceTiles = [
      item.faces.side,
      item.faces.side,
      item.faces.top,
      item.faces.bottom,
      item.faces.front ?? item.faces.side,
      item.faces.side,
    ];
    for (let f = 0; f < 6; f++) {
      const [u0, v0, u1, v1] = getTileUV(faceTiles[f]);
      const offset = f * 4;
      uvAttr.setXY(offset + 0, u0, v1);
      uvAttr.setXY(offset + 1, u1, v1);
      uvAttr.setXY(offset + 2, u0, v0);
      uvAttr.setXY(offset + 3, u1, v0);
    }
    uvAttr.needsUpdate = true;
    const mat = new THREE.MeshLambertMaterial({
      map: atlasTexture,
      transparent: Boolean(item.transparent),
    });
    resultMesh = new THREE.Mesh(geo, mat);
  } else {
    // Extrude every non-transparent pixel of the 16x16 sprite into a true 3D Minecraft Item Mesh!
    const grid = getItemPixelGrid(item);
    const group = new THREE.Group();
    const pxSize = 0.032;
    const depth = 0.045;
    const pos = [], norm = [], col = [], idx = [];

    const addQuad = (p0, p1, p2, p3, normal, rgb) => {
      const base = pos.length / 3;
      pos.push(...p0, ...p1, ...p2, ...p3);
      for (let k = 0; k < 4; k++) {
        norm.push(...normal);
        col.push(rgb[0] / 255, rgb[1] / 255, rgb[2] / 255);
      }
      idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
    };

    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const hex = grid[y][x];
        if (!hex) continue;
        const rgb = hexToRgb(hex);
        const sideRgb = rgb.map((c) => c * 0.8);

        const x0 = (x - 8) * pxSize;
        const x1 = (x - 7) * pxSize;
        const y0 = (7 - y) * pxSize;
        const y1 = (8 - y) * pxSize;
        const z0 = -depth / 2;
        const z1 = depth / 2;

        // Front (+Z) & Back (-Z)
        addQuad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1], rgb);
        addQuad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1], rgb);

        // Exposed pixel edges
        if (x === 0 || !grid[y][x - 1]) {
          addQuad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0], sideRgb);
        }
        if (x === 15 || !grid[y][x + 1]) {
          addQuad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [1, 0, 0], sideRgb);
        }
        if (y === 0 || !grid[y - 1][x]) {
          addQuad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], [0, 1, 0], sideRgb);
        }
        if (y === 15 || !grid[y + 1][x]) {
          addQuad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [0, -1, 0], sideRgb);
        }
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(norm, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    geo.setIndex(idx);
    const mat = new THREE.MeshLambertMaterial({ vertexColors: true });
    const mesh = new THREE.Mesh(geo, mat);
    group.add(mesh);
    resultMesh = group;
  }

  item3DCache.set(item.id, resultMesh);
  return resultMesh.clone();
}

// Icon Cache (Data URLs) for fast 2D UI slot rendering
const iconCache = new Map();

export function getItemIconDataURL(item, atlasCanvas) {
  if (!item) return '';
  if (iconCache.has(item.id)) return iconCache.get(item.id);

  const c = document.createElement('canvas');
  c.width = 32;
  c.height = 32;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  if (item.isBlock && item.faces) {
    const topTile = item.faces.top;
    const leftTile = item.faces.front || item.faces.side;
    const rightTile = item.faces.side;

    const drawTilePart = (tileIdx, brightness) => {
      const tmp = document.createElement('canvas');
      tmp.width = 16;
      tmp.height = 16;
      const tctx = tmp.getContext('2d');
      const sx = (tileIdx % ATLAS_COLS) * 16;
      const sy = Math.floor(tileIdx / ATLAS_COLS) * 16;
      tctx.drawImage(atlasCanvas, sx, sy, 16, 16, 0, 0, 16, 16);
      if (brightness < 1) {
        tctx.fillStyle = `rgba(0,0,0,${1 - brightness})`;
        tctx.fillRect(0, 0, 16, 16);
      }
      return tmp;
    };

    const topImg = drawTilePart(topTile, 1.0);
    const leftImg = drawTilePart(leftTile, 0.82);
    const rightImg = drawTilePart(rightTile, 0.65);

    ctx.save();
    ctx.translate(16, 3);
    ctx.transform(0.8, 0.4, -0.8, 0.4, 0, 0);
    ctx.drawImage(topImg, 0, 0, 16, 16);
    ctx.restore();

    ctx.save();
    ctx.translate(3.2, 9.4);
    ctx.transform(0.8, 0.4, 0, 0.9, 0, 0);
    ctx.drawImage(leftImg, 0, 0, 16, 16);
    ctx.restore();

    ctx.save();
    ctx.translate(16, 15.8);
    ctx.transform(0.8, -0.4, 0, 0.9, 0, 0);
    ctx.drawImage(rightImg, 0, 0, 16, 16);
    ctx.restore();
  } else {
    const grid = getItemPixelGrid(item);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        if (grid[y][x]) {
          ctx.fillStyle = grid[y][x];
          ctx.fillRect(x * 2, y * 2, 2, 2);
        }
      }
    }
  }

  const url = c.toDataURL();
  iconCache.set(item.id, url);
  return url;
}

function getTierPalette(tier) {
  switch (tier) {
    case 'wood': return { M: '#a2824e', L: '#c29d61', D: '#5e4726', S: '#785a32', H: '#47341a' };
    case 'stone': return { M: '#8a8a8a', L: '#b0b0b0', D: '#4a4a4a', S: '#785a32', H: '#47341a' };
    case 'iron': return { M: '#d8d8d8', L: '#ffffff', D: '#727272', S: '#785a32', H: '#47341a' };
    case 'gold': return { M: '#fcee4b', L: '#ffffb5', D: '#b88c14', S: '#785a32', H: '#47341a' };
    case 'diamond': return { M: '#4eedeb', L: '#b8faff', D: '#1b858c', S: '#785a32', H: '#47341a' };
    default: return { M: '#d8d8d8', L: '#ffffff', D: '#727272', S: '#785a32', H: '#47341a' };
  }
}

function patternToGrid(pattern, palette) {
  const grid = Array.from({ length: 16 }, () => new Array(16).fill(null));
  for (let y = 0; y < Math.min(16, pattern.length); y++) {
    const row = pattern[y];
    for (let x = 0; x < Math.min(16, row.length); x++) {
      const ch = row[x];
      if (ch !== '.' && palette[ch]) {
        grid[y][x] = palette[ch];
      }
    }
  }
  return grid;
}

export function getItemPixelGrid(item) {
  const pal = getTierPalette(item.tier);

  if (item.toolType === 'pickaxe') {
    return patternToGrid([
      '................',
      '.........DDDD...',
      '........DLLMMD..',
      '.......DLMDDDMD.',
      '........DDD.DDMD',
      '.........SHD.DMD',
      '........SH..DMD.',
      '.......SH...DD..',
      '......SH........',
      '.....SH.........',
      '....SH..........',
      '...SH...........',
      '..SH............',
      '.SH.............',
      '.H..............',
      '................',
    ], pal);
  }

  if (item.toolType === 'axe') {
    return patternToGrid([
      '................',
      '.......DDD......',
      '......DLLMD.....',
      '.....DLLMMMD....',
      '.....DLMMDSHD...',
      '......DDDSH.D...',
      '........SH......',
      '.......SH.......',
      '......SH........',
      '.....SH.........',
      '....SH..........',
      '...SH...........',
      '..SH............',
      '.SH.............',
      '.H..............',
      '................',
    ], pal);
  }

  if (item.toolType === 'sword') {
    return patternToGrid([
      '.............DDD',
      '............DLLD',
      '...........DLLMD',
      '..........DLLMD.',
      '.........DLLMD..',
      '........DLLMD...',
      '.......DLLMD....',
      '......DLLMD.....',
      '...DD.DLMD......',
      '....DDDMD.......',
      '.....DDD........',
      '....SHD.........',
      '...SH..D........',
      '..SH............',
      '.DD.............',
      '................',
    ], pal);
  }

  if (item.toolType === 'shovel') {
    return patternToGrid([
      '................',
      '..........DDDD..',
      '.........DLLMMD.',
      '.........DLMmMD.',
      '.........DMMMD..',
      '.........DSHD...',
      '........SHD.....',
      '.......SH.......',
      '......SH........',
      '.....SH.........',
      '....SH..........',
      '...SH...........',
      '..SH............',
      '.SH.............',
      '.H..............',
      '................',
    ], { ...pal, m: pal.M });
  }

  if (item.armorSlot === 'helmet') {
    return patternToGrid([
      '................',
      '....DDDDDDDD....',
      '...DLLLLLLMMD...',
      '..DLLMMMMMMMMD..',
      '..DLMDDDDDDMMD..',
      '..DLMD....DMMD..',
      '..DLMD....DMMD..',
      '..DDDD....DDDD..',
    ], pal);
  }

  if (item.armorSlot === 'chestplate') {
    return patternToGrid([
      '................',
      '..DDDD....DDDD..',
      '.DLLMMD..DLLMMD.',
      '.DLMMDDDDDDLMMD.',
      '.DLMMMMMMMMMMMD.',
      '..DDDMMMMMMDDD..',
      '....DLMMMMMD....',
      '....DLMMMMMD....',
      '....DLMMMMMD....',
      '....DDDDDDDD....',
    ], pal);
  }

  if (item.armorSlot === 'leggings') {
    return patternToGrid([
      '................',
      '....DDDDDDDD....',
      '...DLLMMMMMMD...',
      '...DLMMMMMMMD...',
      '...DLMMDDDDMD...',
      '...DLMD..DLMD...',
      '...DLMD..DLMD...',
      '...DLMD..DLMD...',
      '...DLMD..DLMD...',
      '...DDDD..DDDD...',
    ], pal);
  }

  if (item.armorSlot === 'boots') {
    return patternToGrid([
      '................',
      '................',
      '................',
      '...DDDD..DDDD...',
      '...DLMD..DLMD...',
      '...DLMD..DLMD...',
      '..DLLMD.DLLMD...',
      '..DDDDD.DDDDD...',
    ], pal);
  }

  switch (item.id) {
    case 'apple':
      return patternToGrid([
        '.......GG.......',
        '......Ggg.......',
        '....DDDDDDD.....',
        '...DRRRRRRRD....',
        '..DRRLLRRRRRD...',
        '..DRLLRRRRRRD...',
        '..DRRRRRRRRRD...',
        '..DRRRRRRRRRD...',
        '...DRRRRRRRD....',
        '....DDDRDDD.....',
      ], { D: '#3d0808', R: '#d92121', L: '#ff8a8a', G: '#2f6e1c', g: '#53b835' });
    case 'carrot':
      return patternToGrid([
        '..........GG.G..',
        '.........GggGg..',
        '........DDDDG...',
        '.......DOOOOD...',
        '......DOLLOOOD..',
        '.....DOOOOOOD...',
        '....DOOOOOOD....',
        '...DOOOOOD......',
        '..DOOOOD........',
        '.DOOOD..........',
        '.DDD............',
      ], { D: '#5c2804', O: '#f07613', L: '#ffad54', G: '#246614', g: '#52bd33' });
    case 'bread':
      return patternToGrid([
        '................',
        '.....DDDDDD.....',
        '...DDLLLLLLDD...',
        '..DLLBBBBBBLLD..',
        '.DLBBBBBBBBBBMD.',
        '.DMBBBBBBBBBBMD.',
        '..DMMMMMMMMMMD..',
        '...DDDDDDDDDD...',
      ], { D: '#4a2f0d', L: '#e8b658', B: '#c78c30', M: '#966318' });
    case 'raw_beef':
    case 'cooked_beef': {
      const cooked = item.id === 'cooked_beef';
      return patternToGrid([
        '....DDDDDDD.....',
        '..DDRRRRRRRDD...',
        '.DRRRWWWRRRRRD..',
        '.DRRWWWRRRRRRD..',
        '.DRRRRRRRRRRRD..',
        '..DDRRRRRRRDD...',
        '....DDDDDDD.....',
      ], {
        D: cooked ? '#361c0b' : '#4a1010',
        R: cooked ? '#7d4622' : '#c93434',
        W: cooked ? '#bfa182' : '#f2dede',
      });
    }
    case 'stick':
      return patternToGrid([
        '............DD..',
        '...........DSHD.',
        '..........DSHD..',
        '.........DSHD...',
        '........DSHD....',
        '.......DSHD.....',
        '......DSHD......',
        '.....DSHD.......',
        '....DSHD........',
        '...DSHD.........',
        '..DDDD..........',
      ], pal);
    case 'bow':
      return patternToGrid([
        '......DDD.......',
        '....DD..WS......',
        '...D.....WS.....',
        '..D.......WS....',
        '.D.........WS...',
        '.D.........WS...',
        '.D.........WS...',
        '..D.......WS....',
        '...D.....WS.....',
        '....DD..WS......',
        '......DDD.......',
      ], { D: '#cccccc', W: '#8a6236', S: '#473017' });
    case 'arrow':
      return patternToGrid([
        '...........DDD..',
        '..........DIIID.',
        '...........DIIID',
        '.........SS.DID.',
        '........SS...D..',
        '.......SS.......',
        '......SS........',
        '.....SS.........',
        '...FF...........',
        '..FFF...........',
        '..FF............',
      ], { D: '#333333', I: '#dcdcdc', S: '#8a6236', F: '#ffffff' });
    case 'shield':
      return patternToGrid([
        '..IIIIIIIIIIII..',
        '..IWWWWWWWWWWi..',
        '..IWWIIWWIIWWi..',
        '..IWWWWWWWWWWi..',
        '..IWWWWWWWWWWi..',
        '..IWWIIWWIIWWi..',
        '...IWWWWWWWWi...',
        '...IWWWWWWWWi...',
        '....IWWWWWWi....',
        '.....IIIIII.....',
      ], { I: '#a0a0a0', i: '#595959', W: '#9c713e' });
    case 'bucket':
    case 'water_bucket':
    case 'lava_bucket': {
      const fill = item.id === 'water_bucket' ? '#2c75ff' : item.id === 'lava_bucket' ? '#ff5500' : '#4a4a4a';
      return patternToGrid([
        '....DDDDDDDD....',
        '..DDFFFFFFFFDD..',
        '.DFFFFFFFFFFFFD.',
        '.DILLLLLLLLLLID.',
        '..DILLLLLLLLID..',
        '..DIIIIIIIIIID..',
        '...DIIIIIIIID...',
        '....DDDDDDDD....',
      ], { D: '#383838', I: '#a8a8a8', L: '#dedede', F: fill });
    }
    case 'coal':
      return patternToGrid([
        '.....DDDDD......',
        '...DDCCCCCd.....',
        '..DCCLLLLCCd....',
        '..DCCCCCCCCd....',
        '...dCCCCCCd.....',
        '....dddddd......',
      ], { D: '#111111', d: '#080808', C: '#2b2b2b', L: '#4f4f4f' });
    case 'iron_ingot':
    case 'gold_ingot': {
      const gold = item.id === 'gold_ingot';
      return patternToGrid([
        '................',
        '.....DDDDDDD....',
        '...DDLLLLLLLDD..',
        '..DLLMMMMMMMLLD.',
        '..DMMMMMMMMMMMD.',
        '...DDDDDDDDDDD..',
      ], {
        D: gold ? '#7a5805' : '#4f4f4f',
        M: gold ? '#f5c722' : '#bdbdbd',
        L: gold ? '#ffffa8' : '#ffffff',
      });
    }
    case 'diamond':
      return patternToGrid([
        '.....DDDDDD.....',
        '...DDLLLLLLDD...',
        '..DLLMMMMMMLLD..',
        '..DMMMMMMMMMMD..',
        '...DMMMMMMMMD...',
        '....DMMMMMMD....',
        '.....DDDDDD.....',
      ], { D: '#126369', M: '#38e4eb', L: '#b8ffff' });
    default:
      return patternToGrid([
        '....DDDDDDDD....',
        '...DLLLLLLLLD...',
        '...DLMMMMMMLD...',
        '...DLMMMMMMLD...',
        '...DDDDDDDDDD...',
      ], pal);
  }
}

export function buildHudIcons() {
  const make = (pattern, pal) => {
    const c = document.createElement('canvas');
    c.width = 18;
    c.height = 18;
    const ctx = c.getContext('2d');
    for (let y = 0; y < pattern.length; y++) {
      for (let x = 0; x < pattern[y].length; x++) {
        const ch = pattern[y][x];
        if (ch !== '.' && pal[ch]) {
          ctx.fillStyle = pal[ch];
          ctx.fillRect(x * 2, y * 2, 2, 2);
        }
      }
    }
    return c.toDataURL();
  };

  const heartShape = [
    '.DD...DD.',
    'DRRD.DRRD',
    'DRLLDRRRD',
    'DRRRRRRRD',
    '.DRRRRRD.',
    '..DRRRD..',
    '...DRD...',
    '....D....',
  ];

  const heartHalfShape = [
    '.DD...DD.',
    'DRRD.D..D',
    'DRLLD...D',
    'DRRRD..D.',
    '.DRRD.D..',
    '..DRDD...',
    '...DD....',
    '....D....',
  ];

  const hungerShape = [
    '....DDD..',
    '...DMMMD.',
    '..DMMMMMD',
    '..DMMMMMD',
    '...DMMMD.',
    '..BBDDD..',
    '.B..B....',
    '.BB......',
  ];

  const armorShape = [
    '.DD...DD.',
    'DIID.DIID',
    'DIIIDIIID',
    '.DIIIIID.',
    '.DIIIIID.',
    '..DIIID..',
    '...DDD...',
  ];

  const bubbleShape = [
    '..DDDD...',
    '.DBLLBD..',
    'DBL..BBD.',
    'DB....BD.',
    'DB....BD.',
    '.DBBBBD..',
    '..DDDD...',
  ];

  // Also build exact pixel-art empty slot silhouettes for Armor & Shield (Image 2!)
  const slotSil = { D: '#4a4a4a', L: '#696969' };

  return {
    heartFull: make(heartShape, { D: '#1a0000', R: '#e61919', L: '#ff9999' }),
    heartHalf: make(heartHalfShape, { D: '#1a0000', R: '#e61919', L: '#ff9999' }),
    heartEmpty: make(heartShape, { D: '#222222', R: '#3d3d3d', L: '#4d4d4d' }),
    hungerFull: make(hungerShape, { D: '#2b1204', M: '#b86225', B: '#e8dec8' }),
    hungerEmpty: make(hungerShape, { D: '#222222', M: '#3a3a3a', B: '#555555' }),
    armorFull: make(armorShape, { D: '#222222', I: '#d8d8ef' }),
    armorEmpty: make(armorShape, { D: '#222222', I: '#444444' }),
    bubble: make(bubbleShape, { D: '#0e3c75', B: '#3fa2ff', L: '#d6f0ff' }),
    silHelmet: make([
      '..DDDDD..',
      '.DLLLLLD.',
      'DLLDDDFFD',
      'DLD...DLD',
      'DD.....DD',
    ], { D: '#373737', L: '#6e6e6e', F: '#555555' }),
    silChest: make([
      'DDD...DDD',
      'DLLDDDLLD',
      'DLLLLLLLD',
      '.DLLLLLD.',
      '.DLLLLLD.',
      '.DDDDDDD.',
    ], slotSil),
    silLegs: make([
      '.DDDDDDD.',
      '.DLLLLLD.',
      '.DLLDDLD.',
      '.DLD.DLD.',
      '.DLD.DLD.',
      '.DDD.DDD.',
    ], slotSil),
    silBoots: make([
      '.........',
      '.DDD.DDD.',
      '.DLD.DLD.',
      'DLLD.DLLD',
      'DDDD.DDDD',
    ], slotSil),
    silShield: make([
      '.DDDDDDD.',
      '.DLLLLLD.',
      '.DLLLLLD.',
      '.DLLLLLD.',
      '..DLLLD..',
      '...DDD...',
    ], slotSil),
  };
}
