const fs = require("fs");
const path = require("path");

const PATHS = require("./helpers/PathRefrence").paths;
const logger = require("./helpers/Logger").getLogger();

const merge = require("deepmerge");

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
 *  Helper function to convert and output 'parsed' advancements
 * @param {string} filename
 * @return {Promise}
 */
function parseAndSaveAdvancementFile(filename) {
  logger.debug(`Returning a promise for converting ${filename}`, { domain: DOMAIN });
  return new Promise((resolve, reject) => {
    fs.promises
      .readFile(path.join(PATHS.ADVANCEMENTS_DIR, filename))
      .then((advfile) => {
        const advjson = JSON.parse(advfile);
        return fs.promises.writeFile(
          path.join(PATHS.TEMP_ADVANCEMENT_JSON_DIR, filename),
          JSON.stringify(getTreeFromAdvancementJSON(advjson))
        );
      })
      .then((val) => {
        resolve(val);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * @return {Promise}
 */
function parseAndSaveAdvancementFiles() {
  const advjsonPromises = [];
  fs.readdirSync(PATHS.ADVANCEMENTS_DIR).map((filename) => {
    if (path.extname(filename) === ".json") {
      advjsonPromises.push(parseAndSaveAdvancementFile(filename));
    }
  });
  return new Promise((resolve, reject) => {
    Promise.all(advjsonPromises)
      .then((val) => {
        return resolve(val);
      })
      .catch((err) => {
        return reject(err);
      });
  });
}

/**
 * @return {Promise}
 */
function createServerAdvancementProgress() {
  const serverAdvancementPromises = fs.readdirSync(PATHS.ADVANCEMENTS_DIR).map((fn) => {
    return new Promise((resolve, reject) => {
      fs.promises
        .readFile(path.join(PATHS.ADVANCEMENTS_DIR, fn))
        .then((rawfile) => {
          const rawjson = JSON.parse(rawfile);
          const pname = fn.replace(/.json/, "");
          const completedList = Object.keys(rawjson).map((k) => {
            if (rawjson[k].done) {
              const completed = [pname];
              return {
                [k]: completed,
              };
            } else {
              return {
                [k]: [],
              };
            }
          });
          return resolve(completedList);
        })
        .catch((err) => {
          return reject(err);
        });
    });
  });
  return new Promise((resolve, reject) => {
    Promise.all(serverAdvancementPromises)
      .then((val) => {
        const mergedJSON = merge.all(val.flat());
        const treeMerged = getTreeFromAdvancementJSON(mergedJSON);
        return fs.promises.writeFile(
          path.join(PATHS.OUTPUT_DIR, "server-advancements.json"),
          JSON.stringify(treeMerged)
        );
      })
      .then((val) => {
        resolve(val);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

module.exports = {
  createServerAdvancementProgress,
  getTreeFromAdvancementJSON,
  parseAndSaveAdvancementFile,
  parseAndSaveAdvancementFiles,
};
