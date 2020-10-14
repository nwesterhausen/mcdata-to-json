/**
 * Constants used for creating the JSON log arrays. By having these defined here they
 * can easily be used on a consumer side.
 */
module.exports = {
  // Cause of death codes
  ANVIL_DEATH: "death_anvil",
  ARROW_DEATH: "death_arrow",
  BLUDGEON_DEATH: "death_bludgeon",
  CACTUS_DEATH: "death_cactus",
  ELYTRA_DEATH: "death_elytra",
  EXPLOSION_DEATH: "death_explosion",
  FALLING_DEATH: "death_falling",
  FIRE_DEATH: "death_fire",
  FIREBALL_DEATH: "death_fireball",
  FIREWORK_DEATH: "death_firework",
  KILLED_DEATH: "death_killed",
  LAVA_DEATH: "death_lava",
  LIGHTNING_DEATH: "death_lightning",
  MAGMA_DEATH: "death_magma",
  POITION_DEATH: "death_potion",

  // Severity levels
  SEV_ERROR: "sev_error",
  SEV_INFO: "sev_info",
  SEV_WARN: "sev_warn",

  // Cause of death codes cont
  STARVE_DEATH: "death_starve",
  SUFFOCATE_DEATH: "death_suffocate",
  THORNS_DEATH: "death_thorns",

  // Normal log actions
  TYPE_ADVANCEMENT: "completed_advancement",
  TYPE_CHALLENGE: "completed_challenge",
  TYPE_CHAT: "chat",
  TYPE_COMMAND: "command",
  TYPE_ERROR: "type_error",
  TYPE_GOAL: "completed_goal",
  TYPE_KEEPENTITY: "type_keepentity",
  TYPE_LOGIN: "login",
  TYPE_LOGOFF: "logoff",
  TYPE_OVERLOADED: "type_overloaded",
  TYPE_PLAYERUUID: "player_uuid",
  TYPE_SERVERINFO: "serverinfo",
  TYPE_SERVERREADY: "serverready",
  TYPE_SERVERSTOP: "serverstop",

  // Cause of death codes fin
  VOID_DEATH: "death_void",
  WATER_DEATH: "death_water",
  WITHER_DEATH: "death_withered",
};
