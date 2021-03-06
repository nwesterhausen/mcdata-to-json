const int64 = require("int64-napi");
const nbt = require("nbt");
const logger = require("./helpers/Logger").getLogger();
const DOMAIN = "NbtTools";

/**
 * NBT stores everything with two values, a tag type and its value.
 * To make the end result JSON more digestible, this function flattens
 * out the NBT-style JSON into simpler where instead of key -> {type: x, value: x}
 * it is key -> value.
 *
 * The nbt library used, nbt-js, turns some of the big number tags into
 * arrays of Int32 (since that's the safest way to avoid data loss).
 * condenseNbt turns TAG_LONG into a string with the Int64 value. Also
 * there are some UUIDs represented as Int32[4] which could also be converted
 * but that hasn't been implemented yet.
 * @param {Object} nbtjson
 * @return {Object} condensed JSON
 */
function condenseNbt(nbtjson) {
  if (nbtjson.name === "" && Object.prototype.hasOwnProperty.call(nbtjson, "value")) {
    return condenseNbt(nbtjson.value);
  }

  const condensed = {};

  for (const key in nbtjson) {
    if (Object.prototype.hasOwnProperty.call(nbtjson, key)) {
      switch (nbtjson[key].type) {
        // If the type is a compound, that means its value has more tag|value combos.
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
          logger.silly(`Sending long value ${key} to be converted.`, { domain: DOMAIN });
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
 * @param {*} rawnbt
 * @return {Promise}
 */
function promiseNbtJson(rawnbt) {
  return new Promise((resolve, reject) => {
    nbt.parse(rawnbt, (err, data) => {
      if (err) return reject(err);
      resolve(data);
    });
  });
}

/**
 *
 * @param {Object} nbtjson
 * @return {Promise}
 */
function promiseCondenseNbtJson(nbtjson) {
  return new Promise((resolve, reject) => {
    try {
      resolve(condenseNbt(nbtjson));
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Convert the big endian Int32 array from the nbt parsing to a big int
 * @param {Array} bigEndianLongArray
 * @return {string}
 */
function convertLongToInt(bigEndianLongArray) {
  const longstr = "" + new int64.Int64(bigEndianLongArray[1], bigEndianLongArray[0]);
  logger.debug(`Converted ${bigEndianLongArray} to long ${longstr}`, { domain: DOMAIN });
  return longstr;
}

module.exports = {
  condenseNbt,
  promiseCondenseNbtJson,
  promiseNbtJson,
};
