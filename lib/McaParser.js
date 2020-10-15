const path = require("path");
const fs = require("fs");

const NbtTools = require("./NbtTools");
const PATHS = require("./helpers/PathReference").paths;
const logger = require("./helpers/Logger").getLogger();

const mca = require("mca-js");

const DOMAIN = "MCAParser";

// function onlyUnique(value, index, self) {
//   return self.indexOf(value) === index;
// }

/**
 *
 * @param {*} filehandle
 * @param {number} chunkX
 * @param {number} chunkZ
 * @return {Promise}
 */
function chunkToJSON(filehandle, chunkX, chunkZ) {
  return new Promise((resolve, reject) => {
    const chunkdata = mca.getData(filehandle, chunkX, chunkZ);
    if (!chunkdata) {
      return resolve({
        Biomes: [], // .filter(onlyUnique),
        Entities: [],
        InhabitedTime: [],
        LastUpdate: [],
        Status: "empty",
        Structures: {},
        TileEntities: [],
        xPos: 0,
        zPos: 0,
      });
    }
    NbtTools.nbtToJson(chunkdata)
      .then((chunkjson) => {
        return resolve({
          Biomes: chunkjson.Level.Biomes, // .filter(onlyUnique),
          Entities: chunkjson.Level.Entities,
          InhabitedTime: chunkjson.Level.InhabitedTime,
          LastUpdate: chunkjson.Level.LastUpdate,
          Status: chunkjson.Level.Status,
          Structures: chunkjson.Level.Structures,
          TileEntities: chunkjson.Level.TileEntities,
          xPos: chunkjson.Level.xPos,
          zPos: chunkjson.Level.zPos,
        });
      })
      .catch((err) => {
        return reject(err);
      });
  });
}

/**
 *
 * @param {*} filehandle
 * @return {Promise}
 */
function readAllChunksInRegionFile(filehandle) {
  const chunkToJSONPromises = [];
  for (let i = 0; i < 32; i++) {
    for (let j = 0; j < 32; j++) {
      chunkToJSONPromises.push(chunkToJSON(filehandle, i, j));
    }
  }
  return new Promise((resolve, reject) => {
    Promise.all(chunkToJSONPromises)
      .then((val) => {
        return resolve(val);
      })
      .catch((err) => {
        return reject(err);
      });
  });
}

/**
 *
 * @param {string} mcaDirectory
 */
function convertRegionDirToJSON(mcaDirectory) {
  if (!fs.existsSync(mcaDirectory)) {
    logger.warn(`Was given non-existent directory for mcaDirectory ${mcaDirectory}`, { domain: DOMAIN });
    return;
  }

  const discoveredworldname = path.basename(mcaDirectory);

  const OUTPUT_DIR = path.join(PATHS.CACHED_MCA_JSON_DIR, discoveredworldname);

  const files = fs.readdirSync(mcaDirectory).filter((fname) => path.extname(fname) === ".mca");
  logger.verbose(`${files.length} MCA files in given ${discoveredworldname}`, { domain: DOMAIN });
  logger.silly(`File list:\n${JSON.stringify(files, null, 2)}`, { domain: DOMAIN });
  files.map((filename) => {
    // Check if we previous created a JSON file for this region. If so, skip!
    if (fs.existsSync(path.join(OUTPUT_DIR, filename.replace(/.mca/, ".json")))) {
      if (
        fs.statSync(OUTPUT_DIR, filename.replace(/.mca/, ".json")).mtime >
        fs.statSync(path.join(mcaDirectory, filename)).mtime
      ) {
        logger.debug(`The JSON version of ${filename.replace(/.mca/, "")} is up to date.`, { domain: DOMAIN });
        return;
      }
    }

    fs.promises
      .readFile(path.join(mcaDirectory, filename))
      .then((data) => {
        logger.debug(`Starting MCA ⟶  JSON for ${filename}`, { domain: DOMAIN });
        return readAllChunksInRegionFile(data);
      })
      .then((regionJSON) => {
        logger.debug(`Saving JSON for ${filename.replace(/.mca/, "")}`, { domain: DOMAIN });
        return fs.promises.writeFile(
          path.join(OUTPUT_DIR, filename.replace(/.mca/, ".json")),
          JSON.stringify(regionJSON)
        );
      })
      .then((val) => {
        logger.debug(`Saved mcajson/${discoveredworldname}/${filename.replace(/.mca/, ".json")}`, { domain: DOMAIN });
      })
      .catch((err) => {
        logger.warn(`Caught error ${err}`, { domain: DOMAIN });
      });
  });
}

module.exports = {
  convertRegionDirToJSON,
  readAllChunksInRegionFile,
};
