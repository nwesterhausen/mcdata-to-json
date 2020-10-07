const nbt = require("nbt");

const condenseNbt = function (nbtjson) {
  if (nbtjson.name === "" && Object.prototype.hasOwnProperty.call(nbtjson, "value")) {
    return condenseNbt(nbtjson.value);
  }

  const condensed = {};

  for (const key in nbtjson) {
    if (Object.prototype.hasOwnProperty.call(nbtjson, key)) {
      switch (nbtjson[key].type) {
        case "compound":
          condensed[key] = condenseNbt(nbtjson[key].value);
          break;
        case "list":
          condensed[key] = [];
          if (nbtjson[key].value.type === "compound") {
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
    }
  }

  return condensed;
};

module.exports = {
  condenseNbt,
  nbtToJson: function (filedata) {
    return new Promise(function (resolve, reject) {
      nbt.parse(filedata, function (err, nbtdata) {
        if (err) {
          return reject(err);
        }
        const cleanNbt = condenseNbt(nbtdata);
        resolve(cleanNbt);
      });
    });
  },
};
