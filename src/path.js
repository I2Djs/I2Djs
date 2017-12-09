(function path (root, factory) {
  const i2d = root
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./geometry.js'))
  } else if (typeof define === 'function' && define.amd) {
    define('path', ['./geometry.js'], geometry => factory(geometry))
  } else {
    i2d.path = factory(root.geometry)
  }
}(this, (geometry) => {
  const t2DGeometry = geometry('2D')

  function pathParser (path) {
    let pathStr = path.replace(/e-/g, '$')
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

  function relative (flag, p1, p2) {
    return flag ? p2 : p1
  }

  function m (rel, p0) {
    const temp = relative(rel, this.pp ? this.pp : {x: 0, y: 0}, {
      x: 0,
      y: 0
    })
    this.cp = addVectors(p0, temp)
    this.start = this.cp
    this.segmentLength = 0
    this.length = this.segmentLength

    if (this.currPathArr !== 0 && this.pp) {
      this.stackGroup.push(this.stack)
      this.stack = []
    } else {
      this.stackGroup.push(this.stack)
    }

    this.stack.push({
      type: 'M',
      p0: this.cp,
      length: this.segmentLength,
      pointAt (f) {
        return this.p0
      }
    })

    this.pp = this.cp

    return this
  }

  function v (rel, p1) {
    const temp = relative(rel, this.pp, {
      x: this.pp.x,
      y: 0
    })
    this.cp = addVectors(p1, temp)
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
    this.pp = this.cp
    return this
  }

  function l (rel, p1) {
    const temp = relative(rel, this.pp, {
      x: 0,
      y: 0
    })

    this.cp = addVectors(p1, temp)
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
    this.length += this.segmentLength
    this.pp = this.cp
    return this
  }

  function h (rel, p1) {
    const temp = relative(rel, this.pp, {
      x: 0,
      y: this.pp.y
    })
    this.cp = addVectors(p1, temp)

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
    this.pp = this.cp
    return this
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
    this.length += this.segmentLength
    this.pp = this.cp

    // this.stackGroup.push(this.stack)

    return this
  }

  function q (rel, c1, ep) {
    const temp = relative(rel, this.pp, {
      x: 0,
      y: 0
    })
    const cntrl1 = addVectors(c1, temp)
    const endPoint = addVectors(ep, temp)

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

    this.length += this.segmentLength
    this.pp = this.cp
    return this
  }

  function c (rel, c1, c2, ep) {
    const temp = relative(rel, this.pp, {
      x: 0,
      y: 0
    })
    const cntrl1 = addVectors(c1, temp)
    const cntrl2 = addVectors(c2, temp)
    const endPoint = addVectors(ep, temp)

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
        return t2DGeometry.cubicBezierTransition(this.p0, this.cntrl1, this.cntrl2, this.p1, f)
      }
    })
    this.length += this.segmentLength
    this.pp = this.cp
    return this
  }

  function s (rel, c2, ep) {
    const temp = relative(rel, this.pp, {
      x: 0,
      y: 0
    })

    const cntrl1 = addVectors(this.pp, subVectors(this.pp, this.cntrl ? this.cntrl : this.pp))
    const cntrl2 = addVectors(c2, temp)
    const endPoint = addVectors(ep, temp)

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
        return t2DGeometry.cubicBezierTransition(this.p0, this.cntrl1, this.cntrl2, this.p1, f)
      }
    })
    // this.stack.segmentLength += this.segmentLength
    this.length += this.segmentLength
    this.pp = this.cp
    return this
  }

  function a (rel, rx, ry, xRotation, arcLargeFlag, sweepFlag, ep) {
    const temp = relative(rel, this.pp, {
      x: 0,
      y: 0
    })
    const self = this
    const endPoint = addVectors(ep, temp)
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
    this.pp = this.cp
    return this
  }

  function Path (path) {
    this.stack = []
    this.length = 0
    this.stackGroup = []
    if (path) {
      this.path = path
      this.parse()
      // this.stackGroup.push(this.stack)
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
  Path.prototype.fetchPathString = function () {
    let p = ''
    let c
    for (let i = 0; i < this.stack.length; i++) {
      c = this.stack[i]
      if (c.type === 'M') {
        p += c.type + ' ' + c.p0.x + ',' + c.p0.y + ' '
      } else if (c.type === 'Z') {
        p += 'z'
      } else if (c.type === 'C') {
        p += c.type + ' ' + c.cntrl1.x + ',' + c.cntrl1.y + ' ' + c.cntrl2.x + ',' + c.cntrl2.y + ' ' + c.p1.x + ',' + c.p1.y + ' '
      } else if (c.type === 'Q') {
        p += c.type + ' ' + c.cntrl1.x + ',' + c.cntrl1.y + ' ' + c.p1.x + ',' + c.p1.y + ' '
      } else if (c.type === 'S') {
        p += c.type + ' ' + c.cntrl2.x + ',' + c.cntrl2.y + ' ' + c.p1.x + ',' + c.p1.y + ' '
      } else if (c.type === 'V') {
        p += c.type + ' ' + c.p1.y + ' '
      } else if (c.type === 'H') {
        p += c.type + ' ' + c.p1.x + ' '
      } else if (c.type === 'L') {
        p += c.type + ' ' + c.p1.x + ',' + c.p1.y + ' '
      }
    }
    return p
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
    return ['m', 'M', 'v', 'V', 'l', 'L', 'h', 'H', 'q', 'Q', 'c', 'C', 's', 'S', 'a', 'A', 'z', 'Z'].indexOf(_) !== -1
  }
  Path.prototype.case = function pCase (currCmd) {
    let currCmdI = currCmd
    if (this.isValid(currCmdI)) {
      this.PC = currCmdI
    } else {
      currCmdI = this.PC
      this.currPathArr = this.currPathArr - 1
    }
    switch (currCmdI) {
      case 'm':
        this.m(false, this.fetchXY())
        break
      case 'M':
        this.m(true, this.fetchXY())
        break
      case 'v':
        this.v(false, {
          x: 0,
          y: parseFloat(this.pathArr[this.currPathArr += 1])
        })
        break
      case 'V':
        this.v(true, {
          x: 0,
          y: parseFloat(this.pathArr[this.currPathArr += 1])
        })
        break
      case 'l':
        this.l(false, this.fetchXY())
        break
      case 'L':
        this.l(true, this.fetchXY())
        break
      case 'h':
        this.h(false, {
          x: parseFloat(this.pathArr[this.currPathArr += 1]),
          y: 0
        })
        break
      case 'H':
        this.h(true, {
          x: parseFloat(this.pathArr[this.currPathArr += 1]),
          y: 0
        })
        break
      case 'q':
        this.q(false, this.fetchXY(), this.fetchXY())
        break
      case 'Q':
        this.q(true, this.fetchXY(), this.fetchXY())
        break
      case 'c':
        this.c(false, this.fetchXY(), this.fetchXY(), this.fetchXY())
        break
      case 'C':
        this.c(true, this.fetchXY(), this.fetchXY(), this.fetchXY())
        break
      case 's':
        this.s(false, this.fetchXY(), this.fetchXY())
        break
      case 'S':
        this.s(true, this.fetchXY(), this.fetchXY())
        break
      case 'a':
        let rx = parseFloat(this.pathArr[this.currPathArr += 1])
        let ry = parseFloat(this.pathArr[this.currPathArr += 1])
        let xRotation = parseFloat(this.pathArr[this.currPathArr += 1])
        let arcLargeFlag = parseFloat(this.pathArr[this.currPathArr += 1])
        let sweepFlag = parseFloat(this.pathArr[this.currPathArr += 1])
        this.a(false, rx, ry, xRotation, arcLargeFlag, sweepFlag, this.fetchXY())
        break
      case 'A':
        rx = parseFloat(this.pathArr[this.currPathArr += 1])
        ry = parseFloat(this.pathArr[this.currPathArr += 1])
        xRotation = parseFloat(this.pathArr[this.currPathArr += 1])
        arcLargeFlag = parseFloat(this.pathArr[this.currPathArr += 1])
        sweepFlag = parseFloat(this.pathArr[this.currPathArr += 1])
        this.a(true, rx, ry, xRotation, arcLargeFlag, sweepFlag, this.fetchXY())
        break
      case 'z':
        this.z()
        break
      default:
        break
    }
  }

  return {
    instance: function (d) {
      return new Path(d)
    },
    isTypePath: function (pathInstance) {
      return pathInstance instanceof Path
    }
  }
}))
