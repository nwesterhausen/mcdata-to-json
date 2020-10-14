const fs = require("fs");
const path = require("path");

const NbtTools = require("./NbtTools");
const PATHS = require("./helpers/PathRefrence").paths;
const logger = require("./helpers/Logger").getLogger();

const DOMAIN = "PlayerData";

/**
 *
 * @param {string} datfilename
 * @return {Promise}
 */
function convertPlayerdat(datfilename) {
  const PLAYERDATA_JSON_CACHE_FILE = path.join(PATHS.TEMP_PLAYERDATA_JSON_DIR, datfilename.replace(/.dat/, ".json"));
  return new Promise((resolve, reject) => {
    fs.promises
      .readFile(path.join(PATHS.PLAYERDATA_DIR, datfilename))
      .then((filedata) => {
        return NbtTools.nbtToJson(filedata);
      })
      .then((cleanJson) => {
        return fs.promises.writeFile(PLAYERDATA_JSON_CACHE_FILE, JSON.stringify(cleanJson));
      })
      .then((res) => {
        logger.verbose(`Parsed NBT ${path.basename(PLAYERDATA_JSON_CACHE_FILE).replace(/.json/, "")}`, {
          domain: DOMAIN,
        });
        return resolve(res);
      })
      .catch((err) => {
        logger.warn(`Error when reading dat file. ${err}`, { domain: DOMAIN });
        return reject(err);
      });
  });
}

/**
 * @return {Promise}
 */
function convertPlayerdatFiles() {
  return new Promise((resolve, reject) => {
    Promise.all(fs.readdirSync(PATHS.PLAYERDATA_DIR).map(convertPlayerdat))
      .then((val) => {
        return resolve(val);
      })
      .catch((err) => {
        return reject(err);
      });
  });
}

module.exports = {
  convertPlayerdat,
  convertPlayerdatFiles,
};
