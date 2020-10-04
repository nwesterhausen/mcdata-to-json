// Regular Expressions to understand what happens in the log files.
module.exports = {
  timestampRE: new RegExp(/[0-9]{2}:[0-9]{2}:[0-9]{2}/),
  severityRE: new RegExp(/\[.+\/([A-Z]+)\]/),
  advancementRE: new RegExp(/\]: (.+has made the advancement \[.+\])$/),
  challengeRE: new RegExp(/\]: (.+has completed the challenge \[.+\])$/),
  goalRE: new RegExp(/\]: (.+has reached the goal \[.+\])$/),
  playerjoinRE: new RegExp(/\]: (.+joined the game)$/),
  playerleftRE: new RegExp(/\]: (.+left the game)$/),
  playerchatRE: new RegExp(/\]: <(.+)> .+$/),
  arrowdeathRE: new RegExp(/]: .+(was shot by).+$/),
  cactusdeathRE: new RegExp(
    /]: .+(was pricked to death|hugged a cactus|walked into a cactus).+$/
  ),
  waterdeathRE: new RegExp(/]: .+(drowned).+$/),
  elytradeathRE: new RegExp(
    /]: .+(experienced kinetic energy|removed an elytra).+$/
  ),
  explosiondeathRE: new RegExp(/]: .+(blew up|was blown up).+$/),
  fallingdeathRE: new RegExp(
    /]: .+(hit the ground too hard|fell off|fell into|fell from|fell out of the water|shot off|doomed to fall|blown from a high const place).+$/
  ),
  anvildeathRE: new RegExp(/]: .+(squashed).+$/),
  firedeathRE: new RegExp(
    /]: .+(went up in flames|burned to death|burnt to a crisp|walked into a fire).+$/
  ),
  fireworkdeathRE: new RegExp(/]: .+(went off with a bang).+$/),
  lavadeathRE: new RegExp(/]: .+(swim in lava).+$/),
  lightningdeathRE: new RegExp(/]: .+(struck by lightning).+$/),
  magmadeathRE: new RegExp(/]: .+(floor was lava).+$/),
  killeddeathRE: new RegExp(/]: .+(slain by|finished off by).+$/),
  fireballRE: new RegExp(/]: .+(fireballed by).+$/),
  potiondeathRE: new RegExp(/]: .+(killed by magic|using magic).+$/),
  starvedeathRE: new RegExp(/]: .+(starved to death).+$/),
  suffocatedeathRE: new RegExp(/]: .+(suffocated|squished too much).+$/),
  thornsdeathRE: new RegExp(/]: .+(killed while trying to hurt).+$/),
  voiddeathRE: new RegExp(/]: .+(fell out of the world).+$/),
  witherdeathRE: new RegExp(/]: .+(withered away).+$/),
  bludgeondeathRE: new RegExp(/]: .+(was pummeled by).+$/),
  filenameRE: new RegExp(/\[Filename:(.+)\]/),
  uuiddescRE: new RegExp(/(UUID of player ).+$/),
  commandRE: new RegExp(/\[[A-Za-z0-9_-]+: (?:Given|Set).+\]/),
  serverreadyRE: new RegExp(
    /\]: Done \([0-9.]+s\)! For help, type "help" or "?"/
  ),
  serverstopRE: new RegExp(/\]: Stopping server/),
  overloadedRE: new RegExp(/\]: Can't keep up! Is the server overloaded?/),
  keepentityRE: new RegExp(/\]: Keeping entity [a-zA-Z:]+ that already exists/),
};
