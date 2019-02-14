"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _Constants = _interopRequireDefault(require("./Constants"));

var _Configuration = _interopRequireDefault(require("../../Configuration"));

var _Tools = _interopRequireDefault(require("./Tools"));

var _CustomLogger = _interopRequireDefault(require("../CustomLogger"));

var _zlib = _interopRequireDefault(require("zlib"));

var _fsExtra = _interopRequireDefault(require("fs-extra"));

var _path = _interopRequireDefault(require("path"));

var _readline = _interopRequireDefault(require("readline"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

var DOMAIN = 'Logs Parser',
    LOG_JSON_CACHE_DIR = _path.default.join(_Configuration.default.TEMP_DIR, 'logs');

var rawlogJSON = [],
    cleanedJSON = [],
    latestlogDate = "",
    updateLatestLogDate = function updateLatestLogDate() {
  latestlogDate = _fsExtra.default.statSync(_path.default.join(_Configuration.default.LOGS_DIR, 'latest.log')).mtime.toISOString();

  _CustomLogger.default.debug("latest.log date: ".concat(latestlogDate), DOMAIN);
};

_fsExtra.default.ensureDirSync(LOG_JSON_CACHE_DIR);

updateLatestLogDate();

function mclogToJson(logfilename) {
  var FILE_EXTENSION = _path.default.extname(logfilename); // Check if we previous created a JSON file for this region. If so, skip!


  if (_fsExtra.default.existsSync(_path.default.join(LOG_JSON_CACHE_DIR, "".concat(logfilename.split('.')[0], ".json")))) {
    if (_fsExtra.default.statSync(LOG_JSON_CACHE_DIR, "".concat(logfilename.split('.')[0], ".json")).mtime > _fsExtra.default.statSync(_path.default.join(_Configuration.default.LOGS_DIR, logfilename)).mtime) {
      if (FILE_EXTENSION === '.log') {
        _CustomLogger.default.debug("The JSON version of ".concat(logfilename, " is up to date."), DOMAIN);

        var logjs = _fsExtra.default.readJSONSync(_path.default.join(LOG_JSON_CACHE_DIR, "".concat(logfilename.split('.')[0], ".json")));

        rawlogJSON.push.apply(rawlogJSON, _toConsumableArray(logjs));
      }

      return;
    }
  }

  if (FILE_EXTENSION === '.gz') {
    var newLogfilename = unzipLogFile(logfilename);
    return mclogToJson(newLogfilename);
  }

  var createdDate = _Tools.default.getDateFromFilename(logfilename);

  return new Promise(function (resolve, reject) {
    var createdJSON = [];

    _CustomLogger.default.debug("Parsing ".concat(logfilename, " into JSON. (").concat(createdDate, ")"), DOMAIN);

    var linereader = _readline.default.createInterface({
      'input': _fsExtra.default.createReadStream(_path.default.join(_Configuration.default.LOGS_DIR, logfilename))
    });

    linereader.on('line', function (input) {
      _Tools.default.appendLogActionTo(createdJSON, _Tools.default.parseLogLine(createdDate, input));
    });
    linereader.on('close', function () {
      if (createdJSON.length === 0) {
        _CustomLogger.default.warn("".concat(logfilename, " parsed into empty array. Not saving."), DOMAIN);
      } else {
        _CustomLogger.default.debug("Completed JSON conversion of ".concat(logfilename), DOMAIN);

        rawlogJSON.push.apply(rawlogJSON, createdJSON);

        _fsExtra.default.writeJSON(_path.default.join(LOG_JSON_CACHE_DIR, "".concat(logfilename.replace(/.log/, '.json'))), createdJSON, {
          'spaces': 2
        }).then(function (val) {
          _CustomLogger.default.debug("Wrote ".concat(logfilename.replace(/.log/, '.json'), "."));

          return resolve(val);
        }).catch(function (err) {
          _CustomLogger.default.warn("Error writing log JSON: ".concat(err));

          return reject(err);
        });
      }
    });
  });
}

function unzipLogFile(gzipLogfile) {
  _CustomLogger.default.debug("Going to decompress ".concat(gzipLogfile), DOMAIN);

  var compressedFilehandle = _fsExtra.default.readFileSync(_path.default.join(_Configuration.default.LOGS_DIR, gzipLogfile));

  var unzippedData = _zlib.default.unzipSync(compressedFilehandle);

  _fsExtra.default.writeFileSync(_path.default.join(_Configuration.default.LOGS_DIR, gzipLogfile.replace(/.gz/, '')), unzippedData);

  return gzipLogfile.replace(/.gz/, '');
}

function sortRawlogJSON() {
  rawlogJSON.sort(function (a, b) {
    return a.timestamp - b.timestamp;
  });
}

function buildCombinedLogfiles() {
  // 'Clean' JSON
  // no 'moved too quickly!'
  // no 'server overloaded!'
  // no 'keeping entity @e'
  cleanedJSON = rawlogJSON.filter(function (obj) {
    return [_Constants.default.TYPE_KEEPENTITY, _Constants.default.TYPE_OVERLOADED, _Constants.default.TYPE_MOVEDQUICKLY, _Constants.default.TYPE_PREPARESPAWN, _Constants.default.TYPE_ARGUMENTABIGUITY].indexOf(obj.type) === -1;
  });

  _fsExtra.default.writeJSONSync(_path.default.join(LOG_JSON_CACHE_DIR, 'filtered_logs.json'), cleanedJSON, {
    'spaces': 2
  });

  _CustomLogger.default.debug("Wrote 'cleaned' JSON file to ".concat(_path.default.join(LOG_JSON_CACHE_DIR, 'filtered_logs.json'), " (").concat(cleanedJSON.length, " records)"), DOMAIN); // Only chat messages


  var chatJSON = cleanedJSON.filter(function (obj) {
    return obj.type === _Constants.default.TYPE_CHAT;
  });

  _fsExtra.default.writeJSONSync(_path.default.join(LOG_JSON_CACHE_DIR, 'chat.json'), chatJSON, {
    'spaces': 2
  });

  _CustomLogger.default.debug("Wrote 'chat' JSON file to ".concat(_path.default.join(LOG_JSON_CACHE_DIR, 'chat.json'), " (").concat(chatJSON.length, " records)"), DOMAIN); // Only command messages


  var commandJSON = cleanedJSON.filter(function (obj) {
    return obj.type === _Constants.default.TYPE_COMMAND;
  });

  _fsExtra.default.writeJSONSync(_path.default.join(LOG_JSON_CACHE_DIR, 'command.json'), commandJSON, {
    'spaces': 2
  });

  _CustomLogger.default.debug("Wrote 'command' JSON file to ".concat(_path.default.join(LOG_JSON_CACHE_DIR, 'command.json'), " (").concat(commandJSON.length, " records)"), DOMAIN); // Only command messages


  var deathJSON = cleanedJSON.filter(function (obj) {
    return obj.type <= 20;
  });

  _fsExtra.default.writeJSONSync(_path.default.join(LOG_JSON_CACHE_DIR, 'deaths.json'), deathJSON, {
    'spaces': 2
  });

  _CustomLogger.default.debug("Wrote 'command' JSON file to ".concat(_path.default.join(LOG_JSON_CACHE_DIR, 'deaths.json'), " (").concat(deathJSON.length, " records)"), DOMAIN);
}

function buildPlayerLogfiles() {
  var uuid_list = Object.keys(_Configuration.default.PLAYERS);
  uuid_list.map(function (uuid) {
    var thisPlayersLog = [];
    var pattern = "(".concat(uuid, "|").concat(_Configuration.default.PLAYERS[uuid], ")");
    var playernameRegex = new RegExp(pattern);
    thisPlayersLog = cleanedJSON.filter(function (logEntry) {
      if (!logEntry.hasOwnProperty('description')) {
        return false;
      }

      if (logEntry.type === _Constants.default.TYPE_CHAT) {
        return logEntry.description.player === _Configuration.default.PLAYERS[uuid];
      }

      return logEntry.description.match(playernameRegex);
    });

    _fsExtra.default.writeJsonSync(_path.default.join(LOG_JSON_CACHE_DIR, "".concat(uuid, ".json")), thisPlayersLog, {
      'spaces': 2
    });

    _CustomLogger.default.debug("Wrote log entries for ".concat(_Configuration.default.PLAYERS[uuid]), DOMAIN);
  });
}

var _default = {
  mclogToJson: mclogToJson,
  latestlogDate: latestlogDate,
  buildCombinedLogfiles: buildCombinedLogfiles,
  buildPlayerLogfiles: buildPlayerLogfiles,
  sortRawlogJSON: sortRawlogJSON
};
exports.default = _default;