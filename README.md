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
    --minecraft                  The minecraft folder containing server.properties and world    .
    --outputdir                  The dir to put the created JSON into.                          .\output
    --loglevel                   How verbose to log to console.                                 info
    --help                       Show the help message.                                         false
```
