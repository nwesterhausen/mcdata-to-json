/**
 Advancement requirements are in:
 DATAPACKS:: root/world/datapacks/<name>/advancements/[category]/*.json
 VANILLA  :: root/generated/data/minecraft/advancements

 Advancement progress:
 world/advancement/UUID.json
 timestamped on when completed
 **/

/**
 * Advancement JSON Struct (simplified)
 * {
 *   display: {
 *       icon: {
 *          item: minecraft:id
 *       }
 *       title: {
 *           translate: Atlantis
 *       }
 *       description: {
 *          translate: Description string
 *        }
 *       frame: Not needed if default; either challenge | goal
 *   },
 *   criteria: {
 *       criteria1: {},
 *       criteria2: {}
 *   }
 * }
 ***/
import fs from 'fs-extra';
import log from './lib/CustomLogger';

const DOMAIN = 'AdvancementParser';
let workdir = 'unset',
    players = [];

export default {
    'setConfig': function(config) {
        workdir = config.TEMP_DIR;
        players = config.PLAYERS;
        log.info(`Found ${players.length} player progress files.`, DOMAIN);
    }
};
