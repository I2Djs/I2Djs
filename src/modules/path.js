 
// import { geometry, queue, ease, chain } from './'
import geometry from "./geometry.js";
import queue from "./queue.js";
import ease from "./ease.js";
import chain from "./chain.js";
import { interpolate } from "flubber";
import colorMap from "./colorMap.js";
// import createBezierBuilder from "adaptive-bezier-curve";
// import createQuadraticBuilder from "adaptive-quadratic-curve";


let morphIdentifier = 0;
const t2DGeometry = geometry;
const queueInstance = queue;
const easying = ease;

function animeId() {
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
    const updateBounds = (point) => {
        minMax.minX = Math.min(minMax.minX, point.x);
        minMax.maxX = Math.max(minMax.maxX, point.x);
        minMax.minY = Math.min(minMax.minY, point.y);
        minMax.maxY = Math.max(minMax.maxY, point.y);
    };


    if (["V", "H", "L", "v", "h", "l"].includes(d.type)) {
        [d.p0 || pd.p1, d.p1].forEach(updateBounds);
    } else if (["Q", "C", "q", "c"].includes(d.type)) {
        const co = t2DGeometry.cubicBezierCoefficients(d);
        const exe = t2DGeometry.cubicBezierTransition.bind(null, d.p0, co);

        for (let ii = 0; ii <= 1; ii += 0.05) {
            updateBounds(exe(ii));
        }
    } else {
        updateBounds(d.p0);
    }

    Object.assign(bbox, {
        x: minMax.minX,
        y: minMax.minY,
        width: minMax.maxX - minMax.minX,
        height: minMax.maxY - minMax.minY,
    });
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
    this.segmentLength = t2DGeometry.getDistance(this.pp, this.cp);
    this.stack.push({
        type: "V",
        p0: this.pp,
        p1: this.cp,
        length: this.segmentLength,

        pointAt(f) {
            return t2DGeometry.linearTransitionBetweenPoints(this.p0, this.p1, f);
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
    this.segmentLength = t2DGeometry.getDistance(this.pp, this.cp);
    this.stack.push({
        type: rel ? "L" : "l",
        p0: this.pp,
        p1: this.cp,
        relative: {
            p1: p1,
        },
        length: this.segmentLength,

        pointAt(f) {
            return t2DGeometry.linearTransitionBetweenPoints(this.p0, this.p1, f);
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
    this.segmentLength = t2DGeometry.getDistance(this.pp, this.cp);
    this.stack.push({
        type: rel ? "H" : "h",
        p0: this.pp,
        p1: this.cp,
        length: this.segmentLength,
        relative: {
            p1: p1,
        },
        pointAt(f) {
            return t2DGeometry.linearTransitionBetweenPoints(this.p0, this.p1, f);
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
    this.segmentLength = t2DGeometry.getDistance(this.pp, this.cp);
    this.stack.push({
        p0: this.pp,
        p1: this.cp,
        type: "Z",
        length: this.segmentLength,
        pointAt(f) {
            return t2DGeometry.linearTransitionBetweenPoints(this.p0, this.p1, f);
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
    this.segmentLength = t2DGeometry.bezierLength(this.pp, cntrl1, this.cp);
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
            return t2DGeometry.bezierTransition(this.p0, this.cntrl1, this.p1, f);
        },

        // getPoints() {
        //     return createQuadraticBuilder([this.p0.x, this.p0.y], [this.cntrl1.x, this.cntrl1.y], [this.p1.x, this.p1.y]);
        // }
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
    const co = t2DGeometry.cubicBezierCoefficients({
        p0: this.pp,
        cntrl1,
        cntrl2,
        p1: endPoint,
    });
    this.cntrl = cntrl2;
    this.cp = endPoint;
    this.segmentLength = t2DGeometry.cubicBezierLength(this.pp, co);
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
            return t2DGeometry.cubicBezierTransition(this.p0, this.co, f);
        },
        // getPoints() {
        //     return createBezierBuilder([this.p0.x, this.p0.y], [this.cntrl1.x, this.cntrl1.y], [this.cntrl2.x, this.cntrl2.y], [this.p1.x, this.p1.y]);
        // }
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
    const co = t2DGeometry.cubicBezierCoefficients({
        p0: this.pp,
        cntrl1,
        cntrl2,
        p1: endPoint,
    });
    this.segmentLength = t2DGeometry.cubicBezierLength(this.pp, co);
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
            return t2DGeometry.cubicBezierTransition(this.p0, this.co, f);
        },
        // getPoints() {
        //     return createBezierBuilder([this.p0.x, this.p0.y], [this.cntrl1.x, this.cntrl1.y], [this.cntrl2.x, this.cntrl2.y], [this.p1.x, this.p1.y]);
        // }
    }); // this.stack.segmentLength += this.segmentLength
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
    const arcToQuad = t2DGeometry.arcToBezier({
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
        const segmentLength = t2DGeometry.cubicBezierLength(
            pp,
            t2DGeometry.cubicBezierCoefficients({
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
                return t2DGeometry.bezierTransition(this.p0, this.cntrl1, this.cntrl2, this.p1, f);
            },
            // getPoints() {
            //     return createQuadraticBuilder([this.p0.x, this.p0.y], [this.cntrl1.x, this.cntrl1.y], [this.p1.x, this.p1.y]);
            // }
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

    let m = 0;
    let dx1 = 0;
    let dy1 = 0;
    let dx2 = 0;
    let dy2 = 0;

    let preP = points[0];

    for (let i = 1; i < points.length; i++) {
        const curP = points[i];
        const nexP = points[i + 1];
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

    // this.BBox = getBBox(this.stackGroup);

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
        default:
            break;
        }
    }
    if (!clippath) {
        ctx.closePath();
    }
};

// Path.prototype.getPoints = function () {
//     const points = [];
//     // let tLength = this.length;
//     // let currD = this.stack[0];
//     // let cumLength = 0;
//     // let iLenFact = 0;
//     let d;

//     for (let i = 0; i < this.stack.length; i++) {
//         d = this.stack[i];
//         let xypoints;
//         // const f = 0.05;
//         // let tf = 0;
//         switch (d.type) {
//             case "M":
//             case "m":
//                 points.push([d.p0.x, d.p0.y]);
//                 // points[points.length] = d.p0.x;
//                 // points[points.length] = d.p0.y;
//                 break;
//             case "Z":
//             case "z":
//                 points.push([d.p1.x, d.p1.y]);
//                 // points[points.length] = d.p1.x;
//                 // points[points.length] = d.p1.y;
//                 break;
//             case "L":
//             case "l":
//             case "V":
//             case "v":
//             case "H":
//             case "h":
//                 points.push([d.p1.x, d.p1.y]);
//                 // points[points.length] = d.p1.x;
//                 // points[points.length] = d.p1.y;
//                 break;
//             case "C":
//             case "c":
//             case "S":
//             case "s":
//             case "Q":
//             case "q":
//                 xypoints = d.getPoints();
//                 for(let i =0; i < xypoints.length; i++) {
//                     points[points.length] = xypoints[i];
//                     // points[points.length] = xypoints[i][1];
//                 }
//                 // while (tf <= 1.0) {
//                 //     const xy = d.pointAt(tf);
//                 //     points[points.length] = xy.x;
//                 //     points[points.length] = xy.y;
//                 //     tf += f;
//                 // }
//                 break;
//             default:
//                 break;
//         }
//     }
//     return points;
// };

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

    default:
        break;
    }
};

Path.prototype.getPath2DObject = function (pathStr) {
    return new Path2D(pathStr || this.fetchPathString());
};

Path.prototype.getPathTexture = function (style = {}, refresh) {
    if (!this.layer) {
        this.layer = document.createElement("canvas");
        this.ctx = this.layer.getContext("2d");
        refresh = true;
    }

    if(refresh) {
        let lineWidth = (style["lineWidth"] || 1) * 2;
        const {x = 0, y= 0, height = 0, width = 0} = this.BBox;

        this.pathNode = this.getPath2DObject();
        this.layer.setAttribute("height", height + lineWidth * 2);
        this.layer.setAttribute("width", width + lineWidth * 2);

        this.ctx.clearRect(0, 0, width + lineWidth * 2, height + lineWidth * 2);

        this.ctx.save();
        
        this.ctx.translate((x * -1 + lineWidth) || 0, (y * -1 + lineWidth) || 0);

        for(let key in style) {
            let value = style[key];
            if (key === "fillStyle" || key === "strokeStyle") {
                this.ctx[key] = colorMap.RGBAInstanceCheck(value) ? value.rgba : value;
            } else {
                if (typeof this.ctx[key] !== "function") {
                    this.ctx[key] = value;
                } else if (typeof this.ctx[key] === "function") {
                    this.ctx[key](value);
                }
            }
        }

        if (style["fillStyle"]) {
            this.ctx.fill(this.pathNode);
        }
        if (style["strokeStyle"]) {
            this.ctx.stroke(this.pathNode);
        }

        this.ctx.restore();
    }

    return this.layer;
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
        x: co.ax * t2DGeometry.pow(f, 3) + co.bx * t2DGeometry.pow(f, 2) + co.cx * f + p0.x,
        y: co.ay * t2DGeometry.pow(f, 3) + co.by * t2DGeometry.pow(f, 2) + co.cy * f + p0.y,
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
    return t2DGeometry.cubicBezierTransition(this.p0, this.co, f);
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
    return t2DGeometry.bezierTransition(this.p0, this.cntrl1, this.p1, f);
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
    return t2DGeometry.linearTransitionBetweenPoints(this.p0, this.p1, f);
};

function AnimatePathTo(targetConfig, fromConfig) {
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
    const newPathInstance = CheckPathType(src) ? src : new Path(src);
    const arrExe = newPathInstance.stackGroup.reduce((p, c) => {
        p = p.concat(c);
        return p;
    }, []);
    const mappedArr = [];

    for (let i = 0; i < arrExe.length; i += 1) {
        if (arrExe[i].type === "Z" || arrExe[i].type === "z") {
            mappedArr.push({
                run(f) {
                    // newPathInstance.stack.splice(this.id, newPathInstance.stack.length - 1);
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
                    // newPathInstance.stack.splice(this.id, newPathInstance.stack.length - 1);
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
                    // newPathInstance.stack.splice(this.id, newPathInstance.stack.length - 1);
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
            const co = t2DGeometry.cubicBezierCoefficients(arrExe[i]);
            mappedArr.push({
                run(f) {
                    // newPathInstance.stack.splice(this.id, newPathInstance.stack.length - 1);
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
                    // newPathInstance.stack.splice(this.id, newPathInstance.stack.length - 1);
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
        }
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

function MorphTo(targetConfig) {
    const self = this;
    const { duration } = targetConfig;
    const { ease } = targetConfig;
    const loop = targetConfig.loop ? targetConfig.loop : 0;
    const direction = targetConfig.direction ? targetConfig.direction : "default";
    const destD = targetConfig.attr.d ? targetConfig.attr.d : self.attr.d;
    const srcPath = CheckPathType(self.attr.d) ? self.attr.d : new Path(self.attr.d);
    const destPath = CheckPathType(destD) ? destD : new Path(destD);

    const morphExe = interpolate(srcPath.fetchPathString(), destPath.fetchPathString(), {
        maxSegmentLength: 25,
    });

    queueInstance.add(
        animeId(),
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

function CheckPathType(pathInstance) {
    return pathInstance instanceof Path;
}

function CreatePath (d) {
    return new Path(d);
}

export { CreatePath };
export { CheckPathType };
export { AnimatePathTo };
export { MorphTo };
