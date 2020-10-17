const fs = require("fs");
const path = require("path");

const PATHS = require("./helpers/PathReference").paths;
const logger = require("./helpers/Logger").getLogger();

const merge = require("deepmerge");
const { PLAYERS } = require("./Configuration");

const DOMAIN = "Advancements Parser";
// const CompletedAdvancements = {};

/**
 *  First a way to create a tree of advancements
 * @param {object} advJsonObj
 * @return {object}
 */
function getTreeFromAdvancementJSON(advJsonObj) {
  logger.debug(`Merging ${Object.keys(advJsonObj).length} advancements`, { domain: DOMAIN });
  const advTree = merge.all(
    Object.keys(advJsonObj).map((advpath) => {
      const pathstr = advpath.split(":").join("/");
      return objFromPath(pathstr.split("/"), advJsonObj[advpath]);
    })
  );
  advTree.recipes = merge.all(
    Object.keys(advTree).map((domain) => {
      if (Object.prototype.hasOwnProperty.call(advTree[domain], "recipes")) {
        const recipejson = JSON.stringify(advTree[domain].recipes);
        delete advTree[domain].recipes;
        return JSON.parse(recipejson);
      }
      return {};
    })
  );
  return advTree;
}

/**
 * Turn the path array into an object
 * @param {string[]} pathArr
 * @param {object} endValue
 * @return {string[]}
 */
function objFromPath(pathArr, endValue) {
  if (pathArr.length === 1) {
    return {
      [pathArr[0]]: [endValue],
    };
  } else {
    return {
      [pathArr[0]]: objFromPath(pathArr.slice(1), endValue),
    };
  }
}

/**
 * @return {Promise}
 */
function parseAndSaveAdvancementFiles() {
  const advjsonPromises = [];
  for (const uuid of Object.keys(PLAYERS)) {
    if (typeof uuid === "string") {
      const filename = `${uuid}.json`;
      const TMP_PLAYER_DIR = path.join(PATHS.TEMP_PLAYERDATA_DIR, uuid);
      const promiseTree = fs.promises
        .readFile(path.join(PATHS.ADVANCEMENTS_DIR, filename))
        .then((filejson) => {
          return new Promise((resolve, reject) => {
            try {
              resolve(JSON.parse(filejson));
            } catch (e) {
              reject(e);
            }
          });
        })
        .then((advjson) => {
          return new Promise((resolve, reject) => {
            const condensedJson = getTreeFromAdvancementJSON(advjson);
            try {
              resolve(JSON.stringify(condensedJson));
            } catch (e) {
              reject(e);
            }
          });
        })
        .then((stringified) => {
          return fs.promises.writeFile(path.join(TMP_PLAYER_DIR, "advancements.json"), stringified);
        })
        .then(() => {
          logger.verbose(`Saved parsed advancements for ${PLAYERS[uuid]}`, { domain: DOMAIN });
          return path.join(TMP_PLAYER_DIR, "advancements.json");
        })
        .catch((err) => {
          logger.error(`Unable to parse advancement progress for ${uuid}`, { domain: DOMAIN });
          logger.error(JSON.stringify(err), { domain: DOMAIN });
        });
      advjsonPromises.push(promiseTree);
    } else {
      logger.debug(`PLAYERS may not have accurate content. PLAYERS.${uuid} = ${PLAYERS[uuid]}`, { domain: DOMAIN });
    }
  }
  return Promise.all(advjsonPromises);
}

/**
 * @param {String[]} parsedFiles
 * @return {Promise}
 */
function createServerAdvancementProgress(parsedFiles) {
  // todo: don't use raw json, use parsed json since we do this step after.
  const serverAdvancementPromises = [];

  logger.verbose(`Building server completion from ${parsedFiles.length} player advancement files`, { domain: DOMAIN });
  for (const playerAdvancementFile of parsedFiles) {
    if (fs.existsSync(playerAdvancementFile)) {
      const uuid = path.basename(path.dirname(playerAdvancementFile));
      const playerCompletionPromise = fs.promises
        .readFile(playerAdvancementFile)
        .then((filejson) => {
          return new Promise((resolve, reject) => {
            try {
              resolve(JSON.parse(filejson));
            } catch (e) {
              reject(e);
            }
          });
        })
        .then((parsedjson) => {
          return new Promise((resolve) => {
            const completedList = {};
            for (const k of Object.keys(parsedjson)) {
              completedList[k] = {};
              for (const j of Object.keys(parsedjson[k])) {
                completedList[k][j] = {};
                if (typeof parsedjson[k][j] === "object") {
                  for (const i of Object.keys(parsedjson[k][j])) {
                    if (parsedjson[k][j][i][0] && parsedjson[k][j][i][0].done) completedList[k][j][i] = [uuid];
                  }
                }
              }
            }

            return resolve(completedList);
          });
        });

      serverAdvancementPromises.push(playerCompletionPromise);
    }
  }
  return Promise.all(serverAdvancementPromises).then((val) => {
    return new Promise((resolve, reject) => {
      const mergedJSON = merge.all(val);
      try {
        resolve(JSON.stringify(mergedJSON));
      } catch (e) {
        reject(e);
      }
    }).then((stringified) => {
      return fs.promises.writeFile(path.join(PATHS.OUTPUT_DIR, "server-advancements.json"), stringified);
    });
  });
}

module.exports = {
  createServerAdvancementProgress,
  getTreeFromAdvancementJSON,
  parseAndSaveAdvancementFiles,
};
