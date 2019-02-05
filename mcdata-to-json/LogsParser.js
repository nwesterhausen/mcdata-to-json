import zlib from 'zlib';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import log from './lib/CustomLogger';

let logfiles = [],
    unzippedFiles = [],
    logfiledir = '',
    workdir = '',
    tmplogPath = '',
    latestlogDate = '',
    getDateFromFilename = function(filename) {
        // Expects YYYY-MM-DD-#.log
        let y = filename.split('-')[0],
            m = filename.split('-')[1],
            d = filename.split('-')[2];

        return new Date(y, m - 1, d);
    },
    getTimestampFromHHMMSS = function(timeString, parentFilename) {
        // Expects [HH:MM:SS]
        let h = timeString.split(':')[0],
            m = timeString.split(':')[1],
            s = timeString.split(':')[2],
            t = getDateFromFilename(parentFilename);

        t.setSeconds(s);
        t.setMinutes(m);
        t.setHours(h);
        return t.getTime();
    };

export default {
    'setDirs': function(logsdir, tempdir) {
        logfiledir = logsdir;
        latestlogDate = fs.statSync(path.join(logfiledir, 'latest.log')).mtime.toISOString();
        log.debug(`latest.log date: ${ latestlogDate }`);
        workdir = tempdir;
        tmplogPath = path.join(workdir, 'temp.log');
    },
    'prepareLogFiles': function() {
        let rawLogFiles = fs.readdirSync(logfiledir);

        log.debug(`Preparing following log files: ${ JSON.stringify(rawLogFiles) }`);
        // Go through the log dir and sort the files
        for (let i = 0; i < rawLogFiles.length; i++) {
            log.debug(`Working on file: ${ rawLogFiles[i] }`);
            // Unzip gziped files, keeeping track of them
            if (rawLogFiles[i].endsWith('.gz')) {
                log.debug('Detected gzip file.');
                let tmpLogFile = rawLogFiles[i].substr(0, rawLogFiles[i].length - 3),
                    compressedFile = fs.readFileSync(path.join(logfiledir, rawLogFiles[i])),
                    unzippedFile = zlib.unzipSync(compressedFile);

                log.debug('Unzipping file into log dir.');
                fs.writeFileSync(path.join(logfiledir, tmpLogFile), unzippedFile);

                unzippedFiles.push(tmpLogFile);
                logfiles.push(tmpLogFile);
                log.debug(`Unzipped ${tmpLogFile}`);
            } else if (rawLogFiles[i].endsWith('.log')) {
                logfiles.push(rawLogFiles[i]);
            }
        }
        logfiles = logfiles.sort();
        log.debug('Log file list sorted internally');
        // Append all the files into one file
        log.debug('Clearing the temp.log file');
        fs.writeFileSync(tmplogPath, '');
        for (let i = 0; i < logfiles.length; i++) {
            // special case for latest.log, we want it to be the date instead
            let fileHeader = logfiles[i] === 'latest.log' ? `[Filedate:${latestlogDate}.log]\n` : `[Filename:${logfiles[i]}]\n`;
            
            log.debug(`Appending ${logfiles[i]} to temp.log.`);
            fs.appendFileSync(tmplogPath, fileHeader + fs.readFileSync(path.join(logfiledir,logfiles[i])));
        }
    }
};
