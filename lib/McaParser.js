const path = require("path");
const fs = require("fs");

const NbtTools = require("./NbtTools");
const Log = require("./CustomLogger");
const Config = require("./Configuration");

const mca = require("mca-js");

const DOMAIN = "MCA Parser";

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
    return;
  }

  const discoveredworldname =
    path.basename(path.dirname(mcaDirectory)) === path.basename(Config.WORLD_DIR)
      ? "overworld"
      : path.basename(path.dirname(mcaDirectory));

  const OUTPUT_DIR = path.join(Config.CACHED_MCA_JSON_DIR, discoveredworldname);

  Config.ensureDirSync(OUTPUT_DIR);
  const files = fs.readdirSync(mcaDirectory);
  files.map((filename) => {
    if (path.extname(filename) === ".mca") {
      // Check if we previous created a JSON file for this region. If so, skip!
      if (fs.existsSync(path.join(OUTPUT_DIR, filename.replace(/.mca/, ".json")))) {
        if (
          fs.statSync(OUTPUT_DIR, filename.replace(/.mca/, ".json")).mtime >
          fs.statSync(path.join(mcaDirectory, filename)).mtime
        ) {
          Log.debug(DOMAIN, `The JSON version of ${filename.replace(/.mca/, "")} is up to date.`);
          return;
        }
      }

      fs.promises
        .readFile(path.join(mcaDirectory, filename))
        .then((data) => {
          Log.debug(DOMAIN, `Starting MCA ⟶  JSON for ${filename}`);
          return readAllChunksInRegionFile(data);
        })
        .then((regionJSON) => {
          Log.debug(DOMAIN, `Saving JSON for ${filename.replace(/.mca/, "")}`);
          return fs.promises.writeFile(
            path.join(OUTPUT_DIR, filename.replace(/.mca/, ".json")),
            JSON.stringify(regionJSON)
          );
        })
        .then((val) => {
          Log.debug(DOMAIN, `Saved mcajson/${discoveredworldname}/${filename.replace(/.mca/, ".json")}`);
        })
        .catch((err) => {
          Log.warn(DOMAIN, `Caught error ${err}`);
        });
    }
  });
}

module.exports = {
  convertRegionDirToJSON,
  readAllChunksInRegionFile,
};
