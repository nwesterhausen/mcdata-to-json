const zlib = require("zlib");
const fs = require("fs");
const path = require("path");
const readline = require("readline");
const log = require("../CustomLogger");
const logconst = require("./LogConst");
const logregx = require("./LogsRegex");
const { OUTPUT_DIR } = require("../Configuration");

const DOMAIN = "LogParser";
let logfiles = [];
const unzippedFiles = [];
let logfiledir = "";
let workdir = "";
let tmplogPath = "";
let latestlogDate = "";
const rawlogJSON = [];

/**
 * Expects YYYY-MM-DD-#.log
 * @param {string} filename
 * @return {Date}
 */
function getDateFromFilename(filename) {
  log.debug(DOMAIN, `Creating timestamp from ${filename}`);
  const y = filename.split("-")[0];
  const m = filename.split("-")[1];
  const d = filename.split("-")[2];
  let t = new Date(y, m - 1, d);

  if (filename === "latest.log") {
    t = new Date();
  }

  log.debug(DOMAIN, `Created timestamp ${t.toISOString()}`);
  return t;
}

/**
 * Expects [HH:MM:SS]
 * @param {string} timeString
 * @param {Date} basedate
 * @return {string}
 */
function getTimestampFromHHMMSSAndBasedate(timeString, basedate) {
  log.debug(DOMAIN, `Creating timestamp from ${timeString}`);
  const h = timeString.split(":")[0];
  const m = timeString.split(":")[1];
  const s = timeString.split(":")[2];
  const t = basedate;

  t.setSeconds(s);
  t.setMinutes(m);
  t.setHours(h);
  log.debug(DOMAIN, `Created timestamp ${t.toISOString()}`);
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
  log.debug(DOMAIN, `Appending ${JSON.stringify(actionarray)} to destination`);
  dest.push({
    timestamp: actionarray[0],
    type: actionarray[1],
    description: actionarray[2],
    severity: actionarray[3],
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
          player: logline.match(logregx.playerchatRE)[1],
          chat: logline.substr(logline.indexOf(">") + 2),
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
 * Given a log file, creates json of the entries
 * @param {string} filepath
 */
function jsonFromLogfile(filepath) {
  log.debug(DOMAIN, `Creating JSON for file ${filepath}`);
  const createdJSON = [];
  const createdDate = getDateFromFilename(filepath);
  const rl = readline.createInterface({
    input: fs.createReadStream(path.join(logfiledir, filepath)),
  });

  rl.on("line", (input) => {
    appendLogActionTo(createdJSON, parseLogLine(createdDate, input));
  });
  rl.on("close", () => {
    log.debug(DOMAIN, `Completed parsing ${filepath}`);
    rawlogJSON.push(...createdJSON);
  });
}

/**
 *
 * @param {string} filepath
 * @return {object}
 */
function jsonFromLogfilePromise(filepath) {
  return new Promise((resolve, reject) => {
    log.debug(DOMAIN, `Creating JSON for file ${filepath}`);
    const createdJSON = [];
    const createdDate = getDateFromFilename(filepath);

    try {
      const rl = readline.createInterface({
        input: fs.createReadStream(path.join(logfiledir, filepath)),
      });

      rl.on("line", (input) => {
        appendLogActionTo(createdJSON, parseLogLine(createdDate, input));
      });
      rl.on("close", () => {
        log.debug(DOMAIN, `Completed parsing ${filepath}`);
        rawlogJSON.push(...createdJSON);
        resolve(filepath);
      });
    } catch (err) {
      reject(filepath, err);
    }
  });
}

module.exports = {
  setConfig: function (config) {
    logfiledir = config.LOGS;
    latestlogDate = fs.statSync(path.join(logfiledir, "latest.log")).mtime.toISOString();
    log.debug(DOMAIN, `latest.log date: ${latestlogDate}`);
    workdir = config.TEMP_DIR;
    tmplogPath = path.join(workdir, "all_logs.json");
  },
  prepareLogFiles: function () {
    const rawLogFiles = fs.readdirSync(logfiledir);

    log.debug(DOMAIN, `Preparing following log files: ${JSON.stringify(rawLogFiles)}`);
    // Go through the log dir and sort the files
    for (let i = 0; i < rawLogFiles.length; i++) {
      log.debug(DOMAIN, `Working on file: ${rawLogFiles[i]}`);
      // Unzip gziped files, keeeping track of them
      if (rawLogFiles[i].endsWith(".gz")) {
        log.debug(DOMAIN, "Detected gzip file.");
        const tmpLogFile = rawLogFiles[i].substr(0, rawLogFiles[i].length - 3);
        const compressedFile = fs.readFileSync(path.join(logfiledir, rawLogFiles[i]));
        const unzippedFile = zlib.unzipSync(compressedFile);

        log.debug(DOMAIN, "Unzipping file into log dir.");
        fs.writeFileSync(path.join(logfiledir, tmpLogFile), unzippedFile);

        unzippedFiles.push(tmpLogFile);
        logfiles.push(tmpLogFile);
        log.debug(DOMAIN, `Unzipped ${tmpLogFile}`);
      } else if (rawLogFiles[i].endsWith(".log")) {
        logfiles.push(rawLogFiles[i]);
      }
    }
    logfiles = logfiles.sort();
    log.debug(DOMAIN, "Log file list sorted internally");
  },
  combineLogFiles: function () {
    // Append all the files into one file
    log.debug(DOMAIN, "Clearing the temp.log file");
    fs.writeFileSync(tmplogPath, "");
    for (let i = 0; i < logfiles.length; i++) {
      // special case for latest.log, we want it to be the date instead
      const fileHeader =
        logfiles[i] === "latest.log" ? `[Filedate:${latestlogDate}.log]\n` : `[Filename:${logfiles[i]}]\n`;

      log.debug(DOMAIN, `Appending ${logfiles[i]} to temp.log.`);
      fs.appendFileSync(tmplogPath, fileHeader + fs.readFileSync(path.join(logfiledir, logfiles[i])));
    }
  },
  parseLogFiles: function () {
    log.debug(DOMAIN, "Beginning parse of all log files.");
    const promises = [];

    for (let i = 0; i < logfiles.length; i++) {
      promises.push(jsonFromLogfilePromise(logfiles[i]));
    }
    log.info(DOMAIN, `Began parse of ${logfiles.length} log files.`);
    Promise.all(promises).then((files) => {
      log.info(DOMAIN, `Completed parsing ${files.length} log files.`);
      log.info(DOMAIN, `Sorting ${rawlogJSON.length} records.`);
      rawlogJSON.sort((a, b) => {
        return a.timestamp - b.timestamp;
      });
      fs.writeFileSync(tmplogPath, JSON.stringify(rawlogJSON));
      log.debug(DOMAIN, `Dumped full log JSON to ${tmplogPath}`);
      const cleanedJSON = rawlogJSON.filter((obj) => {
        return obj.type && obj.type !== logconst.TYPE_KEEPENTITY && obj.type !== logconst.TYPE_OVERLOADED;
      });

      fs.writeFileSync(path.join(workdir, "filtered_logs.json"), JSON.stringify(cleanedJSON));
      log.info(
        DOMAIN,
        `${
          rawlogJSON.length - cleanedJSON.length
        } records removed (filtered out 'keeping entity' and 'server overloaded' messages).`
      );
      log.debug(DOMAIN, `Wrote 'cleaned' JSON file to ${path.join(workdir, "filtered_logs.json")}`);
      const specialEventJSON = cleanedJSON.filter((obj) => {
        return obj.type !== logconst.TYPE_SERVERINFO;
      });

      fs.writeFileSync(path.join(workdir, "special_event_logs.json"), JSON.stringify(specialEventJSON));
      log.info(DOMAIN, `${specialEventJSON.length} records determined worth saving.`);
      log.debug(DOMAIN, `Wrote 'important' JSON file to ${path.join(workdir, "special_event_logs.json")}`);

      fs.writeFileSync(path.join(OUTPUT_DIR, "minecraft_logs.json"), JSON.stringify(specialEventJSON));
    });
  },
  jsonFromLogfile,
};
