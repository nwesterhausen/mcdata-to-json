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

### Environment Variables

You can define environment variables in lieu of using option switches. The prefix `MCTOJSON_` is needed before the defined switch (see full listing in `mcdata-to-json --help`). If you create a file `.env` in the root where you run mcdata-to-json, it will be used to populate the environment variables.

#### Common Variables

| Variable              | Details                                                                     |
| --------------------- | --------------------------------------------------------------------------- |
| MCTOJSON_LOGLEVEL     | Set the log level, choose one of: `error`, `warn`, `info`, `debug`, `silly` |
| MCTOJSON_MINECRAFTDIR | Set the location of your minecraft folder                                   |
| MCTOJSON_OUTPUTDIR    | Set the output folder for generated JSON                                    |

## Generated Files

See the [docs](doc/files.md) for more information.
