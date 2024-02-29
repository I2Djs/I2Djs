/*!
      * i2djs
      * (c) 2024 Narayana Swamy (narayanaswamy14@gmail.com)
      * @license BSD-3-Clause
      */
import { i as interpolate, P as PDFDocument, e as earcut } from './dependencies-bundle-esm.js';
import { ResizeObserver as ResizeObserver$1 } from '@juggle/resize-observer';
import blobStream from 'blob-stream-i2d';
import { imageDataRGBA } from 'stackblur-canvas';

let animatorInstance = null;
let tweens = [];
const vDoms = {};
const vDomIds = [];
let animeFrameId;
let onFrameExe = [];
if (typeof window === "undefined") {
    global.window = {
        setTimeout: setTimeout,
        clearTimeout: clearTimeout,
    };
    global.performance = {
        now: function () {
            return Date.now();
        },
    };
    global.document = {};
}
window.requestAnimationFrame = (function requestAnimationFrameG() {
    return (
        window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function requestAnimationFrame(callback) {
            return window.setTimeout(callback, 1000 / 60);
        }
    );
})();
window.cancelAnimFrame = (function cancelAnimFrameG() {
    return (
        window.cancelAnimationFrame ||
        window.webkitCancelAnimationFrame ||
        window.mozCancelAnimationFrame ||
        window.oCancelAnimationFrame ||
        window.msCancelAnimationFrame ||
        function cancelAnimFrame(id) {
            return window.clearTimeout(id);
        }
    );
})();
function Tween(Id, executable, easying) {
    this.executable = executable;
    this.duration = executable.duration ? executable.duration : 0;
    this.delay = executable.delay ? executable.delay : 0;
    this.lastTime = 0 - (executable.delay ? executable.delay : 0);
    this.loopTracker = 0;
    this.loop = executable.loop ? executable.loop : 0;
    this.direction = executable.direction;
    this.easying = easying;
    this.end = executable.end ? executable.end : null;
    if (this.direction === "reverse") {
        this.factor = 1;
    } else {
        this.factor = 0;
    }
}
Tween.prototype.execute = function execute(f) {
    this.executable.run(f);
};
Tween.prototype.resetCallBack = function resetCallBack(_) {
    if (typeof _ !== "function") return;
    this.callBack = _;
};
function onRequestFrame(_) {
    if (typeof _ !== "function") {
        throw new Error("Wrong input");
    }
    onFrameExe.push(_);
    if (onFrameExe.length > 0 && !animeFrameId) {
        this.startAnimeFrames();
    }
}
function removeRequestFrameCall(_) {
    if (typeof _ !== "function") {
        throw new Error("Wrong input");
    }
    const index = onFrameExe.indexOf(_);
    if (index !== -1) {
        onFrameExe.splice(index, 1);
    }
}
function add(uId, executable, easying) {
    const exeObj = new Tween(uId, executable, easying);
    exeObj.currTime = performance.now();
    if (executable.target) {
        if (!executable.target.animList) {
            executable.target.animList = [];
        }
        executable.target.animList[executable.target.animList.length] = exeObj;
    }
    tweens[tweens.length] = exeObj;
    this.startAnimeFrames();
}
function remove$1(exeObj) {
    const index = tweens.indexOf(exeObj);
    if (index !== -1) {
        tweens.splice(index, 1);
    }
}
function startAnimeFrames() {
    if (!animeFrameId) {
        animeFrameId = window.requestAnimationFrame(exeFrameCaller);
    }
}
function stopAnimeFrame() {
    if (animeFrameId) {
        window.cancelAnimFrame(animeFrameId);
        animeFrameId = null;
    }
}
function ExeQueue() {}
ExeQueue.prototype = {
    startAnimeFrames,
    stopAnimeFrame,
    add,
    remove: remove$1,
    onRequestFrame,
    removeRequestFrameCall,
    clearAll: function () {
        tweens = [];
        onFrameExe = [];
    },
};
ExeQueue.prototype.addVdom = function AaddVdom(_) {
    const ind = vDomIds.length + 1;
    vDoms[ind] = _;
    vDomIds.push(ind);
    this.startAnimeFrames();
    return ind;
};
ExeQueue.prototype.removeVdom = function removeVdom(_) {
    const index = vDomIds.indexOf(_);
    if (index !== -1) {
        vDomIds.splice(index, 1);
        vDoms[_].root.destroy();
        delete vDoms[_];
    }
    if (vDomIds.length === 0 && tweens.length === 0 && onFrameExe.length === 0) {
        this.stopAnimeFrame();
    }
};
ExeQueue.prototype.vDomChanged = function AvDomChanged(vDom) {
    if (vDoms[vDom] && vDoms[vDom].stateModified !== undefined) {
        vDoms[vDom].stateModified = true;
        vDoms[vDom].root.stateModified = true;
    } else if (typeof vDom === "string") {
        const ids = vDom.split(":");
        if (vDoms[ids[0]] && vDoms[ids[0]].stateModified !== undefined) {
            vDoms[ids[0]].stateModified = true;
            vDoms[ids[0]].root.stateModified = true;
            const childRootNode = vDoms[ids[0]].root.fetchEl("#" + ids[1]);
            if (childRootNode) {
                childRootNode.stateModified = true;
            }
        }
    }
};
ExeQueue.prototype.execute = function Aexecute() {
    this.startAnimeFrames();
};
ExeQueue.prototype.vDomUpdates = function () {
    for (let i = 0, len = vDomIds.length; i < len; i += 1) {
        if (vDomIds[i] && vDoms[vDomIds[i]] && vDoms[vDomIds[i]].stateModified) {
            vDoms[vDomIds[i]].execute();
            vDoms[vDomIds[i]].stateModified = false;
        } else if (
            vDomIds[i] &&
            vDoms[vDomIds[i]] &&
            vDoms[vDomIds[i]].root &&
            vDoms[vDomIds[i]].root.ENV !== "NODE"
        ) {
            var elementExists = document.getElementById(vDoms[vDomIds[i]].root.container.id);
            if (!elementExists) {
                this.removeVdom(vDomIds[i]);
            }
        }
    }
};
let d;
let t;
const abs$1 = Math.abs;
let counter = 0;
let tweensN = [];
function exeFrameCaller() {
    try {
        tweensN = [];
        counter = 0;
        t = performance.now();
        for (let i = 0; i < tweens.length; i += 1) {
            d = tweens[i];
            d.lastTime += t - d.currTime;
            d.currTime = t;
            if (d.lastTime < d.duration && d.lastTime >= 0) {
                d.execute(abs$1(d.factor - d.easying(d.lastTime, d.duration)));
                tweensN[counter++] = d;
            } else if (d.lastTime > d.duration) {
                loopCheck(d);
            } else {
                tweensN[counter++] = d;
            }
        }
        tweens = tweensN;
        if (onFrameExe.length > 0) {
            onFrameExeFun();
        }
        animatorInstance.vDomUpdates();
    } catch (err) {
        console.error(err);
    } finally {
        animeFrameId = window.requestAnimationFrame(exeFrameCaller);
    }
}
function loopCheck(d) {
    if (d.loopTracker >= d.loop - 1) {
        d.execute(1 - d.factor);
        if (d.end) {
            d.end();
        }
        if (d.executable.target) {
            const animList = d.executable.target.animList;
            if (animList && animList.length > 0) {
                if (animList.length === 1) {
                    d.executable.target.animList = [];
                } else if (animList.length > 1) {
                    const index = animList.indexOf(d);
                    if (index !== -1) {
                        animList.splice(index, 1);
                    }
                }
            }
        }
    } else {
        d.loopTracker += 1;
        d.lastTime = d.lastTime - d.duration;
        d.lastTime = d.lastTime % d.duration;
        if (d.direction === "alternate") {
            d.factor = 1 - d.factor;
        } else if (d.direction === "reverse") {
            d.factor = 1;
        } else {
            d.factor = 0;
        }
        d.execute(abs$1(d.factor - d.easying(d.lastTime, d.duration)));
        tweensN[counter++] = d;
    }
}
function onFrameExeFun() {
    for (let i = 0; i < onFrameExe.length; i += 1) {
        onFrameExe[i](t);
    }
}
animatorInstance = new ExeQueue();
var queue = animatorInstance;

function VDom() {}
VDom.prototype.execute = function execute() {
    this.root.execute();
    this.stateModified = false;
};
VDom.prototype.rootNode = function root(_) {
    this.root = _;
    this.stateModified = true;
};
VDom.prototype.eventsCheck = function eventsCheck(nodes, mouseCoor, rawEvent) {
    const self = this;
    let node, temp;
    for (var i = 0; i <= nodes.length - 1; i += 1) {
        var d = nodes[i];
        var coOr = {
            x: mouseCoor.x,
            y: mouseCoor.y,
        };
        transformCoOr$1(d, coOr);
        if (
            d.in({
                x: coOr.x,
                y: coOr.y,
            })
        ) {
            if (d.children && d.children.length > 0) {
                temp = self.eventsCheck(
                    d.children,
                    {
                        x: coOr.x,
                        y: coOr.y,
                    },
                    rawEvent
                );
                if (temp) {
                    node = temp;
                }
            } else {
                node = d;
            }
        }
    }
    return node;
};
VDom.prototype.transformCoOr = transformCoOr$1;
function transformCoOr$1(d, coOr) {
    let hozMove = 0;
    let verMove = 0;
    let scaleX = 1;
    let scaleY = 1;
    const coOrLocal = coOr;
    if (d.attr.transform && d.attr.transform.translate) {
        [hozMove, verMove] = d.attr.transform.translate;
        coOrLocal.x -= hozMove;
        coOrLocal.y -= verMove;
    }
    if (d.attr.transform && d.attr.transform.scale) {
        scaleX = d.attr.transform.scale[0] !== undefined ? d.attr.transform.scale[0] : 1;
        scaleY = d.attr.transform.scale[1] !== undefined ? d.attr.transform.scale[1] : scaleX;
        coOrLocal.x /= scaleX;
        coOrLocal.y /= scaleY;
    }
    if (d.attr.transform && d.attr.transform.rotate) {
        const rotate = d.attr.transform.rotate[0];
        const cen = {
            x: d.attr.transform.rotate[1],
            y: d.attr.transform.rotate[2],
        };
        const x = coOrLocal.x;
        const y = coOrLocal.y;
        const cx = cen.x;
        const cy = cen.y;
        var radians = (Math.PI / 180) * rotate;
        var cos = Math.cos(radians);
        var sin = Math.sin(radians);
        coOrLocal.x = cos * (x - cx) + sin * (y - cy) + cx;
        coOrLocal.y = cos * (y - cy) - sin * (x - cx) + cy;
    }
}

const sqrt = Math.sqrt;
const sin = Math.sin;
const cos = Math.cos;
const abs = Math.abs;
const atan2 = Math.atan2;
const tan = Math.tan;
const PI = Math.PI;
const ceil = Math.ceil;
const max = Math.max;
function pw(a, x) {
    let val = 1;
    if (x === 0) return val;
    for (let i = 1; i <= x; i += 1) {
        val *= a;
    }
    return val;
}
function bezierLength(p0, p1, p2) {
    const a = {};
    const b = {};
    a.x = p0.x + p2.x - 2 * p1.x;
    a.y = p0.y + p2.y - 2 * p1.y;
    b.x = 2 * p1.x - 2 * p0.x;
    b.y = 2 * p1.y - 2 * p0.y;
    const A = 4 * (a.x * a.x + a.y * a.y);
    const B = 4 * (a.x * b.x + a.y * b.y);
    const C = b.x * b.x + b.y * b.y;
    const Sabc = 2 * sqrt(A + B + C);
    const A_2 = sqrt(A);
    const A_32 = 2 * A * A_2;
    const C_2 = 2 * sqrt(C);
    const BA = B / A_2;
    let logVal = (2 * A_2 + BA + Sabc) / (BA + C_2);
    logVal = isNaN(logVal) || abs(logVal) === Infinity ? 1 : logVal;
    return (
        (A_32 * Sabc + A_2 * B * (Sabc - C_2) + (4 * C * A - B * B) * Math.log(logVal)) / (4 * A_32)
    );
}
function cubicBezierLength(p0, co) {
    const interval = 0.001;
    let sum = 0;
    const cubicBezierTransitionInstance = cubicBezierTransition.bind(null, p0, co);
    let p1;
    let p2;
    for (let i = 0; i <= 1; i += interval) {
        p1 = cubicBezierTransitionInstance(i);
        p2 = cubicBezierTransitionInstance(i + interval);
        sum += sqrt(pw((p2.x - p1.x) / interval, 2) + pw((p2.y - p1.y) / interval, 2)) * interval;
    }
    return sum;
}
function getDistance(p1, p2) {
    let cPw = 0;
    for (const p in p1) {
        cPw += pw(p2[p] - p1[p], 2);
    }
    if (isNaN(cPw)) {
        throw new Error("error");
    }
    return sqrt(cPw);
}
function get2DAngle(p1, p2) {
    return atan2(p2.x - p1.x, p2.y - p1.y);
}
function scaleAlongOrigin(co, factor) {
    const co_ = {};
    for (const prop in co) {
        co_[prop] = co[prop] * factor;
    }
    return co_;
}
function scaleAlongPoint(p, r, f) {
    const s = (p.y - r.y) / (p.x - r.x);
    const xX = p.x * f;
    const yY = (s * (xX - r.x) + r.y) * f;
    return {
        x: xX,
        y: yY,
    };
}
function cubicBezierCoefficients(p) {
    const cx = 3 * (p.cntrl1.x - p.p0.x);
    const bx = 3 * (p.cntrl2.x - p.cntrl1.x) - cx;
    const ax = p.p1.x - p.p0.x - cx - bx;
    const cy = 3 * (p.cntrl1.y - p.p0.y);
    const by = 3 * (p.cntrl2.y - p.cntrl1.y) - cy;
    const ay = p.p1.y - p.p0.y - cy - by;
    return {
        cx,
        bx,
        ax,
        cy,
        by,
        ay,
    };
}
function toCubicCurves(stack) {
    if (!stack.length) {
        return;
    }
    const _ = stack;
    const mappedArr = [];
    for (let i = 0; i < _.length; i += 1) {
        if (["M", "C", "S", "Q"].indexOf(_[i].type) !== -1) {
            mappedArr.push(_[i]);
        } else if (["V", "H", "L", "Z"].indexOf(_[i].type) !== -1) {
            const ctrl1 = {
                x: (_[i].p0.x + _[i].p1.x) / 2,
                y: (_[i].p0.y + _[i].p1.y) / 2,
            };
            mappedArr.push({
                p0: _[i].p0,
                cntrl1: ctrl1,
                cntrl2: ctrl1,
                p1: _[i].p1,
                type: "C",
                length: _[i].length,
            });
        } else {
            console.log("wrong cmd type");
        }
    }
    return mappedArr;
}
function cubicBezierTransition(p0, co, f) {
    const p3 = pw(f, 3);
    const p2 = pw(f, 2);
    return {
        x: co.ax * p3 + co.bx * p2 + co.cx * f + p0.x,
        y: co.ay * p3 + co.by * p2 + co.cy * f + p0.y,
    };
}
function bezierTransition(p0, p1, p2, f) {
    return {
        x: (p0.x - 2 * p1.x + p2.x) * f * f + (2 * p1.x - 2 * p0.x) * f + p0.x,
        y: (p0.y - 2 * p1.y + p2.y) * f * f + (2 * p1.y - 2 * p0.y) * f + p0.y,
    };
}
function linearTBetweenPoints(p1, p2, f) {
    return {
        x: p1.x + (p2.x - p1.x) * f,
        y: p1.y + (p2.y - p1.y) * f,
    };
}
function intermediateValue(v1, v2, f) {
    return v1 + (v2 - v1) * f;
}
const _slicedToArray = (function () {
    function sliceIterator(arr, i) {
        const _arr = [];
        let _n = true;
        let _d = false;
        let _e;
        try {
            for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
                _arr.push(_s.value);
                if (i && _arr.length === i) break;
            }
        } catch (err) {
            _d = true;
            _e = err;
        } finally {
            try {
                if (!_n && _i.return) _i.return();
            } finally {
                if (_d) {
                    console.log("Error -" + _e);
                }
            }
        }
        return _arr;
    }
    return function (arr, i) {
        if (Array.isArray(arr)) {
            return arr;
        } else if (Symbol.iterator in Object(arr)) {
            return sliceIterator(arr, i);
        }
        throw new TypeError("Invalid attempt to destructure non-iterable instance");
    };
})();
const TAU = PI * 2;
const mapToEllipse = function mapToEllipse(_ref, rx, ry, cosphi, sinphi, centerx, centery) {
    let { x, y } = _ref;
    x *= rx;
    y *= ry;
    const xp = cosphi * x - sinphi * y;
    const yp = sinphi * x + cosphi * y;
    return {
        x: xp + centerx,
        y: yp + centery,
    };
};
const approxUnitArc = function approxUnitArc(ang1, ang2) {
    const a = (4 / 3) * tan(ang2 / 4);
    const x1 = cos(ang1);
    const y1 = sin(ang1);
    const x2 = cos(ang1 + ang2);
    const y2 = sin(ang1 + ang2);
    return [
        {
            x: x1 - y1 * a,
            y: y1 + x1 * a,
        },
        {
            x: x2 + y2 * a,
            y: y2 - x2 * a,
        },
        {
            x: x2,
            y: y2,
        },
    ];
};
const vectorAngle = function vectorAngle(ux, uy, vx, vy) {
    const sign = ux * vy - uy * vx < 0 ? -1 : 1;
    const umag = sqrt(ux * ux + uy * uy);
    const vmag = sqrt(ux * ux + uy * uy);
    const dot = ux * vx + uy * vy;
    let div = dot / (umag * vmag);
    if (div > 1) {
        div = 1;
    }
    if (div < -1) {
        div = -1;
    }
    return sign * Math.acos(div);
};
const getArcCenter = function getArcCenter(
    px,
    py,
    cx,
    cy,
    rx,
    ry,
    largeArcFlag,
    sweepFlag,
    sinphi,
    cosphi,
    pxp,
    pyp
) {
    const rxsq = pw(rx, 2);
    const rysq = pw(ry, 2);
    const pxpsq = pw(pxp, 2);
    const pypsq = pw(pyp, 2);
    let radicant = rxsq * rysq - rxsq * pypsq - rysq * pxpsq;
    if (radicant < 0) {
        radicant = 0;
    }
    radicant /= rxsq * pypsq + rysq * pxpsq;
    radicant = sqrt(radicant) * (largeArcFlag === sweepFlag ? -1 : 1);
    const centerxp = ((radicant * rx) / ry) * pyp;
    const centeryp = ((radicant * -ry) / rx) * pxp;
    const centerx = cosphi * centerxp - sinphi * centeryp + (px + cx) / 2;
    const centery = sinphi * centerxp + cosphi * centeryp + (py + cy) / 2;
    const vx1 = (pxp - centerxp) / rx;
    const vy1 = (pyp - centeryp) / ry;
    const vx2 = (-pxp - centerxp) / rx;
    const vy2 = (-pyp - centeryp) / ry;
    const ang1 = vectorAngle(1, 0, vx1, vy1);
    let ang2 = vectorAngle(vx1, vy1, vx2, vy2);
    if (sweepFlag === 0 && ang2 > 0) {
        ang2 -= TAU;
    }
    if (sweepFlag === 1 && ang2 < 0) {
        ang2 += TAU;
    }
    return [centerx, centery, ang1, ang2];
};
const arcToBezier = function arcToBezier(_ref2) {
    let { px, py, cx, cy, rx, ry } = _ref2;
    const _ref2$xAxisRotation = _ref2.xAxisRotation;
    const xAxisRotation = _ref2$xAxisRotation === undefined ? 0 : _ref2$xAxisRotation;
    const _ref2$largeArcFlag = _ref2.largeArcFlag;
    const largeArcFlag = _ref2$largeArcFlag === undefined ? 0 : _ref2$largeArcFlag;
    const _ref2$sweepFlag = _ref2.sweepFlag;
    const sweepFlag = _ref2$sweepFlag === undefined ? 0 : _ref2$sweepFlag;
    const curves = [];
    if (rx === 0 || ry === 0) {
        return [];
    }
    const sinphi = sin((xAxisRotation * TAU) / 360);
    const cosphi = cos((xAxisRotation * TAU) / 360);
    const pxp = (cosphi * (px - cx)) / 2 + (sinphi * (py - cy)) / 2;
    const pyp = (-sinphi * (px - cx)) / 2 + (cosphi * (py - cy)) / 2;
    if (pxp === 0 && pyp === 0) {
        return [];
    }
    rx = abs(rx);
    ry = abs(ry);
    const lambda = pw(pxp, 2) / pw(rx, 2) + pw(pyp, 2) / pw(ry, 2);
    if (lambda > 1) {
        rx *= sqrt(lambda);
        ry *= sqrt(lambda);
    }
    const _getArcCenter = getArcCenter(
        px,
        py,
        cx,
        cy,
        rx,
        ry,
        largeArcFlag,
        sweepFlag,
        sinphi,
        cosphi,
        pxp,
        pyp
    );
    const _getArcCenter2 = _slicedToArray(_getArcCenter, 4);
    const centerx = _getArcCenter2[0];
    const centery = _getArcCenter2[1];
    let ang1 = _getArcCenter2[2];
    let ang2 = _getArcCenter2[3];
    const segments = max(ceil(abs(ang2) / (TAU / 4)), 1);
    ang2 /= segments;
    for (let i = 0; i < segments; i++) {
        curves.push(approxUnitArc(ang1, ang2));
        ang1 += ang2;
    }
    return curves.map((curve) => {
        const _mapToEllipse = mapToEllipse(curve[0], rx, ry, cosphi, sinphi, centerx, centery);
        const x1 = _mapToEllipse.x;
        const y1 = _mapToEllipse.y;
        const _mapToEllipse2 = mapToEllipse(curve[1], rx, ry, cosphi, sinphi, centerx, centery);
        const x2 = _mapToEllipse2.x;
        const y2 = _mapToEllipse2.y;
        const _mapToEllipse3 = mapToEllipse(curve[2], rx, ry, cosphi, sinphi, centerx, centery);
        const x = _mapToEllipse3.x;
        const y = _mapToEllipse3.y;
        return {
            x1,
            y1,
            x2,
            y2,
            x,
            y,
        };
    });
};
function rotatePoint(point, centre, newAngle) {
    const x = point.x;
    const y = point.y;
    const cx = centre.x;
    const cy = centre.y;
    var radians = (PI / 180) * newAngle;
    var c_ = cos(-radians);
    var s_ = sin(-radians);
    return {
        x: c_ * (x - cx) + s_ * (y - cy) + cx,
        y: c_ * (y - cy) - s_ * (x - cx) + cy,
    };
}
function rotateBBox(BBox, transform) {
    let point1 = {
        x: BBox.x,
        y: BBox.y,
    };
    let point2 = {
        x: BBox.x + BBox.width,
        y: BBox.y,
    };
    let point3 = {
        x: BBox.x,
        y: BBox.y + BBox.height,
    };
    let point4 = {
        x: BBox.x + BBox.width,
        y: BBox.y + BBox.height,
    };
    const { translate, rotate } = transform;
    const cen = {
        x: rotate[1] || 0,
        y: rotate[2] || 0,
    };
    const rotateAngle = rotate[0];
    if (translate && translate.length > 0) {
        cen.x += translate[0];
        cen.y += translate[1];
    }
    point1 = rotatePoint(point1, cen, rotateAngle, getDistance(point1, cen));
    point2 = rotatePoint(point2, cen, rotateAngle, getDistance(point2, cen));
    point3 = rotatePoint(point3, cen, rotateAngle, getDistance(point3, cen));
    point4 = rotatePoint(point4, cen, rotateAngle, getDistance(point4, cen));
    const xVec = [point1.x, point2.x, point3.x, point4.x].sort((bb, aa) => bb - aa);
    const yVec = [point1.y, point2.y, point3.y, point4.y].sort((bb, aa) => bb - aa);
    return {
        x: xVec[0],
        y: yVec[0],
        width: xVec[3] - xVec[0],
        height: yVec[3] - yVec[0],
    };
}
function Geometry() {}
Geometry.prototype = {
    pow: pw,
    getAngle: get2DAngle,
    getDistance,
    scaleAlongOrigin,
    scaleAlongPoint,
    linearTransitionBetweenPoints: linearTBetweenPoints,
    bezierTransition,
    bezierLength,
    cubicBezierTransition,
    cubicBezierLength,
    cubicBezierCoefficients,
    arcToBezier,
    intermediateValue,
    toCubicCurves,
    rotatePoint,
    rotateBBox,
};
var geometry = new Geometry();

const t2DGeometry$4 = geometry;
function linear(starttime, duration) {
    return starttime / duration;
}
function elastic(starttime, duration) {
    const decay = 8;
    const force = 2 / 1000;
    const t = starttime / duration;
    return (
        1 -
        ((1 - t) * Math.sin(t * duration * force * Math.PI * 2 + Math.PI / 2)) / Math.exp(t * decay)
    );
}
function bounce(starttime, duration) {
    const decay = 10;
    const t = starttime / duration;
    const force = t / 100;
    return (
        1 -
        ((1 - t) * Math.abs(Math.sin(t * duration * force * Math.PI * 2 + Math.PI / 2))) /
            Math.exp(t * decay)
    );
}
function easeInQuad(starttime, duration) {
    const t = starttime / duration;
    return t * t;
}
function easeOutQuad(starttime, duration) {
    const t = starttime / duration;
    return t * (2 - t);
}
function easeInOutQuad(starttime, duration) {
    const t = starttime / duration;
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}
function easeInCubic(starttime, duration) {
    const t = starttime / duration;
    return t2DGeometry$4.pow(t, 3);
}
function easeOutCubic(starttime, duration) {
    let t = starttime / duration;
    t -= 1;
    return t * t * t + 1;
}
function easeInOutCubic(starttime, duration) {
    const t = starttime / duration;
    return t < 0.5 ? 4 * t2DGeometry$4.pow(t, 3) : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
}
function sinIn(starttime, duration) {
    const t = starttime / duration;
    return 1 - Math.cos((t * Math.PI) / 2);
}
function easeOutSin(starttime, duration) {
    const t = starttime / duration;
    return Math.cos((t * Math.PI) / 2);
}
function easeInOutSin(starttime, duration) {
    const t = starttime / duration;
    return (1 - Math.cos(Math.PI * t)) / 2;
}
function fetchTransitionType(_) {
    let res;
    if (typeof _ === "function") {
        return function custExe(starttime, duration) {
            return _(starttime / duration);
        };
    }
    switch (_) {
        case "easeOutQuad":
            res = easeOutQuad;
            break;
        case "easeInQuad":
            res = easeInQuad;
            break;
        case "easeInOutQuad":
            res = easeInOutQuad;
            break;
        case "easeInCubic":
            res = easeInCubic;
            break;
        case "easeOutCubic":
            res = easeOutCubic;
            break;
        case "easeInOutCubic":
            res = easeInOutCubic;
            break;
        case "easeInSin":
            res = sinIn;
            break;
        case "easeOutSin":
            res = easeOutSin;
            break;
        case "easeInOutSin":
            res = easeInOutSin;
            break;
        case "bounce":
            res = bounce;
            break;
        case "linear":
            res = linear;
            break;
        case "elastic":
            res = elastic;
            break;
        default:
            res = linear;
    }
    return res;
}

let Id$3 = 0;
let chainId = 0;
function generateRendererId() {
    Id$3 += 1;
    return Id$3;
}
function generateChainId() {
    chainId += 1;
    return chainId;
}
const easying$1 = fetchTransitionType;
function easeDef(type) {
    this.easying = easying$1(type);
    this.transition = type;
    return this;
}
function duration(value) {
    if (arguments.length !== 1) {
        throw new Error("arguments mis match");
    }
    this.durationP = value;
    return this;
}
function delay(value) {
    if (arguments.length !== 1) {
        throw new Error("arguments mis match");
    }
    this.delayValue = value;
    return this;
}
function loopValue(value) {
    if (arguments.length !== 1) {
        throw new Error("arguments mis match");
    }
    this.loopValue = value;
    return this;
}
function direction(value) {
    if (arguments.length !== 1) {
        throw new Error("arguments mis match");
    }
    this.directionV = value;
    return this;
}
function bind(value) {
    if (arguments.length !== 1) {
        throw new Error("arguments mis match");
    }
    this.data = value;
    if (this.data.nodeName === "CANVAS") {
        this.canvasStack = [];
    }
    return this;
}
function callbckExe(exe) {
    if (typeof exe !== "function") {
        return null;
    }
    this.callbckExe = exe;
    return this;
}
function reset(value) {
    this.resetV = value;
    return this;
}
function child(exe) {
    this.end = exe;
    return this;
}
function end(exe) {
    this.endExe = exe;
    return this;
}
function commit() {
    this.start();
}
function SequenceGroup() {
    this.queue = queue;
    this.sequenceQueue = [];
    this.lengthV = 0;
    this.currPos = 0;
    this.ID = generateRendererId();
    this.loopCounter = 0;
}
SequenceGroup.prototype = {
    delay: delay,
    duration,
    loop: loopValue,
    callbck: callbckExe,
    bind,
    child,
    ease: easeDef,
    end,
    commit,
    reset,
    direction,
};
SequenceGroup.prototype.add = function SGadd(value) {
    const self = this;
    if (!Array.isArray(value) && typeof value !== "function") {
        value = [value];
    }
    if (Array.isArray(value)) {
        value.map((d) => {
            self.lengthV += d.length ? d.length : 0;
            return d;
        });
    }
    if (this.sequenceQueue.length === 0 && this.delayValue && value.length > 0) {
        value[0].delay += this.delayValue;
    }
    this.sequenceQueue = this.sequenceQueue.concat(value);
    return this;
};
SequenceGroup.prototype.easyingGlobal = function SGeasyingGlobal(completedTime, durationV) {
    return completedTime / durationV;
};
SequenceGroup.prototype.start = function SGstart() {
    const self = this;
    if (self.directionV === "alternate") {
        self.factor = self.factor ? -1 * self.factor : 1;
        self.currPos = self.factor < 0 ? this.sequenceQueue.length - 1 : 0;
    } else if (self.directionV === "reverse") {
        for (let i = 0; i < this.sequenceQueue.length; i += 1) {
            const currObj = this.sequenceQueue[i];
            if (!(currObj instanceof SequenceGroup) && !(currObj instanceof ParallelGroup)) {
                currObj.run(1);
            }
            self.currPos = i;
        }
        self.factor = -1;
    } else {
        self.currPos = 0;
        self.factor = 1;
    }
    this.execute();
};
SequenceGroup.prototype.execute = function SGexecute() {
    const self = this;
    let currObj = this.sequenceQueue[self.currPos];
    currObj = typeof currObj === "function" ? currObj() : currObj;
    if (!currObj) {
        return;
    }
    if (currObj instanceof SequenceGroup || currObj instanceof ParallelGroup) {
        currObj.end(self.triggerEnd.bind(self, currObj)).commit();
    } else {
        this.currObj = currObj;
        this.queue.add(
            generateChainId(),
            {
                run(f) {
                    currObj.run(f);
                },
                target: currObj.target,
                delay: currObj.delay !== undefined ? currObj.delay : 0,
                duration: currObj.duration !== undefined ? currObj.duration : self.durationP,
                loop: currObj.loop ? currObj.loop : 1,
                direction: self.factor < 0 ? "reverse" : "default",
                end: self.triggerEnd.bind(self, currObj),
            },
            (c, v) => c / v
        );
    }
    return this;
};
SequenceGroup.prototype.triggerEnd = function SGtriggerEnd(currObj) {
    const self = this;
    self.currPos += self.factor;
    if (currObj.end) {
        self.triggerChild(currObj);
    }
    if (self.sequenceQueue.length === self.currPos || self.currPos < 0) {
        if (self.endExe) {
            self.endExe();
        }
        self.loopCounter += 1;
        if (self.loopCounter < self.loopValue) {
            self.start();
        }
        return;
    }
    this.execute();
};
SequenceGroup.prototype.triggerChild = function SGtriggerChild(currObj) {
    if (currObj.end instanceof ParallelGroup || currObj.end instanceof SequenceGroup) {
        setTimeout(() => {
            currObj.end.commit();
        }, 0);
    } else {
        currObj.end();
    }
};
function ParallelGroup() {
    this.queue = queue;
    this.group = [];
    this.currPos = 0;
    this.delay = 0;
    this.ID = generateRendererId();
    this.loopCounter = 1;
}
ParallelGroup.prototype = {
    delay: delay,
    duration,
    loop: loopValue,
    callbck: callbckExe,
    bind,
    child,
    ease: easeDef,
    end,
    commit,
    direction,
};
ParallelGroup.prototype.add = function PGadd(value) {
    const self = this;
    if (!Array.isArray(value)) {
        value = [value];
    }
    value.forEach((d) => {
        d.delay += self.delayValue || 0;
    });
    this.group = this.group.concat(value);
    this.group.forEach((d) => {
        d.durationP = d.durationP ? d.durationP : self.durationP;
    });
    return this;
};
ParallelGroup.prototype.execute = function PGexecute() {
    const self = this;
    self.currPos = 0;
    for (let i = 0, len = self.group.length; i < len; i++) {
        const currObj = self.group[i];
        if (currObj instanceof SequenceGroup || currObj instanceof ParallelGroup) {
            currObj
                .end(self.triggerEnd.bind(self, currObj))
                .commit();
        } else {
            self.queue.add(
                generateChainId(),
                {
                    run(f) {
                        currObj.run(f);
                    },
                    target: currObj.target,
                    delay: currObj.delay !== undefined ? currObj.delay : 0,
                    duration: currObj.duration !== undefined ? currObj.duration : self.durationP,
                    loop: currObj.loop ? currObj.loop : 1,
                    direction: currObj.direction ? currObj.direction : "default",
                    end: self.triggerEnd.bind(self, currObj),
                },
                currObj.ease ? easying$1(currObj.ease) : self.easying
            );
        }
    }
    return self;
};
ParallelGroup.prototype.start = function PGstart() {
    const self = this;
    if (self.directionV === "alternate") {
        self.factor = self.factor ? -1 * self.factor : 1;
    } else if (self.directionV === "reverse") {
        self.factor = -1;
    } else {
        self.factor = 1;
    }
    this.execute();
};
ParallelGroup.prototype.triggerEnd = function PGtriggerEnd(currObj) {
    const self = this;
    this.currPos += 1;
    if (currObj.end) {
        this.triggerChild(currObj.end);
    }
    if (this.currPos === this.group.length) {
        if (this.endExe) {
            this.triggerChild(this.endExe);
        }
        self.loopCounter += 1;
        if (self.loopCounter < self.loopValue) {
            self.start();
        }
    }
};
ParallelGroup.prototype.triggerChild = function PGtriggerChild(exe) {
    if (exe instanceof ParallelGroup || exe instanceof SequenceGroup) {
        exe.commit();
    } else if (typeof exe === "function") {
        exe();
    } else {
        console.log("wrong type");
    }
};
function sequenceChain() {
    return new SequenceGroup();
}
function parallelChain() {
    return new ParallelGroup();
}
var chain = {
    sequenceChain,
    parallelChain,
};

let morphIdentifier = 0;
const t2DGeometry$3 = geometry;
const queueInstance$5 = queue;
const easying = fetchTransitionType;
function animeId$2() {
    morphIdentifier += 1;
    return "morph_" + morphIdentifier;
}
function pathCmdIsValid(_) {
    return (
        [
            "m",
            "M",
            "v",
            "V",
            "l",
            "L",
            "h",
            "H",
            "q",
            "Q",
            "c",
            "C",
            "s",
            "S",
            "a",
            "A",
            "z",
            "Z",
        ].indexOf(_) !== -1
    );
}
function updateBBox(d, pd, minMax, bbox) {
    let { minX, minY, maxX, maxY } = minMax;
    if (["V", "H", "L", "v", "h", "l"].indexOf(d.type) !== -1) {
        [d.p0 ? d.p0 : pd.p1, d.p1].forEach(function (point) {
            if (point.x < minX) {
                minX = point.x;
            }
            if (point.x > maxX) {
                maxX = point.x;
            }
            if (point.y < minY) {
                minY = point.y;
            }
            if (point.y > maxY) {
                maxY = point.y;
            }
        });
    } else if (["Q", "C", "q", "c"].indexOf(d.type) !== -1) {
        const co = t2DGeometry$3.cubicBezierCoefficients(d);
        const exe = t2DGeometry$3.cubicBezierTransition.bind(null, d.p0, co);
        let ii = 0;
        let point;
        while (ii < 1) {
            point = exe(ii);
            ii += 0.05;
            if (point.x < minX) {
                minX = point.x;
            }
            if (point.x > maxX) {
                maxX = point.x;
            }
            if (point.y < minY) {
                minY = point.y;
            }
            if (point.y > maxY) {
                maxY = point.y;
            }
        }
    } else {
        const point = d.p0;
        if (point.x < minX) {
            minX = point.x;
        }
        if (point.x > maxX) {
            maxX = point.x;
        }
        if (point.y < minY) {
            minY = point.y;
        }
        if (point.y > maxY) {
            maxY = point.y;
        }
    }
    minMax.minX = minX;
    minMax.minY = minY;
    minMax.maxX = maxX;
    minMax.maxY = maxY;
    bbox.x = minX;
    bbox.y = minY;
    bbox.width = maxX - minX;
    bbox.height = maxY - minY;
}
function pathParser(path) {
    let pathStr = path.replace(/e-/g, "$");
    pathStr = pathStr.replace(/ /g, ",");
    pathStr = pathStr.replace(/-/g, ",-");
    pathStr = pathStr
        .split(/([a-zA-Z,])/g)
        .filter((d) => {
            if (d === "" || d === ",") {
                return false;
            }
            return true;
        })
        .map((d) => {
            const dd = d.replace(/\$/g, "e-");
            return dd;
        });
    for (let i = 0; i < pathStr.length; i += 1) {
        if (pathStr[i].split(".").length > 2) {
            const splitArr = pathStr[i].split(".");
            const arr = [`${splitArr[0]}.${splitArr[1]}`];
            for (let j = 2; j < splitArr.length; j += 1) {
                arr.push(`.${splitArr[j]}`);
            }
            pathStr.splice(i, 1, arr[0], arr[1]);
        }
    }
    return pathStr;
}
function addVectors(v1, v2) {
    return {
        x: v1.x + v2.x,
        y: v1.y + v2.y,
    };
}
function subVectors(v1, v2) {
    return {
        x: v1.x - v2.x,
        y: v1.y - v2.y,
    };
}
function fetchXY() {
    const x = parseFloat(this.pathArr[(this.currPathArr += 1)]);
    const y = parseFloat(this.pathArr[(this.currPathArr += 1)]);
    return {
        x,
        y,
    };
}
function relative(flag, p1, p2) {
    return flag ? p2 : p1;
}
function m(rel, p0) {
    const temp = relative(
        rel,
        this.pp
            ? this.pp
            : {
                  x: 0,
                  y: 0,
              },
        {
            x: 0,
            y: 0,
        }
    );
    this.cntrl = null;
    this.cp = addVectors(p0, temp);
    this.start = this.cp;
    this.segmentLength = 0;
    this.length = this.segmentLength;
    if (this.currPathArr !== 0 && this.pp) {
        this.stackGroup.push(this.stack);
        this.stack = [];
    } else {
        this.stackGroup.push(this.stack);
    }
    this.stack.push({
        type: "M",
        p0: this.cp,
        length: this.segmentLength,
        pointAt() {
            return this.p0;
        },
    });
    this.pp = this.cp;
    updateBBox(
        this.stack[this.stack.length - 1],
        this.stack[this.stack.length - 2],
        this.minMax,
        this.BBox
    );
    return this;
}
function v(rel, p1) {
    const temp = relative(rel, this.pp, {
        x: this.pp.x,
        y: 0,
    });
    this.cntrl = null;
    this.cp = addVectors(p1, temp);
    this.segmentLength = t2DGeometry$3.getDistance(this.pp, this.cp);
    this.stack.push({
        type: "V",
        p0: this.pp,
        p1: this.cp,
        length: this.segmentLength,
        pointAt(f) {
            return t2DGeometry$3.linearTransitionBetweenPoints(this.p0, this.p1, f);
        },
    });
    this.length += this.segmentLength;
    this.pp = this.cp;
    updateBBox(
        this.stack[this.stack.length - 1],
        this.stack[this.stack.length - 2],
        this.minMax,
        this.BBox
    );
    return this;
}
function l(rel, p1) {
    const temp = relative(rel, this.pp, {
        x: 0,
        y: 0,
    });
    this.cntrl = null;
    this.cp = addVectors(p1, temp);
    this.segmentLength = t2DGeometry$3.getDistance(this.pp, this.cp);
    this.stack.push({
        type: rel ? "L" : "l",
        p0: this.pp,
        p1: this.cp,
        relative: {
            p1: p1,
        },
        length: this.segmentLength,
        pointAt(f) {
            return t2DGeometry$3.linearTransitionBetweenPoints(this.p0, this.p1, f);
        },
    });
    this.length += this.segmentLength;
    this.pp = this.cp;
    updateBBox(
        this.stack[this.stack.length - 1],
        this.stack[this.stack.length - 2],
        this.minMax,
        this.BBox
    );
    return this;
}
function h(rel, p1) {
    const temp = relative(rel, this.pp, {
        x: 0,
        y: this.pp.y,
    });
    this.cp = addVectors(p1, temp);
    this.cntrl = null;
    this.segmentLength = t2DGeometry$3.getDistance(this.pp, this.cp);
    this.stack.push({
        type: rel ? "H" : "h",
        p0: this.pp,
        p1: this.cp,
        length: this.segmentLength,
        relative: {
            p1: p1,
        },
        pointAt(f) {
            return t2DGeometry$3.linearTransitionBetweenPoints(this.p0, this.p1, f);
        },
    });
    this.length += this.segmentLength;
    this.pp = this.cp;
    updateBBox(
        this.stack[this.stack.length - 1],
        this.stack[this.stack.length - 2],
        this.minMax,
        this.BBox
    );
    return this;
}
function z() {
    this.cp = this.start;
    this.segmentLength = t2DGeometry$3.getDistance(this.pp, this.cp);
    this.stack.push({
        p0: this.pp,
        p1: this.cp,
        type: "Z",
        length: this.segmentLength,
        pointAt(f) {
            return t2DGeometry$3.linearTransitionBetweenPoints(this.p0, this.p1, f);
        },
    });
    this.length += this.segmentLength;
    this.pp = this.cp;
    updateBBox(
        this.stack[this.stack.length - 1],
        this.stack[this.stack.length - 2],
        this.minMax,
        this.BBox
    );
    return this;
}
function q(rel, c1, ep) {
    const temp = relative(rel, this.pp, {
        x: 0,
        y: 0,
    });
    const cntrl1 = addVectors(c1, temp);
    const endPoint = addVectors(ep, temp);
    this.cp = endPoint;
    this.segmentLength = t2DGeometry$3.bezierLength(this.pp, cntrl1, this.cp);
    this.cp = endPoint;
    this.stack.push({
        type: rel ? "Q" : "q",
        p0: this.pp,
        cntrl1,
        cntrl2: cntrl1,
        p1: this.cp,
        relative: {
            cntrl1: c1,
            p1: ep,
        },
        length: this.segmentLength,
        pointAt(f) {
            return t2DGeometry$3.bezierTransition(this.p0, this.cntrl1, this.p1, f);
        },
    });
    this.length += this.segmentLength;
    this.pp = this.cp;
    this.cntrl = cntrl1;
    updateBBox(
        this.stack[this.stack.length - 1],
        this.stack[this.stack.length - 2],
        this.minMax,
        this.BBox
    );
    return this;
}
function c(rel, c1, c2, ep) {
    const self = this;
    const temp = relative(rel, this.pp, {
        x: 0,
        y: 0,
    });
    const cntrl1 = addVectors(c1, temp);
    const cntrl2 = addVectors(c2, temp);
    const endPoint = addVectors(ep, temp);
    const co = t2DGeometry$3.cubicBezierCoefficients({
        p0: this.pp,
        cntrl1,
        cntrl2,
        p1: endPoint,
    });
    this.cntrl = cntrl2;
    this.cp = endPoint;
    this.segmentLength = t2DGeometry$3.cubicBezierLength(this.pp, co);
    this.stack.push({
        type: rel ? "C" : "c",
        p0: this.pp,
        cntrl1,
        cntrl2,
        p1: this.cp,
        length: this.segmentLength,
        co: co,
        relative: {
            cntrl1: c1,
            cntrl2: c2,
            p1: ep,
        },
        pointAt(f) {
            return t2DGeometry$3.cubicBezierTransition(this.p0, this.co, f);
        },
    });
    this.length += this.segmentLength;
    this.pp = this.cp;
    updateBBox(
        self.stack[self.stack.length - 1],
        self.stack[self.stack.length - 2],
        self.minMax,
        self.BBox
    );
    return this;
}
function s(rel, c2, ep) {
    const temp = relative(rel, this.pp, {
        x: 0,
        y: 0,
    });
    const cntrl2 = addVectors(c2, temp);
    const cntrl1 = this.cntrl
        ? addVectors(this.pp, subVectors(this.pp, this.cntrl ? this.cntrl : this.pp))
        : cntrl2;
    const endPoint = addVectors(ep, temp);
    this.cp = endPoint;
    const co = t2DGeometry$3.cubicBezierCoefficients({
        p0: this.pp,
        cntrl1,
        cntrl2,
        p1: endPoint,
    });
    this.segmentLength = t2DGeometry$3.cubicBezierLength(this.pp, co);
    this.stack.push({
        type: rel ? "S" : "s",
        p0: this.pp,
        cntrl1,
        cntrl2,
        p1: this.cp,
        co: co,
        length: this.segmentLength,
        relative: {
            cntrl2: c2,
            p1: ep,
        },
        pointAt(f) {
            return t2DGeometry$3.cubicBezierTransition(this.p0, this.co, f);
        },
    });
    updateBBox(
        this.stack[this.stack.length - 1],
        this.stack[this.stack.length - 2],
        this.minMax,
        this.BBox
    );
    this.length += this.segmentLength;
    this.pp = this.cp;
    this.cntrl = cntrl2;
    return this;
}
function a(rel, rx, ry, xRotation, arcLargeFlag, sweepFlag, ep) {
    const temp = relative(rel, this.pp, {
        x: 0,
        y: 0,
    });
    const self = this;
    const endPoint = addVectors(ep, temp);
    this.cp = endPoint;
    const arcToQuad = t2DGeometry$3.arcToBezier({
        px: this.pp.x,
        py: this.pp.y,
        cx: endPoint.x,
        cy: endPoint.y,
        rx,
        ry,
        xAxisRotation: xRotation,
        largeArcFlag: arcLargeFlag,
        sweepFlag,
    });
    arcToQuad.forEach((d, i) => {
        const pp =
            i === 0
                ? self.pp
                : {
                      x: arcToQuad[0].x,
                      y: arcToQuad[0].y,
                  };
        const cntrl1 = {
            x: d.x1,
            y: d.y1,
        };
        const cntrl2 = {
            x: d.x2,
            y: d.y2,
        };
        const cp = {
            x: d.x,
            y: d.y,
        };
        const segmentLength = t2DGeometry$3.cubicBezierLength(
            pp,
            t2DGeometry$3.cubicBezierCoefficients({
                p0: pp,
                cntrl1,
                cntrl2,
                p1: cp,
            })
        );
        self.stack.push({
            type: "C",
            p0: pp,
            cntrl1,
            cntrl2,
            p1: cp,
            length: segmentLength,
            pointAt(f) {
                return t2DGeometry$3.bezierTransition(this.p0, this.cntrl1, this.cntrl2, this.p1, f);
            },
        });
        self.length += segmentLength;
        updateBBox(
            self.stack[self.stack.length - 1],
            self.stack[self.stack.length - 2],
            self.minMax,
            self.BBox
        );
    });
    this.pp = this.cp;
    this.cntrl = null;
    return this;
}
function Path(path) {
    this.stack = [];
    this.length = 0;
    this.stackGroup = [];
    this.BBox = {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
    };
    this.minMax = {
        minX: Infinity,
        minY: Infinity,
        maxX: -Infinity,
        maxY: -Infinity,
    };
    if (path) {
        this.parse(path);
    }
}
Path.prototype = {
    z,
    m,
    v,
    h,
    l,
    q,
    s,
    c,
    a,
    fetchXY,
};
Path.prototype.points = function (points) {
    if (typeof this.f === "undefined") this.f = 0.3;
    if (typeof this.t === "undefined") this.t = 0.6;
    if (points.length === 0) return;
    this.m(true, { x: points[0].x, y: points[0].y });
    var m = 0;
    var dx1 = 0;
    var dy1 = 0;
    let dx2 = 0;
    let dy2 = 0;
    var preP = points[0];
    for (var i = 1; i < points.length; i++) {
        var curP = points[i];
        var nexP = points[i + 1];
        dx2 = 0;
        dy2 = 0;
        if (nexP) {
            m = (nexP.y - preP.y) / (nexP.x - preP.x);
            dx2 = (nexP.x - curP.x) * -this.f;
            dy2 = dx2 * m * this.t;
        }
        this.c(
            true,
            { x: preP.x - dx1, y: preP.y - dy1 },
            { x: curP.x + dx2, y: curP.y + dy2 },
            { x: curP.x, y: curP.y }
        );
        dx1 = dx2;
        dy1 = dy2;
        preP = curP;
    }
};
Path.prototype.curveFfactor = function (f) {
    this.f = f;
};
Path.prototype.curveTfactor = function (t) {
    this.t = t;
};
Path.prototype.parse = function parse(path) {
    this.path = path;
    this.currPathArr = -1;
    this.stack = [];
    this.length = 0;
    this.pathArr = pathParser(this.path);
    this.stackGroup = [];
    while (this.currPathArr < this.pathArr.length - 1) {
        this.case(this.pathArr[(this.currPathArr += 1)]);
    }
    return this.stack;
};
Path.prototype.fetchPathString = function () {
    let p = "";
    let c;
    for (let i = 0; i < this.stack.length; i++) {
        c = this.stack[i];
        if (c.type === "M" || c.type === "m") {
            p += c.type + " " + c.p0.x + "," + c.p0.y + " ";
        } else if (c.type === "Z" || c.type === "z") {
            p += "z";
        } else if (c.type === "C") {
            p +=
                c.type +
                " " +
                c.cntrl1.x +
                "," +
                c.cntrl1.y +
                " " +
                c.cntrl2.x +
                "," +
                c.cntrl2.y +
                " " +
                c.p1.x +
                "," +
                c.p1.y +
                " ";
        } else if (c.type === "c") {
            p +=
                c.type +
                " " +
                c.relative.cntrl1.x +
                "," +
                c.relative.cntrl1.y +
                " " +
                c.relative.cntrl2.x +
                "," +
                c.relative.cntrl2.y +
                " " +
                c.relative.p1.x +
                "," +
                c.relative.p1.y +
                " ";
        } else if (c.type === "Q") {
            p += c.type + " " + c.cntrl1.x + "," + c.cntrl1.y + " " + c.p1.x + "," + c.p1.y + " ";
        } else if (c.type === "q") {
            p +=
                c.type +
                " " +
                c.relative.cntrl1.x +
                "," +
                c.relative.cntrl1.y +
                " " +
                c.relative.p1.x +
                "," +
                c.relative.p1.y +
                " ";
        } else if (c.type === "S") {
            p += c.type + " " + c.cntrl2.x + "," + c.cntrl2.y + " " + c.p1.x + "," + c.p1.y + " ";
        } else if (c.type === "s") {
            p +=
                c.type +
                " " +
                c.relative.cntrl2.x +
                "," +
                c.relative.cntrl2.y +
                " " +
                c.relative.p1.x +
                "," +
                c.relative.p1.y +
                " ";
        } else if (c.type === "V") {
            p += c.type + " " + c.p1.y + " ";
        } else if (c.type === "v") {
            p += c.type + " " + c.relative.p1.y + " ";
        } else if (c.type === "H") {
            p += c.type + " " + c.p1.x + " ";
        } else if (c.type === "h") {
            p += c.type + " " + c.relative.p1.x + " ";
        } else if (c.type === "L") {
            p += c.type + " " + c.p1.x + "," + c.p1.y + " ";
        } else if (c.type === "l") {
            p += c.type + " " + c.relative.p1.x + "," + c.relative.p1.y + " ";
        }
    }
    return p;
};
Path.prototype.getTotalLength = function getTotalLength() {
    return this.length;
};
Path.prototype.getAngleAtLength = function getAngleAtLength(length, dir) {
    if (length > this.length) {
        return null;
    }
    const point1 = this.getPointAtLength(length);
    const point2 = this.getPointAtLength(
        length + (dir === "src" ? -1 * length * 0.01 : length * 0.01)
    );
    return Math.atan2(point2.y - point1.y, point2.x - point1.x);
};
Path.prototype.getPointAtLength = function getPointAtLength(length) {
    let coOr = {
        x: 0,
        y: 0,
    };
    let tLength = length;
    this.stack.every((d) => {
        tLength -= d.length;
        if (Math.floor(tLength) >= 0) {
            return true;
        }
        coOr = d.pointAt((d.length + tLength) / (d.length === 0 ? 1 : d.length));
        return false;
    });
    return coOr;
};
Path.prototype.execute = function (ctx, clippath) {
    let c;
    if (!clippath) {
        ctx.beginPath();
    }
    for (let i = 0; i < this.stack.length; i++) {
        c = this.stack[i];
        switch (c.type) {
            case "M":
            case "m":
                ctx.moveTo(c.p0.x, c.p0.y);
                break;
            case "Z":
            case "z":
                ctx.lineTo(c.p1.x, c.p1.y);
                break;
            case "L":
            case "l":
            case "V":
            case "v":
            case "H":
            case "h":
                ctx.lineTo(c.p1.x, c.p1.y);
                break;
            case "C":
            case "c":
            case "S":
            case "s":
                ctx.bezierCurveTo(c.cntrl1.x, c.cntrl1.y, c.cntrl2.x, c.cntrl2.y, c.p1.x, c.p1.y);
                break;
            case "Q":
            case "q":
                ctx.quadraticCurveTo(c.cntrl1.x, c.cntrl1.y, c.p1.x, c.p1.y);
                break;
        }
    }
    if (!clippath) {
        ctx.closePath();
    }
};
Path.prototype.getPoints = function () {
    const points = [];
    let d;
    for (let i = 0; i < this.stack.length; i++) {
        d = this.stack[i];
        const f = 0.05;
        let tf = 0;
        switch (d.type) {
            case "M":
            case "m":
                points[points.length] = d.p0.x;
                points[points.length] = d.p0.y;
                break;
            case "Z":
            case "z":
                points[points.length] = d.p1.x;
                points[points.length] = d.p1.y;
                break;
            case "L":
            case "l":
            case "V":
            case "v":
            case "H":
            case "h":
                points[points.length] = d.p1.x;
                points[points.length] = d.p1.y;
                break;
            case "C":
            case "c":
            case "S":
            case "s":
            case "Q":
            case "q":
                while (tf <= 1.0) {
                    const xy = d.pointAt(tf);
                    points[points.length] = xy.x;
                    points[points.length] = xy.y;
                    tf += f;
                }
                break;
        }
    }
    return points;
};
Path.prototype.case = function pCase(currCmd) {
    let currCmdI = currCmd;
    let rx;
    let ry;
    let xRotation;
    let arcLargeFlag;
    let sweepFlag;
    if (pathCmdIsValid(currCmdI)) {
        this.PC = currCmdI;
    } else {
        currCmdI = this.PC;
        this.currPathArr = this.currPathArr - 1;
    }
    switch (currCmdI) {
        case "m":
            this.m(false, this.fetchXY());
            break;
        case "M":
            this.m(true, this.fetchXY());
            break;
        case "v":
            this.v(false, {
                x: 0,
                y: parseFloat(this.pathArr[(this.currPathArr += 1)]),
            });
            break;
        case "V":
            this.v(true, {
                x: 0,
                y: parseFloat(this.pathArr[(this.currPathArr += 1)]),
            });
            break;
        case "l":
            this.l(false, this.fetchXY());
            break;
        case "L":
            this.l(true, this.fetchXY());
            break;
        case "h":
            this.h(false, {
                x: parseFloat(this.pathArr[(this.currPathArr += 1)]),
                y: 0,
            });
            break;
        case "H":
            this.h(true, {
                x: parseFloat(this.pathArr[(this.currPathArr += 1)]),
                y: 0,
            });
            break;
        case "q":
            this.q(false, this.fetchXY(), this.fetchXY());
            break;
        case "Q":
            this.q(true, this.fetchXY(), this.fetchXY());
            break;
        case "c":
            this.c(false, this.fetchXY(), this.fetchXY(), this.fetchXY());
            break;
        case "C":
            this.c(true, this.fetchXY(), this.fetchXY(), this.fetchXY());
            break;
        case "s":
            this.s(false, this.fetchXY(), this.fetchXY());
            break;
        case "S":
            this.s(true, this.fetchXY(), this.fetchXY());
            break;
        case "a":
            rx = parseFloat(this.pathArr[(this.currPathArr += 1)]);
            ry = parseFloat(this.pathArr[(this.currPathArr += 1)]);
            xRotation = parseFloat(this.pathArr[(this.currPathArr += 1)]);
            arcLargeFlag = parseFloat(this.pathArr[(this.currPathArr += 1)]);
            sweepFlag = parseFloat(this.pathArr[(this.currPathArr += 1)]);
            this.a(false, rx, ry, xRotation, arcLargeFlag, sweepFlag, this.fetchXY());
            break;
        case "A":
            rx = parseFloat(this.pathArr[(this.currPathArr += 1)]);
            ry = parseFloat(this.pathArr[(this.currPathArr += 1)]);
            xRotation = parseFloat(this.pathArr[(this.currPathArr += 1)]);
            arcLargeFlag = parseFloat(this.pathArr[(this.currPathArr += 1)]);
            sweepFlag = parseFloat(this.pathArr[(this.currPathArr += 1)]);
            this.a(true, rx, ry, xRotation, arcLargeFlag, sweepFlag, this.fetchXY());
            break;
        case "z":
        case "Z":
            this.z();
            break;
    }
};
function relativeCheck(type) {
    return ["S", "C", "V", "L", "H", "Q"].indexOf(type) > -1;
}
const CubicBezierTransition = function CubicBezierTransition(type, p0, c1, c2, co, length) {
    this.type = type;
    this.p0 = p0;
    this.c1_src = c1;
    this.c2_src = c2;
    this.co = co;
    this.length_src = length;
};
CubicBezierTransition.prototype.execute = function (f) {
    const co = this.co;
    const p0 = this.p0;
    const c1 = this.c1_src;
    const c2 = this.c2_src;
    const c1Temp = {
        x: p0.x + (c1.x - p0.x) * f,
        y: p0.y + (c1.y - p0.y) * f,
    };
    const c2Temp = {
        x: c1.x + (c2.x - c1.x) * f,
        y: c1.y + (c2.y - c1.y) * f,
    };
    this.cntrl1 = c1Temp;
    this.cntrl2 = {
        x: c1Temp.x + (c2Temp.x - c1Temp.x) * f,
        y: c1Temp.y + (c2Temp.y - c1Temp.y) * f,
    };
    this.p1 = {
        x: co.ax * t2DGeometry$3.pow(f, 3) + co.bx * t2DGeometry$3.pow(f, 2) + co.cx * f + p0.x,
        y: co.ay * t2DGeometry$3.pow(f, 3) + co.by * t2DGeometry$3.pow(f, 2) + co.cy * f + p0.y,
    };
    this.length = this.length_src * f;
    this.relative = {
        cntrl1: relativeCheck(this.type) ? this.cntrl1 : subVectors(this.cntrl1, this.p0),
        cntrl2: relativeCheck(this.type) ? this.cntrl2 : subVectors(this.cntrl2, this.p0),
        p1: relativeCheck(this.type) ? this.p1 : subVectors(this.p1, this.p0),
    };
    return this;
};
CubicBezierTransition.prototype.pointAt = function (f) {
    return t2DGeometry$3.cubicBezierTransition(this.p0, this.co, f);
};
const BezierTransition = function BezierTransition(type, p0, p1, p2, length) {
    this.type = type;
    this.p0 = p0;
    this.p1_src = p1;
    this.p2_src = p2;
    this.length_src = length;
    this.length = 0;
};
BezierTransition.prototype.execute = function (f) {
    const p0 = this.p0;
    const p1 = this.p1_src;
    const p2 = this.p2_src;
    this.length = this.length_src * f;
    this.cntrl1 = {
        x: p0.x + (p1.x - p0.x) * f,
        y: p0.y + (p1.y - p0.y) * f,
    };
    this.cntrl2 = this.cntrl1;
    this.p1 = {
        x: (p0.x - 2 * p1.x + p2.x) * f * f + (2 * p1.x - 2 * p0.x) * f + p0.x,
        y: (p0.y - 2 * p1.y + p2.y) * f * f + (2 * p1.y - 2 * p0.y) * f + p0.y,
    };
    this.relative = {
        cntrl1: relativeCheck(this.type) ? this.cntrl1 : subVectors(this.cntrl1, this.p0),
        p1: relativeCheck(this.type) ? this.p1 : subVectors(this.p1, this.p0),
    };
    return this;
};
BezierTransition.prototype.pointAt = function (f) {
    return t2DGeometry$3.bezierTransition(this.p0, this.cntrl1, this.p1, f);
};
const LinearTransitionBetweenPoints = function LinearTransitionBetweenPoints(
    type,
    p0,
    p2,
    length
) {
    this.type = type;
    this.p0 = p0;
    this.p1 = p0;
    this.p2_src = p2;
    this.length_src = length;
    this.length = 0;
};
LinearTransitionBetweenPoints.prototype.execute = function (f) {
    const p0 = this.p0;
    const p2 = this.p2_src;
    this.p1 = {
        x: p0.x + (p2.x - p0.x) * f,
        y: p0.y + (p2.y - p0.y) * f,
    };
    this.length = this.length_src * f;
    this.relative = {
        p1: relativeCheck(this.type) ? this.p1 : subVectors(this.p1, this.p0),
    };
    return this;
};
LinearTransitionBetweenPoints.prototype.pointAt = function (f) {
    return t2DGeometry$3.linearTransitionBetweenPoints(this.p0, this.p1, f);
};
function animatePathTo(targetConfig, fromConfig) {
    const self = this;
    const { duration, ease, end, loop, direction, attr, delay = 0 } = targetConfig;
    const src = (fromConfig || self)?.attr?.d ?? (attr.d || "");
    let totalLength = 0;
    self.arrayStack = [];
    if (this.ctx && this.ctx.type_ === "pdf") return;
    if (!src) {
        throw Error("Path Not defined");
    }
    const chainInstance = chain.sequenceChain();
    const newPathInstance = isTypePath(src) ? src : new Path(src);
    const arrExe = newPathInstance.stackGroup.reduce((p, c) => {
        p = p.concat(c);
        return p;
    }, []);
    const mappedArr = [];
    for (let i = 0; i < arrExe.length; i += 1) {
        if (arrExe[i].type === "Z" || arrExe[i].type === "z") {
            mappedArr.push({
                run(f) {
                    newPathInstance.stack.length = this.id + 1;
                    newPathInstance.stack[this.id] = this.render.execute(f);
                    self.setAttr("d", newPathInstance);
                },
                target: self,
                id: i,
                delay: 0,
                render: new LinearTransitionBetweenPoints(
                    arrExe[i].type,
                    arrExe[i].p0,
                    arrExe[0].p0,
                    arrExe[i].segmentLength
                ),
                length: arrExe[i].length,
            });
            totalLength += 0;
        } else if (["V", "v", "H", "h", "L", "l"].indexOf(arrExe[i].type) !== -1) {
            mappedArr.push({
                run(f) {
                    newPathInstance.stack.length = this.id + 1;
                    newPathInstance.stack[this.id] = this.render.execute(f);
                    self.setAttr("d", newPathInstance);
                },
                target: self,
                id: i,
                delay: 0,
                render: new LinearTransitionBetweenPoints(
                    arrExe[i].type,
                    arrExe[i].p0,
                    arrExe[i].p1,
                    arrExe[i].length
                ),
                length: arrExe[i].length,
            });
            totalLength += arrExe[i].length;
        } else if (arrExe[i].type === "Q" || arrExe[i].type === "q") {
            mappedArr.push({
                run(f) {
                    newPathInstance.stack.length = this.id + 1;
                    newPathInstance.stack[this.id] = this.render.execute(f);
                    self.setAttr("d", newPathInstance);
                },
                target: self,
                id: i,
                delay: 0,
                render: new BezierTransition(
                    arrExe[i].type,
                    arrExe[i].p0,
                    arrExe[i].cntrl1,
                    arrExe[i].p1,
                    arrExe[i].length
                ),
                length: arrExe[i].length,
            });
            totalLength += arrExe[i].length;
        } else if (
            arrExe[i].type === "C" ||
            arrExe[i].type === "S" ||
            arrExe[i].type === "c" ||
            arrExe[i].type === "s"
        ) {
            const co = t2DGeometry$3.cubicBezierCoefficients(arrExe[i]);
            mappedArr.push({
                run(f) {
                    newPathInstance.stack.length = this.id + 1;
                    newPathInstance.stack[this.id] = this.render.execute(f);
                    self.setAttr("d", newPathInstance);
                },
                target: self,
                id: i,
                co,
                delay: 0,
                render: new CubicBezierTransition(
                    arrExe[i].type,
                    arrExe[i].p0,
                    arrExe[i].cntrl1,
                    arrExe[i].cntrl2,
                    co,
                    arrExe[i].length
                ),
                length: arrExe[i].length,
            });
            totalLength += arrExe[i].length;
        } else if (arrExe[i].type === "M" || arrExe[i].type === "m") {
            mappedArr.push({
                run() {
                    newPathInstance.stack.length = this.id + 1;
                    newPathInstance.stack[this.id] = {
                        type: "M",
                        p0: arrExe[i].p0,
                        length: 0,
                        pointAt() {
                            return this.p0;
                        },
                    };
                },
                delay: 0,
                target: self,
                id: i,
                length: 0,
            });
            totalLength += 0;
        } else ;
    }
    mappedArr.forEach(function (d) {
        d.duration = (d.length / totalLength) * duration;
    });
    chainInstance
        .delay(delay)
        .add(mappedArr)
        .ease(ease)
        .loop(loop || 0)
        .direction(direction || "default");
    if (typeof end === "function") {
        chainInstance.end(end.bind(self));
    }
    chainInstance.commit();
    return this;
}
function morphTo(targetConfig) {
    const self = this;
    const { duration } = targetConfig;
    const { ease } = targetConfig;
    const loop = targetConfig.loop ? targetConfig.loop : 0;
    const direction = targetConfig.direction ? targetConfig.direction : "default";
    const destD = targetConfig.attr.d ? targetConfig.attr.d : self.attr.d;
    const srcPath = isTypePath(self.attr.d) ? self.attr.d.fetchPathString() : self.attr.d;
    const destPath = isTypePath(destD) ? destD.fetchPathString() : destD;
    const morphExe = interpolate(srcPath, destPath, {
        maxSegmentLength: 25,
    });
    queueInstance$5.add(
        animeId$2(),
        {
            run(f) {
                self.setAttr("d", morphExe(f));
            },
            target: self,
            duration: duration,
            loop: loop,
            delay: 0,
            direction: direction,
        },
        easying(ease)
    );
}
function isTypePath(pathInstance) {
    return pathInstance instanceof Path;
}
var path = {
    instance: function (d) {
        return new Path(d);
    },
    isTypePath,
    animatePathTo,
    morphTo,
};

const colorMap = {
    AliceBlue: "f0f8ff",
    AntiqueWhite: "faebd7",
    Aqua: "00ffff",
    Aquamarine: "7fffd4",
    Azure: "f0ffff",
    Beige: "f5f5dc",
    Bisque: "ffe4c4",
    Black: "000000",
    BlanchedAlmond: "ffebcd",
    Blue: "0000ff",
    BlueViolet: "8a2be2",
    Brown: "a52a2a",
    BurlyWood: "deb887",
    CadetBlue: "5f9ea0",
    Chartreuse: "7fff00",
    Chocolate: "d2691e",
    Coral: "ff7f50",
    CornflowerBlue: "6495ed",
    Cornsilk: "fff8dc",
    Crimson: "dc143c",
    Cyan: "00ffff",
    DarkBlue: "00008b",
    DarkCyan: "008b8b",
    DarkGoldenRod: "b8860b",
    DarkGray: "a9a9a9",
    DarkGrey: "a9a9a9",
    DarkGreen: "006400",
    DarkKhaki: "bdb76b",
    DarkMagenta: "8b008b",
    DarkOliveGreen: "556b2f",
    DarkOrange: "ff8c00",
    DarkOrchid: "9932cc",
    DarkRed: "8b0000",
    DarkSalmon: "e9967a",
    DarkSeaGreen: "8fbc8f",
    DarkSlateBlue: "483d8b",
    DarkSlateGray: "2f4f4f",
    DarkSlateGrey: "2f4f4f",
    DarkTurquoise: "00ced1",
    DarkViolet: "9400d3",
    DeepPink: "ff1493",
    DeepSkyBlue: "00bfff",
    DimGray: "696969",
    DimGrey: "696969",
    DodgerBlue: "1e90ff",
    FireBrick: "b22222",
    FloralWhite: "fffaf0",
    ForestGreen: "228b22",
    Fuchsia: "ff00ff",
    Gainsboro: "dcdcdc",
    GhostWhite: "f8f8ff",
    Gold: "ffd700",
    GoldenRod: "daa520",
    Gray: "808080",
    Grey: "808080",
    Green: "008000",
    GreenYellow: "adff2f",
    HoneyDew: "f0fff0",
    HotPink: "ff69b4",
    IndianRed: "cd5c5c",
    Indigo: "4b0082",
    Ivory: "fffff0",
    Khaki: "f0e68c",
    Lavender: "e6e6fa",
    LavenderBlush: "fff0f5",
    LawnGreen: "7cfc00",
    LemonChiffon: "fffacd",
    LightBlue: "add8e6",
    LightCoral: "f08080",
    LightCyan: "e0ffff",
    LightGoldenRodYellow: "fafad2",
    LightGray: "d3d3d3",
    LightGrey: "d3d3d3",
    LightGreen: "90ee90",
    LightPink: "ffb6c1",
    LightSalmon: "ffa07a",
    LightSeaGreen: "20b2aa",
    LightSkyBlue: "87cefa",
    LightSlateGray: "778899",
    LightSlateGrey: "778899",
    LightSteelBlue: "b0c4de",
    LightYellow: "ffffe0",
    Lime: "00ff00",
    LimeGreen: "32cd32",
    Linen: "faf0e6",
    Magenta: "ff00ff",
    Maroon: "800000",
    MediumAquaMarine: "66cdaa",
    MediumBlue: "0000cd",
    MediumOrchid: "ba55d3",
    MediumPurple: "9370db",
    MediumSeaGreen: "3cb371",
    MediumSlateBlue: "7b68ee",
    MediumSpringGreen: "00fa9a",
    MediumTurquoise: "48d1cc",
    MediumVioletRed: "c71585",
    MidnightBlue: "191970",
    MintCream: "f5fffa",
    MistyRose: "ffe4e1",
    Moccasin: "ffe4b5",
    NavajoWhite: "ffdead",
    Navy: "000080",
    OldLace: "fdf5e6",
    Olive: "808000",
    OliveDrab: "6b8e23",
    Orange: "ffa500",
    OrangeRed: "ff4500",
    Orchid: "da70d6",
    PaleGoldenRod: "eee8aa",
    PaleGreen: "98fb98",
    PaleTurquoise: "afeeee",
    PaleVioletRed: "db7093",
    PapayaWhip: "ffefd5",
    PeachPuff: "ffdab9",
    Peru: "cd853f",
    Pink: "ffc0cb",
    Plum: "dda0dd",
    PowderBlue: "b0e0e6",
    Purple: "800080",
    RebeccaPurple: "663399",
    Red: "ff0000",
    RosyBrown: "bc8f8f",
    RoyalBlue: "4169e1",
    SaddleBrown: "8b4513",
    Salmon: "fa8072",
    SandyBrown: "f4a460",
    SeaGreen: "2e8b57",
    SeaShell: "fff5ee",
    Sienna: "a0522d",
    Silver: "c0c0c0",
    SkyBlue: "87ceeb",
    SlateBlue: "6a5acd",
    SlateGray: "708090",
    SlateGrey: "708090",
    Snow: "fffafa",
    SpringGreen: "00ff7f",
    SteelBlue: "4682b4",
    Tan: "d2b48c",
    Teal: "008080",
    Thistle: "d8bfd8",
    Tomato: "ff6347",
    Turquoise: "40e0d0",
    Violet: "ee82ee",
    Wheat: "f5deb3",
    White: "ffffff",
    WhiteSmoke: "f5f5f5",
    Yellow: "ffff00",
    YellowGreen: "9acd32",
};
const round = Math.round;
var defaultColor$1 = "rgba(0,0,0,0)";
function RGBA(r, g, b, a) {
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a === undefined ? 255 : a;
    this.rgba = `rgba(${r},${g},${b},${a})`;
}
RGBA.prototype.normalize = function () {
    if (!this.normalFlag) {
        this.r /= 255;
        this.g /= 255;
        this.b /= 255;
        this.a /= 255;
        this.normalFlag = true;
    }
    return this;
};
function nameToHex(name) {
    return colorMap[name] ? `#${colorMap[name]}` : "#000";
}
function hexToRgb(hex) {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return new RGBA(parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16), 255);
}
function rgbToHex(rgb) {
    const rgbComponents = rgb.substring(rgb.lastIndexOf("(") + 1, rgb.lastIndexOf(")")).split(",");
    const r = parseInt(rgbComponents[0], 10);
    const g = parseInt(rgbComponents[1], 10);
    const b = parseInt(rgbComponents[2], 10);
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}
function rgbParse(rgb) {
    const res = rgb.replace(/[^0-9.,]+/g, "").split(",");
    const obj = {};
    const flags = ["r", "g", "b", "a"];
    for (let i = 0; i < res.length; i += 1) {
        obj[flags[i]] = parseFloat(res[i]);
    }
    return new RGBA(obj.r, obj.g, obj.b, obj.a);
}
function hslParse(hsl) {
    var r;
    var g;
    var b;
    var a;
    var h;
    var s;
    var l;
    const res = hsl
        .replace(/[^0-9.,]+/g, "")
        .split(",")
        .map(function (d) {
            return parseFloat(d);
        });
    h = res[0] / 360;
    s = res[1] / 100;
    l = res[2] / 100;
    a = res[3];
    if (s === 0) {
        r = g = b = l;
    } else {
        var hue2rgb = function hue2rgb(p, q, t) {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3) * 255;
        g = hue2rgb(p, q, h) * 255;
        b = hue2rgb(p, q, h - 1 / 3) * 255;
    }
    return new RGBA(r, g, b, a);
}
function colorToRGB(val) {
    return val instanceof RGBA
        ? val
        : val.startsWith("#")
        ? hexToRgb(val)
        : val.startsWith("rgb")
        ? rgbParse(val)
        : val.startsWith("hsl")
        ? hslParse(val)
        : {
              r: 0,
              g: 0,
              b: 0,
              a: 255,
          };
}
function colorToRGBPdf(val) {
    const rgbColor =
        val instanceof RGBA
            ? val
            : val.startsWith("#")
            ? hexToRgb(val)
            : val.startsWith("rgb")
            ? rgbParse(val)
            : val.startsWith("hsl")
            ? hslParse(val)
            : {
                  r: 0,
                  g: 0,
                  b: 0,
                  a: 255,
              };
    return [rgbColor.r, rgbColor.g, rgbColor.b];
}
function colorRGBtransition(src, dest) {
    src = src || defaultColor$1;
    dest = dest || defaultColor$1;
    src = colorToRGB(src);
    dest = colorToRGB(dest);
    return function trans(f) {
        return new RGBA(
            round(src.r + (dest.r - src.r) * f),
            round(src.g + (dest.g - src.g) * f),
            round(src.b + (dest.b - src.b) * f),
            round(src.a + (dest.a - src.a) * f)
        );
    };
}
function rgbaInstance(r, g, b, a) {
    return new RGBA(r, g, b, a);
}
function isTypeColor(value) {
    return (
        value instanceof RGBA ||
        value.startsWith("#") ||
        value.startsWith("rgb") ||
        value.startsWith("hsl")
    );
}
var colorMap$1 = {
    nameToHex: nameToHex,
    hexToRgb: hexToRgb,
    rgbToHex: rgbToHex,
    hslToRgb: hslParse,
    transition: colorRGBtransition,
    colorToRGB: colorToRGB,
    rgba: rgbaInstance,
    isTypeColor: isTypeColor,
    RGBAInstanceCheck: function (_) {
        return _ instanceof RGBA;
    },
    colorToRGBPdf: colorToRGBPdf,
};

function Events(vDom) {
    this.vDom = vDom;
    this.disable = false;
    this.dragNode = null;
    this.touchNode = null;
    this.wheelNode = null;
    this.pointers = [];
}
Events.prototype.getNode = function () {};
Events.prototype.addPointer = function (e) {
    this.pointers.push(e);
};
Events.prototype.removePointer = function (e) {
    const self = this;
    const pointers = this.pointers;
    let index = -1;
    for (var i = 0; i < pointers.length; i++) {
        if (e.pointerId === pointers[i].pointerId) {
            index = i;
            break;
        }
    }
    if (index !== -1) {
        self.pointers = [];
        self.distance = 0;
        if (this.pointerNode && this.pointerNode.node.events.zoom) {
            this.pointerNode.node.events.zoom.onZoomEnd(this.pointerNode.node, e, self);
        }
    }
};
Events.prototype.clickCheck = function (e) {
    propogateEvent(
        [this.vDom],
        {
            x: e.offsetX,
            y: e.offsetY,
        },
        e,
        "click"
    );
};
Events.prototype.dblclickCheck = function (e) {
    propogateEvent(
        [this.vDom],
        {
            x: e.offsetX,
            y: e.offsetY,
        },
        e,
        "dblclick"
    );
};
Events.prototype.pointerdownCheck = function (e) {
    const self = this;
    const node = propogateEvent(
        [this.vDom],
        {
            x: e.offsetX,
            y: e.offsetY,
        },
        e,
        "pointerdown"
    );
    if (node && (!this.pointerNode || this.pointerNode.node !== node)) {
        this.pointerNode = {
            node: node,
            clickCounter: 1,
            dragCounter: 0,
        };
    } else if (this.pointerNode) {
        this.pointerNode.clickCounter += 1;
    }
    if (node && (node.events.zoom || node.events.drag)) {
        if (node.events.zoom) {
            if (node.events.zoom.panFlag) {
                node.events.zoom.panExecute(node, e, "pointerdown", self);
            }
        }
        if (node.events.drag) {
            node.events.drag.execute(node, e, "pointerdown", self);
        }
    } else if (node) {
        if (e.pointerType === "touch") {
            node.events.mouseover.call(node, e);
        }
    }
};
Events.prototype.pointermoveCheck = function (e) {
    const self = this;
    const node = this.pointerNode ? this.pointerNode.node : null;
    if (node) {
        this.pointerNode.dragCounter += 1;
        if (node.events.zoom) {
            if (node.events.zoom.panFlag) {
                node.events.zoom.panExecute(node, e, "pointermove", self);
            }
            node.events.zoom.zoomPinch(node, e, self);
        }
        if (node.events.drag) {
            node.events.drag.execute(node, e, "pointermove", self);
        }
        if (node.events.mousemove) {
            node.events.mousemove.call(node, e);
        }
    }
    e.preventDefault();
};
function eventBubble(node, eventType, event) {
    if (node.dom.parent) {
        if (node.dom.parent.events[eventType]) {
            node.dom.parent.events[eventType](node.dom.parent, event);
        }
        return eventBubble(node.dom.parent, eventType, event);
    }
}
let clickInterval;
Events.prototype.pointerupCheck = function (e) {
    const self = this;
    const node = this.pointerNode ? this.pointerNode.node : null;
    if (node) {
        if (node.events.drag) {
            node.events.drag.execute(node, e, "pointerup", self);
        }
        if (node.events.zoom) {
            if (node.events.zoom.panFlag) {
                node.events.zoom.panExecute(node, e, "pointerup", self);
            }
        }
        if (
            this.pointerNode.dragCounter <= 2 ||
            (e.pointerType === "touch" && this.pointerNode.dragCounter <= 5)
        ) {
            if (node.events.click) {
                node.events.click.call(node, e);
            }
            eventBubble(node, "click", e);
            if (this.pointerNode.clickCounter === 2) {
                if (node.events.dblclick) {
                    node.events.dblclick.call(node, e);
                }
                eventBubble(node, "dblclick", e);
            }
            if (clickInterval) {
                clearTimeout(clickInterval);
            }
            clickInterval = setTimeout(function () {
                self.pointerNode = null;
                clickInterval = null;
            }, 200);
        } else {
            this.pointerNode = null;
        }
        if (e.pointerType === "touch") {
            node.events.mouseup.call(node, e);
        }
    }
};
Events.prototype.mousedownCheck = function (e) {
    propogateEvent(
        [this.vDom],
        {
            x: e.offsetX,
            y: e.offsetY,
        },
        e,
        "mousedown"
    );
};
Events.prototype.mousemoveCheck = function (e) {
    const node = propogateEvent(
        [this.vDom],
        {
            x: e.offsetX,
            y: e.offsetY,
        },
        e,
        "mousemove"
    );
    if (this.selectedNode && this.selectedNode !== node) {
        if (this.selectedNode.events.mouseout) {
            this.selectedNode.events.mouseout.call(this.selectedNode, e);
        }
        if (this.selectedNode.events.mouseleave) {
            this.selectedNode.events.mouseleave.call(this.selectedNode, e);
        }
    }
    if (node && (node.events.mouseover || node.events.mousein)) {
        if (this.selectedNode !== node) {
            if (node.events.mouseover) {
                node.events.mouseover.call(node, e);
            }
            if (node.events.mousein) {
                node.events.mousein.call(node, e);
            }
        }
    }
    this.selectedNode = node;
    e.preventDefault();
};
Events.prototype.mouseupCheck = function (e) {
    propogateEvent(
        [this.vDom],
        {
            x: e.offsetX,
            y: e.offsetY,
        },
        e,
        "mouseup"
    );
};
Events.prototype.mouseleaveCheck = function (e) {
    propogateEvent(
        [this.vDom],
        {
            x: e.offsetX,
            y: e.offsetY,
        },
        e,
        "mouseleave"
    );
};
Events.prototype.contextmenuCheck = function (e) {
    propogateEvent(
        [this.vDom],
        {
            x: e.offsetX,
            y: e.offsetY,
        },
        e,
        "contextmenu"
    );
};
Events.prototype.touchstartCheck = function (e) {
    propogateEvent(
        [this.vDom],
        {
            x: e.offsetX,
            y: e.offsetY,
        },
        e,
        "touchstart"
    );
};
Events.prototype.touchendCheck = function (e) {
    propogateEvent(
        [this.vDom],
        {
            x: e.offsetX,
            y: e.offsetY,
        },
        e,
        "touchend"
    );
};
Events.prototype.touchmoveCheck = function (e) {
    const touches = e.touches;
    if (touches.length === 0) {
        return;
    }
    propogateEvent(
        [this.vDom],
        {
            x: touches[0].clientX,
            y: touches[0].clientY,
        },
        e,
        "touchmove"
    );
};
Events.prototype.touchcancelCheck = function (e) {
    propogateEvent(
        [this.vDom],
        {
            x: e.x,
            y: e.y,
        },
        e,
        "touchcacel"
    );
};
let wheelCounter = 0;
let deltaWheel = 0;
Events.prototype.wheelEventCheck = function (e) {
    const self = this;
    if (!this.wheelNode) {
        let node = propogateEvent(
            [this.vDom],
            {
                x: e.offsetX,
                y: e.offsetY,
            },
            e,
            "wheel"
        );
        node = node || this.vDom;
        if (node && node.events.zoom) {
            if (!node.events.zoom.disableWheel) {
                node.events.zoom.zoomExecute(node, e, self);
                this.wheelNode = node;
            }
        }
    } else {
        this.wheelNode.events.zoom.zoomExecute(this.wheelNode, e, self);
        wheelCounter += 1;
        if (this.wheelHndl) {
            clearTimeout(this.wheelHndl);
            this.wheelHndl = null;
            deltaWheel = wheelCounter;
        }
        this.wheelHndl = setTimeout(function () {
            if (deltaWheel !== wheelCounter) {
                deltaWheel = wheelCounter;
            } else {
                self.wheelHndl = null;
                self.wheelNode.events.zoom.onZoomEnd(self.wheelNode, e, self);
                self.wheelNode = null;
                wheelCounter = 0;
            }
        }, 100);
    }
};
function propogateEvent(nodes, mouseCoor, rawEvent, eventType) {
    let node, temp;
    for (var i = nodes.length - 1; i >= 0; i -= 1) {
        var d = nodes[i];
        var coOr = {
            x: mouseCoor.x,
            y: mouseCoor.y,
        };
        if (!d.bbox) {
            continue;
        }
        transformCoOr(d, coOr);
        if (d.in({ x: coOr.x, y: coOr.y })) {
            if (d.children && d.children.length > 0) {
                temp = propogateEvent(
                    d.children,
                    {
                        x: coOr.x,
                        y: coOr.y,
                    },
                    rawEvent,
                    eventType
                );
                if (temp) {
                    node = temp;
                }
            } else {
                node = d;
            }
            if (d.events[eventType] && typeof d.events[eventType] === "function") {
                d.events[eventType](rawEvent);
            }
            if (node) {
                break;
            }
        }
    }
    if (!node && d.attr.id === "rootNode") {
        node = d;
        if (d.events[eventType] && typeof d.events[eventType] === "function") {
            d.events[eventType](rawEvent);
        }
    }
    return node;
}
function transformCoOr(d, coOr) {
    let hozMove = 0;
    let verMove = 0;
    let scaleX = 1;
    let scaleY = 1;
    const coOrLocal = coOr;
    if (d.attr.transform && d.attr.transform.translate) {
        [hozMove, verMove] = d.attr.transform.translate;
        coOrLocal.x -= hozMove;
        coOrLocal.y -= verMove;
    }
    if (d.attr.transform && d.attr.transform.scale) {
        scaleX = d.attr.transform.scale[0] !== undefined ? d.attr.transform.scale[0] : 1;
        scaleY = d.attr.transform.scale[1] !== undefined ? d.attr.transform.scale[1] : scaleX;
        coOrLocal.x /= scaleX;
        coOrLocal.y /= scaleY;
    }
    if (d.attr.transform && d.attr.transform.rotate) {
        const rotate = d.attr.transform.rotate[0];
        const cen = {
            x: d.attr.transform.rotate[1],
            y: d.attr.transform.rotate[2],
        };
        const x = coOrLocal.x;
        const y = coOrLocal.y;
        const cx = cen.x;
        const cy = cen.y;
        var radians = (Math.PI / 180) * rotate;
        var cos = Math.cos(radians);
        var sin = Math.sin(radians);
        coOrLocal.x = cos * (x - cx) + sin * (y - cy) + cx;
        coOrLocal.y = cos * (y - cy) - sin * (x - cx) + cy;
    }
}

let animeIdentifier$1 = 0;
const t2DGeometry$2 = geometry;
const easing$1 = fetchTransitionType;
const queueInstance$4 = queue;
const ResizeObserver = window.ResizeObserver || ResizeObserver$1;
function animeId$1() {
    animeIdentifier$1 += 1;
    return animeIdentifier$1;
}
const transitionSetAttr = function transitionSetAttr(self, key, value) {
    return function inner(f) {
        self.setAttr(key, value.call(self, f));
    };
};
const transformTransition = function transformTransition(self, subkey, srcVal, value) {
    const exe = [];
    if (typeof value === "function") {
        return function inner(f) {
            self[subkey](value.call(self, f));
        };
    }
    value.forEach((tV, i) => {
        let val;
        if (srcVal) {
            if (srcVal[i] !== undefined) {
                val = srcVal[i];
            } else {
                val = subkey === "scale" ? 1 : 0;
            }
        } else {
            val = subkey === "scale" ? 1 : 0;
        }
        exe.push(t2DGeometry$2.intermediateValue.bind(null, val, tV));
    });
    return function inner(f) {
        self[subkey](exe.map((d) => d(f)));
    };
};
const attrTransition = function attrTransition(self, key, srcVal, tgtVal) {
    return function setAttr_(f) {
        self.setAttr(key, t2DGeometry$2.intermediateValue(srcVal, tgtVal, f));
    };
};
const styleTransition = function styleTransition(self, key, sVal, value) {
    let srcValue;
    let destUnit;
    let destValue;
    if (typeof value === "function") {
        return function inner(f) {
            self.setStyle(key, value.call(self, self.dataObj, f));
        };
    } else {
        srcValue = sVal;
        if (isNaN(value)) {
            if (colorMap$1.isTypeColor(value)) {
                const colorExe = colorMap$1.transition(srcValue, value);
                return function inner(f) {
                    self.setStyle(key, colorExe(f));
                };
            }
            srcValue = srcValue.match(/(\d+)/g);
            destValue = value.match(/(\d+)/g);
            destUnit = value.match(/\D+$/);
            srcValue = parseInt(srcValue.length > 0 ? srcValue[0] : 0, 10);
            destValue = parseInt(destValue.length > 0 ? destValue[0] : 0, 10);
            destUnit = destUnit.length > 0 ? destUnit[0] : "px";
        } else {
            srcValue = sVal !== undefined ? sVal : 1;
            destValue = value;
            destUnit = 0;
        }
        return function inner(f) {
            self.setStyle(key, t2DGeometry$2.intermediateValue(srcValue, destValue, f) + destUnit);
        };
    }
};
const animate = function animate(self, fromConfig, targetConfig) {
    const tattr = targetConfig.attr ? targetConfig.attr : {};
    const tstyles = targetConfig.style ? targetConfig.style : {};
    const sattr = fromConfig.attr ? fromConfig.attr : {};
    const sstyles = fromConfig.style ? fromConfig.style : {};
    const runStack = [];
    if (typeof tattr !== "function") {
        for (const key in tattr) {
            if (key !== "transform") {
                const value = tattr[key];
                if (typeof value === "function") {
                    runStack[runStack.length] = function setAttr_(f) {
                        self.setAttr(key, value.call(self, f));
                    };
                } else {
                    if (key === "d") {
                        self.morphTo(targetConfig);
                    } else if (key === "points") {
                        console.log("write points mapper");
                    } else {
                        runStack[runStack.length] = attrTransition(
                            self,
                            key,
                            sattr[key],
                            tattr[key]
                        );
                    }
                }
            } else {
                if (typeof tattr[key] === "function") {
                    runStack[runStack.length] = transitionSetAttr(self, key, tattr[key]);
                } else {
                    let trans = sattr.transform;
                    if (!trans) {
                        self.setAttr("transform", {});
                        trans = {};
                    }
                    const subTrnsKeys = Object.keys(tattr.transform);
                    for (let j = 0, jLen = subTrnsKeys.length; j < jLen; j += 1) {
                        runStack[runStack.length] = transformTransition(
                            self,
                            subTrnsKeys[j],
                            trans[subTrnsKeys[j]],
                            tattr.transform[subTrnsKeys[j]]
                        );
                    }
                }
            }
        }
    } else {
        runStack[runStack.length] = tattr.bind(self);
    }
    if (typeof tstyles !== "function") {
        for (const style in tstyles) {
            runStack[runStack.length] = styleTransition(
                self,
                style,
                sstyles[style],
                tstyles[style]
            );
        }
    } else {
        runStack[runStack.length] = tstyles.bind(self);
    }
    return {
        run(f) {
            for (let j = 0, len = runStack.length; j < len; j += 1) {
                runStack[j](f);
            }
        },
        target: self,
        duration: targetConfig.duration || 0,
        delay: targetConfig.delay || 0,
        end: targetConfig.end ? targetConfig.end.bind(self, self.dataObj) : null,
        loop: targetConfig.loop || 0,
        direction: targetConfig.direction || "default",
        ease: targetConfig.ease || "default",
    };
};
function performJoin(data, nodes, cond) {
    const dataIds = data.map(cond);
    const res = {
        new: [],
        update: [],
        old: [],
    };
    for (let i = 0; i < nodes.length; i += 1) {
        const index = dataIds.indexOf(cond(nodes[i].dataObj, i));
        if (index !== -1) {
            nodes[i].dataObj = data[index];
            res.update.push(nodes[i]);
            dataIds[index] = null;
        } else {
            res.old.push(nodes[i]);
        }
    }
    res.new = data.filter((d, i) => {
        const index = dataIds.indexOf(cond(d, i));
        if (index !== -1) {
            dataIds[index] = null;
            return true;
        }
        return false;
    });
    return res;
}
const CompositeArray = {};
CompositeArray.push = {
    value: function (data) {
        if (Object.prototype.toString.call(data) !== "[object Array]") {
            data = [data];
        }
        for (let i = 0, len = data.length; i < len; i++) {
            this.data.push(data[i]);
        }
        if (this.config.action.enter) {
            const nodes = {};
            this.selector.split(",").forEach(function (d) {
                nodes[d] = data;
            });
            this.config.action.enter.call(this, nodes);
        }
    },
    enumerable: false,
    configurable: false,
    writable: false,
};
CompositeArray.pop = {
    value: function () {
        const self = this;
        const elData = this.data.pop();
        if (this.config.action.exit) {
            const nodes = {};
            this.selector.split(",").forEach(function (d) {
                nodes[d] = self.fetchEls(d, [elData]);
            });
            this.config.action.exit.call(this, nodes);
        }
    },
    enumerable: false,
    configurable: false,
    writable: false,
};
CompositeArray.remove = {
    value: function (data) {
        if (Object.prototype.toString.call(data) !== "[object Array]") {
            data = [data];
        }
        const self = this;
        for (let i = 0, len = data.length; i < len; i++) {
            if (this.data.indexOf(data[i]) !== -1) {
                this.data.splice(this.data.indexOf(data[i]), 1);
            }
        }
        if (this.config.action.exit) {
            const nodes = {};
            this.selector.split(",").forEach(function (d) {
                nodes[d] = self.fetchEls(d, data);
            });
            this.config.action.exit.call(this, nodes);
        }
    },
    enumerable: false,
    configurable: true,
    writable: false,
};
CompositeArray.update = {
    value: function () {
        const self = this;
        if (this.config.action.update) {
            const nodes = {};
            this.selector.split(",").forEach(function (d) {
                nodes[d] = self.fetchEls(d, self.data);
            });
            this.config.action.update.call(this, nodes);
        }
    },
    enumerable: false,
    configurable: true,
    writable: false,
};
CompositeArray.join = {
    value: function (data) {
        this.data = data;
        dataJoin.call(this, data, this.selector, this.config);
    },
    enumerable: false,
    configurable: true,
    writable: false,
};
var NodePrototype = function () {};
NodePrototype.prototype.getAttr = function (_) {
    return this.attr[_];
};
NodePrototype.prototype.getStyle = function (_) {
    return this.style[_];
};
NodePrototype.prototype.exec = function Cexe(exe) {
    if (typeof exe !== "function") {
        console.error("Wrong Exe type");
    }
    exe.call(this, this.dataObj);
    return this;
};
NodePrototype.prototype.fetchEls = function (nodeSelector, dataArray) {
    const nodes = [];
    const wrap = new CollectionPrototype();
    if (this.children.length > 0) {
        if (nodeSelector.charAt(0) === ".") {
            const classToken = nodeSelector.substring(1, nodeSelector.length);
            this.children.forEach((d) => {
                if (!d) {
                    return;
                }
                const check1 =
                    dataArray &&
                    d.dataObj &&
                    dataArray.indexOf(d.dataObj) !== -1 &&
                    d.attr.class === classToken;
                const check2 = !dataArray && d.attr.class === classToken;
                if (check1 || check2) {
                    nodes.push(d);
                }
            });
        } else if (nodeSelector.charAt(0) === "#") {
            const idToken = nodeSelector.substring(1, nodeSelector.length);
            this.children.every((d) => {
                if (!d) {
                    return;
                }
                const check1 =
                    dataArray &&
                    d.dataObj &&
                    dataArray.indexOf(d.dataObj) !== -1 &&
                    d.attr.id === idToken;
                const check2 = !dataArray && d.attr.id === idToken;
                if (check1 || check2) {
                    nodes.push(d);
                    return false;
                }
                return true;
            });
        } else {
            nodeSelector = nodeSelector === "group" ? "g" : nodeSelector;
            this.children.forEach((d) => {
                if (!d) {
                    return;
                }
                const check1 =
                    dataArray &&
                    d.dataObj &&
                    dataArray.indexOf(d.dataObj) !== -1 &&
                    d.nodeName === nodeSelector;
                const check2 = !dataArray && d.nodeName === nodeSelector;
                if (check1 || check2) {
                    nodes.push(d);
                }
            });
        }
    }
    return wrap.wrapper(nodes);
};
NodePrototype.prototype.fetchEl = function (nodeSelector, data) {
    let nodes;
    if (this.children.length > 0) {
        if (nodeSelector.charAt(0) === ".") {
            const classToken = nodeSelector.substring(1, nodeSelector.length);
            this.children.every((d) => {
                if (!d) {
                    return;
                }
                const check1 =
                    data && d.dataObj && data === d.dataObj && d.attr.class === classToken;
                const check2 = !data && d.attr.class === classToken;
                if (check1 || check2) {
                    nodes = d;
                    return false;
                }
                return true;
            });
        } else if (nodeSelector.charAt(0) === "#") {
            const idToken = nodeSelector.substring(1, nodeSelector.length);
            this.children.every((d) => {
                if (!d) {
                    return;
                }
                const check1 = data && d.dataObj && data === d.dataObj && d.attr.id === idToken;
                const check2 = !data && d.attr.id === idToken;
                if (check1 || check2) {
                    nodes = d;
                    return false;
                }
                return true;
            });
        } else {
            nodeSelector = nodeSelector === "group" ? "g" : nodeSelector;
            this.children.forEach((d) => {
                if (!d) {
                    return;
                }
                const check1 =
                    data && d.dataObj && data === d.dataObj && d.nodeName === nodeSelector;
                const check2 = !data && d.nodeName === nodeSelector;
                if (check1 || check2) {
                    nodes = d;
                }
            });
        }
    }
    return nodes;
};
function dataJoin(data, selector, config) {
    const self = this;
    const selectors = selector.split(",");
    let { joinOn } = config;
    const joinResult = {
        new: {},
        update: {},
        old: {},
    };
    if (!joinOn) {
        joinOn = function (d, i) {
            return i;
        };
    }
    for (let i = 0, len = selectors.length; i < len; i++) {
        const d = selectors[i];
        const nodes = self.fetchEls(d);
        const join = performJoin(data, nodes.stack, joinOn);
        joinResult.new[d] = join.new;
        joinResult.update[d] = new CollectionPrototype().wrapper(join.update);
        joinResult.old[d] = new CollectionPrototype().wrapper(join.old);
    }
    if (config.action) {
        if (config.action.enter) {
            config.action.enter.call(self, joinResult.new);
        }
        if (config.action.exit) {
            config.action.exit.call(self, joinResult.old);
        }
        if (config.action.update) {
            config.action.update.call(self, joinResult.update);
        }
    }
    CompositeArray.config = {
        value: config,
        enumerable: false,
        configurable: true,
        writable: true,
    };
    CompositeArray.selector = {
        value: selector,
        enumerable: false,
        configurable: true,
        writable: false,
    };
    CompositeArray.data = {
        value: data,
        enumerable: false,
        configurable: true,
        writable: true,
    };
    return Object.create(self, CompositeArray);
}
NodePrototype.prototype.join = dataJoin;
NodePrototype.prototype.data = function (data) {
    if (!data) {
        return this.dataObj;
    } else {
        this.dataObj = data;
    }
    return this;
};
NodePrototype.prototype.interrupt = function () {
    if (this.ctx && this.ctx.type_ === "pdf") return;
    if (this.animList && this.animList.length > 0) {
        for (var i = this.animList.length - 1; i >= 0; i--) {
            queueInstance$4.remove(this.animList[i]);
        }
    }
    this.animList = [];
    return this;
};
NodePrototype.prototype.animateTo = function (toConfig, fromConfig) {
    if (this.ctx && this.ctx.type_ === "pdf") return;
    queueInstance$4.add(
        animeId$1(),
        animate(this, fromConfig || this, toConfig),
        easing$1(toConfig.ease)
    );
    return this;
};
NodePrototype.prototype.animateExe = function (targetConfig, fromConfig) {
    if (this.ctx && this.ctx.type_ === "pdf") return;
    return animate(this, fromConfig || this, targetConfig);
};
function fetchEls(nodeSelector, dataArray) {
    let d;
    const coll = [];
    for (let i = 0; i < this.stack.length; i += 1) {
        d = this.stack[i];
        coll.push(d.fetchEls(nodeSelector, dataArray));
    }
    const collection = new CollectionPrototype();
    collection.wrapper(coll);
    return collection;
}
function join(data, el, arg) {
    let d;
    const coll = [];
    for (let i = 0; i < this.stack.length; i += 1) {
        d = this.stack[i];
        coll.push(d.join(data, el, arg));
    }
    const collection = new CollectionPrototype();
    collection.wrapper(coll);
    return collection;
}
function createEl(config) {
    let d;
    const coll = [];
    for (let i = 0, len = this.stack.length; i < len; i += 1) {
        let cRes = {};
        d = this.stack[i];
        if (typeof config === "function") {
            cRes = config.call(d, d.dataObj, i);
        } else {
            const keys = Object.keys(config);
            for (let j = 0, lenJ = keys.length; j < lenJ; j += 1) {
                const key = keys[j];
                if (typeof config[key] !== "object") {
                    cRes[key] = config[key];
                } else {
                    cRes[key] = JSON.parse(JSON.stringify(config[key]));
                }
            }
        }
        coll.push(d.createEl(cRes));
    }
    const collection = new CollectionPrototype();
    collection.wrapper(coll);
    return collection;
}
function createEls(data, config) {
    let d;
    const coll = [];
    let res = data;
    for (let i = 0, len = this.stack.length; i < len; i += 1) {
        let cRes = {};
        d = this.stack[i];
        if (typeof data === "function") {
            res = data.call(d, d.dataObj, i);
        }
        if (typeof config === "function") {
            cRes = config.call(d, d.dataObj, i);
        } else {
            const keys = Object.keys(config);
            for (let j = 0, lenJ = keys.length; j < lenJ; j += 1) {
                const key = keys[j];
                cRes[key] = config[key];
            }
        }
        coll.push(d.createEls(res, cRes));
    }
    const collection = new CollectionPrototype();
    collection.wrapper(coll);
    return collection;
}
function forEach(callBck) {
    for (let i = 0, len = this.stack.length; i < len; i += 1) {
        callBck.call(this.stack[i], this.stack[i].dataObj, i);
    }
    return this;
}
function setAttribute(key, value) {
    let d;
    for (let i = 0, len = this.stack.length; i < len; i += 1) {
        d = this.stack[i];
        if (arguments.length > 1) {
            if (typeof value === "function") {
                d.setAttr(key, value.call(d, d.dataObj, i));
            } else {
                d.setAttr(key, value);
            }
        } else if (typeof key === "function") {
            d.setAttr(key.call(d, d.dataObj, i));
        } else {
            const keys = Object.keys(key);
            for (let j = 0, lenJ = keys.length; j < lenJ; j += 1) {
                const keykey = keys[j];
                if (typeof key[keykey] === "function") {
                    d.setAttr(keykey, key[keykey].call(d, d.dataObj, i));
                } else {
                    d.setAttr(keykey, key[keykey]);
                }
            }
        }
    }
    return this;
}
function setStyle(key, value) {
    let d;
    for (let i = 0, len = this.stack.length; i < len; i += 1) {
        d = this.stack[i];
        if (arguments.length > 1) {
            if (typeof value === "function") {
                d.setStyle(key, value.call(d, d.dataObj, i));
            } else {
                d.setStyle(key, value);
            }
        } else {
            if (typeof key === "function") {
                d.setStyle(key.call(d, d.dataObj, i));
            } else {
                const keys = Object.keys(key);
                for (let j = 0, lenJ = keys.length; j < lenJ; j += 1) {
                    const keykey = keys[j];
                    if (typeof key[keykey] === "function") {
                        d.setStyle(keykey, key[keykey].call(d, d.dataObj, i));
                    } else {
                        d.setStyle(keykey, key[keykey]);
                    }
                }
            }
            if (typeof key === "function") {
                d.setStyle(key.call(d, d.dataObj, i));
            } else {
                d.setStyle(key);
            }
        }
    }
    return this;
}
function translate(value) {
    let d;
    for (let i = 0, len = this.stack.length; i < len; i += 1) {
        d = this.stack[i];
        if (typeof value === "function") {
            d.translate(value.call(d, d.dataObj, i));
        } else {
            d.translate(value);
        }
    }
    return this;
}
function rotate(value) {
    let d;
    for (let i = 0, len = this.stack.length; i < len; i += 1) {
        d = this.stack[i];
        if (typeof value === "function") {
            d.rotate(value.call(d, d.dataObj, i));
        } else {
            d.rotate(value);
        }
    }
    return this;
}
function scale(value) {
    let d;
    for (let i = 0, len = this.stack.length; i < len; i += 1) {
        d = this.stack[i];
        if (typeof value === "function") {
            d.scale(value.call(d, d.dataObj, i));
        } else {
            d.scale(value);
        }
    }
    return this;
}
function exec(value) {
    let d;
    if (typeof value !== "function") {
        return;
    }
    for (let i = 0, len = this.stack.length; i < len; i += 1) {
        d = this.stack[i];
        value.call(d, d.dataObj, i);
    }
    return this;
}
function on(eventType, hndlr) {
    for (let i = 0, len = this.stack.length; i < len; i += 1) {
        this.stack[i].on(eventType, hndlr);
    }
    return this;
}
function remove() {
    for (let i = 0, len = this.stack.length; i < len; i += 1) {
        this.stack[i].remove();
    }
    return this;
}
function interrupt() {
    for (let i = 0, len = this.stack.length; i < len; i += 1) {
        this.stack[i].interrupt();
    }
    return this;
}
function resolveObject(config, node, i) {
    const obj = {};
    let key;
    for (key in config) {
        if (key !== "end") {
            if (typeof config[key] === "function") {
                obj[key] = config[key].call(node, node.dataObj, i);
            } else {
                obj[key] = config[key];
            }
        }
    }
    return obj;
}
const animateArrayTo = function animateArrayTo(config) {
    let node;
    let newConfig;
    for (let i = 0; i < this.stack.length; i += 1) {
        newConfig = {};
        node = this.stack[i];
        newConfig = resolveObject(config, node, i);
        if (config.attr && typeof config.attr !== "function") {
            newConfig.attr = resolveObject(config.attr, node, i);
        }
        if (config.style && typeof config.style !== "function") {
            newConfig.style = resolveObject(config.style, node, i);
        }
        if (config.end) {
            newConfig.end = config.end;
        }
        if (config.ease) {
            newConfig.ease = config.ease;
        }
        node.animateTo(newConfig);
    }
    return this;
};
const animateArrayExe = function animateArrayExe(config) {
    let node;
    let newConfig;
    const exeArray = [];
    for (let i = 0; i < this.stack.length; i += 1) {
        newConfig = {};
        node = this.stack[i];
        newConfig = resolveObject(config, node, i);
        if (config.attr && typeof config.attr !== "function") {
            newConfig.attr = resolveObject(config.attr, node, i);
        }
        if (config.style && typeof config.style !== "function") {
            newConfig.style = resolveObject(config.style, node, i);
        }
        if (config.end) {
            newConfig.end = config.end;
        }
        if (config.ease) {
            newConfig.ease = config.ease;
        }
        exeArray.push(node.animateExe(newConfig));
    }
    return exeArray;
};
const animatePathArrayTo = function animatePathArrayTo(config) {
    let node;
    const keys = Object.keys(config);
    for (let i = 0, len = this.stack.length; i < len; i += 1) {
        node = this.stack[i];
        const conf = {};
        for (let j = 0; j < keys.length; j++) {
            let value = config[keys[j]];
            if (typeof value === "function") {
                value = value.call(node, node.dataObj, i);
            }
            conf[keys[j]] = value;
        }
        node.animatePathTo(conf);
    }
    return this;
};
const textArray = function textArray(value) {
    let node;
    if (typeof value !== "function") {
        for (let i = 0; i < this.stack.length; i += 1) {
            node = this.stack[i];
            node.text(value);
        }
    } else {
        for (let i = 0; i < this.stack.length; i += 1) {
            node = this.stack[i];
            node.text(value.call(node, node.dataObj, i));
        }
    }
    return this;
};
function CollectionPrototype(contextInfo, data, config, vDomIndex) {
    if (!data) {
        data = [];
    }
    let transform;
    let key;
    const attrKeys = config ? (config.attr ? Object.keys(config.attr) : []) : [];
    const styleKeys = config ? (config.style ? Object.keys(config.style) : []) : [];
    const bbox = config ? (config.bbox !== undefined ? config.bbox : true) : true;
    this.stack = data.map((d, i) => {
        const node = this.createNode(
            contextInfo.ctx,
            {
                el: config.el,
                bbox: bbox,
            },
            vDomIndex
        );
        for (let j = 0, len = styleKeys.length; j < len; j += 1) {
            key = styleKeys[j];
            if (typeof config.style[key] === "function") {
                const resValue = config.style[key].call(node, d, i);
                node.setStyle(key, resValue);
            } else {
                node.setStyle(key, config.style[key]);
            }
        }
        for (let j = 0, len = attrKeys.length; j < len; j += 1) {
            key = attrKeys[j];
            if (key !== "transform") {
                if (typeof config.attr[key] === "function") {
                    const resValue = config.attr[key].call(node, d, i);
                    node.setAttr(key, resValue);
                } else {
                    node.setAttr(key, config.attr[key]);
                }
            } else {
                if (typeof config.attr.transform === "function") {
                    transform = config.attr[key].call(node, d, i);
                } else {
                    ({ transform } = config.attr);
                }
                for (const trns in transform) {
                    node[trns](transform[trns]);
                }
            }
        }
        node.dataObj = d;
        return node;
    });
    return this;
}
CollectionPrototype.prototype = {
    createEls,
    createEl,
    forEach,
    setAttr: setAttribute,
    fetchEls,
    setStyle,
    translate,
    rotate,
    scale,
    exec,
    animateTo: animateArrayTo,
    animateExe: animateArrayExe,
    animatePathTo: animatePathArrayTo,
    remove,
    interrupt,
    text: textArray,
    join,
    on,
};
CollectionPrototype.prototype.createNode = function () {};
CollectionPrototype.prototype.wrapper = function wrapper(nodes) {
    const self = this;
    if (nodes) {
        for (let i = 0, len = nodes.length; i < len; i++) {
            const node = nodes[i];
            self.stack.push(node);
        }
    }
    return this;
};
const layerResizeHandler = function (entries) {
    for (const key in entries) {
        const entry = entries[key];
        const cr = entry.contentRect;
        if (entry.target.resizeHandler) {
            entry.target.resizeHandler.forEach(function (exec) {
                exec(cr);
            });
        }
    }
};
function layerResizeBind(layer, handler) {
    if (!layer.ro) {
        layer.ro = new ResizeObserver(layerResizeHandler);
        layer.ro.observe(layer.container);
    }
    if (!layer.container.resizeHandler) {
        layer.container.resizeHandler = [];
    }
    layer.container.resizeHandler.push(handler);
}
function layerResizeUnBind(layer, handler) {
    if (!layer.container.resizeHandler) {
        return;
    }
    const execIndex = layer.container.resizeHandler.indexOf(handler);
    if (execIndex !== -1) {
        layer.container.resizeHandler.splice(execIndex, 1);
    }
    if (layer.container.resizeHandler.length === 0 && layer.ro) {
        layer.ro.disconnect();
    }
}

const queueInstance$3 = queue;
let Id$2 = 0;
function domId$2() {
    Id$2 += 1;
    return Id$2;
}
const SVGCollection = function () {
    CollectionPrototype.apply(this, arguments);
};
SVGCollection.prototype = new CollectionPrototype();
SVGCollection.prototype.constructor = SVGCollection;
SVGCollection.prototype.createNode = function (ctx, config, vDomIndex) {
    return createDomElement(config, vDomIndex);
};
function SVGMasking(self, config = {}) {
    this.pDom = self;
    const maskId = config.id ? config.id : "mask-" + Math.ceil(Math.random() * 1000);
    this.id = config.id || maskId;
    config.id = maskId;
    if (!this.defs) {
        this.defs = self.createEl({
            el: "defs",
        });
    }
    this.mask = this.defs.createEl({
        el: "mask",
        attr: config,
        style: {},
    });
}
SVGMasking.prototype.exe = function exe() {
    return `url(#${this.id})`;
};
function SVGClipping(self, config = {}) {
    this.pDom = self;
    const clipId = config.id ? config.id : "clip-" + Math.ceil(Math.random() * 1000);
    this.id = config.id || clipId;
    config.id = clipId;
    if (!this.defs) {
        this.defs = self.createEl({
            el: "defs",
        });
    }
    this.clip = this.defs.createEl({
        el: "clipPath",
        attr: config,
        style: {},
    });
}
SVGClipping.prototype.exe = function exe() {
    return `url(#${this.id})`;
};
function SVGPattern(self, config = {}) {
    this.pDom = self;
    const patternId = config.id ? config.id : "pattern-" + Math.ceil(Math.random() * 1000);
    this.id = config.id || patternId;
    config.id = patternId;
    if (!this.defs) {
        this.defs = self.createEl({
            el: "defs",
        });
    }
    this.pattern = this.defs.createEl({
        el: "pattern",
        attr: config,
        style: {},
    });
}
SVGPattern.prototype.exe = function exe() {
    return `url(#${this.id})`;
};
function transformToString(trns) {
    let cmd = "";
    for (const trnX in trns) {
        if (trnX === "rotate") {
            cmd += `${trnX}(${
                trns.rotate[0] + " " + (trns.rotate[1] || 0) + " " + (trns.rotate[2] || 0)
            }) `;
        } else if (trnX === "skew") {
            if (trns.skew[0]) {
                cmd += `skewX(${trns[trnX][0]}) `;
            }
            if (trns.skew[1]) {
                cmd += `skewY(${trns[trnX][1]}) `;
            }
        } else {
            if (trns[trnX].length > 1) {
                cmd += `${trnX}(${trns[trnX].join(" ")}) `;
            } else {
                cmd += `${trnX}(${trns[trnX]}) `;
            }
        }
    }
    return cmd;
}
function DomGradients(config, type, pDom) {
    this.config = config;
    this.type = type || "linear";
    this.pDom = pDom;
    this.defs = this.pDom.createEl({
        el: "defs",
    });
}
DomGradients.prototype.exe = function exe() {
    return `url(#${this.config.id})`;
};
DomGradients.prototype.linearGradient = function linearGradient() {
    const self = this;
    this.linearEl = this.defs.join([1], "linearGradient", {
        action: {
            enter(data) {
                const gredEl = this.createEls(data.linearGradient, {
                    el: "linearGradient",
                }).setAttr({
                    id: self.config.id,
                    x1: `${self.config.x1}%`,
                    y1: `${self.config.y1}%`,
                    x2: `${self.config.x2}%`,
                    y2: `${self.config.y2}%`,
                    spreadMethod: self.config.spreadMethod || "pad",
                    gradientUnits: self.config.gradientUnits || "objectBoundingBox",
                });
                if (self.config.gradientTransform) {
                    gredEl.setAttr(
                        "gradientTransform",
                        transformToString(self.config.gradientTransform)
                    );
                }
            },
            exit(oldNodes) {
                oldNodes.linearGradient.remove();
            },
            update(nodes) {
                nodes.linearGradient.setAttr({
                    id: self.config.id,
                    x1: `${self.config.x1}%`,
                    y1: `${self.config.y1}%`,
                    x2: `${self.config.x2}%`,
                    y2: `${self.config.y2}%`,
                    spreadMethod: self.config.spreadMethod || "pad",
                    gradientUnits: self.config.gradientUnits || "objectBoundingBox",
                });
                if (self.config.gradientTransform) {
                    nodes.linearGradient.setAttr(
                        "gradientTransform",
                        transformToString(self.config.gradientTransform)
                    );
                }
            },
        },
    });
    this.linearEl = this.linearEl.fetchEl("linearGradient");
    this.linearEl.fetchEls("stop").remove();
    this.linearEl.createEls(this.config.colorStops, {
        el: "stop",
        attr: {
            "offset"(d) {
                return `${d.offset}%`;
            },
            "stop-color": function stopColor(d) {
                return d.color;
            },
        },
    });
    return this;
};
DomGradients.prototype.radialGradient = function radialGradient() {
    const self = this;
    const { innerCircle = {}, outerCircle = {} } = this.config;
    if (!this.defs) {
        this.defs = this.pDom.createEl({
            el: "defs",
        });
    }
    this.radialEl = this.defs.join([1], "radialGradient", {
        action: {
            enter(data) {
                const gredEl = this.createEls(data.radialGradient, {
                    el: "radialGradient",
                }).setAttr({
                    id: self.config.id,
                    cx: `${innerCircle.x}%`,
                    cy: `${innerCircle.y}%`,
                    r: `${innerCircle.r}%`,
                    fx: `${outerCircle.x}%`,
                    fy: `${outerCircle.y}%`,
                    spreadMethod: self.config.spreadMethod || "pad",
                    gradientUnits: self.config.gradientUnits || "objectBoundingBox",
                });
                if (self.config.gradientTransform) {
                    gredEl.setAttr(
                        "gradientTransform",
                        transformToString(self.config.gradientTransform)
                    );
                }
            },
            exit(oldNodes) {
                oldNodes.radialGradient.remove();
            },
            update(nodes) {
                nodes.radialGradient.setAttr({
                    id: self.config.id,
                    cx: `${innerCircle.x}%`,
                    cy: `${innerCircle.y}%`,
                    r: `${innerCircle.r}%`,
                    fx: `${outerCircle.x}%`,
                    fy: `${outerCircle.y}%`,
                    spreadMethod: self.config.spreadMethod || "pad",
                    gradientUnits: self.config.gradientUnits || "objectBoundingBox",
                });
                if (self.config.gradientTransform) {
                    nodes.radialGradient.setAttr(
                        "gradientTransform",
                        transformToString(self.config.gradientTransform)
                    );
                }
            },
        },
    });
    this.radialEl = this.radialEl.fetchEl("radialGradient");
    this.radialEl.fetchEls("stop").remove();
    this.radialEl.createEls(this.config.colorStops, {
        el: "stop",
        attr: {
            "offset"(d) {
                return `${d.offset}%`;
            },
            "stop-color": function stopColor(d) {
                return d.color;
            },
        },
    });
    return this;
};
DomGradients.prototype.colorStops = function colorStops(colorSts) {
    if (Object.prototype.toString.call(colorSts) !== "[object Array]") {
        return false;
    }
    this.config.colorStops = colorSts;
    if (this.type === "linear") {
        return this.linearGradient();
    } else if (this.type === "radial") {
        return this.radialGradient();
    }
    return false;
};
const nameSpace = {
    svg: "http://www.w3.org/2000/svg",
    xlink: "http://www.w3.org/1999/xlink",
    xhtml: "http://www.w3.org/1999/xhtml",
};
const buildDom = function buildSVGElement(ele) {
    return document.createElementNS(nameSpace.svg, ele);
};
const buildNamespaceDom = function buildNamespaceDom(ns, ele) {
    return document.createElementNS(nameSpace[ns], ele);
};
function createDomElement(obj, vDomIndex) {
    let dom = null;
    const ind = obj.el.indexOf(":");
    if (ind >= 0) {
        dom = buildNamespaceDom(obj.el.slice(0, ind), obj.el.slice(ind + 1));
    } else {
        switch (obj.el) {
            case "group":
                dom = buildDom("g");
                break;
            default:
                dom = buildDom(obj.el);
                break;
        }
    }
    const node = new DomExe(dom, obj, domId$2(), vDomIndex);
    if (obj.dataObj) {
        dom.dataObj = obj.dataObj;
    }
    return node;
}
const DomExe = function DomExe(dom, config, id, vDomIndex) {
    this.dom = dom;
    this.nodeName = dom.nodeName;
    this.attr = {};
    this.style = {};
    this.changedAttribute = {};
    this.changedStyles = {};
    this.id = id;
    this.nodeType = "svg";
    this.dom.nodeId = id;
    this.children = [];
    this.vDomIndex = vDomIndex;
    this.events = {};
    if (config.style) {
        this.setStyle(config.style);
    }
    if (config.attr) {
        this.setAttr(config.attr);
    }
};
DomExe.prototype = new NodePrototype();
DomExe.prototype.node = function node() {
    this.execute();
    return this.dom;
};
function updateAttrsToDom(self, key) {
    const ind = key.indexOf(":");
    const value = self.changedAttribute[key];
    if (ind >= 0) {
        self.dom.setAttributeNS(nameSpace[key.slice(0, ind)], key.slice(ind + 1), value);
    } else {
        if (key === "text") {
            self.dom.textContent = value;
        } else if (key === "d") {
            if (path.isTypePath(value)) {
                self.dom.setAttribute(key, value.fetchPathString());
            } else {
                self.dom.setAttribute(key, value);
            }
        } else {
            if (key === "onerror" || key === "onload") {
                self.dom[key] = function fun(e) {
                    value.call(self, e);
                };
            } else {
                self.dom.setAttribute(key, value);
            }
        }
    }
}
function updateTransAttrsToDom(self) {
    self.dom.setAttribute("transform", transformToString(self.attr.transform));
}
DomExe.prototype.transFormAttributes = function transFormAttributes() {
    const self = this;
    for (const key in self.changedAttribute) {
        if (key !== "transform") {
            updateAttrsToDom(self, key);
        } else {
            updateTransAttrsToDom(self);
        }
    }
    this.changedAttribute = {};
};
DomExe.prototype.scale = function DMscale(XY) {
    if (!this.attr.transform) {
        this.attr.transform = {};
    }
    this.attr.transform.scale = XY;
    this.changedAttribute.transform = this.attr.transform;
    this.attrChanged = true;
    queueInstance$3.vDomChanged(this.vDomIndex);
    return this;
};
DomExe.prototype.skewX = function DMskewX(x) {
    if (!this.attr.transform) {
        this.attr.transform = {};
    }
    this.attr.transform.skewX = [x];
    this.changedAttribute.transform = this.attr.transform;
    this.attrChanged = true;
    queueInstance$3.vDomChanged(this.vDomIndex);
    return this;
};
DomExe.prototype.skewY = function DMskewY(y) {
    if (!this.attr.transform) {
        this.attr.transform = {};
    }
    this.attr.transform.skewY = [y];
    this.changedAttribute.transform = this.attr.transform;
    this.attrChanged = true;
    queueInstance$3.vDomChanged(this.vDomIndex);
    return this;
};
DomExe.prototype.translate = function DMtranslate(XY) {
    if (!this.attr.transform) {
        this.attr.transform = {};
    }
    this.attr.transform.translate = XY;
    this.changedAttribute.transform = this.attr.transform;
    this.attrChanged = true;
    queueInstance$3.vDomChanged(this.vDomIndex);
    return this;
};
DomExe.prototype.rotate = function DMrotate(angle, x, y) {
    if (!this.attr.transform) {
        this.attr.transform = {};
    }
    if (Object.prototype.toString.call(angle) === "[object Array]" && angle.length > 0) {
        this.attr.transform.rotate = [angle[0] || 0, angle[1] || 0, angle[2] || 0];
    } else {
        this.attr.transform.rotate = [angle, x || 0, y || 0];
    }
    this.changedAttribute.transform = this.attr.transform;
    this.attrChanged = true;
    queueInstance$3.vDomChanged(this.vDomIndex);
    return this;
};
DomExe.prototype.setStyle = function DMsetStyle(attr, value) {
    if (arguments.length === 2) {
        if (value == null && this.style[attr] != null) {
            delete this.style[attr];
        } else {
            if (typeof value === "function") {
                value = value.call(this, this.dataObj);
            }
            if (colorMap$1.RGBAInstanceCheck(value)) {
                value = value.rgba;
            }
            this.style[attr] = value;
        }
        this.changedStyles[attr] = value;
    } else if (arguments.length === 1 && typeof attr === "object") {
        for (const key in attr) {
            if (attr[key] == null && this.style[attr] != null) {
                delete this.style[key];
            } else {
                this.style[key] = attr[key];
            }
            this.changedStyles[key] = attr[key];
        }
    }
    this.styleChanged = true;
    queueInstance$3.vDomChanged(this.vDomIndex);
    return this;
};
function pointsToString(points) {
    if (Object.prototype.toString.call(points) !== "[object Array]") {
        return;
    }
    return points.reduce(function (p, c) {
        return p + c.x + "," + c.y + " ";
    }, "");
}
DomExe.prototype.setAttr = function DMsetAttr(attr, value) {
    if (arguments.length === 2) {
        if (attr === "points") {
            value = pointsToString(value);
        }
        this.attr[attr] = value;
        this.changedAttribute[attr] = value;
    } else if (arguments.length === 1 && typeof attr === "object") {
        for (const key in attr) {
            if (key === "points") {
                attr[key] = pointsToString(attr[key]);
            }
            this.attr[key] = attr[key];
            this.changedAttribute[key] = attr[key];
        }
    }
    this.attrChanged = true;
    queueInstance$3.vDomChanged(this.vDomIndex);
    return this;
};
DomExe.prototype.execute = function DMexecute() {
    if (!this.styleChanged && !this.attrChanged) {
        for (let i = 0, len = this.children.length; i < len; i += 1) {
            this.children[i].execute();
        }
        return;
    }
    this.transFormAttributes();
    for (let i = 0, len = this.children.length; i < len; i += 1) {
        this.children[i].execute();
    }
    for (const style in this.changedStyles) {
        if (typeof this.changedStyles[style] === "object") {
            if (
                this.changedStyles[style] instanceof DomGradients ||
                this.changedStyles[style] instanceof SVGPattern ||
                this.changedStyles[style] instanceof SVGClipping ||
                this.changedStyles[style] instanceof SVGMasking
            ) {
                this.changedStyles[style] = this.changedStyles[style].exe();
            }
        }
        this.dom.style.setProperty(style, this.changedStyles[style], "");
    }
    this.changedStyles = {};
};
DomExe.prototype.child = function DMchild(nodes) {
    const parent = this.dom;
    const self = this;
    if (nodes instanceof SVGCollection) {
        var fragment = document.createDocumentFragment();
        for (let i = 0, len = nodes.stack.length; i < len; i++) {
            fragment.appendChild(nodes.stack[i].dom);
            nodes.stack[i].parentNode = self;
            nodes.stack[i].vDomIndex = self.vDomIndex;
            this.children[this.children.length] = nodes.stack[i];
        }
        parent.appendChild(fragment);
    } else if (nodes instanceof DomExe) {
        parent.appendChild(nodes.dom);
        nodes.parentNode = self;
        this.children.push(nodes);
    } else {
        console.log("wrong node type");
    }
    return this;
};
DomExe.prototype.animatePathTo = path.animatePathTo;
DomExe.prototype.morphTo = path.morphTo;
DomExe.prototype.createRadialGradient = function DMcreateRadialGradient(config) {
    const gradientIns = new DomGradients(config, "radial", this);
    gradientIns.radialGradient();
    return gradientIns;
};
DomExe.prototype.createLinearGradient = function DMcreateLinearGradient(config) {
    const gradientIns = new DomGradients(config, "linear", this);
    gradientIns.linearGradient();
    return gradientIns;
};
DomExe.prototype.on = function DMon(eventType, hndlr) {
    const self = this;
    if (self.events[eventType] && eventType !== "drag" && eventType !== "zoom") {
        self.dom.removeEventListener(eventType, self.events[eventType]);
        delete self.events[eventType];
    }
    if (eventType === "drag") {
        delete self.dom.drag_;
    }
    if (eventType === "zoom") {
        self.dom.removeEventListener("wheel", self.events[eventType]);
        delete self.dom.drag_;
    }
    if (!hndlr) {
        return;
    }
    if (eventType === "drag") {
        self.dom.drag_ = function (event, eventType) {
            hndlr.execute(self, event, eventType);
        };
    } else if (eventType === "zoom") {
        let wheelCounter = 0;
        let deltaWheel = 0;
        let wheelHndl;
        self.events[eventType] = function (event) {
            if (hndlr.disableWheel) {
                return;
            }
            hndlr.zoomExecute(self, event);
            wheelCounter += 1;
            if (wheelHndl) {
                clearTimeout(wheelHndl);
                wheelHndl = null;
                deltaWheel = wheelCounter;
            }
            wheelHndl = setTimeout(function () {
                if (deltaWheel !== wheelCounter) {
                    deltaWheel = wheelCounter;
                } else {
                    wheelHndl = null;
                    hndlr.onZoomEnd(self, event);
                    wheelCounter = 0;
                }
            }, 100);
        };
        self.dom.addEventListener("wheel", self.events[eventType]);
        self.dom.drag_ = function (event, eventType, eventsInstance) {
            if (hndlr.panFlag) {
                hndlr.panExecute(self, event, eventType, eventsInstance);
            }
        };
    } else {
        const hnd = hndlr.bind(self);
        self.events[eventType] = function (event) {
            hnd(event);
        };
        self.dom.addEventListener(eventType, self.events[eventType]);
    }
    return this;
};
DomExe.prototype.html = function DMhtml(value) {
    if (!arguments.length) {
        return this.dom.innerHTML;
    }
    this.dom.innerHTML(value);
    return this;
};
DomExe.prototype.text = function DMtext(value) {
    if (!arguments.length) {
        return this.attr.text;
    }
    this.attr.text = value;
    this.changedAttribute.text = value;
    return this;
};
DomExe.prototype.remove = function DMremove() {
    this.parentNode.removeChild(this);
};
DomExe.prototype.createEls = function DMcreateEls(data, config) {
    const e = new SVGCollection(
        {
            type: "SVG",
        },
        data,
        config,
        this.vDomIndex
    );
    this.child(e);
    queueInstance$3.vDomChanged(this.vDomIndex);
    return e;
};
DomExe.prototype.createEl = function DMcreateEl(config) {
    const e = createDomElement(config, this.vDomIndex);
    this.child(e);
    queueInstance$3.vDomChanged(this.vDomIndex);
    return e;
};
DomExe.prototype.removeChild = function DMremoveChild(obj) {
    const { children } = this;
    const index = children.indexOf(obj);
    if (index !== -1) {
        const dom = children.splice(index, 1)[0].dom;
        if (!this.dom.contains(dom)) {
            return;
        }
        this.dom.removeChild(dom);
    }
};
function svgLayer(container, layerSettings = {}) {
    const res =
        container instanceof HTMLElement
            ? container
            : typeof container === "string" || container instanceof String
            ? document.querySelector(container)
            : null;
    let height = res.clientHeight;
    let width = res.clientWidth;
    const { autoUpdate = true, enableResize = true } = layerSettings;
    const layer = document.createElementNS(nameSpace.svg, "svg");
    layer.setAttribute("height", height);
    layer.setAttribute("width", width);
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
            vDomIndex = queueInstance$3.addVdom(vDomInstance);
        }
    }
    const root = new DomExe(layer, {}, domId$2(), vDomIndex);
    root.container = res;
    root.type = "SVG";
    root.width = width;
    root.height = height;
    root.domEl = layer;
    const eventsInstance = new Events(root);
    if (vDomInstance) {
        vDomInstance.rootNode(root);
    }
    root.setLayerId = function (id) {
        layer.setAttribute("id", id);
    };
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
        layer.setAttribute("height", height);
        layer.setAttribute("width", width);
        root.width = width;
        root.height = height;
        if (resizeCall) {
            resizeCall();
        }
        root.update();
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
    root.setSize = function (width, height) {
        this.dom.setAttribute("height", height);
        this.dom.setAttribute("width", width);
        this.width = width;
        this.height = height;
        cHeight = height;
        cWidth = width;
    };
    root.update = function () {
        this.execute();
    };
    root.setViewBox = function (x, y, height, width) {
        this.dom.setAttribute("viewBox", x + "," + y + "," + width + "," + height);
    };
    root.destroy = function () {
        const res = document.body.contains(this.container);
        if (res && this.container.contains(this.domEl)) {
            this.container.removeChild(this.domEl);
        }
        queueInstance$3.removeVdom(vDomIndex);
        layerResizeUnBind(root, resize);
    };
    root.createPattern = function (config) {
        return new SVGPattern(this, config);
    };
    root.createClip = function (config) {
        return new SVGClipping(this, config);
    };
    root.createMask = function (config) {
        return new SVGMasking(this, config);
    };
    let dragNode = null;
    root.dom.addEventListener("pointerdown", (e) => {
        eventsInstance.addPointer(e);
        if (e.target.drag_) {
            e.target.drag_(e, "pointerdown", eventsInstance);
            dragNode = e.target;
        }
    });
    root.dom.addEventListener("pointerup", (e) => {
        if (dragNode) {
            dragNode.drag_(e, "pointerup", eventsInstance);
            dragNode = null;
        }
        eventsInstance.removePointer(e);
    });
    root.dom.addEventListener("pointermove", (e) => {
        e.preventDefault();
        if (dragNode) {
            dragNode.drag_(e, "pointermove", eventsInstance);
        }
    });
    queueInstance$3.execute();
    if (enableResize) {
        layerResizeBind(root, resize);
    }
    return root;
}

const queueInstance$2 = queue;
const easing = fetchTransitionType;
let animeIdentifier = 0;
function animeId() {
    animeIdentifier += 1;
    return animeIdentifier;
}
function checkForTranslateBounds(trnsExt, [scaleX, scaleY], newTrns) {
    return (
        newTrns[0] >= trnsExt[0][0] * scaleX &&
        newTrns[0] <= trnsExt[1][0] * scaleX &&
        newTrns[1] >= trnsExt[0][1] * scaleY &&
        newTrns[1] <= trnsExt[1][1] * scaleY
    );
}
function applyTranslate(event, { dx = 0, dy = 0 }, extent) {
    const translate = event.transform.translate;
    const [scaleX, scaleY = scaleX] = event.transform.scale;
    if (checkForTranslateBounds(extent, [scaleX, scaleY], [translate[0] + dx, translate[1] + dy])) {
        dx /= scaleX;
        dy /= scaleY;
        event.dx = dx;
        event.dy = dy;
        translate[0] /= scaleX;
        translate[1] /= scaleY;
        translate[0] += dx;
        translate[1] += dy;
        translate[0] *= scaleX;
        translate[1] *= scaleY;
    }
    return event;
}
const DragClass = function () {
    const self = this;
    this.dragStartFlag = false;
    this.dragExtent = [
        [-Infinity, -Infinity],
        [Infinity, Infinity],
    ];
    this.event = {
        x: 0,
        y: 0,
        dx: 0,
        dy: 0,
        transform: {
            translate: [0, 0],
            scale: [1, 1],
        },
    };
    this.onDragStart = function (trgt, event) {
        self.event.x = event.offsetX;
        self.event.y = event.offsetY;
        self.event.dx = 0;
        self.event.dy = 0;
        self.dragStartFlag = true;
    };
    this.onDrag = function () {};
    this.onDragEnd = function () {
        self.event.x = event.offsetX;
        self.event.y = event.offsetY;
        self.event.dx = 0;
        self.event.dy = 0;
        self.dragStartFlag = false;
    };
};
DragClass.prototype = {
    dragExtent: function (ext) {
        this.dragExtent = ext;
        return this;
    },
    dragStart: function (fun) {
        const self = this;
        if (typeof fun === "function") {
            this.onDragStart = function (trgt, event) {
                self.event.x = event.offsetX;
                self.event.y = event.offsetY;
                self.event.dx = 0;
                self.event.dy = 0;
                fun.call(trgt, self.event);
                self.dragStartFlag = true;
            };
        }
        return this;
    },
    drag: function (fun) {
        const self = this;
        if (typeof fun === "function") {
            this.onDrag = function (trgt, event) {
                const dx = event.offsetX - self.event.x;
                const dy = event.offsetY - self.event.y;
                self.event.x = event.offsetX;
                self.event.y = event.offsetY;
                self.event = applyTranslate(this.event, { dx, dy }, self.dragExtent);
                fun.call(trgt, self.event);
            };
        }
        return this;
    },
    dragEnd: function (fun) {
        const self = this;
        if (typeof fun === "function") {
            this.onDragEnd = function (trgt, event) {
                self.dragStartFlag = false;
                self.event.x = event.offsetX;
                self.event.y = event.offsetY;
                self.event.dx = 0;
                self.event.dy = 0;
                fun.call(trgt, self.event);
            };
        }
        return this;
    },
    bindMethods: function (trgt) {
        const self = this;
        trgt.dragTo = function (k, point) {
            self.dragTo(trgt, k, point);
        };
    },
    execute: function (trgt, event, eventType) {
        const self = this;
        this.event.e = event;
        if (event.preventDefault) {
            event.preventDefault();
        }
        if (!this.dragStartFlag && (eventType === "mousedown" || eventType === "pointerdown")) {
            self.onDragStart(trgt, event);
        } else if (
            this.onDragEnd &&
            this.dragStartFlag &&
            (eventType === "mouseup" ||
                eventType === "mouseleave" ||
                eventType === "pointerleave" ||
                eventType === "pointerup")
        ) {
            self.onDragEnd(trgt, event);
        } else if (this.dragStartFlag && this.onDrag) {
            self.onDrag(trgt, event);
        }
    },
};
function scaleRangeCheck(range, scale) {
    if (scale <= range[0]) {
        return range[0];
    } else if (scale >= range[1]) {
        return range[1];
    }
    return scale;
}
function computeTransform(transformObj, oScale, nScale, point) {
    transformObj.translate[0] /= oScale;
    transformObj.translate[1] /= oScale;
    transformObj.translate[0] -= point[0] / oScale - point[0] / nScale;
    transformObj.translate[1] -= point[1] / oScale - point[1] / nScale;
    transformObj.scale = [nScale, nScale];
    transformObj.translate[0] *= nScale;
    transformObj.translate[1] *= nScale;
    return transformObj;
}
const ZoomClass = function () {
    const self = this;
    this.event = {
        x: 0,
        y: 0,
        dx: 0,
        dy: 0,
        distance: 0,
    };
    this.event.pointers = [];
    this.event.transform = {
        translate: [0, 0],
        scale: [1, 1],
    };
    this.zoomBy_ = 0.001;
    this.zoomExtent_ = [0, Infinity];
    this.zoomStartFlag = false;
    this.zoomDuration = 250;
    this.onZoomStart = function (trgt, event) {
        self.event.x = event.offsetX;
        self.event.y = event.offsetY;
        self.event.dx = 0;
        self.event.dy = 0;
        self.zoomStartFlag = true;
        self.event.distance = 0;
    };
    this.onZoom = function (trgt, event) {
        self.event.x = event.offsetX;
        self.event.y = event.offsetY;
    };
    this.onZoomEnd = function (trgt, event) {
        self.event.x = event.offsetX;
        self.event.y = event.offsetY;
        self.event.dx = 0;
        self.event.dy = 0;
        self.zoomStartFlag = false;
        self.event.distance = 0;
    };
    this.onPanStart = function () {};
    this.onPan = function () {};
    this.onPanEnd = function () {};
    this.disableWheel = false;
    this.disableDbclick = false;
};
ZoomClass.prototype.zoomStart = function (fun) {
    const self = this;
    if (typeof fun === "function") {
        this.zoomStartExe = fun;
        this.onZoomStart = function (trgt, event, eventsInstance) {
            if (eventsInstance.pointers && eventsInstance.pointers.length === 2) {
                const pointers = eventsInstance.pointers;
                event = {
                    x: pointers[0].offsetX + (pointers[1].offsetX - pointers[0].offsetX) * 0.5,
                    y: pointers[0].offsetY + (pointers[1].offsetY - pointers[0].offsetY) * 0.5,
                };
            }
            self.event.x = event.offsetX;
            self.event.y = event.offsetY;
            self.event.dx = 0;
            self.event.dy = 0;
            if (!self.zoomStartFlag) {
                fun.call(trgt, self.event);
            }
            self.zoomStartFlag = true;
            self.event.distance = 0;
        };
    }
    return this;
};
ZoomClass.prototype.zoom = function (fun) {
    const self = this;
    if (typeof fun === "function") {
        this.zoomExe = fun;
        this.onZoom = function (trgt, event) {
            const transform = self.event.transform;
            const origScale = transform.scale[0];
            let newScale = origScale;
            const deltaY = event.deltaY;
            const x = event.offsetX;
            const y = event.offsetY;
            newScale = scaleRangeCheck(self.zoomExtent_, newScale + deltaY * -1 * self.zoomBy_);
            self.event.transform = computeTransform(transform, origScale, newScale, [x, y]);
            self.event.x = x;
            self.event.y = y;
            fun.call(trgt, self.event);
        };
    }
    return this;
};
ZoomClass.prototype.zoomEnd = function (fun) {
    const self = this;
    if (typeof fun === "function") {
        this.zoomEndExe = fun;
        this.onZoomEnd = function (trgt, event) {
            self.event.x = event.offsetX;
            self.event.y = event.offsetY;
            self.event.dx = 0;
            self.event.dy = 0;
            self.zoomStartFlag = false;
            fun.call(trgt, self.event);
            self.event.distance = 0;
        };
    }
    return this;
};
ZoomClass.prototype.zoomTransition = function () {};
ZoomClass.prototype.zoomExecute = function (trgt, event, eventsInstance) {
    this.eventType = "zoom";
    if (event.preventDefault) {
        event.preventDefault();
    }
    if (!this.zoomStartFlag) {
        this.onZoomStart(trgt, event, eventsInstance);
    } else {
        this.onZoom(trgt, event);
    }
};
ZoomClass.prototype.zoomPinch = function (trgt, event, eventsInstance) {
    const pointers = eventsInstance.pointers;
    if (event.preventDefault) {
        event.preventDefault();
    }
    if (eventsInstance.pointers.length === 2) {
        if (!this.zoomStartFlag) {
            this.onZoomStart(trgt, event, eventsInstance);
        } else {
            const distance_ = this.event.distance;
            for (var i = 0; i < pointers.length; i++) {
                if (event.pointerId === pointers[i].pointerId) {
                    pointers[i] = event;
                    break;
                }
            }
            const distance = geometry.getDistance(
                { x: pointers[0].offsetX, y: pointers[0].offsetY },
                { x: pointers[1].offsetX, y: pointers[1].offsetY }
            );
            const pinchEvent = {
                offsetX: this.event.x,
                offsetY: this.event.y,
                deltaY: !distance_ ? 0 : distance_ - distance,
            };
            this.event.distance = distance;
            this.onZoom(trgt, pinchEvent);
        }
    }
};
ZoomClass.prototype.scaleBy = function scaleBy(trgt, k, point) {
    const self = this;
    const transform = self.event.transform;
    const newScale = k * transform.scale[0];
    const origScale = transform.scale[0];
    const zoomTrgt = this.zoomTarget_ || point;
    const xdiff = (zoomTrgt[0] - point[0]) * origScale;
    const ydiff = (zoomTrgt[1] - point[1]) * origScale;
    let pf = 0;
    const targetConfig = {
        run(f) {
            const oScale = transform.scale[0];
            const nscale = scaleRangeCheck(
                self.zoomExtent_,
                origScale + (newScale - origScale) * f
            );
            self.event.transform = computeTransform(transform, oScale, nscale, point);
            self.event.transform.translate[0] += (xdiff * (f - pf)) / nscale;
            self.event.transform.translate[1] += (ydiff * (f - pf)) / nscale;
            pf = f;
            if (self.zoomExe) {
                self.zoomExe.call(trgt, self.event);
            }
        },
        target: trgt,
        duration: self.zoomDuration,
        delay: 0,
        end: function () {
            if (self.onZoomEnd) {
                self.onZoomEnd(trgt, {});
            }
        },
        loop: 1,
        direction: "default",
        ease: "default",
    };
    queueInstance$2.add(animeId(), targetConfig, easing(targetConfig.ease));
};
ZoomClass.prototype.zoomTarget = function zoomTarget(point) {
    this.zoomTarget_ = point;
};
ZoomClass.prototype.scaleTo = function scaleTo(trgt, newScale, point) {
    const self = this;
    const transform = self.event.transform;
    const origScale = transform.scale[0];
    const zoomTrgt = this.zoomTarget_ || point;
    const xdiff = (zoomTrgt[0] - point[0]) * origScale;
    const ydiff = (zoomTrgt[1] - point[1]) * origScale;
    let pf = 0;
    const targetConfig = {
        run(f) {
            const oScale = transform.scale[0];
            const nscale = scaleRangeCheck(
                self.zoomExtent_,
                origScale + (newScale - origScale) * f
            );
            self.event.transform = computeTransform(transform, oScale, nscale, point);
            self.event.transform.translate[0] += (xdiff * (f - pf)) / nscale;
            self.event.transform.translate[1] += (ydiff * (f - pf)) / nscale;
            pf = f;
            if (!self.zoomStartFlag) {
                self.onZoomStart(
                    trgt,
                    {
                        offsetX: point[0],
                        offsetY: point[1],
                    },
                    {}
                );
            }
            if (self.zoomExe) {
                self.zoomExe.call(trgt, self.event);
            }
        },
        target: trgt,
        duration: self.zoomDuration,
        delay: 0,
        end: function () {
            if (self.onZoomEnd) {
                self.onZoomEnd(trgt, self.event);
            }
        },
        loop: 1,
        direction: "default",
        ease: "default",
    };
    queueInstance$2.add(animeId(), targetConfig, easing(targetConfig.ease));
};
ZoomClass.prototype.panTo = function panTo(trgt, point) {
    const self = this;
    const transform = self.event.transform;
    const xdiff = point[0] - self.event.x;
    const ydiff = point[1] - self.event.y;
    let pf = 0;
    const targetConfig = {
        run(f) {
            const [scale] = transform.scale;
            transform.translate[0] += (xdiff * (f - pf)) / scale;
            transform.translate[1] += (ydiff * (f - pf)) / scale;
            pf = f;
            if (self.zoomExe) {
                self.zoomExe.call(trgt, self.event);
            }
        },
        target: trgt,
        duration: self.zoomDuration,
        delay: 0,
        end: function () {
            if (self.onZoomEnd) {
                self.onZoomEnd(trgt, self.event);
            }
        },
        loop: 1,
        direction: "default",
        ease: "default",
    };
    queueInstance$2.add(animeId(), targetConfig, easing(targetConfig.ease));
};
ZoomClass.prototype.bindMethods = function (trgt) {
    const self = this;
    trgt.scaleTo = function (k, point) {
        self.scaleTo(trgt, k, point);
    };
    trgt.scaleBy = function (k, point) {
        self.scaleBy(trgt, k, point);
        return trgt;
    };
    trgt.panTo = function (srcPoint, point) {
        self.panTo(trgt, srcPoint, point);
        return trgt;
    };
};
ZoomClass.prototype.zoomFactor = function (factor) {
    this.zoomBy_ = factor;
    return this;
};
ZoomClass.prototype.scaleExtent = function (range) {
    this.zoomExtent_ = range;
    return this;
};
ZoomClass.prototype.duration = function (time) {
    this.zoomDuration = time || 250;
    return this;
};
ZoomClass.prototype.panExtent = function (range) {
    this.panExtent_ = range;
    this.panFlag = true;
    return this;
};
ZoomClass.prototype.panExecute = function (trgt, event, eventType, eventsInstance) {
    if (eventsInstance.pointers.length !== 1) {
        return;
    }
    this.event.e = event;
    this.eventType = "pan";
    if (event.preventDefault) {
        event.preventDefault();
    }
    if (
        event.type === "touchstart" ||
        event.type === "touchmove" ||
        event.type === "touchend" ||
        event.type === "touchcancel"
    ) {
        event.offsetX = event.touches[0].clientX;
        event.offsetY = event.touches[0].clientY;
    }
    if (!this.zoomStartFlag && (eventType === "mousedown" || eventType === "pointerdown")) {
        this.onZoomStart(trgt, event, {});
    } else if (
        this.onZoomEnd &&
        (eventType === "mouseup" ||
            eventType === "mouseleave" ||
            eventType === "pointerup" ||
            eventType === "pointerleave")
    ) {
        this.onZoomEnd(trgt, event);
    } else if (this.zoomExe) {
        const dx = event.offsetX - this.event.x;
        const dy = event.offsetY - this.event.y;
        this.event.x = event.offsetX;
        this.event.y = event.offsetY;
        this.event = applyTranslate(this.event, { dx, dy }, this.panExtent_);
        this.zoomExe.call(trgt, this.event);
    }
    if (event.preventDefault) {
        event.preventDefault();
    }
};
var behaviour = {
    drag: function () {
        return new DragClass();
    },
    zoom: function () {
        return new ZoomClass();
    },
};

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
    "stroke": "strokeStyle",
    "lineDash": "setLineDash",
    "opacity": "globalAlpha",
    "stroke-width": "lineWidth",
    "stroke-dasharray": "setLineDash",
};
const t2DGeometry$1 = geometry;
const queueInstance$1 = queue;
let Id$1 = 0;
const zoomInstance$1 = behaviour.zoom();
const dragInstance$1 = behaviour.drag();
function domId$1() {
    Id$1 += 1;
    return Id$1;
}
const CanvasCollection = function () {
    CollectionPrototype.apply(this, arguments);
};
CanvasCollection.prototype = new CollectionPrototype();
CanvasCollection.prototype.constructor = CanvasCollection;
CanvasCollection.prototype.createNode = function (ctx, config, vDomIndex) {
    return new CanvasNodeExe$1(ctx, config, domId$1(), vDomIndex);
};
function getPixlRatio$1(ctx) {
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
function cRenderPdf(attr, pdfCtx, block) {
    const self = this;
    const transform = block ? self.attr.transform || {} : self.abTransform || {};
    const { scale = [1, 1], skew = [0, 0], translate = [0, 0] } = transform;
    const [hozScale = 1, verScale = hozScale] = scale;
    const [hozSkew = 0, verSkew = hozSkew] = skew;
    const [hozMove = 0, verMove = hozMove] = translate;
    pdfCtx.transform(hozScale, hozSkew, verSkew, verScale, hozMove, verMove);
    if (transform.rotate && transform.rotate.length > 0) {
        pdfCtx.translate(transform.rotate[1] || 0, transform.rotate[2] || 0);
        pdfCtx.rotate(transform.rotate[0] * (Math.PI / 180));
        pdfCtx.translate(-transform.rotate[1] || 0, -transform.rotate[2] || 0);
    }
    for (let i = 0; i < self.stack.length; i += 1) {
        self.stack[i].executePdf(pdfCtx, block);
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
function parseTransform$1(transform) {
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
function RPolyupdateBBox$1() {
    const self = this;
    const { transform, points = [] } = self.attr;
    const { translateX, translateY, scaleX, scaleY } = parseTransform$1(transform);
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
        self.BBoxHit = t2DGeometry$1.rotateBBox(this.BBox, transform);
    } else {
        self.BBoxHit = this.BBox;
    }
    self.abYposition = abYposition;
}
function CanvasGradient$1(config = {}, type = "linear") {
    this.config = config;
    this.type = type;
    this.dom = {};
    this.mode = !this.config.mode || this.config.mode === "percent" ? "percent" : "absolute";
}
CanvasGradient$1.prototype = new NodePrototype();
CanvasGradient$1.prototype.exe = function GRAexe(ctx, BBox) {
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
CanvasGradient$1.prototype.setAttr = function (attr, value) {
    this.config[attr] = value;
};
CanvasGradient$1.prototype.exePdf = function GRAexe(ctx, BBox, AABox) {
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
CanvasGradient$1.prototype.linearGradientPdf = function GralinearGradient(ctx, BBox, AABox) {
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
CanvasGradient$1.prototype.linearGradient = function GralinearGradient(ctx, BBox) {
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
CanvasGradient$1.prototype.absoluteLinearGradient = function absoluteGralinearGradient(ctx) {
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
CanvasGradient$1.prototype.absoluteLinearGradientPdf = function absoluteGralinearGradient(
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
CanvasGradient$1.prototype.radialGradient = function GRAradialGradient(ctx, BBox) {
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
CanvasGradient$1.prototype.radialGradientPdf = function GRAradialGradient(ctx, BBox, AABox) {
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
CanvasGradient$1.prototype.absoluteRadialGradient = function absoluteGraradialGradient(ctx) {
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
CanvasGradient$1.prototype.absoluteRadialGradientPdf = function absoluteGraradialGradient(
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
CanvasGradient$1.prototype.colorStops = function GRAcolorStops(colorStopValues) {
    if (Object.prototype.toString.call(colorStopValues) !== "[object Array]") {
        return false;
    }
    this.config.colorStops = colorStopValues;
    return this;
};
function createLinearGradient$1(config) {
    return new CanvasGradient$1(config, "linear");
}
function createRadialGradient$1(config) {
    return new CanvasGradient$1(config, "radial");
}
function PixelObject(data, width, height) {
    this.imageData = data;
    this.width = width;
    this.height = height;
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
function CanvasMask(self, config = {}) {
    const maskId = config.id ? config.id : "mask-" + Math.ceil(Math.random() * 1000);
    this.config = config;
    this.mask = new CanvasNodeExe$1(
        self.dom.ctx,
        {
            el: "g",
            attr: {
                id: maskId,
            },
        },
        domId$1(),
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
    this.clip = new CanvasNodeExe$1(
        self.dom.ctx,
        {
            el: "g",
            attr: {
                id: clipId,
            },
        },
        domId$1(),
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
    selfSelf.pattern = canvasLayer$1(
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
function CanvasDom() {
    this.abYposition = 0;
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
    setAttr: domSetAttribute,
    setStyle: domSetStyle,
    applyStyles,
    applyStylesPdf,
};
function imageInstance$1(self) {
    const imageIns = new Image();
    imageIns.crossOrigin = "anonymous";
    imageIns.onload = function onload() {
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
        queueInstance$1.vDomChanged(self.nodeExe.vDomIndex);
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
    queueInstance$1.vDomChanged(nodeExe.vDomIndex);
    self.stack = [self];
}
RenderImage.prototype = new CanvasDom();
RenderImage.prototype.constructor = RenderImage;
RenderImage.prototype.setAttr = function RIsetAttr(attr, value) {
    const self = this;
    if (attr === "src") {
        if (typeof value === "string") {
            self.image = self.image ? self.image : imageInstance$1(self);
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
        } else if (value instanceof CanvasNodeExe$1 || value instanceof RenderTexture) {
            self.imageObj = value.domEl;
            self.attr.height = self.attr.height ? self.attr.height : value.attr.height;
            self.attr.width = self.attr.width ? self.attr.width : value.attr.width;
        }
    }
    this.attr[attr] = value;
    queueInstance$1.vDomChanged(this.nodeExe.vDomIndex);
};
RenderImage.prototype.updateBBox = function RIupdateBBox() {
    const self = this;
    const { transform, x = 0, y = 0, width = 0, height = 0 } = self.attr;
    const { translateX, translateY, scaleX, scaleY } = parseTransform$1(transform);
    self.BBox = {
        x: (translateX + x) * scaleX,
        y: (translateY + y) * scaleY,
        width: width * scaleX,
        height: height * scaleY,
    };
    if (transform && transform.rotate) {
        self.BBoxHit = t2DGeometry$1.rotateBBox(this.BBox, transform);
    } else {
        self.BBoxHit = this.BBox;
    }
    self.abYposition = y;
};
RenderImage.prototype.execute = function RIexecute() {
    const { width = 0, height = 0, x = 0, y = 0 } = this.attr;
    if (this.imageObj) {
        this.ctx.drawImage(this.imageObj, x, y, width, height);
    }
};
RenderImage.prototype.executePdf = function RIexecute(pdfCtx) {
    const { width = 0, height = 0, x = 0, y = 0 } = this.attr;
    if (this.attr.src) {
        pdfCtx.translate(0, -this.abYposition);
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
RenderText.prototype.setStyle = function (attr, value) {
    if (value == null && this.style[attr] != null) {
        delete this.style[attr];
    } else {
        this.style[attr] = value;
        if (attr === "font" && this.attr && this.attr.width && this.attr.text) {
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
RenderText.prototype.updateBBox = function RTupdateBBox() {
    const self = this;
    let height = 1;
    let width = 0;
    let { x = 0, y = 0, transform } = self.attr;
    const { translateX, translateY, scaleX, scaleY } = parseTransform$1(transform);
    const { doc } = self.ctx;
    if (this.style.font) {
        this.ctx.font = this.style.font;
        height = parseInt(this.style.font.replace(/[^\d.]/g, ""), 10) || 1;
        self.textHeight = height + 3;
    } else {
        self.textHeight = this.ctx.measureText("I2DJS-Z").fontBoundingBoxAscent;
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
    if (doc) {
        const alignVlaue = this.style.align ?? this.style.textAlign;
        const styleObect = {
            ...(this.attr.width && { width: this.attr.width }),
            ...(this.style.lineGap && { lineGap: this.style.lineGap }),
            ...(this.style.textBaseline && { textBaseline: this.style.textBaseline }),
            ...(alignVlaue && { align: alignVlaue }),
        };
        if (this.style.font) {
            doc.fontSize(parseInt(this.style.font.replace(/[^\d.]/g, ""), 10) || 10);
        }
        height = doc.heightOfString(this.attr.text, styleObect);
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
        self.BBoxHit = t2DGeometry$1.rotateBBox(this.BBox, transform);
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
RenderText.prototype.executePdf = function RTexecute(pdfCtx, block) {
    if (this.attr.text !== undefined && this.attr.text !== null) {
        if (this.style.font) {
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
            pdfCtx.text(this.attr.text, this.attr.x, block ? this.attr.y : 0, styleObect);
        }
        if (this.style.strokeStyle || this.style.stroke || this.style.strokeColor) {
            pdfCtx.text(this.attr.text, this.attr.x, block ? this.attr.y : 0, styleObect);
        }
    }
};
RenderText.prototype.in = function RTinfun(co) {
    const { x = 0, y = 0, width = 0, height = 0 } = this;
    return co.x >= x && co.x <= x + width && co.y >= y && co.y <= y + height;
};
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
    const { translateX, translateY, scaleX, scaleY } = parseTransform$1(transform);
    self.BBox = {
        x: translateX + (cx - r) * scaleX,
        y: translateY + (cy - r) * scaleY,
        width: 2 * r * scaleX,
        height: 2 * r * scaleY,
    };
    if (transform && transform.rotate) {
        self.BBoxHit = t2DGeometry$1.rotateBBox(this.BBox, transform);
    } else {
        self.BBoxHit = this.BBox;
    }
    self.abYposition = cy;
};
RenderCircle.prototype.execute = function RCexecute() {
    const { r = 0, cx = 0, cy = 0 } = this.attr;
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, r, 0, 2 * Math.PI, false);
    this.applyStyles();
    this.ctx.closePath();
};
RenderCircle.prototype.executePdf = function RCexecute(pdfCtx, block) {
    const { r = 0, cx = 0, cy = 0 } = this.attr;
    if (!block) {
        pdfCtx.translate(0, -this.abYposition);
    }
    pdfCtx.circle(parseInt(cx), parseInt(cy), parseInt(r));
    this.applyStylesPdf(pdfCtx);
};
RenderCircle.prototype.in = function RCinfun(co) {
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
    const { translateX, translateY, scaleX, scaleY } = parseTransform$1(transform);
    self.BBox = {
        x: translateX + (x1 < x2 ? x1 : x2) * scaleX,
        y: translateY + (y1 < y2 ? y1 : y2) * scaleY,
        width: Math.abs(x2 - x1) * scaleX,
        height: Math.abs(y2 - y1) * scaleY,
    };
    if (transform && transform.rotate) {
        self.BBoxHit = t2DGeometry$1.rotateBBox(this.BBox, transform);
    } else {
        self.BBoxHit = this.BBox;
    }
    self.abYposition = y1 < y2 ? y1 : y2;
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
RenderLine.prototype.executePdf = function RLexecute(pdfCtx, block) {
    const { x1 = 0, y1 = 0, x2 = 0, y2 = 0 } = this.attr;
    if (!block) {
        pdfCtx.translate(0, -this.abYposition);
    }
    pdfCtx.moveTo(x1, y1);
    pdfCtx.lineTo(x2, y2);
    pdfCtx.stroke();
};
RenderLine.prototype.in = function RLinfun(co) {
    const { x1 = 0, y1 = 0, x2 = 0, y2 = 0 } = this.attr;
    return (
        parseFloat(
            t2DGeometry$1.getDistance(
                {
                    x: x1,
                    y: y1,
                },
                co
            ) +
                t2DGeometry$1.getDistance(co, {
                    x: x2,
                    y: y2,
                })
        ).toFixed(1) ===
        parseFloat(
            t2DGeometry$1.getDistance(
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
RenderPolyline.prototype.executePdf = function polylineExe(pdfCtx, block) {
    let d;
    if (!this.attr.points || this.attr.points.length === 0) return;
    if (!block) {
        pdfCtx.translate(0, -this.abYposition);
    }
    pdfCtx.moveTo(this.attr.points[0].x, this.attr.points[0].y);
    for (var i = 1; i < this.attr.points.length; i++) {
        d = this.attr.points[i];
        pdfCtx.lineTo(d.x, d.y);
    }
    pdfCtx.stroke();
};
RenderPolyline.prototype.updateBBox = RPolyupdateBBox$1;
RenderPolyline.prototype.in = function RPolyLinfun(co) {
    let flag = false;
    for (let i = 0, len = this.attr.points.length; i <= len - 2; i++) {
        const p1 = this.attr.points[i];
        const p2 = this.attr.points[i + 1];
        flag =
            flag ||
            parseFloat(
                t2DGeometry$1.getDistance(
                    {
                        x: p1.x,
                        y: p1.y,
                    },
                    co
                ) +
                    t2DGeometry$1.getDistance(co, {
                        x: p2.x,
                        y: p2.y,
                    })
            ).toFixed(1) ===
                parseFloat(
                    t2DGeometry$1.getDistance(
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
    const { translateX, translateY, scaleX, scaleY } = parseTransform$1(transform);
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
        self.BBoxHit = t2DGeometry$1.rotateBBox(this.BBox, transform);
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
RenderPath.prototype.executePdf = function RPexecute(pdfCtx, block) {
    if (this.attr.d) {
        if (!block) {
            pdfCtx.translate(0, -this.abYposition);
        }
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
RenderPolygon.prototype.updateBBox = RPolyupdateBBox$1;
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
RenderPolygon.prototype.executePdf = function RPolyexecute(pdfCtx, block) {
    if (!this.polygon) {
        return;
    }
    if (!block) {
        pdfCtx.translate(0, -this.abYposition);
    }
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
    const { translateX, translateY, scaleX, scaleY } = parseTransform$1(transform);
    self.BBox = {
        x: translateX + (cx - rx) * scaleX,
        y: translateY + (cy - ry) * scaleY,
        width: rx * 2 * scaleX,
        height: ry * 2 * scaleY,
    };
    if (transform && transform.rotate) {
        self.BBoxHit = t2DGeometry$1.rotateBBox(this.BBox, transform);
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
RenderEllipse.prototype.executePdf = function REexecute(pdfCtx, block) {
    const { cx = 0, cy = 0, rx = 0, ry = 0 } = this.attr;
    if (!block) {
        pdfCtx.translate(0, -this.abYposition);
    }
    pdfCtx.ellipse(cx, cy, rx, ry);
    this.applyStylesPdf(pdfCtx);
};
RenderEllipse.prototype.in = function REinfun(co) {
    const { cx = 0, cy = 0, rx = 0, ry = 0 } = this.attr;
    return ((co.x - cx) * (co.x - cx)) / (rx * rx) + ((co.y - cy) * (co.y - cy)) / (ry * ry) <= 1;
};
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
RenderRect.prototype.updateBBox = function RRupdateBBox() {
    const self = this;
    const { transform, x = 0, y = 0, width = 0, height = 0 } = self.attr;
    const { translateX, translateY, scaleX, scaleY } = parseTransform$1(transform);
    self.BBox = {
        x: translateX + x * scaleX,
        y: translateY + y * scaleY,
        width: width * scaleX,
        height: height * scaleY,
    };
    if (transform && transform.rotate) {
        self.BBoxHit = t2DGeometry$1.rotateBBox(this.BBox, transform);
    } else {
        self.BBoxHit = this.BBox;
    }
    self.abYposition = y;
};
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
RenderRect.prototype.executePdf = function RRexecute(pdfCtx, block) {
    const { x = 0, y = 0, width = 0, height = 0, rx = 0, ry = 0 } = this.attr;
    if (!block) {
        pdfCtx.translate(0, -this.abYposition);
    }
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
    }
};
RenderRect.prototype.in = function RRinfun(co) {
    const { x = 0, y = 0, width = 0, height = 0 } = this.attr;
    return co.x >= x && co.x <= x + width && co.y >= y && co.y <= y + height;
};
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
    const { translateX, translateY, scaleX, scaleY } = parseTransform$1(transform);
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
        self.BBoxHit = t2DGeometry$1.rotateBBox(this.BBox, this.attr.transform);
    } else {
        self.BBoxHit = this.BBox;
    }
};
RenderGroup.prototype.child = function RGchild(obj) {
    const self = this;
    const objLocal = obj;
    if (objLocal instanceof CanvasNodeExe$1) {
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
    const { translateX, translateY, scaleX, scaleY } = parseTransform$1(transform);
    return (
        co.x >= (BBox.x - translateX) / scaleX &&
        co.x <= (BBox.x - translateX + BBox.width) / scaleX &&
        co.y >= (BBox.y - translateY) / scaleY &&
        co.y <= (BBox.y - translateY + BBox.height) / scaleY
    );
};
const CanvasNodeExe$1 = function CanvasNodeExe(context, config, id, vDomIndex) {
    this.style = config.style || {};
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
    this.block = config.block || false;
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
        case "polygon":
            this.dom = new RenderPolygon(this.ctx, this.attr, this.style);
            break;
        case "ellipse":
            this.dom = new RenderEllipse(this.ctx, this.attr, this.style);
            break;
        default:
            this.dom = new DummyDom(this.ctx, this.attr, this.style);
            this.bbox = false;
            this.BBoxUpdate = false;
            break;
    }
    this.dom.nodeExe = this;
    this.setStyle(config.style);
};
CanvasNodeExe$1.prototype = new NodePrototype();
CanvasNodeExe$1.prototype.node = function Cnode() {
    this.updateBBox();
    return this.dom;
};
CanvasNodeExe$1.prototype.stylesExe = function CstylesExe() {
    let value;
    let key;
    const style = this.style;
    this.resolvedStyle = {};
    for (key in style) {
        if (typeof style[key] === "string" || typeof style[key] === "number") {
            value = style[key];
        } else if (typeof style[key] === "object") {
            if (
                style[key] instanceof CanvasGradient$1 ||
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
CanvasNodeExe$1.prototype.stylesExePdf = function CstylesExe(pdfCtx) {
    if (!pdfCtx) return;
    const style = this.style;
    let value;
    for (let key in style) {
        if (typeof style[key] === "string" || typeof style[key] === "number") {
            value = style[key];
        } else if (typeof style[key] === "object") {
            if (
                style[key] instanceof CanvasGradient$1 ||
                style[key] instanceof CanvasPattern ||
                style[key] instanceof CanvasClipping ||
                style[key] instanceof CanvasMask
            ) {
                value = style[key].exePdf(pdfCtx, this.dom.BBox, this.dom.abTransform);
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
            value = colorMap$1.colorToRGBPdf(value);
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
CanvasNodeExe$1.prototype.remove = function Cremove() {
    const { children } = this.dom.parent;
    const index = children.indexOf(this);
    if (index !== -1) {
        children.splice(index, 1);
    }
    this.dom.parent.BBoxUpdate = true;
    queueInstance$1.vDomChanged(this.vDomIndex);
};
CanvasNodeExe$1.prototype.attributesExe = function CattributesExe() {
    this.dom.render(this.attr);
};
CanvasNodeExe$1.prototype.attributesExePdf = function CattributesExe(pdfCtx, block) {
    this.dom.renderPdf(this.attr, pdfCtx, block);
};
CanvasNodeExe$1.prototype.setStyle = function CsetStyle(attr, value) {
    if (arguments.length === 2) {
        if (value == null && this.style[attr] != null) {
            delete this.style[attr];
        } else {
            this.style[attr] = valueCheck(value);
        }
        this.dom.setStyle(attr, this.style[attr]);
    } else if (arguments.length === 1 && typeof attr === "object") {
        const styleKeys = Object.keys(attr);
        for (let i = 0, len = styleKeys.length; i < len; i += 1) {
            if (attr[styleKeys[i]] == null && this.style[styleKeys[i]] != null) {
                delete this.style[styleKeys[i]];
            } else {
                this.style[styleKeys[i]] = valueCheck(attr[styleKeys[i]]);
            }
            this.dom.setStyle(styleKeys[i], this.style[styleKeys[i]]);
        }
    }
    queueInstance$1.vDomChanged(this.vDomIndex);
    return this;
};
function valueCheck(value) {
    if (colorMap$1.RGBAInstanceCheck(value)) {
        value = value.rgba;
    }
    return value === "#000" || value === "#000000" || value === "black" ? "#010101" : value;
}
CanvasNodeExe$1.prototype.setAttr = function CsetAttr(attr, value) {
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
    queueInstance$1.vDomChanged(this.vDomIndex);
    return this;
};
CanvasNodeExe$1.prototype.rotate = function Crotate(angle, x, y) {
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
    queueInstance$1.vDomChanged(this.vDomIndex);
    return this;
};
CanvasNodeExe$1.prototype.scale = function Cscale(XY) {
    if (!this.attr.transform) {
        this.attr.transform = {};
    }
    if (XY.length < 1) {
        return null;
    }
    this.attr.transform.scale = [XY[0], XY[1] ? XY[1] : XY[0]];
    this.dom.setAttr("transform", this.attr.transform);
    this.BBoxUpdate = true;
    queueInstance$1.vDomChanged(this.vDomIndex);
    return this;
};
CanvasNodeExe$1.prototype.translate = function Ctranslate(XY) {
    if (!this.attr.transform) {
        this.attr.transform = {};
    }
    this.attr.transform.translate = XY;
    this.dom.setAttr("transform", this.attr.transform);
    this.BBoxUpdate = true;
    queueInstance$1.vDomChanged(this.vDomIndex);
    return this;
};
CanvasNodeExe$1.prototype.skewX = function CskewX(x) {
    if (!this.attr.transform) {
        this.attr.transform = {};
    }
    if (!this.attr.transform.skew) {
        this.attr.transform.skew = [];
    }
    this.attr.transform.skew[0] = x;
    this.dom.setAttr("transform", this.attr.transform);
    this.BBoxUpdate = true;
    queueInstance$1.vDomChanged(this.vDomIndex);
    return this;
};
CanvasNodeExe$1.prototype.skewY = function CskewY(y) {
    if (!this.attr.transform) {
        this.attr.transform = {};
    }
    if (!this.attr.transform.skew) {
        this.attr.transform.skew = [];
    }
    this.attr.transform.skew[1] = y;
    this.dom.setAttr("transform", this.attr.transform);
    this.BBoxUpdate = true;
    queueInstance$1.vDomChanged(this.vDomIndex);
    return this;
};
CanvasNodeExe$1.prototype.execute = function Cexecute() {
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
CanvasNodeExe$1.prototype.executePdf = function Cexecute(pdfCtx, block) {
    if (this.style.display === "none") {
        return;
    }
    if (!(this.dom instanceof RenderGroup) || block || this.block) {
        pdfCtx.save();
        this.stylesExePdf(pdfCtx);
        this.attributesExePdf(pdfCtx, block);
    }
    if (this.dom instanceof RenderGroup) {
        for (let i = 0, len = this.children.length; i < len; i += 1) {
            this.children[i].executePdf(pdfCtx, block || this.block);
        }
    }
    if (!(this.dom instanceof RenderGroup) || block || this.block) {
        pdfCtx.restore();
    }
};
CanvasNodeExe$1.prototype.prependChild = function child(childrens) {
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
    queueInstance$1.vDomChanged(this.vDomIndex);
    return self;
};
CanvasNodeExe$1.prototype.child = function child(childrens) {
    const self = this;
    const childrensLocal = childrens;
    if (self.dom instanceof RenderGroup) {
        for (let i = 0; i < childrensLocal.length; i += 1) {
            childrensLocal[i].dom.parent = self;
            childrensLocal[i].setVDomIndex(self.vDomIndex);
            self.children[self.children.length] = childrensLocal[i];
        }
    } else {
        console.error("Trying to insert child to nonGroup Element");
    }
    this.BBoxUpdate = true;
    queueInstance$1.vDomChanged(this.vDomIndex);
    return self;
};
CanvasNodeExe$1.prototype.setVDomIndex = function (vDomIndex) {
    this.vDomIndex = vDomIndex;
    for (let i = 0, len = this.children.length; i < len; i += 1) {
        if (this.children[i] && this.children[i].setVDomIndex) {
            this.children[i].setVDomIndex(vDomIndex);
        }
    }
};
CanvasNodeExe$1.prototype.updateBBox = function CupdateBBox() {
    let status;
    if (this.bbox || this.ctx.type_ === "pdf") {
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
CanvasNodeExe$1.prototype.updateABBox = function updateABBox(transform = { translate: [0, 0] }) {
    const localTransform = this.attr.transform || { translate: [0, 0] };
    const abTransform = {
        translate: [
            transform.translate[0] + localTransform.translate[0],
            transform.translate[1] + localTransform.translate[1],
        ],
    };
    this.dom.abTransform = abTransform;
    if (this.dom instanceof RenderGroup) {
        for (let i = 0, len = this.children.length; i < len && this.children[i]; i += 1) {
            this.children[i].updateABBox(abTransform);
        }
    }
};
CanvasNodeExe$1.prototype.in = function Cinfun(co) {
    return this.dom.in(co);
};
CanvasNodeExe$1.prototype.on = function Con(eventType, hndlr) {
    const self = this;
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
                hndlr.constructor === zoomInstance$1.constructor ||
                hndlr.constructor === dragInstance$1.constructor
            ) {
                hndlr.bindMethods(this);
            }
        }
    }
    return this;
};
CanvasNodeExe$1.prototype.animatePathTo = path.animatePathTo;
CanvasNodeExe$1.prototype.morphTo = path.morphTo;
CanvasNodeExe$1.prototype.vDomIndex = null;
CanvasNodeExe$1.prototype.createRadialGradient = createRadialGradient$1;
CanvasNodeExe$1.prototype.createLinearGradient = createLinearGradient$1;
CanvasNodeExe$1.prototype.createEls = function CcreateEls(data, config) {
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
    queueInstance$1.vDomChanged(this.vDomIndex);
    return e;
};
CanvasNodeExe$1.prototype.text = function Ctext(value) {
    if (this.dom instanceof RenderText) {
        this.dom.text(value);
    }
    queueInstance$1.vDomChanged(this.vDomIndex);
    return this;
};
CanvasNodeExe$1.prototype.createEl = function CcreateEl(config) {
    const e = new CanvasNodeExe$1(this.dom.ctx, config, domId$1(), this.vDomIndex);
    this.child([e]);
    queueInstance$1.vDomChanged(this.vDomIndex);
    return e;
};
CanvasNodeExe$1.prototype.removeChild = function CremoveChild(obj) {
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
    queueInstance$1.vDomChanged(this.vDomIndex);
};
CanvasNodeExe$1.prototype.getBBox = function () {
    return {
        x: this.dom.BBox.x,
        y: this.dom.BBox.y,
        width: this.dom.BBox.width,
        height: this.dom.BBox.height,
    };
};
CanvasNodeExe$1.prototype.getPixels = function () {
    const imageData = this.ctx.getImageData(
        this.dom.BBox.x,
        this.dom.BBox.y,
        this.dom.BBox.width,
        this.dom.BBox.height
    );
    const pixelInstance = new PixelObject(imageData, this.dom.BBox.width, this.dom.BBox.height);
    return pixelInstance;
};
CanvasNodeExe$1.prototype.putPixels = function (pixels) {
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
    queueInstance$1.vDomChanged(self.nodeExe.vDomIndex);
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
    self.nodeName = "Sprite";
    self.nodeExe = nodeExe;
    for (const key in self.attr) {
        self.setAttr(key, self.attr[key]);
    }
    queueInstance$1.vDomChanged(nodeExe.vDomIndex);
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
        } else if (value instanceof CanvasNodeExe$1 || value instanceof RenderTexture) {
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
    const root = new CanvasNodeExe$1(
        ctx,
        {
            el: "g",
            attr: {
                id: "rootNode",
            },
        },
        domId$1(),
        vDomIndex
    );
    root.setStyle = function (prop, value) {
        this.domEl.style[prop] = value;
    };
    root.addDependentLayer = function (layer) {
        if (!(layer instanceof CanvasNodeExe$1)) {
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
    root.setViewBox = function () {};
    root.setContext = function (prop, value) {
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
        queueInstance$1.vDomChanged(this.vDomIndex);
    };
    root.update = function executeUpdate() {
        this.execute();
    };
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
        leafNodes = leafNodes.sort((a, b) => {
            const aTrans = a.dom && a.dom.abTransform ? a.dom.abTransform : { translate: [0, 0] };
            const aBox = a.dom.BBox;
            const bTrans = b.dom && b.dom.abTransform ? b.dom.abTransform : { translate: [0, 0] };
            const bBox = b.dom.BBox;
            return (
                aTrans.translate[1] +
                aBox.height +
                a.dom.abYposition -
                (bTrans.translate[1] + bBox.height + b.dom.abYposition)
            );
        });
        let runningY = 0;
        const pageRage = doc.bufferedPageRange();
        let pageNumber = pageRage.count - 1;
        leafNodes.forEach((node) => {
            const abTransform = node.dom.abTransform;
            const elHight = node.dom.BBox.height || 0;
            const elY = node.dom.abYposition || 0;
            let posY = (abTransform.translate[1] + elY || 0) - runningY;
            if (
                !(
                    (posY < pageHeight - bottom - top &&
                        posY + elHight < pageHeight - bottom - top) ||
                    elHight > pageHeight - bottom - top
                )
            ) {
                runningY += pageHeight - top - bottom;
                posY = (abTransform.translate[1] + elY || 0) - runningY;
                runningY += posY;
                posY = 0;
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
            node.dom.abTransform = {
                translate: [abTransform.translate[0], posY + top],
            };
            const executePdf = node.executePdf.bind(node);
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
        updateABBoxOfPdfTemplate(this.pageTemplate);
    };
    root.createTexture = function (config = {}) {
        return new RenderTexture(this, config);
    };
    root.createAsyncTexture = function (config) {
        return new Promise((resolve) => {
            const textureInstance = new RenderTexture(this, config);
            textureInstance.onLoad(function () {
                resolve(textureInstance);
            });
        });
    };
    return root;
}
function getAllLeafs(node) {
    const leaves = [];
    let queue = [node];
    while (queue.length !== 0) {
        const node = queue.shift();
        if (
            node.block ||
            (node.children &&
                node.children.length === 0 &&
                node.nodeName !== "g" &&
                node.nodeName !== "group")
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
function updateABBoxOfPdfTemplate(root) {
    const leafNodes = getAllLeafs(root);
    leafNodes.forEach((node) => {
        const abTransform = node.dom.abTransform;
        const elY = node.dom.abYposition || 0;
        const posY = abTransform.translate[1] + elY || 0;
        node.dom.abTransform = {
            translate: [abTransform.translate[0], posY],
        };
    });
}
function canvasLayer$1(container, contextConfig = {}, layerSettings = {}) {
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
    let ratio = getPixlRatio$1(ctx);
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
            vDomIndex = queueInstance$1.addVdom(vDomInstance);
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
    root.exportPdf = async function (callback, options = {}) {
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
                if (pdfSupportedFontFamily.indexOf(key) === -1) pdfSupportedFontFamily.push(key);
                const font = await fetch(fontRegister[key]);
                const fontBuffer = await font.arrayBuffer();
                doc.registerFont(key, fontBuffer);
            }
        }
        if (pdfInfo) {
            doc.info.Title = pdfInfo.title || "";
            doc.info.Author = pdfInfo.author || "";
            doc.info.Subject = pdfInfo.subject || "";
            doc.info.Keywords = pdfInfo.keywords || "";
            doc.info.CreationDate = pdfInfo.creationDate || new Date();
        }
        root.updateBBox();
        root.updateABBox();
        doc.addPage();
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
        queueInstance$1.removeVdom(vDomIndex);
        layerResizeUnBind(root, resize);
    };
    if (enableEvents) {
        const eventsInstance = new Events(root);
        layer.addEventListener("mousemove", (e) => {
            e.preventDefault();
            eventsInstance.mousemoveCheck(e);
        });
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
    queueInstance$1.execute();
    if (enableResize && root.container) {
        layerResizeBind(root, resize);
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
function pdfLayer$1(container, config = {}, layerSettings = {}) {
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
    let onUpdateExe = onUpdate;
    let vDomIndex = 999999;
    let pageDefaultTemplate = null;
    ctx.type_ = "pdf";
    ctx.doc = new PDFDocument({
        size: [width, height],
        ...pdfConfig,
    });
    ctx.doc.addPage();
    layer.setAttribute("height", height * 1);
    layer.setAttribute("width", width * 1);
    const vDomInstance = new VDom();
    if (autoUpdate) {
        vDomIndex = queueInstance$1.addVdom(vDomInstance);
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
            onUpdateExe ||
                function (url) {
                    res.setAttribute("src", url);
                },
            pdfConfig
        );
    };
    PDFCreator.prototype.onChange = function (exec) {
        onUpdateExe = exec;
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
    PDFCreator.prototype.exportPdf = async function (callback, pdfConfig = {}) {
        const doc = new PDFDocument({
            ...pdfConfig,
        });
        const stream_ = doc.pipe(blobStream());
        if (fontRegister) {
            for (const key in fontRegister) {
                if (pdfSupportedFontFamily.indexOf(key) === -1) pdfSupportedFontFamily.push(key);
                const font = await fetch(fontRegister[key]);
                const fontBuffer = await font.arrayBuffer();
                doc.registerFont(key, fontBuffer);
            }
        }
        if (pdfInfo) {
            doc.info.Title = pdfInfo.title || "";
            doc.info.Author = pdfInfo.author || "";
            doc.info.Subject = pdfInfo.subject || "";
            doc.info.Keywords = pdfInfo.keywords || "";
            doc.info.CreationDate = pdfInfo.creationDate || new Date();
        }
        this.doc = doc;
        this.pages.forEach(function (page) {
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
var canvasAPI = {
    canvasLayer: canvasLayer$1,
    pdfLayer: pdfLayer$1,
    CanvasNodeExe: CanvasNodeExe$1,
    CanvasGradient: CanvasGradient$1,
    createRadialGradient: createRadialGradient$1,
    createLinearGradient: createLinearGradient$1,
};

function shaders(el) {
    let res;
    switch (el) {
        case "point":
            res = {
                vertexShader: `#version 300 es
                    precision highp float;
                    in vec2 a_position;
                    in vec4 a_color;
                    in float a_size;
                    in mat3 a_transformMatrix;
                    out vec4 v_color;
                    void main() {
                      gl_Position = vec4(a_transformMatrix * vec3(a_position, 1), 1);
                      gl_PointSize = a_size;
                      v_color = a_color;
                    }
                    `,
                fragmentShader: `#version 300 es
                    precision mediump float;
                    in vec4 v_color;
                    out vec4 fragColor;
                    void main() {
                        fragColor = v_color;
                    }
                    `,
            };
            break;
        case "circle":
            res = {
                vertexShader: `#version 300 es
                    precision highp float;
                    in vec2 a_position;
                    in vec4 a_color;
                    in float a_radius;
                    in mat3 a_transformMatrix;
                    out vec4 v_color;

                    void main() {
                      gl_Position = vec4(a_transformMatrix * vec3(a_position, 1), 1);
                      gl_PointSize = a_radius; // * a_transform.z * u_transform.z;
                      v_color = a_color;
                    }
                    `,
                fragmentShader: `#version 300 es
                    precision mediump float;
                    in vec4 v_color;
                    out vec4 fragColor;
                    void main() {
                      float r = 0.0, delta = 0.0, alpha = 1.0;
                      vec2 cxy = 2.0 * gl_PointCoord - 1.0;
                      r = dot(cxy, cxy);
                      if(r > 1.0) {
                        discard;
                      }
                      delta = 0.09;
                      alpha = 1.0 - smoothstep(1.0 - delta, 1.0 + delta, r);
                      fragColor = v_color * alpha;
                    }
                    `,
            };
            break;
        case "image":
            res = {
                vertexShader: `#version 300 es
                    precision highp float;
                    in vec2 a_position;
                    in vec2 a_texCoord;
                    uniform mat3 u_transformMatrix;
                    out vec2 v_texCoord;

                    void main() {
                      gl_Position = vec4(u_transformMatrix * vec3(a_position, 1), 1);
                      v_texCoord = a_texCoord;
                    }
          `,
                fragmentShader: `#version 300 es
                    precision mediump float;
                    uniform sampler2D u_image;
                    uniform float u_opacity;
                    in vec2 v_texCoord;
                    out vec4 fragColor;
                    void main() {
                      vec4 col = texture(u_image, v_texCoord);
                      if (col.a == 0.0) {
                        discard;
                      } else {
                        fragColor = col;
                        fragColor.a *= u_opacity;
                      }
                    }
                    `,
            };
            break;
        case "polyline":
        case "polygon":
            res = {
                vertexShader: `#version 300 es
                    precision highp float;
                    in vec2 a_position;
                    uniform mat3 u_transformMatrix;

                    void main() {
                      gl_Position = vec4(u_transformMatrix * vec3(a_position, 1), 1);
                    }
                    `,
                fragmentShader: `#version 300 es
                    precision mediump float;
                    uniform vec4 u_color;
                    out vec4 fragColor;
                    void main() {
                        fragColor = u_color;
                    }
                    `,
            };
            break;
        case "rect":
            res = {
                vertexShader: `#version 300 es
                    precision highp float;
                    in vec2 a_position;
                    in vec4 a_color;
                    in mat3 a_transformMatrix;
                    out vec4 v_color;

                    void main() {
                      gl_Position = vec4(a_transformMatrix * vec3(a_position, 1), 1);
                      v_color = a_color;
                    }
                    `,
                fragmentShader: `#version 300 es
                    precision mediump float;
                    in vec4 v_color;
                    out vec4 fragColor;
                    void main() {
                      fragColor = v_color;
                    }
                    `,
            };
            break;
        case "line":
            res = {
                vertexShader: `#version 300 es
                    precision highp float;
                    in vec2 a_position;
                    in vec4 a_color;
                    in mat3 a_transformMatrix;
                    out vec4 v_color;

                    void main() {
                      gl_Position = vec4(a_transformMatrix * vec3(a_position, 1), 1);
                      v_color = a_color;
                    }
                    `,
                fragmentShader: `#version 300 es
                    precision mediump float;
                    in vec4 v_color;
                    out vec4 fragColor;
                    void main() {
                        fragColor = v_color;
                    }
                    `,
            };
            break;
        default:
            res = {
                vertexShader: `#version 300 es
                    precision highp float;
                    in vec2 a_position;
                    in vec4 a_color;
                    in mat3 a_transformMatrix;
                    out vec4 v_color;

                    void main() {
                      gl_Position = vec4(a_transformMatrix * vec3(a_position, 1), 1);
                      v_color = a_color;
                    }
                    `,
                fragmentShader: `#version 300 es
                    precision mediump float;
                    in vec4 v_color;
                    out vec4 fragColor;
                    void main() {
                      fragColor = v_color;
                    }
                    `,
            };
    }
    return res;
}

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
    } else if (prop === "size") {
        this.shader.updateSize(this.pindex, this.attr.size || 0);
    } else if (prop === "transform") {
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
    } else if (key === "transform") {
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
};
PathNode.prototype.setAttr = function (key, value) {
    this.attr[key] = value;
    if (value === null) {
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
    } else if (key === "transform") {
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
    } else if (key === "transform") {
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
    this.projectionMatrix = m3.projection(
        this.ctx.canvas.width / ratio,
        this.ctx.canvas.height / ratio
    );
    this.transformMatrix = m3.multiply(this.projectionMatrix, m3.identity());
    if (this.attr.transform) {
        this.exec(updateTransformMatrix, null);
    }
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
    if (value === null && this.attr[key] !== null) {
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
    } else if (this.shader && key === "transform") {
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
    if (value === null) {
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
    } else if (key === "transform") {
        this.exec(updateTransformMatrix, this.p_matrix);
    }
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
    if (value === null) {
        delete this.attr[prop];
        return;
    }
    if (prop === "transform") {
        this.exec(updateTransformMatrix, this.p_matrix);
    }
    if ((prop === "cx" || prop === "cy") && this.shader) {
        this.shader.updateVertex(this.pindex, this.attr.cx, this.attr.cy);
    } else if (prop === "r" && this.shader) {
        this.shader.updateSize(this.pindex, this.attr.r || 0);
    } else if (prop === "transform" && this.shader) {
        this.shader.updateTransform(this.pindex, this.transformMatrix);
    }
};
CircleNode.prototype.in = function RCinfun(co) {
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
    }
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
};
TextNode.prototype.setAttr = function (key, value) {
    this.attr[key] = value;
    if (value === null) {
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
    } else if (key === "x" || key === "y") {
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
};
TextNode.prototype.applyTransformationMatrix = function (matrix) {
    this.p_matrix = matrix;
    this.exec(updateTransformMatrix, matrix);
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
};
ImageNode.prototype.applyTransformationMatrix = function (matrix) {
    this.p_matrix = matrix;
    this.exec(updateTransformMatrix, matrix);
};
ImageNode.prototype.setAttr = function (key, value) {
    this.attr[key] = value;
    if (value === null) {
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
    } else if (key === "x" || key === "width" || key === "y" || key === "height") {
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
    } else if (key === "transform") {
        this.exec(updateTransformMatrix, this.p_matrix);
    }
};
ImageNode.prototype.setStyle = function (key, value) {
    if (value) {
        this.style[key] = value;
    } else if (this.style[key]) {
        delete this.style[key];
    }
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
const defaultColor = colorMap$1.rgba(0, 0, 0, 255);
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
    this.vao = ctx.createVertexArray();
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
        this.applyAttributeToVao(attr, this.attrObjs[attr]);
    }
    if (this.indexes) {
        this.indexesObj = webGlIndexMapper(ctx, this.program, this.indexes);
    }
}
RenderWebglShader.prototype = new ShaderNodePrototype();
RenderWebglShader.prototype.constructor = RenderWebglShader;
RenderWebglShader.prototype.applyAttributeToVao = function (attr, d) {
    this.ctx.bindVertexArray(this.vao);
    if (attr === "a_transformMatrix") {
        this.ctx.enableVertexAttribArray(d.attributeLocation + 0);
        this.ctx.enableVertexAttribArray(d.attributeLocation + 1);
        this.ctx.enableVertexAttribArray(d.attributeLocation + 2);
        this.ctx.bindBuffer(d.bufferType, d.buffer);
        this.ctx.bufferData(d.bufferType, d.value, d.drawType);
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
        this.ctx.bufferData(d.bufferType, d.value, d.drawType);
        this.ctx.vertexAttribPointer(d.attributeLocation, d.size, d.valueType, false, 0, 0);
    }
};
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
RenderWebglShader.prototype.updateBBox = function () {
    return true;
};
RenderWebglShader.prototype.execute = function () {
    this.ctx.useProgram(this.program);
    this.applyUniforms();
    this.ctx.bindVertexArray(this.vao);
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
    this.ctx.bindVertexArray(null);
};
RenderWebglShader.prototype.addUniform = function (key, value) {
    this.uniforms[key] = webGlUniformMapper(this.ctx, this.program, key, value);
    queueInstance.vDomChanged(this.vDomIndex);
};
RenderWebglShader.prototype.addAttribute = function (key, obj) {
    this.attributes[key] = obj;
    this.attrObjs[key] = webGlAttrMapper(this.ctx, this.program, key, obj);
    this.applyAttributeToVao(key, this.attrObjs[key]);
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
    fill = colorMap$1.colorToRGB(fill);
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
RenderWebglPoints.prototype.execute = function () {
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
    this.geometry = new MeshGeometry();
    this.geometry.setAttr("a_transformMatrix", {
        value: new Float32Array([]),
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
RenderWebglRects.prototype.execute = function () {
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
RenderWebglLines.prototype.execute = function () {
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
        this.shaderInstance.setUniformData("u_transformMatrix", stack[i].dom.transformMatrix);
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
        this.shaderInstance.setUniformData("u_transformMatrix", stack[i].dom.transformMatrix);
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
            uniforms: {},
            geometry: this.geometry,
        },
        vDomIndex
    );
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
RenderWebglCircles.prototype.execute = function () {
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
            fragmentShader: shaders("image").fragmentShader.trim(),
            vertexShader: shaders("image").vertexShader.trim(),
            uniforms: {
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
            e = new RenderWebglPoints(ctx, attr, style, renderTarget);
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
WebglNodeExe.prototype.reIndexChildren = function (shader) {
    const childParent = shader || this;
    let children = childParent.children;
    children = children.filter(function (d) {
        return d;
    });
    for (var i = 0, len = children.length; i < len; i++) {
        children[i].dom.pindex = i;
    }
    childParent.children = children;
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
        if (value === null && this.attr[attr] !== null) {
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
            if (attr[key] === null && this.attr[attr] !== null) {
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
        if (value === null && this.style[attr] != null) {
            delete this.style[attr];
        } else {
            if (attr === "fill" || attr === "stroke") {
                value = colorMap$1.colorToRGB(value);
            }
            this.style[attr] = value;
        }
        this.dom.setStyle(attr, value);
    } else if (arguments.length === 1 && typeof attr === "object") {
        for (const key in attr) {
            value = attr[key];
            if (value === null && this.style[key] != null) {
                delete this.style[key];
            } else {
                if (key === "fill" || key === "stroke") {
                    value = colorMap$1.colorToRGB(value);
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
    if (!this.events) {
        this.events = {};
    }
    if (hndlr === null && this.events[eventType] !== null) {
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
    if (!this.dom.shader && !this.dom.shaderGroup && this.dom instanceof WebglGroupNode) {
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
    } else if (this.dom.shaderGroup && this.dom instanceof WebglGroupNode) {
        if (this.exeCtx) {
            this.exeCtx(this.ctx);
        }
        for (const key in this.dom.shaderGroup) {
            const shad = this.dom.shaderGroup[key];
            if (shad.reindex) {
                this.reIndexChildren(shad);
                shad.reindex = false;
            }
            shad.shader.execute(shad.children);
        }
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
            node.vDomIndex = self.vDomIndex;
            if (!(node instanceof RenderWebglShader) && !(node.dom instanceof WebglGroupNode)) {
                if (this.dom.shader) {
                    if (node.el === this.dom.shader.attr.shaderType) {
                        node.dom.setShader(this.dom.shader);
                    } else {
                        console.warn(
                            "wrong el type '" +
                                node.el +
                                "' being added to shader group - '" +
                                this.dom.shader.attr.shaderType +
                                "'"
                        );
                        self.children.pop();
                    }
                } else {
                    if (!this.dom.shaderGroup) {
                        this.dom.shaderGroup = {};
                    }
                    if (!this.dom.shaderGroup[node.el]) {
                        this.dom.shaderGroup[node.el] = {
                            children: [],
                            shader: getTypeShader(
                                self.ctx,
                                self.attr,
                                self.style,
                                node.el,
                                self.renderTarget,
                                self.vDomIndex
                            ),
                        };
                    }
                    this.dom.shaderGroup[node.el].children[
                        this.dom.shaderGroup[node.el].children.length
                    ] = node;
                    node.dom.pindex = this.dom.shaderGroup[node.el].children.length - 1;
                    node.dom.setShader(this.dom.shaderGroup[node.el].shader);
                }
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
        } else if (this.dom.parent.dom.shaderGroup) {
            const shaderEl = this.dom.parent.dom.shaderGroup[this.el];
            if (shaderEl) {
                const localIndex = shaderEl.children.indexOf(this);
                shaderEl.reindex = true;
                if (shaderEl.shader.indexBased) {
                    shaderEl.shader.clear(this.dom.pindex);
                    this.dom.parent.setReIndex();
                }
                shaderEl.children[localIndex] = undefined;
            }
            children[index] = undefined;
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
    const res =
        container instanceof HTMLElement
            ? container
            : typeof container === "string" || container instanceof String
            ? document.querySelector(container)
            : null;
    let height = res ? res.clientHeight : 0;
    let width = res ? res.clientWidth : 0;
    let clearColor = colorMap$1.rgba(0, 0, 0, 0);
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
    const ctx = layer.getContext("webgl2", contextConfig);
    const actualPixel = getPixlRatio(ctx);
    ratio = actualPixel >= 2 ? 2 : Math.floor(actualPixel);
    layer.setAttribute("height", height * ratio);
    layer.setAttribute("width", width * ratio);
    layer.style.height = `${height}px`;
    layer.style.width = `${width}px`;
    layer.style.position = "absolute";
    let vDomInstance;
    let vDomIndex = 999999;
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
        if (
            (container instanceof HTMLElement && !document.body.contains(container)) ||
            (container instanceof String && !document.querySelector(container))
        ) {
            layerResizeUnBind(root);
            root.destroy();
            return;
        }
        height = cr.height;
        width = cr.width;
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
        layer.style.height = height + "px";
        layer.style.width = width + "px";
    };
    root.onResize = function (exec) {
        resizeCall = exec;
    };
    root.destroy = function () {
        const res = document.body.contains(this.container);
        if (res && this.container.contains(this.domEl)) {
            this.container.removeChild(this.domEl);
        }
        queueInstance.removeVdom(vDomIndex);
        layerResizeUnBind(root, resize);
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
    root.setViewBox = function () {};
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
    this.warpS = config.warpS ? config.warpS : "CLAMP_TO_EDGE";
    this.warpT = config.warpT ? config.warpT : "CLAMP_TO_EDGE";
    this.magFilter = config.magFilter ? config.magFilter : "LINEAR";
    this.minFilter = config.minFilter ? config.minFilter : "LINEAR";
    this.mipMap = config.mipMap;
    this.updated = false;
    this.image = null;
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
TextureObject.prototype.clear = function () {};
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
function MeshGeometry() {
    this.attributes = {};
    this.drawType = "TRIANGLES";
    this.indexes = null;
    this.drawRange = [0, 0];
}
MeshGeometry.prototype = new WebGLGeometry();
MeshGeometry.constructor = MeshGeometry;
function PointsGeometry() {
    this.attributes = {};
    this.drawType = "POINTS";
    this.indexes = null;
    this.drawRange = [0, 0];
}
PointsGeometry.prototype = new WebGLGeometry();
PointsGeometry.constructor = PointsGeometry;
function LineGeometry() {
    this.attributes = {};
    this.drawType = "LINES";
    this.indexes = null;
    this.drawRange = [0, 0];
}
LineGeometry.prototype = new WebGLGeometry();
LineGeometry.constructor = LineGeometry;

var utilities = {
    blur: function (radius = 1) {
        function blurExec(imageData) {
            return imageDataRGBA(imageData, 0, 0, imageData.width, imageData.height, radius);
        }
        return blurExec;
    },
    greyScale: function (greyScaleType) {
        let exe = null;
        switch (greyScaleType) {
            case "grey-1":
                exe = function (imgData) {
                    const pixels = imgData.data;
                    let lightness;
                    for (let i = 0, len = pixels.length; i < len; i += 4) {
                        lightness = parseInt(
                            pixels[i] * 0.299 + pixels[i + 1] * 0.587 + pixels[i + 2] * 0.114
                        );
                        imgData.data[i] = lightness;
                        imgData.data[i + 1] = lightness;
                        imgData.data[i + 2] = lightness;
                    }
                    return imgData;
                };
                break;
            case "grey-2":
                exe = function (imgData) {
                    const pixels = imgData.data;
                    let lightness;
                    for (let i = 0, len = pixels.length; i < len; i += 4) {
                        lightness = parseInt(
                            (3 * pixels[i] + 4 * pixels[i + 1] + pixels[i + 2]) >>> 3
                        );
                        imgData.data[i] = lightness;
                        imgData.data[i + 1] = lightness;
                        imgData.data[i + 2] = lightness;
                    }
                    return imgData;
                };
                break;
            case "grey-3":
            default:
                exe = function (imgData) {
                    const pixels = imgData.data;
                    let lightness;
                    for (let i = 0, len = pixels.length; i < len; i += 4) {
                        lightness = parseInt(
                            0.2126 * pixels[i] + 0.715 * pixels[i + 1] + 0.0722 * pixels[i + 2]
                        );
                        imgData.data[i] = lightness;
                        imgData.data[i + 1] = lightness;
                        imgData.data[i + 2] = lightness;
                    }
                    return imgData;
                };
                break;
        }
        return exe;
    },
};

const pathIns = path.instance;
const canvasLayer = canvasAPI.canvasLayer;
const pdfLayer = canvasAPI.pdfLayer;
const CanvasNodeExe = canvasAPI.CanvasNodeExe;
const CanvasGradient = canvasAPI.CanvasGradient;
const createRadialGradient = canvasAPI.createRadialGradient;
const createLinearGradient = canvasAPI.createLinearGradient;

export { CanvasGradient, CanvasNodeExe, pathIns as Path, behaviour, canvasLayer, chain, colorMap$1 as color, createLinearGradient, createRadialGradient, fetchTransitionType as ease, geometry, pdfLayer, queue, svgLayer, utilities as utility, webglLayer };
