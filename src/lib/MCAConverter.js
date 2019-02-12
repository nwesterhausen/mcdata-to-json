import NBTHelper from './NBTHelper';
import Config from './Configuration';
import log from './CustomLogger';
import fs from 'fs-extra';
import path from 'path';

const mca = require('mca-js');
const nbt = require('nbt');

const DOMAIN = 'MCA Parser';

fs.ensureDirSync(path.join(Config.TEMP_DIR), 'mcajson');

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

        let discoveredworldname = path.basename(path.dirname(path.dirname(mcaFilepath))) === path.basename(Config.WORLD_DIR) ? 'overworld' : path.basename(path.dirname(path.dirname(mcaFilepath)));

        const fname = path.basename(mcaFilepath),
            worldregion = discoveredworldname;

        fs.ensureDirSync(path.join(Config.TEMP_DIR, 'mcajson', worldregion));

        log.debug(`Starting ${mcaFilepath}`, DOMAIN);

        masterTileEntityStore[fname] = {};
        // eslint-disable-next-line no-unused-vars
        return new Promise( (resolve, reject) => {
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
        
                        try {
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
                        } catch (nbterror) {
                            if (nbterror.message === 'Argument "data" is falsy') {
                                log.silly(`Caught an empty chunk ${i},${j} in ${fname}.`, DOMAIN);
                            } else {
                                log.warn(`NBT ERROR THROWN:${i},${j}:${fname}::${nbterror}`, DOMAIN);
                            }
                        }
                    }
                }
                let flatTEdata = tileEntityData.flat();
           
                for (let i = 0; i < flatTEdata.length; i++) {
                    recordTileEntity(flatTEdata[i], masterTileEntityStore[fname]);
                }
        
                for (let key in masterTileEntityStore[fname]) {
                    log.debug(`Found ${masterTileEntityStore[fname][key].length} ${key} in ${fname}`, DOMAIN);
                }
                fs.writeJSON(path.join(Config.TEMP_DIR, 'mcajson', worldregion, `${fname.replace(/.mca/, '')}.json`), masterTileEntityStore[fname]).then((val) => {
                    log.debug(`Finished ${mcaFilepath}`, DOMAIN);
                    log.debug(`JSON Write returned ${val}`, DOMAIN);
                    resolve(fname);
                });
            });

    
        });
    };

export default {
    parseMCAPromise,
    'tileEntities': function() {
        return masterTileEntityStore;
    }
};
