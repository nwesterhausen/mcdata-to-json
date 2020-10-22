#!/usr/bin/env node
/* eslint-disable no-unused-vars */
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

if (ServerDataExtractor.checkForData()) {
  fs.promises.writeFile(path.join(PATHS.OUTPUT_DIR, "uuids.json"), JSON.stringify(Config.PLAYERS)).catch((e) => {
    throw e;
  });

  ServerDataExtractor.convertLevelDat()
    .then((level) => {
      logger.info(`Running on Minecraft ${level.Data.Version.Name}`, { domain: DOMAIN });
      if (level.Data.Version.Snapshot !== 0)
        logger.info(`Minecraft snapshot ${level.Data.Version.Snapshot} detected`, { domain: DOMAIN });
      if (level.Data.WasModded) logger.info(`Minecraft server was modified from original state`, { domain: DOMAIN });
      if (level.Data["Bukkit.Version"]) logger.info(level.Data["Bukkit.Version"], { domain: DOMAIN });

      const processPromises = [
        LogsParser.parseLogFiles(),
        PlayerData.convertPlayerdatFiles(),
        ProfileHelper.updateProfiles(),
        AdvancementsParser.parseAndSaveAdvancementFiles().then(AdvancementsParser.createServerAdvancementProgress),
      ];

      return Promise.all(processPromises);
    })
    .then((res) => {
      const combineProms = [];
      for (const uuid of Object.keys(Config.PLAYERS)) {
        combineProms.push(combinePlayerData(uuid));
      }
      return Promise.all(combineProms);
    })
    .then((res) => {
      return createJsonForAllRegionDirs();
    })
    .catch((err) => {
      throw err;
    });
} else {
  logger.info(`Missing or imcomplete cache of extracted data from server.jar`, { domain: DOMAIN });
  logger.info(`After extraction completes, please re-run mcdata-to-json`, { domain: DOMAIN });
  ServerDataExtractor.performExtraction();
}

/**
 *   .then((val) => {
    logger.info(`Compiled player info to ${PATHS.OUTPUT_DIR}`, { domain: DOMAIN });
    return buildTileEntityList(path.join(PATHS.CACHED_MCA_JSON_DIR, "world"));
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
**/

/**
 * @return {Promise}
 */
function createJsonForAllRegionDirs() {
  return new Promise((resolve, reject) => {
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
          McaParser.convertRegionDirToJSON(possibleMcaDirs[0]);
        }
      }
    }
    resolve();
  });
}

/**
 *
 * @param {string} uuid
 * @return {Promise}
 */
function combinePlayerData(uuid) {
  if (!uuid) throw new Error(`ENOUUID: Not given uuid for combining data.`);
  const readjsonPromises = [];
  const STATS_FILE = path.join(PATHS.STATS_DIR, `${uuid}.json`);
  const ADVANCEMENT_FILE = path.join(PATHS.TEMP_PLAYERDATA_DIR, uuid, "advancements.json");
  const PLAYERDATA_FILE = path.join(PATHS.TEMP_PLAYERDATA_DIR, uuid, "playerdata.json");
  const PROFILE_FILE = path.join(PATHS.TEMP_PLAYERDATA_DIR, uuid, "profile.json");
  const LOG_FILE = path.join(PATHS.TEMP_PLAYERDATA_DIR, uuid, "logs.json");
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

  return Promise.all(readjsonPromises)
    .then((val) => {
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
      return fs.promises.writeFile(path.join(PATHS.OUTPUT_DIR, `${uuid}.json`), JSON.stringify(playerJSON));
    })
    .then((val) => {
      logger.verbose(`Wrote output JSON for ${Config.PLAYERS[uuid]} (${uuid})`, { domain: DOMAIN });
      if (val) {
        logger.debug(val, DOMAIN);
      }
    })
    .catch((err) => {
      logger.warn(`Failed to build output for ${uuid}.`, { domain: DOMAIN });
      logger.warn(err, DOMAIN);
    });
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
      logger.warn(`Unable to parse JSON from ${filepath}`, { domain: DOMAIN });
      logger.debug(e, { domain: DOMAIN });
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
