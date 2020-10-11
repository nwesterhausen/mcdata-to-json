# Generated Log JSON

mcdata-to-json reads the server logs and combines them all into a single **minecraft_logs.json** file.

## Log entry format

Each entry is an object, and the JSON file is an array of these objects.

| Key         | Value                                                                          |
| ----------- | ------------------------------------------------------------------------------ |
| timestamp   | Epoch timestamp for when the entry occured                                     |
| type        | [One of the log entry types](../lib/helpers/LogConst.js) (will have prefix `TYPE_`)                      |
| description | The content from the log message. [Special Cases](#special-description-values) |
| severity    | The given severity of the entry (INFO, WARN, ERROR)                            |

## Special Description Values
Some log entries are given special treatment in their description field. Normally the description is the log entry itself (without the timestamp and severity).

### Chat Messages

Will have `type` of `'chat'`.

Instead of text like `nwesterhausen> Hello guys` you will get an object as the description value:

```json
  {
    "timestamp": 1602083795620,
    "type": "chat",
    "description": { "player": "nwesterhausen", "chat": "Hello guys" },
    "severity": "INFO"
  }
```
