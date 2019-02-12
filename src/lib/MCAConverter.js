import NBTHelper from './NBTHelper';
import log from './CustomLogger';
import fs from 'fs-extra';
import path from 'path';

// const fs = require('fs-extra');
const mca = require('mca-js');
const nbt = require('nbt');

const DOMAIN = 'MCA Parser';

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
        const fname = path.basename(mcaFilepath);

        log.debug(`Starting ${mcaFilepath}`, DOMAIN);

        masterTileEntityStore[fname] = {};
        return new Promise( (resolve, reject) => {
            fs.readFile(mcaFilepath, (err, data) => {
                if (err) {
                    log.error(`Problem reading ${fname}: ${err}`, DOMAIN);
                    resolve( err );
                }
                let tileEntityData = [];
        
                for (let i = 0; i < 32; i++) {
                // var j will increment the Y pos. Note that the actual chunk is regionY * 32 + id
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
                                log.debug(`Caught an empty chunk ${i},${j} in ${fname}.`, DOMAIN);
                            } else {
                                log.error(`NBT ERROR THROWN:${i},${j}:${fname}::${nbterror}`, DOMAIN);
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
            
                log.debug(`Finished ${mcaFilepath}`, DOMAIN);
                resolve(masterTileEntityStore[fname]);
            });

    
        });
    };

export default {
    parseMCAPromise,
    'tileEntities': function() {
        return masterTileEntityStore;
    }
};
