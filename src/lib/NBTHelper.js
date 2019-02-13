let condenseNBT = function(nbtjson) {
    let condensed = {};

    for (let key in nbtjson) {
        switch (nbtjson[key].type) {
            case 'compound':
                condensed[key] = condenseNBT(nbtjson[key].value);
                break;
            case 'list':
                condensed[key] = [];
                if (nbtjson[key].value.type !== 'end') {
                    for (let i in nbtjson[key].value.value) {
                        condensed[key].push(condenseNBT(nbtjson[key].value.value[i]));
                    }
                }
                break;
            default:
                condensed[key] = nbtjson[key].value;
                break;
        }
    }
    if (condensed.hasOwnProperty('x') && condensed.hasOwnProperty('y') && condensed.hasOwnProperty('z') ) {
        condensed.pos = [condensed.x, condensed.y, condensed.z];
    }
        
    return condensed;
};

export default {
    condenseNBT
};
