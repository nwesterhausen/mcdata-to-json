# Architecture

How does/should it work?

## Process Flow

1. Preflight checks
    1. Are folders specified somewhere? (if not, use cwd)
        1. Minecraft folder
        2. Output folder
        3. Workdir folder (will contain extracted/ and .temp/)
    2. Is the minecraft folder valid?
        a. server.properties
        b. world/
        c. logs/
        d. world/playerdata
        e. world/advancements
        f. world/stats
    3. Create output dir if it doesn't exist.
2. Data check (if we don't have data, complete this step then restart)
    1. Is the data that can be extracted from the minecraft jar files available?
        1. (?) offer to download the minecraft jar(s)
            1. The client jar contains textures which could be good
            2. The server jar is just a cut down client (rather the client includes the server)
        2. Extract data from the jar
            1. /data -> /extracted/data
            2. /assets -> /extracted/assets
        3. Are there datapacks?
            1. Extract datapacks into the /extracted/ dir
3. Pre-process data
    1. Turn logs into JSON
    2. Get player data
        1. Gather stat and advancement files
        2. Turn playerdata into JSON
    3. Get server data
        1. Turn level.dat into JSON
        2. (?) Turn *.dat into JSON
    4. Turn *.mca into JSON
        1. (?) only relevant bits, like spawner locations and inventories
4. Process data
    1. Split chat into conversations (from logs)
        1. Conversation is who participated + the chat logs
    2. Create player output
        1. Combine stats, advancements, and player.dat JSON
        2. Add death insight from the log JSON
        3. Attach any conversations the player participated in
    3. Create server output
        1. Combined stats for the server (plus player rankings)
        2. Combined level.dat and other .dat files
5. Save output