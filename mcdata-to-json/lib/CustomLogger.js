/* eslint no-console: "off" */
import {
    bgBlue,
    blue,
    bgGreen,
    green,
    bgYellow,
    yellow,
    bgRed,
    red
} from 'colors/safe';

let loglevel = 1;

export default {
    'setLevel': function(newlevel) {
        loglevel = newlevel;
    },
    'debug': function(msg) {
        if (loglevel >= 3) {
            console.debug(bgBlue.black(' DEBUG '), blue(msg));
        }
    },
    'info': function(msg) {
        if (loglevel >= 2) {
            console.info(bgGreen.black(' INFO  '), green(msg));
        }
    },
    'warn': function(msg) {
        if (loglevel >= 1) {
            return console.warn(bgYellow.black(' WARN  '), yellow(msg));
        }
    },
    'error': function(msg) {
        if (loglevel >= 0) {
            return console.error(bgRed.black(' ERROR '), red(msg));
        }
    }
};
