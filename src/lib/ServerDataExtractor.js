/**
 * Tool to create JSON files with minecraft server data:
 * blocks, items, advancements are all used by scripts.
 */
import fs from 'fs-extra';
import path from 'path';
import log from './CustomLogger';

const StreamZip = require('node-stream-zip');
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
    structuresExported = false,
    busy = false;

let setBusy = function(bool) {
        log.debug(`Setting busy to ${bool}`, DOMAIN);
        busy = bool;
    },
    getBusy = function() {
        return busy;
    },
    extractMinecraftDataPromise = function() {
        let serverzipPath = path.join(tempRoot, 'server.zip');

        log.debug(`Trying to extract from ${serverjarPath} by copying to ${serverzipPath}`, DOMAIN);
        fs.copyFileSync(serverjarPath, serverzipPath);
        const zip = new StreamZip({
            'file': serverzipPath
        });
        const datadir = path.join(tempRoot, 'data');
        const assetsdir = path.join(tempRoot, 'assets');

        fs.ensureDirSync(datadir);
        fs.ensureDirSync(assetsdir);
        return new Promise( (resolve, reject) => {
            zip.on('error', (err) => {
                log.error(`Zip failed to open. ${err}`, DOMAIN);
                reject();
            });
            zip.on('extract', (entry, file) => {
                log.debug(`Extracted ${entry.name} to ${file}`, DOMAIN);
            });
            zip.on('ready', () => {
                zip.extract('data', datadir, (err, count) => {
                    if (err) {
                        log.error(`Error extracting data from zip: ${err}`);
                        zip.close();
                        reject(err);
                    } else {
                        log.debug(`Extracted ${count} items from ${serverzipPath}`, DOMAIN);
                        zip.extract('assets', assetsdir, (err1, count1) => {
                            if (err) {
                                log.error(`Error extracting lang from zip: ${err1}`, DOMAIN);
                                zip.close();
                                reject(err1);
                            } else {
                                log.debug(`Extracted ${count1} items from ${serverzipPath}`, DOMAIN);
                                zip.close();
                                resolve();
                            }
                        });
                    }
                });
            });
        });
    },
    runDataGenerator = function() {
        busy = true;
        log.info('Extracting data from server.jar (unzipping).', DOMAIN);
        extractMinecraftDataPromise().then( (val) => {
            log.debug(val, DOMAIN);
            busy = false;
        }).catch( (val) => {
            log.error(val, DOMAIN);
            busy = false;
        });
    },
    checkForData = function() {
        log.debug('Resetting data export status.', DOMAIN);
        advancementsExported = false;
        loottablesExported = false;
        recipesExported = false;
        structuresExported = false;
        tagsExported = false;
        blocklistExported = false;
        commandlistExported = false;
        registriesExported = false;
        if (fs.existsSync(path.join(tempRoot, 'data'))) {
            if (fs.existsSync(path.join(tempRoot, 'data', 'minecraft'))) {
                advancementsExported = fs.existsSync(path.join(tempRoot, 'data', 'minecraft', 'advancements'));
                loottablesExported = fs.existsSync(path.join(tempRoot, 'data', 'minecraft', 'loot_tables'));
                recipesExported = fs.existsSync(path.join(tempRoot, 'data', 'minecraft', 'recipes'));
                structuresExported = fs.existsSync(path.join(tempRoot, 'data', 'minecraft', 'structures'));
                tagsExported = fs.existsSync(path.join(tempRoot, 'data', 'minecraft', 'tags'));
            }
            if (fs.existsSync(path.join(tempRoot, 'data', 'reports'))) {
                blocklistExported = fs.existsSync(path.join(tempRoot, 'data', 'reports', 'blocks.json'));
                commandlistExported = fs.existsSync(path.join(tempRoot, 'data', 'reports', 'commands.json'));
                registriesExported = fs.existsSync(path.join(tempRoot, 'data', 'reports', 'registries.json'));
            }
        } else {
            busy = true;
            extractMinecraftDataPromise()
                .then((val) => {
                    log.debug(`Data export promise returned ${val}`, DOMAIN);
                    log.info('Completed export of minecraft data.', DOMAIN);
                    checkForData();
                    busy = false;
                }).catch( (val) => {
                    log.error(val, DOMAIN);
                    busy = false;
                });
        }
        log.debug(`advancements data is cached: ${advancementsExported}`, DOMAIN);
        log.debug(`loottables data is cached: ${loottablesExported}`, DOMAIN);
        log.debug(`recipes data is cached: ${recipesExported}`, DOMAIN);
        log.debug(`recipes data is cached: ${structuresExported}`, DOMAIN);
        log.debug(`tags data is cached: ${tagsExported}`, DOMAIN);
        log.debug(`blocklist data is cached: ${blocklistExported}`, DOMAIN);
        log.debug(`commandlist data is cached: ${commandlistExported}`, DOMAIN);
        log.debug(`registries data is cached: ${registriesExported}`, DOMAIN);
    };

export default {
    'setConfig': function(config) {
        minecraftRoot = config.MC_DIR;
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
