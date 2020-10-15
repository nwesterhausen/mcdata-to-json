const NbtTools = require("./NbtTools");
const logger = require("./Logger").getLogger();

const mca = require("mca-js");

const DOMAIN = "MCATools";

/**
 *
 * @param {*} filedata
 * @return {Promise}
 */
function createChunkToJsonPromisesForFile(filedata) {
  const chunkToJSONPromises = [];
  for (let i = 0; i < 32; i++) {
    for (let j = 0; j < 32; j++) {
      chunkToJSONPromises.push(chunkToJSON(filedata, i, j));
    }
  }
  logger.debug(`Returning ${chunkToJSONPromises.length} promises to convert chunks.`,{domain:DOMAIN})
  return Promise.all(chunkToJSONPromises);
}

/**
 *
 * @param {*} filehandle
 * @param {number} chunkX
 * @param {number} chunkZ
 * @return {Promise}
 */
function promiseMcaGetData(filehandle, chunkX, chunkZ) {
  return new Promise((resolve, reject) => {
    const chunkdata = mca.getData(filehandle, chunkX, chunkZ);
    logger.debug(`Chunkdata ${chunkX},${chunkZ} is ${typeof chunkdata}`,{domain:DOMAIN})
    if (chunkdata) return resolve(chunkdata);
    logger.verbose(`ENOCHUNK: No chunk data at ${chunkX},${chunkZ}`,{domain:DOMAIN});
    resolve({
      Biomes: [], // .filter(onlyUnique),
      Entities: [],
      InhabitedTime: [],
      LastUpdate: [],
      Status: "empty",
      Structures: {},
      TileEntities: [],
      xPos: chunkX,
      zPos: chunkZ,
    });
  });
}
/**
 *
 * @param {*} filehandle
 * @param {number} chunkX
 * @param {number} chunkZ
 * @return {Promise}
 */
function chunkToJSON(filehandle, chunkX, chunkZ) {
  return promiseMcaGetData(filehandle, chunkX, chunkZ)
    .then(NbtTools.nbtToJson)
    .then(NbtTools.promiseCondenseNbtJson)
    .then((chunkjson) => {
      return new Promise((res, rej) => {
        try {
          const relevantjson = chunkjson.Level
          logger.debug(`Received ${typeof chunkjson.Level} from NbtTools for chunk.Level ${chunkX},${chunkZ}`, { domain: DOMAIN });
          relevantjson.Biomes = relevantjson.Biomes.filter(onlyUnique);
          res(relevantjson);
        } catch (e) {
          rej(new Error(`ECHUNKJSON: JSON for chunk ${chunkX},${chunkZ} had issue preventing it being filtered.`));
        }
      });
    })
    .catch((e) => {
      throw e;
    });
}

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

module.exports = {
  createChunkToJsonPromisesForFile,
};
