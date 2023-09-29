import svgLayer from "./modules/renderers/svg.js";
import canvasAPI from "./modules/renderers/canvas.js";
import webglLayer from "./modules/renderers/webgl.js";
import geometry from "./modules/geometry.js";
import color from "./modules/colorMap.js";
import path from "./modules/path.js";
import queue from "./modules/queue.js";
import ease from "./modules/ease.js";
import chain from "./modules/chain.js";
import behaviour from "./modules/behaviour.js";
import utility from "./modules/utilities.js";

const pathIns = path.instance;
const canvasLayer = canvasAPI.canvasLayer;
const pdfLayer = canvasAPI.pdfLayer;
const CanvasNodeExe = canvasAPI.CanvasNodeExe;
const CanvasGradient = canvasAPI.CanvasGradient;
const createRadialGradient = canvasAPI.createRadialGradient;
const createLinearGradient = canvasAPI.createLinearGradient;
export { svgLayer };
export { canvasLayer };
export { pdfLayer };
export { webglLayer };
export { geometry };
export { color };
export { pathIns as Path };
export { queue };
export { ease };
export { chain };
export { behaviour };
export { utility };
export { CanvasNodeExe };
export { CanvasGradient };
export { createRadialGradient };
export { createLinearGradient };
