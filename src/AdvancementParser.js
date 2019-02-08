import log from './lib/CustomLogger';

const DOMAIN = 'AdvancementParser';
let workdir = 'unset';

export default {
    'setConfig': function(config) {
        workdir = config.TEMP_DIR;
    }
};
