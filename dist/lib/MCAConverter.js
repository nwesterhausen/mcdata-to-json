"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _NBTHelper = _interopRequireDefault(require("./NBTHelper"));

var _Configuration = _interopRequireDefault(require("./Configuration"));

var _CustomLogger = _interopRequireDefault(require("./CustomLogger"));

var _fsExtra = _interopRequireDefault(require("fs-extra"));

var _path = _interopRequireDefault(require("path"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var mca = require('mca-js');

var nbt = require('nbt');

var DOMAIN = 'MCA Parser';

_fsExtra.default.ensureDirSync(_path.default.join(_Configuration.default.TEMP_DIR), 'mcajson');

var masterTileEntityStore = {};

var recordTileEntity = function recordTileEntity(tejson, storageObject) {
  if (!tejson.hasOwnProperty('id')) {
    return;
  }

  var id = tejson.id.value,
      te = _NBTHelper.default.condenseNBT(tejson);

  if (!storageObject.hasOwnProperty(id)) {
    storageObject[id] = [];
  }

  storageObject[id].push(te);
},
    parseMCAPromise = function parseMCAPromise(mcaFilepath) {
  if (_fsExtra.default.lstatSync(mcaFilepath).isDirectory()) {
    _CustomLogger.default.warn("Was given a directory to parse ".concat(mcaFilepath), DOMAIN);

    return;
  }

  var discoveredworldname = _path.default.basename(_path.default.dirname(_path.default.dirname(mcaFilepath))) === _path.default.basename(_Configuration.default.WORLD_DIR) ? 'overworld' : _path.default.basename(_path.default.dirname(_path.default.dirname(mcaFilepath)));

  var fname = _path.default.basename(mcaFilepath),
      worldregion = discoveredworldname;

  _fsExtra.default.ensureDirSync(_path.default.join(_Configuration.default.TEMP_DIR, 'mcajson', worldregion));

  _CustomLogger.default.debug("Starting ".concat(mcaFilepath), DOMAIN);

  masterTileEntityStore[fname] = {}; // eslint-disable-next-line no-unused-vars

  return new Promise(function (resolve, reject) {
    _fsExtra.default.readFile(mcaFilepath, function (err, data) {
      if (err) {
        _CustomLogger.default.error("Problem reading ".concat(fname, ": ").concat(err), DOMAIN);

        resolve(err);
      }

      var tileEntityData = [];
      /**
       * 32 x 32 chunks in each region. We loop over each chunk.
       */

      for (var i = 0; i < 32; i++) {
        for (var j = 0; j < 32; j++) {
          var nbtdata = mca.getData(data, i, j);

          try {
            nbt.parse(nbtdata, function (error, jsdata) {
              if (error) {
                _CustomLogger.default.error("Problem parsing NBT in ".concat(fname, ": ").concat(err), DOMAIN);

                resolve(error);
              } // Only care about TileEntities for right now


              if (jsdata.value.Level.value.TileEntities.value.value.length > 0) {
                tileEntityData.push(jsdata.value.Level.value.TileEntities.value.value);
              }
            });
          } catch (nbterror) {
            if (nbterror.message === 'Argument "data" is falsy') {
              _CustomLogger.default.silly("Caught an empty chunk ".concat(i, ",").concat(j, " in ").concat(fname, "."), DOMAIN);
            } else {
              _CustomLogger.default.warn("NBT ERROR THROWN:".concat(i, ",").concat(j, ":").concat(fname, "::").concat(nbterror), DOMAIN);
            }
          }
        }
      }

      var flatTEdata = tileEntityData.flat();

      for (var _i = 0; _i < flatTEdata.length; _i++) {
        recordTileEntity(flatTEdata[_i], masterTileEntityStore[fname]);
      }

      for (var key in masterTileEntityStore[fname]) {
        _CustomLogger.default.debug("Found ".concat(masterTileEntityStore[fname][key].length, " ").concat(key, " in ").concat(fname), DOMAIN);
      }

      _fsExtra.default.writeJSON(_path.default.join(_Configuration.default.TEMP_DIR, 'mcajson', worldregion, "".concat(fname.replace(/.mca/, ''), ".json")), masterTileEntityStore[fname]).then(function (val) {
        _CustomLogger.default.debug("Finished ".concat(mcaFilepath), DOMAIN);

        _CustomLogger.default.debug("JSON Write returned ".concat(val), DOMAIN);

        resolve(fname);
      });
    });
  });
};

var _default = {
  parseMCAPromise: parseMCAPromise,
  'tileEntities': function tileEntities() {
    return masterTileEntityStore;
  }
};
exports.default = _default;