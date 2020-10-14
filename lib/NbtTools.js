const nbt = require("nbt");
const int64 = require('int64-napi')
const logger = require("./Configuration").logger;
const DOMAIN = "NbtTools";

/**
 *
 * @param {Object} nbtjson
 * @return {Object}
 */
function condenseNbt(nbtjson) {
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
        case "long":
          logger.silly(`Sending long value ${key} to be converted.`,{domain:DOMAIN})
          condensed[key] = convertLongToInt(nbtjson[key].value);
          break;
        default:
          condensed[key] = nbtjson[key].value;
          logger.silly(`Dropped tag ${nbtjson[key].type} from ${key}:${nbtjson[key].value}`, { domain: DOMAIN });
          break;
      }
    }
  }

  return condensed;
}

/**
 *
 * @param {*} filedata
 * @return {Promise}
 */
function nbtToJson(filedata) {
  return new Promise(function (resolve, reject) {
    nbt.parse(filedata, function (err, nbtdata) {
      if (err) {
        return reject(err);
      }
      const cleanNbt = condenseNbt(nbtdata);
      resolve(cleanNbt);
    });
  });
}

/**
 * Convert the big endian Int32 array from the nbt parsing to a big int
 * @param {Array} bigEndianLongArray
 * @return {string}
 */
function convertLongToInt(bigEndianLongArray) {
  const longstr = ''+ new int64.Int64(bigEndianLongArray[1], bigEndianLongArray[0])
  logger.debug(`Converted ${bigEndianLongArray} to long ${longstr}`, { domain: DOMAIN });
  return longstr;
}

module.exports = {
  condenseNbt,
  nbtToJson,
};
