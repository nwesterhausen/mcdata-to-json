"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var condenseNBT = function condenseNBT(nbtjson) {
  var condensed = {};

  for (var key in nbtjson) {
    switch (nbtjson[key].type) {
      case 'compound':
        condensed[key] = condenseNBT(nbtjson[key].value);
        break;

      case 'list':
        condensed[key] = [];

        if (nbtjson[key].value.type !== 'end') {
          for (var i in nbtjson[key].value.value) {
            condensed[key].push(condenseNBT(nbtjson[key].value.value[i]));
          }
        }

        break;

      default:
        condensed[key] = nbtjson[key].value;
        break;
    }
  }

  if (condensed.hasOwnProperty('x') && condensed.hasOwnProperty('y') && condensed.hasOwnProperty('z')) {
    condensed.pos = [condensed.x, condensed.y, condensed.z];
  }

  return condensed;
};

var _default = {
  condenseNBT: condenseNBT
};
exports.default = _default;