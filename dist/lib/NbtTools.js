"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _nbt = _interopRequireDefault(require("nbt"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var condenseNbt = function condenseNbt(nbtjson) {
  if (nbtjson.name === '' && nbtjson.hasOwnProperty('value')) {
    return condenseNbt(nbtjson.value);
  }

  var condensed = {};

  var _loop = function _loop(key) {
    switch (nbtjson[key].type) {
      case 'compound':
        condensed[key] = condenseNbt(nbtjson[key].value);
        break;

      case 'list':
        condensed[key] = [];

        if (nbtjson[key].value.type === 'compound') {
          nbtjson[key].value.value.map(function (listvalue) {
            condensed[key].push(condenseNbt(listvalue));
          });
        } else {
          nbtjson[key].value.value.map(function (listvalue) {
            condensed[key].push(listvalue);
          });
        }

        break;

      default:
        condensed[key] = nbtjson[key].value;
        break;
    }
  };

  for (var key in nbtjson) {
    _loop(key);
  }

  return condensed;
};

var _default = {
  condenseNbt: condenseNbt,
  nbtToJson: function nbtToJson(filedata) {
    return new Promise(function (resolve, reject) {
      _nbt.default.parse(filedata, function (err, nbtdata) {
        if (err) {
          return reject(err);
        }

        var cleanNbt = condenseNbt(nbtdata);
        resolve(cleanNbt);
      });
    });
  }
};
exports.default = _default;