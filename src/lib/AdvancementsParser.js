import Log from './CustomLogger';
import Config from '../Configuration';

import fs from 'fs-extra';
import path from 'path';
var merge = require('deepmerge')

const DOMAIN = "Advancements Parser";
let CompletedAdvancements = {};

// First a way to create a tree of advancements
function getTreeFromAdvancementJSON(advJsonObj) {
    Log.debug(`Merging ${Object.keys(advJsonObj).length} advancements`, DOMAIN);
    let advTree = merge.all(
        Object.keys(advJsonObj).map(advpath => {
            let pathstr = advpath.split(':').join('/');
            return objFromPath(pathstr.split('/'), advJsonObj[advpath]);
        }));
    advTree.recipes = merge.all(Object.keys(advTree).map(domain => {
        if (advTree[domain].hasOwnProperty('recipes')) {
            let recipejson = JSON.stringify(advTree[domain].recipes);
            delete(advTree[domain].recipes);
            return JSON.parse(recipejson);
        }
        return {};
    }));
    return advTree;
}
// Turn the path array into an object
function objFromPath(pathArr, endValue) {
    if (pathArr.length === 1) {
        return {
            [pathArr[0]]: [endValue]
        }
    } else {
        return {
            [pathArr[0]]: objFromPath(pathArr.slice(1), endValue)
        }
    }
}

// Helper function to convert and output 'parsed' advancements
function parseAndSaveAdvancementFile(filename) {
    Log.debug(`Returning a promise for converting ${filename}`, DOMAIN);
    return new Promise((resolve, reject) => {
        fs.readJSON(path.join(Config.ADVANCEMENTS_DIR, filename))
            .then(advjson => {
                return fs.writeJSON(path.join(Config.TEMP_ADVANCEMENT_JSON_DIR, filename),
                    getTreeFromAdvancementJSON(advjson), {
                        'spaces': 2
                    });
            }).then(val => {
                resolve(val)
            })
            .catch(err => {
                reject(err)
            });
    });
}

function parseAndSaveAdvancementFiles() {
    let advjsonPromises = [];
    fs.readdirSync(Config.ADVANCEMENTS_DIR).map(filename => {
        if (path.extname(filename) === '.json') {
            advjsonPromises.push(parseAndSaveAdvancementFile(filename))
        }
    });
    return new Promise((resolve, reject) => {
        Promise.all(advjsonPromises)
            .then((val) => {
                return resolve(val);
            })
            .catch((err) => {
                return reject(err);
            })
    })
}

function createServerAdvancementProgress() {
    let serverAdvancementPromises =
        fs.readdirSync(Config.ADVANCEMENTS_DIR).map(fn => {
            return new Promise((resolve, reject) => {
                fs.readJSON(path.join(Config.ADVANCEMENTS_DIR, fn))
                    .then(rawjson => {
                        const pname = fn.replace(/.json/, '');
                        const completedList = Object.keys(rawjson).map(k => {
                            if (rawjson[k].done) {
                                let completed = [pname];
                                return {
                                    [k]: completed
                                }
                            } else {
                                return {
                                    [k]: []
                                }
                            }
                        });
                        return resolve(completedList);
                    })
                    .catch(err => {
                        return reject(err);
                    })
            })
        });
    return new Promise((resolve, reject) => {
        Promise.all(serverAdvancementPromises)
            .then((val) => {
                let mergedJSON = merge.all(val.flat());
                let treeMerged = getTreeFromAdvancementJSON(mergedJSON);
                return fs.writeJSON(path.join(Config.OUTPUT_DIR, 'server-advancements.json'), treeMerged, {
                    'spaces': 2
                });
            })
            .then((val) => {
                resolve(val);
            })
            .catch((err) => {
                reject(err);
            })
    })
}

export default {
    getTreeFromAdvancementJSON,
    parseAndSaveAdvancementFile,
    parseAndSaveAdvancementFiles,
    createServerAdvancementProgress
}