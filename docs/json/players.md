# Generated Playerdata JSON

mcdata-to-json creates a JSON file for each player that has played on the server. It combines data from the playerdata.dat, playerstats.json, playeradvancements.json, Mojang player API and log files.

The player data JSON will be created with the player's UUID as the filename. Along with the playerdata JSON files, a file named uuids.json is generated which is a dictionary of uuids to player names.

## Root Keys

| Key          | Value                                                                 |
| ------------ | --------------------------------------------------------------------- |
| uuid         | Player UUID                                                           |
| name         | Player display name                                                   |
| stats        | [Player stats](#player-stats)                                         |
| advancements | [Player advancements](#player-advancements)                           |
| data         | [Player.dat file contents](#player-data)                              |
| profile      | [Player profile from Mojang](#player-profile)                         |
| log          | (_Currently not working_) [Log entries with the player](#player-logs) |

## Player Stats

The stats value of the object is just an insertion of the world/stats/uuid.json for the player. The page on the minecraft wiki has [more detail](https://minecraft.gamepedia.com/Statistics#Statistic_types_and_names).

The pattern is `player.stats.CATEGORY.ITEM_BLOCK_MOB_ID` gives you usage/kills.

In `player.stats.minecraft:custom` you get things like total kills (`minecraft:mob_kills`), distance walked/ran/climbed/fell, etc.

## Player Advancements

The stats value of the object is just an insertion of the world/advancements/uuid.json for the player. This file captures advancement progress for advancements from minecraft itself and datapacks which add custom advancements.

The pattern is `player.advancments.NAMESPACE.CATEGORY.ADVANCEMENT` to get an object listing criteria and when that criteria were achieved.

mcdata-to-json also parses all the possible advancements for the server and puts them into `server-advancements.json` file. See the [advancement JSON doc](advancements.md).

## Player Data

That data value of the object is just an insertion of the parsed NBT data from the `world/playerdata/uuid.dat` file. See the [Minecraft wiki](https://minecraft.gamepedia.com/Player.dat_format#NBT_structure) for details on keys and values.

## Player Profile

This is the reply from the Mojang API for the profile/skin request. Details on the [wiki.vg page](https://wiki.vg/Mojang_API#UUID_-.3E_Profile_.2B_Skin.2FCape).

## Player Logs

When mcdata-to-json parses the log files, as it finds entries that pertain to each player, it will write them down separately and these get combined in. See the information on the [log JSON doc](logs.md) for more details.
