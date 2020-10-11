# Created Files

When run, mcdata-to-json studies and parses the files from your minecraft world (server) and saves what it finds as JSON files in the specified output directory.

```terminal
nwest@NICK-DESKTOP:~/Sync/workspace/mcdata-to-json$ ls -1 output
<player-uuid>.json
<player-uuid>.json
<player-uuid>.json
<player-uuid>.json
<player-uuid>.json
minecraft_logs.json
overworld-inventories.json
overworld-loot.json
overworld-signs.json
overworld-spawners.json
overworld-te.json
server-advancements.json
uuids.json
```

## Helper JSON

Some helpful JSON is created to make figuring out what files to grab if hosted on web server (not needed if you can simply ls the dir).

So far only one 'helper' file gets created, **uuids.json** which is a dictionary of player uuids and names. Grab this file first, then you know what **\<player-uuid\>.json** are available.

## [Player JSON](player_json.md)

A **\<player-uuid\>.json** file is made for each player found.

## [Log JSON](log_json.md)

A **minecraft_logs.json** file is created which contains non-spammy log entries from the server log.

## [Tile Entitiy JSON](te_json.md)

The entire worlds are read in (and subsequently skipped if no change has been made to the .mca file). mcdata-to-json parses the tile entities out (in the future, could probably understand biomes and other data from the region files).
