/**
 * Tool to create JSON files with minecraft server data:
 * blocks, items, advancements are all used by scripts.
 */
import fs from 'fs-extra';
import path from 'path';
import cp from 'child_process';
import log from './CustomLogger';

let minecraftRoot = 'unset',
    tempRoot = 'unset',
    serverjarPath = 'unset';

let exportMinecraftAdvancementsPromise = function() {
        return new Promise((resolve, reject) => {
            log.debug('Running minecraft data export from server jar.');
            if (tempRoot === 'unset' || serverjarPath === 'unset') {
                log.error('Tried to run data generation without setting serverjar and/or output folder.');
                log.error(`datadir: ${tempRoot}, serverjar: ${serverjarPath}`);
                reject('Failed to set directories.');
            }
            cp.exec(`java -cp ${serverjarPath} net.minecraft.data.Main --server --output ${tempRoot}`,
                (err, stdout, stderr) => { // eslint-disable-line 
                    if (err) {
                        log.error('Failed to run command to export minecraft data.');
                        log.error(err);
                        reject(err);
                    } else {
                        log.info('Completed export of minecraft data.');
                        resolve(stdout);
                    }
                });
        });
    },
    exportMinecraftAdvancements = function() {
        log.debug('Checking for data already in output folder.');
        if (!fs.existsSync(path.join(tempRoot, 'data'))) {
            log.info('Using server.jar to generate advancement data.');
            exportMinecraftAdvancementsPromise().then( (val) => {
                log.debug(val);
            });
        } else {
            log.info(`Using cached minecraft report data in ${path.join(tempRoot, 'data')}`);
        }
    };

export default {
    'setMinecraftRoot': function(mcpath) {
        minecraftRoot = mcpath;
        serverjarPath = path.join(mcpath, 'server.jar');
    },
    'setTempRoot': function(temproot) {
        tempRoot = temproot;
    },
    exportMinecraftAdvancements
};
