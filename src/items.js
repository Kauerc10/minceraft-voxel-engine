// Complete Block, Item, Tool, Armor, Food, Crafting & Smelting Registry with Real Minecraft Tool Tiers
import { TEX } from './textures.js';

export const BLOCK = {
  AIR: 0,
  GRASS: 1,
  DIRT: 2,
  STONE: 3,
  COBBLESTONE: 4,
  BEDROCK: 5,
  OAK_LOG: 6,
  OAK_PLANKS: 7,
  OAK_LEAVES: 8,
  CHERRY_LOG: 9,
  CHERRY_LEAVES: 10,
  SAND: 11,
  SANDSTONE: 12,
  SNOW_GRASS: 13,
  COAL_ORE: 14,
  IRON_ORE: 15,
  GOLD_ORE: 16,
  DIAMOND_ORE: 17,
  CRAFTING_TABLE: 18,
  FURNACE: 19,
  GLASS: 20,
  WATER: 21,
  LAVA: 22,
  OBSIDIAN: 23,
  TNT: 24,
  CACTUS: 25,
  TORCH: 26,
  GOLD_BLOCK: 27,
  DIAMOND_BLOCK: 28,
  IRON_BLOCK: 29,
  BRICKS: 30,
  CHERRY_GRASS: 31,
};

export const TIER_RANK = {
  wood: 1,
  stone: 2,
  iron: 3,
  gold: 2,
  diamond: 4,
};

export const ITEMS = {
  grass_block: {
    id: 'grass_block', blockId: BLOCK.GRASS, name: 'Bloco de Grama', isBlock: true,
    hardness: 0.6, tool: 'shovel', drop: 'dirt',
    faces: { top: TEX.GRASS_TOP, bottom: TEX.DIRT, side: TEX.GRASS_SIDE }
  },
  cherry_grass: {
    id: 'cherry_grass', blockId: BLOCK.CHERRY_GRASS, name: 'Grama com Pétalas de Cerejeira', isBlock: true,
    hardness: 0.6, tool: 'shovel', drop: 'dirt',
    faces: { top: TEX.CHERRY_PETALS, bottom: TEX.DIRT, side: TEX.GRASS_SIDE }
  },
  dirt: {
    id: 'dirt', blockId: BLOCK.DIRT, name: 'Terra', isBlock: true,
    hardness: 0.5, tool: 'shovel', drop: 'dirt',
    faces: { top: TEX.DIRT, bottom: TEX.DIRT, side: TEX.DIRT }
  },
  stone: {
    id: 'stone', blockId: BLOCK.STONE, name: 'Pedra (Requer Picareta)', isBlock: true,
    hardness: 1.5, tool: 'pickaxe', minTier: 1, drop: 'cobblestone',
    faces: { top: TEX.STONE, bottom: TEX.STONE, side: TEX.STONE }
  },
  cobblestone: {
    id: 'cobblestone', blockId: BLOCK.COBBLESTONE, name: 'Pedregulho', isBlock: true,
    hardness: 1.8, tool: 'pickaxe', minTier: 1, drop: 'cobblestone',
    faces: { top: TEX.COBBLESTONE, bottom: TEX.COBBLESTONE, side: TEX.COBBLESTONE }
  },
  bedrock: {
    id: 'bedrock', blockId: BLOCK.BEDROCK, name: 'Rocha Matriz (Bedrock)', isBlock: true,
    hardness: Infinity, unbreakable: true,
    faces: { top: TEX.BEDROCK, bottom: TEX.BEDROCK, side: TEX.BEDROCK }
  },
  oak_log: {
    id: 'oak_log', blockId: BLOCK.OAK_LOG, name: 'Tronco de Carvalho', isBlock: true,
    hardness: 1.4, tool: 'axe', drop: 'oak_log', fuelTime: 15,
    faces: { top: TEX.OAK_LOG_TOP, bottom: TEX.OAK_LOG_TOP, side: TEX.OAK_LOG_SIDE }
  },
  oak_planks: {
    id: 'oak_planks', blockId: BLOCK.OAK_PLANKS, name: 'Tábuas de Madeira', isBlock: true,
    hardness: 1.4, tool: 'axe', drop: 'oak_planks', fuelTime: 15,
    faces: { top: TEX.OAK_PLANKS, bottom: TEX.OAK_PLANKS, side: TEX.OAK_PLANKS }
  },
  oak_leaves: {
    id: 'oak_leaves', blockId: BLOCK.OAK_LEAVES, name: 'Folhas de Carvalho', isBlock: true,
    hardness: 0.25, drop: 'apple', dropChance: 0.38,
    faces: { top: TEX.OAK_LEAVES, bottom: TEX.OAK_LEAVES, side: TEX.OAK_LEAVES }
  },
  cherry_log: {
    id: 'cherry_log', blockId: BLOCK.CHERRY_LOG, name: 'Tronco de Cerejeira', isBlock: true,
    hardness: 1.4, tool: 'axe', drop: 'cherry_log', fuelTime: 15,
    faces: { top: TEX.OAK_LOG_TOP, bottom: TEX.OAK_LOG_TOP, side: TEX.CHERRY_LOG_SIDE }
  },
  cherry_leaves: {
    id: 'cherry_leaves', blockId: BLOCK.CHERRY_LEAVES, name: 'Folhas de Cerejeira', isBlock: true,
    hardness: 0.25, drop: 'apple', dropChance: 0.32,
    faces: { top: TEX.CHERRY_LEAVES, bottom: TEX.CHERRY_LEAVES, side: TEX.CHERRY_LEAVES }
  },
  sand: {
    id: 'sand', blockId: BLOCK.SAND, name: 'Areia', isBlock: true,
    hardness: 0.5, tool: 'shovel', drop: 'sand',
    faces: { top: TEX.SAND, bottom: TEX.SAND, side: TEX.SAND }
  },
  sandstone: {
    id: 'sandstone', blockId: BLOCK.SANDSTONE, name: 'Arenito', isBlock: true,
    hardness: 1.2, tool: 'pickaxe', minTier: 1, drop: 'sandstone',
    faces: { top: TEX.SANDSTONE_TOP, bottom: TEX.SANDSTONE_TOP, side: TEX.SANDSTONE_SIDE }
  },
  snow_grass: {
    id: 'snow_grass', blockId: BLOCK.SNOW_GRASS, name: 'Bloco de Neve', isBlock: true,
    hardness: 0.6, tool: 'shovel', drop: 'snow_grass',
    faces: { top: TEX.SNOW, bottom: TEX.DIRT, side: TEX.SNOWY_GRASS_SIDE }
  },
  coal_ore: {
    id: 'coal_ore', blockId: BLOCK.COAL_ORE, name: 'Minério de Carvão (Picareta Madeira+)', isBlock: true,
    hardness: 2.2, tool: 'pickaxe', minTier: 1, drop: 'coal', xp: 2,
    faces: { top: TEX.COAL_ORE, bottom: TEX.COAL_ORE, side: TEX.COAL_ORE }
  },
  iron_ore: {
    id: 'iron_ore', blockId: BLOCK.IRON_ORE, name: 'Minério de Ferro (Picareta Pedra+)', isBlock: true,
    hardness: 2.6, tool: 'pickaxe', minTier: 2, drop: 'iron_ore',
    faces: { top: TEX.IRON_ORE, bottom: TEX.IRON_ORE, side: TEX.IRON_ORE }
  },
  gold_ore: {
    id: 'gold_ore', blockId: BLOCK.GOLD_ORE, name: 'Minério de Ouro (Picareta Ferro+)', isBlock: true,
    hardness: 2.8, tool: 'pickaxe', minTier: 3, drop: 'gold_ore',
    faces: { top: TEX.GOLD_ORE, bottom: TEX.GOLD_ORE, side: TEX.GOLD_ORE }
  },
  diamond_ore: {
    id: 'diamond_ore', blockId: BLOCK.DIAMOND_ORE, name: 'Minério de Diamante (Picareta Ferro+)', isBlock: true,
    hardness: 3.2, tool: 'pickaxe', minTier: 3, drop: 'diamond', xp: 8,
    faces: { top: TEX.DIAMOND_ORE, bottom: TEX.DIAMOND_ORE, side: TEX.DIAMOND_ORE }
  },
  crafting_table: {
    id: 'crafting_table', blockId: BLOCK.CRAFTING_TABLE, name: 'Bancada de Trabalho (Clique Dir p/ 3x3)', isBlock: true,
    hardness: 1.5, tool: 'axe', drop: 'crafting_table', interactive: 'crafting',
    faces: { top: TEX.CRAFTING_TOP, bottom: TEX.OAK_PLANKS, side: TEX.CRAFTING_SIDE }
  },
  furnace: {
    id: 'furnace', blockId: BLOCK.FURNACE, name: 'Fornalha (Clique Dir p/ Assar/Fundir)', isBlock: true,
    hardness: 2.4, tool: 'pickaxe', minTier: 1, drop: 'furnace', interactive: 'furnace',
    faces: { top: TEX.FURNACE_TOP, bottom: TEX.FURNACE_TOP, side: TEX.FURNACE_SIDE, front: TEX.FURNACE_FRONT }
  },
  glass: {
    id: 'glass', blockId: BLOCK.GLASS, name: 'Vidro', isBlock: true, transparent: true,
    hardness: 0.4, drop: null,
    faces: { top: TEX.GLASS, bottom: TEX.GLASS, side: TEX.GLASS }
  },
  water: {
    id: 'water', blockId: BLOCK.WATER, name: 'Água', isBlock: true, isFluid: true, transparent: true,
    hardness: Infinity, unbreakable: true,
    faces: { top: TEX.WATER, bottom: TEX.WATER, side: TEX.WATER }
  },
  lava: {
    id: 'lava', blockId: BLOCK.LAVA, name: 'Lava', isBlock: true, isFluid: true, light: 15,
    hardness: Infinity, unbreakable: true,
    faces: { top: TEX.LAVA, bottom: TEX.LAVA, side: TEX.LAVA }
  },
  obsidian: {
    id: 'obsidian', blockId: BLOCK.OBSIDIAN, name: 'Obsidiana (Picareta Diamante)', isBlock: true,
    hardness: 6.0, tool: 'pickaxe', minTier: 4, drop: 'obsidian',
    faces: { top: TEX.OBSIDIAN, bottom: TEX.OBSIDIAN, side: TEX.OBSIDIAN }
  },
  tnt: {
    id: 'tnt', blockId: BLOCK.TNT, name: 'TNT (Clique Dir p/ Detonar!)', isBlock: true,
    hardness: 0.2, drop: 'tnt', interactive: 'tnt',
    faces: { top: TEX.TNT_TOP, bottom: TEX.TNT_BOTTOM, side: TEX.TNT_SIDE }
  },
  cactus: {
    id: 'cactus', blockId: BLOCK.CACTUS, name: 'Cacto', isBlock: true,
    hardness: 0.4, drop: 'cactus', contactDamage: 1,
    faces: { top: TEX.CACTUS_TOP, bottom: TEX.CACTUS_TOP, side: TEX.CACTUS_SIDE }
  },
  torch: {
    id: 'torch', blockId: BLOCK.TORCH, name: 'Tocha', isBlock: true, light: 14,
    hardness: 0.1, drop: 'torch',
    faces: { top: TEX.TORCH, bottom: TEX.TORCH, side: TEX.TORCH }
  },
  gold_block: {
    id: 'gold_block', blockId: BLOCK.GOLD_BLOCK, name: 'Bloco de Ouro', isBlock: true,
    hardness: 3.0, tool: 'pickaxe', minTier: 3, drop: 'gold_block',
    faces: { top: TEX.GOLD_BLOCK, bottom: TEX.GOLD_BLOCK, side: TEX.GOLD_BLOCK }
  },
  diamond_block: {
    id: 'diamond_block', blockId: BLOCK.DIAMOND_BLOCK, name: 'Bloco de Diamante', isBlock: true,
    hardness: 3.5, tool: 'pickaxe', minTier: 3, drop: 'diamond_block',
    faces: { top: TEX.DIAMOND_BLOCK, bottom: TEX.DIAMOND_BLOCK, side: TEX.DIAMOND_BLOCK }
  },
  iron_block: {
    id: 'iron_block', blockId: BLOCK.IRON_BLOCK, name: 'Bloco de Ferro', isBlock: true,
    hardness: 3.0, tool: 'pickaxe', minTier: 2, drop: 'iron_block',
    faces: { top: TEX.IRON_BLOCK, bottom: TEX.IRON_BLOCK, side: TEX.IRON_BLOCK }
  },
  bricks: {
    id: 'bricks', blockId: BLOCK.BRICKS, name: 'Bloco de Tijolos', isBlock: true,
    hardness: 2.0, tool: 'pickaxe', minTier: 1, drop: 'bricks',
    faces: { top: TEX.BRICKS, bottom: TEX.BRICKS, side: TEX.BRICKS }
  },

  // Materials
  stick: { id: 'stick', name: 'Graveto', maxStack: 64, fuelTime: 5 },
  coal: { id: 'coal', name: 'Carvão', maxStack: 64, fuelTime: 80 },
  iron_ingot: { id: 'iron_ingot', name: 'Barra de Ferro', maxStack: 64 },
  gold_ingot: { id: 'gold_ingot', name: 'Barra de Ouro', maxStack: 64 },
  diamond: { id: 'diamond', name: 'Diamante', maxStack: 64 },

  // Buckets
  bucket: { id: 'bucket', name: 'Balde Vazio (Coleta Água/Lava)', maxStack: 16 },
  water_bucket: { id: 'water_bucket', name: 'Balde de Água', maxStack: 1, placesFluid: BLOCK.WATER },
  lava_bucket: { id: 'lava_bucket', name: 'Balde de Lava', maxStack: 1, placesFluid: BLOCK.LAVA, fuelTime: 1000 },

  // Food
  carrot: { id: 'carrot', name: 'Cenoura', isFood: true, hunger: 3, heal: 2, maxStack: 64 },
  apple: { id: 'apple', name: 'Maçã', isFood: true, hunger: 4, heal: 3, maxStack: 64 },
  bread: { id: 'bread', name: 'Pão', isFood: true, hunger: 5, heal: 4, maxStack: 64 },
  raw_beef: { id: 'raw_beef', name: 'Carne Crua', isFood: true, hunger: 3, heal: 1, maxStack: 64 },
  cooked_beef: { id: 'cooked_beef', name: 'Filé Assado', isFood: true, hunger: 8, heal: 6, maxStack: 64 },

  // Weapons, Bow & Shield
  bow: { id: 'bow', name: 'Arco (Segure Click Dir p/ Atirar)', maxStack: 1, maxDurability: 384, damage: 8 },
  arrow: { id: 'arrow', name: 'Flecha', maxStack: 64 },
  shield: { id: 'shield', name: 'Escudo (Bloqueia 75% do Dano)', maxStack: 1, maxDurability: 336, isShield: true },

  // Pickaxes
  wooden_pickaxe: { id: 'wooden_pickaxe', name: 'Picareta de Madeira', toolType: 'pickaxe', tier: 'wood', tierRank: 1, speed: 2.6, damage: 3, maxDurability: 59, maxStack: 1 },
  stone_pickaxe: { id: 'stone_pickaxe', name: 'Picareta de Pedra', toolType: 'pickaxe', tier: 'stone', tierRank: 2, speed: 4.5, damage: 4, maxDurability: 131, maxStack: 1 },
  iron_pickaxe: { id: 'iron_pickaxe', name: 'Picareta de Ferro', toolType: 'pickaxe', tier: 'iron', tierRank: 3, speed: 6.5, damage: 5, maxDurability: 250, maxStack: 1 },
  diamond_pickaxe: { id: 'diamond_pickaxe', name: 'Picareta de Diamante', toolType: 'pickaxe', tier: 'diamond', tierRank: 4, speed: 9.5, damage: 6, maxDurability: 1561, maxStack: 1 },

  // Axes
  wooden_axe: { id: 'wooden_axe', name: 'Machado de Madeira', toolType: 'axe', tier: 'wood', tierRank: 1, speed: 2.6, damage: 5, maxDurability: 59, maxStack: 1 },
  stone_axe: { id: 'stone_axe', name: 'Machado de Pedra', toolType: 'axe', tier: 'stone', tierRank: 2, speed: 4.5, damage: 7, maxDurability: 131, maxStack: 1 },
  iron_axe: { id: 'iron_axe', name: 'Machado de Ferro', toolType: 'axe', tier: 'iron', tierRank: 3, speed: 6.5, damage: 8, maxDurability: 250, maxStack: 1 },
  diamond_axe: { id: 'diamond_axe', name: 'Machado de Diamante', toolType: 'axe', tier: 'diamond', tierRank: 4, speed: 9.5, damage: 9, maxDurability: 1561, maxStack: 1 },

  // Shovels
  iron_shovel: { id: 'iron_shovel', name: 'Pá de Ferro', toolType: 'shovel', tier: 'iron', tierRank: 3, speed: 6.5, damage: 4, maxDurability: 250, maxStack: 1 },
  diamond_shovel: { id: 'diamond_shovel', name: 'Pá de Diamante', toolType: 'shovel', tier: 'diamond', tierRank: 4, speed: 9.5, damage: 5, maxDurability: 1561, maxStack: 1 },

  // Swords
  wooden_sword: { id: 'wooden_sword', name: 'Espada de Madeira', toolType: 'sword', tier: 'wood', tierRank: 1, speed: 1.8, damage: 5, maxDurability: 59, maxStack: 1 },
  stone_sword: { id: 'stone_sword', name: 'Espada de Pedra', toolType: 'sword', tier: 'stone', tierRank: 2, speed: 1.8, damage: 6, maxDurability: 131, maxStack: 1 },
  iron_sword: { id: 'iron_sword', name: 'Espada de Ferro', toolType: 'sword', tier: 'iron', tierRank: 3, speed: 1.8, damage: 7, maxDurability: 250, maxStack: 1 },
  diamond_sword: { id: 'diamond_sword', name: 'Espada de Diamante', toolType: 'sword', tier: 'diamond', tierRank: 4, speed: 1.8, damage: 9, maxDurability: 1561, maxStack: 1 },

  // Armor
  diamond_helmet: { id: 'diamond_helmet', name: 'Capacete de Diamante', armorSlot: 'helmet', tier: 'diamond', defense: 3, maxDurability: 363, maxStack: 1 },
  diamond_chestplate: { id: 'diamond_chestplate', name: 'Peitoral de Diamante', armorSlot: 'chestplate', tier: 'diamond', defense: 8, maxDurability: 528, maxStack: 1 },
  diamond_leggings: { id: 'diamond_leggings', name: 'Calças de Diamante', armorSlot: 'leggings', tier: 'diamond', defense: 6, maxDurability: 495, maxStack: 1 },
  diamond_boots: { id: 'diamond_boots', name: 'Botas de Diamante', armorSlot: 'boots', tier: 'diamond', defense: 3, maxDurability: 429, maxStack: 1 },

  iron_helmet: { id: 'iron_helmet', name: 'Capacete de Ferro', armorSlot: 'helmet', tier: 'iron', defense: 2, maxDurability: 165, maxStack: 1 },
  iron_chestplate: { id: 'iron_chestplate', name: 'Peitoral de Ferro', armorSlot: 'chestplate', tier: 'iron', defense: 6, maxDurability: 240, maxStack: 1 },
  iron_leggings: { id: 'iron_leggings', name: 'Calças de Ferro', armorSlot: 'leggings', tier: 'iron', defense: 5, maxDurability: 225, maxStack: 1 },
  iron_boots: { id: 'iron_boots', name: 'Botas de Ferro', armorSlot: 'boots', tier: 'iron', defense: 2, maxDurability: 195, maxStack: 1 },
};

export const BLOCK_BY_ID = {};
Object.values(ITEMS).forEach((item) => {
  if (item.isBlock && item.blockId !== undefined) {
    BLOCK_BY_ID[item.blockId] = item;
  }
});

export const SMELTING_RECIPES = {
  iron_ore: { id: 'iron_ingot', count: 1 },
  gold_ore: { id: 'gold_ingot', count: 1 },
  sand: { id: 'glass', count: 1 },
  cobblestone: { id: 'stone', count: 1 },
  raw_beef: { id: 'cooked_beef', count: 1 },
  oak_log: { id: 'coal', count: 1 },
  cherry_log: { id: 'coal', count: 1 },
};

export const CRAFTING_RECIPES = [
  { name: 'Tábuas de Carvalho (x4)', size: 1, ingredients: { oak_log: 1 }, result: { id: 'oak_planks', count: 4 } },
  { name: 'Tábuas (de Cerejeira x4)', size: 1, ingredients: { cherry_log: 1 }, result: { id: 'oak_planks', count: 4 } },
  { name: 'Gravetos (x4)', size: 2, ingredients: { oak_planks: 2 }, result: { id: 'stick', count: 4 } },
  { name: 'Bancada de Trabalho (3x3)', size: 2, ingredients: { oak_planks: 4 }, result: { id: 'crafting_table', count: 1 } },
  { name: 'Tochas (x4)', size: 2, ingredients: { coal: 1, stick: 1 }, result: { id: 'torch', count: 4 } },
  { name: 'Picareta de Madeira', size: 3, ingredients: { oak_planks: 3, stick: 2 }, result: { id: 'wooden_pickaxe', count: 1 } },
  { name: 'Machado de Madeira', size: 3, ingredients: { oak_planks: 3, stick: 2 }, result: { id: 'wooden_axe', count: 1 } },
  { name: 'Espada de Madeira', size: 3, ingredients: { oak_planks: 2, stick: 1 }, result: { id: 'wooden_sword', count: 1 } },
  { name: 'Fornalha', size: 3, ingredients: { cobblestone: 8 }, result: { id: 'furnace', count: 1 } },
  { name: 'Picareta de Pedra', size: 3, ingredients: { cobblestone: 3, stick: 2 }, result: { id: 'stone_pickaxe', count: 1 } },
  { name: 'Machado de Pedra', size: 3, ingredients: { cobblestone: 3, stick: 2 }, result: { id: 'stone_axe', count: 1 } },
  { name: 'Espada de Pedra', size: 3, ingredients: { cobblestone: 2, stick: 1 }, result: { id: 'stone_sword', count: 1 } },
  { name: 'Picareta de Ferro', size: 3, ingredients: { iron_ingot: 3, stick: 2 }, result: { id: 'iron_pickaxe', count: 1 } },
  { name: 'Machado de Ferro', size: 3, ingredients: { iron_ingot: 3, stick: 2 }, result: { id: 'iron_axe', count: 1 } },
  { name: 'Espada de Ferro', size: 3, ingredients: { iron_ingot: 2, stick: 1 }, result: { id: 'iron_sword', count: 1 } },
  { name: 'Balde de Ferro', size: 3, ingredients: { iron_ingot: 3 }, result: { id: 'bucket', count: 1 } },
  { name: 'Escudo', size: 3, ingredients: { oak_planks: 6, iron_ingot: 1 }, result: { id: 'shield', count: 1 } },
  { name: 'Capacete de Ferro', size: 3, ingredients: { iron_ingot: 5 }, result: { id: 'iron_helmet', count: 1 } },
  { name: 'Peitoral de Ferro', size: 3, ingredients: { iron_ingot: 8 }, result: { id: 'iron_chestplate', count: 1 } },
  { name: 'Calças de Ferro', size: 3, ingredients: { iron_ingot: 7 }, result: { id: 'iron_leggings', count: 1 } },
  { name: 'Botas de Ferro', size: 3, ingredients: { iron_ingot: 4 }, result: { id: 'iron_boots', count: 1 } },
  { name: 'Picareta de Diamante', size: 3, ingredients: { diamond: 3, stick: 2 }, result: { id: 'diamond_pickaxe', count: 1 } },
  { name: 'Machado de Diamante', size: 3, ingredients: { diamond: 3, stick: 2 }, result: { id: 'diamond_axe', count: 1 } },
  { name: 'Espada de Diamante', size: 3, ingredients: { diamond: 2, stick: 1 }, result: { id: 'diamond_sword', count: 1 } },
  { name: 'Capacete de Diamante', size: 3, ingredients: { diamond: 5 }, result: { id: 'diamond_helmet', count: 1 } },
  { name: 'Peitoral de Diamante', size: 3, ingredients: { diamond: 8 }, result: { id: 'diamond_chestplate', count: 1 } },
  { name: 'Calças de Diamante', size: 3, ingredients: { diamond: 7 }, result: { id: 'diamond_leggings', count: 1 } },
  { name: 'Botas de Diamante', size: 3, ingredients: { diamond: 4 }, result: { id: 'diamond_boots', count: 1 } },
  { name: 'TNT', size: 2, ingredients: { sand: 4, coal: 2 }, result: { id: 'tnt', count: 1 } },
];

export function createStack(id, count = 1, durability = null) {
  const def = ITEMS[id];
  if (!def) return null;
  return {
    id,
    count,
    durability: durability !== null ? durability : (def.maxDurability || null),
  };
}
