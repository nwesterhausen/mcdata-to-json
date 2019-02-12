/* eslint no-console: "off" */
import {
    bgBlue,
    blue,
    bgGreen,
    green,
    bgYellow,
    yellow,
    bgRed,
    red,
    bgMagenta,
    magenta
} from 'colors/safe';

let loglevel = 1;

export default {
    'setLevel': function(newlevel) {
        loglevel = newlevel;
    },
    'silly': function(msg, domain = 'Undefined') {
        if (loglevel >= 4) {
            console.debug(bgMagenta.black(' SILLY '), magenta(`[${domain}] ${msg}`));
        }
    },
    'debug': function(msg, domain = 'Undefined') {
        if (loglevel >= 3) {
            console.debug(bgBlue.black(' DEBUG '), blue(`[${domain}] ${msg}`));
        }
    },
    'info': function(msg, domain = 'Undefined') {
        if (loglevel >= 2) {
            console.info(bgGreen.black(' INFO  '), green(`[${domain}] ${msg}`));
        }
    },
    'warn': function(msg, domain = 'Undefined') {
        if (loglevel >= 1) {
            return console.warn(bgYellow.black(' WARN  '), yellow(`[${domain}] ${msg}`));
        }
    },
    'error': function(msg, domain = 'Undefined') {
        if (loglevel >= 0) {
            return console.error(bgRed.black(' ERROR '), red(`[${domain}] ${msg}`));
        }
    }
};
