"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _zlib = _interopRequireDefault(require("zlib"));

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var _readline = _interopRequireDefault(require("readline"));

var _CustomLogger = _interopRequireDefault(require("./lib/CustomLogger"));

var _LogConst = _interopRequireDefault(require("./data/LogConst"));

var _LogsRegex = _interopRequireDefault(require("./data/LogsRegex"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var logfiles = [],
    unzippedFiles = [],
    logfiledir = '',
    workdir = '',
    tmplogPath = '',
    latestlogDate = '',
    rawlogJSON = [];

var getDateFromFilename = function getDateFromFilename(filename) {
  // Expects YYYY-MM-DD-#.log
  // log.debug(`Creating timestamp from ${filename}`);
  var y = filename.split('-')[0],
      m = filename.split('-')[1],
      d = filename.split('-')[2],
      t = new Date(y, m - 1, d);

  if (filename === 'latest.log') {
    t = new Date();
  } // log.debug(`Created timestamp ${t.toISOString()}`);


  return t;
},
    getTimestampFromHHMMSSAndBasedate = function getTimestampFromHHMMSSAndBasedate(timeString, basedate) {
  // Expects [HH:MM:SS]
  // log.debug(`Creating timestamp from ${timeString}`);
  var h = timeString.split(':')[0],
      m = timeString.split(':')[1],
      s = timeString.split(':')[2],
      t = basedate;
  t.setSeconds(s);
  t.setMinutes(m);
  t.setHours(h); // log.debug(`Created timestamp ${t.toISOString()}`);

  return t.getTime();
},
    getTimestampFromHHMMSSAndFilename = function getTimestampFromHHMMSSAndFilename(timeString, parentFilename) {
  // Expects [HH:MM:SS]
  var h = timeString.split(':')[0],
      m = timeString.split(':')[1],
      s = timeString.split(':')[2],
      t = getDateFromFilename(parentFilename);
  t.setSeconds(s);
  t.setMinutes(m);
  t.setHours(h);
  return t.getTime();
},
    appendLogActionTo = function appendLogActionTo(dest, actionarray) {
  if (!actionarray) {
    return;
  } // log.debug(`Appending ${actionarray} to destination`);


  dest.push({
    'timestamp': actionarray[0],
    'type': actionarray[1],
    'description': actionarray[2],
    'severity': actionarray[3]
  });
},
    parseLogLine = function parseLogLine(basedate, logline) {
  if (logline.match(_LogsRegex.default.timestampRE)) {
    // parse the time part of the lines
    var time = logline.match(_LogsRegex.default.timestampRE)[0];
    var timestamp = getTimestampFromHHMMSSAndBasedate(time, basedate);
    var sev = logline.match(_LogsRegex.default.severityRE) ? logline.match(_LogsRegex.default.severityRE)[1] : 'ERROR';

    if (logline.match(_LogsRegex.default.playerjoinRE)) {
      return [timestamp, _LogConst.default.TYPE_LOGIN, logline.match(_LogsRegex.default.playerjoinRE)[1], sev];
    } else if (logline.match(_LogsRegex.default.playerleftRE)) {
      return [timestamp, _LogConst.default.TYPE_LOGOFF, logline.match(_LogsRegex.default.playerleftRE)[1], sev];
    } else if (logline.match(_LogsRegex.default.advancementRE)) {
      return [timestamp, _LogConst.default.TYPE_ADVANCEMENT, logline.match(_LogsRegex.default.advancementRE)[1], sev];
    } else if (logline.match(_LogsRegex.default.playerchatRE)) {
      return [timestamp, _LogConst.default.TYPE_CHAT, {
        'player': logline.match(_LogsRegex.default.playerchatRE)[1],
        'chat': logline.substr(logline.indexOf('>') + 2)
      }, sev];
    } else if (logline.match(_LogsRegex.default.arrowdeathRE)) {
      return [timestamp, _LogConst.default.ARROW_DEATH, logline.substr(logline.indexOf(']: ') + 3), sev];
    } else if (logline.match(_LogsRegex.default.cactusdeathRE)) {
      return [timestamp, _LogConst.default.CACTUS_DEATH, logline.substr(logline.indexOf(']: ') + 3), sev];
    } else if (logline.match(_LogsRegex.default.waterdeathRE)) {
      return [timestamp, _LogConst.default.WATER_DEATH, logline.substr(logline.indexOf(']: ') + 3), sev];
    } else if (logline.match(_LogsRegex.default.elytradeathRE)) {
      return [timestamp, _LogConst.default.ELYTRA_DEATH, logline.substr(logline.indexOf(']: ') + 3), sev];
    } else if (logline.match(_LogsRegex.default.explosiondeathRE)) {
      return [timestamp, _LogConst.default.EXPLOSION_DEATH, logline.substr(logline.indexOf(']: ') + 3), sev];
    } else if (logline.match(_LogsRegex.default.fallingdeathRE)) {
      return [timestamp, _LogConst.default.FALLING_DEATH, logline.substr(logline.indexOf(']: ') + 3), sev];
    } else if (logline.match(_LogsRegex.default.anvildeathRE)) {
      return [timestamp, _LogConst.default.ANVIL_DEATH, logline.substr(logline.indexOf(']: ') + 3), sev];
    } else if (logline.match(_LogsRegex.default.firedeathRE)) {
      return [timestamp, _LogConst.default.FIRE_DEATH, logline.substr(logline.indexOf(']: ') + 3), sev];
    } else if (logline.match(_LogsRegex.default.fireworkdeathRE)) {
      return [timestamp, _LogConst.default.FIREWORK_DEATH, logline.substr(logline.indexOf(']: ') + 3), sev];
    } else if (logline.match(_LogsRegex.default.lavadeathRE)) {
      return [timestamp, _LogConst.default.LAVA_DEATH, logline.substr(logline.indexOf(']: ') + 3), sev];
    } else if (logline.match(_LogsRegex.default.lightningdeathRE)) {
      return [timestamp, _LogConst.default.LIGHTNING_DEATH, logline.substr(logline.indexOf(']: ') + 3), sev];
    } else if (logline.match(_LogsRegex.default.magmadeathRE)) {
      return [timestamp, _LogConst.default.MAGMA_DEATH, logline.substr(logline.indexOf(']: ') + 3), sev];
    } else if (logline.match(_LogsRegex.default.killeddeathRE)) {
      return [timestamp, _LogConst.default.KILLED_DEATH, logline.substr(logline.indexOf(']: ') + 3), sev];
    } else if (logline.match(_LogsRegex.default.fireballRE)) {
      return [timestamp, _LogConst.default.FIREBALL_DEATH, logline.substr(logline.indexOf(']: ') + 3), sev];
    } else if (logline.match(_LogsRegex.default.potiondeathRE)) {
      return [timestamp, _LogConst.default.POITION_DEATH, logline.substr(logline.indexOf(']: ') + 3), sev];
    } else if (logline.match(_LogsRegex.default.starvedeathRE)) {
      return [timestamp, _LogConst.default.STARVE_DEATH, logline.substr(logline.indexOf(']: ') + 3), sev];
    } else if (logline.match(_LogsRegex.default.suffocatedeathRE)) {
      return [timestamp, _LogConst.default.SUFFOCATE_DEATH, logline.substr(logline.indexOf(']: ') + 3), sev];
    } else if (logline.match(_LogsRegex.default.thornsdeathRE)) {
      return [timestamp, _LogConst.default.THORNS_DEATH, logline.substr(logline.indexOf(']: ') + 3), sev];
    } else if (logline.match(_LogsRegex.default.voiddeathRE)) {
      return [timestamp, _LogConst.default.VOID_DEATH, logline.substr(logline.indexOf(']: ') + 3), sev];
    } else if (logline.match(_LogsRegex.default.witherdeathRE)) {
      return [timestamp, _LogConst.default.WITHER_DEATH, logline.substr(logline.indexOf(']: ') + 3), sev];
    } else if (logline.match(_LogsRegex.default.bludgeondeathRE)) {
      return [timestamp, _LogConst.default.BLUDGEON_DEATH, logline.substr(logline.indexOf(']: ') + 3), sev];
    } else if (logline.match(_LogsRegex.default.uuiddescRE)) {
      return [timestamp, _LogConst.default.TYPE_PLAYERUUID, logline.substr(logline.indexOf(']: ') + 3), sev];
    } else if (logline.match(_LogsRegex.default.commandRE)) {
      return [timestamp, _LogConst.default.TYPE_COMMAND, logline.substr(logline.indexOf(']: ') + 3), sev];
    } else if (logline.match(_LogsRegex.default.serverreadyRE)) {
      return [timestamp, _LogConst.default.TYPE_SERVERREADY, logline.substr(logline.indexOf(']: ') + 3), sev];
    } else if (logline.match(_LogsRegex.default.serverstopRE)) {
      return [timestamp, _LogConst.default.TYPE_SERVERSTOP, logline.substr(logline.indexOf(']: ') + 3), sev];
    }

    return [timestamp, _LogConst.default.TYPE_SERVERINFO, logline.substr(logline.indexOf(']: ') + 3), sev];
  }
},
    jsonFromLogfile = function jsonFromLogfile(filepath) {
  _CustomLogger.default.debug("Creating JSON for file ".concat(filepath));

  var createdJSON = [],
      createdDate = getDateFromFilename(filepath);

  var rl = _readline.default.createInterface({
    'input': _fs.default.createReadStream(_path.default.join(logfiledir, filepath))
  });

  rl.on('line', function (input) {
    appendLogActionTo(createdJSON, parseLogLine(createdDate, input));
  });
  rl.on('close', function () {
    _CustomLogger.default.debug("Completed parsing ".concat(filepath));

    rawlogJSON.push.apply(rawlogJSON, createdJSON);
  });
},
    jsonFromLogfilePromise = function jsonFromLogfilePromise(filepath) {
  return new Promise(function (resolve, reject) {
    _CustomLogger.default.debug("Creating JSON for file ".concat(filepath));

    var createdJSON = [],
        createdDate = getDateFromFilename(filepath);

    try {
      var rl = _readline.default.createInterface({
        'input': _fs.default.createReadStream(_path.default.join(logfiledir, filepath))
      });

      rl.on('line', function (input) {
        appendLogActionTo(createdJSON, parseLogLine(createdDate, input));
      });
      rl.on('close', function () {
        _CustomLogger.default.debug("Completed parsing ".concat(filepath));

        rawlogJSON.push.apply(rawlogJSON, createdJSON);
        resolve(filepath);
      });
    } catch (err) {
      reject(filepath, err);
    }
  });
};

var _default = {
  'setDirs': function setDirs(logsdir, tempdir) {
    logfiledir = logsdir;
    latestlogDate = _fs.default.statSync(_path.default.join(logfiledir, 'latest.log')).mtime.toISOString();

    _CustomLogger.default.debug("latest.log date: ".concat(latestlogDate));

    workdir = tempdir;
    tmplogPath = _path.default.join(workdir, 'all_logs.json');
  },
  'prepareLogFiles': function prepareLogFiles() {
    var rawLogFiles = _fs.default.readdirSync(logfiledir);

    _CustomLogger.default.debug("Preparing following log files: ".concat(JSON.stringify(rawLogFiles))); // Go through the log dir and sort the files


    for (var i = 0; i < rawLogFiles.length; i++) {
      _CustomLogger.default.debug("Working on file: ".concat(rawLogFiles[i])); // Unzip gziped files, keeeping track of them


      if (rawLogFiles[i].endsWith('.gz')) {
        _CustomLogger.default.debug('Detected gzip file.');

        var tmpLogFile = rawLogFiles[i].substr(0, rawLogFiles[i].length - 3),
            compressedFile = _fs.default.readFileSync(_path.default.join(logfiledir, rawLogFiles[i])),
            unzippedFile = _zlib.default.unzipSync(compressedFile);

        _CustomLogger.default.debug('Unzipping file into log dir.');

        _fs.default.writeFileSync(_path.default.join(logfiledir, tmpLogFile), unzippedFile);

        unzippedFiles.push(tmpLogFile);
        logfiles.push(tmpLogFile);

        _CustomLogger.default.debug("Unzipped ".concat(tmpLogFile));
      } else if (rawLogFiles[i].endsWith('.log')) {
        logfiles.push(rawLogFiles[i]);
      }
    }

    logfiles = logfiles.sort();

    _CustomLogger.default.debug('Log file list sorted internally');
  },
  'combineLogFiles': function combineLogFiles() {
    // Append all the files into one file
    _CustomLogger.default.debug('Clearing the temp.log file');

    _fs.default.writeFileSync(tmplogPath, '');

    for (var i = 0; i < logfiles.length; i++) {
      // special case for latest.log, we want it to be the date instead
      var fileHeader = logfiles[i] === 'latest.log' ? "[Filedate:".concat(latestlogDate, ".log]\n") : "[Filename:".concat(logfiles[i], "]\n");

      _CustomLogger.default.debug("Appending ".concat(logfiles[i], " to temp.log."));

      _fs.default.appendFileSync(tmplogPath, fileHeader + _fs.default.readFileSync(_path.default.join(logfiledir, logfiles[i])));
    }
  },
  'parseLogFiles': function parseLogFiles() {
    _CustomLogger.default.debug('Beginning parse of all log files.');

    var promises = [];

    for (var i = 0; i < logfiles.length; i++) {
      promises.push(jsonFromLogfilePromise(logfiles[i]));
    }

    _CustomLogger.default.info("Began parse of ".concat(logfiles.length, " log files."));

    Promise.all(promises).then(function (files) {
      _CustomLogger.default.info("Completed parsing ".concat(files.length, " log files."));

      _CustomLogger.default.info("Sorting ".concat(rawlogJSON.length, " records."));

      rawlogJSON.sort(function (a, b) {
        return a.timestamp - b.timestamp;
      });

      _fs.default.writeFileSync(tmplogPath, JSON.stringify(rawlogJSON));
    });
  },
  rawlogJSON: rawlogJSON
};
exports.default = _default;