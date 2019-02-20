"use strict";

var _Configuration = _interopRequireDefault(require("../Configuration"));

var _path = _interopRequireDefault(require("path"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var OUTPUT_DIR = path.join(_Configuration.default.WORK_DIR, 'generated'),
    JAVA_CMD = "java -cp ".concat(_Configuration.default.MCJAR_FILE, " net.minecraft.data.Main --server --output ").concat(OUTPUT_DIR);