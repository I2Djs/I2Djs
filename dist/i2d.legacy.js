/*!
      * i2djs v3.2.0
      * (c) 2020 Narayana Swamy (narayanaswamy14@gmail.com)
      * @license BSD-3-Clause
      */
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = global || self, factory(global.i2d = {}));
}(this, function (exports) { 'use strict';

    /* eslint-disable no-undef */
    var animatorInstance = null;
    var tweens = [];
    var vDoms = {};
    var vDomIds = [];
    var animeFrameId;
    var onFrameExe = [];

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
        if (typeof _ !== "function") { return; }
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

        var index = onFrameExe.indexOf(_);

        if (index !== -1) {
            onFrameExe.splice(index, 1);
        }
    }

    function add(uId, executable, easying) {
        var exeObj = new Tween(uId, executable, easying);
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

    function remove(exeObj) {
        var index = tweens.indexOf(exeObj);
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
        startAnimeFrames: startAnimeFrames,
        stopAnimeFrame: stopAnimeFrame,
        add: add,
        remove: remove,
        // end: endExe,
        onRequestFrame: onRequestFrame,
        removeRequestFrameCall: removeRequestFrameCall,
        clearAll: function () {
            tweens = [];
            onFrameExe = []; // if (this.endExe) { this.endExe() }
            // this.stopAnimeFrame()
        },
    };

    ExeQueue.prototype.addVdom = function AaddVdom(_) {
        var ind = vDomIds.length + 1;
        vDoms[ind] = _;
        vDomIds.push(ind);
        this.startAnimeFrames();
        return ind;
    };

    ExeQueue.prototype.removeVdom = function removeVdom(_) {
        var index = vDomIds.indexOf(_);

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
            var ids = vDom.split(":");
            if (vDoms[ids[0]] && vDoms[ids[0]].stateModified !== undefined) {
                vDoms[ids[0]].stateModified = true;
                vDoms[ids[0]].root.stateModified = true;
                var childRootNode = vDoms[ids[0]].root.fetchEl("#" + ids[1]);
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
        for (var i = 0, len = vDomIds.length; i < len; i += 1) {
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

    var d;
    var t;
    var abs = Math.abs;
    var counter = 0;
    var tweensN = [];

    function exeFrameCaller() {
        try {
            tweensN = [];
            counter = 0;
            t = performance.now();

            for (var i = 0; i < tweens.length; i += 1) {
                d = tweens[i];
                d.lastTime += t - d.currTime;
                d.currTime = t;

                if (d.lastTime < d.duration && d.lastTime >= 0) {
                    d.execute(abs(d.factor - d.easying(d.lastTime, d.duration)));
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
                var animList = d.executable.target.animList;
                if (animList && animList.length > 0) {
                    if (animList.length === 1) {
                        d.executable.target.animList = [];
                    } else if (animList.length > 1) {
                        var index = animList.indexOf(d);
                        if (index !== -1) {
                            animList.splice(index, 1);
                        }
                    }
                }
            }
        } else {
            d.loopTracker += 1;
            d.lastTime = d.lastTime - d.duration;

            if (d.direction === "alternate") {
                d.factor = 1 - d.factor;
            } else if (d.direction === "reverse") {
                d.factor = 1;
            } else {
                d.factor = 0;
            }

            d.execute(abs(d.factor - d.easying(d.lastTime, d.duration)));
            tweensN[counter++] = d;
        }
    }

    function onFrameExeFun() {
        for (var i = 0; i < onFrameExe.length; i += 1) {
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
        var self = this;
        var node, temp;

        for (var i = 0; i <= nodes.length - 1; i += 1) {
            var d = nodes[i];
            var coOr = {
                x: mouseCoor.x,
                y: mouseCoor.y,
            };
            transformCoOr(d, coOr);

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

    VDom.prototype.transformCoOr = transformCoOr;

    // VDom.prototype.onchange = function () {
    // 	// this.root.invokeOnChange();
    // };

    function transformCoOr(d, coOr) {
        var assign;

        var hozMove = 0;
        var verMove = 0;
        var scaleX = 1;
        var scaleY = 1;
        var coOrLocal = coOr;

        if (d.attr.transform && d.attr.transform.translate) {
            (assign = d.attr.transform.translate, hozMove = assign[0], verMove = assign[1]);
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
            var rotate = d.attr.transform.rotate[0];

            var cen = {
                x: d.attr.transform.rotate[1],
                y: d.attr.transform.rotate[2],
            };
            var x = coOrLocal.x;
            var y = coOrLocal.y;
            var cx = cen.x;
            var cy = cen.y;
            var radians = (Math.PI / 180) * rotate;
            var cos = Math.cos(radians);
            var sin = Math.sin(radians);
            coOrLocal.x = cos * (x - cx) + sin * (y - cy) + cx;
            coOrLocal.y = cos * (y - cy) - sin * (x - cx) + cy;
        }
    }

    /* eslint-disable no-undef */
    var sqrt = Math.sqrt;
    var sin = Math.sin;
    var cos = Math.cos;
    var abs$1 = Math.abs;
    var atan2 = Math.atan2;
    var tan = Math.tan;
    var PI = Math.PI;
    var ceil = Math.ceil;
    var max = Math.max;

    function pw(a, x) {
        var val = 1;
        if (x === 0) { return val; }

        for (var i = 1; i <= x; i += 1) {
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
        var a = {};
        var b = {};
        a.x = p0.x + p2.x - 2 * p1.x;
        a.y = p0.y + p2.y - 2 * p1.y;
        b.x = 2 * p1.x - 2 * p0.x;
        b.y = 2 * p1.y - 2 * p0.y;
        var A = 4 * (a.x * a.x + a.y * a.y);
        var B = 4 * (a.x * b.x + a.y * b.y);
        var C = b.x * b.x + b.y * b.y;
        var Sabc = 2 * sqrt(A + B + C);
        var A_2 = sqrt(A);
        var A_32 = 2 * A * A_2;
        var C_2 = 2 * sqrt(C);
        var BA = B / A_2;
        var logVal = (2 * A_2 + BA + Sabc) / (BA + C_2);
        logVal = isNaN(logVal) || abs$1(logVal) === Infinity ? 1 : logVal;
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
        var interval = 0.001;
        var sum = 0;
        var cubicBezierTransitionInstance = cubicBezierTransition.bind(null, p0, co);
        var p1;
        var p2;

        for (var i = 0; i <= 1; i += interval) {
            p1 = cubicBezierTransitionInstance(i);
            p2 = cubicBezierTransitionInstance(i + interval);
            sum += sqrt(pw((p2.x - p1.x) / interval, 2) + pw((p2.y - p1.y) / interval, 2)) * interval;
        }

        return sum;
    }

    function getDistance(p1, p2) {
        var cPw = 0;

        for (var p in p1) {
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
        var co_ = {};

        for (var prop in co) {
            co_[prop] = co[prop] * factor;
        }

        return co_;
    }

    function scaleAlongPoint(p, r, f) {
        var s = (p.y - r.y) / (p.x - r.x);
        var xX = p.x * f;
        var yY = (s * (xX - r.x) + r.y) * f;
        return {
            x: xX,
            y: yY,
        };
    }

    function cubicBezierCoefficients(p) {
        var cx = 3 * (p.cntrl1.x - p.p0.x);
        var bx = 3 * (p.cntrl2.x - p.cntrl1.x) - cx;
        var ax = p.p1.x - p.p0.x - cx - bx;
        var cy = 3 * (p.cntrl1.y - p.p0.y);
        var by = 3 * (p.cntrl2.y - p.cntrl1.y) - cy;
        var ay = p.p1.y - p.p0.y - cy - by;
        return {
            cx: cx,
            bx: bx,
            ax: ax,
            cy: cy,
            by: by,
            ay: ay,
        };
    }

    function toCubicCurves(stack) {
        if (!stack.length) {
            return;
        }

        var _ = stack;
        var mappedArr = [];

        for (var i = 0; i < _.length; i += 1) {
            if (["M", "C", "S", "Q"].indexOf(_[i].type) !== -1) {
                mappedArr.push(_[i]);
            } else if (["V", "H", "L", "Z"].indexOf(_[i].type) !== -1) {
                var ctrl1 = {
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
        var p3 = pw(f, 3);
        var p2 = pw(f, 2);
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

    function getBBox(gcmxArr) {
        var minX = Infinity;
        var minY = Infinity;
        var maxX = -Infinity;
        var maxY = -Infinity; // const exe = []

        var d;
        var point;

        for (var j = 0; j < gcmxArr.length; j++) {
            var cmxArr = gcmxArr[j];
            for (var i = 0; i < cmxArr.length; i += 1) {
                d = cmxArr[i];

                if (["V", "H", "L", "v", "h", "l"].indexOf(d.type) !== -1) {
                    [d.p0 ? d.p0 : cmxArr[i - 1].p1, d.p1].forEach(function (point) {
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
                    var co = cubicBezierCoefficients(d);
                    var exe = cubicBezierTransition.bind(null, d.p0, co);
                    var ii = 0;
                    var point$1 = (void 0);

                    while (ii < 1) {
                        point$1 = exe(ii);
                        ii += 0.05;

                        if (point$1.x < minX) {
                            minX = point$1.x;
                        }

                        if (point$1.x > maxX) {
                            maxX = point$1.x;
                        }

                        if (point$1.y < minY) {
                            minY = point$1.y;
                        }

                        if (point$1.y > maxY) {
                            maxY = point$1.y;
                        }
                    }
                } else {
                    point = d.p0;

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
            }
        }

        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY,
        };
    }

    var _slicedToArray = (function () {
        function sliceIterator(arr, i) {
            var _arr = [];
            var _n = true;
            var _d = false;

            var _e;

            try {
                for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
                    _arr.push(_s.value);

                    if (i && _arr.length === i) { break; }
                }
            } catch (err) {
                _d = true;
                _e = err;
            } finally {
                try {
                    if (!_n && _i.return) { _i.return(); }
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

    var TAU = PI * 2;

    var mapToEllipse = function mapToEllipse(_ref, rx, ry, cosphi, sinphi, centerx, centery) {
        var x = _ref.x;
        var y = _ref.y;
        x *= rx;
        y *= ry;
        var xp = cosphi * x - sinphi * y;
        var yp = sinphi * x + cosphi * y;
        return {
            x: xp + centerx,
            y: yp + centery,
        };
    };

    var approxUnitArc = function approxUnitArc(ang1, ang2) {
        var a = (4 / 3) * tan(ang2 / 4);
        var x1 = cos(ang1);
        var y1 = sin(ang1);
        var x2 = cos(ang1 + ang2);
        var y2 = sin(ang1 + ang2);
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
            } ];
    };

    var vectorAngle = function vectorAngle(ux, uy, vx, vy) {
        var sign = ux * vy - uy * vx < 0 ? -1 : 1;
        var umag = sqrt(ux * ux + uy * uy);
        var vmag = sqrt(ux * ux + uy * uy);
        var dot = ux * vx + uy * vy;
        var div = dot / (umag * vmag);

        if (div > 1) {
            div = 1;
        }

        if (div < -1) {
            div = -1;
        }

        return sign * Math.acos(div);
    };

    var getArcCenter = function getArcCenter(
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
        var rxsq = pw(rx, 2);
        var rysq = pw(ry, 2);
        var pxpsq = pw(pxp, 2);
        var pypsq = pw(pyp, 2);
        var radicant = rxsq * rysq - rxsq * pypsq - rysq * pxpsq;

        if (radicant < 0) {
            radicant = 0;
        }

        radicant /= rxsq * pypsq + rysq * pxpsq;
        radicant = sqrt(radicant) * (largeArcFlag === sweepFlag ? -1 : 1);
        var centerxp = ((radicant * rx) / ry) * pyp;
        var centeryp = ((radicant * -ry) / rx) * pxp;
        var centerx = cosphi * centerxp - sinphi * centeryp + (px + cx) / 2;
        var centery = sinphi * centerxp + cosphi * centeryp + (py + cy) / 2;
        var vx1 = (pxp - centerxp) / rx;
        var vy1 = (pyp - centeryp) / ry;
        var vx2 = (-pxp - centerxp) / rx;
        var vy2 = (-pyp - centeryp) / ry;
        var ang1 = vectorAngle(1, 0, vx1, vy1);
        var ang2 = vectorAngle(vx1, vy1, vx2, vy2);

        if (sweepFlag === 0 && ang2 > 0) {
            ang2 -= TAU;
        }

        if (sweepFlag === 1 && ang2 < 0) {
            ang2 += TAU;
        }

        return [centerx, centery, ang1, ang2];
    };

    var arcToBezier = function arcToBezier(_ref2) {
        var px = _ref2.px;
        var py = _ref2.py;
        var cx = _ref2.cx;
        var cy = _ref2.cy;
        var rx = _ref2.rx;
        var ry = _ref2.ry;
        var _ref2$xAxisRotation = _ref2.xAxisRotation;
        var xAxisRotation = _ref2$xAxisRotation === undefined ? 0 : _ref2$xAxisRotation;
        var _ref2$largeArcFlag = _ref2.largeArcFlag;
        var largeArcFlag = _ref2$largeArcFlag === undefined ? 0 : _ref2$largeArcFlag;
        var _ref2$sweepFlag = _ref2.sweepFlag;
        var sweepFlag = _ref2$sweepFlag === undefined ? 0 : _ref2$sweepFlag;
        var curves = [];

        if (rx === 0 || ry === 0) {
            return [];
        }

        var sinphi = sin((xAxisRotation * TAU) / 360);
        var cosphi = cos((xAxisRotation * TAU) / 360);
        var pxp = (cosphi * (px - cx)) / 2 + (sinphi * (py - cy)) / 2;
        var pyp = (-sinphi * (px - cx)) / 2 + (cosphi * (py - cy)) / 2;

        if (pxp === 0 && pyp === 0) {
            return [];
        }

        rx = abs$1(rx);
        ry = abs$1(ry);
        var lambda = pw(pxp, 2) / pw(rx, 2) + pw(pyp, 2) / pw(ry, 2);

        if (lambda > 1) {
            rx *= sqrt(lambda);
            ry *= sqrt(lambda);
        }

        var _getArcCenter = getArcCenter(
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

        var _getArcCenter2 = _slicedToArray(_getArcCenter, 4);

        var centerx = _getArcCenter2[0];
        var centery = _getArcCenter2[1];
        var ang1 = _getArcCenter2[2];
        var ang2 = _getArcCenter2[3];
        var segments = max(ceil(abs$1(ang2) / (TAU / 4)), 1);
        ang2 /= segments;

        for (var i = 0; i < segments; i++) {
            curves.push(approxUnitArc(ang1, ang2));
            ang1 += ang2;
        }

        return curves.map(function (curve) {
            var _mapToEllipse = mapToEllipse(curve[0], rx, ry, cosphi, sinphi, centerx, centery);

            var x1 = _mapToEllipse.x;
            var y1 = _mapToEllipse.y;

            var _mapToEllipse2 = mapToEllipse(curve[1], rx, ry, cosphi, sinphi, centerx, centery);

            var x2 = _mapToEllipse2.x;
            var y2 = _mapToEllipse2.y;

            var _mapToEllipse3 = mapToEllipse(curve[2], rx, ry, cosphi, sinphi, centerx, centery);

            var x = _mapToEllipse3.x;
            var y = _mapToEllipse3.y;
            return {
                x1: x1,
                y1: y1,
                x2: x2,
                y2: y2,
                x: x,
                y: y,
            };
        });
    };

    function rotatePoint(point, centre, newAngle, distance) {
        var x = point.x;
        var y = point.y;
        var cx = centre.x;
        var cy = centre.y;

        var radians = (PI / 180) * newAngle;
        var c_ = cos(-radians);
        var s_ = sin(-radians);
        return {
            x: c_ * (x - cx) + s_ * (y - cy) + cx,
            y: c_ * (y - cy) - s_ * (x - cx) + cy,
        };
    }

    function rotateBBox(BBox, transform) {
        var point1 = {
            x: BBox.x,
            y: BBox.y,
        };
        var point2 = {
            x: BBox.x + BBox.width,
            y: BBox.y,
        };
        var point3 = {
            x: BBox.x,
            y: BBox.y + BBox.height,
        };
        var point4 = {
            x: BBox.x + BBox.width,
            y: BBox.y + BBox.height,
        };
        var translate = transform.translate;
        var rotate = transform.rotate;
        var cen = {
            x: rotate[1] || 0,
            y: rotate[2] || 0,
        };
        var rotateAngle = rotate[0];

        if (translate && translate.length > 0) {
            cen.x += translate[0];
            cen.y += translate[1];
        }

        point1 = rotatePoint(point1, cen, rotateAngle, getDistance(point1, cen));
        point2 = rotatePoint(point2, cen, rotateAngle, getDistance(point2, cen));
        point3 = rotatePoint(point3, cen, rotateAngle, getDistance(point3, cen));
        point4 = rotatePoint(point4, cen, rotateAngle, getDistance(point4, cen));
        var xVec = [point1.x, point2.x, point3.x, point4.x].sort(function (bb, aa) { return bb - aa; });
        var yVec = [point1.y, point2.y, point3.y, point4.y].sort(function (bb, aa) { return bb - aa; });
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
        getDistance: getDistance,
        scaleAlongOrigin: scaleAlongOrigin,
        scaleAlongPoint: scaleAlongPoint,
        linearTransitionBetweenPoints: linearTBetweenPoints,
        bezierTransition: bezierTransition,
        bezierLength: bezierLength,
        cubicBezierTransition: cubicBezierTransition,
        cubicBezierLength: cubicBezierLength,
        cubicBezierCoefficients: cubicBezierCoefficients,
        arcToBezier: arcToBezier,
        intermediateValue: intermediateValue,
        getBBox: getBBox,
        toCubicCurves: toCubicCurves,
        rotatePoint: rotatePoint,
        rotateBBox: rotateBBox,
    };
    var geometry = new Geometry();

    /* eslint-disable no-undef */

    var t2DGeometry = geometry;

    function linear(starttime, duration) {
        return starttime / duration;
    }

    function elastic(starttime, duration) {
        var decay = 8;
        var force = 2 / 1000;
        var t = starttime / duration;
        return (
            1 -
            ((1 - t) * Math.sin(t * duration * force * Math.PI * 2 + Math.PI / 2)) / Math.exp(t * decay)
        );
    }

    function bounce(starttime, duration) {
        var decay = 10;
        var t = starttime / duration;
        var force = t / 100;
        return (
            1 -
            ((1 - t) * Math.abs(Math.sin(t * duration * force * Math.PI * 2 + Math.PI / 2))) /
                Math.exp(t * decay)
        );
    }

    function easeInQuad(starttime, duration) {
        var t = starttime / duration;
        return t * t;
    }

    function easeOutQuad(starttime, duration) {
        var t = starttime / duration;
        return t * (2 - t);
    }

    function easeInOutQuad(starttime, duration) {
        var t = starttime / duration;
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    function easeInCubic(starttime, duration) {
        var t = starttime / duration;
        return t2DGeometry.pow(t, 3);
    }

    function easeOutCubic(starttime, duration) {
        var t = starttime / duration;
        t -= 1;
        return t * t * t + 1;
    }

    function easeInOutCubic(starttime, duration) {
        var t = starttime / duration;
        return t < 0.5 ? 4 * t2DGeometry.pow(t, 3) : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    }

    function sinIn(starttime, duration) {
        var t = starttime / duration;
        return 1 - Math.cos((t * Math.PI) / 2);
    }

    function easeOutSin(starttime, duration) {
        var t = starttime / duration;
        return Math.cos((t * Math.PI) / 2);
    }

    function easeInOutSin(starttime, duration) {
        var t = starttime / duration;
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
        var res;

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

    var Id = 0;
    var chainId = 0;

    function generateRendererId() {
        Id += 1;
        return Id;
    }

    function generateChainId() {
        chainId += 1;
        return chainId;
    }

    var easying = fetchTransitionType;

    function easeDef(type) {
        this.easying = easying(type);
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
        duration: duration,
        loop: loopValue,
        callbck: callbckExe,
        bind: bind,
        child: child,
        ease: easeDef,
        end: end,
        commit: commit,
        reset: reset,
        direction: direction,
    };

    SequenceGroup.prototype.add = function SGadd(value) {
        var self = this;

        if (!Array.isArray(value) && typeof value !== "function") {
            value = [value];
        }

        if (Array.isArray(value)) {
            value.map(function (d) {
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
        var self = this;

        if (self.directionV === "alternate") {
            self.factor = self.factor ? -1 * self.factor : 1;
            self.currPos = self.factor < 0 ? this.sequenceQueue.length - 1 : 0;
        } else if (self.directionV === "reverse") {
            for (var i = 0; i < this.sequenceQueue.length; i += 1) {
                var currObj = this.sequenceQueue[i];

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
        var self = this;
        var currObj = this.sequenceQueue[self.currPos];
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
                    run: function run(f) {
                        currObj.run(f);
                    },
                    target: currObj.target,
                    delay: currObj.delay !== undefined ? currObj.delay : 0,
                    duration: currObj.duration !== undefined ? currObj.duration : self.durationP,
                    loop: currObj.loop ? currObj.loop : 1,
                    direction: self.factor < 0 ? "reverse" : "default",
                    end: self.triggerEnd.bind(self, currObj),
                },
                function (c, v) { return c / v; }
            );
        }

        return this;
    };

    SequenceGroup.prototype.triggerEnd = function SGtriggerEnd(currObj) {
        var self = this;
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
            setTimeout(function () {
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
        duration: duration,
        loop: loopValue,
        callbck: callbckExe,
        bind: bind,
        child: child,
        ease: easeDef,
        end: end,
        commit: commit,
        direction: direction,
    };

    ParallelGroup.prototype.add = function PGadd(value) {
        var self = this;

        if (!Array.isArray(value)) {
            value = [value];
        }

        this.group = this.group.concat(value);
        this.group.forEach(function (d) {
            d.durationP = d.durationP ? d.durationP : self.durationP;
        });
        return this;
    };

    ParallelGroup.prototype.execute = function PGexecute() {
        var self = this;
        self.currPos = 0;

        var loop = function ( i, len ) {
            var currObj = self.group[i];

            if (currObj instanceof SequenceGroup || currObj instanceof ParallelGroup) {
                currObj // .duration(currObj.durationP ? currObj.durationP : self.durationP)
                    .end(self.triggerEnd.bind(self, currObj))
                    .commit();
            } else {
                self.queue.add(
                    generateChainId(),
                    {
                        run: function run(f) {
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
                    currObj.ease ? easying(currObj.ease) : self.easying
                );
            }
        };

        for (var i = 0, len = self.group.length; i < len; i++) loop( i);

        return self;
    };

    ParallelGroup.prototype.start = function PGstart() {
        var self = this;

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
        var self = this; // Call child transition wen Entire parallelChain transition completes

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
        sequenceChain: sequenceChain,
        parallelChain: parallelChain,
    };

    /* eslint-disable no-undef */

    var morphIdentifier = 0;
    var t2DGeometry$1 = geometry;
    var queueInstance = queue;
    var easying$1 = fetchTransitionType;

    function animeId() {
        morphIdentifier += 1;
        return "morph_" + morphIdentifier;
    }

    function pathParser(path) {
        var pathStr = path.replace(/e-/g, "$");
        pathStr = pathStr.replace(/ /g, ",");
        pathStr = pathStr.replace(/-/g, ",-");
        pathStr = pathStr
            .split(/([a-zA-Z,])/g)
            .filter(function (d) {
                if (d === "" || d === ",") {
                    return false;
                }
                return true;
            })
            .map(function (d) {
                var dd = d.replace(/\$/g, "e-");
                return dd;
            });

        for (var i = 0; i < pathStr.length; i += 1) {
            if (pathStr[i].split(".").length > 2) {
                var splitArr = pathStr[i].split(".");
                var arr = [((splitArr[0]) + "." + (splitArr[1]))];

                for (var j = 2; j < splitArr.length; j += 1) {
                    arr.push(("." + (splitArr[j])));
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
        var x = parseFloat(this.pathArr[(this.currPathArr += 1)]);
        var y = parseFloat(this.pathArr[(this.currPathArr += 1)]);
        return {
            x: x,
            y: y,
        };
    }

    function relative(flag, p1, p2) {
        return flag ? p2 : p1;
    }

    function m(rel, p0) {
        var temp = relative(
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

            pointAt: function pointAt(f) {
                return this.p0;
            },
        });
        this.pp = this.cp;
        return this;
    }

    function v(rel, p1) {
        var temp = relative(rel, this.pp, {
            x: this.pp.x,
            y: 0,
        });
        this.cntrl = null;
        this.cp = addVectors(p1, temp);
        this.segmentLength = t2DGeometry$1.getDistance(this.pp, this.cp);
        this.stack.push({
            type: "V",
            p0: this.pp,
            p1: this.cp,
            length: this.segmentLength,

            pointAt: function pointAt(f) {
                return t2DGeometry$1.linearTransitionBetweenPoints(this.p0, this.p1, f);
            },
        });
        this.length += this.segmentLength;
        this.pp = this.cp;
        return this;
    }

    function l(rel, p1) {
        var temp = relative(rel, this.pp, {
            x: 0,
            y: 0,
        });
        this.cntrl = null;
        this.cp = addVectors(p1, temp);
        this.segmentLength = t2DGeometry$1.getDistance(this.pp, this.cp);
        this.stack.push({
            type: rel ? "L" : "l",
            p0: this.pp,
            p1: this.cp,
            relative: {
                p1: p1,
            },
            length: this.segmentLength,

            pointAt: function pointAt(f) {
                return t2DGeometry$1.linearTransitionBetweenPoints(this.p0, this.p1, f);
            },
        });
        this.length += this.segmentLength;
        this.pp = this.cp;
        return this;
    }

    function h(rel, p1) {
        var temp = relative(rel, this.pp, {
            x: 0,
            y: this.pp.y,
        });
        this.cp = addVectors(p1, temp);
        this.cntrl = null;
        this.segmentLength = t2DGeometry$1.getDistance(this.pp, this.cp);
        this.stack.push({
            type: rel ? "H" : "h",
            p0: this.pp,
            p1: this.cp,
            length: this.segmentLength,
            relative: {
                p1: p1,
            },
            pointAt: function pointAt(f) {
                return t2DGeometry$1.linearTransitionBetweenPoints(this.p0, this.p1, f);
            },
        });
        this.length += this.segmentLength;
        this.pp = this.cp;
        return this;
    }

    function z() {
        this.cp = this.start;
        this.segmentLength = t2DGeometry$1.getDistance(this.pp, this.cp);
        this.stack.push({
            p0: this.pp,
            p1: this.cp,
            type: "Z",
            length: this.segmentLength,
            pointAt: function pointAt(f) {
                return t2DGeometry$1.linearTransitionBetweenPoints(this.p0, this.p1, f);
            },
        });
        this.length += this.segmentLength;
        this.pp = this.cp; // this.stackGroup.push(this.stack)

        return this;
    }

    function q(rel, c1, ep) {
        var temp = relative(rel, this.pp, {
            x: 0,
            y: 0,
        });
        var cntrl1 = addVectors(c1, temp);
        var endPoint = addVectors(ep, temp);
        this.cp = endPoint;
        this.segmentLength = t2DGeometry$1.bezierLength(this.pp, cntrl1, this.cp);
        this.cp = endPoint;
        this.stack.push({
            type: rel ? "Q" : "q",
            p0: this.pp,
            cntrl1: cntrl1,
            cntrl2: cntrl1,
            p1: this.cp,
            relative: {
                cntrl1: c1,
                p1: ep,
            },
            length: this.segmentLength,

            pointAt: function pointAt(f) {
                return t2DGeometry$1.bezierTransition(this.p0, this.cntrl1, this.p1, f);
            },
        });
        this.length += this.segmentLength;
        this.pp = this.cp;
        this.cntrl = cntrl1;
        return this;
    }

    function c(rel, c1, c2, ep) {
        var temp = relative(rel, this.pp, {
            x: 0,
            y: 0,
        });
        var cntrl1 = addVectors(c1, temp);
        var cntrl2 = addVectors(c2, temp);
        var endPoint = addVectors(ep, temp);
        var co = t2DGeometry$1.cubicBezierCoefficients({
            p0: this.pp,
            cntrl1: cntrl1,
            cntrl2: cntrl2,
            p1: endPoint,
        });
        this.cntrl = cntrl2;
        this.cp = endPoint;
        this.segmentLength = t2DGeometry$1.cubicBezierLength(this.pp, co);
        this.stack.push({
            type: rel ? "C" : "c",
            p0: this.pp,
            cntrl1: cntrl1,
            cntrl2: cntrl2,
            p1: this.cp,
            length: this.segmentLength,
            co: co,
            relative: {
                cntrl1: c1,
                cntrl2: c2,
                p1: ep,
            },

            pointAt: function pointAt(f) {
                return t2DGeometry$1.cubicBezierTransition(this.p0, this.co, f);
            },
        });
        this.length += this.segmentLength;
        this.pp = this.cp;
        return this;
    }

    function s(rel, c2, ep) {
        var temp = relative(rel, this.pp, {
            x: 0,
            y: 0,
        });
        var cntrl2 = addVectors(c2, temp);
        var cntrl1 = this.cntrl
            ? addVectors(this.pp, subVectors(this.pp, this.cntrl ? this.cntrl : this.pp))
            : cntrl2;

        var endPoint = addVectors(ep, temp);
        this.cp = endPoint;
        var co = t2DGeometry$1.cubicBezierCoefficients({
            p0: this.pp,
            cntrl1: cntrl1,
            cntrl2: cntrl2,
            p1: endPoint,
        });
        this.segmentLength = t2DGeometry$1.cubicBezierLength(this.pp, co);
        this.stack.push({
            type: rel ? "S" : "s",
            p0: this.pp,
            cntrl1: cntrl1,
            cntrl2: cntrl2,
            p1: this.cp,
            co: co,
            length: this.segmentLength,
            relative: {
                cntrl2: c2,
                p1: ep,
            },

            pointAt: function pointAt(f) {
                return t2DGeometry$1.cubicBezierTransition(this.p0, this.co, f);
            },
        }); // this.stack.segmentLength += this.segmentLength

        this.length += this.segmentLength;
        this.pp = this.cp;
        this.cntrl = cntrl2;
        return this;
    }

    function a(rel, rx, ry, xRotation, arcLargeFlag, sweepFlag, ep) {
        var temp = relative(rel, this.pp, {
            x: 0,
            y: 0,
        });
        var self = this;
        var endPoint = addVectors(ep, temp);
        this.cp = endPoint;
        var arcToQuad = t2DGeometry$1.arcToBezier({
            px: this.pp.x,
            py: this.pp.y,
            cx: endPoint.x,
            cy: endPoint.y,
            rx: rx,
            ry: ry,
            xAxisRotation: xRotation,
            largeArcFlag: arcLargeFlag,
            sweepFlag: sweepFlag,
        });
        arcToQuad.forEach(function (d, i) {
            var pp =
                i === 0
                    ? self.pp
                    : {
                          x: arcToQuad[0].x,
                          y: arcToQuad[0].y,
                      };
            var cntrl1 = {
                x: d.x1,
                y: d.y1,
            };
            var cntrl2 = {
                x: d.x2,
                y: d.y2,
            };
            var cp = {
                x: d.x,
                y: d.y,
            };
            var segmentLength = t2DGeometry$1.cubicBezierLength(
                pp,
                t2DGeometry$1.cubicBezierCoefficients({
                    p0: pp,
                    cntrl1: cntrl1,
                    cntrl2: cntrl2,
                    p1: cp,
                })
            );
            self.stack.push({
                type: "C",
                p0: pp,
                cntrl1: cntrl1,
                cntrl2: cntrl2,
                p1: cp,
                length: segmentLength,

                pointAt: function pointAt(f) {
                    return t2DGeometry$1.bezierTransition(this.p0, this.cntrl1, this.cntrl2, this.p1, f);
                },
            });
            self.length += segmentLength;
        });
        this.pp = this.cp;
        this.cntrl = null;
        return this;
    }

    function Path(path) {
        this.stack = [];
        this.length = 0;
        this.stackGroup = [];

        if (path) {
            this.parse(path);
        }
    }

    Path.prototype = {
        z: z,
        m: m,
        v: v,
        h: h,
        l: l,
        q: q,
        s: s,
        c: c,
        a: a,
        fetchXY: fetchXY,
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

    Path.prototype.execute = function (ctx, clippath) {
        var c;
        if (!clippath) {
            ctx.beginPath();
        }
        for (var i = 0; i < this.stack.length; i++) {
            c = this.stack[i];
            if (c.type === "M" || c.type === "m") {
                ctx.moveTo(c.p0.x, c.p0.y);
            } else if (c.type === "Z" || c.type === "z") {
                ctx.lineTo(c.p1.x, c.p1.y);
            } else if (c.type === "C" || c.type === "c" || c.type === "S" || c.type === "s") {
                ctx.bezierCurveTo(c.cntrl1.x, c.cntrl1.y, c.cntrl2.x, c.cntrl2.y, c.p1.x, c.p1.y);
            } else if (c.type === "Q" || c.type === "q") {
                ctx.quadraticCurveTo(c.cntrl1.x, c.cntrl1.y, c.p1.x, c.p1.y);
            } else if (
                c.type === "V" ||
                c.type === "v" ||
                c.type === "H" ||
                c.type === "h" ||
                c.type === "l" ||
                c.type === "L"
            ) {
                ctx.lineTo(c.p1.x, c.p1.y);
            }
        }
        if (!clippath) {
            ctx.closePath();
        }
    };

    Path.prototype.fetchPathString = function () {
        var p = "";
        var c;

        for (var i = 0; i < this.stack.length; i++) {
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

        var point1 = this.getPointAtLength(length);
        var point2 = this.getPointAtLength(
            length + (dir === "src" ? -1 * length * 0.01 : length * 0.01)
        );
        return Math.atan2(point2.y - point1.y, point2.x - point1.x);
    };

    Path.prototype.getPointAtLength = function getPointAtLength(length) {
        var coOr = {
            x: 0,
            y: 0,
        };
        var tLength = length;
        this.stack.every(function (d, i) {
            tLength -= d.length;

            if (Math.floor(tLength) >= 0) {
                return true;
            }

            coOr = d.pointAt((d.length + tLength) / (d.length === 0 ? 1 : d.length));
            return false;
        });
        return coOr;
    };

    Path.prototype.isValid = function isValid(_) {
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
                "Z" ].indexOf(_) !== -1
        );
    };

    Path.prototype.case = function pCase(currCmd) {
        var currCmdI = currCmd;

        if (this.isValid(currCmdI)) {
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
                var rx = parseFloat(this.pathArr[(this.currPathArr += 1)]);
                var ry = parseFloat(this.pathArr[(this.currPathArr += 1)]);
                var xRotation = parseFloat(this.pathArr[(this.currPathArr += 1)]);
                var arcLargeFlag = parseFloat(this.pathArr[(this.currPathArr += 1)]);
                var sweepFlag = parseFloat(this.pathArr[(this.currPathArr += 1)]);
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

    var CubicBezierTransition = function CubicBezierTransition(type, p0, c1, c2, co, length) {
        this.type = type;
        this.p0 = p0;
        this.c1_src = c1;
        this.c2_src = c2;
        this.co = co;
        this.length_src = length;
    };

    CubicBezierTransition.prototype.execute = function (f) {
        var co = this.co;
        var p0 = this.p0;
        var c1 = this.c1_src;
        var c2 = this.c2_src;
        var c1Temp = {
            x: p0.x + (c1.x - p0.x) * f,
            y: p0.y + (c1.y - p0.y) * f,
        };
        var c2Temp = {
            x: c1.x + (c2.x - c1.x) * f,
            y: c1.y + (c2.y - c1.y) * f,
        };
        this.cntrl1 = c1Temp;
        this.cntrl2 = {
            x: c1Temp.x + (c2Temp.x - c1Temp.x) * f,
            y: c1Temp.y + (c2Temp.y - c1Temp.y) * f,
        };
        this.p1 = {
            x: co.ax * t2DGeometry$1.pow(f, 3) + co.bx * t2DGeometry$1.pow(f, 2) + co.cx * f + p0.x,
            y: co.ay * t2DGeometry$1.pow(f, 3) + co.by * t2DGeometry$1.pow(f, 2) + co.cy * f + p0.y,
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
        return t2DGeometry$1.cubicBezierTransition(this.p0, this.co, f);
    };

    var BezierTransition = function BezierTransition(type, p0, p1, p2, length, f) {
        this.type = type;
        this.p0 = p0;
        this.p1_src = p1;
        this.p2_src = p2;
        this.length_src = length;
        this.length = 0;
    };

    BezierTransition.prototype.execute = function (f) {
        var p0 = this.p0;
        var p1 = this.p1_src;
        var p2 = this.p2_src;
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
        return t2DGeometry$1.bezierTransition(this.p0, this.cntrl1, this.p1, f);
    };

    var LinearTransitionBetweenPoints = function LinearTransitionBetweenPoints(
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
        var p0 = this.p0;
        var p2 = this.p2_src;
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
        return t2DGeometry$1.linearTransitionBetweenPoints(this.p0, this.p1, f);
    };

    function animatePathTo(targetConfig) {
        var self = this;
        var duration = targetConfig.duration;
        var ease = targetConfig.ease;
        var end = targetConfig.end;
        var loop = targetConfig.loop;
        var direction = targetConfig.direction;
        var d = targetConfig.d;
        var src = d || self.attr.d;
        var totalLength = 0;
        self.arrayStack = [];

        if (!src) {
            throw Error("Path Not defined");
        }

        var chainInstance = chain.sequenceChain();
        var newPathInstance = isTypePath(src) ? src : new Path(src);
        var arrExe = newPathInstance.stackGroup.reduce(function (p, c) {
            p = p.concat(c);
            return p;
        }, []);
        var mappedArr = [];

        var loop$1 = function ( i ) {
            if (arrExe[i].type === "Z" || arrExe[i].type === "z") {
                mappedArr.push({
                    run: function run(f) {
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
                    run: function run(f) {
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
                    run: function run(f) {
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
                var co = t2DGeometry$1.cubicBezierCoefficients(arrExe[i]);
                mappedArr.push({
                    run: function run(f) {
                        // newPathInstance.stack.splice(this.id, newPathInstance.stack.length - 1);
                        newPathInstance.stack.length = this.id + 1;
                        newPathInstance.stack[this.id] = this.render.execute(f);
                        self.setAttr("d", newPathInstance);
                    },
                    target: self,
                    id: i,
                    co: co,
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
                    run: function run() {
                        // newPathInstance.stack.splice(this.id, newPathInstance.stack.length - 1);
                        newPathInstance.stack.length = this.id + 1;
                        newPathInstance.stack[this.id] = {
                            type: "M",
                            p0: arrExe[i].p0,
                            length: 0,

                            pointAt: function pointAt(f) {
                                return this.p0;
                            },
                        };
                    },
                    target: self,
                    id: i,
                    length: 0,
                });
                totalLength += 0;
            }
        };

        for (var i = 0; i < arrExe.length; i += 1) loop$1( i );

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
        var self = this;
        var duration = targetConfig.duration;
        var ease = targetConfig.ease;
        var loop = targetConfig.loop ? targetConfig.loop : 0;
        var direction = targetConfig.direction ? targetConfig.direction : "default";
        var destD = targetConfig.attr.d ? targetConfig.attr.d : self.attr.d;
        var srcPath = isTypePath(self.attr.d)
            ? self.attr.d.stackGroup
            : new Path(self.attr.d).stackGroup;
        var destPath = isTypePath(destD) ? destD.stackGroup : new Path(destD).stackGroup;
        var chainInstance = [];
        self.arrayStack = [];

        if (srcPath.length > 1) {
            srcPath = srcPath.sort(function (aa, bb) { return bb.segmentLength - aa.segmentLength; });
        }

        if (destPath.length > 1) {
            destPath = destPath.sort(function (aa, bb) { return bb.segmentLength - aa.segmentLength; });
        }

        var maxGroupLength = srcPath.length > destPath.length ? srcPath.length : destPath.length;
        mapper(toCubicCurves(srcPath[0]), toCubicCurves(destPath[0]));

        for (var j = 1; j < maxGroupLength; j += 1) {
            if (srcPath[j]) {
                mapper(toCubicCurves(srcPath[j]), [
                    {
                        type: "M",
                        p0: srcPath[j][0].p0,
                    } ]);
            }

            if (destPath[j]) {
                mapper(
                    [
                        {
                            type: "M",
                            p0: destPath[j][0].p0,
                        } ],
                    toCubicCurves(destPath[j])
                );
            }
        }

        function toCubicCurves(stack) {
            if (!stack.length) {
                return;
            }

            var _ = stack;
            var mappedArr = [];

            for (var i = 0; i < _.length; i += 1) {
                if (["M", "C", "S", "Q"].indexOf(_[i].type) !== -1) {
                    mappedArr.push(_[i]);
                } else if (["V", "H", "L", "Z"].indexOf(_[i].type) !== -1) {
                    var ctrl1 = {
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
                }
            }

            return mappedArr;
        }

        function buildMTransitionobj(src, dest) {
            chainInstance.push({
                run: function run(path, f) {
                    var point = this.pointTansition(f);
                    path.m(true, {
                        x: point.x,
                        y: point.y,
                    });
                },

                pointTansition: t2DGeometry$1.linearTransitionBetweenPoints.bind(null, src.p0, dest.p0),
            });
        }

        function buildTransitionObj(src, dest) {
            chainInstance.push({
                run: function run(path, f) {
                    var t = this;
                    var c1 = t.ctrl1Transition(f);
                    var c2 = t.ctrl2Transition(f);
                    var p1 = t.destTransition(f);
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

                srcTransition: t2DGeometry$1.linearTransitionBetweenPoints.bind(null, src.p0, dest.p0),
                ctrl1Transition: t2DGeometry$1.linearTransitionBetweenPoints.bind(
                    null,
                    src.cntrl1,
                    dest.cntrl1
                ),
                ctrl2Transition: t2DGeometry$1.linearTransitionBetweenPoints.bind(
                    null,
                    src.cntrl2,
                    dest.cntrl2
                ),
                destTransition: t2DGeometry$1.linearTransitionBetweenPoints.bind(null, src.p1, dest.p1),
            });
        }

        function normalizeCmds(cmd, n) {
            if (cmd.length === n) {
                return cmd;
            }

            var totalLength = cmd.reduce(function (pp, cc) { return pp + cc.length; }, 0);
            var arr = [];

            for (var i = 0; i < cmd.length; i += 1) {
                var len = cmd[i].length;
                var counter = Math.floor((n / totalLength) * len);

                if (counter <= 1) {
                    arr.push(cmd[i]);
                } else {
                    var t = cmd[i];
                    var split = (void 0);

                    while (counter > 1) {
                        var cmdX = t;
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
            var coll = [];
            var arrayLocal = arr;

            while (arrayLocal.length > 0) {
                for (var i = 0; i < arrayLocal.length - 1; i += 1) {
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
                    } ],
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
                    } ],
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
            var dir = 0;

            for (var i = 0; i < data.length; i += 1) {
                if (data[i].type !== "M") {
                    dir += (data[i].p1.x - data[i].p0.x) * (data[i].p1.y + data[i].p0.y);
                }
            }

            return dir;
        }

        function reverse(data) {
            var dataLocal = data.reverse();
            var newArray = [
                {
                    type: "M",
                    p0: dataLocal[0].p1,
                } ];
            dataLocal.forEach(function (d) {
                if (d.type === "C") {
                    var dLocal = d;
                    var tp0 = dLocal.p0;
                    var tc1 = dLocal.cntrl1;
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
            var sumX = 0;
            var sumY = 0;
            var counterX = 0;
            var counterY = 0;
            path.forEach(function (d) {
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
            var centroidOfSrc = centroid(src);
            var centroidOfDest = centroid(dest);
            var srcArr = src;
            var destArr = dest;

            for (var i = 0; i < src.length; i += 1) {
                srcArr[i].quad = getQuadrant(centroidOfSrc, src[i].p0);
            }

            for (var i$1 = 0; i$1 < dest.length; i$1 += 1) {
                destArr[i$1].quad = getQuadrant(centroidOfDest, dest[i$1].p0);
            }

            var minDistance = 0;
            src.forEach(function (d, i) {
                var dis = t2DGeometry$1.getDistance(d.p0, centroidOfSrc);

                if (d.quad === 1 && dis >= minDistance) {
                    minDistance = dis;
                }
            });
            minDistance = 0;
            dest.forEach(function (d, i) {
                var dis = t2DGeometry$1.getDistance(d.p0, centroidOfDest);

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

            var pathLocal = path;
            var subSet = pathLocal.splice(0, closestPoint);
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
            var nsExe;
            var ndExe;
            var maxLength = sExe.length > dExe.length ? sExe.length : dExe.length;

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

            var res = getSrcBeginPoint(nsExe, ndExe);
            nsExe =
                res.src.length > 1
                    ? res.src
                    : [
                          {
                              type: "M",
                              p0: res.destCentroid,
                          } ];
            ndExe =
                res.dest.length > 1
                    ? res.dest
                    : [
                          {
                              type: "M",
                              p0: res.srcCentroid,
                          } ];
            var length = ndExe.length < nsExe.length ? nsExe.length : ndExe.length;

            for (var i = 0; i < nsExe.length; i += 1) {
                nsExe[i].index = i;
            }

            for (var i$1 = 0; i$1 < ndExe.length; i$1 += 1) {
                ndExe[i$1].index = i$1;
            }

            for (var i$2 = 0; i$2 < length; i$2 += 1) {
                var sP0 = nsExe[nsExe.length - 1].p0
                    ? nsExe[nsExe.length - 1].p0
                    : nsExe[nsExe.length - 1].p1;
                var dP0 = ndExe[ndExe.length - 1].p0
                    ? ndExe[ndExe.length - 1].p0
                    : ndExe[ndExe.length - 1].p1;
                var sCmd = nsExe[i$2]
                    ? nsExe[i$2]
                    : {
                          type: "C",
                          p0: sP0,
                          p1: sP0,
                          cntrl1: sP0,
                          cntrl2: sP0,
                          length: 0,
                      };
                var dCmd = ndExe[i$2]
                    ? ndExe[i$2]
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
                run: function run(f) {
                    var ppath = new Path();

                    for (var i = 0, len = chainInstance.length; i < len; i++) {
                        chainInstance[i].run(ppath, f);
                    }

                    self.setAttr("d", ppath);
                },
                target: self,
                duration: duration,
                loop: loop,
                direction: direction,
            },
            easying$1(ease)
        );
    }

    function isTypePath(pathInstance) {
        return pathInstance instanceof Path;
    }

    var path = {
        instance: function (d) {
            return new Path(d);
        },
        isTypePath: isTypePath,
        animatePathTo: animatePathTo,
        morphTo: morphTo,
    };

    /* eslint-disable no-undef */
    var preDefinedColors = [
        "AliceBlue",
        "AntiqueWhite",
        "Aqua",
        "Aquamarine",
        "Azure",
        "Beige",
        "Bisque",
        "Black",
        "BlanchedAlmond",
        "Blue",
        "BlueViolet",
        "Brown",
        "BurlyWood",
        "CadetBlue",
        "Chartreuse",
        "Chocolate",
        "Coral",
        "CornflowerBlue",
        "Cornsilk",
        "Crimson",
        "Cyan",
        "DarkBlue",
        "DarkCyan",
        "DarkGoldenRod",
        "DarkGray",
        "DarkGrey",
        "DarkGreen",
        "DarkKhaki",
        "DarkMagenta",
        "DarkOliveGreen",
        "DarkOrange",
        "DarkOrchid",
        "DarkRed",
        "DarkSalmon",
        "DarkSeaGreen",
        "DarkSlateBlue",
        "DarkSlateGray",
        "DarkSlateGrey",
        "DarkTurquoise",
        "DarkViolet",
        "DeepPink",
        "DeepSkyBlue",
        "DimGray",
        "DimGrey",
        "DodgerBlue",
        "FireBrick",
        "FloralWhite",
        "ForestGreen",
        "Fuchsia",
        "Gainsboro",
        "GhostWhite",
        "Gold",
        "GoldenRod",
        "Gray",
        "Grey",
        "Green",
        "GreenYellow",
        "HoneyDew",
        "HotPink",
        "IndianRed",
        "Indigo",
        "Ivory",
        "Khaki",
        "Lavender",
        "LavenderBlush",
        "LawnGreen",
        "LemonChiffon",
        "LightBlue",
        "LightCoral",
        "LightCyan",
        "LightGoldenRodYellow",
        "LightGray",
        "LightGrey",
        "LightGreen",
        "LightPink",
        "LightSalmon",
        "LightSeaGreen",
        "LightSkyBlue",
        "LightSlateGray",
        "LightSlateGrey",
        "LightSteelBlue",
        "LightYellow",
        "Lime",
        "LimeGreen",
        "Linen",
        "Magenta",
        "Maroon",
        "MediumAquaMarine",
        "MediumBlue",
        "MediumOrchid",
        "MediumPurple",
        "MediumSeaGreen",
        "MediumSlateBlue",
        "MediumSpringGreen",
        "MediumTurquoise",
        "MediumVioletRed",
        "MidnightBlue",
        "MintCream",
        "MistyRose",
        "Moccasin",
        "NavajoWhite",
        "Navy",
        "OldLace",
        "Olive",
        "OliveDrab",
        "Orange",
        "OrangeRed",
        "Orchid",
        "PaleGoldenRod",
        "PaleGreen",
        "PaleTurquoise",
        "PaleVioletRed",
        "PapayaWhip",
        "PeachPuff",
        "Peru",
        "Pink",
        "Plum",
        "PowderBlue",
        "Purple",
        "RebeccaPurple",
        "Red",
        "RosyBrown",
        "RoyalBlue",
        "SaddleBrown",
        "Salmon",
        "SandyBrown",
        "SeaGreen",
        "SeaShell",
        "Sienna",
        "Silver",
        "SkyBlue",
        "SlateBlue",
        "SlateGray",
        "SlateGrey",
        "Snow",
        "SpringGreen",
        "SteelBlue",
        "Tan",
        "Teal",
        "Thistle",
        "Tomato",
        "Turquoise",
        "Violet",
        "Wheat",
        "White",
        "WhiteSmoke",
        "Yellow",
        "YellowGreen" ];
    var preDefinedColorHex = [
        "f0f8ff",
        "faebd7",
        "00ffff",
        "7fffd4",
        "f0ffff",
        "f5f5dc",
        "ffe4c4",
        "000000",
        "ffebcd",
        "0000ff",
        "8a2be2",
        "a52a2a",
        "deb887",
        "5f9ea0",
        "7fff00",
        "d2691e",
        "ff7f50",
        "6495ed",
        "fff8dc",
        "dc143c",
        "00ffff",
        "00008b",
        "008b8b",
        "b8860b",
        "a9a9a9",
        "a9a9a9",
        "006400",
        "bdb76b",
        "8b008b",
        "556b2f",
        "ff8c00",
        "9932cc",
        "8b0000",
        "e9967a",
        "8fbc8f",
        "483d8b",
        "2f4f4f",
        "2f4f4f",
        "00ced1",
        "9400d3",
        "ff1493",
        "00bfff",
        "696969",
        "696969",
        "1e90ff",
        "b22222",
        "fffaf0",
        "228b22",
        "ff00ff",
        "dcdcdc",
        "f8f8ff",
        "ffd700",
        "daa520",
        "808080",
        "808080",
        "008000",
        "adff2f",
        "f0fff0",
        "ff69b4",
        "cd5c5c",
        "4b0082",
        "fffff0",
        "f0e68c",
        "e6e6fa",
        "fff0f5",
        "7cfc00",
        "fffacd",
        "add8e6",
        "f08080",
        "e0ffff",
        "fafad2",
        "d3d3d3",
        "d3d3d3",
        "90ee90",
        "ffb6c1",
        "ffa07a",
        "20b2aa",
        "87cefa",
        "778899",
        "778899",
        "b0c4de",
        "ffffe0",
        "00ff00",
        "32cd32",
        "faf0e6",
        "ff00ff",
        "800000",
        "66cdaa",
        "0000cd",
        "ba55d3",
        "9370db",
        "3cb371",
        "7b68ee",
        "00fa9a",
        "48d1cc",
        "c71585",
        "191970",
        "f5fffa",
        "ffe4e1",
        "ffe4b5",
        "ffdead",
        "000080",
        "fdf5e6",
        "808000",
        "6b8e23",
        "ffa500",
        "ff4500",
        "da70d6",
        "eee8aa",
        "98fb98",
        "afeeee",
        "db7093",
        "ffefd5",
        "ffdab9",
        "cd853f",
        "ffc0cb",
        "dda0dd",
        "b0e0e6",
        "800080",
        "663399",
        "ff0000",
        "bc8f8f",
        "4169e1",
        "8b4513",
        "fa8072",
        "f4a460",
        "2e8b57",
        "fff5ee",
        "a0522d",
        "c0c0c0",
        "87ceeb",
        "6a5acd",
        "708090",
        "708090",
        "fffafa",
        "00ff7f",
        "4682b4",
        "d2b48c",
        "008080",
        "d8bfd8",
        "ff6347",
        "40e0d0",
        "ee82ee",
        "f5deb3",
        "ffffff",
        "f5f5f5",
        "ffff00",
        "9acd32" ];
    var colorMap = {};
    var round = Math.round;
    var defaultColor = "rgba(0,0,0,0)";

    for (var i = 0; i < preDefinedColors.length; i += 1) {
        colorMap[preDefinedColors[i]] = preDefinedColorHex[i];
    }

    function RGBA(r, g, b, a) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a === undefined ? 255 : a;
        this.rgba = "rgba(" + r + "," + g + "," + b + "," + a + ")";
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
        return colorMap[name] ? ("#" + (colorMap[name])) : "#000";
    }

    function hexToRgb(hex) {
        var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        hex = hex.replace(shorthandRegex, function (m, r, g, b) { return r + r + g + g + b + b; });
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return new RGBA(parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16), 255);
    }

    function rgbToHex(rgb) {
        var rgbComponents = rgb.substring(rgb.lastIndexOf("(") + 1, rgb.lastIndexOf(")")).split(",");
        var r = parseInt(rgbComponents[0], 10);
        var g = parseInt(rgbComponents[1], 10);
        var b = parseInt(rgbComponents[2], 10);
        return ("#" + (((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)));
    }

    function rgbParse(rgb) {
        var res = rgb.replace(/[^0-9.,]+/g, "").split(",");
        var obj = {};
        var flags = ["r", "g", "b", "a"];

        for (var i = 0; i < res.length; i += 1) {
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
        var res = hsl
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
                if (t < 0) { t += 1; }
                if (t > 1) { t -= 1; }
                if (t < 1 / 6) { return p + (q - p) * 6 * t; }
                if (t < 1 / 2) { return q; }
                if (t < 2 / 3) { return p + (q - p) * (2 / 3 - t) * 6; }
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
        src = src || defaultColor;
        dest = dest || defaultColor;
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
        var self = this;
        var pointers = this.pointers;
        var index = -1;
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

    // Events.prototype.clickCheck = function (e) {
    // 	propogateEvent([this.vDom], {
    // 		x: e.offsetX,
    // 		y: e.offsetY
    // 	}, e, 'click');
    // };

    // Events.prototype.dblclickCheck = function (e) {
    // 	propogateEvent([this.vDom], {
    // 		x: e.offsetX,
    // 		y: e.offsetY
    // 	}, e, 'dblclick');
    // };

    Events.prototype.pointerdownCheck = function (e) {
        var self = this;
        var node = propogateEvent(
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
                node.events["mouseover"].call(node, e);
            }
        }
    };

    Events.prototype.pointermoveCheck = function (e) {
        var self = this;
        var node = this.pointerNode ? this.pointerNode.node : null;
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
            if (node.events["mousemove"]) {
                node.events["mousemove"].call(node, e);
            }
        } else if (node) {
            if (e.pointerType === "touch") {
                node.events["mousemove"].call(node, e);
            }
        }
        e.preventDefault();
    };

    var clickInterval;
    Events.prototype.pointerupCheck = function (e) {
        var self = this;
        var node = this.pointerNode ? this.pointerNode.node : null;
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
                if (this.pointerNode.clickCounter === 1 && node.events["click"]) {
                    clickInterval = setTimeout(function () {
                        self.pointerNode = null;
                        node.events["click"].call(node, e);
                        clickInterval = null;
                    }, 200);
                } else if (this.pointerNode.clickCounter === 2 && node.events["dblclick"]) {
                    if (clickInterval) {
                        clearTimeout(clickInterval);
                    }
                    node.events["dblclick"].call(node, e);
                    self.pointerNode = null;
                } else if (!node.events["click"] && !node.events["dblclick"]) {
                    this.pointerNode = null;
                }
            } else {
                this.pointerNode = null;
            }
            if (e.pointerType === "touch") {
                node.events["mouseup"].call(node, e);
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
        var node = propogateEvent(
            [this.vDom],
            {
                x: e.offsetX,
                y: e.offsetY,
            },
            e,
            "mousemove"
        );
        if (node && (node.events["mouseover"] || node.events["mousein"])) {
            if (this.selectedNode !== node) {
                if (node.events["mouseover"]) {
                    node.events["mouseover"].call(node, e);
                }
                if (node.events["mousein"]) {
                    node.events["mousein"].call(node, e);
                }
            }
        }

        if (this.selectedNode && this.selectedNode !== node) {
            if (this.selectedNode.events["mouseout"]) {
                this.selectedNode.events["mouseout"].call(this.selectedNode, e);
            }
            if (this.selectedNode.events["mouseleave"]) {
                this.selectedNode.events["mouseleave"].call(this.selectedNode, e);
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
        var touches = e.touches;
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

    var wheelCounter = 0;
    var deltaWheel = 0;
    Events.prototype.wheelEventCheck = function (e) {
        var self = this;
        if (!this.wheelNode) {
            var node = propogateEvent(
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
        var node, temp;

        for (var i = nodes.length - 1; i >= 0; i -= 1) {
            var d = nodes[i];
            var coOr = {
                x: mouseCoor.x,
                y: mouseCoor.y,
            };

            if (!d.bbox) {
                continue;
            }

            transformCoOr$1(d, coOr);

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

    function transformCoOr$1(d, coOr) {
        var assign;

        var hozMove = 0;
        var verMove = 0;
        var scaleX = 1;
        var scaleY = 1;
        var coOrLocal = coOr;

        if (d.attr.transform && d.attr.transform.translate) {
            (assign = d.attr.transform.translate, hozMove = assign[0], verMove = assign[1]);
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
            var rotate = d.attr.transform.rotate[0];

            var cen = {
                x: d.attr.transform.rotate[1],
                y: d.attr.transform.rotate[2],
            };
            var x = coOrLocal.x;
            var y = coOrLocal.y;
            var cx = cen.x;
            var cy = cen.y;
            var radians = (Math.PI / 180) * rotate;
            var cos = Math.cos(radians);
            var sin = Math.sin(radians);
            coOrLocal.x = cos * (x - cx) + sin * (y - cy) + cx;
            coOrLocal.y = cos * (y - cy) - sin * (x - cx) + cy;
        }
    }

    /* eslint-disable no-undef */

    var animeIdentifier = 0;
    var t2DGeometry$2 = geometry;
    var easing = fetchTransitionType;
    var queueInstance$1 = queue;

    function animeId$1() {
        animeIdentifier += 1;
        return animeIdentifier;
    }

    var transitionSetAttr = function transitionSetAttr(self, key, value) {
        return function inner(f) {
            self.setAttr(key, value.call(self, f));
        };
    };

    var transformTransition = function transformTransition(self, subkey, value) {
        var exe = [];
        var trans = self.attr.transform;

        if (typeof value === "function") {
            return function inner(f) {
                self[subkey](value.call(self, f));
            };
        }

        value.forEach(function (tV, i) {
            var val;

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
            self[subkey](exe.map(function (d) { return d(f); }));
        };
    };

    var attrTransition = function attrTransition(self, key, value) {
        var srcVal = self.attr[key]; // if (typeof value === 'function') {
        //   return function setAttr_ (f) {
        //     self.setAttr(key, value.call(self, f))
        //   }
        // }

        return function setAttr_(f) {
            self.setAttr(key, t2DGeometry$2.intermediateValue(srcVal, value, f));
        };
    };

    var styleTransition = function styleTransition(self, key, value) {
        var srcValue;
        var destUnit;
        var destValue;

        if (typeof value === "function") {
            return function inner(f) {
                self.setStyle(key, value.call(self, self.dataObj, f));
            };
        } else {
            srcValue = self.style[key];

            if (isNaN(value)) {
                if (colorMap$1.isTypeColor(value)) {
                    var colorExe = colorMap$1.transition(srcValue, value);
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

    var animate = function animate(self, targetConfig) {
        var tattr = targetConfig.attr ? targetConfig.attr : {};
        var tstyles = targetConfig.style ? targetConfig.style : {};
        var runStack = [];
        var value;

        if (typeof tattr !== "function") {
            var loop = function ( key ) {
                if (key !== "transform") {
                    var value$1 = tattr[key];

                    if (typeof value$1 === "function") {
                        runStack[runStack.length] = function setAttr_(f) {
                            self.setAttr(key, value$1.call(self, f));
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
                        var trans = self.attr.transform;

                        if (!trans) {
                            self.attr.transform = {};
                        }

                        var subTrnsKeys = Object.keys(tattr.transform);

                        for (var j = 0, jLen = subTrnsKeys.length; j < jLen; j += 1) {
                            runStack[runStack.length] = transformTransition(
                                self,
                                subTrnsKeys[j],
                                tattr.transform[subTrnsKeys[j]]
                            );
                        }
                    }
                }
            };

            for (var key in tattr) loop( key );
        } else {
            runStack[runStack.length] = tattr.bind(self);
        }

        if (typeof tstyles !== "function") {
            for (var style in tstyles) {
                runStack[runStack.length] = styleTransition(self, style, tstyles[style]);
            }
        } else {
            runStack[runStack.length] = tstyles.bind(self);
        }

        return {
            run: function run(f) {
                for (var j = 0, len = runStack.length; j < len; j += 1) {
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
        var dataIds = data.map(cond);
        var res = {
            new: [],
            update: [],
            old: [],
        };

        for (var i = 0; i < nodes.length; i += 1) {
            var index = dataIds.indexOf(cond(nodes[i].dataObj, i));

            if (index !== -1) {
                nodes[i].dataObj = data[index];
                res.update.push(nodes[i]);
                dataIds[index] = null;
            } else {
                // nodes[i].dataObj = data[index]
                res.old.push(nodes[i]);
            }
        }

        res.new = data.filter(function (d, i) {
            var index = dataIds.indexOf(cond(d, i));

            if (index !== -1) {
                dataIds[index] = null;
                return true;
            }

            return false;
        });
        return res;
    }

    var CompositeArray = {};
    CompositeArray.push = {
        value: function (data) {
            if (Object.prototype.toString.call(data) !== "[object Array]") {
                data = [data];
            }

            for (var i = 0, len = data.length; i < len; i++) {
                this.data.push(data[i]);
            }

            if (this.config.action.enter) {
                var nodes = {};
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
            var self = this;
            var elData = this.data.pop();

            if (this.config.action.exit) {
                var nodes = {};
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

            var self = this;

            for (var i = 0, len = data.length; i < len; i++) {
                if (this.data.indexOf(data[i]) !== -1) {
                    this.data.splice(this.data.indexOf(data[i]), 1);
                }
            }

            if (this.config.action.exit) {
                var nodes = {};
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
            var self = this;

            if (this.config.action.update) {
                var nodes = {};
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
        var nodes = [];
        var wrap = new CollectionPrototype();

        if (this.children.length > 0) {
            if (nodeSelector.charAt(0) === ".") {
                var classToken = nodeSelector.substring(1, nodeSelector.length);
                this.children.forEach(function (d) {
                    var check1 =
                        dataArray &&
                        d.dataObj &&
                        dataArray.indexOf(d.dataObj) !== -1 &&
                        d.attr.class === classToken;
                    var check2 = !dataArray && d.attr.class === classToken;

                    if (check1 || check2) {
                        nodes.push(d);
                    }
                });
            } else if (nodeSelector.charAt(0) === "#") {
                var idToken = nodeSelector.substring(1, nodeSelector.length);
                this.children.every(function (d) {
                    var check1 =
                        dataArray &&
                        d.dataObj &&
                        dataArray.indexOf(d.dataObj) !== -1 &&
                        d.attr.id === idToken;
                    var check2 = !dataArray && d.attr.id === idToken;

                    if (check1 || check2) {
                        nodes.push(d);
                        return false;
                    }

                    return true;
                });
            } else {
                nodeSelector = nodeSelector === "group" ? "g" : nodeSelector;
                this.children.forEach(function (d) {
                    var check1 =
                        dataArray &&
                        d.dataObj &&
                        dataArray.indexOf(d.dataObj) !== -1 &&
                        d.nodeName === nodeSelector;
                    var check2 = !dataArray && d.nodeName === nodeSelector;

                    if (check1 || check2) {
                        nodes.push(d);
                    }
                });
            }
        }

        return wrap.wrapper(nodes);
    };

    NodePrototype.prototype.fetchEl = function (nodeSelector, data) {
        var nodes;

        if (this.children.length > 0) {
            if (nodeSelector.charAt(0) === ".") {
                var classToken = nodeSelector.substring(1, nodeSelector.length);
                this.children.every(function (d) {
                    var check1 = data && d.dataObj && data === d.dataObj && d.attr.class === classToken;
                    var check2 = !data && d.attr.class === classToken;

                    if (check1 || check2) {
                        nodes = d;
                        return false;
                    }

                    return true;
                });
            } else if (nodeSelector.charAt(0) === "#") {
                var idToken = nodeSelector.substring(1, nodeSelector.length);
                this.children.every(function (d) {
                    var check1 = data && d.dataObj && data === d.dataObj && d.attr.id === idToken;
                    var check2 = !data && d.attr.id === idToken;

                    if (check1 || check2) {
                        nodes = d;
                        return false;
                    }

                    return true;
                });
            } else {
                nodeSelector = nodeSelector === "group" ? "g" : nodeSelector;
                this.children.forEach(function (d) {
                    var check1 = data && d.dataObj && data === d.dataObj && d.nodeName === nodeSelector;
                    var check2 = !data && d.nodeName === nodeSelector;

                    if (check1 || check2) {
                        nodes = d;
                    }
                });
            }
        }

        return nodes;
    };

    function dataJoin(data, selector, config) {
        var self = this;
        var selectors = selector.split(",");
        var joinOn = config.joinOn;
        var joinResult = {
            new: {},
            update: {},
            old: {},
        };

        if (!joinOn) {
            joinOn = function (d, i) {
                return i;
            };
        }

        for (var i = 0, len = selectors.length; i < len; i++) {
            var d = selectors[i];
            var nodes = self.fetchEls(d);
            var join = performJoin(data, nodes.stack, joinOn);
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
                queueInstance$1.remove(this.animList[i]);
            }
        }
        this.animList = [];
        return this;
    };

    NodePrototype.prototype.animateTo = function (targetConfig) {
        queueInstance$1.add(animeId$1(), animate(this, targetConfig), easing(targetConfig.ease));
        return this;
    };

    NodePrototype.prototype.animateExe = function (targetConfig) {
        return animate(this, targetConfig);
    };

    function fetchEls(nodeSelector, dataArray) {
        var d;
        var coll = [];

        for (var i = 0; i < this.stack.length; i += 1) {
            d = this.stack[i];
            coll.push(d.fetchEls(nodeSelector, dataArray));
        }

        var collection = new CollectionPrototype();
        collection.wrapper(coll);
        return collection;
    }

    function join(data, el, arg) {
        var d;
        var coll = [];

        for (var i = 0; i < this.stack.length; i += 1) {
            d = this.stack[i];
            coll.push(d.join(data, el, arg));
        }

        var collection = new CollectionPrototype();
        collection.wrapper(coll);
        return collection;
    }

    function createEl(config) {
        var d;
        var coll = [];

        for (var i = 0, len = this.stack.length; i < len; i += 1) {
            var cRes = {};
            d = this.stack[i];

            if (typeof config === "function") {
                cRes = config.call(d, d.dataObj, i);
            } else {
                var keys = Object.keys(config);

                for (var j = 0, lenJ = keys.length; j < lenJ; j += 1) {
                    var key = keys[j];

                    if (typeof config[key] !== "object") {
                        cRes[key] = config[key];
                    } else {
                        cRes[key] = JSON.parse(JSON.stringify(config[key]));
                    }
                }
            }

            coll.push(d.createEl(cRes));
        }

        var collection = new CollectionPrototype();
        collection.wrapper(coll);
        return collection;
    }

    function createEls(data, config) {
        var d;
        var coll = [];
        var res = data;

        for (var i = 0, len = this.stack.length; i < len; i += 1) {
            var cRes = {};
            d = this.stack[i];

            if (typeof data === "function") {
                res = data.call(d, d.dataObj, i);
            }

            if (typeof config === "function") {
                cRes = config.call(d, d.dataObj, i);
            } else {
                var keys = Object.keys(config);

                for (var j = 0, lenJ = keys.length; j < lenJ; j += 1) {
                    var key = keys[j];
                    cRes[key] = config[key];
                }
            }

            coll.push(d.createEls(res, cRes));
        }

        var collection = new CollectionPrototype();
        collection.wrapper(coll);
        return collection;
    }

    function forEach(callBck) {
        for (var i = 0, len = this.stack.length; i < len; i += 1) {
            callBck.call(this.stack[i], this.stack[i].dataObj, i);
        }

        return this;
    }

    function setAttribute(key, value) {
        var arguments$1 = arguments;

        var d;

        for (var i = 0, len = this.stack.length; i < len; i += 1) {
            d = this.stack[i];

            if (arguments$1.length > 1) {
                if (typeof value === "function") {
                    d.setAttr(key, value.call(d, d.dataObj, i));
                } else {
                    d.setAttr(key, value);
                }
            } else if (typeof key === "function") {
                d.setAttr(key.call(d, d.dataObj, i));
            } else {
                var keys = Object.keys(key);

                for (var j = 0, lenJ = keys.length; j < lenJ; j += 1) {
                    var keykey = keys[j];

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
        var arguments$1 = arguments;

        var d;

        for (var i = 0, len = this.stack.length; i < len; i += 1) {
            d = this.stack[i];

            if (arguments$1.length > 1) {
                if (typeof value === "function") {
                    d.setStyle(key, value.call(d, d.dataObj, i));
                } else {
                    d.setStyle(key, value);
                }
            } else {
                if (typeof key === "function") {
                    d.setStyle(key.call(d, d.dataObj, i));
                } else {
                    var keys = Object.keys(key);

                    for (var j = 0, lenJ = keys.length; j < lenJ; j += 1) {
                        var keykey = keys[j];

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
        var d;

        for (var i = 0, len = this.stack.length; i < len; i += 1) {
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
        var d;

        for (var i = 0, len = this.stack.length; i < len; i += 1) {
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
        var d;

        for (var i = 0, len = this.stack.length; i < len; i += 1) {
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
        var d;

        if (typeof value !== "function") {
            return;
        }

        for (var i = 0, len = this.stack.length; i < len; i += 1) {
            d = this.stack[i];
            value.call(d, d.dataObj, i);
        }

        return this;
    }

    function on(eventType, hndlr) {
        for (var i = 0, len = this.stack.length; i < len; i += 1) {
            this.stack[i].on(eventType, hndlr);
        }

        return this;
    } // function in (coOr) {
    //   for (let i = 0, len = this.stack.length; i < len; i += 1) {
    //     this.stack[i].in(coOr)
    //   }
    //   return this
    // }

    function remove$1() {
        for (var i = 0, len = this.stack.length; i < len; i += 1) {
            this.stack[i].remove();
        }

        return this;
    }

    function interrupt() {
        for (var i = 0, len = this.stack.length; i < len; i += 1) {
            this.stack[i].interrupt();
        }

        return this;
    }

    function resolveObject(config, node, i) {
        var obj = {};
        var key;

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

    var animateArrayTo = function animateArrayTo(config) {
        var node;
        var newConfig;

        for (var i = 0; i < this.stack.length; i += 1) {
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

    var animateArrayExe = function animateArrayExe(config) {
        var node;
        var newConfig;
        var exeArray = [];

        for (var i = 0; i < this.stack.length; i += 1) {
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

    var animatePathArrayTo = function animatePathArrayTo(config) {
        var node;
        var keys = Object.keys(config);

        for (var i = 0, len = this.stack.length; i < len; i += 1) {
            node = this.stack[i];
            var conf = {};

            for (var j = 0; j < keys.length; j++) {
                var value = config[keys[j]];

                if (typeof value === "function") {
                    value = value.call(node, node.dataObj, i);
                }

                conf[keys[j]] = value;
            }

            node.animatePathTo(conf);
        }

        return this;
    };

    var textArray = function textArray(value) {
        var node;

        if (typeof value !== "function") {
            for (var i = 0; i < this.stack.length; i += 1) {
                node = this.stack[i];
                node.text(value);
            }
        } else {
            for (var i$1 = 0; i$1 < this.stack.length; i$1 += 1) {
                node = this.stack[i$1];
                node.text(value.call(node, node.dataObj, i$1));
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
        var this$1 = this;

        if (!data) {
            data = [];
        }

        var transform;
        var key;
        var attrKeys = config ? (config.attr ? Object.keys(config.attr) : []) : [];
        var styleKeys = config ? (config.style ? Object.keys(config.style) : []) : [];
        var bbox = config ? (config["bbox"] !== undefined ? config["bbox"] : true) : true;
        this.stack = data.map(function (d, i) {
            var assign;

            var node;
            node = this$1.createNode(
                contextInfo.ctx,
                {
                    el: config.el,
                    bbox: bbox,
                },
                vDomIndex
            );

            for (var j = 0, len = styleKeys.length; j < len; j += 1) {
                key = styleKeys[j];

                if (typeof config.style[key] === "function") {
                    var resValue = config.style[key].call(node, d, i);
                    node.setStyle(key, resValue);
                } else {
                    node.setStyle(key, config.style[key]);
                }
            }

            for (var j$1 = 0, len$1 = attrKeys.length; j$1 < len$1; j$1 += 1) {
                key = attrKeys[j$1];

                if (key !== "transform") {
                    if (typeof config.attr[key] === "function") {
                        var resValue$1 = config.attr[key].call(node, d, i);
                        node.setAttr(key, resValue$1);
                    } else {
                        node.setAttr(key, config.attr[key]);
                    }
                } else {
                    if (typeof config.attr.transform === "function") {
                        transform = config.attr[key].call(node, d, i);
                    } else {
                        ((assign = config.attr, transform = assign.transform));
                    }

                    for (var trns in transform) {
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
        createEls: createEls,
        createEl: createEl,
        forEach: forEach,
        setAttr: setAttribute,
        fetchEls: fetchEls,
        setStyle: setStyle,
        translate: translate,
        rotate: rotate,
        scale: scale,
        exec: exec,
        animateTo: animateArrayTo,
        animateExe: animateArrayExe,
        animatePathTo: animatePathArrayTo,
        remove: remove$1,
        interrupt: interrupt,
        text: textArray,
        join: join,
        on: on,
    };

    CollectionPrototype.prototype.createNode = function () {};

    CollectionPrototype.prototype.wrapper = function wrapper(nodes) {
        var self = this;

        if (nodes) {
            for (var i = 0, len = nodes.length; i < len; i++) {
                var node = nodes[i];
                self.stack.push(node);
            }
        }

        return this;
    };

    var queueInstance$2 = queue;

    var Id$1 = 0;

    function domId() {
        Id$1 += 1;
        return Id$1;
    }

    var SVGCollection = function () {
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

    function SVGMasking(self, config) {
        if ( config === void 0 ) config = {};

        this.pDom = self;
        var maskId = config.id ? config.id : "mask-" + Math.ceil(Math.random() * 1000);
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
        return ("url(#" + (this.id) + ")");
    };

    function SVGClipping(self, config) {
        if ( config === void 0 ) config = {};

        this.pDom = self;
        var clipId = config.id ? config.id : "clip-" + Math.ceil(Math.random() * 1000);
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
        return ("url(#" + (this.id) + ")");
    };

    function SVGPattern(self, config) {
        if ( config === void 0 ) config = {};

        this.pDom = self;
        var patternId = config.id ? config.id : "pattern-" + Math.ceil(Math.random() * 1000);
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
        return ("url(#" + (this.id) + ")");
    };

    function gradTransformToString(trns) {
        var cmd = "";

        for (var trnX in trns) {
            if (trnX === "rotate") {
                cmd += trnX + "(" + (trns.rotate[0] + " " + (trns.rotate[1] || 0) + " " + (trns.rotate[2] || 0)) + ") ";
            } else {
                cmd += trnX + "(" + (trns[trnX].join(" ")) + ") ";
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
        return ("url(#" + (this.config.id) + ")");
    };

    DomGradients.prototype.linearGradient = function linearGradient() {
        var self = this;

        this.linearEl = this.defs.join([1], "linearGradient", {
            action: {
                enter: function enter(data) {
                    var gredEl = this.createEls(data.linearGradient, {
                        el: "linearGradient",
                    }).setAttr({
                        id: self.config.id,
                        x1: ((self.config.x1) + "%"),
                        y1: ((self.config.y1) + "%"),
                        x2: ((self.config.x2) + "%"),
                        y2: ((self.config.y2) + "%"),
                        spreadMethod: self.config.spreadMethod || "pad",
                        gradientUnits: self.config.gradientUnits || "objectBoundingBox",
                    });

                    if (self.config.gradientTransform) {
                        gredEl.setAttr(
                            "gradientTransform",
                            gradTransformToString(self.config.gradientTransform)
                        );
                    }
                },

                exit: function exit(oldNodes) {
                    oldNodes.linearGradient.remove();
                },

                update: function update(nodes) {
                    nodes.linearGradient.setAttr({
                        id: self.config.id,
                        x1: ((self.config.x1) + "%"),
                        y1: ((self.config.y1) + "%"),
                        x2: ((self.config.x2) + "%"),
                        y2: ((self.config.y2) + "%"),
                        spreadMethod: self.config.spreadMethod || "pad",
                        gradientUnits: self.config.gradientUnits || "objectBoundingBox",
                    });
                    if (self.config.gradientTransform) {
                        nodes.linearGradient.setAttr(
                            "gradientTransform",
                            gradTransformToString(self.config.gradientTransform)
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
                "offset": function offset(d, i) {
                    return ((d.value) + "%");
                },

                "stop-color": function stopColor(d, i) {
                    return d.color;
                },
            },
        });
        return this;
    };

    DomGradients.prototype.radialGradient = function radialGradient() {
        var self = this;

        if (!this.defs) {
            this.defs = this.pDom.createEl({
                el: "defs",
            });
        }

        this.radialEl = this.defs.join([1], "radialGradient", {
            action: {
                enter: function enter(data) {
                    var gredEl = this.createEls(data.radialGradient, {
                        el: "radialGradient",
                    }).setAttr({
                        id: self.config.id,
                        cx: ((self.config.innerCircle.x) + "%"),
                        cy: ((self.config.innerCircle.y) + "%"),
                        r: ((self.config.outerCircle.r) + "%"),
                        fx: ((self.config.outerCircle.x) + "%"),
                        fy: ((self.config.outerCircle.y) + "%"),
                        spreadMethod: self.config.spreadMethod || "pad",
                        gradientUnits: self.config.gradientUnits || "objectBoundingBox",
                    });

                    if (self.config.gradientTransform) {
                        gredEl.setAttr(
                            "gradientTransform",
                            gradTransformToString(self.config.gradientTransform)
                        );
                    }
                },

                exit: function exit(oldNodes) {
                    oldNodes.radialGradient.remove();
                },

                update: function update(nodes) {
                    nodes.radialGradient.setAttr({
                        id: self.config.id,
                        cx: ((self.config.innerCircle.x) + "%"),
                        cy: ((self.config.innerCircle.y) + "%"),
                        r: ((self.config.outerCircle.r) + "%"),
                        fx: ((self.config.outerCircle.x) + "%"),
                        fy: ((self.config.outerCircle.y) + "%"),
                        spreadMethod: self.config.spreadMethod || "pad",
                        gradientUnits: self.config.gradientUnits || "objectBoundingBox",
                    });

                    if (self.config.gradientTransform) {
                        nodes.radialGradient.setAttr(
                            "gradientTransform",
                            gradTransformToString(self.config.gradientTransform)
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
                "offset": function offset(d, i) {
                    return ((d.value) + "%");
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

    var nameSpace = {
        svg: "http://www.w3.org/2000/svg",
        xlink: "http://www.w3.org/1999/xlink",
        xhtml: "http://www.w3.org/1999/xhtml",
    };

    var buildDom = function buildSVGElement(ele) {
        return document.createElementNS(nameSpace.svg, ele);
    };

    function createDomElement(obj, vDomIndex) {
        var dom = null;

        switch (obj.el) {
            case "group":
                dom = buildDom("g");
                break;

            default:
                dom = buildDom(obj.el);
                break;
        }

        var node = new DomExe(dom, obj, domId(), vDomIndex);

        if (obj.dataObj) {
            dom.dataObj = obj.dataObj;
        }

        return node;
    }

    var DomExe = function DomExe(dom, config, id, vDomIndex) {
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
        var ind = key.indexOf(":");
        var value = self.changedAttribute[key];

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
        var cmd = "";
        // let trns = ['scale', 'translate', 'rotate'];
        for (var trnX in self.attr.transform) {
            if (trnX === "rotate") {
                cmd += trnX + "(" + (self.attr.transform.rotate[0] +
                    " " +
                    (self.attr.transform.rotate[1] || 0) +
                    " " +
                    (self.attr.transform.rotate[2] || 0)) + ") ";
            } else {
                cmd += trnX + "(" + (self.attr.transform[trnX].join(" ")) + ") ";
            }
        }

        self.dom.setAttribute("transform", cmd);
    }

    DomExe.prototype.transFormAttributes = function transFormAttributes() {
        var self = this;

        for (var key in self.changedAttribute) {
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
        queueInstance$2.vDomChanged(this.vDomIndex);
        return this;
    };

    DomExe.prototype.skewX = function DMskewX(x) {
        if (!this.attr.transform) {
            this.attr.transform = {};
        }

        this.attr.transform.skewX = [x];
        this.changedAttribute.transform = this.attr.transform;
        this.attrChanged = true;
        queueInstance$2.vDomChanged(this.vDomIndex);
        return this;
    };

    DomExe.prototype.skewY = function DMskewY(y) {
        if (!this.attr.transform) {
            this.attr.transform = {};
        }

        this.attr.transform.skewY = [y];
        this.changedAttribute.transform = this.attr.transform;
        this.attrChanged = true;
        queueInstance$2.vDomChanged(this.vDomIndex);
        return this;
    };

    DomExe.prototype.translate = function DMtranslate(XY) {
        if (!this.attr.transform) {
            this.attr.transform = {};
        }

        this.attr.transform.translate = XY;
        this.changedAttribute.transform = this.attr.transform;
        this.attrChanged = true;
        queueInstance$2.vDomChanged(this.vDomIndex);
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
        queueInstance$2.vDomChanged(this.vDomIndex);
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
            for (var key in attr) {
                if (attr[key] == null && this.style[attr] != null) {
                    delete this.style[key];
                } else {
                    this.style[key] = attr[key];
                }
                this.changedStyles[key] = attr[key];
            }
        }

        this.styleChanged = true;
        queueInstance$2.vDomChanged(this.vDomIndex);
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
            for (var key in attr) {
                if (key === "points") {
                    attr[key] = pointsToString(attr[key]);
                }

                this.attr[key] = attr[key];
                this.changedAttribute[key] = attr[key];
            }
        }

        this.attrChanged = true;
        queueInstance$2.vDomChanged(this.vDomIndex);
        return this;
    };

    DomExe.prototype.execute = function DMexecute() {
        if (!this.styleChanged && !this.attrChanged) {
            for (var i = 0, len = this.children.length; i < len; i += 1) {
                this.children[i].execute();
            }

            return;
        }

        this.transFormAttributes();

        for (var i$1 = 0, len$1 = this.children.length; i$1 < len$1; i$1 += 1) {
            this.children[i$1].execute();
        }

        for (var style in this.changedStyles) {
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
        var parent = this.dom;
        var self = this;

        if (nodes instanceof SVGCollection) {
            var fragment = document.createDocumentFragment();

            for (var i = 0, len = nodes.stack.length; i < len; i++) {
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
        var gradientIns = new DomGradients(config, "radial", this);
        gradientIns.radialGradient();
        return gradientIns;
    };

    DomExe.prototype.createLinearGradient = function DMcreateLinearGradient(config) {
        var gradientIns = new DomGradients(config, "linear", this);
        gradientIns.linearGradient();
        return gradientIns;
    };

    // DomExe.prototype

    // let dragStack = [];

    DomExe.prototype.on = function DMon(eventType, hndlr) {
        var self = this;

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
            var wheelCounter = 0;
            var deltaWheel = 0;
            var wheelHndl;

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
            self.dom.drag_ = function (event, eventType) {
                if (hndlr.panFlag) {
                    hndlr.panExecute(self, event, eventType);
                }
            };
        } else {
            var hnd = hndlr.bind(self);
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

        this.attr["text"] = value;
        this.changedAttribute["text"] = value;
        return this;
    };

    DomExe.prototype.remove = function DMremove() {
        this.parentNode.removeChild(this);
    };

    DomExe.prototype.createEls = function DMcreateEls(data, config) {
        var e = new SVGCollection(
            {
                type: "SVG",
            },
            data,
            config,
            this.vDomIndex
        );
        this.child(e);
        queueInstance$2.vDomChanged(this.vDomIndex);
        return e;
    };

    DomExe.prototype.createEl = function DMcreateEl(config) {
        var e = createDomElement(config, this.vDomIndex);
        this.child(e);
        queueInstance$2.vDomChanged(this.vDomIndex);
        return e;
    };

    DomExe.prototype.removeChild = function DMremoveChild(obj) {
        var ref = this;
        var children = ref.children;
        var index = children.indexOf(obj);

        if (index !== -1) {
            var dom = children.splice(index, 1)[0].dom;
            if (!this.dom.contains(dom)) {
                return;
            }
            this.dom.removeChild(dom);
        }
    };

    function svgLayer(container, layerSettings) {
        if ( layerSettings === void 0 ) layerSettings = {};

        var res = document.querySelector(container);
        var height = res.clientHeight;
        var width = res.clientWidth;
        var autoUpdate = layerSettings.autoUpdate; if ( autoUpdate === void 0 ) autoUpdate = true;
        var enableResize = layerSettings.enableResize; if ( enableResize === void 0 ) enableResize = true;
        var layer = document.createElementNS(nameSpace.svg, "svg");
        layer.setAttribute("height", height);
        layer.setAttribute("width", width);
        layer.style.position = "absolute";

        var vDomInstance;
        var vDomIndex = 999999;
        var cHeight;
        var cWidth;
        var resizeCall;
        var onChangeExe;

        if (res) {
            res.appendChild(layer);
            vDomInstance = new VDom();
            if (autoUpdate) {
                vDomIndex = queueInstance$2.addVdom(vDomInstance);
            }
        }

        var root = new DomExe(layer, {}, domId(), vDomIndex);
        root.container = res;
        root.type = "SVG";
        root.width = width;
        root.height = height;

        var eventsInstance = new Events(root);

        if (vDomInstance) {
            vDomInstance.rootNode(root);
        }

        root.setLayerId = function (id) {
            layer.setAttribute("id", id);
        };

        var resize = function () {
            if (!document.querySelector(container)) {
                window.removeEventListener("resize", resize);
                return;
            }
            height = cHeight || res.clientHeight;
            width = cWidth || res.clientWidth;
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
            var res = document.querySelector(container);
            if (res && res.contains(layer)) {
                res.removeChild(layer);
            }
            queueInstance$2.removeVdom(vDomIndex);
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

        var dragNode = null;
        root.dom.addEventListener("pointerdown", function (e) {
            // e.preventDefault();
            eventsInstance.addPointer(e);
            if (e.target.drag_) {
                e.target.drag_(e, "pointerdown");
                dragNode = e.target;
            }
        });
        root.dom.addEventListener("pointerup", function (e) {
            // e.preventDefault();
            eventsInstance.removePointer(e);
            if (dragNode) {
                dragNode.drag_(e, "pointerup");
                dragNode = null;
            }
        });
        root.dom.addEventListener("pointermove", function (e) {
            e.preventDefault();
            if (dragNode) {
                dragNode.drag_(e, "pointermove");
            }
        });
        queueInstance$2.execute();

        if (enableResize) {
            window.addEventListener("resize", resize);
        }

        return root;
    }

    var queueInstance$3 = queue;
    var easing$1 = fetchTransitionType;

    var animeIdentifier$1 = 0;

    function animeId$2() {
        animeIdentifier$1 += 1;
        return animeIdentifier$1;
    }

    function checkForTranslateBounds(trnsExt, ref, newTrns) {
        var scaleX = ref[0];
        var scaleY = ref[1];

        return (
            newTrns[0] >= trnsExt[0][0] * scaleX &&
            newTrns[0] <= trnsExt[1][0] * scaleX &&
            newTrns[1] >= trnsExt[0][1] * scaleY &&
            newTrns[1] <= trnsExt[1][1] * scaleY
        );
    }

    function applyTranslate(event, ref, extent) {
        var dx = ref.dx; if ( dx === void 0 ) dx = 0;
        var dy = ref.dy; if ( dy === void 0 ) dy = 0;

        var translate = event.transform.translate;
        var ref$1 = event.transform.scale;
        var scaleX = ref$1[0];
        var scaleY = ref$1[1]; if ( scaleY === void 0 ) scaleY = scaleX;
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

    var DragClass = function () {
        var self = this;
        this.dragStartFlag = false;
        this.dragExtent = [
            [-Infinity, -Infinity],
            [Infinity, Infinity] ];
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
            var self = this;
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
            var self = this;
            if (typeof fun === "function") {
                this.onDrag = function (trgt, event) {
                    var dx = event.offsetX - self.event.x;
                    var dy = event.offsetY - self.event.y;
                    self.event.x = event.offsetX;
                    self.event.y = event.offsetY;
                    self.event = applyTranslate(this.event, { dx: dx, dy: dy }, self.dragExtent);
                    fun.call(trgt, self.event);
                };
            }
            return this;
        },
        dragEnd: function (fun) {
            var self = this;
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
            var self = this;
            trgt.dragTo = function (k, point) {
                self.dragTo(trgt, k, point);
            };
        },
        execute: function (trgt, event, eventType) {
            var self = this;
            this.event.e = event;
            if (event.preventDefault) {
                event.preventDefault();
            }
            if (!this.dragStartFlag && (eventType === "mousedown" || eventType === "pointerdown")) {
                self.onDragStart(trgt, event);
            } else if (
                this.onDragEnd &&
                (eventType === "mouseup" ||
                    eventType === "mouseleave" ||
                    eventType === "pointerleave" ||
                    eventType === "pointerup")
            ) {
                self.onDragEnd(trgt, event);
            } else if (this.onDrag) {
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

    var ZoomClass = function () {
        var self = this;
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
        var self = this;
        if (typeof fun === "function") {
            this.zoomStartExe = fun;
            this.onZoomStart = function (trgt, event, eventsInstance) {
                if (eventsInstance.pointers && eventsInstance.pointers.length === 2) {
                    var pointers = eventsInstance.pointers;
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
        var self = this;
        if (typeof fun === "function") {
            this.zoomExe = fun;
            this.onZoom = function (trgt, event) {
                var transform = self.event.transform;
                var origScale = transform.scale[0];
                var newScale = origScale;
                var deltaY = event.deltaY;
                var x = event.offsetX;
                var y = event.offsetY;

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
        var self = this;
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
        var pointers = eventsInstance.pointers;
        if (event.preventDefault) {
            event.preventDefault();
        }
        if (eventsInstance.pointers.length === 2) {
            if (!this.zoomStartFlag) {
                this.onZoomStart(trgt, event, eventsInstance);
            } else {
                var distance_ = this.event.distance;
                for (var i = 0; i < pointers.length; i++) {
                    if (event.pointerId === pointers[i].pointerId) {
                        pointers[i] = event;
                        break;
                    }
                }
                var distance = geometry.getDistance(
                    { x: pointers[0].offsetX, y: pointers[0].offsetY },
                    { x: pointers[1].offsetX, y: pointers[1].offsetY }
                );
                var pinchEvent = {
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
        var self = this;
        var transform = self.event.transform;
        var newScale = k * transform.scale[0];
        var origScale = transform.scale[0];
        var zoomTrgt = this.zoomTarget_ || point;
        var xdiff = (zoomTrgt[0] - point[0]) * origScale;
        var ydiff = (zoomTrgt[1] - point[1]) * origScale;
        var pf = 0;

        var targetConfig = {
            run: function run(f) {
                var oScale = transform.scale[0];
                var nscale = scaleRangeCheck(self.zoomExtent_, origScale + (newScale - origScale) * f);

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
        queueInstance$3.add(animeId$2(), targetConfig, easing$1(targetConfig.ease));
    };

    ZoomClass.prototype.zoomTarget = function zoomTarget(point) {
        this.zoomTarget_ = point;
    };

    ZoomClass.prototype.scaleTo = function scaleTo(trgt, newScale, point) {
        var self = this;
        var transform = self.event.transform;
        var origScale = transform.scale[0];
        var zoomTrgt = this.zoomTarget_ || point;
        var xdiff = (zoomTrgt[0] - point[0]) * origScale;
        var ydiff = (zoomTrgt[1] - point[1]) * origScale;
        var pf = 0;
        var targetConfig = {
            run: function run(f) {
                var oScale = transform.scale[0];
                var nscale = scaleRangeCheck(self.zoomExtent_, origScale + (newScale - origScale) * f);

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
        queueInstance$3.add(animeId$2(), targetConfig, easing$1(targetConfig.ease));
    };

    ZoomClass.prototype.panTo = function panTo(trgt, point) {
        var self = this;
        var transform = self.event.transform;
        var xdiff = point[0] - self.event.x;
        var ydiff = point[1] - self.event.y;
        var pf = 0;
        var targetConfig = {
            run: function run(f) {
                var ref = transform.scale;
                var scale = ref[0];

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
        queueInstance$3.add(animeId$2(), targetConfig, easing$1(targetConfig.ease));
    };

    ZoomClass.prototype.bindMethods = function (trgt) {
        var self = this;
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
            var dx = event.offsetX - this.event.x;
            var dy = event.offsetY - this.event.y;

            this.event.x = event.offsetX;
            this.event.y = event.offsetY;

            this.event = applyTranslate(this.event, { dx: dx, dy: dy }, this.panExtent_);
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

    var t2DGeometry$3 = geometry;
    var queueInstance$4 = queue;
    var Id$2 = 0;

    var zoomInstance = behaviour.zoom();
    var dragInstance = behaviour.drag();
    // let touchInstance = behaviour.touch();

    function domId$1() {
        Id$2 += 1;
        return Id$2;
    }

    var CanvasCollection = function () {
        CollectionPrototype.apply(this, arguments);
    };
    CanvasCollection.prototype = new CollectionPrototype();
    CanvasCollection.prototype.constructor = CanvasCollection;
    CanvasCollection.prototype.createNode = function (ctx, config, vDomIndex) {
        return new CanvasNodeExe(ctx, config, domId$1(), vDomIndex);
    };

    function getPixlRatio(ctx) {
        var dpr = window.devicePixelRatio || 1;
        var bsr =
            ctx.webkitBackingStorePixelRatio ||
            ctx.mozBackingStorePixelRatio ||
            ctx.msBackingStorePixelRatio ||
            ctx.oBackingStorePixelRatio ||
            ctx.backingStorePixelRatio ||
            1;
        return dpr / bsr;
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
        var self = this;

        if (attr.transform) {
            var transform = attr.transform;
            var scale = transform.scale; if ( scale === void 0 ) scale = [1, 1];
            var skew = transform.skew; if ( skew === void 0 ) skew = [0, 0];
            var translate = transform.translate; if ( translate === void 0 ) translate = [0, 0];
            var hozScale = scale[0]; if ( hozScale === void 0 ) hozScale = 1;
            var verScale = scale[1]; if ( verScale === void 0 ) verScale = hozScale;
            var hozSkew = skew[0]; if ( hozSkew === void 0 ) hozSkew = 0;
            var verSkew = skew[1]; if ( verSkew === void 0 ) verSkew = hozSkew;
            var hozMove = translate[0]; if ( hozMove === void 0 ) hozMove = 0;
            var verMove = translate[1]; if ( verMove === void 0 ) verMove = hozMove;

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

        for (var i = 0; i < self.stack.length; i += 1) {
            self.stack[i].execute();
        }
    }

    function parseTransform(transform) {
        var output = {
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
        var self = this;
        var ref = self.attr;
        var transform = ref.transform;
        var points = ref.points; if ( points === void 0 ) points = [];
        var ref$1 = parseTransform(transform);
        var translateX = ref$1.translateX;
        var translateY = ref$1.translateY;
        var scaleX = ref$1.scaleX;
        var scaleY = ref$1.scaleY;

        if (points && points.length > 0) {
            var minX = points[0].x;
            var maxX = points[0].x;
            var minY = points[0].y;
            var maxY = points[0].y;

            for (var i = 1; i < points.length; i += 1) {
                if (minX > points[i].x) { minX = points[i].x; }
                if (maxX < points[i].x) { maxX = points[i].x; }
                if (minY > points[i].y) { minY = points[i].y; }
                if (maxY < points[i].y) { maxY = points[i].y; }
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
            self.BBoxHit = t2DGeometry$3.rotateBBox(this.BBox, transform);
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
        var lGradient = ctx.createLinearGradient(
            BBox.x + BBox.width * (this.config.x1 / 100),
            BBox.y + BBox.height * (this.config.y1 / 100),
            BBox.x + BBox.width * (this.config.x2 / 100),
            BBox.y + BBox.height * (this.config.y2 / 100)
        );
        this.config.colorStops.forEach(function (d) {
            lGradient.addColorStop(d.value / 100, d.color);
        });
        return lGradient;
    };

    CanvasGradients.prototype.absoluteLinearGradient = function absoluteGralinearGradient(ctx) {
        var lGradient = ctx.createLinearGradient(
            this.config.x1,
            this.config.y1,
            this.config.x2,
            this.config.y2
        );
        this.config.colorStops.forEach(function (d) {
            lGradient.addColorStop(d.value, d.color);
        });
        return lGradient;
    };

    CanvasGradients.prototype.radialGradient = function GRAradialGradient(ctx, BBox) {
        var cGradient = ctx.createRadialGradient(
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
        this.config.colorStops.forEach(function (d) {
            cGradient.addColorStop(d.value / 100, d.color);
        });
        return cGradient;
    };

    CanvasGradients.prototype.absoluteRadialGradient = function absoluteGraradialGradient(ctx, BBox) {
        var cGradient = ctx.createRadialGradient(
            this.config.innerCircle.x,
            this.config.innerCircle.y,
            this.config.innerCircle.r,
            this.config.outerCircle.x,
            this.config.outerCircle.y,
            this.config.outerCircle.r
        );
        this.config.colorStops.forEach(function (d) {
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
        var pixels = this.imageData ? this.imageData.pixels : [];
        var rIndex = (pos.y - 1) * (this.width * 4) + (pos.x - 1) * 4;
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
        var rIndex = (pos.y - 1) * (this.width * 4) + (pos.x - 1) * 4;
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

    function getCanvasImgInstance(width, height) {
        var canvas = document.createElement("canvas");
        canvas.setAttribute("height", height);
        canvas.setAttribute("width", width);
        canvas.style.height = height + "px";
        canvas.style.width = width + "px";
        return canvas;
    }

    function CanvasMask(self, config) {
        if ( config === void 0 ) config = {};

        var maskId = config.id ? config.id : "mask-" + Math.ceil(Math.random() * 1000);
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

    function CanvasClipping(self, config) {
        if ( config === void 0 ) config = {};

        var clipId = config.id ? config.id : "clip-" + Math.ceil(Math.random() * 1000);
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

    function CanvasPattern(self, config) {
        if ( config === void 0 ) config = {};

        var selfSelf = this;
        var patternId = config.id ? config.id : "pattern-" + Math.ceil(Math.random() * 1000);
        this.repeatInd = config.repeat ? config.repeat : "repeat";
        selfSelf.pattern = canvasLayer(
            null,
            {},
            {
                enableEvents: false,
                enableResize: false,
            }
        );
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

    function createCanvasPattern(patternConfig) {
        return new CanvasPattern(this, patternConfig);
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
        applyStyles: applyStyles,
    };

    var imageDataMap = {};

    function imageInstance(self) {
        var imageIns = new Image();
        imageIns.crossOrigin = "anonymous";
        imageIns.onload = function onload() {
            self.attr.height = self.attr.height ? self.attr.height : this.height;
            self.attr.width = self.attr.width ? self.attr.width : this.width;

            if (imageDataMap[self.attr.src]) {
                self.imageObj = imageDataMap[self.attr.src];
            } else {
                var im = getCanvasImgInstance(this.width, this.height);
                var ctxX = im.getContext("2d");
                ctxX.drawImage(this, 0, 0, this.width, this.height);
                self.imageObj = im;
                imageDataMap[self.attr.src] = im;
            }

            self.postProcess();

            if (self.nodeExe.attr.onload && typeof self.nodeExe.attr.onload === "function") {
                self.nodeExe.attr.onload.call(self.nodeExe, self.image);
            }

            self.nodeExe.BBoxUpdate = true;
            queueInstance$4.vDomChanged(self.nodeExe.vDomIndex);
        };

        imageIns.onerror = function onerror(error) {
            if (self.nodeExe.attr.onerror && typeof self.nodeExe.attr.onerror === "function") {
                self.nodeExe.attr.onerror.call(self.nodeExe, error);
            }
        };

        return imageIns;
    }

    function RenderImage(ctx, props, stylesProps, onloadExe, onerrorExe, nodeExe) {
        var self = this;
        self.ctx = ctx;
        self.attr = props;
        self.style = stylesProps;
        self.nodeName = "Image";
        self.nodeExe = nodeExe;

        for (var key in props) {
            this.setAttr(key, props[key]);
        }

        queueInstance$4.vDomChanged(nodeExe.vDomIndex);
        self.stack = [self];
    }

    RenderImage.prototype = new CanvasDom();
    RenderImage.prototype.constructor = RenderImage;

    RenderImage.prototype.setAttr = function RIsetAttr(attr, value) {
        var self = this;

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
                self.postProcess();
                self.attr.height = self.attr.height ? self.attr.height : value.height;
                self.attr.width = self.attr.width ? self.attr.width : value.width;
            } else if (value instanceof CanvasNodeExe) {
                self.imageObj = value.domEl;
                self.postProcess();
                self.attr.height = self.attr.height ? self.attr.height : value.height;
                self.attr.width = self.attr.width ? self.attr.width : value.width;
            }
        }
        this.attr[attr] = value;

        if (attr === "clip") {
            this.clipImage();
        }

        if (attr === "pixels") {
            this.pixelsUpdate();
        }

        queueInstance$4.vDomChanged(this.nodeExe.vDomIndex);
    };

    RenderImage.prototype.postProcess = function () {
        var self = this;
        if (self.attr.clip) {
            self.clipImage();
        }

        if (self.attr.pixels) {
            self.pixelsUpdate();
        }
    };

    RenderImage.prototype.clipImage = function () {
        var self = this;
        if (!self.imageObj) {
            return;
        }
        if (!self.rImageObj) {
            self.rImageObj = getCanvasImgInstance(self.attr.width, self.attr.height);
        }

        var ctxX = self.rImageObj.getContext("2d");
        var ref = self.attr;
        var clip = ref.clip;
        var width = ref.width; if ( width === void 0 ) width = 0;
        var height = ref.height; if ( height === void 0 ) height = 0;
        var sx = clip.sx; if ( sx === void 0 ) sx = 0;
        var sy = clip.sy; if ( sy === void 0 ) sy = 0;
        var swidth = clip.swidth; if ( swidth === void 0 ) swidth = width;
        var sheight = clip.sheight; if ( sheight === void 0 ) sheight = height;

        ctxX.clearRect(0, 0, width, height);
        ctxX.drawImage(this.imageObj, sx, sy, swidth, sheight, 0, 0, width, height);
    };

    RenderImage.prototype.pixelsUpdate = function () {
        var self = this;
        var ctxX;
        var pixels;

        if (!this.imageObj) {
            return;
        }

        var ref = self.attr;
        var width = ref.width; if ( width === void 0 ) width = 0;
        var height = ref.height; if ( height === void 0 ) height = 0;

        if (!self.rImageObj) {
            self.rImageObj = getCanvasImgInstance(width, height);
            ctxX = self.rImageObj.getContext("2d");
            ctxX.drawImage(self.imageObj, 0, 0, width, height);
        } else {
            ctxX = self.rImageObj.getContext("2d");
            // ctxX.drawImage(self.imageObj, 0, 0, width, height);
        }
        pixels = ctxX.getImageData(0, 0, width, height);

        // ctxX.clearRect(0, 0, width, height);
        // ctxX.clearRect(0, 0, width, height);
        ctxX.putImageData(self.attr.pixels(pixels), 0, 0);
    };

    RenderImage.prototype.updateBBox = function RIupdateBBox() {
        var self = this;
        var ref = self.attr;
        var transform = ref.transform;
        var x = ref.x; if ( x === void 0 ) x = 0;
        var y = ref.y; if ( y === void 0 ) y = 0;
        var width = ref.width; if ( width === void 0 ) width = 0;
        var height = ref.height; if ( height === void 0 ) height = 0;
        var ref$1 = parseTransform(transform);
        var translateX = ref$1.translateX;
        var translateY = ref$1.translateY;
        var scaleX = ref$1.scaleX;
        var scaleY = ref$1.scaleY;

        self.BBox = {
            x: (translateX + x) * scaleX,
            y: (translateY + y) * scaleY,
            width: width * scaleX,
            height: height * scaleY,
        };

        if (transform && transform.rotate) {
            self.BBoxHit = t2DGeometry$3.rotateBBox(this.BBox, transform);
        } else {
            self.BBoxHit = this.BBox;
        }
    };

    RenderImage.prototype.execute = function RIexecute() {
        var ref = this.attr;
        var width = ref.width; if ( width === void 0 ) width = 0;
        var height = ref.height; if ( height === void 0 ) height = 0;
        var x = ref.x; if ( x === void 0 ) x = 0;
        var y = ref.y; if ( y === void 0 ) y = 0;

        if (this.imageObj) {
            this.ctx.drawImage(this.rImageObj ? this.rImageObj : this.imageObj, x, y, width, height);
        }
    };

    RenderImage.prototype.applyStyles = function RIapplyStyles() {};

    RenderImage.prototype.in = function RIinfun(co) {
        var ref = this.attr;
        var width = ref.width; if ( width === void 0 ) width = 0;
        var height = ref.height; if ( height === void 0 ) height = 0;
        var x = ref.x; if ( x === void 0 ) x = 0;
        var y = ref.y; if ( y === void 0 ) y = 0;
        return co.x >= x && co.x <= x + width && co.y >= y && co.y <= y + height;
    };

    function RenderText(ctx, props, stylesProps) {
        var self = this;
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
        var self = this;
        var height = 1;
        var width = 0;
        var ref = self.attr;
        var x = ref.x; if ( x === void 0 ) x = 0;
        var y = ref.y; if ( y === void 0 ) y = 0;
        var transform = ref.transform;
        var ref$1 = parseTransform(transform);
        var translateX = ref$1.translateX;
        var translateY = ref$1.translateY;
        var scaleX = ref$1.scaleX;
        var scaleY = ref$1.scaleY;

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
            self.BBoxHit = t2DGeometry$3.rotateBBox(this.BBox, transform);
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
        var ref = this;
        var x = ref.x; if ( x === void 0 ) x = 0;
        var y = ref.y; if ( y === void 0 ) y = 0;
        var width = ref.width; if ( width === void 0 ) width = 0;
        var height = ref.height; if ( height === void 0 ) height = 0;
        return co.x >= x && co.x <= x + width && co.y >= y && co.y <= y + height;
    };
    /** ***************** Render Circle */

    var RenderCircle = function RenderCircle(ctx, props, stylesProps) {
        var self = this;
        self.ctx = ctx;
        self.attr = props;
        self.style = stylesProps;
        self.nodeName = "circle";
        self.stack = [self];
    };

    RenderCircle.prototype = new CanvasDom();
    RenderCircle.prototype.constructor = RenderCircle;

    RenderCircle.prototype.updateBBox = function RCupdateBBox() {
        var self = this;
        var ref = self.attr;
        var transform = ref.transform;
        var r = ref.r; if ( r === void 0 ) r = 0;
        var cx = ref.cx; if ( cx === void 0 ) cx = 0;
        var cy = ref.cy; if ( cy === void 0 ) cy = 0;
        var ref$1 = parseTransform(transform);
        var translateX = ref$1.translateX;
        var translateY = ref$1.translateY;
        var scaleX = ref$1.scaleX;
        var scaleY = ref$1.scaleY;

        self.BBox = {
            x: translateX + (cx - r) * scaleX,
            y: translateY + (cy - r) * scaleY,
            width: 2 * r * scaleX,
            height: 2 * r * scaleY,
        };

        if (transform && transform.rotate) {
            self.BBoxHit = t2DGeometry$3.rotateBBox(this.BBox, transform);
        } else {
            self.BBoxHit = this.BBox;
        }
    };

    RenderCircle.prototype.execute = function RCexecute() {
        var ref = this.attr;
        var r = ref.r; if ( r === void 0 ) r = 0;
        var cx = ref.cx; if ( cx === void 0 ) cx = 0;
        var cy = ref.cy; if ( cy === void 0 ) cy = 0;
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, r, 0, 2 * Math.PI, false);
        this.applyStyles();
        this.ctx.closePath();
    };

    RenderCircle.prototype.in = function RCinfun(co, eventType) {
        var ref = this.attr;
        var r = ref.r; if ( r === void 0 ) r = 0;
        var cx = ref.cx; if ( cx === void 0 ) cx = 0;
        var cy = ref.cy; if ( cy === void 0 ) cy = 0;
        var tr = Math.sqrt((co.x - cx) * (co.x - cx) + (co.y - cy) * (co.y - cy));
        return tr <= r;
    };

    var RenderLine = function RenderLine(ctx, props, stylesProps) {
        var self = this;
        self.ctx = ctx;
        self.attr = props;
        self.style = stylesProps;
        self.nodeName = "line";
        self.stack = [self];
    };

    RenderLine.prototype = new CanvasDom();
    RenderLine.prototype.constructor = RenderLine;

    RenderLine.prototype.updateBBox = function RLupdateBBox() {
        var self = this;
        var ref = self.attr;
        var transform = ref.transform;
        var x1 = ref.x1; if ( x1 === void 0 ) x1 = 0;
        var y1 = ref.y1; if ( y1 === void 0 ) y1 = 0;
        var x2 = ref.x2; if ( x2 === void 0 ) x2 = 0;
        var y2 = ref.y2; if ( y2 === void 0 ) y2 = 0;
        var ref$1 = parseTransform(transform);
        var translateX = ref$1.translateX;
        var translateY = ref$1.translateY;
        var scaleX = ref$1.scaleX;
        var scaleY = ref$1.scaleY;

        self.BBox = {
            x: translateX + (x1 < x2 ? x1 : x2) * scaleX,
            y: translateY + (y1 < y2 ? y1 : y2) * scaleY,
            width: Math.abs(x2 - x1) * scaleX,
            height: Math.abs(y2 - y1) * scaleY,
        };

        if (transform && transform.rotate) {
            self.BBoxHit = t2DGeometry$3.rotateBBox(this.BBox, transform);
        } else {
            self.BBoxHit = this.BBox;
        }
    };

    RenderLine.prototype.execute = function RLexecute() {
        var ref = this;
        var ctx = ref.ctx;
        var ref$1 = this.attr;
        var x1 = ref$1.x1; if ( x1 === void 0 ) x1 = 0;
        var y1 = ref$1.y1; if ( y1 === void 0 ) y1 = 0;
        var x2 = ref$1.x2; if ( x2 === void 0 ) x2 = 0;
        var y2 = ref$1.y2; if ( y2 === void 0 ) y2 = 0;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        this.applyStyles();
        ctx.closePath();
    };

    RenderLine.prototype.in = function RLinfun(co) {
        var ref = this.attr;
        var x1 = ref.x1; if ( x1 === void 0 ) x1 = 0;
        var y1 = ref.y1; if ( y1 === void 0 ) y1 = 0;
        var x2 = ref.x2; if ( x2 === void 0 ) x2 = 0;
        var y2 = ref.y2; if ( y2 === void 0 ) y2 = 0;
        return (
            parseFloat(
                t2DGeometry$3.getDistance(
                    {
                        x: x1,
                        y: y1,
                    },
                    co
                ) +
                    t2DGeometry$3.getDistance(co, {
                        x: x2,
                        y: y2,
                    })
            ).toFixed(1) ===
            parseFloat(
                t2DGeometry$3.getDistance(
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
        var self = this;
        self.ctx = ctx;
        self.attr = props;
        self.style = stylesProps;
        self.nodeName = "polyline";
        self.stack = [self];
    }

    RenderPolyline.prototype = new CanvasDom();
    RenderPolyline.constructor = RenderPolyline;

    RenderPolyline.prototype.execute = function polylineExe() {
        var self = this;
        var d;
        if (!this.attr.points || this.attr.points.length === 0) { return; }
        this.ctx.beginPath();
        self.ctx.moveTo(this.attr.points[0].x, this.attr.points[0].y);
        for (var i = 1; i < this.attr.points.length; i++) {
            d = this.attr.points[i];
            self.ctx.lineTo(d.x, d.y);
        }
        this.applyStyles();
        this.ctx.closePath();
    };

    RenderPolyline.prototype.updateBBox = RPolyupdateBBox;

    RenderPolyline.prototype.in = function RPolyLinfun(co) {
        var flag = false;

        for (var i = 0, len = this.attr.points.length; i <= len - 2; i++) {
            var p1 = this.attr.points[i];
            var p2 = this.attr.points[i + 1];
            flag =
                flag ||
                parseFloat(
                    t2DGeometry$3.getDistance(
                        {
                            x: p1.x,
                            y: p1.y,
                        },
                        co
                    ) +
                        t2DGeometry$3.getDistance(co, {
                            x: p2.x,
                            y: p2.y,
                        })
                ).toFixed(1) ===
                    parseFloat(
                        t2DGeometry$3.getDistance(
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

    var RenderPath = function RenderPath(ctx, props, styleProps) {
        var self = this;
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
        var self = this;
        var ref = self.attr;
        var transform = ref.transform;
        var ref$1 = parseTransform(transform);
        var translateX = ref$1.translateX;
        var translateY = ref$1.translateY;
        var scaleX = ref$1.scaleX;
        var scaleY = ref$1.scaleY;

        // if (transform && transform.translate) {
        // 	[translateX, translateY] = transform.translate;
        // }

        // if (transform && transform.scale) {
        // 	[scaleX = 1, scaleY = scaleX] = transform.scale;
        // }

        self.BBox = self.path
            ? t2DGeometry$3.getBBox(
                  self.path.stackGroup.length > 0 ? self.path.stackGroup : [self.path.stack]
              )
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
            self.BBoxHit = t2DGeometry$3.rotateBBox(this.BBox, transform);
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
        var flag = false;

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

        var polygon = new Path2D();
        polygon.moveTo(points[0].x, points[0].y);
        for (var i = 1; i < points.length; i++) {
            polygon.lineTo(points[i].x, points[i].y);
        }
        polygon.closePath();

        return {
            path: polygon,
            points: points,
            execute: function (ctx) {
                ctx.beginPath();
                var points = this.points;
                ctx.moveTo(points[0].x, points[0].y);
                for (var i = 1; i < points.length; i++) {
                    ctx.lineTo(points[i].x, points[i].y);
                }
                ctx.closePath();
            },
        };
    }

    var RenderPolygon = function RenderPolygon(ctx, props, styleProps) {
        var self = this;
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

    RenderPolygon.prototype.applyStyles = function RPolyapplyStyles() {};

    RenderPolygon.prototype.in = function RPolyinfun(co) {
        var flag = false;

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

    var RenderEllipse = function RenderEllipse(ctx, props, styleProps) {
        var self = this;
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
        var self = this;
        // let translateX = 0;
        // let translateY = 0;
        // let scaleX = 1;
        // let scaleY = 1;
        var ref = self.attr;
        var transform = ref.transform;
        var cx = ref.cx; if ( cx === void 0 ) cx = 0;
        var cy = ref.cy; if ( cy === void 0 ) cy = 0;
        var rx = ref.rx; if ( rx === void 0 ) rx = 0;
        var ry = ref.ry; if ( ry === void 0 ) ry = 0;
        var ref$1 = parseTransform(transform);
        var translateX = ref$1.translateX;
        var translateY = ref$1.translateY;
        var scaleX = ref$1.scaleX;
        var scaleY = ref$1.scaleY;

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
            self.BBoxHit = t2DGeometry$3.rotateBBox(this.BBox, transform);
        } else {
            self.BBoxHit = this.BBox;
        }
    };

    RenderEllipse.prototype.execute = function REexecute() {
        var ctx = this.ctx;
        var ref = this.attr;
        var cx = ref.cx; if ( cx === void 0 ) cx = 0;
        var cy = ref.cy; if ( cy === void 0 ) cy = 0;
        var rx = ref.rx; if ( rx === void 0 ) rx = 0;
        var ry = ref.ry; if ( ry === void 0 ) ry = 0;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
        this.applyStyles();
        ctx.closePath();
    };

    RenderEllipse.prototype.in = function REinfun(co) {
        var ref = this.attr;
        var cx = ref.cx; if ( cx === void 0 ) cx = 0;
        var cy = ref.cy; if ( cy === void 0 ) cy = 0;
        var rx = ref.rx; if ( rx === void 0 ) rx = 0;
        var ry = ref.ry; if ( ry === void 0 ) ry = 0;
        return ((co.x - cx) * (co.x - cx)) / (rx * rx) + ((co.y - cy) * (co.y - cy)) / (ry * ry) <= 1;
    };
    /** ***************** Render ellipse */

    /** ***************** Render Rect */

    var RenderRect = function RenderRect(ctx, props, styleProps) {
        var self = this;
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
        var self = this;
        var ref = self.attr;
        var transform = ref.transform;
        var x = ref.x; if ( x === void 0 ) x = 0;
        var y = ref.y; if ( y === void 0 ) y = 0;
        var width = ref.width; if ( width === void 0 ) width = 0;
        var height = ref.height; if ( height === void 0 ) height = 0;
        var ref$1 = parseTransform(transform);
        var translateX = ref$1.translateX;
        var translateY = ref$1.translateY;
        var scaleX = ref$1.scaleX;
        var scaleY = ref$1.scaleY;

        self.BBox = {
            x: translateX + x * scaleX,
            y: translateY + y * scaleY,
            width: width * scaleX,
            height: height * scaleY,
        };

        if (transform && transform.rotate) {
            self.BBoxHit = t2DGeometry$3.rotateBBox(this.BBox, transform);
        } else {
            self.BBoxHit = this.BBox;
        }
    };

    RenderRect.prototype.applyStyles = function rStyles() {};

    function renderRoundRect(ctx, attr) {
        var x = attr.x; if ( x === void 0 ) x = 0;
        var y = attr.y; if ( y === void 0 ) y = 0;
        var width = attr.width; if ( width === void 0 ) width = 0;
        var height = attr.height; if ( height === void 0 ) height = 0;
        var rx = attr.rx; if ( rx === void 0 ) rx = 0;
        var ry = attr.ry; if ( ry === void 0 ) ry = 0;

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
        var ctx = this.ctx;
        var ref = this.attr;
        var x = ref.x; if ( x === void 0 ) x = 0;
        var y = ref.y; if ( y === void 0 ) y = 0;
        var width = ref.width; if ( width === void 0 ) width = 0;
        var height = ref.height; if ( height === void 0 ) height = 0;
        var rx = ref.rx; if ( rx === void 0 ) rx = 0;
        var ry = ref.ry; if ( ry === void 0 ) ry = 0;

        if (ctx.fillStyle !== "#000000" || ctx.strokeStyle !== "#000000") {
            if (ctx.fillStyle !== "#000000") {
                if (!rx && !ry) {
                    ctx.fillRect(x, y, width, height);
                } else {
                    renderRoundRect(ctx, {
                        x: x,
                        y: y,
                        width: width,
                        height: height,
                        rx: rx,
                        ry: ry,
                    });
                    ctx.fill();
                }
            }

            if (ctx.strokeStyle !== "#000000") {
                if (!rx && !ry) {
                    ctx.strokeRect(x, y, width, height);
                } else {
                    renderRoundRect(ctx, {
                        x: x,
                        y: y,
                        width: width,
                        height: height,
                        rx: rx,
                        ry: ry,
                    });
                    ctx.stroke();
                }
            }
        } else {
            ctx.rect(x, y, width, height);
        }
    };

    RenderRect.prototype.in = function RRinfun(co) {
        var ref = this.attr;
        var x = ref.x; if ( x === void 0 ) x = 0;
        var y = ref.y; if ( y === void 0 ) y = 0;
        var width = ref.width; if ( width === void 0 ) width = 0;
        var height = ref.height; if ( height === void 0 ) height = 0;
        return co.x >= x && co.x <= x + width && co.y >= y && co.y <= y + height;
    };
    /** ***************** Render Rect */

    /** ***************** Render Group */

    var RenderGroup = function RenderGroup(ctx, props, styleProps) {
        var self = this;
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
        var self = this;
        var minX;
        var maxX;
        var minY;
        var maxY;
        var ref = self.attr;
        var transform = ref.transform;
        var ref$1 = parseTransform(transform);
        var translateX = ref$1.translateX;
        var translateY = ref$1.translateY;
        var scaleX = ref$1.scaleX;
        var scaleY = ref$1.scaleY;
        self.BBox = {};

        if (children && children.length > 0) {
            var d;
            var boxX;
            var boxY;

            for (var i = 0; i < children.length; i += 1) {
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
            self.BBoxHit = t2DGeometry$3.rotateBBox(this.BBox, this.attr.transform);
        } else {
            self.BBoxHit = this.BBox;
        }
    };

    RenderGroup.prototype.child = function RGchild(obj) {
        var self = this;
        var objLocal = obj;

        if (objLocal instanceof CanvasNodeExe) {
            objLocal.dom.parent = self;
            self.stack[self.stack.length] = objLocal;
        } else if (objLocal instanceof CanvasCollection) {
            objLocal.stack.forEach(function (d) {
                d.dom.parent = self;
                self.stack[self.stack.length] = d;
            });
        } else {
            console.log("wrong Object");
        }
    };

    RenderGroup.prototype.in = function RGinfun(coOr) {
        var self = this;
        var co = {
            x: coOr.x,
            y: coOr.y,
        };
        var ref = this;
        var BBox = ref.BBox;
        var ref$1 = self.attr;
        var transform = ref$1.transform;
        var ref$2 = parseTransform(transform);
        var translateX = ref$2.translateX;
        var translateY = ref$2.translateY;
        var scaleX = ref$2.scaleX;
        var scaleY = ref$2.scaleY;

        return (
            co.x >= (BBox.x - translateX) / scaleX &&
            co.x <= (BBox.x - translateX + BBox.width) / scaleX &&
            co.y >= (BBox.y - translateY) / scaleY &&
            co.y <= (BBox.y - translateY + BBox.height) / scaleY
        );
    };

    /** ***************** End Render Group */

    var CanvasNodeExe = function CanvasNodeExe(context, config, id, vDomIndex) {
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
        this.bbox = config["bbox"] !== undefined ? config["bbox"] : true;

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
        var value;
        var key;
        var style = this.style;

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
        var ref = this.dom.parent;
        var children = ref.children;
        var index = children.indexOf(this);

        if (index !== -1) {
            children.splice(index, 1);
        }

        this.dom.parent.BBoxUpdate = true;
        queueInstance$4.vDomChanged(this.vDomIndex);
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
            var styleKeys = Object.keys(attr);

            for (var i = 0, len = styleKeys.length; i < len; i += 1) {
                if (attr[styleKeys[i]] == null && this.style[styleKeys[i]] != null) {
                    delete this.style[styleKeys[i]];
                } else {
                    this.style[styleKeys[i]] = valueCheck(attr[styleKeys[i]]);
                }
            }
        }

        queueInstance$4.vDomChanged(this.vDomIndex);
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
            var keys = Object.keys(attr);

            for (var i = 0; i < keys.length; i += 1) {
                if (attr[keys[i]] == null && this.attr[keys[i]] != null) {
                    delete this.attr[keys[i]];
                } else {
                    this.attr[keys[i]] = attr[keys[i]];
                }
                this.dom.setAttr(keys[i], attr[keys[i]]);
            }
        }

        this.BBoxUpdate = true;
        queueInstance$4.vDomChanged(this.vDomIndex);
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
        queueInstance$4.vDomChanged(this.vDomIndex);
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
        queueInstance$4.vDomChanged(this.vDomIndex);
        return this;
    };

    CanvasNodeExe.prototype.translate = function Ctranslate(XY) {
        if (!this.attr.transform) {
            this.attr.transform = {};
        }

        this.attr.transform.translate = XY;
        this.dom.setAttr("transform", this.attr.transform);
        this.BBoxUpdate = true;
        queueInstance$4.vDomChanged(this.vDomIndex);
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
        queueInstance$4.vDomChanged(this.vDomIndex);
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
        queueInstance$4.vDomChanged(this.vDomIndex);
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
            for (var i = 0, len = this.children.length; i < len; i += 1) {
                this.children[i].execute();
            }
        }
        this.ctx.restore();
    };

    CanvasNodeExe.prototype.prependChild = function child(childrens) {
        var self = this;
        var childrensLocal = childrens;

        if (self.dom instanceof RenderGroup) {
            for (var i = 0; i < childrensLocal.length; i += 1) {
                childrensLocal[i].dom.parent = self;
                self.children.unshift(childrensLocal[i]);
            }
        } else {
            console.error("Trying to insert child to nonGroup Element");
        }

        this.BBoxUpdate = true;
        queueInstance$4.vDomChanged(this.vDomIndex);
        return self;
    };

    CanvasNodeExe.prototype.child = function child(childrens) {
        var self = this;
        var childrensLocal = childrens;

        if (self.dom instanceof RenderGroup) {
            for (var i = 0; i < childrensLocal.length; i += 1) {
                childrensLocal[i].dom.parent = self;
                self.children[self.children.length] = childrensLocal[i];
            }
        } else {
            console.error("Trying to insert child to nonGroup Element");
        }

        this.BBoxUpdate = true;
        queueInstance$4.vDomChanged(this.vDomIndex);
        return self;
    };

    CanvasNodeExe.prototype.updateBBox = function CupdateBBox() {
        var status;

        if (this.bbox) {
            for (var i = 0, len = this.children.length; i < len; i += 1) {
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
        var self = this;
        // this.dom.on(eventType, hndlr);
        if (!this.events) {
            this.events = {};
        }

        if (!hndlr && this.events[eventType]) {
            delete this.events[eventType];
        } else if (hndlr) {
            if (typeof hndlr === "function") {
                var hnd = hndlr.bind(self);
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
        var e = new CanvasCollection(
            {
                type: "CANVAS",
                ctx: this.dom.ctx,
            },
            data,
            config,
            this.vDomIndex
        );
        this.child(e.stack);
        queueInstance$4.vDomChanged(this.vDomIndex);
        return e;
    };

    CanvasNodeExe.prototype.text = function Ctext(value) {
        if (this.dom instanceof RenderText) {
            this.dom.text(value);
        }

        queueInstance$4.vDomChanged(this.vDomIndex);
        return this;
    };

    CanvasNodeExe.prototype.createEl = function CcreateEl(config) {
        var e = new CanvasNodeExe(this.dom.ctx, config, domId$1(), this.vDomIndex);
        this.child([e]);
        queueInstance$4.vDomChanged(this.vDomIndex);
        return e;
    };

    CanvasNodeExe.prototype.removeChild = function CremoveChild(obj) {
        var index = -1;
        this.children.forEach(function (d, i) {
            if (d === obj) {
                index = i;
            }
        });

        if (index !== -1) {
            var removedNode = this.children.splice(index, 1)[0];
            this.dom.removeChild(removedNode.dom);
        }

        this.BBoxUpdate = true;
        queueInstance$4.vDomChanged(this.vDomIndex);
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
        var imageData = this.ctx.getImageData(
            this.dom.BBox.x,
            this.dom.BBox.y,
            this.dom.BBox.width,
            this.dom.BBox.height
        );
        var pixelInstance = new PixelObject(imageData, this.dom.BBox.width, this.dom.BBox.height);

        return pixelInstance;
        // this.ctx.getImageData(this.dom.BBox.x, this.dom.BBox.y, this.dom.BBox.width, this.dom.BBox.height);
    };

    CanvasNodeExe.prototype.putPixels = function (pixels) {
        if (!(pixels instanceof PixelObject)) {
            return;
        }
        return this.ctx.putImageData(pixels.imageData, this.dom.BBox.x, this.dom.BBox.y);
    };

    function canvasLayer(container, contextConfig, layerSettings) {
        if ( contextConfig === void 0 ) contextConfig = {};
        if ( layerSettings === void 0 ) layerSettings = {};

        var res = container ? document.querySelector(container) : null;
        var height = res ? res.clientHeight : 0;
        var width = res ? res.clientWidth : 0;
        var layer = document.createElement("canvas");
        var ctx = layer.getContext("2d", contextConfig);
        var enableEvents = layerSettings.enableEvents; if ( enableEvents === void 0 ) enableEvents = true;
        var autoUpdate = layerSettings.autoUpdate; if ( autoUpdate === void 0 ) autoUpdate = true;
        var enableResize = layerSettings.enableResize; if ( enableResize === void 0 ) enableResize = true;
        var ratio = getPixlRatio(ctx);
        ctx.pixelRatio = ratio;
        var onClear = function (ctx) {
            ctx.clearRect(0, 0, width * ratio, height * ratio);
        };
        layer.setAttribute("height", height * ratio);
        layer.setAttribute("width", width * ratio);
        layer.style.height = height + "px";
        layer.style.width = width + "px";
        layer.style.position = "absolute";

        var vDomInstance;
        var vDomIndex = 999999;
        var cHeight;
        var cWidth;
        var resizeCall;
        var onChangeExe;

        if (res) {
            res.appendChild(layer);
            vDomInstance = new VDom();
            if (autoUpdate) {
                vDomIndex = queueInstance$4.addVdom(vDomInstance);
            }
        } else {
            enableEvents = false;
        }

        var root = new CanvasNodeExe(
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

        var execute = root.execute.bind(root);
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

        root.setPixelRatio = function (val) {
            ratio = val;
            this.ctx.pixelRatio = ratio;
            this.setSize(this.width, this.height);
        };

        root.addDependentLayer = function (layer) {
            if (!(layer instanceof CanvasNodeExe)) {
                return;
            }
            var depId = layer.attr.id ? layer.attr.id : "dep-" + Math.ceil(Math.random() * 1000);
            layer.setAttr("id", depId);
            layer.vDomIndex = this.vDomIndex + ":" + depId;
            this.prependChild([layer]);
        };

        var resize = function () {
            if (!document.querySelector(container)) {
                window.removeEventListener("resize", resize);
                return;
            }
            height = cHeight || res.clientHeight;
            width = cWidth || res.clientWidth;
            layer.setAttribute("height", height * ratio);
            layer.setAttribute("width", width * ratio);
            layer.style.height = height + "px";
            layer.style.width = width + "px";
            root.width = width;
            root.height = height;

            if (resizeCall) {
                resizeCall();
            }
            root.execute();
        };

        root.onResize = function (exec) {
            resizeCall = exec;
        };

        root.onChange = function (exec) {
            onChangeExe = exec;
        };

        root.invokeOnChange = function () {};

        root.setSize = function (width_, height_) {
            cHeight = height_;
            cWidth = width_;
            width = width_;
            height = height_;
            this.domEl.setAttribute("height", cHeight * ratio);
            this.domEl.setAttribute("width", cWidth * ratio);
            this.domEl.style.height = cHeight + "px";
            this.domEl.style.width = cWidth + "px";
            this.width = width;
            this.height = height;
            this.execute();
        };

        root.setViewBox = function (x, y, height, width) {};

        root.getPixels = function (x, y, width_, height_) {
            var imageData = this.ctx.getImageData(x, y, width_, height_);
            var pixelInstance = new PixelObject(imageData, width_, height_);

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

        root.destroy = function () {
            var res = document.querySelector(container);
            if (res && res.contains(layer)) {
                res.removeChild(layer);
            }
            queueInstance$4.removeVdom(vDomIndex);
        };

        if (enableEvents) {
            var eventsInstance = new Events(root);
            layer.addEventListener("mousemove", function (e) {
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
            layer.addEventListener("mousedown", function (e) {
                // e.preventDefault();
                eventsInstance.mousedownCheck(e);
            });
            layer.addEventListener("mouseup", function (e) {
                // e.preventDefault();
                eventsInstance.mouseupCheck(e);
            });
            layer.addEventListener("mouseleave", function (e) {
                // e.preventDefault();
                eventsInstance.mouseleaveCheck(e);
            });
            layer.addEventListener("contextmenu", function (e) {
                // e.preventDefault();
                eventsInstance.contextmenuCheck(e);
            });
            layer.addEventListener("touchstart", function (e) {
                // e.preventDefault();
                eventsInstance.touchstartCheck(e);
            });
            layer.addEventListener("touchend", function (e) {
                // e.preventDefault();
                eventsInstance.touchendCheck(e);
            });
            layer.addEventListener("touchmove", function (e) {
                e.preventDefault();
                eventsInstance.touchmoveCheck(e);
            });
            layer.addEventListener("touchcancel", function (e) {
                // e.preventDefault();
                eventsInstance.touchcancelCheck(e);
            });
            layer.addEventListener("wheel", function (e) {
                // e.preventDefault();
                eventsInstance.wheelEventCheck(e);
            });
            layer.addEventListener("pointerdown", function (e) {
                // e.preventDefault();
                eventsInstance.addPointer(e);
                eventsInstance.pointerdownCheck(e);
            });
            layer.addEventListener("pointerup", function (e) {
                // e.preventDefault();
                eventsInstance.removePointer(e);
                eventsInstance.pointerupCheck(e);
            });
            layer.addEventListener("pointermove", function (e) {
                e.preventDefault();
                eventsInstance.pointermoveCheck(e);
            });
        }

        queueInstance$4.execute();

        if (enableResize) {
            window.addEventListener("resize", resize);
        }

        return root;
    }

    function canvasNodeLayer(config, height, width) {
        if ( height === void 0 ) height = 0;
        if ( width === void 0 ) width = 0;

        if (!Canvas) {
            console.error("Canvas missing from node");
            console.error('Install "Canvas" "canvas-5-polyfill" node modules');
            console.error('Make "Canvas" "Image" "Path2D" objects global from the above modules');
            return;
        }

        var layer = new Canvas(width, height);
        var ctx = layer.getContext("2d", config);
        var ratio = getPixlRatio(ctx);
        var onClear = function (ctx) {
            ctx.clearRect(0, 0, width * ratio, height * ratio);
        };
        var vDomInstance = new VDom();
        var vDomIndex = queueInstance$4.addVdom(vDomInstance);
        var root = new CanvasNodeExe(
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
        var execute = root.execute.bind(root);
        root.domEl = layer;
        root.height = height;
        root.width = width;
        root.type = "CANVAS";
        root.ENV = "NODE";

        root.setClear = function (exe) {
            onClear = exe;
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

        root.execute = function () {
            onClear(ctx);
            ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
            root.updateBBox();
            execute();
        };

        root.toDataURL = function () {
            return this.domEl.toDataURL();
        };

        return root;
    }

    var canvasAPI = {
        canvasLayer: canvasLayer,
        canvasNodeLayer: canvasNodeLayer,
    };

    /* eslint-disable no-undef */
    function shaders(el) {
        var res;

        switch (el) {
            case "point":
                res = {
                    vertexShader: "\n          precision highp float;\n          attribute vec2 a_position;\n          attribute vec4 a_color;\n          attribute float a_size;\n          \n          uniform vec2 u_resolution;\n          uniform vec2 u_translate;\n          uniform vec2 u_scale;\n          \n          varying vec4 v_color;\n          void main() {\n            vec2 zeroToOne = (u_translate + (u_scale * a_position)) / u_resolution;\n            vec2 clipSpace = ((zeroToOne) * 2.0) - 1.0;\n            gl_Position = vec4((clipSpace * vec2(1.0, -1.0)), 0, 1);\n            gl_PointSize = a_size * u_scale.x;\n            v_color = a_color;\n          }\n          ",
                    fragmentShader: "\n                    precision mediump float;\n                    varying vec4 v_color;\n                    void main() {\n                        gl_FragColor = v_color;\n                    }\n                    ",
                };
                break;

            case "circle":
                res = {
                    vertexShader: "\n        precision highp float;\n          attribute vec2 a_position;\n          attribute vec4 a_color;\n          attribute float a_radius;\n          uniform vec2 u_resolution;\n          uniform vec2 u_translate;\n          uniform vec2 u_scale;\n          varying vec4 v_color;\n          void main() {\n            vec2 zeroToOne = (u_translate + (u_scale * a_position)) / u_resolution;\n            vec2 zeroToTwo = zeroToOne * 2.0;\n            vec2 clipSpace = zeroToTwo - 1.0;\n            gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);\n            gl_PointSize = a_radius * u_scale.x;\n            v_color = a_color;\n          }\n          ",
                    fragmentShader: "\n                    precision mediump float;\n                    varying vec4 v_color;\n                    void main() {\n                      float r = 0.0, delta = 0.0, alpha = 1.0;\n                      vec2 cxy = 2.0 * gl_PointCoord - 1.0;\n                      r = dot(cxy, cxy);\n                      if(r > 1.0) {\n                        discard;\n                      }\n                      delta = 0.09;\n                      alpha = 1.0 - smoothstep(1.0 - delta, 1.0 + delta, r);\n                      gl_FragColor = v_color * alpha;\n                    }\n                    ",
                };
                break;

            case "ellipse":
                res = {
                    vertexShader: "\n        precision highp float;\n          attribute vec2 a_position;\n          attribute vec4 a_color;\n          attribute float a_r1;\n          attribute float a_r2;\n          uniform vec2 u_resolution;\n          uniform vec2 u_translate;\n          uniform vec2 u_scale;\n          varying vec4 v_color;\n          varying float v_r1;\n          varying float v_r2;\n          void main() {\n            vec2 zeroToOne = (u_translate + (u_scale * a_position)) / u_resolution;\n            vec2 zeroToTwo = zeroToOne * 2.0;\n            vec2 clipSpace = zeroToTwo - 1.0;\n            gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);\n            gl_PointSize = max(a_r1, a_r2);\n            v_color = a_color;\n            v_r1 = a_r1;\n            v_r2 = a_r2;\n          }\n          ",
                    fragmentShader: "\n                    precision mediump float;\n                    varying vec4 v_color;\n                    varying float v_r1;\n                    varying float v_r2;\n                    void main() {\n                      float r = 0.0, delta = 0.0, alpha = 1.0;\n                      vec2 cxy = 2.0 * gl_PointCoord - 1.0;\n                      r = ((cxy.x * cxy.x) / (v_r1 * v_r1), (cxy.y * cxy.y) / (v_r2 * v_r2));\n                      if(r > 1.0) {\n                        discard;\n                      }\n                      delta = 0.09;\n                      alpha = 1.0 - smoothstep(1.0 - delta, 1.0 + delta, r);\n                      gl_FragColor = v_color * alpha;\n                    }\n                    ",
                };
                break;

            case "image":
                res = {
                    vertexShader: "\n                    precision highp float;\n                    attribute vec2 a_position;\n                    attribute vec2 a_texCoord;\n                    uniform vec2 u_resolution;\n                    uniform vec2 u_translate;\n                    uniform vec2 u_scale;\n                    varying vec2 v_texCoord;\n                    void main() {\n                      vec2 zeroToOne = (u_translate + (u_scale * a_position)) / u_resolution;\n                      vec2 clipSpace = zeroToOne * 2.0 - 1.0;\n                      gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);\n                      v_texCoord = a_texCoord;\n                    }\n          ",
                    fragmentShader: "\n                    precision mediump float;\n                    uniform sampler2D u_image;\n                    uniform float u_opacity;\n                    varying vec2 v_texCoord;\n                    void main() {\n                      gl_FragColor = texture2D(u_image, v_texCoord);\n                      gl_FragColor.a *= u_opacity;\n                    }\n                    ",
                };
                break;

            case "polyline":
            case "polygon":
                res = {
                    vertexShader: "\n                    precision highp float;\n                    attribute vec2 a_position;\n                    uniform vec2 u_resolution;\n                    uniform vec2 u_translate;\n                    uniform vec2 u_scale;\n                    void main() {\n                    vec2 zeroToOne = (u_translate + (u_scale * a_position)) / u_resolution;\n                    vec2 clipSpace = zeroToOne * 2.0 - 1.0;\n                    gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);\n                    }\n                    ",
                    fragmentShader: "\n                    precision mediump float;\n                    uniform vec4 u_color;\n                    void main() {\n                        gl_FragColor = u_color;\n                    }\n                    ",
                };
                break;

            default:
                res = {
                    vertexShader: "\n                    precision highp float;\n                    attribute vec2 a_position;\n                    attribute vec4 a_color;\n                    uniform vec2 u_resolution;\n                    uniform vec2 u_translate;\n                    uniform vec2 u_scale;\n                    varying vec4 v_color;\n                    void main() {\n                    vec2 zeroToOne = (u_translate + (u_scale * a_position)) / u_resolution;\n                    vec2 clipSpace = zeroToOne * 2.0 - 1.0;\n                    gl_Position = vec4(clipSpace * vec2(1.0, -1.0), 0, 1);\n                    v_color = a_color;\n                    }\n                    ",
                    fragmentShader: "\n                    precision mediump float;\n                    varying vec4 v_color;\n                    void main() {\n                        gl_FragColor = v_color;\n                    }\n                    ",
                };
        }

        return res;
    }

    var earcut_1 = earcut;
    var default_1 = earcut;

    function earcut(data, holeIndices, dim) {

        dim = dim || 2;

        var hasHoles = holeIndices && holeIndices.length,
            outerLen = hasHoles ? holeIndices[0] * dim : data.length,
            outerNode = linkedList(data, 0, outerLen, dim, true),
            triangles = [];

        if (!outerNode || outerNode.next === outerNode.prev) { return triangles; }

        var minX, minY, maxX, maxY, x, y, invSize;

        if (hasHoles) { outerNode = eliminateHoles(data, holeIndices, outerNode, dim); }

        // if the shape is not too simple, we'll use z-order curve hash later; calculate polygon bbox
        if (data.length > 80 * dim) {
            minX = maxX = data[0];
            minY = maxY = data[1];

            for (var i = dim; i < outerLen; i += dim) {
                x = data[i];
                y = data[i + 1];
                if (x < minX) { minX = x; }
                if (y < minY) { minY = y; }
                if (x > maxX) { maxX = x; }
                if (y > maxY) { maxY = y; }
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
            for (i = start; i < end; i += dim) { last = insertNode(i, data[i], data[i + 1], last); }
        } else {
            for (i = end - dim; i >= start; i -= dim) { last = insertNode(i, data[i], data[i + 1], last); }
        }

        if (last && equals(last, last.next)) {
            removeNode(last);
            last = last.next;
        }

        return last;
    }

    // eliminate colinear or duplicate points
    function filterPoints(start, end) {
        if (!start) { return start; }
        if (!end) { end = start; }

        var p = start,
            again;
        do {
            again = false;

            if (!p.steiner && (equals(p, p.next) || area(p.prev, p, p.next) === 0)) {
                removeNode(p);
                p = end = p.prev;
                if (p === p.next) { break; }
                again = true;

            } else {
                p = p.next;
            }
        } while (again || p !== end);

        return end;
    }

    // main ear slicing loop which triangulates a polygon (given as a linked list)
    function earcutLinked(ear, triangles, dim, minX, minY, invSize, pass) {
        if (!ear) { return; }

        // interlink polygon nodes in z-order
        if (!pass && invSize) { indexCurve(ear, minX, minY, invSize); }

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

        if (area(a, b, c) >= 0) { return false; } // reflex, can't be an ear

        // now make sure we don't have other points inside the potential ear
        var p = ear.next.next;

        while (p !== ear.prev) {
            if (pointInTriangle(a.x, a.y, b.x, b.y, c.x, c.y, p.x, p.y) &&
                area(p.prev, p, p.next) >= 0) { return false; }
            p = p.next;
        }

        return true;
    }

    function isEarHashed(ear, minX, minY, invSize) {
        var a = ear.prev,
            b = ear,
            c = ear.next;

        if (area(a, b, c) >= 0) { return false; } // reflex, can't be an ear

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
                area(p.prev, p, p.next) >= 0) { return false; }
            p = p.prevZ;

            if (n !== ear.prev && n !== ear.next &&
                pointInTriangle(a.x, a.y, b.x, b.y, c.x, c.y, n.x, n.y) &&
                area(n.prev, n, n.next) >= 0) { return false; }
            n = n.nextZ;
        }

        // look for remaining points in decreasing z-order
        while (p && p.z >= minZ) {
            if (p !== ear.prev && p !== ear.next &&
                pointInTriangle(a.x, a.y, b.x, b.y, c.x, c.y, p.x, p.y) &&
                area(p.prev, p, p.next) >= 0) { return false; }
            p = p.prevZ;
        }

        // look for remaining points in increasing z-order
        while (n && n.z <= maxZ) {
            if (n !== ear.prev && n !== ear.next &&
                pointInTriangle(a.x, a.y, b.x, b.y, c.x, c.y, n.x, n.y) &&
                area(n.prev, n, n.next) >= 0) { return false; }
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
            if (list === list.next) { list.steiner = true; }
            queue.push(getLeftmost(list));
        }

        queue.sort(compareX);

        // process holes from left to right
        for (i = 0; i < queue.length; i++) {
            eliminateHole(queue[i], outerNode);
            outerNode = filterPoints(outerNode, outerNode.next);
        }

        return outerNode;
    }

    function compareX(a, b) {
        return a.x - b.x;
    }

    // find a bridge between vertices that connects hole with an outer ring and and link it
    function eliminateHole(hole, outerNode) {
        outerNode = findHoleBridge(hole, outerNode);
        if (outerNode) {
            var b = splitPolygon(outerNode, hole);

            // filter collinear points around the cuts
            filterPoints(outerNode, outerNode.next);
            filterPoints(b, b.next);
        }
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
                        if (hy === p.y) { return p; }
                        if (hy === p.next.y) { return p.next; }
                    }
                    m = p.x < p.next.x ? p : p.next;
                }
            }
            p = p.next;
        } while (p !== outerNode);

        if (!m) { return null; }

        if (hx === qx) { return m; } // hole touches outer segment; pick leftmost endpoint

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
            if (p.z === null) { p.z = zOrder(p.x, p.y, minX, minY, invSize); }
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
                    if (!q) { break; }
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

                    if (tail) { tail.nextZ = e; }
                    else { list = e; }

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
            if (p.x < leftmost.x || (p.x === leftmost.x && p.y < leftmost.y)) { leftmost = p; }
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

        if (o1 !== o2 && o3 !== o4) { return true; } // general case

        if (o1 === 0 && onSegment(p1, p2, q1)) { return true; } // p1, q1 and p2 are collinear and p2 lies on p1q1
        if (o2 === 0 && onSegment(p1, q2, q1)) { return true; } // p1, q1 and q2 are collinear and q2 lies on p1q1
        if (o3 === 0 && onSegment(p2, p1, q2)) { return true; } // p2, q2 and p1 are collinear and p1 lies on p2q2
        if (o4 === 0 && onSegment(p2, q1, q2)) { return true; } // p2, q2 and q1 are collinear and q1 lies on p2q2

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
                    intersects(p, p.next, a, b)) { return true; }
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
                { inside = !inside; }
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

        if (p.prevZ) { p.prevZ.nextZ = p.nextZ; }
        if (p.nextZ) { p.nextZ.prevZ = p.prevZ; }
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
                for (var d = 0; d < dim; d++) { result.vertices.push(data[i][j][d]); }
            }
            if (i > 0) {
                holeIndex += data[i - 1].length;
                result.holes.push(holeIndex);
            }
        }
        return result;
    };
    earcut_1.default = default_1;

    var t2DGeometry$4 = geometry;

    var ratio;
    var queueInstance$5 = queue;

    var zoomInstance$1 = behaviour.zoom();
    var dragInstance$1 = behaviour.drag();

    function getPixlRatio$1(ctx) {
        var dpr = window.devicePixelRatio || 1;
        var bsr =
            ctx.webkitBackingStorePixelRatio ||
            ctx.mozBackingStorePixelRatio ||
            ctx.msBackingStorePixelRatio ||
            ctx.oBackingStorePixelRatio ||
            ctx.backingStorePixelRatio ||
            1;
        return dpr / bsr;
    }

    var Id$3 = 0;

    function domId$2() {
        Id$3 += 1;
        return Id$3;
    }

    function parseTransform$1(transform) {
        var output = {
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
        var self = this;
        var ref = self.attr;
        var transform = ref.transform;
        var points = ref.points; if ( points === void 0 ) points = [];
        var ref$1 = parseTransform$1(transform);
        var translateX = ref$1.translateX;
        var translateY = ref$1.translateY;
        var scaleX = ref$1.scaleX;
        var scaleY = ref$1.scaleY;

        if (points && points.length > 0) {
            var minX = points[0].x;
            var maxX = points[0].x;
            var minY = points[0].y;
            var maxY = points[0].y;

            for (var i = 1; i < points.length; i += 1) {
                if (minX > points[i].x) { minX = points[i].x; }
                if (maxX < points[i].x) { maxX = points[i].x; }
                if (minY > points[i].y) { minY = points[i].y; }
                if (maxY < points[i].y) { maxY = points[i].y; }
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
            self.BBoxHit = t2DGeometry$4.rotateBBox(this.BBox, transform);
        } else {
            self.BBoxHit = this.BBox;
        }
    }

    var WebglCollection = function () {
        CollectionPrototype.apply(this, arguments);
    };
    WebglCollection.prototype = new CollectionPrototype();
    WebglCollection.prototype.constructor = WebglCollection;
    WebglCollection.prototype.createNode = function (ctx, config, vDomIndex) {
        return new WebglNodeExe(ctx, config, domId$2(), vDomIndex);
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
            loadShader(ctx, shaderCode.fragmentShader, ctx.FRAGMENT_SHADER) ];
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

    WebglDom.prototype.setStyle = function (key, value) {
        if (value) {
            this.style[key] = value;
            if (this.shader && key === "fill") {
                if (this.style.opacity !== undefined) {
                    value.a *= this.style.opacity;
                }
                this.shader.updateColor(this.pindex, value);
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

    function PointNode(attr, style) {
        this.attr = attr || {};
        this.style = style || {};
    }

    PointNode.prototype = new WebglDom();
    PointNode.prototype.constructor = PointNode;

    PointNode.prototype.setShader = function (shader) {
        this.shader = shader;
        if (this.shader) {
            this.shader.addVertex(this.attr.x || 0, this.attr.y || 0, this.pindex);
            this.shader.addColors(this.style.fill || defaultColor$1, this.pindex);
            this.shader.addSize(this.attr.size || 0, this.pindex);
        }
    };

    PointNode.prototype.setAttr = function (prop, value) {
        this.attr[prop] = value;
        if (this.shader && (prop === "x" || prop === "y")) {
            this.shader.updateVertex(this.pindex, this.attr.x, this.attr.y);
        }

        if (this.shader && prop === "size") {
            this.shader.updateSize(this.pindex, this.attr.size || 0);
        }
    };

    PointNode.prototype.updateBBox = function RRupdateBBox() {
        var self = this;
        var ref = self.attr;
        var transform = ref.transform;
        var x = ref.x; if ( x === void 0 ) x = 0;
        var y = ref.y; if ( y === void 0 ) y = 0;
        var size = ref.size; if ( size === void 0 ) size = 0;
        var ref$1 = parseTransform$1(transform);
        var translateX = ref$1.translateX;
        var translateY = ref$1.translateY;
        var scaleX = ref$1.scaleX;
        var scaleY = ref$1.scaleY;

        self.BBox = {
            x: translateX + x * scaleX,
            y: translateY + y * scaleY,
            width: size * scaleX,
            height: size * scaleY,
        };

        if (transform && transform.rotate) {
            self.BBoxHit = t2DGeometry$4.rotateBBox(this.BBox, transform);
        } else {
            self.BBoxHit = this.BBox;
        }
    };

    // PointNode.prototype.setStyle = function (key, value) {
    // 	this.style[key] = value;
    // 	if (this.shader && key === 'fill') {
    // 		this.shader.updateColor(this.pindex, value);
    // 	}
    // };
    // PointNode.prototype.getAttr = function (key) {
    // 	return this.attr[key];
    // };
    // PointNode.prototype.getStyle = function (key) {
    // 	return this.style[key];
    // };

    function RectNode(attr, style) {
        this.attr = attr || {};
        this.style = style || {};
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
            this.shader.addColors(this.style.fill || defaultColor$1, this.pindex);
        }
    };

    RectNode.prototype.setAttr = function (key, value) {
        this.attr[key] = value;
        if (!this.shader) {
            return;
        }
        if (key === "x" || key === "width") {
            this.shader.updateVertexX(this.pindex, this.attr.x || 0, this.attr.width || 0);
        }
        if (key === "y" || key === "height") {
            this.shader.updateVertexY(this.pindex, this.attr.y || 0, this.attr.height || 0);
        }
    };
    // RectNode.prototype.getAttr = function (key) {
    // 	return this.attr[key];
    // };

    // RectNode.prototype.setStyle = function (key, value) {
    // 	this.style[key] = value;
    // 	if (this.shader && key === 'fill') {
    // 		this.shader.updateColor(this.pindex, value);
    // 	}
    // };

    // RectNode.prototype.getStyle = function (key) {
    // 	return this.style[key];
    // };

    RectNode.prototype.in = function RRinfun(co) {
        var ref = this.attr;
        var x = ref.x; if ( x === void 0 ) x = 0;
        var y = ref.y; if ( y === void 0 ) y = 0;
        var width = ref.width; if ( width === void 0 ) width = 0;
        var height = ref.height; if ( height === void 0 ) height = 0;
        return co.x >= x && co.x <= x + width && co.y >= y && co.y <= y + height;
    };

    RectNode.prototype.updateBBox = function RRupdateBBox() {
        var self = this;
        var ref = self.attr;
        var transform = ref.transform;
        var x = ref.x; if ( x === void 0 ) x = 0;
        var y = ref.y; if ( y === void 0 ) y = 0;
        var width = ref.width; if ( width === void 0 ) width = 0;
        var height = ref.height; if ( height === void 0 ) height = 0;
        var ref$1 = parseTransform$1(transform);
        var translateX = ref$1.translateX;
        var translateY = ref$1.translateY;
        var scaleX = ref$1.scaleX;
        var scaleY = ref$1.scaleY;

        self.BBox = {
            x: translateX + x * scaleX,
            y: translateY + y * scaleY,
            width: width * scaleX,
            height: height * scaleY,
        };

        if (transform && transform.rotate) {
            self.BBoxHit = t2DGeometry$4.rotateBBox(this.BBox, transform);
        } else {
            self.BBoxHit = this.BBox;
        }
    };

    function PolyLineNode(attr, style) {
        this.attr = attr || {};
        this.style = style || {};
    }
    PolyLineNode.prototype = new WebglDom();
    PolyLineNode.prototype.constructor = PolyLineNode;

    PolyLineNode.prototype.setShader = function (shader) {
        this.shader = shader;
        if (this.shader) {
            this.shader.addVertex(this.attr.points || [], this.pindex);
            this.shader.addColors(this.style.stroke || defaultColor$1, this.pindex);
        }
    };

    PolyLineNode.prototype.setAttr = function (key, value) {
        this.attr[key] = value;
        if (this.shader && key === "points") {
            this.shader.updateVertex(this.pindex, this.attr.points);
        }
    };

    PolyLineNode.prototype.updateBBox = RPolyupdateBBox$1;

    // PolyLineNode.prototype.getAttr = function (key) {
    // 	return this.attr[key];
    // };

    // PolyLineNode.prototype.setStyle = function (key, value) {
    // 	this.style[key] = value;
    // 	if (this.shader && key === 'stroke') {
    // 		this.shader.updateColor(this.pindex, value);
    // 	}
    // };

    // PolyLineNode.prototype.getStyle = function (key) {
    // 	return this.style[key];
    // };

    function LineNode(attr, style) {
        this.attr = attr || {};
        this.style = style || {};
    }

    LineNode.prototype = new WebglDom();
    LineNode.prototype.constructor = LineNode;

    LineNode.prototype.setShader = function (shader) {
        this.shader = shader;
        var ref = this.attr;
        var x1 = ref.x1; if ( x1 === void 0 ) x1 = 0;
        var y1 = ref.y1; if ( y1 === void 0 ) y1 = 0;
        var x2 = ref.x2; if ( x2 === void 0 ) x2 = x1;
        var y2 = ref.y2; if ( y2 === void 0 ) y2 = y1;

        if (this.shader) {
            this.shader.addVertex(x1, y1, x2, y2, this.pindex);
            this.shader.addColors(this.style.stroke || defaultColor$1, this.pindex);
        }
    };

    LineNode.prototype.setAttr = function (key, value) {
        this.attr[key] = value;
        if (value == null && this.attr[key] != null) {
            delete this.attr[key];
            return;
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
    };

    LineNode.prototype.updateBBox = function RLupdateBBox() {
        var self = this;
        var ref = self.attr;
        var transform = ref.transform;
        var x1 = ref.x1; if ( x1 === void 0 ) x1 = 0;
        var y1 = ref.y1; if ( y1 === void 0 ) y1 = 0;
        var x2 = ref.x2; if ( x2 === void 0 ) x2 = 0;
        var y2 = ref.y2; if ( y2 === void 0 ) y2 = 0;
        var ref$1 = parseTransform$1(transform);
        var translateX = ref$1.translateX;
        var translateY = ref$1.translateY;
        var scaleX = ref$1.scaleX;
        var scaleY = ref$1.scaleY;

        self.BBox = {
            x: translateX + (x1 < x2 ? x1 : x2) * scaleX,
            y: translateY + (y1 < y2 ? y1 : y2) * scaleY,
            width: Math.abs(x2 - x1) * scaleX,
            height: Math.abs(y2 - y1) * scaleY,
        };

        if (transform && transform.rotate) {
            self.BBoxHit = t2DGeometry$4.rotateBBox(this.BBox, transform);
        } else {
            self.BBoxHit = this.BBox;
        }
    };

    // LineNode.prototype.getAttr = function (key) {
    // 	return this.attr[key];
    // };

    // LineNode.prototype.setStyle = function (key, value) {
    // 	this.style[key] = value;
    // 	if (this.shader && key === 'stroke') {
    // 		this.shader.updateColor(this.pindex, value);
    // 	}
    // };

    // LineNode.prototype.getStyle = function (key) {
    // 	return this.style[key];
    // };

    function polygonPointsMapper(value) {
        return earcut_1(
            value.reduce(function (p, c) {
                p[p.length] = c.x;
                p[p.length] = c.y;
                return p;
            }, [])
        ).map(function (d) {
            return value[d];
        });
    }

    function PolygonNode(attr, style) {
        this.attr = attr;
        this.style = style;
        this.positionArray = [];

        if (this.attr["points"]) {
            this.triangulatedPoints = polygonPointsMapper(this.attr["points"]);
        }
    }

    PolygonNode.prototype = new WebglDom();
    PolygonNode.prototype.constructor = PolygonNode;

    PolygonNode.prototype.setShader = function (shader) {
        this.shader = shader;
        if (this.shader) {
            this.shader.addVertex(this.triangulatedPoints || [], this.pindex);
            this.shader.addColors(this.style.fill || defaultColor$1, this.pindex);
        }
    };

    // PolygonNode.prototype.setStyle = function (key, value) {
    // 	this.style[key] = value;
    // 	if (this.shader && key === 'fill') {
    // 		this.shader.updateColors(value || defaultColor);
    // 	}
    // };

    PolygonNode.prototype.setAttr = function (key, value) {
        this.attr[key] = value;
        if (value == null) {
            delete this.attr[key];
            return;
        }
        if (key === "points") {
            this.triangulatedPoints = polygonPointsMapper(value);
            if (this.shader) {
                this.shader.updateVertex(this.triangulatedPoints || [], this.pindex);
            }
        }
    };

    // PolygonNode.prototype.getAttr = function (key) {
    // 	return this.attr[key];
    // };

    // PolygonNode.prototype.getStyle = function (key) {
    // 	return this.style[key];
    // };

    PolygonNode.prototype.updateBBox = RPolyupdateBBox$1;

    function CircleNode(attr, style) {
        this.attr = attr;
        this.style = style;
    }

    CircleNode.prototype = new WebglDom();
    CircleNode.prototype.constructor = CircleNode;

    CircleNode.prototype.setShader = function (shader) {
        this.shader = shader;
        if (this.shader) {
            this.shader.addVertex(this.attr.cx || 0, this.attr.cy || 0, this.pindex);
            this.shader.addColors(this.style.fill || defaultColor$1, this.pindex);
            this.shader.addSize(this.attr.r || 0, this.pindex);
        }
    };

    CircleNode.prototype.setAttr = function (prop, value) {
        this.attr[prop] = value;
        if (value == null) {
            delete this.attr[prop];
            return;
        }
        if (this.shader && (prop === "cx" || prop === "cy")) {
            this.shader.updateVertex(this.pindex, this.attr.cx, this.attr.cy);
        }

        if (this.shader && prop === "r") {
            this.shader.updateSize(this.pindex, this.attr.r || 0);
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
        var ref = this.attr;
        var r = ref.r; if ( r === void 0 ) r = 0;
        var cx = ref.cx; if ( cx === void 0 ) cx = 0;
        var cy = ref.cy; if ( cy === void 0 ) cy = 0;
        var tr = Math.sqrt((co.x - cx) * (co.x - cx) + (co.y - cy) * (co.y - cy));
        return tr <= r;
    };

    CircleNode.prototype.updateBBox = function RCupdateBBox() {
        var self = this;
        var ref = self.attr;
        var transform = ref.transform;
        var r = ref.r; if ( r === void 0 ) r = 0;
        var cx = ref.cx; if ( cx === void 0 ) cx = 0;
        var cy = ref.cy; if ( cy === void 0 ) cy = 0;
        var ref$1 = parseTransform$1(transform);
        var translateX = ref$1.translateX;
        var translateY = ref$1.translateY;
        var scaleX = ref$1.scaleX;
        var scaleY = ref$1.scaleY;

        self.BBox = {
            x: translateX + (cx - r) * scaleX,
            y: translateY + (cy - r) * scaleY,
            width: 2 * r * scaleX,
            height: 2 * r * scaleY,
        };

        if (transform && transform.rotate) {
            self.BBoxHit = t2DGeometry$4.rotateBBox(this.BBox, transform);
        } else {
            self.BBoxHit = this.BBox;
        }
    };

    var webGLImageTextures = {};

    function isPowerOf2(value) {
        return (value & (value - 1)) === 0;
    }

    var onClear = function (ctx, width, height, ratio) {
        ctx.clearRect(0, 0, width * ratio, height * ratio);
    };

    function buildCanvasTextEl(str, style) {
        var layer = document.createElement("canvas");
        var ctx = layer.getContext("2d", { alpha: false });
        style = style || {
            fill: "#fff",
        };
        if (!style.font) {
            style.font = "10px Arial";
        }

        var fontSize = parseFloat(style.font, 10) || 12;
        ctx["font"] = style.font;
        var twid = ctx.measureText(str);
        var width = twid.width;
        var height = fontSize;
        layer.setAttribute("height", height * ratio);
        layer.setAttribute("width", width * ratio);
        layer.style.width = width;
        layer.style.height = height;

        style.font =
            fontSize * ratio +
            (isNaN(parseFloat(style.font, 10))
                ? style.font
                : style.font.substring(fontSize.toString().length));

        for (var st in style) {
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
                for (var st in this.style) {
                    this.ctx[st] = this.style[st];
                }
                this.ctx.fillText(this.str, 0, this.height * 0.75);
            },
        };
    }

    function TextNode(ctx, attr, style, vDomIndex) {
        var self = this;
        this.ctx = ctx;
        this.attr = attr;
        this.style = style;
        this.vDomIndex = vDomIndex;

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
        if (this.shader) {
            this.shader.addVertex(
                this.attr.x || 0,
                this.attr.y || 0,
                this.attr.width || 0,
                this.attr.height || 0,
                this.pindex
            );
            // this.shader.addOpacity(1, this.pindex);
        }
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
            if (this.shader) {
                this.shader.updateVertexX(this.pindex, this.attr.x || 0, this.attr.width || 0);
                this.shader.updateVertexY(this.pindex, this.attr.y || 0, this.attr.height || 0);
            }
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

        if (this.shader && key === "x") {
            this.shader.updateVertexX(this.pindex, this.attr.x || 0, this.attr.width || 0);
        }
        if (this.shader && key === "y") {
            this.shader.updateVertexY(this.pindex, this.attr.y || 0, this.attr.height || 0);
        }
    };

    TextNode.prototype.setStyle = function (key, value) {
        this.style[key] = value;
        if (this.text) {
            this.text.style[key] = value;
            if (key === "font") {
                var fontSize = parseFloat(value, 10) || 12;
                this.text.ctx["font"] = value;
                var twid = this.text.ctx.measureText(this.attr.text);
                var width = twid.width;
                var height = fontSize;
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

    // TextNode.prototype.in = function RIinfun (co) {
    // 	const {
    // 		width = 0,
    // 		height = 0,
    // 		x = 0,
    // 		y = 0
    // 	} = this.attr;
    // 	return co.x >= x && co.x <= x + width && co.y >= y && co.y <= y + height;
    // };

    // function buildCanvasTextEl (str, style) {
    // 	let text = canvas.canvasLayer(null, {}, {});
    // 	text.setPixelRatio(ratio);
    // 	let fontSize = parseInt(style.font, 10) || 12;
    // 	let twid = text.ctx.measureText(str).width;
    // 	let width = twid * fontSize * 0.1;
    // 	let height = fontSize;
    // 	text.setSize(width, height);

    // 	text.createEl({
    // 		el: 'text',
    // 		attr: {
    // 			x: 0,
    // 			y: (height * 0.75),
    // 			text: str
    // 		},
    // 		style: style
    // 	});
    // 	text.execute();

    // 	return text;
    // }

    // function TextNode (ctx, attr, style, vDomIndex) {
    // 	let self = this;
    // 	this.ctx = ctx;
    // 	this.attr = attr;
    // 	this.style = style;
    // 	this.vDomIndex = vDomIndex;

    // 	if (self.attr.text && (typeof self.attr.text === 'string')) {
    // 		this.text = buildCanvasTextEl(self.attr.text, self.style);
    // 		this.attr.width = this.text.width * 1;
    // 		this.attr.height = this.text.height;
    // 	}

    // 	if (this.text) {
    // 		this.textureNode = new TextureObject(ctx, {
    // 			src: this.text
    // 		}, this.vDomIndex);
    // 	}
    // }
    // TextNode.prototype = new WebglDom();
    // TextNode.prototype.constructor = TextNode;

    // TextNode.prototype.setShader = function (shader) {
    // 	this.shader = shader;
    // 	if (this.shader) {
    // 		this.shader.addVertex(this.attr.x || 0, this.attr.y || 0, this.attr.width || 0, this.attr.height || 0, this.pindex);
    // 		// this.shader.addOpacity(1, this.pindex);
    // 	}
    // };

    // TextNode.prototype.setAttr = function (key, value) {
    // 	this.attr[key] = value;

    // 	if (value === undefined || value === null) {
    // 		delete this.attr[key];
    // 		return;
    // 	}

    // 	if (key === 'text' && (typeof value === 'string')) {
    // 		if (this.text) {
    // 			this.text = buildCanvasTextEl(this.attr.text, this.style);
    // 			// this.attr.width = this.text.width;
    // 			// this.attr.height = this.text.height;
    // 		} else {
    // 			this.text = buildCanvasTextEl(value, this.style);
    // 		}
    // 		this.attr.width = this.text.width * 1;
    // 		this.attr.height = this.text.height;
    // 		// this.shader.updateVertexX(this.pindex, this.attr.x || 0, this.attr.width || 0);
    // 		// this.shader.updateVertexY(this.pindex, this.attr.y || 0, this.attr.height || 0);
    // 		if (this.textureNode) {
    // 			this.textureNode.setAttr('src', this.text);
    // 		} else {
    // 			this.textureNode = new TextureObject(this.ctx, {
    // 				src: this.text
    // 			}, this.vDomIndex);
    // 		}
    // 	}

    // 	if (this.shader && (key === 'x')) {
    // 		this.shader.updateVertexX(this.pindex, this.attr.x || 0, this.attr.width || 0);
    // 	}
    // 	if (this.shader && (key === 'y')) {
    // 		this.shader.updateVertexY(this.pindex, this.attr.y || 0, this.attr.height || 0);
    // 	}
    // };

    // TextNode.prototype.setStyle = function (key, value) {
    // 	this.style[key] = value;
    // 	if (this.text) {
    // 		if (key === 'font') {
    // 			let fontSize = parseInt(value, 10) || 12;
    // 			let twid = this.text.ctx.measureText(this.attr.text).width;
    // 			let width = twid * fontSize * 0.07;
    // 			let height = fontSize * 0.5;
    // 			this.attr.width = width;
    // 			this.attr.height = height;
    // 			this.shader.updateVertexX(this.pindex, this.attr.x || 0, this.attr.width || 0);
    // 			this.shader.updateVertexY(this.pindex, this.attr.y || 0, this.attr.height || 0);
    // 		} else {
    // 			this.text.fetchEl('text').setStyle(key, value);
    // 			this.text.execute();
    // 			this.textureNode.setAttr('src', this.text);
    // 		}
    // 	}
    // };

    // TextNode.prototype.getAttr = function (key) {
    // 	return this.attr[key];
    // };

    // TextNode.prototype.getStyle = function (key) {
    // 	return this.style[key];
    // };

    TextNode.prototype.in = function RIinfun(co) {
        var ref = this.attr;
        var width = ref.width; if ( width === void 0 ) width = 0;
        var height = ref.height; if ( height === void 0 ) height = 0;
        var x = ref.x; if ( x === void 0 ) x = 0;
        var y = ref.y; if ( y === void 0 ) y = 0;
        return co.x >= x && co.x <= x + width && co.y >= y && co.y <= y + height;
    };

    TextNode.prototype.updateBBox = function RIupdateBBox() {
        var self = this;
        var ref = self.attr;
        var transform = ref.transform;
        var x = ref.x; if ( x === void 0 ) x = 0;
        var y = ref.y; if ( y === void 0 ) y = 0;
        var width = ref.width; if ( width === void 0 ) width = 0;
        var height = ref.height; if ( height === void 0 ) height = 0;
        var ref$1 = parseTransform$1(transform);
        var translateX = ref$1.translateX;
        var translateY = ref$1.translateY;
        var scaleX = ref$1.scaleX;
        var scaleY = ref$1.scaleY;

        self.BBox = {
            x: (translateX + x) * scaleX,
            y: (translateY + y) * scaleY,
            width: width * scaleX,
            height: height * scaleY,
        };

        if (transform && transform.rotate) {
            self.BBoxHit = t2DGeometry$4.rotateBBox(this.BBox, transform);
        } else {
            self.BBoxHit = this.BBox;
        }
    };

    function ImageNode(ctx, attr, style, vDomIndex) {
        var self = this;
        this.ctx = ctx;
        this.attr = attr;
        this.style = style;
        this.vDomIndex = vDomIndex;

        if (self.attr.src && typeof self.attr.src === "string" && !webGLImageTextures[self.attr.src]) {
            this.textureNode = new TextureObject(
                ctx,
                {
                    src: this.attr.src,
                },
                this.vDomIndex
            );
            webGLImageTextures[self.attr.src] = this.textureNode;
        } else if (typeof self.attr.src === "string" && webGLImageTextures[self.attr.src]) {
            this.textureNode = webGLImageTextures[self.attr.src];
        } else if (self.attr.src && self.attr.src instanceof TextureObject) {
            this.textureNode = self.attr.src;
        }
    }

    ImageNode.prototype = new WebglDom();
    ImageNode.prototype.constructor = ImageNode;

    ImageNode.prototype.setShader = function (shader) {
        this.shader = shader;
        if (this.shader) {
            this.shader.addVertex(
                this.attr.x || 0,
                this.attr.y || 0,
                this.attr.width || 0,
                this.attr.height || 0,
                this.pindex
            );
            // this.shader.addOpacity(1, this.pindex);
        }
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
        if (!this.shader) {
            return;
        }
        if (key === "x" || key === "width") {
            this.shader.updateVertexX(this.pindex, this.attr.x || 0, this.attr.width || 0);
        }
        if (key === "y" || key === "height") {
            this.shader.updateVertexY(this.pindex, this.attr.y || 0, this.attr.height || 0);
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
        var ref = this.attr;
        var width = ref.width; if ( width === void 0 ) width = 0;
        var height = ref.height; if ( height === void 0 ) height = 0;
        var x = ref.x; if ( x === void 0 ) x = 0;
        var y = ref.y; if ( y === void 0 ) y = 0;
        return co.x >= x && co.x <= x + width && co.y >= y && co.y <= y + height;
    };

    ImageNode.prototype.updateBBox = function RIupdateBBox() {
        var self = this;
        var ref = self.attr;
        var transform = ref.transform;
        var x = ref.x; if ( x === void 0 ) x = 0;
        var y = ref.y; if ( y === void 0 ) y = 0;
        var width = ref.width; if ( width === void 0 ) width = 0;
        var height = ref.height; if ( height === void 0 ) height = 0;
        var ref$1 = parseTransform$1(transform);
        var translateX = ref$1.translateX;
        var translateY = ref$1.translateY;
        var scaleX = ref$1.scaleX;
        var scaleY = ref$1.scaleY;

        self.BBox = {
            x: (translateX + x) * scaleX,
            y: (translateY + y) * scaleY,
            width: width * scaleX,
            height: height * scaleY,
        };

        if (transform && transform.rotate) {
            self.BBoxHit = t2DGeometry$4.rotateBBox(this.BBox, transform);
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
        if (this.shader && this.attr.transform) {
            if (this.attr.transform["translate"]) {
                this.shader.translate(this.attr.transform["translate"]);
            }
            if (this.attr.transform["scale"]) {
                this.shader.scale(this.attr.transform["scale"]);
            }
            if (this.attr.transform["rotate"]) {
                this.shader.rotate(this.attr.transform["rotate"]);
            }
        }
    }

    WebglGroupNode.prototype = new WebglDom();
    WebglGroupNode.prototype.constructor = WebglGroupNode;

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
        if (key === "transform" && this.shader) {
            if (this.attr.transform["translate"]) {
                this.shader.translate(this.attr.transform["translate"]);
            }
            if (this.attr.transform["scale"]) {
                this.shader.scale(this.attr.transform["scale"]);
            }
            if (this.attr.transform["rotate"]) {
                this.shader.rotate(this.attr.transform["rotate"]);
            }
        }
    };

    WebglGroupNode.prototype.setShader = function () {};

    // WebglGroupNode.prototype.getAttr = function (key) {
    // 	return this.attr[key];
    // };

    // WebglGroupNode.prototype.getStyle = function (key) {
    // 	return this.style[key];
    // };

    WebglGroupNode.prototype.in = function RGinfun(coOr) {
        var self = this;
        var co = {
            x: coOr.x,
            y: coOr.y,
        };
        var ref = this;
        var BBox = ref.BBox;
        var ref$1 = self.attr;
        var transform = ref$1.transform;
        var ref$2 = parseTransform$1(transform);
        var translateX = ref$2.translateX;
        var translateY = ref$2.translateY;
        var scaleX = ref$2.scaleX;
        var scaleY = ref$2.scaleY;

        return (
            co.x >= (BBox.x - translateX) / scaleX &&
            co.x <= (BBox.x - translateX + BBox.width) / scaleX &&
            co.y >= (BBox.y - translateY) / scaleY &&
            co.y <= (BBox.y - translateY + BBox.height) / scaleY
        );
    };

    WebglGroupNode.prototype.updateBBox = function RGupdateBBox(children) {
        var self = this;
        var minX;
        var maxX;
        var minY;
        var maxY;
        var ref = self.attr;
        var transform = ref.transform;
        var ref$1 = parseTransform$1(transform);
        var translateX = ref$1.translateX;
        var translateY = ref$1.translateY;
        var scaleX = ref$1.scaleX;
        var scaleY = ref$1.scaleY;
        self.BBox = {};

        if (children && children.length > 0) {
            var d;
            var boxX;
            var boxY;

            for (var i = 0; i < children.length; i += 1) {
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
            self.BBoxHit = t2DGeometry$4.rotateBBox(this.BBox, this.attr.transform);
        } else {
            self.BBoxHit = this.BBox;
        }
    };

    var defaultColor$1 = colorMap$1.rgba(0, 0, 0, 255);

    function webGlAttrMapper(ctx, program, attr, attrObj) {
        var valType = attrObj.type;
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

        return {
            bufferType: ctx["ARRAY_BUFFER"],
            buffer: ctx.createBuffer(),
            drawType: ctx["STATIC_DRAW"],
            valueType: ctx[valType],
            size: attrObj.size,
            attributeLocation: ctx.getAttribLocation(program, attr),
            value: attrObj.value,
            attr: attr,
        };
    }

    function webGlIndexMapper(ctx, program, attrObj) {
        var valType = "FLOAT";
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
            bufferType: ctx["ELEMENT_ARRAY_BUFFER"],
            buffer: ctx.createBuffer(),
            drawType: ctx["STATIC_DRAW"],
            valueType: ctx[valType],
            value: attrObj.value,
            count: attrObj.count,
            offset: attrObj.offset,
        };
    }

    function webGlUniformMapper(ctx, program, uniform, uniObj) {
        var type;
        var len = uniObj.size ? uniObj.size : uniObj.value.length;
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
            if (!Number.isInteger(Math.sqrt(uniObj.value.length))) {
                type = "uniformMatrix" + Math.sqrt(uniObj.value.length) + "fv";
            } else {
                console.error("Not Square Matrix");
            }
        }

        return {
            matrix: uniObj.matrix,
            transpose: uniObj.transpose,
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

        for (var uniform in shader.uniforms) {
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

        for (var attr in this.attributes) {
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
        for (var uniform in this.uniforms) {
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
        var d;
        for (var attr in this.attrObjs) {
            d = this.attrObjs[attr];
            this.ctx.bindBuffer(d.bufferType, d.buffer);
            this.ctx.bufferData(d.bufferType, this.attributes[d.attr].value, d.drawType);
            this.ctx.enableVertexAttribArray(d.attributeLocation);
            this.ctx.vertexAttribPointer(d.attributeLocation, d.size, d.valueType, true, 0, 0);
        }
    };

    RenderWebglShader.prototype.applyIndexes = function () {
        var d = this.indexesObj;
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
        // if (this.preDraw) {
        // 	this.preDraw();
        // }
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
        // if (this.postDraw) {
        // 	this.postDraw();
        // }
    };

    RenderWebglShader.prototype.addUniform = function (key, value) {
        this.uniforms[key] = webGlUniformMapper(this.ctx, this.program, key, value);
        queueInstance$5.vDomChanged(this.vDomIndex);
    };

    RenderWebglShader.prototype.addAttribute = function (key, value) {
        this.attributes[key] = value;
        this.attrObjs[key] = webGlAttrMapper(this.ctx, this.program, key, value);
        queueInstance$5.vDomChanged(this.vDomIndex);
    };

    RenderWebglShader.prototype.setAttributeData = function (key, value) {
        this.attributes[key].value = value;
        this.attrObjs[key].value = value;
        queueInstance$5.vDomChanged(this.vDomIndex);
    };
    RenderWebglShader.prototype.applyAttributeData = function (key, value) {
        this.attributes[key].value = value;
        this.attrObjs[key].value = value;
        var d = this.attrObjs[key];
        this.ctx.bindBuffer(d.bufferType, d.buffer);
        this.ctx.bufferData(d.bufferType, this.attributes[d.attr].value, d.drawType);
        this.ctx.enableVertexAttribArray(d.attributeLocation);
        this.ctx.vertexAttribPointer(d.attributeLocation, d.size, d.valueType, true, 0, 0);
    };
    RenderWebglShader.prototype.setUniformData = function (key, value) {
        this.uniforms[key].value = value;
        queueInstance$5.vDomChanged(this.vDomIndex);
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
        queueInstance$5.vDomChanged(this.vDomIndex);
    };

    function ShaderNodePrototype() {}
    ShaderNodePrototype.prototype.translate = function (trans) {
        this.attr.transform["translate"] = trans;
    };
    ShaderNodePrototype.prototype.scale = function (scale) {
        this.attr.transform["scale"] = scale;
    };
    ShaderNodePrototype.prototype.rotate = function (angle) {
        this.attr.transform["rotate"] = angle;
    };

    function RenderWebglPoints(ctx, attr, style, vDomIndex) {
        this.ctx = ctx;
        this.dom = {};
        this.attr = attr || {};
        this.style = style || {};
        this.vDomIndex = vDomIndex;

        if (!this.attr.transform) {
            this.attr.transform = {
                translate: [0.0, 0.0],
                scale: [1.0, 1.0],
            };
        }
        if (!this.attr.transform.scale) {
            this.attr.transform.scale = [1.0, 1.0];
        }
        if (!this.attr.transform.translate) {
            this.attr.transform.translate = [0.0, 0.0];
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

        this.shaderInstance = new RenderWebglShader(
            ctx,
            {
                fragmentShader: shaders("point").fragmentShader,
                vertexShader: shaders("point").vertexShader,
                uniforms: {
                    u_resolution: {
                        value: new Float32Array([1.0, 1.0]),
                    },
                    u_translate: {
                        value: new Float32Array(this.attr.transform.translate),
                    },
                    u_scale: {
                        value: new Float32Array(this.attr.transform.scale),
                    },
                },
                geometry: this.geometry,
            },
            vDomIndex
        );

        this.positionArray = [];
        this.colorArray = [];
        this.pointsSize = [];

        this.vertexUpdate = true;
        this.colorUpdate = true;
        this.sizeUpdate = true;
    }

    RenderWebglPoints.prototype = new ShaderNodePrototype();
    RenderWebglPoints.prototype.constructor = RenderWebglPoints;

    RenderWebglPoints.prototype.clear = function (index) {
        var colorArray = this.colorUpdate ? this.colorArray : this.typedColorArray;
        var ti = index * 4;

        colorArray[ti] = undefined;
        colorArray[ti + 1] = undefined;
        colorArray[ti + 2] = undefined;
        colorArray[ti + 3] = undefined;

        var positionArray = this.vertexUpdate ? this.positionArray : this.typedPositionArray;
        var len = index * 2;
        positionArray[len] = undefined;
        positionArray[len + 1] = undefined;

        var sizeArray = this.sizeUpdate ? this.pointsSize : this.typedSizeArray;
        sizeArray[index] = undefined;

        this.filterPositionFlag = true;
        this.filterColorFlag = true;
        this.filterSizeFlag = true;
    };

    RenderWebglPoints.prototype.updateVertex = function (index, x, y) {
        var positionArray = this.vertexUpdate ? this.positionArray : this.typedPositionArray;
        positionArray[index * 2] = x;
        positionArray[index * 2 + 1] = y;
    };

    RenderWebglPoints.prototype.updateSize = function (index, size) {
        var sizeArray = this.sizeUpdate ? this.pointsSize : this.typedSizeArray;
        sizeArray[index] = size;
    };

    RenderWebglPoints.prototype.updateColor = function (index, fill) {
        var colorArray = this.colorUpdate ? this.colorArray : this.typedColorArray;
        colorArray[index * 4] = fill.r / 255;
        colorArray[index * 4 + 1] = fill.g / 255;
        colorArray[index * 4 + 2] = fill.b / 255;
        colorArray[index * 4 + 3] = fill.a === undefined ? 1 : fill.a / 255;
    };

    RenderWebglPoints.prototype.addVertex = function (x, y, index) {
        this.positionArray =
            this.typedPositionArray && this.typedPositionArray.length > 0
                ? Array.from(this.typedPositionArray)
                : this.positionArray;
        this.positionArray[index * 2] = x;
        this.positionArray[index * 2 + 1] = y;
        this.vertexUpdate = true;
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
        this.colorArray =
            this.typedColorArray && this.typedColorArray.length > 0
                ? Array.from(this.typedColorArray)
                : this.colorArray;
        this.colorArray[index * 4] = fill.r / 255;
        this.colorArray[index * 4 + 1] = fill.g / 255;
        this.colorArray[index * 4 + 2] = fill.b / 255;
        this.colorArray[index * 4 + 3] = fill.a === undefined ? 1 : fill.a / 255;
        this.colorUpdate = true;
    };

    RenderWebglPoints.prototype.execute = function (stack) {
        if (this.renderTarget && this.renderTarget instanceof RenderTarget) {
            this.renderTarget.update();
        }

        if (this.vertexUpdate) {
            if (this.filterPositionFlag) {
                this.positionArray = this.positionArray.filter(function (d) {
                    return !isNaN(d);
                });
                this.filterPositionFlag = false;
            }
            this.typedPositionArray = new Float32Array(this.positionArray);
            this.positionArray = [];
            this.vertexUpdate = false;
        }
        if (this.colorUpdate) {
            if (this.filterColorFlag) {
                this.colorArray = this.colorArray.filter(function (d) {
                    return !isNaN(d);
                });
                this.filterColorFlag = false;
            }
            this.typedColorArray = new Float32Array(this.colorArray);
            this.colorArray = [];
            this.colorUpdate = false;
        }
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
        if (this.filterPositionFlag) {
            this.typedPositionArray = this.typedPositionArray.filter(function (d) {
                return !isNaN(d);
            });
            this.filterPositionFlag = false;
        }
        if (this.filterColorFlag) {
            this.typedColorArray = this.typedColorArray.filter(function (d) {
                return !isNaN(d);
            });
            this.filterColorFlag = false;
        }
        if (this.filterSizeFlag) {
            this.typedSizeArray = this.typedSizeArray.filter(function (d) {
                return !isNaN(d);
            });
            this.filterSizeFlag = false;
        }
        this.shaderInstance.setUniformData(
            "u_resolution",
            new Float32Array([this.ctx.canvas.width / ratio, this.ctx.canvas.height / ratio])
        );
        this.shaderInstance.setUniformData(
            "u_scale",
            new Float32Array([this.attr.transform.scale[0], this.attr.transform.scale[1]])
        );
        this.shaderInstance.setUniformData(
            "u_translate",
            new Float32Array([this.attr.transform.translate[0], this.attr.transform.translate[1]])
        );
        this.shaderInstance.setAttributeData("a_color", this.typedColorArray);
        this.shaderInstance.setAttributeData("a_size", this.typedSizeArray);
        this.shaderInstance.setAttributeData("a_position", this.typedPositionArray);
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
        this.attr = attr || {};
        this.style = style || {};
        this.vDomIndex = vDomIndex;
        this.renderTarget = renderTarget;

        if (!this.attr.transform) {
            this.attr.transform = {
                translate: [0.0, 0.0],
                scale: [1.0, 1.0],
            };
        }

        this.geometry = new MeshGeometry();
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
                uniforms: {
                    u_resolution: {
                        value: new Float32Array([1.0, 1.0]),
                    },
                    u_translate: {
                        value: new Float32Array(this.attr.transform.translate),
                    },
                    u_scale: {
                        value: new Float32Array(this.attr.transform.scale),
                    },
                },
                geometry: this.geometry,
            },
            vDomIndex
        );

        this.vertexUpdate = true;
        this.colorUpdate = true;
    }

    RenderWebglRects.prototype = new ShaderNodePrototype();
    RenderWebglRects.prototype.constructor = RenderWebglRects;

    RenderWebglRects.prototype.clear = function (index) {
        var colorArray = this.colorUpdate ? this.colorArray : this.typedColorArray;
        var ti = index * 24;

        colorArray[ti] = colorArray[ti + 4] = colorArray[ti + 8] = undefined;
        colorArray[ti + 12] = colorArray[ti + 16] = colorArray[ti + 20] = undefined;

        colorArray[ti + 1] = colorArray[ti + 5] = colorArray[ti + 9] = undefined;
        colorArray[ti + 13] = colorArray[ti + 17] = colorArray[ti + 21] = undefined;

        colorArray[ti + 2] = colorArray[ti + 6] = colorArray[ti + 10] = undefined;
        colorArray[ti + 14] = colorArray[ti + 18] = colorArray[ti + 22] = undefined;

        colorArray[ti + 3] = colorArray[ti + 7] = colorArray[ti + 11] = undefined;
        colorArray[ti + 15] = colorArray[ti + 19] = colorArray[ti + 23] = undefined;

        var positionArray = this.vertexUpdate ? this.positionArray : this.typedPositionArray;
        var len = index * 12;
        positionArray[len] = positionArray[len + 4] = positionArray[len + 6] = undefined;
        positionArray[len + 2] = positionArray[len + 8] = positionArray[len + 10] = undefined;
        positionArray[len + 1] = positionArray[len + 3] = positionArray[len + 9] = undefined;
        positionArray[len + 5] = positionArray[len + 7] = positionArray[len + 11] = undefined;

        this.filterPositionFlag = true;
        this.filterColorFlag = true;
    };

    RenderWebglRects.prototype.updateVertexX = function (index, x, width) {
        var positionArray = this.vertexUpdate ? this.positionArray : this.typedPositionArray;
        var len = index * 12;
        var x1 = x + width;
        if (isNaN(positionArray[len])) {
            console.log("overriding Nan");
        }
        positionArray[len] = positionArray[len + 4] = positionArray[len + 6] = x;
        positionArray[len + 2] = positionArray[len + 8] = positionArray[len + 10] = x1;
    };

    RenderWebglRects.prototype.updateVertexY = function (index, y, height) {
        var positionArray = this.vertexUpdate ? this.positionArray : this.typedPositionArray;
        var len = index * 12;
        var y1 = y + height;
        positionArray[len + 1] = positionArray[len + 3] = positionArray[len + 9] = y;
        positionArray[len + 5] = positionArray[len + 7] = positionArray[len + 11] = y1;
    };

    RenderWebglRects.prototype.updateColor = function (index, fill) {
        var colorArray = this.colorUpdate ? this.colorArray : this.typedColorArray;
        var ti = index * 24;
        if (isNaN(colorArray[ti])) {
            console.log("overriding Nan");
        }
        colorArray[ti] = colorArray[ti + 4] = colorArray[ti + 8] = fill.r / 255;
        colorArray[ti + 12] = colorArray[ti + 16] = colorArray[ti + 20] = fill.r / 255;

        colorArray[ti + 1] = colorArray[ti + 5] = colorArray[ti + 9] = fill.g / 255;
        colorArray[ti + 13] = colorArray[ti + 17] = colorArray[ti + 21] = fill.g / 255;

        colorArray[ti + 2] = colorArray[ti + 6] = colorArray[ti + 10] = fill.b / 255;
        colorArray[ti + 14] = colorArray[ti + 18] = colorArray[ti + 22] = fill.b / 255;

        colorArray[ti + 3] = colorArray[ti + 7] = fill.a === undefined ? 1 : fill.a / 255;
        colorArray[ti + 11] = colorArray[ti + 15] = colorArray[ti + 19] = colorArray[ti + 23] =
            fill.a === undefined ? 1 : fill.a / 255;
    };

    RenderWebglRects.prototype.addVertex = function (x, y, width, height, index) {
        this.positionArray =
            this.typedPositionArray && this.typedPositionArray.length > 0
                ? Array.from(this.typedPositionArray)
                : this.positionArray;
        this.typedPositionArray = null;
        var len = index * 12;
        var x1 = x + width;
        var y1 = y + height;

        this.positionArray[len] = this.positionArray[len + 4] = this.positionArray[len + 6] = x;
        this.positionArray[len + 1] = this.positionArray[len + 3] = this.positionArray[len + 9] = y;
        this.positionArray[len + 2] = this.positionArray[len + 8] = this.positionArray[len + 10] = x1;
        this.positionArray[len + 5] = this.positionArray[len + 7] = this.positionArray[len + 11] = y1;
        this.vertexUpdate = true;
    };

    RenderWebglRects.prototype.addColors = function (fill, index) {
        this.colorArray =
            this.typedColorArray && this.typedColorArray.length > 0
                ? Array.from(this.typedColorArray)
                : this.colorArray;
        this.typedColorArray = null;
        var ti = index * 24;
        this.colorArray[ti] = this.colorArray[ti + 4] = this.colorArray[ti + 8] = fill.r / 255;
        this.colorArray[ti + 12] = this.colorArray[ti + 16] = this.colorArray[ti + 20] = fill.r / 255;

        this.colorArray[ti + 1] = this.colorArray[ti + 5] = this.colorArray[ti + 9] = fill.g / 255;
        this.colorArray[ti + 13] = this.colorArray[ti + 17] = this.colorArray[ti + 21] = fill.g / 255;

        this.colorArray[ti + 2] = this.colorArray[ti + 6] = this.colorArray[ti + 10] = fill.b / 255;
        this.colorArray[ti + 14] = this.colorArray[ti + 18] = this.colorArray[ti + 22] = fill.b / 255;

        this.colorArray[ti + 3] = this.colorArray[ti + 7] = fill.a === undefined ? 1 : fill.a / 255;
        this.colorArray[ti + 11] = this.colorArray[ti + 15] = fill.a === undefined ? 1 : fill.a / 255;
        this.colorArray[ti + 19] = this.colorArray[ti + 23] = fill.a === undefined ? 1 : fill.a / 255;

        this.colorUpdate = true;
    };

    RenderWebglRects.prototype.execute = function (stack) {
        if (this.renderTarget && this.renderTarget instanceof RenderTarget) {
            this.renderTarget.update();
        }
        if (this.vertexUpdate) {
            if (this.filterPositionFlag) {
                this.positionArray = this.positionArray.filter(function (d) {
                    return !isNaN(d);
                });
                this.filterPositionFlag = false;
            }
            this.typedPositionArray = new Float32Array(this.positionArray);
            this.positionArray = [];
            this.vertexUpdate = false;
        }
        if (this.colorUpdate) {
            if (this.filterColorFlag) {
                this.colorArray = this.colorArray.filter(function (d) {
                    return !isNaN(d);
                });
                this.filterColorFlag = false;
            }
            this.typedColorArray = new Float32Array(this.colorArray);
            this.colorArray = [];
            this.colorUpdate = false;
        }
        if (this.filterPositionFlag) {
            this.typedPositionArray = this.typedPositionArray.filter(function (d) {
                return !isNaN(d);
            });
            this.filterPositionFlag = false;
        }
        if (this.filterColorFlag) {
            this.typedColorArray = this.typedColorArray.filter(function (d) {
                return !isNaN(d);
            });
            this.filterColorFlag = false;
        }
        this.shaderInstance.setAttributeData("a_color", this.typedColorArray);
        this.shaderInstance.setAttributeData("a_position", this.typedPositionArray);
        this.geometry.setDrawRange(0, this.typedPositionArray.length / 2);
        this.shaderInstance.setUniformData(
            "u_resolution",
            new Float32Array([this.ctx.canvas.width / ratio, this.ctx.canvas.height / ratio])
        );
        this.shaderInstance.setUniformData(
            "u_scale",
            new Float32Array([this.attr.transform.scale[0], this.attr.transform.scale[1]])
        );
        this.shaderInstance.setUniformData(
            "u_translate",
            new Float32Array([this.attr.transform.translate[0], this.attr.transform.translate[1]])
        );
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
        this.vertexUpdate = true;
        this.colorUpdate = true;
        this.renderTarget = renderTarget;

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

        this.geometry.setDrawRange(0, this.positionArray.length / 2);

        this.shaderInstance = new RenderWebglShader(
            ctx,
            {
                fragmentShader: shaders("line").fragmentShader,
                vertexShader: shaders("line").vertexShader,
                uniforms: {
                    u_resolution: {
                        value: new Float32Array([1.0, 1.0]),
                    },
                    u_translate: {
                        value: new Float32Array(this.attr.transform.translate),
                    },
                    u_scale: {
                        value: new Float32Array(this.attr.transform.scale),
                    },
                },
                geometry: this.geometry,
            },
            vDomIndex
        );
    }

    RenderWebglLines.prototype = new ShaderNodePrototype();
    RenderWebglLines.prototype.constructor = RenderWebglLines;

    RenderWebglLines.prototype.clear = function (index) {
        var colorArray = this.colorUpdate ? this.colorArray : this.typedColorArray;
        var ti = index * 8;

        colorArray[ti] = undefined;
        colorArray[ti + 1] = undefined;
        colorArray[ti + 2] = undefined;
        colorArray[ti + 3] = undefined;
        colorArray[ti + 4] = undefined;
        colorArray[ti + 5] = undefined;
        colorArray[ti + 6] = undefined;
        colorArray[ti + 7] = undefined;

        var positionArray = this.vertexUpdate ? this.positionArray : this.typedPositionArray;
        var len = index * 4;
        positionArray[len] = undefined;
        positionArray[len + 1] = undefined;
        positionArray[len + 2] = undefined;
        positionArray[len + 3] = undefined;

        colorArray[ti] = undefined;
        colorArray[ti + 1] = undefined;

        this.filterPositionFlag = true;
        this.filterColorFlag = true;
    };

    RenderWebglLines.prototype.updateVertex = function (index, x1, y1, x2, y2) {
        var positionArray = this.vertexUpdate ? this.positionArray : this.typedPositionArray;
        var len = index * 4;
        positionArray[len] = x1;
        positionArray[len + 1] = y1;
        positionArray[len + 2] = x2;
        positionArray[len + 3] = y2;
    };

    RenderWebglLines.prototype.updateColor = function (i, stroke) {
        var colorArray = this.vertexUpdate ? this.colorArray : this.typedColorArray;
        colorArray[i * 8] = stroke.r / 255;
        colorArray[i * 8 + 1] = stroke.g / 255;
        colorArray[i * 8 + 2] = stroke.b / 255;
        colorArray[i * 8 + 3] = stroke.a === undefined ? 1 : stroke.a / 255;
        colorArray[i * 8 + 4] = stroke.r / 255;
        colorArray[i * 8 + 5] = stroke.g / 255;
        colorArray[i * 8 + 6] = stroke.b / 255;
        colorArray[i * 8 + 7] = stroke.a === undefined ? 1 : stroke.a / 255;
    };

    RenderWebglLines.prototype.addVertex = function (x1, y1, x2, y2, index) {
        this.positionArray =
            this.typedPositionArray && this.typedPositionArray.length > 0
                ? Array.from(this.typedPositionArray)
                : this.positionArray;
        this.positionArray[index * 4] = x1;
        this.positionArray[index * 4 + 1] = y1;
        this.positionArray[index * 4 + 2] = x2;
        this.positionArray[index * 4 + 3] = y2;
        this.vertexUpdate = true;
    };

    RenderWebglLines.prototype.addColors = function (stroke, index) {
        this.colorArray =
            this.typedColorArray && this.typedColorArray.length > 0
                ? Array.from(this.typedColorArray)
                : this.colorArray;
        this.colorArray[index * 8] = stroke.r / 255;
        this.colorArray[index * 8 + 1] = stroke.g / 255;
        this.colorArray[index * 8 + 2] = stroke.b / 255;
        this.colorArray[index * 8 + 3] = stroke.a === undefined ? 1 : stroke.a / 255;
        this.colorArray[index * 8 + 4] = stroke.r / 255;
        this.colorArray[index * 8 + 5] = stroke.g / 255;
        this.colorArray[index * 8 + 6] = stroke.b / 255;
        this.colorArray[index * 8 + 7] = stroke.a === undefined ? 1 : stroke.a / 255;
        this.colorUpdate = true;
    };

    RenderWebglLines.prototype.execute = function (stack) {
        if (this.renderTarget && this.renderTarget instanceof RenderTarget) {
            this.renderTarget.update();
        }
        if (this.vertexUpdate) {
            if (this.filterPositionFlag) {
                this.positionArray = this.positionArray.filter(function (d) {
                    return !isNaN(d);
                });
                this.filterPositionFlag = false;
            }
            this.typedPositionArray = new Float32Array(this.positionArray);
            this.positionArray = [];
            this.vertexUpdate = false;
        }
        if (this.colorUpdate) {
            if (this.filterColorFlag) {
                this.colorArray = this.colorArray.filter(function (d) {
                    return !isNaN(d);
                });
                this.filterColorFlag = false;
            }
            this.typedColorArray = new Float32Array(this.colorArray);
            this.colorArray = [];
            this.colorUpdate = false;
        }
        if (this.filterPositionFlag) {
            this.typedPositionArray = this.typedPositionArray.filter(function (d) {
                return !isNaN(d);
            });
            this.filterPositionFlag = false;
        }
        if (this.filterColorFlag) {
            this.typedColorArray = this.typedColorArray.filter(function (d) {
                return !isNaN(d);
            });
            this.filterColorFlag = false;
        }

        this.shaderInstance.setAttributeData("a_color", this.typedColorArray);
        this.shaderInstance.setAttributeData("a_position", this.typedPositionArray);
        this.geometry.setDrawRange(0, this.typedPositionArray.length / 2);
        this.shaderInstance.setUniformData(
            "u_resolution",
            new Float32Array([this.ctx.canvas.width / ratio, this.ctx.canvas.height / ratio])
        );
        this.shaderInstance.setUniformData(
            "u_scale",
            new Float32Array([this.attr.transform.scale[0], this.attr.transform.scale[1]])
        );
        this.shaderInstance.setUniformData(
            "u_translate",
            new Float32Array([this.attr.transform.translate[0], this.attr.transform.translate[1]])
        );
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

        if (!this.attr.transform) {
            this.attr.transform = {
                translate: [0.0, 0.0],
                scale: [1.0, 1.0],
            };
        }

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
                    u_resolution: {
                        value: new Float32Array([1.0, 1.0]),
                    },
                    u_translate: {
                        value: new Float32Array(this.attr.transform.translate),
                    },
                    u_scale: {
                        value: new Float32Array(this.attr.transform.scale),
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

    RenderWebglPolyLines.prototype.clear = function (index) {
        this.positionArray[index] = undefined;
        this.colorArray[index] = undefined;
        this.filterColorFlag = true;
        this.filterPositionFlag = true;
    };

    RenderWebglPolyLines.prototype.updateVertex = function (index, points) {
        var subPoints = [];
        for (var j = 0, jlen = points.length; j < jlen; j++) {
            subPoints[j * 2] = points[j].x;
            subPoints[j * 2 + 1] = points[j].y;
        }
        this.positionArray[index] = new Float32Array(subPoints);
    };

    RenderWebglPolyLines.prototype.updateColor = function (index, fill) {
        this.colorArray[index] = new Float32Array([
            fill.r / 255,
            fill.g / 255,
            fill.b / 255,
            fill.a === undefined ? 1 : fill.a / 255 ]);
    };

    RenderWebglPolyLines.prototype.addVertex = function (points, index) {
        var positionArray = this.positionArray;
        var subPoints = [];

        for (var j = 0, jlen = points.length; j < jlen; j++) {
            subPoints[j * 2] = points[j].x;
            subPoints[j * 2 + 1] = points[j].y;
        }

        positionArray[index] = new Float32Array(subPoints);
        this.vertexUpdate = true;
    };

    RenderWebglPolyLines.prototype.addColors = function (fill, index) {
        this.colorArray[index] = new Float32Array([
            fill.r / 255,
            fill.g / 255,
            fill.b / 255,
            fill.a === undefined ? 1 : fill.a / 255 ]);
        this.colorUpdate = true;
    };

    RenderWebglPolyLines.prototype.execute = function (stack) {
        if (this.renderTarget && this.renderTarget instanceof RenderTarget) {
            this.renderTarget.update();
        }

        if (!this.attr.transform.scale) {
            this.attr.transform.scale = [1.0, 1.0];
        }

        if (!this.attr.transform.translate) {
            this.attr.transform.translate = [0.0, 0.0];
        }

        if (this.filterPositionFlag) {
            this.positionArray = this.positionArray.filter(function (d) {
                return d;
            });
            this.filterPositionFlag = false;
        }
        if (this.filterColorFlag) {
            this.colorArray = this.colorArray.filter(function (d) {
                return d;
            });
            this.filterColorFlag = false;
        }

        this.shaderInstance.setUniformData(
            "u_resolution",
            new Float32Array([this.ctx.canvas.width / ratio, this.ctx.canvas.height / ratio])
        );
        this.shaderInstance.setUniformData(
            "u_scale",
            new Float32Array([this.attr.transform.scale[0], this.attr.transform.scale[1]])
        );
        this.shaderInstance.setUniformData(
            "u_translate",
            new Float32Array([this.attr.transform.translate[0], this.attr.transform.translate[1]])
        );

        for (var i = 0, len = this.positionArray.length; i < len; i++) {
            // this.shaderInstance.setAttributeData('a_color', this.colorArray[i]);
            this.shaderInstance.setAttributeData("a_position", this.positionArray[i]);
            this.shaderInstance.setUniformData("u_color", this.colorArray[i]);
            this.geometry.setDrawRange(0, this.positionArray[i].length / 2);
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

        if (!this.attr.transform) {
            this.attr.transform = {
                translate: [0.0, 0.0],
                scale: [1.0, 1.0],
            };
        }

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
                    u_resolution: {
                        value: new Float32Array([1.0, 1.0]),
                    },
                    u_translate: {
                        value: new Float32Array(this.attr.transform.translate),
                    },
                    u_scale: {
                        value: new Float32Array(this.attr.transform.scale),
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

    RenderWebglPolygons.prototype.clear = function (index) {
        this.positionArray[index] = undefined;
        this.colorArray[index] = undefined;
        this.filterColorFlag = true;
        this.filterPositionFlag = true;
    };

    RenderWebglPolygons.prototype.updateVertex = function (index, points) {
        var subPoints = [];
        for (var j = 0, jlen = points.length; j < jlen; j++) {
            subPoints[j * 2] = points[j].x;
            subPoints[j * 2 + 1] = points[j].y;
        }
        this.positionArray[index] = new Float32Array(subPoints);
    };

    RenderWebglPolygons.prototype.updateColor = function (index, fill) {
        this.colorArray[index] = new Float32Array([
            fill.r / 255,
            fill.g / 255,
            fill.b / 255,
            fill.a === undefined ? 1 : fill.a / 255 ]);
    };

    RenderWebglPolygons.prototype.addVertex = function (points, index) {
        var positionArray = this.positionArray;
        var subPoints = [];

        for (var j = 0, jlen = points.length; j < jlen; j++) {
            subPoints[j * 2] = points[j].x;
            subPoints[j * 2 + 1] = points[j].y;
        }

        positionArray[index] = new Float32Array(subPoints);
        this.vertexUpdate = true;
    };

    RenderWebglPolygons.prototype.addColors = function (fill, index) {
        this.colorArray[index] = new Float32Array([
            fill.r / 255,
            fill.g / 255,
            fill.b / 255,
            fill.a === undefined ? 1 : fill.a / 255 ]);
        this.colorUpdate = true;
    };

    RenderWebglPolygons.prototype.execute = function (stack) {
        if (this.renderTarget && this.renderTarget instanceof RenderTarget) {
            this.renderTarget.update();
        }

        if (!this.attr.transform.scale) {
            this.attr.transform.scale = [1.0, 1.0];
        }

        if (!this.attr.transform.translate) {
            this.attr.transform.translate = [0.0, 0.0];
        }

        if (this.filterPositionFlag) {
            this.positionArray = this.positionArray.filter(function (d) {
                return d;
            });
            this.filterPositionFlag = false;
        }
        if (this.filterColorFlag) {
            this.colorArray = this.colorArray.filter(function (d) {
                return d;
            });
            this.filterColorFlag = false;
        }

        this.shaderInstance.useProgram();
        this.shaderInstance.applyUniformData(
            "u_resolution",
            new Float32Array([this.ctx.canvas.width / ratio, this.ctx.canvas.height / ratio])
        );
        this.shaderInstance.applyUniformData(
            "u_scale",
            new Float32Array([this.attr.transform.scale[0], this.attr.transform.scale[1]])
        );
        this.shaderInstance.applyUniformData(
            "u_translate",
            new Float32Array([this.attr.transform.translate[0], this.attr.transform.translate[1]])
        );

        for (var i = 0, len = this.positionArray.length; i < len; i++) {
            this.shaderInstance.setUniformData("u_color", this.colorArray[i]);
            this.shaderInstance.setAttributeData("a_position", this.positionArray[i]);
            this.geometry.setDrawRange(0, this.positionArray[i].length / 2);
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
        this.pointsSize = [];
        this.renderTarget = renderTarget;

        if (!this.attr.transform) {
            this.attr.transform = {
                translate: [0.0, 0.0],
                scale: [1.0, 1.0],
            };
        }

        this.geometry = new PointsGeometry();
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
                    u_resolution: {
                        value: new Float32Array([1.0, 1.0]),
                    },
                    u_translate: {
                        value: new Float32Array(this.attr.transform.translate),
                    },
                    u_scale: {
                        value: new Float32Array(this.attr.transform.scale),
                    },
                },
                geometry: this.geometry,
            },
            vDomIndex
        );

        this.vertexUpdate = true;
        this.colorUpdate = true;
        this.sizeUpdate = true;
    }

    RenderWebglCircles.prototype = new ShaderNodePrototype();
    RenderWebglCircles.prototype.constructor = RenderWebglCircles;

    RenderWebglCircles.prototype.clear = function (index) {
        var colorArray = this.colorUpdate ? this.colorArray : this.typedColorArray;
        var ti = index * 4;

        colorArray[ti] = undefined;
        colorArray[ti + 1] = undefined;
        colorArray[ti + 2] = undefined;
        colorArray[ti + 3] = undefined;

        var positionArray = this.vertexUpdate ? this.positionArray : this.typedPositionArray;
        var len = index * 2;
        positionArray[len] = undefined;
        positionArray[len + 1] = undefined;

        var sizeArray = this.sizeUpdate ? this.pointsSize : this.typedSizeArray;
        sizeArray[index] = undefined;

        this.filterPositionFlag = true;
        this.filterColorFlag = true;
        this.filterSizeFlag = true;
    };

    RenderWebglCircles.prototype.updateVertex = function (index, x, y) {
        var positionArray = this.vertexUpdate ? this.positionArray : this.typedPositionArray;
        positionArray[index * 2] = x;
        positionArray[index * 2 + 1] = y;
    };

    RenderWebglCircles.prototype.updateColor = function (index, fill) {
        var colorArray = this.colorUpdate ? this.colorArray : this.typedColorArray;
        colorArray[index * 4] = fill.r / 255;
        colorArray[index * 4 + 1] = fill.g / 255;
        colorArray[index * 4 + 2] = fill.b / 255;
        colorArray[index * 4 + 3] = fill.a === undefined ? 1 : fill.a / 255;
    };

    RenderWebglCircles.prototype.updateSize = function (index, value) {
        var sizeArray = this.sizeUpdate ? this.pointsSize : this.typedSizeArray;
        sizeArray[index] = value;
    };

    RenderWebglCircles.prototype.addVertex = function (x, y, index) {
        this.positionArray =
            this.typedPositionArray && this.typedPositionArray.length > 0
                ? Array.from(this.typedPositionArray)
                : this.positionArray;
        this.positionArray[index * 2] = x;
        this.positionArray[index * 2 + 1] = y;
        this.vertexUpdate = true;
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
        this.colorArray =
            this.typedColorArray && this.typedColorArray.length > 0
                ? Array.from(this.typedColorArray)
                : this.colorArray;
        this.colorArray[index * 4] = fill.r / 255;
        this.colorArray[index * 4 + 1] = fill.g / 255;
        this.colorArray[index * 4 + 2] = fill.b / 255;
        this.colorArray[index * 4 + 3] = fill.a === undefined ? 1 : fill.a / 255;
        this.colorUpdate = true;
    };

    RenderWebglCircles.prototype.execute = function (stack) {
        if (this.renderTarget && this.renderTarget instanceof RenderTarget) {
            this.renderTarget.update();
        }

        if (!this.attr.transform.scale) {
            this.attr.transform.scale = [1.0, 1.0];
        }

        if (!this.attr.transform.translate) {
            this.attr.transform.translate = [0.0, 0.0];
        }

        if (this.vertexUpdate) {
            if (this.filterPositionFlag) {
                this.positionArray = this.positionArray.filter(function (d) {
                    return !isNaN(d);
                });
                this.filterPositionFlag = false;
            }
            this.typedPositionArray = new Float32Array(this.positionArray);
            this.positionArray = [];
            this.vertexUpdate = false;
        }
        if (this.colorUpdate) {
            if (this.filterColorFlag) {
                this.colorArray = this.colorArray.filter(function (d) {
                    return !isNaN(d);
                });
                this.filterColorFlag = false;
            }
            this.typedColorArray = new Float32Array(this.colorArray);
            this.colorArray = [];
            this.colorUpdate = false;
        }
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
        if (this.filterPositionFlag) {
            this.typedPositionArray = this.typedPositionArray.filter(function (d) {
                return !isNaN(d);
            });
            this.filterPositionFlag = false;
        }
        if (this.filterColorFlag) {
            this.typedColorArray = this.typedColorArray.filter(function (d) {
                return !isNaN(d);
            });
            this.filterColorFlag = false;
        }
        if (this.filterSizeFlag) {
            this.typedSizeArray = this.typedSizeArray.filter(function (d) {
                return !isNaN(d);
            });
            this.filterSizeFlag = false;
        }

        this.shaderInstance.setUniformData(
            "u_resolution",
            new Float32Array([this.ctx.canvas.width / ratio, this.ctx.canvas.height / ratio])
        );
        this.shaderInstance.setUniformData(
            "u_scale",
            new Float32Array([this.attr.transform.scale[0], this.attr.transform.scale[1]])
        );
        this.shaderInstance.setUniformData(
            "u_translate",
            new Float32Array([this.attr.transform.translate[0], this.attr.transform.translate[1]])
        );
        this.shaderInstance.setAttributeData("a_radius", this.typedSizeArray);
        this.shaderInstance.setAttributeData("a_color", this.typedColorArray);
        this.shaderInstance.setAttributeData("a_position", this.typedPositionArray);

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

        if (!this.attr.transform) {
            this.attr.transform = {
                translate: [0.0, 0.0],
                scale: [1.0, 1.0],
            };
        }

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
                    u_resolution: {
                        value: new Float32Array([1.0, 1.0]),
                    },
                    u_translate: {
                        value: new Float32Array(this.attr.transform.translate),
                    },
                    u_scale: {
                        value: new Float32Array(this.attr.transform.scale),
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

    RenderWebglImages.prototype.clear = function (index) {
        this.positionArray[index] = undefined;
        this.filterPositionFlag = true;
    };

    RenderWebglImages.prototype.updateVertexX = function (index, x, width) {
        var positionArray = this.positionArray[index];
        var x1 = x + width;
        positionArray[0] = positionArray[4] = positionArray[6] = x;
        positionArray[2] = positionArray[8] = positionArray[10] = x1;
    };

    RenderWebglImages.prototype.updateVertexY = function (index, y, height) {
        var positionArray = this.positionArray[index];
        var y1 = y + height;
        positionArray[1] = positionArray[3] = positionArray[9] = y;
        positionArray[5] = positionArray[7] = positionArray[11] = y1;
    };

    RenderWebglImages.prototype.addVertex = function (x, y, width, height, index) {
        var positionArray = new Float32Array(12);
        var x1 = x + width;
        var y1 = y + height;

        positionArray[0] = positionArray[4] = positionArray[6] = x;
        positionArray[1] = positionArray[3] = positionArray[9] = y;
        positionArray[2] = positionArray[8] = positionArray[10] = x1;
        positionArray[5] = positionArray[7] = positionArray[11] = y1;

        this.positionArray[index] = positionArray;

        this.vertexUpdate = true;
    };

    // RenderWebglImages.prototype.addOpacity = function (value, index) {
    // 	this.opacityArray[index] = value;
    // 	this.opacityUpdate = true;
    // };

    // RenderWebglImages.prototype.updateOpacity = function (index, value) {
    // 	let opacityArray = this.opacityUpdate ? this.opacityArray : this.typedOpacityArray;
    // 	opacityArray[index] = value;
    // };

    RenderWebglImages.prototype.execute = function (stack) {
        if (this.renderTarget && this.renderTarget instanceof RenderTarget) {
            this.renderTarget.update();
        }

        this.shaderInstance.useProgram();

        if (!this.attr.transform.scale) {
            this.attr.transform.scale = [1.0, 1.0];
        }

        if (!this.attr.transform.translate) {
            this.attr.transform.translate = [0.0, 0.0];
        }

        this.shaderInstance.applyUniformData(
            "u_resolution",
            new Float32Array([this.ctx.canvas.width / ratio, this.ctx.canvas.height / ratio])
        );
        this.shaderInstance.applyUniformData("u_scale", this.attr.transform.scale);
        this.shaderInstance.applyUniformData("u_translate", this.attr.transform.translate);
        this.shaderInstance.applyAttributeData("a_texCoord", this.textCoor);

        if (this.filterPositionFlag) {
            this.positionArray = this.positionArray.filter(function (d) {
                return d;
            });
            this.filterPositionFlag = false;
        }

        for (var i = 0, len = stack.length; i < len; i++) {
            var node = stack[i];
            if (!node.dom.textureNode || !node.dom.textureNode.updated) {
                continue;
            }
            if (node.style.display === "none") {
                continue;
            }
            // if (typeof node.attr.src === 'string') {

            // 	node.textureNode.loadTexture();
            // 	this.shaderInstance.applyUniformData('u_image', node.textureNode);
            // } else if (node.attr.src instanceof TextureObject) {
            // 	node.attr.src.loadTexture();
            // 	this.shaderInstance.applyUniformData('u_image', node.attr.src);
            // }
            var op =
                node.style.opacity !== undefined
                    ? node.style.opacity
                    : this.style.opacity !== undefined
                    ? this.style.opacity
                    : 1.0;

            node.dom.textureNode.loadTexture();
            this.shaderInstance.applyUniformData("u_image", node.dom.textureNode);
            this.shaderInstance.applyAttributeData("a_position", this.positionArray[i]);
            this.shaderInstance.applyUniformData("u_opacity", op);
            this.shaderInstance.draw();
        }

        if (this.renderTarget && this.renderTarget instanceof RenderTarget) {
            this.renderTarget.clear();
        }
    };

    function getTypeShader(ctx, attr, style, type, renderTarget, vDomIndex) {
        var e;

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
        this.bbox = config["bbox"] !== undefined ? config["bbox"] : true;
        this.events = {};

        switch (config.el) {
            case "point":
                this.dom = new PointNode(this.attr, this.style);
                break;

            case "rect":
                this.dom = new RectNode(this.attr, this.style);
                break;

            case "line":
                this.dom = new LineNode(this.attr, this.style);
                break;

            case "polyline":
                this.dom = new PolyLineNode(this.attr, this.style);
                break;

            case "polygon":
                this.dom = new PolygonNode(this.attr, this.style);
                break;

            case "circle":
                this.dom = new CircleNode(this.attr, this.style);
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

    WebglNodeExe.prototype.setAttr = function WsetAttr(attr, value) {
        if (arguments.length === 2) {
            if (value == null && this.attr[attr] != null) {
                delete this.attr[attr];
            } else {
                this.attr[attr] = value;
            }
            this.dom.setAttr(attr, value);
        } else if (arguments.length === 1 && typeof attr === "object") {
            for (var key in attr) {
                if (attr[key] == null && this.attr[attr] != null) {
                    delete this.attr[key];
                } else {
                    this.attr[key] = attr[key];
                }
                this.dom.setAttr(key, attr[key]);
            }
        }
        this.BBoxUpdate = true;
        queueInstance$5.vDomChanged(this.vDomIndex);
        return this;
    };

    WebglNodeExe.prototype.setStyle = function WsetStyle(attr, value) {
        if (arguments.length === 2) {
            if (value == null && this.style[attr] != null) {
                delete this.style[attr];
            } else {
                if (attr === "fill" || attr === "stroke") {
                    value = colorMap$1.colorToRGB(value);
                }
                this.style[attr] = value;
            }

            this.dom.setStyle(attr, value);
        } else if (arguments.length === 1 && typeof attr === "object") {
            for (var key in attr) {
                value = attr[key];
                if (value == null && this.style[key] != null) {
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

        queueInstance$5.vDomChanged(this.vDomIndex);
        return this;
    };

    WebglNodeExe.prototype.setReIndex = function () {
        this.reindex = true;
    };

    WebglNodeExe.prototype.updateBBox = function CupdateBBox() {
        var status;

        if (this.bbox) {
            for (var i = 0, len = this.children.length; i < len; i += 1) {
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
        var self = this;
        // this.dom.on(eventType, hndlr);
        if (!this.events) {
            this.events = {};
        }

        if (hndlr == null && this.events[eventType] != null) {
            delete this.events[eventType];
        } else if (hndlr) {
            if (typeof hndlr === "function") {
                var hnd = hndlr.bind(self);
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

    WebglNodeExe.prototype.execute = function Cexecute() {
        if (this.style.display === "none") {
            return;
        }
        if (!this.dom.shader && this.dom instanceof WebglGroupNode) {
            for (var i = 0, len = this.children.length; i < len; i += 1) {
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
        var self = this;
        var node;
        if (self.dom instanceof WebglGroupNode) {
            for (var i = 0; i < childrens.length; i += 1) {
                node = childrens[i];
                node.dom.parent = self;
                self.children[self.children.length] = node;
                node.dom.pindex = self.children.length - 1;
                if (!(node instanceof RenderWebglShader)) {
                    node.dom.setShader(this.dom.shader);
                }
            }
        } else {
            console.log("Error");
        }

        this.BBoxUpdate = true;
        queueInstance$5.vDomChanged(this.vDomIndex);
        return self;
    };

    WebglNodeExe.prototype.createEls = function CcreateEls(data, config) {
        var e = new WebglCollection(
            {
                type: "WEBGL",
                ctx: this.dom.ctx,
            },
            data,
            config,
            this.vDomIndex
        );
        this.child(e.stack);
        queueInstance$5.vDomChanged(this.vDomIndex);
        return e;
    };

    WebglNodeExe.prototype.createEl = function WcreateEl(config) {
        var e = new WebglNodeExe(this.ctx, config, domId$2(), this.vDomIndex);
        this.child([e]);
        queueInstance$5.vDomChanged(this.vDomIndex);
        return e;
    };

    WebglNodeExe.prototype.createShaderEl = function createShader(shaderObject) {
        var e = new RenderWebglShader(this.ctx, shaderObject, this.vDomIndex);
        this.child([e]);
        queueInstance$5.vDomChanged(this.vDomIndex);
        return e;
    };

    WebglNodeExe.prototype.remove = function Wremove() {
        var ref = this.dom.parent;
        var children = ref.children;
        var index = children.indexOf(this);

        if (index !== -1) {
            if (this.dom.parent.dom.shader) {
                this.dom.parent.dom.shader.clear(this.dom.pindex);
                children[this.dom.pindex] = undefined;
                this.dom.parent.setReIndex();
            } else {
                children.splice(index, 1);
            }
        }

        this.BBoxUpdate = true;
        queueInstance$5.vDomChanged(this.vDomIndex);
    };

    WebglNodeExe.prototype.removeChild = function WremoveChild(obj) {
        var index = -1;
        this.children.forEach(function (d, i) {
            if (d === obj) {
                index = i;
            }
        });

        if (index !== -1) {
            var removedNode = this.children.splice(index, 1)[0];
            this.dom.removeChild(removedNode.dom);
        }
        this.BBoxUpdate = true;
        queueInstance$5.vDomChanged(this.vDomIndex);
    };

    function webglLayer(container, contextConfig, layerSettings) {
        if ( contextConfig === void 0 ) contextConfig = {};
        if ( layerSettings === void 0 ) layerSettings = {};

        var res = container ? document.querySelector(container) : null;
        var height = res ? res.clientHeight : 0;
        var width = res ? res.clientWidth : 0;
        var clearColor = colorMap$1.rgba(0, 0, 0, 0);
        var enableEvents = layerSettings.enableEvents; if ( enableEvents === void 0 ) enableEvents = false;
        var autoUpdate = layerSettings.autoUpdate; if ( autoUpdate === void 0 ) autoUpdate = true;
        var enableResize = layerSettings.enableResize; if ( enableResize === void 0 ) enableResize = false;

        contextConfig = contextConfig || {
            premultipliedAlpha: false,
            depth: false,
            antialias: false,
            alpha: true,
        };
        var layer = document.createElement("canvas");
        var ctx = layer.getContext("webgl", contextConfig);

        var actualPixel = getPixlRatio$1(ctx);

        ratio = actualPixel >= 2 ? 2 : Math.floor(actualPixel);
        // ctx.enable(ctx.BLEND);
        // ctx.blendFunc(ctx.ONE, ctx.ONE_MINUS_SRC_ALPHA);
        // ctx.clearColor(clearColor.r, clearColor.g, clearColor.b, clearColor.a);
        layer.setAttribute("height", height * ratio);
        layer.setAttribute("width", width * ratio);
        layer.style.height = height + "px";
        layer.style.width = width + "px";
        layer.style.position = "absolute";

        var vDomInstance;
        var vDomIndex = 999999;
        var resizeCall;
        var onChangeExe;

        if (res) {
            res.appendChild(layer);
            vDomInstance = new VDom();
            if (autoUpdate) {
                vDomIndex = queueInstance$5.addVdom(vDomInstance);
            }
        }

        var root = new WebglNodeExe(
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
            domId$2(),
            vDomIndex
        );

        if (vDomInstance) {
            vDomInstance.rootNode(root);
        }
        var execute = root.execute.bind(root);
        root.container = res;
        root.domEl = layer;
        root.height = height;
        root.width = width;
        root.type = "WEBGL";
        root.pixelRatio = ratio;

        var onClear = function (ctx) {
            ctx.viewport(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.clear(ctx.COLOR_BUFFER_BIT | ctx.DEPTH_BUFFER_BIT);
        };

        root.execute = function () {
            onClear(this.ctx);
            this.updateBBox();
            execute();
        };

        root.update = function () {
            this.execute();
        };

        root.destroy = function () {
            var res = document.querySelector(container);
            if (res && res.contains(layer)) {
                res.removeChild(layer);
            }
            queueInstance$5.removeVdom(vDomIndex);
        };

        root.getPixels = function (x, y, width_, height_) {
            var pixels = new Uint8Array(width_ * height_ * 4);
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

        var resize = function () {
            if (!document.querySelector(container)) {
                window.removeEventListener("resize", resize);
                return;
            }
            height =  res.clientHeight;
            width =  res.clientWidth;
            layer.setAttribute("height", height * ratio);
            layer.setAttribute("width", width * ratio);
            root.width = width;
            root.height = height;

            onClear(root.ctx);

            if (resizeCall) {
                resizeCall();
            }

            root.execute();

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

        root.setSize = function (width_, height_) {
            this.domEl.setAttribute("height", height_ * ratio);
            this.domEl.setAttribute("width", width_ * ratio);
            this.domEl.style.height = height_ + "px";
            this.domEl.style.width = width_ + "px";
            this.width = width_;
            this.height = height_;
            height = height_;
            width = width_;
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

        root.TextureObject = function (config) {
            return new TextureObject(this.ctx, config, this.vDomIndex);
        };

        root.RenderTarget = function (config) {
            return new RenderTarget(this.ctx, config, this.vDomIndex);
        };

        if (enableEvents) {
            var eventsInstance = new Events(root);
            layer.addEventListener("mousemove", function (e) {
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
            layer.addEventListener("mousedown", function (e) {
                // e.preventDefault();
                eventsInstance.mousedownCheck(e);
            });
            layer.addEventListener("mouseup", function (e) {
                // e.preventDefault();
                eventsInstance.mouseupCheck(e);
            });
            layer.addEventListener("mouseleave", function (e) {
                // e.preventDefault();
                eventsInstance.mouseleaveCheck(e);
            });
            layer.addEventListener("contextmenu", function (e) {
                // e.preventDefault();
                eventsInstance.contextmenuCheck(e);
            });
            layer.addEventListener("touchstart", function (e) {
                // e.preventDefault();
                eventsInstance.touchstartCheck(e);
            });
            layer.addEventListener("touchend", function (e) {
                // e.preventDefault();
                eventsInstance.touchendCheck(e);
            });
            layer.addEventListener("touchmove", function (e) {
                e.preventDefault();
                eventsInstance.touchmoveCheck(e);
            });
            layer.addEventListener("touchcancel", function (e) {
                // e.preventDefault();
                eventsInstance.touchcancelCheck(e);
            });
            layer.addEventListener("wheel", function (e) {
                // e.preventDefault();
                eventsInstance.wheelEventCheck(e);
            });
            layer.addEventListener("pointerdown", function (e) {
                // console.log('pointerdown');
                eventsInstance.addPointer(e);
                eventsInstance.pointerdownCheck(e);
                // e.preventDefault();
            });
            layer.addEventListener("pointerup", function (e) {
                // console.log('pointerup');
                eventsInstance.removePointer(e);
                eventsInstance.pointerupCheck(e);
                // e.preventDefault();
            });
            layer.addEventListener("pointermove", function (e) {
                e.preventDefault();
                eventsInstance.pointermoveCheck(e);
            });
        }

        queueInstance$5.execute();

        if (enableResize) {
            window.addEventListener("resize", resize);
        }

        return root;
    }

    function imageInstance$1(self) {
        var imageIns = new Image();
        imageIns.crossOrigin = "anonymous";
        imageIns.onload = function onload() {
            self.update();
            self.updated = true;
            queueInstance$5.vDomChanged(self.vDomIndex);
        };

        imageIns.onerror = function onerror(onerrorExe) {
        };

        return imageIns;
    }

    function createEmptyArrayBuffer(width, height) {
        return new Uint8Array(new ArrayBuffer(width * height * 4));
    }

    function TextureObject(ctx, config, vDomIndex) {
        var self = this;
        var maxTextureSize = ctx.getParameter(ctx.MAX_TEXTURE_SIZE);
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
            self.image = imageInstance$1(self);
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
        queueInstance$5.vDomChanged(self.vDomIndex);
    }
    TextureObject.prototype.setAttr = function (attr, value) {
        if (arguments.length === 1) {
            for (var key in attr) {
                this[key] = attr[key];
                if (key === "src") {
                    if (typeof value === "string") {
                        if (!this.image || !(this.image instanceof Image)) {
                            this.image = imageInstance$1(this);
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
                if (attr["height"] || attr["width"]) {
                    self.image = createEmptyArrayBuffer(this.width, this.height);
                }
            }
        } else {
            this[attr] = value;
            console.warning("Instead of key, value, pass Object of key,value for optimal rendering");
            if (attr === "src") {
                if (typeof value === "string") {
                    if (!this.image || !(this.image instanceof Image)) {
                        this.image = imageInstance$1(this);
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
        var ctx = this.ctx;
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
            // ctx.texImage2D(ctx.TEXTURE_2D, this.border, ctx[this.format], ctx[this.format], ctx[this.type], new Uint8Array(this.width * this.height * 4));
            // ctx.texImage2D(ctx.TEXTURE_2D, this.border, ctx[this.format], this.width, this.height, 0, ctx[this.format], ctx[this.type], new Uint8Array(this.width * this.height * 4));
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

    var pathIns = path.instance;
    var canvasLayer$1 = canvasAPI.canvasLayer;
    var canvasNodeLayer$1 = canvasAPI.canvasNodeLayer;

    exports.Path = pathIns;
    exports.behaviour = behaviour;
    exports.canvasLayer = canvasLayer$1;
    exports.canvasNodeLayer = canvasNodeLayer$1;
    exports.chain = chain;
    exports.color = colorMap$1;
    exports.ease = fetchTransitionType;
    exports.geometry = geometry;
    exports.queue = queue;
    exports.svgLayer = svgLayer;
    exports.webglLayer = webglLayer;

    Object.defineProperty(exports, '__esModule', { value: true });

}));
