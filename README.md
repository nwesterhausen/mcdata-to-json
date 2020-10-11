# mcdata-to-json

Node.js module to process stats, playerdata, advancements and logs and output JSON.

## Usage

To generate json files from a minecraft server at /opt/minecraft and save them to /home/nick/mcjson:

`mcdata-to-json --minecraftdir="/opt/minecraft/" --outputdir="/home/nick/mcjson"`

To view cli options do `mcdata-to-json -h`

In practice, you may need to run this like:

```bash
git clone https://github.com/nwesterhausen/mcdata-to-json.git
cd mcdata-to-json
yarn
node ./index.js --minecraftdir="/opt/minecraft" --outputdir="/home/nick/mcjson"
```

## Generated Files

See the [docs](doc/files.md) for more information.
