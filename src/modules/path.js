/* eslint-disable no-undef */
// import { geometry, queue, ease, chain } from './'
import geometry from "./geometry.js";
import queue from "./queue.js";
import ease from "./ease.js";
import chain from "./chain.js";

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
        const co = t2DGeometry.cubicBezierCoefficients(d);
        const exe = t2DGeometry.cubicBezierTransition.bind(null, d.p0, co);
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

        pointAt(f) {
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
    this.stack.every((d, i) => {
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

Path.prototype.getPoints = function (factor = 0.01) {
    const points = [];
    // let tLength = this.length;
    // let currD = this.stack[0];
    // let cumLength = 0;
    // let iLenFact = 0;
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
            default:
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

        default:
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

const BezierTransition = function BezierTransition(type, p0, p1, p2, length, f) {
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
    length,
    f
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

function animatePathTo(targetConfig) {
    const self = this;
    const { duration, ease, end, loop, direction, d } = targetConfig;
    const src = d || self.attr.d;
    let totalLength = 0;
    self.arrayStack = [];

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
                    // newPathInstance.stack.splice(this.id, newPathInstance.stack.length - 1);
                    newPathInstance.stack.length = this.id + 1;
                    newPathInstance.stack[this.id] = this.render.execute(f);
                    self.setAttr("d", newPathInstance);
                },
                target: self,
                id: i,
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

                        pointAt(f) {
                            return this.p0;
                        },
                    };
                },
                target: self,
                id: i,
                length: 0,
            });
            totalLength += 0;
        } else {
            // console.log('M Or Other Type')
        }
    }

    mappedArr.forEach(function (d) {
        d.duration = (d.length / totalLength) * duration;
        // console.log(d.length, d.duration);
    });
    chainInstance
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
    let srcPath = isTypePath(self.attr.d)
        ? self.attr.d.stackGroup
        : new Path(self.attr.d).stackGroup;
    let destPath = isTypePath(destD) ? destD.stackGroup : new Path(destD).stackGroup;
    const chainInstance = [];
    self.arrayStack = [];

    if (srcPath.length > 1) {
        srcPath = srcPath.sort((aa, bb) => bb.segmentLength - aa.segmentLength);
    }

    if (destPath.length > 1) {
        destPath = destPath.sort((aa, bb) => bb.segmentLength - aa.segmentLength);
    }

    const maxGroupLength = srcPath.length > destPath.length ? srcPath.length : destPath.length;
    mapper(toCubicCurves(srcPath[0]), toCubicCurves(destPath[0]));

    for (let j = 1; j < maxGroupLength; j += 1) {
        if (srcPath[j]) {
            mapper(toCubicCurves(srcPath[j]), [
                {
                    type: "M",
                    p0: srcPath[j][0].p0,
                },
            ]);
        }

        if (destPath[j]) {
            mapper(
                [
                    {
                        type: "M",
                        p0: destPath[j][0].p0,
                    },
                ],
                toCubicCurves(destPath[j])
            );
        }
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
                // console.log('wrong cmd type')
            }
        }

        return mappedArr;
    }

    function buildMTransitionobj(src, dest) {
        chainInstance.push({
            run(path, f) {
                const point = this.pointTansition(f);
                path.m(true, {
                    x: point.x,
                    y: point.y,
                });
            },

            pointTansition: t2DGeometry.linearTransitionBetweenPoints.bind(null, src.p0, dest.p0),
        });
    }

    function buildTransitionObj(src, dest) {
        chainInstance.push({
            run(path, f) {
                const t = this;
                const c1 = t.ctrl1Transition(f);
                const c2 = t.ctrl2Transition(f);
                const p1 = t.destTransition(f);
                path.c(
                    true,
                    {
                        x: c1.x,
                        y: c1.y,
                    },
                    {
                        x: c2.x,
                        y: c2.y,
                    },
                    {
                        x: p1.x,
                        y: p1.y,
                    }
                );
            },

            srcTransition: t2DGeometry.linearTransitionBetweenPoints.bind(null, src.p0, dest.p0),
            ctrl1Transition: t2DGeometry.linearTransitionBetweenPoints.bind(
                null,
                src.cntrl1,
                dest.cntrl1
            ),
            ctrl2Transition: t2DGeometry.linearTransitionBetweenPoints.bind(
                null,
                src.cntrl2,
                dest.cntrl2
            ),
            destTransition: t2DGeometry.linearTransitionBetweenPoints.bind(null, src.p1, dest.p1),
        });
    }

    function normalizeCmds(cmd, n) {
        if (cmd.length === n) {
            return cmd;
        }

        const totalLength = cmd.reduce((pp, cc) => pp + cc.length, 0);
        const arr = [];

        for (let i = 0; i < cmd.length; i += 1) {
            const len = cmd[i].length;
            let counter = Math.floor((n / totalLength) * len);

            if (counter <= 1) {
                arr.push(cmd[i]);
            } else {
                let t = cmd[i];
                let split;

                while (counter > 1) {
                    const cmdX = t;
                    split = splitBezier(
                        [cmdX.p0, cmdX.cntrl1, cmdX.cntrl2, cmdX.p1].slice(0),
                        1 / counter
                    );
                    arr.push({
                        p0: cmdX.p0,
                        cntrl1: split.b1[0],
                        cntrl2: split.b1[1],
                        p1: split.b1[2],
                        type: "C",
                    });
                    t = {
                        p0: split.b1[2],
                        cntrl1: split.b2[0],
                        cntrl2: split.b2[1],
                        p1: split.b2[2],
                        type: "C",
                    };
                    counter -= 1;
                }

                arr.push(t);
            }
        }

        return arr;
    }

    function splitBezier(arr, perc) {
        const coll = [];
        const arrayLocal = arr;

        while (arrayLocal.length > 0) {
            for (let i = 0; i < arrayLocal.length - 1; i += 1) {
                coll.unshift(arrayLocal[i]);
                arrayLocal[i] = interpolate(arrayLocal[i], arrayLocal[i + 1], perc);
            }

            coll.unshift(arrayLocal.pop());
        }

        return {
            b1: [
                {
                    x: coll[5].x,
                    y: coll[5].y,
                },
                {
                    x: coll[2].x,
                    y: coll[2].y,
                },
                {
                    x: coll[0].x,
                    y: coll[0].y,
                },
            ],
            b2: [
                {
                    x: coll[1].x,
                    y: coll[1].y,
                },
                {
                    x: coll[3].x,
                    y: coll[3].y,
                },
                {
                    x: coll[6].x,
                    y: coll[6].y,
                },
            ],
        };
    }

    function interpolate(p0, p1, percent) {
        return {
            x: p0.x + (p1.x - p0.x) * (percent !== undefined ? percent : 0.5),
            y: p0.y + (p1.y - p0.y) * (percent !== undefined ? percent : 0.5),
        };
    } // function getRightBeginPoint (src, dest) {
    //   let closestPoint = 0,
    //     minDistance = 99999999
    //   for (let i = 0; i < dest.length; i += 1) {
    //     if (t2DGeometry.getDistance(src[0].p0, dest[i].p0) < minDistance) {
    //       minDistance = t2DGeometry.getDistance(src[0].p0, dest[i].p0)
    //       closestPoint = i
    //     }
    //   }
    //   return closestPoint
    // }

    function getDirection(data) {
        let dir = 0;

        for (let i = 0; i < data.length; i += 1) {
            if (data[i].type !== "M") {
                dir += (data[i].p1.x - data[i].p0.x) * (data[i].p1.y + data[i].p0.y);
            }
        }

        return dir;
    }

    function reverse(data) {
        const dataLocal = data.reverse();
        const newArray = [
            {
                type: "M",
                p0: dataLocal[0].p1,
            },
        ];
        dataLocal.forEach((d) => {
            if (d.type === "C") {
                const dLocal = d;
                const tp0 = dLocal.p0;
                const tc1 = dLocal.cntrl1;
                dLocal.p0 = d.p1;
                dLocal.p1 = tp0;
                dLocal.cntrl1 = d.cntrl2;
                dLocal.cntrl2 = tc1;
                newArray.push(dLocal);
            }
        });
        return newArray;
    }

    function centroid(path) {
        let sumX = 0;
        let sumY = 0;
        let counterX = 0;
        let counterY = 0;
        path.forEach((d) => {
            if (d.p0) {
                sumX += d.p0.x;
                sumY += d.p0.y;
                counterX += 1;
                counterY += 1;
            }

            if (d.p1) {
                sumX += d.p1.x;
                sumY += d.p1.y;
                counterX += 1;
                counterY += 1;
            }
        });
        return {
            x: sumX / counterX,
            y: sumY / counterY,
        };
    }

    function getQuadrant(centroidP, point) {
        if (point.x >= centroidP.x && point.y <= centroidP.y) {
            return 1;
        } else if (point.x <= centroidP.x && point.y <= centroidP.y) {
            return 2;
        } else if (point.x <= centroidP.x && point.y >= centroidP.y) {
            return 3;
        }

        return 4;
    }

    function getSrcBeginPoint(src, dest) {
        const centroidOfSrc = centroid(src);
        const centroidOfDest = centroid(dest);
        const srcArr = src;
        const destArr = dest;

        for (let i = 0; i < src.length; i += 1) {
            srcArr[i].quad = getQuadrant(centroidOfSrc, src[i].p0);
        }

        for (let i = 0; i < dest.length; i += 1) {
            destArr[i].quad = getQuadrant(centroidOfDest, dest[i].p0);
        }

        let minDistance = 0;
        src.forEach((d, i) => {
            const dis = t2DGeometry.getDistance(d.p0, centroidOfSrc);

            if (d.quad === 1 && dis >= minDistance) {
                minDistance = dis;
            }
        });
        minDistance = 0;
        dest.forEach((d, i) => {
            const dis = t2DGeometry.getDistance(d.p0, centroidOfDest);

            if (d.quad === 1 && dis > minDistance) {
                minDistance = dis;
            }
        });
        return {
            src: setStartingPoint(src, 0),
            // srcStartingIndex
            dest: setStartingPoint(dest, 0),
            // destStartingIndex
            srcCentroid: centroidOfSrc,
            destCentroid: centroidOfDest,
        };
    }

    function setStartingPoint(path, closestPoint) {
        if (closestPoint <= 0) {
            return path;
        }

        let pathLocal = path;
        const subSet = pathLocal.splice(0, closestPoint);
        subSet.shift();
        pathLocal = pathLocal.concat(subSet);
        pathLocal.unshift({
            type: "M",
            p0: pathLocal[0].p0,
        });
        pathLocal.push({
            type: "M",
            p0: pathLocal[0].p0,
        });
        return pathLocal;
    }

    function mapper(sExe, dExe) {
        let nsExe;
        let ndExe;
        let maxLength = sExe.length > dExe.length ? sExe.length : dExe.length;

        if (dExe.length > 2 && sExe.length > 2) {
            if (maxLength > 50) {
                maxLength += 30;
            } else {
                maxLength = maxLength >= 20 ? maxLength + 15 : maxLength + 4;
            }

            nsExe = normalizeCmds(sExe, maxLength);
            ndExe = normalizeCmds(dExe, maxLength);
        } else {
            nsExe = sExe;
            ndExe = dExe;
        }

        if (getDirection(nsExe) < 0) {
            nsExe = reverse(nsExe);
        }

        if (getDirection(ndExe) < 0) {
            ndExe = reverse(ndExe);
        }

        const res = getSrcBeginPoint(nsExe, ndExe, this);
        nsExe =
            res.src.length > 1
                ? res.src
                : [
                      {
                          type: "M",
                          p0: res.destCentroid,
                      },
                  ];
        ndExe =
            res.dest.length > 1
                ? res.dest
                : [
                      {
                          type: "M",
                          p0: res.srcCentroid,
                      },
                  ];
        const length = ndExe.length < nsExe.length ? nsExe.length : ndExe.length;

        for (let i = 0; i < nsExe.length; i += 1) {
            nsExe[i].index = i;
        }

        for (let i = 0; i < ndExe.length; i += 1) {
            ndExe[i].index = i;
        }

        for (let i = 0; i < length; i += 1) {
            const sP0 = nsExe[nsExe.length - 1].p0
                ? nsExe[nsExe.length - 1].p0
                : nsExe[nsExe.length - 1].p1;
            const dP0 = ndExe[ndExe.length - 1].p0
                ? ndExe[ndExe.length - 1].p0
                : ndExe[ndExe.length - 1].p1;
            const sCmd = nsExe[i]
                ? nsExe[i]
                : {
                      type: "C",
                      p0: sP0,
                      p1: sP0,
                      cntrl1: sP0,
                      cntrl2: sP0,
                      length: 0,
                  };
            const dCmd = ndExe[i]
                ? ndExe[i]
                : {
                      type: "C",
                      p0: dP0,
                      p1: dP0,
                      cntrl1: dP0,
                      cntrl2: dP0,
                      length: 0, // ndExe[ndExe.length - 1]
                  };

            if (sCmd.type === "M" && dCmd.type === "M") {
                buildMTransitionobj(sCmd, dCmd);
            } else if (sCmd.type === "M" || dCmd.type === "M") {
                if (sCmd.type === "M") {
                    buildTransitionObj(
                        {
                            type: "C",
                            p0: sCmd.p0,
                            p1: sCmd.p0,
                            cntrl1: sCmd.p0,
                            cntrl2: sCmd.p0,
                            length: 0,
                        },
                        dCmd
                    );
                } else {
                    buildTransitionObj(sCmd, {
                        type: "C",
                        p0: dCmd.p0,
                        p1: dCmd.p0,
                        cntrl1: dCmd.p0,
                        cntrl2: dCmd.p0,
                        length: 0,
                    });
                }
            } else {
                buildTransitionObj(sCmd, dCmd);
            }
        }
    }

    queueInstance.add(
        animeId(),
        {
            run(f) {
                const ppath = new Path();

                for (let i = 0, len = chainInstance.length; i < len; i++) {
                    chainInstance[i].run(ppath, f);
                }

                self.setAttr("d", ppath);
            },
            target: self,
            duration: duration,
            loop: loop,
            direction: direction,
        },
        easying(ease)
    );
}

function isTypePath(pathInstance) {
    return pathInstance instanceof Path;
}

export default {
    instance: function (d) {
        return new Path(d);
    },
    isTypePath,
    animatePathTo,
    morphTo,
};
