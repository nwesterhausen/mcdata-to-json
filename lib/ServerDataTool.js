/**
 * Tool to create JSON files with minecraft server data:
 * blocks, items, advancements are all used by scripts.
 */
const fs = require("fs");
const path = require("path");
const JarExtractor = require("./JarDataExtractor");
const config = require("./Configuration");
const log = config.logger;
const NbtTools = require("./NbtTools");

const DOMAIN = "DataExtractor";
let advancementsExported = false;
let loottablesExported = false;
let recipesExported = false;
let tagsExported = false;
// let blocklistExported = false;
// let commandlistExported = false;
// let registriesExported = false;

/**
 * Checks for already exported data.
 */
function checkForData() {
  log.verbose("Resetting data export status.", { domain: DOMAIN });

  advancementsExported = fs.existsSync(path.join(config.EXTRACTED_DATA_MINECRAFT_DIR, "advancements"));
  loottablesExported = fs.existsSync(path.join(config.EXTRACTED_DATA_MINECRAFT_DIR, "loot_tables"));
  recipesExported = fs.existsSync(path.join(config.EXTRACTED_DATA_MINECRAFT_DIR, "recipes"));
  tagsExported = fs.existsSync(path.join(config.EXTRACTED_DATA_MINECRAFT_DIR, "tags"));

  // blocklistExported = fs.existsSync(path.join(TEMP_REPORT_DATA_DIR, "blocks.json"));
  // commandlistExported = fs.existsSync(path.join(TEMP_REPORT_DATA_DIR, "commands.json"));
  // registriesExported = fs.existsSync(path.join(TEMP_REPORT_DATA_DIR, "registries.json"));

  log.debug(`advancements data is cached: ${advancementsExported}`, { domain: DOMAIN });
  log.debug(`loottables data is cached: ${loottablesExported}`, { domain: DOMAIN });
  log.debug(`recipes data is cached: ${recipesExported}`, { domain: DOMAIN });
  log.debug(`tags data is cached: ${tagsExported}`, { domain: DOMAIN });
  // log.debug(`blocklist data is cached: ${blocklistExported}`, { domain: DOMAIN });
  // log.debug(`commandlist data is cached: ${commandlistExported}`, { domain: DOMAIN });
  // log.debug(`registries data is cached: ${registriesExported}`, { domain: DOMAIN });

  if (!advancementsExported || !loottablesExported || !recipesExported || !tagsExported) {
    log.verbose("Missing some data which can be extracted from the server.jar file. Extracting..", { domain: DOMAIN });
    JarExtractor.extractDataFromJar();
    dataProgressCheck();
  }
}

/**
 * Simply checks status and keeps checking
 */
function dataProgressCheck() {
  if (JarExtractor.dataExtractionProgress.percent < 100) {
    log.verbose(
      `Data extraction progress: ${JarExtractor.dataExtractionProgress.percent}% ${JarExtractor.dataExtractionProgress.fileCount} files.`,
      { domain: DOMAIN }
    );
    setTimeout(dataProgressCheck, 5000);
  } else {
    log.info(`Completed data file extraction from minecraft jar`, { domain: DOMAIN });
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
      .then(NbtTools.promiseCondenseNbtJson)
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
};
