"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _fsExtra = _interopRequireDefault(require("fs-extra"));

var _path = _interopRequireDefault(require("path"));

var _CustomLogger = _interopRequireDefault(require("./CustomLogger"));

var _Configuration = _interopRequireDefault(require("./Configuration"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var DOMAIN = 'Data Combiner';

var parseDeaths = function parseDeaths(uuid) {
  var NAME = _Configuration.default.PLAYERS[uuid];
  return new Promise(function (resolve, reject) {
    _fsExtra.default.readJSON(_path.default.join(_Configuration.default.TEMP_DIR, 'logs', 'deaths.json')).then(function (val) {
      var pdeaths = [];

      for (var i = 0; i < val.length; i++) {
        if (val[i].description.startsWith(NAME)) {
          pdeaths.push(val[i]);
        }
      }

      resolve(pdeaths);
    }).catch(function (err) {
      _CustomLogger.default.warn("parseDeaths: ".concat(err), DOMAIN);
    });
  });
},
    combinePlayerData = function combinePlayerData(uuid) {
  var readjsonPromises = [_fsExtra.default.readJSON(_path.default.join(_Configuration.default.STATS_DIR, "".concat(uuid, ".json"))), _fsExtra.default.readJSON(_path.default.join(_Configuration.default.ADVANCEMENTS_DIR, "".concat(uuid, ".json"))), _fsExtra.default.readJSON(_path.default.join(_Configuration.default.TEMP_DIR, 'playerdata', "".concat(uuid, ".json"))), _fsExtra.default.readJSON(_path.default.join(_Configuration.default.TEMP_DIR, 'profiles', "".concat(uuid, ".json"))), parseDeaths(uuid)];
  Promise.all(readjsonPromises).then(function (val) {
    _fsExtra.default.writeJSON(_path.default.join(_Configuration.default.OUTPUT_DIR, "".concat(uuid, ".json")), {
      'uuid': uuid,
      'name': _Configuration.default.PLAYERS[uuid],
      'stats': val[0],
      'advancements': val[1],
      'data': val[2],
      'profile': val[3],
      'deaths': val[4]
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
};

var _default = {
  combinePlayerData: combinePlayerData
};
exports.default = _default;