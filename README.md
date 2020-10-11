# mcdata-to-json

[![npm version](https://badge.fury.io/js/mcdata-to-json.svg)](https://badge.fury.io/js/mcdata-to-json)

Node.js binary to create JSON from stats, playerdata, advancements, logs and chunks.

## Usage

CLI is available from npmjs.org. So you can simply do this:

```bash
~$ npx mcdata-to-json --minecraftdir=/opt/minecraft
```

Look for an output folder with the generated JSON (unless it fails to run, and you will see warnings/errors if that's the case.)

### CLI Options

To view cli options do `mcdata-to-json -h`

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
