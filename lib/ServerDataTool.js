/**
 * Tool to create JSON files with minecraft server data:
 * blocks, items, advancements are all used by scripts.
 */
const fs = require("fs");
const path = require("path");
const childp = require("child_process");
const config = require("./Configuration");
const log = config.logger;

const DOMAIN = "DataExtrator";
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
  log.verbose("Resetting data export status.", { domain: DOMAIN });
  advancementsExported = false;
  loottablesExported = false;
  recipesExported = false;
  tagsExported = false;
  blocklistExported = false;
  commandlistExported = false;
  registriesExported = false;
  if (fs.existsSync(path.join(config.TEMP_DIR, "data"))) {
    if (fs.existsSync(path.join(config.TEMP_DIR, "data", "minecraft"))) {
      advancementsExported = fs.existsSync(path.join(config.TEMP_DIR, "data", "minecraft", "advancements"));
      loottablesExported = fs.existsSync(path.join(config.TEMP_DIR, "data", "minecraft", "loot_tables"));
      recipesExported = fs.existsSync(path.join(config.TEMP_DIR, "data", "minecraft", "recipes"));
      tagsExported = fs.existsSync(path.join(config.TEMP_DIR, "data", "minecraft", "tags"));
    }
    if (fs.existsSync(path.join(config.TEMP_DIR, "data", "reports"))) {
      blocklistExported = fs.existsSync(path.join(config.TEMP_DIR, "data", "reports", "blocks.json"));
      blocklistExported = fs.existsSync(path.join(config.TEMP_DIR, "data", "reports", "commands.json"));
      blocklistExported = fs.existsSync(path.join(config.TEMP_DIR, "data", "reports", "registries.json"));
    }
  }
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
  log.verbose("Checking for data already in output folder.", { domain: DOMAIN });
  if (!advancementsExported) {
    log.info("Using server.jar to generate advancement data.", { domain: DOMAIN });
    exportMinecraftDataPromise().then((val) => {
      log.debug(val, { domain: DOMAIN });
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

module.exports = {
  checkForData,
  ensureMinecraftAdvancements,
};
