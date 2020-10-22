const path = require("path");
const fs = require("fs");

const NbtTools = require("./NbtTools");
const PATHS = require("./helpers/PathReference").paths;
const logger = require("./helpers/Logger").getLogger();

const mca = require("mca-js");
const nbt = require("nbt");
const { ensureDirSync } = require("./helpers/PathReference");
const { promiseStringify } = require("./helpers/JsonPromises");

const DOMAIN = "MCAParser";

/**
 * Used with Array.filter to uniq an array
 * @param {*} value
 * @param {number} index
 * @param {*} self
 * @return {boolean}
 */
function onlyUnique(value, index, self) {
  return self.indexOf(value) === index;
}

/**
 * @param {*} rawfile
 * @param {string} filename
 * @return {Promise}
 */
function convertChunksFromRegionfile(rawfile, filename) {
  return new Promise((resolve, reject) => {
    const chunkdata = [];
    for (let x = 0; x < 32; x++) {
      for (let z = 0; z < 32; z++) {
        try {
          const chunknbt = mca.getData(rawfile, x, z);
          if (chunknbt)
            nbt.parse(chunknbt, (err, data) => {
              if (err) throw err;
              const chunkjson = NbtTools.condenseNbt(data);
              if (chunkjson.Level) {
                chunkdata.push({
                  Biomes: chunkjson.Level.Biomes ? chunkjson.Level.Biomes.filter(onlyUnique) : [],
                  Entities: chunkjson.Level.Entities,
                  InhabitedTime: chunkjson.Level.InhabitedTime,
                  LastUpdate: chunkjson.Level.LastUpdate,
                  Status: chunkjson.Level.Status,
                  Structures: chunkjson.Level.Structures,
                  TileEntities: chunkjson.Level.TileEntities,
                  xPos: chunkjson.Level.xPos,
                  zPos: chunkjson.Level.zPos,
                });
              }
            });
        } catch (err) {
          reject(err);
        }
      }
    }
    resolve(chunkdata);
  });
}

/**
 *
 * @param {string} regionDir
 */
function convertRegionDirToJSON(regionDir) {
  if (!fs.existsSync(regionDir)) {
    logger.warn(`Was given non-existent directory for mcaDirectory ${regionDir}`, { domain: DOMAIN });
    return;
  }
  const conversionPromises = [];
  const discoveredworldname = path.basename(path.dirname(regionDir));

  const WORLD_MCAJSON_DIR = path.join(PATHS.CACHED_MCA_JSON_DIR, discoveredworldname);
  ensureDirSync(WORLD_MCAJSON_DIR);

  const files = fs.readdirSync(regionDir).filter((fname) => path.extname(fname) === ".mca");
  logger.verbose(`${files.length} MCA files in given ${discoveredworldname}`, { domain: DOMAIN });
  logger.silly(`File list:\n${JSON.stringify(files, null, 2)}`, { domain: DOMAIN });
  files.map((filename) => {
    // Check if we previous created a JSON file for this region. If so, skip!
    if (fs.existsSync(path.join(WORLD_MCAJSON_DIR, filename.replace(/.mca/, ".json")))) {
      if (
        fs.statSync(WORLD_MCAJSON_DIR, filename.replace(/.mca/, ".json")).mtime >
        fs.statSync(path.join(regionDir, filename)).mtime
      ) {
        logger.verbose(`The JSON version of ${filename.replace(/.mca/, "")} is up to date.`, { domain: DOMAIN });
        return;
      }
    }

    conversionPromises.push(
      fs.promises
        .readFile(path.join(regionDir, filename))
        .then((data) => {
          logger.verbose(`Starting MCA ⟶  JSON for ${filename}`, { domain: DOMAIN });
          return convertChunksFromRegionfile(data, filename);
        })
        .then((regionJSON) => {
          return new Promise((res) => {
            logger.verbose(`Filtering invalid chunks from ${filename} JSON`, { domain: DOMAIN });
            res(regionJSON.filter((chunk) => chunk !== null));
          });
        })
        .then(promiseStringify)
        .then((stringified) => {
          logger.verbose(`Saving JSON for ${filename.replace(/.mca/, "")}`, { domain: DOMAIN });
          return fs.promises.writeFile(path.join(WORLD_MCAJSON_DIR, filename.replace(/.mca/, ".json")), stringified);
        })
        .then(() => {
          logger.verbose(`Saved mcajson/${discoveredworldname}/${filename.replace(/.mca/, ".json")}`, {
            domain: DOMAIN,
          });
        })
        .catch((err) => {
          logger.warn(`Caught error ${JSON.stringify(err)}`, { domain: DOMAIN });
        })
    );
  });
}

module.exports = {
  convertRegionDirToJSON,
};
