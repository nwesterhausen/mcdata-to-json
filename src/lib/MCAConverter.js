import NBTHelper from './NBTHelper';
import Config from './Configuration';
import log from './CustomLogger';
import ProgressCLI from 'cli-progress';
import fs from 'fs-extra';
import path from 'path';

const mca = require('mca-js');
const nbt = require('nbt');

const DOMAIN = 'MCA Parser';

const PARSED_MCA_CACHE_DIR = path.join(Config.WORK_DIR, 'mcajson'),
    OVERWORLD = 'overworld',
    NETHER = 'DIM-1',
    END = 'DIM1';

fs.ensureDirSync(PARSED_MCA_CACHE_DIR);
fs.ensureDirSync(path.join(PARSED_MCA_CACHE_DIR, OVERWORLD));
fs.ensureDirSync(path.join(PARSED_MCA_CACHE_DIR, NETHER));
fs.ensureDirSync(path.join(PARSED_MCA_CACHE_DIR, END));

let masterTileEntityStore = {};
let recordTileEntity = function(tejson, storageObject) {
        if (!tejson.hasOwnProperty('id')) {
            return;
        }
        let id = tejson.id.value,
            te = NBTHelper.condenseNBT(tejson);

        if (!storageObject.hasOwnProperty(id)) {
            storageObject[id] = [];
        }
        storageObject[id].push(te);
    },
    parseMCAPromise = function(mcaFilepath) {
        if (fs.lstatSync(mcaFilepath).isDirectory()) {
            log.warn(`Was given a directory to parse ${mcaFilepath}`, DOMAIN);
            return;
        }

        const discoveredworldname = path.basename(path.dirname(path.dirname(mcaFilepath))) === path.basename(Config.WORLD_DIR) ? 'overworld' : path.basename(path.dirname(path.dirname(mcaFilepath)));

        const fname = path.basename(mcaFilepath),
            JSON_OUT_PATH = path.join(PARSED_MCA_CACHE_DIR, discoveredworldname, fname.replace(/.mca/, '.json'));

        log.debug(`Starting ${mcaFilepath}`, DOMAIN);

        masterTileEntityStore[fname] = {};
        // eslint-disable-next-line no-unused-vars
        return new Promise( (resolve, reject) => {
            const PROGRESS_BAR = new ProgressCLI.Bar({ 'hideCursor': true, 'format': `[{bar}] {percentage}% {value}/{total} chunks in ${fname}. Total time on ${discoveredworldname}: {duration}s` }, ProgressCLI.Presets.rect);

            PROGRESS_BAR.start(1024, 0);
            fs.readFile(mcaFilepath, (err, data) => {
                if (err) {
                    log.error(`Problem reading ${fname}: ${err}`, DOMAIN);
                    resolve( err );
                }
                let tileEntityData = [];
        
                /**
                 * 32 x 32 chunks in each region. We loop over each chunk.
                 */
                for (let i = 0; i < 32; i++) {
                    for (let j = 0; j < 32; j++) {
                        let nbtdata = mca.getData(data, i, j);

                        PROGRESS_BAR.increment();
                        if (!nbtdata) {
                            log.silly(`Ignoring empty chunk ${i},${j} in ${fname}.`, DOMAIN);
                        } else {
                            nbt.parse(nbtdata, (error, jsdata) => {
                                if (error) {
                                    log.error(`Problem parsing NBT in ${fname}: ${err}`, DOMAIN);
                                    resolve( error );
                                }
                                // Only care about TileEntities for right now
                                if (jsdata.value.Level.value.TileEntities.value.value.length > 0) {
                                    tileEntityData.push(jsdata.value.Level.value.TileEntities.value.value);
                                }
                            });
                        }
                    }
                }
                PROGRESS_BAR.stop();
                let flatTEdata = tileEntityData.flat();
           
                for (let i = 0; i < flatTEdata.length; i++) {
                    recordTileEntity(flatTEdata[i], masterTileEntityStore[fname]);
                }
        
                for (let key in masterTileEntityStore[fname]) {
                    log.debug(`Found ${masterTileEntityStore[fname][key].length} ${key} in ${fname}`, DOMAIN);
                }
                fs.writeJSON(JSON_OUT_PATH, masterTileEntityStore[fname], { 'spaces': 2 }).then((val) => {
                    log.debug(`Finished ${mcaFilepath}`, DOMAIN);
                    log.debug(`JSON Write returned ${val}`, DOMAIN);
                    resolve(fname);
                });
            });

    
        });
    },
    getTileEntitites = function() {
        return masterTileEntityStore;
    };

export default {
    parseMCAPromise,
    getTileEntitites
};
