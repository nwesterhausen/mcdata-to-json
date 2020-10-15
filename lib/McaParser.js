const path = require("path");
const fs = require("fs");

const PATHS = require("./helpers/PathReference").paths;
const logger = require("./helpers/Logger").getLogger();
const McaTools = require("./helpers/McaTools");

const DOMAIN = "MCAParser";

/**
 *
 * @param {string} mcaDirectory
 */
function convertRegionDirToJSON(mcaDirectory) {
  if (!fs.existsSync(mcaDirectory)) {
    logger.warn(`Was given non-existent directory for mcaDirectory ${mcaDirectory}`, { domain: DOMAIN });
    return;
  }

  const DIM_DIR_NAME = path.basename(path.dirname(mcaDirectory));
  const DIM_MCAJSON_DIR = path.join(PATHS.CACHED_MCA_JSON_DIR, DIM_DIR_NAME);

  logger.debug(`Ensuring we have JSON output dir ${DIM_MCAJSON_DIR}`, { domain: DOMAIN });
  if (!fs.existsSync(DIM_MCAJSON_DIR)) fs.mkdirSync(DIM_MCAJSON_DIR);

  // Read only the .mca files in the region dir.
  const FILE_DICT = fs
    .readdirSync(mcaDirectory)
    .filter((fname) => path.extname(fname) === ".mca")
    .map((fname) => {
      const region = fname.replace(/.mca/, "");
      return {
        region: region,
        mcaFilename: fname,
        jsonFilename: `${region}.json`,
        mcaFilePath: path.join(mcaDirectory, fname),
        jsonFilePath: path.join(DIM_MCAJSON_DIR, `${region}.json`),
      };
    });

  logger.verbose(`${FILE_DICT.length} MCA files in given ${DIM_DIR_NAME}`, { domain: DOMAIN });
  logger.silly(`FILE_DICT:\n${JSON.stringify(FILE_DICT, null, 2)}`, { domain: DOMAIN });

  FILE_DICT.map((regionFileDict) => {
    // Check if we previous created a JSON file for this region. If so, compare mtime to decide if we run again.
    if (fs.existsSync(regionFileDict.jsonFilePath)) {
      if (fs.statSync(regionFileDict.jsonFilePath).mtime > fs.statSync(regionFileDict.mcaFilePath).mtime) {
        logger.debug(`The JSON version of ${regionFileDict.region} is up to date.`, { domain: DOMAIN });
        return false;
      }
    }

    logger.debug(`Starting MCA ⟶  JSON for ${regionFileDict.mcaFilename}`, { domain: DOMAIN });
    fs.promises
      .readFile(regionFileDict.mcaFilePath)
      .then(McaTools.createChunkToJsonPromisesForFile)
      .then((regionJSON) => {
        return new Promise((res, rej) => {
          try {
            if (!Array.isArray(regionJSON)) throw new Error(`EMCAJSON: Region JSON from McaTools for ${regionFileDict.region} is not an array!`);
            res(JSON.stringify(regionJSON));
          } catch (e) {
            logger.error(`Failure to convert regionJson for ${regionFileDict.mcaFilename} to string for writing.`, {
              domain: DOMAIN,
            });
            rej(e);
          }
        });
      })
      .then((regionJSONFilecontent) => {
        logger.debug(`Saving JSON for ${regionFileDict.region}`, { domain: DOMAIN });
        return fs.promises.writeFile(regionFileDict.jsonFilePath, regionJSONFilecontent);
      })
      .then(() => {
        logger.verbose(`Saved JSON for region ${regionFileDict.region}`, { domain: DOMAIN });
      })
      .catch((err) => {
        logger.warn(`Parsing ${regionFileDict.region}, ${err}`, { domain: DOMAIN });
      });
  });
}

/**
 *
 */
function createJsonForAllRegionDirs() {
  for (const world in PATHS.WORLD_DIRS) {
    if (PATHS.WORLD_DIRS[world]) {
      const possibleMcaDirs = [];
      const worldpath = PATHS.WORLD_DIRS[world];
      if (fs.readdirSync(worldpath).indexOf("region") === -1) {
        const subdirs = fs
          .readdirSync(worldpath, { withFileTypes: true })
          .filter((dirent) => dirent.isDirectory())
          .map((dirent) => dirent.name);
        for (let i = 0; i < subdirs.length; i++) {
          const dir = subdirs[i];
          if (fs.existsSync(path.join(worldpath, dir, "region")))
            possibleMcaDirs.push(path.join(worldpath, dir, "region"));
        }
      } else {
        if (fs.existsSync(path.join(worldpath, "region"))) possibleMcaDirs.push(path.join(worldpath, "region"));
      }
      logger.verbose(`Possible MCA dirs under ${worldpath}: ${JSON.stringify(possibleMcaDirs)}`, { domain: DOMAIN });
      if (possibleMcaDirs.length === 0) {
        logger.warn(`World Dir ${world} did not have valid MCA sub dir available (or wasn't itself one)`, {
          domain: DOMAIN,
        });
      } else {
        convertRegionDirToJSON(possibleMcaDirs[0]);
      }
    }
  }
}

/**
 *
 * @param {string} fileContent
 * @param {string} filepath
 * @return {Promise}
 */
function parseChunkListJson(fileContent, filepath) {
  return new Promise((res, rej) => {
    try {
      const chunklistJson = JSON.parse(fileContent);
      if (!Array.isArray(chunklistJson)) throw new Error(`EMCAJSON: Saved JSON for MCA file ${filepath} is not an array.`);
      const tileEntities = {};
      chunklistJson.map((chunkjson) => {
        // regionjson.map((chunkjson) => {
        if (Object.prototype.hasOwnProperty.call(chunkjson, "TileEntities")) {
          chunkjson.TileEntities.map((te) => {
            if (!Object.prototype.hasOwnProperty.call(tileEntities, te.id)) {
              tileEntities[te.id] = [];
            }
            tileEntities[te.id].push(te);
          });
        }
        // });
      });
      return res(tileEntities);
    } catch (e) {
      logger.debug(JSON.stringify(e), { domain: DOMAIN });
      logger.warn(`Unable to parse JSON from ${filepath}`, { domain: DOMAIN });
      return rej(e);
    }
  });
}

/**
 *
 * @param {string} filepath
 * @return {Promise}
 */
function readChunkListJson(filepath) {
  return fs.promises.readFile(filepath).then((filecontent) => {
    return parseChunkListJson(filecontent, filepath);
  });
}

/**
 * @param {string} mcaJsonDir
 * @return {Promise}
 */
function buildTileEntityList(mcaJsonDir) {
  if (!fs.existsSync(mcaJsonDir)) fs.mkdirSync(mcaJsonDir);
  const jsonregionFiles = fs.readdirSync(mcaJsonDir);
  return Promise.all(
    jsonregionFiles.map((filename) => {
      return readChunkListJson(path.join(mcaJsonDir, filename));
    })
  );
}

module.exports = {
  createJsonForAllRegionDirs,
  buildTileEntityList,
};
