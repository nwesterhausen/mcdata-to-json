# Generated Tile Entity JSON

mcdata-to-json reads the .mca files and parses the tile entities.

Currently a few tile entity json files are created:

- overworld-inventories.json
- overworld-loot.json
- overworld-signs.json
- overworld-spawners.json
- overworld-te.json

`overworld-te.json` contains all tile entities (is a super set of the other overworld json files). It's an array of chunk contents, which has a key for each entitiy found in that chunk pointing to an array of those objects.

Each file is an array.

## Object Representation

Every object (either tile entity, block, or item) will have the following:

| Key | Value                                   |
| --- | --------------------------------------- |
| id  | Minecraft block ID for entity           |
| pos | Array of x, y, z coordinates for entity |

### Optional Keys

Additionaly, objects can have these properties (for better reference, [see the wiki](https://minecraft.gamepedia.com/Chunk_format#Entity_format))

| Key   | Value                              |
| ----- | ---------------------------------- |
| Items | Array of items stored in item      |
| Text  | Signs store array of text, 4 lines |
| Color | Sign text color                    |
| tag   | [Tag object](#tag-object)          |

### Tag Object

mcdata-to-json will simply turn the Tag entry into json.

[Wiki](https://minecraft.gamepedia.com/Player.dat_format#Item_structure)

## Examples

### Chest

```json
{
  "Items": [
    { "Slot": 0, "id": "minecraft:lily_pad", "Count": 10 },
    { "Slot": 4, "id": "minecraft:flint", "Count": 1 },
    { "Slot": 5, "id": "minecraft:bone", "Count": 2 },
    { "Slot": 6, "id": "minecraft:dark_oak_sign", "Count": 2 },
    { "Slot": 9, "id": "minecraft:dark_oak_slab", "Count": 3 },
    { "Slot": 12, "id": "minecraft:stick", "Count": 1 }
  ],
  "pos": [2328, 53, 634],
  "id": "minecraft:chest"
}
```

```json
{
  "Items": [
    {
      "Slot": 0,
      "id": "minecraft:iron_pickaxe",
      "tag": { "Damage": 0 },
      "Count": 1
    },
    { "Slot": 3, "id": "minecraft:black_wool", "Count": 1 },
    {
      "Slot": 4,
      "id": "minecraft:enchanted_book",
      "tag": { "StoredEnchantments": [{ "id": "minecraft:thorns", "lvl": 1 }] },
      "Count": 1
    },
    { "Slot": 5, "id": "minecraft:diorite", "Count": 1 },
    { "Slot": 6, "id": "minecraft:dark_oak_log", "Count": 8 },
    { "Slot": 16, "id": "minecraft:wheat", "Count": 55 },
    { "Slot": 17, "id": "minecraft:wheat_seeds", "Count": 39 },
    { "Slot": 18, "id": "minecraft:cooked_porkchop", "Count": 56 },
    { "Slot": 19, "id": "minecraft:white_wool", "Count": 1 },
    { "Slot": 26, "id": "minecraft:dark_oak_slab", "Count": 2 }
  ],
  "pos": [229, 63, 777],
  "id": "minecraft:chest"
}
```

### Furnace

```json
{
  "Items": [
    { "Slot": 1, "id": "minecraft:coal", "Count": 4 },
    { "Slot": 2, "id": "minecraft:cooked_beef", "Count": 34 }
  ],
  "pos": [229, 63, 773],
  "id": "minecraft:furnace"
}
```

### Sign

Would be found in `overworld-signs.json` and `overworld-te.json`

```json
{
  "Text": ["Line 1", "Line 2", "Line 3", "Line 4"],
  "Color": "black",
  "pos": [234, 14, 775]
}
```
