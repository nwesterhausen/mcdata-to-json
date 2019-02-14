"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

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
  condenseNbt: condenseNbt
};
exports.default = _default;