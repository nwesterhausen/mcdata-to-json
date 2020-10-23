const PATHS = require("./helpers/PathReference").paths;
const { ensureDirSync } = require("./helpers/PathReference");
const logger = require("./helpers/Logger").getLogger();
const logconst = require("./helpers/LogConst");
const logregx = require("./helpers/LogsRegex");
const { PLAYERS } = require("./Configuration");
const { promiseStringify } = require("./helpers/JsonPromises");

const zlib = require("zlib");
const fs = require("fs");
const path = require("path");
const readline = require("readline");

const DOMAIN = "LogParser";
const CACHED_JSON_LOG_DIR = path.join(PATHS.TEMP_LOG_JSON_DIR, "converted");
ensureDirSync(CACHED_JSON_LOG_DIR);
let logfiles = [];
const unzippedFiles = [];
const rawlogJSON = [];

/**
 * Expects YYYY-MM-DD-#.log
 * @param {string} filename
 * @return {Date}
 */
function getDateFromFilename(filename) {
  const shortFilename = path.basename(filename);
  const y = shortFilename.split("-")[0];
  const m = shortFilename.split("-")[1];
  const d = shortFilename.split("-")[2];
  let t = new Date(y, m - 1, d);

  if (shortFilename === "latest.log") {
    t = new Date();
  }

  logger.silly(`Created timestamp from ${shortFilename} (${y}, ${m} - 1, ${d}) ${t.toISOString()}`, { domain: DOMAIN });
  return t;
}

/**
 * Expects [HH:MM:SS]
 * @param {string} timeString
 * @param {Date} basedate
 * @return {string}
 */
function getTimestampFromHHMMSSAndBasedate(timeString, basedate) {
  logger.silly(`Creating timestamp from ${timeString}`, { domain: DOMAIN });
  const h = timeString.split(":")[0];
  const m = timeString.split(":")[1];
  const s = timeString.split(":")[2];
  const t = basedate;

  t.setSeconds(s);
  t.setMinutes(m);
  t.setHours(h);
  return t.getTime();
}

/**
 * Works with parseLogLine function to take parsed data from the log and
 * append it to a target object array.
 * @param {Array} dest
 * @param {Array} actionarray
 */
function appendLogActionTo(dest, actionarray) {
  if (!actionarray) {
    return;
  }
  // Try and detect player
  const description = actionarray[2];
  let playerUuid = null;
  if (description.player) {
    for (const uuid of Object.keys(PLAYERS)) {
      if (PLAYERS[uuid] === description.player) playerUuid = uuid;
    }
  } else {
    const name = description.match(logregx.playerNameGrabRE);
    if (name) {
      for (const uuid of Object.keys(PLAYERS)) {
        if (PLAYERS[uuid] === name[1]) playerUuid = uuid;
      }
    }
  }
  dest.push({
    description: description,
    severity: actionarray[3],
    timestamp: actionarray[0],
    type: actionarray[1],
    player: playerUuid,
  });
}

/**
 * Take a log line and turn it into an array of details.
 * @param {Date} basedate
 * @param {string} logline
 * @return {Array}
 */
function parseLogLine(basedate, logline) {
  if (logline.match(logregx.timestampRE)) {
    // parse the time part of the lines
    const time = logline.match(logregx.timestampRE)[0];
    const timestamp = getTimestampFromHHMMSSAndBasedate(time, basedate);
    const sev = logline.match(logregx.severityRE) ? logline.match(logregx.severityRE)[1] : "ERROR";

    if (logline.match(logregx.playerjoinRE)) {
      return [timestamp, logconst.TYPE_LOGIN, logline.match(logregx.playerjoinRE)[1], sev];
    } else if (logline.match(logregx.playerleftRE)) {
      return [timestamp, logconst.TYPE_LOGOFF, logline.match(logregx.playerleftRE)[1], sev];
    } else if (logline.match(logregx.advancementRE)) {
      return [timestamp, logconst.TYPE_ADVANCEMENT, logline.match(logregx.advancementRE)[1], sev];
    } else if (logline.match(logregx.challengeRE)) {
      return [timestamp, logconst.TYPE_CHALLENGE, logline.match(logregx.challengeRE)[1], sev];
    } else if (logline.match(logregx.goalRE)) {
      return [timestamp, logconst.TYPE_GOAL, logline.match(logregx.goalRE)[1], sev];
    } else if (logline.match(logregx.playerchatRE)) {
      return [
        timestamp,
        logconst.TYPE_CHAT,
        {
          chat: logline.substr(logline.indexOf(">") + 2),
          player: logline.match(logregx.playerchatRE)[1],
        },
        sev,
      ];
    } else if (logline.match(logregx.arrowdeathRE)) {
      return [timestamp, logconst.ARROW_DEATH, logline.substr(logline.indexOf("]: ") + 3), sev];
    } else if (logline.match(logregx.cactusdeathRE)) {
      return [timestamp, logconst.CACTUS_DEATH, logline.substr(logline.indexOf("]: ") + 3), sev];
    } else if (logline.match(logregx.waterdeathRE)) {
      return [timestamp, logconst.WATER_DEATH, logline.substr(logline.indexOf("]: ") + 3), sev];
    } else if (logline.match(logregx.elytradeathRE)) {
      return [timestamp, logconst.ELYTRA_DEATH, logline.substr(logline.indexOf("]: ") + 3), sev];
    } else if (logline.match(logregx.explosiondeathRE)) {
      return [timestamp, logconst.EXPLOSION_DEATH, logline.substr(logline.indexOf("]: ") + 3), sev];
    } else if (logline.match(logregx.fallingdeathRE)) {
      return [timestamp, logconst.FALLING_DEATH, logline.substr(logline.indexOf("]: ") + 3), sev];
    } else if (logline.match(logregx.anvildeathRE)) {
      return [timestamp, logconst.ANVIL_DEATH, logline.substr(logline.indexOf("]: ") + 3), sev];
    } else if (logline.match(logregx.firedeathRE)) {
      return [timestamp, logconst.FIRE_DEATH, logline.substr(logline.indexOf("]: ") + 3), sev];
    } else if (logline.match(logregx.fireworkdeathRE)) {
      return [timestamp, logconst.FIREWORK_DEATH, logline.substr(logline.indexOf("]: ") + 3), sev];
    } else if (logline.match(logregx.lavadeathRE)) {
      return [timestamp, logconst.LAVA_DEATH, logline.substr(logline.indexOf("]: ") + 3), sev];
    } else if (logline.match(logregx.lightningdeathRE)) {
      return [timestamp, logconst.LIGHTNING_DEATH, logline.substr(logline.indexOf("]: ") + 3), sev];
    } else if (logline.match(logregx.magmadeathRE)) {
      return [timestamp, logconst.MAGMA_DEATH, logline.substr(logline.indexOf("]: ") + 3), sev];
    } else if (logline.match(logregx.killeddeathRE)) {
      return [timestamp, logconst.KILLED_DEATH, logline.substr(logline.indexOf("]: ") + 3), sev];
    } else if (logline.match(logregx.fireballRE)) {
      return [timestamp, logconst.FIREBALL_DEATH, logline.substr(logline.indexOf("]: ") + 3), sev];
    } else if (logline.match(logregx.potiondeathRE)) {
      return [timestamp, logconst.POITION_DEATH, logline.substr(logline.indexOf("]: ") + 3), sev];
    } else if (logline.match(logregx.starvedeathRE)) {
      return [timestamp, logconst.STARVE_DEATH, logline.substr(logline.indexOf("]: ") + 3), sev];
    } else if (logline.match(logregx.suffocatedeathRE)) {
      return [timestamp, logconst.SUFFOCATE_DEATH, logline.substr(logline.indexOf("]: ") + 3), sev];
    } else if (logline.match(logregx.thornsdeathRE)) {
      return [timestamp, logconst.THORNS_DEATH, logline.substr(logline.indexOf("]: ") + 3), sev];
    } else if (logline.match(logregx.voiddeathRE)) {
      return [timestamp, logconst.VOID_DEATH, logline.substr(logline.indexOf("]: ") + 3), sev];
    } else if (logline.match(logregx.witherdeathRE)) {
      return [timestamp, logconst.WITHER_DEATH, logline.substr(logline.indexOf("]: ") + 3), sev];
    } else if (logline.match(logregx.bludgeondeathRE)) {
      return [timestamp, logconst.BLUDGEON_DEATH, logline.substr(logline.indexOf("]: ") + 3), sev];
    } else if (logline.match(logregx.uuiddescRE)) {
      return [timestamp, logconst.TYPE_PLAYERUUID, logline.substr(logline.indexOf("]: ") + 3), sev];
    } else if (logline.match(logregx.commandRE)) {
      return [timestamp, logconst.TYPE_COMMAND, logline.substr(logline.indexOf("]: ") + 3), sev];
    } else if (logline.match(logregx.serverreadyRE)) {
      return [timestamp, logconst.TYPE_SERVERREADY, logline.substr(logline.indexOf("]: ") + 3), sev];
    } else if (logline.match(logregx.serverstopRE)) {
      return [timestamp, logconst.TYPE_SERVERSTOP, logline.substr(logline.indexOf("]: ") + 3), sev];
    } else if (logline.match(logregx.overloadedRE)) {
      return [timestamp, logconst.TYPE_OVERLOADED, logline.substr(logline.indexOf("]: ") + 3), sev];
    } else if (logline.match(logregx.keepentityRE)) {
      return [timestamp, logconst.TYPE_KEEPENTITY, logline.substr(logline.indexOf("]: ") + 3), sev];
    }
    return [timestamp, logconst.TYPE_SERVERINFO, logline.substr(logline.indexOf("]: ") + 3), sev];
  }
}

/**
 *
 * @param {string} filepath
 * @return {object}
 */
function jsonFromLogfilePromise(filepath) {
  return new Promise((resolve, reject) => {
    logger.debug(`Creating JSON for file ${filepath}`, { domain: DOMAIN });
    const createdJSON = [];
    const createdDate = getDateFromFilename(filepath);

    try {
      const rl = readline.createInterface({
        input: fs.createReadStream(path.join(filepath)),
      });

      rl.on("line", (input) => {
        appendLogActionTo(createdJSON, parseLogLine(createdDate, input));
      });
      rl.on("close", () => {
        logger.debug(`Completed parsing ${filepath}`, { domain: DOMAIN });

        promiseStringify(createdJSON)
          .then((stringified) => {
            return fs.promises.writeFile(
              path.join(CACHED_JSON_LOG_DIR, path.basename(filepath)).replace(/\.log$/g, ".json"),
              stringified
            );
          })
          .catch((err) => logger.warn(JSON.stringify(err), { domain: DOMAIN }));

        rawlogJSON.push(...createdJSON);
        resolve(filepath);
      });
    } catch (err) {
      reject(filepath, err);
    }
  });
}

/**
 * Prepare log files, unzip gzip files so we can parse in one pass.
 */
function prepareLogFiles() {
  const rawLogFiles = fs.readdirSync(PATHS.LOGS_DIR);

  logger.debug(`Preparing following log files: ${JSON.stringify(rawLogFiles)}`, { domain: DOMAIN });
  // Go through the log dir and sort the files
  for (let i = 0; i < rawLogFiles.length; i++) {
    logger.debug(`Working on file: ${rawLogFiles[i]}`, { domain: DOMAIN });
    // Unzip gziped files, keeeping track of them
    if (rawLogFiles[i].endsWith(".gz")) {
      logger.debug("Detected gzip file.", { domain: DOMAIN });
      const tmpLogFile = rawLogFiles[i].substr(0, rawLogFiles[i].length - 3);
      const compressedFile = fs.readFileSync(path.join(PATHS.LOGS_DIR, rawLogFiles[i]));
      const unzippedFile = zlib.unzipSync(compressedFile);

      logger.debug("Unzipping file into log dir.", { domain: DOMAIN });
      fs.writeFileSync(path.join(PATHS.LOGS_DIR, tmpLogFile), unzippedFile);

      unzippedFiles.push(tmpLogFile);
      logfiles.push(tmpLogFile);
      logger.debug(`Unzipped ${tmpLogFile}`, { domain: DOMAIN });
    } else if (rawLogFiles[i].endsWith(".log")) {
      logfiles.push(rawLogFiles[i]);
    }
  }
  logfiles = logfiles.sort();
  logger.debug("Log file list sorted internally", { domain: DOMAIN });
}

/**
 * parses all log files
 * @return {Promise}
 */
function parseLogFiles() {
  prepareLogFiles();
  const ALL_LOGS_PATH = path.join(PATHS.TEMP_LOG_JSON_DIR, "all.json");
  const FILTERED_LOGS_PATH = path.join(PATHS.TEMP_LOG_JSON_DIR, "filtered.json");
  const FINAL_LOGS_PATH = path.join(PATHS.TEMP_LOG_JSON_DIR, "final.json");
  const TIMERS = {};

  const createJsonPromises = [];

  for (let i = 0; i < logfiles.length; i++) {
    const logpath = path.join(PATHS.LOGS_DIR, logfiles[i]);
    createJsonPromises.push(jsonFromLogfilePromise(logpath));
  }

  return Promise.all(createJsonPromises)
    .then((files) => {
      TIMERS.presort = process.hrtime();
      logger.info(`Sorting ${rawlogJSON.length} records from ${files.length} log files`, { domain: DOMAIN });
      // Sort
      rawlogJSON.sort((a, b) => a.timestamp - b.timestamp);
      logger.debug(`Saving full logs to ${ALL_LOGS_PATH}`, { domain: DOMAIN });
      // Save sorted full log
      return fs.promises.writeFile(ALL_LOGS_PATH, JSON.stringify(rawlogJSON));
    })
    .then(() => {
      // Filter out some spammy messages
      const cleanedJSON = rawlogJSON.filter(
        (obj) => obj.type && obj.type !== logconst.TYPE_KEEPENTITY && obj.type !== logconst.TYPE_OVERLOADED
      );
      // Dump filtered to file
      logger.verbose(
        `Removed ${rawlogJSON.length - cleanedJSON.length} spammy records (keep_entity and server can't keep up)`,
        { domain: DOMAIN }
      );
      logger.debug(`Saving filtered logs to ${FILTERED_LOGS_PATH}`, { domain: DOMAIN });
      return fs.promises.writeFile(FILTERED_LOGS_PATH, JSON.stringify(cleanedJSON));
    })
    .then(() => {
      // Finally, remove all 'server info' messages so that what remains is specific events
      // that invole players (and is "useful")
      const specialEventJSON = rawlogJSON.filter((obj) => {
        return obj.type !== logconst.TYPE_SERVERINFO && obj.type !== logconst.TYPE_OVERLOADED;
      });
      logger.verbose(`${specialEventJSON.length} records determined worth saving.`, { domain: DOMAIN });
      logger.debug(`Saving 'important' JSON file to ${FINAL_LOGS_PATH}`, { domain: DOMAIN });
      return fs.promises.writeFile(FINAL_LOGS_PATH, JSON.stringify(specialEventJSON));
    })
    .then(() => {
      // Saving player relevant logs to each playerdata dir
      const playerTaggedJSON = rawlogJSON.filter((obj) => {
        return obj.player !== null;
      });
      const playerLogs = {};
      for (const record of playerTaggedJSON) {
        if (PLAYERS[record.player]) {
          if (!playerLogs[record.player]) playerLogs[record.player] = [];
          playerLogs[record.player].push(record);
        } else {
          logger.warn(`Wrong player uuid in log message:\n${JSON.stringify(record)}`, { domain: DOMAIN });
        }
      }
      // Create promises to write
      const savePlayerLogs = [];
      for (const uuid of Object.keys(PLAYERS)) {
        if (playerLogs[uuid]) {
          savePlayerLogs.push(
            fs.promises.writeFile(
              path.join(PATHS.TEMP_PLAYERDATA_DIR, uuid, "logs.json"),
              JSON.stringify(playerLogs[uuid])
            )
          );
        }
      }
      return Promise.all(savePlayerLogs);
    })
    .then((res) => {
      const time = `${process.hrtime(TIMERS.presort)[1] / 1000000}ms`;
      logger.info(`All log parsing processes complete (${time})`, { domain: DOMAIN });
      logger.debug(`Saving players' logs.json result ${JSON.stringify(res)}`, { domain: DOMAIN });

      logger.info(`Cleaning up unzipped files (deleting ${unzippedFiles.length} .log files)`, { domain: DOMAIN });
      const cleanupPromises = [];
      for (let i = 0; i < unzippedFiles.length; i++) {
        cleanupPromises.push(fs.promises.unlink(path.join(PATHS.LOGS_DIR, unzippedFiles[i])));
      }
      return Promise.all(cleanupPromises);
    });
}

module.exports = {
  parseLogFiles,
};
