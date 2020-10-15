#!/usr/bin/env node
const path = require("path");
const fs = require("fs");

const starttime = process.hrtime();
const hrtimefmt = function (timeref) {
  return `${process.hrtime(timeref)[0]}s, ${(process.hrtime(timeref)[1] / 1000000).toFixed(3)}ms`;
};

const Config = require("./lib/Configuration");
const PATHS = require("./lib/helpers/PathReference").paths;
const logger = require("./lib/helpers/Logger").getLogger();

const DOMAIN = "Main";
logger.verbose(`Configuration, PathReference, and Logger loaded in ${hrtimefmt(starttime)}`, { domain: DOMAIN });

const libtime = process.hrtime();
const LogsParser = require("./lib/LogsParser");
const ServerDataExtractor = require("./lib/ServerDataTool");
const PlayerData = require("./lib/PlayerData");
const McaParser = require("./lib/McaParser");
const ProfileHelper = require("./lib/ProfileHelper");
const AdvancementsParser = require("./lib/AdvancementsParser");

logger.verbose(`Library imports loaded in ${hrtimefmt(libtime)}`, { domain: DOMAIN });

/** MAIN **/
/**
 * It would make sense to have 3 levels of processing.
 *
 * 1 Pre-processing: gathering definitions, data used in later steps
 * 2 Processing: parsing that requires some knowledge from pre-prossessing to work
 * 3 Post-processing: combining the parsed data into final JSON output
 */

LogsParser.parseLogFiles();
ServerDataExtractor.checkForData();
ServerDataExtractor.convertLevelDat();

ProfileHelper.updateProfiles()
  .then((val) => {
    // GET PLAYER INFORMATION FROM MOJANG
    return McaParser.createJsonForAllRegionDirs();
  })
  .then((val) => {
    logger.info("Finished saving chunks to JSON", { domain: DOMAIN });
    return val;
  })
  .then((val) => {
    return PlayerData.convertPlayerdatFiles(); // CONVERT PLAYER.DAT FILES
  })
  .then((val) => {
    return AdvancementsParser.parseAndSaveAdvancementFiles();
  })
  .then((val) => {
    return AdvancementsParser.createServerAdvancementProgress();
  })
  .then(fs.promises.writeFile(path.join(PATHS.OUTPUT_DIR, "uuids.json"), JSON.stringify(Config.PLAYERS)))
  .then((val) => {
    return Promise.all(
      Object.keys(Config.PLAYERS).map((uuid) => {
        return combinePlayerData(uuid);
      })
    );
  })
  .then((val) => {
    logger.info(`Compiled player info to ${PATHS.OUTPUT_DIR}`, { domain: DOMAIN });
    return McaParser.buildTileEntityList(path.join(PATHS.CACHED_MCA_JSON_DIR, "world"));
  })
  .then((overworldTEJson) => {
    const teWithItems = [];
    const mobSpawners = [];
    const signs = [];
    const lootables = {};
    overworldTEJson.map((owtejn) => {
      Object.keys(owtejn).map((tilentid) => {
        owtejn[tilentid].map((tileent) => {
          if (tileent.id === "minecraft:mob_spawner") {
            mobSpawners.push({
              SpawnData: tileent.SpawnData,
              pos: [tileent.x, tileent.y, tileent.z],
            });
          } else if (tileent.id === "minecraft:sign") {
            signs.push({
              Color: tileent.Color,
              Text: [
                JSON.parse(tileent.Text1.replace(/\\"/, "'")).text,
                JSON.parse(tileent.Text2.replace(/\\"/, "'")).text,
                JSON.parse(tileent.Text3.replace(/\\"/, "'")).text,
                JSON.parse(tileent.Text4.replace(/\\"/, "'")).text,
              ],
              pos: [tileent.x, tileent.y, tileent.z],
            });
          } else if (Object.prototype.hasOwnProperty.call(tileent, "Items")) {
            if (tileent.Items.length > 0) {
              teWithItems.push({
                Items: tileent.Items,
                id: tileent.id,
                pos: [tileent.x, tileent.y, tileent.z],
              });
            }
          } else if (Object.prototype.hasOwnProperty.call(tileent, "LootTable")) {
            const loottype = tileent.LootTable.split("/")[1];
            if (!Object.prototype.hasOwnProperty.call(lootables, loottype)) {
              lootables[loottype] = [];
            }
            lootables[loottype].push({
              id: tileent.id,
              pos: [tileent.x, tileent.y, tileent.z],
              type: loottype,
            });
          }
        });
      });
    });
    const writeJsonPromises = [];
    writeJsonPromises.push(
      fs.promises.writeFile(path.join(PATHS.OUTPUT_DIR, "overworld-spawners.json"), JSON.stringify(mobSpawners))
    );
    writeJsonPromises.push(
      fs.promises.writeFile(path.join(PATHS.OUTPUT_DIR, "overworld-inventories.json"), JSON.stringify(teWithItems))
    );
    writeJsonPromises.push(
      fs.promises.writeFile(path.join(PATHS.OUTPUT_DIR, "overworld-loot.json"), JSON.stringify(lootables))
    );
    writeJsonPromises.push(
      fs.promises.writeFile(path.join(PATHS.OUTPUT_DIR, "overworld-signs.json"), JSON.stringify(signs))
    );
    writeJsonPromises.push(
      fs.promises.writeFile(path.join(PATHS.OUTPUT_DIR, "overworld-te.json"), JSON.stringify(overworldTEJson))
    );
    return Promise.all(writeJsonPromises);
  })
  .then((val) => {
    logger.info("Compiled tile-entity JSON to output directory", { domain: DOMAIN });
  })
  .catch((err) => {
    logger.error("Caught error in large promise stack..", { domain: DOMAIN });
    throw err;
  });

/**
 *
 * @param {string} uuid
 */
function combinePlayerData(uuid) {
  const readjsonPromises = [];
  const STATS_FILE = path.join(PATHS.STATS_DIR, `${uuid}.json`);
  const ADVANCEMENT_FILE = path.join(PATHS.TEMP_ADVANCEMENT_JSON_DIR, `${uuid}.json`);
  const PLAYERDATA_FILE = path.join(PATHS.TEMP_PLAYERDATA_JSON_DIR, `${uuid}.json`);
  const PROFILE_FILE = path.join(PATHS.TEMP_PROFILE_JSON_DIR, `${uuid}.json`);
  const LOG_FILE = path.join(PATHS.TEMP_LOG_JSON_DIR, `${uuid}.json`);
  const PROMISE_FALSE = new Promise((res, rej) => {
    res(false);
  });

  if (fs.existsSync(STATS_FILE)) readjsonPromises.push(fs.promises.readFile(STATS_FILE));
  else {
    readjsonPromises.push(PROMISE_FALSE);
    logger.warn(`No parsed stats file exists for ${Config.PLAYERS[uuid]}`, { domain: DOMAIN });
  }
  if (fs.existsSync(ADVANCEMENT_FILE)) readjsonPromises.push(fs.promises.readFile(ADVANCEMENT_FILE));
  else {
    readjsonPromises.push(PROMISE_FALSE);
    logger.warn(`No parsed advancements file exists for ${Config.PLAYERS[uuid]}`, { domain: DOMAIN });
  }
  if (fs.existsSync(PLAYERDATA_FILE)) readjsonPromises.push(fs.promises.readFile(PLAYERDATA_FILE));
  else {
    readjsonPromises.push(PROMISE_FALSE);
    logger.warn(`No parsed playerdata file exists for ${Config.PLAYERS[uuid]}`, { domain: DOMAIN });
  }
  if (fs.existsSync(PROFILE_FILE)) readjsonPromises.push(fs.promises.readFile(PROFILE_FILE));
  else {
    readjsonPromises.push(PROMISE_FALSE);
    logger.warn(`No parsed profile file exists for ${Config.PLAYERS[uuid]}`, { domain: DOMAIN });
  }
  if (fs.existsSync(LOG_FILE)) readjsonPromises.push(fs.promises.readFile(LOG_FILE));
  else {
    readjsonPromises.push(PROMISE_FALSE);
    logger.warn(`No parsed log file exists for ${Config.PLAYERS[uuid]}`, { domain: DOMAIN });
  }

  Promise.all(readjsonPromises).then((val) => {
    const playerJSON = {
      advancements: {},
      data: {},
      log: {},
      name: Config.PLAYERS[uuid],
      profile: {},
      stats: {},
      uuid: uuid,
    };
    if (val[0]) {
      playerJSON.stats = JSON.parse(val[0]);
    }

    if (val[1]) {
      playerJSON.advancements = JSON.parse(val[1]);
    }
    if (val[2]) {
      playerJSON.data = JSON.parse(val[2]);
    }

    if (val[3]) {
      playerJSON.profile = JSON.parse(val[3]);
    }

    if (val[4]) {
      playerJSON.log = JSON.parse(val[4]);
    }
    delete playerJSON.advancements.DataVersion;
    delete playerJSON.data.DataVersion;
    delete playerJSON.stats.DataVersion;
    fs.promises
      .writeFile(path.join(PATHS.OUTPUT_DIR, `${uuid}.json`), JSON.stringify(playerJSON))
      .then((val) => {
        logger.verbose(`Wrote output JSON for ${uuid}.`, { domain: DOMAIN });
        if (val) {
          logger.debug(val, DOMAIN);
        }
      })
      .catch((err) => {
        logger.warn(`Failed to build output for ${uuid}.`, { domain: DOMAIN });
        logger.warn(err, DOMAIN);
      });
  });
}
