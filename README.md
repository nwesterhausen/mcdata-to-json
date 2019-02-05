# mcdata-to-json
Node.js module to process stats, playerdata, advancements and logs and output JSON.

## Usage
To generate json files from a minecraft server at /opt/minecraft and save them to /home/nick/mcjson:

`mcdata-to-json --minecraft="/opt/minecraft/" --outdir="/home/nick/mcjson"`

## Help Text

```
mcdata-to-json 0.0.2
A node.js module to turn the data from your minecraft server or world into json.

---- Usage ----
mcdata-to-json [Options]

---- Options ----
[--minecraft=] <minecraft dir>  | Directory containing the minecraft world
[--outdir=] <output dir>        | Directory to output JSON files to
[-v, --verbose]                 | Verbose, logs info messages
[-vvv, --debug]                 | Very verbose, logs debug & info messages
[-h, --help]                    | Show this message and exit
```
