"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _CustomLogger = _interopRequireDefault(require("./CustomLogger"));

var _NbtTools = _interopRequireDefault(require("./NbtTools"));

var _Configuration = _interopRequireDefault(require("../Configuration"));

var _fsExtra = _interopRequireDefault(require("fs-extra"));

var _path = _interopRequireDefault(require("path"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var DOMAIN = 'Player.dat Operations',
    PLAYERDATA_JSON_CACHE_DIR = _path.default.join(_Configuration.default.TEMP_DIR, 'playerdata');

_fsExtra.default.ensureDirSync(PLAYERDATA_JSON_CACHE_DIR);

function convertPlayerdat(datfilename) {
  var PLAYERDATA_JSON_CACHE_FILE = _path.default.join(PLAYERDATA_JSON_CACHE_DIR, datfilename.replace(/.dat/, '.json'));

  return new Promise(function (resolve, reject) {
    _fsExtra.default.readFile(_path.default.join(_Configuration.default.PLAYERDATA_DIR, datfilename)).then(function (filedata) {
      return _NbtTools.default.nbtToJson(filedata);
    }).then(function (cleanJson) {
      return _fsExtra.default.writeJSON(PLAYERDATA_JSON_CACHE_FILE, cleanJson, {
        'spaces': 2
      });
    }).then(function (res) {
      _CustomLogger.default.info("Parsed NBT ".concat(_path.default.basename(PLAYERDATA_JSON_CACHE_FILE).replace(/.json/, '')), DOMAIN);

      return resolve(res);
    }).catch(function (err) {
      _CustomLogger.default.warn("Error when reading dat file. ".concat(err), DOMAIN);

      return reject(err);
    });
  });
}

function convertPlayerdatFiles() {
  return new Promise(function (resolve, reject) {
    Promise.all(_fsExtra.default.readdirSync(_Configuration.default.PLAYERDATA_DIR).map(convertPlayerdat)).then(function (val) {
      return resolve(val);
    }).catch(function (err) {
      return reject(err);
    });
  });
}

var _default = {
  convertPlayerdat: convertPlayerdat,
  convertPlayerdatFiles: convertPlayerdatFiles
};
exports.default = _default;