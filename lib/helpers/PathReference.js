const path = require("path");
const fs = require("fs");

const logger = require("./Logger").getLogger();
const DOMAIN = "PathReference";

const BASE_PATHS = {
  MC_DIR: null,
  OUT_DIR: null,
  WORK_DIR: null,
};

const RESOLVED_PATHS = {
  MC_DIR: null,
  OUTPUT_DIR: null,
  WORK_DIR: null,
  EXTRACTED_DIR: null,
  TEMP_DIR: null,
  ADVANCEMENTS_DIR: null,
  ASSETS_DIR: null,
  CACHED_MCA_JSON_DIR: null,
  DATA_DIR: null,
  DATAPACKS_DIR: null,
  EXTRACTED_ASSETS_DIR: null,
  EXTRACTED_DATA_DIR: null,
  EXTRACTED_DATA_MINECRAFT_DIR: null,
  LEVELDAT_FILE: null,
  LOGS_DIR: null,
  MCJAR_CLIENT_FILE: null,
  MCJAR_SERVER_FILE: null,
  OPSLIST_FILE: null,
  PLAYERDATA_DIR: null,
  PROPERTIES_FILE: null,
  STATS_DIR: null,
  TEMP_ADVANCEMENT_JSON_DIR: null,
  TEMP_LOG_JSON_DIR: null,
  TEMP_PLAYERDATA_JSON_DIR: null,
  TEMP_PROFILE_JSON_DIR: null,
  USERCACHE_FILE: null,
  WORLD_DIRS: null,
  WORLDDATA_DIR: null,
};

const DETERMINATIONS = {
  BUKKIT_LIKE: false,
};

let resolvedStatus = false;

const BasePathsNotSetError = new Error("BasePathsNotSetError: Before referencing paths, the base paths need set!");

/**
 * Fill in the resolved paths based on base paths.
 */
function resolvePaths() {
  if (BASE_PATHS.MC_DIR === null || BASE_PATHS.OUT_DIR === null || BASE_PATHS.WORK_DIR === null) {
    throw BasePathsNotSetError;
  }
  logger.verbose(`Beginning path resolution from base paths. ${JSON.stringify(BASE_PATHS)}`, { domain: DOMAIN });
  RESOLVED_PATHS.MC_DIR = path.resolve(BASE_PATHS.MC_DIR);
  RESOLVED_PATHS.OUTPUT_DIR = path.resolve(BASE_PATHS.OUT_DIR);
  RESOLVED_PATHS.WORK_DIR = path.resolve(BASE_PATHS.WORK_DIR);

  determineIfBukkitlike();
  setServerJarPath();

  RESOLVED_PATHS.PROPERTIES_FILE = path.join(RESOLVED_PATHS.MC_DIR, "server.properties");
  RESOLVED_PATHS.USERCACHE_FILE = path.join(RESOLVED_PATHS.MC_DIR, "usercache.json");
  RESOLVED_PATHS.OPSLIST_FILE = path.join(RESOLVED_PATHS.MC_DIR, "ops.json");
  RESOLVED_PATHS.LOGS_DIR = path.join(RESOLVED_PATHS.MC_DIR, "logs");
  RESOLVED_PATHS.TEMP_DIR = path.join(RESOLVED_PATHS.WORK_DIR, ".temp");
  RESOLVED_PATHS.EXTRACTED_DIR = path.join(RESOLVED_PATHS.WORK_DIR, "extracted");
  RESOLVED_PATHS.EXTRACTED_ASSETS_DIR = path.join(RESOLVED_PATHS.EXTRACTED_DIR, "assets");
  RESOLVED_PATHS.EXTRACTED_DATA_DIR = path.join(RESOLVED_PATHS.EXTRACTED_DIR, "data");
  RESOLVED_PATHS.EXTRACTED_DATA_MINECRAFT_DIR = path.join(RESOLVED_PATHS.EXTRACTED_DATA_DIR, "minecraft");
  RESOLVED_PATHS.DATA_DIR = path.join(RESOLVED_PATHS.EXTRACTED_DIR, "data");
  RESOLVED_PATHS.ASSETS_DIR = path.join(RESOLVED_PATHS.EXTRACTED_DIR, "assets");
  RESOLVED_PATHS.CACHED_MCA_JSON_DIR = path.join(RESOLVED_PATHS.WORK_DIR, "mcajson");
  RESOLVED_PATHS.TEMP_PLAYERDATA_JSON_DIR = path.join(RESOLVED_PATHS.TEMP_DIR, "playerdata");
  RESOLVED_PATHS.TEMP_LOG_JSON_DIR = path.join(RESOLVED_PATHS.TEMP_DIR, "logs");
  RESOLVED_PATHS.TEMP_ADVANCEMENT_JSON_DIR = path.join(RESOLVED_PATHS.TEMP_DIR, "advancements");
  RESOLVED_PATHS.TEMP_PROFILE_JSON_DIR = path.join(RESOLVED_PATHS.TEMP_DIR, "profiles");

  RESOLVED_PATHS.WORLD_DIRS = locateAndAssignWorlds();
  RESOLVED_PATHS.WORLDDATA_DIR = path.join(RESOLVED_PATHS.WORLD_DIRS.world, "data");
  RESOLVED_PATHS.DATAPACKS_DIR = path.join(RESOLVED_PATHS.WORLD_DIRS.world, "datapacks");
  RESOLVED_PATHS.STATS_DIR = path.join(RESOLVED_PATHS.WORLD_DIRS.world, "stats");
  RESOLVED_PATHS.ADVANCEMENTS_DIR = path.join(RESOLVED_PATHS.WORLD_DIRS.world, "advancements");
  RESOLVED_PATHS.PLAYERDATA_DIR = path.join(RESOLVED_PATHS.WORLD_DIRS.world, "playerdata");
  RESOLVED_PATHS.LEVELDAT_FILE = path.join(RESOLVED_PATHS.WORLD_DIRS.world, "level.dat");

  validatePaths();
  resolvedStatus = true;
}

/**
 * Goes through all paths in RESOLVED_PATHS and validates them
 */
function validatePaths() {
  for (const path in RESOLVED_PATHS) {
    if (path !== "WORLD_DIRS") {
      if (fs.existsSync(RESOLVED_PATHS[path])) {
        logger.verbose(`✔ ${path} exists. (${RESOLVED_PATHS[path]})`, { domain: DOMAIN });
      } else {
        logger.info(`⚠ ${path} not found! (${RESOLVED_PATHS[path]})`, { domain: DOMAIN });
        if (path.endsWith("_FILE")) {
          // Files we do not create, only check if they exist
          logger.warn(`${path} may be required for mcdata-to-json to run properly.`, { domain: DOMAIN });
        } else if (path.endsWith("_DIR")) {
          // Directories we check for (besides worlds) we create
          fs.mkdirSync(RESOLVED_PATHS[path]);
          logger.info(`Created ${path} at ${RESOLVED_PATHS[path]}`, { domain: DOMAIN });
        } else {
          logger.warn(`Found unhandled path structure ${path}`, { domain: DOMAIN });
        }
      }
    }
  }
  // Check that the world directories exist, but do not create them if they don't
  for (const worldPath in RESOLVED_PATHS.WORLD_DIRS) {
    if (fs.existsSync(RESOLVED_PATHS.WORLD_DIRS[worldPath])) {
      logger.verbose(`✔ ${worldPath} exists. (${RESOLVED_PATHS.WORLD_DIRS[worldPath]})`, { domain: DOMAIN });
    } else {
      logger.warn(`⚠ Expected WorldPath ${worldPath} to exist but it doesn't.`, { domain: DOMAIN });
      logger.warn(`${worldPath} may be required for mcdata-to-json to run properly.`, { domain: DOMAIN });
    }
  }
}

/**
 * Sets DETERMINATIONS.BUKKIT_LIKE based on presence of certain folders and files
 */
function determineIfBukkitlike() {
  const REQUIRED = 4;
  let confidence = 0;

  if (fs.existsSync(path.join(RESOLVED_PATHS.MC_DIR, "cache"))) confidence++;
  if (fs.existsSync(path.join(RESOLVED_PATHS.MC_DIR, "bukkit.yml"))) confidence++;
  if (fs.existsSync(path.join(RESOLVED_PATHS.MC_DIR, "paper.yml"))) confidence++;
  if (fs.existsSync(path.join(RESOLVED_PATHS.MC_DIR, "spigot.yml"))) confidence++;
  if (fs.existsSync(path.join(RESOLVED_PATHS.MC_DIR, "world_the_end"))) confidence++;
  if (fs.existsSync(path.join(RESOLVED_PATHS.MC_DIR, "world_nether"))) confidence++;
  if (fs.existsSync(path.join(RESOLVED_PATHS.MC_DIR, "paper.jar"))) confidence++;

  logger.verbose(`BUKKIT_LIKE confidence level ${confidence}/${REQUIRED}`, { domain: DOMAIN });
  DETERMINATIONS.BUKKIT_LIKE = confidence > REQUIRED;
}

/**
 * Assigns world directories to provided dictionary
 * @return {object} WORLDS_DICT
 */
function locateAndAssignWorlds() {
  const worldsDict = {};
  // Let's look through what folders are in the minecraft folder
  const possibleWorlds = fs
    .readdirSync(RESOLVED_PATHS.MC_DIR, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name)
    .filter((dir) => fs.readdirSync(path.join(RESOLVED_PATHS.MC_DIR, dir)).indexOf("region") !== -1);

  logger.debug(`Filtered possible world dirs to ${JSON.stringify(possibleWorlds)}`, { domain: DOMAIN });

  if (possibleWorlds.length !== 1) {
    if (possibleWorlds.length === 0) {
      logger.error("Was unable to find any world directory in minecraft folder.", { domain: DOMAIN });
      throw new Error(`Unable to find overworld in ${RESOLVED_PATHS.MC_DIR}`);
    }
    logger.error("Found too many options for overworld directory in minecraft folder.", { domain: DOMAIN });
    logger.error("Specify a world dir with the --overworld= option.", { domain: DOMAIN });
    throw new Error(`Too many world options in ${RESOLVED_PATHS.MC_DIR}: ${JSON.stringify(possibleWorlds)}`);
  }

  worldsDict.world = path.join(RESOLVED_PATHS.MC_DIR, possibleWorlds[0]);
  logger.debug("Pre-filling vanilla locations for END and NETHER dimensions.", { domain: DOMAIN });
  worldsDict.end = path.join(worldsDict.world, "DIM1");
  worldsDict.nether = path.join(worldsDict.world, "DIM-1");

  if (DETERMINATIONS.BUKKIT_LIKE) {
    logger.debug("Checking for actual folders with the End and Nether", { domain: DOMAIN });
    // Each world/dimension is on its own
    const endOptions = fs
      .readdirSync(RESOLVED_PATHS.MC_DIR, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name)
      .filter((dir) => fs.readdirSync(path.join(RESOLVED_PATHS.MC_DIR, dir)).indexOf("DIM1") !== -1);
    logger.debug(`Filtered possible end world dirs to ${JSON.stringify(endOptions)}`, { domain: DOMAIN });

    if (endOptions.length === 0) {
      logger.error("You specified the bukkitlike option but unable to locate a folder for the End", { domain: DOMAIN });
      logger.warn("Falling back to vanilla location for the End", { domain: DOMAIN });
    } else {
      worldsDict.end = path.join(RESOLVED_PATHS.MC_DIR, endOptions[0]);
    }

    const netherOptions = fs
      .readdirSync(RESOLVED_PATHS.MC_DIR, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name)
      .filter((dir) => fs.readdirSync(path.join(RESOLVED_PATHS.MC_DIR, dir)).indexOf("DIM-1") !== -1);
    logger.debug(`Filtered possible end world dirs to ${JSON.stringify(netherOptions)}`, { domain: DOMAIN });

    if (netherOptions.length === 0) {
      logger.error("You specified the bukkitlike option but unable to locate a folder for the Nether", {
        domain: DOMAIN,
      });
      logger.warn("Falling back to vanilla location for the Nether", { domain: DOMAIN });
    } else {
      worldsDict.nether = path.join(RESOLVED_PATHS.MC_DIR, netherOptions[0]);
    }
  }
  return worldsDict;
}

/**
 * Sets RESOLVED_PATHS.MCJAR_SERVER_FILE to location of server.jar if it can find it
 */
function setServerJarPath() {
  if (DETERMINATIONS.BUKKIT_LIKE && fs.existsSync(path.join(RESOLVED_PATHS.MC_DIR, "cache"))) {
    // It is the case that using papermc.io server creates a cache directory which contains
    // both the original and patched server.jar files.
    logger.verbose(`Based on BUKKIT_LIKE confidence, checking for .jar cache.`, { domain: DOMAIN });
    const possibilities = fs.readdirSync(path.join(RESOLVED_PATHS.MC_DIR, "cache"));
    logger.silly(`Searching through ${JSON.stringify(possibilities)}`, { domain: DOMAIN });
    const jars = possibilities
      .map(function (fname) {
        if (path.extname(fname) === ".jar" && fname.startsWith("mojang_"))
          return {
            name: fname,
            time: fs.statSync(path.join(RESOLVED_PATHS.MC_DIR, "cache", fname)).mtime.getTime(),
          };
      })
      .filter(function (elem) {
        return elem != null;
      })
      .sort(function (a, b) {
        return a.time - b.time;
      });
    logger.debug(`Possible jar files: ${jars.length}`, { domain: DOMAIN });
    logger.silly(JSON.stringify(jars), { domain: DOMAIN });
    logger.debug(`Choosing most recent file, ${jars[0].name}`, { domain: DOMAIN });
    RESOLVED_PATHS.MCJAR_SERVER_FILE = path.join(RESOLVED_PATHS.MC_DIR, "cache", jars[0].name);
  } else if (fs.existsSync(path.join(RESOLVED_PATHS.MC_DIR, "server.jar"))) {
    logger.verbose(`Found 'server.jar' for MCJAR_FILE`, { domain: DOMAIN });
    RESOLVED_PATHS.MCJAR_SERVER_FILE = path.join(RESOLVED_PATHS.MC_DIR, "server.jar");
  } else {
    logger.warn("No minecraft server.jar file located, will be unable to extract images and vanilla advancements.", {
      domain: DOMAIN,
    });
  }
}

module.exports = {
  paths: RESOLVED_PATHS,
  ready: resolvedStatus,
  setBasePaths: function (mcdir, outdir, workdir) {
    logger.verbose(`setBasePaths to mcdir:${mcdir}, outdir:${outdir}, workdir:${workdir}`, { domain: DOMAIN });
    BASE_PATHS.MC_DIR = mcdir;
    BASE_PATHS.OUT_DIR = outdir;
    BASE_PATHS.WORK_DIR = workdir;
    resolvePaths();
  },
};
