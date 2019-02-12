"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _NBTHelper = _interopRequireDefault(require("./NBTHelper"));

var _CustomLogger = _interopRequireDefault(require("./CustomLogger"));

var _fsExtra = _interopRequireDefault(require("fs-extra"));

var _path = _interopRequireDefault(require("path"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// const fs = require('fs-extra');
var mca = require('mca-js');

var nbt = require('nbt');

var DOMAIN = 'MCA Parser';
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
  var fname = _path.default.basename(mcaFilepath);

  _CustomLogger.default.debug("Starting ".concat(mcaFilepath), DOMAIN);

  masterTileEntityStore[fname] = {};
  return new Promise(function (resolve, reject) {
    _fsExtra.default.readFile(mcaFilepath, function (err, data) {
      if (err) {
        _CustomLogger.default.error("Problem reading ".concat(fname, ": ").concat(err), DOMAIN);

        resolve(err);
      }

      var tileEntityData = [];

      for (var i = 0; i < 32; i++) {
        // var j will increment the Y pos. Note that the actual chunk is regionY * 32 + id
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
              _CustomLogger.default.debug("Caught an empty chunk ".concat(i, ",").concat(j, " in ").concat(fname, "."), DOMAIN);
            } else {
              _CustomLogger.default.error("NBT ERROR THROWN:".concat(i, ",").concat(j, ":").concat(fname, "::").concat(nbterror), DOMAIN);
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

      _CustomLogger.default.debug("Finished ".concat(mcaFilepath), DOMAIN);

      resolve(masterTileEntityStore[fname]);
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