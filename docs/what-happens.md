# Architecture

How does/should it work?

## Process Flow

1. Preflight checks

   1. Are folders specified somewhere? (if not, use cwd)

      1. Minecraft folder

         If no minecraft folder is provided on the --minecraftdir option, we assume minecraft is running from `/minecraft`

      2. Output folder

         If no output folder is provided on the --outputdir option, we will output finalized JSON to a directory `output` which will be created in the cwd.

      3. Workdir folder (will contain extracted/ and .temp/)

         If no working (temp) dir is provided on the --workdir option, we will create and use a directory named `mcdata_cache` in the cwd.

   2. Is the minecraft folder valid?

      Some pieces that are required for any usable output from this script are checked for and warnings given if they are missing. Not really a way to mess this up if you really provided a directory minecraft is running from.

      a. server.properties
      b. world/
      c. logs/
      d. world/playerdata
      e. world/advancements
      f. world/stats

2. Data check (if we don't have data, complete this step then restart)

   There is some data that can be generated from the minecraft jar file itself, and that can be useful for displaying the information located in the final JSON files. (Related #10)

   1. Is the data that can be extracted from the minecraft jar files available?

      1. (?) offer to download the minecraft jar(s)
         1. The client jar contains textures which could be good
         2. The server jar is just a cut down client (rather the client includes the server)
      2. Extract data from the jar

         1. /data -> /extracted/data

            This is handled in `ServerDataTool.js`

         2. /assets -> /extracted/assets

            See #10 for enhancement to disable extracting assets. See #11 for having asset extraction actually work.

3. Pre-process data

   1. Turn logs into JSON

      Log files are usually compressed, we extract them out, go through line-by-line and create an array of log entries for each file in the workdir. Then there's a final pass which combines all the arrays together, sorts them, and removes "irrlelvant" entries, such as the server startup messages. Any sev warning or error messages are kept, and a full JSON log is available in `mcdata_cache/.temp/all_logs.json`. What we output as finalized log JSON is only the events we check for using the regular expressions in `LogRegex.js`. See #12 for enchancement.

   2. Get player data

      There are a few types of data pertaining to players. Stats, advancements, and the information in the playerdata/uuid.dat files (location, inventory to name a few). Stats and advancements for each player are JSON already, so we simply grab those and combine them with the JSON we generate from parsing each player's uuid.dat file.

      1. Gather stat and advancement files
      2. Turn playerdata into JSON

   3. Get server data
      1. Turn level.dat into JSON (See #13)
   4. Turn \*.mca into JSON

      We parse the .mca files in just the `world/region` folder right now. (See #14) We save JSON for each region file as an array of chunk objects. We don't save everything from the .mca, only the bits we care about. Each one is output as a separate file, so you can avoid looking at the spawners and loot chests locations (kinda cheaty).

      1. inventories (chests, furnaces, anything that has inventory slots)
      1. loot chest (unopened spawner chests, nether chests. points to a loot table)
      1. signs
      1. spawners

4. Process data

   1. Split chat into conversations (from logs)

      1. Conversation is who participated + the chat logs

         Chat message objects in the log JSON array have a playername and what they said as the description already. This is handled when the logs are parsed.

   2. Create player output
      1. Combine stats, advancements, and player.dat JSON
      2. Add death insight from the log JSON (no player log is created #15)
      3. Attach any conversations the player participated in (depends on #15)
   3. Create server output
      1. Combined stats for the server (plus player rankings)
      2. Combined level.dat and other .dat files (#13)

5. Save output
