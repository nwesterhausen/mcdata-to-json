/**
 * Tool to create JSON files with minecraft server data:
 * blocks, items, advancements are all used by scripts.
 */
const fs = require("fs");
const path = require("path");
const childp = require("child_process");
const log = require("./Configuration").logger;

const DOMAIN = "DataExtrator";
let tempRoot = "unset";
let serverjarPath = "unset";
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
  if (fs.existsSync(path.join(tempRoot, "data"))) {
    if (fs.existsSync(path.join(tempRoot, "data", "minecraft"))) {
      advancementsExported = fs.existsSync(path.join(tempRoot, "data", "minecraft", "advancements"));
      loottablesExported = fs.existsSync(path.join(tempRoot, "data", "minecraft", "loot_tables"));
      recipesExported = fs.existsSync(path.join(tempRoot, "data", "minecraft", "recipes"));
      tagsExported = fs.existsSync(path.join(tempRoot, "data", "minecraft", "tags"));
    }
    if (fs.existsSync(path.join(tempRoot, "data", "reports"))) {
      blocklistExported = fs.existsSync(path.join(tempRoot, "data", "reports", "blocks.json"));
      blocklistExported = fs.existsSync(path.join(tempRoot, "data", "reports", "commands.json"));
      blocklistExported = fs.existsSync(path.join(tempRoot, "data", "reports", "registries.json"));
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
    if (tempRoot === "unset" || serverjarPath === "unset") {
      log.error("Tried to run data generation without setting serverjar and/or output folder.", { domain: DOMAIN });
      log.error(`datadir: ${tempRoot}, serverjar: ${serverjarPath}`, { domain: DOMAIN });
      reject(new Error("Failed to set directories."));
    }
    childp.exec(
      `java -cp ${serverjarPath} net.minecraft.data.Main --all --output ${tempRoot}`,
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
    log.info(`Using cached minecraft advancements in ${path.join(tempRoot, "data", "minecraft", "advancements")}`, {
      domain: DOMAIN,
    });
  }
}

/**
 * Keeps things set to one configuration instance *
 * @param {object} config
 */
function setConfig(config) {
  tempRoot = config.TEMP_DIR;
  serverjarPath = config.MCJAR_FILE;
  checkForData();
}

module.exports = {
  ensureMinecraftAdvancements,
  setConfig,
};
