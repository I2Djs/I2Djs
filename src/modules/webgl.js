import queue from "./queue.js";
import VDom from "./VDom.js";
import path from "./path.js";
import colorMap from "./colorMap.js";
import geometry from "./geometry.js";
import shaders from "./shaders.js";
import earcut from "earcut";
import Events from "./events.js";
import behaviour from "./behaviour.js";
import {
    CollectionPrototype,
    NodePrototype,
    layerResizeBind,
    layerResizeUnBind,
} from "./coreApi.js";

const t2DGeometry = geometry;

let ratio;
const queueInstance = queue;

const zoomInstance = behaviour.zoom();
const dragInstance = behaviour.drag();

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

let Id = 0;

function domId() {
    Id += 1;
    return Id;
}

function parseTransform(transform) {
    const output = {
        translateX: 0,
        translateY: 0,
        scaleX: 1,
        scaleY: 1,
        angle: 0,
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

        if (transform.rotate && transform.rotate.length > 0) {
            output.angle = transform.rotate[0];
        }
    }

    return output;
}

function RPolyupdateBBox() {
    const self = this;
    const { transform, points = [] } = self.attr;
    const { translateX, translateY, scaleX, scaleY } = parseTransform(transform);

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
}

var m3 = {
    multiply: function (a, b) {
        var a00 = a[0 * 3 + 0];
        var a01 = a[0 * 3 + 1];
        var a02 = a[0 * 3 + 2];
        var a10 = a[1 * 3 + 0];
        var a11 = a[1 * 3 + 1];
        var a12 = a[1 * 3 + 2];
        var a20 = a[2 * 3 + 0];
        var a21 = a[2 * 3 + 1];
        var a22 = a[2 * 3 + 2];
        var b00 = b[0 * 3 + 0];
        var b01 = b[0 * 3 + 1];
        var b02 = b[0 * 3 + 2];
        var b10 = b[1 * 3 + 0];
        var b11 = b[1 * 3 + 1];
        var b12 = b[1 * 3 + 2];
        var b20 = b[2 * 3 + 0];
        var b21 = b[2 * 3 + 1];
        var b22 = b[2 * 3 + 2];

        return [
            b00 * a00 + b01 * a10 + b02 * a20,
            b00 * a01 + b01 * a11 + b02 * a21,
            b00 * a02 + b01 * a12 + b02 * a22,
            b10 * a00 + b11 * a10 + b12 * a20,
            b10 * a01 + b11 * a11 + b12 * a21,
            b10 * a02 + b11 * a12 + b12 * a22,
            b20 * a00 + b21 * a10 + b22 * a20,
            b20 * a01 + b21 * a11 + b22 * a21,
            b20 * a02 + b21 * a12 + b22 * a22,
        ];
    },
    translation: function (tx, ty, mtrx) {
        if (mtrx && mtrx[6] === tx && mtrx[7] === ty) {
            return mtrx;
        }
        return [1, 0, 0, 0, 1, 0, tx, ty, 1];
    },

    rotation: function (angleInRadians) {
        var c = Math.cos(angleInRadians);
        var s = Math.sin(angleInRadians);
        return [c, -s, 0, s, c, 0, 0, 0, 1];
    },

    scaling: function (sx, sy) {
        return [sx, 0, 0, 0, sy, 0, 0, 0, 1];
    },
    identity: function () {
        return [1, 0, 0, 0, 1, 0, 0, 0, 1];
    },
    projection: function (width, height) {
        // Note: This matrix flips the Y axis so that 0 is at the top.
        return [2 / width, 0, 0, 0, -2 / height, 0, -1, 1, 1];
    },
};

function updateTransformMatrix(matrix_) {
    const transform = this.attr.transform;
    let matrix = matrix_ || this.projectionMatrix;
    if (transform && transform.translate) {
        this.translationMatrix = m3.translation(
            transform.translate[0],
            transform.translate[1],
            this.translationMatrix
        );
        matrix = m3.multiply(matrix, this.translationMatrix);
    }
    if (transform && transform.rotate) {
        const angle = (Math.PI / 180) * transform.rotate[0];
        this.rotationMatrix = m3.rotation(angle);
        this.rotationCentric = m3.translation(
            transform.rotate[1] || 0,
            transform.rotate[2] || 0,
            this.rotationCentric
        );
        matrix = m3.multiply(matrix, this.rotationMatrix);
    }
    if (transform && transform.scale) {
        this.scaleMatrix = m3.scaling(transform.scale[0], transform.scale[1]);
        matrix = m3.multiply(matrix, this.scaleMatrix);
    }
    if (this.rotationCentric) {
        matrix = m3.multiply(matrix, this.rotationCentric);
    }

    this.transformMatrix = matrix;
}

const WebglCollection = function () {
    CollectionPrototype.apply(this, arguments);
};
WebglCollection.prototype = new CollectionPrototype();
WebglCollection.prototype.constructor = WebglCollection;
WebglCollection.prototype.createNode = function (ctx, config, vDomIndex) {
    return new WebglNodeExe(ctx, config, domId(), vDomIndex);
};

function loadShader(ctx, shaderSource, shaderType) {
    var shader = ctx.createShader(shaderType);
    ctx.shaderSource(shader, shaderSource);
    ctx.compileShader(shader);
    var compiled = ctx.getShaderParameter(shader, ctx.COMPILE_STATUS);

    if (!compiled) {
        var lastError = ctx.getShaderInfoLog(shader);
        console.error("*** Error compiling shader '" + shader + "':" + lastError);
        ctx.deleteShader(shader);
        return null;
    }

    return shader;
}

function createProgram(ctx, shaders) {
    var program = ctx.createProgram();
    shaders.forEach(function (shader) {
        ctx.attachShader(program, shader);
    });
    ctx.linkProgram(program);
    var linked = ctx.getProgramParameter(program, ctx.LINK_STATUS);

    if (!linked) {
        var lastError = ctx.getProgramInfoLog(program);
        console.error("Error in program linking:" + lastError);
        ctx.deleteProgram(program);
        return null;
    }

    return program;
}

function getProgram(ctx, shaderCode) {
    var shaders = [
        loadShader(ctx, shaderCode.vertexShader, ctx.VERTEX_SHADER),
        loadShader(ctx, shaderCode.fragmentShader, ctx.FRAGMENT_SHADER),
    ];
    return createProgram(ctx, shaders);
}

function WebglDom() {
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

WebglDom.prototype.exec = function (exe, d) {
    if (typeof exe !== "function") {
        console.error("Wrong Exe type");
    }

    exe.call(this, d);
};

WebglDom.prototype.setStyle = function (key, value) {
    if (value) {
        this.style[key] = value;
        if (this.shader && key === "fill") {
            if (this.style.opacity !== undefined) {
                value.a *= this.style.opacity;
            }
            if (this.shader.indexBased) {
                this.shader.updateColor(this.pindex, value);
            }
        }
        if (this.shader && key === "opacity") {
            if (this.style.fill !== undefined) {
                this.style.fill.a *= this.style.opacity;
            }
            this.shader.updateColor(this.pindex, this.style.fill);
        }
    } else if (this.style[key]) {
        delete this.style[key];
    }
};

WebglDom.prototype.getAttr = function (key) {
    return this.attr[key];
};

WebglDom.prototype.getStyle = function (key) {
    return this.style[key];
};

function PointNode(ctx, attr, style) {
    this.ctx = ctx;
    this.attr = attr || {};
    this.style = style || {};
    this.projectionMatrix = m3.projection(
        this.ctx.canvas.width / ratio,
        this.ctx.canvas.height / ratio
    );
    this.transformMatrix = m3.multiply(this.projectionMatrix, m3.identity());

    if (this.attr.transform) {
        this.exec(updateTransformMatrix, null);
    }
}

PointNode.prototype = new WebglDom();
PointNode.prototype.constructor = PointNode;

PointNode.prototype.setShader = function (shader) {
    this.shader = shader;
    if (this.shader) {
        this.shader.addVertex(this.attr.x || 0, this.attr.y || 0, this.pindex);
        this.shader.addColors(this.style.fill || defaultColor, this.pindex);
        this.shader.addSize(this.attr.size || 0, this.pindex);
        this.shader.addTransform(this.transformMatrix, this.pindex);
    }
};

PointNode.prototype.setAttr = function (prop, value) {
    this.attr[prop] = value;

    if (prop === "transform") {
        this.exec(updateTransformMatrix, this.p_matrix);
    }

    if (!this.shader) {
        return;
    }

    if (prop === "x" || prop === "y") {
        this.shader.updateVertex(this.pindex, this.attr.x, this.attr.y);
    }

    if (prop === "size") {
        this.shader.updateSize(this.pindex, this.attr.size || 0);
    }

    if (prop === "transform") {
        this.shader.updateTransform(this.pindex, this.transformMatrix);
    }
};

PointNode.prototype.applyTransformationMatrix = function (matrix) {
    this.p_matrix = matrix;
    this.exec(updateTransformMatrix, matrix);
    if (this.shader) {
        this.shader.addTransform(this.transformMatrix, this.pindex);
    }
};

PointNode.prototype.in = function RRinfun(co) {
    const { x = 0, y = 0, size = 0 } = this.attr;
    return co.x >= x && co.x <= x + size && co.y >= y && co.y <= y + size;
};

PointNode.prototype.updateBBox = function RRupdateBBox() {
    const self = this;
    const { transform, x = 0, y = 0, size = 0 } = self.attr;
    const { translateX, translateY, scaleX, scaleY } = parseTransform(transform);

    self.BBox = {
        x: translateX + x * scaleX,
        y: translateY + y * scaleY,
        width: size * scaleX,
        height: size * scaleY,
    };

    if (transform && transform.rotate) {
        self.BBoxHit = t2DGeometry.rotateBBox(this.BBox, transform);
    } else {
        self.BBoxHit = this.BBox;
    }
};

function RectNode(ctx, attr, style) {
    this.ctx = ctx;
    this.attr = attr || {};
    this.style = style || {};
    this.projectionMatrix = m3.projection(
        this.ctx.canvas.width / ratio,
        this.ctx.canvas.height / ratio
    );
    this.transformMatrix = m3.multiply(this.projectionMatrix, m3.identity());

    if (this.attr.transform) {
        this.exec(updateTransformMatrix, null);
    }
}
RectNode.prototype = new WebglDom();
RectNode.prototype.constructor = RectNode;
RectNode.prototype.setShader = function (shader) {
    this.shader = shader;
    if (this.shader) {
        this.shader.addVertex(
            this.attr.x || 0,
            this.attr.y || 0,
            this.attr.width || 0,
            this.attr.height || 0,
            this.pindex
        );
        this.shader.addColors(this.style.fill || defaultColor, this.pindex);
        this.shader.addTransform(this.transformMatrix, this.pindex);
    }
};

RectNode.prototype.applyTransformationMatrix = function (matrix) {
    this.p_matrix = matrix;
    this.exec(updateTransformMatrix, matrix);
    if (this.shader) {
        this.shader.addTransform(this.transformMatrix, this.pindex);
    }
};

RectNode.prototype.setAttr = function (key, value) {
    this.attr[key] = value;

    if (key === "transform") {
        this.exec(updateTransformMatrix, this.p_matrix);
    }

    if (!this.shader) {
        return;
    }
    if (key === "x" || key === "width" || key === "y" || key === "height") {
        this.shader.updateVertex(
            this.pindex,
            this.attr.x || 0,
            this.attr.y || 0,
            this.attr.width || 0,
            this.attr.height || 0
        );
    }
    if (key === "transform") {
        this.shader.updateTransform(this.pindex, this.transformMatrix);
    }
};

RectNode.prototype.in = function RRinfun(co) {
    const { x = 0, y = 0, width = 0, height = 0 } = this.attr;
    return co.x >= x && co.x <= x + width && co.y >= y && co.y <= y + height;
};

RectNode.prototype.updateBBox = function RRupdateBBox() {
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
};

function PathNode(ctx, attr, style) {
    const self = this;
    this.ctx = ctx;
    this.attr = attr;
    this.style = style;
    this.pointsGeometry = [];
    this.transform = [0, 0, 1, 1];
    this.projectionMatrix = m3.projection(
        this.ctx.canvas.width / ratio,
        this.ctx.canvas.height / ratio
    );
    if (self.attr.d) {
        if (path.isTypePath(self.attr.d)) {
            self.path = self.attr.d;
            self.attr.d = self.attr.d.fetchPathString();
        } else {
            self.path = path.instance(self.attr.d);
        }
        this.points = new Float32Array(this.path.getPoints());
    }

    if (this.style.stroke) {
        this.color = new Float32Array([
            this.style.stroke.r / 255,
            this.style.stroke.g / 255,
            this.style.stroke.b / 255,
            this.style.stroke.a === undefined ? 1 : this.style.stroke.a / 255,
        ]);
    }
    this.transformMatrix = m3.multiply(this.projectionMatrix, m3.identity());

    if (this.attr.transform) {
        this.exec(updateTransformMatrix, null);
    }
}

PathNode.prototype = new WebglDom();
PathNode.prototype.constructor = PathNode;

PathNode.prototype.setShader = function (shader) {
    this.shader = shader;
};

PathNode.prototype.applyTransformationMatrix = function (matrix) {
    this.p_matrix = matrix;
    this.exec(updateTransformMatrix, matrix);
    // if (this.shader) {
    //     this.shader.addTransform(this.transformMatrix, this.pindex);
    // }
};

PathNode.prototype.setAttr = function (key, value) {
    this.attr[key] = value;
    if (value == null) {
        delete this.attr[key];
        return;
    }

    if (key === "d") {
        if (path.isTypePath(value)) {
            this.path = value;
            this.attr.d = value.fetchPathString();
        } else {
            this.path = path.instance(this.attr.d);
        }
        this.points = new Float32Array(this.path.getPoints());
    }
    if (key === "transform") {
        this.exec(updateTransformMatrix, this.p_matrix);
    }
};

PathNode.prototype.updateBBox = function RCupdateBBox() {
    const self = this;
    const { transform } = self.attr;
    const { translateX, translateY, scaleX, scaleY } = parseTransform(transform);
    self.BBox = self.path
        ? self.path.BBox
        : {
              x: 0,
              y: 0,
              width: 0,
              height: 0,
          };

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

function PolyLineNode(ctx, attr, style) {
    this.ctx = ctx;
    this.attr = attr || {};
    this.style = style || {};
    this.points = [];
    this.transform = [0, 0, 1, 1];
    const subPoints = [];

    this.projectionMatrix = m3.projection(
        this.ctx.canvas.width / ratio,
        this.ctx.canvas.height / ratio
    );

    if (this.attr.points) {
        const points = this.attr.points;
        for (let j = 0, jlen = points.length; j < jlen; j++) {
            subPoints[j * 2] = points[j].x;
            subPoints[j * 2 + 1] = points[j].y;
        }
        this.points = new Float32Array(subPoints);
    }
    if (this.style.stroke) {
        this.color = new Float32Array([
            this.style.stroke.r / 255,
            this.style.stroke.g / 255,
            this.style.stroke.b / 255,
            this.style.stroke.a === undefined ? 1 : this.style.stroke.a / 255,
        ]);
    }

    this.transformMatrix = m3.multiply(this.projectionMatrix, m3.identity());

    if (this.attr.transform) {
        this.exec(updateTransformMatrix, null);
    }
}
PolyLineNode.prototype = new WebglDom();
PolyLineNode.prototype.constructor = PolyLineNode;

PolyLineNode.prototype.setShader = function (shader) {
    this.shader = shader;
};

PolyLineNode.prototype.applyTransformationMatrix = function (matrix) {
    this.p_matrix = matrix;
    this.exec(updateTransformMatrix, matrix);
};

PolyLineNode.prototype.setAttr = function (key, value) {
    this.attr[key] = value;
    if (key === "points") {
        const points = this.attr.points;
        const subPoints = [];
        for (let j = 0, jlen = points.length; j < jlen; j++) {
            subPoints[j * 2] = points[j].x;
            subPoints[j * 2 + 1] = points[j].y;
        }
        this.points = new Float32Array(subPoints);
    }
    if (key === "transform") {
        this.exec(updateTransformMatrix, this.p_matrix);
    }
};

PolyLineNode.prototype.updateBBox = RPolyupdateBBox;

PolyLineNode.prototype.setStyle = function (key, value) {
    this.style[key] = value;
    if (key === "stroke") {
        this.color = new Float32Array([
            this.style.stroke.r / 255,
            this.style.stroke.g / 255,
            this.style.stroke.b / 255,
            this.style.stroke.a === undefined ? 1 : this.style.stroke.a / 255,
        ]);
    }
};

function LineNode(ctx, attr, style) {
    this.ctx = ctx;
    this.attr = attr || {};
    this.style = style || {};
    // this.transform = [0, 0, 1, 1];
    this.projectionMatrix = m3.projection(
        this.ctx.canvas.width / ratio,
        this.ctx.canvas.height / ratio
    );
    this.transformMatrix = m3.multiply(this.projectionMatrix, m3.identity());

    if (this.attr.transform) {
        this.exec(updateTransformMatrix, null);
    }

    // if (this.attr.transform) {
    //     const { translateX, translateY, scaleX, scaleY } = parseTransform(this.attr.transform);
    //     this.transform = [translateX, translateY, scaleX, scaleY];
    // }
}

LineNode.prototype = new WebglDom();
LineNode.prototype.constructor = LineNode;

LineNode.prototype.setShader = function (shader) {
    this.shader = shader;
    const { x1 = 0, y1 = 0, x2 = x1, y2 = y1 } = this.attr;

    if (this.shader) {
        this.shader.addVertex(x1, y1, x2, y2, this.pindex);
        this.shader.addColors(this.style.stroke || defaultColor, this.pindex);
        this.shader.addTransform(this.transformMatrix, this.pindex);
        // this.shader.addTransform(
        //     this.attr.transform || {
        //         translate: [],
        //         scale: [],
        //     },
        //     this.pindex
        // );
    }
};

LineNode.prototype.applyTransformationMatrix = function (matrix) {
    this.p_matrix = matrix;
    this.exec(updateTransformMatrix, matrix);
    if (this.shader) {
        this.shader.addTransform(this.transformMatrix, this.pindex);
    }
};

LineNode.prototype.setAttr = function (key, value) {
    this.attr[key] = value;
    if (value == null && this.attr[key] != null) {
        delete this.attr[key];
        return;
    }
    if (key === "transform") {
        this.exec(updateTransformMatrix, this.p_matrix);
    }
    if (this.shader && (key === "x1" || key === "y1" || key === "x2" || key === "y2")) {
        this.shader.updateVertex(
            this.pindex,
            this.attr.x1,
            this.attr.y1,
            this.attr.x2,
            this.attr.y2
        );
    }
    if (this.shader && key === "transform") {
        this.shader.updateTransform(this.pindex, this.transformMatrix);
    }
};

LineNode.prototype.updateBBox = function RLupdateBBox() {
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
};

function polygonPointsMapper(value) {
    return earcut(
        value.reduce(function (p, c) {
            p[p.length] = c.x;
            p[p.length] = c.y;
            return p;
        }, [])
    ).map(function (d) {
        return value[d];
    });
}

function PolygonNode(ctx, attr, style) {
    this.ctx = ctx;
    this.attr = attr;
    this.style = style;
    this.positionArray = [];
    this.transform = [0, 0, 1, 1];
    const subPoints = [];

    this.projectionMatrix = m3.projection(
        this.ctx.canvas.width / ratio,
        this.ctx.canvas.height / ratio
    );

    if (this.attr.points) {
        const points = polygonPointsMapper(this.attr.points);
        for (let j = 0, jlen = points.length; j < jlen; j++) {
            subPoints[j * 2] = points[j].x;
            subPoints[j * 2 + 1] = points[j].y;
        }
        this.points = new Float32Array(subPoints);
    }
    if (this.style.fill) {
        this.color = new Float32Array([
            this.style.stroke.r / 255,
            this.style.stroke.g / 255,
            this.style.stroke.b / 255,
            this.style.stroke.a === undefined ? 1 : this.style.stroke.a / 255,
        ]);
    }
    this.transformMatrix = m3.multiply(this.projectionMatrix, m3.identity());

    if (this.attr.transform) {
        this.exec(updateTransformMatrix, null);
    }
}

PolygonNode.prototype = new WebglDom();
PolygonNode.prototype.constructor = PolygonNode;

PolygonNode.prototype.setShader = function (shader) {
    this.shader = shader;
};

PolygonNode.prototype.applyTransformationMatrix = function (matrix) {
    this.p_matrix = matrix;
    this.exec(updateTransformMatrix, matrix);
};

PolygonNode.prototype.setAttr = function (key, value) {
    this.attr[key] = value;
    if (value == null) {
        delete this.attr[key];
        return;
    }
    if (key === "points") {
        const subPoints = [];
        const points = polygonPointsMapper(value);
        for (let j = 0, jlen = points.length; j < jlen; j++) {
            subPoints[j * 2] = points[j].x;
            subPoints[j * 2 + 1] = points[j].y;
        }
        this.points = new Float32Array(subPoints);
    }
    if (key === "transform") {
        this.exec(updateTransformMatrix, this.p_matrix);
        // const { translateX, translateY, scaleX, scaleY } = parseTransform(this.attr.transform);
        // this.transform = new Float32Array([translateX, translateY, scaleX, scaleY]);
    }
    // if (this.shader) {
    //     this.shader.updateVertex(this.triangulatedPoints || [], this.pindex);
    // }
};

PolygonNode.prototype.setStyle = function (key, value) {
    this.style[key] = value;
    if (key === "fill") {
        this.color = new Float32Array([
            this.style.fill.r / 255,
            this.style.fill.g / 255,
            this.style.fill.b / 255,
            this.style.fill.a === undefined ? 1 : this.style.fill.a / 255,
        ]);
    }
};

PolygonNode.prototype.updateBBox = RPolyupdateBBox;

function CircleNode(ctx, attr, style) {
    this.ctx = ctx;
    this.attr = attr;
    this.style = style;
    this.projectionMatrix = m3.projection(
        this.ctx.canvas.width / ratio,
        this.ctx.canvas.height / ratio
    );
    this.transformMatrix = m3.multiply(this.projectionMatrix, m3.identity());

    if (this.attr.transform) {
        this.exec(updateTransformMatrix, null);
    }
}

CircleNode.prototype = new WebglDom();
CircleNode.prototype.constructor = CircleNode;

CircleNode.prototype.setShader = function (shader) {
    this.shader = shader;
    if (this.shader) {
        this.shader.addVertex(this.attr.cx || 0, this.attr.cy || 0, this.pindex);
        this.shader.addColors(this.style.fill || defaultColor, this.pindex);
        this.shader.addSize(this.attr.r || 0, this.pindex);
        this.shader.addTransform(this.transformMatrix, this.pindex);
        // this.shader.addTransform(
        //     this.attr.transform || {
        //         translate: [],
        //         scale: [],
        //     },
        //     this.pindex
        // );
    }
};

CircleNode.prototype.applyTransformationMatrix = function (matrix) {
    this.p_matrix = matrix;
    this.exec(updateTransformMatrix, matrix);
    if (this.shader) {
        this.shader.addTransform(this.transformMatrix, this.pindex);
    }
};

CircleNode.prototype.setAttr = function (prop, value) {
    this.attr[prop] = value;
    if (value == null) {
        delete this.attr[prop];
        return;
    }
    if (prop === "transform") {
        this.exec(updateTransformMatrix, this.p_matrix);
    }
    if (this.shader && (prop === "cx" || prop === "cy")) {
        this.shader.updateVertex(this.pindex, this.attr.cx, this.attr.cy);
    }

    if (this.shader && prop === "r") {
        this.shader.updateSize(this.pindex, this.attr.r || 0);
    }
    if (this.shader && prop === "transform") {
        this.shader.updateTransform(this.pindex, this.transformMatrix);
    }
};
// CircleNode.prototype.setStyle = function (key, value) {
// 	this.style[key] = value;
// 	if (this.shader && key === 'fill') {
// 		this.shader.updateColor(this.pindex, value);
// 	}
// };

// CircleNode.prototype.getAttr = function (key) {
// 	return this.attr[key];
// };

// CircleNode.prototype.getStyle = function (key) {
// 	return this.style[key];
// };

CircleNode.prototype.in = function RCinfun(co, eventType) {
    const { r = 0, cx = 0, cy = 0 } = this.attr;
    const tr = Math.sqrt((co.x - cx) * (co.x - cx) + (co.y - cy) * (co.y - cy));
    return tr <= r;
};

CircleNode.prototype.updateBBox = function RCupdateBBox() {
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
};

const webGLImageTextures = {};

function isPowerOf2(value) {
    return (value & (value - 1)) === 0;
}

const onClear = function (ctx, width, height, ratio) {
    ctx.clearRect(0, 0, width * ratio, height * ratio);
};

function buildCanvasTextEl(str, style) {
    const layer = document.createElement("canvas");
    const ctx = layer.getContext("2d");
    style = style || {
        fill: "#fff",
    };
    if (!style.font) {
        style.font = "10px Arial";
    }

    const fontSize = parseFloat(style.font, 10) || 12;
    ctx.font = style.font;
    const twid = ctx.measureText(str);
    const width = twid.width;
    const height = fontSize;
    layer.setAttribute("height", height * ratio);
    layer.setAttribute("width", width * ratio);
    layer.style.width = width;
    layer.style.height = height;

    style.font =
        fontSize * ratio +
        (isNaN(parseFloat(style.font, 10))
            ? style.font
            : style.font.substring(fontSize.toString().length));

    for (const st in style) {
        ctx[st] = style[st];
    }
    ctx.fillText(str, 0, height * 0.75 * ratio);

    return {
        dom: layer,
        ctx: ctx,
        width: width,
        height: height,
        ratio: ratio,
        style: style,
        str: str,
        updateText: function () {
            onClear(this.ctx, this.width, this.height, this.ratio);
            for (const st in this.style) {
                this.ctx[st] = this.style[st];
            }
            this.ctx.fillText(this.str, 0, this.height * 0.75);
        },
    };
}

function TextNode(ctx, attr, style, vDomIndex) {
    const self = this;
    this.ctx = ctx;
    this.attr = attr;
    this.style = style;
    this.vDomIndex = vDomIndex;
    this.positionArray = new Float32Array(12);
    this.transform = [0, 0, 1, 1];

    this.projectionMatrix = m3.projection(
        this.ctx.canvas.width / ratio,
        this.ctx.canvas.height / ratio
    );
    this.transformMatrix = m3.multiply(this.projectionMatrix, m3.identity());

    if (this.attr.transform) {
        this.exec(updateTransformMatrix, null);
        // const { translateX, translateY, scaleX, scaleY } = parseTransform(this.attr.transform);
        // this.transform = new Float32Array([translateX, translateY, scaleX, scaleY]);
    }

    // if (this.attr.transform) {
    //     const { translateX, translateY, scaleX, scaleY } = parseTransform(this.attr.transform);
    //     this.transform = [translateX, translateY, scaleX, scaleY];
    // }

    if (self.attr.text && typeof self.attr.text === "string") {
        this.text = buildCanvasTextEl(self.attr.text, self.style);
        this.attr.width = this.text.width;
        this.attr.height = this.text.height;
    }

    if (this.text) {
        this.textureNode = new TextureObject(
            ctx,
            {
                src: this.text.dom,
            },
            this.vDomIndex
        );
    }
}

TextNode.prototype = new WebglDom();

TextNode.prototype.constructor = TextNode;

TextNode.prototype.setShader = function (shader) {
    this.shader = shader;
    // if (this.shader) {
    //     this.shader.addVertex(
    //         this.attr.x || 0,
    //         this.attr.y || 0,
    //         this.attr.width || 0,
    //         this.attr.height || 0,
    //         this.pindex
    //     );
    //     // this.shader.addOpacity(1, this.pindex);
    // }
};

TextNode.prototype.setAttr = function (key, value) {
    this.attr[key] = value;

    if (value == null) {
        delete this.attr[key];
        return;
    }

    if (key === "text" && typeof value === "string") {
        if (this.text) {
            this.text = buildCanvasTextEl(this.attr.text, this.style);
        } else {
            this.text = buildCanvasTextEl(value, this.style);
        }
        this.attr.width = this.text.width;
        this.attr.height = this.text.height;
        if (this.textureNode) {
            this.textureNode.setAttr("src", this.text.dom);
        } else {
            this.textureNode = new TextureObject(
                this.ctx,
                {
                    src: this.text.dom,
                },
                this.vDomIndex
            );
        }
    }

    if (key === "transform") {
        this.exec(updateTransformMatrix, this.p_matrix);
    }

    if (key === "x" || key === "y") {
        const x = this.attr.x || 0;
        const y = this.attr.y || 0;
        const width = this.attr.width || 0;
        const height = this.attr.height || 0;
        const x1 = x + width;
        const y1 = y + height;

        this.positionArray[0] = this.positionArray[4] = this.positionArray[6] = x;
        this.positionArray[1] = this.positionArray[3] = this.positionArray[9] = y;
        this.positionArray[2] = this.positionArray[8] = this.positionArray[10] = x1;
        this.positionArray[5] = this.positionArray[7] = this.positionArray[11] = y1;
    }

    // if (this.shader && key === "x") {
    //     this.shader.updateVertexX(this.pindex, this.attr.x || 0, this.attr.width || 0);
    // }
    // if (this.shader && key === "y") {
    //     this.shader.updateVertexY(this.pindex, this.attr.y || 0, this.attr.height || 0);
    // }
};

TextNode.prototype.applyTransformationMatrix = function (matrix) {
    this.p_matrix = matrix;
    this.exec(updateTransformMatrix, matrix);
    // if (this.shader) {
    //     this.shader.addTransform(this.transformMatrix, this.pindex);
    // }
};

TextNode.prototype.setStyle = function (key, value) {
    this.style[key] = value;
    if (this.text) {
        this.text.style[key] = value;
        if (key === "font") {
            const fontSize = parseFloat(value, 10) || 12;
            this.text.ctx.font = value;
            const twid = this.text.ctx.measureText(this.attr.text);
            const width = twid.width;
            const height = fontSize;
            this.text.style.font =
                fontSize * ratio +
                (isNaN(parseFloat(value, 10))
                    ? this.style.font
                    : this.style.font.substring(fontSize.toString().length));
            this.text.updateText();
            this.text.dom.setAttribute("height", height * ratio);
            this.text.dom.setAttribute("width", width * ratio);
            this.attr.width = width;
            this.attr.height = height;
            this.shader.updateVertexX(this.pindex, this.attr.x || 0, this.attr.width || 0);
            this.shader.updateVertexY(this.pindex, this.attr.y || 0, this.attr.height || 0);
        } else {
            this.text.style[key] = value;
            // this.text.execute();
            this.text.updateText();
            this.textureNode.setAttr("src", this.text.dom);
        }
    }
};

TextNode.prototype.getAttr = function (key) {
    return this.attr[key];
};

TextNode.prototype.getStyle = function (key) {
    return this.style[key];
};

TextNode.prototype.in = function RIinfun(co) {
    const { width = 0, height = 0, x = 0, y = 0 } = this.attr;
    return co.x >= x && co.x <= x + width && co.y >= y && co.y <= y + height;
};

TextNode.prototype.updateBBox = function RIupdateBBox() {
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
};

function ImageNode(ctx, attr, style, vDomIndex) {
    const self = this;
    this.ctx = ctx;
    this.attr = attr;
    this.style = style;
    this.vDomIndex = vDomIndex;
    this.positionArray = new Float32Array(12);
    this.transform = [0, 0, 1, 1];
    this.projectionMatrix = m3.projection(
        this.ctx.canvas.width / ratio,
        this.ctx.canvas.height / ratio
    );
    this.transformMatrix = m3.multiply(this.projectionMatrix, m3.identity());

    if (this.attr.transform) {
        this.exec(updateTransformMatrix, null);
    }

    if (self.attr.src && typeof self.attr.src === "string" && !webGLImageTextures[self.attr.src]) {
        this.textureNode = new TextureObject(
            ctx,
            {
                src: this.attr.src,
            },
            this.vDomIndex
        );
        webGLImageTextures[self.attr.src] = this.textureNode;
    } else if (self.attr.src && self.attr.src instanceof NodePrototype) {
        this.textureNode = new TextureObject(
            ctx,
            {
                src: this.attr.src,
            },
            this.vDomIndex
        );
    } else if (typeof self.attr.src === "string" && webGLImageTextures[self.attr.src]) {
        this.textureNode = webGLImageTextures[self.attr.src];
    } else if (self.attr.src && self.attr.src instanceof TextureObject) {
        this.textureNode = self.attr.src;
    }
    if (this.attr.x || this.attr.y || this.attr.width || this.attr.height) {
        const x = this.attr.x || 0;
        const y = this.attr.y || 0;
        const width = this.attr.width || 0;
        const height = this.attr.height || 0;
        const x1 = x + width;
        const y1 = y + height;

        this.positionArray[0] = this.positionArray[4] = this.positionArray[6] = x;
        this.positionArray[1] = this.positionArray[3] = this.positionArray[9] = y;
        this.positionArray[2] = this.positionArray[8] = this.positionArray[10] = x1;
        this.positionArray[5] = this.positionArray[7] = this.positionArray[11] = y1;
    }
}

ImageNode.prototype = new WebglDom();
ImageNode.prototype.constructor = ImageNode;

ImageNode.prototype.setShader = function (shader) {
    this.shader = shader;
    // if (this.shader) {
    //     this.shader.addVertex(
    //         this.attr.x || 0,
    //         this.attr.y || 0,
    //         this.attr.width || 0,
    //         this.attr.height || 0,
    //         this.pindex
    //     );
    //     // this.shader.addOpacity(1, this.pindex);
    // }
};

ImageNode.prototype.applyTransformationMatrix = function (matrix) {
    this.p_matrix = matrix;
    this.exec(updateTransformMatrix, matrix);
    // if (this.shader) {
    //     this.shader.addTransform(this.transformMatrix, this.pindex);
    // }
};

ImageNode.prototype.setAttr = function (key, value) {
    this.attr[key] = value;

    if (value == null) {
        delete this.attr[key];
        return;
    }

    if (key === "src" && typeof value === "string") {
        if (value && !webGLImageTextures[value]) {
            this.textureNode = new TextureObject(
                this.ctx,
                {
                    src: value,
                },
                this.vDomIndex
            );
            webGLImageTextures[value] = this.textureNode;
        } else if (value && webGLImageTextures[value]) {
            this.textureNode = webGLImageTextures[value];
        }
    } else if (key === "src" && value instanceof NodePrototype) {
        this.textureNode = new TextureObject(
            this.ctx,
            {
                src: value,
            },
            this.vDomIndex
        );
    } else if (key === "src" && value instanceof TextureObject) {
        this.textureNode = value;
    }
    // if (!this.shader) {
    //     return;
    // }
    if (key === "x" || key === "width" || key === "y" || key === "height") {
        const x = this.attr.x || 0;
        const y = this.attr.y || 0;
        const width = this.attr.width || 0;
        const height = this.attr.height || 0;
        const x1 = x + width;
        const y1 = y + height;

        this.positionArray[0] = this.positionArray[4] = this.positionArray[6] = x;
        this.positionArray[1] = this.positionArray[3] = this.positionArray[9] = y;
        this.positionArray[2] = this.positionArray[8] = this.positionArray[10] = x1;
        this.positionArray[5] = this.positionArray[7] = this.positionArray[11] = y1;
    }

    if (key === "transform") {
        this.exec(updateTransformMatrix, this.p_matrix);
        // const { translateX, translateY, scaleX, scaleY } = parseTransform(this.attr.transform);
        // this.transform = new Float32Array([translateX, translateY, scaleX, scaleY]);
    }
};

ImageNode.prototype.setStyle = function (key, value) {
    if (value) {
        this.style[key] = value;
    } else if (this.style[key]) {
        delete this.style[key];
    }
    // if (this.shader && key === 'opacity') {
    // 	this.shader.updateOpacity(this.pindex, value);
    // }
};

ImageNode.prototype.getAttr = function (key) {
    return this.attr[key];
};

ImageNode.prototype.getStyle = function (key) {
    return this.style[key];
};

ImageNode.prototype.in = function RIinfun(co) {
    const { width = 0, height = 0, x = 0, y = 0 } = this.attr;
    return co.x >= x && co.x <= x + width && co.y >= y && co.y <= y + height;
};

ImageNode.prototype.updateBBox = function RIupdateBBox() {
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
};

function WebglGroupNode(ctx, attr, style, renderTarget, vDomIndex) {
    // let self = this;
    this.ctx = ctx;
    this.attr = attr;
    this.style = style;
    this.renderTarget = renderTarget;
    this.vDomIndex = vDomIndex;
    if (attr.shaderType) {
        this.shader = getTypeShader(
            ctx,
            attr,
            style,
            attr.shaderType,
            this.renderTarget,
            vDomIndex
        );
    }

    this.projectionMatrix = m3.projection(
        this.ctx.canvas.width / ratio,
        this.ctx.canvas.height / ratio
    );
    this.transformMatrix = m3.multiply(this.projectionMatrix, m3.identity());

    if (this.attr.transform) {
        this.exec(updateTransformMatrix, null);
    }
}

WebglGroupNode.prototype = new WebglDom();
WebglGroupNode.prototype.constructor = WebglGroupNode;

WebglGroupNode.prototype.applyTransformationMatrix = function (matrix) {
    this.p_matrix = matrix;
    this.exec(updateTransformMatrix, matrix);
    this.transformMatrix = m3.multiply(this.transformMatrix, matrix);
};

WebglGroupNode.prototype.setAttr = function (key, value) {
    this.attr[key] = value;
    if (key === "shaderType") {
        this.shader = getTypeShader(
            this.ctx,
            this.attr,
            this.style,
            value,
            this.renderTarget,
            this.vDomIndex
        );
    }
    if (key === "transform") {
        this.exec(updateTransformMatrix, this.p_matrix);
    }
};

WebglGroupNode.prototype.setShader = function () {};

WebglGroupNode.prototype.in = function RGinfun(coOr) {
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

WebglGroupNode.prototype.updateBBox = function RGupdateBBox(children) {
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
            if (!d) {
                continue;
            }
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

const defaultColor = colorMap.rgba(0, 0, 0, 255);

function webGlAttrMapper(ctx, program, attr, attrObj) {
    let valType = attrObj.type;
    if (!valType) {
        valType = "FLOAT";
        if (attrObj.value instanceof Float32Array) {
            valType = "FLOAT";
        } else if (attrObj.value instanceof Int8Array) {
            valType = "BYTE";
        } else if (attrObj.value instanceof Int16Array) {
            valType = "SHORT";
        } else if (attrObj.value instanceof Uint8Array) {
            valType = "UNSIGNED_BYTE";
        } else if (attrObj.value instanceof Uint16Array) {
            valType = "UNSIGNED_SHORT";
        }
    }

    const buffer = ctx.createBuffer();
    const newAttrObj = {
        bufferType: ctx.ARRAY_BUFFER,
        buffer: buffer,
        drawType: ctx.STATIC_DRAW,
        valueType: ctx[valType],
        size: attrObj.size,
        attributeLocation: ctx.getAttribLocation(program, attr),
        value: attrObj.value,
        attr: attr,
    };

    ctx.bindBuffer(newAttrObj.bufferType, newAttrObj.buffer);
    ctx.bufferData(newAttrObj.bufferType, newAttrObj.value, newAttrObj.drawType);

    return newAttrObj;
}

function webGlIndexMapper(ctx, program, attrObj) {
    let valType = "FLOAT";
    if (attrObj.value instanceof Float32Array) {
        valType = "FLOAT";
    } else if (attrObj.value instanceof Int8Array) {
        valType = "BYTE";
    } else if (attrObj.value instanceof Int16Array) {
        valType = "SHORT";
    } else if (attrObj.value instanceof Uint8Array) {
        valType = "UNSIGNED_BYTE";
    } else if (attrObj.value instanceof Uint16Array) {
        valType = "UNSIGNED_SHORT";
    }

    return {
        bufferType: ctx.ELEMENT_ARRAY_BUFFER,
        buffer: ctx.createBuffer(),
        drawType: ctx.STATIC_DRAW,
        valueType: ctx[valType],
        value: attrObj.value,
        count: attrObj.count,
        offset: attrObj.offset,
    };
}

function webGlUniformMapper(ctx, program, uniform, uniObj) {
    let type;
    const len = uniObj.size ? uniObj.size : uniObj.value.length;
    if (!uniObj.matrix) {
        if (uniObj.value instanceof TextureObject) {
            type = "uniform1i";
        } else if (uniObj.value instanceof Float32Array) {
            type = "uniform" + len + "fv";
        } else if (
            uniObj.value instanceof Int8Array ||
            uniObj.value instanceof Int16Array ||
            uniObj.value instanceof Uint8Array
        ) {
            type = "uniform" + len + "iv";
        } else if (!Number.isInteger(uniObj.value)) {
            type = "uniform1f";
        } else if (Number.isInteger(uniObj.value)) {
            type = "uniform1i";
        }
    } else {
        if (Number.isInteger(Math.sqrt(uniObj.value.length))) {
            type = "uniformMatrix" + Math.sqrt(uniObj.value.length) + "fv";
        } else {
            console.error("Not Square Matrix");
        }
    }

    return {
        matrix: uniObj.matrix,
        transpose: uniObj.transpose === undefined ? false : uniObj.transpose,
        type: type,
        value: uniObj.value,
        uniformLocation: ctx.getUniformLocation(program, uniform),
    };
}

function RenderWebglShader(ctx, shader, vDomIndex) {
    this.ctx = ctx;
    this.dom = {
        BBoxHit: {
            x: 0,
            y: 0,
            height: 0,
            width: 0,
        },
    };
    this.shader = shader;
    this.vDomIndex = vDomIndex;
    this.program = getProgram(ctx, shader);
    this.uniforms = {};
    this.attr = {};
    this.attrObjs = {};
    this.indexesObj = null;
    this.preDraw = shader.preDraw;
    this.postDraw = shader.postDraw;
    this.geometry = shader.geometry;
    this.renderTarget = shader.renderTarget;

    for (const uniform in shader.uniforms) {
        this.uniforms[uniform] = webGlUniformMapper(
            ctx,
            this.program,
            uniform,
            shader.uniforms[uniform]
        );
    }

    if (this.geometry) {
        if (
            this.geometry instanceof MeshGeometry ||
            this.geometry instanceof PointsGeometry ||
            this.geometry instanceof LineGeometry
        ) {
            this.attributes = this.geometry.attributes;
            this.indexes = this.geometry.indexes;
        } else {
            console.error("Wrong Geometry type");
        }
    }

    for (const attr in this.attributes) {
        this.attrObjs[attr] = webGlAttrMapper(ctx, this.program, attr, this.attributes[attr]);
    }

    if (this.indexes) {
        this.indexesObj = webGlIndexMapper(ctx, this.program, this.indexes);
    }
}

RenderWebglShader.prototype = new ShaderNodePrototype();
RenderWebglShader.prototype.constructor = RenderWebglShader;

RenderWebglShader.prototype.useProgram = function () {
    this.ctx.useProgram(this.program);
};

RenderWebglShader.prototype.applyUniforms = function () {
    for (const uniform in this.uniforms) {
        if (this.uniforms[uniform].matrix) {
            this.ctx[this.uniforms[uniform].type](
                this.uniforms[uniform].uniformLocation,
                this.uniforms[uniform].transpose,
                this.uniforms[uniform].value
            );
        } else {
            if (this.uniforms[uniform].value instanceof TextureObject) {
                this.ctx[this.uniforms[uniform].type](
                    this.uniforms[uniform].uniformLocation,
                    this.uniforms[uniform].value.texture
                );
                this.uniforms[uniform].value.loadTexture();
            } else {
                this.ctx[this.uniforms[uniform].type](
                    this.uniforms[uniform].uniformLocation,
                    this.uniforms[uniform].value
                );
            }
        }
    }
};

RenderWebglShader.prototype.applyAttributes = function () {
    let d;
    for (const attr in this.attrObjs) {
        d = this.attrObjs[attr];
        if (attr === "a_transformMatrix") {
            this.ctx.enableVertexAttribArray(d.attributeLocation + 0);
            this.ctx.enableVertexAttribArray(d.attributeLocation + 1);
            this.ctx.enableVertexAttribArray(d.attributeLocation + 2);
            this.ctx.bindBuffer(d.bufferType, d.buffer);
            this.ctx.vertexAttribPointer(
                d.attributeLocation + 0,
                d.size,
                d.valueType,
                false,
                d.size * 4 * 3,
                3 * 4 * 0
            );
            this.ctx.vertexAttribPointer(
                d.attributeLocation + 1,
                d.size,
                d.valueType,
                false,
                d.size * 4 * 3,
                3 * 4 * 1
            );
            this.ctx.vertexAttribPointer(
                d.attributeLocation + 2,
                d.size,
                d.valueType,
                false,
                d.size * 4 * 3,
                3 * 4 * 2
            );
        } else {
            this.ctx.enableVertexAttribArray(d.attributeLocation);
            this.ctx.bindBuffer(d.bufferType, d.buffer);
            this.ctx.vertexAttribPointer(d.attributeLocation, d.size, d.valueType, false, 0, 0);
        }
    }
};

RenderWebglShader.prototype.applyIndexes = function () {
    const d = this.indexesObj;
    this.ctx.bindBuffer(d.bufferType, d.buffer);
    this.ctx.bufferData(d.bufferType, d.value, d.drawType);
};

RenderWebglShader.prototype.draw = function () {
    this.ctx.drawArrays(
        this.ctx[this.geometry.drawType],
        this.geometry.drawRange[0],
        this.geometry.drawRange[1]
    );
};

RenderWebglShader.prototype.drawElements = function () {
    this.ctx.drawElements(
        this.ctx[this.geometry.drawType],
        this.indexesObj.count,
        this.indexesObj.type ? this.indexesObj.type : this.ctx.UNSIGNED_SHORT,
        this.indexesObj.offset
    );
};

RenderWebglShader.prototype.updateBBox = function (argument) {
    return true;
};

RenderWebglShader.prototype.execute = function () {
    this.ctx.useProgram(this.program);
    this.applyUniforms();
    this.applyAttributes();
    if (this.renderTarget && this.renderTarget instanceof RenderTarget) {
        this.renderTarget.update();
    }
    if (this.indexesObj) {
        this.applyIndexes();
        this.drawElements();
    } else {
        this.draw();
    }
    if (this.renderTarget && this.renderTarget instanceof RenderTarget) {
        this.renderTarget.clear();
    }
};

RenderWebglShader.prototype.addUniform = function (key, value) {
    this.uniforms[key] = webGlUniformMapper(this.ctx, this.program, key, value);
    queueInstance.vDomChanged(this.vDomIndex);
};

RenderWebglShader.prototype.addAttribute = function (key, obj) {
    this.attributes[key] = obj;
    this.attrObjs[key] = webGlAttrMapper(this.ctx, this.program, key, obj);
    queueInstance.vDomChanged(this.vDomIndex);
};

RenderWebglShader.prototype.setAttributeData = function (key, value) {
    const attrObj = this.attrObjs[key];
    this.attributes[key].value = value;
    this.attrObjs[key].value = value;
    this.ctx.bindBuffer(attrObj.bufferType, attrObj.buffer);
    this.ctx.bufferData(attrObj.bufferType, attrObj.value, attrObj.drawType);
    queueInstance.vDomChanged(this.vDomIndex);
};
RenderWebglShader.prototype.applyAttributeData = function (key, value) {
    this.attributes[key].value = value;
    this.attrObjs[key].value = value;
    const d = this.attrObjs[key];
    this.ctx.bindBuffer(d.bufferType, d.buffer);
    this.ctx.bufferData(d.bufferType, this.attributes[d.attr].value, d.drawType);
    this.ctx.enableVertexAttribArray(d.attributeLocation);
    this.ctx.vertexAttribPointer(d.attributeLocation, d.size, d.valueType, false, 0, 0);
};
RenderWebglShader.prototype.setUniformData = function (key, value) {
    this.uniforms[key].value = value;
    queueInstance.vDomChanged(this.vDomIndex);
};
RenderWebglShader.prototype.applyUniformData = function (uniform, value) {
    this.uniforms[uniform].value = value;
    if (this.uniforms[uniform].matrix) {
        this.ctx[this.uniforms[uniform].type](
            this.uniforms[uniform].uniformLocation,
            this.uniforms[uniform].transpose,
            this.uniforms[uniform].value
        );
    } else {
        this.ctx[this.uniforms[uniform].type](
            this.uniforms[uniform].uniformLocation,
            this.uniforms[uniform].value
        );
    }
};

function ShaderNodePrototype() {}
ShaderNodePrototype.prototype.setAttr = function (attr, value) {
    this.attr[attr] = value;
    if (attr === "transform") {
        const { translateX, translateY, scaleX, scaleY } = parseTransform(this.attr.transform);
        this.selftransform = new Float32Array([translateX, translateY, scaleX, scaleY]);
    }
};
ShaderNodePrototype.prototype.translate = function (trans) {
    this.attr.transform.translate = trans;
};
ShaderNodePrototype.prototype.scale = function (scale) {
    this.attr.transform.scale = scale;
};
ShaderNodePrototype.prototype.rotate = function (angle) {
    this.attr.transform.rotate = angle;
};

function addTransform(self, index, length, transform) {
    self.transform =
        self.transformTyped && self.transformTyped.length > 0
            ? Array.from(self.transformTyped)
            : self.transform;
    self.transformTyped = null;
    const len = index * length * 9;
    let i = 0;
    while (i < length) {
        self.transform[len + i * 9] = transform[0];
        self.transform[len + i * 9 + 1] = transform[1];
        self.transform[len + i * 9 + 2] = transform[2];
        self.transform[len + i * 9 + 3] = transform[3];
        self.transform[len + i * 9 + 4] = transform[4];
        self.transform[len + i * 9 + 5] = transform[5];
        self.transform[len + i * 9 + 6] = transform[6];
        self.transform[len + i * 9 + 7] = transform[7];
        self.transform[len + i * 9 + 8] = transform[8];
        i++;
    }

    self.addTransform_ = true;

    self.transformUpdate = true;
}

function updateTransform(self, index, length, transform) {
    const transform_ = self.addTransform_ ? self.transform : self.transformTyped;
    const len = index * length * 9;
    let i = 0;
    while (i < length) {
        transform_[len + i * 9] = transform[0];
        transform_[len + i * 9 + 1] = transform[1];
        transform_[len + i * 9 + 2] = transform[2];
        transform_[len + i * 9 + 3] = transform[3];
        transform_[len + i * 9 + 4] = transform[4];
        transform_[len + i * 9 + 5] = transform[5];
        transform_[len + i * 9 + 6] = transform[6];
        transform_[len + i * 9 + 7] = transform[7];
        transform_[len + i * 9 + 8] = transform[8];
        i++;
    }

    self.updateTransform_ = true;
}

function clearTransform(self, index, length) {
    const transform_ = self.addTransform_ ? self.transform : self.transformTyped;
    const len = index * length * 9;
    let i = 0;
    while (i < length) {
        transform_[len + i * 9] = undefined;
        transform_[len + i * 9 + 1] = undefined;
        transform_[len + i * 9 + 2] = undefined;
        transform_[len + i * 9 + 3] = undefined;
        transform_[len + i * 9 + 4] = undefined;
        transform_[len + i * 9 + 5] = undefined;
        transform_[len + i * 9 + 6] = undefined;
        transform_[len + i * 9 + 7] = undefined;
        transform_[len + i * 9 + 8] = undefined;
        i++;
    }

    self.clearTransform_ = true;

    self.filterTransformUpdate = true;
}

function transformExec(self) {
    if (self.addTransform_) {
        if (self.clearTransform_) {
            self.transform = self.transform.filter(function (d) {
                return !isNaN(d);
            });
            self.clearTransform_ = false;
        }
        self.transformTyped = new Float32Array(self.transform);
        self.transform = [];
        self.addTransform_ = false;
        self.updateTransform_ = false;
        self.shaderInstance.setAttributeData("a_transformMatrix", self.transformTyped);
    }
    if (self.clearTransform_) {
        self.transformTyped = self.transformTyped.filter(function (d) {
            return !isNaN(d);
        });
        self.clearTransform_ = false;
        self.shaderInstance.setAttributeData("a_transformMatrix", self.transformTyped);
    }
    if (self.updateTransform_) {
        self.shaderInstance.setAttributeData("a_transformMatrix", self.transformTyped);
        self.updateTransform_ = false;
    }
}

function addVertex(self, index, length, ver) {
    self.positionArray =
        self.typedPositionArray && self.typedPositionArray.length > 0
            ? Array.from(self.typedPositionArray)
            : self.positionArray;
    self.typedPositionArray = null;
    const b = index * length * 2;
    let i = 0;
    while (i < ver.length) {
        self.positionArray[b + i] = ver[i];
        i++;
    }
    self.addVertex_ = true;
    // self.vertexUpdate = true;
}

function updateVertex(self, index, length, ver) {
    const positionArray = self.addVertex_ ? self.positionArray : self.typedPositionArray;
    const b = index * length * 2;
    let i = 0;
    if (isNaN(positionArray[b])) {
        console.log("overriding Nan");
    }
    while (i < ver.length) {
        positionArray[b + i] = ver[i];
        i++;
    }
    self.updateVertex_ = true;
}

function clearVertex(self, index, length) {
    const positionArray = self.addVertex_ ? self.positionArray : self.typedPositionArray;
    const b = index * length * 2;
    let i = 0;
    while (i < length) {
        positionArray[b + i * 2] = undefined;
        positionArray[b + i * 2 + 1] = undefined;
        i++;
    }
    self.filterVertex_ = true;
    // self.filterPositionFlag = true;
}

function vertexExec(self) {
    if (self.addVertex_) {
        if (self.filterVertex_) {
            self.positionArray = self.positionArray.filter(function (d) {
                return !isNaN(d);
            });
            self.filterVertex_ = false;
        }
        self.typedPositionArray = new Float32Array(self.positionArray);
        self.positionArray = [];
        self.addVertex_ = false;
        self.updateVertex_ = false;
        self.shaderInstance.setAttributeData("a_position", self.typedPositionArray);
    }
    if (self.filterVertex_) {
        self.typedPositionArray = self.typedPositionArray.filter(function (d) {
            return !isNaN(d);
        });
        self.filterVertex_ = false;
        self.shaderInstance.setAttributeData("a_position", self.typedPositionArray);
    }
    if (self.updateVertex_) {
        self.shaderInstance.setAttributeData("a_position", self.typedPositionArray);
        self.updateVertex_ = false;
    }
}

function addColors(self, index, length, fill) {
    self.colorArray =
        self.typedColorArray && self.typedColorArray.length > 0
            ? Array.from(self.typedColorArray)
            : self.colorArray;
    self.typedColorArray = null;
    const b = index * length * 4;
    let i = 0;
    fill = colorMap.colorToRGB(fill);
    while (i < length) {
        self.colorArray[b + i * 4] = fill.r / 255;
        self.colorArray[b + i * 4 + 1] = fill.g / 255;
        self.colorArray[b + i * 4 + 2] = fill.b / 255;
        self.colorArray[b + i * 4 + 3] = fill.a === undefined ? 1 : fill.a / 255;
        i++;
    }
    self.addColor_ = true;
}

function updateColor(self, index, length, fill) {
    const colorArray = self.addColor_ ? self.colorArray : self.typedColorArray;
    const ti = index * length * 4;
    if (isNaN(colorArray[ti])) {
        console.log("overriding Nan");
    }
    const b = index * length * 4;
    let i = 0;
    while (i < length) {
        colorArray[b + i * 4] = fill.r / 255;
        colorArray[b + i * 4 + 1] = fill.g / 255;
        colorArray[b + i * 4 + 2] = fill.b / 255;
        colorArray[b + i * 4 + 3] = fill.a === undefined ? 1 : fill.a / 255;
        i++;
    }
    self.updateColor_ = true;
}

function clearColor(self, index, length) {
    const colorArray = self.addColor_ ? self.colorArray : self.typedColorArray;
    const ti = index * length * 4;
    if (isNaN(colorArray[ti])) {
        console.log("overriding Nan");
    }
    const b = index * length * 4;
    let i = 0;
    while (i < length) {
        colorArray[b + i * 4] = undefined;
        colorArray[b + i * 4 + 1] = undefined;
        colorArray[b + i * 4 + 2] = undefined;
        colorArray[b + i * 4 + 3] = undefined;
        i++;
    }
    self.filterColor_ = true;
}

function colorExec(self) {
    if (self.addColor_) {
        if (self.filterColor_) {
            self.colorArray = self.colorArray.filter(function (d) {
                return !isNaN(d);
            });
            self.filterColor_ = false;
        }
        self.typedColorArray = new Float32Array(self.colorArray);
        self.colorArray = [];
        self.addColor_ = false;
        self.updateColor_ = false;
        self.shaderInstance.setAttributeData("a_color", self.typedColorArray);
    }
    if (self.filterColor_) {
        self.typedColorArray = self.typedColorArray.filter(function (d) {
            return !isNaN(d);
        });
        self.shaderInstance.setAttributeData("a_color", self.typedColorArray);
        self.filterColor_ = false;
    }
    if (self.updateColor_) {
        self.shaderInstance.setAttributeData("a_color", self.typedColorArray);
        self.updateColor_ = false;
    }
}

function RenderWebglPoints(ctx, attr, style, vDomIndex) {
    this.ctx = ctx;
    this.dom = {};
    this.attr = attr || {};
    this.style = style || {};
    this.vDomIndex = vDomIndex;
    this.indexBased = true;
    this.transform = [];
    this.selftransform = [0, 0, 1, 1];

    if (!this.attr.transform) {
        this.attr.transform = {
            translate: [0.0, 0.0],
            scale: [1.0, 1.0],
        };
    }
    this.geometry = new PointsGeometry();
    this.geometry.setAttr("a_color", {
        value: new Float32Array([]),
        size: 4,
    });
    this.geometry.setAttr("a_size", {
        value: new Float32Array([]),
        size: 1,
    });
    this.geometry.setAttr("a_position", {
        value: new Float32Array([]),
        size: 2,
    });
    this.geometry.setAttr("a_transformMatrix", {
        value: new Float32Array(this.transform),
        size: 3,
    });

    this.shaderInstance = new RenderWebglShader(
        ctx,
        {
            fragmentShader: shaders("point").fragmentShader,
            vertexShader: shaders("point").vertexShader,
            uniforms: {},
            geometry: this.geometry,
        },
        vDomIndex
    );

    this.positionArray = [];
    this.colorArray = [];
    this.pointsSize = [];
    this.transform = [];

    this.vertexUpdate = true;
    this.colorUpdate = true;
    this.sizeUpdate = true;
    this.transformUpdate = true;
}

RenderWebglPoints.prototype = new ShaderNodePrototype();
RenderWebglPoints.prototype.constructor = RenderWebglPoints;

RenderWebglPoints.prototype.clear = function (index) {
    clearColor(this, index, 1);
    clearVertex(this, index, 1);
    clearTransform(this, index, 1);

    const sizeArray = this.sizeUpdate ? this.pointsSize : this.typedSizeArray;
    sizeArray[index] = undefined;

    this.filterSizeFlag = true;
};

RenderWebglPoints.prototype.addTransform = function (transform, index) {
    addTransform(this, index, 1, transform);
};

RenderWebglPoints.prototype.updateTransform = function (index, transform) {
    updateTransform(this, index, 1, transform);
};

RenderWebglPoints.prototype.updateVertex = function (index, x, y) {
    updateVertex(this, index, 1, [x, y]);
};

RenderWebglPoints.prototype.updateSize = function (index, size) {
    const sizeArray = this.sizeUpdate ? this.pointsSize : this.typedSizeArray;
    sizeArray[index] = size;
};

RenderWebglPoints.prototype.updateColor = function (index, fill) {
    updateColor(this, index, 1, fill);
};

RenderWebglPoints.prototype.addVertex = function (x, y, index) {
    addVertex(this, index, 1, [x, y]);
};

RenderWebglPoints.prototype.addSize = function (size, index) {
    this.pointsSize =
        this.typedSizeArray && this.typedSizeArray.length > 0
            ? Array.from(this.typedSizeArray)
            : this.pointsSize;
    this.pointsSize[index] = size;
    this.sizeUpdate = true;
};

RenderWebglPoints.prototype.addColors = function (fill, index) {
    addColors(this, index, 1, fill);
};

RenderWebglPoints.prototype.execute = function (stack) {
    if (this.renderTarget && this.renderTarget instanceof RenderTarget) {
        this.renderTarget.update();
    }

    vertexExec(this);
    colorExec(this);
    transformExec(this);
    if (this.sizeUpdate) {
        if (this.filterSizeFlag) {
            this.pointsSize = this.pointsSize.filter(function (d) {
                return !isNaN(d);
            });
            this.filterSizeFlag = false;
        }
        this.typedSizeArray = new Float32Array(this.pointsSize);
        this.pointsSize = [];
        this.sizeUpdate = false;
    }
    if (this.filterSizeFlag) {
        this.typedSizeArray = this.typedSizeArray.filter(function (d) {
            return !isNaN(d);
        });
        this.filterSizeFlag = false;
    }
    this.shaderInstance.setAttributeData("a_size", this.typedSizeArray);
    this.geometry.setDrawRange(0, this.typedPositionArray.length / 2);

    this.shaderInstance.execute();
    if (this.renderTarget && this.renderTarget instanceof RenderTarget) {
        this.renderTarget.update();
    }
};

function RenderWebglRects(ctx, attr, style, renderTarget, vDomIndex) {
    this.ctx = ctx;
    this.dom = {};
    this.positionArray = [];
    this.colorArray = [];
    this.transform = [];
    this.rotate = [];
    this.attr = attr || {};
    this.style = style || {};
    this.vDomIndex = vDomIndex;
    this.renderTarget = renderTarget;
    this.indexBased = true;
    this.selftransform = [0, 0, 1, 1];

    if (!this.attr.transform) {
        this.attr.transform = {
            translate: [0.0, 0.0],
            scale: [1.0, 1.0],
        };
    }

    this.geometry = new MeshGeometry();
    this.geometry.setAttr("a_transformMatrix", {
        value: new Float32Array(this.transform),
        size: 3,
    });
    this.geometry.setAttr("a_color", {
        value: new Float32Array(this.colorArray),
        size: 4,
    });
    this.geometry.setAttr("a_position", {
        value: new Float32Array(this.positionArray),
        size: 2,
    });
    this.geometry.setDrawRange(0, this.positionArray.length / 2);

    this.shaderInstance = new RenderWebglShader(
        ctx,
        {
            fragmentShader: shaders("rect").fragmentShader,
            vertexShader: shaders("rect").vertexShader,
            uniforms: {},
            geometry: this.geometry,
        },
        vDomIndex
    );
}

RenderWebglRects.prototype = new ShaderNodePrototype();
RenderWebglRects.prototype.constructor = RenderWebglRects;

RenderWebglRects.prototype.clear = function (index) {
    clearColor(this, index, 6);
    clearVertex(this, index, 6);
    clearTransform(this, index, 6);
};

RenderWebglRects.prototype.updateVertex = function (index, x, y, width, height) {
    const x1 = x + width;
    const y1 = y + height;
    updateVertex(this, index, 6, [x, y, x1, y, x, y1, x, y1, x1, y, x1, y1]);
};

RenderWebglRects.prototype.updateTransform = function (index, transform) {
    updateTransform(this, index, 6, transform);
};

RenderWebglRects.prototype.addTransform = function (transform, index) {
    addTransform(this, index, 6, transform);
};

RenderWebglRects.prototype.updateColor = function (index, fill) {
    updateColor(this, index, 6, fill);
};

RenderWebglRects.prototype.addVertex = function (x, y, width, height, index) {
    const x1 = x + width;
    const y1 = y + height;
    addVertex(this, index, 6, [x, y, x1, y, x, y1, x, y1, x1, y, x1, y1]);
};

RenderWebglRects.prototype.addColors = function (fill, index) {
    addColors(this, index, 6, fill);
};

RenderWebglRects.prototype.execute = function (stack) {
    if (this.renderTarget && this.renderTarget instanceof RenderTarget) {
        this.renderTarget.update();
    }

    colorExec(this);
    transformExec(this);
    vertexExec(this);
    this.geometry.setDrawRange(0, this.typedPositionArray.length / 2);
    this.shaderInstance.execute();
    if (this.renderTarget && this.renderTarget instanceof RenderTarget) {
        this.renderTarget.clear();
    }
};

function RenderWebglLines(ctx, attr, style, renderTarget, vDomIndex) {
    this.ctx = ctx;
    this.dom = {};
    this.attr = attr || {};
    this.style = style || {};
    this.vDomIndex = vDomIndex;
    this.positionArray = [];
    this.colorArray = [];
    this.transform = [];
    this.vertexUpdate = true;
    this.colorUpdate = true;
    this.renderTarget = renderTarget;
    this.indexBased = true;

    this.selftransform = new Float32Array([0, 0, 1, 1]);

    if (!this.attr.transform) {
        this.attr.transform = {
            translate: [0.0, 0.0],
            scale: [1.0, 1.0],
        };
    }

    this.geometry = new LineGeometry();
    this.geometry.setAttr("a_color", {
        value: new Float32Array(this.colorArray),
        size: 4,
    });
    this.geometry.setAttr("a_position", {
        value: new Float32Array(this.positionArray),
        size: 2,
    });
    this.geometry.setAttr("a_transformMatrix", {
        value: new Float32Array(this.transform),
        size: 3,
    });

    this.geometry.setDrawRange(0, this.positionArray.length / 2);

    this.shaderInstance = new RenderWebglShader(
        ctx,
        {
            fragmentShader: shaders("line").fragmentShader,
            vertexShader: shaders("line").vertexShader,
            uniforms: {},
            geometry: this.geometry,
        },
        vDomIndex
    );
}

RenderWebglLines.prototype = new ShaderNodePrototype();
RenderWebglLines.prototype.constructor = RenderWebglLines;

RenderWebglLines.prototype.clear = function (index) {
    clearColor(this, index, 2);
    clearVertex(this, index, 2);
};

RenderWebglLines.prototype.updateTransform = function (index, transform) {
    updateTransform(this, index, 2, transform);
};

RenderWebglLines.prototype.addTransform = function (transform, index) {
    addTransform(this, index, 2, transform);
};

RenderWebglLines.prototype.updateVertex = function (index, x1, y1, x2, y2) {
    updateVertex(this, index, 2, [x1, y1, x2, y2]);
};

RenderWebglLines.prototype.updateColor = function (index, stroke) {
    updateColor(this, index, 2, stroke);
};

RenderWebglLines.prototype.addVertex = function (x1, y1, x2, y2, index) {
    addVertex(this, index, 2, [x1, y1, x2, y2]);
};

RenderWebglLines.prototype.addColors = function (stroke, index) {
    addColors(this, index, 2, stroke);
};

RenderWebglLines.prototype.execute = function (stack) {
    if (this.renderTarget && this.renderTarget instanceof RenderTarget) {
        this.renderTarget.update();
    }
    vertexExec(this);
    colorExec(this);
    transformExec(this);
    this.geometry.setDrawRange(0, this.typedPositionArray.length / 2);
    this.shaderInstance.execute();
    if (this.renderTarget && this.renderTarget instanceof RenderTarget) {
        this.renderTarget.clear();
    }
};

function RenderWebglPolyLines(ctx, attr, style, renderTarget, vDomIndex) {
    this.ctx = ctx;
    this.dom = {};
    this.attr = attr || {};
    this.style = style || {};
    this.vDomIndex = vDomIndex;
    this.positionArray = [];
    this.colorArray = [];
    this.renderTarget = renderTarget;
    this.indexBased = false;

    if (!this.attr.transform) {
        this.attr.transform = {
            translate: [0.0, 0.0],
            scale: [1.0, 1.0],
        };
    }
    const { translateX, translateY, scaleX, scaleY } = parseTransform(this.attr.transform);
    this.transform = new Float32Array([translateX, translateY, scaleX, scaleY]);

    this.geometry = new LineGeometry();
    this.geometry.drawType = "LINE_STRIP";
    this.geometry.setAttr("a_position", {
        value: new Float32Array(this.positionArray),
        size: 2,
    });
    this.geometry.setDrawRange(0, this.positionArray.length / 2);

    this.shaderInstance = new RenderWebglShader(
        ctx,
        {
            fragmentShader: shaders("polyline").fragmentShader,
            vertexShader: shaders("polyline").vertexShader,
            uniforms: {
                u_transformMatrix: {
                    value: new Float32Array(m3.identity()),
                    matrix: true,
                },
                u_color: {
                    value: new Float32Array(4),
                },
            },
            geometry: this.geometry,
        },
        vDomIndex
    );
}

RenderWebglPolyLines.prototype = new ShaderNodePrototype();
RenderWebglPolyLines.prototype.constructor = RenderWebglPolyLines;

RenderWebglPolyLines.prototype.execute = function (stack) {
    if (this.renderTarget && this.renderTarget instanceof RenderTarget) {
        this.renderTarget.update();
    }

    for (let i = 0, len = stack.length; i < len; i++) {
        this.shaderInstance.applyUniformData("u_transformMatrix", stack[i].dom.transformMatrix);
        this.shaderInstance.setAttributeData("a_position", stack[i].dom.points);
        this.shaderInstance.setUniformData("u_color", stack[i].dom.color);
        this.geometry.setDrawRange(0, stack[i].dom.points.length / 2);
        this.shaderInstance.execute();
    }

    if (this.renderTarget && this.renderTarget instanceof RenderTarget) {
        this.renderTarget.clear();
    }
};

function RenderWebglPolygons(ctx, attr, style, renderTarget, vDomIndex) {
    this.ctx = ctx;
    this.dom = {};
    this.attr = attr || {};
    this.style = style || {};
    this.vDomIndex = vDomIndex;
    this.colorArray = [];
    this.positionArray = [];
    this.renderTarget = renderTarget;
    this.indexBased = false;

    if (!this.attr.transform) {
        this.attr.transform = {
            translate: [0.0, 0.0],
            scale: [1.0, 1.0],
        };
    }

    const { translateX, translateY, scaleX, scaleY } = parseTransform(this.attr.transform);
    this.transform = new Float32Array([translateX, translateY, scaleX, scaleY]);

    this.geometry = new MeshGeometry();

    this.geometry.setAttr("a_position", {
        value: new Float32Array([]),
        size: 2,
    });

    this.shaderInstance = new RenderWebglShader(
        ctx,
        {
            fragmentShader: shaders("polygon").fragmentShader,
            vertexShader: shaders("polygon").vertexShader,
            uniforms: {
                u_transformMatrix: {
                    value: new Float32Array(m3.identity()),
                    matrix: true,
                },
                u_color: {
                    value: new Float32Array(4),
                },
            },
            geometry: this.geometry,
        },
        vDomIndex
    );
}

RenderWebglPolygons.prototype = new ShaderNodePrototype();
RenderWebglPolygons.prototype.constructor = RenderWebglPolygons;

RenderWebglPolygons.prototype.execute = function (stack) {
    if (this.renderTarget && this.renderTarget instanceof RenderTarget) {
        this.renderTarget.update();
    }

    this.shaderInstance.useProgram();
    for (let i = 0, len = stack.length; i < len; i++) {
        this.shaderInstance.applyUniformData("u_transformMatrix", stack[i].dom.transformMatrix);
        this.shaderInstance.setAttributeData("a_position", stack[i].dom.points);
        this.shaderInstance.setUniformData("u_color", stack[i].dom.color);
        this.geometry.setDrawRange(0, stack[i].dom.points.length / 2);
        this.shaderInstance.execute();
    }

    if (this.renderTarget && this.renderTarget instanceof RenderTarget) {
        this.renderTarget.clear();
    }
};

function RenderWebglCircles(ctx, attr, style, renderTarget, vDomIndex) {
    this.ctx = ctx;
    this.dom = {};
    this.attr = attr || {};
    this.style = style || {};
    this.vDomIndex = vDomIndex;
    this.positionArray = [];
    this.colorArray = [];
    this.transform = [];
    this.pointsSize = [];
    this.renderTarget = renderTarget;
    this.indexBased = true;

    if (!this.attr.transform) {
        this.attr.transform = {
            translate: [0.0, 0.0],
            scale: [1.0, 1.0],
        };
    }

    this.geometry = new PointsGeometry();
    this.geometry.setAttr("a_transformMatrix", {
        value: new Float32Array(this.transform),
        size: 3,
    });
    this.geometry.setAttr("a_color", {
        value: new Float32Array(this.colorArray),
        size: 4,
    });
    this.geometry.setAttr("a_radius", {
        value: new Float32Array(this.pointsSize),
        size: 1,
    });
    this.geometry.setAttr("a_position", {
        value: new Float32Array(this.positionArray),
        size: 2,
    });

    this.geometry.setDrawRange(0, 0);

    this.shaderInstance = new RenderWebglShader(
        ctx,
        {
            fragmentShader: shaders("circle").fragmentShader,
            vertexShader: shaders("circle").vertexShader,
            uniforms: {
                // u_resolution: {
                //     value: new Float32Array([1.0, 1.0]),
                // },
                // u_transform: {
                //     value: this.selftransform,
                //     size: 4,
                // },
            },
            geometry: this.geometry,
        },
        vDomIndex
    );

    // this.vertexUpdate = true;
    // this.colorUpdate = true;
    // this.sizeUpdate = true;
    // this.transformUpdate = true;
}

RenderWebglCircles.prototype = new ShaderNodePrototype();
RenderWebglCircles.prototype.constructor = RenderWebglCircles;

RenderWebglCircles.prototype.clear = function (index) {
    clearColor(this, index, 1);
    clearVertex(this, index, 1);
    clearTransform(this, index, 1);

    const sizeArray = this.sizeUpdate ? this.pointsSize : this.typedSizeArray;
    sizeArray[index] = undefined;

    this.filterSizeFlag = true;
};

RenderWebglCircles.prototype.updateTransform = function (index, transform) {
    updateTransform(this, index, 1, transform);
};

RenderWebglCircles.prototype.addTransform = function (transform, index) {
    addTransform(this, index, 1, transform);
};

RenderWebglCircles.prototype.updateVertex = function (index, x, y) {
    updateVertex(this, index, 1, [x, y]);
};

RenderWebglCircles.prototype.updateColor = function (index, fill) {
    updateColor(this, index, 1, fill);
};

RenderWebglCircles.prototype.updateSize = function (index, value) {
    const sizeArray = this.sizeUpdate ? this.pointsSize : this.typedSizeArray;
    sizeArray[index] = value;
};

RenderWebglCircles.prototype.addVertex = function (x, y, index) {
    addVertex(this, index, 1, [x, y]);
};

RenderWebglCircles.prototype.addSize = function (size, index) {
    this.pointsSize =
        this.typedSizeArray && this.typedSizeArray.length > 0
            ? Array.from(this.typedSizeArray)
            : this.pointsSize;
    this.pointsSize[index] = size;
    this.sizeUpdate = true;
};

RenderWebglCircles.prototype.addColors = function (fill, index) {
    addColors(this, index, 1, fill);
};

RenderWebglCircles.prototype.execute = function (stack) {
    if (this.renderTarget && this.renderTarget instanceof RenderTarget) {
        this.renderTarget.update();
    }

    vertexExec(this);
    colorExec(this);
    transformExec(this);
    if (this.sizeUpdate) {
        if (this.filterSizeFlag) {
            this.pointsSize = this.pointsSize.filter(function (d) {
                return !isNaN(d);
            });
            this.filterSizeFlag = false;
        }
        this.typedSizeArray = new Float32Array(this.pointsSize);
        this.pointsSize = [];
        this.sizeUpdate = false;
    }
    if (this.filterSizeFlag) {
        this.typedSizeArray = this.typedSizeArray.filter(function (d) {
            return !isNaN(d);
        });
        this.filterSizeFlag = false;
    }

    // this.shaderInstance.setUniformData(
    //     "u_resolution",
    //     new Float32Array([this.ctx.canvas.width / ratio, this.ctx.canvas.height / ratio])
    // );
    // this.shaderInstance.setUniformData("u_transform", this.selftransform);
    this.shaderInstance.setAttributeData("a_radius", this.typedSizeArray);

    this.geometry.setDrawRange(0, this.typedPositionArray.length / 2);
    this.shaderInstance.execute();
    if (this.renderTarget && this.renderTarget instanceof RenderTarget) {
        this.renderTarget.clear();
    }
};

function RenderWebglImages(ctx, attr, style, renderTarget, vDomIndex) {
    this.ctx = ctx;
    this.dom = {};
    this.attr = attr || {};
    this.style = style || {};
    this.vDomIndex = vDomIndex;
    this.textCoor = new Float32Array([0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0]);
    this.renderTarget = renderTarget;
    this.indexBased = false;

    if (!this.attr.transform) {
        this.attr.transform = {
            translate: [0.0, 0.0],
            scale: [1.0, 1.0],
        };
    }

    // const { translateX, translateY, scaleX, scaleY } = parseTransform(this.attr.transform);
    // this.transform = new Float32Array([translateX, translateY, scaleX, scaleY]);

    this.geometry = new MeshGeometry();
    this.geometry.setAttr("a_texCoord", {
        value: this.textCoor,
        size: 2,
    });
    this.geometry.setAttr("a_position", {
        value: new Float32Array([0, 0]),
        size: 2,
    });
    this.geometry.setDrawRange(0, 6);

    this.shaderInstance = new RenderWebglShader(
        ctx,
        {
            fragmentShader: shaders("image").fragmentShader,
            vertexShader: shaders("image").vertexShader,
            uniforms: {
                // u_resolution: {
                //     value: new Float32Array([1.0, 1.0]),
                // },
                // u_transform: {
                //     value: new Float32Array([]),
                //     size: 4,
                // },
                // uu_transform: {
                //     value: this.transform,
                //     size: 4,
                // },
                u_transformMatrix: {
                    value: new Float32Array(m3.identity()),
                    matrix: true,
                },
                u_image: {
                    value: new TextureObject(this.ctx, {}, this.vDomIndex),
                },
                u_opacity: {
                    value: (1.0).toFixed(2),
                },
            },
            geometry: this.geometry,
        },
        vDomIndex
    );

    this.positionArray = [];
    this.vertexUpdate = true;
}

RenderWebglImages.prototype = new ShaderNodePrototype();
RenderWebglImages.prototype.constructor = RenderWebglImages;

RenderWebglImages.prototype.execute = function (stack) {
    if (this.renderTarget && this.renderTarget instanceof RenderTarget) {
        this.renderTarget.update();
    }

    this.shaderInstance.useProgram();

    // this.shaderInstance.applyUniformData(
    //     "u_resolution",
    //     new Float32Array([this.ctx.canvas.width / ratio, this.ctx.canvas.height / ratio])
    // );
    // this.shaderInstance.applyUniformData("u_transformMatrix", this.transformMatrix);
    this.shaderInstance.applyAttributeData("a_texCoord", this.textCoor);

    const gOp = this.style.opacity !== undefined ? this.style.opacity : 1.0;
    let prevTexture;
    for (let i = 0, len = stack.length; i < len; i++) {
        const node = stack[i];

        if (!node.dom.textureNode || !node.dom.textureNode.updated) {
            continue;
        }
        if (node.style.display === "none") {
            continue;
        }
        this.shaderInstance.applyUniformData("u_transformMatrix", node.dom.transformMatrix);
        if (node.dom.textureNode !== prevTexture) {
            node.dom.textureNode.loadTexture();
            prevTexture = node.dom.textureNode;
            this.shaderInstance.applyUniformData("u_image", node.dom.textureNode);
        }
        this.shaderInstance.applyAttributeData("a_position", node.dom.positionArray);
        this.shaderInstance.applyUniformData(
            "u_opacity",
            ((node.style.opacity !== undefined ? node.style.opacity : 1.0) * gOp).toFixed(2)
        );
        this.shaderInstance.draw();
    }

    if (this.renderTarget && this.renderTarget instanceof RenderTarget) {
        this.renderTarget.clear();
    }
};

function getTypeShader(ctx, attr, style, type, renderTarget, vDomIndex) {
    let e;

    switch (type) {
        case "rect":
            e = new RenderWebglRects(ctx, attr, style, renderTarget, vDomIndex);
            break;

        case "point":
            e = new RenderWebglPoints(ctx, attr, style, renderTarget, vDomIndex);
            break;

        case "line":
            e = new RenderWebglLines(ctx, attr, style, renderTarget, vDomIndex);
            break;

        case "polyline":
            e = new RenderWebglPolyLines(ctx, attr, style, renderTarget, vDomIndex);
            break;

        case "path":
            e = new RenderWebglPolyLines(ctx, attr, style, renderTarget, vDomIndex);
            break;

        case "polygon":
            e = new RenderWebglPolygons(ctx, attr, style, renderTarget, vDomIndex);
            break;

        case "circle":
            e = new RenderWebglCircles(ctx, attr, style, renderTarget, vDomIndex);
            break;

        case "image":
            e = new RenderWebglImages(ctx, attr, style, renderTarget, vDomIndex);
            break;

        case "text":
            e = new RenderWebglImages(ctx, attr, style, renderTarget, vDomIndex);
            break;

        default:
            e = null;
            break;
    }

    return e;
}

function WebglNodeExe(ctx, config, id, vDomIndex) {
    this.ctx = ctx;
    this.style = config.style || {};
    this.attr = config.attr || {};
    this.id = id;
    this.nodeName = config.el;
    this.nodeType = "WEBGL";
    this.children = [];
    this.ctx = ctx;
    this.vDomIndex = vDomIndex;
    this.el = config.el;
    this.shaderType = config.shaderType;
    this.exeCtx = config.ctx;
    this.bbox = config.bbox !== undefined ? config.bbox : true;
    this.events = {};

    switch (config.el) {
        case "point":
            this.dom = new PointNode(this.ctx, this.attr, this.style);
            break;

        case "rect":
            this.dom = new RectNode(this.ctx, this.attr, this.style);
            break;

        case "line":
            this.dom = new LineNode(this.ctx, this.attr, this.style);
            break;

        case "polyline":
            this.dom = new PolyLineNode(this.ctx, this.attr, this.style);
            break;

        case "polygon":
            this.dom = new PolygonNode(this.ctx, this.attr, this.style);
            break;

        case "path":
            this.dom = new PathNode(this.ctx, this.attr, this.style);
            break;

        case "circle":
            this.dom = new CircleNode(this.ctx, this.attr, this.style);
            break;

        case "image":
            this.dom = new ImageNode(this.ctx, this.attr, this.style, vDomIndex);
            break;

        case "text":
            this.dom = new TextNode(this.ctx, this.attr, this.style, vDomIndex);
            break;

        case "group":
            this.dom = new WebglGroupNode(
                this.ctx,
                this.attr,
                this.style,
                config.renderTarget,
                vDomIndex
            );
            break;

        default:
            this.dom = null;
            break;
    }

    this.dom.nodeExe = this;
    if (!(this.dom instanceof WebglGroupNode)) {
        delete this.createEl;
        delete this.createEls;
    }
}

WebglNodeExe.prototype = new NodePrototype();

WebglNodeExe.prototype.reIndexChildren = function () {
    this.children = this.children.filter(function (d) {
        return d;
    });
    for (var i = 0, len = this.children.length; i < len; i++) {
        this.children[i].dom.pindex = i;
    }
};

WebglNodeExe.prototype.applyTransformationMatrix = function (matrix) {
    this.dom.applyTransformationMatrix(matrix);
    this.children.forEach(function (d) {
        d.applyTransformationMatrix(self.dom.transformMatrix);
    });
};

WebglNodeExe.prototype.setAttr = function WsetAttr(attr, value) {
    const self = this;
    if (arguments.length === 2) {
        if (value == null && this.attr[attr] != null) {
            delete this.attr[attr];
        } else {
            this.attr[attr] = value;
        }
        this.dom.setAttr(attr, value);
        if (attr === "transform" && this.children.length > 0) {
            this.children.forEach(function (d) {
                d.applyTransformationMatrix(self.dom.transformMatrix);
            });
        }
    } else if (arguments.length === 1 && typeof attr === "object") {
        for (const key in attr) {
            if (attr[key] == null && this.attr[attr] != null) {
                delete this.attr[key];
            } else {
                this.attr[key] = attr[key];
            }
            this.dom.setAttr(key, attr[key]);
            if (attr === "transform" && this.children.length > 0) {
                this.children.forEach(function (d) {
                    d.applyTransformationMatrix(self.dom.transformMatrix);
                });
            }
        }
    }
    this.BBoxUpdate = true;
    queueInstance.vDomChanged(this.vDomIndex);
    return this;
};

WebglNodeExe.prototype.scale = function Cscale(XY) {
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

WebglNodeExe.prototype.translate = function Ctranslate(XY) {
    if (!this.attr.transform) {
        this.attr.transform = {};
    }

    this.attr.transform.translate = XY;
    this.dom.setAttr("transform", this.attr.transform);
    this.BBoxUpdate = true;
    queueInstance.vDomChanged(this.vDomIndex);
    return this;
};

WebglNodeExe.prototype.rotate = function Crotate(angle, x, y) {
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

WebglNodeExe.prototype.setStyle = function WsetStyle(attr, value) {
    if (arguments.length === 2) {
        if (value == null && this.style[attr] != null) {
            delete this.style[attr];
        } else {
            if (attr === "fill" || attr === "stroke") {
                value = colorMap.colorToRGB(value);
            }
            this.style[attr] = value;
        }

        this.dom.setStyle(attr, value);
    } else if (arguments.length === 1 && typeof attr === "object") {
        for (const key in attr) {
            value = attr[key];
            if (value == null && this.style[key] != null) {
                delete this.style[key];
            } else {
                if (key === "fill" || key === "stroke") {
                    value = colorMap.colorToRGB(value);
                }
                this.style[key] = value;
            }
            this.dom.setStyle(key, value);
        }
    }

    queueInstance.vDomChanged(this.vDomIndex);
    return this;
};

WebglNodeExe.prototype.setReIndex = function () {
    this.reindex = true;
};

WebglNodeExe.prototype.updateBBox = function CupdateBBox() {
    let status;

    if (this.bbox) {
        for (let i = 0, len = this.children.length; i < len; i += 1) {
            if (this.children[i]) {
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

WebglNodeExe.prototype.in = function Cinfun(co) {
    return this.dom.in(co);
};

WebglNodeExe.prototype.on = function Con(eventType, hndlr) {
    const self = this;
    // this.dom.on(eventType, hndlr);
    if (!this.events) {
        this.events = {};
    }

    if (hndlr == null && this.events[eventType] != null) {
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

WebglNodeExe.prototype.execute = function Cexecute() {
    if (this.style.display === "none") {
        return;
    }
    if (!this.dom.shader && this.dom instanceof WebglGroupNode) {
        for (let i = 0, len = this.children.length; i < len; i += 1) {
            this.children[i].execute();
        }
    } else if (this.dom.shader && this.dom instanceof WebglGroupNode) {
        if (this.reindex) {
            this.reIndexChildren();
            this.reindex = false;
        }
        if (this.exeCtx) {
            this.exeCtx(this.ctx);
        }
        this.dom.shader.execute(this.children);
    }
};

WebglNodeExe.prototype.child = function child(childrens) {
    const self = this;
    let node;
    if (self.dom instanceof WebglGroupNode) {
        for (let i = 0; i < childrens.length; i += 1) {
            node = childrens[i];
            node.dom.parent = self;
            self.children[self.children.length] = node;
            node.dom.pindex = self.children.length - 1;
            if (!(node instanceof RenderWebglShader)) {
                node.dom.setShader(this.dom.shader);
            }
            if (self.dom.attr && self.dom.attr.transform) {
                node.applyTransformationMatrix(self.dom.transformMatrix);
            }
        }
    } else {
        console.log("Error");
    }

    this.BBoxUpdate = true;
    queueInstance.vDomChanged(this.vDomIndex);
    return self;
};

WebglNodeExe.prototype.createEls = function CcreateEls(data, config) {
    const e = new WebglCollection(
        {
            type: "WEBGL",
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

WebglNodeExe.prototype.createEl = function WcreateEl(config) {
    const e = new WebglNodeExe(this.ctx, config, domId(), this.vDomIndex);
    this.child([e]);
    queueInstance.vDomChanged(this.vDomIndex);
    return e;
};

WebglNodeExe.prototype.createShaderEl = function createShader(shaderObject) {
    const e = new RenderWebglShader(this.ctx, shaderObject, this.vDomIndex);
    this.child([e]);
    queueInstance.vDomChanged(this.vDomIndex);
    return e;
};

WebglNodeExe.prototype.remove = function Wremove() {
    const { children } = this.dom.parent;
    const index = children.indexOf(this);

    if (index !== -1) {
        if (this.dom.parent.dom.shader) {
            if (this.dom.parent.dom.shader.indexBased) {
                this.dom.parent.dom.shader.clear(this.dom.pindex);
            }
            this.dom.parent.setReIndex();
            children[this.dom.pindex] = undefined;
        } else {
            children.splice(index, 1);
        }
    }

    this.BBoxUpdate = true;
    queueInstance.vDomChanged(this.vDomIndex);
};

WebglNodeExe.prototype.removeChild = function WremoveChild(obj) {
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

function webglLayer(container, contextConfig = {}, layerSettings = {}) {
    const res = container ? document.querySelector(container) : null;
    let height = res ? res.clientHeight : 0;
    let width = res ? res.clientWidth : 0;
    let clearColor = colorMap.rgba(0, 0, 0, 0);
    const { enableEvents = false, autoUpdate = true, enableResize = false } = layerSettings;

    contextConfig = contextConfig || {
        premultipliedAlpha: false,
        depth: false,
        antialias: false,
        alpha: true,
    };

    contextConfig.premultipliedAlpha =
        contextConfig.premultipliedAlpha === undefined ? false : contextConfig.premultipliedAlpha;
    contextConfig.depth = contextConfig.depth === undefined ? false : contextConfig.depth;
    contextConfig.antialias =
        contextConfig.antialias === undefined ? false : contextConfig.antialias;
    contextConfig.alpha = contextConfig.alpha === undefined ? true : contextConfig.alpha;

    const layer = document.createElement("canvas");
    const ctx = layer.getContext("webgl", contextConfig);

    const actualPixel = getPixlRatio(ctx);

    ratio = actualPixel >= 2 ? 2 : Math.floor(actualPixel);
    // ctx.enable(ctx.BLEND);
    // ctx.blendFunc(ctx.ONE, ctx.ONE_MINUS_SRC_ALPHA);
    // ctx.clearColor(clearColor.r, clearColor.g, clearColor.b, clearColor.a);
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
    }

    const root = new WebglNodeExe(
        ctx,
        {
            el: "group",
            attr: {
                id: "rootNode",
            },
            ctx: function (ctx) {
                ctx.enable(ctx.BLEND);
                ctx.blendFunc(ctx.ONE, ctx.ONE_MINUS_SRC_ALPHA);
                ctx.clearColor(clearColor.r, clearColor.g, clearColor.b, clearColor.a);
            },
        },
        domId(),
        vDomIndex
    );

    if (vDomInstance) {
        vDomInstance.rootNode(root);
    }
    const execute = root.execute.bind(root);
    root.container = res;
    root.domEl = layer;
    root.height = height;
    root.width = width;
    root.type = "WEBGL";
    root.ctx.pixelRatio = ratio;

    let onClear = function (ctx) {
        ctx.viewport(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.clear(ctx.COLOR_BUFFER_BIT | ctx.DEPTH_BUFFER_BIT);
    };

    root.execute = function () {
        onClear(this.ctx);
        this.updateBBox();
        this.ctx.enable(this.ctx.BLEND);
        this.ctx.blendFunc(this.ctx.SRC_ALPHA, this.ctx.ONE_MINUS_SRC_ALPHA);
        execute();
    };

    root.update = function () {
        this.execute();
    };

    root.destroy = function () {
        const res = document.querySelector(container);
        if (res && res.contains(layer)) {
            res.removeChild(layer);
        }
        queueInstance.removeVdom(vDomIndex);
    };

    root.getPixels = function (x, y, width_, height_) {
        const pixels = new Uint8Array(width_ * height_ * 4);
        this.ctx.readPixels(x, y, width_, height_, this.ctx.RGBA, this.ctx.UNSIGNED_BYTE, pixels);
        return pixels;
    };

    root.putPixels = function (imageData, x, y) {
        return this.ctx.putImageData(imageData, x, y);
    };

    root.clear = function () {
        onClear(this.ctx);
    };

    root.setClearColor = function (color) {
        clearColor = color;
    };

    root.setClear = function (exe) {
        onClear = exe;
    };

    const resize = function (cr) {
        if (!document.querySelector(container)) {
            layerResizeUnBind(root);
            return;
        }
        height = cHeight || cr.height;
        width = cWidth || cr.width;
        root.width = width;
        root.height = height;

        updateLayerDimension(root.domEl, width, height);

        onClear(root.ctx);

        if (resizeCall) {
            resizeCall();
        }

        root.execute();

        layer.style.height = `${height}px`;
        layer.style.width = `${width}px`;
    };

    const updateLayerDimension = function (layer, width, height) {
        layer.width = Math.floor(width * ratio);
        layer.height = Math.floor(height * ratio);
        // layer.setAttribute("height", height * ratio);
        // layer.setAttribute("width", width * ratio);
        layer.style.height = height + "px";
        layer.style.width = width + "px";
    };

    root.onResize = function (exec) {
        resizeCall = exec;
    };

    root.onChange = function (exec) {
        onChangeExe = exec;
    };

    root.invokeOnChange = function () {
        if (onChangeExe) {
            onChangeExe();
        }
    };

    root.setPixelRatio = function (val) {
        ratio = val;
        this.ctx.pixelRatio = ratio;
        updateLayerDimension(this.domEl, this.width, this.height);
    };

    root.setSize = function (width_, height_) {
        this.width = width_;
        this.height = height_;
        height = height_;
        width = width_;
        updateLayerDimension(this.domEl, this.width, this.height);
        this.execute();
    };

    root.setViewBox = function (x, y, height, width) {};

    root.setStyle = function (prop, value) {
        this.domEl.style[prop] = value;
    };

    root.setAttr = function (prop, value) {
        if (prop === "viewBox") {
            this.setViewBox.apply(this, value.split(","));
        }
        layer.setAttribute(prop, value);
    };

    root.setContext = function (prop, value) {
        /** Expecting value to be array if multiple aruments */
        if (this.ctx[prop] && typeof this.ctx[prop] === "function") {
            this.ctx[prop].apply(null, value);
        } else if (this.ctx[prop]) {
            this.ctx[prop] = value;
        }
    };

    root.MeshGeometry = function () {
        return new MeshGeometry(this.ctx);
    };

    root.PointsGeometry = function () {
        return new PointsGeometry(this.ctx);
    };

    root.LineGeometry = function () {
        return new LineGeometry(this.ctx);
    };

    root.createWebglTexture = function (config) {
        return new TextureObject(this.ctx, config, this.vDomIndex);
    };

    root.RenderTarget = function (config) {
        return new RenderTarget(this.ctx, config, this.vDomIndex);
    };

    if (enableEvents) {
        const eventsInstance = new Events(root);
        layer.addEventListener("mousemove", (e) => {
            e.preventDefault();
            eventsInstance.mousemoveCheck(e);
        });
        // layer.addEventListener('click', e => {
        // 	e.preventDefault();
        // 	eventsInstance.clickCheck(e);
        // });
        // layer.addEventListener('dblclick', e => {
        // 	e.preventDefault();
        // 	eventsInstance.dblclickCheck(e);
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
    }

    return root;
}

function imageInstance(self) {
    const imageIns = new Image();
    imageIns.crossOrigin = "anonymous";
    imageIns.onload = function onload() {
        self.update();
        self.updated = true;
        queueInstance.vDomChanged(self.vDomIndex);
    };

    imageIns.onerror = function onerror(onerrorExe) {
        if (onerrorExe && typeof onerrorExe === "function") {
            // onerrorExe.call(nodeExe)
        }
    };

    return imageIns;
}

function createEmptyArrayBuffer(width, height) {
    return new Uint8Array(new ArrayBuffer(width * height * 4));
}

function TextureObject(ctx, config, vDomIndex) {
    const self = this;
    const maxTextureSize = ctx.getParameter(ctx.MAX_TEXTURE_SIZE);
    this.ctx = ctx;
    this.texture = ctx.createTexture();
    this.type = "TEXTURE_2D";
    this.width = config.width > maxTextureSize ? maxTextureSize : config.width;
    this.height = config.height > maxTextureSize ? maxTextureSize : config.height;
    this.border = config.border ? config.border : 0;
    this.format = config.format ? config.format : "RGBA";
    this.type = config.type ? config.type : "UNSIGNED_BYTE";
    // Math.pow(2, Math.ceil(Math.log(config.width) / Math.log(2)))
    // this.pixels = config.pixels ? config.pixels : null;
    this.warpS = config.warpS ? config.warpS : "CLAMP_TO_EDGE";
    this.warpT = config.warpT ? config.warpT : "CLAMP_TO_EDGE";
    this.magFilter = config.magFilter ? config.magFilter : "LINEAR";
    this.minFilter = config.minFilter ? config.minFilter : "LINEAR";
    this.mipMap = config.mipMap;
    this.updated = false;
    this.image = null;
    // this.image = new Image();
    this.vDomIndex = vDomIndex;

    if (typeof config.src === "string") {
        self.image = imageInstance(self);
        self.image.src = config.src;
    } else if (
        config.src instanceof HTMLImageElement ||
        config.src instanceof SVGImageElement ||
        config.src instanceof HTMLCanvasElement ||
        config.src instanceof Uint8Array
    ) {
        self.image = config.src;
        self.update();
        self.updated = true;
    } else if (config.src instanceof NodePrototype) {
        self.image = config.src.domEl;
        self.update();
        self.updated = true;
    } else {
        if (this.width && this.height) {
            self.image = createEmptyArrayBuffer(this.width, this.height);
            self.update();
        }
        self.updated = true;
    }
    queueInstance.vDomChanged(self.vDomIndex);
}
TextureObject.prototype.setAttr = function (attr, value) {
    if (arguments.length === 1) {
        for (const key in attr) {
            this[key] = attr[key];
            if (key === "src") {
                if (typeof value === "string") {
                    if (!this.image || !(this.image instanceof Image)) {
                        this.image = imageInstance(this);
                    }
                    this.image.src = value;
                } else if (
                    value instanceof HTMLImageElement ||
                    value instanceof SVGImageElement ||
                    value instanceof HTMLCanvasElement ||
                    value instanceof Uint8Array
                ) {
                    this.image = value;
                    this.update();
                } else if (value instanceof NodePrototype) {
                    this.image = value.domEl;
                    this.update();
                }
            }
            if (attr.height || attr.width) {
                self.image = createEmptyArrayBuffer(this.width, this.height);
            }
        }
    } else {
        this[attr] = value;
        console.warning("Instead of key, value, pass Object of key,value for optimal rendering");
        if (attr === "src") {
            if (typeof value === "string") {
                if (!this.image || !(this.image instanceof Image)) {
                    this.image = imageInstance(this);
                }
                this.image.src = value;
            } else if (
                value instanceof HTMLImageElement ||
                value instanceof SVGImageElement ||
                value instanceof HTMLCanvasElement ||
                value instanceof Uint8Array
            ) {
                this.image = value;
                this.update();
            } else if (value instanceof NodePrototype) {
                this.image = value.domEl;
                this.update();
            }
        }
    }
};

TextureObject.prototype.loadTexture = function () {
    if (!this.updated) {
        return;
    }
    this.ctx.activeTexture(this.ctx.TEXTURE0);
    this.ctx.bindTexture(this.ctx.TEXTURE_2D, this.texture);
};

TextureObject.prototype.clear = function (argument) {};

TextureObject.prototype.update = function () {
    const ctx = this.ctx;
    ctx.activeTexture(ctx.TEXTURE0);
    ctx.bindTexture(ctx.TEXTURE_2D, this.texture);
    if (this.image && !(this.image instanceof Uint8Array)) {
        ctx.texImage2D(
            ctx.TEXTURE_2D,
            this.border,
            ctx[this.format],
            ctx[this.format],
            ctx[this.type],
            this.image
        );
    } else {
        ctx.texImage2D(
            ctx.TEXTURE_2D,
            this.border,
            ctx[this.format],
            this.width,
            this.height,
            0,
            ctx[this.format],
            ctx[this.type],
            this.image
        );
    }

    if (this.mipMap) {
        if (!isPowerOf2(self.image.width) || !isPowerOf2(self.image.height)) {
            console.warn("Image dimension not in power of 2");
        }
        ctx.generateMipmap(ctx.TEXTURE_2D);
        ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx[this.minFilter]);
        ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx[this.magFilter]);
    } else {
        ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_S, ctx[this.warpS]);
        ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_T, ctx[this.warpT]);
        ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx[this.minFilter]);
        ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx[this.minFilter]);
    }
    this.updated = true;
};

function RenderTarget(ctx, config) {
    this.ctx = ctx;
    this.fbo = ctx.createFramebuffer();
    this.texture = config.texture;
    if (!this.texture.updated) {
        this.texture.update();
    }
}

RenderTarget.prototype.setAttr = function (attr, value) {
    this[attr] = value;
};

RenderTarget.prototype.update = function () {
    if (!this.texture || !(this.texture instanceof TextureObject)) {
        return;
    }
    this.ctx.bindFramebuffer(this.ctx.FRAMEBUFFER, this.fbo);
    this.ctx.framebufferTexture2D(
        this.ctx.FRAMEBUFFER,
        this.ctx.COLOR_ATTACHMENT0,
        this.ctx.TEXTURE_2D,
        this.texture.texture,
        0
    );
    this.ctx.clearColor(0, 0, 0, 0);
    this.ctx.clear(this.ctx.COLOR_BUFFER_BIT | this.ctx.DEPTH_BUFFER_BIT);
};

RenderTarget.prototype.clear = function () {
    this.ctx.bindFramebuffer(this.ctx.FRAMEBUFFER, null);
};

function WebGLGeometry() {
    // this.attributes = {};
    // this.indexes = null;
    // this.drawRange = [0, 0];
}
WebGLGeometry.prototype.setAttr = function (attr, value) {
    if (!value && this.attributes[attr]) {
        delete this.attributes[attr];
    } else {
        this.attributes[attr] = value;
    }
};
WebGLGeometry.prototype.setDrawRange = function (start, end) {
    this.drawRange = [start, end];
};
WebGLGeometry.prototype.setDrawType = function (type) {
    this.drawType = type;
};
WebGLGeometry.prototype.setIndex = function (obj) {
    this.indexes = obj;
};

function MeshGeometry(ctx) {
    this.attributes = {};
    this.drawType = "TRIANGLES";
    this.indexes = null;
    this.drawRange = [0, 0];
}
MeshGeometry.prototype = new WebGLGeometry();
MeshGeometry.constructor = MeshGeometry;

function PointsGeometry(ctx) {
    this.attributes = {};
    this.drawType = "POINTS";
    this.indexes = null;
    this.drawRange = [0, 0];
}

PointsGeometry.prototype = new WebGLGeometry();
PointsGeometry.constructor = PointsGeometry;

function LineGeometry(ctx) {
    this.attributes = {};
    this.drawType = "LINES";
    this.indexes = null;
    this.drawRange = [0, 0];
}

LineGeometry.prototype = new WebGLGeometry();
LineGeometry.constructor = LineGeometry;

export default webglLayer;
