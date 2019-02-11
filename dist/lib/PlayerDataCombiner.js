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

var combinePlayerData = function combinePlayerData(uuid) {
  var readjsonPromises = [_fsExtra.default.readJSON(_path.default.join(_Configuration.default.STATS_DIR, "".concat(uuid, ".json"))), _fsExtra.default.readJSON(_path.default.join(_Configuration.default.ADVANCEMENTS_DIR, "".concat(uuid, ".json"))), _fsExtra.default.readJSON(_path.default.join(_Configuration.default.TEMP_DIR, 'playerdata', "".concat(uuid, ".json"))), _fsExtra.default.readJSON(_path.default.join(_Configuration.default.TEMP_DIR, 'profiles', "".concat(uuid, ".json")))];
  Promise.all(readjsonPromises).then(function (val) {
    _fsExtra.default.writeJSON(_path.default.join(_Configuration.default.OUTPUT_DIR, "".concat(uuid, ".json")), {
      'uuid': uuid,
      'name': _Configuration.default.PLAYERS[uuid],
      'stats': val[0],
      'advancements': val[1],
      'data': val[2],
      'profile': val[3]
    }).then(function (val) {
      _CustomLogger.default.info("Wrote output JSON for ".concat(uuid, "."), DOMAIN);
    });
  });
};

var _default = {
  combinePlayerData: combinePlayerData
};
exports.default = _default;