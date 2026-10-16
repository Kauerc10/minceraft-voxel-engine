// Main Game Controller: Real Survival Progression, 3D Extruded Items, 6-Face Pixel Mobs, Advancements, Creative Flight & Panorama
import * as THREE from 'three';
import {
  buildTextureAtlas,
  buildCrackTextures,
  renderMinceraftLogo,
  getItemIconDataURL,
  buildHudIcons,
  create3DItemMesh,
  createBoxPixelMaterials,
} from './textures.js';
import {
  BLOCK,
  ITEMS,
  BLOCK_BY_ID,
  CRAFTING_RECIPES,
  SMELTING_RECIPES,
  createStack,
} from './items.js';
import { VoxelWorld, SEA_LEVEL } from './world.js';
import { MobEntity, PlayerPreviewRenderer } from './entities.js';
import { sound } from './audio.js';

// =================== INITIALIZATION ===================
const canvas = document.getElementById('game-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xd96b2b);
scene.fog = new THREE.FogExp2(0xd96b2b, 0.014);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 180);
scene.add(camera);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.72);
const sunLight = new THREE.DirectionalLight(0xfff0dd, 0.88);
sunLight.position.set(45, 80, -55);
scene.add(ambientLight, sunLight);

// Sky Sun, Moon & 3D Voxel Clouds
const skyGroup = new THREE.Group();
scene.add(skyGroup);

const sunMesh = new THREE.Mesh(
  new THREE.BoxGeometry(14, 14, 14),
  new THREE.MeshBasicMaterial({ color: 0xfff3a1 })
);
sunMesh.position.set(0, 18, -110);
skyGroup.add(sunMesh);

const cloudGroup = new THREE.Group();
const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.72 });
for (let i = 0; i < 18; i++) {
  const cw = 8 + (i % 4) * 5;
  const cd = 6 + (i % 3) * 4;
  const cm = new THREE.Mesh(new THREE.BoxGeometry(cw, 1.5, cd), cloudMat);
  cm.position.set(((i * 23) % 120) - 60, 48 + (i % 2) * 2, ((i * 37) % 120) - 60);
  cloudGroup.add(cm);
}
scene.add(cloudGroup);

// Build procedural textures & icons
const { texture: atlasTexture, canvas: atlasCanvas } = buildTextureAtlas();
const crackTextures = buildCrackTextures();
const hudIcons = buildHudIcons();
renderMinceraftLogo(document.getElementById('logo-canvas'));

const SPLASHES = [
  'It came from space.',
  '100% Procedural Voxel!',
  'Also try Terraria!',
  'Creeper? Aww man!',
  'Water + Lava = Obsidian!',
  'Made with Argon Engine!',
];
let splashIdx = 0;
setInterval(() => {
  splashIdx = (splashIdx + 1) % SPLASHES.length;
  const el = document.getElementById('splash-text');
  if (el) el.textContent = SPLASHES[splashIdx];
}, 5000);

// World Instance
let worldSeed = 'cherry-valley-1201';
let world = new VoxelWorld(scene, atlasTexture, worldSeed);
let renderDistance = 4;

// Block selection wireframe + crack overlay box
const wireGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.006, 1.006, 1.006));
const wireMat = new THREE.LineBasicMaterial({ color: 0x000000 });
const targetWireframe = new THREE.LineSegments(wireGeo, wireMat);
targetWireframe.visible = false;
scene.add(targetWireframe);

const crackMat = new THREE.MeshBasicMaterial({
  map: crackTextures[0],
  transparent: true,
  depthWrite: false,
  polygonOffset: true,
  polygonOffsetFactor: -2,
});
const crackMesh = new THREE.Mesh(new THREE.BoxGeometry(1.01, 1.01, 1.01), crackMat);
crackMesh.visible = false;
scene.add(crackMesh);

// =================== FIRST-PERSON 3D HAND, HELD ITEM & SHIELD ===================
const fpGroup = new THREE.Group();
fpGroup.visible = false; // Hidden on Title Screen!
camera.add(fpGroup);

const fpRightArm = new THREE.Group();
fpRightArm.position.set(0.46, -0.38, -0.62);
fpGroup.add(fpRightArm);

// Pixel-textured bare Steve arm when hand is empty
const fpBareArmMesh = new THREE.Mesh(
  new THREE.BoxGeometry(0.22, 0.65, 0.22),
  createBoxPixelMaterials('#d4a37b', 14, 801, {
    top: (ctx) => { ctx.fillStyle = '#141414'; ctx.fillRect(0, 0, 8, 8); },
  })
);
fpBareArmMesh.rotation.x = -Math.PI / 3;
fpRightArm.add(fpBareArmMesh);

// Anchor for 3D extruded tools/items or 3D blocks in first-person
const fpItemAnchor = new THREE.Group();
fpRightArm.add(fpItemAnchor);
let lastFpHeldId = '__init__';

const fpShieldMesh = new THREE.Mesh(
  new THREE.BoxGeometry(0.06, 0.46, 0.3),
  createBoxPixelMaterials('#8a6236', 16, 802, {
    right: (ctx) => {
      ctx.strokeStyle = '#b8b8b8';
      ctx.strokeRect(0.5, 0.5, 7, 7);
    }
  })
);
fpShieldMesh.position.set(-0.48, -0.36, -0.58);
fpShieldMesh.rotation.y = 0.35;
fpShieldMesh.visible = false;
fpGroup.add(fpShieldMesh);

// =================== PLAYER STATE & PROGRESSION ===================
const player = {
  pos: new THREE.Vector3(0.5, 32, 0.5),
  vel: new THREE.Vector3(0, 0, 0),
  yaw: 0.4,
  pitch: -0.15,
  width: 0.6,
  height: 1.75,
  eyeHeight: 1.58,
  onGround: false,
  flying: false,
  lastSpaceTime: 0,
  fallStartY: null,
  hp: 20,
  maxHp: 20,
  hunger: 20,
  maxHunger: 20,
  hungerTimer: 0,
  air: 10,
  maxAir: 10,
  xp: 0,
  level: 0,
  gameMode: 'survival', // 'survival' | 'creative' | 'equipped'
  selectedSlot: 0,
  swingTimer: 0,
  bowCharge: 0,
  isBlocking: false,
  hurtCooldown: 0,
  stepAccum: 0,
};

const hotbar = new Array(9).fill(null);
const mainInv = new Array(27).fill(null);
const armorSlots = [null, null, null, null];
let offhandSlot = null;

let isCrafting3x3 = false;
let isFurnaceOpen = false;
let activeDrawerTab = 'recipes'; // 'recipes' or 'creative'
const craftGrid = new Array(9).fill(null);
let craftOutput = null;

const furnaceState = {
  input: null,
  fuel: null,
  output: null,
  burnTime: 0,
  cookProgress: 0,
};

let cursorStack = null;
let mouseScreen = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

// Advancements & Progression Tracker
const unlockedAdvancements = new Set();

function unlockAdvancement(key, title, iconItemId) {
  if (unlockedAdvancements.has(key)) return;
  unlockedAdvancements.add(key);
  sound.xpOrb();

  const toast = document.getElementById('advancement-toast');
  const iconEl = document.getElementById('adv-icon');
  const textEl = document.getElementById('adv-text');
  if (ITEMS[iconItemId]) {
    iconEl.src = getItemIconDataURL(ITEMS[iconItemId], atlasCanvas);
  }
  textEl.textContent = title;
  toast.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove('show'), 4000);
  updateQuestTracker();
}

function updateQuestTracker() {
  const el = document.getElementById('quest-step');
  if (!el) return;
  if (player.gameMode === 'creative') {
    el.textContent = 'Modo Criativo: 2x Espaço para Voar! Pressione [E] para pegar qualquer bloco/item.';
    return;
  }
  if (!unlockedAdvancements.has('wood')) {
    el.textContent = '1. Quebre um tronco de árvore segurando Click Esq';
  } else if (!unlockedAdvancements.has('planks')) {
    el.textContent = '2. Pressione [E], coloque o Tronco no Grid 2x2 e faça Tábuas';
  } else if (!unlockedAdvancements.has('table')) {
    el.textContent = '3. Crie Gravetos (2 Tábuas) e uma Bancada de Trabalho (4 Tábuas)';
  } else if (!unlockedAdvancements.has('pickaxe')) {
    el.textContent = '4. Coloque a Bancada no chão (Click Dir), abra-a e faça uma Picareta de Madeira';
  } else if (!unlockedAdvancements.has('stone')) {
    el.textContent = '5. Minere Pedra e Carvão com sua Picareta para entrar na Idade da Pedra!';
  } else if (!unlockedAdvancements.has('iron')) {
    el.textContent = '6. Crie uma Fornalha (8 Pedregulhos) e funda Minério de Ferro!';
  } else {
    el.textContent = '7. Explore cavernas em busca de Diamantes, use Baldes de Água/Lava e derrote Mobs!';
  }
}

function clearInventory() {
  hotbar.fill(null);
  mainInv.fill(null);
  armorSlots.fill(null);
  offhandSlot = null;
}

// Optional 1-click loader for the exact kit from Image 3!
function loadScreenshot3Kit() {
  clearInventory();
  armorSlots[0] = createStack('diamond_helmet', 1);
  armorSlots[1] = createStack('diamond_chestplate', 1);
  armorSlots[2] = null;
  armorSlots[3] = createStack('iron_boots', 1, 165);
  offhandSlot = createStack('shield', 1);

  hotbar[0] = createStack('diamond_axe', 1);
  hotbar[1] = createStack('diamond_pickaxe', 1);
  hotbar[2] = createStack('iron_pickaxe', 1, 180);
  hotbar[3] = createStack('diamond_sword', 1);
  hotbar[4] = createStack('water_bucket', 1);
  hotbar[5] = createStack('lava_bucket', 1);
  hotbar[6] = createStack('oak_planks', 58);
  hotbar[7] = createStack('torch', 12);
  hotbar[8] = createStack('bread', 31);

  mainInv[0] = createStack('carrot', 32);
  mainInv[1] = createStack('raw_beef', 20);
  mainInv[2] = createStack('apple', 7);
  mainInv[3] = createStack('cooked_beef', 12);
  mainInv[4] = createStack('cherry_leaves', 21);
  mainInv[5] = createStack('diamond', 15);
  mainInv[6] = createStack('gold_ingot', 16);
  mainInv[7] = createStack('tnt', 16);
  mainInv[8] = createStack('obsidian', 16);

  mainInv[9] = createStack('dirt', 64);
  mainInv[10] = createStack('sand', 15);
  mainInv[11] = createStack('iron_ingot', 24);
  mainInv[12] = createStack('crafting_table', 2);
  mainInv[13] = createStack('furnace', 2);
  mainInv[14] = createStack('stone_pickaxe', 1);
  mainInv[15] = createStack('iron_shovel', 1);
  mainInv[16] = createStack('iron_leggings', 1);
  mainInv[17] = createStack('diamond_leggings', 1);

  mainInv[18] = createStack('bow', 1, 310);
  mainInv[19] = createStack('cobblestone', 54);
  mainInv[20] = createStack('glass', 24);
  mainInv[22] = createStack('stick', 56);
  mainInv[23] = createStack('stick', 64);
  mainInv[24] = createStack('bucket', 2);
  mainInv[25] = createStack('arrow', 48);
  mainInv[26] = createStack('coal', 34);

  player.level = 7;
  renderAllInventoryUI();
  showActionLabel('Kit da Foto 3 Equipado!');
}

// =================== MOBS, 3D DROPPED ITEMS, XP ORBS & ARROWS ===================
const mobs = [];
const droppedItems = [];
const xpOrbs = [];
const arrows = [];

function spawnMob(type, x, z) {
  const y = world.getSurfaceHeight(x, z) + 1.1;
  if (y <= SEA_LEVEL + 0.5) return;
  const mob = new MobEntity(type, x, y, z, atlasTexture, atlasCanvas);
  scene.add(mob.group);
  mobs.push(mob);
}

function populateInitialMobs() {
  for (const m of mobs) scene.remove(m.group);
  mobs.length = 0;

  const types = ['cow', 'pig', 'sheep', 'zombie', 'skeleton', 'creeper'];
  for (let i = 0; i < 18; i++) {
    const angle = (i / 18) * Math.PI * 2;
    const dist = 12 + (i % 4) * 5; // Keep away from title panorama camera
    const mx = Math.cos(angle) * dist;
    const mz = Math.sin(angle) * dist;
    spawnMob(types[i % types.length], mx, mz);
  }
}

// Spawn True 3D Extruded Item or 3D UV Block on the Ground!
function spawnItemDrop(x, y, z, itemId, count = 1, throwVel = null) {
  const def = ITEMS[itemId];
  if (!def) return;

  const holder = new THREE.Group();
  const mesh3d = create3DItemMesh(def, atlasTexture, atlasCanvas);
  if (mesh3d) {
    mesh3d.scale.set(0.75, 0.75, 0.75);
    holder.add(mesh3d);
  }
  holder.position.set(x, y, z);
  scene.add(holder);

  const vel = throwVel || new THREE.Vector3(
    (Math.random() - 0.5) * 3.0,
    4.0,
    (Math.random() - 0.5) * 3.0
  );

  droppedItems.push({
    mesh: holder,
    id: itemId,
    count,
    vel,
    pickupDelay: throwVel ? 1.1 : 0.35,
    age: 0,
  });
}

function spawnXpOrbs(x, y, z, count = 3) {
  for (let i = 0; i < count; i++) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.18, 0.18),
      new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? 0x76ff03 : 0xffea00 })
    );
    mesh.position.set(x + (Math.random() - 0.5) * 0.5, y + 0.3, z + (Math.random() - 0.5) * 0.5);
    scene.add(mesh);
    xpOrbs.push({
      mesh,
      vel: new THREE.Vector3((Math.random() - 0.5) * 2.5, 3.5, (Math.random() - 0.5) * 2.5),
      value: 4,
    });
  }
}

function shootArrow(origin, dir, fromPlayer = true, power = 1.0) {
  sound.shootBow();
  const mesh = create3DItemMesh(ITEMS.arrow, atlasTexture, atlasCanvas) || new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.1, 0.55),
    new THREE.MeshLambertMaterial({ color: 0xdfd6c7 })
  );
  mesh.position.copy(origin);
  mesh.lookAt(origin.clone().add(dir));
  scene.add(mesh);

  arrows.push({
    mesh,
    vel: dir.clone().multiplyScalar(23 * power),
    fromPlayer,
    age: 0,
    stuck: false,
  });
}

// =================== INVENTORY MANAGEMENT & UI (Images 2 & 3) ===================
const playerPreview = new PlayerPreviewRenderer(
  document.getElementById('player-preview-canvas'),
  atlasTexture,
  atlasCanvas
);

function checkProgressionForItem(itemId) {
  if (itemId === 'oak_log' || itemId === 'cherry_log') {
    unlockAdvancement('wood', 'Getting Wood!', itemId);
  } else if (itemId === 'oak_planks') {
    unlockAdvancement('planks', 'Planks & Carpentry!', 'oak_planks');
  } else if (itemId === 'crafting_table') {
    unlockAdvancement('table', 'Benchmarking (3x3)!', 'crafting_table');
  } else if (itemId === 'wooden_pickaxe') {
    unlockAdvancement('pickaxe', 'Time to Mine!', 'wooden_pickaxe');
  } else if (itemId === 'cobblestone') {
    unlockAdvancement('stone', 'Stone Age!', 'cobblestone');
  } else if (itemId === 'iron_ingot') {
    unlockAdvancement('iron', 'Acquire Hardware!', 'iron_ingot');
  } else if (itemId === 'diamond') {
    unlockAdvancement('diamond', 'DIAMONDS!', 'diamond');
  }
}

function addItemToInventory(itemId, count = 1) {
  const def = ITEMS[itemId];
  if (!def) return false;
  checkProgressionForItem(itemId);

  const maxStack = def.maxStack || 64;

  if (maxStack > 1) {
    for (const arr of [hotbar, mainInv]) {
      for (let i = 0; i < arr.length; i++) {
        const s = arr[i];
        if (s && s.id === itemId && s.count < maxStack) {
          const add = Math.min(count, maxStack - s.count);
          s.count += add;
          count -= add;
          if (count <= 0) {
            renderAllInventoryUI();
            return true;
          }
        }
      }
    }
  }

  for (const arr of [hotbar, mainInv]) {
    for (let i = 0; i < arr.length; i++) {
      if (!arr[i]) {
        const add = Math.min(count, maxStack);
        arr[i] = createStack(itemId, add);
        count -= add;
        if (count <= 0) {
          renderAllInventoryUI();
          return true;
        }
      }
    }
  }
  renderAllInventoryUI();
  return count === 0;
}

function getDefensePoints() {
  let total = 0;
  for (const s of armorSlots) {
    if (s && ITEMS[s.id]?.defense) total += ITEMS[s.id].defense;
  }
  return Math.min(20, total);
}

function damagePlayer(rawAmount, sourceName = 'Mundo') {
  if (player.gameMode === 'creative' || player.hurtCooldown > 0 || player.hp <= 0) return;

  let amount = rawAmount;
  if (player.isBlocking && offhandSlot && ITEMS[offhandSlot.id]?.isShield) {
    amount *= 0.25;
    sound.blockPlace();
  }

  const def = getDefensePoints();
  amount = Math.max(0.5, amount * (1 - def * 0.035));

  player.hp = Math.max(0, player.hp - amount);
  player.hurtCooldown = 0.55;
  sound.playerHurt();

  const tint = document.getElementById('screen-tint');
  tint.style.background = 'rgba(220, 20, 20, 0.42)';
  setTimeout(() => {
    tint.style.background = 'transparent';
  }, 180);

  updateHudBars();

  if (player.hp <= 0) {
    document.exitPointerLock?.();
    document.getElementById('death-reason').textContent = `Você morreu (${sourceName})`;
    document.getElementById('death-screen').classList.remove('hidden');
  }
}

function updateHudBars() {
  const armorEl = document.getElementById('armor-bar');
  armorEl.innerHTML = '';
  const def = getDefensePoints();
  if (def > 0) {
    for (let i = 0; i < 10; i++) {
      const img = document.createElement('img');
      img.className = 'stat-icon';
      img.src = (i + 1) * 2 <= def ? hudIcons.armorFull : hudIcons.armorEmpty;
      armorEl.appendChild(img);
    }
  }

  const airEl = document.getElementById('air-bar');
  airEl.innerHTML = '';
  if (player.air < player.maxAir) {
    const bubbles = Math.ceil(player.air);
    for (let i = 0; i < bubbles; i++) {
      const img = document.createElement('img');
      img.className = 'stat-icon';
      img.src = hudIcons.bubble;
      airEl.appendChild(img);
    }
  }

  const hpEl = document.getElementById('health-bar');
  hpEl.innerHTML = '';
  for (let i = 0; i < 10; i++) {
    const img = document.createElement('img');
    img.className = 'stat-icon';
    const heartVal = (i + 1) * 2;
    if (player.hp >= heartVal) img.src = hudIcons.heartFull;
    else if (player.hp >= heartVal - 1) img.src = hudIcons.heartHalf;
    else img.src = hudIcons.heartEmpty;
    hpEl.appendChild(img);
  }

  const hgEl = document.getElementById('hunger-bar');
  hgEl.innerHTML = '';
  for (let i = 0; i < 10; i++) {
    const img = document.createElement('img');
    img.className = 'stat-icon';
    img.src = (i + 1) * 2 <= Math.ceil(player.hunger) ? hudIcons.hungerFull : hudIcons.hungerEmpty;
    hgEl.appendChild(img);
  }

  document.getElementById('xp-bar-fill').style.width = `${(player.xp % 20) * 5}%`;
  document.getElementById('xp-level').textContent = player.level;
}

function showActionLabel(text) {
  const lbl = document.getElementById('item-action-label');
  lbl.textContent = text;
  lbl.style.opacity = '1';
  clearTimeout(lbl._timer);
  lbl._timer = setTimeout(() => {
    lbl.style.opacity = '0';
  }, 2000);
}

function populateSlotElement(slotEl, stack, placeholderUrl = '') {
  slotEl.innerHTML = '';
  if (!stack) {
    if (placeholderUrl) {
      const img = document.createElement('img');
      img.className = 'slot-placeholder';
      img.src = placeholderUrl;
      slotEl.appendChild(img);
    }
    return;
  }

  const def = ITEMS[stack.id];
  if (!def) return;

  const img = document.createElement('img');
  img.className = 'slot-icon';
  img.src = getItemIconDataURL(def, atlasCanvas);
  slotEl.appendChild(img);

  if (stack.count > 1) {
    const cnt = document.createElement('div');
    cnt.className = 'slot-count';
    cnt.textContent = stack.count;
    slotEl.appendChild(cnt);
  }

  if (def.maxDurability && stack.durability !== null && stack.durability < def.maxDurability) {
    const durWrap = document.createElement('div');
    durWrap.className = 'slot-durability';
    const durFill = document.createElement('div');
    durFill.className = 'slot-durability-fill';
    const pct = Math.max(0, Math.min(1, stack.durability / def.maxDurability));
    durFill.style.width = `${Math.round(pct * 100)}%`;
    durFill.style.background = pct > 0.5 ? '#00ff00' : pct > 0.25 ? '#ffaa00' : '#ff2200';
    durWrap.appendChild(durFill);
    slotEl.appendChild(durWrap);
  }
}

function evaluateCrafting() {
  const counts = {};
  const maxSlots = isCrafting3x3 ? 9 : 4;
  for (let i = 0; i < maxSlots; i++) {
    const s = craftGrid[i];
    if (s) counts[s.id] = (counts[s.id] || 0) + s.count;
  }

  craftOutput = null;
  for (const recipe of CRAFTING_RECIPES) {
    if (!isCrafting3x3 && recipe.size > 2) continue;
    const reqKeys = Object.keys(recipe.ingredients);
    const haveKeys = Object.keys(counts);
    if (reqKeys.length !== haveKeys.length) continue;

    let match = true;
    for (const k of reqKeys) {
      if ((counts[k] || 0) < recipe.ingredients[k]) {
        match = false;
        break;
      }
    }
    if (match) {
      craftOutput = createStack(recipe.result.id, recipe.result.count);
      craftOutput._recipe = recipe;
      break;
    }
  }
}

function consumeCraftingIngredients(recipe) {
  const maxSlots = isCrafting3x3 ? 9 : 4;
  for (const [ingId, needed] of Object.entries(recipe.ingredients)) {
    let rem = needed;
    for (let i = 0; i < maxSlots && rem > 0; i++) {
      const s = craftGrid[i];
      if (s && s.id === ingId) {
        const take = Math.min(s.count, rem);
        s.count -= take;
        rem -= take;
        if (s.count <= 0) craftGrid[i] = null;
      }
    }
  }
  checkProgressionForItem(recipe.result.id);
}

function bindSlotEvents(slotEl, getter, setter, options = {}) {
  slotEl.addEventListener('mouseenter', () => {
    const s = getter();
    const tt = document.getElementById('mc-tooltip');
    if (s && ITEMS[s.id]) {
      const def = ITEMS[s.id];
      tt.style.display = 'flex';
      let extra = '';
      if (def.damage) extra += `<div class="tt-stat">+${def.damage} Dano de Ataque</div>`;
      if (def.defense) extra += `<div class="tt-stat">+${def.defense} Armadura</div>`;
      if (def.isFood) extra += `<div class="tt-stat">+${def.hunger} Fome / +${def.heal} Vida</div>`;
      if (def.maxDurability && s.durability !== null) {
        extra += `<div class="tt-sub">Durabilidade: ${s.durability} / ${def.maxDurability}</div>`;
      }
      tt.innerHTML = `<div class="tt-title">${def.name}</div>${extra}`;
    } else {
      tt.style.display = 'none';
    }
  });

  slotEl.addEventListener('mouseleave', () => {
    document.getElementById('mc-tooltip').style.display = 'none';
  });

  slotEl.addEventListener('mousedown', (e) => {
    e.preventDefault();
    sound.click();

    const current = getter();

    if (options.isCraftOutput) {
      if (!current) return;
      if (!cursorStack) {
        cursorStack = createStack(current.id, current.count);
        consumeCraftingIngredients(current._recipe);
      } else if (cursorStack.id === current.id) {
        const maxS = ITEMS[current.id].maxStack || 64;
        if (cursorStack.count + current.count <= maxS) {
          cursorStack.count += current.count;
          consumeCraftingIngredients(current._recipe);
        }
      }
      renderAllInventoryUI();
      return;
    }

    if (options.armorType && cursorStack) {
      const cDef = ITEMS[cursorStack.id];
      if (cDef?.armorSlot !== options.armorType) return;
    }

    // Shift-click quick transfer or auto-equip armor!
    if (e.shiftKey && current && options.group) {
      const cDef = ITEMS[current.id];
      const armorMap = { helmet: 0, chestplate: 1, leggings: 2, boots: 3 };
      if (cDef?.armorSlot && armorMap[cDef.armorSlot] !== undefined && !armorSlots[armorMap[cDef.armorSlot]]) {
        armorSlots[armorMap[cDef.armorSlot]] = current;
        setter(null);
        renderAllInventoryUI();
        return;
      }
      if (options.group === 'hotbar') {
        for (let i = 0; i < mainInv.length; i++) {
          if (!mainInv[i]) {
            mainInv[i] = current;
            setter(null);
            renderAllInventoryUI();
            return;
          }
        }
      } else if (options.group === 'main') {
        for (let i = 0; i < hotbar.length; i++) {
          if (!hotbar[i]) {
            hotbar[i] = current;
            setter(null);
            renderAllInventoryUI();
            return;
          }
        }
      }
    }

    if (e.button === 0) {
      if (!cursorStack && current) {
        cursorStack = current;
        setter(null);
      } else if (cursorStack && !current) {
        setter(cursorStack);
        cursorStack = null;
      } else if (cursorStack && current) {
        const maxS = ITEMS[current.id]?.maxStack || 64;
        if (cursorStack.id === current.id && current.count < maxS) {
          const add = Math.min(cursorStack.count, maxS - current.count);
          current.count += add;
          cursorStack.count -= add;
          if (cursorStack.count <= 0) cursorStack = null;
        } else {
          const tmp = current;
          setter(cursorStack);
          cursorStack = tmp;
        }
      }
    } else if (e.button === 2) {
      if (!cursorStack && current) {
        const half = Math.ceil(current.count / 2);
        cursorStack = createStack(current.id, half, current.durability);
        current.count -= half;
        if (current.count <= 0) setter(null);
      } else if (cursorStack && !current) {
        setter(createStack(cursorStack.id, 1, cursorStack.durability));
        cursorStack.count -= 1;
        if (cursorStack.count <= 0) cursorStack = null;
      } else if (cursorStack && current && cursorStack.id === current.id) {
        const maxS = ITEMS[current.id]?.maxStack || 64;
        if (current.count < maxS) {
          current.count += 1;
          cursorStack.count -= 1;
          if (cursorStack.count <= 0) cursorStack = null;
        }
      }
    }

    renderAllInventoryUI();
  });
}

function renderAllInventoryUI() {
  evaluateCrafting();

  const hudHotbar = document.getElementById('hotbar-slots');
  hudHotbar.innerHTML = '';
  for (let i = 0; i < 9; i++) {
    const d = document.createElement('div');
    d.className = `hud-slot ${player.selectedSlot === i ? 'active' : ''}`;
    populateSlotElement(d, hotbar[i]);
    hudHotbar.appendChild(d);
  }

  const offHud = document.getElementById('offhand-hud-wrap');
  offHud.innerHTML = '';
  const offSlotHud = document.createElement('div');
  offSlotHud.className = 'hud-slot';
  populateSlotElement(offSlotHud, offhandSlot, hudIcons.silShield);
  offHud.appendChild(offSlotHud);

  // Armor Slots with pixel-art silhouettes matching Image 2!
  const armorCont = document.getElementById('armor-slots-container');
  armorCont.innerHTML = '';
  const armorSils = [hudIcons.silHelmet, hudIcons.silChest, hudIcons.silLegs, hudIcons.silBoots];
  const armorTypes = ['helmet', 'chestplate', 'leggings', 'boots'];
  for (let i = 0; i < 4; i++) {
    const sEl = document.createElement('div');
    sEl.className = 'mc-slot';
    populateSlotElement(sEl, armorSlots[i], armorSils[i]);
    bindSlotEvents(sEl, () => armorSlots[i], (v) => (armorSlots[i] = v), { armorType: armorTypes[i] });
    armorCont.appendChild(sEl);
  }

  const offCont = document.getElementById('offhand-slot-container');
  offCont.innerHTML = '';
  const offEl = document.createElement('div');
  offEl.className = 'mc-slot';
  populateSlotElement(offEl, offhandSlot, hudIcons.silShield);
  bindSlotEvents(offEl, () => offhandSlot, (v) => (offhandSlot = v));
  offCont.appendChild(offEl);

  const craftCont = document.getElementById('craft-grid-container');
  craftCont.className = isCrafting3x3 ? 'craft-grid-3x3' : 'craft-grid-2x2';
  craftCont.innerHTML = '';
  const totalCraftSlots = isCrafting3x3 ? 9 : 4;
  for (let i = 0; i < totalCraftSlots; i++) {
    const cEl = document.createElement('div');
    cEl.className = 'mc-slot';
    populateSlotElement(cEl, craftGrid[i]);
    bindSlotEvents(cEl, () => craftGrid[i], (v) => (craftGrid[i] = v));
    craftCont.appendChild(cEl);
  }

  const outCont = document.getElementById('craft-output-container');
  outCont.innerHTML = '';
  const outEl = document.createElement('div');
  outEl.className = 'mc-slot output-slot';
  populateSlotElement(outEl, craftOutput);
  bindSlotEvents(outEl, () => craftOutput, () => {}, { isCraftOutput: true });
  outCont.appendChild(outEl);

  // Furnace Slots
  const fIn = document.getElementById('furnace-input-container');
  fIn.innerHTML = '';
  const fInEl = document.createElement('div');
  fInEl.className = 'mc-slot';
  populateSlotElement(fInEl, furnaceState.input);
  bindSlotEvents(fInEl, () => furnaceState.input, (v) => (furnaceState.input = v));
  fIn.appendChild(fInEl);

  const fFuel = document.getElementById('furnace-fuel-container');
  fFuel.innerHTML = '';
  const fFuelEl = document.createElement('div');
  fFuelEl.className = 'mc-slot';
  populateSlotElement(fFuelEl, furnaceState.fuel);
  bindSlotEvents(fFuelEl, () => furnaceState.fuel, (v) => (furnaceState.fuel = v));
  fFuel.appendChild(fFuelEl);

  const fOut = document.getElementById('furnace-output-container');
  fOut.innerHTML = '';
  const fOutEl = document.createElement('div');
  fOutEl.className = 'mc-slot output-slot';
  populateSlotElement(fOutEl, furnaceState.output);
  bindSlotEvents(fOutEl, () => furnaceState.output, (v) => (furnaceState.output = v));
  fOut.appendChild(fOutEl);

  // Main 3x9 Inventory
  const mainCont = document.getElementById('main-inv-container');
  mainCont.innerHTML = '';
  for (let i = 0; i < 27; i++) {
    const mEl = document.createElement('div');
    mEl.className = 'mc-slot';
    populateSlotElement(mEl, mainInv[i]);
    bindSlotEvents(mEl, () => mainInv[i], (v) => (mainInv[i] = v), { group: 'main' });
    mainCont.appendChild(mEl);
  }

  // Hotbar 1x9 inside Inventory
  const hbCont = document.getElementById('hotbar-inv-container');
  hbCont.innerHTML = '';
  for (let i = 0; i < 9; i++) {
    const hEl = document.createElement('div');
    hEl.className = 'mc-slot';
    populateSlotElement(hEl, hotbar[i]);
    bindSlotEvents(hEl, () => hotbar[i], (v) => (hotbar[i] = v), { group: 'hotbar' });
    hbCont.appendChild(hEl);
  }

  const curEl = document.getElementById('cursor-item');
  if (cursorStack) {
    curEl.style.display = 'flex';
    populateSlotElement(curEl, cursorStack);
  } else {
    curEl.style.display = 'none';
  }

  updateFirstPersonHand();
  updateHudBars();
}

// Update First-Person 3D Held Item / Block / Bare Arm
function updateFirstPersonHand() {
  const held = hotbar[player.selectedSlot];
  const heldId = held ? held.id : null;

  if (heldId !== lastFpHeldId) {
    lastFpHeldId = heldId;
    while (fpItemAnchor.children.length > 0) {
      fpItemAnchor.remove(fpItemAnchor.children[0]);
    }
    if (!heldId || !ITEMS[heldId]) {
      fpBareArmMesh.visible = true;
    } else {
      fpBareArmMesh.visible = false;
      const def = ITEMS[heldId];
      const mesh3d = create3DItemMesh(def, atlasTexture, atlasCanvas);
      if (mesh3d) {
        if (def.isBlock) {
          mesh3d.scale.set(0.95, 0.95, 0.95);
          mesh3d.rotation.set(0.15, Math.PI / 4, 0);
        } else {
          mesh3d.scale.set(0.85, 0.85, 0.85);
          mesh3d.rotation.set(0.1, -Math.PI / 2 + 0.25, 0.15);
        }
        fpItemAnchor.add(mesh3d);
      }
    }
  }

  fpShieldMesh.visible = Boolean(offhandSlot && ITEMS[offhandSlot.id]?.isShield);
}

// Render Side Drawer (Recipes or Creative Catalog)
function renderSideDrawer() {
  const grid = document.getElementById('drawer-grid');
  const title = document.getElementById('drawer-title');
  grid.innerHTML = '';

  if (activeDrawerTab === 'recipes') {
    title.textContent = isCrafting3x3 ? 'Receitas 3x3 (Bancada):' : 'Receitas 2x2 (Use Bancada p/ 3x3):';
    for (const recipe of CRAFTING_RECIPES) {
      const def = ITEMS[recipe.result.id];
      if (!def) continue;
      const card = document.createElement('div');
      card.className = 'recipe-card';
      const needsBench = !isCrafting3x3 && recipe.size > 2;
      if (needsBench) card.style.opacity = '0.45';
      const ingText = Object.entries(recipe.ingredients)
        .map(([k, v]) => `${v}x ${ITEMS[k]?.name || k}`)
        .join(' + ');
      card.title = `${recipe.name}\nRequer: ${ingText}${needsBench ? '\n(Use uma Bancada de Trabalho 3x3!)' : ''}`;
      populateSlotElement(card, createStack(recipe.result.id, recipe.result.count));

      card.addEventListener('click', () => {
        sound.click();
        if (needsBench && player.gameMode !== 'creative') {
          showActionLabel('Coloque uma Bancada de Trabalho no chão p/ receitas 3x3!');
          return;
        }
        // Check if player has ingredients in hotbar + mainInv + craftGrid
        let canMake = true;
        for (const [ingId, reqCnt] of Object.entries(recipe.ingredients)) {
          let total = 0;
          for (const s of [...hotbar, ...mainInv]) {
            if (s && s.id === ingId) total += s.count;
          }
          if (total < reqCnt) canMake = false;
        }
        if (canMake) {
          for (const [ingId, reqCnt] of Object.entries(recipe.ingredients)) {
            let rem = reqCnt;
            for (const arr of [hotbar, mainInv]) {
              for (let i = 0; i < arr.length && rem > 0; i++) {
                if (arr[i] && arr[i].id === ingId) {
                  const take = Math.min(arr[i].count, rem);
                  arr[i].count -= take;
                  rem -= take;
                  if (arr[i].count <= 0) arr[i] = null;
                }
              }
            }
          }
          addItemToInventory(recipe.result.id, recipe.result.count);
          showActionLabel(`Craftado: ${def.name} x${recipe.result.count}`);
        } else {
          showActionLabel(`Faltam materiais: ${ingText}`);
        }
      });
      grid.appendChild(card);
    }
  } else {
    title.textContent = 'Catálogo Criativo (Clique p/ Pegar):';
    for (const item of Object.values(ITEMS)) {
      if (item.id === 'water' || item.id === 'lava' || item.id === 'bedrock') continue;
      const card = document.createElement('div');
      card.className = 'recipe-card';
      card.title = `${item.name} (Clique p/ adicionar ao Inventário)`;
      const giveCnt = (item.maxStack || 64) > 1 ? 16 : 1;
      populateSlotElement(card, createStack(item.id, giveCnt));
      card.addEventListener('click', () => {
        sound.click();
        addItemToInventory(item.id, giveCnt);
        showActionLabel(`Pegou: ${item.name} x${giveCnt}`);
      });
      grid.appendChild(card);
    }
  }
}

document.getElementById('tab-recipes').addEventListener('click', () => {
  sound.click();
  activeDrawerTab = 'recipes';
  renderSideDrawer();
});

document.getElementById('tab-creative').addEventListener('click', () => {
  sound.click();
  activeDrawerTab = 'creative';
  renderSideDrawer();
});

document.getElementById('btn-equip-screenshot-kit').addEventListener('click', () => {
  sound.click();
  loadScreenshot3Kit();
});

// =================== CONTROLS & INPUT EVENTS ===================
const keys = {};
let isLeftMouseDown = false;
let isRightMouseDown = false;
let isGameRunning = false;
let isModalOpen = false;

window.addEventListener('contextmenu', (e) => e.preventDefault());

window.addEventListener('mousemove', (e) => {
  mouseScreen.x = e.clientX;
  mouseScreen.y = e.clientY;

  const curEl = document.getElementById('cursor-item');
  curEl.style.left = `${e.clientX}px`;
  curEl.style.top = `${e.clientY}px`;

  const tt = document.getElementById('mc-tooltip');
  tt.style.left = `${e.clientX + 14}px`;
  tt.style.top = `${e.clientY + 14}px`;

  if (document.pointerLockElement === canvas && isGameRunning && !isModalOpen) {
    const sens = 0.0022;
    player.yaw -= e.movementX * sens;
    player.pitch = Math.max(-Math.PI / 2 + 0.02, Math.min(Math.PI / 2 - 0.02, player.pitch - e.movementY * sens));
  }
});

window.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && !keys['Space'] && isGameRunning && !isModalOpen) {
    const now = performance.now();
    if (player.gameMode === 'creative' && now - player.lastSpaceTime < 320) {
      player.flying = !player.flying;
      player.vel.y = 0;
      showActionLabel(player.flying ? '✈️ Voo Criativo: ATIVADO' : 'Voo Criativo: DESATIVADO');
    }
    player.lastSpaceTime = now;
  }

  keys[e.code] = true;
  if (!isGameRunning) return;

  if (e.code === 'KeyE') {
    e.preventDefault();
    toggleInventoryModal(false, false);
  } else if (e.code === 'Escape' && isModalOpen) {
    toggleInventoryModal(false, false, true);
  } else if (e.code >= 'Digit1' && e.code <= 'Digit9' && !isModalOpen) {
    player.selectedSlot = parseInt(e.code.replace('Digit', ''), 10) - 1;
    const held = hotbar[player.selectedSlot];
    if (held && ITEMS[held.id]) showActionLabel(ITEMS[held.id].name);
    renderAllInventoryUI();
  } else if (e.code === 'KeyQ' && !isModalOpen) {
    const held = hotbar[player.selectedSlot];
    if (held) {
      const dir = new THREE.Vector3();
      camera.getWorldDirection(dir);
      spawnItemDrop(
        player.pos.x + dir.x * 0.8,
        player.pos.y + 1.3,
        player.pos.z + dir.z * 0.8,
        held.id,
        1,
        dir.multiplyScalar(7).add(new THREE.Vector3(0, 2.5, 0))
      );
      held.count -= 1;
      if (held.count <= 0) hotbar[player.selectedSlot] = null;
      sound.click();
      renderAllInventoryUI();
    }
  } else if (e.code === 'KeyF' && !isModalOpen) {
    const tmp = hotbar[player.selectedSlot];
    hotbar[player.selectedSlot] = offhandSlot;
    offhandSlot = tmp;
    sound.click();
    renderAllInventoryUI();
  }
});

window.addEventListener('keyup', (e) => {
  keys[e.code] = false;
});

window.addEventListener('wheel', (e) => {
  if (!isGameRunning || isModalOpen) return;
  player.selectedSlot = (player.selectedSlot + (e.deltaY > 0 ? 1 : 8)) % 9;
  const held = hotbar[player.selectedSlot];
  if (held && ITEMS[held.id]) showActionLabel(ITEMS[held.id].name);
  renderAllInventoryUI();
});

function toggleInventoryModal(use3x3 = false, useFurnace = false, forceClose = false) {
  const modal = document.getElementById('modal-backdrop');
  if (forceClose || !modal.classList.contains('hidden')) {
    modal.classList.add('hidden');
    isModalOpen = false;
    for (let i = 0; i < craftGrid.length; i++) {
      if (craftGrid[i]) {
        addItemToInventory(craftGrid[i].id, craftGrid[i].count);
        craftGrid[i] = null;
      }
    }
    if (cursorStack) {
      addItemToInventory(cursorStack.id, cursorStack.count);
      cursorStack = null;
    }
    canvas.requestPointerLock?.();
  } else {
    isCrafting3x3 = use3x3;
    isFurnaceOpen = useFurnace;
    if (player.gameMode === 'creative') activeDrawerTab = 'creative';
    document.getElementById('crafting-panel').style.display = useFurnace ? 'none' : 'flex';
    document.getElementById('furnace-panel').style.display = useFurnace ? 'flex' : 'none';
    document.getElementById('crafting-title').textContent = use3x3 ? 'Bancada de Trabalho (3x3)' : 'Handwerk';
    document.getElementById('craft-mode-hint').textContent = use3x3 ? 'Grid 3x3 Completo' : 'Grid 2x2';
    modal.classList.remove('hidden');
    isModalOpen = true;
    document.exitPointerLock?.();
    renderSideDrawer();
    renderAllInventoryUI();
  }
}

document.getElementById('recipe-book-btn').addEventListener('click', () => {
  sound.click();
  document.getElementById('side-drawer').classList.toggle('hidden');
});

canvas.addEventListener('mousedown', (e) => {
  if (!isGameRunning || isModalOpen) return;
  if (document.pointerLockElement !== canvas) {
    canvas.requestPointerLock?.();
    return;
  }

  if (e.button === 0) {
    isLeftMouseDown = true;
    player.swingTimer = 0.28;
    tryAttackMob();
  } else if (e.button === 2) {
    isRightMouseDown = true;
    handleRightClickAction();
  }
});

window.addEventListener('mouseup', (e) => {
  if (e.button === 0) {
    isLeftMouseDown = false;
    miningState.progress = 0;
    crackMesh.visible = false;
  } else if (e.button === 2) {
    isRightMouseDown = false;
    player.isBlocking = false;
    const held = hotbar[player.selectedSlot];
    if (held && held.id === 'bow' && player.bowCharge > 0.18) {
      let arrowSlot = -1;
      let arrowArr = null;
      for (const arr of [hotbar, mainInv]) {
        for (let i = 0; i < arr.length; i++) {
          if (arr[i] && arr[i].id === 'arrow') {
            arrowSlot = i;
            arrowArr = arr;
            break;
          }
        }
        if (arrowSlot !== -1) break;
      }

      if (arrowArr || player.gameMode === 'creative') {
        if (arrowArr && player.gameMode !== 'creative') {
          arrowArr[arrowSlot].count -= 1;
          if (arrowArr[arrowSlot].count <= 0) arrowArr[arrowSlot] = null;
        }
        const dir = new THREE.Vector3();
        camera.getWorldDirection(dir);
        shootArrow(
          new THREE.Vector3(player.pos.x, player.pos.y + player.eyeHeight - 0.1, player.pos.z),
          dir,
          true,
          Math.min(1.4, 0.5 + player.bowCharge)
        );
        if (held.durability) held.durability -= 1;
        renderAllInventoryUI();
      } else {
        showActionLabel('Sem Flechas no Inventário!');
      }
    }
    player.bowCharge = 0;
  }
});

function tryAttackMob() {
  const origin = new THREE.Vector3(player.pos.x, player.pos.y + player.eyeHeight, player.pos.z);
  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir);

  let bestMob = null;
  let bestDist = 4.2;

  for (const mob of mobs) {
    if (mob.dead) continue;
    const mobCenter = new THREE.Vector3(mob.pos.x, mob.pos.y + 0.85, mob.pos.z);
    const toMob = mobCenter.clone().sub(origin);
    const dist = toMob.length();
    if (dist > bestDist) continue;
    const dot = toMob.normalize().dot(dir);
    if (dot > 0.88) {
      bestDist = dist;
      bestMob = mob;
    }
  }

  if (bestMob) {
    const held = hotbar[player.selectedSlot];
    const def = held ? ITEMS[held.id] : null;
    const dmg = def?.damage || 2;
    if (held && held.durability !== null && player.gameMode !== 'creative') {
      held.durability -= 1;
      if (held.durability <= 0) hotbar[player.selectedSlot] = null;
      renderAllInventoryUI();
    }
    bestMob.damage(dmg, dir, (deadMob) => {
      unlockAdvancement('hunter', 'Monster Hunter!', 'iron_sword');
      handleMobDrops(deadMob);
    });
  }
}

function handleMobDrops(mob) {
  spawnXpOrbs(mob.pos.x, mob.pos.y + 0.3, mob.pos.z, 3);
  if (mob.type === 'cow' || mob.type === 'pig' || mob.type === 'sheep') {
    spawnItemDrop(mob.pos.x, mob.pos.y + 0.4, mob.pos.z, 'raw_beef', 2);
  } else if (mob.type === 'zombie') {
    spawnItemDrop(mob.pos.x, mob.pos.y + 0.4, mob.pos.z, 'iron_ingot', 1);
    spawnItemDrop(mob.pos.x, mob.pos.y + 0.4, mob.pos.z, 'carrot', 1);
  } else if (mob.type === 'skeleton') {
    spawnItemDrop(mob.pos.x, mob.pos.y + 0.4, mob.pos.z, 'arrow', 4);
  } else if (mob.type === 'creeper') {
    spawnItemDrop(mob.pos.x, mob.pos.y + 0.4, mob.pos.z, 'tnt', 1);
    spawnItemDrop(mob.pos.x, mob.pos.y + 0.4, mob.pos.z, 'coal', 2);
  }
}

function handleRightClickAction() {
  const origin = new THREE.Vector3(player.pos.x, player.pos.y + player.eyeHeight, player.pos.z);
  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir);

  const hit = world.raycast(origin, dir, 5.5, false);

  if (hit && !keys['ShiftLeft']) {
    const bDef = BLOCK_BY_ID[hit.blockId];
    if (bDef?.interactive === 'crafting') {
      toggleInventoryModal(true, false);
      return;
    }
    if (bDef?.interactive === 'furnace') {
      toggleInventoryModal(false, true);
      return;
    }
    if (bDef?.interactive === 'tnt') {
      sound.creeperHiss();
      showActionLabel('💥 TNT Ativada! Afaste-se!');
      const tx = hit.x, ty = hit.y, tz = hit.z;
      setTimeout(() => {
        world.explode(tx + 0.5, ty + 0.5, tz + 0.5, 3.6, (dx, dy, dz, dropId, cnt) => {
          spawnItemDrop(dx, dy, dz, dropId, cnt);
        });
        const pDist = player.pos.distanceTo(new THREE.Vector3(tx + 0.5, ty + 0.5, tz + 0.5));
        if (pDist < 5.5) damagePlayer(Math.ceil((5.5 - pDist) * 3), 'Explosão de TNT');
      }, 1500);
      return;
    }
  }

  const held = hotbar[player.selectedSlot];
  const def = held ? ITEMS[held.id] : null;

  // Empty Bucket scoops up Water or Lava
  if (def && def.id === 'bucket') {
    const fluidHit = world.raycast(origin, dir, 5.5, true);
    if (fluidHit && (fluidHit.blockId === BLOCK.WATER || fluidHit.blockId === BLOCK.LAVA)) {
      const newBucketId = fluidHit.blockId === BLOCK.WATER ? 'water_bucket' : 'lava_bucket';
      world.setBlock(fluidHit.x, fluidHit.y, fluidHit.z, BLOCK.AIR);
      sound.splash();
      if (held.count > 1) {
        held.count -= 1;
        addItemToInventory(newBucketId, 1);
      } else {
        hotbar[player.selectedSlot] = createStack(newBucketId, 1);
      }
      renderAllInventoryUI();
      return;
    }
  }

  // Water/Lava Bucket places fluid
  if (def && def.placesFluid && hit) {
    const px = hit.x + hit.normal.x;
    const py = hit.y + hit.normal.y;
    const pz = hit.z + hit.normal.z;
    world.setBlock(px, py, pz, def.placesFluid);
    world.scheduleFluidAround(px, py, pz);
    sound.splash();
    if (player.gameMode !== 'creative') {
      hotbar[player.selectedSlot] = createStack('bucket', 1);
    }
    renderAllInventoryUI();
    return;
  }

  // Eating Food
  if (def && def.isFood) {
    if (player.hunger < player.maxHunger || player.hp < player.maxHp) {
      sound.eat();
      player.hunger = Math.min(player.maxHunger, player.hunger + def.hunger);
      player.hp = Math.min(player.maxHp, player.hp + def.heal);
      player.swingTimer = 0.25;
      showActionLabel(`Comeu ${def.name} (+${def.heal} ❤️)`);
      if (player.gameMode !== 'creative') {
        held.count -= 1;
        if (held.count <= 0) hotbar[player.selectedSlot] = null;
      }
      renderAllInventoryUI();
    }
    return;
  }

  // Place Block
  if (def && def.isBlock && hit) {
    const px = hit.x + hit.normal.x;
    const py = hit.y + hit.normal.y;
    const pz = hit.z + hit.normal.z;

    const overlapsPlayer =
      px + 1 > player.pos.x - 0.3 &&
      px < player.pos.x + 0.3 &&
      py + 1 > player.pos.y &&
      py < player.pos.y + player.height &&
      pz + 1 > player.pos.z - 0.3 &&
      pz < player.pos.z + 0.3;

    if (!overlapsPlayer) {
      world.setBlock(px, py, pz, def.blockId);
      sound.blockPlace();
      player.swingTimer = 0.22;
      if (player.gameMode !== 'creative') {
        held.count -= 1;
        if (held.count <= 0) hotbar[player.selectedSlot] = null;
      }
      renderAllInventoryUI();
      return;
    }
  }

  if ((def && def.isShield) || (offhandSlot && ITEMS[offhandSlot.id]?.isShield)) {
    player.isBlocking = true;
  }
}

// =================== MINING SYSTEM WITH REAL TOOL TIER PROGRESSION ===================
const miningState = {
  x: 0,
  y: 0,
  z: 0,
  progress: 0,
  soundTimer: 0,
};

function updateMining(dt) {
  const origin = new THREE.Vector3(player.pos.x, player.pos.y + player.eyeHeight, player.pos.z);
  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir);
  const hit = world.raycast(origin, dir, 5.5, false);

  if (!hit) {
    targetWireframe.visible = false;
    crackMesh.visible = false;
    miningState.progress = 0;
    return hit;
  }

  targetWireframe.visible = true;
  targetWireframe.position.set(hit.x + 0.5, hit.y + 0.5, hit.z + 0.5);

  if (!isLeftMouseDown || isModalOpen) {
    crackMesh.visible = false;
    miningState.progress = 0;
    return hit;
  }

  if (player.swingTimer <= 0) player.swingTimer = 0.26;

  if (hit.x !== miningState.x || hit.y !== miningState.y || hit.z !== miningState.z) {
    miningState.x = hit.x;
    miningState.y = hit.y;
    miningState.z = hit.z;
    miningState.progress = 0;
  }

  const bDef = BLOCK_BY_ID[hit.blockId];
  if (!bDef || bDef.unbreakable) return hit;

  const held = hotbar[player.selectedSlot];
  const hDef = held ? ITEMS[held.id] : null;

  // Check if player meets minimum tool tier for harvesting stone/ores!
  const hasRequiredTier =
    player.gameMode === 'creative' ||
    !bDef.minTier ||
    (hDef && hDef.toolType === bDef.tool && (hDef.tierRank || 0) >= bDef.minTier);

  let speedMult = 1.0;
  if (player.gameMode === 'creative') {
    speedMult = 35.0;
  } else if (hDef && hDef.toolType === bDef.tool) {
    speedMult = hDef.speed || 3.0;
  } else if (bDef.minTier) {
    speedMult = 0.28;
  }

  miningState.progress += (dt * speedMult) / (bDef.hardness || 1.0);
  miningState.soundTimer += dt;
  if (miningState.soundTimer > 0.22) {
    miningState.soundTimer = 0;
    sound.mineHit();
  }

  const stage = Math.min(9, Math.floor(miningState.progress * 10));
  crackMesh.visible = true;
  crackMesh.position.set(hit.x + 0.5, hit.y + 0.5, hit.z + 0.5);
  crackMat.map = crackTextures[stage];
  crackMat.needsUpdate = true;

  if (miningState.progress >= 1.0) {
    miningState.progress = 0;
    crackMesh.visible = false;
    world.setBlock(hit.x, hit.y, hit.z, BLOCK.AIR);
    sound.blockBreak();

    if (hasRequiredTier) {
      const dropId = bDef.drop;
      if (dropId && (!bDef.dropChance || Math.random() < bDef.dropChance)) {
        spawnItemDrop(hit.x + 0.5, hit.y + 0.5, hit.z + 0.5, dropId, 1);
      }
      if (bDef.xp) {
        spawnXpOrbs(hit.x + 0.5, hit.y + 0.5, hit.z + 0.5, 2);
      }
    } else {
      showActionLabel(`⚠️ ${bDef.name} requer ${bDef.tool === 'pickaxe' ? 'Picareta adequada' : 'Ferramenta'} para dropar!`);
    }

    if (held && held.durability !== null && player.gameMode !== 'creative') {
      held.durability -= 1;
      if (held.durability <= 0) hotbar[player.selectedSlot] = null;
      renderAllInventoryUI();
    }
  }

  return hit;
}

// =================== PLAYER PHYSICS, HUNGER & CREATIVE FLIGHT ===================
function checkPlayerCollision(px, py, pz) {
  const r = player.width / 2;
  const minX = Math.floor(px - r);
  const maxX = Math.floor(px + r);
  const minY = Math.floor(py);
  const maxY = Math.floor(py + player.height - 0.05);
  const minZ = Math.floor(pz - r);
  const maxZ = Math.floor(pz + r);

  for (let y = minY; y <= maxY; y++) {
    for (let z = minZ; z <= maxZ; z++) {
      for (let x = minX; x <= maxX; x++) {
        if (world.isSolid(x, y, z)) return true;
      }
    }
  }
  return false;
}

function updatePlayerPhysics(dt) {
  player.hurtCooldown = Math.max(0, player.hurtCooldown - dt);

  const footBlock = world.getBlock(player.pos.x, player.pos.y + 0.2, player.pos.z);
  const headBlock = world.getBlock(player.pos.x, player.pos.y + player.eyeHeight, player.pos.z);
  const inWater = footBlock === BLOCK.WATER || headBlock === BLOCK.WATER;
  const inLava = footBlock === BLOCK.LAVA || headBlock === BLOCK.LAVA;

  const tint = document.getElementById('screen-tint');
  if (player.hurtCooldown <= 0.35) {
    if (headBlock === BLOCK.WATER) {
      tint.style.background = 'rgba(18, 75, 195, 0.44)';
    } else if (inLava) {
      tint.style.background = 'rgba(235, 70, 10, 0.55)';
    } else {
      tint.style.background = 'transparent';
    }
  }

  if (headBlock === BLOCK.WATER && player.gameMode !== 'creative') {
    player.air = Math.max(0, player.air - dt * 0.85);
    if (player.air <= 0) damagePlayer(2, 'Afogamento');
    updateHudBars();
  } else if (player.air < player.maxAir) {
    player.air = Math.min(player.maxAir, player.air + dt * 3);
    updateHudBars();
  }

  if (inLava) damagePlayer(4, 'Tentou nadar na Lava');

  // Survival Hunger & Natural Regeneration
  if (player.gameMode !== 'creative') {
    player.hungerTimer += dt;
    if (player.hungerTimer >= 14) {
      player.hungerTimer = 0;
      if (player.hunger >= 18 && player.hp < player.maxHp) {
        player.hp = Math.min(player.maxHp, player.hp + 1);
      }
      player.hunger = Math.max(0, player.hunger - 0.5);
      updateHudBars();
    }
  }

  let forward = (keys['KeyW'] ? 1 : 0) - (keys['KeyS'] ? 1 : 0);
  let strafe = (keys['KeyD'] ? 1 : 0) - (keys['KeyA'] ? 1 : 0);
  const len = Math.hypot(forward, strafe);
  if (len > 0) {
    forward /= len;
    strafe /= len;
  }

  const isSprinting = keys['ControlLeft'] || keys['KeyR'];
  const isCrouching = keys['ShiftLeft'];
  let speed = player.flying ? 11.5 : isCrouching ? 2.4 : isSprinting ? 6.8 : 4.6;
  if (inWater && !player.flying) speed *= 0.62;
  if (player.isBlocking) speed *= 0.45;

  const sinY = Math.sin(player.yaw);
  const cosY = Math.cos(player.yaw);
  const moveX = (-sinY * forward + cosY * strafe) * speed;
  const moveZ = (-cosY * forward - sinY * strafe) * speed;

  player.vel.x += (moveX - player.vel.x) * Math.min(1, dt * 12);
  player.vel.z += (moveZ - player.vel.z) * Math.min(1, dt * 12);

  if (player.flying) {
    player.vel.y = (keys['Space'] ? 7.5 : 0) - (keys['ShiftLeft'] ? 7.5 : 0);
    player.fallStartY = null;
  } else if (inWater || inLava) {
    player.vel.y -= 7.5 * dt;
    player.vel.y *= 0.9;
    if (keys['Space']) player.vel.y = 4.6;
    player.fallStartY = null;
  } else {
    player.vel.y -= 26.0 * dt;
    if (keys['Space'] && player.onGround) {
      player.vel.y = 8.6;
      player.onGround = false;
    }
  }

  if (!player.onGround && player.vel.y < -1 && !inWater && !player.flying) {
    if (player.fallStartY === null || player.pos.y > player.fallStartY) {
      player.fallStartY = player.pos.y;
    }
  }

  const nextX = player.pos.x + player.vel.x * dt;
  if (!checkPlayerCollision(nextX, player.pos.y, player.pos.z)) {
    player.pos.x = nextX;
  } else {
    player.vel.x = 0;
  }

  const nextZ = player.pos.z + player.vel.z * dt;
  if (!checkPlayerCollision(player.pos.x, player.pos.y, nextZ)) {
    player.pos.z = nextZ;
  } else {
    player.vel.z = 0;
  }

  const nextY = player.pos.y + player.vel.y * dt;
  if (!checkPlayerCollision(player.pos.x, nextY, player.pos.z)) {
    player.pos.y = nextY;
    player.onGround = false;
  } else {
    if (player.vel.y < 0) {
      if (player.fallStartY !== null && !player.flying) {
        const fallDist = player.fallStartY - player.pos.y;
        if (fallDist > 3.8 && !inWater) {
          damagePlayer(Math.floor(fallDist - 3), 'Queda de lugar alto');
        }
        player.fallStartY = null;
      }
      player.pos.y = Math.floor(nextY) + 1.0001;
      player.onGround = true;
      if (player.flying) player.flying = false;
    }
    player.vel.y = 0;
  }

  if (player.onGround && len > 0) {
    player.stepAccum += dt * speed;
    if (player.stepAccum > 2.2) {
      player.stepAccum = 0;
      const under = world.getBlock(player.pos.x, player.pos.y - 0.2, player.pos.z);
      sound.step(under === BLOCK.STONE || under === BLOCK.COBBLESTONE);
    }
  }

  const crouchDrop = isCrouching && !player.flying ? 0.22 : 0;
  camera.position.set(player.pos.x, player.pos.y + player.eyeHeight - crouchDrop, player.pos.z);
  camera.rotation.order = 'YXZ';
  camera.rotation.y = player.yaw;
  camera.rotation.x = player.pitch;

  const held = hotbar[player.selectedSlot];
  if (isRightMouseDown && held && held.id === 'bow') {
    player.bowCharge = Math.min(1.2, player.bowCharge + dt);
    fpRightArm.position.set(0.32, -0.28, -0.45 + player.bowCharge * 0.12);
    fpRightArm.rotation.set(0.15, -0.2, 0);
  } else if (player.swingTimer > 0) {
    player.swingTimer = Math.max(0, player.swingTimer - dt);
    const phase = (0.28 - player.swingTimer) / 0.28;
    const s = Math.sin(phase * Math.PI);
    fpRightArm.position.set(0.46 - s * 0.18, -0.38 + s * 0.1, -0.62 - s * 0.18);
    fpRightArm.rotation.set(-s * 1.1, s * 0.5, -s * 0.4);
  } else {
    const bob = player.onGround && len > 0 ? Math.sin(performance.now() * 0.01) * 0.025 : 0;
    fpRightArm.position.set(0.46, -0.38 + bob, -0.62);
    fpRightArm.rotation.set(0, 0, 0);
  }

  if (player.isBlocking) {
    fpShieldMesh.position.set(-0.22, -0.26, -0.46);
    fpShieldMesh.rotation.y = 0.05;
  } else {
    fpShieldMesh.position.set(-0.48, -0.36, -0.58);
    fpShieldMesh.rotation.y = 0.35;
  }
}

// =================== FURNACE SMELTING UPDATE ===================
function updateFurnace(dt) {
  const flameEl = document.getElementById('furnace-flame');
  if (!furnaceState.input || !SMELTING_RECIPES[furnaceState.input.id]) {
    furnaceState.cookProgress = 0;
    flameEl.classList.remove('lit');
    return;
  }

  if (furnaceState.burnTime <= 0 && furnaceState.fuel) {
    const fuelDef = ITEMS[furnaceState.fuel.id];
    if (fuelDef?.fuelTime) {
      furnaceState.burnTime = fuelDef.fuelTime;
      furnaceState.fuel.count -= 1;
      if (furnaceState.fuel.count <= 0) furnaceState.fuel = null;
      if (isModalOpen && isFurnaceOpen) renderAllInventoryUI();
    }
  }

  if (furnaceState.burnTime > 0) {
    furnaceState.burnTime -= dt;
    furnaceState.cookProgress += dt;
    flameEl.classList.add('lit');

    if (furnaceState.cookProgress >= 3.2) {
      furnaceState.cookProgress = 0;
      const res = SMELTING_RECIPES[furnaceState.input.id];
      if (!furnaceState.output) {
        furnaceState.output = createStack(res.id, res.count);
        furnaceState.input.count -= 1;
      } else if (furnaceState.output.id === res.id && furnaceState.output.count < 64) {
        furnaceState.output.count += res.count;
        furnaceState.input.count -= 1;
      }
      if (furnaceState.input.count <= 0) furnaceState.input = null;
      checkProgressionForItem(res.id);
      sound.xpOrb();
      if (isModalOpen && isFurnaceOpen) renderAllInventoryUI();
    }
  } else {
    flameEl.classList.remove('lit');
  }
}

// =================== UPDATE DROPS, XP ORBS & ARROWS ===================
function updateWorldEntities(dt) {
  for (let i = droppedItems.length - 1; i >= 0; i--) {
    const d = droppedItems[i];
    d.age += dt;
    d.pickupDelay = Math.max(0, d.pickupDelay - dt);
    d.mesh.rotation.y += dt * 2.4;

    d.vel.y -= 18 * dt;
    const ny = d.mesh.position.y + d.vel.y * dt;
    if (world.isSolid(d.mesh.position.x, ny - 0.16, d.mesh.position.z)) {
      d.mesh.position.y = Math.floor(ny - 0.16) + 1.2 + Math.sin(d.age * 3.5) * 0.06;
      d.vel.set(0, 0, 0);
    } else {
      d.mesh.position.x += d.vel.x * dt;
      d.mesh.position.y = ny;
      d.mesh.position.z += d.vel.z * dt;
    }

    if (d.pickupDelay <= 0) {
      const dist = d.mesh.position.distanceTo(
        new THREE.Vector3(player.pos.x, player.pos.y + 0.9, player.pos.z)
      );
      if (dist < 2.2) {
        d.mesh.position.lerp(new THREE.Vector3(player.pos.x, player.pos.y + 0.9, player.pos.z), dt * 12);
        if (dist < 0.85) {
          if (addItemToInventory(d.id, d.count)) {
            sound.click();
            scene.remove(d.mesh);
            droppedItems.splice(i, 1);
          }
        }
      }
    }
  }

  for (let i = xpOrbs.length - 1; i >= 0; i--) {
    const orb = xpOrbs[i];
    const target = new THREE.Vector3(player.pos.x, player.pos.y + 0.9, player.pos.z);
    const dist = orb.mesh.position.distanceTo(target);
    if (dist < 4.5) {
      orb.mesh.position.lerp(target, dt * 7);
      if (dist < 0.75) {
        sound.xpOrb();
        player.xp += orb.value;
        while (player.xp >= 20) {
          player.xp -= 20;
          player.level += 1;
        }
        updateHudBars();
        scene.remove(orb.mesh);
        xpOrbs.splice(i, 1);
      }
    }
  }

  for (let i = arrows.length - 1; i >= 0; i--) {
    const a = arrows[i];
    a.age += dt;
    if (a.age > 12) {
      scene.remove(a.mesh);
      arrows.splice(i, 1);
      continue;
    }
    if (a.stuck) continue;

    a.vel.y -= 16 * dt;
    const nextPos = a.mesh.position.clone().addScaledVector(a.vel, dt);
    if (world.isSolid(nextPos.x, nextPos.y, nextPos.z)) {
      a.stuck = true;
      sound.mineHit();
      continue;
    }
    a.mesh.position.copy(nextPos);
    a.mesh.lookAt(nextPos.clone().add(a.vel));

    if (a.fromPlayer) {
      for (const mob of mobs) {
        if (mob.dead) continue;
        if (a.mesh.position.distanceTo(new THREE.Vector3(mob.pos.x, mob.pos.y + 0.8, mob.pos.z)) < 0.8) {
          mob.damage(9, a.vel.clone().normalize(), handleMobDrops);
          scene.remove(a.mesh);
          arrows.splice(i, 1);
          break;
        }
      }
    } else {
      if (a.mesh.position.distanceTo(new THREE.Vector3(player.pos.x, player.pos.y + 0.9, player.pos.z)) < 0.75) {
        damagePlayer(4, 'Flecha de Esqueleto');
        scene.remove(a.mesh);
        arrows.splice(i, 1);
      }
    }
  }

  for (let i = mobs.length - 1; i >= 0; i--) {
    const mob = mobs[i];
    const remove = mob.update(
      dt,
      world,
      player.pos,
      (dmg, src) => damagePlayer(dmg, src),
      (orig, dir, fromP) => shootArrow(orig, dir, fromP, 0.9),
      (ex, ey, ez) => {
        world.explode(ex, ey, ez, 3.0, (dx, dy, dz, dropId, cnt) => {
          spawnItemDrop(dx, dy, dz, dropId, cnt);
        });
        const pDist = player.pos.distanceTo(new THREE.Vector3(ex, ey, ez));
        if (pDist < 4.8) damagePlayer(Math.ceil((4.8 - pDist) * 3.2), 'Explosão de Creeper');
      }
    );
    if (remove) {
      scene.remove(mob.group);
      mobs.splice(i, 1);
    }
  }
}

// =================== DAY / NIGHT CYCLE & TITLE PANORAMA ===================
let timeOfDay = 0.24; // Golden Sunset matching Screenshot 2!

function updateSkyLighting(dt) {
  if (isGameRunning) {
    timeOfDay = (timeOfDay + dt * 0.002) % 1.0;
  }

  const angle = timeOfDay * Math.PI * 2;
  skyGroup.position.copy(camera.position);
  cloudGroup.position.x = camera.position.x + ((performance.now() * 0.002) % 40);
  cloudGroup.position.z = camera.position.z;

  const sunHeight = Math.cos(angle);
  let skyHex = 0x78a7ff;
  if (sunHeight > 0.25) {
    skyHex = 0x78a7ff;
    ambientLight.intensity = 0.76;
    sunLight.intensity = 0.88;
  } else if (sunHeight > -0.15) {
    skyHex = 0xd96b2b; // Golden sunset like Screenshot 2!
    ambientLight.intensity = 0.62;
    sunLight.intensity = 0.72;
  } else {
    skyHex = 0x0b1026;
    ambientLight.intensity = 0.32;
    sunLight.intensity = 0.22;
  }

  scene.background.setHex(skyHex);
  scene.fog.color.setHex(skyHex);
}

// =================== UI MENU BUTTONS ===================
let selectedWorldMode = 'survival'; // 'survival' | 'creative' | 'equipped'

function launchWorld() {
  sound.click();
  document.getElementById('title-screen').classList.add('hidden');
  document.getElementById('world-modal').classList.add('hidden');
  document.getElementById('hud').classList.remove('hidden');
  fpGroup.visible = true;
  isGameRunning = true;
  timeOfDay = 0.08; // Crisp morning light

  unlockedAdvancements.clear();

  if (selectedWorldMode === 'survival') {
    player.gameMode = 'survival';
    player.flying = false;
    clearInventory();
    player.level = 0;
    player.xp = 0;
    showActionLabel('Modo Survival: Comece quebrando madeira!');
  } else if (selectedWorldMode === 'creative') {
    player.gameMode = 'creative';
    clearInventory();
    hotbar[0] = createStack('grass_block', 64);
    hotbar[1] = createStack('cherry_leaves', 64);
    hotbar[2] = createStack('oak_planks', 64);
    hotbar[3] = createStack('crafting_table', 64);
    hotbar[4] = createStack('furnace', 64);
    hotbar[5] = createStack('water_bucket', 1);
    hotbar[6] = createStack('lava_bucket', 1);
    hotbar[7] = createStack('tnt', 64);
    hotbar[8] = createStack('diamond_pickaxe', 1);
    showActionLabel('Modo Criativo: 2x Espaço p/ Voar! [E] Catálogo Completo');
  } else {
    player.gameMode = 'survival';
    player.flying = false;
    loadScreenshot3Kit();
  }

  const spawnY = world.getSurfaceHeight(0, 0) + 1.5;
  player.pos.set(0.5, spawnY, 0.5);
  player.hp = 20;
  player.hunger = 20;
  updateQuestTracker();
  renderAllInventoryUI();
  canvas.requestPointerLock?.();
}

document.getElementById('btn-singleplayer').addEventListener('click', () => {
  sound.click();
  document.getElementById('world-modal').classList.remove('hidden');
});

document.getElementById('btn-multiplayer').addEventListener('click', () => {
  selectedWorldMode = 'equipped';
  launchWorld();
  for (let i = 0; i < 6; i++) {
    spawnMob(i % 2 === 0 ? 'zombie' : 'creeper', player.pos.x + 8 + i * 2, player.pos.z + 6);
  }
  showActionLabel('Arena de Batalha: Kit Diamante + Horda de Mobs!');
});

document.getElementById('btn-realms').addEventListener('click', () => {
  selectedWorldMode = 'creative';
  launchWorld();
});

document.getElementById('btn-toggle-gamemode').addEventListener('click', (e) => {
  sound.click();
  const desc = document.getElementById('gamemode-desc');
  if (selectedWorldMode === 'survival') {
    selectedWorldMode = 'creative';
    e.target.textContent = 'Game Mode: Creative (Voo + Blocos Infinitos)';
    desc.textContent = 'Modo Criativo: Voe apertando 2x Espaço, quebre blocos instantaneamente e acesse todos os blocos e itens no Catálogo [E].';
  } else if (selectedWorldMode === 'creative') {
    selectedWorldMode = 'equipped';
    e.target.textContent = 'Game Mode: Survival (Com Kit da Foto 3)';
    desc.textContent = 'Comece já equipado com a Armadura de Diamante/Ferro, Arco, Escudo, Picaretas, Baldes de Água/Lava e Comidas da Foto 3!';
  } else {
    selectedWorldMode = 'survival';
    e.target.textContent = 'Game Mode: Survival (Do Zero)';
    desc.textContent = 'Sobrevivência Real: Comece de mãos vazias, quebre árvores, crie Tábuas e Bancada de Trabalho 3x3, minere Pedra/Ferro/Diamante, asse comida na Fornalha e sobreviva aos Mobs!';
  }
});

document.getElementById('btn-create-world-confirm').addEventListener('click', () => {
  sound.click();
  const newSeed = document.getElementById('seed-input').value.trim() || `argon-${Date.now()}`;
  if (newSeed !== worldSeed) {
    worldSeed = newSeed;
    for (const h of world.meshes.values()) {
      if (h.opaque) scene.remove(h.opaque);
      if (h.trans) scene.remove(h.trans);
    }
    world = new VoxelWorld(scene, atlasTexture, worldSeed);
    for (let i = 0; i < 20; i++) world.updateChunksAround(0, 0, renderDistance);
    populateInitialMobs();
  }
  launchWorld();
});

document.getElementById('btn-create-world-cancel').addEventListener('click', () => {
  sound.click();
  document.getElementById('world-modal').classList.add('hidden');
});

document.getElementById('btn-options').addEventListener('click', () => {
  sound.click();
  document.getElementById('options-modal').classList.remove('hidden');
});

document.getElementById('btn-options-done').addEventListener('click', () => {
  sound.click();
  document.getElementById('options-modal').classList.add('hidden');
});

document.getElementById('btn-quit').addEventListener('click', () => {
  sound.click();
  selectedWorldMode = 'equipped';
  launchWorld();
});

document.getElementById('opt-fov').addEventListener('input', (e) => {
  camera.fov = Number(e.target.value);
  camera.updateProjectionMatrix();
  document.getElementById('lbl-fov').textContent = e.target.value;
});

document.getElementById('opt-rd').addEventListener('input', (e) => {
  renderDistance = Number(e.target.value);
  document.getElementById('lbl-rd').textContent = e.target.value;
});

document.getElementById('opt-vol').addEventListener('input', (e) => {
  sound.setVolume(Number(e.target.value) / 100);
  document.getElementById('lbl-vol').textContent = e.target.value;
});

document.getElementById('btn-time-day').addEventListener('click', () => (timeOfDay = 0.05));
document.getElementById('btn-time-sunset').addEventListener('click', () => (timeOfDay = 0.24));
document.getElementById('btn-time-night').addEventListener('click', () => (timeOfDay = 0.5));

document.getElementById('btn-a11y').addEventListener('click', () => {
  sound.click();
  timeOfDay = timeOfDay < 0.2 ? 0.24 : 0.05;
});

document.getElementById('btn-respawn').addEventListener('click', () => {
  sound.click();
  document.getElementById('death-screen').classList.add('hidden');
  player.hp = 20;
  player.hunger = 20;
  player.air = 10;
  player.pos.set(0.5, world.getSurfaceHeight(0, 0) + 2, 0.5);
  player.vel.set(0, 0, 0);
  updateHudBars();
  canvas.requestPointerLock?.();
});

document.getElementById('btn-death-title').addEventListener('click', () => {
  sound.click();
  document.getElementById('death-screen').classList.add('hidden');
  document.getElementById('hud').classList.add('hidden');
  document.getElementById('title-screen').classList.remove('hidden');
  fpGroup.visible = false;
  isGameRunning = false;
  timeOfDay = 0.24;
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// =================== INITIAL WORLD & PANORAMA PREBUILD ===================
for (let i = 0; i < 25; i++) world.updateChunksAround(0, 0, renderDistance);
populateInitialMobs();

// =================== MAIN GAME LOOP ===================
let lastTime = performance.now();
let fpsFrames = 0;
let fpsClock = 0;
let currentFps = 60;

function animate(now) {
  requestAnimationFrame(animate);
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;

  fpsFrames++;
  fpsClock += dt;
  if (fpsClock >= 0.5) {
    currentFps = Math.round(fpsFrames / fpsClock);
    fpsFrames = 0;
    fpsClock = 0;
  }

  world.updateChunksAround(player.pos.x, player.pos.z, renderDistance);
  world.updateFluids(dt);
  updateFurnace(dt);
  updateSkyLighting(dt);

  if (!isGameRunning) {
    // Scenic Title Screen Panorama at center of clear spawn valley (Never clips into trees!)
    const t = now * 0.00014;
    const h = world.getSurfaceHeight(0, 0) + 3.2;
    camera.position.set(Math.cos(t) * 2.5, h, Math.sin(t) * 2.5);
    camera.lookAt(Math.cos(t + 1.2) * 28, h - 1.5, -35);
  } else {
    if (!isModalOpen) {
      updatePlayerPhysics(dt);
    }
    const hit = updateMining(dt);
    updateWorldEntities(dt);

    if (isModalOpen) {
      playerPreview.render(
        mouseScreen.x,
        mouseScreen.y,
        armorSlots,
        hotbar[player.selectedSlot],
        offhandSlot
      );
    }

    const biome = world.getBiomeAt(player.pos.x, player.pos.z);
    document.getElementById('dbg-fps').textContent =
      `Minecraft 1.20.1 (${currentFps} fps) | Mode: ${player.gameMode.toUpperCase()}`;
    document.getElementById('dbg-pos').textContent =
      `XYZ: ${player.pos.x.toFixed(1)} / ${player.pos.y.toFixed(1)} / ${player.pos.z.toFixed(1)} | Biome: ${biome}`;
    const targetName = hit ? (BLOCK_BY_ID[hit.blockId]?.name || 'Bloco') : 'Ar';
    document.getElementById('dbg-target').textContent =
      `Alvo: ${targetName} | Mobs: ${mobs.length} | Drops 3D: ${droppedItems.length}`;
  }

  renderer.render(scene, camera);
}

requestAnimationFrame(animate);
