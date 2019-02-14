"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _CustomLogger = _interopRequireDefault(require("../CustomLogger"));

var _Constants = _interopRequireDefault(require("./Constants"));

var _Parser = require("./Parser");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var DOMAIN = 'Log Tools',
    UNPARSABLE_LOG_LINE_CODE = 'b68ad81beeb8e3cbb174'; // Regular Expressions to understand what happens in the log files.

var timestampRE = new RegExp(/[0-9]{2}:[0-9]{2}:[0-9]{2}/),
    severityRE = new RegExp(/\[.+\/([A-Z]+)\]/),
    advancementRE = new RegExp(/\]: (.+has made the \[.+\])$/),
    playerjoinRE = new RegExp(/\]: (.+joined the game)$/),
    playerleftRE = new RegExp(/\]: (.+left the game)$/),
    playerchatRE = new RegExp(/\]: <(.+)> .+$/),
    arrowdeathRE = new RegExp(/]: .+(was shot by).+$/),
    cactusdeathRE = new RegExp(/]: .+(was pricked to death|hugged a cactus|walked into a cactus).+$/),
    waterdeathRE = new RegExp(/]: .+(drowned).+$/),
    elytradeathRE = new RegExp(/]: .+(experienced kinetic energy|removed an elytra).+$/),
    explosiondeathRE = new RegExp(/]: .+(blew up|was blown up).+$/),
    fallingdeathRE = new RegExp(/]: .+(hit the ground too hard|fell off|fell into|fell from|fell out of the water|shot off|doomed to fall|blown from a high const place).+$/),
    anvildeathRE = new RegExp(/]: .+(squashed).+$/),
    firedeathRE = new RegExp(/]: .+(went up in flames|burned to death|burnt to a crisp|walked into a fire).+$/),
    fireworkdeathRE = new RegExp(/]: .+(went off with a bang).+$/),
    lavadeathRE = new RegExp(/]: .+(swim in lava).+$/),
    lightningdeathRE = new RegExp(/]: .+(struck by lightning).+$/),
    magmadeathRE = new RegExp(/]: .+(floor was lava).+$/),
    killeddeathRE = new RegExp(/]: .+(slain by|finished off by).+$/),
    fireballRE = new RegExp(/]: .+(fireballed by).+$/),
    potiondeathRE = new RegExp(/]: .+(killed by magic|using magic).+$/),
    starvedeathRE = new RegExp(/]: .+(starved to death).+$/),
    suffocatedeathRE = new RegExp(/]: .+(suffocated|squished too much).+$/),
    thornsdeathRE = new RegExp(/]: .+(killed while trying to hurt).+$/),
    voiddeathRE = new RegExp(/]: .+(fell out of the world).+$/),
    witherdeathRE = new RegExp(/]: .+(withered away).+$/),
    bludgeondeathRE = new RegExp(/]: .+(was pummeled by).+$/),
    filenameRE = new RegExp(/\[Filename:(.+)\]/),
    uuiddescRE = new RegExp(/(UUID of player ).+$/),
    commandRE = new RegExp(/\[[A-Za-z0-9_-]+: (?:Given|Set).+\]/),
    serverreadyRE = new RegExp(/\]: Done \([0-9.]+s\)! For help, type "help" or "?"/),
    serverstopRE = new RegExp(/\]: Stopping server/),
    overloadedRE = new RegExp(/\]: Can't keep up! Is the server overloaded?/),
    keepentityRE = new RegExp(/\]: Keeping entity [a-zA-Z:]+ that already exists/),
    movedquicklyRE = new RegExp(/\]: .+moved too quickly?/),
    argumentambiguityRE = new RegExp(/\]: Ambiguity between arguments .+$/),
    preparingspawnRE = new RegExp(/\]: Preparing spawn area: .+$/);

function getLoglineType(logline) {
  if (logline.match(playerjoinRE)) {
    return _Constants.default.TYPE_LOGIN;
  } else if (logline.match(playerleftRE)) {
    return _Constants.default.TYPE_LOGOFF;
  } else if (logline.match(advancementRE)) {
    return _Constants.default.TYPE_ADVANCEMENT;
  } else if (logline.match(keepentityRE)) {
    return _Constants.default.TYPE_KEEPENTITY;
  } else if (logline.match(playerchatRE)) {
    return _Constants.default.TYPE_CHAT;
  } else if (logline.match(arrowdeathRE)) {
    return _Constants.default.ARROW_DEATH;
  } else if (logline.match(cactusdeathRE)) {
    return _Constants.default.CACTUS_DEATH;
  } else if (logline.match(waterdeathRE)) {
    return _Constants.default.WATER_DEATH;
  } else if (logline.match(elytradeathRE)) {
    return _Constants.default.ELYTRA_DEATH;
  } else if (logline.match(explosiondeathRE)) {
    return _Constants.default.EXPLOSION_DEATH;
  } else if (logline.match(fallingdeathRE)) {
    return _Constants.default.FALLING_DEATH;
  } else if (logline.match(anvildeathRE)) {
    return _Constants.default.ANVIL_DEATH;
  } else if (logline.match(firedeathRE)) {
    return _Constants.default.FIRE_DEATH;
  } else if (logline.match(fireworkdeathRE)) {
    return _Constants.default.FIREWORK_DEATH;
  } else if (logline.match(lavadeathRE)) {
    return _Constants.default.LAVA_DEATH;
  } else if (logline.match(lightningdeathRE)) {
    return _Constants.default.LIGHTNING_DEATH;
  } else if (logline.match(magmadeathRE)) {
    return _Constants.default.MAGMA_DEATH;
  } else if (logline.match(killeddeathRE)) {
    return _Constants.default.KILLED_DEATH;
  } else if (logline.match(fireballRE)) {
    return _Constants.default.FIREBALL_DEATH;
  } else if (logline.match(potiondeathRE)) {
    return _Constants.default.POITION_DEATH;
  } else if (logline.match(starvedeathRE)) {
    return _Constants.default.STARVE_DEATH;
  } else if (logline.match(suffocatedeathRE)) {
    return _Constants.default.SUFFOCATE_DEATH;
  } else if (logline.match(thornsdeathRE)) {
    return _Constants.default.THORNS_DEATH;
  } else if (logline.match(voiddeathRE)) {
    return _Constants.default.VOID_DEATH;
  } else if (logline.match(witherdeathRE)) {
    return _Constants.default.WITHER_DEATH;
  } else if (logline.match(bludgeondeathRE)) {
    return _Constants.default.BLUDGEON_DEATH;
  } else if (logline.match(uuiddescRE)) {
    return _Constants.default.TYPE_PLAYERUUID;
  } else if (logline.match(commandRE)) {
    return _Constants.default.TYPE_COMMAND;
  } else if (logline.match(serverreadyRE)) {
    return _Constants.default.TYPE_SERVERREADY;
  } else if (logline.match(serverstopRE)) {
    return _Constants.default.TYPE_SERVERSTOP;
  } else if (logline.match(overloadedRE)) {
    return _Constants.default.TYPE_OVERLOADED;
  } else if (logline.match(movedquicklyRE)) {
    return _Constants.default.TYPE_MOVEDQUICKLY;
  } else if (logline.match(preparingspawnRE)) {
    return _Constants.default.TYPE_PREPARESPAWN;
  } else if (logline.match(argumentambiguityRE)) {
    return _Constants.default.TYPE_ARGUMENTABIGUITY;
  }

  return _Constants.default.TYPE_SERVERINFO;
}

function appendLogActionTo(dest, logActionArray) {
  if (logActionArray === UNPARSABLE_LOG_LINE_CODE) {
    return;
  }

  if (!logActionArray) {
    _CustomLogger.default.warn("Wasn't passed item to add to array.", "".concat(DOMAIN, ".appendLogActionTo"));

    return;
  }

  if (!Array.isArray(dest)) {
    _CustomLogger.default.warn('Destination must be an array.', "".concat(DOMAIN, ".appendLogActionTo"));

    return;
  }

  if (logActionArray.length !== 4) {
    _CustomLogger.default.warn("Log array must have length 4. Was given ".concat(logActionArray), "".concat(DOMAIN, ".appendLogActionTo"));

    return;
  } // log.debug(`Appending ${actionarray} to destination`, DOMAIN);


  dest.push({
    'timestamp': logActionArray[0],
    'type': logActionArray[1],
    'description': logActionArray[2],
    'severity': logActionArray[3]
  });
}

function getTimestampFromHHMMSSAndBasedate(timeString, basedate) {
  // Expects [HH:MM:SS]
  var h = timeString.split(':')[0],
      m = timeString.split(':')[1],
      s = timeString.split(':')[2],
      t = basedate;
  t.setSeconds(s);
  t.setMinutes(m);
  t.setHours(h); // log.debug(`Created timestamp ${t.toISOString()} from ${timeString}`, DOMAIN);

  return t.getTime();
}

function getDateFromFilename(filename) {
  // Expects YYYY-MM-DD-#.log
  var y = filename.split('-')[0],
      m = filename.split('-')[1],
      d = filename.split('-')[2],
      t = new Date(y, m - 1, d);

  if (filename === 'latest.log') {
    t = new Date(_Parser.latestlogDate);
  } // log.debug(`Created timestamp ${t.toISOString()} from ${filename}`, DOMAIN);


  return t;
}

function parseLogLine(basedate, logline) {
  if (logline.match(timestampRE)) {
    // parse the time part of the lines
    var time = logline.match(timestampRE)[0];
    var timestamp = getTimestampFromHHMMSSAndBasedate(time, basedate);
    var sev = logline.match(severityRE) ? logline.match(severityRE)[1] : 'ERROR';
    var type = getLoglineType(logline);
    var linedata = logline.substr(logline.indexOf(']: ') + 3);

    if (type === _Constants.default.TYPE_CHAT) {
      linedata = {
        'player': logline.match(playerchatRE)[1],
        'chat': logline.substr(logline.indexOf('>') + 2)
      };
    }

    return [timestamp, type, linedata, sev];
  }

  return UNPARSABLE_LOG_LINE_CODE;
}
/** Need to port over
 * 
 * jsonFromLogfile
 * jsonFromLogfilePromise
 * ((Really one of those two))
 * 
 * prepareLogFiles
 * combineLogFiles
 * parseLogFiles
 * 
 */


var _default = {
  parseLogLine: parseLogLine,
  getDateFromFilename: getDateFromFilename,
  getTimestampFromHHMMSSAndBasedate: getTimestampFromHHMMSSAndBasedate,
  appendLogActionTo: appendLogActionTo
};
exports.default = _default;