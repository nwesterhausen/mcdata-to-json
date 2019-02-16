"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _NbtTools = _interopRequireDefault(require("./NbtTools"));

var _CustomLogger = _interopRequireDefault(require("./CustomLogger"));

var _Configuration = _interopRequireDefault(require("../Configuration"));

var _path = _interopRequireDefault(require("path"));

var _fsExtra = _interopRequireDefault(require("fs-extra"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var mca = require('mca-js');

var DOMAIN = 'MCA Parser';

var PARSED_MCA_CACHE_DIR = _path.default.join(_Configuration.default.WORK_DIR, 'mcajson');

_fsExtra.default.ensureDirSync(PARSED_MCA_CACHE_DIR);

function onlyUnique(value, index, self) {
  return self.indexOf(value) === index;
}

function chunkToJSON(filehandle, chunkX, chunkZ) {
  return new Promise(function (resolve, reject) {
    var chunkdata = mca.getData(filehandle, chunkX, chunkZ);

    if (!chunkdata) {
      return resolve({
        zPos: 0,
        xPos: 0,
        LastUpdate: [],
        Biomes: [],
        //.filter(onlyUnique),
        InhabitedTime: [],
        TileEntities: [],
        Entities: [],
        Status: 'empty',
        Structures: {}
      });
    }

    _NbtTools.default.nbtToJson(chunkdata).then(function (chunkjson) {
      return resolve({
        zPos: chunkjson.Level.zPos,
        xPos: chunkjson.Level.xPos,
        LastUpdate: chunkjson.Level.LastUpdate,
        Biomes: chunkjson.Level.Biomes,
        //.filter(onlyUnique),
        InhabitedTime: chunkjson.Level.InhabitedTime,
        TileEntities: chunkjson.Level.TileEntities,
        Entities: chunkjson.Level.Entities,
        Status: chunkjson.Level.Status,
        Structures: chunkjson.Level.Structures
      });
    }).catch(function (err) {
      return reject(err);
    });
  });
}

function readAllChunksInRegionFile(filehandle) {
  var chunkToJSONPromises = [];

  for (var i = 0; i < 32; i++) {
    for (var j = 0; j < 32; j++) {
      chunkToJSONPromises.push(chunkToJSON(filehandle, i, j));
    }
  }

  return new Promise(function (resolve, reject) {
    Promise.all(chunkToJSONPromises).then(function (val) {
      return resolve(val);
    }).catch(function (err) {
      return reject(err);
    });
  });
}

function convertRegionDirToJSON(mcaDirectory) {
  if (!_fsExtra.default.pathExistsSync(mcaDirectory)) {
    return;
  }

  var discoveredworldname = _path.default.basename(_path.default.dirname(mcaDirectory)) === _path.default.basename(_Configuration.default.WORLD_DIR) ? 'overworld' : _path.default.basename(_path.default.dirname(mcaDirectory));

  var OUTPUT_DIR = _path.default.join(PARSED_MCA_CACHE_DIR, discoveredworldname);

  _fsExtra.default.ensureDirSync(OUTPUT_DIR);

  var files = _fsExtra.default.readdirSync(mcaDirectory);

  files.map(function (filename) {
    if (_path.default.extname(filename) === '.mca') {
      // Check if we previous created a JSON file for this region. If so, skip!
      if (_fsExtra.default.existsSync(_path.default.join(OUTPUT_DIR, filename.replace(/.mca/, '.json')))) {
        if (_fsExtra.default.statSync(OUTPUT_DIR, filename.replace(/.mca/, '.json')).mtime > _fsExtra.default.statSync(_path.default.join(mcaDirectory, filename)).mtime) {
          _CustomLogger.default.debug("The JSON version of ".concat(filename.replace(/.mca/, ''), " is up to date."), DOMAIN);

          return;
        }
      }

      _fsExtra.default.readFile(_path.default.join(mcaDirectory, filename)).then(function (data) {
        _CustomLogger.default.debug("Starting MCA \u27F6  JSON for ".concat(filename), DOMAIN);

        return readAllChunksInRegionFile(data);
      }).then(function (regionJSON) {
        _CustomLogger.default.debug("Saving JSON for ".concat(filename.replace(/.mca/, '')), DOMAIN);

        return _fsExtra.default.writeJSON(_path.default.join(OUTPUT_DIR, filename.replace(/.mca/, '.json')), regionJSON);
      }).then(function (val) {
        _CustomLogger.default.debug("Saved mcajson/".concat(discoveredworldname, "/").concat(filename.replace(/.mca/, '.json')), DOMAIN);
      }).catch(function (err) {
        _CustomLogger.default.warn("Caught error ".concat(err), DOMAIN);
      });
    }
  });
}

var _default = {
  readAllChunksInRegionFile: readAllChunksInRegionFile,
  convertRegionDirToJSON: convertRegionDirToJSON
};
exports.default = _default;