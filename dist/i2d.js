(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define("i2d", [], factory);
	else if(typeof exports === 'object')
		exports["i2d"] = factory();
	else
		root["i2d"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 6);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_RESULT__;(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory()
  } else if (true) {
    !(__WEBPACK_AMD_DEFINE_FACTORY__ = (() => factory()),
				__WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ?
				(__WEBPACK_AMD_DEFINE_FACTORY__.call(exports, __webpack_require__, exports, module)) :
				__WEBPACK_AMD_DEFINE_FACTORY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__))
  } else {
    root.geometry = factory()
  }
}(this, () => {
  function geometry (context) {
    function cos (a) {
      return Math.cos(a)
    }

    function acos (a) {
      return Math.acos(a)
    }

    function sin (a) {
      return Math.sin(a)
    }

    function pw (a, x) {
      let val = 1
      if (x === 0) return val
      for (let i = 1; i <= x; i += 1) { val *= a }
      return val
    }

    function tan (a) {
      return Math.tan(a)
    }

    function atan2 (a, b) {
      return Math.atan2(a, b)
    }

    function sqrt (a) {
      return Math.sqrt(a)
    }
    function angleToRadian (_) {
      if (isNaN(_)) { throw new Error('NaN') }
      return (Math.PI / 180) * _
    }
    function radianToAngle (_) {
      if (isNaN(_)) { throw new Error('NaN') }
      return (180 / Math.PI) * _
    }
    function getAngularDistance (r1, r2) {
      if (isNaN(r1 - r2)) { throw new Error('NaN') }
      return r1 - r2
    }
    function bezierLength (p0, p1, p2) {
      const a = {}
      const b = {}

      a.x = p0.x + p2.x - 2 * p1.x
      a.y = p0.y + p2.y - 2 * p1.y
      b.x = 2 * p1.x - 2 * p0.x
      b.y = 2 * p1.y - 2 * p0.y

      const A = 4 * (a.x * a.x + a.y * a.y)
      const B = 4 * (a.x * b.x + a.y * b.y)
      const C = (b.x * b.x + b.y * b.y)

      const Sabc = 2 * Math.sqrt(A + B + C)
      const A_2 = Math.sqrt(A)
      const A_32 = 2 * A * A_2
      const C_2 = 2 * Math.sqrt(C)
      const BA = B / A_2
      let logVal = (2 * A_2 + BA + Sabc) / (BA + C_2)
      logVal = (isNaN(logVal) || Math.abs(logVal) === Infinity) ? 1 : logVal

      return (A_32 * Sabc + A_2 * B * (Sabc - C_2) + (4 * C * A - B * B) * Math.log(logVal)) / (4 * A_32)
    }

    function bezierLengthOld (p0, p1, p2) {
      const interval = 0.001
      let sum = 0
      const bezierTransitionInstance = bezierTransition.bind(null, p0, p1, p2)
      // let p1
      // let p2
      for (let i = 0; i <= 1 - interval; i += interval) {
        p1 = bezierTransitionInstance(i)
        p2 = bezierTransitionInstance(i + interval)
        sum += sqrt(pw((p2.x - p1.x) / interval, 2) + (pw((p2.y - p1.y) / interval, 2))) * interval
      }
      return sum
    }
    function cubicBezierLength (p0, co) {
      const interval = 0.001
      let sum = 0

      const cubicBezierTransitionInstance = cubicBezierTransition.bind(null, p0, co)
      let p1
      let p2
      for (let i = 0; i <= 1; i += interval) {
        p1 = cubicBezierTransitionInstance(i)
        p2 = cubicBezierTransitionInstance(i + interval)
        sum += sqrt(pw((p2.x - p1.x) / interval, 2) + (pw((p2.y - p1.y) / interval, 2))) * interval
      }
      return sum
    }
    function getDistance (p1, p2) {
      let cPw = 0
      for (const p in p1) {
        cPw += pw(p2[p] - p1[p], 2)
      }
      if (isNaN(cPw)) {
        throw new Error('error')
      }
      return sqrt(cPw)
    }

    function get2DAngle (p1, p2) {
      return atan2(p2.x - p1.x, p2.y - p1.y)
    }
    function get3DAngle (p1, p2) {
      return acos((p1.x * p2.x + p1.y * p2.y + p1.z * p2.z) / (sqrt(p1.x * p1.x + p1.y * p1.y + p1.z * p1.z) * sqrt(p2.x * p2.x + p2.y * p2.y + p2.z * p2.z)))
    }
    function scaleAlongOrigin (co, factor) {
      const co_ = {}
      for (const prop in co) {
        co_[prop] = co[prop] * factor
      }
      return co_
    }
    function scaleAlongPoint (p, r, f) {
      const s = (p.y - r.y) / (p.x - r.x)
      const xX = p.x * f
      const yY = (s * (xX - r.x) + r.y) * f

      return {
        x: xX,
        y: yY
      }
    }

    function cubicBezierCoefficients (p, f) {
      const cx = 3 * (p.cntrl1.x - p.p0.x)
      const bx = 3 * (p.cntrl2.x - p.cntrl1.x) - cx
      const ax = p.p1.x - p.p0.x - cx - bx
      const cy = 3 * (p.cntrl1.y - p.p0.y)
      const by = 3 * (p.cntrl2.y - p.cntrl1.y) - cy
      const ay = p.p1.y - p.p0.y - cy - by

      return {
        cx,
        bx,
        ax,
        cy,
        by,
        ay
      }
    }
    function toCubicCurves (stack) {
      if (!stack.length) { return }
      const _ = stack
      const mappedArr = []
      for (let i = 0; i < _.length; i += 1) {
        if (['M', 'C', 'S', 'Q'].indexOf(_[i].type) !== -1) {
          mappedArr.push(_[i])
        } else if (['V', 'H', 'L', 'Z'].indexOf(_[i].type) !== -1) {
          const ctrl1 = {
            x: (_[i].p0.x + _[i].p1.x) / 2,
            y: (_[i].p0.y + _[i].p1.y) / 2
          }
          mappedArr.push({
            p0: _[i].p0,
            cntrl1: ctrl1,
            cntrl2: ctrl1,
            p1: _[i].p1,
            type: 'C',
            length: _[i].length
          })
        } else {
          console.log('wrong cmd type')
        }
      }
      return mappedArr
    }

    function cubicBezierTransition (p0, co, f) {
      const p3 = pw(f, 3)
      const p2 = pw(f, 2)
      return {
        x: co.ax * p3 + co.bx * p2 + co.cx * f + p0.x,
        y: co.ay * p3 + co.by * p2 + co.cy * f + p0.y
      }
    }
    function bezierTransition (p0, p1, p2, f) {
      return {
        x: (p0.x - 2 * p1.x + p2.x) * f * f + (2 * p1.x - 2 * p0.x) * f + p0.x,
        y: (p0.y - 2 * p1.y + p2.y) * f * f + (2 * p1.y - 2 * p0.y) * f + p0.y
      }
    }
    function linearTBetweenPoints (p1, p2, f) {
      return {
        x: p1.x + ((p2.x - p1.x)) * f,
        y: p1.y + ((p2.y - p1.y)) * f
      }
    }

    function intermediateValue (v1, v2, f) {
      return v1 + ((v2 - v1)) * f
    }
    function getBBox (cmxArr) {
      let minX = Infinity
      let minY = Infinity
      let maxX = -Infinity
      let maxY = -Infinity

      const exe = []
      let d
      for (let i = 0; i < cmxArr.length; i += 1) {
        d = cmxArr[i]
        if (['V', 'H', 'L'].indexOf(d.type) !== -1) {
          exe[exe.length] = linearTBetweenPoints.bind(null, d.p0 ? d.p0 : (cmxArr[i - 1].p1), d.p1)
        } else if (['Q', 'C'].indexOf(d.type) !== -1) {
          const co = cubicBezierCoefficients(d)
          exe[exe.length] = cubicBezierTransition.bind(null, d.p0, co)
        } else {
          exe[exe.length] = d.p0
        }

        let ii = 0
        let point
        if (typeof exe[exe.length - 1] === 'function') {
          while (ii < 1) {
            point = exe[exe.length - 1](ii)
            ii += 0.05
            if (point.x < minX) { minX = point.x }
            if (point.x > maxX) { maxX = point.x }

            if (point.y < minY) { minY = point.y }
            if (point.y > maxY) { maxY = point.y }
          }
        } else {
          point = exe[exe.length - 1]
          if (point.x < minX) { minX = point.x }
          if (point.x > maxX) { maxX = point.x }

          if (point.y < minY) { minY = point.y }
          if (point.y > maxY) { maxY = point.y }
        }
      }

      return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
      }
    }

    const _slicedToArray = (function () {
      function sliceIterator (arr, i) {
        const _arr = []
        let _n = true
        let _d = false
        let _e
        try {
          for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
            _arr.push(_s.value)
            if (i && _arr.length === i) break
          }
        } catch (err) {
          _d = true
          _e = err
        } finally {
          try {
            if (!_n && _i.return) _i.return()
          } finally {
            if (_d) throw _e
          }
        }
        return _arr
      }
      return function (arr, i) {
        if (Array.isArray(arr)) {
          return arr
        } else if (Symbol.iterator in Object(arr)) {
          return sliceIterator(arr, i)
        }
        throw new TypeError('Invalid attempt to destructure non-iterable instance')
      }
    }())

    const TAU = Math.PI * 2

    const mapToEllipse = function mapToEllipse (_ref, rx, ry, cosphi, sinphi, centerx, centery) {
      let { x, y } = _ref

      x *= rx
      y *= ry

      const xp = cosphi * x - sinphi * y
      const yp = sinphi * x + cosphi * y

      return {
        x: xp + centerx,
        y: yp + centery
      }
    }

    const approxUnitArc = function approxUnitArc (ang1, ang2) {
      const a = 4 / 3 * Math.tan(ang2 / 4)

      const x1 = Math.cos(ang1)
      const y1 = Math.sin(ang1)
      const x2 = Math.cos(ang1 + ang2)
      const y2 = Math.sin(ang1 + ang2)

      return [{
        x: x1 - y1 * a,
        y: y1 + x1 * a
      }, {
        x: x2 + y2 * a,
        y: y2 - x2 * a
      }, {
        x: x2,
        y: y2
      }]
    }

    const vectorAngle = function vectorAngle (ux, uy, vx, vy) {
      const sign = ux * vy - uy * vx < 0 ? -1 : 1
      const umag = Math.sqrt(ux * ux + uy * uy)
      const vmag = Math.sqrt(ux * ux + uy * uy)
      const dot = ux * vx + uy * vy

      let div = dot / (umag * vmag)

      if (div > 1) {
        div = 1
      }

      if (div < -1) {
        div = -1
      }

      return sign * Math.acos(div)
    }

    const getArcCenter = function getArcCenter (px, py, cx, cy, rx, ry, largeArcFlag, sweepFlag, sinphi, cosphi, pxp, pyp) {
      const rxsq = pw(rx, 2)
      const rysq = pw(ry, 2)
      const pxpsq = pw(pxp, 2)
      const pypsq = pw(pyp, 2)

      let radicant = rxsq * rysq - rxsq * pypsq - rysq * pxpsq

      if (radicant < 0) {
        radicant = 0
      }

      radicant /= rxsq * pypsq + rysq * pxpsq
      radicant = Math.sqrt(radicant) * (largeArcFlag === sweepFlag ? -1 : 1)

      const centerxp = radicant * rx / ry * pyp
      const centeryp = radicant * -ry / rx * pxp

      const centerx = cosphi * centerxp - sinphi * centeryp + (px + cx) / 2
      const centery = sinphi * centerxp + cosphi * centeryp + (py + cy) / 2

      const vx1 = (pxp - centerxp) / rx
      const vy1 = (pyp - centeryp) / ry
      const vx2 = (-pxp - centerxp) / rx
      const vy2 = (-pyp - centeryp) / ry

      const ang1 = vectorAngle(1, 0, vx1, vy1)
      let ang2 = vectorAngle(vx1, vy1, vx2, vy2)

      if (sweepFlag === 0 && ang2 > 0) {
        ang2 -= TAU
      }

      if (sweepFlag === 1 && ang2 < 0) {
        ang2 += TAU
      }

      return [centerx, centery, ang1, ang2]
    }

    const arcToBezier = function arcToBezier (_ref2) {
      let {
        px, py, cx, cy, rx, ry
      } = _ref2
      const _ref2$xAxisRotation = _ref2.xAxisRotation
      const xAxisRotation = _ref2$xAxisRotation === undefined ? 0 : _ref2$xAxisRotation
      const _ref2$largeArcFlag = _ref2.largeArcFlag
      const largeArcFlag = _ref2$largeArcFlag === undefined ? 0 : _ref2$largeArcFlag
      const _ref2$sweepFlag = _ref2.sweepFlag
      const sweepFlag = _ref2$sweepFlag === undefined ? 0 : _ref2$sweepFlag

      const curves = []

      if (rx === 0 || ry === 0) {
        return []
      }

      const sinphi = Math.sin(xAxisRotation * TAU / 360)
      const cosphi = Math.cos(xAxisRotation * TAU / 360)

      const pxp = cosphi * (px - cx) / 2 + sinphi * (py - cy) / 2
      const pyp = -sinphi * (px - cx) / 2 + cosphi * (py - cy) / 2

      if (pxp === 0 && pyp === 0) {
        return []
      }

      rx = Math.abs(rx)
      ry = Math.abs(ry)

      const lambda = pw(pxp, 2) / pw(rx, 2) + pw(pyp, 2) / pw(ry, 2)

      if (lambda > 1) {
        rx *= Math.sqrt(lambda)
        ry *= Math.sqrt(lambda)
      }

      const _getArcCenter = getArcCenter(px, py, cx, cy, rx, ry, largeArcFlag, sweepFlag, sinphi, cosphi, pxp, pyp)

      const _getArcCenter2 = _slicedToArray(_getArcCenter, 4)

      const centerx = _getArcCenter2[0]
      const centery = _getArcCenter2[1]
      let ang1 = _getArcCenter2[2]
      let ang2 = _getArcCenter2[3]

      const segments = Math.max(Math.ceil(Math.abs(ang2) / (TAU / 4)), 1)

      ang2 /= segments

      for (let i = 0; i < segments; i++) {
        curves.push(approxUnitArc(ang1, ang2))
        ang1 += ang2
      }

      return curves.map((curve) => {
        const _mapToEllipse = mapToEllipse(curve[0], rx, ry, cosphi, sinphi, centerx, centery)

        const x1 = _mapToEllipse.x
        const y1 = _mapToEllipse.y

        const _mapToEllipse2 = mapToEllipse(curve[1], rx, ry, cosphi, sinphi, centerx, centery)

        const x2 = _mapToEllipse2.x
        const y2 = _mapToEllipse2.y

        const _mapToEllipse3 = mapToEllipse(curve[2], rx, ry, cosphi, sinphi, centerx, centery)

        const x = _mapToEllipse3.x
        const y = _mapToEllipse3.y

        return {
          x1,
          y1,
          x2,
          y2,
          x,
          y
        }
      })
    }

    function rotatePoint (point, centre, newAngle, distance) {
      const p = {}
      const currAngle = this.getAngle(centre, point)

      p.x = centre.x + Math.cos(currAngle - (newAngle * Math.PI / 180)) * distance
      p.y = centre.y + Math.sin(currAngle - (newAngle * Math.PI / 180)) * distance

      return p
    }

    function T2dGeometry () {}
    T2dGeometry.prototype = {
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
      getBBox,
      toCubicCurves,
      rotatePoint
    }

    function getGeometry () {
      return new T2dGeometry()
    }

    return getGeometry()
  }

  return geometry
}))


/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;(function (root, factory) {
  if (true) {
    !(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_FACTORY__ = (() => factory()),
				__WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ?
				(__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__))
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory()
  } else {
    root.queue = factory()
  }
}(this, () => {
  let animatorInstance = null
  // const currentTime = Date.now()
  let tweens = []
  const vDoms = []
  let animeFrameId

  const onFrameExe = []

  window.requestAnimationFrame = (function requestAnimationFrameG () {
    return window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function requestAnimationFrame (callback, element) {
              return window.setTimeout(callback, 1000 / 60)
            }
  })()
  window.cancelAnimFrame = (function cancelAnimFrameG () {
    return (
      window.cancelAnimationFrame ||
            window.webkitCancelAnimationFrame ||
            window.mozCancelAnimationFrame ||
            window.oCancelAnimationFrame ||
            window.msCancelAnimationFrame ||
            function cancelAnimFrame (id) {
              return window.clearTimeout(id)
            }
    )
  })()

  function Tween (executable, ID, easying) {
    this.executable = executable
    this.ID = ID
    this.duration = executable.duration ? executable.duration : 0
    this.currTime = Date.now()
    this.lastTime = 0 - (executable.delay ? executable.delay : 0)
    this.loopTracker = 0
    this.loop = executable.loop ? executable.loop : 0
    this.direction = executable.direction
    this.easying = easying
    this.end = executable.end ? executable.end : null

    if (this.direction === 'reverse') { this.factor = 1 } else { this.factor = 0 }
  }

  Tween.prototype.execute = function execute (f) {
    this.executable.run(f)
  }

  Tween.prototype.resetCallBack = function resetCallBack (_) {
    if (typeof _ !== 'function') return
    this.callBack = _
  }

  function endExe (_) {
    this.endExe = _
    return this
  }

  function onRequestFrame (_) {
    // const self = this

    if (typeof _ !== 'function') {
      throw new Error('Wrong input')
    }

    onFrameExe.push(_)

    if (onFrameExe.length > 0 && !animeFrameId) {
      this.startAnimeFrames()
    }
  }
  function add (Id, executable, easying) {
    tweens[tweens.length] = new Tween(executable, Id, easying)
  }
  // var remove = function(id) {
  //     for(var i=0;i<tweens.length;i++){
  //         if (id === tweens[i].ID) {
  //             tweens.splice(i, 1)[0];
  //             break;
  //         }
  //     }
  //     return this;
  // };
  function startAnimeFrames () {
    if (!animeFrameId) {
      animeFrameId = window.requestAnimationFrame(exeFrameCaller)
    }
  }
  function stopAnimeFrame () {
    if (animeFrameId) {
      window.cancelAnimFrame(animeFrameId)
      animeFrameId = null
    }
  }

  function Animator () {
    this.vDoms = []
  }

  Animator.prototype = {
    startAnimeFrames,
    stopAnimeFrame,
    add,
    // remove: remove,
    end: endExe,
    onRequestFrame,
    destroy () {
      if (this.endExe) { this.endExe() }
      this.stopAnimeFrame()
    }
  }

  Animator.prototype.addVdom = function AaddVdom (_) {
    vDoms.push(_)
    return vDoms.length - 1
  }
  Animator.prototype.vDomChanged = function AvDomChanged (vDom) {
    vDoms[vDom].stateModified = true
  }
  Animator.prototype.execute = function Aexecute () {
    if (!animeFrameId) { animeFrameId = window.requestAnimationFrame(exeFrameCaller) }
  }

  let d
  let t
  function exeFrameCaller () {
    animeFrameId = window.requestAnimationFrame(exeFrameCaller)

    for (let i = 0; i < tweens.length; i += 1) {
      d = tweens[i]
      t = Date.now()
      d.lastTime += (t - d.currTime)
      d.currTime = t
      if (d.lastTime < d.duration && d.lastTime >= 0) {
        d.execute(Math.abs(d.factor - d.easying(d.lastTime, d.duration)))
      } else if (d.lastTime > d.duration) {
        d.execute(1 - d.factor)
        if (d.loopTracker >= d.loop - 1) {
          d.removed = true
        } else {
          d.loopTracker += 1
          d.lastTime = 0
          if (d.direction === 'alternate') { d.factor = 1 - d.factor } else if (d.direction === 'reverse') { d.factor = 1 } else { d.factor = 0 }
        }
      }
    }

    if (onFrameExe.length > 0) {
      for (let i = 0; i < onFrameExe.length; i += 1) {
        onFrameExe[i](t)
      }
    }

    const newTween = []
    for (let i = 0; i < tweens.length; i += 1) {
      if (!tweens[i].removed) { newTween[newTween.length] = tweens[i] } else if (typeof tweens[i].end === 'function') {
        tweens[i].end()
        tweens[i] = undefined
      }
    }
    tweens = newTween

    for (let i = 0; i < vDoms.length; i += 1) {
      if (vDoms[i].stateModified) {
        vDoms[i].execute()
        vDoms[i].stateModified = false
      }
    }
  }

  function animateQueue () {
    if (!animatorInstance) { animatorInstance = new Animator() }
    return animatorInstance
  }

  return animateQueue
}))


/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;(function easing (root, factory) {
  const i2d = root
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(__webpack_require__(0))
  } else if (true) {
    !(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(0)], __WEBPACK_AMD_DEFINE_FACTORY__ = (geometry => factory(geometry)),
				__WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ?
				(__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__))
  } else {
    i2d.easing = factory(root.geometry)
  }
}(this, (geometry) => {
  const t2DGeometry = geometry('2D')

  function linear (starttime, duration) {
    return (starttime / duration)
  }
  function elastic (starttime, duration) {
    const decay = 8
    const force = 2 / 1000
    const t = starttime / duration

    return (1 - (1 - t) * Math.sin(t * duration * force * Math.PI * 2 + (Math.PI / 2)) /
     Math.exp(t * decay))
  }
  function bounce (starttime, duration) {
    const decay = 10
    const t = starttime / duration
    const force = t / 100

    return (1 - (1 - t) * Math.abs(Math.sin(t * duration * force * Math.PI * 2 + (Math.PI / 2))) /
     Math.exp(t * decay))
  }
  function easeInQuad (starttime, duration) {
    const t = starttime / duration
    return t * t
  }
  function easeOutQuad (starttime, duration) {
    const t = starttime / duration
    return t * (2 - t)
  }
  function easeInOutQuad (starttime, duration) {
    const t = starttime / duration
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
  }
  function easeInCubic (starttime, duration) {
    const t = starttime / duration
    return t2DGeometry.pow(t, 3)
  }
  function easeOutCubic (starttime, duration) {
    let t = starttime / duration
    t -= 1
    return t * t * t + 1
  }
  function easeInOutCubic (starttime, duration) {
    const t = starttime / duration
    return t < 0.5 ? 4 * t2DGeometry.pow(t, 3) : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1
  }
  function sinIn (starttime, duration) {
    const t = starttime / duration
    return 1 - Math.cos(t * Math.PI / 2)
  }
  function easeOutSin (starttime, duration) {
    const t = starttime / duration
    return Math.cos(t * Math.PI / 2)
  }
  function easeInOutSin (starttime, duration) {
    const t = starttime / duration
    return (1 - Math.cos(Math.PI * t)) / 2
  }
  // function easeInQuart (starttime, duration) {
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
  function cust (custEase) {
    return function custExe (starttime, duration) {
      return custEase(starttime / duration)
    }
  }

  function easing () {
    function fetchTransitionType (_) {
      let res
      switch (_) {
        case 'easeOutQuad':
          res = easeOutQuad
          break
        case 'easeInQuad':
          res = easeInQuad
          break
        case 'easeInOutQuad':
          res = easeInOutQuad
          break
        case 'easeInCubic':
          res = easeInCubic
          break
        case 'easeOutCubic':
          res = easeOutCubic
          break
        case 'easeInOutCubic':
          res = easeInOutCubic
          break
        case 'easeInSin':
          res = sinIn
          break
        case 'easeOutSin':
          res = easeOutSin
          break
        case 'easeInOutSin':
          res = easeInOutSin
          break
        case 'bounce':
          res = bounce
          break
        case 'linear':
          res = linear
          break
        case 'elastic':
          res = elastic
          break
        default:
          res = linear
      }
      if (typeof _ === 'function') { return cust(_) }
      return res
    }

    return fetchTransitionType
  }

  return easing
}))


/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;(function chain (root, factory) {
  const i2d = root
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(__webpack_require__(2), __webpack_require__(1))
  } else if (true) {
    !(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(2), __webpack_require__(1)], __WEBPACK_AMD_DEFINE_FACTORY__ = ((easing, queue) => factory(easing, queue)),
				__WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ?
				(__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__))
  } else {
    i2d.chain = factory(root.easing, root.queue)
  }
}(this, (easing, queue) => {
  let Id = 0
  let chainId = 0

  function generateRendererId () {
    Id += 1
    return Id
  }

  function generateChainId () {
    chainId += 1
    return chainId
  }

  const easying = easing()

  function ease (type) {
    this.easying = easying(type)
    this.transition = type
    return this
  }
  function duration (value) {
    if (arguments.length !== 1) { throw new Error('arguments mis match') }
    this.durationP = value
    return this
  }
  function loopValue (value) {
    if (arguments.length !== 1) { throw new Error('arguments mis match') }
    this.loopValue = value
    return this
  }
  function direction (value) {
    if (arguments.length !== 1) { throw new Error('arguments mis match') }
    this.directionV = value
    return this
  }

  function bind (value) {
    if (arguments.length !== 1) { throw new Error('arguments mis match') }
    this.data = value

    if (this.data.nodeName === 'CANVAS') { this.canvasStack = [] }

    return this
  }
  function callbckExe (exe) {
    if (typeof exe !== 'function') { return null }
    this.callbckExe = exe
    return this
  }
  function reset (value) {
    this.resetV = value
    return this
  }
  function child (exe) {
    this.end = exe
    return this
  }

  function end (exe) {
    this.endExe = exe
    return this
  }

  function commit () {
    this.start()
  }

  function SequenceGroup () {
    this.queue = queue()
    this.sequenceQueue = []
    this.lengthV = 0
    this.currPos = 0
    this.ID = generateRendererId()
    this.loopCounter = 1
    // this.factor = 1;
    // this.direction = 'alternate';
    // this.completedTime = 0;
    // this.percentCompletion = 0;
    // this.previousFactor = 0;
    // this.previousLocalFactor = 0;
    // this.cumilativeLength = 0;
  }

  SequenceGroup.prototype = {
    duration,
    loop: loopValue,
    callbck: callbckExe,
    bind,
    child,
    ease,
    end,
    commit,
    reset,
    direction
  }

  SequenceGroup.prototype.add = function SGadd (value) {
    const self = this

    if (!Array.isArray(value)) {
      value = [value]
    }
    value.map((d) => {
      self.lengthV += (d.length ? d.length : 0)
      return d
    })
    this.sequenceQueue = this.sequenceQueue.concat(value)

    return this
  }

  SequenceGroup.prototype.easyingGlobal = function SGeasyingGlobal (completedTime, durationV) {
    return completedTime / durationV
  }

  SequenceGroup.prototype.start = function SGstart () {
    const self = this
    if (self.directionV === 'alternate') {
      self.factor = self.factor ? -1 * self.factor : 1
      self.currPos = self.factor < 0 ? this.sequenceQueue.length - 1 : 0
    } else if (self.directionV === 'reverse') {
      for (let i = 0; i < this.sequenceQueue.length; i += 1) {
        const currObj = this.sequenceQueue[i]
        if (!(currObj instanceof SequenceGroup) && !(currObj instanceof ParallelGroup)) {
          currObj.run(1)
        }
        self.currPos = i
      }
      self.factor = -1
    } else {
      self.currPos = 0
      self.factor = 1
    }
    this.execute()
  }

  SequenceGroup.prototype.execute = function SGexecute () {
    const self = this
    const currObj = this.sequenceQueue[self.currPos]

    if (!currObj) { return }
    if (currObj instanceof SequenceGroup || currObj instanceof ParallelGroup) {
      // currObj.duration(currObj.durationP ? currObj.durationP
      //   : (currObj.length / self.lengthV) * self.durationP)
      currObj.end(self.triggerEnd.bind(self, currObj)).commit()
    } else {
      // const tValue = currObj.duration
      // const data_ = currObj.data ? currObj.data : self.data
      // console.log(currObj)
      this.currObj = currObj
      // currObj.durationP = tValue
      this.queue.add(generateChainId(), {
        run (f) {
          currObj.run(f)
        },
        duration: currObj.duration,
        // ,
        // loop: self.loopValue,
        direction: self.factor < 0 ? 'reverse' : 'default',
        end: self.triggerEnd.bind(self, currObj)
      }, (c, v) =>
        c / v)
    }
    return this
  }

  SequenceGroup.prototype.triggerEnd = function SGtriggerEnd (currObj) {
    const self = this
    self.currPos += self.factor
    if (currObj.end) {
      self.triggerChild(currObj)
    }
    if (self.sequenceQueue.length === self.currPos || self.currPos < 0) {
      if (self.endExe) { self.endExe() }
      if (self.end) { self.triggerChild(self) }

      self.loopCounter += 1
      if (self.loopCounter < self.loopValue) {
        self.start()
      }
      return
    }

    this.execute()
  }

  SequenceGroup.prototype.triggerChild = function SGtriggerChild (currObj) {
    if (currObj.end instanceof ParallelGroup || currObj.end instanceof SequenceGroup) {
      setTimeout(() => {
        currObj.end.commit()
      }, 0)
    } else {
      currObj.end()
      // setTimeout(() => {
      //   currObj.childExe.start()
      // }, 0)
    }
  }

  function ParallelGroup () {
    this.queue = queue()
    this.group = []
    this.currPos = 0
    // this.lengthV = 0
    this.ID = generateRendererId()
    this.loopCounter = 1
    // this.transition = 'linear'
  }

  ParallelGroup.prototype = {
    duration,
    loop: loopValue,
    callbck: callbckExe,
    bind,
    child,
    ease,
    end,
    commit,
    direction
  }

  ParallelGroup.prototype.add = function PGadd (value) {
    const self = this

    if (!Array.isArray(value)) { value = [value] }

    // value.map((d) => {
    //   self.lengthV += d.lengthV
    //   return d
    // })

    this.group = this.group.concat(value)

    this.group.forEach((d) => {
      d.durationP = d.durationP ? d.durationP : self.durationP
    })

    return this
  }

  ParallelGroup.prototype.execute = function PGexecute () {
    const self = this

    self.currPos = 0
    self.group.forEach((d, i) => {
      const currObj = d

      if (currObj instanceof SequenceGroup || currObj instanceof ParallelGroup) {
        currObj
          // .duration(currObj.durationP ? currObj.durationP : self.durationP)
          .end(self.triggerEnd.bind(self, currObj)).commit()
      } else {
        self.queue.add(generateChainId(), {
          run (f) {
            d.run(f)
          },
          duration: currObj.duration,
          loop: 1,
          direction: self.factor < 0 ? 'reverse' : 'default',
          end: self.triggerEnd.bind(self, currObj)
        }, self.easying)
      }
    })

    return self
  }

  ParallelGroup.prototype.start = function PGstart () {
    const self = this
    if (self.directionV === 'alternate') {
      self.factor = self.factor ? -1 * self.factor : 1
    } else if (self.directionV === 'reverse') {
      self.factor = -1
    } else {
      self.factor = 1
    }

    this.execute()
  }

  ParallelGroup.prototype.triggerEnd = function PGtriggerEnd (currObj) {
    const self = this
    // Call child transition wen Entire parallelChain transition completes
    this.currPos += 1

    if (currObj.end) {
      this.triggerChild(currObj.end)
    }
    if (this.currPos === this.group.length) {
      // Call child transition wen Entire parallelChain transition completes
      if (this.endExe) { this.triggerChild(this.endExe) }
      if (this.end) { this.triggerChild(this.end) }

      self.loopCounter += 1
      if (self.loopCounter < self.loopValue) {
        self.start()
      }
    }
  }

  ParallelGroup.prototype.triggerChild = function PGtriggerChild (exe) {
    if (exe instanceof ParallelGroup || exe instanceof SequenceGroup) {
      exe.commit()
    } else if (typeof exe === 'function') {
      exe()
    } else {
      console.log('wrong type')
    }
  }

  const chain = {}

  chain.sequenceChain = function sequenceChain () {
    return new SequenceGroup()
  }
  chain.parallelChain = function parallelChain () {
    return new ParallelGroup()
  }

  return chain
}))


/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;(function vDom (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(__webpack_require__(0))
  } else if (true) {
    !(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(0)], __WEBPACK_AMD_DEFINE_FACTORY__ = (geometry => factory(geometry)),
				__WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ?
				(__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__))
  } else {
    root.vDom = factory(geometry)
  }
}(this, (geometry) => {
  const t2DGeometry = geometry('2D')

  function VDom () {}
  VDom.prototype.execute = function execute () {
    this.root.execute()
    this.stateModified = false
  }
  VDom.prototype.root = function root (_) {
    this.root = _
    this.stateModified = true
  }
  VDom.prototype.eventsCheck = function eventsCheck (nodes, mouseCoor) {
    const self = this
    let node,
      temp

    for (let i = 0; i <= nodes.length - 1; i += 1) {
      const d = nodes[i]
      const coOr = { x: mouseCoor.x, y: mouseCoor.y }
      transformCoOr(d, coOr)
      if (d.in({ x: coOr.x, y: coOr.y })) {
        if (d.children && d.children.length > 0) {
          temp = self.eventsCheck(d.children, { x: coOr.x, y: coOr.y })
          if (temp) { node = temp }
        } else {
          node = d
        }
      }
    }
    return node
  }

  function transformCoOr (d, coOr) {
    let hozMove = 0
    let verMove = 0
    let scaleX = 1
    let scaleY = 1
    const coOrLocal = coOr

    if (d.attr.transform && d.attr.transform.translate) {
      [hozMove, verMove] = d.attr.transform.translate
      coOrLocal.x -= hozMove
      coOrLocal.y -= verMove
    }

    if (d.attr.transform && d.attr.transform.scale) {
      scaleX = d.attr.transform.scale[0] !== undefined ? d.attr.transform.scale[0] : 1
      scaleY = d.attr.transform.scale[1] !== undefined ? d.attr.transform.scale[1] : scaleX
      coOrLocal.x /= scaleX
      coOrLocal.y /= scaleY
    }

    if (d.attr.transform && d.attr.transform.rotate) {
      const rotate = d.attr.transform.rotate[0]
      const { BBox } = d.dom
      const cen = {
        x: (BBox.x + (BBox.width / 2) - hozMove) / scaleX,
        y: (BBox.y + (BBox.height / 2) - verMove) / scaleY
      }
      const dis = t2DGeometry.getDistance(coOr, cen)
      const angle = Math.atan2(coOr.y - cen.y, coOr.x - cen.x)

      coOrLocal.x = cen.x + Math.cos(angle - (rotate * Math.PI / 180)) * dis
      coOrLocal.y = cen.y + Math.sin(angle - (rotate * Math.PI / 180)) * dis
    }
  }

  const vDomInstance = function vDomInstance () {
    return new VDom()
  }

  return vDomInstance
}))


/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;(function colorMap (root, factory) {
  const i2d = root
  if (true) {
    !(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_FACTORY__ = (() => factory()),
				__WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ?
				(__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__))
  } else if (typeof module === 'object' && module.exports) {
    module.exports.colorMap = factory()
  } else {
    i2d.colorMap = factory()
  }
}(this, () => {
  const preDefinedColors = ['AliceBlue', 'AntiqueWhite', 'Aqua', 'Aquamarine', 'Azure', 'Beige', 'Bisque', 'Black', 'BlanchedAlmond', 'Blue', 'BlueViolet', 'Brown', 'BurlyWood', 'CadetBlue', 'Chartreuse', 'Chocolate', 'Coral', 'CornflowerBlue', 'Cornsilk', 'Crimson', 'Cyan', 'DarkBlue', 'DarkCyan', 'DarkGoldenRod', 'DarkGray', 'DarkGrey', 'DarkGreen', 'DarkKhaki', 'DarkMagenta', 'DarkOliveGreen', 'DarkOrange', 'DarkOrchid', 'DarkRed', 'DarkSalmon', 'DarkSeaGreen', 'DarkSlateBlue', 'DarkSlateGray', 'DarkSlateGrey', 'DarkTurquoise', 'DarkViolet', 'DeepPink', 'DeepSkyBlue', 'DimGray', 'DimGrey', 'DodgerBlue', 'FireBrick', 'FloralWhite', 'ForestGreen', 'Fuchsia', 'Gainsboro', 'GhostWhite', 'Gold', 'GoldenRod', 'Gray', 'Grey', 'Green', 'GreenYellow', 'HoneyDew', 'HotPink', 'IndianRed', 'Indigo', 'Ivory', 'Khaki', 'Lavender', 'LavenderBlush', 'LawnGreen', 'LemonChiffon', 'LightBlue', 'LightCoral', 'LightCyan', 'LightGoldenRodYellow', 'LightGray', 'LightGrey', 'LightGreen', 'LightPink', 'LightSalmon', 'LightSeaGreen', 'LightSkyBlue', 'LightSlateGray', 'LightSlateGrey', 'LightSteelBlue', 'LightYellow', 'Lime', 'LimeGreen', 'Linen', 'Magenta', 'Maroon', 'MediumAquaMarine', 'MediumBlue', 'MediumOrchid', 'MediumPurple', 'MediumSeaGreen', 'MediumSlateBlue', 'MediumSpringGreen', 'MediumTurquoise', 'MediumVioletRed', 'MidnightBlue', 'MintCream', 'MistyRose', 'Moccasin', 'NavajoWhite', 'Navy', 'OldLace', 'Olive', 'OliveDrab', 'Orange', 'OrangeRed', 'Orchid', 'PaleGoldenRod', 'PaleGreen', 'PaleTurquoise', 'PaleVioletRed', 'PapayaWhip', 'PeachPuff', 'Peru', 'Pink', 'Plum', 'PowderBlue', 'Purple', 'RebeccaPurple', 'Red', 'RosyBrown', 'RoyalBlue', 'SaddleBrown', 'Salmon', 'SandyBrown', 'SeaGreen', 'SeaShell', 'Sienna', 'Silver', 'SkyBlue', 'SlateBlue', 'SlateGray', 'SlateGrey', 'Snow', 'SpringGreen', 'SteelBlue', 'Tan', 'Teal', 'Thistle', 'Tomato', 'Turquoise', 'Violet', 'Wheat', 'White', 'WhiteSmoke', 'Yellow', 'YellowGreen']

  const preDefinedColorHex = ['f0f8ff', 'faebd7', '00ffff', '7fffd4', 'f0ffff', 'f5f5dc', 'ffe4c4', '000000', 'ffebcd', '0000ff', '8a2be2', 'a52a2a', 'deb887', '5f9ea0', '7fff00', 'd2691e', 'ff7f50', '6495ed', 'fff8dc', 'dc143c', '00ffff', '00008b', '008b8b', 'b8860b', 'a9a9a9', 'a9a9a9', '006400', 'bdb76b', '8b008b', '556b2f', 'ff8c00', '9932cc', '8b0000', 'e9967a', '8fbc8f', '483d8b', '2f4f4f', '2f4f4f', '00ced1', '9400d3', 'ff1493', '00bfff', '696969', '696969', '1e90ff', 'b22222', 'fffaf0', '228b22', 'ff00ff', 'dcdcdc', 'f8f8ff', 'ffd700', 'daa520', '808080', '808080', '008000', 'adff2f', 'f0fff0', 'ff69b4', 'cd5c5c', '4b0082', 'fffff0', 'f0e68c', 'e6e6fa', 'fff0f5', '7cfc00', 'fffacd', 'add8e6', 'f08080', 'e0ffff', 'fafad2', 'd3d3d3', 'd3d3d3', '90ee90', 'ffb6c1', 'ffa07a', '20b2aa', '87cefa', '778899', '778899', 'b0c4de', 'ffffe0', '00ff00', '32cd32', 'faf0e6', 'ff00ff', '800000', '66cdaa', '0000cd', 'ba55d3', '9370db', '3cb371', '7b68ee', '00fa9a', '48d1cc', 'c71585', '191970', 'f5fffa', 'ffe4e1', 'ffe4b5', 'ffdead', '000080', 'fdf5e6', '808000', '6b8e23', 'ffa500', 'ff4500', 'da70d6', 'eee8aa', '98fb98', 'afeeee', 'db7093', 'ffefd5', 'ffdab9', 'cd853f', 'ffc0cb', 'dda0dd', 'b0e0e6', '800080', '663399', 'ff0000', 'bc8f8f', '4169e1', '8b4513', 'fa8072', 'f4a460', '2e8b57', 'fff5ee', 'a0522d', 'c0c0c0', '87ceeb', '6a5acd', '708090', '708090', 'fffafa', '00ff7f', '4682b4', 'd2b48c', '008080', 'd8bfd8', 'ff6347', '40e0d0', 'ee82ee', 'f5deb3', 'ffffff', 'f5f5f5', 'ffff00', '9acd32']

  const colorMap = {}

  for (let i = 0; i < preDefinedColors.length; i += 1) {
    colorMap[preDefinedColors[i]] = preDefinedColorHex[i]
  }

  function rgbParse (rgb) {
    const res = rgb.replace(/[^0-9\.,]+/g, '').split(',')
    const obj = {}
    const flags = ['r', 'g', 'b', 'a']
    for (let i = 0; i < res.length; i += 1) {
      obj[flags[i]] = res[i]
    }
    return obj
  }

  function hslParse (hsl) {
    const res = rgb.replace(/[^0-9\.,]+/g, '').split(',')
    const obj = {}
    const flags = ['h', 's', 'l', 'a']
    for (let i = 0; i < res.length; i += 1) {
      obj[flags[i]] = res[i]
    }
    return obj
  }

  const colorMapper = { }

  colorMapper.nameToHex = function nameToHex (name) {
    return colorMap[name] ? `#${colorMap[name]}` : '#000'
  }
  colorMapper.hexToRgb = function hexToRgb (hex) {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i
    hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b)
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)

    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null
  }
  colorMapper.rgbToHex = function rgbToHex (rgb) {
    const rgbComponents = rgb.substring(rgb.lastIndexOf('(') + 1, rgb.lastIndexOf(')')).split(',')
    const r = parseInt(rgbComponents[0], 10)
    const g = parseInt(rgbComponents[1], 10)
    const b = parseInt(rgbComponents[2], 10)

    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
  }

  colorMapper.hslToRgb = function hslToRgb (hsl) {
    let r
    let g
    let b
    let h
    let s
    let l
    if (s === 0) {
      r = l
      g = l
      b = l // achromatic
    } else {
      const hue2rgb = function hue2rgb (p, q, t) {
        if (t < 0) t += 1
        if (t > 1) t -= 1
        if (t < 1 / 6) return p + (q - p) * 6 * t
        if (t < 1 / 2) return q
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
        return p
      }

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s
      const p = 2 * l - q
      r = hue2rgb(p, q, h + 1 / 3)
      g = hue2rgb(p, q, h)
      b = hue2rgb(p, q, h - 1 / 3)
    }

    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) }
  }

  colorMapper.transition = function transition (src, dest) {
    src = src || 'rgb(0,0,0)'

    dest = dest || 'rgb(0,0,0)'

    src = src.startsWith('#') ? this.hexToRgb(src)
      : src.startsWith('rgb') ? rgbParse(src)
        : src.startsWith('hsl') ? hslParse(src) : { r: 0, g: 0, b: 0 }
    dest = dest.startsWith('#') ? this.hexToRgb(dest)
      : dest.startsWith('rgb') ? rgbParse(dest)
        : dest.startsWith('hsl') ? hslParse(dest) : { r: 0, g: 0, b: 0 }

    return function trans (f) {
      return `rgb(${Math.round(src.r + (dest.r - src.r) * f)},${Math.round(src.g + (dest.g - src.g) * f)},${Math.round(src.b + (dest.b - src.b) * f)})`
    }
  }

  return colorMapper
}))


/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;(function renderer (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(__webpack_require__(0), __webpack_require__(1), __webpack_require__(2), __webpack_require__(3), __webpack_require__(4), __webpack_require__(5))
  } else if (true) {
    !(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(0), __webpack_require__(1), __webpack_require__(2), __webpack_require__(3), __webpack_require__(4), __webpack_require__(5)], __WEBPACK_AMD_DEFINE_FACTORY__ = ((geometry, queue, easing, chain, vDom, colorMap) => factory(geometry, queue, easing, chain, vDom, colorMap)),
				__WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ?
				(__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__))
  } else {
    root.i2d = factory(root.geometry, root.queue, root.easing, root.chain, root.vDom, root.colorMap)
  }
}(this, (geometry, queue, easing, chain, VDom, colorMap) => {
  let ratio = 1

  const t2DGeometry = geometry('2D')
  const easying = easing()
  const queueInstance = queue()
  let Id = 0
  let animeIdentifier = 1

  function domId () {
    Id += 1
    return Id
  }

  function animeId () {
    animeIdentifier += 1
    return animeIdentifier
  }

  function fetchEls (nodeSelector, dataArray) {
    let d
    const coll = []
    for (let i = 0; i < this.stack.length; i += 1) {
      d = this.stack[i]
      coll.push(d.fetchEls(nodeSelector, dataArray))
    }
    const collection = new CreateElements()
    collection.wrapper(coll)

    return collection
  }

  function cfetchEls (nodeSelector, dataArray) {
    const nodes = []
    const wrap = new CreateElements()
    if (this.children.length > 0) {
      if (nodeSelector.charAt(0) === '.') {
        const classToken = nodeSelector.substring(1, nodeSelector.length)
        this.children.forEach((d) => {
          if ((dataArray && d.dataObj && dataArray.indexOf(d.dataObj) !== -1 && d.attr.class === classToken) || (!dataArray && d.attr.class === classToken)) {
            nodes.push(d)
          }
        })
      } else if (nodeSelector.charAt(0) === '#') {
        const idToken = nodeSelector.substring(1, nodeSelector.length)
        this.children.every((d) => {
          if ((dataArray && d.dataObj && dataArray.indexOf(d.dataObj) !== -1 && d.attr.id === idToken) || (!dataArray && d.attr.id === idToken)) {
            nodes.push(d)
            return false
          }
          return true
        })
      } else {
        this.children.forEach((d) => {
          if ((dataArray && d.dataObj && dataArray.indexOf(d.dataObj) !== -1 && d.nodeName === nodeSelector) || (!dataArray && d.nodeName === nodeSelector)) {
            nodes.push(d)
          }
        })
      }
    }

    return wrap.wrapper(nodes)
  }

  function cfetchEl (nodeSelector, data) {
    let nodes
    if (this.children.length > 0) {
      if (nodeSelector.charAt(0) === '.') {
        const classToken = nodeSelector.substring(1, nodeSelector.length)
        this.children.every((d) => {
          if ((data && d.dataObj && data === d.dataObj && d.attr.class === classToken) || (!data && d.attr.class === classToken)) {
            nodes = d
            return false
          }
          return true
        })
      } else if (nodeSelector.charAt(0) === '#') {
        const idToken = nodeSelector.substring(1, nodeSelector.length)
        this.children.every((d) => {
          if ((data && d.dataObj && data === d.dataObj && d.attr.id === idToken) || (!data && d.attr.id === idToken)) {
            nodes = d
            return false
          }
          return true
        })
      } else {
        this.children.forEach((d) => {
          if ((data && d.dataObj && data === d.dataObj && d.nodeName === nodeSelector) || (!data && d.nodeName === nodeSelector)) {
            nodes = d
          }
        })
      }
    }

    return nodes
  }

  function join (data, el, arg) {
    let d
    const coll = []
    for (let i = 0; i < this.stack.length; i += 1) {
      d = this.stack[i]

      coll.push(d.join(data, el, arg))
    }
    const collection = new CreateElements()
    collection.wrapper(coll)

    return collection
  }

  function createEl (config) {
    let d
    const coll = []
    for (let i = 0; i < this.stack.length; i += 1) {
      let cRes = {}
      d = this.stack[i]
      if (typeof config === 'function') {
        cRes = config.call(d, d.dataObj, i)
      } else {
        const keys = Object.keys(config)
        for (let j = 0; j < keys.length; j += 1) {
          const key = keys[j]
          if (typeof config[key] !== 'object') { cRes[key] = config[key] } else {
            cRes[key] = JSON.parse(JSON.stringify(config[key]))
          }
        }
      }
      coll.push(d.createEl(cRes))
    }
    const collection = new CreateElements()
    collection.wrapper(coll)

    return collection
  }

  function createEls (data, config) {
    let d
    const coll = []
    let res = data
    for (let i = 0; i < this.stack.length; i += 1) {
      let cRes = {}
      d = this.stack[i]

      if (typeof data === 'function') {
        res = data.call(d, d.dataObj, i)
      }
      if (typeof config === 'function') {
        cRes = config.call(d, d.dataObj, i)
      } else {
        const keys = Object.keys(config)
        for (let j = 0; j < keys.length; j += 1) {
          const key = keys[j]
          cRes[key] = config[key]
        }
      }
      coll.push(d.createEls(res, cRes))
    }
    const collection = new CreateElements()
    collection.wrapper(coll)

    return collection
  }

  function forEach (callBck) {
    for (let i = 0; i < this.stack.length; i += 1) {
      callBck.call(this.stack[i], this.stack[i].dataObj, i)
    }
    return this
  }

  function setAttribute (key, value) {
    let d
    for (let i = 0; i < this.stack.length; i += 1) {
      d = this.stack[i]
      if (arguments.length > 1) {
        if (typeof value === 'function') {
          d.setAttr(key, value.call(d, d.dataObj, i))
        } else {
          d.setAttr(key, value)
        }
      } else if (typeof key === 'function') {
        d.setAttr(key.call(d, d.dataObj, i))
      } else {
        const keys = Object.keys(key)
        for (let j = 0; j < keys.length; j += 1) {
          const keykey = keys[j]
          if (typeof key[keykey] === 'function') {
            d.setAttr(keykey, key[keykey].call(d, d.dataObj, i))
          } else {
            d.setAttr(keykey, key[keykey])
          }
        }
      }
    }
    return this
  }
  function setStyle (key, value) {
    let d
    for (let i = 0; i < this.stack.length; i += 1) {
      d = this.stack[i]
      if (arguments.length > 1) {
        if (typeof value === 'function') {
          d.setStyle(key, value.call(d, d.dataObj, i))
        } else {
          d.setStyle(key, value)
        }
      } else {
        if (typeof key === 'function') {
          d.setStyle(key.call(d, d.dataObj, i))
        } else {
          const keys = Object.keys(key)
          for (let j = 0; j < keys.length; j += 1) {
            const keykey = keys[j]
            if (typeof key[keykey] === 'function') {
              d.setStyle(keykey, key[keykey].call(d, d.dataObj, i))
            } else {
              d.setStyle(keykey, key[keykey])
            }
          }
        }

        if (typeof key === 'function') {
          d.setStyle(key.call(d, d.dataObj, i))
        } else {
          d.setStyle(key)
        }
      }
      // if (typeof value === 'function') {
      //     d.setStyle(key, value.call(d, d.dataObj, i))
      // } else {
      //     d.setStyle(key, value)
      // }
    }
    return this
  }
  function translate (value) {
    let d
    for (let i = 0; i < this.stack.length; i += 1) {
      d = this.stack[i]
      if (typeof value === 'function') {
        d.translate(value.call(d, d.dataObj, i))
      } else {
        d.translate(value)
      }
    }
    return this
  }
  function rotate (value) {
    let d
    for (let i = 0; i < this.stack.length; i += 1) {
      d = this.stack[i]
      if (typeof value === 'function') {
        d.rotate(value.call(d, d.dataObj, i))
      } else {
        d.rotate(value)
      }
    }
    return this
  }
  function scale (value) {
    let d
    for (let i = 0; i < this.stack.length; i += 1) {
      d = this.stack[i]
      if (typeof value === 'function') {
        d.scale(value.call(d, d.dataObj, i))
      } else {
        d.scale(value)
      }
    }
    return this
  }

  function on (eventType, hndlr) {
    for (let i = 0; i < this.stack.length; i += 1) {
      this.stack[i].on(eventType, hndlr)
    }
    return this
  }
  function remove () {
    for (let i = 0; i < this.stack.length; i += 1) {
      this.stack[i].remove()
    }
    return this
  }

  function addListener (eventType, hndlr) {
    this[eventType] = hndlr
  }

  function rotateBBox (BBox, rotateAngle) {
    // let angle
    const point1 = { x: BBox.x, y: BBox.y }
    const point2 = { x: BBox.x + BBox.width, y: BBox.y }
    const point3 = { x: BBox.x, y: BBox.y + BBox.height }
    const point4 = { x: BBox.x + BBox.width, y: BBox.y + BBox.height }

    const cen = { x: BBox.x + BBox.width / 2, y: BBox.y + BBox.height / 2 }
    const dis = t2DGeometry.getDistance(point1, cen)

    t2DGeometry.rotatePoint(point1, cen, rotateAngle, dis)
    t2DGeometry.rotatePoint(point2, cen, rotateAngle, dis)
    t2DGeometry.rotatePoint(point3, cen, rotateAngle, dis)
    t2DGeometry.rotatePoint(point4, cen, rotateAngle, dis)

    const xVec = [point1.x, point2.x, point3.x, point4.x].sort((bb, aa) => bb - aa)
    const yVec = [point1.y, point2.y, point3.y, point4.y].sort((bb, aa) => bb - aa)
    return {
      x: xVec[0],
      y: yVec[0],
      width: xVec[3] - xVec[0],
      height: yVec[3] - yVec[0]
    }
  }

  function performJoin (data, nodes, cond) {
    const dataIds = data.map(cond)
    const res = {
      new: [],
      update: [],
      old: []
    }

    for (let i = 0; i < nodes.length; i += 1) {
      const index = dataIds.indexOf(cond(nodes[i].dataObj, i))
      if (index !== -1) {
        res.update.push(nodes[i])
        dataIds.splice(index, 1)
      } else {
        res.old.push(nodes[i])
      }
    }

    res.new = data.filter((d, i) => {
      const index = dataIds.indexOf(cond(d, i))
      if (index !== -1) {
        dataIds.splice(index, 1)
        return true
      } return false
    })

    return res
  }

  function dataJoin (data, selector, config) {
    const self = this
    const nodes = this.fetchEls(selector)
    let { joinCond } = config

    if (!joinCond) { joinCond = function (d, i) { return i } }

    const joinResult = performJoin(data, nodes.stack, joinCond)

    if (config.action) {
      if (config.action.enter) {
        config.action.enter.call(self, joinResult.new)
      }
      if (config.action.exit) {
        const collection = new CreateElements()
        collection.wrapper(joinResult.old)
        config.action.exit.call(self, collection, joinResult.old.map(d => d.dataObj))
      }
      if (config.action.update) {
        const collection = new CreateElements()
        collection.wrapper(joinResult.update)
        config.action.update.call(self, collection, joinResult.update.map(d => d.dataObj))
      }
    }

    return self // (new CreateElements()).wrapper(self.children)
  }

  function generateStackId () {
    Id += 1
    return Id
  }

  function pathParser (path) {
    let pathStr = path.replace(/e-/g, '$')
    // .replace(/-/g, ',-').replace(/-/g, ',-').split(/([a-zA-Z,])/g)
    //   .filter((d) => {
    //     if (d === '' || d === ',') { return false }
    //     d = d.replace(/$/g, 'e-')
    //     return true
    //   })
    pathStr = pathStr.replace(/ /g, ',')
    pathStr = pathStr.replace(/-/g, ',-')
    pathStr = pathStr.split(/([a-zA-Z,])/g).filter((d) => {
      if (d === '' || d === ',') {
        return false
      }
      return true
    }).map((d) => {
      const dd = d.replace(/\$/g, 'e-')
      return dd
    })

    for (let i = 0; i < pathStr.length; i += 1) {
      if (pathStr[i].split('.').length > 2) {
        const splitArr = pathStr[i].split('.')
        const arr = [`${splitArr[0]}.${splitArr[1]}`]
        for (let j = 2; j < splitArr.length; j += 1) {
          arr.push(`.${splitArr[j]}`)
        }
        pathStr.splice(i, 1, arr[0], arr[1])
      }
    }

    return pathStr
  }

  function addVectors (v1, v2) {
    return {
      x: v1.x + v2.x,
      y: v1.y + v2.y
    }
  }

  function subVectors (v1, v2) {
    return {
      x: v1.x - v2.x,
      y: v1.y - v2.y
    }
  }

  function fetchXY () {
    const x = parseFloat(this.pathArr[this.currPathArr += 1])
    const y = parseFloat(this.pathArr[this.currPathArr += 1])
    return {
      x,
      y
    }
  }

  function relative (cmd, p1, p2) {
    return (cmd === cmd.toUpperCase()) ? p2 : p1
  }

  function m (cmd) {
    const temp = relative(cmd, (this.currPathArr === 0 ? {
      x: 0,
      y: 0
    } : this.pp), {
      x: 0,
      y: 0
    })
    // this.id = generateStackId()
    this.cp = addVectors(this.fetchXY(), temp)
    this.start = this.cp
    this.segmentLength = 0
    this.length = this.segmentLength

    if (this.currPathArr !== 0 && this.pp) {
      this.stackGroup.push(this.stack)
      this.stack = []
      // this.stack.segmentLength = 0;
    }

    this.stack.push({
      type: 'M',
      p0: this.cp,
      length: this.segmentLength,
      pointAt (f) {
        return this.p0
      }
    })
  }

  function v (cmd) {
    const temp = relative(cmd, this.pp, {
      x: this.pp.x,
      y: 0
    })
    this.cp = addVectors({
      x: 0,
      y: parseFloat(this.pathArr[this.currPathArr += 1])
    }, temp)
    this.segmentLength = t2DGeometry.getDistance(this.pp, this.cp)
    this.stack.push({
      type: 'V',
      p0: this.pp,
      p1: this.cp,
      length: this.segmentLength,
      pointAt (f) {
        return t2DGeometry.linearTransitionBetweenPoints(this.p0, this.p1, f)
      }
    })
    this.length += this.segmentLength
    // this.stack.segmentLength += this.segmentLength;
  }

  function l (cmd) {
    const temp = relative(cmd, this.pp, {
      x: 0,
      y: 0
    })

    this.cp = addVectors(this.fetchXY(), temp)
    this.segmentLength = t2DGeometry.getDistance(this.pp, this.cp)
    this.stack.push({
      type: 'L',
      p0: this.pp,
      p1: this.cp,
      length: this.segmentLength,
      pointAt (f) {
        return t2DGeometry.linearTransitionBetweenPoints(this.p0, this.p1, f)
      }
    })
    // this.stack.segmentLength += this.segmentLength
    this.length += this.segmentLength
  }

  function h (cmd) {
    const temp = relative(cmd, this.pp, {
      x: 0,
      y: this.pp.y
    })
    this.cp = addVectors({
      x: parseFloat(this.pathArr[this.currPathArr += 1]),
      y: 0
    }, temp)

    this.segmentLength = t2DGeometry.getDistance(this.pp, this.cp)
    this.stack.push({
      type: 'H',
      p0: this.pp,
      p1: this.cp,
      length: this.segmentLength,
      pointAt (f) {
        return t2DGeometry.linearTransitionBetweenPoints(this.p0, this.p1, f)
      }
    })

    this.length += this.segmentLength
  }

  function z () {
    this.cp = this.start
    this.segmentLength = t2DGeometry.getDistance(this.pp, this.cp)
    this.stack.push({
      p0: this.pp,
      p1: this.cp,
      type: 'Z',
      length: this.segmentLength,
      pointAt (f) {
        return t2DGeometry.linearTransitionBetweenPoints(this.p0, this.p1, f)
      }
    })
    // this.stack.segmentLength += this.segmentLength
    this.length += this.segmentLength
  }

  function q (cmd) {
    const temp = relative(cmd, this.pp, {
      x: 0,
      y: 0
    })
    const cntrl1 = addVectors(this.fetchXY(), temp)
    const endPoint = addVectors(this.fetchXY(), temp)

    this.cp = endPoint

    this.segmentLength = t2DGeometry.bezierLength(this.pp, cntrl1, this.cp)

    this.cp = endPoint
    this.stack.push({
      type: 'Q',
      p0: this.pp,
      cntrl1,
      cntrl2: cntrl1,
      p1: this.cp,
      length: this.segmentLength,
      pointAt (f) {
        return t2DGeometry.bezierTransition(this.p0, this.cntrl1, this.p1, f)
      }
    })
    // this.stack.segmentLength += this.segmentLength;

    this.length += this.segmentLength
  }

  function c (cmd) {
    const temp = relative(cmd, this.pp, {
      x: 0,
      y: 0
    })
    const cntrl1 = addVectors(this.fetchXY(), temp)
    const cntrl2 = addVectors(this.fetchXY(), temp)
    const endPoint = addVectors(this.fetchXY(), temp)

    const co = t2DGeometry.cubicBezierCoefficients({
      p0: this.pp,
      cntrl1,
      cntrl2,
      p1: endPoint
    })

    this.cntrl = cntrl2
    this.cp = endPoint
    this.segmentLength = t2DGeometry.cubicBezierLength(this.pp, co)
    this.stack.push({
      type: 'C',
      p0: this.pp,
      cntrl1,
      cntrl2,
      p1: this.cp,
      length: this.segmentLength,
      pointAt (f) {
        return t2DGeometry.cubicBezierTransition(this.p0, co, f)
      }
    })
    // this.stack.segmentLength += this.segmentLength;
    this.length += this.segmentLength
  }

  function s (cmd) {
    const temp = relative(cmd, this.pp, {
      x: 0,
      y: 0
    })

    const cntrl1 = addVectors(this.pp, subVectors(this.pp, this.cntrl ? this.cntrl : this.pp))
    const cntrl2 = addVectors(this.fetchXY(), temp)
    const endPoint = addVectors(this.fetchXY(), temp)

    this.cp = endPoint
    this.segmentLength = t2DGeometry.cubicBezierLength(
      this.pp,
      t2DGeometry.cubicBezierCoefficients({
        p0: this.pp,
        cntrl1,
        cntrl2,
        p1: this.cp
      })
    )

    this.stack.push({
      type: 'S',
      p0: this.pp,
      cntrl1,
      cntrl2,
      p1: this.cp,
      length: this.segmentLength,
      pointAt (f) {
        return t2DGeometry.bezierTransition(this.p0, this.cntrl1, this.cntrl2, this.p1, f)
      }
    })
    // this.stack.segmentLength += this.segmentLength
    this.length += this.segmentLength
  }

  function a (cmd) {
    const temp = relative(cmd, this.pp, {
      x: 0,
      y: 0
    })
    const self = this
    const rx = parseFloat(this.pathArr[this.currPathArr += 1])
    const ry = parseFloat(this.pathArr[this.currPathArr += 1])
    const xRotation = parseFloat(this.pathArr[this.currPathArr += 1])
    const arcLargeFlag = parseFloat(this.pathArr[this.currPathArr += 1])
    const sweepFlag = parseFloat(this.pathArr[this.currPathArr += 1])
    const endPoint = addVectors(this.fetchXY(), temp)

    this.cp = endPoint

    const arcToQuad = t2DGeometry.arcToBezier({
      px: this.pp.x,
      py: this.pp.y,
      cx: endPoint.x,
      cy: endPoint.y,
      rx,
      ry,
      xAxisRotation: xRotation,
      largeArcFlag: arcLargeFlag,
      sweepFlag
    })

    arcToQuad.forEach((d, i) => {
      const pp = (i === 0 ? self.pp : {
        x: arcToQuad[0].x,
        y: arcToQuad[0].y
      })
      const cntrl1 = {
        x: d.x1,
        y: d.y1
      }
      const cntrl2 = {
        x: d.x2,
        y: d.y2
      }
      const cp = {
        x: d.x,
        y: d.y
      }
      const segmentLength = t2DGeometry.cubicBezierLength(pp, t2DGeometry.cubicBezierCoefficients({
        p0: pp,
        cntrl1,
        cntrl2,
        p1: cp
      }))
      self.stack.push({
        type: 'C',
        p0: pp,
        cntrl1,
        cntrl2,
        p1: cp,
        length: segmentLength,
        pointAt (f) {
          return t2DGeometry.bezierTransition(this.p0, this.cntrl1, this.cntrl2, this.p1, f)
        }

      })
      // self.stack.segmentLength += segmentLength
      self.length += segmentLength
    })
  }

  function Path (path) {
    this.path = path
    this.parse()
    this.stackGroup.push(this.stack)
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
    fetchXY
  }

  Path.prototype.parse = function parse () {
    this.currPathArr = -1
    this.stack = []
    this.length = 0
    this.pathArr = pathParser(this.path)

    this.stackGroup = []

    while (this.currPathArr < this.pathArr.length - 1) {
      this.case(this.pathArr[this.currPathArr += 1])
    }
    return this.stack
  }
  Path.prototype.getTotalLength = function getTotalLength () {
    return this.length
  }
  Path.prototype.getAngleAtLength = function getAngleAtLength (length, dir) {
    if (length > this.length) { return null }

    const point1 = this.getPointAtLength(length)
    const point2 = this.getPointAtLength(length + (dir === 'src' ? (-1 * length * 0.01) : (length * 0.01)))

    return Math.atan2(point2.y - point1.y, point2.x - point1.x)
  }
  Path.prototype.getPointAtLength = function getPointAtLength (length) {
    let coOr = { x: 0, y: 0 }
    let tLength = length
    this.stack.every((d, i) => {
      tLength -= d.length
      if (Math.floor(tLength) > 0) {
        return true
      }

      coOr = d.pointAt((d.length + tLength) / (d.length === 0 ? 1 : d.length))
      return false
    })
    return coOr
  }
  Path.prototype.isValid = function isValid (_) {
    return ['m', 'v', 'l', 'h', 'q', 'c', 's', 'a', 'z'].indexOf(_) !== -1
  }
  Path.prototype.case = function pCase (currCmd) {
    let currCmdI = currCmd
    if (this.isValid(currCmdI.toLowerCase())) {
      this.PC = currCmdI
    } else {
      currCmdI = this.PC
      this.currPathArr = this.currPathArr - 1
    }
    this.pp = this.cp
    switch (currCmdI.toLowerCase()) {
      case 'm':
        this.m(currCmdI)
        break
      case 'v':
        this.v(currCmdI)
        break
      case 'l':
        this.l(currCmdI)
        break
      case 'h':
        this.h(currCmdI)
        break
      case 'q':
        this.q(currCmdI)
        break
      case 'c':
        this.c(currCmdI)
        break
      case 's':
        this.s(currCmdI)
        break
      case 'a':
        this.a(currCmdI)
        break
      case 'z':
        this.z()
        break
      default:
        break
    }
  }

  const animate = function animate (self, targetConfig) {
    const callerExe = self
    const tattr = targetConfig.attr ? targetConfig.attr : {}
    const tstyles = targetConfig.styles ? targetConfig.styles : {}
    const runStack = []
    let value
    let key

    const attrs = tattr ? Object.keys(tattr) : []

    for (let i = 0; i < attrs.length; i += 1) {
      key = attrs[i]
      if (key !== 'transform') {
        if (key === 'd') {
          callerExe.morphTo(targetConfig)
        } else {
          runStack[runStack.length] = attrTransition(callerExe, key, tattr[key])
        }
      } else {
        value = tattr[key]
        if (typeof value === 'function') {
          runStack[runStack.length] = transitionSetAttr(callerExe, key, value)
        } else {
          const trans = callerExe.attr.transform
          if (!trans) {
            callerExe.attr.transform = {}
          }
          const subTrnsKeys = Object.keys(tattr.transform)
          for (let j = 0; j < subTrnsKeys.length; j += 1) {
            runStack[runStack.length] = transformTransition(
              callerExe,
              subTrnsKeys[j],
              tattr.transform[subTrnsKeys[j]]
            )
          }
        }
      }
    }

    const styles = tstyles ? Object.keys(tstyles) : []
    for (let i = 0; i < styles.length; i += 1) {
      runStack[runStack.length] = styleTransition(self, styles[i], tstyles[styles[i]])
    }

    return {
      run (f) {
        for (let j = 0; j < runStack.length; j += 1) {
          runStack[j](f)
        }
      },
      duration: targetConfig.duration,
      delay: targetConfig.delay ? targetConfig.delay : 0,
      end: targetConfig.end ? targetConfig.end.bind(self, self.dataObj) : null,
      loop: targetConfig.loop ? targetConfig.loop : 0,
      direction: targetConfig.direction ? targetConfig.direction : 'default'
    }
  }

  let transitionSetAttr = function transitionSetAttr (self, key, value) {
    return function inner (f) {
      self.setAttr(key, value.call(self, f))
    }
  }

  let transformTransition = function transformTransition (self, subkey, value) {
    const exe = []
    const trans = self.attr.transform
    if (typeof value === 'function') {
      return function inner (f) {
        self[subkey](value.call(self, f))
      }
    }
    value.forEach((tV, i) => {
      let val
      if (trans[subkey]) {
        if (trans[subkey][i] !== undefined) {
          val = trans[subkey][i]
        } else {
          val = (subkey === 'scale' ? 1 : 0)
        }
      } else {
        val = (subkey === 'scale' ? 1 : 0)
      }
      exe.push(t2DGeometry.intermediateValue.bind(
        null,
        val,
        tV
      ))
    })

    return function inner (f) {
      self[subkey](exe.map(d => d(f)))
    }
  }

  let attrTransition = function attrTransition (self, key, value) {
    if (typeof value === 'function') {
      return function setAttr_ (f) {
        self.setAttr(key, value.call(self, f))
      }
    }
    const exe = t2DGeometry.intermediateValue.bind(null, self.attr[key], value)
    return function setAttr_ (f) {
      self.setAttr(key, exe(f))
    }
  }

  let styleTransition = function styleTransition (self, key, value) {
    let srcValue
    let destUnit
    let destValue
    if (typeof value === 'function') {
      return function inner (f) {
        self.setStyle(key, value.call(self, self.dataObj, f))
      }
    }
    srcValue = self.styles[key]
    if (isNaN(value)) {
      if (value.startsWith('#') || value.startsWith('rgb') || value.startsWith('hsl')) {
        const colorExe = colorMap.transition(srcValue, value)
        return function inner (f) {
          self.setStyle(key, colorExe(f))
        }
      }
      srcValue = srcValue.match(/(\d+)/g)
      destValue = value.match(/(\d+)/g)
      destUnit = value.match(/\D+$/)

      srcValue = parseInt(srcValue.length > 0 ? srcValue[0] : 0, 10)
      destValue = parseInt(destValue.length > 0 ? destValue[0] : 0, 10)
      destUnit = destUnit.length > 0 ? destUnit[0] : 'px'
    } else {
      srcValue = (self.styles[key] !== undefined ? self.styles[key] : 1)
      destValue = value
      destUnit = 0
    }
    return function inner (f) {
      self.setStyle(key, t2DGeometry.intermediateValue(srcValue, destValue, f) + destUnit)
    }
  }

  const animateTo = function animateTo (targetConfig) {
    queueInstance.add(animeId(), animate(this, targetConfig), easying(targetConfig.ease))
    return this
  }

  const animateExe = function animateExe (targetConfig) {
    return animate(this, targetConfig)
  }

  function resolveObject (config, node, i) {
    let obj = {}
    const attrs = Object.keys(config)
    for (let j = 0; j < attrs.length; j += 1) {
      const key = attrs[j]
      if (key !== 'attr' && key !== 'styles' && key !== 'end') {
        if (typeof config[key] === 'function') {
          obj[key] = config[key].call(node, node.dataObj, i)
        } else {
          obj[key] = config[key]
        }
      }
    }
    return obj
  }

  const animateArrayTo = function animateArrayTo (config) {
    let node
    let newConfig

    for (let i = 0; i < this.stack.length; i += 1) {
      newConfig = {}
      node = this.stack[i]

      newConfig = resolveObject(config, node, i)
      if (config.attr) { newConfig.attr = resolveObject(config.attr, node, i) }
      if (config.styles) { newConfig.styles = resolveObject(config.styles, node, i) }
      if (config.end) { newConfig.end = config.end }
      if (config.ease) { newConfig.ease = config.ease }

      node.animateTo(newConfig)
    }
    return this
  }
  const animateArrayExe = function animateArrayExe (config) {
    let node
    let newConfig
    let exeArray = []

    for (let i = 0; i < this.stack.length; i += 1) {
      newConfig = {}
      node = this.stack[i]

      newConfig = resolveObject(config, node, i)
      if (config.attr) { newConfig.attr = resolveObject(config.attr, node, i) }
      if (config.styles) { newConfig.styles = resolveObject(config.styles, node, i) }
      if (config.end) { newConfig.end = config.end }
      if (config.ease) { newConfig.ease = config.ease }

      exeArray.push(node.animateExe(newConfig))
    }
    return exeArray
  }

  const animatePathArrayTo = function animatePathArrayTo (config) {
    let node
    for (let i = 0; i < this.stack.length; i += 1) {
      node = this.stack[i]
      node.animatePathTo(config)
    }
  }

  const textArray = function textArray (value) {
    let node
    if (typeof value !== 'function') {
      for (let i = 0; i < this.stack.length; i += 1) {
        node = this.stack[i]
        node.text(value)
      }
    } else {
      for (let i = 0; i < this.stack.length; i += 1) {
        node = this.stack[i]
        node.text(value.call(node, node.dataObj, i))
      }
    }

    return this
  }

  const morphTo = function morphTo (targetConfig) {
    const self = this
    const { duration } = targetConfig
    // const delay = targetConfig.delay ? targetConfig.delay : 0;
    const { ease } = targetConfig
    // const end = targetConfig.end ? targetConfig.end : null
    const loop = targetConfig.loop ? targetConfig.loop : 0
    const direction = targetConfig.direction ? targetConfig.direction : 'default'
    const destD = targetConfig.attr.d ? targetConfig.attr.d : self.attr.d

    // const Id = 0
    // let prevSrc;
    // let preDest;
    let srcPath = (new Path(self.attr.d)).stackGroup
    let destPath = (new Path(destD)).stackGroup

    const chainInstance = chain.parallelChain()
      .ease(ease)
      .duration(duration)
      .loop(loop)
      .direction(direction)

    self.arrayStack = []

    if (srcPath.length > 1) {
      srcPath = srcPath.sort((aa, bb) => bb.segmentLength - aa.segmentLength)
    }
    if (destPath.length > 1) {
      destPath = destPath.sort((aa, bb) => bb.segmentLength - aa.segmentLength)
    }

    const maxGroupLength = srcPath.length > destPath.length ? srcPath.length : destPath.length

    mapper(toCubicCurves(srcPath[0]), toCubicCurves(destPath[0]))

    for (let j = 1; j < maxGroupLength; j += 1) {
      if (srcPath[j]) {
        mapper(toCubicCurves(srcPath[j]), [{
          type: 'M',
          p0: srcPath[j][0].p0
        }])
      }
      if (destPath[j]) {
        mapper([{
          type: 'M',
          p0: destPath[j][0].p0
        }], toCubicCurves(destPath[j]))
      }
    }

    chainInstance.duration(duration)
      .add(self.arrayStack)
      .ease(ease)
      .loop(loop)
      .direction(direction)
      .commit()

    // function generateStackId () {
    //   return (Id++)
    // }

    function toCubicCurves (stack) {
      if (!stack.length) { return }
      const _ = stack
      const mappedArr = []
      for (let i = 0; i < _.length; i += 1) {
        if (['M', 'C', 'S', 'Q'].indexOf(_[i].type) !== -1) {
          mappedArr.push(_[i])
        } else if (['V', 'H', 'L', 'Z'].indexOf(_[i].type) !== -1) {
          const ctrl1 = {
            x: (_[i].p0.x + _[i].p1.x) / 2,
            y: (_[i].p0.y + _[i].p1.y) / 2
          }
          mappedArr.push({
            p0: _[i].p0,
            cntrl1: ctrl1,
            cntrl2: ctrl1,
            p1: _[i].p1,
            type: 'C',
            length: _[i].length
          })
        } else {
          // console.log('wrong cmd type')
        }
      }
      return mappedArr
    }

    function buildMTransitionobj (src, dest) {
      chainInstance.add({
        run (f) {
          const point = this.pointTansition(f)
          self.arrayStack[this.id] = `M${point.x},${point.y}`
          self.setAttr('d', self.arrayStack.join(''))
        },
        id: generateStackId(),
        pointTansition: t2DGeometry.linearTransitionBetweenPoints.bind(null, src.p0, dest.p0)
      })
    }

    function buildTransitionObj (src, dest) {
      chainInstance.add({
        run (f) {
          const t = this
          const c1 = t.ctrl1Transition(f)
          const c2 = t.ctrl2Transition(f)
          const p1 = t.destTransition(f)

          self.arrayStack[this.id] = ` C${c1.x},${c1.y} ${c2.x},${c2.y} ${p1.x},${p1.y}`
          self.setAttr('d', self.arrayStack.join(''))
        },
        id: generateStackId(),
        srcTransition: t2DGeometry.linearTransitionBetweenPoints.bind(
          null,
          src.p0,
          dest.p0
        ),
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
        destTransition: t2DGeometry.linearTransitionBetweenPoints.bind(
          null,
          src.p1,
          dest.p1
        )
      })
    }

    function normalizeCmds (cmd, n) {
      if (cmd.length === n) { return cmd }
      const totalLength = cmd.reduce((pp, cc) => pp + cc.length, 0)
      const arr = []

      for (let i = 0; i < cmd.length; i += 1) {
        const len = cmd[i].length
        let counter = Math.floor((n / totalLength) * len)
        if (counter <= 1) {
          arr.push(cmd[i])
        } else {
          let t = cmd[i]
          let split
          while (counter > 1) {
            const cmdX = t
            split = splitBezier([cmdX.p0, cmdX.cntrl1, cmdX.cntrl2, cmdX.p1].slice(0), 1 / counter)
            arr.push({
              p0: cmdX.p0,
              cntrl1: split.b1[0],
              cntrl2: split.b1[1],
              p1: split.b1[2],
              type: 'C'
            })
            t = {
              p0: split.b1[2],
              cntrl1: split.b2[0],
              cntrl2: split.b2[1],
              p1: split.b2[2],
              type: 'C'
            }
            counter -= 1
          }
          arr.push(t)
        }
      }
      return arr
    }

    function splitBezier (arr, perc) {
      const coll = []
      const arrayLocal = arr
      while (arrayLocal.length > 0) {
        for (let i = 0; i < arrayLocal.length - 1; i += 1) {
          coll.unshift(arrayLocal[i])
          arrayLocal[i] = interpolate(arrayLocal[i], arrayLocal[i + 1], perc)
        }
        coll.unshift(arrayLocal.pop())
      }
      return {
        b1: [{
          x: coll[5].x,
          y: coll[5].y
        }, {
          x: coll[2].x,
          y: coll[2].y
        }, {
          x: coll[0].x,
          y: coll[0].y
        }],
        b2: [{
          x: coll[1].x,
          y: coll[1].y
        }, {
          x: coll[3].x,
          y: coll[3].y
        }, {
          x: coll[6].x,
          y: coll[6].y
        }]
      }
    }

    function interpolate (p0, p1, percent) {
      return {
        x: p0.x + (p1.x - p0.x) * (percent !== undefined ? percent : 0.5),
        y: p0.y + (p1.y - p0.y) * (percent !== undefined ? percent : 0.5)
      }
    }

    // function getRightBeginPoint (src, dest) {
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

    function getDirection (data) {
      let dir = 0

      for (let i = 0; i < data.length; i += 1) {
        if (data[i].type !== 'M') { dir += (data[i].p1.x - data[i].p0.x) * (data[i].p1.y + data[i].p0.y) }
      }

      return dir
    }

    function reverse (data) {
      const dataLocal = data.reverse()
      const newArray = [{
        type: 'M',
        p0: dataLocal[0].p1
      }]

      dataLocal.forEach((d) => {
        if (d.type === 'C') {
          const dLocal = d
          const tp0 = dLocal.p0
          const tc1 = dLocal.cntrl1
          dLocal.p0 = d.p1
          dLocal.p1 = tp0
          dLocal.cntrl1 = d.cntrl2
          dLocal.cntrl2 = tc1

          newArray.push(dLocal)
        }
      })
      return newArray
    }

    function centroid (path) {
      let sumX = 0
      let sumY = 0
      let counterX = 0
      let counterY = 0

      path.forEach((d) => {
        if (d.p0) {
          sumX += d.p0.x
          sumY += d.p0.y
          counterX += 1
          counterY += 1
        }
        if (d.p1) {
          sumX += d.p1.x
          sumY += d.p1.y
          counterX += 1
          counterY += 1
        }
      })

      return {
        x: sumX / counterX,
        y: sumY / counterY
      }
    }

    function getQuadrant (centroidP, point) {
      if (point.x >= centroidP.x && point.y <= centroidP.y) {
        return 1
      } else if (point.x <= centroidP.x && point.y <= centroidP.y) {
        return 2
      } else if (point.x <= centroidP.x && point.y >= centroidP.y) {
        return 3
      }
      return 4
    }

    function getSrcBeginPoint (src, dest) {
      const centroidOfSrc = centroid(src)
      const centroidOfDest = centroid(dest)
      const srcArr = src
      const destArr = dest
      for (let i = 0; i < src.length; i += 1) {
        srcArr[i].quad = getQuadrant(centroidOfSrc, src[i].p0)
      }
      for (let i = 0; i < dest.length; i += 1) {
        destArr[i].quad = getQuadrant(centroidOfDest, dest[i].p0)
      }
      // src.forEach((d) => {
      //   d.quad =
      // })
      // dest.forEach((d) => {
      //   d.quad = getQuadrant(centroidOfDest, d.p0)
      // })

      // let srcStartingIndex = -1;
      // let secSrcStartIndex = -1;
      // let destStartingIndex = -1;
      // let secDestStartIndex = -1;
      let minDistance = 0
      // let secminDistance = Infinity;

      src.forEach((d, i) => {
        const dis = t2DGeometry.getDistance(d.p0, centroidOfSrc)
        if ((d.quad === 1 && dis >= minDistance)) {
          minDistance = dis
          // srcStartingIndex = i
        }
      })
      minDistance = 0
      // secminDistance = Infinity
      dest.forEach((d, i) => {
        const dis = t2DGeometry.getDistance(d.p0, centroidOfDest)
        if (d.quad === 1 && dis > minDistance) {
          minDistance = dis
          // destStartingIndex = i
        }
      })

      return {
        src: setStartingPoint(src, 0), // srcStartingIndex
        dest: setStartingPoint(dest, 0), // destStartingIndex
        srcCentroid: centroidOfSrc,
        destCentroid: centroidOfDest
      }
    }

    function setStartingPoint (path, closestPoint) {
      if (closestPoint <= 0) { return path }
      let pathLocal = path
      const subSet = pathLocal.splice(0, closestPoint)
      subSet.shift()
      pathLocal = pathLocal.concat(subSet)
      pathLocal.unshift({
        type: 'M',
        p0: pathLocal[0].p0
      })
      pathLocal.push({
        type: 'M',
        p0: pathLocal[0].p0
      })

      return pathLocal
    }

    function mapper (sExe, dExe) {
      let nsExe
      let ndExe
      let maxLength = sExe.length > dExe.length ? sExe.length : (dExe.length)

      if (dExe.length > 2 && sExe.length > 2) {
        if (maxLength > 50) {
          maxLength += 30
        } else {
          maxLength = (maxLength >= 20 ? maxLength + 15 : maxLength + 4)
        }
        nsExe = normalizeCmds(sExe, maxLength)
        ndExe = normalizeCmds(dExe, maxLength)
      } else {
        nsExe = sExe
        ndExe = dExe
      }
      // prevSrc = nsExe[nsExe.length - 1]
      // preDest = ndExe[ndExe.length - 1]

      if (getDirection(nsExe) < 0) { nsExe = reverse(nsExe) }
      if (getDirection(ndExe) < 0) { ndExe = reverse(ndExe) }

      const res = getSrcBeginPoint(nsExe, ndExe, this)
      nsExe = res.src.length > 1 ? res.src : [{
        type: 'M',
        p0: res.destCentroid
      }]
      ndExe = res.dest.length > 1 ? res.dest : [{
        type: 'M',
        p0: res.srcCentroid
      }]

      const length = ndExe.length < nsExe.length ? nsExe.length : ndExe.length

      for (let i = 0; i < nsExe.length; i += 1) {
        nsExe[i].index = i
      }
      for (let i = 0; i < ndExe.length; i += 1) {
        ndExe[i].index = i
      }
      for (let i = 0; i < length; i += 1) {
        const sP0 = nsExe[nsExe.length - 1].p0 ? nsExe[nsExe.length - 1].p0
          : nsExe[nsExe.length - 1].p1
        const dP0 = ndExe[ndExe.length - 1].p0 ? ndExe[ndExe.length - 1].p0
          : ndExe[ndExe.length - 1].p1
        const sCmd = nsExe[i] ? nsExe[i] : {
          type: 'C',
          p0: sP0,
          p1: sP0,
          cntrl1: sP0,
          cntrl2: sP0,
          length: 0
        }
        const dCmd = ndExe[i] ? ndExe[i] : {
          type: 'C',
          p0: dP0,
          p1: dP0,
          cntrl1: dP0,
          cntrl2: dP0,
          length: 0
        } // ndExe[ndExe.length - 1]

        if (sCmd.type === 'M' && dCmd.type === 'M') {
          buildMTransitionobj(sCmd, dCmd)
        } else if (sCmd.type === 'M' || dCmd.type === 'M') {
          if (sCmd.type === 'M') {
            buildTransitionObj({
              type: 'C',
              p0: sCmd.p0,
              p1: sCmd.p0,
              cntrl1: sCmd.p0,
              cntrl2: sCmd.p0,
              length: 0
            }, dCmd)
          } else {
            buildTransitionObj(sCmd, {
              type: 'C',
              p0: dCmd.p0,
              p1: dCmd.p0,
              cntrl1: dCmd.p0,
              cntrl2: dCmd.p0,
              length: 0
            })
          }
        } else { buildTransitionObj(sCmd, dCmd) }
      }
    }
  }

  const animatePathTo = function animatePathTo (targetConfig) {
    const self = this
    const {
      duration, ease, end, loop, direction, d
    } = targetConfig
    const src = d || self.attr.d
    let totalLength = 0

    self.arrayStack = []

    if (!src) { throw Error('Path Not defined') }

    const chainInstance = chain.sequenceChain()
    const pathInstance = new Path(src)
    // console.log(pathInstance)
    const arrExe = pathInstance.stackGroup.reduce((p, c) => {
      p = p.concat(c)
      return p
    }, [])
    const mappedArr = []

    for (let i = 0; i < arrExe.length; i += 1) {
      if (arrExe[i].type === 'Z') {
        mappedArr.push({
          run () {
            self.arrayStack.splice(this.id, self.arrayStack.length - 1 - self.id)
            self.arrayStack[this.id] = this.render()
            self.setAttr('d', self.arrayStack.join(''))
          },
          id: i,
          render () {
            return 'z'
          },
          length: 0
        })
        totalLength += 0
      } else if (['V', 'H', 'L'].indexOf(arrExe[i].type) !== -1) {
        mappedArr.push({
          run (f) {
            self.arrayStack.splice(this.id, self.arrayStack.length - 1 - self.id)
            self.arrayStack[this.id] = this.render(f)
            self.setAttr('d', self.arrayStack.join(''))
          },
          id: i,
          render: linearTransitionBetweenPoints.bind(self, arrExe[i].p0, arrExe[i].p1),
          length: arrExe[i].length
        })
        totalLength += arrExe[i].length
      } else if (arrExe[i].type === 'Q') {
        mappedArr.push({
          run (f) {
            self.arrayStack.splice(this.id, self.arrayStack.length - 1 - self.id)
            self.arrayStack[this.id] = this.render(f)
            self.setAttr('d', self.arrayStack.join(''))
          },
          id: i,
          render: bezierTransition.bind(self, arrExe[i].p0, arrExe[i].cntrl1, arrExe[i].p1),
          length: arrExe[i].length
        })
        totalLength += arrExe[i].length
      } else if (arrExe[i].type === 'C' || arrExe[i].type === 'S') {
        const co = t2DGeometry.cubicBezierCoefficients(arrExe[i])
        mappedArr.push({
          run (f) {
            self.arrayStack.splice(this.id, self.arrayStack.length - 1 - self.id)
            self.arrayStack[this.id] = this.render(f)
            self.setAttr('d', self.arrayStack.join(''))
          },
          id: i,
          co,
          render: cubicBezierTransition.bind(
            self,
            arrExe[i].p0,
            arrExe[i].cntrl1,
            arrExe[i].cntrl2,
            co
          ),
          length: arrExe[i].length
        })
        totalLength += arrExe[i].length
      } else if (arrExe[i].type === 'M') {
        mappedArr.push({
          run () {
            self.arrayStack.splice(this.id, self.arrayStack.length - 1 - self.id)
            self.arrayStack[this.id] = this.render()
            self.setAttr('d', self.arrayStack.join(''))
          },
          id: i,
          render: buildMoveTo.bind(self, arrExe[i].p0),
          length: 0
        })
        totalLength += 0
      } else {
        // console.log('M Or Other Type')
      }
    }

    mappedArr.forEach(function (d) {
      d.duration = (d.length / totalLength) * duration
    })

    chainInstance.duration(duration)
      .add(mappedArr)
      .ease(ease)
      .loop(loop || 0)
      .direction(direction || 'default')

    if (typeof end === 'function') { chainInstance.end(end.bind(self)) }

    chainInstance.commit()

    return this
  }

  let cubicBezierTransition = function cubicBezierTransition (p0, c1, c2, co, f) {
    const c1Temp = {
      x: (p0.x + ((c1.x - p0.x)) * f),
      y: (p0.y + ((c1.y - p0.y)) * f)
    }
    const c2Temp = {
      x: (c1.x + ((c2.x - c1.x)) * f),
      y: (c1.y + ((c2.y - c1.y)) * f)
    }

    let cmd = ''
    cmd += `C${c1Temp.x},${c1Temp.y} `
    cmd += `${c1Temp.x + ((c2Temp.x - c1Temp.x)) * f},${c1Temp.y + ((c2Temp.y - c1Temp.y)) * f} `
    cmd += `${co.ax * t2DGeometry.pow(f, 3) + co.bx * t2DGeometry.pow(f, 2) + co.cx * f + p0.x},${co.ay * t2DGeometry.pow(f, 3) + co.by * t2DGeometry.pow(f, 2) + co.cy * f + p0.y}`

    return cmd
  }

  let bezierTransition = function bezierTransition (p0, p1, p2, f) {
    return `M${p0.x},${p0.y} ` +
            `Q${p0.x + ((p1.x - p0.x)) * f},${p0.y + ((p1.y - p0.y)) * (f)} ${
              (p0.x - 2 * p1.x + p2.x) * f * f + (2 * p1.x - 2 * p0.x) * f + p0.x},${(p0.y - 2 * p1.y + p2.y) * f * f + (2 * p1.y - 2 * p0.y) * f + p0.y}`
  }

  let linearTransitionBetweenPoints = function linearTransitionBetweenPoints (p1, p2, f) {
    return ` L${p1.x + ((p2.x - p1.x)) * f},${p1.y + ((p2.y - p1.y)) * (f)}`
  }

  let buildMoveTo = function buildMoveTo (p0) {
    return `M${p0.x},${p0.y}`
  }

  // const buildCubicBazierCurveTo = function buildCubicBazierCurveTo (p0, c1, c2, p1) {
  //   return `C${c1.x},${c1.y
  //   },${c2.x},${c2.y
  //   },${p1.x},${p1.y}`
  // }

  function DomGradients (config, type, pDom) {
    this.config = config
    this.type = type || 'linear'
    this.pDom = pDom
  }
  DomGradients.prototype.exe = function exe () {
    return `url(#${this.config.id})`
  }
  DomGradients.prototype.linearGradient = function linearGradient () {
    const self = this

    if (!this.defs) { this.defs = this.pDom.createEl({ el: 'defs' }) }

    this.linearEl = this.defs.join([1], 'linearGradient', {
      action: {
        new (data) {
          this.createEls(data, {
            el: 'linearGradient'
          })
        },
        old (oldNodes, oldData) {
          oldNodes.remove()
        }
      }
    }).setAttr({
      id: self.config.id,
      x1: `${self.config.x1}%`,
      y1: `${self.config.y1}%`,
      x2: `${self.config.x2}%`,
      y2: `${self.config.y2}%`
    })

    this.linearEl.fetchEls('stop').remove()

    this.linearEl.createEls(this.config.colorStops, {
      el: 'stop',
      attr: {
        offset (d, i) { return `${d.value}%` },
        'stop-color': function stopColor (d, i) { return d.color }
      }
    })

    return this
  }

  DomGradients.prototype.radialGradient = function radialGradient () {
    const self = this

    if (!this.defs) { this.defs = this.pDom.createEl({ el: 'defs' }) }

    this.radialEl = this.defs.join([1], 'radialGradient', {
      action: {
        new (data) {
          this.createEls(data, {
            el: 'radialGradient'
          })
        },
        old (oldNodes, oldData) {
          oldNodes.remove()
        }
      }
    }).setAttr({
      id: self.config.id,
      cx: `${self.config.innerCircle.x}%`,
      cy: `${self.config.innerCircle.y}%`,
      r: `${self.config.outerCircle.r}%`,
      fx: `${self.config.outerCircle.x}%`,
      fy: `${self.config.outerCircle.y}%`
    })

    this.radialEl.fetchEls('stop').remove()

    this.radialEl.createEls(this.config.colorStops, {
      el: 'stop',
      attr: {
        offset (d, i) { return `${d.value}%` },
        'stop-color': function stopColor (d, i) { return d.color }
      }
    })

    return this
  }
  DomGradients.prototype.colorStops = function colorStops (colorSts) {
    if (Object.prototype.toString.call(colorSts) !== '[object Array]') {
      return false
    }

    this.config.colorStops = colorSts

    if (this.type === 'linear') {
      return this.linearGradient()
    } else if (this.type === 'radial') {
      return this.radialGradient()
    }
    return false
  }

  const nameSpace = {
    svg: 'http://www.w3.org/2000/svg',
    xlink: 'http://www.w3.org/1999/xlink',
    xhtml: 'http://www.w3.org/1999/xhtml'
  }

  const buildDom = function buildSVGElement (ele) {
    return document.createElementNS(nameSpace.svg, ele)
  }

  const DomExe = function DomExe (dom, _, id, vDomIndex) {
    this.dom = dom
    this.nodeName = dom.nodeName
    this.attr = _.attr ? _.attr : {}
    this.changedAttribute = this.attr
    this.styles = _.styles ? _.styles : {}
    this.changedStyles = this.styles
    this.id = id
    this.nodeType = 'svg'
    this.dom.nodeId = id
    this.attrChanged = true
    this.styleChanged = true
    this.children = []
    this.vDomIndex = vDomIndex
    queueInstance.vDomChanged(this.vDomIndex)
  }
  DomExe.prototype.node = function node () {
    this.execute()
    return this.dom
  }
  let styles,
    attrs,
    transforms,
    trnX
  DomExe.prototype.transFormAttributes = function transFormAttributes () {
    let NS
    const self = this

    attrs = Object.keys(self.changedAttribute)
    for (let i = 0; i < attrs.length; i += 1) {
      if (attrs[i] !== 'transform') {
        if (attrs[i].indexOf(':') !== -1) {
          NS = attrs[i].split(':')
          self.dom.setAttributeNS(nameSpace[NS[0]], attrs[i], this.changedAttribute[attrs[i]])
        } else {
          self.dom.setAttribute(attrs[i], this.changedAttribute[attrs[i]])
        }
      }
    }

    if (this.changedAttribute.transform) {
      let cmd = ''
      transforms = Object.keys(this.attr.transform)
      for (let i = 0; i < transforms.length; i += 1) {
        trnX = transforms[i]
        if (trnX === 'rotate') {
          // if (!this.attr.transform[trnX][1]) {
          //   const boundingBox = this.dom.getBBox()
          //   this.attr.transform[trnX][1] = boundingBox.x + boundingBox.width / 2
          //   this.attr.transform[trnX][2] = boundingBox.y + boundingBox.height / 2
          // }
          cmd += `${trnX}(${this.attr.transform[trnX].join(' ')}) `
        } else if (trnX === 'translate') {
          cmd += `translate(${this.attr.transform[trnX].join(' ')}) `
        } else if (trnX === 'scale') {
          cmd += `${trnX}(${this.attr.transform[trnX].join(' ')}) `
        } else {
          cmd += `${trnX}(${this.attr.transform[trnX].join(' ')}) `
        }
      }
      this.dom.setAttribute('transform', cmd)
    }

    this.changedAttribute = {}

    styles = Object.keys(this.changedStyles)

    for (let i = 0; i < styles.length; i += 1) {
      if (this.changedStyles[styles[i]] instanceof DomGradients) {
        this.changedStyles[styles[i]] = this.changedStyles[styles[i]].exe()
      }
      this.dom.style[styles[i]] = this.changedStyles[styles[i]]
    }

    this.changedStyles = {}
  }
  DomExe.prototype.scale = function DMscale (XY) {
    if (!this.attr.transform) { this.attr.transform = {} }
    this.attr.transform.scale = [XY[0], XY[0]]
    if (this.changedAttribute.transform) {
      this.changedAttribute.transform.scale = [XY[0], XY[0]]
    } else {
      this.changedAttribute.transform = {}
      this.changedAttribute.transform.scale = [XY[0], XY[0]]
    }
    queueInstance.vDomChanged(this.vDomIndex)
    return this
  }
  DomExe.prototype.skewX = function DMskewX (x) {
    if (!this.attr.transform) { this.attr.transform = {} }
    this.attr.transform.skewX = [x]
    if (this.changedAttribute.transform) { this.changedAttribute.transform.skewX = [x] } else {
      this.changedAttribute.transform = {}
      this.changedAttribute.transform.skewX = [x]
    }
    queueInstance.vDomChanged(this.vDomIndex)
    return this
  }
  DomExe.prototype.skewY = function DMskewY (y) {
    if (!this.attr.transform) { this.attr.transform = {} }
    this.attr.transform.skewY = [y]
    if (this.changedAttribute.transform) { this.changedAttribute.transform.skewY = [y] } else {
      this.changedAttribute.transform = {}
      this.changedAttribute.transform.skewY = [y]
    }
    queueInstance.vDomChanged(this.vDomIndex)
    return this
  }

  DomExe.prototype.translate = function DMtranslate (XY) {
    if (!this.attr.transform) { this.attr.transform = {} }
    this.attr.transform.translate = XY
    if (this.changedAttribute.transform) { this.changedAttribute.transform.translate = XY } else {
      this.changedAttribute.transform = {}
      this.changedAttribute.transform.translate = XY
    }
    queueInstance.vDomChanged(this.vDomIndex)
    return this
  }
  DomExe.prototype.rotate = function DMrotate (angle, x, y) {
    if (!this.attr.transform) { this.attr.transform = {} }
    this.attr.transform.rotate = [angle % 360, x ? x : 0, y ? y : 0]
    if (this.changedAttribute.transform) {
      this.changedAttribute.transform.rotate = this.attr.transform.rotate
    } else {
      this.changedAttribute.transform = {}
      this.changedAttribute.transform.rotate = this.attr.transform.rotate
    }
    queueInstance.vDomChanged(this.vDomIndex)
    return this
  }
  DomExe.prototype.setStyle = function DMsetStyle (attr, value) {
    if (arguments.length === 2) {
      if (typeof value === 'function') {
        value = value.call(this, this.dataObj)
      }
      this.styles[attr] = value
      this.changedStyles[attr] = value
    } else if (arguments.length === 1 && typeof attr === 'object') {
      const styleAttrs = Object.keys(attr)

      for (let i = 0; i < styleAttrs.length; i += 1) {
        const key = styleAttrs[i]
        this.styles[key] = attr[key]
        this.changedStyles[key] = attr[key]
      }
    }

    this.styleChanged = true
    queueInstance.vDomChanged(this.vDomIndex)
    return this
  }
  DomExe.prototype.setAttr = function DMsetAttr (attr, value) {
    if (arguments.length === 2) {
      this.attr[attr] = value
      this.changedAttribute[attr] = value
    } else if (arguments.length === 1 && typeof attr === 'object') {
      const props = Object.keys(attr)
      for (let i = 0; i < props.length; i += 1) {
        const key = props[i]
        this.attr[key] = attr[key]
        this.changedAttribute[key] = attr[key]
      }
    }

    this.attrChanged = true
    queueInstance.vDomChanged(this.vDomIndex)

    return this
  }
  DomExe.prototype.getAttr = function DMgetAttribute (_) {
    return this.attr[_]
  }
  DomExe.prototype.execute = function DMexecute () {
    if ((!this.styleChanged && !this.attrChanged)) {
      for (let i = 0; i < this.children.length; i += 1) {
        this.children[i].execute()
      }
      return
    }
    this.transFormAttributes()

    for (let i = 0; i < this.children.length; i += 1) {
      this.children[i].execute()
    }
  }
  DomExe.prototype.child = function DMchild (nodes) {
    const parent = this.dom
    const self = this
    // if (parent.nodeName === 'g' || parent.nodeName === 'svg') {
    if (nodes instanceof CreateElements) {
      nodes.stack.forEach((d) => {
        parent.appendChild(d.dom)
        d.parentNode = self
      })
      this.children = this.children.concat(nodes.stack)
    } else if (nodes instanceof DomExe) {
      parent.appendChild(nodes.dom)
      nodes.parentNode = self
      this.children.push(nodes)
    } else {
      console.log('wrong node type')
    }

    return this
  }
  DomExe.prototype.fetchEl = cfetchEl
  DomExe.prototype.fetchEls = cfetchEls
  DomExe.prototype.animateTo = animateTo
  DomExe.prototype.animateExe = animateExe
  DomExe.prototype.animatePathTo = animatePathTo
  DomExe.prototype.morphTo = morphTo

  DomExe.prototype.createRadialGradient = function DMcreateRadialGradient (config) {
    const gradientIns = new DomGradients(config, 'radial', this)
    gradientIns.radialGradient()
    return gradientIns
  }
  DomExe.prototype.createLinearGradient = function DMcreateLinearGradient (config) {
    const gradientIns = new DomGradients(config, 'linear', this)
    gradientIns.linearGradient()
    return gradientIns
  }

  DomExe.prototype.join = dataJoin

  DomExe.prototype.on = function DMon (eventType, hndlr) {
    const hnd = hndlr.bind(this)

    this.dom.addEventListener(eventType, (event) => { hnd({ data: 'sample' }, event) })

    return this
  }

  DomExe.prototype.html = function DMhtml (value) {
    if (!arguments.length) { return this.dom.innerHTML }
    this.dom.innerHTML(value)
    return this
  }
  DomExe.prototype.text = function DMtext (value) {
    if (!arguments.length) { return this.dom.textContent }
    this.dom.textContent = value
    return this
  }

  DomExe.prototype.remove = function DMremove () {
    this.parentNode.removeChild(this)
    this.removed = true
  }
  DomExe.prototype.createEls = function DMcreateEls (data, config) {
    const e = new CreateElements({ type: 'SVG' }, data, config, this.vDomIndex)
    this.child(e)
    queueInstance.vDomChanged(this.vDomIndex)
    return e
  }
  DomExe.prototype.createEl = function DMcreateEl (config) {
    const e = createDomElement(config, this.vDomIndex)
    this.child(e)
    queueInstance.vDomChanged(this.vDomIndex)
    return e
  }
  DomExe.prototype.removeChild = function DMremoveChild (obj) {
    let index = -1
    // let removedNode

    const { children } = this
    for (let i = 0; i < children.length; i += 1) {
      if (obj === children[i]) {
        index = i
        this.dom.removeChild(children[i].dom)
      }
    }
    if (index > -1) {
      for (let i = index; i < children.length - 1; i += 1) {
        children[i] = children[i + 1]
      }
      children.length -= 1
    }

    queueInstance.vDomChanged(this.vDomIndex)
  }

  function createDomElement (obj, vDomIndex) {
    let dom = null
    // let node

    switch (obj.el) {
      case 'group':
        dom = buildDom('g')
        break
      default:
        dom = buildDom(obj.el)
        break
    }

    const node = new DomExe(dom, obj, domId(), vDomIndex)
    if (obj.dataObj) { dom.dataObj = obj.dataObj }
    if (obj.styles) { node.setStyle(obj.styles) }
    if (obj.attr) { node.setAttr(obj.attr) }

    return node
  }

  function cRender (attr) {
    const self = this

    if (attr.transform) {
      const { transform } = attr
      const hozScale = transform.scale && transform.scale.length > 0 ? transform.scale[0] : 1
      const verScale = transform.scale && transform.scale.length > 1
        ? transform.scale[1] : hozScale || 1
      const hozSkew = transform.skewX ? transform.skewX[0] : 0
      const verSkew = transform.skewY ? transform.skewY[0] : 0
      const hozMove = transform.translate && transform.translate.length > 0
        ? transform.translate[0] : 0
      const verMove = transform.translate && transform.translate.length > 1
        ? transform.translate[1] : hozMove || 0

      self.ctx.transform(hozScale, hozSkew, verSkew, verScale, hozMove, verMove)
      // self.ctx.save()
      if (transform.rotate) {
        self.ctx.translate(transform.cx, transform.cy)
        self.ctx.rotate(transform.rotate * (Math.PI / 180))
        self.ctx.translate(-(transform.cx), -(transform.cy))
      }
      // self.ctx.restore()
    }
    for (let i = 0; i < self.stack.length; i += 1) {
      self.stack[i].execute()
    }
  }

  function domSetAttribute (attr, value) {
    if (value !== undefined) {
      this.attr[attr] = value
    } else {
      delete this.attr[attr]
    }
  }

  function domSetStyle (attr, value) {
    if (value !== undefined) {
      this.styles[attr] = value
    } else {
      delete this.styles[attr]
    }
  }

  function CanvasGradients (config, type) {
    this.config = config
    this.type = type || 'linear'
  }
  CanvasGradients.prototype.exe = function GRAexe (ctx, BBox) {
    if (this.type === 'linear') { return this.linearGradient(ctx, BBox) } else if (this.type === 'radial') { return this.radialGradient(ctx, BBox) }
    console.Error('wrong Gradiant type')
  }
  CanvasGradients.prototype.linearGradient = function GRAlinearGradient (ctx, BBox) {
    const lGradient = ctx.createLinearGradient(
      BBox.x + BBox.width * (this.config.x1 / 100), BBox.y + BBox.height * (this.config.y1 / 100),
      BBox.x + BBox.width * (this.config.x2 / 100), BBox.y + BBox.height * (this.config.y2 / 100)
    )

    this.config.colorStops.forEach((d) => {
      lGradient.addColorStop((d.value / 100), d.color)
    })

    return lGradient
  }
  CanvasGradients.prototype.radialGradient = function GRAradialGradient (ctx, BBox) {
    const cGradient = ctx.createRadialGradient(
      BBox.x + BBox.width * (this.config.innerCircle.x / 100),
      BBox.y + BBox.height * (this.config.innerCircle.y / 100),
      BBox.width > BBox.height ? BBox.width * this.config.innerCircle.r / 100
        : BBox.height * this.config.innerCircle.r / 100,
      BBox.x + BBox.width * (this.config.outerCircle.x / 100),
      BBox.y + BBox.height * (this.config.outerCircle.y / 100),
      BBox.width > BBox.height ? BBox.width * this.config.outerCircle.r / 100
        : BBox.height * this.config.outerCircle.r / 100
    )

    this.config.colorStops.forEach((d) => {
      cGradient.addColorStop((d.value / 100), d.color)
    })

    return cGradient
  }
  CanvasGradients.prototype.colorStops = function GRAcolorStops (colorStopValues) {
    if (Object.prototype.toString.call(colorStopValues) !== '[object Array]') {
      return false
    }
    this.config.colorStops = colorStopValues
    return this
  }

  function createLinearGradient (config) {
    return new CanvasGradients(config, 'linear')
  }

  function createRadialGradient (config) {
    return new CanvasGradients(config, 'radial')
  }

  function pixelObject (data, width, height, x, y) {
    this.pixels = data
    this.width = width
    this.height = height
    this.x = x
    this.y = y
  }
  pixelObject.prototype.get = function (pos) {
    let rIndex = ((pos.y - 1) * (this.width * 4)) + ((pos.x - 1) * 4)
    return 'rgba(' + this.pixels[rIndex] + ', ' + this.pixels[rIndex + 1] + ', ' + this.pixels[rIndex + 2] + ', ' + this.pixels[rIndex + 3] + ')'
  }
  pixelObject.prototype.put = function (color, pos) {
    let rIndex = ((pos.y - 1) * (this.width * 4)) + ((pos.x - 1) * 4)
    this.pixels[rIndex] = color[0]
    this.pixels[rIndex + 1] = color[1]
    this.pixels[rIndex + 2] = color[2]
    this.pixels[rIndex + 3] = color[3]
    return this
  }

  function pixels (pixHndlr) {
    const tObj = this.rImageObj ? this.rImageObj : this.imageObj
    const tCxt = tObj.getContext('2d')
    const pixelData = tCxt.getImageData(0, 0, this.attr.width, this.attr.height)
    return pixHndlr(pixelData)
  }

  function getCanvasImgInstance (width, height) {
    const canvas = document.createElement('canvas')
    canvas.setAttribute('height', height)
    canvas.setAttribute('width', width)
    canvas.style.height = `${this.height}px`
    canvas.style.width = `${this.width}px`
    return canvas
  }

  function createCanvasPattern (patternObj, repeatInd) {
    const self = this
    // self.children = []
    // self.stack = [self]
  }
  createCanvasPattern.prototype = {
  }
  createCanvasPattern.prototype.setAttr = function CPsetAttr (attr, value) {
    // this.attr[attr] = value
  }
  createCanvasPattern.prototype.execute = function CPexecute () {
  }

  const imageDataMap = {}

  function RenderImage (ctx, props, stylesProps, onloadExe, onerrorExe, nodeExe) {
    const self = this
    self.ctx = ctx
    self.attr = props
    self.styles = stylesProps
    self.nodeName = 'Image'
    self.image = new Image()
    // self.image.crossOrigin="anonymous"
    // self.image.setAttribute('crossOrigin', '*');

    self.image.onload = function onload () {
      this.crossOrigin = 'anonymous'
      self.attr.height = self.attr.height ? self.attr.height : this.height
      self.attr.width = self.attr.width ? self.attr.width : this.width
      if (imageDataMap[self.attr.src]) {
        self.imageObj = imageDataMap[self.attr.src]
      } else {
        const im = getCanvasImgInstance(this.width, this.height)
        const ctxX = im.getContext('2d')
        ctxX.drawImage(this, 0, 0, this.width, this.height)

        self.imageObj = im
        imageDataMap[self.attr.src] = im
      }
      if (self.attr.clip) {
        let ctxX
        const {
          clip, width, height
        } = self.attr
        let {
          sx, sy, swidth, sheight
        } = clip
        if (!this.rImageObj) {
          self.rImageObj = getCanvasImgInstance(self.attr.width, self.attr.height)
        }
        ctxX = self.rImageObj.getContext('2d')

        sx = sx !== undefined ? sx : 0
        sy = sy !== undefined ? sy : 0
        swidth = swidth !== undefined ? swidth : width
        sheight = sheight !== undefined ? sheight : height
        ctxX.drawImage(
          self.imageObj, sx, sy, swidth, sheight, 0, 0, width, height
        )
      }

      if (self.attr.pixels) {
        let ctxX
        const {
          width, height
        } = self.attr
        if (!self.rImageObj) {
          self.rImageObj = getCanvasImgInstance(self.attr.width, self.attr.height)
          ctxX = self.rImageObj.getContext('2d')
          ctxX.drawImage(
            self.imageObj, 0, 0, width, height
          )
        }
        ctxX = self.rImageObj.getContext('2d')
        ctxX.putImageData(pixels.call(self, self.attr.pixels), 0, 0)
      }

      if (onloadExe && typeof onloadExe === 'function') {
        onloadExe.call(nodeExe)
      }
      self.nodeExe.BBoxUpdate = true
      queueInstance.vDomChanged(self.nodeExe.vDomIndex)
    }
    self.image.onerror = function onerror () {
      if (onerrorExe && typeof onerrorExe === 'function') {
        onerrorExe.call(nodeExe)
      }
    }
    if (self.attr.src) { self.image.src = self.attr.src }

    queueInstance.vDomChanged(nodeExe.vDomIndex)

    self.stack = [self]
  }
  RenderImage.prototype = {
    render: cRender,
    on: addListener,
    setStyle: domSetStyle
  }
  RenderImage.prototype.setAttr = function RIsetAttr (attr, value) {
    const self = this

    this.attr[attr] = value

    if (attr === 'src') {
      this.image.src = value
    }

    if (attr === 'clip') {
      if (!this.rImageObj) {
        this.rImageObj = getCanvasImgInstance(self.attr.width, self.attr.height)
      }
      const ctxX = this.rImageObj.getContext('2d')
      const {
        clip, width, height
      } = this.attr
      let {
        sx, sy, swidth, sheight
      } = clip
      sx = sx !== undefined ? sx : 0
      sy = sy !== undefined ? sy : 0
      swidth = swidth !== undefined ? swidth : width
      sheight = sheight !== undefined ? sheight : height
      ctxX.clearRect(0, 0, width, height)
      if (this.imageObj) {
        ctxX.drawImage(
          this.imageObj, sx, sy, swidth, sheight, 0, 0, width, height
        )
      }
    }
    if (self.attr.pixels) {
      let ctxX
      ctxX = self.rImageObj.getContext('2d')
      ctxX.putImageData(pixels.call(self, self.attr.pixels), 0, 0)
    }

    queueInstance.vDomChanged(this.nodeExe.vDomIndex)
  }
  RenderImage.prototype.updateBBox = function RIupdateBBox () {
    const self = this
    let translateX = 0
    let translateY = 0
    let scaleX = 1
    let scaleY = 1
    const { transform } = self.attr
    let {
      x, y, width, height
    } = self.attr

    if (transform) {
      if (transform.translate) {
        [translateX, translateY] = transform.translate
      }
      if (transform.scale) {
        scaleX = transform.scale[0] !== undefined ? transform.scale[0] : 1
        scaleY = transform.scale[1] !== undefined ? transform.scale[1] : scaleX
      }
    }

    self.BBox = {
      x: (translateX + x) * scaleX,
      y: (translateY + y) * scaleY,
      width: (width ? width : 0) * scaleX,
      height: (height ? height : 0) * scaleY
    }

    if (transform && transform.rotate) {
      self.BBoxHit = rotateBBox(this.BBox, transform.rotate[0])
    } else {
      self.BBoxHit = this.BBox
    }
  }
  RenderImage.prototype.execute = function RIexecute () {
    const {
      width, height, x, y
    } = this.attr
    if (this.imageObj) {
      this.ctx.drawImage(
        this.rImageObj ? this.rImageObj : this.imageObj,
        x || 0,
        y || 0,
        width,
        height
      )
    }
  }
  RenderImage.prototype.applyStyles = function RIapplyStyles () {

  }
  RenderImage.prototype.in = function RIinfun (co) {
    return co.x >= this.attr.x && co.x <= this.attr.x + this.attr.width &&
     co.y >= this.attr.y && co.y <= this.attr.y + this.attr.height
  }

  function RenderText (ctx, props, stylesProps) {
    const self = this
    self.ctx = ctx
    self.attr = props
    self.styles = stylesProps
    self.nodeName = 'text'

    self.stack = [self]
  }
  RenderText.prototype = {
    render: cRender,
    text (value) {
      this.textContent = value
    },
    setAttr: domSetAttribute,
    setStyle: domSetStyle,
    on: addListener
  }
  RenderText.prototype.updateBBox = function RTupdateBBox () {
    const self = this
    let translateX = 0
    let translateY = 0
    let scaleX = 1
    let scaleY = 1
    let height = 1
    const { transform } = self.attr
    if (transform && transform.translate) {
      [translateX, translateY] = transform.translate
    }
    if (transform && transform.scale) {
      [scaleX, scaleY] = transform.scale
    }
    if (this.styles.font) {
      this.ctx.font = this.styles.font
      height = parseInt(this.styles.font, 10)
    }

    self.BBox = {
      x: (translateX + (self.attr.x) * scaleX),
      y: (translateY + (self.attr.y - height + 5) * scaleY),
      width: this.ctx.measureText(this.textContent).width * scaleX,
      height: height * scaleY
    }

    if (transform && transform.rotate) {
      self.BBoxHit = rotateBBox(this.BBox, transform.rotate[0])
    } else {
      self.BBoxHit = this.BBox
    }
  }
  RenderText.prototype.execute = function RTexecute () {
    if (this.textContent) {
      if (this.styles.fillStyle) {
        this.ctx.fillText(this.textContent, this.attr.x, this.attr.y)
      }
      if (this.styles.strokeStyle) {
        this.ctx.strokeText(this.textContent, this.attr.x, this.attr.y)
      }
    }
  }
  RenderText.prototype.applyStyles = function RTapplyStyles () { }
  RenderText.prototype.in = function RTinfun (co) {
    return co.x >= this.attr.x && co.x <= this.attr.x + this.attr.width &&
    co.y >= this.attr.y && co.y <= this.attr.y + this.attr.height
  }

  /** ***************** Render Circle */

  const RenderCircle = function RenderCircle (ctx, props, stylesProps) {
    const self = this
    self.ctx = ctx
    self.attr = props
    self.styles = stylesProps
    self.nodeName = 'circle'

    self.stack = [self]
  }
  RenderCircle.prototype = {
    render: cRender,
    on: addListener,
    setAttr: domSetAttribute,
    setStyle: domSetStyle
  }
  RenderCircle.prototype.updateBBox = function RCupdateBBox () {
    const self = this
    let translateX = 0
    let translateY = 0
    let scaleX = 1
    let scaleY = 1
    const { transform } = self.attr

    if (transform) {
      if (transform.translate) {
        [translateX, translateY] = transform.translate
      }
      if (transform.scale) {
        [scaleX, scaleY] = transform.scale
      }
    }

    self.BBox = {
      x: (translateX + (self.attr.cx - self.attr.r)) * scaleX,
      y: (translateY + (self.attr.cy - self.attr.r)) * scaleY,
      width: (2 * self.attr.r) * scaleX,
      height: (2 * self.attr.r) * scaleY
    }

    if (transform && transform.rotate) {
      self.BBoxHit = rotateBBox(this.BBox, transform.rotate[0])
    } else {
      self.BBoxHit = this.BBox
    }
  }
  RenderCircle.prototype.execute = function RCexecute () {
    // this.ctx.moveTo(this.attr.cx+this.attr.r,this.attr.cy);
    this.ctx.beginPath()
    this.ctx.arc(this.attr.cx, this.attr.cy, this.attr.r, 0, 2 * Math.PI, false)
    this.ctx.closePath()
  }
  RenderCircle.prototype.applyStyles = function RCapplyStyles () {
    if (this.styles.fillStyle) { this.ctx.fill() }
    if (this.styles.strokeStyle) { this.ctx.stroke() }
  }

  RenderCircle.prototype.in = function RCinfun (co) {
    const r = Math.sqrt((co.x - this.attr.cx) * (co.x - this.attr.cx) +
    (co.y - this.attr.cy) * (co.y - this.attr.cy))
    return r <= this.attr.r
  }

  const RenderLine = function RenderLine (ctx, props, stylesProps) {
    const self = this
    self.ctx = ctx
    self.attr = props
    self.styles = stylesProps
    self.nodeName = 'line'

    self.stack = [self]
  }
  RenderLine.prototype = {
    render: cRender,
    on: addListener,
    setAttr: domSetAttribute,
    setStyle: domSetStyle
  }
  RenderLine.prototype.updateBBox = function RLupdateBBox () {
    const self = this
    let translateX = 0
    let translateY = 0
    let scaleX = 1
    let scaleY = 1
    const { transform } = self.attr
    if (transform && transform.translate) {
      [translateX, translateY] = transform.translate
    }
    if (transform && transform.scale) {
      [scaleX, scaleY] = transform.scale
    }

    self.BBox = {
      x: (translateX + (self.attr.x1 < self.attr.x2 ? self.attr.x1 : self.attr.x2) * scaleX),
      y: (translateY + (self.attr.y1 < self.attr.y2 ? self.attr.y1 : self.attr.y2) * scaleY),
      width: (Math.abs(self.attr.x2 - self.attr.x1)) * scaleX,
      height: (Math.abs(self.attr.y2 - self.attr.y1)) * scaleY
    }

    if (transform && transform.rotate) {
      self.BBoxHit = rotateBBox(this.BBox, transform.rotate[0])
    } else {
      self.BBoxHit = this.BBox
    }
  }
  RenderLine.prototype.execute = function RLexecute () {
    const { ctx } = this
    ctx.beginPath()
    ctx.moveTo(this.attr.x1, this.attr.y1)
    ctx.lineTo(this.attr.x2, this.attr.y2)
    ctx.closePath()
  }
  RenderLine.prototype.applyStyles = function RLapplyStyles () {
    if (this.styles.fillStyle) { this.ctx.fill() }
    if (this.styles.strokeStyle) { this.ctx.stroke() }
  }
  RenderLine.prototype.in = function RLinfun (co) {
    return parseFloat(t2DGeometry.getDistance({ x: this.attr.x1, y: this.attr.y1 }, co) +
      t2DGeometry.getDistance(co, { x: this.attr.x2, y: this.attr.y2 })).toFixed(1) ===
     parseFloat(t2DGeometry.getDistance(
       { x: this.attr.x1, y: this.attr.y1 },
       { x: this.attr.x2, y: this.attr.y2 }
     )).toFixed(1)
  }

  /** ***************** Render Path */

  const RenderPath = function RenderPath (ctx, props, styleProps) {
    const self = this
    self.ctx = ctx
    self.angle = 0
    self.nodeName = 'path'
    self.attr = props
    self.styles = styleProps

    if (props.d) {
      self.attr.d = props.d
      self.path = new Path(self.attr.d)
      self.pathNode = new Path2D(self.attr.d)
    }
    self.stack = [self]

    return self
  }
  RenderPath.prototype = {
    render: cRender,
    setStyle: domSetStyle,
    on: addListener
  }
  RenderPath.prototype.updateBBox = function RPupdateBBox () {
    const self = this
    let translateX = 0
    let translateY = 0
    let scaleX = 1
    let scaleY = 1
    const { transform } = self.attr
    if (transform && transform.translate) {
      [translateX, translateY] = transform.translate
    }
    if (transform && transform.scale) {
      [scaleX, scaleY] = transform.scale
    }
    self.BBox = self.path ? t2DGeometry.getBBox(self.path.stack) : {
      x: 0, y: 0, width: 0, height: 0
    }
    self.BBox.x = (translateX + self.BBox.x * scaleX)
    self.BBox.y = (translateY + self.BBox.y * scaleY)
    self.BBox.width *= scaleX
    self.BBox.height *= scaleY

    if (transform && transform.rotate) {
      self.BBoxHit = rotateBBox(this.BBox, transform.rotate[0])
    } else {
      self.BBoxHit = this.BBox
    }
  }
  RenderPath.prototype.setAttr = function RPsetAttr (attr, value) {
    this.attr[attr] = value
    if (attr === 'd') {
      this.path = new Path(this.attr.d)
      this.pathNode = new Path2D(this.attr.d)
    }
  }
  RenderPath.prototype.getPointAtLength = function RPgetPointAtLength (len) {
    return this.path ? this.path.getPointAtLength(len) : { x: 0, y: 0 }
  }
  RenderPath.prototype.getAngleAtLength = function RPgetAngleAtLength (len) {
    return this.path ? this.path.getAngleAtLength(len) : 0
  }
  RenderPath.prototype.getTotalLength = function RPgetTotalLength () {
    return this.path ? this.path.getTotalLength() : 0
  }

  RenderPath.prototype.execute = function RPexecute () {
    if (this.attr.d) {
      if (this.styles.fillStyle) { this.ctx.fill(this.pathNode) }
      if (this.styles.strokeStyle) { this.ctx.stroke(this.pathNode) }
    }
  }
  RenderPath.prototype.applyStyles = function RPapplyStyles () {

  }
  RenderPath.prototype.in = function RPinfun (co) {
    if (!this.attr.d) {
      return false
    }
    return this.styles.fillStyle ? this.ctx.isPointInPath(this.pathNode, co.x, co.y) : false
  }
  /** *****************End Render Path */

  /** ***************** Render polygon */

  function polygonExe (points) {
    let polygon = new Path2D()
    let localPoints = points

    localPoints = localPoints.replace(/,/g, ' ').split(' ')

    polygon.moveTo(localPoints[0], localPoints[1])
    for (let i = 2; i < localPoints.length; i += 2) {
      polygon.lineTo(localPoints[i], localPoints[i + 1])
    }
    polygon.closePath()

    return polygon
  }

  const RenderPolygon = function RenderPolygon (ctx, props, styleProps) {
    const self = this
    self.ctx = ctx
    self.nodeName = 'polygon'
    self.attr = props
    self.styles = styleProps
    self.stack = [self]
    if (props.points) {
      self.polygon = polygonExe(self.attr.points)
    }
    return this
  }
  RenderPolygon.prototype = {
    render: cRender,
    setStyle: domSetStyle,
    on: addListener
  }
  RenderPolygon.prototype.setAttr = function RPolysetAttr (attr, value) {
    this.attr[attr] = value
    if (attr === 'points') {
      this.polygon = polygonExe(this.attr[attr])
    }
  }
  RenderPolygon.prototype.updateBBox = function RPolyupdateBBox () {
    const self = this
    let translateX = 0
    let translateY = 0
    let scaleX = 1
    let scaleY = 1
    const { transform } = self.attr
    let points = self.attr.points.replace(/,/g, ' ').split(' ').map(function (d) { return parseFloat(d) })

    if (transform && transform.translate) {
      [translateX, translateY] = transform.translate
    }
    if (transform && transform.scale) {
      [scaleX, scaleY] = transform.scale
    }

    let minX = points[0]
    let maxX = points[0]
    let minY = points[1]
    let maxY = points[1]

    for (let i = 2; i < points.length; i += 2) {
      if (minX > points[i]) minX = points[i]
      if (maxX < points[i]) maxX = points[i]
      if (minY > points[i + 1]) minY = points[i + 1]
      if (maxY < points[i + 1]) maxY = points[i + 1]
    }

    self.BBox = {
      x: (translateX + minX * scaleX),
      y: (translateY + minY * scaleY),
      width: (maxX - minX) * scaleX,
      height: (maxY - minY) * scaleY
    }

    if (transform && transform.rotate) {
      self.BBoxHit = rotateBBox(this.BBox, transform.rotate[0])
    } else {
      self.BBoxHit = this.BBox
    }
  }
  RenderPolygon.prototype.execute = function RPolyexecute () {
    if (this.attr.points) {
      if (this.styles.fillStyle) { this.ctx.fill(this.polygon) }
      if (this.styles.strokeStyle) { this.ctx.stroke(this.polygon) }
    }
  }
  RenderPolygon.prototype.applyStyles = function RPolyapplyStyles () {

  }
  RenderPolygon.prototype.in = function RPolyinfun (co) {
    if (!this.attr.points) {
      return false
    }
    return this.styles.fillStyle ? this.ctx.isPointInPath(this.polygon, co.x, co.y) : false
  }

  /** ***************** Render polygon */

  /** ***************** Render ellipse */

  const RenderEllipse = function RenderEllipse (ctx, props, styleProps) {
    const self = this
    self.ctx = ctx
    self.nodeName = 'ellipse'
    self.attr = props
    self.styles = styleProps
    self.stack = [self]
    return this
  }
  RenderEllipse.prototype = {
    render: cRender,
    setAttr: domSetAttribute,
    setStyle: domSetStyle,
    on: addListener
  }
  RenderEllipse.prototype.updateBBox = function REupdateBBox () {
    const self = this
    let translateX = 0
    let translateY = 0
    let scaleX = 1
    let scaleY = 1
    const { transform } = self.attr

    if (transform && transform.translate) {
      [translateX, translateY] = transform.translate
    }
    if (transform && transform.scale) {
      [scaleX, scaleY] = transform.scale
    }
    self.BBox = {
      x: (translateX + (self.attr.cx - self.attr.rx) * scaleX),
      y: (translateY + (self.attr.cy - self.attr.ry) * scaleY),
      width: self.attr.rx * 2 * scaleX,
      height: self.attr.ry * 2 * scaleY
    }
    if (transform && transform.rotate) {
      self.BBoxHit = rotateBBox(this.BBox, transform.rotate[0])
    } else {
      self.BBoxHit = this.BBox
    }
  }
  RenderEllipse.prototype.execute = function REexecute () {
    const { ctx } = this
    ctx.beginPath()
    ctx.moveTo(this.attr.cx, this.attr.cy - this.attr.ry)
    ctx.bezierCurveTo(
      this.attr.cx + this.attr.rx, this.attr.cy - this.attr.ry,
      this.attr.cx + this.attr.rx, this.attr.cy + this.attr.ry,
      this.attr.cx, this.attr.cy + this.attr.ry
    )
    ctx.bezierCurveTo(
      this.attr.cx - this.attr.rx, this.attr.cy + this.attr.ry,
      this.attr.cx - this.attr.rx, this.attr.cy - this.attr.ry,
      this.attr.cx, this.attr.cy - this.attr.ry
    )
    ctx.closePath()
  }

  RenderEllipse.prototype.applyStyles = function REapplyStyles () {
    if (this.styles.fillStyle) { this.ctx.fill() }
    if (this.styles.strokeStyle) { this.ctx.stroke() }
  }

  RenderEllipse.prototype.in = function REinfun (co) {
    const {
      cx, cy, rx, ry
    } = this.attr
    return ((((co.x - cx) * (co.x - cx)) / (rx * rx)) + (((co.y - cy) * (co.y - cy)) / (ry * ry))) <= 1
  }

  /** ***************** Render ellipse */

  /** ***************** Render Rect */

  const RenderRect = function RenderRect (ctx, props, styleProps) {
    const self = this
    self.ctx = ctx
    self.nodeName = 'rect'
    self.attr = props
    self.styles = styleProps

    self.stack = [self]
    return this
  }
  RenderRect.prototype = {
    // execute: c_buildRect,
    render: cRender,
    setAttr: domSetAttribute,
    setStyle: domSetStyle,
    on: addListener
  }
  RenderRect.prototype.updateBBox = function RRupdateBBox () {
    const self = this
    let translateX = 0
    let translateY = 0
    let scaleX = 1
    let scaleY = 1
    const { transform } = self.attr

    if (transform && transform.translate) {
      [translateX, translateY] = transform.translate
    }
    if (transform && transform.scale) {
      [scaleX, scaleY] = transform.scale
    }
    self.BBox = {
      x: (translateX + self.attr.x * scaleX),
      y: (translateY + self.attr.y * scaleY),
      width: self.attr.width * scaleX,
      height: self.attr.height * scaleY
    }
    if (transform && transform.rotate) {
      self.BBoxHit = rotateBBox(this.BBox, transform.rotate[0])
    } else {
      self.BBoxHit = this.BBox
    }
  }
  RenderRect.prototype.execute = function RRexecute () {
    const { ctx } = this
    ctx.beginPath()
    ctx.rect(this.attr.x, this.attr.y, this.attr.width, this.attr.height)
    ctx.closePath()
  }

  RenderRect.prototype.applyStyles = function RRapplyStyles () {
    if (this.styles.fillStyle) { this.ctx.fill() }
    if (this.styles.strokeStyle) { this.ctx.stroke() }
  }

  RenderRect.prototype.in = function RRinfun (co) {
    const {
      x, y, width, height
    } = this.attr
    return co.x >= x && co.x <= x + width && co.y >= y && co.y <= y + height
  }

  /** ***************** Render Rect */

  /** ***************** Render Group */

  const RenderGroup = function RenderGroup (ctx, props, styleProps) {
    const self = this
    self.ctx = ctx
    self.attr = props
    self.styles = styleProps
    self.stack = new Array(0)
    return this
  }
  RenderGroup.prototype = {
    render: cRender,
    setAttr: domSetAttribute,
    setStyle: domSetStyle,
    on: addListener
  }
  RenderGroup.prototype.updateBBox = function RGupdateBBox (children) {
    const self = this
    let minX
    let maxX
    let minY
    let maxY
    let gTranslateX = 0
    let gTranslateY = 0
    let scaleX = 1
    let scaleY = 1
    const { transform } = self.attr

    self.BBox = {}

    if (transform && transform.translate) {
      gTranslateX = transform.translate[0] !== undefined ? transform.translate[0] : 0
      gTranslateY = transform.translate[1] !== undefined ? transform.translate[1] : gTranslateX
    }
    if (transform && self.attr.transform.scale && self.attr.id !== 'rootNode') {
      scaleX = transform.scale[0] !== undefined ? transform.scale[0] : 1
      scaleY = transform.scale[1] !== undefined ? transform.scale[1] : scaleX
    }

    if (children && children.length > 0) {
      let d
      let boxX
      let boxY
      for (let i = 0; i < children.length; i += 1) {
        d = children[i]

        boxX = d.dom.BBoxHit.x
        boxY = d.dom.BBoxHit.y
        minX = minX === undefined ? boxX : (minX > boxX ? boxX : minX)
        minY = minY === undefined ? boxY : (minY > boxY ? boxY : minY)
        maxX = maxX === undefined ? (boxX + d.dom.BBoxHit.width) : (maxX < (boxX + d.dom.BBoxHit.width) ? (boxX + d.dom.BBoxHit.width) : maxX)
        maxY = maxY === undefined ? (boxY + d.dom.BBoxHit.height) : (maxY < (boxY + d.dom.BBoxHit.height) ? (boxY + d.dom.BBoxHit.height) : maxY)
      }
    }

    minX = minX === undefined ? 0 : minX
    minY = minY === undefined ? 0 : minY
    maxX = maxX === undefined ? 0 : maxX
    maxY = maxY === undefined ? 0 : maxY

    self.BBox.x = (gTranslateX + minX * scaleX)
    self.BBox.y = (gTranslateY + minY * scaleY)
    self.BBox.width = Math.abs(maxX - minX) * scaleX
    self.BBox.height = Math.abs(maxY - minY) * scaleY

    if (self.attr.transform && self.attr.transform.rotate) {
      self.BBoxHit = rotateBBox(this.BBox, this.attr.transform.rotate[0])
    } else {
      self.BBoxHit = this.BBox
    }
  }

  RenderGroup.prototype.child = function RGchild (obj) {
    const self = this
    const objLocal = obj
    if (objLocal instanceof CanvasNodeExe) {
      objLocal.dom.parent = self
      self.stack[self.stack.length] = objLocal
    } else if (objLocal instanceof CreateElements) {
      objLocal.stack.forEach((d) => {
        d.dom.parent = self
        self.stack[self.stack.length] = d
      })
    } else { console.log('wrong Object') }
  }
  RenderGroup.prototype.applyStyles = function RGapplyStyles () {
    if (this.styles.fillStyle) { this.ctx.fill() }
    if (this.styles.strokeStyle) { this.ctx.stroke() }
  }
  RenderGroup.prototype.in = function RGinfun (coOr) {
    const self = this
    const co = { x: coOr.x, y: coOr.y }
    const { BBoxHit } = this
    const { transform } = self.attr
    let gTranslateX = 0
    let gTranslateY = 0
    let scaleX = 1
    let scaleY = 1

    if (transform && transform.translate) {
      [gTranslateX, gTranslateY] = transform.translate
    }
    if (transform && transform.scale) {
      scaleX = transform.scale[0] !== undefined ? transform.scale[0] : 1
      scaleY = transform.scale[1] !== undefined ? transform.scale[1] : scaleX
    }

    return co.x >= (BBoxHit.x - gTranslateX) / scaleX &&
                co.x <= ((BBoxHit.x - gTranslateX) + BBoxHit.width) / scaleX &&
                co.y >= (BBoxHit.y - gTranslateY) / scaleY &&
                co.y <= ((BBoxHit.y - gTranslateY) + BBoxHit.height) / scaleY
  }

  /** ***************** End Render Group */

  let CanvasNodeExe = function CanvasNodeExe (context, config, id, vDomIndex) {
    this.styles = config.styles ? config.styles : {}
    this.attr = config.attr ? config.attr : {}
    this.id = id
    this.nodeName = config.el
    this.nodeType = 'CANVAS'
    this.children = []
    this.ctx = context
    this.vDomIndex = vDomIndex

    switch (config.el) {
      case 'circle':
        this.dom = new RenderCircle(this.ctx, this.attr, this.styles)
        break
      case 'rect':
        this.dom = new RenderRect(this.ctx, this.attr, this.styles)
        break
      case 'line':
        this.dom = new RenderLine(this.ctx, this.attr, this.styles)
        break
      case 'path':
        this.dom = new RenderPath(this.ctx, this.attr, this.styles)
        break
      case 'group':
        this.dom = new RenderGroup(this.ctx, this.attr, this.styles)
        break
      case 'text':
        this.dom = new RenderText(this.ctx, this.attr, this.styles)
        break
      case 'image':
        this.dom = new RenderImage(this.ctx, this.attr, this.styles, config.onload, config.onerror, this)
        break
      case 'polygon':
        this.dom = new RenderPolygon(this.ctx, this.attr, this.styles, this)
        break
      case 'ellipse':
        this.dom = new RenderEllipse(this.ctx, this.attr, this.styles, this)
        break
      default:
        this.dom = null
        break
    }

    this.dom.nodeExe = this
    // this.dom.setAttribute(this.attr);
    this.BBoxUpdate = true
    // queueInstance.vDomChanged(this.vDomIndex);
  }

  CanvasNodeExe.prototype.node = function Cnode () {
    this.updateBBox()
    return this.dom
  }
  CanvasNodeExe.prototype.stylesExe = function CstylesExe () {
    const props = Object.keys(this.styles)
    let value

    for (let i = 0; i < props.length; i += 1) {
      if (typeof this.styles[props[i]] === 'function') {
        this.styles[props[i]] = this.styles[props[i]].call(this, this.dataObj)
        value = this.styles[props[i]]
      } else if (this.styles[props[i]] instanceof CanvasGradients) {
        value = this.styles[props[i]].exe(this.ctx, this.dom.BBox)
      } else {
        value = this.styles[props[i]]
      }

      if (typeof value !== 'function') { this.ctx[props[i]] = value } else if (typeof value === 'function') { this.ctx[props[i]](value) } else { console.log('junk comp') }
    }
  }

  CanvasNodeExe.prototype.remove = function Cremove () {
    const self = this
    let index
    const { children } = this.dom.parent
    for (let i = 0; i < children.length; i += 1) {
      if (self === children[i]) {
        index = i
      }
    }
    if (index > -1) {
      for (let i = index; i < children.length - 1; i += 1) {
        children[i] = children[i + 1]
      }
      children.length -= 1
    }
    this.dom.parent.children = children
    queueInstance.vDomChanged(this.vDomIndex)
    this.BBoxUpdate = true
  }

  CanvasNodeExe.prototype.attributesExe = function CattributesExe () {
    this.dom.render(this.attr)
  }
  CanvasNodeExe.prototype.setStyle = function CsetStyle (attr, value) {
    if (arguments.length === 2) {
      this.styles[attr] = value
      this.dom.setStyle(attr, value)
    } else if (arguments.length === 1 && typeof attr === 'object') {
      const styleKeys = Object.keys(attr)
      for (let i = 0; i < styleKeys.length; i += 1) {
        this.styles[styleKeys[i]] = attr[styleKeys[i]]
        this.dom.setStyle(styleKeys[i], attr[styleKeys[i]])
      }
    }

    queueInstance.vDomChanged(this.vDomIndex)

    return this
  }

  CanvasNodeExe.prototype.setAttr = function CsetAttr (attr, value) {
    if (arguments.length === 2) {
      this.attr[attr] = value
      this.dom.setAttr(attr, value)
    } else if (arguments.length === 1 && typeof attr === 'object') {
      const keys = Object.keys(attr)
      for (let i = 0; i < keys.length; i += 1) {
        this.attr[keys[i]] = attr[keys[i]]
        this.dom.setAttr(keys[i], attr[keys[i]])
      }
    }

    this.BBoxUpdate = true
    queueInstance.vDomChanged(this.vDomIndex)

    return this
  }

  CanvasNodeExe.prototype.getAttr = function CgetAttribute (_) {
    // console.log(this.attr);
    return this.attr[_]
  }

  CanvasNodeExe.prototype.rotate = function Crotate (angle, x, y) {
    if (!this.attr.transform) { this.attr.transform = {} }
    // XY = XY || {
    //   x: 0,
    //   y: 0
    // }
    this.attr.transform.rotate = angle
    this.attr.transform.cx = x
    this.attr.transform.cy = y
    this.dom.setAttr('transform', this.attr.transform)

    this.BBoxUpdate = true
    queueInstance.vDomChanged(this.vDomIndex)
    return this
  }

  CanvasNodeExe.prototype.scale = function Cscale (XY) {
    if (!this.attr.transform) { this.attr.transform = {} }
    if (XY.length < 1) { return null }
    this.attr.transform.scale = [XY[0], XY[1] ? XY[1] : XY[0]]
    this.dom.setAttr('transform', this.attr.transform)

    this.BBoxUpdate = true
    queueInstance.vDomChanged(this.vDomIndex)
    return this
  }
  CanvasNodeExe.prototype.translate = function Ctranslate (XY) {
    if (!this.attr.transform) { this.attr.transform = {} }
    this.attr.transform.translate = XY
    this.dom.setAttr('transform', this.attr.transform)

    this.BBoxUpdate = true
    queueInstance.vDomChanged(this.vDomIndex)

    return this
  }
  CanvasNodeExe.prototype.skewX = function CskewX (x) {
    if (!this.attr.transform) { this.attr.transform = {} }
    this.attr.transform.skewX = [x]
    this.dom.setAttr('transform', this.attr.transform)

    this.BBoxUpdate = true
    queueInstance.vDomChanged(this.vDomIndex)
    return this
  }
  CanvasNodeExe.prototype.skewY = function CskewY (y) {
    if (!this.attr.transform) { this.attr.transform = {} }
    this.attr.transform.skewY = [y]
    this.dom.setAttr('transform', this.attr.transform)

    this.BBoxUpdate = true
    queueInstance.vDomChanged(this.vDomIndex)
    return this
  }
  CanvasNodeExe.prototype.execute = function Cexecute () {
    this.ctx.save()
    this.stylesExe()
    this.attributesExe()
    this.dom.applyStyles()
    if ((this.dom instanceof RenderGroup)) {
      for (let i = 0; i < this.children.length; i += 1) {
        this.children[i].execute()
      }
    }
    this.ctx.restore()
  }

  CanvasNodeExe.prototype.child = function child (childrens) {
    const self = this
    const childrensLocal = childrens
    if (self.dom instanceof RenderGroup) {
      for (let i = 0; i < childrensLocal.length; i += 1) {
        childrensLocal[i].dom.parent = self
        self.children[self.children.length] = childrensLocal[i]
      }
    } else { console.log('Error') }

    this.BBoxUpdate = true
    queueInstance.vDomChanged(this.vDomIndex)
    return self
  }
  CanvasNodeExe.prototype.fetchEl = cfetchEl
  CanvasNodeExe.prototype.fetchEls = cfetchEls

  CanvasNodeExe.prototype.updateBBox = function CupdateBBox () {
    let status
    for (let i = 0; i < this.children.length; i += 1) {
      status = this.children[i].updateBBox() || status
    }
    if (this.BBoxUpdate || status) {
      this.dom.updateBBox(this.children)
      this.BBoxUpdate = false
      return true
    }

    return false
  }
  CanvasNodeExe.prototype.in = function Cinfun (co) {
    return this.dom.in(co)
  }
  CanvasNodeExe.prototype.on = function Con (eventType, hndlr) {
    this.dom.on(eventType, hndlr)
    return this
  }
  CanvasNodeExe.prototype.animateTo = animateTo
  CanvasNodeExe.prototype.animateExe = animateExe
  CanvasNodeExe.prototype.animatePathTo = animatePathTo
  CanvasNodeExe.prototype.morphTo = morphTo
  CanvasNodeExe.prototype.vDomIndex = null
  CanvasNodeExe.prototype.join = dataJoin
  CanvasNodeExe.prototype.createRadialGradient = createRadialGradient
  CanvasNodeExe.prototype.createLinearGradient = createLinearGradient
  CanvasNodeExe.prototype.createPattern = createCanvasPattern
  CanvasNodeExe.prototype.createEls = function CcreateEls (data, config) {
    const e = new CreateElements({ type: 'CANVAS', ctx: this.dom.ctx }, data, config, this.vDomIndex)
    this.child(e.stack)
    queueInstance.vDomChanged(this.vDomIndex)
    return e
  }
  CanvasNodeExe.prototype.text = function Ctext (value) {
    if (this.dom instanceof RenderText) { this.dom.text(value) }
    queueInstance.vDomChanged(this.vDomIndex)
    return this
  }
  CanvasNodeExe.prototype.createEl = function CcreateEl (config) {
    const e = new CanvasNodeExe(this.dom.ctx, config, domId(), this.vDomIndex)
    this.child([e])
    queueInstance.vDomChanged(this.vDomIndex)
    return e
  }
  CanvasNodeExe.prototype.removeChild = function CremoveChild (obj) {
    let index = -1
    this.children.forEach((d, i) => {
      if (d === obj) { index = i }
    })
    if (index !== -1) {
      const removedNode = this.children.splice(index, 1)[0]
      this.dom.removeChild(removedNode.dom)
    }

    queueInstance.vDomChanged(this.vDomIndex)
  }

  // const createCanvasElement = function (obj) {
  //   const root = this.dom
  //   return root.createEl(obj)
  // }

  function CreateElements (contextInfo, data, config, vDomIndex) {
    if (!data) { data = [] }

    let transform
    let key

    const attrKeys = config ? (config.attr ? Object.keys(config.attr) : []) : []
    const styleKeys = config ? (config.styles ? Object.keys(config.styles) : []) : []

    this.stack = data.map((d, i) => {
      let node

      if (contextInfo.type === 'CANVAS') {
        node = new CanvasNodeExe(contextInfo.ctx, {
          el: config.el
        }, domId(), vDomIndex)
      } else {
        node = createDomElement({
          el: config.el
        }, vDomIndex)
      }

      for (let j = 0; j < attrKeys.length; j += 1) {
        key = attrKeys[j]
        if (key !== 'transform') {
          if (typeof config.attr[key] === 'function') {
            const resValue = config.attr[key].call(node, d, j)
            node.setAttr(key, resValue)
          } else {
            node.setAttr(key, config.attr[key])
          }
        } else {
          if (typeof config.attr.transform === 'function') {
            transform = config.attr[key].call(node, d, j)
          } else {
            ({ transform } = config.attr)
          }
          for (const trns in transform) {
            node[trns](transform[trns])
          }
        }
      }
      for (let j = 0; j < styleKeys.length; j += 1) {
        key = styleKeys[j]
        if (typeof config.styles[key] === 'function') {
          const bindFun = config.styles[key].bind(node)
          node.setStyle(key, bindFun(d, j))
        } else {
          node.setStyle(key, config.styles[key])
        }
      }
      node.dataObj = d
      return node
    })
    return this
  }
  CreateElements.prototype = {
    createEls,
    createEl,
    forEach,
    setAttr: setAttribute,
    fetchEls,
    setStyle,
    translate,
    rotate,
    scale,
    animateTo: animateArrayTo,
    animateExe: animateArrayExe,
    animatePathTo: animatePathArrayTo,
    remove,
    text: textArray,
    join,
    on
  }

  CreateElements.prototype.wrapper = function wrapper (nodes) {
    const self = this
    if (nodes) {
      nodes.forEach((node, i) => {
        if (node instanceof DomExe ||
            node instanceof CanvasNodeExe ||
            node instanceof CreateElements) {
          self.stack.push(node)
        } else { self.stack.push(new DomExe(node, {}, domId())) }
      })
    }
    return this
  }

  // const createCanvasElements = function (data, config) {
  //   const root = this.dom
  //   return root.createEls(data, config)
  // }

  function getPixlRatio (ctx) {
    const dpr = window.devicePixelRatio || 1
    const bsr = ctx.webkitBackingStorePixelRatio ||
            ctx.mozBackingStorePixelRatio ||
            ctx.msBackingStorePixelRatio ||
            ctx.oBackingStorePixelRatio ||
            ctx.backingStorePixelRatio || 1

    return dpr / bsr
  }

  const renderer = {}

  function createCanvasPattern(config) {
    const self = this
    const vDomIndex = self.vDomIndex
    const layer = document.createElement('canvas')
    const height = config.height ? config.height : 0
    const width = config.width ? config.width : 0
    const ctx = layer.getContext('2d')
    ratio = getPixlRatio(ctx)
    layer.setAttribute('height', height * ratio)
    layer.setAttribute('width', width * ratio)
    layer.style.height = `${height}px`
    layer.style.width = `${width}px`

    this.pattern =  new CanvasNodeExe(ctx, {
      el: 'group',
      attr: {
        id: 'pattern',
        transform: {
          scale: [ratio, ratio]
        }
      }
    }, domId(), vDomIndex)

    return this.pattern
  }

  renderer.CanvasLayer = function CanvasLayer (context, config) {
    let selectedNode
    // const selectiveClearing = config.selectiveClear ? config.selectiveClear : false
    const res = document.querySelector(context)
    const height = config.height ? config.height : res.clientHeight
    const width = config.width ? config.width : res.clientWidth

    const onClear = (config.onClear === 'clear' || !config.onClear) ? function (ctx) {
      ctx.clearRect(0, 0, width * ratio, height * ratio)
    } : config.onClear

    const layer = document.createElement('canvas')
    const ctx = layer.getContext('2d')

    ratio = getPixlRatio(ctx)

    layer.setAttribute('height', height * ratio)
    layer.setAttribute('width', width * ratio)
    layer.style.height = `${height}px`
    layer.style.width = `${width}px`
    layer.style.position = 'absolute'

    res.appendChild(layer)

    const vDomInstance = new VDom()
    const vDomIndex = queueInstance.addVdom(vDomInstance)

    const root = new CanvasNodeExe(ctx, {
      el: 'group',
      attr: {
        id: 'rootNode',
        transform: {
          scale: [ratio, ratio]
        }
      }
    }, domId(), vDomIndex)

    const execute = root.execute.bind(root)

    root.execute = function executeExe () {
      if (!this.dom.BBoxHit) {
        this.dom.BBoxHit = {
          x: 0, y: 0, width: width * ratio, height: height * ratio
        }
      }
      onClear(ctx)
      root.updateBBox()
      execute()
    }

    root.type = 'CANVAS'

    vDomInstance.root(root)

    if (config.events || config.events === undefined) {
      res.addEventListener('mousemove', (e) => {
        const tselectedNode = vDomInstance.eventsCheck(
          root.children,
          { x: e.offsetX, y: e.offsetY }
        )

        if (selectedNode && tselectedNode !== selectedNode) {
          if ((selectedNode.dom.mouseout || selectedNode.dom.mouseleave) && selectedNode.hovered) {
            if (selectedNode.dom.mouseout) { selectedNode.dom.mouseout.call(selectedNode, { da: 'test' }, e) }
            if (selectedNode.dom.mouseleave) { selectedNode.dom.mouseleave.call(selectedNode, { da: 'test' }, e) }
            selectedNode.hovered = false
          }
        }
        if (tselectedNode) {
          selectedNode = tselectedNode
          if ((selectedNode.dom.mouseover || selectedNode.dom.mouseenter) &&
              !selectedNode.hovered) {
            if (selectedNode.dom.mouseover) { selectedNode.dom.mouseover.call(selectedNode, { da: 'test' }, e) }
            if (selectedNode.dom.mouseenter) { selectedNode.dom.mouseenter.call(selectedNode, { da: 'test' }, e) }
            selectedNode.hovered = true
          }
          if (selectedNode.dom.mousemove) {
            selectedNode.dom.mousemove.call(selectedNode, { da: 'test' }, e)
          }
        } else {
          selectedNode = undefined
        }
      })
      res.addEventListener('click', (e) => {
        // setTimeout(function(){
        if (selectedNode && selectedNode.dom.click) { selectedNode.dom.click.call(selectedNode, { da: 'test' }) }
        // },0);
      })
      res.addEventListener('dblclick', (e) => {
        // setTimeout(function(){
        if (selectedNode && selectedNode.dom.dblclick) { selectedNode.dom.dblclick.call(selectedNode, { da: 'test' }) }
        // },0);
      })
      res.addEventListener('mousedown', (e) => {
        // setTimeout(function(){
        if (selectedNode && selectedNode.dom.mousedown) {
          selectedNode.dom.mousedown.call(selectedNode, { da: 'test' })
          selectedNode.down = true
        }
        // },0);
      })
      res.addEventListener('mouseup', (e) => {
        // setTimeout(function(){
        if (selectedNode && selectedNode.dom.mouseup && selectedNode.down) {
          selectedNode.dom.mouseup.call(selectedNode, { da: 'test' })
          selectedNode.down = false
        }
        // },0);
      })
      res.addEventListener('contextmenu', (e) => {
        // setTimeout(function(){
        if (selectedNode && selectedNode.dom.contextmenu) { selectedNode.dom.contextmenu.call(selectedNode, { da: 'test' }) }
        // },0);
      })
      document.addEventListener('drag', (e) => {
      }, false)
    }
    queueInstance.execute()

    return root
  }
  renderer.SVGLayer = function SVGLayer (context) {
    const vDomInstance = new VDom()
    const vDomIndex = queueInstance.addVdom(vDomInstance)
    const res = document.querySelector(context)
    const height = res.clientHeight
    const width = res.clientWidth
    const layer = document.createElementNS(nameSpace.svg, 'svg')
    layer.setAttribute('height', height)
    layer.setAttribute('width', width)
    layer.style.position = 'absolute'
    res.appendChild(layer)

    const root = new DomExe(layer, {}, domId(), vDomIndex)

    root.type = 'SVG'
    vDomInstance.root(root)

    queueInstance.execute()
    return root
  }

  renderer.queue = queueInstance
  renderer.geometry = t2DGeometry
  renderer.chain = chain

  return renderer
}))


/***/ })
/******/ ]);
});