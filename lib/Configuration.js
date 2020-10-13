/**
 * Handles CLI arguments and sets configuration.
 * Single store of truth regarding paths used in mcdata-to-json
 */
const path = require("path");
const fs = require("fs");
const winston = require("winston");
const yargs = require("yargs");
// Load .env
require("dotenv").config();

const VERSION = require("../package.json").version;
const DOMAIN = "Configuration";
const ACCEPTABLE_PROFILE_AGE = 1000 * 60 * 60 * 4; // 4 hours
const RUNNING_DIR = process.cwd();
const LOG_LEVELS = ["error", "warn", "info", "verbose", "debug", "silly"];

const ARGV = yargs
  .usage(`mcdata-to-json v${VERSION}\nUsage: $0 [options]`)
  .describe("minecraftdir", "The minecraft directory, default /minecraft")
  .alias("t", "minecraftdir")
  .nargs("minecraftdir", 1)
  .default("minecraftdir", "/minecraft")
  .describe("outputdir", "The output directory, default ./output")
  .alias("o", "outputdir")
  .nargs("outputdir", 1)
  .default("outputdir", "./output")
  .describe("workdir", "A temporary work directory, default ./mcdata_cache")
  .alias("w", "workdir")
  .nargs("workdir", 1)
  .default("workdir", "./mcdata_cache")
  .describe(
    "bukkitlike",
    "If using bukkit, spigot, or paper (or other servers which use a separate folder for each dimension), use this flag."
  )
  .alias("bukkitlike", "b")
  .describe("l", "Save a debug log, useful for troubleshooting")
  .alias("l", "logfile")
  .option("loglevel", {
    choices: LOG_LEVELS,
    describe: "Specify log verbosity",
  })
  .alias("loglevel", "log-level")
  .alias("minecraftdir", "minecraft-dir")
  .alias("outputdir", "output-dir")
  .alias("workdir", "work-dir")
  .describe(
    "verbose",
    "Log more info to console (equivalent to --loglevel=info)\nMore 'v's increase the level (up to -vvv)"
  )
  .alias("v", "verbose")
  .describe("quiet", "Log less info to console (equivalent to --loglevel=error)")
  .alias("q", "quiet")
  .help("h")
  .alias("h", "help")
  .env("MCTOJSON")
  .example([
    ["$0 -m /opt/minecraft -o ~/output", ""],
    ["MCTOJSON_LOG_LEVEL=debug $0", "Run with debug level logging and default directories"],
  ])
  .epilogue(
    "Environment variables can also be set for all options using prefix MCTOJSON_\n" +
      "See README for more details. https://github.com/nwesterhausen/mcdata-to-json"
  )
  .version(VERSION).argv;

const logger = buildWinstonLogger();

logger.info(`Logging initialized.`, { domain: DOMAIN });
logger.debug(`Current working dir ${RUNNING_DIR}`, { domain: DOMAIN });
logger.silly(`Listing of provided arguments: ${JSON.stringify(ARGV, null, "  ")}`, { domain: DOMAIN });

const MC_DIR = ARGV.minecraftdir;
const PROPERTIES_FILE = path.join(MC_DIR, "server.properties");
const USERCACHE_FILE = path.join(MC_DIR, "usercache.json");
const OPSLIST_FILE = path.join(MC_DIR, "ops.json");
const MCJAR_FILE = getServerJarPath(MC_DIR);
const LOGS_DIR = path.join(MC_DIR, "logs");
const WORLD_DIRS = {};

locateAndAssignWorlds(WORLD_DIRS);

/**
 * Assigns world directories to provided dictionary
 * @param {object} WORLDS_DICT
 */
function locateAndAssignWorlds(WORLDS_DICT) {
  // Let's look through what folders are in the minecraft folder
  const possibleWorlds = fs
    .readdirSync(MC_DIR, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name)
    .filter((dir) => fs.readdirSync(path.join(MC_DIR, dir)).indexOf("region") !== -1);

  logger.debug(`Filtered possible world dirs to ${JSON.stringify(possibleWorlds)}`, { domain: DOMAIN });

  if (possibleWorlds.length !== 1) {
    if (possibleWorlds.length === 0) {
      logger.error("Was unable to find any world directory in minecraft folder.", { domain: DOMAIN });
      throw new Error(`Unable to find overworld in ${MC_DIR}`);
    }
    logger.error("Found too many options for overworld directory in minecraft folder.", { domain: DOMAIN });
    logger.error("Specify a world dir with the --overworld= option.", { domain: DOMAIN });
    throw new Error(`Too many world options in ${MC_DIR}: ${JSON.stringify(possibleWorlds)}`);
  }

  WORLDS_DICT.world = path.join(MC_DIR, possibleWorlds[0]);
  logger.debug("Pre-filling vanilla locations for END and NETHER dimensions.", { domain: DOMAIN });
  WORLDS_DICT.end = path.join(WORLDS_DICT.world, "DIM1");
  WORLDS_DICT.nether = path.join(WORLDS_DICT.world, "DIM-1");

  if (ARGV.bukkitlike) {
    logger.debug("Checking for actual folders with the End and Nether", { domain: DOMAIN });
    // Each world/dimension is on its own
    const endOptions = fs
      .readdirSync(MC_DIR, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name)
      .filter((dir) => fs.readdirSync(path.join(MC_DIR, dir)).indexOf("DIM1") !== -1);
    logger.debug(`Filtered possible end world dirs to ${JSON.stringify(endOptions)}`, { domain: DOMAIN });

    if (endOptions.length === 0) {
      logger.error("You specified the bukkitlike option but unable to locate a folder for the End", { domain: DOMAIN });
      logger.warn("Falling back to vanilla location for the End", { domain: DOMAIN });
    } else {
      WORLDS_DICT.end = endOptions[0];
    }

    const netherOptions = fs
      .readdirSync(MC_DIR, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name)
      .filter((dir) => fs.readdirSync(path.join(MC_DIR, dir)).indexOf("DIM-1") !== -1);
    logger.debug(`Filtered possible end world dirs to ${JSON.stringify(netherOptions)}`, { domain: DOMAIN });

    if (netherOptions.length === 0) {
      logger.error("You specified the bukkitlike option but unable to locate a folder for the Nether", {
        domain: DOMAIN,
      });
      logger.warn("Falling back to vanilla location for the Nether", { domain: DOMAIN });
    } else {
      WORLDS_DICT.nether = netherOptions[0];
    }
  }
}

const WORLDDATA_DIR = path.join(WORLD_DIRS.world, "data");
const DATAPACKS_DIR = path.join(WORLD_DIRS.world, "datapacks");
const STATS_DIR = path.join(WORLD_DIRS.world, "stats");
const ADVANCEMENTS_DIR = path.join(WORLD_DIRS.world, "advancements");
const PLAYERDATA_DIR = path.join(WORLD_DIRS.world, "playerdata");
const LEVELDAT_FILE = path.join(WORLD_DIRS.world, "level.dat");
// const OVERWORLD_DIR = parsedOpts.overworld;
// const NETHER_DIR = parsedOpts.nether;
// const NETHERDATA_DIR = parsedOpts.netherdata;
// const END_DIR = parsedOpts.end;
// const ENDDATA_DIR = parsedOpts.enddata;
const OUTPUT_DIR = ARGV.outputdir;
const WORK_DIR = ARGV.workdir;
const TEMP_DIR = path.join(WORK_DIR, ".temp");
const EXTRACTED_DIR = path.join(WORK_DIR, "extracted");
const GENERATED_DIR = path.join(WORK_DIR, "generated");
const DATA_DIR = path.join(EXTRACTED_DIR, "data");
const ASSETS_DIR = path.join(EXTRACTED_DIR, "assets");
const CACHED_MCA_JSON_DIR = path.join(WORK_DIR, "mcajson");
const TEMP_PLAYERDATA_JSON_DIR = path.join(TEMP_DIR, "playerdata");
const TEMP_LOG_JSON_DIR = path.join(TEMP_DIR, "logs");
const TEMP_ADVANCEMENT_JSON_DIR = path.join(TEMP_DIR, "advancements");
const TEMP_PROFILE_JSON_DIR = path.join(TEMP_DIR, "profiles");

logger.info(`Checking Minecraft dir: ${MC_DIR}`, { domain: DOMAIN });
validatePath(MC_DIR, "Minecraft directory (includes worlds and server.properties).", true);
validatePath(PROPERTIES_FILE, "Minecraft server configuration file");
validatePath(USERCACHE_FILE, "Server-cached JSON for mapping uuids to player names");
validatePath(OPSLIST_FILE, "Server operators list");
validatePath(MCJAR_FILE, "Mojang-provided jar file for running the server");
validatePath(LOGS_DIR, "Directory of log files");
validatePath(WORLD_DIRS.world, "Directory with the overworld");

logger.info(`Checking world dir: ${WORLD_DIRS.world}`, { domain: DOMAIN });
validatePath(WORLDDATA_DIR, "Data directory inside world");
validatePath(DATAPACKS_DIR, "Datapacks directory inside world");
validatePath(STATS_DIR, "Stats directory inside world");
validatePath(ADVANCEMENTS_DIR, "Advancements directory inside world");
validatePath(PLAYERDATA_DIR, "Playerdata directory inside world");
validatePath(LEVELDAT_FILE, "World level.dat file");

ensureDirSync(OUTPUT_DIR);
ensureDirSync(WORK_DIR);
ensureDirSync(EXTRACTED_DIR);
ensureDirSync(GENERATED_DIR);
ensureDirSync(TEMP_DIR);
ensureDirSync(DATA_DIR);
ensureDirSync(ASSETS_DIR);
ensureDirSync(CACHED_MCA_JSON_DIR);
ensureDirSync(TEMP_PLAYERDATA_JSON_DIR);
ensureDirSync(TEMP_LOG_JSON_DIR);
ensureDirSync(TEMP_PROFILE_JSON_DIR);
ensureDirSync(TEMP_ADVANCEMENT_JSON_DIR);
logger.info(`Set output dir: ${OUTPUT_DIR}`, { domain: DOMAIN });
logger.info(`Set cache dir to ${WORK_DIR}`, { domain: DOMAIN });

const playerdatFiles = fs.readdirSync(PLAYERDATA_DIR);
const players = {};

if (USERCACHE_FILE) {
  for (const p of JSON.parse(fs.readFileSync(USERCACHE_FILE))) {
    logger.debug(`Discovered cached player: ${p.name} ${p.uuid}`, { domain: DOMAIN });
    players[p.uuid] = p.name;
  }
}

for (const f of playerdatFiles) {
  if (f.indexOf(".dat") > -1 && f.indexOf("_old") === -1) {
    const uuid = f.replace(/.dat/, "");

    if (!players[uuid]) {
      players[uuid] = `no-name${f.substr(f.length - 5, 1)}`;
      logger.debug(`Discovered un-cached player UUID: ${uuid}`, { domain: DOMAIN });
    }
  }
}
const PLAYERS = players;

logger.verbose(`Registered ${Object.keys(PLAYERS).length} players.`, { domain: DOMAIN });

/**
 * Creates directory if it doesn't exist
 * @param {string} dirpath
 */
function ensureDirSync(dirpath) {
  if (!fs.existsSync(dirpath)) {
    fs.mkdirSync(dirpath);
    logger.info(`Created dir ${dirpath}`, { domain: DOMAIN });
  }
}

/**
 *
 * @param {string} testpath
 * @param {string} description
 * @param {boolean} throwOnFailure
 */
function validatePath(testpath, description, throwOnFailure = false) {
  const fileOrDirName = path.basename(testpath);

  try {
    fs.statSync(testpath);
  } catch (err) {
    if (err.code === "ENOENT") {
      logger.info(`⚠ ${fileOrDirName} not found! (${description})`, { domain: DOMAIN });
      logger.debug(`Path: ${testpath}`, { domain: DOMAIN });
      if (throwOnFailure) throw new Error(`${fileOrDirName} must exist!`);
    } else {
      throw err;
    }
  }
  logger.verbose(`✔ ${fileOrDirName} exists.`, { domain: DOMAIN });
}

/**
 * @return {number} Log level
 */
function understandLogLevelFromArgv() {
  let parsedLevel = LOG_LEVELS.indexOf("info");
  if (ARGV.loglevel) parsedLevel = LOG_LEVELS.indexOf(ARGV.loglevel);
  if (ARGV.quiet) parsedLevel = LOG_LEVELS.indexOf("error");
  if (ARGV.verbose) {
    if (Array.isArray(ARGV.verbose)) parsedLevel += ARGV.verbose.length;
    else parsedLevel += 1;
  }
  if (parsedLevel >= LOG_LEVELS.length) parsedLevel = LOG_LEVELS.length - 1;
  return LOG_LEVELS[parsedLevel];
}

/**
 *
 * @param {string} rootPath
 * @return {string} MCJAR_FILE path
 */
function getServerJarPath(rootPath) {
  if (fs.existsSync(path.join(rootPath, "server.jar"))) {
    logger.verbose(`Found 'server.jar' for MCJAR_FILE`, { domain: DOMAIN });
    return path.join(rootPath, "server.jar");
  } else if (fs.existsSync(path.join(rootPath, "client.jar"))) {
    logger.verbose(`Found 'client.jar' for MCJAR_FILE`, { domain: DOMAIN });
    return path.join(rootPath, "client.jar");
  } else if (fs.existsSync(path.join(rootPath, "cache"))) {
    logger.verbose(`Found MC_DIR/cache, suspect running papermc.`, { domain: DOMAIN });
    const possibilities = fs.readdirSync(path.join(rootPath, "cache"));
    logger.silly(`Searching through ${JSON.stringify(possibilities)}`, { domain: DOMAIN });
    const jars = possibilities
      .map(function (fname) {
        if (path.extname(fname) === ".jar" && fname.startsWith("mojang_"))
          return {
            name: fname,
            time: fs.statSync(path.join(rootPath, "cache", fname)).mtime.getTime(),
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
    return path.join(rootPath, "cache", jars[0].name);
  }
  logger.warn("No minecraft jar file located, will be unable to extract images and vanilla advancements.", {
    domain: DOMAIN,
  });
  return null;
}

/**
 * @return {Logger}
 */
function buildWinstonLogger() {
  const LOGLEVEL = understandLogLevelFromArgv();

  const CONSOLE_FORMAT = winston.format.printf(({ level, domain, message }) => {
    return `${level} [${domain}] ${message}`;
  });

  const FILE_FORMAT = winston.format.printf(({ level, message, domain, timestamp }) => {
    return `${timestamp} ${level} [${domain}] ${message}`;
  });

  const TRANSPORTS = [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), CONSOLE_FORMAT),
    }),
  ];
  if (ARGV.logfile)
    TRANSPORTS.push(
      new winston.transports.File({
        filename: "debug.log",
        format: winston.format.combine(winston.format.timestamp(), FILE_FORMAT),
        level: "silly",
        options: {
          flags: "w",
        },
      })
    );
  return winston.createLogger({
    // format: winston.format.prettyPrint(),
    level: LOGLEVEL,
    transports: TRANSPORTS,
  });
}

module.exports = {
  ACCEPTABLE_PROFILE_AGE,
  ADVANCEMENTS_DIR,
  ASSETS_DIR,
  CACHED_MCA_JSON_DIR,
  DATA_DIR,
  DATAPACKS_DIR,
  EXTRACTED_DIR,
  LEVELDAT_FILE,
  LOGS_DIR,
  MC_DIR,
  MCJAR_FILE,
  // OVERWORLD_DIR,
  // NETHER_DIR,
  // NETHERDATA_DIR,
  // END_DIR,
  // ENDDATA_DIR,
  OPSLIST_FILE,
  OUTPUT_DIR,
  PLAYERDATA_DIR,
  PLAYERS,
  PROPERTIES_FILE,
  STATS_DIR,
  TEMP_ADVANCEMENT_JSON_DIR,
  TEMP_DIR,
  TEMP_LOG_JSON_DIR,
  TEMP_PLAYERDATA_JSON_DIR,
  TEMP_PROFILE_JSON_DIR,
  USERCACHE_FILE,
  WORK_DIR,
  WORLD_DIRS,
  WORLDDATA_DIR,
  ensureDirSync,
  logger,
};
