const safeColors = require("colors/safe");

let loglevel = 1;

module.exports = {
  setLevel: function (newlevel) {
    loglevel = newlevel;
  },
  debug: function (domain, msg) {
    if (loglevel >= 3) {
      console.debug(safeColors.bgBlue.black(" DEBUG "), safeColors.blue(`[${domain}] ${msg}`));
    }
  },
  info: function (domain, msg) {
    if (loglevel >= 2) {
      console.info(safeColors.bgGreen.black(" INFO  "), safeColors.green(`[${domain}] ${msg}`));
    }
  },
  warn: function (domain, msg) {
    if (loglevel >= 1) {
      return console.warn(safeColors.bgYellow.black(" WARN  "), safeColors.yellow(`[${domain}] ${msg}`));
    }
  },
  error: function (domain, msg) {
    if (loglevel >= 0) {
      return console.error(safeColors.bgRed.black(" ERROR "), safeColors.red(`[${domain}] ${msg}`));
    }
  },
};
