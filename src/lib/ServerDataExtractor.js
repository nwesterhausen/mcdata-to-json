/**
 * Tool to create JSON files with minecraft server data:
 * blocks, items, advancements are all used by scripts.
 */
import fs from 'fs-extra';
import path from 'path';
import cp from 'child_process';
import log from './CustomLogger';

const DOMAIN = 'DataExtractor';
let minecraftRoot = 'unset',
    tempRoot = 'unset',
    serverjarPath = 'unset',
    advancementsExported = false,
    loottablesExported = false,
    recipesExported = false,
    tagsExported = false,
    blocklistExported = false,
    commandlistExported = false,
    registriesExported = false,
    busy = false;

let setBusy = function(bool) {
        log.debug(`Setting busy to ${bool}`, DOMAIN);
        busy = bool;
    },
    getBusy = function() {
        return busy;
    },
    exportMinecraftDataPromise = function() {
        const tempdirectory = tempRoot,
            serverjarfile = serverjarPath,
            dataextractorBusy = setBusy;

        return new Promise((resolve, reject) => {
            dataextractorBusy(true);
            log.info('Running minecraft data export from server jar. This may take a couple minutes!', DOMAIN);
            if (tempdirectory === 'unset' || serverjarfile === 'unset') {
                log.error('Tried to run data generation without setting serverjar and/or output folder.', DOMAIN);
                log.error(`datadir: ${tempRoot}, serverjar: ${serverjarPath}`, DOMAIN);
                reject('Failed to set directories.');
            }
            cp.exec(`java -cp ${serverjarPath} net.minecraft.data.Main --all --output ${tempRoot}`,
                (err, stdout, stderr) => { // eslint-disable-line
                    dataextractorBusy(false);
                    if (err) {
                        log.error('Failed to run command to export minecraft data.', DOMAIN);
                        log.error(err, DOMAIN);
                        reject(err);
                    } else {
                        log.info('Completed export of minecraft data.', DOMAIN);
                        resolve(stdout);
                    }
                });
        });
    },
    runDataGenerator = function() {
        log.info('Using server.jar to generate advancement data.', DOMAIN);
        exportMinecraftDataPromise().then( (val) => {
            log.debug(val, DOMAIN);
        });
    },
    checkForData = function() {
        log.debug('Resetting data export status.', DOMAIN);
        advancementsExported = false;
        loottablesExported = false;
        recipesExported = false;
        tagsExported = false;
        blocklistExported = false;
        commandlistExported = false;
        registriesExported = false;
        if (fs.existsSync(path.join(tempRoot, 'data'))) {
            if (fs.existsSync(path.join(tempRoot, 'data', 'minecraft'))) {
                advancementsExported = fs.existsSync(path.join(tempRoot, 'data', 'minecraft', 'advancements'));
                loottablesExported = fs.existsSync(path.join(tempRoot, 'data', 'minecraft', 'loot_tables'));
                recipesExported = fs.existsSync(path.join(tempRoot, 'data', 'minecraft', 'recipes'));
                tagsExported = fs.existsSync(path.join(tempRoot, 'data', 'minecraft', 'tags'));
            }
            if (fs.existsSync(path.join(tempRoot, 'data', 'reports'))) {
                blocklistExported = fs.existsSync(path.join(tempRoot, 'data', 'reports', 'blocks.json'));
                blocklistExported = fs.existsSync(path.join(tempRoot, 'data', 'reports', 'commands.json'));
                blocklistExported = fs.existsSync(path.join(tempRoot, 'data', 'reports', 'registries.json'));
            }
        } else {
            exportMinecraftDataPromise().then((val) => {
                log.debug(`Data export promise returned ${val}`, DOMAIN);
                log.info('Completed export of minecraft data.', DOMAIN);
                checkForData();
            });
        }
        log.debug(`advancements data is cached: ${advancementsExported}`, DOMAIN);
        log.debug(`loottables data is cached: ${loottablesExported}`, DOMAIN);
        log.debug(`recipes data is cached: ${recipesExported}`, DOMAIN);
        log.debug(`tags data is cached: ${tagsExported}`, DOMAIN);
        log.debug(`blocklist data is cached: ${blocklistExported}`, DOMAIN);
        log.debug(`commandlist data is cached: ${commandlistExported}`, DOMAIN);
        log.debug(`registries data is cached: ${registriesExported}`, DOMAIN);
    };

export default {
    'setConfig': function(config) {
        minecraftRoot = config.MC;
        tempRoot = config.TEMP_DIR;
        serverjarPath = path.join(minecraftRoot, 'server.jar');
        checkForData();
    },
    runDataGenerator,
    advancementsExported,
    loottablesExported,
    recipesExported,
    tagsExported,
    blocklistExported,
    commandlistExported,
    registriesExported,
    getBusy
};
