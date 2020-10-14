/**
 * Regular Expressions to understand what happens in the log files.
 * These all take into account that the logs for minecraft follow the format
 * [10:24:55] [Server thread/INFO]: Done (3.036s)! For help, type "help"
 * [<time>] [<origin>/<severity>]: <Message>
 */
module.exports = {
  advancementRE: new RegExp(/\]: (.+has made the advancement \[.+\])$/),
  anvildeathRE: new RegExp(/]: .+(squashed).+$/),
  arrowdeathRE: new RegExp(/]: .+(was shot by).+$/),
  bludgeondeathRE: new RegExp(/]: .+(was pummeled by).+$/),
  cactusdeathRE: new RegExp(/]: .+(was pricked to death|hugged a cactus|walked into a cactus).+$/),
  challengeRE: new RegExp(/\]: (.+has completed the challenge \[.+\])$/),
  commandRE: new RegExp(/\[[A-Za-z0-9_-]+: (?:Given|Set).+\]/),
  elytradeathRE: new RegExp(/]: .+(experienced kinetic energy|removed an elytra).+$/),
  explosiondeathRE: new RegExp(/]: .+(blew up|was blown up).+$/),
  fallingdeathRE: new RegExp(
    /]: .+(hit the ground too hard|fell off|fell into|fell from|fell out of the water|shot off|doomed to fall|blown from a high const place).+$/
  ),
  filenameRE: new RegExp(/\[Filename:(.+)\]/),
  fireballRE: new RegExp(/]: .+(fireballed by).+$/),
  firedeathRE: new RegExp(/]: .+(went up in flames|burned to death|burnt to a crisp|walked into a fire).+$/),
  fireworkdeathRE: new RegExp(/]: .+(went off with a bang).+$/),
  goalRE: new RegExp(/\]: (.+has reached the goal \[.+\])$/),
  keepentityRE: new RegExp(/\]: Keeping entity [a-zA-Z:]+ that already exists/),
  killeddeathRE: new RegExp(/]: .+(slain by|finished off by).+$/),
  lavadeathRE: new RegExp(/]: .+(swim in lava).+$/),
  lightningdeathRE: new RegExp(/]: .+(struck by lightning).+$/),
  magmadeathRE: new RegExp(/]: .+(floor was lava).+$/),
  overloadedRE: new RegExp(/\]: Can't keep up! Is the server overloaded?/),
  playerchatRE: new RegExp(/\]: <(.+)> .+$/),
  playerjoinRE: new RegExp(/\]: (.+joined the game)$/),
  playerleftRE: new RegExp(/\]: (.+left the game)$/),
  potiondeathRE: new RegExp(/]: .+(killed by magic|using magic).+$/),
  serverreadyRE: new RegExp(/\]: Done \([0-9.]+s\)! For help, type "help" or "?"/),
  serverstopRE: new RegExp(/\]: Stopping server/),
  severityRE: new RegExp(/\[.+\/([A-Z]+)\]/),
  starvedeathRE: new RegExp(/]: .+(starved to death).+$/),
  suffocatedeathRE: new RegExp(/]: .+(suffocated|squished too much).+$/),
  thornsdeathRE: new RegExp(/]: .+(killed while trying to hurt).+$/),
  timestampRE: new RegExp(/[0-9]{2}:[0-9]{2}:[0-9]{2}/),
  uuiddescRE: new RegExp(/(UUID of player ).+$/),
  voiddeathRE: new RegExp(/]: .+(fell out of the world).+$/),
  waterdeathRE: new RegExp(/]: .+(drowned).+$/),
  witherdeathRE: new RegExp(/]: .+(withered away).+$/),
};
