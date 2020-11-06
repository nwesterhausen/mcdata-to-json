export interface MCGameRules {
  doInsomnia: boolean;
  forgiveDeadPlayers: boolean;
  doDaylightCycle: boolean;
  fallDamage: boolean;
  spawnRadius: number;
  doWeatherCycle: boolean;
  doPatrolSpawning: boolean;
  maxCommandChainLength: number;
  universalAnger: boolean;
  doImmediateRespawn: boolean;
  fireDamage: boolean;
  maxEntityCramming: number;
  doMobSpawning: boolean;
  showDeathMessages: boolean;
  announceAdvancements: boolean;
  disableRaids: boolean;
  naturalRegeneration: boolean;
  sendCommandFeedback: boolean;
  reducedDebugInfo: boolean;
  drowningDamage: boolean;
  doLimitedCrafting: boolean;
  commandBlockOutput: boolean;
  doTraderSpawning: boolean;
  doFireTick: boolean;
  spectatorsGenerateChunks: boolean;
  mobGriefing: boolean;
  doEntityDrops: boolean;
  doTileDrops: boolean;
  keepInventory: boolean;
  randomTickSpeed: number;
  doMobLoot: boolean;
  disableElytraMovementCheck: boolean;
  logAdminCommands: boolean;
}

export interface MCDimensionDef {
  type: string;
  generator: {
    type: string;
    biome_source: {
      type: string;
      preset: string;
      seed: string;
    };
    seed: string;
    settings: string;
  };
}

export interface WorldGenSettings {
  bonus_chest: boolean;
  generate_features: boolean;
  dimensions: {
    [key: string]: MCDimensionDef;
  };
  seed: string;
}

export interface MCLevelData {
  Difficulty: number;
  thunderTime: number;
  BorderSize: number;
  LastPlayer: string;
  allowCommands: boolean;
  BorderCenterX: number;
  hardcore: boolean;
  version: number;
  ServerBrands: string[];
  SpawnX: number;
  GameType: number;
  BorderSafeZone: number;
  SpawnAngle: number;
  levelName: string;
  Time: string;
  ScheduledEvents: any[];
  clearWeatherTime: number;
  WanderingTraderId: number[];
  BorderDamagePerBlock: number;
  WanderingTraderSpawnDelay: number;
  "Bukkit.Version"?: string;
  thundering: boolean;
  WasModded: boolean;
  BorderWarningTime: number;
  WanderingTraderSpawnChance: number;
  SpawnY: number;
  SpawnZ: number;
  BorderSizeLerpTime: number;
  raining: boolean;
  WorldGenSettings: WorldGenSettings;
  rainTime: number;
  DataPacks: {
    Enabled: string[];
    Disabled: string[];
  };
  DataVersion: number;
  GameRules: MCGameRules;
  DragonFight: any;
  DifficultyLocked: boolean;
  DayTime: number;
  BorderCenterZ: number;
  BorderSizeLerpTarget: number;
  Version: {
    Name: string;
    Snapshot: boolean;
    Id: number;
  };
  CustomBossEvents: any;
}

export interface UUIDCache {
  [key: string]: string;
}

export interface MCAdvancement {
  [key: string]: {
    criteria: {
      [key: string]: string;
    };
    done: boolean;
  };
}

export interface MCPlayerRecipeBook {
  isBlastingFurnaceFilteringCraftable: boolean;
  isGuiOpen: false;
  toBeDisplayed: string[];
  isSmokerGuidOpen: boolean;
  isBLastingFurnaceGuiOpen: boolean;
  isFurnaceFilteringCraftable: boolean;
  isFurnaceGuiOpen: boolean;
  isFilteringCraftable: boolean;
  isSmokerFilteringCraftable: boolean;
  recipes: string[];
}

export interface MCDataAttribute {
  Name: string;
  Base: number;
}

export interface MCEnchantment {
  id: string;
  lvl: number;
}

export interface MCInventorySlot {
  Slot: number;
  id: string;
  tag?: {
    Damage?: number;
    RepairCost?: number;
    Enchantments?: MCEnchantment[];
  };
  Count: number;
}

export interface MCPlayerData {
  seenCredits: boolean;
  DeathTime: number;
  bukkit?: {
    newTotalExp: number;
    newLevel: number;
    newExp: number;
    keepLevel: boolean;
    lastPlayed: string;
    firstPlayed: string;
    expToDrop: number;
    lastKnownName: string;
  };
  "Bukkit.updateLevel"?: number;
  foodTickTimer: number;
  recipeBook: MCPlayerRecipeBook;
  XPTotal: number;
  OnGround: boolean;
  AbsorptionAmount: number;
  SpawnDimension: string;
  SpawnX: number;
  SpawnY: number;
  SpawnZ: number;
  SpawnAngle: number;
  playerGameType: number;
  Attributes: MCDataAttribute[];
  Invulnerable: boolean;
  SelectedItemSlot: number;
  Brain: {
    memories: any;
  };
  Dimension: string;
  "Paper.Origin"?: [number, number, number];
  abilities?: {
    walkSpeed: number;
    flySpeed: number;
    instabuild: boolean;
    flying: boolean;
    myfly: boolean;
    invulnverable: boolean;
    mayBuild: boolean;
  };
  Score: number;
  Rotation: [number, number];
  HurtByTimestamp: number;
  foodSaturationLevel: number;
  WorldUUIDMost: string;
  WorldUUIDLeast: string;
  Paper?: {
    LastLogin: string;
    LastSeen: string;
  };
  EnderItems: MCInventorySlot[];
  Inventory: MCInventorySlot[];
  foodLevel: number;
  Air: number;
  XpSeed: number;
  XpLevel: number;
  Motion: [number, number, number];
  UUID: [number, number, number, number];
  "Spigot.ticksLived"?: number;
  FallDistance: number;
  DataVersion: number;
  SleepTimer: number;
  XpP: number;
  SpawnForced: boolean;
  previousPlayerGameType: number;
  Pos: [number, number, number];
  Health: number;
  HurtTime: number;
  FallFlying: number;
  Fire: number;
  PortalCooldown: number;
  foodExhaustionLevel: number;
  "Paper.SpawnReason"?: string;
}

export interface LogEntry {
  description:
    | string
    | {
        player: string;
        chat: string;
      };
  severity: string;
  timestamp: number;
  type: string;
  player: string;
}

export interface MCProfile {
  id: string;
  name: string;
  properties: any;
  textures: {
    timestamp: number;
    profileId: string;
    profileName: string;
    textures: {
      SKIN: {
        url: string;
      };
    };
  };
}

export interface MCStats {
  "minecraft:mined": {
    [key: string]: number;
  };

  "minecraft:picked_up": {
    [key: string]: number;
  };

  "minecraft:broken": {
    [key: string]: number;
  };

  "minecraft:killed_by": {
    [key: string]: number;
  };

  "minecraft:crafted": {
    [key: string]: number;
  };

  "minecraft:used": {
    [key: string]: number;
  };
  "minecraft:killed": {
    [key: string]: number;
  };

  "minecraft:dropped": {
    [key: string]: number;
  };

  "minecraft:custom"?: {
    [key: string]: number;
  };
}

export interface PlayerData {
  advancements: MCAdvancement[];
  data: MCPlayerData;
  log: LogEntry[];
  profile: MCProfile;
  stats: MCStats;
  name: string;
  uuid: string;
}
