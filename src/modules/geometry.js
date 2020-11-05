/* eslint-disable no-undef */
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

// function angleToRadian (_) {
//   if (isNaN(_)) { throw new Error('NaN') }
//   return (Math.PI / 180) * _
// }
// function radianToAngle (_) {
//   if (isNaN(_)) { throw new Error('NaN') }
//   return (180 / Math.PI) * _
// }
// function getAngularDistance (r1, r2) {
//   if (isNaN(r1 - r2)) { throw new Error('NaN') }
//   return r1 - r2
// }

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
} // function bezierLengthOld (p0, p1, p2) {
//   const interval = 0.001
//   let sum = 0
//   const bezierTransitionInstance = bezierTransition.bind(null, p0, p1, p2)
//   // let p1
//   // let p2
//   for (let i = 0; i <= 1 - interval; i += interval) {
//     p1 = bezierTransitionInstance(i)
//     p2 = bezierTransitionInstance(i + interval)
//     sum += sqrt(pw((p2.x - p1.x) / interval, 2) + (pw((p2.y - p1.y) / interval, 2))) * interval
//   }
//   return sum
// }

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

function rotatePoint(point, centre, newAngle, distance) {
    const p = {};
    const x = point.x;
    const y = point.y;
    const cx = centre.x;
    const cy = centre.y;

    var radians = (PI / 180) * newAngle;
    var c_ = cos(-radians);
    var s_ = sin(-radians);
    p.x = c_ * (x - cx) + s_ * (y - cy) + cx;
    p.y = c_ * (y - cy) - s_ * (x - cx) + cy;
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
export default new Geometry();
