let condenseNBT = function(nbtjson) {
    let condensed = {};

    for (let key in nbtjson) {
        switch (nbtjson[key].type) {
            case 'compound':
                condensed[key] = condenseNBT(nbtjson[key].value);
                break;
            case 'list':
                condensed[key] = [];
                for (let n in nbtjson[key].value.value) {
                    condensed[key].push(condenseNBT(n));
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
