const fs = require("fs");
const path = require("path");
const nbt = require("nbt");

const NbtTools = require("./NbtTools");
const PATHS = require("./helpers/PathReference").paths;
const logger = require("./helpers/Logger").getLogger();
const { PLAYERS } = require("./Configuration");

const DOMAIN = "PlayerData";

/**
 *
 */
function convertPlayerdatFiles() {
  const conversionPromises = [];
  for (const uuid of Object.keys(PLAYERS)) {
    if (fs.existsSync(path.join(PATHS.PLAYERDATA_DIR, `${uuid}.dat`))) {
      const TMP_PLAYER_DIR = path.join(PATHS.TEMP_PLAYERDATA_DIR, uuid);
      conversionPromises.push(
        fs.promises.readFile(path.join(PATHS.PLAYERDATA_DIR, `${uuid}.dat`)).then((rawnbt) => {
          return new Promise((resolve, reject) => {
            nbt.parse(rawnbt, (err, data) => {
              if (err) return reject(err);
              resolve(data);
            });
          })
            .then((nbtjson) => {
              return new Promise((resolve) => {
                resolve(NbtTools.condenseNbt(nbtjson));
              });
            })
            .then((condensedjs) => {
              return new Promise((resolve, reject) => {
                try {
                  return resolve(JSON.stringify(condensedjs));
                } catch (err) {
                  reject(err);
                }
              });
            })
            .then((stringified) => {
              return fs.promises.writeFile(path.join(TMP_PLAYER_DIR, "playerdata.json"), stringified);
            })
            .then(() => {
              logger.debug(`Finished conversion of ${PLAYERS[uuid]}'s ${uuid}.dat to JSON`, { domain: DOMAIN });
            })
            .catch((err) => {
              logger.error(`Conversion of playerdata.dat file failed. ${PLAYERS[uuid]}|${uuid}`, { domain: DOMAIN });
              logger.error(JSON.stringify(err), { domain: DOMAIN });
            });
        })
      );
    } else {
      logger.warn(`No viable playerdata.dat for ${PLAYERS[uuid]}, ${uuid}.dat`, { domain: DOMAIN });
    }
  }
  logger.verbose(`Starting playerdata.dat conversion job for ${Object.keys(PLAYERS).length} players`, {
    domain: DOMAIN,
  });
  const startPlayerdataConversion = process.hrtime();
  Promise.all(conversionPromises)
    .then((res) => {
      const time = `${process.hrtime(startPlayerdataConversion)[1] / 1000000}ms`;
      logger.info(`All playerdata.dat conversion jobs finished. (${time})`, { domain: DOMAIN });
    })
    .catch((err) => {
      logger.error(`Batch conversion error: ${JSON.stringify(err)}`, { domain: DOMAIN });
    });
}

module.exports = {
  convertPlayerdatFiles,
};
