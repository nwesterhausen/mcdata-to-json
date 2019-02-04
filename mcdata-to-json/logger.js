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

let shouldLogDebug = false,
    shouldLogInfo = false;

export default {
    'showDebug': function(bool) {
        shouldLogDebug = bool;
    },
    'showInfo': function(bool) {
        shouldLogInfo = bool;
    },
    'debug': function(msg) {
        if (shouldLogDebug) {
            console.debug(bgBlue.black(' DEBUG '), blue(msg));
        }
    },
    'info': function(msg) {
        if (shouldLogInfo) {
            console.info(bgGreen.black(' INFO  '), green(msg));
        }
    },
    'warn': function(msg) {
        return console.warn(bgYellow.black(' WARN  '), yellow(msg));
    },
    'error': function(msg) {
        return console.error(bgRed.black(' ERROR '), red(msg));
    }
};
