/*!
      * i2djs v3.7.0
      * (c) 2022 Narayana Swamy (narayanaswamy14@gmail.com)
      * @license BSD-3-Clause
      */
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.i2d = {}));
})(this, (function (exports) { 'use strict';

    /* eslint-disable no-undef */
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
            function requestAnimationFrame(callback, element) {
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
    }; // function endExe (_) {
    //   this.endExe = _
    //   return this
    // }

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
        // end: endExe,
        onRequestFrame,
        removeRequestFrameCall,
        clearAll: function () {
            tweens = [];
            onFrameExe = []; // if (this.endExe) { this.endExe() }
            // this.stopAnimeFrame()
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
                // vDoms[vDomIds[i]].onchange();
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

    var queue = animatorInstance; // default function animateQueue () {
    //   if (!animatorInstance) { animatorInstance = new ExeQueue() }
    //   return animatorInstance
    // }

    /* eslint-disable no-undef */
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

    // VDom.prototype.onchange = function () {
    // 	// this.root.invokeOnChange();
    // };

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

    const TAU$1 = PI * 2;

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
            ang2 -= TAU$1;
        }

        if (sweepFlag === 1 && ang2 < 0) {
            ang2 += TAU$1;
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

        const sinphi = sin((xAxisRotation * TAU$1) / 360);
        const cosphi = cos((xAxisRotation * TAU$1) / 360);
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
        const segments = max(ceil(abs(ang2) / (TAU$1 / 4)), 1);
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

    /* eslint-disable no-undef */

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
    } // function easeInQuart (starttime, duration) {
    //   const t = starttime / duration
    //   return t2DGeometry.pow(t, 4)
    // }
    // function easeOutQuart (starttime, duration) {
    //   let t = starttime / duration
    //   t -= 1
    //   return 1 - t * t2DGeometry.pow(t, 3)
    // }
    // function easeInOutQuart (starttime, duration) {
    //   let t = starttime / duration
    //   t -= 1
    //   return t < 0.5 ? 8 * t2DGeometry.pow(t, 4) : 1 - 8 * t * t2DGeometry.pow(t, 3)
    // }

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

    /* eslint-disable no-undef */

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
            this.currObj = currObj; // currObj.durationP = tValue

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
            } // if (self.end) { self.triggerChild(self) }

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
            currObj.end(); // setTimeout(() => {
            //   currObj.childExe.start()
            // }, 0)
        }
    };

    function ParallelGroup() {
        this.queue = queue;
        this.group = [];
        this.currPos = 0; // this.lengthV = 0

        this.ID = generateRendererId();
        this.loopCounter = 1; // this.transition = 'linear'
    }

    ParallelGroup.prototype = {
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
                currObj // .duration(currObj.durationP ? currObj.durationP : self.durationP)
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
                        // self.factor < 0 ? 'reverse' : 'default',
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
        const self = this; // Call child transition wen Entire parallelChain transition completes

        this.currPos += 1;

        if (currObj.end) {
            this.triggerChild(currObj.end);
        }

        if (this.currPos === this.group.length) {
            // Call child transition wen Entire parallelChain transition completes
            if (this.endExe) {
                this.triggerChild(this.endExe);
            } // if (this.end) { this.triggerChild(this.end) }

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

    function polygonArea(polygon) {
      var i = -1,
          n = polygon.length,
          a,
          b = polygon[n - 1],
          area = 0;

      while (++i < n) {
        a = b;
        b = polygon[i];
        area += a[1] * b[0] - a[0] * b[1];
      }

      return area / 2;
    }

    function polygonLength(polygon) {
      var i = -1,
          n = polygon.length,
          b = polygon[n - 1],
          xa,
          ya,
          xb = b[0],
          yb = b[1],
          perimeter = 0;

      while (++i < n) {
        xa = xb;
        ya = yb;
        b = polygon[i];
        xb = b[0];
        yb = b[1];
        xa -= xb;
        ya -= yb;
        perimeter += Math.sqrt(xa * xa + ya * ya);
      }

      return perimeter;
    }

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    var paramCounts = { a: 7, c: 6, h: 1, l: 2, m: 2, r: 4, q: 4, s: 4, t: 2, v: 1, z: 0 };

    var SPECIAL_SPACES = [
      0x1680, 0x180E, 0x2000, 0x2001, 0x2002, 0x2003, 0x2004, 0x2005, 0x2006,
      0x2007, 0x2008, 0x2009, 0x200A, 0x202F, 0x205F, 0x3000, 0xFEFF
    ];

    function isSpace(ch) {
      return (ch === 0x0A) || (ch === 0x0D) || (ch === 0x2028) || (ch === 0x2029) || // Line terminators
        // White spaces
        (ch === 0x20) || (ch === 0x09) || (ch === 0x0B) || (ch === 0x0C) || (ch === 0xA0) ||
        (ch >= 0x1680 && SPECIAL_SPACES.indexOf(ch) >= 0);
    }

    function isCommand(code) {
      /*eslint-disable no-bitwise*/
      switch (code | 0x20) {
        case 0x6D/* m */:
        case 0x7A/* z */:
        case 0x6C/* l */:
        case 0x68/* h */:
        case 0x76/* v */:
        case 0x63/* c */:
        case 0x73/* s */:
        case 0x71/* q */:
        case 0x74/* t */:
        case 0x61/* a */:
        case 0x72/* r */:
          return true;
      }
      return false;
    }

    function isArc(code) {
      return (code | 0x20) === 0x61;
    }

    function isDigit(code) {
      return (code >= 48 && code <= 57);   // 0..9
    }

    function isDigitStart(code) {
      return (code >= 48 && code <= 57) || /* 0..9 */
              code === 0x2B || /* + */
              code === 0x2D || /* - */
              code === 0x2E;   /* . */
    }


    function State(path) {
      this.index  = 0;
      this.path   = path;
      this.max    = path.length;
      this.result = [];
      this.param  = 0.0;
      this.err    = '';
      this.segmentStart = 0;
      this.data   = [];
    }

    function skipSpaces(state) {
      while (state.index < state.max && isSpace(state.path.charCodeAt(state.index))) {
        state.index++;
      }
    }


    function scanFlag(state) {
      var ch = state.path.charCodeAt(state.index);

      if (ch === 0x30/* 0 */) {
        state.param = 0;
        state.index++;
        return;
      }

      if (ch === 0x31/* 1 */) {
        state.param = 1;
        state.index++;
        return;
      }

      state.err = 'SvgPath: arc flag can be 0 or 1 only (at pos ' + state.index + ')';
    }


    function scanParam(state) {
      var start = state.index,
          index = start,
          max = state.max,
          zeroFirst = false,
          hasCeiling = false,
          hasDecimal = false,
          hasDot = false,
          ch;

      if (index >= max) {
        state.err = 'SvgPath: missed param (at pos ' + index + ')';
        return;
      }
      ch = state.path.charCodeAt(index);

      if (ch === 0x2B/* + */ || ch === 0x2D/* - */) {
        index++;
        ch = (index < max) ? state.path.charCodeAt(index) : 0;
      }

      // This logic is shamelessly borrowed from Esprima
      // https://github.com/ariya/esprimas
      //
      if (!isDigit(ch) && ch !== 0x2E/* . */) {
        state.err = 'SvgPath: param should start with 0..9 or `.` (at pos ' + index + ')';
        return;
      }

      if (ch !== 0x2E/* . */) {
        zeroFirst = (ch === 0x30/* 0 */);
        index++;

        ch = (index < max) ? state.path.charCodeAt(index) : 0;

        if (zeroFirst && index < max) {
          // decimal number starts with '0' such as '09' is illegal.
          if (ch && isDigit(ch)) {
            state.err = 'SvgPath: numbers started with `0` such as `09` are illegal (at pos ' + start + ')';
            return;
          }
        }

        while (index < max && isDigit(state.path.charCodeAt(index))) {
          index++;
          hasCeiling = true;
        }
        ch = (index < max) ? state.path.charCodeAt(index) : 0;
      }

      if (ch === 0x2E/* . */) {
        hasDot = true;
        index++;
        while (isDigit(state.path.charCodeAt(index))) {
          index++;
          hasDecimal = true;
        }
        ch = (index < max) ? state.path.charCodeAt(index) : 0;
      }

      if (ch === 0x65/* e */ || ch === 0x45/* E */) {
        if (hasDot && !hasCeiling && !hasDecimal) {
          state.err = 'SvgPath: invalid float exponent (at pos ' + index + ')';
          return;
        }

        index++;

        ch = (index < max) ? state.path.charCodeAt(index) : 0;
        if (ch === 0x2B/* + */ || ch === 0x2D/* - */) {
          index++;
        }
        if (index < max && isDigit(state.path.charCodeAt(index))) {
          while (index < max && isDigit(state.path.charCodeAt(index))) {
            index++;
          }
        } else {
          state.err = 'SvgPath: invalid float exponent (at pos ' + index + ')';
          return;
        }
      }

      state.index = index;
      state.param = parseFloat(state.path.slice(start, index)) + 0.0;
    }


    function finalizeSegment(state) {
      var cmd, cmdLC;

      // Process duplicated commands (without comand name)

      // This logic is shamelessly borrowed from Raphael
      // https://github.com/DmitryBaranovskiy/raphael/
      //
      cmd   = state.path[state.segmentStart];
      cmdLC = cmd.toLowerCase();

      var params = state.data;

      if (cmdLC === 'm' && params.length > 2) {
        state.result.push([ cmd, params[0], params[1] ]);
        params = params.slice(2);
        cmdLC = 'l';
        cmd = (cmd === 'm') ? 'l' : 'L';
      }

      if (cmdLC === 'r') {
        state.result.push([ cmd ].concat(params));
      } else {

        while (params.length >= paramCounts[cmdLC]) {
          state.result.push([ cmd ].concat(params.splice(0, paramCounts[cmdLC])));
          if (!paramCounts[cmdLC]) {
            break;
          }
        }
      }
    }


    function scanSegment(state) {
      var max = state.max,
          cmdCode, is_arc, comma_found, need_params, i;

      state.segmentStart = state.index;
      cmdCode = state.path.charCodeAt(state.index);
      is_arc = isArc(cmdCode);

      if (!isCommand(cmdCode)) {
        state.err = 'SvgPath: bad command ' + state.path[state.index] + ' (at pos ' + state.index + ')';
        return;
      }

      need_params = paramCounts[state.path[state.index].toLowerCase()];

      state.index++;
      skipSpaces(state);

      state.data = [];

      if (!need_params) {
        // Z
        finalizeSegment(state);
        return;
      }

      comma_found = false;

      for (;;) {
        for (i = need_params; i > 0; i--) {
          if (is_arc && (i === 3 || i === 4)) scanFlag(state);
          else scanParam(state);

          if (state.err.length) {
            return;
          }
          state.data.push(state.param);

          skipSpaces(state);
          comma_found = false;

          if (state.index < max && state.path.charCodeAt(state.index) === 0x2C/* , */) {
            state.index++;
            skipSpaces(state);
            comma_found = true;
          }
        }

        // after ',' param is mandatory
        if (comma_found) {
          continue;
        }

        if (state.index >= state.max) {
          break;
        }

        // Stop on next segment
        if (!isDigitStart(state.path.charCodeAt(state.index))) {
          break;
        }
      }

      finalizeSegment(state);
    }


    /* Returns array of segments:
     *
     * [
     *   [ command, coord1, coord2, ... ]
     * ]
     */
    var path_parse = function pathParse(svgPath) {
      var state = new State(svgPath);
      var max = state.max;

      skipSpaces(state);

      while (state.index < max && !state.err.length) {
        scanSegment(state);
      }

      if (state.err.length) {
        state.result = [];

      } else if (state.result.length) {

        if ('mM'.indexOf(state.result[0][0]) < 0) {
          state.err = 'SvgPath: string should start with `M` or `m`';
          state.result = [];
        } else {
          state.result[0][0] = 'M';
        }
      }

      return {
        err: state.err,
        segments: state.result
      };
    };

    // combine 2 matrixes
    // m1, m2 - [a, b, c, d, e, g]
    //
    function combine(m1, m2) {
      return [
        m1[0] * m2[0] + m1[2] * m2[1],
        m1[1] * m2[0] + m1[3] * m2[1],
        m1[0] * m2[2] + m1[2] * m2[3],
        m1[1] * m2[2] + m1[3] * m2[3],
        m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
        m1[1] * m2[4] + m1[3] * m2[5] + m1[5]
      ];
    }


    function Matrix$1() {
      if (!(this instanceof Matrix$1)) { return new Matrix$1(); }
      this.queue = [];   // list of matrixes to apply
      this.cache = null; // combined matrix cache
    }


    Matrix$1.prototype.matrix = function (m) {
      if (m[0] === 1 && m[1] === 0 && m[2] === 0 && m[3] === 1 && m[4] === 0 && m[5] === 0) {
        return this;
      }
      this.cache = null;
      this.queue.push(m);
      return this;
    };


    Matrix$1.prototype.translate = function (tx, ty) {
      if (tx !== 0 || ty !== 0) {
        this.cache = null;
        this.queue.push([ 1, 0, 0, 1, tx, ty ]);
      }
      return this;
    };


    Matrix$1.prototype.scale = function (sx, sy) {
      if (sx !== 1 || sy !== 1) {
        this.cache = null;
        this.queue.push([ sx, 0, 0, sy, 0, 0 ]);
      }
      return this;
    };


    Matrix$1.prototype.rotate = function (angle, rx, ry) {
      var rad, cos, sin;

      if (angle !== 0) {
        this.translate(rx, ry);

        rad = angle * Math.PI / 180;
        cos = Math.cos(rad);
        sin = Math.sin(rad);

        this.queue.push([ cos, sin, -sin, cos, 0, 0 ]);
        this.cache = null;

        this.translate(-rx, -ry);
      }
      return this;
    };


    Matrix$1.prototype.skewX = function (angle) {
      if (angle !== 0) {
        this.cache = null;
        this.queue.push([ 1, 0, Math.tan(angle * Math.PI / 180), 1, 0, 0 ]);
      }
      return this;
    };


    Matrix$1.prototype.skewY = function (angle) {
      if (angle !== 0) {
        this.cache = null;
        this.queue.push([ 1, Math.tan(angle * Math.PI / 180), 0, 1, 0, 0 ]);
      }
      return this;
    };


    // Flatten queue
    //
    Matrix$1.prototype.toArray = function () {
      if (this.cache) {
        return this.cache;
      }

      if (!this.queue.length) {
        this.cache = [ 1, 0, 0, 1, 0, 0 ];
        return this.cache;
      }

      this.cache = this.queue[0];

      if (this.queue.length === 1) {
        return this.cache;
      }

      for (var i = 1; i < this.queue.length; i++) {
        this.cache = combine(this.cache, this.queue[i]);
      }

      return this.cache;
    };


    // Apply list of matrixes to (x,y) point.
    // If `isRelative` set, `translate` component of matrix will be skipped
    //
    Matrix$1.prototype.calc = function (x, y, isRelative) {
      var m;

      // Don't change point on empty transforms queue
      if (!this.queue.length) { return [ x, y ]; }

      // Calculate final matrix, if not exists
      //
      // NB. if you deside to apply transforms to point one-by-one,
      // they should be taken in reverse order

      if (!this.cache) {
        this.cache = this.toArray();
      }

      m = this.cache;

      // Apply matrix to point
      return [
        x * m[0] + y * m[2] + (isRelative ? 0 : m[4]),
        x * m[1] + y * m[3] + (isRelative ? 0 : m[5])
      ];
    };


    var matrix$1 = Matrix$1;

    var Matrix = matrix$1;

    var operations = {
      matrix: true,
      scale: true,
      rotate: true,
      translate: true,
      skewX: true,
      skewY: true
    };

    var CMD_SPLIT_RE    = /\s*(matrix|translate|scale|rotate|skewX|skewY)\s*\(\s*(.+?)\s*\)[\s,]*/;
    var PARAMS_SPLIT_RE = /[\s,]+/;


    var transform_parse = function transformParse(transformString) {
      var matrix = new Matrix();
      var cmd, params;

      // Split value into ['', 'translate', '10 50', '', 'scale', '2', '', 'rotate',  '-45', '']
      transformString.split(CMD_SPLIT_RE).forEach(function (item) {

        // Skip empty elements
        if (!item.length) { return; }

        // remember operation
        if (typeof operations[item] !== 'undefined') {
          cmd = item;
          return;
        }

        // extract params & att operation to matrix
        params = item.split(PARAMS_SPLIT_RE).map(function (i) {
          return +i || 0;
        });

        // If params count is not correct - ignore command
        switch (cmd) {
          case 'matrix':
            if (params.length === 6) {
              matrix.matrix(params);
            }
            return;

          case 'scale':
            if (params.length === 1) {
              matrix.scale(params[0], params[0]);
            } else if (params.length === 2) {
              matrix.scale(params[0], params[1]);
            }
            return;

          case 'rotate':
            if (params.length === 1) {
              matrix.rotate(params[0], 0, 0);
            } else if (params.length === 3) {
              matrix.rotate(params[0], params[1], params[2]);
            }
            return;

          case 'translate':
            if (params.length === 1) {
              matrix.translate(params[0], 0);
            } else if (params.length === 2) {
              matrix.translate(params[0], params[1]);
            }
            return;

          case 'skewX':
            if (params.length === 1) {
              matrix.skewX(params[0]);
            }
            return;

          case 'skewY':
            if (params.length === 1) {
              matrix.skewY(params[0]);
            }
            return;
        }
      });

      return matrix;
    };

    var TAU = Math.PI * 2;


    /* eslint-disable space-infix-ops */

    // Calculate an angle between two unit vectors
    //
    // Since we measure angle between radii of circular arcs,
    // we can use simplified math (without length normalization)
    //
    function unit_vector_angle(ux, uy, vx, vy) {
      var sign = (ux * vy - uy * vx < 0) ? -1 : 1;
      var dot  = ux * vx + uy * vy;

      // Add this to work with arbitrary vectors:
      // dot /= Math.sqrt(ux * ux + uy * uy) * Math.sqrt(vx * vx + vy * vy);

      // rounding errors, e.g. -1.0000000000000002 can screw up this
      if (dot >  1.0) { dot =  1.0; }
      if (dot < -1.0) { dot = -1.0; }

      return sign * Math.acos(dot);
    }


    // Convert from endpoint to center parameterization,
    // see http://www.w3.org/TR/SVG11/implnote.html#ArcImplementationNotes
    //
    // Return [cx, cy, theta1, delta_theta]
    //
    function get_arc_center(x1, y1, x2, y2, fa, fs, rx, ry, sin_phi, cos_phi) {
      // Step 1.
      //
      // Moving an ellipse so origin will be the middlepoint between our two
      // points. After that, rotate it to line up ellipse axes with coordinate
      // axes.
      //
      var x1p =  cos_phi*(x1-x2)/2 + sin_phi*(y1-y2)/2;
      var y1p = -sin_phi*(x1-x2)/2 + cos_phi*(y1-y2)/2;

      var rx_sq  =  rx * rx;
      var ry_sq  =  ry * ry;
      var x1p_sq = x1p * x1p;
      var y1p_sq = y1p * y1p;

      // Step 2.
      //
      // Compute coordinates of the centre of this ellipse (cx', cy')
      // in the new coordinate system.
      //
      var radicant = (rx_sq * ry_sq) - (rx_sq * y1p_sq) - (ry_sq * x1p_sq);

      if (radicant < 0) {
        // due to rounding errors it might be e.g. -1.3877787807814457e-17
        radicant = 0;
      }

      radicant /=   (rx_sq * y1p_sq) + (ry_sq * x1p_sq);
      radicant = Math.sqrt(radicant) * (fa === fs ? -1 : 1);

      var cxp = radicant *  rx/ry * y1p;
      var cyp = radicant * -ry/rx * x1p;

      // Step 3.
      //
      // Transform back to get centre coordinates (cx, cy) in the original
      // coordinate system.
      //
      var cx = cos_phi*cxp - sin_phi*cyp + (x1+x2)/2;
      var cy = sin_phi*cxp + cos_phi*cyp + (y1+y2)/2;

      // Step 4.
      //
      // Compute angles (theta1, delta_theta).
      //
      var v1x =  (x1p - cxp) / rx;
      var v1y =  (y1p - cyp) / ry;
      var v2x = (-x1p - cxp) / rx;
      var v2y = (-y1p - cyp) / ry;

      var theta1 = unit_vector_angle(1, 0, v1x, v1y);
      var delta_theta = unit_vector_angle(v1x, v1y, v2x, v2y);

      if (fs === 0 && delta_theta > 0) {
        delta_theta -= TAU;
      }
      if (fs === 1 && delta_theta < 0) {
        delta_theta += TAU;
      }

      return [ cx, cy, theta1, delta_theta ];
    }

    //
    // Approximate one unit arc segment with bézier curves,
    // see http://math.stackexchange.com/questions/873224
    //
    function approximate_unit_arc(theta1, delta_theta) {
      var alpha = 4/3 * Math.tan(delta_theta/4);

      var x1 = Math.cos(theta1);
      var y1 = Math.sin(theta1);
      var x2 = Math.cos(theta1 + delta_theta);
      var y2 = Math.sin(theta1 + delta_theta);

      return [ x1, y1, x1 - y1*alpha, y1 + x1*alpha, x2 + y2*alpha, y2 - x2*alpha, x2, y2 ];
    }

    var a2c$1 = function a2c(x1, y1, x2, y2, fa, fs, rx, ry, phi) {
      var sin_phi = Math.sin(phi * TAU / 360);
      var cos_phi = Math.cos(phi * TAU / 360);

      // Make sure radii are valid
      //
      var x1p =  cos_phi*(x1-x2)/2 + sin_phi*(y1-y2)/2;
      var y1p = -sin_phi*(x1-x2)/2 + cos_phi*(y1-y2)/2;

      if (x1p === 0 && y1p === 0) {
        // we're asked to draw line to itself
        return [];
      }

      if (rx === 0 || ry === 0) {
        // one of the radii is zero
        return [];
      }


      // Compensate out-of-range radii
      //
      rx = Math.abs(rx);
      ry = Math.abs(ry);

      var lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
      if (lambda > 1) {
        rx *= Math.sqrt(lambda);
        ry *= Math.sqrt(lambda);
      }


      // Get center parameters (cx, cy, theta1, delta_theta)
      //
      var cc = get_arc_center(x1, y1, x2, y2, fa, fs, rx, ry, sin_phi, cos_phi);

      var result = [];
      var theta1 = cc[2];
      var delta_theta = cc[3];

      // Split an arc to multiple segments, so each segment
      // will be less than τ/4 (= 90°)
      //
      var segments = Math.max(Math.ceil(Math.abs(delta_theta) / (TAU / 4)), 1);
      delta_theta /= segments;

      for (var i = 0; i < segments; i++) {
        result.push(approximate_unit_arc(theta1, delta_theta));
        theta1 += delta_theta;
      }

      // We have a bezier approximation of a unit circle,
      // now need to transform back to the original ellipse
      //
      return result.map(function (curve) {
        for (var i = 0; i < curve.length; i += 2) {
          var x = curve[i + 0];
          var y = curve[i + 1];

          // scale
          x *= rx;
          y *= ry;

          // rotate
          var xp = cos_phi*x - sin_phi*y;
          var yp = sin_phi*x + cos_phi*y;

          // translate
          curve[i + 0] = xp + cc[0];
          curve[i + 1] = yp + cc[1];
        }

        return curve;
      });
    };

    /* eslint-disable space-infix-ops */

    // The precision used to consider an ellipse as a circle
    //
    var epsilon = 0.0000000001;

    // To convert degree in radians
    //
    var torad = Math.PI / 180;

    // Class constructor :
    //  an ellipse centred at 0 with radii rx,ry and x - axis - angle ax.
    //
    function Ellipse(rx, ry, ax) {
      if (!(this instanceof Ellipse)) { return new Ellipse(rx, ry, ax); }
      this.rx = rx;
      this.ry = ry;
      this.ax = ax;
    }

    // Apply a linear transform m to the ellipse
    // m is an array representing a matrix :
    //    -         -
    //   | m[0] m[2] |
    //   | m[1] m[3] |
    //    -         -
    //
    Ellipse.prototype.transform = function (m) {
      // We consider the current ellipse as image of the unit circle
      // by first scale(rx,ry) and then rotate(ax) ...
      // So we apply ma =  m x rotate(ax) x scale(rx,ry) to the unit circle.
      var c = Math.cos(this.ax * torad), s = Math.sin(this.ax * torad);
      var ma = [
        this.rx * (m[0]*c + m[2]*s),
        this.rx * (m[1]*c + m[3]*s),
        this.ry * (-m[0]*s + m[2]*c),
        this.ry * (-m[1]*s + m[3]*c)
      ];

      // ma * transpose(ma) = [ J L ]
      //                      [ L K ]
      // L is calculated later (if the image is not a circle)
      var J = ma[0]*ma[0] + ma[2]*ma[2],
          K = ma[1]*ma[1] + ma[3]*ma[3];

      // the discriminant of the characteristic polynomial of ma * transpose(ma)
      var D = ((ma[0]-ma[3])*(ma[0]-ma[3]) + (ma[2]+ma[1])*(ma[2]+ma[1])) *
              ((ma[0]+ma[3])*(ma[0]+ma[3]) + (ma[2]-ma[1])*(ma[2]-ma[1]));

      // the "mean eigenvalue"
      var JK = (J + K) / 2;

      // check if the image is (almost) a circle
      if (D < epsilon * JK) {
        // if it is
        this.rx = this.ry = Math.sqrt(JK);
        this.ax = 0;
        return this;
      }

      // if it is not a circle
      var L = ma[0]*ma[1] + ma[2]*ma[3];

      D = Math.sqrt(D);

      // {l1,l2} = the two eigen values of ma * transpose(ma)
      var l1 = JK + D/2,
          l2 = JK - D/2;
      // the x - axis - rotation angle is the argument of the l1 - eigenvector
      /*eslint-disable indent*/
      this.ax = (Math.abs(L) < epsilon && Math.abs(l1 - K) < epsilon) ?
        90
      :
        Math.atan(Math.abs(L) > Math.abs(l1 - K) ?
          (l1 - J) / L
        :
          L / (l1 - K)
        ) * 180 / Math.PI;
      /*eslint-enable indent*/

      // if ax > 0 => rx = sqrt(l1), ry = sqrt(l2), else exchange axes and ax += 90
      if (this.ax >= 0) {
        // if ax in [0,90]
        this.rx = Math.sqrt(l1);
        this.ry = Math.sqrt(l2);
      } else {
        // if ax in ]-90,0[ => exchange axes
        this.ax += 90;
        this.rx = Math.sqrt(l2);
        this.ry = Math.sqrt(l1);
      }

      return this;
    };

    // Check if the ellipse is (almost) degenerate, i.e. rx = 0 or ry = 0
    //
    Ellipse.prototype.isDegenerate = function () {
      return (this.rx < epsilon * this.ry || this.ry < epsilon * this.rx);
    };

    var ellipse$1 = Ellipse;

    var pathParse      = path_parse;
    var transformParse = transform_parse;
    var matrix         = matrix$1;
    var a2c            = a2c$1;
    var ellipse        = ellipse$1;


    // Class constructor
    //
    function SvgPath(path) {
      if (!(this instanceof SvgPath)) { return new SvgPath(path); }

      var pstate = pathParse(path);

      // Array of path segments.
      // Each segment is array [command, param1, param2, ...]
      this.segments = pstate.segments;

      // Error message on parse error.
      this.err      = pstate.err;

      // Transforms stack for lazy evaluation
      this.__stack    = [];
    }

    SvgPath.from = function (src) {
      if (typeof src === 'string') return new SvgPath(src);

      if (src instanceof SvgPath) {
        // Create empty object
        var s = new SvgPath('');

        // Clone properies
        s.err = src.err;
        s.segments = src.segments.map(function (sgm) { return sgm.slice(); });
        s.__stack = src.__stack.map(function (m) {
          return matrix().matrix(m.toArray());
        });

        return s;
      }

      throw new Error('SvgPath.from: invalid param type ' + src);
    };


    SvgPath.prototype.__matrix = function (m) {
      var self = this, i;

      // Quick leave for empty matrix
      if (!m.queue.length) { return; }

      this.iterate(function (s, index, x, y) {
        var p, result, name, isRelative;

        switch (s[0]) {

          // Process 'assymetric' commands separately
          case 'v':
            p      = m.calc(0, s[1], true);
            result = (p[0] === 0) ? [ 'v', p[1] ] : [ 'l', p[0], p[1] ];
            break;

          case 'V':
            p      = m.calc(x, s[1], false);
            result = (p[0] === m.calc(x, y, false)[0]) ? [ 'V', p[1] ] : [ 'L', p[0], p[1] ];
            break;

          case 'h':
            p      = m.calc(s[1], 0, true);
            result = (p[1] === 0) ? [ 'h', p[0] ] : [ 'l', p[0], p[1] ];
            break;

          case 'H':
            p      = m.calc(s[1], y, false);
            result = (p[1] === m.calc(x, y, false)[1]) ? [ 'H', p[0] ] : [ 'L', p[0], p[1] ];
            break;

          case 'a':
          case 'A':
            // ARC is: ['A', rx, ry, x-axis-rotation, large-arc-flag, sweep-flag, x, y]

            // Drop segment if arc is empty (end point === start point)
            /*if ((s[0] === 'A' && s[6] === x && s[7] === y) ||
                (s[0] === 'a' && s[6] === 0 && s[7] === 0)) {
              return [];
            }*/

            // Transform rx, ry and the x-axis-rotation
            var ma = m.toArray();
            var e = ellipse(s[1], s[2], s[3]).transform(ma);

            // flip sweep-flag if matrix is not orientation-preserving
            if (ma[0] * ma[3] - ma[1] * ma[2] < 0) {
              s[5] = s[5] ? '0' : '1';
            }

            // Transform end point as usual (without translation for relative notation)
            p = m.calc(s[6], s[7], s[0] === 'a');

            // Empty arcs can be ignored by renderer, but should not be dropped
            // to avoid collisions with `S A S` and so on. Replace with empty line.
            if ((s[0] === 'A' && s[6] === x && s[7] === y) ||
                (s[0] === 'a' && s[6] === 0 && s[7] === 0)) {
              result = [ s[0] === 'a' ? 'l' : 'L', p[0], p[1] ];
              break;
            }

            // if the resulting ellipse is (almost) a segment ...
            if (e.isDegenerate()) {
              // replace the arc by a line
              result = [ s[0] === 'a' ? 'l' : 'L', p[0], p[1] ];
            } else {
              // if it is a real ellipse
              // s[0], s[4] and s[5] are not modified
              result = [ s[0], e.rx, e.ry, e.ax, s[4], s[5], p[0], p[1] ];
            }

            break;

          case 'm':
            // Edge case. The very first `m` should be processed as absolute, if happens.
            // Make sense for coord shift transforms.
            isRelative = index > 0;

            p = m.calc(s[1], s[2], isRelative);
            result = [ 'm', p[0], p[1] ];
            break;

          default:
            name       = s[0];
            result     = [ name ];
            isRelative = (name.toLowerCase() === name);

            // Apply transformations to the segment
            for (i = 1; i < s.length; i += 2) {
              p = m.calc(s[i], s[i + 1], isRelative);
              result.push(p[0], p[1]);
            }
        }

        self.segments[index] = result;
      }, true);
    };


    // Apply stacked commands
    //
    SvgPath.prototype.__evaluateStack = function () {
      var m, i;

      if (!this.__stack.length) { return; }

      if (this.__stack.length === 1) {
        this.__matrix(this.__stack[0]);
        this.__stack = [];
        return;
      }

      m = matrix();
      i = this.__stack.length;

      while (--i >= 0) {
        m.matrix(this.__stack[i].toArray());
      }

      this.__matrix(m);
      this.__stack = [];
    };


    // Convert processed SVG Path back to string
    //
    SvgPath.prototype.toString = function () {
      var result = '', prevCmd = '', cmdSkipped = false;

      this.__evaluateStack();

      for (var i = 0, len = this.segments.length; i < len; i++) {
        var segment = this.segments[i];
        var cmd = segment[0];

        // Command not repeating => store
        if (cmd !== prevCmd || cmd === 'm' || cmd === 'M') {
          // workaround for FontForge SVG importing bug, keep space between "z m".
          if (cmd === 'm' && prevCmd === 'z') result += ' ';
          result += cmd;

          cmdSkipped = false;
        } else {
          cmdSkipped = true;
        }

        // Store segment params
        for (var pos = 1; pos < segment.length; pos++) {
          var val = segment[pos];
          // Space can be skipped
          // 1. After command (always)
          // 2. For negative value (with '-' at start)
          if (pos === 1) {
            if (cmdSkipped && val >= 0) result += ' ';
          } else if (val >= 0) result += ' ';

          result += val;
        }

        prevCmd = cmd;
      }

      return result;
    };


    // Translate path to (x [, y])
    //
    SvgPath.prototype.translate = function (x, y) {
      this.__stack.push(matrix().translate(x, y || 0));
      return this;
    };


    // Scale path to (sx [, sy])
    // sy = sx if not defined
    //
    SvgPath.prototype.scale = function (sx, sy) {
      this.__stack.push(matrix().scale(sx, (!sy && (sy !== 0)) ? sx : sy));
      return this;
    };


    // Rotate path around point (sx [, sy])
    // sy = sx if not defined
    //
    SvgPath.prototype.rotate = function (angle, rx, ry) {
      this.__stack.push(matrix().rotate(angle, rx || 0, ry || 0));
      return this;
    };


    // Skew path along the X axis by `degrees` angle
    //
    SvgPath.prototype.skewX = function (degrees) {
      this.__stack.push(matrix().skewX(degrees));
      return this;
    };


    // Skew path along the Y axis by `degrees` angle
    //
    SvgPath.prototype.skewY = function (degrees) {
      this.__stack.push(matrix().skewY(degrees));
      return this;
    };


    // Apply matrix transform (array of 6 elements)
    //
    SvgPath.prototype.matrix = function (m) {
      this.__stack.push(matrix().matrix(m));
      return this;
    };


    // Transform path according to "transform" attr of SVG spec
    //
    SvgPath.prototype.transform = function (transformString) {
      if (!transformString.trim()) {
        return this;
      }
      this.__stack.push(transformParse(transformString));
      return this;
    };


    // Round coords with given decimal precition.
    // 0 by default (to integers)
    //
    SvgPath.prototype.round = function (d) {
      var contourStartDeltaX = 0, contourStartDeltaY = 0, deltaX = 0, deltaY = 0, l;

      d = d || 0;

      this.__evaluateStack();

      this.segments.forEach(function (s) {
        var isRelative = (s[0].toLowerCase() === s[0]);

        switch (s[0]) {
          case 'H':
          case 'h':
            if (isRelative) { s[1] += deltaX; }
            deltaX = s[1] - s[1].toFixed(d);
            s[1] = +s[1].toFixed(d);
            return;

          case 'V':
          case 'v':
            if (isRelative) { s[1] += deltaY; }
            deltaY = s[1] - s[1].toFixed(d);
            s[1] = +s[1].toFixed(d);
            return;

          case 'Z':
          case 'z':
            deltaX = contourStartDeltaX;
            deltaY = contourStartDeltaY;
            return;

          case 'M':
          case 'm':
            if (isRelative) {
              s[1] += deltaX;
              s[2] += deltaY;
            }

            deltaX = s[1] - s[1].toFixed(d);
            deltaY = s[2] - s[2].toFixed(d);

            contourStartDeltaX = deltaX;
            contourStartDeltaY = deltaY;

            s[1] = +s[1].toFixed(d);
            s[2] = +s[2].toFixed(d);
            return;

          case 'A':
          case 'a':
            // [cmd, rx, ry, x-axis-rotation, large-arc-flag, sweep-flag, x, y]
            if (isRelative) {
              s[6] += deltaX;
              s[7] += deltaY;
            }

            deltaX = s[6] - s[6].toFixed(d);
            deltaY = s[7] - s[7].toFixed(d);

            s[1] = +s[1].toFixed(d);
            s[2] = +s[2].toFixed(d);
            s[3] = +s[3].toFixed(d + 2); // better precision for rotation
            s[6] = +s[6].toFixed(d);
            s[7] = +s[7].toFixed(d);
            return;

          default:
            // a c l q s t
            l = s.length;

            if (isRelative) {
              s[l - 2] += deltaX;
              s[l - 1] += deltaY;
            }

            deltaX = s[l - 2] - s[l - 2].toFixed(d);
            deltaY = s[l - 1] - s[l - 1].toFixed(d);

            s.forEach(function (val, i) {
              if (!i) { return; }
              s[i] = +s[i].toFixed(d);
            });
            return;
        }
      });

      return this;
    };


    // Apply iterator function to all segments. If function returns result,
    // current segment will be replaced to array of returned segments.
    // If empty array is returned, current regment will be deleted.
    //
    SvgPath.prototype.iterate = function (iterator, keepLazyStack) {
      var segments = this.segments,
          replacements = {},
          needReplace = false,
          lastX = 0,
          lastY = 0,
          countourStartX = 0,
          countourStartY = 0;
      var i, j, newSegments;

      if (!keepLazyStack) {
        this.__evaluateStack();
      }

      segments.forEach(function (s, index) {

        var res = iterator(s, index, lastX, lastY);

        if (Array.isArray(res)) {
          replacements[index] = res;
          needReplace = true;
        }

        var isRelative = (s[0] === s[0].toLowerCase());

        // calculate absolute X and Y
        switch (s[0]) {
          case 'm':
          case 'M':
            lastX = s[1] + (isRelative ? lastX : 0);
            lastY = s[2] + (isRelative ? lastY : 0);
            countourStartX = lastX;
            countourStartY = lastY;
            return;

          case 'h':
          case 'H':
            lastX = s[1] + (isRelative ? lastX : 0);
            return;

          case 'v':
          case 'V':
            lastY = s[1] + (isRelative ? lastY : 0);
            return;

          case 'z':
          case 'Z':
            // That make sence for multiple contours
            lastX = countourStartX;
            lastY = countourStartY;
            return;

          default:
            lastX = s[s.length - 2] + (isRelative ? lastX : 0);
            lastY = s[s.length - 1] + (isRelative ? lastY : 0);
        }
      });

      // Replace segments if iterator return results

      if (!needReplace) { return this; }

      newSegments = [];

      for (i = 0; i < segments.length; i++) {
        if (typeof replacements[i] !== 'undefined') {
          for (j = 0; j < replacements[i].length; j++) {
            newSegments.push(replacements[i][j]);
          }
        } else {
          newSegments.push(segments[i]);
        }
      }

      this.segments = newSegments;

      return this;
    };


    // Converts segments from relative to absolute
    //
    SvgPath.prototype.abs = function () {

      this.iterate(function (s, index, x, y) {
        var name = s[0],
            nameUC = name.toUpperCase(),
            i;

        // Skip absolute commands
        if (name === nameUC) { return; }

        s[0] = nameUC;

        switch (name) {
          case 'v':
            // v has shifted coords parity
            s[1] += y;
            return;

          case 'a':
            // ARC is: ['A', rx, ry, x-axis-rotation, large-arc-flag, sweep-flag, x, y]
            // touch x, y only
            s[6] += x;
            s[7] += y;
            return;

          default:
            for (i = 1; i < s.length; i++) {
              s[i] += i % 2 ? x : y; // odd values are X, even - Y
            }
        }
      }, true);

      return this;
    };


    // Converts segments from absolute to relative
    //
    SvgPath.prototype.rel = function () {

      this.iterate(function (s, index, x, y) {
        var name = s[0],
            nameLC = name.toLowerCase(),
            i;

        // Skip relative commands
        if (name === nameLC) { return; }

        // Don't touch the first M to avoid potential confusions.
        if (index === 0 && name === 'M') { return; }

        s[0] = nameLC;

        switch (name) {
          case 'V':
            // V has shifted coords parity
            s[1] -= y;
            return;

          case 'A':
            // ARC is: ['A', rx, ry, x-axis-rotation, large-arc-flag, sweep-flag, x, y]
            // touch x, y only
            s[6] -= x;
            s[7] -= y;
            return;

          default:
            for (i = 1; i < s.length; i++) {
              s[i] -= i % 2 ? x : y; // odd values are X, even - Y
            }
        }
      }, true);

      return this;
    };


    // Converts arcs to cubic bézier curves
    //
    SvgPath.prototype.unarc = function () {
      this.iterate(function (s, index, x, y) {
        var new_segments, nextX, nextY, result = [], name = s[0];

        // Skip anything except arcs
        if (name !== 'A' && name !== 'a') { return null; }

        if (name === 'a') {
          // convert relative arc coordinates to absolute
          nextX = x + s[6];
          nextY = y + s[7];
        } else {
          nextX = s[6];
          nextY = s[7];
        }

        new_segments = a2c(x, y, nextX, nextY, s[4], s[5], s[1], s[2], s[3]);

        // Degenerated arcs can be ignored by renderer, but should not be dropped
        // to avoid collisions with `S A S` and so on. Replace with empty line.
        if (new_segments.length === 0) {
          return [ [ s[0] === 'a' ? 'l' : 'L', s[6], s[7] ] ];
        }

        new_segments.forEach(function (s) {
          result.push([ 'C', s[2], s[3], s[4], s[5], s[6], s[7] ]);
        });

        return result;
      });

      return this;
    };


    // Converts smooth curves (with missed control point) to generic curves
    //
    SvgPath.prototype.unshort = function () {
      var segments = this.segments;
      var prevControlX, prevControlY, prevSegment;
      var curControlX, curControlY;

      // TODO: add lazy evaluation flag when relative commands supported

      this.iterate(function (s, idx, x, y) {
        var name = s[0], nameUC = name.toUpperCase(), isRelative;

        // First command MUST be M|m, it's safe to skip.
        // Protect from access to [-1] for sure.
        if (!idx) { return; }

        if (nameUC === 'T') { // quadratic curve
          isRelative = (name === 't');

          prevSegment = segments[idx - 1];

          if (prevSegment[0] === 'Q') {
            prevControlX = prevSegment[1] - x;
            prevControlY = prevSegment[2] - y;
          } else if (prevSegment[0] === 'q') {
            prevControlX = prevSegment[1] - prevSegment[3];
            prevControlY = prevSegment[2] - prevSegment[4];
          } else {
            prevControlX = 0;
            prevControlY = 0;
          }

          curControlX = -prevControlX;
          curControlY = -prevControlY;

          if (!isRelative) {
            curControlX += x;
            curControlY += y;
          }

          segments[idx] = [
            isRelative ? 'q' : 'Q',
            curControlX, curControlY,
            s[1], s[2]
          ];

        } else if (nameUC === 'S') { // cubic curve
          isRelative = (name === 's');

          prevSegment = segments[idx - 1];

          if (prevSegment[0] === 'C') {
            prevControlX = prevSegment[3] - x;
            prevControlY = prevSegment[4] - y;
          } else if (prevSegment[0] === 'c') {
            prevControlX = prevSegment[3] - prevSegment[5];
            prevControlY = prevSegment[4] - prevSegment[6];
          } else {
            prevControlX = 0;
            prevControlY = 0;
          }

          curControlX = -prevControlX;
          curControlY = -prevControlY;

          if (!isRelative) {
            curControlX += x;
            curControlY += y;
          }

          segments[idx] = [
            isRelative ? 'c' : 'C',
            curControlX, curControlY,
            s[1], s[2], s[3], s[4]
          ];
        }
      });

      return this;
    };


    var svgpath$1 = SvgPath;

    var svgpath = svgpath$1;

    var pathProperties = {exports: {}};

    (function (module, exports) {
    // http://geoexamples.com/path-properties/ Version 0.2.2. Copyright 2017 Roger Veciana i Rovira.
    (function (global, factory) {
    	factory(exports) ;
    }(commonjsGlobal, (function (exports) {
    //Parses an SVG path into an object.
    //Taken from https://github.com/jkroso/parse-svg-path
    //Re-written so it can be used with rollup
    var length = {a: 7, c: 6, h: 1, l: 2, m: 2, q: 4, s: 4, t: 2, v: 1, z: 0};
    var segment = /([astvzqmhlc])([^astvzqmhlc]*)/ig;

    var parse = function(path) {
      var data = [];
    	path.replace(segment, function(_, command, args){
    		var type = command.toLowerCase();
    		args = parseValues(args);

    		// overloaded moveTo
    		if (type === 'm' && args.length > 2) {
    			data.push([command].concat(args.splice(0, 2)));
    			type = 'l';
    			command = command === 'm' ? 'l' : 'L';
    		}

    		while (args.length >= 0) {
    			if (args.length === length[type]) {
    				args.unshift(command);
    				return data.push(args);
    			}
    			if (args.length < length[type]) {
            throw new Error('malformed path data');
          }
    			data.push([command].concat(args.splice(0, length[type])));
    		}
    	});
      return data;
    };

    var number = /-?[0-9]*\.?[0-9]+(?:e[-+]?\d+)?/ig;

    function parseValues(args) {
    	var numbers = args.match(number);
    	return numbers ? numbers.map(Number) : [];
    }

    //Calculate Bezier curve length and positionAtLength
    //Algorithms taken from http://bl.ocks.org/hnakamur/e7efd0602bfc15f66fc5, https://gist.github.com/tunght13488/6744e77c242cc7a94859 and http://stackoverflow.com/questions/11854907/calculate-the-length-of-a-segment-of-a-quadratic-bezier

    var Bezier = function(ax, ay, bx, by, cx, cy, dx, dy) {
      return new Bezier$1(ax, ay, bx, by, cx, cy, dx, dy);
    };

    function Bezier$1(ax, ay, bx, by, cx, cy, dx, dy) {
      this.a = {x:ax, y:ay};
      this.b = {x:bx, y:by};
      this.c = {x:cx, y:cy};
      this.d = {x:dx, y:dy};

      if(dx !== null && dx !== undefined && dy !== null && dy !== undefined){
        this.getArcLength = getCubicArcLength;
        this.getPoint = cubicPoint;
        this.getDerivative = cubicDerivative;
      } else {
        this.getArcLength = getQuadraticArcLength;
        this.getPoint = quadraticPoint;
        this.getDerivative = quadraticDerivative;
      }

      this.init();
    }

    Bezier$1.prototype = {
      constructor: Bezier$1,
      init: function() {

        this.length = this.getArcLength([this.a.x, this.b.x, this.c.x, this.d.x],
                                        [this.a.y, this.b.y, this.c.y, this.d.y]);
      },

      getTotalLength: function() {
        return this.length;
      },
      getPointAtLength: function(length) {
        var t = t2length(length, this.length, this.getArcLength,
                        [this.a.x, this.b.x, this.c.x, this.d.x],
                        [this.a.y, this.b.y, this.c.y, this.d.y]);

        return this.getPoint([this.a.x, this.b.x, this.c.x, this.d.x],
                                        [this.a.y, this.b.y, this.c.y, this.d.y],
                                      t);
      },
      getTangentAtLength: function(length){
        var t = t2length(length, this.length, this.getArcLength,
                        [this.a.x, this.b.x, this.c.x, this.d.x],
                        [this.a.y, this.b.y, this.c.y, this.d.y]);

        var derivative = this.getDerivative([this.a.x, this.b.x, this.c.x, this.d.x],
                        [this.a.y, this.b.y, this.c.y, this.d.y], t);
        var mdl = Math.sqrt(derivative.x * derivative.x + derivative.y * derivative.y);
        var tangent;
        if (mdl > 0){
          tangent = {x: derivative.x/mdl, y: derivative.y/mdl};
        } else {
          tangent = {x: 0, y: 0};
        }
        return tangent;
      },
      getPropertiesAtLength: function(length){
        var t = t2length(length, this.length, this.getArcLength,
                        [this.a.x, this.b.x, this.c.x, this.d.x],
                        [this.a.y, this.b.y, this.c.y, this.d.y]);

        var derivative = this.getDerivative([this.a.x, this.b.x, this.c.x, this.d.x],
                        [this.a.y, this.b.y, this.c.y, this.d.y], t);
        var mdl = Math.sqrt(derivative.x * derivative.x + derivative.y * derivative.y);
        var tangent;
        if (mdl > 0){
          tangent = {x: derivative.x/mdl, y: derivative.y/mdl};
        } else {
          tangent = {x: 0, y: 0};
        }
        var point = this.getPoint([this.a.x, this.b.x, this.c.x, this.d.x],
                                        [this.a.y, this.b.y, this.c.y, this.d.y],
                                      t);
        return {x: point.x, y: point.y, tangentX: tangent.x, tangentY: tangent.y};
      }
    };

    function quadraticDerivative(xs, ys, t){
      return {x: (1 - t) * 2*(xs[1] - xs[0]) +t * 2*(xs[2] - xs[1]),
        y: (1 - t) * 2*(ys[1] - ys[0]) +t * 2*(ys[2] - ys[1])
      };
    }

    function cubicDerivative(xs, ys, t){
      var derivative = quadraticPoint(
                [3*(xs[1] - xs[0]), 3*(xs[2] - xs[1]), 3*(xs[3] - xs[2])],
                [3*(ys[1] - ys[0]), 3*(ys[2] - ys[1]), 3*(ys[3] - ys[2])],
                t);
      return derivative;
    }

    function t2length(length, total_length, func, xs, ys){
      var error = 1;
      var t = length/total_length;
      var step = (length - func(xs, ys, t))/total_length;

      while (error > 0.001){
        var increasedTLength = func(xs, ys, t + step);
        var decreasedTLength = func(xs, ys, t - step);
        var increasedTError = Math.abs(length - increasedTLength)/total_length;
        var decreasedTError = Math.abs(length - decreasedTLength)/total_length;
        if (increasedTError < error) {
          error = increasedTError;
          t += step;
        } else if (decreasedTError < error) {
          error = decreasedTError;
          t -= step;
        } else {
          step /= 2;
        }
      }

      return t;
    }

    function quadraticPoint(xs, ys, t){
      var x = (1 - t) * (1 - t) * xs[0] + 2 * (1 - t) * t * xs[1] + t * t * xs[2];
      var y = (1 - t) * (1 - t) * ys[0] + 2 * (1 - t) * t * ys[1] + t * t * ys[2];
      return {x: x, y: y};
    }

    function cubicPoint(xs, ys, t){
      var x = (1 - t) * (1 - t) * (1 - t) * xs[0] + 3 * (1 - t) * (1 - t) * t * xs[1] +
      3 * (1 - t) * t * t * xs[2] + t * t * t * xs[3];
      var y = (1 - t) * (1 - t) * (1 - t) * ys[0] + 3 * (1 - t) * (1 - t) * t * ys[1] +
      3 * (1 - t) * t * t * ys[2] + t * t * t * ys[3];

      return {x: x, y: y};
    }

    function getQuadraticArcLength(xs, ys, t) {
      if (t === undefined) {
        t = 1;
      }
       var ax = xs[0] - 2 * xs[1] + xs[2];
       var ay = ys[0] - 2 * ys[1] + ys[2];
       var bx = 2 * xs[1] - 2 * xs[0];
       var by = 2 * ys[1] - 2 * ys[0];

       var A = 4 * (ax * ax + ay * ay);
       var B = 4 * (ax * bx + ay * by);
       var C = bx * bx + by * by;

       if(A === 0){
         return t * Math.sqrt(Math.pow(xs[2] - xs[0], 2) + Math.pow(ys[2] - ys[0], 2));
       }
       var b = B/(2*A);
       var c = C/A;
       var u = t + b;
       var k = c - b*b;

       return (Math.sqrt(A)/2)*(
         u*Math.sqrt(u*u+k)-b*Math.sqrt(b*b+k)+
         k*Math.log(Math.abs(
           (u+Math.sqrt(u*u+k))/(b+Math.sqrt(b*b+k))
         ))
       );

    }

    // Legendre-Gauss abscissae (xi values, defined at i=n as the roots of the nth order Legendre polynomial Pn(x))
    var tValues = [
      [],
      [],
      [-0.5773502691896257645091487805019574556476,0.5773502691896257645091487805019574556476],
      [0,-0.7745966692414833770358530799564799221665,0.7745966692414833770358530799564799221665],
      [-0.3399810435848562648026657591032446872005,0.3399810435848562648026657591032446872005,-0.8611363115940525752239464888928095050957,0.8611363115940525752239464888928095050957],
      [0,-0.5384693101056830910363144207002088049672,0.5384693101056830910363144207002088049672,-0.9061798459386639927976268782993929651256,0.9061798459386639927976268782993929651256],
      [0.6612093864662645136613995950199053470064,-0.6612093864662645136613995950199053470064,-0.2386191860831969086305017216807119354186,0.2386191860831969086305017216807119354186,-0.9324695142031520278123015544939946091347,0.9324695142031520278123015544939946091347],
      [0, 0.4058451513773971669066064120769614633473,-0.4058451513773971669066064120769614633473,-0.7415311855993944398638647732807884070741,0.7415311855993944398638647732807884070741,-0.9491079123427585245261896840478512624007,0.9491079123427585245261896840478512624007],
      [-0.1834346424956498049394761423601839806667,0.1834346424956498049394761423601839806667,-0.5255324099163289858177390491892463490419,0.5255324099163289858177390491892463490419,-0.7966664774136267395915539364758304368371,0.7966664774136267395915539364758304368371,-0.9602898564975362316835608685694729904282,0.9602898564975362316835608685694729904282],
      [0,-0.8360311073266357942994297880697348765441,0.8360311073266357942994297880697348765441,-0.9681602395076260898355762029036728700494,0.9681602395076260898355762029036728700494,-0.3242534234038089290385380146433366085719,0.3242534234038089290385380146433366085719,-0.6133714327005903973087020393414741847857,0.6133714327005903973087020393414741847857],
      [-0.1488743389816312108848260011297199846175,0.1488743389816312108848260011297199846175,-0.4333953941292471907992659431657841622000,0.4333953941292471907992659431657841622000,-0.6794095682990244062343273651148735757692,0.6794095682990244062343273651148735757692,-0.8650633666889845107320966884234930485275,0.8650633666889845107320966884234930485275,-0.9739065285171717200779640120844520534282,0.9739065285171717200779640120844520534282],
      [0,-0.2695431559523449723315319854008615246796,0.2695431559523449723315319854008615246796,-0.5190961292068118159257256694586095544802,0.5190961292068118159257256694586095544802,-0.7301520055740493240934162520311534580496,0.7301520055740493240934162520311534580496,-0.8870625997680952990751577693039272666316,0.8870625997680952990751577693039272666316,-0.9782286581460569928039380011228573907714,0.9782286581460569928039380011228573907714],
      [-0.1252334085114689154724413694638531299833,0.1252334085114689154724413694638531299833,-0.3678314989981801937526915366437175612563,0.3678314989981801937526915366437175612563,-0.5873179542866174472967024189405342803690,0.5873179542866174472967024189405342803690,-0.7699026741943046870368938332128180759849,0.7699026741943046870368938332128180759849,-0.9041172563704748566784658661190961925375,0.9041172563704748566784658661190961925375,-0.9815606342467192506905490901492808229601,0.9815606342467192506905490901492808229601],
      [0,-0.2304583159551347940655281210979888352115,0.2304583159551347940655281210979888352115,-0.4484927510364468528779128521276398678019,0.4484927510364468528779128521276398678019,-0.6423493394403402206439846069955156500716,0.6423493394403402206439846069955156500716,-0.8015780907333099127942064895828598903056,0.8015780907333099127942064895828598903056,-0.9175983992229779652065478365007195123904,0.9175983992229779652065478365007195123904,-0.9841830547185881494728294488071096110649,0.9841830547185881494728294488071096110649],
      [-0.1080549487073436620662446502198347476119,0.1080549487073436620662446502198347476119,-0.3191123689278897604356718241684754668342,0.3191123689278897604356718241684754668342,-0.5152486363581540919652907185511886623088,0.5152486363581540919652907185511886623088,-0.6872929048116854701480198030193341375384,0.6872929048116854701480198030193341375384,-0.8272013150697649931897947426503949610397,0.8272013150697649931897947426503949610397,-0.9284348836635735173363911393778742644770,0.9284348836635735173363911393778742644770,-0.9862838086968123388415972667040528016760,0.9862838086968123388415972667040528016760],
      [0,-0.2011940939974345223006283033945962078128,0.2011940939974345223006283033945962078128,-0.3941513470775633698972073709810454683627,0.3941513470775633698972073709810454683627,-0.5709721726085388475372267372539106412383,0.5709721726085388475372267372539106412383,-0.7244177313601700474161860546139380096308,0.7244177313601700474161860546139380096308,-0.8482065834104272162006483207742168513662,0.8482065834104272162006483207742168513662,-0.9372733924007059043077589477102094712439,0.9372733924007059043077589477102094712439,-0.9879925180204854284895657185866125811469,0.9879925180204854284895657185866125811469],
      [-0.0950125098376374401853193354249580631303,0.0950125098376374401853193354249580631303,-0.2816035507792589132304605014604961064860,0.2816035507792589132304605014604961064860,-0.4580167776572273863424194429835775735400,0.4580167776572273863424194429835775735400,-0.6178762444026437484466717640487910189918,0.6178762444026437484466717640487910189918,-0.7554044083550030338951011948474422683538,0.7554044083550030338951011948474422683538,-0.8656312023878317438804678977123931323873,0.8656312023878317438804678977123931323873,-0.9445750230732325760779884155346083450911,0.9445750230732325760779884155346083450911,-0.9894009349916499325961541734503326274262,0.9894009349916499325961541734503326274262],
      [0,-0.1784841814958478558506774936540655574754,0.1784841814958478558506774936540655574754,-0.3512317634538763152971855170953460050405,0.3512317634538763152971855170953460050405,-0.5126905370864769678862465686295518745829,0.5126905370864769678862465686295518745829,-0.6576711592166907658503022166430023351478,0.6576711592166907658503022166430023351478,-0.7815140038968014069252300555204760502239,0.7815140038968014069252300555204760502239,-0.8802391537269859021229556944881556926234,0.8802391537269859021229556944881556926234,-0.9506755217687677612227169578958030214433,0.9506755217687677612227169578958030214433,-0.9905754753144173356754340199406652765077,0.9905754753144173356754340199406652765077],
      [-0.0847750130417353012422618529357838117333,0.0847750130417353012422618529357838117333,-0.2518862256915055095889728548779112301628,0.2518862256915055095889728548779112301628,-0.4117511614628426460359317938330516370789,0.4117511614628426460359317938330516370789,-0.5597708310739475346078715485253291369276,0.5597708310739475346078715485253291369276,-0.6916870430603532078748910812888483894522,0.6916870430603532078748910812888483894522,-0.8037049589725231156824174550145907971032,0.8037049589725231156824174550145907971032,-0.8926024664975557392060605911271455154078,0.8926024664975557392060605911271455154078,-0.9558239495713977551811958929297763099728,0.9558239495713977551811958929297763099728,-0.9915651684209309467300160047061507702525,0.9915651684209309467300160047061507702525],
      [0,-0.1603586456402253758680961157407435495048,0.1603586456402253758680961157407435495048,-0.3165640999636298319901173288498449178922,0.3165640999636298319901173288498449178922,-0.4645707413759609457172671481041023679762,0.4645707413759609457172671481041023679762,-0.6005453046616810234696381649462392798683,0.6005453046616810234696381649462392798683,-0.7209661773352293786170958608237816296571,0.7209661773352293786170958608237816296571,-0.8227146565371428249789224867127139017745,0.8227146565371428249789224867127139017745,-0.9031559036148179016426609285323124878093,0.9031559036148179016426609285323124878093,-0.9602081521348300308527788406876515266150,0.9602081521348300308527788406876515266150,-0.9924068438435844031890176702532604935893,0.9924068438435844031890176702532604935893],
      [-0.0765265211334973337546404093988382110047,0.0765265211334973337546404093988382110047,-0.2277858511416450780804961953685746247430,0.2277858511416450780804961953685746247430,-0.3737060887154195606725481770249272373957,0.3737060887154195606725481770249272373957,-0.5108670019508270980043640509552509984254,0.5108670019508270980043640509552509984254,-0.6360536807265150254528366962262859367433,0.6360536807265150254528366962262859367433,-0.7463319064601507926143050703556415903107,0.7463319064601507926143050703556415903107,-0.8391169718222188233945290617015206853296,0.8391169718222188233945290617015206853296,-0.9122344282513259058677524412032981130491,0.9122344282513259058677524412032981130491,-0.9639719272779137912676661311972772219120,0.9639719272779137912676661311972772219120,-0.9931285991850949247861223884713202782226,0.9931285991850949247861223884713202782226],
      [0,-0.1455618541608950909370309823386863301163,0.1455618541608950909370309823386863301163,-0.2880213168024010966007925160646003199090,0.2880213168024010966007925160646003199090,-0.4243421202074387835736688885437880520964,0.4243421202074387835736688885437880520964,-0.5516188358872198070590187967243132866220,0.5516188358872198070590187967243132866220,-0.6671388041974123193059666699903391625970,0.6671388041974123193059666699903391625970,-0.7684399634756779086158778513062280348209,0.7684399634756779086158778513062280348209,-0.8533633645833172836472506385875676702761,0.8533633645833172836472506385875676702761,-0.9200993341504008287901871337149688941591,0.9200993341504008287901871337149688941591,-0.9672268385663062943166222149076951614246,0.9672268385663062943166222149076951614246,-0.9937521706203895002602420359379409291933,0.9937521706203895002602420359379409291933],
      [-0.0697392733197222212138417961186280818222,0.0697392733197222212138417961186280818222,-0.2078604266882212854788465339195457342156,0.2078604266882212854788465339195457342156,-0.3419358208920842251581474204273796195591,0.3419358208920842251581474204273796195591,-0.4693558379867570264063307109664063460953,0.4693558379867570264063307109664063460953,-0.5876404035069115929588769276386473488776,0.5876404035069115929588769276386473488776,-0.6944872631866827800506898357622567712673,0.6944872631866827800506898357622567712673,-0.7878168059792081620042779554083515213881,0.7878168059792081620042779554083515213881,-0.8658125777203001365364256370193787290847,0.8658125777203001365364256370193787290847,-0.9269567721871740005206929392590531966353,0.9269567721871740005206929392590531966353,-0.9700604978354287271239509867652687108059,0.9700604978354287271239509867652687108059,-0.9942945854823992920730314211612989803930,0.9942945854823992920730314211612989803930],
      [0,-0.1332568242984661109317426822417661370104,0.1332568242984661109317426822417661370104,-0.2641356809703449305338695382833096029790,0.2641356809703449305338695382833096029790,-0.3903010380302908314214888728806054585780,0.3903010380302908314214888728806054585780,-0.5095014778460075496897930478668464305448,0.5095014778460075496897930478668464305448,-0.6196098757636461563850973116495956533871,0.6196098757636461563850973116495956533871,-0.7186613631319501944616244837486188483299,0.7186613631319501944616244837486188483299,-0.8048884016188398921511184069967785579414,0.8048884016188398921511184069967785579414,-0.8767523582704416673781568859341456716389,0.8767523582704416673781568859341456716389,-0.9329710868260161023491969890384229782357,0.9329710868260161023491969890384229782357,-0.9725424712181152319560240768207773751816,0.9725424712181152319560240768207773751816,-0.9947693349975521235239257154455743605736,0.9947693349975521235239257154455743605736],
      [-0.0640568928626056260850430826247450385909,0.0640568928626056260850430826247450385909,-0.1911188674736163091586398207570696318404,0.1911188674736163091586398207570696318404,-0.3150426796961633743867932913198102407864,0.3150426796961633743867932913198102407864,-0.4337935076260451384870842319133497124524,0.4337935076260451384870842319133497124524,-0.5454214713888395356583756172183723700107,0.5454214713888395356583756172183723700107,-0.6480936519369755692524957869107476266696,0.6480936519369755692524957869107476266696,-0.7401241915785543642438281030999784255232,0.7401241915785543642438281030999784255232,-0.8200019859739029219539498726697452080761,0.8200019859739029219539498726697452080761,-0.8864155270044010342131543419821967550873,0.8864155270044010342131543419821967550873,-0.9382745520027327585236490017087214496548,0.9382745520027327585236490017087214496548,-0.9747285559713094981983919930081690617411,0.9747285559713094981983919930081690617411,-0.9951872199970213601799974097007368118745,0.9951872199970213601799974097007368118745]
    ];

    // Legendre-Gauss weights (wi values, defined by a function linked to in the Bezier primer article)
    var cValues = [
      [],[],
      [1.0,1.0],
      [0.8888888888888888888888888888888888888888,0.5555555555555555555555555555555555555555,0.5555555555555555555555555555555555555555],
      [0.6521451548625461426269360507780005927646,0.6521451548625461426269360507780005927646,0.3478548451374538573730639492219994072353,0.3478548451374538573730639492219994072353],
      [0.5688888888888888888888888888888888888888,0.4786286704993664680412915148356381929122,0.4786286704993664680412915148356381929122,0.2369268850561890875142640407199173626432,0.2369268850561890875142640407199173626432],
      [0.3607615730481386075698335138377161116615,0.3607615730481386075698335138377161116615,0.4679139345726910473898703439895509948116,0.4679139345726910473898703439895509948116,0.1713244923791703450402961421727328935268,0.1713244923791703450402961421727328935268],
      [0.4179591836734693877551020408163265306122,0.3818300505051189449503697754889751338783,0.3818300505051189449503697754889751338783,0.2797053914892766679014677714237795824869,0.2797053914892766679014677714237795824869,0.1294849661688696932706114326790820183285,0.1294849661688696932706114326790820183285],
      [0.3626837833783619829651504492771956121941,0.3626837833783619829651504492771956121941,0.3137066458778872873379622019866013132603,0.3137066458778872873379622019866013132603,0.2223810344533744705443559944262408844301,0.2223810344533744705443559944262408844301,0.1012285362903762591525313543099621901153,0.1012285362903762591525313543099621901153],
      [0.3302393550012597631645250692869740488788,0.1806481606948574040584720312429128095143,0.1806481606948574040584720312429128095143,0.0812743883615744119718921581105236506756,0.0812743883615744119718921581105236506756,0.3123470770400028400686304065844436655987,0.3123470770400028400686304065844436655987,0.2606106964029354623187428694186328497718,0.2606106964029354623187428694186328497718],
      [0.2955242247147528701738929946513383294210,0.2955242247147528701738929946513383294210,0.2692667193099963550912269215694693528597,0.2692667193099963550912269215694693528597,0.2190863625159820439955349342281631924587,0.2190863625159820439955349342281631924587,0.1494513491505805931457763396576973324025,0.1494513491505805931457763396576973324025,0.0666713443086881375935688098933317928578,0.0666713443086881375935688098933317928578],
      [0.2729250867779006307144835283363421891560,0.2628045445102466621806888698905091953727,0.2628045445102466621806888698905091953727,0.2331937645919904799185237048431751394317,0.2331937645919904799185237048431751394317,0.1862902109277342514260976414316558916912,0.1862902109277342514260976414316558916912,0.1255803694649046246346942992239401001976,0.1255803694649046246346942992239401001976,0.0556685671161736664827537204425485787285,0.0556685671161736664827537204425485787285],
      [0.2491470458134027850005624360429512108304,0.2491470458134027850005624360429512108304,0.2334925365383548087608498989248780562594,0.2334925365383548087608498989248780562594,0.2031674267230659217490644558097983765065,0.2031674267230659217490644558097983765065,0.1600783285433462263346525295433590718720,0.1600783285433462263346525295433590718720,0.1069393259953184309602547181939962242145,0.1069393259953184309602547181939962242145,0.0471753363865118271946159614850170603170,0.0471753363865118271946159614850170603170],
      [0.2325515532308739101945895152688359481566,0.2262831802628972384120901860397766184347,0.2262831802628972384120901860397766184347,0.2078160475368885023125232193060527633865,0.2078160475368885023125232193060527633865,0.1781459807619457382800466919960979955128,0.1781459807619457382800466919960979955128,0.1388735102197872384636017768688714676218,0.1388735102197872384636017768688714676218,0.0921214998377284479144217759537971209236,0.0921214998377284479144217759537971209236,0.0404840047653158795200215922009860600419,0.0404840047653158795200215922009860600419],
      [0.2152638534631577901958764433162600352749,0.2152638534631577901958764433162600352749,0.2051984637212956039659240656612180557103,0.2051984637212956039659240656612180557103,0.1855383974779378137417165901251570362489,0.1855383974779378137417165901251570362489,0.1572031671581935345696019386238421566056,0.1572031671581935345696019386238421566056,0.1215185706879031846894148090724766259566,0.1215185706879031846894148090724766259566,0.0801580871597602098056332770628543095836,0.0801580871597602098056332770628543095836,0.0351194603317518630318328761381917806197,0.0351194603317518630318328761381917806197],
      [0.2025782419255612728806201999675193148386,0.1984314853271115764561183264438393248186,0.1984314853271115764561183264438393248186,0.1861610000155622110268005618664228245062,0.1861610000155622110268005618664228245062,0.1662692058169939335532008604812088111309,0.1662692058169939335532008604812088111309,0.1395706779261543144478047945110283225208,0.1395706779261543144478047945110283225208,0.1071592204671719350118695466858693034155,0.1071592204671719350118695466858693034155,0.0703660474881081247092674164506673384667,0.0703660474881081247092674164506673384667,0.0307532419961172683546283935772044177217,0.0307532419961172683546283935772044177217],
      [0.1894506104550684962853967232082831051469,0.1894506104550684962853967232082831051469,0.1826034150449235888667636679692199393835,0.1826034150449235888667636679692199393835,0.1691565193950025381893120790303599622116,0.1691565193950025381893120790303599622116,0.1495959888165767320815017305474785489704,0.1495959888165767320815017305474785489704,0.1246289712555338720524762821920164201448,0.1246289712555338720524762821920164201448,0.0951585116824927848099251076022462263552,0.0951585116824927848099251076022462263552,0.0622535239386478928628438369943776942749,0.0622535239386478928628438369943776942749,0.0271524594117540948517805724560181035122,0.0271524594117540948517805724560181035122],
      [0.1794464703562065254582656442618856214487,0.1765627053669926463252709901131972391509,0.1765627053669926463252709901131972391509,0.1680041021564500445099706637883231550211,0.1680041021564500445099706637883231550211,0.1540457610768102880814315948019586119404,0.1540457610768102880814315948019586119404,0.1351363684685254732863199817023501973721,0.1351363684685254732863199817023501973721,0.1118838471934039710947883856263559267358,0.1118838471934039710947883856263559267358,0.0850361483171791808835353701910620738504,0.0850361483171791808835353701910620738504,0.0554595293739872011294401653582446605128,0.0554595293739872011294401653582446605128,0.0241483028685479319601100262875653246916,0.0241483028685479319601100262875653246916],
      [0.1691423829631435918406564701349866103341,0.1691423829631435918406564701349866103341,0.1642764837458327229860537764659275904123,0.1642764837458327229860537764659275904123,0.1546846751262652449254180038363747721932,0.1546846751262652449254180038363747721932,0.1406429146706506512047313037519472280955,0.1406429146706506512047313037519472280955,0.1225552067114784601845191268002015552281,0.1225552067114784601845191268002015552281,0.1009420441062871655628139849248346070628,0.1009420441062871655628139849248346070628,0.0764257302548890565291296776166365256053,0.0764257302548890565291296776166365256053,0.0497145488949697964533349462026386416808,0.0497145488949697964533349462026386416808,0.0216160135264833103133427102664524693876,0.0216160135264833103133427102664524693876],
      [0.1610544498487836959791636253209167350399,0.1589688433939543476499564394650472016787,0.1589688433939543476499564394650472016787,0.1527660420658596667788554008976629984610,0.1527660420658596667788554008976629984610,0.1426067021736066117757461094419029724756,0.1426067021736066117757461094419029724756,0.1287539625393362276755157848568771170558,0.1287539625393362276755157848568771170558,0.1115666455473339947160239016817659974813,0.1115666455473339947160239016817659974813,0.0914900216224499994644620941238396526609,0.0914900216224499994644620941238396526609,0.0690445427376412265807082580060130449618,0.0690445427376412265807082580060130449618,0.0448142267656996003328381574019942119517,0.0448142267656996003328381574019942119517,0.0194617882297264770363120414644384357529,0.0194617882297264770363120414644384357529],
      [0.1527533871307258506980843319550975934919,0.1527533871307258506980843319550975934919,0.1491729864726037467878287370019694366926,0.1491729864726037467878287370019694366926,0.1420961093183820513292983250671649330345,0.1420961093183820513292983250671649330345,0.1316886384491766268984944997481631349161,0.1316886384491766268984944997481631349161,0.1181945319615184173123773777113822870050,0.1181945319615184173123773777113822870050,0.1019301198172404350367501354803498761666,0.1019301198172404350367501354803498761666,0.0832767415767047487247581432220462061001,0.0832767415767047487247581432220462061001,0.0626720483341090635695065351870416063516,0.0626720483341090635695065351870416063516,0.0406014298003869413310399522749321098790,0.0406014298003869413310399522749321098790,0.0176140071391521183118619623518528163621,0.0176140071391521183118619623518528163621],
      [0.1460811336496904271919851476833711882448,0.1445244039899700590638271665537525436099,0.1445244039899700590638271665537525436099,0.1398873947910731547221334238675831108927,0.1398873947910731547221334238675831108927,0.1322689386333374617810525744967756043290,0.1322689386333374617810525744967756043290,0.1218314160537285341953671771257335983563,0.1218314160537285341953671771257335983563,0.1087972991671483776634745780701056420336,0.1087972991671483776634745780701056420336,0.0934444234560338615532897411139320884835,0.0934444234560338615532897411139320884835,0.0761001136283793020170516533001831792261,0.0761001136283793020170516533001831792261,0.0571344254268572082836358264724479574912,0.0571344254268572082836358264724479574912,0.0369537897708524937999506682993296661889,0.0369537897708524937999506682993296661889,0.0160172282577743333242246168584710152658,0.0160172282577743333242246168584710152658],
      [0.1392518728556319933754102483418099578739,0.1392518728556319933754102483418099578739,0.1365414983460151713525738312315173965863,0.1365414983460151713525738312315173965863,0.1311735047870623707329649925303074458757,0.1311735047870623707329649925303074458757,0.1232523768105124242855609861548144719594,0.1232523768105124242855609861548144719594,0.1129322960805392183934006074217843191142,0.1129322960805392183934006074217843191142,0.1004141444428809649320788378305362823508,0.1004141444428809649320788378305362823508,0.0859416062170677274144436813727028661891,0.0859416062170677274144436813727028661891,0.0697964684245204880949614189302176573987,0.0697964684245204880949614189302176573987,0.0522933351526832859403120512732112561121,0.0522933351526832859403120512732112561121,0.0337749015848141547933022468659129013491,0.0337749015848141547933022468659129013491,0.0146279952982722006849910980471854451902,0.0146279952982722006849910980471854451902],
      [0.1336545721861061753514571105458443385831,0.1324620394046966173716424647033169258050,0.1324620394046966173716424647033169258050,0.1289057221880821499785953393997936532597,0.1289057221880821499785953393997936532597,0.1230490843067295304675784006720096548158,0.1230490843067295304675784006720096548158,0.1149966402224113649416435129339613014914,0.1149966402224113649416435129339613014914,0.1048920914645414100740861850147438548584,0.1048920914645414100740861850147438548584,0.0929157660600351474770186173697646486034,0.0929157660600351474770186173697646486034,0.0792814117767189549228925247420432269137,0.0792814117767189549228925247420432269137,0.0642324214085258521271696151589109980391,0.0642324214085258521271696151589109980391,0.0480376717310846685716410716320339965612,0.0480376717310846685716410716320339965612,0.0309880058569794443106942196418845053837,0.0309880058569794443106942196418845053837,0.0134118594871417720813094934586150649766,0.0134118594871417720813094934586150649766],
      [0.1279381953467521569740561652246953718517,0.1279381953467521569740561652246953718517,0.1258374563468282961213753825111836887264,0.1258374563468282961213753825111836887264,0.1216704729278033912044631534762624256070,0.1216704729278033912044631534762624256070,0.1155056680537256013533444839067835598622,0.1155056680537256013533444839067835598622,0.1074442701159656347825773424466062227946,0.1074442701159656347825773424466062227946,0.0976186521041138882698806644642471544279,0.0976186521041138882698806644642471544279,0.0861901615319532759171852029837426671850,0.0861901615319532759171852029837426671850,0.0733464814110803057340336152531165181193,0.0733464814110803057340336152531165181193,0.0592985849154367807463677585001085845412,0.0592985849154367807463677585001085845412,0.0442774388174198061686027482113382288593,0.0442774388174198061686027482113382288593,0.0285313886289336631813078159518782864491,0.0285313886289336631813078159518782864491,0.0123412297999871995468056670700372915759,0.0123412297999871995468056670700372915759]
    ];

    // LUT for binomial coefficient arrays per curve order 'n'
    var binomialCoefficients = [[1], [1, 1], [1, 2, 1], [1, 3, 3, 1]];

    // Look up what the binomial coefficient is for pair {n,k}
    function binomials(n, k) {
      return binomialCoefficients[n][k];
    }

    /**
     * Compute the curve derivative (hodograph) at t.
     */
    function getDerivative(derivative, t, vs) {
      // the derivative of any 't'-less function is zero.
      var n = vs.length - 1,
          _vs,
          value,
          k;
      if (n === 0) {
        return 0;
      }

      // direct values? compute!
      if (derivative === 0) {
        value = 0;
        for (k = 0; k <= n; k++) {
          value += binomials(n, k) * Math.pow(1 - t, n - k) * Math.pow(t, k) * vs[k];
        }
        return value;
      } else {
        // Still some derivative? go down one order, then try
        // for the lower order curve's.
        _vs = new Array(n);
        for (k = 0; k < n; k++) {
          _vs[k] = n * (vs[k + 1] - vs[k]);
        }
        return getDerivative(derivative - 1, t, _vs);
      }
    }

    function B(xs, ys, t) {
      var xbase = getDerivative(1, t, xs);
      var ybase = getDerivative(1, t, ys);
      var combined = xbase * xbase + ybase * ybase;
      return Math.sqrt(combined);
    }

    function getCubicArcLength(xs, ys, t) {
      var z, sum, i, correctedT;

      /*if (xs.length >= tValues.length) {
        throw new Error('too high n bezier');
      }*/

      if (t === undefined) {
        t = 1;
      }
      var n = 20;

      z = t / 2;
      sum = 0;
      for (i = 0; i < n; i++) {
        correctedT = z * tValues[n][i] + z;
        sum += cValues[n][i] * B(xs, ys, correctedT);
      }
      return z * sum;
    }

    //This file is taken from the following project: https://github.com/fontello/svgpath
    // Convert an arc to a sequence of cubic bézier curves
    //
    var TAU = Math.PI * 2;


    /* eslint-disable space-infix-ops */

    // Calculate an angle between two unit vectors
    //
    // Since we measure angle between radii of circular arcs,
    // we can use simplified math (without length normalization)
    //
    function unit_vector_angle(ux, uy, vx, vy) {
      var sign = (ux * vy - uy * vx < 0) ? -1 : 1;
      var dot  = ux * vx + uy * vy;

      // Add this to work with arbitrary vectors:
      // dot /= Math.sqrt(ux * ux + uy * uy) * Math.sqrt(vx * vx + vy * vy);

      // rounding errors, e.g. -1.0000000000000002 can screw up this
      if (dot >  1.0) { dot =  1.0; }
      if (dot < -1.0) { dot = -1.0; }

      return sign * Math.acos(dot);
    }


    // Convert from endpoint to center parameterization,
    // see http://www.w3.org/TR/SVG11/implnote.html#ArcImplementationNotes
    //
    // Return [cx, cy, theta1, delta_theta]
    //
    function get_arc_center(x1, y1, x2, y2, fa, fs, rx, ry, sin_phi, cos_phi) {
      // Step 1.
      //
      // Moving an ellipse so origin will be the middlepoint between our two
      // points. After that, rotate it to line up ellipse axes with coordinate
      // axes.
      //
      var x1p =  cos_phi*(x1-x2)/2 + sin_phi*(y1-y2)/2;
      var y1p = -sin_phi*(x1-x2)/2 + cos_phi*(y1-y2)/2;

      var rx_sq  =  rx * rx;
      var ry_sq  =  ry * ry;
      var x1p_sq = x1p * x1p;
      var y1p_sq = y1p * y1p;

      // Step 2.
      //
      // Compute coordinates of the centre of this ellipse (cx', cy')
      // in the new coordinate system.
      //
      var radicant = (rx_sq * ry_sq) - (rx_sq * y1p_sq) - (ry_sq * x1p_sq);

      if (radicant < 0) {
        // due to rounding errors it might be e.g. -1.3877787807814457e-17
        radicant = 0;
      }

      radicant /=   (rx_sq * y1p_sq) + (ry_sq * x1p_sq);
      radicant = Math.sqrt(radicant) * (fa === fs ? -1 : 1);

      var cxp = radicant *  rx/ry * y1p;
      var cyp = radicant * -ry/rx * x1p;

      // Step 3.
      //
      // Transform back to get centre coordinates (cx, cy) in the original
      // coordinate system.
      //
      var cx = cos_phi*cxp - sin_phi*cyp + (x1+x2)/2;
      var cy = sin_phi*cxp + cos_phi*cyp + (y1+y2)/2;

      // Step 4.
      //
      // Compute angles (theta1, delta_theta).
      //
      var v1x =  (x1p - cxp) / rx;
      var v1y =  (y1p - cyp) / ry;
      var v2x = (-x1p - cxp) / rx;
      var v2y = (-y1p - cyp) / ry;

      var theta1 = unit_vector_angle(1, 0, v1x, v1y);
      var delta_theta = unit_vector_angle(v1x, v1y, v2x, v2y);

      if (fs === 0 && delta_theta > 0) {
        delta_theta -= TAU;
      }
      if (fs === 1 && delta_theta < 0) {
        delta_theta += TAU;
      }

      return [ cx, cy, theta1, delta_theta ];
    }

    //
    // Approximate one unit arc segment with bézier curves,
    // see http://math.stackexchange.com/questions/873224
    //
    function approximate_unit_arc(theta1, delta_theta) {
      var alpha = 4/3 * Math.tan(delta_theta/4);

      var x1 = Math.cos(theta1);
      var y1 = Math.sin(theta1);
      var x2 = Math.cos(theta1 + delta_theta);
      var y2 = Math.sin(theta1 + delta_theta);

      return [ x1, y1, x1 - y1*alpha, y1 + x1*alpha, x2 + y2*alpha, y2 - x2*alpha, x2, y2 ];
    }

    var a2c = function(x1, y1, rx, ry, phi, fa, fs, x2, y2) {
      var sin_phi = Math.sin(phi * TAU / 360);
      var cos_phi = Math.cos(phi * TAU / 360);

      // Make sure radii are valid
      //
      var x1p =  cos_phi*(x1-x2)/2 + sin_phi*(y1-y2)/2;
      var y1p = -sin_phi*(x1-x2)/2 + cos_phi*(y1-y2)/2;

      if (x1p === 0 && y1p === 0) {
        // we're asked to draw line to itself
        return [];
      }

      if (rx === 0 || ry === 0) {
        // one of the radii is zero
        return [];
      }


      // Compensate out-of-range radii
      //
      rx = Math.abs(rx);
      ry = Math.abs(ry);

      var lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
      if (lambda > 1) {
        rx *= Math.sqrt(lambda);
        ry *= Math.sqrt(lambda);
      }


      // Get center parameters (cx, cy, theta1, delta_theta)
      //
      var cc = get_arc_center(x1, y1, x2, y2, fa, fs, rx, ry, sin_phi, cos_phi);

      var result = [];
      var theta1 = cc[2];
      var delta_theta = cc[3];

      // Split an arc to multiple segments, so each segment
      // will be less than τ/4 (= 90°)
      //
      var segments = Math.max(Math.ceil(Math.abs(delta_theta) / (TAU / 4)), 1);
      delta_theta /= segments;

      for (var i = 0; i < segments; i++) {
        result.push(approximate_unit_arc(theta1, delta_theta));
        theta1 += delta_theta;
      }

      // We have a bezier approximation of a unit circle,
      // now need to transform back to the original ellipse
      //
      return result.map(function (curve) {
        for (var i = 0; i < curve.length; i += 2) {
          var x = curve[i + 0];
          var y = curve[i + 1];

          // scale
          x *= rx;
          y *= ry;

          // rotate
          var xp = cos_phi*x - sin_phi*y;
          var yp = sin_phi*x + cos_phi*y;

          // translate
          curve[i + 0] = xp + cc[0];
          curve[i + 1] = yp + cc[1];
        }

        return curve;
      });
    };

    //Calculate ans Arc curve length and positionAtLength
    //Definitions taken from https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths
    var Arc = function(x0, y0, rx,ry, xAxisRotate, LargeArcFlag,SweepFlag, x,y) {
      return new Arc$1(x0, y0, rx,ry, xAxisRotate, LargeArcFlag,SweepFlag, x,y);
    };

    function Arc$1(x0, y0,rx,ry, xAxisRotate, LargeArcFlag,SweepFlag,x,y) {
        var length = 0;
        var partialLengths = [];
        var curves = [];
        var res = a2c(x0, y0,rx,ry, xAxisRotate, LargeArcFlag,SweepFlag,x,y);
        res.forEach(function(d){
            var curve = new Bezier(d[0], d[1], d[2], d[3], d[4], d[5], d[6], d[7]);
            var curveLength = curve.getTotalLength();
            length += curveLength;
            partialLengths.push(curveLength);
            curves.push(curve);
        });
        this.length = length;
        this.partialLengths = partialLengths;
        this.curves = curves;
    }

    Arc$1.prototype = {
      constructor: Arc$1,
      init: function() {

        
      },

      getTotalLength: function() {
        return this.length;
      },
      getPointAtLength: function(fractionLength) {
        
        if(fractionLength < 0){
          fractionLength = 0;
        } else if(fractionLength > this.length){
          fractionLength = this.length;
        }
        var i = this.partialLengths.length - 1;

        while(this.partialLengths[i] >= fractionLength && this.partialLengths[i] > 0){
          i--;
        }
        if(i<this.partialLengths.length-1){
            i++;
        }

        var lengthOffset = 0;
        for(var j=0; j<i; j++){
            lengthOffset += this.partialLengths[j];
        }

        return this.curves[i].getPointAtLength(fractionLength - lengthOffset);
      },
      getTangentAtLength: function(fractionLength) {
        if(fractionLength < 0){
            fractionLength = 0;
            } else if(fractionLength > this.length){
            fractionLength = this.length;
            }
            var i = this.partialLengths.length - 1;

            while(this.partialLengths[i] >= fractionLength && this.partialLengths[i] > 0){
            i--;
            }
            if(i<this.partialLengths.length-1){
                i++;
            }

            var lengthOffset = 0;
            for(var j=0; j<i; j++){
                lengthOffset += this.partialLengths[j];
            }

        return this.curves[i].getTangentAtLength(fractionLength - lengthOffset);
      },
      getPropertiesAtLength: function(fractionLength){
        var tangent = this.getTangentAtLength(fractionLength);
        var point = this.getPointAtLength(fractionLength);
        return {x: point.x, y: point.y, tangentX: tangent.x, tangentY: tangent.y};
      }
    };

    var LinearPosition = function(x0, x1, y0, y1) {
      return new LinearPosition$1(x0, x1, y0, y1);

    };

    function LinearPosition$1(x0, x1, y0, y1){
      this.x0 = x0;
      this.x1 = x1;
      this.y0 = y0;
      this.y1 = y1;
    }

    LinearPosition$1.prototype.getTotalLength = function(){
      return Math.sqrt(Math.pow(this.x0 - this.x1, 2) +
             Math.pow(this.y0 - this.y1, 2));
    };

    LinearPosition$1.prototype.getPointAtLength = function(pos){
      var fraction = pos/ (Math.sqrt(Math.pow(this.x0 - this.x1, 2) +
             Math.pow(this.y0 - this.y1, 2)));

      var newDeltaX = (this.x1 - this.x0)*fraction;
      var newDeltaY = (this.y1 - this.y0)*fraction;
      return { x: this.x0 + newDeltaX, y: this.y0 + newDeltaY };
    };
    LinearPosition$1.prototype.getTangentAtLength = function(){
      var module = Math.sqrt((this.x1 - this.x0) * (this.x1 - this.x0) +
                  (this.y1 - this.y0) * (this.y1 - this.y0));
      return { x: (this.x1 - this.x0)/module, y: (this.y1 - this.y0)/module };
    };
    LinearPosition$1.prototype.getPropertiesAtLength = function(pos){
      var point = this.getPointAtLength(pos);
      var tangent = this.getTangentAtLength();
      return {x: point.x, y: point.y, tangentX: tangent.x, tangentY: tangent.y};
    };

    var pathProperties = function(svgString) {
      var length = 0;
      var partial_lengths = [];
      var functions = [];

      function svgProperties(string){
        if(!string){return null;}
        var parsed = parse(string);
        var cur = [0, 0];
        var prev_point = [0, 0];
        var curve;
        var ringStart;
        for (var i = 0; i < parsed.length; i++){
          //moveTo
          if(parsed[i][0] === "M"){
            cur = [parsed[i][1], parsed[i][2]];
            ringStart = [cur[0], cur[1]];
            functions.push(null);
          } else if(parsed[i][0] === "m"){
            cur = [parsed[i][1] + cur[0], parsed[i][2] + cur[1]];
            ringStart = [cur[0], cur[1]];
            functions.push(null);
          }
          //lineTo
          else if(parsed[i][0] === "L"){
            length = length + Math.sqrt(Math.pow(cur[0] - parsed[i][1], 2) + Math.pow(cur[1] - parsed[i][2], 2));
            functions.push(new LinearPosition(cur[0], parsed[i][1], cur[1], parsed[i][2]));
            cur = [parsed[i][1], parsed[i][2]];
          } else if(parsed[i][0] === "l"){
            length = length + Math.sqrt(Math.pow(parsed[i][1], 2) + Math.pow(parsed[i][2], 2));
            functions.push(new LinearPosition(cur[0], parsed[i][1] + cur[0], cur[1], parsed[i][2] + cur[1]));
            cur = [parsed[i][1] + cur[0], parsed[i][2] + cur[1]];
          } else if(parsed[i][0] === "H"){
            length = length + Math.abs(cur[0] - parsed[i][1]);
            functions.push(new LinearPosition(cur[0], parsed[i][1], cur[1], cur[1]));
            cur[0] = parsed[i][1];
          } else if(parsed[i][0] === "h"){
            length = length + Math.abs(parsed[i][1]);
            functions.push(new LinearPosition(cur[0], cur[0] + parsed[i][1], cur[1], cur[1]));
            cur[0] = parsed[i][1] + cur[0];
          } else if(parsed[i][0] === "V"){
            length = length + Math.abs(cur[1] - parsed[i][1]);
            functions.push(new LinearPosition(cur[0], cur[0], cur[1], parsed[i][1]));
            cur[1] = parsed[i][1];
          } else if(parsed[i][0] === "v"){
            length = length + Math.abs(parsed[i][1]);
            functions.push(new LinearPosition(cur[0], cur[0], cur[1], cur[1] + parsed[i][1]));
            cur[1] = parsed[i][1] + cur[1];
          //Close path
          }  else if(parsed[i][0] === "z" || parsed[i][0] === "Z"){
            length = length + Math.sqrt(Math.pow(ringStart[0] - cur[0], 2) + Math.pow(ringStart[1] - cur[1], 2));
            functions.push(new LinearPosition(cur[0], ringStart[0], cur[1], ringStart[1]));
            cur = [ringStart[0], ringStart[1]];
          }
          //Cubic Bezier curves
          else if(parsed[i][0] === "C"){
            curve = new Bezier(cur[0], cur[1] , parsed[i][1], parsed[i][2] , parsed[i][3], parsed[i][4] , parsed[i][5], parsed[i][6]);
            length = length + curve.getTotalLength();
            cur = [parsed[i][5], parsed[i][6]];
            functions.push(curve);
          } else if(parsed[i][0] === "c"){
            curve = new Bezier(cur[0], cur[1] , cur[0] + parsed[i][1], cur[1] + parsed[i][2] , cur[0] + parsed[i][3], cur[1] + parsed[i][4] , cur[0] + parsed[i][5], cur[1] + parsed[i][6]);
            length = length + curve.getTotalLength();
            cur = [parsed[i][5] + cur[0], parsed[i][6] + cur[1]];
            functions.push(curve);
          } else if(parsed[i][0] === "S"){
            if(i>0 && ["C","c","S","s"].indexOf(parsed[i-1][0]) > -1){
              curve = new Bezier(cur[0], cur[1] , 2*cur[0] - parsed[i-1][parsed[i-1].length - 4], 2*cur[1] - parsed[i-1][parsed[i-1].length - 3], parsed[i][1], parsed[i][2] , parsed[i][3], parsed[i][4]);
            } else {
              curve = new Bezier(cur[0], cur[1] , cur[0], cur[1], parsed[i][1], parsed[i][2] , parsed[i][3], parsed[i][4]);
            }
            length = length + curve.getTotalLength();
            cur = [parsed[i][3], parsed[i][4]];
            functions.push(curve);
          }  else if(parsed[i][0] === "s"){ //240 225
            if(i>0 && ["C","c","S","s"].indexOf(parsed[i-1][0]) > -1){
              curve = new Bezier(cur[0], cur[1] , cur[0] + curve.d.x - curve.c.x, cur[1] + curve.d.y - curve.c.y, cur[0] + parsed[i][1], cur[1] + parsed[i][2] , cur[0] + parsed[i][3], cur[1] + parsed[i][4]);
            } else {
              curve = new Bezier(cur[0], cur[1] , cur[0], cur[1], cur[0] + parsed[i][1], cur[1] + parsed[i][2] , cur[0] + parsed[i][3], cur[1] + parsed[i][4]);
            }
            length = length + curve.getTotalLength();
            cur = [parsed[i][3] + cur[0], parsed[i][4] + cur[1]];
            functions.push(curve);
          }
          //Quadratic Bezier curves
          else if(parsed[i][0] === "Q"){
            if(cur[0] != parsed[i][1] && cur[1] != parsed[i][2]){
              curve = new Bezier(cur[0], cur[1] , parsed[i][1], parsed[i][2] , parsed[i][3], parsed[i][4]);
            } else {
              curve = new LinearPosition(parsed[i][1], parsed[i][3], parsed[i][2], parsed[i][4]);
            }
            length = length + curve.getTotalLength();
            functions.push(curve);
            cur = [parsed[i][3], parsed[i][4]];
            prev_point = [parsed[i][1], parsed[i][2]];

          }  else if(parsed[i][0] === "q"){
            if(!(parsed[i][1] == 0 && parsed[i][2] == 0)){
              curve = new Bezier(cur[0], cur[1] , cur[0] + parsed[i][1], cur[1] + parsed[i][2] , cur[0] + parsed[i][3], cur[1] + parsed[i][4]);
            } else {
              curve = new LinearPosition(cur[0] + parsed[i][1], cur[0] + parsed[i][3], cur[1] + parsed[i][2], cur[1] + parsed[i][4]);
            }
            length = length + curve.getTotalLength();
            prev_point = [cur[0] + parsed[i][1], cur[1] + parsed[i][2]];
            cur = [parsed[i][3] + cur[0], parsed[i][4] + cur[1]];
            functions.push(curve);
          } else if(parsed[i][0] === "T"){
            if(i>0 && ["Q","q","T","t"].indexOf(parsed[i-1][0]) > -1){
              curve = new Bezier(cur[0], cur[1] , 2 * cur[0] - prev_point[0] , 2 * cur[1] - prev_point[1] , parsed[i][1], parsed[i][2]);
            } else {
              curve = new LinearPosition(cur[0], parsed[i][1], cur[1], parsed[i][2]);
            }
            functions.push(curve);
            length = length + curve.getTotalLength();
            prev_point = [2 * cur[0] - prev_point[0] , 2 * cur[1] - prev_point[1]];
            cur = [parsed[i][1], parsed[i][2]];

          } else if(parsed[i][0] === "t"){
            if(i>0 && ["Q","q","T","t"].indexOf(parsed[i-1][0]) > -1){
              curve = new Bezier(cur[0], cur[1] , 2 * cur[0] - prev_point[0] , 2 * cur[1] - prev_point[1] , cur[0] + parsed[i][1], cur[1] + parsed[i][2]);
            } else {
              curve = new LinearPosition(cur[0], cur[0] + parsed[i][1], cur[1], cur[1] + parsed[i][2]);
            }
            length = length + curve.getTotalLength();
            prev_point = [2 * cur[0] - prev_point[0] , 2 * cur[1] - prev_point[1]];
            cur = [parsed[i][1] + cur[0], parsed[i][2] + cur[0]];
            functions.push(curve);
          } else if(parsed[i][0] === "A"){
            curve = new Arc(cur[0], cur[1], parsed[i][1], parsed[i][2], parsed[i][3], parsed[i][4], parsed[i][5], parsed[i][6], parsed[i][7]);

            length = length + curve.getTotalLength();
            cur = [parsed[i][6], parsed[i][7]];
            functions.push(curve);
          } else if(parsed[i][0] === "a"){
            curve = new Arc(cur[0], cur[1], parsed[i][1], parsed[i][2], parsed[i][3], parsed[i][4], parsed[i][5], cur[0] + parsed[i][6], cur[1] + parsed[i][7]);

            length = length + curve.getTotalLength();
            cur = [cur[0] + parsed[i][6], cur[1] + parsed[i][7]];
            functions.push(curve);
          }
          partial_lengths.push(length);

        }
        return svgProperties;
      }

     svgProperties.getTotalLength = function(){
        return length;
      };

      svgProperties.getPointAtLength = function(fractionLength){
        var fractionPart = getPartAtLength(fractionLength);
        return functions[fractionPart.i].getPointAtLength(fractionPart.fraction);
      };

      svgProperties.getTangentAtLength = function(fractionLength){
        var fractionPart = getPartAtLength(fractionLength);
        return functions[fractionPart.i].getTangentAtLength(fractionPart.fraction);
      };

      svgProperties.getPropertiesAtLength = function(fractionLength){
        var fractionPart = getPartAtLength(fractionLength);
        return functions[fractionPart.i].getPropertiesAtLength(fractionPart.fraction);
      };

      var getPartAtLength = function(fractionLength){
        if(fractionLength < 0){
          fractionLength = 0;
        } else if(fractionLength > length){
          fractionLength = length;
        }

        var i = partial_lengths.length - 1;

        while(partial_lengths[i] >= fractionLength && partial_lengths[i] > 0){
          i--;
        }
        i++;
        return {fraction: fractionLength-partial_lengths[i-1], i: i};
      };

      return svgProperties(svgString);
    };

    exports.svgPathProperties = pathProperties;
    exports.parse = parse;
    exports.Bezier = Bezier;

    Object.defineProperty(exports, '__esModule', { value: true });

    })));
    }(pathProperties, pathProperties.exports));

    function distance(a, b) {
      return Math.sqrt((a[0] - b[0]) * (a[0] - b[0]) + (a[1] - b[1]) * (a[1] - b[1]));
    }

    function pointAlong(a, b, pct) {
      return [a[0] + (b[0] - a[0]) * pct, a[1] + (b[1] - a[1]) * pct];
    }

    function samePoint(a, b) {
      return distance(a, b) < 1e-9;
    }

    function interpolatePoints(a, b, string) {
      let interpolators = a.map((d, i) => interpolatePoint(d, b[i]));

      return function(t) {
        let values = interpolators.map(fn => fn(t));
        return string ? toPathString(values) : values;
      };
    }

    function interpolatePoint(a, b) {
      return function(t) {
        return a.map((d, i) => d + t * (b[i] - d));
      };
    }

    function isFiniteNumber(number) {
      return typeof number === "number" && isFinite(number);
    }

    const INVALID_INPUT = `All shapes must be supplied as arrays of [x, y] points or an SVG path string (https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/d).
Example valid ways of supplying a shape would be:
[[0, 0], [10, 0], [10, 10]]
"M0,0 L10,0 L10,10Z"
`;

    function parse(str) {
      return new svgpath(str).abs();
    }

    function split(parsed) {
      return parsed
        .toString()
        .split("M")
        .map((d, i) => {
          d = d.trim();
          return i && d ? "M" + d : d;
        })
        .filter(d => d);
    }

    function toPathString(ring) {
      return "M" + ring.join("L") + "Z";
    }

    function pathStringToRing(str, maxSegmentLength) {
      let parsed = parse(str);

      return exactRing(parsed) || approximateRing(parsed, maxSegmentLength);
    }

    function exactRing(parsed) {
      let segments = parsed.segments || [],
        ring = [];

      if (!segments.length || segments[0][0] !== "M") {
        return false;
      }

      for (let i = 0; i < segments.length; i++) {
        let [command, x, y] = segments[i];
        if ((command === "M" && i) || command === "Z") {
          break;
        } else if (command === "M" || command === "L") {
          ring.push([x, y]);
        } else if (command === "H") {
          ring.push([x, ring[ring.length - 1][1]]);
        } else if (command === "V") {
          ring.push([ring[ring.length - 1][0], x]);
        } else {
          return false;
        }
      }

      return ring.length ? { ring } : false;
    }

    function approximateRing(parsed, maxSegmentLength) {
      let ringPath = split(parsed)[0],
        ring = [],
        len,
        m,
        numPoints = 3;

      if (!ringPath) {
        throw new TypeError(INVALID_INPUT);
      }

      m = measure(ringPath);
      len = m.getTotalLength();

      if (maxSegmentLength && isFiniteNumber(maxSegmentLength) && maxSegmentLength > 0) {
        numPoints = Math.max(numPoints, Math.ceil(len / maxSegmentLength));
      }

      for (let i = 0; i < numPoints; i++) {
        let p = m.getPointAtLength(len * i / numPoints);
        ring.push([p.x, p.y]);
      }

      return {
        ring,
        skipBisect: true
      };
    }

    function measure(d) {
      // Use native browser measurement if running in browser
      if (typeof window !== "undefined" && window && window.document) {
        try {
          let path = window.document.createElementNS("http://www.w3.org/2000/svg", "path");
          path.setAttributeNS(null, "d", d);
          return path;
        } catch (e) {}
      }
      // Fall back to svg-path-properties
      return pathProperties.exports.svgPathProperties(d);
    }

    function addPoints(ring, numPoints) {
      const desiredLength = ring.length + numPoints,
        step = polygonLength(ring) / numPoints;

      let i = 0,
        cursor = 0,
        insertAt = step / 2;

      while (ring.length < desiredLength) {
        let a = ring[i],
          b = ring[(i + 1) % ring.length],
          segment = distance(a, b);

        if (insertAt <= cursor + segment) {
          ring.splice(i + 1, 0, segment ? pointAlong(a, b, (insertAt - cursor) / segment) : a.slice(0));
          insertAt += step;
          continue;
        }

        cursor += segment;
        i++;
      }
    }

    function bisect(ring, maxSegmentLength = Infinity) {
      for (let i = 0; i < ring.length; i++) {
        let a = ring[i],
          b = i === ring.length - 1 ? ring[0] : ring[i + 1];

        // Could splice the whole set for a segment instead, but a bit messy
        while (distance(a, b) > maxSegmentLength) {
          b = pointAlong(a, b, 0.5);
          ring.splice(i + 1, 0, b);
        }
      }
    }

    function normalizeRing(ring, maxSegmentLength) {
      let points, area, skipBisect;

      if (typeof ring === "string") {
        let converted = pathStringToRing(ring, maxSegmentLength);
        ring = converted.ring;
        skipBisect = converted.skipBisect;
      } else if (!Array.isArray(ring)) {
        throw new TypeError(INVALID_INPUT);
      }

      points = ring.slice(0);

      if (!validRing(points)) {
        throw new TypeError(INVALID_INPUT);
      }

      // TODO skip this test to avoid scale issues?
      // Chosen epsilon (1e-6) is problematic for small coordinate range
      if (points.length > 1 && samePoint(points[0], points[points.length - 1])) {
        points.pop();
      }

      area = polygonArea(points);

      // Make all rings clockwise
      if (area > 0) {
        points.reverse();
      }

      if (
        !skipBisect &&
        maxSegmentLength &&
        isFiniteNumber(maxSegmentLength) &&
        maxSegmentLength > 0
      ) {
        bisect(points, maxSegmentLength);
      }

      return points;
    }

    function validRing(ring) {
      return ring.every(function(point) {
        return (
          Array.isArray(point) &&
          point.length >= 2 &&
          isFiniteNumber(point[0]) &&
          isFiniteNumber(point[1])
        );
      });
    }

    function rotate$1(ring, vs) {
      let len = ring.length,
          min = Infinity,
          bestOffset,
          sumOfSquares,
          spliced;

      for (let offset = 0; offset < len; offset++) {
        sumOfSquares = 0;

        vs.forEach(function(p, i){
          let d = distance(ring[(offset + i) % len], p);
          sumOfSquares += d * d;
        });

        if (sumOfSquares < min) {
          min = sumOfSquares;
          bestOffset = offset;
        }
      }

      if (bestOffset) {
        spliced = ring.splice(0, bestOffset);
        ring.splice(ring.length, 0, ...spliced);
      }
    }

    function interpolate(fromShape, toShape, { maxSegmentLength = 10, string = true } = {}) {
      let fromRing = normalizeRing(fromShape, maxSegmentLength),
        toRing = normalizeRing(toShape, maxSegmentLength),
        interpolator = interpolateRing(fromRing, toRing, string);

      // Extra optimization for near either end with path strings
      if (!string || (typeof fromShape !== "string" && typeof toShape !== "string")) {
        return interpolator;
      }

      return t => {
        if (t < 1e-4 && typeof fromShape === "string") {
          return fromShape;
        }
        if (1 - t < 1e-4 && typeof toShape === "string") {
          return toShape;
        }
        return interpolator(t);
      };
    }

    function interpolateRing(fromRing, toRing, string) {
      let diff;

      diff = fromRing.length - toRing.length;

      // TODO bisect and add points in one step?
      addPoints(fromRing, diff < 0 ? diff * -1 : 0);
      addPoints(toRing, diff > 0 ? diff : 0);

      rotate$1(fromRing, toRing);

      return interpolatePoints(fromRing, toRing, string);
    }

    var earcut$2 = {exports: {}};

    earcut$2.exports = earcut;
    earcut$2.exports.default = earcut;

    function earcut(data, holeIndices, dim) {

        dim = dim || 2;

        var hasHoles = holeIndices && holeIndices.length,
            outerLen = hasHoles ? holeIndices[0] * dim : data.length,
            outerNode = linkedList(data, 0, outerLen, dim, true),
            triangles = [];

        if (!outerNode || outerNode.next === outerNode.prev) return triangles;

        var minX, minY, maxX, maxY, x, y, invSize;

        if (hasHoles) outerNode = eliminateHoles(data, holeIndices, outerNode, dim);

        // if the shape is not too simple, we'll use z-order curve hash later; calculate polygon bbox
        if (data.length > 80 * dim) {
            minX = maxX = data[0];
            minY = maxY = data[1];

            for (var i = dim; i < outerLen; i += dim) {
                x = data[i];
                y = data[i + 1];
                if (x < minX) minX = x;
                if (y < minY) minY = y;
                if (x > maxX) maxX = x;
                if (y > maxY) maxY = y;
            }

            // minX, minY and invSize are later used to transform coords into integers for z-order calculation
            invSize = Math.max(maxX - minX, maxY - minY);
            invSize = invSize !== 0 ? 1 / invSize : 0;
        }

        earcutLinked(outerNode, triangles, dim, minX, minY, invSize);

        return triangles;
    }

    // create a circular doubly linked list from polygon points in the specified winding order
    function linkedList(data, start, end, dim, clockwise) {
        var i, last;

        if (clockwise === (signedArea(data, start, end, dim) > 0)) {
            for (i = start; i < end; i += dim) last = insertNode(i, data[i], data[i + 1], last);
        } else {
            for (i = end - dim; i >= start; i -= dim) last = insertNode(i, data[i], data[i + 1], last);
        }

        if (last && equals(last, last.next)) {
            removeNode(last);
            last = last.next;
        }

        return last;
    }

    // eliminate colinear or duplicate points
    function filterPoints(start, end) {
        if (!start) return start;
        if (!end) end = start;

        var p = start,
            again;
        do {
            again = false;

            if (!p.steiner && (equals(p, p.next) || area(p.prev, p, p.next) === 0)) {
                removeNode(p);
                p = end = p.prev;
                if (p === p.next) break;
                again = true;

            } else {
                p = p.next;
            }
        } while (again || p !== end);

        return end;
    }

    // main ear slicing loop which triangulates a polygon (given as a linked list)
    function earcutLinked(ear, triangles, dim, minX, minY, invSize, pass) {
        if (!ear) return;

        // interlink polygon nodes in z-order
        if (!pass && invSize) indexCurve(ear, minX, minY, invSize);

        var stop = ear,
            prev, next;

        // iterate through ears, slicing them one by one
        while (ear.prev !== ear.next) {
            prev = ear.prev;
            next = ear.next;

            if (invSize ? isEarHashed(ear, minX, minY, invSize) : isEar(ear)) {
                // cut off the triangle
                triangles.push(prev.i / dim);
                triangles.push(ear.i / dim);
                triangles.push(next.i / dim);

                removeNode(ear);

                // skipping the next vertex leads to less sliver triangles
                ear = next.next;
                stop = next.next;

                continue;
            }

            ear = next;

            // if we looped through the whole remaining polygon and can't find any more ears
            if (ear === stop) {
                // try filtering points and slicing again
                if (!pass) {
                    earcutLinked(filterPoints(ear), triangles, dim, minX, minY, invSize, 1);

                // if this didn't work, try curing all small self-intersections locally
                } else if (pass === 1) {
                    ear = cureLocalIntersections(filterPoints(ear), triangles, dim);
                    earcutLinked(ear, triangles, dim, minX, minY, invSize, 2);

                // as a last resort, try splitting the remaining polygon into two
                } else if (pass === 2) {
                    splitEarcut(ear, triangles, dim, minX, minY, invSize);
                }

                break;
            }
        }
    }

    // check whether a polygon node forms a valid ear with adjacent nodes
    function isEar(ear) {
        var a = ear.prev,
            b = ear,
            c = ear.next;

        if (area(a, b, c) >= 0) return false; // reflex, can't be an ear

        // now make sure we don't have other points inside the potential ear
        var p = ear.next.next;

        while (p !== ear.prev) {
            if (pointInTriangle(a.x, a.y, b.x, b.y, c.x, c.y, p.x, p.y) &&
                area(p.prev, p, p.next) >= 0) return false;
            p = p.next;
        }

        return true;
    }

    function isEarHashed(ear, minX, minY, invSize) {
        var a = ear.prev,
            b = ear,
            c = ear.next;

        if (area(a, b, c) >= 0) return false; // reflex, can't be an ear

        // triangle bbox; min & max are calculated like this for speed
        var minTX = a.x < b.x ? (a.x < c.x ? a.x : c.x) : (b.x < c.x ? b.x : c.x),
            minTY = a.y < b.y ? (a.y < c.y ? a.y : c.y) : (b.y < c.y ? b.y : c.y),
            maxTX = a.x > b.x ? (a.x > c.x ? a.x : c.x) : (b.x > c.x ? b.x : c.x),
            maxTY = a.y > b.y ? (a.y > c.y ? a.y : c.y) : (b.y > c.y ? b.y : c.y);

        // z-order range for the current triangle bbox;
        var minZ = zOrder(minTX, minTY, minX, minY, invSize),
            maxZ = zOrder(maxTX, maxTY, minX, minY, invSize);

        var p = ear.prevZ,
            n = ear.nextZ;

        // look for points inside the triangle in both directions
        while (p && p.z >= minZ && n && n.z <= maxZ) {
            if (p !== ear.prev && p !== ear.next &&
                pointInTriangle(a.x, a.y, b.x, b.y, c.x, c.y, p.x, p.y) &&
                area(p.prev, p, p.next) >= 0) return false;
            p = p.prevZ;

            if (n !== ear.prev && n !== ear.next &&
                pointInTriangle(a.x, a.y, b.x, b.y, c.x, c.y, n.x, n.y) &&
                area(n.prev, n, n.next) >= 0) return false;
            n = n.nextZ;
        }

        // look for remaining points in decreasing z-order
        while (p && p.z >= minZ) {
            if (p !== ear.prev && p !== ear.next &&
                pointInTriangle(a.x, a.y, b.x, b.y, c.x, c.y, p.x, p.y) &&
                area(p.prev, p, p.next) >= 0) return false;
            p = p.prevZ;
        }

        // look for remaining points in increasing z-order
        while (n && n.z <= maxZ) {
            if (n !== ear.prev && n !== ear.next &&
                pointInTriangle(a.x, a.y, b.x, b.y, c.x, c.y, n.x, n.y) &&
                area(n.prev, n, n.next) >= 0) return false;
            n = n.nextZ;
        }

        return true;
    }

    // go through all polygon nodes and cure small local self-intersections
    function cureLocalIntersections(start, triangles, dim) {
        var p = start;
        do {
            var a = p.prev,
                b = p.next.next;

            if (!equals(a, b) && intersects(a, p, p.next, b) && locallyInside(a, b) && locallyInside(b, a)) {

                triangles.push(a.i / dim);
                triangles.push(p.i / dim);
                triangles.push(b.i / dim);

                // remove two nodes involved
                removeNode(p);
                removeNode(p.next);

                p = start = b;
            }
            p = p.next;
        } while (p !== start);

        return filterPoints(p);
    }

    // try splitting polygon into two and triangulate them independently
    function splitEarcut(start, triangles, dim, minX, minY, invSize) {
        // look for a valid diagonal that divides the polygon into two
        var a = start;
        do {
            var b = a.next.next;
            while (b !== a.prev) {
                if (a.i !== b.i && isValidDiagonal(a, b)) {
                    // split the polygon in two by the diagonal
                    var c = splitPolygon(a, b);

                    // filter colinear points around the cuts
                    a = filterPoints(a, a.next);
                    c = filterPoints(c, c.next);

                    // run earcut on each half
                    earcutLinked(a, triangles, dim, minX, minY, invSize);
                    earcutLinked(c, triangles, dim, minX, minY, invSize);
                    return;
                }
                b = b.next;
            }
            a = a.next;
        } while (a !== start);
    }

    // link every hole into the outer loop, producing a single-ring polygon without holes
    function eliminateHoles(data, holeIndices, outerNode, dim) {
        var queue = [],
            i, len, start, end, list;

        for (i = 0, len = holeIndices.length; i < len; i++) {
            start = holeIndices[i] * dim;
            end = i < len - 1 ? holeIndices[i + 1] * dim : data.length;
            list = linkedList(data, start, end, dim, false);
            if (list === list.next) list.steiner = true;
            queue.push(getLeftmost(list));
        }

        queue.sort(compareX);

        // process holes from left to right
        for (i = 0; i < queue.length; i++) {
            outerNode = eliminateHole(queue[i], outerNode);
            outerNode = filterPoints(outerNode, outerNode.next);
        }

        return outerNode;
    }

    function compareX(a, b) {
        return a.x - b.x;
    }

    // find a bridge between vertices that connects hole with an outer ring and and link it
    function eliminateHole(hole, outerNode) {
        var bridge = findHoleBridge(hole, outerNode);
        if (!bridge) {
            return outerNode;
        }

        var bridgeReverse = splitPolygon(bridge, hole);

        // filter collinear points around the cuts
        var filteredBridge = filterPoints(bridge, bridge.next);
        filterPoints(bridgeReverse, bridgeReverse.next);

        // Check if input node was removed by the filtering
        return outerNode === bridge ? filteredBridge : outerNode;
    }

    // David Eberly's algorithm for finding a bridge between hole and outer polygon
    function findHoleBridge(hole, outerNode) {
        var p = outerNode,
            hx = hole.x,
            hy = hole.y,
            qx = -Infinity,
            m;

        // find a segment intersected by a ray from the hole's leftmost point to the left;
        // segment's endpoint with lesser x will be potential connection point
        do {
            if (hy <= p.y && hy >= p.next.y && p.next.y !== p.y) {
                var x = p.x + (hy - p.y) * (p.next.x - p.x) / (p.next.y - p.y);
                if (x <= hx && x > qx) {
                    qx = x;
                    if (x === hx) {
                        if (hy === p.y) return p;
                        if (hy === p.next.y) return p.next;
                    }
                    m = p.x < p.next.x ? p : p.next;
                }
            }
            p = p.next;
        } while (p !== outerNode);

        if (!m) return null;

        if (hx === qx) return m; // hole touches outer segment; pick leftmost endpoint

        // look for points inside the triangle of hole point, segment intersection and endpoint;
        // if there are no points found, we have a valid connection;
        // otherwise choose the point of the minimum angle with the ray as connection point

        var stop = m,
            mx = m.x,
            my = m.y,
            tanMin = Infinity,
            tan;

        p = m;

        do {
            if (hx >= p.x && p.x >= mx && hx !== p.x &&
                    pointInTriangle(hy < my ? hx : qx, hy, mx, my, hy < my ? qx : hx, hy, p.x, p.y)) {

                tan = Math.abs(hy - p.y) / (hx - p.x); // tangential

                if (locallyInside(p, hole) &&
                    (tan < tanMin || (tan === tanMin && (p.x > m.x || (p.x === m.x && sectorContainsSector(m, p)))))) {
                    m = p;
                    tanMin = tan;
                }
            }

            p = p.next;
        } while (p !== stop);

        return m;
    }

    // whether sector in vertex m contains sector in vertex p in the same coordinates
    function sectorContainsSector(m, p) {
        return area(m.prev, m, p.prev) < 0 && area(p.next, m, m.next) < 0;
    }

    // interlink polygon nodes in z-order
    function indexCurve(start, minX, minY, invSize) {
        var p = start;
        do {
            if (p.z === null) p.z = zOrder(p.x, p.y, minX, minY, invSize);
            p.prevZ = p.prev;
            p.nextZ = p.next;
            p = p.next;
        } while (p !== start);

        p.prevZ.nextZ = null;
        p.prevZ = null;

        sortLinked(p);
    }

    // Simon Tatham's linked list merge sort algorithm
    // http://www.chiark.greenend.org.uk/~sgtatham/algorithms/listsort.html
    function sortLinked(list) {
        var i, p, q, e, tail, numMerges, pSize, qSize,
            inSize = 1;

        do {
            p = list;
            list = null;
            tail = null;
            numMerges = 0;

            while (p) {
                numMerges++;
                q = p;
                pSize = 0;
                for (i = 0; i < inSize; i++) {
                    pSize++;
                    q = q.nextZ;
                    if (!q) break;
                }
                qSize = inSize;

                while (pSize > 0 || (qSize > 0 && q)) {

                    if (pSize !== 0 && (qSize === 0 || !q || p.z <= q.z)) {
                        e = p;
                        p = p.nextZ;
                        pSize--;
                    } else {
                        e = q;
                        q = q.nextZ;
                        qSize--;
                    }

                    if (tail) tail.nextZ = e;
                    else list = e;

                    e.prevZ = tail;
                    tail = e;
                }

                p = q;
            }

            tail.nextZ = null;
            inSize *= 2;

        } while (numMerges > 1);

        return list;
    }

    // z-order of a point given coords and inverse of the longer side of data bbox
    function zOrder(x, y, minX, minY, invSize) {
        // coords are transformed into non-negative 15-bit integer range
        x = 32767 * (x - minX) * invSize;
        y = 32767 * (y - minY) * invSize;

        x = (x | (x << 8)) & 0x00FF00FF;
        x = (x | (x << 4)) & 0x0F0F0F0F;
        x = (x | (x << 2)) & 0x33333333;
        x = (x | (x << 1)) & 0x55555555;

        y = (y | (y << 8)) & 0x00FF00FF;
        y = (y | (y << 4)) & 0x0F0F0F0F;
        y = (y | (y << 2)) & 0x33333333;
        y = (y | (y << 1)) & 0x55555555;

        return x | (y << 1);
    }

    // find the leftmost node of a polygon ring
    function getLeftmost(start) {
        var p = start,
            leftmost = start;
        do {
            if (p.x < leftmost.x || (p.x === leftmost.x && p.y < leftmost.y)) leftmost = p;
            p = p.next;
        } while (p !== start);

        return leftmost;
    }

    // check if a point lies within a convex triangle
    function pointInTriangle(ax, ay, bx, by, cx, cy, px, py) {
        return (cx - px) * (ay - py) - (ax - px) * (cy - py) >= 0 &&
               (ax - px) * (by - py) - (bx - px) * (ay - py) >= 0 &&
               (bx - px) * (cy - py) - (cx - px) * (by - py) >= 0;
    }

    // check if a diagonal between two polygon nodes is valid (lies in polygon interior)
    function isValidDiagonal(a, b) {
        return a.next.i !== b.i && a.prev.i !== b.i && !intersectsPolygon(a, b) && // dones't intersect other edges
               (locallyInside(a, b) && locallyInside(b, a) && middleInside(a, b) && // locally visible
                (area(a.prev, a, b.prev) || area(a, b.prev, b)) || // does not create opposite-facing sectors
                equals(a, b) && area(a.prev, a, a.next) > 0 && area(b.prev, b, b.next) > 0); // special zero-length case
    }

    // signed area of a triangle
    function area(p, q, r) {
        return (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
    }

    // check if two points are equal
    function equals(p1, p2) {
        return p1.x === p2.x && p1.y === p2.y;
    }

    // check if two segments intersect
    function intersects(p1, q1, p2, q2) {
        var o1 = sign(area(p1, q1, p2));
        var o2 = sign(area(p1, q1, q2));
        var o3 = sign(area(p2, q2, p1));
        var o4 = sign(area(p2, q2, q1));

        if (o1 !== o2 && o3 !== o4) return true; // general case

        if (o1 === 0 && onSegment(p1, p2, q1)) return true; // p1, q1 and p2 are collinear and p2 lies on p1q1
        if (o2 === 0 && onSegment(p1, q2, q1)) return true; // p1, q1 and q2 are collinear and q2 lies on p1q1
        if (o3 === 0 && onSegment(p2, p1, q2)) return true; // p2, q2 and p1 are collinear and p1 lies on p2q2
        if (o4 === 0 && onSegment(p2, q1, q2)) return true; // p2, q2 and q1 are collinear and q1 lies on p2q2

        return false;
    }

    // for collinear points p, q, r, check if point q lies on segment pr
    function onSegment(p, q, r) {
        return q.x <= Math.max(p.x, r.x) && q.x >= Math.min(p.x, r.x) && q.y <= Math.max(p.y, r.y) && q.y >= Math.min(p.y, r.y);
    }

    function sign(num) {
        return num > 0 ? 1 : num < 0 ? -1 : 0;
    }

    // check if a polygon diagonal intersects any polygon segments
    function intersectsPolygon(a, b) {
        var p = a;
        do {
            if (p.i !== a.i && p.next.i !== a.i && p.i !== b.i && p.next.i !== b.i &&
                    intersects(p, p.next, a, b)) return true;
            p = p.next;
        } while (p !== a);

        return false;
    }

    // check if a polygon diagonal is locally inside the polygon
    function locallyInside(a, b) {
        return area(a.prev, a, a.next) < 0 ?
            area(a, b, a.next) >= 0 && area(a, a.prev, b) >= 0 :
            area(a, b, a.prev) < 0 || area(a, a.next, b) < 0;
    }

    // check if the middle point of a polygon diagonal is inside the polygon
    function middleInside(a, b) {
        var p = a,
            inside = false,
            px = (a.x + b.x) / 2,
            py = (a.y + b.y) / 2;
        do {
            if (((p.y > py) !== (p.next.y > py)) && p.next.y !== p.y &&
                    (px < (p.next.x - p.x) * (py - p.y) / (p.next.y - p.y) + p.x))
                inside = !inside;
            p = p.next;
        } while (p !== a);

        return inside;
    }

    // link two polygon vertices with a bridge; if the vertices belong to the same ring, it splits polygon into two;
    // if one belongs to the outer ring and another to a hole, it merges it into a single ring
    function splitPolygon(a, b) {
        var a2 = new Node(a.i, a.x, a.y),
            b2 = new Node(b.i, b.x, b.y),
            an = a.next,
            bp = b.prev;

        a.next = b;
        b.prev = a;

        a2.next = an;
        an.prev = a2;

        b2.next = a2;
        a2.prev = b2;

        bp.next = b2;
        b2.prev = bp;

        return b2;
    }

    // create a node and optionally link it with previous one (in a circular doubly linked list)
    function insertNode(i, x, y, last) {
        var p = new Node(i, x, y);

        if (!last) {
            p.prev = p;
            p.next = p;

        } else {
            p.next = last.next;
            p.prev = last;
            last.next.prev = p;
            last.next = p;
        }
        return p;
    }

    function removeNode(p) {
        p.next.prev = p.prev;
        p.prev.next = p.next;

        if (p.prevZ) p.prevZ.nextZ = p.nextZ;
        if (p.nextZ) p.nextZ.prevZ = p.prevZ;
    }

    function Node(i, x, y) {
        // vertex index in coordinates array
        this.i = i;

        // vertex coordinates
        this.x = x;
        this.y = y;

        // previous and next vertex nodes in a polygon ring
        this.prev = null;
        this.next = null;

        // z-order curve value
        this.z = null;

        // previous and next nodes in z-order
        this.prevZ = null;
        this.nextZ = null;

        // indicates whether this is a steiner point
        this.steiner = false;
    }

    // return a percentage difference between the polygon area and its triangulation area;
    // used to verify correctness of triangulation
    earcut.deviation = function (data, holeIndices, dim, triangles) {
        var hasHoles = holeIndices && holeIndices.length;
        var outerLen = hasHoles ? holeIndices[0] * dim : data.length;

        var polygonArea = Math.abs(signedArea(data, 0, outerLen, dim));
        if (hasHoles) {
            for (var i = 0, len = holeIndices.length; i < len; i++) {
                var start = holeIndices[i] * dim;
                var end = i < len - 1 ? holeIndices[i + 1] * dim : data.length;
                polygonArea -= Math.abs(signedArea(data, start, end, dim));
            }
        }

        var trianglesArea = 0;
        for (i = 0; i < triangles.length; i += 3) {
            var a = triangles[i] * dim;
            var b = triangles[i + 1] * dim;
            var c = triangles[i + 2] * dim;
            trianglesArea += Math.abs(
                (data[a] - data[c]) * (data[b + 1] - data[a + 1]) -
                (data[a] - data[b]) * (data[c + 1] - data[a + 1]));
        }

        return polygonArea === 0 && trianglesArea === 0 ? 0 :
            Math.abs((trianglesArea - polygonArea) / polygonArea);
    };

    function signedArea(data, start, end, dim) {
        var sum = 0;
        for (var i = start, j = end - dim; i < end; i += dim) {
            sum += (data[j] - data[i]) * (data[i + 1] + data[j + 1]);
            j = i;
        }
        return sum;
    }

    // turn a polygon in a multi-dimensional array form (e.g. as in GeoJSON) into a form Earcut accepts
    earcut.flatten = function (data) {
        var dim = data[0][0].length,
            result = {vertices: [], holes: [], dimensions: dim},
            holeIndex = 0;

        for (var i = 0; i < data.length; i++) {
            for (var j = 0; j < data[i].length; j++) {
                for (var d = 0; d < dim; d++) result.vertices.push(data[i][j][d]);
            }
            if (i > 0) {
                holeIndex += data[i - 1].length;
                result.holes.push(holeIndex);
            }
        }
        return result;
    };

    var earcut$1 = earcut$2.exports;

    function ascending(a, b) {
      return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
    }

    function bisector(compare) {
      if (compare.length === 1) compare = ascendingComparator(compare);
      return {
        left: function(a, x, lo, hi) {
          if (lo == null) lo = 0;
          if (hi == null) hi = a.length;
          while (lo < hi) {
            var mid = lo + hi >>> 1;
            if (compare(a[mid], x) < 0) lo = mid + 1;
            else hi = mid;
          }
          return lo;
        },
        right: function(a, x, lo, hi) {
          if (lo == null) lo = 0;
          if (hi == null) hi = a.length;
          while (lo < hi) {
            var mid = lo + hi >>> 1;
            if (compare(a[mid], x) > 0) hi = mid;
            else lo = mid + 1;
          }
          return lo;
        }
      };
    }

    function ascendingComparator(f) {
      return function(d, x) {
        return ascending(f(d), x);
      };
    }

    bisector(ascending);

    /* eslint-disable no-undef */

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
        return t2DGeometry$3.bezierTransition(this.p0, this.cntrl1, this.p1, f);
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
        return t2DGeometry$3.linearTransitionBetweenPoints(this.p0, this.p1, f);
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
                const co = t2DGeometry$3.cubicBezierCoefficients(arrExe[i]);
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
            } else ;
        }

        mappedArr.forEach(function (d) {
            d.duration = (d.length / totalLength) * duration;
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

    /* eslint-disable no-undef */
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
    };

    function Events(vDom) {
        this.vDom = vDom;
        this.disable = false;
        this.dragNode = null;
        this.touchNode = null;
        this.wheelNode = null;
        this.pointers = [];
    }

    Events.prototype.getNode = function (e) {};

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
        } else if (node) {
            if (e.pointerType === "touch") {
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
                // if (this.pointerNode.clickCounter === 1 || this.pointerNode.clickCounter === 2) {
                if (node.events.click) {
                    node.events.click.call(node, e);
                }
                eventBubble(node, "click", e);

                if (this.pointerNode.clickCounter === 2) {
                    if (node.events.dblclick) {
                        node.events.dblclick.call(node, e);
                    }
                    eventBubble(node, "dblclick", e);
                    // self.pointerNode = null;
                }

                if (clickInterval) {
                    clearTimeout(clickInterval);
                }
                clickInterval = setTimeout(function () {
                    self.pointerNode = null;
                    clickInterval = null;
                }, 200);
                // }
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

        // if (node && (node.events['mouseover'] || node.events['mousein'])) {
        // 	if (this.selectedNode !== node) {
        // 		if (node.events['mouseover']) {
        // 			node.events['mouseover'].call(node, e);
        // 		}
        // 		if (node.events['mousein']) {
        // 			node.events['mousein'].call(node, e);
        // 		}
        // 	}
        // }

        // if (this.selectedNode && this.selectedNode !== node) {
        // 	if (this.selectedNode.events['mouseout']) {
        // 		this.selectedNode.events['mouseout'].call(this.selectedNode, e);
        // 	}
        // 	if (this.selectedNode.events['mouseleave']) {
        // 		this.selectedNode.events['mouseleave'].call(this.selectedNode, e);
        // 	}
        // }
        // this.selectedNode = node;
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

    var resizeObservers = [];

    var hasActiveObservations = function () {
        return resizeObservers.some(function (ro) { return ro.activeTargets.length > 0; });
    };

    var hasSkippedObservations = function () {
        return resizeObservers.some(function (ro) { return ro.skippedTargets.length > 0; });
    };

    var msg = 'ResizeObserver loop completed with undelivered notifications.';
    var deliverResizeLoopError = function () {
        var event;
        if (typeof ErrorEvent === 'function') {
            event = new ErrorEvent('error', {
                message: msg
            });
        }
        else {
            event = document.createEvent('Event');
            event.initEvent('error', false, false);
            event.message = msg;
        }
        window.dispatchEvent(event);
    };

    var ResizeObserverBoxOptions;
    (function (ResizeObserverBoxOptions) {
        ResizeObserverBoxOptions["BORDER_BOX"] = "border-box";
        ResizeObserverBoxOptions["CONTENT_BOX"] = "content-box";
        ResizeObserverBoxOptions["DEVICE_PIXEL_CONTENT_BOX"] = "device-pixel-content-box";
    })(ResizeObserverBoxOptions || (ResizeObserverBoxOptions = {}));

    var freeze = function (obj) { return Object.freeze(obj); };

    var ResizeObserverSize = (function () {
        function ResizeObserverSize(inlineSize, blockSize) {
            this.inlineSize = inlineSize;
            this.blockSize = blockSize;
            freeze(this);
        }
        return ResizeObserverSize;
    }());

    var DOMRectReadOnly = (function () {
        function DOMRectReadOnly(x, y, width, height) {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            this.top = this.y;
            this.left = this.x;
            this.bottom = this.top + this.height;
            this.right = this.left + this.width;
            return freeze(this);
        }
        DOMRectReadOnly.prototype.toJSON = function () {
            var _a = this, x = _a.x, y = _a.y, top = _a.top, right = _a.right, bottom = _a.bottom, left = _a.left, width = _a.width, height = _a.height;
            return { x: x, y: y, top: top, right: right, bottom: bottom, left: left, width: width, height: height };
        };
        DOMRectReadOnly.fromRect = function (rectangle) {
            return new DOMRectReadOnly(rectangle.x, rectangle.y, rectangle.width, rectangle.height);
        };
        return DOMRectReadOnly;
    }());

    var isSVG = function (target) { return target instanceof SVGElement && 'getBBox' in target; };
    var isHidden = function (target) {
        if (isSVG(target)) {
            var _a = target.getBBox(), width = _a.width, height = _a.height;
            return !width && !height;
        }
        var _b = target, offsetWidth = _b.offsetWidth, offsetHeight = _b.offsetHeight;
        return !(offsetWidth || offsetHeight || target.getClientRects().length);
    };
    var isElement = function (obj) {
        var _a, _b;
        if (obj instanceof Element) {
            return true;
        }
        var scope = (_b = (_a = obj) === null || _a === void 0 ? void 0 : _a.ownerDocument) === null || _b === void 0 ? void 0 : _b.defaultView;
        return !!(scope && obj instanceof scope.Element);
    };
    var isReplacedElement = function (target) {
        switch (target.tagName) {
            case 'INPUT':
                if (target.type !== 'image') {
                    break;
                }
            case 'VIDEO':
            case 'AUDIO':
            case 'EMBED':
            case 'OBJECT':
            case 'CANVAS':
            case 'IFRAME':
            case 'IMG':
                return true;
        }
        return false;
    };

    var global$1 = typeof window !== 'undefined' ? window : {};

    var cache = new WeakMap();
    var scrollRegexp = /auto|scroll/;
    var verticalRegexp = /^tb|vertical/;
    var IE = (/msie|trident/i).test(global$1.navigator && global$1.navigator.userAgent);
    var parseDimension = function (pixel) { return parseFloat(pixel || '0'); };
    var size = function (inlineSize, blockSize, switchSizes) {
        if (inlineSize === void 0) { inlineSize = 0; }
        if (blockSize === void 0) { blockSize = 0; }
        if (switchSizes === void 0) { switchSizes = false; }
        return new ResizeObserverSize((switchSizes ? blockSize : inlineSize) || 0, (switchSizes ? inlineSize : blockSize) || 0);
    };
    var zeroBoxes = freeze({
        devicePixelContentBoxSize: size(),
        borderBoxSize: size(),
        contentBoxSize: size(),
        contentRect: new DOMRectReadOnly(0, 0, 0, 0)
    });
    var calculateBoxSizes = function (target, forceRecalculation) {
        if (forceRecalculation === void 0) { forceRecalculation = false; }
        if (cache.has(target) && !forceRecalculation) {
            return cache.get(target);
        }
        if (isHidden(target)) {
            cache.set(target, zeroBoxes);
            return zeroBoxes;
        }
        var cs = getComputedStyle(target);
        var svg = isSVG(target) && target.ownerSVGElement && target.getBBox();
        var removePadding = !IE && cs.boxSizing === 'border-box';
        var switchSizes = verticalRegexp.test(cs.writingMode || '');
        var canScrollVertically = !svg && scrollRegexp.test(cs.overflowY || '');
        var canScrollHorizontally = !svg && scrollRegexp.test(cs.overflowX || '');
        var paddingTop = svg ? 0 : parseDimension(cs.paddingTop);
        var paddingRight = svg ? 0 : parseDimension(cs.paddingRight);
        var paddingBottom = svg ? 0 : parseDimension(cs.paddingBottom);
        var paddingLeft = svg ? 0 : parseDimension(cs.paddingLeft);
        var borderTop = svg ? 0 : parseDimension(cs.borderTopWidth);
        var borderRight = svg ? 0 : parseDimension(cs.borderRightWidth);
        var borderBottom = svg ? 0 : parseDimension(cs.borderBottomWidth);
        var borderLeft = svg ? 0 : parseDimension(cs.borderLeftWidth);
        var horizontalPadding = paddingLeft + paddingRight;
        var verticalPadding = paddingTop + paddingBottom;
        var horizontalBorderArea = borderLeft + borderRight;
        var verticalBorderArea = borderTop + borderBottom;
        var horizontalScrollbarThickness = !canScrollHorizontally ? 0 : target.offsetHeight - verticalBorderArea - target.clientHeight;
        var verticalScrollbarThickness = !canScrollVertically ? 0 : target.offsetWidth - horizontalBorderArea - target.clientWidth;
        var widthReduction = removePadding ? horizontalPadding + horizontalBorderArea : 0;
        var heightReduction = removePadding ? verticalPadding + verticalBorderArea : 0;
        var contentWidth = svg ? svg.width : parseDimension(cs.width) - widthReduction - verticalScrollbarThickness;
        var contentHeight = svg ? svg.height : parseDimension(cs.height) - heightReduction - horizontalScrollbarThickness;
        var borderBoxWidth = contentWidth + horizontalPadding + verticalScrollbarThickness + horizontalBorderArea;
        var borderBoxHeight = contentHeight + verticalPadding + horizontalScrollbarThickness + verticalBorderArea;
        var boxes = freeze({
            devicePixelContentBoxSize: size(Math.round(contentWidth * devicePixelRatio), Math.round(contentHeight * devicePixelRatio), switchSizes),
            borderBoxSize: size(borderBoxWidth, borderBoxHeight, switchSizes),
            contentBoxSize: size(contentWidth, contentHeight, switchSizes),
            contentRect: new DOMRectReadOnly(paddingLeft, paddingTop, contentWidth, contentHeight)
        });
        cache.set(target, boxes);
        return boxes;
    };
    var calculateBoxSize = function (target, observedBox, forceRecalculation) {
        var _a = calculateBoxSizes(target, forceRecalculation), borderBoxSize = _a.borderBoxSize, contentBoxSize = _a.contentBoxSize, devicePixelContentBoxSize = _a.devicePixelContentBoxSize;
        switch (observedBox) {
            case ResizeObserverBoxOptions.DEVICE_PIXEL_CONTENT_BOX:
                return devicePixelContentBoxSize;
            case ResizeObserverBoxOptions.BORDER_BOX:
                return borderBoxSize;
            default:
                return contentBoxSize;
        }
    };

    var ResizeObserverEntry = (function () {
        function ResizeObserverEntry(target) {
            var boxes = calculateBoxSizes(target);
            this.target = target;
            this.contentRect = boxes.contentRect;
            this.borderBoxSize = freeze([boxes.borderBoxSize]);
            this.contentBoxSize = freeze([boxes.contentBoxSize]);
            this.devicePixelContentBoxSize = freeze([boxes.devicePixelContentBoxSize]);
        }
        return ResizeObserverEntry;
    }());

    var calculateDepthForNode = function (node) {
        if (isHidden(node)) {
            return Infinity;
        }
        var depth = 0;
        var parent = node.parentNode;
        while (parent) {
            depth += 1;
            parent = parent.parentNode;
        }
        return depth;
    };

    var broadcastActiveObservations = function () {
        var shallowestDepth = Infinity;
        var callbacks = [];
        resizeObservers.forEach(function processObserver(ro) {
            if (ro.activeTargets.length === 0) {
                return;
            }
            var entries = [];
            ro.activeTargets.forEach(function processTarget(ot) {
                var entry = new ResizeObserverEntry(ot.target);
                var targetDepth = calculateDepthForNode(ot.target);
                entries.push(entry);
                ot.lastReportedSize = calculateBoxSize(ot.target, ot.observedBox);
                if (targetDepth < shallowestDepth) {
                    shallowestDepth = targetDepth;
                }
            });
            callbacks.push(function resizeObserverCallback() {
                ro.callback.call(ro.observer, entries, ro.observer);
            });
            ro.activeTargets.splice(0, ro.activeTargets.length);
        });
        for (var _i = 0, callbacks_1 = callbacks; _i < callbacks_1.length; _i++) {
            var callback = callbacks_1[_i];
            callback();
        }
        return shallowestDepth;
    };

    var gatherActiveObservationsAtDepth = function (depth) {
        resizeObservers.forEach(function processObserver(ro) {
            ro.activeTargets.splice(0, ro.activeTargets.length);
            ro.skippedTargets.splice(0, ro.skippedTargets.length);
            ro.observationTargets.forEach(function processTarget(ot) {
                if (ot.isActive()) {
                    if (calculateDepthForNode(ot.target) > depth) {
                        ro.activeTargets.push(ot);
                    }
                    else {
                        ro.skippedTargets.push(ot);
                    }
                }
            });
        });
    };

    var process = function () {
        var depth = 0;
        gatherActiveObservationsAtDepth(depth);
        while (hasActiveObservations()) {
            depth = broadcastActiveObservations();
            gatherActiveObservationsAtDepth(depth);
        }
        if (hasSkippedObservations()) {
            deliverResizeLoopError();
        }
        return depth > 0;
    };

    var trigger;
    var callbacks = [];
    var notify = function () { return callbacks.splice(0).forEach(function (cb) { return cb(); }); };
    var queueMicroTask = function (callback) {
        if (!trigger) {
            var toggle_1 = 0;
            var el_1 = document.createTextNode('');
            var config = { characterData: true };
            new MutationObserver(function () { return notify(); }).observe(el_1, config);
            trigger = function () { el_1.textContent = "" + (toggle_1 ? toggle_1-- : toggle_1++); };
        }
        callbacks.push(callback);
        trigger();
    };

    var queueResizeObserver = function (cb) {
        queueMicroTask(function ResizeObserver() {
            requestAnimationFrame(cb);
        });
    };

    var watching = 0;
    var isWatching = function () { return !!watching; };
    var CATCH_PERIOD = 250;
    var observerConfig = { attributes: true, characterData: true, childList: true, subtree: true };
    var events = [
        'resize',
        'load',
        'transitionend',
        'animationend',
        'animationstart',
        'animationiteration',
        'keyup',
        'keydown',
        'mouseup',
        'mousedown',
        'mouseover',
        'mouseout',
        'blur',
        'focus'
    ];
    var time = function (timeout) {
        if (timeout === void 0) { timeout = 0; }
        return Date.now() + timeout;
    };
    var scheduled = false;
    var Scheduler = (function () {
        function Scheduler() {
            var _this = this;
            this.stopped = true;
            this.listener = function () { return _this.schedule(); };
        }
        Scheduler.prototype.run = function (timeout) {
            var _this = this;
            if (timeout === void 0) { timeout = CATCH_PERIOD; }
            if (scheduled) {
                return;
            }
            scheduled = true;
            var until = time(timeout);
            queueResizeObserver(function () {
                var elementsHaveResized = false;
                try {
                    elementsHaveResized = process();
                }
                finally {
                    scheduled = false;
                    timeout = until - time();
                    if (!isWatching()) {
                        return;
                    }
                    if (elementsHaveResized) {
                        _this.run(1000);
                    }
                    else if (timeout > 0) {
                        _this.run(timeout);
                    }
                    else {
                        _this.start();
                    }
                }
            });
        };
        Scheduler.prototype.schedule = function () {
            this.stop();
            this.run();
        };
        Scheduler.prototype.observe = function () {
            var _this = this;
            var cb = function () { return _this.observer && _this.observer.observe(document.body, observerConfig); };
            document.body ? cb() : global$1.addEventListener('DOMContentLoaded', cb);
        };
        Scheduler.prototype.start = function () {
            var _this = this;
            if (this.stopped) {
                this.stopped = false;
                this.observer = new MutationObserver(this.listener);
                this.observe();
                events.forEach(function (name) { return global$1.addEventListener(name, _this.listener, true); });
            }
        };
        Scheduler.prototype.stop = function () {
            var _this = this;
            if (!this.stopped) {
                this.observer && this.observer.disconnect();
                events.forEach(function (name) { return global$1.removeEventListener(name, _this.listener, true); });
                this.stopped = true;
            }
        };
        return Scheduler;
    }());
    var scheduler = new Scheduler();
    var updateCount = function (n) {
        !watching && n > 0 && scheduler.start();
        watching += n;
        !watching && scheduler.stop();
    };

    var skipNotifyOnElement = function (target) {
        return !isSVG(target)
            && !isReplacedElement(target)
            && getComputedStyle(target).display === 'inline';
    };
    var ResizeObservation = (function () {
        function ResizeObservation(target, observedBox) {
            this.target = target;
            this.observedBox = observedBox || ResizeObserverBoxOptions.CONTENT_BOX;
            this.lastReportedSize = {
                inlineSize: 0,
                blockSize: 0
            };
        }
        ResizeObservation.prototype.isActive = function () {
            var size = calculateBoxSize(this.target, this.observedBox, true);
            if (skipNotifyOnElement(this.target)) {
                this.lastReportedSize = size;
            }
            if (this.lastReportedSize.inlineSize !== size.inlineSize
                || this.lastReportedSize.blockSize !== size.blockSize) {
                return true;
            }
            return false;
        };
        return ResizeObservation;
    }());

    var ResizeObserverDetail = (function () {
        function ResizeObserverDetail(resizeObserver, callback) {
            this.activeTargets = [];
            this.skippedTargets = [];
            this.observationTargets = [];
            this.observer = resizeObserver;
            this.callback = callback;
        }
        return ResizeObserverDetail;
    }());

    var observerMap = new WeakMap();
    var getObservationIndex = function (observationTargets, target) {
        for (var i = 0; i < observationTargets.length; i += 1) {
            if (observationTargets[i].target === target) {
                return i;
            }
        }
        return -1;
    };
    var ResizeObserverController = (function () {
        function ResizeObserverController() {
        }
        ResizeObserverController.connect = function (resizeObserver, callback) {
            var detail = new ResizeObserverDetail(resizeObserver, callback);
            observerMap.set(resizeObserver, detail);
        };
        ResizeObserverController.observe = function (resizeObserver, target, options) {
            var detail = observerMap.get(resizeObserver);
            var firstObservation = detail.observationTargets.length === 0;
            if (getObservationIndex(detail.observationTargets, target) < 0) {
                firstObservation && resizeObservers.push(detail);
                detail.observationTargets.push(new ResizeObservation(target, options && options.box));
                updateCount(1);
                scheduler.schedule();
            }
        };
        ResizeObserverController.unobserve = function (resizeObserver, target) {
            var detail = observerMap.get(resizeObserver);
            var index = getObservationIndex(detail.observationTargets, target);
            var lastObservation = detail.observationTargets.length === 1;
            if (index >= 0) {
                lastObservation && resizeObservers.splice(resizeObservers.indexOf(detail), 1);
                detail.observationTargets.splice(index, 1);
                updateCount(-1);
            }
        };
        ResizeObserverController.disconnect = function (resizeObserver) {
            var _this = this;
            var detail = observerMap.get(resizeObserver);
            detail.observationTargets.slice().forEach(function (ot) { return _this.unobserve(resizeObserver, ot.target); });
            detail.activeTargets.splice(0, detail.activeTargets.length);
        };
        return ResizeObserverController;
    }());

    var ResizeObserver$1 = (function () {
        function ResizeObserver(callback) {
            if (arguments.length === 0) {
                throw new TypeError("Failed to construct 'ResizeObserver': 1 argument required, but only 0 present.");
            }
            if (typeof callback !== 'function') {
                throw new TypeError("Failed to construct 'ResizeObserver': The callback provided as parameter 1 is not a function.");
            }
            ResizeObserverController.connect(this, callback);
        }
        ResizeObserver.prototype.observe = function (target, options) {
            if (arguments.length === 0) {
                throw new TypeError("Failed to execute 'observe' on 'ResizeObserver': 1 argument required, but only 0 present.");
            }
            if (!isElement(target)) {
                throw new TypeError("Failed to execute 'observe' on 'ResizeObserver': parameter 1 is not of type 'Element");
            }
            ResizeObserverController.observe(this, target, options);
        };
        ResizeObserver.prototype.unobserve = function (target) {
            if (arguments.length === 0) {
                throw new TypeError("Failed to execute 'unobserve' on 'ResizeObserver': 1 argument required, but only 0 present.");
            }
            if (!isElement(target)) {
                throw new TypeError("Failed to execute 'unobserve' on 'ResizeObserver': parameter 1 is not of type 'Element");
            }
            ResizeObserverController.unobserve(this, target);
        };
        ResizeObserver.prototype.disconnect = function () {
            ResizeObserverController.disconnect(this);
        };
        ResizeObserver.toString = function () {
            return 'function ResizeObserver () { [polyfill code] }';
        };
        return ResizeObserver;
    }());

    /* eslint-disable no-undef */

    let animeIdentifier$1 = 0;
    const t2DGeometry$2 = geometry;
    const easing$1 = fetchTransitionType;
    const queueInstance$4 = queue;
    const ResizeObserver = window.ResizeObserver || ResizeObserver$1;
    // const ResizeObserver = function () {};
    function animeId$1() {
        animeIdentifier$1 += 1;
        return animeIdentifier$1;
    }

    const transitionSetAttr = function transitionSetAttr(self, key, value) {
        return function inner(f) {
            self.setAttr(key, value.call(self, f));
        };
    };

    const transformTransition = function transformTransition(self, subkey, value) {
        const exe = [];
        const trans = self.attr.transform;

        if (typeof value === "function") {
            return function inner(f) {
                self[subkey](value.call(self, f));
            };
        }

        value.forEach((tV, i) => {
            let val;

            if (trans[subkey]) {
                if (trans[subkey][i] !== undefined) {
                    val = trans[subkey][i];
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

    const attrTransition = function attrTransition(self, key, value) {
        const srcVal = self.attr[key]; // if (typeof value === 'function') {
        //   return function setAttr_ (f) {
        //     self.setAttr(key, value.call(self, f))
        //   }
        // }

        return function setAttr_(f) {
            self.setAttr(key, t2DGeometry$2.intermediateValue(srcVal, value, f));
        };
    };

    const styleTransition = function styleTransition(self, key, value) {
        let srcValue;
        let destUnit;
        let destValue;

        if (typeof value === "function") {
            return function inner(f) {
                self.setStyle(key, value.call(self, self.dataObj, f));
            };
        } else {
            srcValue = self.style[key];

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
                srcValue = self.style[key] !== undefined ? self.style[key] : 1;
                destValue = value;
                destUnit = 0;
            }

            return function inner(f) {
                self.setStyle(key, t2DGeometry$2.intermediateValue(srcValue, destValue, f) + destUnit);
            };
        }
    };

    const animate = function animate(self, targetConfig) {
        const tattr = targetConfig.attr ? targetConfig.attr : {};
        const tstyles = targetConfig.style ? targetConfig.style : {};
        const runStack = [];
        let value;

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
                        } else {
                            runStack[runStack.length] = attrTransition(self, key, tattr[key]);
                        }
                    }
                } else {
                    value = tattr[key];

                    if (typeof value === "function") {
                        runStack[runStack.length] = transitionSetAttr(self, key, value);
                    } else {
                        const trans = self.attr.transform;

                        if (!trans) {
                            self.attr.transform = {};
                        }

                        const subTrnsKeys = Object.keys(tattr.transform);

                        for (let j = 0, jLen = subTrnsKeys.length; j < jLen; j += 1) {
                            runStack[runStack.length] = transformTransition(
                                self,
                                subTrnsKeys[j],
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
                runStack[runStack.length] = styleTransition(self, style, tstyles[style]);
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
            duration: targetConfig.duration,
            delay: targetConfig.delay ? targetConfig.delay : 0,
            end: targetConfig.end ? targetConfig.end.bind(self, self.dataObj) : null,
            loop: targetConfig.loop ? targetConfig.loop : 0,
            direction: targetConfig.direction ? targetConfig.direction : "default",
            ease: targetConfig.ease ? targetConfig.ease : "default",
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
                // nodes[i].dataObj = data[index]
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
        if (this.animList && this.animList.length > 0) {
            for (var i = this.animList.length - 1; i >= 0; i--) {
                queueInstance$4.remove(this.animList[i]);
            }
        }
        this.animList = [];
        return this;
    };

    NodePrototype.prototype.animateTo = function (targetConfig) {
        queueInstance$4.add(animeId$1(), animate(this, targetConfig), easing$1(targetConfig.ease));
        return this;
    };

    NodePrototype.prototype.animateExe = function (targetConfig) {
        return animate(this, targetConfig);
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
    } // function in (coOr) {
    //   for (let i = 0, len = this.stack.length; i < len; i += 1) {
    //     this.stack[i].in(coOr)
    //   }
    //   return this
    // }

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
    }; // function DomPattern (self, pattern, repeatInd) {
    // }
    // DomPattern.prototype.exe = function () {
    //   return this.pattern
    // }
    // function createDomPattern (url, config) {
    //   // new DomPattern(this, patternObj, repeatInd)
    //   let patternEl = this.createEl({
    //     el: 'pattern'
    //   })
    //   patternEl.createEl({
    //     el: 'image',
    //     attr: {
    //       'xlink:href': url
    //     }
    //   })
    // }
    // CreateElements as CollectionPrototype

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
    // SVGCollection.prototype.wrapper = function (nodes) {
    //   const self = this

    //   if (nodes) {
    //     for (let i = 0, len = nodes.length; i < len; i++) {
    //       let node = nodes[i]
    //       if (node instanceof DomExe || node instanceof SVGCollection) {
    //         self.stack.push(node)
    //       }
    //     }
    //   }
    //   return this
    // }

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
                "offset"(d, i) {
                    return `${d.value}%`;
                },

                "stop-color": function stopColor(d, i) {
                    return d.color;
                },
            },
        });
        return this;
    };

    DomGradients.prototype.radialGradient = function radialGradient() {
        const self = this;

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
                        cx: `${self.config.innerCircle.x}%`,
                        cy: `${self.config.innerCircle.y}%`,
                        r: `${self.config.outerCircle.r}%`,
                        fx: `${self.config.outerCircle.x}%`,
                        fy: `${self.config.outerCircle.y}%`,
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
                        cx: `${self.config.innerCircle.x}%`,
                        cy: `${self.config.innerCircle.y}%`,
                        r: `${self.config.outerCircle.r}%`,
                        fx: `${self.config.outerCircle.x}%`,
                        fy: `${self.config.outerCircle.y}%`,
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
                "offset"(d, i) {
                    return `${d.value}%`;
                },

                "stop-color": function stopColor(d, i) {
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
        // let cmd = "";
        // // let trns = ['scale', 'translate', 'rotate'];
        // for (const trnX in self.attr.transform) {
        //     if (trnX === "rotate") {
        //         cmd += `${trnX}(${
        //             self.attr.transform.rotate[0] +
        //             " " +
        //             (self.attr.transform.rotate[1] || 0) +
        //             " " +
        //             (self.attr.transform.rotate[2] || 0)
        //         }) `;
        //     } else {
        //         cmd += `${trnX}(${self.attr.transform[trnX].join(" ")}) `;
        //     }
        // }

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

    // DomExe.prototype

    // let dragStack = [];

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
        const res = document.querySelector(container);
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
            if (!document.querySelector(container)) {
                layerResizeUnBind(root);
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
            const res = document.querySelector(container);
            if (res && res.contains(layer)) {
                res.removeChild(layer);
            }
            queueInstance$3.removeVdom(vDomIndex);
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
            // e.preventDefault();
            eventsInstance.addPointer(e);
            if (e.target.drag_) {
                e.target.drag_(e, "pointerdown", eventsInstance);
                dragNode = e.target;
            }
        });
        root.dom.addEventListener("pointerup", (e) => {
            // e.preventDefault();
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

        // console.log(transformObj.translate[0], transformObj.translate[1]);

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
        this.onPanStart = function (trgt, event) {};
        this.onPan = function (trgt, event) {};
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

    // ZoomClass.prototype.pointerAdd = function (e) {
    // 	this.event.pointers.push(e);
    // 	if (this.event.pointers.length === 2) {
    // 		let pointers = this.event.pointers;
    // 		this.event.zoomTouchPoint = {
    // 			x: pointers[0].offsetX + ((pointers[1].offsetX - pointers[0].offsetX) * 0.5),
    // 			y: pointers[0].offsetY + ((pointers[1].offsetY - pointers[0].offsetY) * 0.5)
    // 		};
    // 	} else if (this.event.pointers.length === 1) {
    // 		this.event.zoomTouchPoint = {
    // 			x: this.event.pointers[0].offsetX,
    // 			y: this.event.pointers[0].offsetY
    // 		};
    // 		this.event.x = this.event.pointers[0].offsetX;
    // 		this.event.y = this.event.pointers[0].offsetY;
    // 	}
    // };

    // ZoomClass.prototype.pointerRemove = function (e) {
    // 	let self = this;
    // 	let pointers = this.event.pointers;
    // 	let index = -1;
    // 	for (var i = 0; i < pointers.length; i++) {
    // 		if (e.pointerId === pointers[i].pointerId) {
    // 		    index = i;
    // 			break;
    // 		}
    // 	}
    // 	if (index !== -1) {
    // 		// setTimeout(function (argument) {
    // 		self.event.pointers = [];
    // 		self.event.distance = 0;
    // 		self.event.zoomTouchPoint = {};
    // 		// }, 100);
    // 	}
    // };

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
                    offsetX: this.event.x, // + ((pointers[1].clientX - pointers[0].clientX) * 0.5),
                    offsetY: this.event.y, // + ((pointers[1].clientY - pointers[0].clientY) * 0.5),
                    deltaY: !distance_ ? 0 : distance_ - distance,
                };
                // console.log(pinchEvent.deltaY);
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
        // range to be [[x1, y1], [x2, y2]];
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

    const t2DGeometry$1 = geometry;
    const queueInstance$1 = queue;
    let Id$1 = 0;

    const zoomInstance$1 = behaviour.zoom();
    const dragInstance$1 = behaviour.drag();
    // let touchInstance = behaviour.touch();

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
        return new CanvasNodeExe(ctx, config, domId$1(), vDomIndex);
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

    function cRender(attr) {
        const self = this;

        if (attr.transform) {
            const { transform } = attr;
            const { scale = [1, 1], skew = [0, 0], translate = [0, 0] } = transform;
            const [hozScale = 1, verScale = hozScale] = scale;
            const [hozSkew = 0, verSkew = hozSkew] = skew;
            const [hozMove = 0, verMove = hozMove] = translate;

            // const hozScale = scale && scale.length > 0 ? scale[0] : 1;
            // const verScale = scale && scale.length > 1 ? scale[1] : hozScale || 1;
            // const hozSkew = transform.skew && transform.skew.length > 0 ? transform.skew[0] : 0;
            // const verSkew = transform.skew && transform.skew.length > 1 ? transform.skew[1] : 0;
            // const hozMove = transform.translate && transform.translate.length > 0 ? transform.translate[0] : 0;
            // const verMove = transform.translate && transform.translate.length > 1 ? transform.translate[1] : 0;

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
            self.BBoxHit = t2DGeometry$1.rotateBBox(this.BBox, transform);
        } else {
            self.BBoxHit = this.BBox;
        }
    }

    function CanvasGradients(config, type) {
        this.config = config;
        this.type = type || "linear";
        this.mode = !this.config.mode || this.config.mode === "percent" ? "percent" : "absolute";
    }

    CanvasGradients.prototype.exe = function GRAexe(ctx, BBox) {
        if (this.type === "linear" && this.mode === "percent") {
            return this.linearGradient(ctx, BBox);
        }

        if (this.type === "linear" && this.mode === "absolute") {
            return this.absoluteLinearGradient(ctx);
        } else if (this.type === "radial" && this.mode === "percent") {
            return this.radialGradient(ctx, BBox);
        } else if (this.type === "radial" && this.mode === "absolute") {
            return this.absoluteRadialGradient(ctx);
        }

        console.error("wrong Gradiant type");
    };

    CanvasGradients.prototype.linearGradient = function GralinearGradient(ctx, BBox) {
        const lGradient = ctx.createLinearGradient(
            BBox.x + BBox.width * (this.config.x1 / 100),
            BBox.y + BBox.height * (this.config.y1 / 100),
            BBox.x + BBox.width * (this.config.x2 / 100),
            BBox.y + BBox.height * (this.config.y2 / 100)
        );
        this.config.colorStops.forEach((d) => {
            lGradient.addColorStop(d.value / 100, d.color);
        });
        return lGradient;
    };

    CanvasGradients.prototype.absoluteLinearGradient = function absoluteGralinearGradient(ctx) {
        const lGradient = ctx.createLinearGradient(
            this.config.x1,
            this.config.y1,
            this.config.x2,
            this.config.y2
        );
        this.config.colorStops.forEach((d) => {
            lGradient.addColorStop(d.value, d.color);
        });
        return lGradient;
    };

    CanvasGradients.prototype.radialGradient = function GRAradialGradient(ctx, BBox) {
        const cGradient = ctx.createRadialGradient(
            BBox.x + BBox.width * (this.config.innerCircle.x / 100),
            BBox.y + BBox.height * (this.config.innerCircle.y / 100),
            BBox.width > BBox.height
                ? (BBox.width * this.config.innerCircle.r) / 100
                : (BBox.height * this.config.innerCircle.r) / 100,
            BBox.x + BBox.width * (this.config.outerCircle.x / 100),
            BBox.y + BBox.height * (this.config.outerCircle.y / 100),
            BBox.width > BBox.height
                ? (BBox.width * this.config.outerCircle.r) / 100
                : (BBox.height * this.config.outerCircle.r) / 100
        );
        this.config.colorStops.forEach((d) => {
            cGradient.addColorStop(d.value / 100, d.color);
        });
        return cGradient;
    };

    CanvasGradients.prototype.absoluteRadialGradient = function absoluteGraradialGradient(ctx, BBox) {
        const cGradient = ctx.createRadialGradient(
            this.config.innerCircle.x,
            this.config.innerCircle.y,
            this.config.innerCircle.r,
            this.config.outerCircle.x,
            this.config.outerCircle.y,
            this.config.outerCircle.r
        );
        this.config.colorStops.forEach((d) => {
            cGradient.addColorStop(d.value / 100, d.color);
        });
        return cGradient;
    };

    CanvasGradients.prototype.colorStops = function GRAcolorStops(colorStopValues) {
        if (Object.prototype.toString.call(colorStopValues) !== "[object Array]") {
            return false;
        }

        this.config.colorStops = colorStopValues;
        return this;
    };

    function createLinearGradient(config) {
        return new CanvasGradients(config, "linear");
    }

    function createRadialGradient(config) {
        return new CanvasGradients(config, "radial");
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
    // 	const tObj = this.rImageObj ? this.rImageObj : this.imageObj;
    // 	const tCxt = tObj.getContext('2d');
    // 	const pixelData = tCxt.getImageData(0, 0, this.attr.width, this.attr.height);
    // 	return pixHndlr(pixelData);
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
        this.clip = new CanvasNodeExe(
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
        if (self.ENV === "NODE") {
            selfSelf.pattern = canvasNodeLayer$1({}, height, width);
        } else {
            selfSelf.pattern = canvasLayer$1(
                null,
                {},
                {
                    enableEvents: false,
                    enableResize: false,
                }
            );
            selfSelf.pattern.setSize(width, height);
        }

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
        // on: addListener,
        setAttr: domSetAttribute,
        setStyle: domSetStyle,
        applyStyles,
    };

    function imageInstance$1(self) {
        const imageIns = new Image();
        imageIns.crossOrigin = "anonymous";

        imageIns.onload = function onload() {
            self.attr.height = self.attr.height ? self.attr.height : this.height;
            self.attr.width = self.attr.width ? self.attr.width : this.width;
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

        queueInstance$1.vDomChanged(this.nodeExe.vDomIndex);
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
    };

    RenderImage.prototype.execute = function RIexecute() {
        const { width = 0, height = 0, x = 0, y = 0 } = this.attr;

        if (this.imageObj) {
            // this.ctx.drawImage(this.rImageObj ? this.rImageObj.canvas : this.imageObj, x, y, width, height);
            this.ctx.drawImage(this.imageObj, x, y, width, height);
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
    }

    RenderText.prototype = new CanvasDom();
    RenderText.prototype.constructor = RenderText;

    RenderText.prototype.text = function RTtext(value) {
        this.attr.text = value;
    };

    RenderText.prototype.updateBBox = function RTupdateBBox() {
        const self = this;
        let height = 1;
        let width = 0;
        let { x = 0, y = 0, transform } = self.attr;
        const { translateX, translateY, scaleX, scaleY } = parseTransform$1(transform);

        if (this.style.font) {
            this.ctx.font = this.style.font;
            height = parseInt(this.style.font.replace(/[^\d.]/g, ""), 10) || 1;
        }

        width = this.ctx.measureText(this.attr.text).width;

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

        if (transform && transform.rotate) {
            self.BBoxHit = t2DGeometry$1.rotateBBox(this.BBox, transform);
        } else {
            self.BBoxHit = this.BBox;
        }
    };

    RenderText.prototype.execute = function RTexecute() {
        if (this.attr.text !== undefined && this.attr.text !== null) {
            if (this.ctx.fillStyle !== "#000000") {
                this.ctx.fillText(this.attr.text, this.attr.x, this.attr.y + this.height);
            }

            if (this.ctx.strokeStyle !== "#000000") {
                this.ctx.strokeText(this.attr.text, this.attr.x, this.attr.y + this.height);
            }
        }
    };

    RenderText.prototype.applyStyles = function RTapplyStyles() {};

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
    };

    RenderCircle.prototype.execute = function RCexecute() {
        const { r = 0, cx = 0, cy = 0 } = this.attr;
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, r, 0, 2 * Math.PI, false);
        this.applyStyles();
        this.ctx.closePath();
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
        const { translateX, translateY, scaleX, scaleY } = parseTransform$1(transform);

        // if (transform && transform.translate) {
        // 	[translateX, translateY] = transform.translate;
        // }

        // if (transform && transform.scale) {
        // 	[scaleX = 1, scaleY = scaleX] = transform.scale;
        // }

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
        // let translateX = 0;
        // let translateY = 0;
        // let scaleX = 1;
        // let scaleY = 1;
        const { transform, cx = 0, cy = 0, rx = 0, ry = 0 } = self.attr;
        const { translateX, translateY, scaleX, scaleY } = parseTransform$1(transform);

        // if (transform && transform.translate) {
        // 	[translateX, translateY] = transform.translate;
        // }

        // if (transform && transform.scale) {
        // 	[scaleX = 1, scaleY = scaleX] = transform.scale;
        // }

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
    };

    RenderEllipse.prototype.execute = function REexecute() {
        const ctx = this.ctx;
        const { cx = 0, cy = 0, rx = 0, ry = 0 } = this.attr;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
        this.applyStyles();
        ctx.closePath();
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
    };

    RenderRect.prototype.applyStyles = function rStyles() {};

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
            ctx.rect(x, y, width, height);
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

        if (objLocal instanceof CanvasNodeExe) {
            objLocal.dom.parent = self;
            self.stack[self.stack.length] = objLocal;
        } else if (objLocal instanceof CanvasCollection) {
            objLocal.stack.forEach((d) => {
                d.dom.parent = self;
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
                this.dom = null;
                break;
        }

        this.dom.nodeExe = this;
        this.BBoxUpdate = true;
        // if (config.style) {
        // 	this.setStyle(config.style);
        // }

        // if (config.attr) {
        // 	this.setAttr(config.attr);
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

        for (key in style) {
            if (typeof style[key] === "string" || typeof style[key] === "number") {
                value = style[key];
            } else if (typeof style[key] === "object") {
                if (
                    style[key] instanceof CanvasGradients ||
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

            if (typeof this.ctx[key] !== "function") {
                this.ctx[key] = value;
            } else if (typeof this.ctx[key] === "function") {
                this.ctx[key](value);
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
        queueInstance$1.vDomChanged(this.vDomIndex);
    };

    CanvasNodeExe.prototype.attributesExe = function CattributesExe() {
        this.dom.render(this.attr);
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

        queueInstance$1.vDomChanged(this.vDomIndex);
        return this;
    };

    function valueCheck(value) {
        if (colorMap$1.RGBAInstanceCheck(value)) {
            value = value.rgba;
        }

        return value === "#000" || value === "#000000" || value === "black" ? "rgb(1, 1, 1)" : value;
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
        queueInstance$1.vDomChanged(this.vDomIndex);
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
        queueInstance$1.vDomChanged(this.vDomIndex);
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
        queueInstance$1.vDomChanged(this.vDomIndex);
        return this;
    };

    CanvasNodeExe.prototype.translate = function Ctranslate(XY) {
        if (!this.attr.transform) {
            this.attr.transform = {};
        }

        this.attr.transform.translate = XY;
        this.dom.setAttr("transform", this.attr.transform);
        this.BBoxUpdate = true;
        queueInstance$1.vDomChanged(this.vDomIndex);
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
        queueInstance$1.vDomChanged(this.vDomIndex);
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
        queueInstance$1.vDomChanged(this.vDomIndex);
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

    CanvasNodeExe.prototype.prependChild = function child(childrens) {
        const self = this;
        const childrensLocal = childrens;

        if (self.dom instanceof RenderGroup) {
            for (let i = 0; i < childrensLocal.length; i += 1) {
                childrensLocal[i].dom.parent = self;
                self.children.unshift(childrensLocal[i]);
            }
        } else {
            console.error("Trying to insert child to nonGroup Element");
        }

        this.BBoxUpdate = true;
        queueInstance$1.vDomChanged(this.vDomIndex);
        return self;
    };

    CanvasNodeExe.prototype.child = function child(childrens) {
        const self = this;
        const childrensLocal = childrens;

        if (self.dom instanceof RenderGroup) {
            for (let i = 0; i < childrensLocal.length; i += 1) {
                childrensLocal[i].dom.parent = self;
                self.children[self.children.length] = childrensLocal[i];
            }
        } else {
            console.error("Trying to insert child to nonGroup Element");
        }

        this.BBoxUpdate = true;
        queueInstance$1.vDomChanged(this.vDomIndex);
        return self;
    };

    CanvasNodeExe.prototype.updateBBox = function CupdateBBox() {
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
                    hndlr.constructor === zoomInstance$1.constructor ||
                    hndlr.constructor === dragInstance$1.constructor
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
        queueInstance$1.vDomChanged(this.vDomIndex);
        return e;
    };

    CanvasNodeExe.prototype.text = function Ctext(value) {
        if (this.dom instanceof RenderText) {
            this.dom.text(value);
        }

        queueInstance$1.vDomChanged(this.vDomIndex);
        return this;
    };

    CanvasNodeExe.prototype.createEl = function CcreateEl(config) {
        const e = new CanvasNodeExe(this.dom.ctx, config, domId$1(), this.vDomIndex);
        this.child([e]);
        queueInstance$1.vDomChanged(this.vDomIndex);
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
        queueInstance$1.vDomChanged(this.vDomIndex);
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

    function canvasLayer$1(container, contextConfig = {}, layerSettings = {}) {
        const res = container ? document.querySelector(container) : null;
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

        const root = new CanvasNodeExe(
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

        if (vDomInstance) {
            vDomInstance.rootNode(root);
        }

        const execute = root.execute.bind(root);
        root.container = res;
        root.domEl = layer;
        root.height = height;
        root.width = width;
        root.type = "CANVAS";
        root.ctx = ctx;

        root.setClear = function (exe) {
            onClear = exe;
        };

        root.setAttr = function (prop, value) {
            if (prop === "viewBox") {
                this.setViewBox.apply(this, value.split(","));
            }
            layer.setAttribute(prop, value);
            this.attr[prop] = value;
        };

        root.enableEvents = function (flag) {
            enableEvents = flag;
        };

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

            if (resizeCall) {
                resizeCall();
            }
            root.execute();
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

        root.onResize = function (exec) {
            resizeCall = exec;
        };

        root.onChange = function (exec) {
            onChangeExe = exec;
        };

        root.toDataURL = function (p) {
            return this.domEl.toDataURL(p);
        };

        root.invokeOnChange = function () {};

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

        root.setViewBox = function (x, y, height, width) {};

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

        root.clear = function () {
            onClear();
        };

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

        root.update = function executeUpdate() {
            this.execute();
        };

        root.createTexture = function (config) {
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

        root.destroy = function () {
            const res = document.querySelector(container);
            if (res && res.contains(layer)) {
                res.removeChild(layer);
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

        queueInstance$1.execute();

        if (enableResize && root.container) {
            layerResizeBind(root, resize);
            // window.addEventListener("resize", resize);
        }

        return root;
    }

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
                self.attr.height = self.attr.height ? self.attr.height : this.naturalHeight;
                self.attr.width = self.attr.width ? self.attr.width : this.naturalWidth;
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
        // self.attr = props;
        self.nodeName = "Sprite";
        self.nodeExe = nodeExe;

        for (const key in self.attr) {
            self.setAttr(key, self.attr[key]);
        }

        queueInstance$1.vDomChanged(nodeExe.vDomIndex);
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

    function canvasNodeLayer$1(config, height = 0, width = 0) {
        if (!Canvas) {
            console.error("Canvas missing from node");
            console.error('Install "Canvas" "canvas-5-polyfill" node modules');
            console.error('Make "Canvas" "Image" "Path2D" objects global from the above modules');
            return;
        }
        let onChangeExe;
        const layer = new Canvas(width, height);
        let ctx = layer.getContext("2d", config);
        const ratio = getPixlRatio$1(ctx);
        let onClear = function (ctx) {
            ctx.clearRect(0, 0, width * ratio, height * ratio);
        };
        const vDomInstance = new VDom();
        const vDomIndex = queueInstance$1.addVdom(vDomInstance);
        const root = new CanvasNodeExe(
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
        vDomInstance.rootNode(root);
        const execute = root.execute.bind(root);
        root.domEl = layer;
        root.height = height;
        root.width = width;
        root.type = "CANVAS";
        root.ENV = "NODE";

        root.setClear = function (exe) {
            onClear = exe;
        };

        root.onChange = function (exec) {
            onChangeExe = exec;
        };

        root.getPixels = function (x, y, width_, height_) {
            return this.ctx.getImageData(x, y, width_, height_);
        };

        root.putPixels = function (imageData, x, y) {
            return this.ctx.putImageData(imageData, x, y);
        };

        root.clear = function () {
            onClear();
        };

        root.setContext = function (prop, value) {
            /** Expecting value to be array if multiple aruments */
            if (this.ctx[prop] && typeof this.ctx[prop] === "function") {
                this.ctx[prop].apply(null, value);
            } else if (this.ctx[prop]) {
                this.ctx[prop] = value;
            }
        };

        root.setSize = function (width_, height_) {
            // cHeight = height_;
            // cWidth = width_;
            width = width_;
            height = height_;
            this.domEl = new Canvas(width, height);
            ctx = this.domEl.getContext("2d", config);
            this.width = width;
            this.height = height;
            this.ctx = ctx;
            this.execute();
        };

        root.execute = function () {
            onClear(ctx);
            ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
            root.updateBBox();
            execute();
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

        root.update = function executeUpdate() {
            this.execute();
        };

        root.toDataURL = function (p) {
            return this.domEl.toDataURL(p);
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

        root.clear = function () {
            onClear();
        };

        root.createTexture = function (config) {
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

        return root;
    }

    var canvasAPI = {
        canvasLayer: canvasLayer$1,
        canvasNodeLayer: canvasNodeLayer$1,
    };

    /* eslint-disable no-undef */
    function shaders(el) {
        let res;

        switch (el) {
            case "point":
                res = {
                    vertexShader: `
          precision highp float;
          attribute vec2 a_position;
          attribute vec4 a_color;
          attribute float a_size;
          
          attribute mat3 a_transformMatrix;
          
          varying vec4 v_color;
          void main() {
            gl_Position = vec4(a_transformMatrix * vec3(a_position, 1), 1);
            gl_PointSize = a_size;
            v_color = a_color;
          }
          `,
                    fragmentShader: `
                    precision mediump float;
                    varying vec4 v_color;
                    void main() {
                        gl_FragColor = v_color;
                    }
                    `,
                };
                break;

            case "circle":
                res = {
                    vertexShader: `
                  precision highp float;
                    attribute vec2 a_position;
                    attribute vec4 a_color;
                    attribute float a_radius;
                    attribute mat3 a_transformMatrix;
                    varying vec4 v_color;

                    void main() {
                      gl_Position = vec4(a_transformMatrix * vec3(a_position, 1), 1);
                      gl_PointSize = a_radius; // * a_transform.z * u_transform.z;
                      v_color = a_color;
                    }
                    `,
                    fragmentShader: `
                    precision mediump float;
                    varying vec4 v_color;
                    void main() {
                      float r = 0.0, delta = 0.0, alpha = 1.0;
                      vec2 cxy = 2.0 * gl_PointCoord - 1.0;
                      r = dot(cxy, cxy);
                      if(r > 1.0) {
                        discard;
                      }
                      delta = 0.09;
                      alpha = 1.0 - smoothstep(1.0 - delta, 1.0 + delta, r);
                      gl_FragColor = v_color * alpha;
                    }
                    `,
                };
                break;

            // case "ellipse":
            //     res = {
            //         vertexShader: `
            //             precision highp float;
            //               attribute vec2 a_position;
            //               attribute vec4 a_color;
            //               attribute float a_r1;
            //               attribute float a_r2;
            //               uniform vec2 u_resolution;
            //               uniform vec4 u_transform;
            //               attribute vec4 a_transform;
            //               varying vec4 v_color;
            //               varying float v_r1;
            //               varying float v_r2;

            //               void main() {
            //                 vec2 zeroToOne = (a_transform.xy + u_transform.xy + a_position) / u_resolution;
            //                 vec2 clipSpace = (zeroToOne * 2.0 - 1.0);
            //                 gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
            //                 gl_PointSize = max(a_r1, a_r2) * a_transform.z * u_transform.z;
            //                 v_color = a_color;
            //                 v_r1 = a_r1;
            //                 v_r2 = a_r2;
            //               }
            //   `,
            //         fragmentShader: `
            //             precision mediump float;
            //             varying vec4 v_color;
            //             varying float v_r1;
            //             varying float v_r2;
            //             void main() {
            //               float r = 0.0, delta = 0.0, alpha = 1.0;
            //               vec2 cxy = 2.0 * gl_PointCoord - 1.0;
            //               r = ((cxy.x * cxy.x) / (v_r1 * v_r1), (cxy.y * cxy.y) / (v_r2 * v_r2));
            //               if(r > 1.0) {
            //                 discard;
            //               }
            //               delta = 0.09;
            //               alpha = 1.0 - smoothstep(1.0 - delta, 1.0 + delta, r);
            //               gl_FragColor = v_color * alpha;
            //             }
            //             `,
            //     };
            //     break;

            case "image":
                res = {
                    vertexShader: `
                    precision highp float;
                    attribute vec2 a_position;
                    attribute vec2 a_texCoord;
                    uniform mat3 u_transformMatrix;
                    varying vec2 v_texCoord;

                    void main() {
                      gl_Position = vec4(u_transformMatrix * vec3(a_position, 1), 1);
                      v_texCoord = a_texCoord;
                    }
          `,
                    fragmentShader: `
                    precision mediump float;
                    uniform sampler2D u_image;
                    uniform float u_opacity;
                    varying vec2 v_texCoord;
                    void main() {
                      vec4 col = texture2D(u_image, v_texCoord);
                      if (col.a == 0.0) {
                        discard;
                      } else {
                        gl_FragColor = col;
                        gl_FragColor.a *= u_opacity;
                      }
                    }
                    `,
                };
                break;

            case "polyline":
            case "polygon":
                res = {
                    vertexShader: `
                    precision highp float;
                    attribute vec2 a_position;
                    uniform mat3 u_transformMatrix;

                    void main() {
                      gl_Position = vec4(u_transformMatrix * vec3(a_position, 1), 1);
                    }
                    `,
                    fragmentShader: `
                    precision mediump float;
                    uniform vec4 u_color;
                    void main() {
                        gl_FragColor = u_color;
                    }
                    `,
                };
                break;

            case "rect":
                res = {
                    vertexShader: `
                    precision highp float;
                    attribute vec2 a_position;
                    attribute vec4 a_color;
                    attribute mat3 a_transformMatrix;
                    varying vec4 v_color;

                    void main() {
                      gl_Position = vec4(a_transformMatrix * vec3(a_position, 1), 1);
                      v_color = a_color;
                    }
                    `,
                    fragmentShader: `
                    precision mediump float;
                    varying vec4 v_color;
                    void main() {
                        gl_FragColor = v_color;
                    }
                    `,
                };
                break;

            case "line":
                res = {
                    vertexShader: `
                    precision highp float;
                    attribute vec2 a_position;
                    attribute vec4 a_color;
                    attribute mat3 a_transformMatrix;
                    varying vec4 v_color;

                    void main() {
                      gl_Position = vec4(a_transformMatrix * vec3(a_position, 1), 1);
                      v_color = a_color;
                    }
                    `,
                    fragmentShader: `
                    precision mediump float;
                    varying vec4 v_color;
                    void main() {
                        gl_FragColor = v_color;
                    }
                    `,
                };
                break;

            default:
                res = {
                    vertexShader: `
                    precision highp float;
                    attribute vec2 a_position;
                    attribute vec4 a_color;
                    attribute mat3 a_transformMatrix;
                    varying vec4 v_color;

                    void main() {
                      gl_Position = vec4(a_transformMatrix * vec3(a_position, 1), 1);
                      v_color = a_color;
                    }
                    `,
                    fragmentShader: `
                    precision mediump float;
                    varying vec4 v_color;
                    void main() {
                        gl_FragColor = v_color;
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
        // if (this.shader) {
        //     this.shader.addTransform(this.transformMatrix, this.pindex);
        // }
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
        return earcut$1(
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
        // this.dom.on(eventType, hndlr);
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
        const res = container ? document.querySelector(container) : null;
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

    function _classCallCheck(instance, Constructor) {
      if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
      }
    }

    /* eslint-disable no-bitwise -- used for calculations */

    /* eslint-disable unicorn/prefer-query-selector -- aiming at
      backward-compatibility */

    /**
    * StackBlur - a fast almost Gaussian Blur For Canvas
    *
    * In case you find this class useful - especially in commercial projects -
    * I am not totally unhappy for a small donation to my PayPal account
    * mario@quasimondo.de
    *
    * Or support me on flattr:
    * {@link https://flattr.com/thing/72791/StackBlur-a-fast-almost-Gaussian-Blur-Effect-for-CanvasJavascript}.
    *
    * @module StackBlur
    * @author Mario Klingemann
    * Contact: mario@quasimondo.com
    * Website: {@link http://www.quasimondo.com/StackBlurForCanvas/StackBlurDemo.html}
    * Twitter: @quasimondo
    *
    * @copyright (c) 2010 Mario Klingemann
    *
    * Permission is hereby granted, free of charge, to any person
    * obtaining a copy of this software and associated documentation
    * files (the "Software"), to deal in the Software without
    * restriction, including without limitation the rights to use,
    * copy, modify, merge, publish, distribute, sublicense, and/or sell
    * copies of the Software, and to permit persons to whom the
    * Software is furnished to do so, subject to the following
    * conditions:
    *
    * The above copyright notice and this permission notice shall be
    * included in all copies or substantial portions of the Software.
    *
    * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
    * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
    * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
    * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
    * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
    * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
    * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
    * OTHER DEALINGS IN THE SOFTWARE.
    */
    var mulTable = [512, 512, 456, 512, 328, 456, 335, 512, 405, 328, 271, 456, 388, 335, 292, 512, 454, 405, 364, 328, 298, 271, 496, 456, 420, 388, 360, 335, 312, 292, 273, 512, 482, 454, 428, 405, 383, 364, 345, 328, 312, 298, 284, 271, 259, 496, 475, 456, 437, 420, 404, 388, 374, 360, 347, 335, 323, 312, 302, 292, 282, 273, 265, 512, 497, 482, 468, 454, 441, 428, 417, 405, 394, 383, 373, 364, 354, 345, 337, 328, 320, 312, 305, 298, 291, 284, 278, 271, 265, 259, 507, 496, 485, 475, 465, 456, 446, 437, 428, 420, 412, 404, 396, 388, 381, 374, 367, 360, 354, 347, 341, 335, 329, 323, 318, 312, 307, 302, 297, 292, 287, 282, 278, 273, 269, 265, 261, 512, 505, 497, 489, 482, 475, 468, 461, 454, 447, 441, 435, 428, 422, 417, 411, 405, 399, 394, 389, 383, 378, 373, 368, 364, 359, 354, 350, 345, 341, 337, 332, 328, 324, 320, 316, 312, 309, 305, 301, 298, 294, 291, 287, 284, 281, 278, 274, 271, 268, 265, 262, 259, 257, 507, 501, 496, 491, 485, 480, 475, 470, 465, 460, 456, 451, 446, 442, 437, 433, 428, 424, 420, 416, 412, 408, 404, 400, 396, 392, 388, 385, 381, 377, 374, 370, 367, 363, 360, 357, 354, 350, 347, 344, 341, 338, 335, 332, 329, 326, 323, 320, 318, 315, 312, 310, 307, 304, 302, 299, 297, 294, 292, 289, 287, 285, 282, 280, 278, 275, 273, 271, 269, 267, 265, 263, 261, 259];
    var shgTable = [9, 11, 12, 13, 13, 14, 14, 15, 15, 15, 15, 16, 16, 16, 16, 17, 17, 17, 17, 17, 17, 17, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24];
    /**
     * @param {ImageData} imageData
     * @param {Integer} topX
     * @param {Integer} topY
     * @param {Integer} width
     * @param {Integer} height
     * @param {Float} radius
     * @returns {ImageData}
     */


    function processImageDataRGBA(imageData, topX, topY, width, height, radius) {
      var pixels = imageData.data;
      var div = 2 * radius + 1; // const w4 = width << 2;

      var widthMinus1 = width - 1;
      var heightMinus1 = height - 1;
      var radiusPlus1 = radius + 1;
      var sumFactor = radiusPlus1 * (radiusPlus1 + 1) / 2;
      var stackStart = new BlurStack();
      var stack = stackStart;
      var stackEnd;

      for (var i = 1; i < div; i++) {
        stack = stack.next = new BlurStack();

        if (i === radiusPlus1) {
          stackEnd = stack;
        }
      }

      stack.next = stackStart;
      var stackIn = null,
          stackOut = null,
          yw = 0,
          yi = 0;
      var mulSum = mulTable[radius];
      var shgSum = shgTable[radius];

      for (var y = 0; y < height; y++) {
        stack = stackStart;
        var pr = pixels[yi],
            pg = pixels[yi + 1],
            pb = pixels[yi + 2],
            pa = pixels[yi + 3];

        for (var _i = 0; _i < radiusPlus1; _i++) {
          stack.r = pr;
          stack.g = pg;
          stack.b = pb;
          stack.a = pa;
          stack = stack.next;
        }

        var rInSum = 0,
            gInSum = 0,
            bInSum = 0,
            aInSum = 0,
            rOutSum = radiusPlus1 * pr,
            gOutSum = radiusPlus1 * pg,
            bOutSum = radiusPlus1 * pb,
            aOutSum = radiusPlus1 * pa,
            rSum = sumFactor * pr,
            gSum = sumFactor * pg,
            bSum = sumFactor * pb,
            aSum = sumFactor * pa;

        for (var _i2 = 1; _i2 < radiusPlus1; _i2++) {
          var p = yi + ((widthMinus1 < _i2 ? widthMinus1 : _i2) << 2);
          var r = pixels[p],
              g = pixels[p + 1],
              b = pixels[p + 2],
              a = pixels[p + 3];
          var rbs = radiusPlus1 - _i2;
          rSum += (stack.r = r) * rbs;
          gSum += (stack.g = g) * rbs;
          bSum += (stack.b = b) * rbs;
          aSum += (stack.a = a) * rbs;
          rInSum += r;
          gInSum += g;
          bInSum += b;
          aInSum += a;
          stack = stack.next;
        }

        stackIn = stackStart;
        stackOut = stackEnd;

        for (var x = 0; x < width; x++) {
          var paInitial = aSum * mulSum >> shgSum;
          pixels[yi + 3] = paInitial;

          if (paInitial !== 0) {
            var _a2 = 255 / paInitial;

            pixels[yi] = (rSum * mulSum >> shgSum) * _a2;
            pixels[yi + 1] = (gSum * mulSum >> shgSum) * _a2;
            pixels[yi + 2] = (bSum * mulSum >> shgSum) * _a2;
          } else {
            pixels[yi] = pixels[yi + 1] = pixels[yi + 2] = 0;
          }

          rSum -= rOutSum;
          gSum -= gOutSum;
          bSum -= bOutSum;
          aSum -= aOutSum;
          rOutSum -= stackIn.r;
          gOutSum -= stackIn.g;
          bOutSum -= stackIn.b;
          aOutSum -= stackIn.a;

          var _p = x + radius + 1;

          _p = yw + (_p < widthMinus1 ? _p : widthMinus1) << 2;
          rInSum += stackIn.r = pixels[_p];
          gInSum += stackIn.g = pixels[_p + 1];
          bInSum += stackIn.b = pixels[_p + 2];
          aInSum += stackIn.a = pixels[_p + 3];
          rSum += rInSum;
          gSum += gInSum;
          bSum += bInSum;
          aSum += aInSum;
          stackIn = stackIn.next;
          var _stackOut = stackOut,
              _r = _stackOut.r,
              _g = _stackOut.g,
              _b = _stackOut.b,
              _a = _stackOut.a;
          rOutSum += _r;
          gOutSum += _g;
          bOutSum += _b;
          aOutSum += _a;
          rInSum -= _r;
          gInSum -= _g;
          bInSum -= _b;
          aInSum -= _a;
          stackOut = stackOut.next;
          yi += 4;
        }

        yw += width;
      }

      for (var _x = 0; _x < width; _x++) {
        yi = _x << 2;

        var _pr = pixels[yi],
            _pg = pixels[yi + 1],
            _pb = pixels[yi + 2],
            _pa = pixels[yi + 3],
            _rOutSum = radiusPlus1 * _pr,
            _gOutSum = radiusPlus1 * _pg,
            _bOutSum = radiusPlus1 * _pb,
            _aOutSum = radiusPlus1 * _pa,
            _rSum = sumFactor * _pr,
            _gSum = sumFactor * _pg,
            _bSum = sumFactor * _pb,
            _aSum = sumFactor * _pa;

        stack = stackStart;

        for (var _i3 = 0; _i3 < radiusPlus1; _i3++) {
          stack.r = _pr;
          stack.g = _pg;
          stack.b = _pb;
          stack.a = _pa;
          stack = stack.next;
        }

        var yp = width;
        var _gInSum = 0,
            _bInSum = 0,
            _aInSum = 0,
            _rInSum = 0;

        for (var _i4 = 1; _i4 <= radius; _i4++) {
          yi = yp + _x << 2;

          var _rbs = radiusPlus1 - _i4;

          _rSum += (stack.r = _pr = pixels[yi]) * _rbs;
          _gSum += (stack.g = _pg = pixels[yi + 1]) * _rbs;
          _bSum += (stack.b = _pb = pixels[yi + 2]) * _rbs;
          _aSum += (stack.a = _pa = pixels[yi + 3]) * _rbs;
          _rInSum += _pr;
          _gInSum += _pg;
          _bInSum += _pb;
          _aInSum += _pa;
          stack = stack.next;

          if (_i4 < heightMinus1) {
            yp += width;
          }
        }

        yi = _x;
        stackIn = stackStart;
        stackOut = stackEnd;

        for (var _y = 0; _y < height; _y++) {
          var _p2 = yi << 2;

          pixels[_p2 + 3] = _pa = _aSum * mulSum >> shgSum;

          if (_pa > 0) {
            _pa = 255 / _pa;
            pixels[_p2] = (_rSum * mulSum >> shgSum) * _pa;
            pixels[_p2 + 1] = (_gSum * mulSum >> shgSum) * _pa;
            pixels[_p2 + 2] = (_bSum * mulSum >> shgSum) * _pa;
          } else {
            pixels[_p2] = pixels[_p2 + 1] = pixels[_p2 + 2] = 0;
          }

          _rSum -= _rOutSum;
          _gSum -= _gOutSum;
          _bSum -= _bOutSum;
          _aSum -= _aOutSum;
          _rOutSum -= stackIn.r;
          _gOutSum -= stackIn.g;
          _bOutSum -= stackIn.b;
          _aOutSum -= stackIn.a;
          _p2 = _x + ((_p2 = _y + radiusPlus1) < heightMinus1 ? _p2 : heightMinus1) * width << 2;
          _rSum += _rInSum += stackIn.r = pixels[_p2];
          _gSum += _gInSum += stackIn.g = pixels[_p2 + 1];
          _bSum += _bInSum += stackIn.b = pixels[_p2 + 2];
          _aSum += _aInSum += stackIn.a = pixels[_p2 + 3];
          stackIn = stackIn.next;
          _rOutSum += _pr = stackOut.r;
          _gOutSum += _pg = stackOut.g;
          _bOutSum += _pb = stackOut.b;
          _aOutSum += _pa = stackOut.a;
          _rInSum -= _pr;
          _gInSum -= _pg;
          _bInSum -= _pb;
          _aInSum -= _pa;
          stackOut = stackOut.next;
          yi += width;
        }
      }

      return imageData;
    }
    /**
     *
     */


    var BlurStack =
    /**
     * Set properties.
     */
    function BlurStack() {
      _classCallCheck(this, BlurStack);

      this.r = 0;
      this.g = 0;
      this.b = 0;
      this.a = 0;
      this.next = null;
    };

    var utilities = {
        blur: function (radius = 1) {
            function blurExec(imageData) {
                return processImageDataRGBA(imageData, 0, 0, imageData.width, imageData.height, radius);
            }
            return blurExec;
        },
        greyScale: function () {},
    };

    const pathIns = path.instance;
    const canvasLayer = canvasAPI.canvasLayer;
    const canvasNodeLayer = canvasAPI.canvasNodeLayer;

    exports.Path = pathIns;
    exports.behaviour = behaviour;
    exports.canvasLayer = canvasLayer;
    exports.canvasNodeLayer = canvasNodeLayer;
    exports.chain = chain;
    exports.color = colorMap$1;
    exports.ease = fetchTransitionType;
    exports.geometry = geometry;
    exports.queue = queue;
    exports.svgLayer = svgLayer;
    exports.utility = utilities;
    exports.webglLayer = webglLayer;

    Object.defineProperty(exports, '__esModule', { value: true });

}));
