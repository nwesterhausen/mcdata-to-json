"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _zlib = _interopRequireDefault(require("zlib"));

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var _readline = _interopRequireDefault(require("readline"));

var _CustomLogger = _interopRequireDefault(require("./lib/CustomLogger"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var logfiles = [],
    unzippedFiles = [],
    logfiledir = '',
    workdir = '',
    tmplogPath = '',
    latestlogDate = '',
    getDateFromFilename = function getDateFromFilename(filename) {
  // Expects YYYY-MM-DD-#.log
  var y = filename.split('-')[0],
      m = filename.split('-')[1],
      d = filename.split('-')[2];
  return new Date(y, m - 1, d);
},
    getTimestampFromHHMMSS = function getTimestampFromHHMMSS(timeString, parentFilename) {
  // Expects [HH:MM:SS]
  var h = timeString.split(':')[0],
      m = timeString.split(':')[1],
      s = timeString.split(':')[2],
      t = getDateFromFilename(parentFilename);
  t.setSeconds(s);
  t.setMinutes(m);
  t.setHours(h);
  return t.getTime();
};

var _default = {
  'setDirs': function setDirs(logsdir, tempdir) {
    logfiledir = logsdir;
    latestlogDate = _fs.default.statSync(_path.default.join(logfiledir, 'latest.log')).mtime.toISOString();

    _CustomLogger.default.debug("latest.log date: ".concat(latestlogDate));

    workdir = tempdir;
    tmplogPath = _path.default.join(workdir, 'temp.log');
  },
  'prepareLogFiles': function prepareLogFiles() {
    var rawLogFiles = _fs.default.readdirSync(logfiledir);

    _CustomLogger.default.debug("Preparing following log files: ".concat(JSON.stringify(rawLogFiles))); // Go through the log dir and sort the files


    for (var i = 0; i < rawLogFiles.length; i++) {
      _CustomLogger.default.debug("Working on file: ".concat(rawLogFiles[i])); // Unzip gziped files, keeeping track of them


      if (rawLogFiles[i].endsWith('.gz')) {
        _CustomLogger.default.debug('Detected gzip file.');

        var tmpLogFile = rawLogFiles[i].substr(0, rawLogFiles[i].length - 3),
            compressedFile = _fs.default.readFileSync(_path.default.join(logfiledir, rawLogFiles[i])),
            unzippedFile = _zlib.default.unzipSync(compressedFile);

        _CustomLogger.default.debug('Unzipping file into log dir.');

        _fs.default.writeFileSync(_path.default.join(logfiledir, tmpLogFile), unzippedFile);

        unzippedFiles.push(tmpLogFile);
        logfiles.push(tmpLogFile);

        _CustomLogger.default.debug("Unzipped ".concat(tmpLogFile));
      } else if (rawLogFiles[i].endsWith('.log')) {
        logfiles.push(rawLogFiles[i]);
      }
    }

    logfiles = logfiles.sort();

    _CustomLogger.default.debug('Log file list sorted internally'); // Append all the files into one file


    _CustomLogger.default.debug('Clearing the temp.log file');

    _fs.default.writeFileSync(tmplogPath, '');

    for (var _i = 0; _i < logfiles.length; _i++) {
      // special case for latest.log, we want it to be the date instead
      var fileHeader = logfiles[_i] === 'latest.log' ? "[Filedate:".concat(latestlogDate, ".log]\n") : "[Filename:".concat(logfiles[_i], "]\n");

      _CustomLogger.default.debug("Appending ".concat(logfiles[_i], " to temp.log."));

      _fs.default.appendFileSync(tmplogPath, fileHeader + _fs.default.readFileSync(_path.default.join(logfiledir, logfiles[_i])));
    }
  }
};
exports.default = _default;