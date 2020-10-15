/**
 * Handles CLI arguments and sets configuration.
 * Single store of truth regarding paths used in mcdata-to-json
 */
const fs = require("fs");
const yargs = require("yargs");
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

// SETUP LOGGER
const Log = require("./helpers/Logger");
Log.setLoglevel(understandLogLevelFromArgv());
if (ARGV.logfile) Log.writeDebugLog();
const logger = Log.getLogger();

logger.info(`Logging initialized.`, { domain: DOMAIN });
logger.debug(`Current working dir ${RUNNING_DIR}`, { domain: DOMAIN });
logger.silly(`Provided CLI arguments:\n${JSON.stringify(ARGV, null, "  ")}`, { domain: DOMAIN });

// SETUP PATH REFERENCES
const pathref = require("./helpers/PathReference");
pathref.setBasePaths(ARGV.minecraftdir, ARGV.outputdir, ARGV.workdir);
const PATHS = pathref.paths;

const playerdatFiles = fs.readdirSync(PATHS.PLAYERDATA_DIR);
const players = {};

if (PATHS.USERCACHE_FILE) {
  for (const p of JSON.parse(fs.readFileSync(PATHS.USERCACHE_FILE))) {
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

module.exports = {
  ACCEPTABLE_PROFILE_AGE,
  PLAYERS,
};
