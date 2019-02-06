# mcdata-to-json
Node.js module to process stats, playerdata, advancements and logs and output JSON.

## Usage
To generate json files from a minecraft server at /opt/minecraft and save them to /home/nick/mcjson:

`mcdata-to-json --minecraft="/opt/minecraft/" --outdir="/home/nick/mcjson"`

In practice, you may need to run this like:

```
git clone https://github.com/nwesterhausen/mcdata-to-json.git
cd mcdata-to-json
npm i
npm run build
node ./dist/main.js --minecraft="/opt/minecraft" --outdir="/home/nick/mcjson"
```

## Help Text

```
mcdata-to-json 0.0.3
    A node.js module to turn the data from your minecraft server or world into json.
Usage:
    --help, -h                      Show this help message and exit.
    --minecraft=path                The minecraft folder containing server.properties and world.
    --outputdir=path                The directory to save the generated JSON files into.
    --loglevel=<level>              How verbose to log to the console. Also you can use one of
                                    the helper functions to accomplish this to varying degrees:
    --silent, -s, --loglevel=error  Log only errors.
    --quiet, -q, --loglevel=warn    Log only warnings and errors.
    -v, --loglevel=info [Default]   Log everything except for debug messages.
    -vvv, -debug, --loglevel=debug  Log everything.                  Show the help message.                                         false
```
