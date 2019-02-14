import nbt from 'nbt';

let condenseNbt = function (nbtjson) {
    if (nbtjson.name === '' && nbtjson.hasOwnProperty('value')) {
        return condenseNbt(nbtjson.value);
    }

    let condensed = {};

    for (let key in nbtjson) {
        switch (nbtjson[key].type) {
            case 'compound':
                condensed[key] = condenseNbt(nbtjson[key].value);
                break;
            case 'list':
                condensed[key] = [];
                if (nbtjson[key].value.type === 'compound') {
                    nbtjson[key].value.value.map(function (listvalue) {
                        condensed[key].push(condenseNbt(listvalue));
                    });
                } else {
                    nbtjson[key].value.value.map(function (listvalue) {
                        condensed[key].push(listvalue);
                    });
                }
                break;
            default:
                condensed[key] = nbtjson[key].value;
                break;
        }
    }

    return condensed;
}

export default {
    condenseNbt,
    nbtToJson: function (filedata) {
        return new Promise(function (resolve, reject) {
            nbt.parse(filedata, function (err, nbtdata) {
                if (err) {
                    return reject(err);
                }
                let cleanNbt = condenseNbt(nbtdata);
                resolve(cleanNbt);
            });
        });
    }
};