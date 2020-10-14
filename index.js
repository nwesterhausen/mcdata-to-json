#!/usr/bin/env node

const Config = require("./lib/Configuration");
const Log = Config.logger;

const DOMAIN = "Main";

Log.verbose("Begin requiring of lib.", { domain: DOMAIN });

const LogsParser = require("./lib/LogsParser");
const ServerDataExtractor = require("./lib/ServerDataTool");
const PlayerData = require("./lib/PlayerData");
const McaParser = require("./lib/McaParser");
const ProfileHelper = require("./lib/ProfileHelper");
const AdvancementsParser = require("./lib/AdvancementsParser");

Log.verbose("Finish requiring of lib.", { domain: DOMAIN });

const path = require("path");
const fs = require("fs");

Log.info(`Starting Log Processing ${Config.LOGS_DIR}`, { domain: DOMAIN });
LogsParser.parseLogFiles();
ServerDataExtractor.checkForData();
ServerDataExtractor.convertLevelDat();

/**
 * @return {Promise}
 */
function createJsonForAllRegionDirs() {
  return new Promise((resolve, reject) => {
    McaParser.convertRegionDirToJSON(Config.OVERWORLD_DIR);
    McaParser.convertRegionDirToJSON(Config.NETHER_DIR);
    McaParser.convertRegionDirToJSON(Config.END_DIR);
    resolve();
  });
}

/**
 *
 * @param {string} uuid
 */
function combinePlayerData(uuid) {
  const readjsonPromises = [];
  const STATS_FILE = path.join(Config.STATS_DIR, `${uuid}.json`);
  const ADVANCEMENT_FILE = path.join(Config.TEMP_ADVANCEMENT_JSON_DIR, `${uuid}.json`);
  const PLAYERDATA_FILE = path.join(Config.TEMP_PLAYERDATA_JSON_DIR, `${uuid}.json`);
  const PROFILE_FILE = path.join(Config.TEMP_PROFILE_JSON_DIR, `${uuid}.json`);
  const LOG_FILE = path.join(Config.TEMP_LOG_JSON_DIR, `${uuid}.json`);
  const PROMISE_FALSE = new Promise((res, rej) => {
    res(false);
  });

  if (fs.existsSync(STATS_FILE)) readjsonPromises.push(fs.promises.readFile(STATS_FILE));
  else {
    readjsonPromises.push(PROMISE_FALSE);
    Log.warn(`No parsed stats file exists for ${Config.PLAYERS[uuid]}`, { domain: DOMAIN });
  }
  if (fs.existsSync(ADVANCEMENT_FILE)) readjsonPromises.push(fs.promises.readFile(ADVANCEMENT_FILE));
  else {
    readjsonPromises.push(PROMISE_FALSE);
    Log.warn(`No parsed advancements file exists for ${Config.PLAYERS[uuid]}`, { domain: DOMAIN });
  }
  if (fs.existsSync(PLAYERDATA_FILE)) readjsonPromises.push(fs.promises.readFile(PLAYERDATA_FILE));
  else {
    readjsonPromises.push(PROMISE_FALSE);
    Log.warn(`No parsed playerdata file exists for ${Config.PLAYERS[uuid]}`, { domain: DOMAIN });
  }
  if (fs.existsSync(PROFILE_FILE)) readjsonPromises.push(fs.promises.readFile(PROFILE_FILE));
  else {
    readjsonPromises.push(PROMISE_FALSE);
    Log.warn(`No parsed profile file exists for ${Config.PLAYERS[uuid]}`, { domain: DOMAIN });
  }
  if (fs.existsSync(LOG_FILE)) readjsonPromises.push(fs.promises.readFile(LOG_FILE));
  else {
    readjsonPromises.push(PROMISE_FALSE);
    Log.warn(`No parsed log file exists for ${Config.PLAYERS[uuid]}`, { domain: DOMAIN });
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
      .writeFile(path.join(Config.OUTPUT_DIR, `${uuid}.json`), JSON.stringify(playerJSON))
      .then((val) => {
        Log.verbose(`Wrote output JSON for ${uuid}.`, { domain: DOMAIN });
        if (val) {
          Log.debug(val, DOMAIN);
        }
      })
      .catch((err) => {
        Log.warn(`Failed to build output for ${uuid}.`, { domain: DOMAIN });
        Log.warn(err, DOMAIN);
      });
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
      Log.warn(`Unable to parse JSON from ${filepath}`, { domain: DOMAIN });
      Log.debug(e, { domain: DOMAIN });
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
  const jsonregionFiles = fs.readdirSync(mcaJsonDir);
  return Promise.all(
    jsonregionFiles.map((filename) => {
      return readChunkListJson(path.join(mcaJsonDir, filename));
    })
  );
}

// /// MAIN ///////

ProfileHelper.updateProfiles()
  .then((val) => {
    // GET PLAYER INFORMATION FROM MOJANG
    return createJsonForAllRegionDirs();
  })
  .then((val) => {
    Log.info("Finished saving chunks to JSON", { domain: DOMAIN });
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
  .then(fs.promises.writeFile(path.join(Config.OUTPUT_DIR, "uuids.json"), JSON.stringify(Config.PLAYERS)))
  .then((val) => {
    return Promise.all(
      Object.keys(Config.PLAYERS).map((uuid) => {
        return combinePlayerData(uuid);
      })
    );
  })
  .then((val) => {
    Log.info(`Compiled player info to ${Config.OUTPUT_DIR}`, { domain: DOMAIN });
    Config.ensureDirSync(path.join(Config.WORK_DIR, "mcajson", "overworld"));
    return buildTileEntityList(path.join(Config.WORK_DIR, "mcajson", "overworld"));
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
      fs.promises.writeFile(path.join(Config.OUTPUT_DIR, "overworld-spawners.json"), JSON.stringify(mobSpawners))
    );
    writeJsonPromises.push(
      fs.promises.writeFile(path.join(Config.OUTPUT_DIR, "overworld-inventories.json"), JSON.stringify(teWithItems))
    );
    writeJsonPromises.push(
      fs.promises.writeFile(path.join(Config.OUTPUT_DIR, "overworld-loot.json"), JSON.stringify(lootables))
    );
    writeJsonPromises.push(
      fs.promises.writeFile(path.join(Config.OUTPUT_DIR, "overworld-signs.json"), JSON.stringify(signs))
    );
    writeJsonPromises.push(
      fs.promises.writeFile(path.join(Config.OUTPUT_DIR, "overworld-te.json"), JSON.stringify(overworldTEJson))
    );
    return Promise.all(writeJsonPromises);
  })
  .then((val) => {
    Log.info("Compiled tile-entity JSON to output directory", { domain: DOMAIN });
  })
  .catch((err) => {
    Log.error(err, { domain: DOMAIN });
  });
