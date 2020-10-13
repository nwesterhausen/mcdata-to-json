# mcdata-to-json

[![npm version](https://badge.fury.io/js/mcdata-to-json.svg)](https://badge.fury.io/js/mcdata-to-json)
[![Build Status](https://travis-ci.org/nwesterhausen/mcdata-to-json.svg?branch=master)](https://travis-ci.org/nwesterhausen/mcdata-to-json)

Node.js binary to create JSON from stats, playerdata, advancements, logs and chunks. See explanation of steps it takes to do this [here](docs/what-happens.md).

## Usage

CLI is available from npmjs.org. So you can simply do this:

```bash
npx mcdata-to-json --minecraftdir=/opt/minecraft
```

Look for an output folder with the generated JSON (unless it fails to run, and you will see warnings/errors if that's the case.)

### CLI Options

| Option             | Default Value    | Description                                                                    |
| ------------------ | ---------------- | ------------------------------------------------------------------------------ |
| --loglevel         | `warn`           | Specify log verbosity, one of `error`, `warn`, `info`, `debug` or `silly`      |
| -v, --verbose      |                  | More 'v's increase log verbosity (up to -vvv or --verbose --verbose --verbose) |
| -q, --quiet        |                  | Decrease log verbosity (changes from `warn` to `error`)                        |
| -t, --minecraftdir | `/minecraft`     | Specify the minecraft directory (containing the server.properites)             |
| -o, --outputdir    | `./output`       | Specify output directory for generated JSON                                    |
| -w, --workdir      | `./mcdata_cache` | Specify a temporary directory that can be used while running                   |
| -v, --version      |                  | Show version and exit                                                          |
| -h, --help         |                  | Show help message and exit                                                     |

### Environment Variables

You can define environment variables in lieu of using option switches. The prefix `MCTOJSON_` is needed before the defined switch (see full listing in `mcdata-to-json --help`). If you create a file `.env` in the root where you run mcdata-to-json, it will be used to populate the environment variables.

#### Common Variables

| Variable              | Details                                                                     |
| --------------------- | --------------------------------------------------------------------------- |
| MCTOJSON_LOGLEVEL     | Set the log level, choose one of: `error`, `warn`, `info`, `debug`, `silly` |
| MCTOJSON_MINECRAFTDIR | Set the location of your minecraft folder                                   |
| MCTOJSON_OUTPUTDIR    | Set the output folder for generated JSON                                    |

## Generated Files

See the [docs](docs/created-files.md) for more information.

## Development

Use pnpm for dependency management when developing the project. If you don't have it, install it with either `npm install --global pnpm` or `yarn global add pnpm` then you can clone this repository and do `pnpm install` in the root and install dependencies.
