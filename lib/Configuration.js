/**
 * Handles CLI arguments and sets configuration.
 */
const path = require("path");
const fs = require("fs");
const nopt = require("nopt");
const log = require("./CustomLogger");
// const { dir } = require("console");

const VERSION = require("../package.json").version;
const DOMAIN = "Configuration";
const ACCEPTABLE_PROFILE_AGE = 1000 * 60 * 60 * 4; // 4 hours
const defaults = function (arr, def) {
  for (const key in def) {
    if (!Object.prototype.hasOwnProperty.call(arr, key)) {
      arr[key] = def[key];
    }
  }
  return arr;
};
const rundir = process.cwd();
const loglevels = ["error", "warn", "info", "debug", "silly"];
const defaultOpts = {
  minecraft: rundir,
  outputdir: path.join(rundir, "output"),
  workdir: path.join(rundir, "mcdata_cache"),
  loglevel: "info",
  help: false,
  "use-env": false,
};
const knownOpts = {
  minecraft: path,
  outputdir: path,
  workdir: path,
  loglevel: loglevels,
  help: Boolean,
  "use-env": Boolean,
};
const shortHands = {
  silent: ["--loglevel=error"],
  quiet: ["--loglevel=warn"],
  verbose: ["--loglevel=info"],
  debug: ["--loglevel=debug"],
  silly: ["--loglevel=silly"],
  s: ["--loglevel=error"],
  q: ["--loglevel=warn"],
  v: ["--loglevel=info"],
  vvv: ["--loglevel=debug"],
  e: ["--use-env"],
  env: ["--use-env"],
};
const usage = `Usage:
   --help, -h                      Show this help message and exit.
   --minecraft=path                The minecraft folder containing server.properties and world.
   --outputdir=path                The directory to save the generated JSON files into.
   --workdir=path                  The directory to cache data used by this program
   --use-env                       Load configuration values from ENV:
                                       env.MINECRAFT_DIR and env.OUTPUT_DIR
   --loglevel=<level>              How verbose to log to the console. Also you can use one of
                                   the helper functions to accomplish this to varying degrees:
   --silent, -s, --loglevel=error  Log only errors.
   --quiet, -q, --loglevel=warn    Log only warnings and errors.
   -v, --loglevel=info [Default]   Log everything except for debug messages.
   -vvv, -debug, --loglevel=debug  Log everything.`;
const parsedOpts = defaults(nopt(knownOpts, shortHands, process.argv, 2), defaultOpts);
const helpMessage = `mcdata-to-json ${VERSION}
   A node.js module to turn the data from your minecraft server or world into json.`;

const isValidPath = function (testpath, description) {
  const fileOrDirName = path.basename(testpath);

  try {
    fs.statSync(testpath);
  } catch (err) {
    if (err.code === "ENOENT") {
      log.debug(`⚠ ${fileOrDirName} not found! (${description})`, DOMAIN);
      return false;
    } else {
      throw err;
    }
  }
  log.debug(`✔ ${fileOrDirName} exists.`, DOMAIN);
  return true;
};

const LOGLEVEL = loglevels.indexOf(parsedOpts.loglevel);

log.setLevel(LOGLEVEL);
log.debug(`current working dir ${rundir}`, DOMAIN);

if (parsedOpts.help) {
  console.log(helpMessage); // eslint-disable-line no-console
  console.log(usage); // eslint-disable-line no-console
  process.exit(0);
}

if (parsedOpts["use-env"]) {
  log.debug("use-env flag set, loading config from environment.", DOMAIN);
  log.debug("Process.env vars:", DOMAIN);
  log.debug(`MINECRAFT_DIR: ${process.env.MINECRAFT_DIR}`, DOMAIN);
  log.debug(`OUTPUT_DIR: ${process.env.OUTPUT_DIR}`, DOMAIN);
  log.debug(`WORK_DIR: ${process.env.WORK_DIR}`, DOMAIN);
  if (parsedOpts.minecraft === defaultOpts.minecraft && process.env.MINECRAFT_DIR) {
    parsedOpts.minecraft = process.env.MINECRAFT_DIR;
  }
  if (!parsedOpts.outputdir === defaultOpts.outputdir && process.env.OUTPUT_DIR) {
    parsedOpts.outputdir = process.env.OUTPUT_DIR;
  }
  if (!parsedOpts.workdir === defaultOpts.workdir && process.env.OUTPUT_DIR) {
    parsedOpts.workdir = process.env.WORK_DIR;
  }
}

// Check minecraft dir is set..
if (!parsedOpts.minecraft) {
  log.error("No minecraft directory set!", DOMAIN);
  process.exit(1);
}
log.debug(`Checking Minecraft dir: ${parsedOpts.minecraft}`, DOMAIN);
// Check for server.properties, to validate minecraft folder..
if (isValidPath(path.join(parsedOpts.minecraft, "server.properties"), "Minecraft server configuration file")) {
  parsedOpts.serverproprties = path.join(parsedOpts.minecraft, "server.properties");
}
if (isValidPath(path.join(parsedOpts.minecraft, "client.jar"), "Minecraft client jar")) {
  parsedOpts.mcjar = path.join(parsedOpts.minecraft, "client.jar");
} else if (isValidPath(path.join(parsedOpts.minecraft, "server.jar"), "Minecraft server jar")) {
  parsedOpts.mcjar = path.join(parsedOpts.minecraft, "server.jar");
} else {
  log.error(
    "Couldn't locate a server.jar or minecraft.jar. Please download and put it in the minecraft directory.",
    DOMAIN
  );
}
if (isValidPath(path.join(parsedOpts.minecraft, "world"), "Minecraft world directory")) {
  parsedOpts.worlddir = path.join(parsedOpts.minecraft, "world");
}
if (isValidPath(path.join(parsedOpts.minecraft, "logs"), "Minecraft log file directory")) {
  parsedOpts.logdir = path.join(parsedOpts.minecraft, "logs");
}
if (isValidPath(path.join(parsedOpts.minecraft, "ops.json"), "List of OPs on the server.")) {
  parsedOpts.opsjson = path.join(parsedOpts.minecraft, "ops.json");
}
if (isValidPath(path.join(parsedOpts.minecraft, "usercache.json"), "Cache connecting UUIDs to player names.")) {
  parsedOpts.usercachejson = path.join(parsedOpts.minecraft, "usercache.json");
}
// Check for valid paths inside world dir
if (isValidPath(path.join(parsedOpts.worlddir, "level.dat"), "World data file. Found in world directory.")) {
  parsedOpts.leveldat = path.join(parsedOpts.worlddir, "level.dat");
}
if (
  isValidPath(path.join(parsedOpts.worlddir, "advancements"), "Player advancement progress. Found in world directory.")
) {
  parsedOpts.advancements = path.join(parsedOpts.worlddir, "advancements");
}
if (isValidPath(path.join(parsedOpts.worlddir, "data"), "Additional world data files. Found in world directory.")) {
  parsedOpts.worlddata = path.join(parsedOpts.worlddir, "data");
}
if (isValidPath(path.join(parsedOpts.worlddir, "datapacks"), "Found in world directory.")) {
  parsedOpts.datapacks = path.join(parsedOpts.worlddir, "datapacks");
}
if (isValidPath(path.join(parsedOpts.worlddir, "playerdata"), "Contains player info. Found in world directory.")) {
  parsedOpts.playerdata = path.join(parsedOpts.worlddir, "playerdata");
}
if (isValidPath(path.join(parsedOpts.worlddir, "stats"), "Contains player stats. Found in world directory.")) {
  parsedOpts.stats = path.join(parsedOpts.worlddir, "stats");
}
if (isValidPath(path.join(parsedOpts.worlddir, "region"), "Overworld region files. Found in world directory.")) {
  parsedOpts.overworld = path.join(parsedOpts.worlddir, "region");
}
if (isValidPath(path.join(parsedOpts.worlddir, "DIM1"), "The End dir. Found in world directory.")) {
  if (
    isValidPath(path.join(parsedOpts.worlddir, "DIM1", "region"), "The End region files. Found in world directory.")
  ) {
    parsedOpts.end = path.join(parsedOpts.worlddir, "DIM1", "region");
  }
  if (isValidPath(path.join(parsedOpts.worlddir, "DIM1", "data"), "The End data files. Found in world directory.")) {
    parsedOpts.enddata = path.join(parsedOpts.worlddir, "DIM1", "data");
  }
}
if (isValidPath(path.join(parsedOpts.worlddir, "DIM-1"), "Nether dir. Found in world directory.")) {
  if (
    isValidPath(path.join(parsedOpts.worlddir, "DIM-1", "region"), "Nether region files. Found in world directory.")
  ) {
    parsedOpts.nether = path.join(parsedOpts.worlddir, "DIM-1", "region");
  }
  if (isValidPath(path.join(parsedOpts.worlddir, "DIM-1", "data"), "Nether data files. Found in world directory.")) {
    parsedOpts.netherdata = path.join(parsedOpts.worlddir, "DIM-1", "data");
  }
}
log.info("Validated minecraft directory.", DOMAIN);

const MC_DIR = parsedOpts.minecraft;
const PROPERTIES_FILE = parsedOpts.serverproprties;
const USERCACHE_FILE = parsedOpts.usercachejson;
const OPSLIST_FILE = parsedOpts.opsjson;
const MCJAR_FILE = parsedOpts.mcjar;
const LOGS_DIR = parsedOpts.logdir;
const WORLD_DIR = parsedOpts.worlddir;
const WORLDDATA_DIR = parsedOpts.worlddata;
const DATAPACKS_DIR = parsedOpts.datapacks;
const STATS_DIR = parsedOpts.stats;
const ADVANCEMENTS_DIR = parsedOpts.advancements;
const PLAYERDATA_DIR = parsedOpts.playerdata;
const LEVELDAT_FILE = parsedOpts.leveldat;
const OVERWORLD_DIR = parsedOpts.overworld;
const NETHER_DIR = parsedOpts.nether;
const NETHERDATA_DIR = parsedOpts.netherdata;
const END_DIR = parsedOpts.end;
const ENDDATA_DIR = parsedOpts.enddata;
const OUTPUT_DIR = parsedOpts.outputdir;
const WORK_DIR = parsedOpts.workdir;
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

module.exports = {
  MC_DIR,
  PROPERTIES_FILE,
  USERCACHE_FILE,
  OPSLIST_FILE,
  MCJAR_FILE,
  LOGS_DIR,
  WORLD_DIR,
  WORLDDATA_DIR,
  DATAPACKS_DIR,
  STATS_DIR,
  ADVANCEMENTS_DIR,
  PLAYERDATA_DIR,
  LEVELDAT_FILE,
  OVERWORLD_DIR,
  NETHER_DIR,
  NETHERDATA_DIR,
  END_DIR,
  ENDDATA_DIR,
  OUTPUT_DIR,
  WORK_DIR,
  TEMP_DIR,
  EXTRACTED_DIR,
  DATA_DIR,
  ASSETS_DIR,
  PLAYERS,
  ACCEPTABLE_PROFILE_AGE,
  CACHED_MCA_JSON_DIR,
  TEMP_PLAYERDATA_JSON_DIR,
  TEMP_LOG_JSON_DIR,
  TEMP_PROFILE_JSON_DIR,
  TEMP_ADVANCEMENT_JSON_DIR,
  ensureDirSync,
};
