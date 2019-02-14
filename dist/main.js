"use strict";

var _Configuration = _interopRequireDefault(require("./Configuration"));

var _CustomLogger = _interopRequireDefault(require("./lib/CustomLogger"));

var _MojangAPI = _interopRequireDefault(require("./lib/MojangAPI"));

var _PlayerData = _interopRequireDefault(require("./lib/PlayerData"));

var _Parser = _interopRequireDefault(require("./lib/log/Parser"));

var _McaParser = _interopRequireDefault(require("./lib/McaParser"));

var _path = _interopRequireDefault(require("path"));

var _fsExtra = _interopRequireDefault(require("fs-extra"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var DOMAIN = 'Main',
    PLAYER_PROFILE_CACHE_DIR = _path.default.join(_Configuration.default.TEMP_DIR, 'profiles'),
    PROFILE_CACHE_ACCEPTABLE_AGE = 1000 * 60 * 60 * 4; // 4 hours


_fsExtra.default.ensureDirSync(PLAYER_PROFILE_CACHE_DIR);

function updateProfiles() {
  var honorCache = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;
  var uuid_list = Object.keys(_Configuration.default.PLAYERS);
  return Promise.all(uuid_list.map(function (uuid) {
    var cachedPlayerProfile = _path.default.join(PLAYER_PROFILE_CACHE_DIR, "".concat(uuid, ".json"));

    var shouldQueryProfile = true;

    if (_fsExtra.default.existsSync(cachedPlayerProfile)) {
      shouldQueryProfile = Date.now() - _fsExtra.default.statSync(cachedPlayerProfile).mtime > PROFILE_CACHE_ACCEPTABLE_AGE || !honorCache;
    }

    if (shouldQueryProfile) {
      _CustomLogger.default.debug("Updating Mojang profile on disk for ".concat(uuid), DOMAIN);

      return new Promise(function (resolve, reject) {
        _MojangAPI.default.getProfileForUUID(uuid).then(function (profileResp) {
          _CustomLogger.default.debug("Profile for ".concat(uuid, " ").concat(profileResp.status, " ").concat(profileResp.statusText), DOMAIN);

          if (profileResp.data) {
            var cleanedProfileJSON = _MojangAPI.default.jsonFromProfileResp(profileResp.data);

            return _fsExtra.default.writeJSON(cachedPlayerProfile, cleanedProfileJSON, {
              'spaces': 2
            });
          }
        }).then(function (res) {
          _CustomLogger.default.info("Cached new profile data for ".concat(uuid), DOMAIN);
        }).catch(function (err) {
          if (err.message.indexOf('code 429')) {
            _CustomLogger.default.warn('Too many requests to Mojang API.', DOMAIN);
          } else _CustomLogger.default.warn(err, DOMAIN);
        });
      });
    } else {
      _CustomLogger.default.info("No need to update Mojang profile for ".concat(_Configuration.default.PLAYERS[uuid], ", cache is younger than 4 hours"), DOMAIN);
    }
  }));
}

function performLogOperations() {
  return new Promise(function (resolve, reject) {
    Promise.all(_fsExtra.default.readdirSync(_Configuration.default.LOGS_DIR).map(function (logfile) {
      return _Parser.default.mclogToJson(logfile);
    })).then(function (val) {
      _CustomLogger.default.info("Wrote ".concat(val.length, " log files to JSON."), DOMAIN);

      _Parser.default.sortRawlogJSON();

      _Parser.default.buildCombinedLogfiles();

      _Parser.default.buildPlayerLogfiles();

      return resolve('Logparsing Completed');
    }).catch(function (err) {
      _CustomLogger.default.warn(err, DOMAIN);

      return reject(err);
    });
  });
}

function createJsonForAllRegionDirs() {
  return new Promise(function (resolve, reject) {
    _McaParser.default.convertRegionDirToJSON(_Configuration.default.OVERWORLD_DIR);

    _McaParser.default.convertRegionDirToJSON(_Configuration.default.NETHER_DIR);

    _McaParser.default.convertRegionDirToJSON(_Configuration.default.END_DIR);

    resolve();
  });
}

function combinePlayerData(uuid) {
  var readjsonPromises = [_fsExtra.default.readJSON(_path.default.join(_Configuration.default.STATS_DIR, "".concat(uuid, ".json"))), _fsExtra.default.readJSON(_path.default.join(_Configuration.default.ADVANCEMENTS_DIR, "".concat(uuid, ".json"))), _fsExtra.default.readJSON(_path.default.join(_Configuration.default.TEMP_DIR, 'playerdata', "".concat(uuid, ".json"))), _fsExtra.default.readJSON(_path.default.join(PLAYER_PROFILE_CACHE_DIR, "".concat(uuid, ".json"))), _fsExtra.default.readJSON(_path.default.join(_Configuration.default.TEMP_DIR, 'logs', "".concat(uuid, ".json")))];
  Promise.all(readjsonPromises).then(function (val) {
    _fsExtra.default.writeJSON(_path.default.join(_Configuration.default.OUTPUT_DIR, "".concat(uuid, ".json")), {
      'uuid': uuid,
      'name': _Configuration.default.PLAYERS[uuid],
      'stats': val[0],
      'advancements': val[1],
      'data': val[2],
      'profile': val[3],
      'log': val[4]
    }).then(function (val) {
      _CustomLogger.default.info("Wrote output JSON for ".concat(uuid, "."), DOMAIN);

      if (val) {
        _CustomLogger.default.debug(val, DOMAIN);
      }
    }).catch(function (err) {
      _CustomLogger.default.warn("Failed to build output for ".concat(uuid, "."), DOMAIN);

      _CustomLogger.default.warn(err, DOMAIN);
    });
  });
}

updateProfiles().then(function (val) {
  // GET PLAYER INFORMATION FROM MOJANG
  return createJsonForAllRegionDirs();
}).then(function (val) {
  _CustomLogger.default.info('Finished saving chunks to JSON', DOMAIN);
}).then(function (val) {
  return _PlayerData.default.convertPlayerdatFiles(); // CONVERT PLAYER.DAT FILES
}).then(function (val) {
  return performLogOperations(); // CONVERT LOG FILES
}).then(function (logopResp) {
  _CustomLogger.default.info('All log operations completed', DOMAIN);

  return Promise.all(Object.keys(_Configuration.default.PLAYERS).map(function (uuid) {
    return combinePlayerData(uuid);
  }));
}).then(function (val) {
  _CustomLogger.default.info('Copied player info to output directory', DOMAIN);
});