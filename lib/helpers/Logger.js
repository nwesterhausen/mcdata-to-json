const { format, transports, createLogger } = require("winston");

let winstonLogger = null;

const SETTINGS = {
  LOG_LEVEL: null,
  WRITE_DEBUG_LOG: false,
};

/**
 * @param {boolean} withLogFile
 * @return {Logger}
 */
function buildWinstonLogger(withLogFile) {
  const CONSOLE_FORMAT = format.printf(({ level, domain, message }) => {
    return `${level} [${domain}] ${message}`;
  });

  const FILE_FORMAT = format.printf(({ level, message, domain, timestamp }) => {
    return `${timestamp} ${level} [${domain}] ${message}`;
  });

  const TRANSPORTS = [
    new transports.Console({
      format: format.combine(format.colorize(), CONSOLE_FORMAT),
    }),
  ];
  if (SETTINGS.WRITE_DEBUG_LOG)
    TRANSPORTS.push(
      new transports.File({
        filename: "debug.log",
        format: format.combine(format.timestamp(), FILE_FORMAT),
        level: "silly",
        options: {
          flags: "w",
        },
      })
    );
  return createLogger({
    level: SETTINGS.LOG_LEVEL,
    transports: TRANSPORTS,
  });
}

module.exports = {
  getLogger: function () {
    if (winstonLogger) return winstonLogger;
    if (SETTINGS.LOG_LEVEL) {
      winstonLogger = buildWinstonLogger();
      return winstonLogger;
    } else {
      throw new Error("Tried to getLogger before Instantiated!");
    }
  },
  /**
   * Set the log level for the console log.
   * @param {string} level
   */
  setLoglevel: function (level) {
    SETTINGS.LOG_LEVEL = level;
  },
  /**
   * Call this to turn on debug log writing
   */
  writeDebugLog: function () {
    SETTINGS.WRITE_DEBUG_LOG = true;
  },
};
