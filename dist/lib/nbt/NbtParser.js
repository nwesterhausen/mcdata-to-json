"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _NbtTools = _interopRequireDefault(require("./NbtTools"));

var _nbt = _interopRequireDefault(require("nbt"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _default = {
  parsePlayerDat: function parsePlayerDat(filedata) {
    return new Promise(function (resolve, reject) {
      _nbt.default.parse(filedata, function (err, nbtdata) {
        if (err) {
          return reject(err);
        }

        var cleanNbt = _NbtTools.default.condenseNbt(nbtdata);

        resolve(cleanNbt);
      });
    });
  }
};
exports.default = _default;