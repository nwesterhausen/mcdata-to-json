import config from './Configuration';
import log from './CustomLogger';
import path from 'path';
import fs from 'fs-extra';
import axios from 'axios';

const BASE_API = 'https://sessionserver.mojang.com/session/minecraft/profile/',
    PLAYER_PROFILE_DIR = path.join(config.TEMP_DIR, 'profiles'),
    DOMAIN = 'MojangAPI Runner',
    RECENT_THRESHOLD_MS = (1000 * 60 * 60 * 4); // 4 hours

fs.ensureDirSync(PLAYER_PROFILE_DIR);

let undashUUID = function(uuid) {
        return uuid.replace(/-/g, '');
    },
    redashUUID = function(uriUuid) {
        const POS_0 = 8, POS_1 = 12, POS_2 = 16, POS_3 = 20;

        return [uriUuid.slice(0, POS_0), uriUuid.slice(POS_0, POS_1), uriUuid.slice(POS_1, POS_2), uriUuid.slice(POS_2, POS_3), uriUuid.slice(POS_3)].join('-');
    },
    writeJSON = function(uuid, rawjson) {
        let parsedJSON = {
            'id': rawjson.id,
            'name': rawjson.name,
            'properties': {} };
        
        try {
            for (let i = 0; i < rawjson.properties.length; i++) {
                let propertyName = rawjson.properties[i].name;
                let propertyValue = JSON.parse(Buffer.from(rawjson.properties[i].value, 'base64').toString());
                
                parsedJSON.properties[propertyName] = propertyValue;
                log.debug(`Successfully decoded ${propertyName} property for ${parsedJSON.name}`, DOMAIN);
            }
        } catch (err) {
            log.error('Unable to properly decode base64 response.', DOMAIN);
            console.log(rawjson); // eslint-disable-line no-console
        }

        const PROPER_JSON = parsedJSON,
            FILEPATH = path.join(PLAYER_PROFILE_DIR, `${uuid}.json`);
        
        fs.writeJSON(FILEPATH, PROPER_JSON).then((res) => {
            log.info(`Saved Mojang Profile for ${PROPER_JSON.name} to ${FILEPATH}.`, DOMAIN);
        }).catch((err) => {
            log.error(`Failed saving ${FILEPATH}!`, DOMAIN);
            throw err;
        });

    },
    updateProfileWrapper = function(uuid) {
        const UUID_TO_CHECK = uuid,
            CLEANED_UUID = uuid.replace(/-/g, ''),
            GETPROFILE_URL = `${BASE_API}${CLEANED_UUID}`;

        axios.get(GETPROFILE_URL).then((res) => {
            log.debug(`${res.status}: ${res.statusText} [${UUID_TO_CHECK}]`, DOMAIN);
            if (res.data) {
                writeJSON(UUID_TO_CHECK, res.data);
            } else {
                log.warn(`Unable to update Mojang Profile for ${UUID_TO_CHECK} (${res.status})`);
            }
        }).catch((err) => {
            // unable to update
            log.error(`${err} :${UUID_TO_CHECK}`, DOMAIN);
        });
    },
    updateProfiles = function(force = false) {
        for (let i in Object.keys(config.PLAYERS)) {
            let uuid = Object.keys(config.PLAYERS)[i],
                rightnow = (new Date());

            try {
                let jsonFileStat = fs.statSync(path.join(PLAYER_PROFILE_DIR, `${uuid}.json`));

                if (rightnow - jsonFileStat.mtime < RECENT_THRESHOLD_MS && !force) {
                    log.info(`Mojang Profile for ${config.PLAYERS[uuid]} is younger than 4 hours, not updating.`, DOMAIN);
                    log.debug(`Age difference for ${config.PLAYERS[uuid]}: ${rightnow - jsonFileStat.mtime} (4hrs: ${RECENT_THRESHOLD_MS})`, DOMAIN);
                } else {
                    if (!force) {
                        log.info(`Mojang Profile for ${config.PLAYERS[uuid]} is older than 4 hours, requesting update.`, DOMAIN);
                        log.debug(`Age difference for ${config.PLAYERS[uuid]}: ${rightnow - jsonFileStat.mtime} (4hrs: ${RECENT_THRESHOLD_MS})`, DOMAIN);
                    } else {
                        log.info(`Forcing update of Mojang Profile for ${config.PLAYERS[uuid]}.`, DOMAIN);
                    }
                    updateProfileWrapper(uuid);
                }
            } catch (err) {
                if (err.code === 'ENOENT') {
                    log.info(`Mojang Profile for ${uuid} doesn't exist, fetching profile.`, DOMAIN);
                    updateProfileWrapper(uuid);
                } else {
                    throw err;
                }
            }
        }
        
    },
    lazyProfileUpdate = function() {
        updateProfiles(false);
    },
    forceProfileUpdate = function() {
        updateProfiles(true);
    };

export default {
    lazyProfileUpdate,
    forceProfileUpdate,
    undashUUID,
    redashUUID
};
