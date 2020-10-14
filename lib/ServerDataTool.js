/**
 * Tool to create JSON files with minecraft server data:
 * blocks, items, advancements are all used by scripts.
 */
const fs = require("fs");
const path = require("path");
const childp = require("child_process");
const config = require("./Configuration");
const log = config.logger;
const NbtTools = require("./NbtTools");

const DOMAIN = "DataExtrator";
const TEMP_DATA_DIR = path.join(config.TEMP_DIR, "data");
const TEMP_MINECRAFT_DATA_DIR = path.join(config.TEMP_DIR, "data", "minecraft");
const TEMP_REPORT_DATA_DIR = path.join(config.TEMP_DIR, "data", "reports");
let advancementsExported = false;
let loottablesExported = false;
let recipesExported = false;
let tagsExported = false;
let blocklistExported = false;
let commandlistExported = false;
let registriesExported = false;

/**
 * Checks for already exported data.
 */
function checkForData() {
  log.verbose(`Ensuring temp dirs for data export exist.`, { domain: DOMAIN });
  config.ensureDirSync(TEMP_DATA_DIR);
  config.ensureDirSync(TEMP_REPORT_DATA_DIR);
  config.ensureDirSync(TEMP_MINECRAFT_DATA_DIR);
  log.verbose("Resetting data export status.", { domain: DOMAIN });

  advancementsExported = fs.existsSync(path.join(TEMP_MINECRAFT_DATA_DIR, "advancements"));
  loottablesExported = fs.existsSync(path.join(TEMP_MINECRAFT_DATA_DIR, "loot_tables"));
  recipesExported = fs.existsSync(path.join(TEMP_MINECRAFT_DATA_DIR, "recipes"));
  tagsExported = fs.existsSync(path.join(TEMP_MINECRAFT_DATA_DIR, "minecraft", "tags"));

  blocklistExported = fs.existsSync(path.join(TEMP_REPORT_DATA_DIR, "blocks.json"));
  commandlistExported = fs.existsSync(path.join(TEMP_REPORT_DATA_DIR, "commands.json"));
  registriesExported = fs.existsSync(path.join(TEMP_REPORT_DATA_DIR, "registries.json"));

  log.debug(`advancements data is cached: ${advancementsExported}`, { domain: DOMAIN });
  log.debug(`loottables data is cached: ${loottablesExported}`, { domain: DOMAIN });
  log.debug(`recipes data is cached: ${recipesExported}`, { domain: DOMAIN });
  log.debug(`tags data is cached: ${tagsExported}`, { domain: DOMAIN });
  log.debug(`blocklist data is cached: ${blocklistExported}`, { domain: DOMAIN });
  log.debug(`commandlist data is cached: ${commandlistExported}`, { domain: DOMAIN });
  log.debug(`registries data is cached: ${registriesExported}`, { domain: DOMAIN });
}

/**
 * Promise to export data from the server.jar file.
 * @return {Promise}
 */
function exportMinecraftDataPromise() {
  return new Promise((resolve, reject) => {
    log.verbose("Running minecraft data export from server jar.", { domain: DOMAIN });
    childp.exec(
      `java -cp ${config.MCJAR_FILE} net.minecraft.data.Main --all --output ${config.TEMP_DIR}`,
      (err, stdout, stderr) => {
        // eslint-disable-line
        if (err) {
          log.error("Failed to run command to export minecraft data.", { domain: DOMAIN });
          log.error(err, { domain: DOMAIN });
          reject(err);
        } else {
          log.info("Completed export of minecraft data.", { domain: DOMAIN });
          resolve(stdout);
        }
      }
    );
  });
}

/**
 * Makes sure advancement definitions exist
 */
function ensureMinecraftAdvancements() {
  log.verbose("Checking for advancement data already in output folder.", { domain: DOMAIN });
  if (!advancementsExported) {
    log.info("Using server.jar to generate advancement data.", { domain: DOMAIN });
    exportMinecraftDataPromise()
      .then((val) => {
        log.debug(val, { domain: DOMAIN });
      })
      .catch((err) => {
        log.error(err, { domain: DOMAIN });
      });
  } else {
    log.info(
      `Using cached minecraft advancements in ${path.join(config.TEMP_DIR, "data", "minecraft", "advancements")}`,
      {
        domain: DOMAIN,
      }
    );
  }
}

/**
 * Function which starts some promises if the level.dat exists. If it doesn't exist,
 * there's no reason to run the conversion (obviously).
 */
function convertLevelDat() {
  const leveldatJsonFile = path.join(config.OUTPUT_DIR, "level-dat.json");
  if (fs.existsSync(config.LEVELDAT_FILE)) {
    log.verbose(`Starting level.dat conversion`, { domain: DOMAIN });
    fs.promises
      .readFile(config.LEVELDAT_FILE)
      .then(NbtTools.nbtToJson)
      .then((nbtjson) => {
        log.silly(`Level.dat raw NBT ${JSON.stringify(nbtjson, null, 2)}`, { domain: DOMAIN });
        return NbtTools.promiseCondenseNbtJson(nbtjson);
      })
      .then((leveldatJson) => {
        return fs.promises.writeFile(leveldatJsonFile, JSON.stringify(leveldatJson));
      })
      .then(() => {
        log.verbose(`Saved converted level.dat to ${leveldatJsonFile}`, { domain: DOMAIN });
      })
      .catch((err) => {
        log.error(`Failed to save level.dat as JSON.`, { domain: DOMAIN });
        log.error(err);
      });
  } else {
    log.warn("Skipped level.dat conversion, no level.dat file!", { domain: DOMAIN });
  }
}

module.exports = {
  checkForData,
  convertLevelDat,
  ensureMinecraftAdvancements,
};
