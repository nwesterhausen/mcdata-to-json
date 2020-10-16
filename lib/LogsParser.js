const PATHS = require("./helpers/PathReference").paths;
const logger = require("./helpers/Logger").getLogger();
const logconst = require("./helpers/LogConst");
const logregx = require("./helpers/LogsRegex");

const zlib = require("zlib");
const fs = require("fs");
const path = require("path");
const readline = require("readline");

const DOMAIN = "LogParser";
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
  logger.silly(`Creating timestamp from ${shortFilename} (${y}, ${m} - 1, ${d})`, { domain: DOMAIN });
  let t = new Date(y, m - 1, d);

  if (shortFilename === "latest.log") {
    t = new Date();
  }

  logger.silly(`Created timestamp ${t.toISOString()}`, { domain: DOMAIN });
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
  logger.silly(`Created timestamp ${t.toISOString()}`, { domain: DOMAIN });
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
  logger.debug(`Appending ${JSON.stringify(actionarray)} to destination`, { domain: DOMAIN });
  dest.push({
    description: actionarray[2],
    severity: actionarray[3],
    timestamp: actionarray[0],
    type: actionarray[1],
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
 */
function parseLogFiles() {
  prepareLogFiles();
  const tmplogPath = path.join(PATHS.TEMP_LOG_JSON_DIR, "all_logs.json");
  logger.debug("Beginning parse of all log files.", { domain: DOMAIN });
  const createJsonPromises = [];

  for (let i = 0; i < logfiles.length; i++) {
    const logpath = path.join(PATHS.LOGS_DIR, logfiles[i]);
    createJsonPromises.push(jsonFromLogfilePromise(logpath));
  }

  logger.info(`Began parse of ${logfiles.length} log files.`, { domain: DOMAIN });
  Promise.all(createJsonPromises)
    .then((files) => {
      logger.info(`Completed parsing ${files.length} log files.`, { domain: DOMAIN });
      logger.info(`Sorting ${rawlogJSON.length} records.`, { domain: DOMAIN });
      // Sort our held records.
      rawlogJSON.sort((a, b) => {
        return a.timestamp - b.timestamp;
      });
      // Save sorted full dump of files to .json file
      logger.debug(`Dumping full log JSON to ${tmplogPath}`, { domain: DOMAIN });
      fs.promises.writeFile(tmplogPath, JSON.stringify(rawlogJSON)).catch((err) => {
        logger.error(`Writing full log to JSON failed!`, { domain: DOMAIN });
        logger.error(err, { domain: DOMAIN });
      });
      // Filter out some junk records
      const cleanedJSON = rawlogJSON.filter((obj) => {
        return obj.type && obj.type !== logconst.TYPE_KEEPENTITY && obj.type !== logconst.TYPE_OVERLOADED;
      });
      // Dump first-stage filterd to .json
      fs.promises
        .writeFile(path.join(PATHS.TEMP_LOG_JSON_DIR, "filtered_logs.json"), JSON.stringify(cleanedJSON))
        .then(() => {
          logger.info(
            `${
              rawlogJSON.length - cleanedJSON.length
            } records removed (filtered out 'keeping entity' and 'server overloaded' messages).`,
            { domain: DOMAIN }
          );
          logger.debug(`Wrote 'cleaned' JSON file to ${path.join(PATHS.TEMP_LOG_JSON_DIR, "filtered_logs.json")}`, {
            domain: DOMAIN,
          });
        })
        .catch((err) => {
          logger.error(`Writing 'cleaned' JSON log failed!`, { domain: DOMAIN });
          logger.error(err, { domain: DOMAIN });
        });
      // Finally, remove all 'server info' messages so that what remains is specific events
      // that invole players (and is "useful")
      const specialEventJSON = cleanedJSON.filter((obj) => {
        return obj.type !== logconst.TYPE_SERVERINFO;
      });
      fs.promises
        .writeFile(path.join(PATHS.TEMP_LOG_JSON_DIR, "special_event_logs.json"), JSON.stringify(specialEventJSON))
        .then(() => {
          logger.info(`${specialEventJSON.length} records determined worth saving.`, { domain: DOMAIN });
          logger.debug(
            `Wrote 'important' JSON file to ${path.join(PATHS.TEMP_LOG_JSON_DIR, "special_event_logs.json")}`,
            {
              domain: DOMAIN,
            }
          );

          return fs.promises.writeFile(
            path.join(PATHS.OUTPUT_DIR, "minecraft_logs.json"),
            JSON.stringify(specialEventJSON)
          );
        })
        .catch((err) => {
          logger.error(`Writing final JSON log failed!`, { domain: DOMAIN });
          logger.error(err, { domain: DOMAIN });
        });

      logger.info(`Cleaning up unzipped files (deleting ${unzippedFiles.length} .log files)`, { domain: DOMAIN });
      const cleanupPromises = [];
      for (let i = 0; i < unzippedFiles.length; i++) {
        cleanupPromises.push(fs.promises.unlink(path.join(PATHS.LOGS_DIR, unzippedFiles[i])));
      }
      return Promise.all(cleanupPromises);
    })
    .then((results) => {
      logger.debug(`Cleaned up ${results.length} .log files we created.`, { domain: DOMAIN });
    })
    .catch((err) => {
      logger.error(`Parsing logs resulted in an error!`, { domain: DOMAIN });
      logger.error(err, { domain: DOMAIN });
    });
}

module.exports = {
  parseLogFiles,
};
