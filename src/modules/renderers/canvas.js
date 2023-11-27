import queue from "./../queue.js";
import VDom from "./../VDom.js";
import path from "./../path.js";
import geometry from "./../geometry.js";
import colorMap from "./../colorMap.js";
import Events from "./../events.js";
import behaviour from "./../behaviour.js";
import blobStream from "blob-stream-i2d/blob-stream.js";
import PDFDocument from "pdfkit/js/pdfkit.standalone.js";

import {
    NodePrototype,
    CollectionPrototype,
    layerResizeBind,
    layerResizeUnBind,
} from "./../coreApi.js";

const pdfSupportedFontFamily = [
    "Courier",
    "Courier-Bold",
    "Courier-Oblique",
    "Courier-BoldOblique",
    "Helvetica",
    "Helvetica-Bold",
    "Helvetica-Oblique",
    "Helvetica-BoldOblique",
    "Symbol",
    "Times-Roman",
    "Times-Bold",
    "Times-Italic",
    "Times-BoldItalic",
    "ZapfDingbats",
];

const pdfStyleMapper = {
    fillStyle: {
        prop: "fillColor",
        getValue: (val) => {
            return val;
        },
    },
    fill: {
        prop: "fillColor",
        getValue: (val) => {
            return val;
        },
    },
    strokeStyle: {
        prop: "strokeColor",
        getValue: (val) => {
            return val;
        },
    },
    stroke: {
        prop: "strokeColor",
        getValue: (val) => {
            return val;
        },
    },
    globalAlpha: {
        prop: "opacity",
        getValue: (val) => {
            return val;
        },
    },
    lineDash: {
        prop: "dash",
        getValue: (val) => {
            return val[0];
        },
    },
    textAlign: {
        prop: "align",
        getValue: (val) => {
            return val;
        },
    },
    font: {
        prop: "font",
        getValue: (val) => {
            const familyName = val.match(/\b[A-Za-z]+[0-9]*[A-Za-z0-9]*\b/gm);
            return familyName &&
                familyName.length > 0 &&
                pdfSupportedFontFamily.indexOf(familyName[0]) !== -1
                ? familyName[0]
                : "Helvetica";
        },
    },
};

const canvasCssMapper = {
    "fill": "fillStyle",
    "stroke": "strokeColor",
    "lineDash": "setLineDash",
    "opacity": "globalAlpha",
    "stroke-width": "lineWidth",
    "stroke-dasharray": "setLineDash",
};

const t2DGeometry = geometry;
const queueInstance = queue;
let Id = 0;

const zoomInstance = behaviour.zoom();
const dragInstance = behaviour.drag();

function domId() {
    Id += 1;
    return Id;
}

const CanvasCollection = function () {
    CollectionPrototype.apply(this, arguments);
};
CanvasCollection.prototype = new CollectionPrototype();
CanvasCollection.prototype.constructor = CanvasCollection;
CanvasCollection.prototype.createNode = function (ctx, config, vDomIndex) {
    return new CanvasNodeExe(ctx, config, domId(), vDomIndex);
};

function getPixlRatio(ctx) {
    const dpr = window.devicePixelRatio || 1;
    const bsr =
        ctx.webkitBackingStorePixelRatio ||
        ctx.mozBackingStorePixelRatio ||
        ctx.msBackingStorePixelRatio ||
        ctx.oBackingStorePixelRatio ||
        ctx.backingStorePixelRatio ||
        1;
    const ratio = dpr / bsr;
    return ratio < 1.0 ? 1.0 : ratio;
}

function domSetAttribute(attr, value) {
    if (value == null && this.attr[attr] != null) {
        delete this.attr[attr];
    } else {
        this.attr[attr] = value;
    }
}

function domSetStyle(attr, value) {
    if (value == null && this.style[attr] != null) {
        delete this.style[attr];
    } else {
        this.style[attr] = value;
    }
}

function cRenderPdf(attr, pdfCtx) {
    const self = this;

    if (self.abTranslate && this.nodeName !== "g") {
        const abTranslate = self.abTranslate || {};
        const { scale = [1, 1], skew = [0, 0], translate = [0, 0] } = abTranslate;
        const [hozScale = 1, verScale = hozScale] = scale;
        const [hozSkew = 0, verSkew = hozSkew] = skew;
        const [hozMove = 0, verMove = hozMove] = translate;

        pdfCtx.transform(hozScale, hozSkew, verSkew, verScale, hozMove, verMove);

        if (abTranslate.rotate && abTranslate.rotate.length > 0) {
            pdfCtx.translate(abTranslate.rotate[1] || 0, abTranslate.rotate[2] || 0);
            pdfCtx.rotate(abTranslate.rotate[0] * (Math.PI / 180));
            pdfCtx.translate(-abTranslate.rotate[1] || 0, -abTranslate.rotate[2] || 0);
        }
    }

    for (let i = 0; i < self.stack.length; i += 1) {
        self.stack[i].executePdf(pdfCtx);
    }
}

function cRender(attr) {
    const self = this;

    if (attr.transform) {
        const { transform } = attr;
        const { scale = [1, 1], skew = [0, 0], translate = [0, 0] } = transform;
        const [hozScale = 1, verScale = hozScale] = scale;
        const [hozSkew = 0, verSkew = hozSkew] = skew;
        const [hozMove = 0, verMove = hozMove] = translate;

        self.ctx.transform(hozScale, hozSkew, verSkew, verScale, hozMove, verMove);

        if (transform.rotate && transform.rotate.length > 0) {
            self.ctx.translate(transform.rotate[1] || 0, transform.rotate[2] || 0);
            self.ctx.rotate(transform.rotate[0] * (Math.PI / 180));
            self.ctx.translate(-transform.rotate[1] || 0, -transform.rotate[2] || 0);
        }
    }

    for (let i = 0; i < self.stack.length; i += 1) {
        self.stack[i].execute();
    }
}

function parseTransform(transform) {
    const output = {
        translateX: 0,
        translateY: 0,
        scaleX: 1,
        scaleY: 1,
    };

    if (transform) {
        if (transform.translate && transform.translate.length > 0) {
            output.translateX = transform.translate[0];
            output.translateY = transform.translate[1];
        }

        if (transform.scale && transform.scale.length > 0) {
            output.scaleX = transform.scale[0];
            output.scaleY = transform.scale[1] || output.scaleX;
        }
    }

    return output;
}

function RPolyupdateBBox() {
    const self = this;
    const { transform, points = [] } = self.attr;
    const { translateX, translateY, scaleX, scaleY } = parseTransform(transform);
    let abYposition = 0;

    if (points && points.length > 0) {
        let minX = points[0].x;
        let maxX = points[0].x;
        let minY = points[0].y;
        let maxY = points[0].y;

        for (let i = 1; i < points.length; i += 1) {
            if (minX > points[i].x) minX = points[i].x;
            if (maxX < points[i].x) maxX = points[i].x;
            if (minY > points[i].y) minY = points[i].y;
            if (maxY < points[i].y) maxY = points[i].y;
        }

        self.BBox = {
            x: translateX + minX * scaleX,
            y: translateY + minY * scaleY,
            width: (maxX - minX) * scaleX,
            height: (maxY - minY) * scaleY,
        };
        abYposition = minY;
    } else {
        self.BBox = {
            x: 0,
            y: 0,
            width: 0,
            height: 0,
        };
    }

    if (transform && transform.rotate) {
        self.BBoxHit = t2DGeometry.rotateBBox(this.BBox, transform);
    } else {
        self.BBoxHit = this.BBox;
    }

    self.abYposition = abYposition;
}

function CanvasGradient(config = {}, type = "linear") {
    this.config = config;
    this.type = type;
    this.dom = {};
    this.mode = !this.config.mode || this.config.mode === "percent" ? "percent" : "absolute";
}

CanvasGradient.prototype = new NodePrototype();

CanvasGradient.prototype.exe = function GRAexe(ctx, BBox) {
    if (this.type === "linear" && this.mode === "percent") {
        return this.linearGradient(ctx, BBox);
    } else if (this.type === "linear" && this.mode === "absolute") {
        return this.absoluteLinearGradient(ctx);
    } else if (this.type === "radial" && this.mode === "percent") {
        return this.radialGradient(ctx, BBox);
    } else if (this.type === "radial" && this.mode === "absolute") {
        return this.absoluteRadialGradient(ctx);
    } else {
        console.error("wrong Gradiant type");
    }
};

CanvasGradient.prototype.setAttr = function (attr, value) {
    this.config[attr] = value;
};

CanvasGradient.prototype.exePdf = function GRAexe(ctx, BBox, AABox) {
    if (this.type === "linear" && this.mode === "percent") {
        return this.linearGradientPdf(ctx, BBox, AABox);
    } else if (this.type === "linear" && this.mode === "absolute") {
        return this.absoluteLinearGradientPdf(ctx, AABox);
    } else if (this.type === "radial" && this.mode === "percent") {
        return this.radialGradientPdf(ctx, BBox, AABox);
    } else if (this.type === "radial" && this.mode === "absolute") {
        return this.absoluteRadialGradientPdf(ctx, AABox);
    } else {
        console.error("wrong Gradiant type");
    }
};

CanvasGradient.prototype.linearGradientPdf = function GralinearGradient(ctx, BBox, AABox) {
    const { translate = [0, 0] } = AABox;
    const lGradient = ctx.linearGradient(
        translate[0] + BBox.x + BBox.width * (this.config.x1 / 100),
        translate[1] + 0 + BBox.height * (this.config.y1 / 100),
        translate[0] + BBox.x + BBox.width * (this.config.x2 / 100),
        translate[1] + 0 + BBox.height * (this.config.y2 / 100)
    );
    (this.config.colorStops ?? []).forEach((d) => {
        lGradient.stop(d.offset / 100, d.color, d.opacity);
    });
    return lGradient;
};

CanvasGradient.prototype.linearGradient = function GralinearGradient(ctx, BBox) {
    const lGradient = ctx.createLinearGradient(
        BBox.x + BBox.width * (this.config.x1 / 100),
        BBox.y + BBox.height * (this.config.y1 / 100),
        BBox.x + BBox.width * (this.config.x2 / 100),
        BBox.y + BBox.height * (this.config.y2 / 100)
    );
    (this.config.colorStops ?? []).forEach((d) => {
        lGradient.addColorStop(d.offset / 100, d.color);
    });
    return lGradient;
};

CanvasGradient.prototype.absoluteLinearGradient = function absoluteGralinearGradient(ctx) {
    const lGradient = ctx.createLinearGradient(
        this.config.x1,
        this.config.y1,
        this.config.x2,
        this.config.y2
    );
    (this.config.colorStops ?? []).forEach((d) => {
        lGradient.addColorStop(d.offset, d.color);
    });
    return lGradient;
};

CanvasGradient.prototype.absoluteLinearGradientPdf = function absoluteGralinearGradient(
    ctx,
    AABox
) {
    const { translate = [0, 0] } = AABox;
    const lGradient = ctx.linearGradient(
        translate[0] + this.config.x1,
        translate[1] + this.config.y1,
        translate[0] + this.config.x2,
        translate[1] + this.config.y2
    );
    (this.config.colorStops ?? []).forEach((d) => {
        lGradient.stop(d.offset, d.color, d.opacity);
    });
    return lGradient;
};

CanvasGradient.prototype.radialGradient = function GRAradialGradient(ctx, BBox) {
    const { innerCircle = {}, outerCircle = {} } = this.config;
    const cGradient = ctx.createRadialGradient(
        BBox.x + BBox.width * (innerCircle.x / 100),
        BBox.y + BBox.height * (innerCircle.y / 100),
        BBox.width > BBox.height
            ? (BBox.width * innerCircle.r) / 100
            : (BBox.height * innerCircle.r) / 100,
        BBox.x + BBox.width * (outerCircle.x / 100),
        BBox.y + BBox.height * (outerCircle.y / 100),
        BBox.width > BBox.height
            ? (BBox.width * outerCircle.r) / 100
            : (BBox.height * outerCircle.r) / 100
    );
    (this.config.colorStops ?? []).forEach((d) => {
        cGradient.addColorStop(d.offset / 100, d.color);
    });
    return cGradient;
};

CanvasGradient.prototype.radialGradientPdf = function GRAradialGradient(ctx, BBox, AABox) {
    const { translate = [0, 0] } = AABox;
    const { innerCircle = {}, outerCircle = {} } = this.config;
    const cGradient = ctx.radialGradient(
        translate[0] + BBox.x + BBox.width * (innerCircle.x / 100),
        translate[1] + 0 + BBox.height * (innerCircle.y / 100),
        innerCircle.r,
        translate[0] + BBox.x + BBox.width * (outerCircle.x / 100),
        translate[1] + 0 + BBox.height * (outerCircle.y / 100),
        outerCircle.r2
    );
    (this.config.colorStops ?? []).forEach((d) => {
        cGradient.stop(d.offset / 100, d.color, d.opacity);
    });
    return cGradient;
};

CanvasGradient.prototype.absoluteRadialGradient = function absoluteGraradialGradient(ctx, BBox) {
    const { innerCircle = {}, outerCircle = {} } = this.config;
    const cGradient = ctx.createRadialGradient(
        innerCircle.x,
        innerCircle.y,
        innerCircle.r,
        outerCircle.x,
        outerCircle.y,
        outerCircle.r
    );
    (this.config.colorStops ?? []).forEach((d) => {
        cGradient.addColorStop(d.offset / 100, d.color);
    });
    return cGradient;
};

CanvasGradient.prototype.absoluteRadialGradientPdf = function absoluteGraradialGradient(
    ctx,
    BBox,
    AABox
) {
    const { translate = [0, 0] } = AABox;
    const { innerCircle = {}, outerCircle = {} } = this.config;
    const cGradient = ctx.radialGradient(
        translate[0] + innerCircle.x,
        translate[1] + innerCircle.y,
        innerCircle.r,
        translate[0] + outerCircle.x,
        translate[1] + outerCircle.y,
        outerCircle.r
    );
    (this.config.colorStops ?? []).forEach((d) => {
        cGradient.stop(d.offset / 100, d.color);
    });
    return cGradient;
};

CanvasGradient.prototype.colorStops = function GRAcolorStops(colorStopValues) {
    if (Object.prototype.toString.call(colorStopValues) !== "[object Array]") {
        return false;
    }

    this.config.colorStops = colorStopValues;
    return this;
};

function createLinearGradient(config) {
    return new CanvasGradient(config, "linear");
}

function createRadialGradient(config) {
    return new CanvasGradient(config, "radial");
}

function PixelObject(data, width, height) {
    this.imageData = data;
    this.width = width;
    this.height = height;
    // this.x = x;
    // this.y = y;
}

PixelObject.prototype.get = function (pos) {
    const pixels = this.imageData ? this.imageData.pixels : [];
    const rIndex = (pos.y - 1) * (this.width * 4) + (pos.x - 1) * 4;
    return (
        "rgba(" +
        pixels[rIndex] +
        ", " +
        pixels[rIndex + 1] +
        ", " +
        pixels[rIndex + 2] +
        ", " +
        pixels[rIndex + 3] +
        ")"
    );
};

PixelObject.prototype.put = function (pos, color) {
    const rIndex = (pos.y - 1) * (this.width * 4) + (pos.x - 1) * 4;
    this.imageData.pixels[rIndex] = color[0];
    this.imageData.pixels[rIndex + 1] = color[1];
    this.imageData.pixels[rIndex + 2] = color[2];
    this.imageData.pixels[rIndex + 3] = color[3];
    return this;
};

// function pixels (pixHndlr) {
//  const tObj = this.rImageObj ? this.rImageObj : this.imageObj;
//  const tCxt = tObj.getContext('2d');
//  const pixelData = tCxt.getImageData(0, 0, this.attr.width, this.attr.height);
//  return pixHndlr(pixelData);
// }

function CanvasMask(self, config = {}) {
    const maskId = config.id ? config.id : "mask-" + Math.ceil(Math.random() * 1000);
    this.config = config;
    this.mask = new CanvasNodeExe(
        self.dom.ctx,
        {
            el: "g",
            attr: {
                id: maskId,
            },
        },
        domId(),
        self.vDomIndex
    );
}

CanvasMask.prototype.setAttr = function (attr, value) {
    this.config[attr] = value;
};

CanvasMask.prototype.exe = function () {
    this.mask.execute();
    this.mask.dom.ctx.globalCompositeOperation =
        this.config.globalCompositeOperation || "destination-atop";
    return true;
};

function createCanvasMask(maskConfig) {
    return new CanvasMask(this, maskConfig);
}

function CanvasClipping(self, config = {}) {
    const clipId = config.id ? config.id : "clip-" + Math.ceil(Math.random() * 1000);
    this.clip = new CanvasNodeExe(
        self.dom.ctx,
        {
            el: "g",
            attr: {
                id: clipId,
            },
        },
        domId(),
        self.vDomIndex
    );
}

CanvasClipping.prototype.exe = function () {
    this.clip.execute();
    this.clip.dom.ctx.clip();
    return true;
};

function createCanvasClip(patternConfig) {
    return new CanvasClipping(this, patternConfig);
}

function CanvasPattern(self, config = {}, width = 0, height = 0) {
    const selfSelf = this;
    const patternId = config.id ? config.id : "pattern-" + Math.ceil(Math.random() * 1000);
    this.repeatInd = config.repeat ? config.repeat : "repeat";
    selfSelf.pattern = canvasLayer(
        null,
        {},
        {
            enableEvents: false,
            enableResize: false,
        }
    );
    selfSelf.pattern.setSize(width, height);

    selfSelf.pattern.setAttr("id", patternId);
    self.prependChild([selfSelf.pattern]);
    selfSelf.pattern.vDomIndex = self.vDomIndex + ":" + patternId;
    selfSelf.pattern.onChange(function () {
        selfSelf.patternObj = self.ctx.createPattern(selfSelf.pattern.domEl, selfSelf.repeatInd);
    });
}

CanvasPattern.prototype.repeat = function (repeat) {
    this.repeatInd = repeat;
};

CanvasPattern.prototype.exe = function () {
    return this.patternObj;
};

function createCanvasPattern(patternConfig, width = 0, height = 0) {
    return new CanvasPattern(this, patternConfig, width, height);
}

function applyStyles() {
    if (this.ctx.fillStyle !== "#000000") {
        this.ctx.fill();
    }

    if (this.ctx.strokeStyle !== "#000000") {
        this.ctx.stroke();
    }
}

function applyStylesPdf(pdfCtx) {
    const fillColor = this.style.fillStyle ?? this.style.fill ?? this.style.fillColor;
    const strokeColor = this.style.stroke ?? this.style.strokeStyle ?? this.style.strokeColor;
    if (fillColor && strokeColor) {
        pdfCtx.fillAndStroke(fillColor, strokeColor);
    } else if (fillColor) {
        pdfCtx.fill();
    } else if (strokeColor) {
        pdfCtx.stroke();
    }
}

function executePdf() {
    // body...
}

function CanvasDom() {
    this.BBox = {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
    };
    this.BBoxHit = {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
    };
}

CanvasDom.prototype = {
    render: cRender,
    renderPdf: cRenderPdf,
    // on: addListener,
    setAttr: domSetAttribute,
    setStyle: domSetStyle,
    applyStyles,
    applyStylesPdf,
    executePdf,
};

function imageInstance(self) {
    const imageIns = new Image();
    imageIns.crossOrigin = "anonymous";

    imageIns.onload = function onload() {
        // self.attr.height = self.attr.height ? self.attr.height : this.height;
        // self.attr.width = self.attr.width ? self.attr.width : this.width;
        self.attr.height = self.attr.height
            ? self.attr.height
            : (self.attr.width / this.naturalWidth) * this.naturalHeight;
        self.attr.width = self.attr.width
            ? self.attr.width
            : (self.attr.height / this.naturalHeight) * this.naturalWidth;
        self.imageObj = this;

        if (self.nodeExe.attr.onload && typeof self.nodeExe.attr.onload === "function") {
            self.nodeExe.attr.onload.call(self.nodeExe, self.image);
        }

        self.nodeExe.BBoxUpdate = true;
        queueInstance.vDomChanged(self.nodeExe.vDomIndex);
    };

    imageIns.onerror = function onerror(error) {
        if (self.nodeExe.attr.onerror && typeof self.nodeExe.attr.onerror === "function") {
            self.nodeExe.attr.onerror.call(self.nodeExe, error);
        }
    };

    return imageIns;
}

function DummyDom(ctx, props, styleProps) {
    const self = this;
    self.ctx = ctx;
    self.nodeName = "dummy";
    self.attr = props;
    self.style = styleProps;
    self.stack = [self];
    return this;
}

DummyDom.prototype = new CanvasDom();
DummyDom.prototype.constructor = DummyDom;

function RenderImage(ctx, props, stylesProps, onloadExe, onerrorExe, nodeExe) {
    const self = this;
    self.ctx = ctx;
    self.attr = props;
    self.style = stylesProps;
    self.nodeName = "Image";
    self.nodeExe = nodeExe;

    for (const key in props) {
        this.setAttr(key, props[key]);
    }

    queueInstance.vDomChanged(nodeExe.vDomIndex);
    self.stack = [self];
}

RenderImage.prototype = new CanvasDom();
RenderImage.prototype.constructor = RenderImage;

RenderImage.prototype.setAttr = function RIsetAttr(attr, value) {
    const self = this;

    if (attr === "src") {
        if (typeof value === "string") {
            self.image = self.image ? self.image : imageInstance(self);
            if (self.image.src !== value) {
                self.image.src = value;
            }
        } else if (
            value instanceof HTMLImageElement ||
            value instanceof SVGImageElement ||
            value instanceof HTMLCanvasElement
        ) {
            self.imageObj = value;
            // self.postProcess();
            self.attr.height = self.attr.height ? self.attr.height : value.height;
            self.attr.width = self.attr.width ? self.attr.width : value.width;
        } else if (value instanceof CanvasNodeExe || value instanceof RenderTexture) {
            self.imageObj = value.domEl;
            // self.postProcess();
            self.attr.height = self.attr.height ? self.attr.height : value.attr.height;
            self.attr.width = self.attr.width ? self.attr.width : value.attr.width;
        }
    }
    this.attr[attr] = value;

    // if (attr === "clip") {
    //     this.clipImage();
    // }

    // if (attr === "pixels") {
    //     this.pixelsUpdate();
    // }

    queueInstance.vDomChanged(this.nodeExe.vDomIndex);
};

// RenderImage.prototype.postProcess = function () {
//     let self = this;
//     if (self.attr.clip) {
//         self.clipImage();
//     }

//     if (self.attr.pixels) {
//         self.pixelsUpdate();
//     }
// };

// RenderImage.prototype.clipImage = function () {
//     let self = this;
//     if (!self.imageObj) {
//         return;
//     }
//     if (!self.rImageObj) {
//         self.rImageObj = getCanvasImgInstance(self.attr.width, self.attr.height);
//     }

//     const ctxX = self.rImageObj.context;
//     const { clip, width = 0, height = 0 } = self.attr;
//     let { sx = 0, sy = 0, swidth = width, sheight = height } = clip;

//     ctxX.clearRect(0, 0, width, height);
//     ctxX.drawImage(this.imageObj, sx, sy, swidth, sheight, 0, 0, width, height);
// };

// RenderImage.prototype.pixelsUpdate = function () {
//     let self = this;
//     let ctxX;
//     let pixels;

//     if (!this.imageObj) {
//         return;
//     }

//     const { width = 0, height = 0 } = self.attr;

//     if (!self.rImageObj) {
//         self.rImageObj = getCanvasImgInstance(width, height);
//         ctxX = self.rImageObj.context;
//         ctxX.drawImage(self.imageObj, 0, 0, width, height);
//     } else {
//         ctxX = self.rImageObj.context;
//         // ctxX.drawImage(self.imageObj, 0, 0, width, height);
//     }
//     pixels = ctxX.getImageData(0, 0, width, height);

//     // ctxX.clearRect(0, 0, width, height);
//     // ctxX.clearRect(0, 0, width, height);
//     ctxX.putImageData(self.attr.pixels(pixels), 0, 0);
// };

RenderImage.prototype.updateBBox = function RIupdateBBox() {
    const self = this;
    const { transform, x = 0, y = 0, width = 0, height = 0 } = self.attr;
    const { translateX, translateY, scaleX, scaleY } = parseTransform(transform);

    self.BBox = {
        x: (translateX + x) * scaleX,
        y: (translateY + y) * scaleY,
        width: width * scaleX,
        height: height * scaleY,
    };

    if (transform && transform.rotate) {
        self.BBoxHit = t2DGeometry.rotateBBox(this.BBox, transform);
    } else {
        self.BBoxHit = this.BBox;
    }

    self.abYposition = y;
};

RenderImage.prototype.execute = function RIexecute() {
    const { width = 0, height = 0, x = 0, y = 0 } = this.attr;

    if (this.imageObj) {
        // this.ctx.drawImage(this.rImageObj ? this.rImageObj.canvas : this.imageObj, x, y, width, height);
        this.ctx.drawImage(this.imageObj, x, y, width, height);
    }
};

RenderImage.prototype.updateABBox = function updateABBox(ab) {
    const { x = 0, y = 0 } = this.attr;
    this.abTranslate = {
        translate: [ab.translate[0] + x, ab.translate[1] + y],
    };
};

RenderImage.prototype.executePdf = function RIexecute(pdfCtx) {
    const { width = 0, height = 0, x = 0, y = 0 } = this.attr;
    if (this.attr.src) {
        pdfCtx.translate(0, -this.abYposition);
        // this.ctx.drawImage(this.rImageObj ? this.rImageObj.canvas : this.imageObj, x, y, width, height);
        pdfCtx.image(this.attr.src, x, y, { width, height });
    }
};

RenderImage.prototype.applyStyles = function RIapplyStyles() {};

RenderImage.prototype.in = function RIinfun(co) {
    const { width = 0, height = 0, x = 0, y = 0 } = this.attr;
    return co.x >= x && co.x <= x + width && co.y >= y && co.y <= y + height;
};

function RenderText(ctx, props, stylesProps) {
    const self = this;
    self.ctx = ctx;
    self.attr = props;
    self.style = stylesProps;
    self.nodeName = "text";
    self.stack = [self];
    self.textHeight = 0;
    self.height = 1;
    if (self.attr.width && self.attr.text) {
        this.fitWidth();
    }
}

RenderText.prototype = new CanvasDom();
RenderText.prototype.constructor = RenderText;

RenderText.prototype.setAttr = function (attr, value) {
    if (value == null && this.attr[attr] != null) {
        delete this.attr[attr];
    } else {
        this.attr[attr] = value;
        if ((attr === "width" || attr === "text") && this.attr.width && this.attr.text) {
            this.fitWidth();
        }
    }
};

RenderText.prototype.fitWidth = function () {
    if (this.style.font) {
        this.ctx.font = this.style.font;
    }
    const width = this.attr.width;
    const textListByLine = this.attr.text.toString().split("\n");
    const textSubStrs = [];
    let strLit = "";
    let i = 0;
    const textList = textListByLine.reduce((p, c) => {
        const sstr = c.split(/( )/g);

        sstr.forEach((d) => {
            if (this.ctx.measureText(d).width < width) {
                p.push(d);
            } else {
                p = p.concat(d.match(new RegExp(".{1,1}", "g")));
            }
        });
        p.push("\n");
        return p;
    }, []);
    while (i < textList.length) {
        if (textList[i] === "\n") {
            textSubStrs.push(strLit);
            strLit = " ";
        } else {
            if (this.ctx.measureText(strLit + textList[i]).width < width) {
                strLit = strLit + textList[i];
            } else {
                if (strLit && strLit.length > 0 && strLit !== " ") {
                    textSubStrs.push(strLit);
                }
                strLit = textList[i];
            }
        }
        i++;
    }
    if (strLit && strLit !== " ") {
        textSubStrs.push(strLit);
    }

    this.textList = textSubStrs;
};

RenderText.prototype.text = function RTtext(value) {
    this.attr.text = value;
    if (this.attr.width) {
        this.fitWidth();
    }
};

RenderText.prototype.updateABBox = function updateABBox(ab) {
    const { x = 0, y = 0 } = this.attr;
    this.abTranslate = {
        translate: [ab.translate[0] + x, ab.translate[1] + y],
    };
};

RenderText.prototype.updateBBox = function RTupdateBBox() {
    const self = this;
    let height = 1;
    let width = 0;
    let { x = 0, y = 0, transform } = self.attr;
    const { translateX, translateY, scaleX, scaleY } = parseTransform(transform);

    if (this.style.font) {
        this.ctx.font = this.style.font;
        height = parseInt(this.style.font.replace(/[^\d.]/g, ""), 10) || 1;
        self.textHeight = height + 3;
    } else {
        self.textHeight = this.ctx.measureText("I2Djs").fontBoundingBoxAscent;
        height = self.textHeight + 7;
    }
    if (this.attr.width && this.textList && this.textList.length > 0) {
        width = this.attr.width;
        height = height * this.textList.length;
    } else {
        width = this.ctx.measureText(this.attr.text).width;
    }

    if (this.style.textAlign === "center") {
        x -= width / 2;
    } else if (this.style.textAlign === "right") {
        x -= width;
    }

    self.width = width;
    self.height = height;
    self.x = x;
    self.y = y;

    self.BBox = {
        x: (translateX + x) * scaleX,
        y: (translateY + y) * scaleY,
        width: width * scaleX,
        height: height * scaleY,
    };

    self.abYposition = y;

    if (transform && transform.rotate) {
        self.BBoxHit = t2DGeometry.rotateBBox(this.BBox, transform);
    } else {
        self.BBoxHit = this.BBox;
    }
};

RenderText.prototype.execute = function RTexecute() {
    if (this.attr.text !== undefined && this.attr.text !== null) {
        if (this.textList && this.textList.length > 0) {
            for (var i = 0; i < this.textList.length; i++) {
                if (this.ctx.fillStyle !== "#000000") {
                    this.ctx.fillText(
                        this.textList[i],
                        this.attr.x,
                        this.attr.y + this.textHeight * (i + 1)
                    );
                }

                if (this.ctx.strokeStyle !== "#000000") {
                    this.ctx.strokeText(
                        this.textList[i],
                        this.attr.x,
                        this.attr.y + this.textHeight * (i + 1)
                    );
                }
            }
        } else {
            if (this.ctx.fillStyle !== "#000000") {
                this.ctx.fillText(this.attr.text, this.attr.x, this.attr.y + this.height);
            }

            if (this.ctx.strokeStyle !== "#000000") {
                this.ctx.strokeText(this.attr.text, this.attr.x, this.attr.y + this.height);
            }
        }
    }
};

RenderText.prototype.executePdf = function RTexecute(pdfCtx) {
    if (this.attr.text !== undefined && this.attr.text !== null) {
        if (this.style.font) {
            // parseInt(this.style.font.replace(/[^\d.]/g, ""), 10) || 1
            pdfCtx.fontSize(parseInt(this.style.font.replace(/[^\d.]/g, ""), 10) || 10);
        }
        const alignVlaue = this.style.align ?? this.style.textAlign;

        const styleObect = {
            ...(this.attr.width && { width: this.attr.width }),
            ...(this.style.lineGap && { lineGap: this.style.lineGap }),
            ...(this.style.textBaseline && { textBaseline: this.style.textBaseline }),
            ...(alignVlaue && { align: alignVlaue }),
        };
        if (this.style.fillStyle || this.style.fill || this.style.fillColor) {
            pdfCtx.text(this.attr.text, this.attr.x, 0, styleObect);
        }

        if (this.style.strokeStyle || this.style.stroke || this.style.strokeColor) {
            pdfCtx.text(this.attr.text, this.attr.x, 0, styleObect);
        }
    }
};

// RenderText.prototype.applyStyles = function RTapplyStyles() {};

RenderText.prototype.in = function RTinfun(co) {
    const { x = 0, y = 0, width = 0, height = 0 } = this;
    return co.x >= x && co.x <= x + width && co.y >= y && co.y <= y + height;
};
/** ***************** Render Circle */

const RenderCircle = function RenderCircle(ctx, props, stylesProps) {
    const self = this;
    self.ctx = ctx;
    self.attr = props;
    self.style = stylesProps;
    self.nodeName = "circle";
    self.stack = [self];
};

RenderCircle.prototype = new CanvasDom();
RenderCircle.prototype.constructor = RenderCircle;

RenderCircle.prototype.updateBBox = function RCupdateBBox() {
    const self = this;
    const { transform, r = 0, cx = 0, cy = 0 } = self.attr;
    const { translateX, translateY, scaleX, scaleY } = parseTransform(transform);

    self.BBox = {
        x: translateX + (cx - r) * scaleX,
        y: translateY + (cy - r) * scaleY,
        width: 2 * r * scaleX,
        height: 2 * r * scaleY,
    };

    if (transform && transform.rotate) {
        self.BBoxHit = t2DGeometry.rotateBBox(this.BBox, transform);
    } else {
        self.BBoxHit = this.BBox;
    }

    self.abYposition = cy;
};
RenderCircle.prototype.updateABBox = function updateABBox(ab) {
    const { cx = 0, cy = 0 } = this.attr;
    this.abTranslate = {
        translate: [ab.translate[0] + cx, ab.translate[1] + cy],
    };
};

RenderCircle.prototype.execute = function RCexecute() {
    const { r = 0, cx = 0, cy = 0 } = this.attr;
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, r, 0, 2 * Math.PI, false);
    this.applyStyles();
    this.ctx.closePath();
};

RenderCircle.prototype.executePdf = function RCexecute(pdfCtx) {
    const { r = 0, cx = 0, cy = 0 } = this.attr;
    pdfCtx.translate(0, -this.abYposition);
    pdfCtx.circle(parseInt(cx), parseInt(cy), parseInt(r));
    this.applyStylesPdf(pdfCtx);
};

RenderCircle.prototype.in = function RCinfun(co, eventType) {
    const { r = 0, cx = 0, cy = 0 } = this.attr;
    const tr = Math.sqrt((co.x - cx) * (co.x - cx) + (co.y - cy) * (co.y - cy));
    return tr <= r;
};

const RenderLine = function RenderLine(ctx, props, stylesProps) {
    const self = this;
    self.ctx = ctx;
    self.attr = props;
    self.style = stylesProps;
    self.nodeName = "line";
    self.stack = [self];
};

RenderLine.prototype = new CanvasDom();
RenderLine.prototype.constructor = RenderLine;

RenderLine.prototype.updateBBox = function RLupdateBBox() {
    const self = this;
    const { transform, x1 = 0, y1 = 0, x2 = 0, y2 = 0 } = self.attr;
    const { translateX, translateY, scaleX, scaleY } = parseTransform(transform);

    self.BBox = {
        x: translateX + (x1 < x2 ? x1 : x2) * scaleX,
        y: translateY + (y1 < y2 ? y1 : y2) * scaleY,
        width: Math.abs(x2 - x1) * scaleX,
        height: Math.abs(y2 - y1) * scaleY,
    };

    if (transform && transform.rotate) {
        self.BBoxHit = t2DGeometry.rotateBBox(this.BBox, transform);
    } else {
        self.BBoxHit = this.BBox;
    }
    self.abYposition = y1 < y2 ? y1 : y2;
};

RenderLine.prototype.updateABBox = function updateABBox(ab) {
    // let { cx = 0, cy = 0 } = this.attr;
    // this.abTranslate = {
    //     translate: [ab.translate[0] + cx, ab.translate[1] + cy]
    // }
};

RenderLine.prototype.execute = function RLexecute() {
    const { ctx } = this;
    const { x1 = 0, y1 = 0, x2 = 0, y2 = 0 } = this.attr;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    this.applyStyles();
    ctx.closePath();
};

RenderLine.prototype.executePdf = function RLexecute(pdfCtx) {
    const { x1 = 0, y1 = 0, x2 = 0, y2 = 0 } = this.attr;
    pdfCtx.translate(0, -this.abYposition);
    pdfCtx.moveTo(x1, y1);
    pdfCtx.lineTo(x2, y2);
    pdfCtx.stroke();
};

RenderLine.prototype.in = function RLinfun(co) {
    const { x1 = 0, y1 = 0, x2 = 0, y2 = 0 } = this.attr;
    return (
        parseFloat(
            t2DGeometry.getDistance(
                {
                    x: x1,
                    y: y1,
                },
                co
            ) +
                t2DGeometry.getDistance(co, {
                    x: x2,
                    y: y2,
                })
        ).toFixed(1) ===
        parseFloat(
            t2DGeometry.getDistance(
                {
                    x: x1,
                    y: y1,
                },
                {
                    x: x2,
                    y: y2,
                }
            )
        ).toFixed(1)
    );
};

function RenderPolyline(ctx, props, stylesProps) {
    const self = this;
    self.ctx = ctx;
    self.attr = props;
    self.style = stylesProps;
    self.nodeName = "polyline";
    self.stack = [self];
}

RenderPolyline.prototype = new CanvasDom();
RenderPolyline.constructor = RenderPolyline;

RenderPolyline.prototype.execute = function polylineExe() {
    const self = this;
    let d;
    if (!this.attr.points || this.attr.points.length === 0) return;
    this.ctx.beginPath();
    self.ctx.moveTo(this.attr.points[0].x, this.attr.points[0].y);
    for (var i = 1; i < this.attr.points.length; i++) {
        d = this.attr.points[i];
        self.ctx.lineTo(d.x, d.y);
    }
    this.applyStyles();
    this.ctx.closePath();
};

RenderPolyline.prototype.executePdf = function polylineExe(pdfCtx) {
    let d;
    if (!this.attr.points || this.attr.points.length === 0) return;

    pdfCtx.translate(0, -this.abYposition);

    pdfCtx.moveTo(this.attr.points[0].x, this.attr.points[0].y);
    for (var i = 1; i < this.attr.points.length; i++) {
        d = this.attr.points[i];
        pdfCtx.lineTo(d.x, d.y);
    }
    pdfCtx.stroke();
};

RenderPolyline.prototype.updateBBox = RPolyupdateBBox;

RenderPolyline.prototype.in = function RPolyLinfun(co) {
    let flag = false;

    for (let i = 0, len = this.attr.points.length; i <= len - 2; i++) {
        const p1 = this.attr.points[i];
        const p2 = this.attr.points[i + 1];
        flag =
            flag ||
            parseFloat(
                t2DGeometry.getDistance(
                    {
                        x: p1.x,
                        y: p1.y,
                    },
                    co
                ) +
                    t2DGeometry.getDistance(co, {
                        x: p2.x,
                        y: p2.y,
                    })
            ).toFixed(1) ===
                parseFloat(
                    t2DGeometry.getDistance(
                        {
                            x: p1.x,
                            y: p1.y,
                        },
                        {
                            x: p2.x,
                            y: p2.y,
                        }
                    )
                ).toFixed(1);
    }

    return flag;
};
/** ***************** Render Path */

const RenderPath = function RenderPath(ctx, props, styleProps) {
    const self = this;
    self.ctx = ctx;
    self.angle = 0;
    self.nodeName = "path";
    self.attr = props;
    self.style = styleProps;

    if (self.attr.d) {
        if (path.isTypePath(self.attr.d)) {
            self.path = self.attr.d;
            self.attr.d = self.attr.d.fetchPathString();
        } else {
            self.path = path.instance(self.attr.d);
        }

        self.pathNode = new Path2D(self.attr.d);
    }

    self.stack = [self];
    return self;
};

RenderPath.prototype = new CanvasDom();
RenderPath.prototype.constructor = RenderPath;

RenderPath.prototype.updateBBox = function RPupdateBBox() {
    const self = this;
    const { transform } = self.attr;
    const { translateX, translateY, scaleX, scaleY } = parseTransform(transform);

    // if (transform && transform.translate) {
    //  [translateX, translateY] = transform.translate;
    // }

    // if (transform && transform.scale) {
    //  [scaleX = 1, scaleY = scaleX] = transform.scale;
    // }

    self.BBox = self.path
        ? self.path.BBox
        : {
              x: 0,
              y: 0,
              width: 0,
              height: 0,
          };
    self.abYposition = self.BBox.y;
    self.BBox.x = translateX + self.BBox.x * scaleX;
    self.BBox.y = translateY + self.BBox.y * scaleY;
    self.BBox.width *= scaleX;
    self.BBox.height *= scaleY;

    if (transform && transform.rotate) {
        self.BBoxHit = t2DGeometry.rotateBBox(this.BBox, transform);
    } else {
        self.BBoxHit = this.BBox;
    }
};

RenderPath.prototype.setAttr = function RPsetAttr(attr, value) {
    this.attr[attr] = value;

    if (attr === "d") {
        if (path.isTypePath(value)) {
            this.path = value;
            this.attr.d = value.fetchPathString();
        } else {
            this.path = path.instance(this.attr.d);
        }

        this.pathNode = new Path2D(this.attr.d);
    }
};

RenderPath.prototype.getPointAtLength = function RPgetPointAtLength(len) {
    return this.path
        ? this.path.getPointAtLength(len)
        : {
              x: 0,
              y: 0,
          };
};

RenderPath.prototype.getAngleAtLength = function RPgetAngleAtLength(len) {
    return this.path ? this.path.getAngleAtLength(len) : 0;
};

RenderPath.prototype.getTotalLength = function RPgetTotalLength() {
    return this.path ? this.path.getTotalLength() : 0;
};

RenderPath.prototype.execute = function RPexecute() {
    if (this.attr.d) {
        if (this.ctx.fillStyle !== "#000000" || this.ctx.strokeStyle !== "#000000") {
            if (this.ctx.fillStyle !== "#000000") {
                this.ctx.fill(this.pathNode);
            }

            if (this.ctx.strokeStyle !== "#000000") {
                this.ctx.stroke(this.pathNode);
            }
        } else {
            this.path.execute(this.ctx);
        }
    }
};

RenderPath.prototype.executePdf = function RPexecute(pdfCtx) {
    if (this.attr.d) {
        pdfCtx.translate(0, -this.abYposition);
        pdfCtx.path(this.attr.d);
        this.applyStylesPdf(pdfCtx);
    }
};

RenderPath.prototype.applyStyles = function RPapplyStyles() {};

RenderPath.prototype.in = function RPinfun(co) {
    let flag = false;

    if (!(this.attr.d && this.pathNode)) {
        return flag;
    }

    this.ctx.save();
    this.ctx.scale(1 / this.ctx.pixelRatio, 1 / this.ctx.pixelRatio);
    flag = this.ctx.isPointInPath(this.pathNode, co.x, co.y);
    this.ctx.restore();

    return flag;
};
/** *****************End Render Path */

/** ***************** Render polygon */

function polygonExe(points) {
    if (Object.prototype.toString.call(points) !== "[object Array]") {
        console.error("Points expected as array [{x: , y:}]");
        return;
    }
    if (points && points.length === 0) {
        return;
    }

    const polygon = new Path2D();
    polygon.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
        polygon.lineTo(points[i].x, points[i].y);
    }
    polygon.closePath();

    return {
        path: polygon,
        points: points,
        rawPoints: points.map((d) => {
            return [d.x, d.y];
        }),
        execute: function (ctx) {
            ctx.beginPath();
            const points = this.points;
            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i].x, points[i].y);
            }
            ctx.closePath();
        },
    };
}

const RenderPolygon = function RenderPolygon(ctx, props, styleProps) {
    const self = this;
    self.ctx = ctx;
    self.nodeName = "polygon";
    self.attr = props;
    self.style = styleProps;
    self.stack = [self];

    if (self.attr.points) {
        self.polygon = polygonExe(self.attr.points);
    }

    return this;
};

RenderPolygon.prototype = new CanvasDom();
RenderPolygon.prototype.constructor = RenderPolygon;

RenderPolygon.prototype.setAttr = function RPolysetAttr(attr, value) {
    this.attr[attr] = value;

    if (attr === "points") {
        this.polygon = polygonExe(this.attr.points);
        if (this.polygon) {
            this.attr.points = this.polygon.points;
        }
    }
};

RenderPolygon.prototype.updateBBox = RPolyupdateBBox;

RenderPolygon.prototype.execute = function RPolyexecute() {
    if (!this.polygon) {
        return;
    }
    if (this.ctx.fillStyle !== "#000000" || this.ctx.strokeStyle !== "#000000") {
        if (this.ctx.fillStyle !== "#000000") {
            this.ctx.fill(this.polygon.path);
        }

        if (this.ctx.strokeStyle !== "#000000") {
            this.ctx.stroke(this.polygon.path);
        }
    } else {
        this.polygon.execute(this.ctx);
    }
};

RenderPolygon.prototype.executePdf = function RPolyexecute(pdfCtx) {
    if (!this.polygon) {
        return;
    }
    pdfCtx.translate(0, -this.abYposition);
    pdfCtx.polygon(...this.polygon.rawPoints);
    this.applyStylesPdf(pdfCtx);
};

RenderPolygon.prototype.applyStyles = function RPolyapplyStyles() {};

RenderPolygon.prototype.in = function RPolyinfun(co) {
    let flag = false;

    if (!this.polygon) {
        return false;
    }

    this.ctx.save();
    this.ctx.scale(1 / this.ctx.pixelRatio, 1 / this.ctx.pixelRatio);
    flag = this.style.fillStyle ? this.ctx.isPointInPath(this.polygon.path, co.x, co.y) : flag;
    this.ctx.restore();
    return flag;
};
/** ***************** Render polygon */

/** ***************** Render ellipse */

const RenderEllipse = function RenderEllipse(ctx, props, styleProps) {
    const self = this;
    self.ctx = ctx;
    self.nodeName = "ellipse";
    self.attr = props;
    self.style = styleProps;
    self.stack = [self];
    return this;
};

RenderEllipse.prototype = new CanvasDom();
RenderEllipse.prototype.constructor = RenderEllipse;

RenderEllipse.prototype.updateBBox = function REupdateBBox() {
    const self = this;
    const { transform, cx = 0, cy = 0, rx = 0, ry = 0 } = self.attr;
    const { translateX, translateY, scaleX, scaleY } = parseTransform(transform);

    self.BBox = {
        x: translateX + (cx - rx) * scaleX,
        y: translateY + (cy - ry) * scaleY,
        width: rx * 2 * scaleX,
        height: ry * 2 * scaleY,
    };

    if (transform && transform.rotate) {
        self.BBoxHit = t2DGeometry.rotateBBox(this.BBox, transform);
    } else {
        self.BBoxHit = this.BBox;
    }

    this.abYposition = cy - ry;
};

RenderEllipse.prototype.execute = function REexecute() {
    const ctx = this.ctx;
    const { cx = 0, cy = 0, rx = 0, ry = 0 } = this.attr;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
    this.applyStyles();
    ctx.closePath();
};

RenderEllipse.prototype.executePdf = function REexecute(pdfCtx) {
    const { cx = 0, cy = 0, rx = 0, ry = 0 } = this.attr;
    pdfCtx.translate(0, -this.abYposition);
    pdfCtx.ellipse(cx, cy, rx, ry);
    this.applyStylesPdf(pdfCtx);
};

RenderEllipse.prototype.in = function REinfun(co) {
    const { cx = 0, cy = 0, rx = 0, ry = 0 } = this.attr;
    return ((co.x - cx) * (co.x - cx)) / (rx * rx) + ((co.y - cy) * (co.y - cy)) / (ry * ry) <= 1;
};
/** ***************** Render ellipse */

/** ***************** Render Rect */

const RenderRect = function RenderRect(ctx, props, styleProps) {
    const self = this;
    self.ctx = ctx;
    self.nodeName = "rect";
    self.attr = props;
    self.style = styleProps;
    self.stack = [self];
    return this;
};

RenderRect.prototype = new CanvasDom();
RenderRect.prototype.constructor = RenderRect;

RenderRect.prototype.updateABBox = function updateABBox(ab) {
    const { x = 0, y = 0 } = this.attr;
    this.abTranslate = {
        translate: [ab.translate[0] + x, ab.translate[1] + y],
    };
};

RenderRect.prototype.updateBBox = function RRupdateBBox() {
    const self = this;
    const { transform, x = 0, y = 0, width = 0, height = 0 } = self.attr;
    const { translateX, translateY, scaleX, scaleY } = parseTransform(transform);

    self.BBox = {
        x: translateX + x * scaleX,
        y: translateY + y * scaleY,
        width: width * scaleX,
        height: height * scaleY,
    };

    if (transform && transform.rotate) {
        self.BBoxHit = t2DGeometry.rotateBBox(this.BBox, transform);
    } else {
        self.BBoxHit = this.BBox;
    }

    self.abYposition = y;
};

// RenderRect.prototype.applyStyles = function rStyles() {};

function renderRoundRect(ctx, attr) {
    const { x = 0, y = 0, width = 0, height = 0, rx = 0, ry = 0 } = attr;

    ctx.beginPath();
    ctx.moveTo(x + rx, y);
    ctx.lineTo(x + width - rx, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + ry);
    ctx.lineTo(x + width, y + height - ry);
    ctx.quadraticCurveTo(x + width, y + height, x + width - rx, y + height);
    ctx.lineTo(x + rx, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - ry);
    ctx.lineTo(x, y + ry);
    ctx.quadraticCurveTo(x, y, x + rx, y);
    ctx.closePath();
}

function renderRoundRectPdf(ctx, attr) {
    const { x = 0, y = 0, width = 0, height = 0, rx = 0, ry = 0 } = attr;

    ctx.moveTo(x + rx, y);
    ctx.lineTo(x + width - rx, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + ry);
    ctx.lineTo(x + width, y + height - ry);
    ctx.quadraticCurveTo(x + width, y + height, x + width - rx, y + height);
    ctx.lineTo(x + rx, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - ry);
    ctx.lineTo(x, y + ry);
    ctx.quadraticCurveTo(x, y, x + rx, y);
}

RenderRect.prototype.executePdf = function RRexecute(pdfCtx) {
    const { x = 0, y = 0, width = 0, height = 0, rx = 0, ry = 0 } = this.attr;
    pdfCtx.translate(0, -this.abYposition);
    if (!rx && !ry) {
        pdfCtx.rect(x, y, width, height);
    } else {
        renderRoundRectPdf(pdfCtx, {
            x,
            y,
            width,
            height,
            rx,
            ry,
        });
    }

    this.applyStylesPdf(pdfCtx);
};

RenderRect.prototype.execute = function RRexecute() {
    const ctx = this.ctx;
    const { x = 0, y = 0, width = 0, height = 0, rx = 0, ry = 0 } = this.attr;

    if (ctx.fillStyle !== "#000000" || ctx.strokeStyle !== "#000000") {
        if (ctx.fillStyle !== "#000000") {
            if (!rx && !ry) {
                ctx.fillRect(x, y, width, height);
            } else {
                renderRoundRect(ctx, {
                    x,
                    y,
                    width,
                    height,
                    rx,
                    ry,
                });
                ctx.fill();
            }
        }

        if (ctx.strokeStyle !== "#000000") {
            if (!rx && !ry) {
                ctx.strokeRect(x, y, width, height);
            } else {
                renderRoundRect(ctx, {
                    x,
                    y,
                    width,
                    height,
                    rx,
                    ry,
                });
                ctx.stroke();
            }
        }
    } else {
        // ctx.rect(x, y, width, height);
    }
};

RenderRect.prototype.in = function RRinfun(co) {
    const { x = 0, y = 0, width = 0, height = 0 } = this.attr;
    return co.x >= x && co.x <= x + width && co.y >= y && co.y <= y + height;
};
/** ***************** Render Rect */

/** ***************** Render Group */

const RenderGroup = function RenderGroup(ctx, props, styleProps) {
    const self = this;
    self.nodeName = "g";
    self.ctx = ctx;
    self.attr = props;
    self.style = styleProps;
    self.stack = new Array(0);
    return this;
};

RenderGroup.prototype = new CanvasDom();
RenderGroup.prototype.constructor = RenderGroup;

RenderGroup.prototype.updateBBox = function RGupdateBBox(children) {
    const self = this;
    let minX;
    let maxX;
    let minY;
    let maxY;
    const { transform } = self.attr;
    const { translateX, translateY, scaleX, scaleY } = parseTransform(transform);
    self.BBox = {};

    if (children && children.length > 0) {
        let d;
        let boxX;
        let boxY;

        for (let i = 0; i < children.length; i += 1) {
            d = children[i];
            boxX = d.dom.BBoxHit.x;
            boxY = d.dom.BBoxHit.y;
            minX = minX === undefined ? boxX : minX > boxX ? boxX : minX;
            minY = minY === undefined ? boxY : minY > boxY ? boxY : minY;
            maxX =
                maxX === undefined
                    ? boxX + d.dom.BBoxHit.width
                    : maxX < boxX + d.dom.BBoxHit.width
                    ? boxX + d.dom.BBoxHit.width
                    : maxX;
            maxY =
                maxY === undefined
                    ? boxY + d.dom.BBoxHit.height
                    : maxY < boxY + d.dom.BBoxHit.height
                    ? boxY + d.dom.BBoxHit.height
                    : maxY;
        }
    }

    minX = minX === undefined ? 0 : minX;
    minY = minY === undefined ? 0 : minY;
    maxX = maxX === undefined ? 0 : maxX;
    maxY = maxY === undefined ? 0 : maxY;
    self.BBox.x = translateX + minX * scaleX;
    self.BBox.y = translateY + minY * scaleY;
    self.BBox.width = Math.abs(maxX - minX) * scaleX;
    self.BBox.height = Math.abs(maxY - minY) * scaleY;

    if (self.attr.transform && self.attr.transform.rotate) {
        self.BBoxHit = t2DGeometry.rotateBBox(this.BBox, this.attr.transform);
    } else {
        self.BBoxHit = this.BBox;
    }
};

RenderGroup.prototype.child = function RGchild(obj) {
    const self = this;
    const objLocal = obj;

    if (objLocal instanceof CanvasNodeExe) {
        objLocal.dom.parent = self;
        objLocal.vDomIndex = self.vDomIndex;
        self.stack[self.stack.length] = objLocal;
    } else if (objLocal instanceof CanvasCollection) {
        objLocal.stack.forEach((d) => {
            d.dom.parent = self;
            d.vDomIndex = self.vDomIndex;
            self.stack[self.stack.length] = d;
        });
    } else {
        console.log("wrong Object");
    }
};

RenderGroup.prototype.in = function RGinfun(coOr) {
    const self = this;
    const co = {
        x: coOr.x,
        y: coOr.y,
    };
    const { BBox } = this;
    const { transform } = self.attr;
    const { translateX, translateY, scaleX, scaleY } = parseTransform(transform);

    return (
        co.x >= (BBox.x - translateX) / scaleX &&
        co.x <= (BBox.x - translateX + BBox.width) / scaleX &&
        co.y >= (BBox.y - translateY) / scaleY &&
        co.y <= (BBox.y - translateY + BBox.height) / scaleY
    );
};

/** ***************** End Render Group */

const CanvasNodeExe = function CanvasNodeExe(context, config, id, vDomIndex) {
    this.style = config.style || {};
    this.setStyle(config.style);
    this.attr = config.attr || {};
    this.id = id;
    this.nodeName = config.el;
    this.nodeType = "CANVAS";
    this.children = [];
    this.events = {};
    this.ctx = context;
    this.vDomIndex = vDomIndex;
    this.bbox = config.bbox !== undefined ? config.bbox : true;
    this.BBoxUpdate = true;

    switch (config.el) {
        case "circle":
            this.dom = new RenderCircle(this.ctx, this.attr, this.style);
            break;

        case "rect":
            this.dom = new RenderRect(this.ctx, this.attr, this.style);
            break;

        case "line":
            this.dom = new RenderLine(this.ctx, this.attr, this.style);
            break;

        case "polyline":
            this.dom = new RenderPolyline(this.ctx, this.attr, this.style);
            break;

        case "path":
            this.dom = new RenderPath(this.ctx, this.attr, this.style);
            break;

        case "group":
        case "g":
            this.dom = new RenderGroup(this.ctx, this.attr, this.style);
            break;

        case "text":
            this.dom = new RenderText(this.ctx, this.attr, this.style);
            break;

        case "image":
            this.dom = new RenderImage(
                this.ctx,
                this.attr,
                this.style,
                config.onload,
                config.onerror,
                this
            );
            break;

        // case "sprite":
        //     this.dom = new RenderSprite(
        //         this.ctx,
        //         this.attr,
        //         this.style,
        //         config.onload,
        //         config.onerror,
        //         this
        //     );
        //     break;

        case "polygon":
            this.dom = new RenderPolygon(this.ctx, this.attr, this.style, this);
            break;

        case "ellipse":
            this.dom = new RenderEllipse(this.ctx, this.attr, this.style, this);
            break;

        default:
            this.dom = new DummyDom(this.ctx, this.attr, this.style);
            this.bbox = false;
            this.BBoxUpdate = false;
            break;
    }

    this.dom.nodeExe = this;

    // if (config.style) {
    //  this.setStyle(config.style);
    // }

    // if (config.attr) {
    //  this.setAttr(config.attr);
    // }
};

CanvasNodeExe.prototype = new NodePrototype();

CanvasNodeExe.prototype.node = function Cnode() {
    this.updateBBox();
    return this.dom;
};

CanvasNodeExe.prototype.stylesExe = function CstylesExe() {
    let value;
    let key;
    const style = this.style;

    this.resolvedStyle = {};

    for (key in style) {
        if (typeof style[key] === "string" || typeof style[key] === "number") {
            value = style[key];
        } else if (typeof style[key] === "object") {
            if (
                style[key] instanceof CanvasGradient ||
                style[key] instanceof CanvasPattern ||
                style[key] instanceof CanvasClipping ||
                style[key] instanceof CanvasMask
            ) {
                value = style[key].exe(this.ctx, this.dom.BBox);
            } else {
                value = style[key];
            }
        } else if (typeof style[key] === "function") {
            style[key] = style[key].call(this, this.dataObj);
            value = style[key];
        } else {
            console.log("unkonwn Style");
        }

        if (canvasCssMapper[key]) {
            key = canvasCssMapper[key];
        }

        if (typeof this.ctx[key] !== "function") {
            this.ctx[key] = value;
        } else if (typeof this.ctx[key] === "function") {
            this.ctx[key](value);
        } else {
            console.log("junk comp");
        }
        this.resolvedStyle[key] = value;
    }
};

CanvasNodeExe.prototype.stylesExePdf = function CstylesExe(pdfCtx) {
    if (!pdfCtx) return;
    const style = this.style;
    let value;
    for (let key in style) {
        if (typeof style[key] === "string" || typeof style[key] === "number") {
            value = style[key];
        } else if (typeof style[key] === "object") {
            if (
                style[key] instanceof CanvasGradient ||
                style[key] instanceof CanvasPattern ||
                style[key] instanceof CanvasClipping ||
                style[key] instanceof CanvasMask
            ) {
                value = style[key].exePdf(pdfCtx, this.dom.BBox, this.dom.abTranslate);
            } else {
                value = style[key];
            }
        } else if (typeof style[key] === "function") {
            style[key] = style[key].call(this, this.dataObj);
            value = style[key];
        } else {
            console.log("unkonwn Style");
        }

        if (pdfStyleMapper[key]) {
            value = pdfStyleMapper[key].getValue(value);
            key = pdfStyleMapper[key].prop;
        }

        if ((key === "fillColor" || key === "strokeColor") && typeof value === "string") {
            value = colorMap.colorToRGBPdf(value);
        }

        if (typeof pdfCtx[key] !== "function") {
            pdfCtx[key] = value;
        } else if (typeof pdfCtx[key] === "function") {
            pdfCtx[key](value);
        } else {
            console.log("junk comp");
        }
    }
};

CanvasNodeExe.prototype.remove = function Cremove() {
    const { children } = this.dom.parent;
    const index = children.indexOf(this);

    if (index !== -1) {
        children.splice(index, 1);
    }

    this.dom.parent.BBoxUpdate = true;
    queueInstance.vDomChanged(this.vDomIndex);
};

CanvasNodeExe.prototype.attributesExe = function CattributesExe() {
    this.dom.render(this.attr);
};

CanvasNodeExe.prototype.attributesExePdf = function CattributesExe(pdfCtx) {
    this.dom.renderPdf(this.attr, pdfCtx);
};

CanvasNodeExe.prototype.setStyle = function CsetStyle(attr, value) {
    if (arguments.length === 2) {
        if (value == null && this.style[attr] != null) {
            delete this.style[attr];
        } else {
            this.style[attr] = valueCheck(value);
        }
    } else if (arguments.length === 1 && typeof attr === "object") {
        const styleKeys = Object.keys(attr);

        for (let i = 0, len = styleKeys.length; i < len; i += 1) {
            if (attr[styleKeys[i]] == null && this.style[styleKeys[i]] != null) {
                delete this.style[styleKeys[i]];
            } else {
                this.style[styleKeys[i]] = valueCheck(attr[styleKeys[i]]);
            }
        }
    }

    queueInstance.vDomChanged(this.vDomIndex);
    return this;
};

function valueCheck(value) {
    if (colorMap.RGBAInstanceCheck(value)) {
        value = value.rgba;
    }

    return value === "#000" || value === "#000000" || value === "black" ? "#010101" : value;
}

CanvasNodeExe.prototype.setAttr = function CsetAttr(attr, value) {
    if (arguments.length === 2) {
        if (value == null && this.attr[attr] != null) {
            delete this.attr[attr];
        } else {
            this.attr[attr] = value;
        }
        this.dom.setAttr(attr, value);
    } else if (arguments.length === 1 && typeof attr === "object") {
        const keys = Object.keys(attr);

        for (let i = 0; i < keys.length; i += 1) {
            if (attr[keys[i]] == null && this.attr[keys[i]] != null) {
                delete this.attr[keys[i]];
            } else {
                this.attr[keys[i]] = attr[keys[i]];
            }
            this.dom.setAttr(keys[i], attr[keys[i]]);
        }
    }

    this.BBoxUpdate = true;
    queueInstance.vDomChanged(this.vDomIndex);
    return this;
};

CanvasNodeExe.prototype.rotate = function Crotate(angle, x, y) {
    if (!this.attr.transform) {
        this.attr.transform = {};
    }

    if (Object.prototype.toString.call(angle) === "[object Array]") {
        this.attr.transform.rotate = [angle[0] || 0, angle[1] || 0, angle[2] || 0];
    } else {
        this.attr.transform.rotate = [angle, x || 0, y || 0];
    }

    this.dom.setAttr("transform", this.attr.transform);
    this.BBoxUpdate = true;
    queueInstance.vDomChanged(this.vDomIndex);
    return this;
};

CanvasNodeExe.prototype.scale = function Cscale(XY) {
    if (!this.attr.transform) {
        this.attr.transform = {};
    }

    if (XY.length < 1) {
        return null;
    }

    this.attr.transform.scale = [XY[0], XY[1] ? XY[1] : XY[0]];
    this.dom.setAttr("transform", this.attr.transform);
    this.BBoxUpdate = true;
    queueInstance.vDomChanged(this.vDomIndex);
    return this;
};

CanvasNodeExe.prototype.translate = function Ctranslate(XY) {
    if (!this.attr.transform) {
        this.attr.transform = {};
    }

    this.attr.transform.translate = XY;
    this.dom.setAttr("transform", this.attr.transform);
    this.BBoxUpdate = true;
    queueInstance.vDomChanged(this.vDomIndex);
    return this;
};

CanvasNodeExe.prototype.skewX = function CskewX(x) {
    if (!this.attr.transform) {
        this.attr.transform = {};
    }
    if (!this.attr.transform.skew) {
        this.attr.transform.skew = [];
    }

    this.attr.transform.skew[0] = x;
    this.dom.setAttr("transform", this.attr.transform);
    this.BBoxUpdate = true;
    queueInstance.vDomChanged(this.vDomIndex);
    return this;
};

CanvasNodeExe.prototype.skewY = function CskewY(y) {
    if (!this.attr.transform) {
        this.attr.transform = {};
    }
    if (!this.attr.transform.skew) {
        this.attr.transform.skew = [];
    }

    this.attr.transform.skew[1] = y;
    this.dom.setAttr("transform", this.attr.transform);
    this.BBoxUpdate = true;
    queueInstance.vDomChanged(this.vDomIndex);
    return this;
};

CanvasNodeExe.prototype.execute = function Cexecute() {
    if (this.style.display === "none") {
        return;
    }
    this.ctx.save();
    this.stylesExe();
    this.attributesExe();
    if (this.dom instanceof RenderGroup) {
        for (let i = 0, len = this.children.length; i < len; i += 1) {
            this.children[i].execute();
        }
    }
    this.ctx.restore();
};

CanvasNodeExe.prototype.executePdf = function Cexecute(pdfCtx) {
    if (this.style.display === "none") {
        return;
    }
    if (!(this.dom instanceof RenderGroup)) {
        pdfCtx.save();
    }

    this.stylesExePdf(pdfCtx);
    this.attributesExePdf(pdfCtx);
    if (this.dom instanceof RenderGroup) {
        for (let i = 0, len = this.children.length; i < len; i += 1) {
            this.children[i].executePdf(pdfCtx);
        }
    }

    if (!(this.dom instanceof RenderGroup)) {
        pdfCtx.restore();
    }
};

CanvasNodeExe.prototype.prependChild = function child(childrens) {
    const self = this;
    const childrensLocal = childrens;

    if (self.dom instanceof RenderGroup) {
        for (let i = 0; i < childrensLocal.length; i += 1) {
            childrensLocal[i].dom.parent = self;
            childrensLocal[i].vDomIndex = self.vDomIndex;
            self.children.unshift(childrensLocal[i]);
        }
    } else {
        console.error("Trying to insert child to nonGroup Element");
    }

    this.BBoxUpdate = true;
    queueInstance.vDomChanged(this.vDomIndex);
    return self;
};

CanvasNodeExe.prototype.child = function child(childrens) {
    const self = this;
    const childrensLocal = childrens;

    if (self.dom instanceof RenderGroup) {
        for (let i = 0; i < childrensLocal.length; i += 1) {
            childrensLocal[i].dom.parent = self;
            childrensLocal[i].vDomIndex = self.vDomIndex;
            self.children[self.children.length] = childrensLocal[i];
        }
    } else {
        console.error("Trying to insert child to nonGroup Element");
    }

    this.BBoxUpdate = true;
    queueInstance.vDomChanged(this.vDomIndex);
    return self;
};

CanvasNodeExe.prototype.updateBBox = function CupdateBBox() {
    let status;

    if (this.bbox) {
        for (let i = 0, len = this.children.length; i < len; i += 1) {
            if (this.children[i] && this.children[i].updateBBox) {
                status = this.children[i].updateBBox() || status;
            }
        }
        if (this.BBoxUpdate || status) {
            this.dom.updateBBox(this.children);
            this.BBoxUpdate = false;
            return true;
        }
    }

    return false;
};

CanvasNodeExe.prototype.updateABBox = function updateABBox(transform = { translate: [0, 0] }) {
    const localTransform = this.attr.transform || { translate: [0, 0] };
    const abTranslate = {
        translate: [
            transform.translate[0] + localTransform.translate[0],
            transform.translate[1] + localTransform.translate[1],
        ],
    };
    this.dom.abTranslate = abTranslate;

    // this.setAttr("abTranslate", this.abTranslate);
    if (this.dom instanceof RenderGroup) {
        for (let i = 0, len = this.children.length; i < len && this.children[i]; i += 1) {
            this.children[i].updateABBox(abTranslate);
        }
    } else {
        // this.dom.updateABBox(abTranslate);
    }
};

CanvasNodeExe.prototype.in = function Cinfun(co) {
    return this.dom.in(co);
};

CanvasNodeExe.prototype.on = function Con(eventType, hndlr) {
    const self = this;
    // this.dom.on(eventType, hndlr);
    if (!this.events) {
        this.events = {};
    }

    if (!hndlr && this.events[eventType]) {
        delete this.events[eventType];
    } else if (hndlr) {
        if (typeof hndlr === "function") {
            const hnd = hndlr.bind(self);
            this.events[eventType] = function (event) {
                hnd(event);
            };
        } else if (typeof hndlr === "object") {
            this.events[eventType] = hndlr;
            if (
                hndlr.constructor === zoomInstance.constructor ||
                hndlr.constructor === dragInstance.constructor
            ) {
                hndlr.bindMethods(this);
            }
        }
    }

    return this;
};

CanvasNodeExe.prototype.animatePathTo = path.animatePathTo;
CanvasNodeExe.prototype.morphTo = path.morphTo;
CanvasNodeExe.prototype.vDomIndex = null;

CanvasNodeExe.prototype.createRadialGradient = createRadialGradient;
CanvasNodeExe.prototype.createLinearGradient = createLinearGradient;
// CanvasNodeExe.prototype

CanvasNodeExe.prototype.createEls = function CcreateEls(data, config) {
    const e = new CanvasCollection(
        {
            type: "CANVAS",
            ctx: this.dom.ctx,
        },
        data,
        config,
        this.vDomIndex
    );
    this.child(e.stack);
    queueInstance.vDomChanged(this.vDomIndex);
    return e;
};

CanvasNodeExe.prototype.text = function Ctext(value) {
    if (this.dom instanceof RenderText) {
        this.dom.text(value);
    }

    queueInstance.vDomChanged(this.vDomIndex);
    return this;
};

CanvasNodeExe.prototype.createEl = function CcreateEl(config) {
    const e = new CanvasNodeExe(this.dom.ctx, config, domId(), this.vDomIndex);
    this.child([e]);
    queueInstance.vDomChanged(this.vDomIndex);
    return e;
};

CanvasNodeExe.prototype.removeChild = function CremoveChild(obj) {
    let index = -1;
    this.children.forEach((d, i) => {
        if (d === obj) {
            index = i;
        }
    });

    if (index !== -1) {
        const removedNode = this.children.splice(index, 1)[0];
        this.dom.removeChild(removedNode.dom);
    }

    this.BBoxUpdate = true;
    queueInstance.vDomChanged(this.vDomIndex);
};

CanvasNodeExe.prototype.getBBox = function () {
    return {
        x: this.dom.BBox.x,
        y: this.dom.BBox.y,
        width: this.dom.BBox.width,
        height: this.dom.BBox.height,
    };
};

CanvasNodeExe.prototype.getPixels = function () {
    const imageData = this.ctx.getImageData(
        this.dom.BBox.x,
        this.dom.BBox.y,
        this.dom.BBox.width,
        this.dom.BBox.height
    );
    const pixelInstance = new PixelObject(imageData, this.dom.BBox.width, this.dom.BBox.height);

    return pixelInstance;
    // this.ctx.getImageData(this.dom.BBox.x, this.dom.BBox.y, this.dom.BBox.width, this.dom.BBox.height);
};

CanvasNodeExe.prototype.putPixels = function (pixels) {
    if (!(pixels instanceof PixelObject)) {
        return;
    }
    return this.ctx.putImageData(pixels.imageData, this.dom.BBox.x, this.dom.BBox.y);
};

function GetCanvasImgInstance(width, height) {
    const canvas = document.createElement("canvas");
    canvas.setAttribute("height", height);
    canvas.setAttribute("width", width);
    this.canvas = canvas;
    this.context = this.canvas.getContext("2d");
}

GetCanvasImgInstance.prototype.setAttr = function (attr, value) {
    if (attr === "height") {
        this.canvas.setAttribute("height", value);
    } else if (attr === "width") {
        this.canvas.setAttribute("width", value);
    }
};

function textureImageInstance(self, url) {
    const imageIns = new Image();
    imageIns.crossOrigin = "anonymous";
    imageIns.src = url;
    if (!self) {
        return imageIns;
    }
    imageIns.onload = function onload() {
        if (!self) {
            return;
        }
        if (self.attr) {
            const width =
                !self.attr.width && !self.attr.height
                    ? this.naturalWidth
                    : self.attr.width
                    ? self.attr.width
                    : (self.attr.height / this.naturalHeight) * this.naturalWidth;
            const height =
                !self.attr.width && !self.attr.height
                    ? this.naturalHeight
                    : self.attr.height
                    ? self.attr.height
                    : (self.attr.width / this.naturalWidth) * this.naturalHeight;

            self.attr.height = height;
            self.attr.width = width;
        }
        if (self instanceof RenderTexture) {
            self.setSize(self.attr.width, self.attr.height);
        }
        self.imageObj = this;

        if (self.attr && self.attr.onload && typeof self.attr.onload === "function") {
            self.attr.onload.call(self, self.image);
        }
        if (self.asyncOnLoad && typeof self.asyncOnLoad === "function") {
            self.asyncOnLoad(self.image);
        }

        postProcess(self);
    };

    imageIns.onerror = function onerror(error) {
        console.error(error);
        if (self.nodeExe.attr.onerror && typeof self.nodeExe.attr.onerror === "function") {
            self.nodeExe.attr.onerror.call(self.nodeExe, error);
        }
        if (self.asyncOnLoad && typeof self.asyncOnLoad === "function") {
            self.asyncOnLoad(self.image);
        }
    };
    return imageIns;
}

function postProcess(self) {
    if (!self.imageObj) {
        return;
    }
    if (self.attr && self.attr.clip) {
        clipExec(self);
    } else {
        self.execute();
    }

    if (self.attr && self.attr.filter) {
        filterExec(self);
    }
    queueInstance.vDomChanged(self.nodeExe.vDomIndex);
}

function clipExec(self) {
    const ctxX = self.ctx;
    const { clip, width = 0, height = 0 } = self.attr;
    const { sx = 0, sy = 0, swidth = width, sheight = height } = clip;

    ctxX.clearRect(0, 0, width, height);
    ctxX.drawImage(self.imageObj, sx, sy, swidth, sheight, 0, 0, width, height);
}

function filterExec(self) {
    const ctxX = self.ctx;
    const { width = 0, height = 0 } = self.attr;

    const pixels = ctxX.getImageData(0, 0, width, height);
    ctxX.putImageData(self.attr.filter(pixels), 0, 0);
}

function RenderTexture(nodeExe, config = {}) {
    const self = this;
    self.attr = Object.assign({}, config.attr) || {};
    self.style = Object.assign({}, config.style) || {};
    const scale = self.attr.scale || 1;
    self.rImageObj = new GetCanvasImgInstance(
        (self.attr.width || 1) * scale,
        (self.attr.height || 1) * scale
    );
    self.ctx = self.rImageObj.context;
    self.domEl = self.rImageObj.canvas;
    self.imageArray = [];
    self.seekIndex = 0;
    // self.attr = props;
    self.nodeName = "Sprite";
    self.nodeExe = nodeExe;

    for (const key in self.attr) {
        self.setAttr(key, self.attr[key]);
    }

    queueInstance.vDomChanged(nodeExe.vDomIndex);
    // self.stack = [self];
}
RenderTexture.prototype = new NodePrototype();
RenderTexture.prototype.constructor = RenderTexture;

RenderTexture.prototype.setSize = function (w, h) {
    const scale = this.attr.scale || 1;
    this.rImageObj.setAttr("width", w * scale);
    this.rImageObj.setAttr("height", h * scale);
    postProcess(this);
};

RenderTexture.prototype.setAttr = function RSsetAttr(attr, value) {
    const self = this;

    if (attr === "src") {
        if (Array.isArray(value)) {
            const srcPromises = value.map(function (d) {
                return new Promise((resolve, reject) => {
                    const imageInstance = textureImageInstance(null, d);
                    imageInstance.onload = function () {
                        resolve(this);
                    };
                    imageInstance.onerror = function (error) {
                        reject(error);
                    };
                });
            });
            Promise.all(srcPromises).then(function (images) {
                self.image = images;
                self.imageObj = images[self.seekIndex];
                if (self.attr && self.attr.onload && typeof self.attr.onload === "function") {
                    self.attr.onload.call(self, images);
                }
                if (self.asyncOnLoad && typeof self.asyncOnLoad === "function") {
                    self.asyncOnLoad(images);
                }

                postProcess(self);
            });
        } else if (typeof value === "string") {
            if (!self.image) {
                self.image = textureImageInstance(self, value);
            }
            if (self.image.src !== value) {
                self.image.src = value;
            }
        } else if (
            value instanceof HTMLImageElement ||
            value instanceof SVGImageElement ||
            value instanceof HTMLCanvasElement
        ) {
            self.imageObj = value;
            self.attr.height = self.attr.height ? self.attr.height : value.height;
            self.attr.width = self.attr.width ? self.attr.width : value.width;
            postProcess(self);
        } else if (value instanceof CanvasNodeExe || value instanceof RenderTexture) {
            self.imageObj = value.domEl;
            self.attr.height = self.attr.height ? self.attr.height : value.attr.height;
            self.attr.width = self.attr.width ? self.attr.width : value.attr.width;
            postProcess(self);
        }
    }
    this.attr[attr] = value;

    if (attr === "height" || attr === "width") {
        this.rImageObj.setAttr(attr, value);
        postProcess(self);
    }

    if (attr === "clip" || attr === "filter") {
        postProcess(self);
    }
    return self;
};

RenderTexture.prototype.onLoad = function (exec) {
    this.asyncOnLoad = exec;
};

RenderTexture.prototype.clone = function () {
    const attr = Object.assign({}, this.attr);
    const style = Object.assign({}, this.style);
    attr.src = this;
    return new RenderTexture(this.nodeExe, {
        attr: attr,
        style: style,
    });
};

RenderTexture.prototype.execute = function RIexecute() {
    const { width = 0, height = 0 } = this.attr;
    const draw = this.attr.draw || {};
    const scale = this.attr.scale || 1;

    this.ctx.clearRect(0, 0, width * scale, height * scale);
    this.ctx.drawImage(
        this.imageObj,
        draw.x || 0,
        draw.y || 0,
        (draw.width || width) * scale,
        (draw.height || height) * scale
    );
};

RenderTexture.prototype.exportAsDataUrl = function (type = "image/png", encoderOptions = 1) {
    if (this.rImageObj) {
        return this.rImageObj.canvas.toDataURL(type, encoderOptions);
    }
    return this;
};

RenderTexture.prototype.next = function (index) {
    if (!Array.isArray(this.image)) {
        return;
    }
    if (index < this.image.length && index >= 0) {
        this.seekIndex = index;
    } else if (this.seekIndex < this.image.length - 1) {
        this.seekIndex++;
    }
    this.imageObj = this.image[this.seekIndex];
    postProcess(this);
};

function createPage(ctx, vDomIndex) {
    const root = new CanvasNodeExe(
        ctx,
        {
            el: "g",
            attr: {
                id: "rootNode",
            },
        },
        domId(),
        vDomIndex
    );

    root.setStyle = function (prop, value) {
        this.domEl.style[prop] = value;
    };

    root.addDependentLayer = function (layer) {
        if (!(layer instanceof CanvasNodeExe)) {
            return;
        }
        const depId = layer.attr.id ? layer.attr.id : "dep-" + Math.ceil(Math.random() * 1000);
        layer.setAttr("id", depId);
        layer.vDomIndex = this.vDomIndex + ":" + depId;
        this.prependChild([layer]);
    };

    root.toDataURL = function (p) {
        return this.domEl.toDataURL(p);
    };

    root.invokeOnChange = function () {};

    root.setViewBox = function (x, y, height, width) {};

    root.setContext = function (prop, value) {
        /** Expecting value to be array if multiple aruments */
        if (this.ctx[prop] && typeof this.ctx[prop] === "function") {
            this.ctx[prop].apply(null, value);
        } else if (this.ctx[prop]) {
            this.ctx[prop] = value;
        }
    };

    root.createPattern = createCanvasPattern;

    root.createClip = createCanvasClip;

    root.createMask = createCanvasMask;

    root.clear = function () {};

    root.flush = function () {
        this.children = [];
        queueInstance.vDomChanged(this.vDomIndex);
    };

    root.update = function executeUpdate() {
        this.execute();
    };

    function getAllLeafs(node) {
        const leaves = [];
        let queue = [node];

        while (queue.length !== 0) {
            const node = queue.shift();
            if (
                node.children &&
                node.children.length === 0 &&
                node.nodeName !== "g" &&
                node.nodeName !== "group"
            ) {
                leaves.push(node);
            } else {
                if (node.children && node.children.length !== 0) {
                    queue = queue.concat(node.children);
                }
            }
        }

        return leaves;
    }

    root.exportPdf = function (doc) {
        const margin = this.margin || 0;
        const { top = margin, bottom = margin } = this.margins || {
            top: margin,
            bottom: margin,
        };
        const pageHeight = this.height;

        root.updateBBox();
        root.updateABBox();

        let leafNodes = getAllLeafs(root);
        // sort leafs based on absolute pos
        leafNodes = leafNodes.sort((a, b) => {
            const aTrans = a.dom && a.dom.abTranslate ? a.dom.abTranslate : { translate: [0, 0] };
            const aBox = a.dom.BBox;
            const bTrans = b.dom && b.dom.abTranslate ? b.dom.abTranslate : { translate: [0, 0] };
            const bBox = b.dom.BBox;
            return aTrans.translate[1] + aBox.height - (bTrans.translate[1] + bBox.height);
        });
        let runningY = -top;
        const pageRage = doc.bufferedPageRange();
        let pageNumber = pageRage.count - 1;
        leafNodes.forEach((node) => {
            const abTranslate = node.dom.abTranslate;
            const elHight = node.dom.BBox.height || 0;
            const elY = node.dom.abYposition || 0;
            let posY = (abTranslate.translate[1] + elY || 0) - runningY;

            if (!(posY < pageHeight - bottom && posY + elHight < pageHeight - bottom)) {
                runningY += pageHeight - top;
                posY = (abTranslate.translate[1] + elY || 0) - runningY;
                doc.addPage({
                    margin: this.margin,
                    margins: this.margins,
                    size: [this.width, this.height],
                });
                if (this.pageTemplate) {
                    this.pageTemplate.executePdf(doc);
                }
                pageNumber += 1;
            }
            node.dom.abTranslate = {
                translate: [abTranslate.translate[0], posY],
            };
            const executePdf = node.executePdf.bind(node);

            // Redefining pdf call with page mapping
            node.executePdf = (function (pNumber) {
                return function (pdfCtx) {
                    pdfCtx.switchToPage(pNumber);
                    executePdf(pdfCtx);
                };
            })(pageNumber);
        });

        root.executePdf(doc);
    };

    root.addTemplate = function (template) {
        this.pageTemplate = template;
        this.pageTemplate.updateBBox();
        this.pageTemplate.updateABBox();
    };

    root.createTexture = function (config = {}) {
        return new RenderTexture(this, config);
    };

    root.createAsyncTexture = function (config) {
        return new Promise((resolve, reject) => {
            const textureInstance = new RenderTexture(this, config);
            textureInstance.onLoad(function () {
                resolve(textureInstance);
            });
        });
    };

    return root;
}

function canvasLayer(container, contextConfig = {}, layerSettings = {}) {
    const res =
        container instanceof HTMLElement
            ? container
            : typeof container === "string" || container instanceof String
            ? document.querySelector(container)
            : null;
    let height = res ? res.clientHeight : 0;
    let width = res ? res.clientWidth : 0;
    const layer = document.createElement("canvas");
    const ctx = layer.getContext("2d", contextConfig);
    let { enableEvents = true, autoUpdate = true, enableResize = true } = layerSettings;
    let ratio = getPixlRatio(ctx);
    ctx.pixelRatio = ratio;
    let onClear = function (ctx) {
        ctx.clearRect(0, 0, width * ratio, height * ratio);
    };
    layer.setAttribute("height", height * ratio);
    layer.setAttribute("width", width * ratio);
    layer.style.height = `${height}px`;
    layer.style.width = `${width}px`;
    layer.style.position = "absolute";

    let vDomInstance;
    let vDomIndex = 999999;
    let cHeight;
    let cWidth;
    let resizeCall;
    let onChangeExe;

    if (res) {
        res.appendChild(layer);
        vDomInstance = new VDom();
        if (autoUpdate) {
            vDomIndex = queueInstance.addVdom(vDomInstance);
        }
    } else {
        enableEvents = false;
    }

    const root = createPage(ctx, vDomIndex);

    const resize = function (cr) {
        if (
            (container instanceof HTMLElement && !document.body.contains(container)) ||
            (container instanceof String && !document.querySelector(container))
        ) {
            layerResizeUnBind(root);
            root.destroy();
            return;
        }
        height = cHeight || cr.height;
        width = cWidth || cr.width;

        root.width = width;
        root.height = height;

        updateLayerDimension(root.domEl, width, height);

        if (resizeCall) {
            resizeCall();
        }
        root.execute();
    };

    if (vDomInstance) {
        vDomInstance.rootNode(root);
    }

    const execute = root.execute.bind(root);
    const exportPdf = root.exportPdf.bind(root);
    root.container = res;
    root.domEl = layer;
    root.height = height;
    root.width = width;
    root.type = "CANVAS";
    root.ctx = ctx;

    root.clear = function () {
        onClear(ctx);
    };

    root.setAttr = function (prop, value) {
        if (prop === "viewBox") {
            this.setViewBox.apply(this, value.split(","));
        }
        layer.setAttribute(prop, value);
        this.attr[prop] = value;
    };

    root.setClear = function (exe) {
        onClear = exe;
    };

    root.setSize = function (width_, height_) {
        cHeight = height_;
        cWidth = width_;
        width = width_;
        height = height_;
        this.width = width;
        this.height = height;

        updateLayerDimension(this.domEl, width, height);

        this.execute();
    };

    root.onResize = function (exec) {
        resizeCall = exec;
    };

    root.getPixels = function (x, y, width_, height_) {
        const imageData = this.ctx.getImageData(x, y, width_, height_);
        const pixelInstance = new PixelObject(imageData, width_, height_);

        return pixelInstance;
    };

    root.putPixels = function (Pixels, x, y) {
        if (!(Pixels instanceof PixelObject)) {
            return;
        }
        return this.ctx.putImageData(Pixels.imageData, x, y);
    };

    root.execute = function executeExe() {
        onClear(ctx);
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        this.updateBBox();
        execute();
        if (onChangeExe && this.stateModified) {
            onChangeExe();
        }
        this.stateModified = false;
    };

    root.onChange = function (exec) {
        onChangeExe = exec;
    };

    root.exportPdf = function (callback, options = {}) {
        const pdfConfig = parsePdfConfig(options);
        const doc = new PDFDocument({
            size: [this.width, this.height],
            ...pdfConfig,
        });
        const stream_ = doc.pipe(blobStream());

        const fontRegister = options.fontRegister || {};
        const pdfInfo = options.info || { title: "I2Djs-PDF" };

        if (fontRegister) {
            for (const key in fontRegister) {
                doc.registerFont(key, fontRegister[key]);
            }
        }

        if (pdfInfo) {
            doc.info.Title = pdfInfo.title || "";
            doc.info.Author = pdfInfo.author || "";
            doc.info.Subject = pdfInfo.subject || "";
            doc.info.Keywords = pdfInfo.keywords || "";
            doc.info.CreationDate = pdfInfo.creationDate || "";
        }

        root.updateABBox();

        exportPdf(doc);

        doc.end();

        stream_.on("finish", function () {
            callback(stream_.toBlobURL("application/pdf"));
        });
    };

    const updateLayerDimension = function (layer, width, height) {
        layer.setAttribute("height", height * ratio);
        layer.setAttribute("width", width * ratio);
        layer.style.height = `${height}px`;
        layer.style.width = `${width}px`;
    };

    root.setPixelRatio = function (val) {
        ratio = val;
        this.ctx.pixelRatio = ratio;
        updateLayerDimension(this.domEl, this.width, this.height);
    };

    root.destroy = function () {
        const res = document.body.contains(this.container);
        if (res && this.container.contains(this.domEl)) {
            this.container.removeChild(this.domEl);
        }
        queueInstance.removeVdom(vDomIndex);
        layerResizeUnBind(root, resize);
    };

    if (enableEvents) {
        const eventsInstance = new Events(root);
        layer.addEventListener("mousemove", (e) => {
            e.preventDefault();
            eventsInstance.mousemoveCheck(e);
        });
        // layer.addEventListener("click", (e) => {
        //     e.preventDefault();
        //     eventsInstance.clickCheck(e);
        // });
        // layer.addEventListener("dblclick", (e) => {
        //     e.preventDefault();
        //     eventsInstance.dblclickCheck(e);
        // });
        layer.addEventListener("mousedown", (e) => {
            eventsInstance.mousedownCheck(e);
        });
        layer.addEventListener("mouseup", (e) => {
            eventsInstance.mouseupCheck(e);
        });
        layer.addEventListener("mouseleave", (e) => {
            eventsInstance.mouseleaveCheck(e);
        });
        layer.addEventListener("contextmenu", (e) => {
            eventsInstance.contextmenuCheck(e);
        });
        layer.addEventListener("touchstart", (e) => {
            eventsInstance.touchstartCheck(e);
        });
        layer.addEventListener("touchend", (e) => {
            eventsInstance.touchendCheck(e);
        });
        layer.addEventListener("touchmove", (e) => {
            e.preventDefault();
            eventsInstance.touchmoveCheck(e);
        });
        layer.addEventListener("touchcancel", (e) => {
            eventsInstance.touchcancelCheck(e);
        });
        layer.addEventListener("wheel", (e) => {
            eventsInstance.wheelEventCheck(e);
        });
        layer.addEventListener("pointerdown", (e) => {
            eventsInstance.addPointer(e);
            eventsInstance.pointerdownCheck(e);
        });
        layer.addEventListener("pointerup", (e) => {
            eventsInstance.removePointer(e);
            eventsInstance.pointerupCheck(e);
        });
        layer.addEventListener("pointermove", (e) => {
            e.preventDefault();
            eventsInstance.pointermoveCheck(e);
        });
    }

    queueInstance.execute();

    if (enableResize && root.container) {
        layerResizeBind(root, resize);
        // window.addEventListener("resize", resize);
    }

    return root;
}

function parsePdfConfig(config, oldConfig = {}) {
    return {
        ...oldConfig,
        autoFirstPage: false,
        bufferPages: true,
        ...(config.margin !== undefined && { margin: config.margin }),
        ...(config.margins !== undefined && { margins: config.margins }),
        ...(config.defaultFont !== undefined && { font: config.defaultFont }),
        ...(config.encryption !== undefined && { ...config.encryption }),
    };
}

function pdfLayer(container, config = {}, layerSettings = {}) {
    const res =
        container instanceof HTMLElement
            ? container
            : typeof container === "string" || container instanceof String
            ? document.querySelector(container)
            : null;
    let { height = 0, width = 0 } = config;
    let pdfConfig = parsePdfConfig(config, {});
    const { autoUpdate = true, onUpdate } = layerSettings;
    const layer = document.createElement("canvas");
    const ctx = layer.getContext("2d", {});
    let fontRegister = config.fontRegister || {};
    let pdfInfo = config.info || { title: "I2Djs-PDF" };

    let vDomIndex = 999999;
    let pageDefaultTemplate = null;
    ctx.type_ = "pdf";

    layer.setAttribute("height", height * 1);
    layer.setAttribute("width", width * 1);

    const vDomInstance = new VDom();

    if (autoUpdate) {
        vDomIndex = queueInstance.addVdom(vDomInstance);
    }

    const fallBackPage = createPage(ctx, vDomIndex);

    function PDFCreator() {
        this.pages = [];
        this.ctx = ctx;
        this.domEl = layer;
        this.vDomIndex = vDomIndex;
        this.container = res;
    }
    PDFCreator.prototype.flush = function () {
        this.pages.forEach(function (page) {
            page.flush();
        });

        this.pages = [];

        if (this.doc) {
            this.doc.flushPages();
        }
    };

    PDFCreator.prototype.setConfig = function (config = {}) {
        const tPdfConfig = parsePdfConfig(config, pdfConfig);

        if (config.fontRegister) {
            fontRegister = {
                ...(config.fontRegister || {}),
            };
        }

        if (config.info) {
            pdfInfo = config.info || { title: "I2Djs-PDF" };
        }

        height = config.height || height;
        width = config.width || width;

        layer.setAttribute("height", height * 1);
        layer.setAttribute("width", width * 1);

        this.width = width;
        this.height = height;

        pdfConfig = tPdfConfig;

        this.execute();

        return this;
    };

    PDFCreator.prototype.setPageTemplate = function (exec) {
        pageDefaultTemplate = exec;
    };

    PDFCreator.prototype.setSize = function (width = 0, height = 0) {
        this.width = width;
        this.height = height;

        return this;
    };
    PDFCreator.prototype.execute = function () {
        this.exportPdf(
            onUpdate ||
                function (url) {
                    res.setAttribute("src", url);
                },
            pdfConfig
        );
        // const self = this;
        // this.pages.forEach(function (page, i) {
        //     self.ctx.save();
        //     if (i !== 0) {
        //         page.addPage();
        //     }
        //     page.execute();
        //     self.ctx.restore();
        // })
    };
    PDFCreator.prototype.addPage = function (config = {}) {
        const newpage = createPage(ctx, this.vDomIndex);
        newpage.domEl = layer;
        newpage.height = config.height || height;
        newpage.width = config.width || width;
        newpage.margin = config.margin || pdfConfig.margin || 0;
        newpage.margins = config.margins ||
            pdfConfig.margins || { top: 0, bottom: 0, left: 0, right: 0 };
        newpage.type = "CANVAS";
        newpage.EXEType = "pdf";
        newpage.ctx = ctx;

        if (config.pageTemplate || pageDefaultTemplate) {
            newpage.addTemplate(config.pageTemplate || pageDefaultTemplate);
        }

        this.pages.push(newpage);
        return newpage;
    };
    PDFCreator.prototype.removePage = function (page) {
        const pageIndex = this.pages.indexOf(page);
        let removedPage = null;
        if (pageIndex !== -1) {
            removedPage = this.pages.splice(pageIndex, 1);
        }

        return removedPage;
    };
    PDFCreator.prototype.createTemplate = function () {
        return createPage(ctx, this.vDomIndex);
    };
    PDFCreator.prototype.exportPdf = function (callback, pdfConfig = {}) {
        const doc = new PDFDocument({
            ...pdfConfig,
        });
        const stream_ = doc.pipe(blobStream());

        if (fontRegister) {
            for (const key in fontRegister) {
                doc.registerFont(key, fontRegister[key]);
            }
        }

        if (pdfInfo) {
            doc.info.Title = pdfInfo.title || "";
            doc.info.Author = pdfInfo.author || "";
            doc.info.Subject = pdfInfo.subject || "";
            doc.info.Keywords = pdfInfo.keywords || "";
            doc.info.CreationDate = pdfInfo.creationDate || "";
        }

        this.doc = doc;

        this.pages.forEach(function (page, i) {
            page.updateBBox();
            doc.addPage({
                margin: page.margin || 0,
                size: [page.width, page.height],
            });
            if (page.pageTemplate) {
                page.pageTemplate.executePdf(doc);
            }
            page.exportPdf(doc);
        });

        doc.end();

        stream_.on("finish", function () {
            callback(stream_.toBlobURL("application/pdf"));
        });
    };

    PDFCreator.prototype.destroy = function () {
        this.flush();
    };
    PDFCreator.prototype.exec = function (exe) {
        exe.call(this, this.dataObj);
    };
    PDFCreator.prototype.data = function (data) {
        if (!data) {
            return this.dataObj;
        } else {
            this.dataObj = data;
        }
        return this;
    };
    PDFCreator.prototype.createTexture = function (config = {}) {
        return fallBackPage.createTexture(config);
    };

    PDFCreator.prototype.createAsyncTexture = function (config = {}) {
        return fallBackPage.createAsyncTexture(config);
    };

    const pdfInstance = new PDFCreator();

    if (vDomInstance) {
        vDomInstance.rootNode(pdfInstance);
    }

    return pdfInstance;
}

export default {
    canvasLayer,
    pdfLayer,
    CanvasNodeExe,
    CanvasGradient,
    createRadialGradient,
    createLinearGradient,
};
