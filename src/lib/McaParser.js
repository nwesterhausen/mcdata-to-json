import NbtTools from './NbtTools';
import Log from './CustomLogger';
import Config from '../Configuration';

import path from 'path';
import fs from 'fs-extra';
const mca = require('mca-js');

const DOMAIN = 'MCA Parser';

function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}

function chunkToJSON(filehandle, chunkX, chunkZ) {
    return new Promise((resolve, reject) => {
        let chunkdata = mca.getData(filehandle, chunkX, chunkZ)
        if (!chunkdata) {
            return resolve({
                zPos: 0,
                xPos: 0,
                LastUpdate: [],
                Biomes: [], //.filter(onlyUnique),
                InhabitedTime: [],
                TileEntities: [],
                Entities: [],
                Status: 'empty',
                Structures: {}
            });
        }
        NbtTools.nbtToJson(chunkdata)
            .then((chunkjson) => {
                return resolve({
                    zPos: chunkjson.Level.zPos,
                    xPos: chunkjson.Level.xPos,
                    LastUpdate: chunkjson.Level.LastUpdate,
                    Biomes: chunkjson.Level.Biomes, //.filter(onlyUnique),
                    InhabitedTime: chunkjson.Level.InhabitedTime,
                    TileEntities: chunkjson.Level.TileEntities,
                    Entities: chunkjson.Level.Entities,
                    Status: chunkjson.Level.Status,
                    Structures: chunkjson.Level.Structures
                });
            })
            .catch((err) => {
                return reject(err);
            })
    })
}

function readAllChunksInRegionFile(filehandle) {
    let chunkToJSONPromises = [];
    for (let i = 0; i < 32; i++) {
        for (let j = 0; j < 32; j++) {
            chunkToJSONPromises.push(chunkToJSON(filehandle, i, j));
        }
    }
    return new Promise((resolve, reject) => {
        Promise.all(chunkToJSONPromises)
            .then((val) => {
                return resolve(val);
            })
            .catch((err) => {
                return reject(err);
            })
    })
}

function convertRegionDirToJSON(mcaDirectory) {
    if (!fs.pathExistsSync(mcaDirectory)) {
        return;
    }

    const discoveredworldname =
        path.basename(path.dirname(mcaDirectory)) === path.basename(Config.WORLD_DIR) ?
        'overworld' : path.basename(path.dirname(mcaDirectory));

    const OUTPUT_DIR = path.join(Config.CACHED_MCA_JSON_DIR, discoveredworldname);

    fs.ensureDirSync(OUTPUT_DIR);
    let files = fs.readdirSync(mcaDirectory);
    files.map((filename) => {
        if (path.extname(filename) === '.mca') {
            // Check if we previous created a JSON file for this region. If so, skip!
            if (fs.existsSync(path.join(OUTPUT_DIR, filename.replace(/.mca/, '.json')))) {
                if (fs.statSync(OUTPUT_DIR, filename.replace(/.mca/, '.json')).mtime >
                    fs.statSync(path.join(mcaDirectory, filename)).mtime) {
                    Log.debug(`The JSON version of ${filename.replace(/.mca/, '')} is up to date.`, DOMAIN);
                    return;
                }
            }


            fs.readFile(path.join(mcaDirectory, filename))
                .then((data) => {
                    Log.debug(`Starting MCA ⟶  JSON for ${filename}`, DOMAIN);
                    return readAllChunksInRegionFile(data);
                })
                .then((regionJSON) => {
                    Log.debug(`Saving JSON for ${filename.replace(/.mca/,'')}`, DOMAIN);
                    return fs.writeJSON(
                        path.join(OUTPUT_DIR, filename.replace(/.mca/, '.json')),
                        regionJSON);
                })
                .then((val) => {
                    Log.debug(`Saved mcajson/${discoveredworldname}/${filename.replace(/.mca/, '.json')}`, DOMAIN);
                })
                .catch((err) => {
                    Log.warn(`Caught error ${err}`, DOMAIN);
                })
        }
    })
}

export default {
    readAllChunksInRegionFile,
    convertRegionDirToJSON
}