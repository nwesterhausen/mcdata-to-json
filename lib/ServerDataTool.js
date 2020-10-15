/**
 * Tool to create JSON files with minecraft server data:
 * blocks, items, advancements are all used by scripts.
 */
const fs = require("fs");
const path = require("path");
const JarExtractor = require("./JarDataExtractor");
const PATHS = require("./helpers/PathReference").paths;
const logger = require("./helpers/Logger").getLogger();
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
  logger.verbose("Resetting data export status.", { domain: DOMAIN });

  advancementsExported = fs.existsSync(path.join(PATHS.EXTRACTED_DATA_MINECRAFT_DIR, "advancements"));
  loottablesExported = fs.existsSync(path.join(PATHS.EXTRACTED_DATA_MINECRAFT_DIR, "loot_tables"));
  recipesExported = fs.existsSync(path.join(PATHS.EXTRACTED_DATA_MINECRAFT_DIR, "recipes"));
  tagsExported = fs.existsSync(path.join(PATHS.EXTRACTED_DATA_MINECRAFT_DIR, "tags"));

  // blocklistExported = fs.existsSync(path.join(TEMP_REPORT_DATA_DIR, "blocks.json"));
  // commandlistExported = fs.existsSync(path.join(TEMP_REPORT_DATA_DIR, "commands.json"));
  // registriesExported = fs.existsSync(path.join(TEMP_REPORT_DATA_DIR, "registries.json"));

  logger.debug(`advancements data is cached: ${advancementsExported}`, { domain: DOMAIN });
  logger.debug(`loottables data is cached: ${loottablesExported}`, { domain: DOMAIN });
  logger.debug(`recipes data is cached: ${recipesExported}`, { domain: DOMAIN });
  logger.debug(`tags data is cached: ${tagsExported}`, { domain: DOMAIN });
  // log.debug(`blocklist data is cached: ${blocklistExported}`, { domain: DOMAIN });
  // log.debug(`commandlist data is cached: ${commandlistExported}`, { domain: DOMAIN });
  // log.debug(`registries data is cached: ${registriesExported}`, { domain: DOMAIN });

  if (!advancementsExported || !loottablesExported || !recipesExported || !tagsExported) {
    logger.verbose("Missing some data which can be extracted from the server.jar file. Extracting..", {
      domain: DOMAIN,
    });
    JarExtractor.extractDataFromJar();
    dataProgressCheck();
  }
}

/**
 * Simply checks status and keeps checking
 */
function dataProgressCheck() {
  if (JarExtractor.dataExtractionProgress.percent < 100) {
    logger.verbose(
      `Data extraction progress: ${JarExtractor.dataExtractionProgress.percent}% ${JarExtractor.dataExtractionProgress.fileCount} files.`,
      { domain: DOMAIN }
    );
    setTimeout(dataProgressCheck, 5000);
  } else {
    logger.info(`Completed data file extraction from minecraft jar`, { domain: DOMAIN });
  }
}

/**
 * Function which starts some promises if the level.dat exists. If it doesn't exist,
 * there's no reason to run the conversion (obviously).
 */
function convertLevelDat() {
  const leveldatJsonFile = path.join(PATHS.OUTPUT_DIR, "level-dat.json");
  if (fs.existsSync(PATHS.LEVELDAT_FILE)) {
    logger.verbose(`Starting level.dat conversion`, { domain: DOMAIN });
    fs.promises
      .readFile(PATHS.LEVELDAT_FILE)
      .then(NbtTools.nbtToJson)
      .then(NbtTools.promiseCondenseNbtJson)
      .then((leveldatJson) => {
        return fs.promises.writeFile(leveldatJsonFile, JSON.stringify(leveldatJson));
      })
      .then(() => {
        logger.verbose(`Saved converted level.dat to ${leveldatJsonFile}`, { domain: DOMAIN });
      })
      .catch((err) => {
        logger.error(`Failed to save level.dat as JSON.`, { domain: DOMAIN });
        logger.error(err);
      });
  } else {
    logger.warn("Skipped level.dat conversion, no level.dat file!", { domain: DOMAIN });
  }
}

module.exports = {
  checkForData,
  convertLevelDat,
};
