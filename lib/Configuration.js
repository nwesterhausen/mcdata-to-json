/**
 * Handles CLI arguments and sets configuration.
 * Single store of truth regarding paths used in mcdata-to-json
 */
const path = require("path");
const fs = require("fs");
const log = require("./CustomLogger");
const yargs = require("yargs");
// Load .env
require("dotenv").config();

const VERSION = require("../package.json").version;
const DOMAIN = "Configuration";
const ACCEPTABLE_PROFILE_AGE = 1000 * 60 * 60 * 4; // 4 hours
const RUNNING_DIR = process.cwd();
const LOG_LEVELS = ["error", "warn", "info", "debug", "silly"];

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

const LOGLEVEL = understandLogLevelFromArgv();

log.setLevel(LOGLEVEL);
log.debug(DOMAIN, `current working dir ${RUNNING_DIR}`);
log.silly(DOMAIN, `Listing of provided arguments: ${JSON.stringify(ARGV, null, "  ")}`);

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

  log.debug(DOMAIN, `Filtered possible world dirs to ${JSON.stringify(possibleWorlds)}`);

  if (possibleWorlds.length !== 1) {
    if (possibleWorlds.length === 0) {
      log.error(DOMAIN, "Was unable to find any world directory in minecraft folder.");
      throw new Error(`Unable to find overworld in ${MC_DIR}`);
    }
    log.error(DOMAIN, "Found too many options for overworld directory in minecraft folder.");
    log.error(DOMAIN, "Specify a world dir with the --overworld= option.");
    throw new Error(`Too many world options in ${MC_DIR}: ${JSON.stringify(possibleWorlds)}`);
  }

  WORLDS_DICT.world = path.join(MC_DIR, possibleWorlds[0]);

  log.debug(DOMAIN, "Pre-filling vanilla locations for END and NETHER dimensions.");
  WORLDS_DICT.end = path.join(WORLDS_DICT.world, "DIM1");
  WORLDS_DICT.nether = path.join(WORLDS_DICT.world, "DIM-1");

  if (ARGV.bukkitlike) {
    log.debug(DOMAIN, "Checking for actual folders with the End and Nether");
    // Each world/dimension is on its own
    const endOptions = fs
      .readdirSync(MC_DIR, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name)
      .filter((dir) => fs.readdirSync(path.join(MC_DIR, dir)).indexOf("DIM1") !== -1);
    log.debug(DOMAIN, `Filtered possible end world dirs to ${JSON.stringify(endOptions)}`);

    if (endOptions.length === 0) {
      log.error(DOMAIN, "You specified the bukkitlike option but unable to locate a folder for the End");
      log.warn(DOMAIN, "Falling back to vanilla location for the End");
    } else {
      WORLDS_DICT.end = endOptions[0];
    }

    const netherOptions = fs
      .readdirSync(MC_DIR, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name)
      .filter((dir) => fs.readdirSync(path.join(MC_DIR, dir)).indexOf("DIM-1") !== -1);
    log.debug(DOMAIN, `Filtered possible end world dirs to ${JSON.stringify(netherOptions)}`);

    if (netherOptions.length === 0) {
      log.error(DOMAIN, "You specified the bukkitlike option but unable to locate a folder for the Nether");
      log.warn(DOMAIN, "Falling back to vanilla location for the Nether");
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

log.debug(DOMAIN, `Checking Minecraft dir: ${MC_DIR}`);
validatePath(MC_DIR, "Minecraft directory (includes worlds and server.properties).", true);
validatePath(PROPERTIES_FILE, "Minecraft server configuration file");
validatePath(USERCACHE_FILE, "Server-cached JSON for mapping uuids to player names");
validatePath(OPSLIST_FILE, "Server operators list");
validatePath(MCJAR_FILE, "Mojang-provided jar file for running the server");
validatePath(LOGS_DIR, "Directory of log files");
validatePath(WORLD_DIRS.world, "Directory with the overworld");

log.debug(DOMAIN, `Checking world dir: ${WORLD_DIRS.world}`);
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
log.debug(DOMAIN, `Set output dir: ${OUTPUT_DIR}`);

const playerdatFiles = fs.readdirSync(PLAYERDATA_DIR);
const players = {};

if (USERCACHE_FILE) {
  for (const p of JSON.parse(fs.readFileSync(USERCACHE_FILE))) {
    log.debug(DOMAIN, `Discovered cached player: ${p.name} ${p.uuid}`);
    players[p.uuid] = p.name;
  }
}

for (const f of playerdatFiles) {
  if (f.indexOf(".dat") > -1 && f.indexOf("_old") === -1) {
    const uuid = f.replace(/.dat/, "");

    if (!players[uuid]) {
      players[uuid] = `no-name${f.substr(f.length - 5, 1)}`;
      log.debug(DOMAIN, `Discovered un-cached player UUID: ${uuid}`);
    }
  }
}
const PLAYERS = players;

log.debug(DOMAIN, `Registered ${Object.keys(PLAYERS).length} players.`);

/**
 * Creates directory if it doesn't exist
 * @param {string} dirpath
 */
function ensureDirSync(dirpath) {
  if (!fs.existsSync(dirpath)) {
    fs.mkdirSync(dirpath);
    log.debug(DOMAIN, `Created dir ${dirpath}`);
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
      log.debug(DOMAIN, `⚠ ${fileOrDirName} not found! (${description})`);
      log.debug(DOMAIN, `Path: ${testpath}`);
      if (throwOnFailure) throw new Error(`${fileOrDirName} must exist!`);
    } else {
      throw err;
    }
  }
  log.debug(DOMAIN, `✔ ${fileOrDirName} exists.`);
}

/**
 * @return {number} Log level
 */
function understandLogLevelFromArgv() {
  let parsedLevel = LOG_LEVELS.indexOf("warn");
  if (ARGV.loglevel) parsedLevel = LOG_LEVELS.indexOf(ARGV.loglevel);
  if (ARGV.quiet) parsedLevel = LOG_LEVELS.indexOf("error");
  if (ARGV.verbose) {
    if (Array.isArray(ARGV.verbose)) parsedLevel += ARGV.verbose.length;
    else parsedLevel += 1;
  }
  if (parsedLevel >= LOG_LEVELS.length) parsedLevel = LOG_LEVELS.length - 1;
  return parsedLevel;
}

/**
 *
 * @param {string} rootPath
 * @return {string} MCJAR_FILE path
 */
function getServerJarPath(rootPath) {
  if (fs.existsSync(path.join(rootPath, "server.jar"))) {
    log.debug(DOMAIN, `Found 'server.jar' for MCJAR_FILE`);
    return path.join(rootPath, "server.jar");
  } else if (fs.existsSync(path.join(rootPath, "client.jar"))) {
    log.debug(DOMAIN, `Saving 'client.jar' for MCJAR_FILE`);
    return path.join(rootPath, "client.jar");
  } else if (fs.existsSync(path.join(rootPath, "cache"))) {
    log.debug(DOMAIN, `Found MC_DIR/cache, suspect running papermc.`);
    const possibilities = fs.readdirSync(path.join(rootPath, "cache"));
    log.silly(DOMAIN, `Searching through ${JSON.stringify(possibilities)}`);
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
    log.debug(DOMAIN, `Possible jar files: ${jars.length}`);
    log.silly(DOMAIN, JSON.stringify(jars));
    log.debug(DOMAIN, `Choosing most recent file, ${jars[0].name}`);
    return path.join(rootPath, "cache", jars[0].name);
  }
  log.warn(DOMAIN, "No minecraft jar file located, will be unable to extract images and vanilla advancements.");
  return null;
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
};
