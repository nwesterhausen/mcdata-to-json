"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _Configuration = _interopRequireDefault(require("./lib/Configuration"));

var _fsExtra = _interopRequireDefault(require("fs-extra"));

var _path = _interopRequireDefault(require("path"));

var _nbt = _interopRequireDefault(require("nbt"));

var _CustomLogger = _interopRequireDefault(require("./lib/CustomLogger"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var PLAYERDATA_FILES = _fsExtra.default.readdirSync(_Configuration.default.PLAYERDATA_DIR),
    PLAYERDATAJSON_DIR = _path.default.join(_Configuration.default.TEMP_DIR, 'playerdata'),
    DOMAIN = 'NBT Parser';

_fsExtra.default.ensureDirSync(PLAYERDATAJSON_DIR);

var parsePlayerdata = function parsePlayerdata() {
  var _loop = function _loop(i) {
    var uuid = PLAYERDATA_FILES[i].replace(/\.dat/, '');

    _CustomLogger.default.debug("Running parse on ".concat(uuid), DOMAIN);

    _fsExtra.default.readFile(_path.default.join(_Configuration.default.PLAYERDATA_DIR, PLAYERDATA_FILES[i]), function (err, data) {
      if (err) {
        throw err;
      }

      _nbt.default.parse(data, function (error, nbtdata) {
        if (error) {
          throw error;
        }

        _fsExtra.default.writeJSON(_path.default.join(PLAYERDATAJSON_DIR, "".concat(uuid, ".json")), nbtdata);
      });
    });
  };

  for (var i = 0; i < PLAYERDATA_FILES.length; i++) {
    _loop(i);
  }
};

var _default = {
  parsePlayerdata: parsePlayerdata
};
exports.default = _default;