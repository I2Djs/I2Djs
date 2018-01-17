(function renderer (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./geometry.js'), require('./queue.js'), require('./easing.js'), require('./chaining.js'), require('./vDom.js'), require('./colorMap.js'), require('./path.js'))
  } else if (typeof define === 'function' && define.amd) {
    define('i2d', ['./geometry.js', './queue.js', './easing.js', './chaining.js', './vDom.js', './colorMap.js', './path.js'], (geometry, queue, easing, chain, vDom, colorMap, path) => factory(geometry, queue, easing, chain, vDom, colorMap, path))
  } else {
    root.i2d = factory(root.geometry, root.queue, root.easing, root.chain, root.vDom, root.colorMap, root.path)
  }
}(this, (geometry, queue, easing, chain, VDom, colorMap, path) => {

  const t2DGeometry = geometry('2D')
  const easying = easing()
  const queueInstance = queue()
  let Id = 0
  let animeIdentifier = 1
  let ratio

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
    for (let i = 0, len = this.stack.length; i < len; i += 1) {
      let cRes = {}
      d = this.stack[i]
      if (typeof config === 'function') {
        cRes = config.call(d, d.dataObj, i)
      } else {
        const keys = Object.keys(config)
        for (let j = 0, lenJ = keys.length; j < lenJ; j += 1) {
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
    for (let i = 0, len = this.stack.length; i < len; i += 1) {
      let cRes = {}
      d = this.stack[i]

      if (typeof data === 'function') {
        res = data.call(d, d.dataObj, i)
      }
      if (typeof config === 'function') {
        cRes = config.call(d, d.dataObj, i)
      } else {
        const keys = Object.keys(config)
        for (let j = 0, lenJ = keys.length; j < lenJ; j += 1) {
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
    for (let i = 0, len = this.stack.length; i < len; i += 1) {
      callBck.call(this.stack[i], this.stack[i].dataObj, i)
    }
    return this
  }

  function setAttribute (key, value) {
    let d
    for (let i = 0, len = this.stack.length; i < len; i += 1) {
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
        for (let j = 0, lenJ = keys.length; j < lenJ; j += 1) {
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
    for (let i = 0, len = this.stack.length; i < len; i += 1) {
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
          for (let j = 0, lenJ = keys.length; j < lenJ; j += 1) {
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
    for (let i = 0, len = this.stack.length; i < len; i += 1) {
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
    for (let i = 0, len = this.stack.length; i < len; i += 1) {
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
    for (let i = 0, len = this.stack.length; i < len; i += 1) {
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
    for (let i = 0, len = this.stack.length; i < len; i += 1) {
      this.stack[i].on(eventType, hndlr)
    }
    return this
  }
  function remove () {
    for (let i = 0, len = this.stack.length; i < len; i += 1) {
      this.stack[i].remove()
    }
    return this
  }

  function addListener (eventType, hndlr) {
    this[eventType] = hndlr
  }

  function rotateBBox (BBox, rotateAngle) {
    // let angle
    let point1 = { x: BBox.x, y: BBox.y }
    let point2 = { x: BBox.x + BBox.width, y: BBox.y }
    let point3 = { x: BBox.x, y: BBox.y + BBox.height }
    let point4 = { x: BBox.x + BBox.width, y: BBox.y + BBox.height }

    const cen = {x: 0, y: 0}
    // { x: BBox.x + BBox.width / 2, y: BBox.y + BBox.height / 2 }
    // {x: 0, y: 0}
    // { x: BBox.x + BBox.width / 2, y: BBox.y + BBox.height / 2 }
    // const dis = t2DGeometry.getDistance(point1, cen)

    point1 = t2DGeometry.rotatePoint(point1, cen, rotateAngle, t2DGeometry.getDistance(point1, cen))
    point2 = t2DGeometry.rotatePoint(point2, cen, rotateAngle, t2DGeometry.getDistance(point2, cen))
    point3 = t2DGeometry.rotatePoint(point3, cen, rotateAngle, t2DGeometry.getDistance(point3, cen))
    point4 = t2DGeometry.rotatePoint(point4, cen, rotateAngle, t2DGeometry.getDistance(point4, cen))

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
        nodes[i].dataObj = data[index]
        res.update.push(nodes[i])
        dataIds[index] = null
      } else {
        // nodes[i].dataObj = data[index]
        res.old.push(nodes[i])
      }
    }
    res.new = data.filter((d, i) => {
      const index = dataIds.indexOf(cond(d, i))
      if (index !== -1) {
        dataIds[index] = null
        return true
      } return false
    })
    return res
  }

  let CompositeArray = {}
  CompositeArray.push = {
    value: function (data) {
      if (Object.prototype.toString.call(data) !== '[object Array]') {
        data = [data]
      }
      for (let i = 0, len = data.length; i < len; i++) {
        this.data.push(data[i])
      }
      if (this.action.enter) {
        let nodes = {}
        this.selector.split(',').forEach(function (d) {
          nodes[d] = data
        })
        this.action.enter.call(this, nodes)
      }
    },
    enumerable: false,
    configurable: false,
    writable: false
  }
  CompositeArray.pop = {
    value: function () {
      let self = this
      let elData = this.data.pop()
      if (this.action.exit) {
        let nodes = {}
        this.selector.split(',').forEach(function (d) {
          nodes[d] = self.fetchEls(d, [elData])
        })
        this.action.exit.call(this, nodes)
      }
    },
    enumerable: false,
    configurable: false,
    writable: false
  }
  CompositeArray.remove = {
    value: function (data) {
      if (Object.prototype.toString.call(data) !== '[object Array]') {
        data = [data]
      }
      let self = this
      if (this.action.exit) {
        let nodes = {}
        this.selector.split(',').forEach(function (d) {
          nodes[d] = self.fetchEls(d, data)
        })
        this.action.exit.call(this, nodes)
      }
    },
    enumerable: false,
    configurable: true,
    writable: false
  }
  CompositeArray.update = {
    value: function () {
      let self = this
      if (this.action.update) {
        let nodes = {}
        this.selector.split(',').forEach(function (d) {
          nodes[d] = self.fetchEls(d, self.data)
        })
        this.action.update.call(this, nodes)
      }
    },
    enumerable: false,
    configurable: true,
    writable: false
  }

  function dataJoin (data, selector, config) {
    const self = this
    const selectors = selector.split(',')
    let { joinCond } = config
    let joinResult = {
      new: {

      },
      update: {

      },
      old: {

      }
    }
    if (!joinCond) { joinCond = function (d, i) { return i } }

    selectors.forEach(function (d, i) {
      const nodes = self.fetchEls(d)
      const join = performJoin(data, nodes.stack, joinCond)
      joinResult.new[d] = join.new
      joinResult.update[d] = (new CreateElements()).wrapper(join.update)
      joinResult.old[d] = (new CreateElements()).wrapper(join.old)
    })

    // const joinResult = performJoin(data, nodes.stack, joinCond)

    if (config.action) {
      if (config.action.enter) {
        config.action.enter.call(self, joinResult.new)
      }
      if (config.action.exit) {
        // const collection = new CreateElements() 
        // collection.wrapper(joinResult.old)
        // config.action.exit.call(self, collection, joinResult.old.map(d => d.dataObj))
        config.action.exit.call(self, joinResult.old)
      }
      if (config.action.update) {
        // const collection = new CreateElements()
        // collection.wrapper(joinResult.update)
        // config.action.update.call(self, collection, joinResult.update.map(d => d.dataObj))
        config.action.update.call(self, joinResult.update)
      }
    }
    // this.joinCond = joinCond
    CompositeArray.action = {
      value: config.action,
      enumerable: false,
      configurable: true,
      writable: false
    }
    CompositeArray.selector = {
      value: selector,
      enumerable: false,
      configurable: true,
      writable: false
    }
    CompositeArray.data = {
      value: data,
      enumerable: false,
      configurable: true,
      writable: false
    }
    // this.action = config.action
    // this.selector = selector
    // this.data = data
    return Object.create(self, CompositeArray)
  }

  function generateStackId () {
    Id += 1
    return Id
  }

  const animate = function animate (self, targetConfig) {
    const callerExe = self
    const tattr = targetConfig.attr ? targetConfig.attr : {}
    const tstyles = targetConfig.style ? targetConfig.style : {}
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
    srcValue = self.style[key]
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
      srcValue = (self.style[key] !== undefined ? self.style[key] : 1)
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
      if (key !== 'attr' && key !== 'style' && key !== 'end') {
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
      if (config.style) { newConfig.style = resolveObject(config.style, node, i) }
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
      if (config.style) { newConfig.style = resolveObject(config.style, node, i) }
      if (config.end) { newConfig.end = config.end }
      if (config.ease) { newConfig.ease = config.ease }

      exeArray.push(node.animateExe(newConfig))
    }
    return exeArray
  }

  const animatePathArrayTo = function animatePathArrayTo (config) {
    let node
    let keys = Object.keys(config)
    for (let i = 0; i < this.stack.length; i += 1) {
      node = this.stack[i]
      let conf = {}
      for (let j = 0; j < keys.length; j++) {
        let value = config[keys[j]]
        if (typeof value === 'function') {
          value = value.call(node, node.dataObj, i)
        }
        conf[keys[j]] = value
      }
      node.animatePathTo(conf)
    }

    return this
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
    const { ease } = targetConfig
    const loop = targetConfig.loop ? targetConfig.loop : 0
    const direction = targetConfig.direction ? targetConfig.direction : 'default'
    const destD = targetConfig.attr.d ? targetConfig.attr.d : self.attr.d

    let srcPath = (i2d.Path(self.attr.d)).stackGroup
    let destPath = (i2d.Path(destD)).stackGroup

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
      .commit()

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
    const newPathInstance = path.isTypePath(src) ? src : i2d.Path(src)
    const arrExe = newPathInstance.stackGroup.reduce((p, c) => {
      p = p.concat(c)
      return p
    }, [])
    const mappedArr = []

    for (let i = 0; i < arrExe.length; i += 1) {
      if (arrExe[i].type === 'Z') {
        mappedArr.push({
          run (f) {
            newPathInstance.stack.splice(this.id, newPathInstance.stack.length - 1 - self.id)
            newPathInstance.stack[this.id] = this.render.execute(f)
            self.setAttr('d', newPathInstance)
          },
          id: i,
          render: new LinearTransitionBetweenPoints(arrExe[i].p0, arrExe[0].p0, arrExe[i].segmentLength),
          length: arrExe[i].length
        })
        totalLength += 0
      } else if (['V', 'H', 'L'].indexOf(arrExe[i].type) !== -1) {
        mappedArr.push({
          run (f) {
            newPathInstance.stack.splice(this.id, newPathInstance.stack.length - 1 - self.id)
            newPathInstance.stack[this.id] = this.render.execute(f)
            self.setAttr('d', newPathInstance)
          },
          id: i,
          render: new LinearTransitionBetweenPoints(arrExe[i].p0, arrExe[i].p1, arrExe[i].length),
          length: arrExe[i].length
        })
        totalLength += arrExe[i].length
      } else if (arrExe[i].type === 'Q') {
        mappedArr.push({
          run (f) {
            newPathInstance.stack.splice(this.id, newPathInstance.stack.length - 1 - self.id)
            newPathInstance.stack[this.id] = this.render.execute(f)
            self.setAttr('d', newPathInstance)
          },
          id: i,
          render: new BezierTransition(arrExe[i].p0, arrExe[i].cntrl1, arrExe[i].p1, arrExe[i].length),
          length: arrExe[i].length
        })
        totalLength += arrExe[i].length
      } else if (arrExe[i].type === 'C' || arrExe[i].type === 'S') {
        const co = t2DGeometry.cubicBezierCoefficients(arrExe[i])
        mappedArr.push({
          run (f) {
            newPathInstance.stack.splice(this.id, newPathInstance.stack.length - 1 - self.id)
            newPathInstance.stack[this.id] = this.render.execute(f)
            self.setAttr('d', newPathInstance)
          },
          id: i,
          co,
          render: new CubicBezierTransition(
            arrExe[i].p0,
            arrExe[i].cntrl1,
            arrExe[i].cntrl2,
            co,
            arrExe[i].length
          ),
          length: arrExe[i].length
        })
        totalLength += arrExe[i].length
      } else if (arrExe[i].type === 'M') {
        mappedArr.push({
          run () {
            newPathInstance.stack.splice(this.id, newPathInstance.stack.length - 1 - self.id)
            newPathInstance.stack[this.id] = {
              type: 'M',
              p0: arrExe[i].p0,
              length: 0,
              pointAt (f) {
                return this.p0
              }
            }
          },
          id: i,
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

  let CubicBezierTransition = function CubicBezierTransition (p0, c1, c2, co, length) {
    this.type = 'C'
    this.p0 = p0
    this.c1_src = c1
    this.c2_src = c2
    this.co = co
    this.length_src = length
  }
  CubicBezierTransition.prototype.execute = function (f) {
    const co = this.co
    const p0 = this.p0
    const c1 = this.c1_src
    const c2 = this.c2_src
    const c1Temp = {
      x: (p0.x + ((c1.x - p0.x)) * f),
      y: (p0.y + ((c1.y - p0.y)) * f)
    }
    const c2Temp = {
      x: (c1.x + ((c2.x - c1.x)) * f),
      y: (c1.y + ((c2.y - c1.y)) * f)
    }
    this.cntrl1 = c1Temp
    this.cntrl2 = {x: c1Temp.x + ((c2Temp.x - c1Temp.x)) * f, y: c1Temp.y + ((c2Temp.y - c1Temp.y)) * f}
    this.p1 = {x: co.ax * t2DGeometry.pow(f, 3) + co.bx * t2DGeometry.pow(f, 2) + co.cx * f + p0.x,
      y: co.ay * t2DGeometry.pow(f, 3) + co.by * t2DGeometry.pow(f, 2) + co.cy * f + p0.y
    }
    this.length = this.length_src * f
    return this
  }
  CubicBezierTransition.prototype.pointAt = function (f) {
    return t2DGeometry.cubicBezierTransition(this.p0, this.co, f)
  }


  let BezierTransition = function BezierTransition (p0, p1, p2, length, f) {
    this.type = 'Q'
    this.p0 = p0
    this.p1_src = p1
    this.p2_src = p2
    this.length_src = length
    this.length = 0
  }
  BezierTransition.prototype.execute = function (f) {
    let p0 = this.p0
    let p1 = this.p1_src
    let p2 = this.p2_src
    this.length = this.length_src * f
    this.cntrl1 = {x: p0.x + ((p1.x - p0.x)) * f, y: p0.y + ((p1.y - p0.y)) * (f)}
    this.cntrl2 = this.cntrl1
    this.p1 = {x: (p0.x - 2 * p1.x + p2.x) * f * f + (2 * p1.x - 2 * p0.x) * f + p0.x, y: (p0.y - 2 * p1.y + p2.y) * f * f + (2 * p1.y - 2 * p0.y) * f + p0.y}
    return this
  }
  BezierTransition.prototype.pointAt = function (f) {
    return t2DGeometry.bezierTransition(this.p0, this.cntrl1, this.p1, f)
  }

  let LinearTransitionBetweenPoints = function LinearTransitionBetweenPoints (p0, p2, length, f) {
    this.type = 'L'
    this.p0 = p0
    this.p1 = p0
    this.p2_src = p2
    this.length_src = length
    this.length = 0
  }
  LinearTransitionBetweenPoints.prototype.execute = function (f) {
    let p0 = this.p0
    let p2 = this.p2_src

    this.p1 = { x: p0.x + (p2.x - p0.x) * f, y: p0.y + (p2.y - p0.y) * f }
    this.length = this.length_src * f
    return this
  }
  LinearTransitionBetweenPoints.prototype.pointAt = function (f) {
    return t2DGeometry.linearTransitionBetweenPoints(this.p0, this.p1, f)
  }
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
        enter (data) {
          this.createEls(data.linearGradient, {
            el: 'linearGradient'
          })
            .setAttr({
              id: self.config.id,
              x1: `${self.config.x1}%`,
              y1: `${self.config.y1}%`,
              x2: `${self.config.x2}%`,
              y2: `${self.config.y2}%`
            })
        },
        exit (oldNodes) {
          oldNodes.linearGradient.remove()
        },
        update (nodes) {
          nodes.linearGradient.setAttr({
            id: self.config.id,
            x1: `${self.config.x1}%`,
            y1: `${self.config.y1}%`,
            x2: `${self.config.x2}%`,
            y2: `${self.config.y2}%`
          })
        }
      }
    })
    this.linearEl = this.linearEl.fetchEl('linearGradient')

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
        enter (data) {
          this.createEls(data.radialGradient, {
            el: 'radialGradient'
          }).setAttr({
            id: self.config.id,
            cx: `${self.config.innerCircle.x}%`,
            cy: `${self.config.innerCircle.y}%`,
            r: `${self.config.outerCircle.r}%`,
            fx: `${self.config.outerCircle.x}%`,
            fy: `${self.config.outerCircle.y}%`
          })
        },
        exit (oldNodes) {
          oldNodes.radialGradient.remove()
        },
        update (nodes) {
          nodes.radialGradient.setAttr({
            id: self.config.id,
            cx: `${self.config.innerCircle.x}%`,
            cy: `${self.config.innerCircle.y}%`,
            r: `${self.config.outerCircle.r}%`,
            fx: `${self.config.outerCircle.x}%`,
            fy: `${self.config.outerCircle.y}%`
          })
        }
      }
    })

    this.radialEl = this.radialEl.fetchEl('radialGradient')

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
    this.style = _.style ? _.style : {}
    this.changedStyles = this.style
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
    this.attr.transform.scale = XY
    if (this.changedAttribute.transform) {
      this.changedAttribute.transform.scale = XY
    } else {
      this.changedAttribute.transform = {}
      this.changedAttribute.transform.scale = XY
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
      this.style[attr] = value
      this.changedStyles[attr] = value
    } else if (arguments.length === 1 && typeof attr === 'object') {
      const styleAttrs = Object.keys(attr)

      for (let i = 0; i < styleAttrs.length; i += 1) {
        const key = styleAttrs[i]
        this.style[key] = attr[key]
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
    const self = this
    this.dom.addEventListener(eventType, (event) => { hnd(self.dataObj, event) })

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
    if (obj.style) { node.setStyle(obj.style) }
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
      if (transform.rotate) {
        self.ctx.translate(transform.cx, transform.cy)
        self.ctx.rotate(transform.rotate[0] * (Math.PI / 180))
        self.ctx.translate(-(transform.cx), -(transform.cy))
      }
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
      this.style[attr] = value
    } else {
      delete this.style[attr]
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
    // const self = this
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

  function applyStyles () {
    if (this.style.fillStyle) { this.ctx.fill() }
    if (this.style.strokeStyle) { this.ctx.stroke() }
  }

  function CanvasDom () { }
  CanvasDom.prototype = {
    render: cRender,
    on: addListener,
    setAttr: domSetAttribute,
    setStyle: domSetStyle,
    applyStyles
  }

  const imageDataMap = {}

  function RenderImage (ctx, props, stylesProps, onloadExe, onerrorExe, nodeExe) {
    const self = this
    self.ctx = ctx
    self.attr = props
    self.style = stylesProps
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
  RenderImage.prototype = new CanvasDom()
  RenderImage.prototype.constructor = RenderImage
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
  RenderImage.prototype.applyStyles = function RIapplyStyles () {}
  RenderImage.prototype.in = function RIinfun (co) {
    return co.x >= this.attr.x && co.x <= this.attr.x + this.attr.width &&
     co.y >= this.attr.y && co.y <= this.attr.y + this.attr.height
  }

  function RenderText (ctx, props, stylesProps) {
    const self = this
    self.ctx = ctx
    self.attr = props
    self.style = stylesProps
    self.nodeName = 'text'

    self.stack = [self]
  }
  RenderText.prototype = new CanvasDom()
  RenderText.prototype.constructor = RenderText
  RenderText.prototype.text = function RTtext (value) {
    this.textContent = value
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
    if (this.style.font) {
      this.ctx.font = this.style.font
      height = parseInt(this.style.font, 10)
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
    if (this.textContent !== undefined && this.textContent !== null) {
      if (this.style.fillStyle) {
        this.ctx.fillText(this.textContent, this.attr.x, this.attr.y)
      }
      if (this.style.strokeStyle) {
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
    self.style = stylesProps
    self.nodeName = 'circle'

    self.stack = [self]
  }
  RenderCircle.prototype = new CanvasDom()
  RenderCircle.prototype.constructor = RenderCircle
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
    this.ctx.beginPath()
    this.ctx.arc(this.attr.cx, this.attr.cy, this.attr.r, 0, 2 * Math.PI, false)
    this.applyStyles()
    this.ctx.closePath()
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
    self.style = stylesProps
    self.nodeName = 'line'

    self.stack = [self]
  }
  RenderLine.prototype = new CanvasDom()
  RenderLine.prototype.constructor = RenderLine
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
    this.applyStyles()
    ctx.closePath()
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
    self.style = styleProps

    if (self.attr.d) {
      if (path.isTypePath(self.attr.d)) {
        self.path = self.attr.d
        self.attr.d = self.attr.d.fetchPathString()
      } else {
        self.path = i2d.Path(self.attr.d)
      }
      self.pathNode = new Path2D(self.attr.d)
    }
    self.stack = [self]

    return self
  }
  RenderPath.prototype = new CanvasDom()
  RenderPath.prototype.constructor = RenderPath
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
      if (path.isTypePath(value)) {
        this.path = value
        this.attr.d = value.fetchPathString()
      } else {
        this.path = i2d.Path(this.attr.d)
      }
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
      if (this.style.fillStyle) { this.ctx.fill(this.pathNode) }
      if (this.style.strokeStyle) { this.ctx.stroke(this.pathNode) }
    }
  }
  RenderPath.prototype.applyStyles = function RPapplyStyles () {}
  RenderPath.prototype.in = function RPinfun (co) {
    let flag = false
    if (!this.attr.d) {
      return flag
    }
    this.ctx.save()
    this.ctx.scale(1 / ratio, 1 / ratio)
    flag = this.style.fillStyle ? this.ctx.isPointInPath(this.pathNode, co.x, co.y) : flag
    this.ctx.restore()
    return flag
  }
  /** *****************End Render Path */

  /** ***************** Render polygon */

  function polygonExe (points) {
    let polygon = new Path2D()
    let localPoints = points
    let points_ = []

    localPoints = localPoints.replace(/,/g, ' ').split(' ')

    polygon.moveTo(localPoints[0], localPoints[1])
    points_.push({x:parseFloat(localPoints[0]),y:parseFloat(localPoints[1])})
    for (let i = 2; i < localPoints.length; i += 2) {
      polygon.lineTo(localPoints[i], localPoints[i + 1])
      points_.push({x:parseFloat(localPoints[i]),y:parseFloat(localPoints[i+1])})
    }
    polygon.closePath()

    return {
      path: polygon,
      points: points_
    }
  }

  const RenderPolygon = function RenderPolygon (ctx, props, styleProps) {
    const self = this
    self.ctx = ctx
    self.nodeName = 'polygon'
    self.attr = props
    self.style = styleProps
    self.stack = [self]
    if (props.points) {
      self.polygon = polygonExe(self.attr.points)
    }
    return this
  }
  RenderPolygon.prototype = new CanvasDom()
  RenderPolygon.prototype.constructor = RenderPolygon
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
    if (self.polygon && self.polygon.points.length > 0) {
      let points = self.polygon.points

      if (transform && transform.translate) {
        [translateX, translateY] = transform.translate
      }
      if (transform && transform.scale) {
        [scaleX, scaleY] = transform.scale
      }
      let minX = points[0].x
      let maxX = points[0].x
      let minY = points[0].y
      let maxY = points[0].y

      for (let i = 1; i < points.length; i += 1) {
        if (minX > points[i].x) minX = points[i].x
        if (maxX < points[i].x) maxX = points[i].x
        if (minY > points[i].y) minY = points[i].y
        if (maxY < points[i].y) maxY = points[i].y
      }

      self.BBox = {
        x: (translateX + minX * scaleX),
        y: (translateY + minY * scaleY),
        width: (maxX - minX) * scaleX,
        height: (maxY - minY) * scaleY
      }
    } else {
      self.BBox = {
        x: 0,
        y: 0,
        width: 0,
        height: 0
      }
    }

    if (transform && transform.rotate) {
      self.BBoxHit = rotateBBox(this.BBox, transform.rotate[0])
    } else {
      self.BBoxHit = this.BBox
    }
  }
  RenderPolygon.prototype.execute = function RPolyexecute () {
    if (this.attr.points) {
      if (this.style.fillStyle) { this.ctx.fill(this.polygon.path) }
      if (this.style.strokeStyle) { this.ctx.stroke(this.polygon.path) }
    }
  }
  RenderPolygon.prototype.applyStyles = function RPolyapplyStyles () {}
  RenderPolygon.prototype.in = function RPolyinfun (co) {
    let flag = false
    if (!this.attr.points) {
      return flag
    }
    this.ctx.save()
    this.ctx.scale(1 / ratio, 1 / ratio)
    flag = this.style.fillStyle ? this.ctx.isPointInPath(this.polygon.path, co.x, co.y) : flag
    this.ctx.restore()
    return flag
  }

  /** ***************** Render polygon */

  /** ***************** Render ellipse */

  const RenderEllipse = function RenderEllipse (ctx, props, styleProps) {
    const self = this
    self.ctx = ctx
    self.nodeName = 'ellipse'
    self.attr = props
    self.style = styleProps
    self.stack = [self]
    return this
  }
  RenderEllipse.prototype = new CanvasDom()
  RenderEllipse.prototype.constructor = RenderEllipse
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
    this.applyStyles()
    ctx.closePath()
  }

  // RenderEllipse.prototype.applyStyles = function REapplyStyles () {
  //   if (this.styles.fillStyle) { this.ctx.fill() }
  //   if (this.styles.strokeStyle) { this.ctx.stroke() }
  // }

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
    self.style = styleProps

    self.stack = [self]
    return this
  }
  RenderRect.prototype = new CanvasDom()
  RenderRect.prototype.constructor = RenderRect
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
  RenderRect.prototype.applyStyles = function rStyles () {
    // if (this.style.fillStyle) { this.ctx.fill() }
    // if (this.style.strokeStyle) { this.ctx.stroke() }
  }
  RenderRect.prototype.execute = function RRexecute () {
    const { ctx } = this
    if (this.style.fillStyle) { ctx.fillRect(this.attr.x, this.attr.y, this.attr.width, this.attr.height) }
    if (this.style.strokeStyle) { ctx.strokeRect(this.attr.x, this.attr.y, this.attr.width, this.attr.height) }
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
    self.nodeName = 'group'
    self.ctx = ctx
    self.attr = props
    self.style = styleProps
    self.stack = new Array(0)
    return this
  }
  RenderGroup.prototype = new CanvasDom()
  RenderGroup.prototype.constructor = RenderGroup
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

  RenderGroup.prototype.in = function RGinfun (coOr) {
    const self = this
    const co = { x: coOr.x, y: coOr.y }
    const { BBox } = this
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

    return co.x >= (BBox.x - gTranslateX) / scaleX &&
                co.x <= ((BBox.x - gTranslateX) + BBox.width) / scaleX &&
                co.y >= (BBox.y - gTranslateY) / scaleY &&
                co.y <= ((BBox.y - gTranslateY) + BBox.height) / scaleY
  }

  /** ***************** End Render Group */

  let CanvasNodeExe = function CanvasNodeExe (context, config, id, vDomIndex) {
    this.style = config.style ? config.style : {}
    this.attr = config.attr ? config.attr : {}
    this.id = id
    this.nodeName = config.el
    this.nodeType = 'CANVAS'
    this.children = []
    this.ctx = context
    this.vDomIndex = vDomIndex

    switch (config.el) {
      case 'circle':
        this.dom = new RenderCircle(this.ctx, this.attr, this.style)
        break
      case 'rect':
        this.dom = new RenderRect(this.ctx, this.attr, this.style)
        break
      case 'line':
        this.dom = new RenderLine(this.ctx, this.attr, this.style)
        break
      case 'path':
        this.dom = new RenderPath(this.ctx, this.attr, this.style)
        break
      case 'group':
        this.dom = new RenderGroup(this.ctx, this.attr, this.style)
        break
      case 'text':
        this.dom = new RenderText(this.ctx, this.attr, this.style)
        break
      case 'image':
        this.dom = new RenderImage(this.ctx, this.attr, this.style, config.onload, config.onerror, this)
        break
      case 'polygon':
        this.dom = new RenderPolygon(this.ctx, this.attr, this.style, this)
        break
      case 'ellipse':
        this.dom = new RenderEllipse(this.ctx, this.attr, this.style, this)
        break
      default:
        this.dom = null
        break
    }

    this.dom.nodeExe = this
    this.BBoxUpdate = true
    // queueInstance.vDomChanged(this.vDomIndex);
  }

  CanvasNodeExe.prototype.node = function Cnode () {
    this.updateBBox()
    return this.dom
  }
  CanvasNodeExe.prototype.stylesExe = function CstylesExe () {
    const props = Object.keys(this.style)
    let value

    for (let i = 0, len = props.length; i < len; i += 1) {
      if (typeof this.style[props[i]] !== 'function' && !(this.style[props[i]] instanceof CanvasGradients)) {
        value = this.style[props[i]]
      } else if (typeof this.style[props[i]] === 'function') {
        this.style[props[i]] = this.style[props[i]].call(this, this.dataObj)
        value = this.style[props[i]]
      } else if (this.style[props[i]] instanceof CanvasGradients) {
        value = this.style[props[i]].exe(this.ctx, this.dom.BBox)
      } else {
        console.log('unkonwn Style')
      }

      if (typeof this.ctx[props[i]] !== 'function') {
        this.ctx[props[i]] = value
      } else if (typeof this.ctx[props[i]] === 'function') {
        // console.log(value);
        // this.ctx.setLineDash([5, 5])
        this.ctx[props[i]](value)
      } else { console.log('junk comp') }
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
      this.style[attr] = value
      this.dom.setStyle(attr, value)
    } else if (arguments.length === 1 && typeof attr === 'object') {
      const styleKeys = Object.keys(attr)
      for (let i = 0, len = styleKeys.length; i < len; i += 1) {
        this.style[styleKeys[i]] = attr[styleKeys[i]]
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
    return this.attr[_]
  }
  CanvasNodeExe.prototype.rotate = function Crotate (angle, x, y) {
    if (!this.attr.transform) { this.attr.transform = {} }
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
    if (this.dom instanceof RenderGroup) {
      for (let i = 0, len = this.children.length; i < len; i += 1) {
        this.children[i].execute()
      }
    }
    // this.dom.applyStyles()
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
    for (let i = 0, len = this.children.length; i < len; i += 1) {
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

  function CreateElements (contextInfo, data, config, vDomIndex) {
    if (!data) { data = [] }

    let transform
    let key

    const attrKeys = config ? (config.attr ? Object.keys(config.attr) : []) : []
    const styleKeys = config ? (config.style ? Object.keys(config.style) : []) : []

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
            const resValue = config.attr[key].call(node, d, i)
            node.setAttr(key, resValue)
          } else {
            node.setAttr(key, config.attr[key])
          }
        } else {
          if (typeof config.attr.transform === 'function') {
            transform = config.attr[key].call(node, d, i)
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
        if (typeof config.style[key] === 'function') {
          const resValue = config.style[key].call(node, d, i)
          node.setStyle(key, resValue)
        } else {
          node.setStyle(key, config.style[key])
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

  function getPixlRatio (ctx) {
    const dpr = window.devicePixelRatio || 1
    const bsr = ctx.webkitBackingStorePixelRatio ||
            ctx.mozBackingStorePixelRatio ||
            ctx.msBackingStorePixelRatio ||
            ctx.oBackingStorePixelRatio ||
            ctx.backingStorePixelRatio || 1

    return dpr / bsr
  }

  const i2d = {}

  // function createCanvasPattern(config) {
  //   const self = this
  //   const vDomIndex = self.vDomIndex
  //   const layer = document.createElement('canvas')
  //   const height = config.height ? config.height : 0
  //   const width = config.width ? config.width : 0
  //   const ctx = layer.getContext('2d')
  //   ratio = getPixlRatio(ctx)
  //   layer.setAttribute('height', height * ratio)
  //   layer.setAttribute('width', width * ratio)
  //   layer.style.height = `${height}px`
  //   layer.style.width = `${width}px`

  //   this.pattern =  new CanvasNodeExe(ctx, {
  //     el: 'group',
  //     attr: {
  //       id: 'pattern',
  //       transform: {
  //         scale: [ratio, ratio]
  //       }
  //     }
  //   }, domId(), vDomIndex)

  //   return this.pattern
  // }
  let dragObject = {
    dragStart: function (fun) {
      if (typeof fun === 'function') {
        this.onDragStart = fun
      }
      return this
    },
    drag: function (fun) {
      if (typeof fun === 'function') {
        this.onDrag = fun
      }
      return this
    },
    dragEnd: function (fun) {
      if (typeof fun === 'function') {
        this.onDragEnd = fun
      }
      return this
    }
  }

  i2d.dragEvent = function () {
    return Object.create(dragObject)
  }

  i2d.CanvasLayer = function CanvasLayer (context, config) {
    let originalRatio
    let selectedNode
    // const selectiveClearing = config.selectiveClear ? config.selectiveClear : false
    const res = document.querySelector(context)
    const height = config.height ? config.height : res.clientHeight
    const width = config.width ? config.width : res.clientWidth
    const layer = document.createElement('canvas')
    const ctx = layer.getContext('2d')
    ratio = getPixlRatio(ctx)
    originalRatio = ratio

    const onClear = (config.onClear === 'clear' || !config.onClear) ? function (ctx) {
      ctx.clearRect(0, 0, width * ratio, height * ratio)
    } : config.onClear

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
        id: 'rootNode'
      }
    }, domId(), vDomIndex)

    const execute = root.execute.bind(root)
    root.container = res
    root.domEl = layer
    root.height = height
    root.width = width
    root.execute = function executeExe () {
      if (!this.dom.BBoxHit) {
        this.dom.BBoxHit = {
          x: 0, y: 0, width: width * originalRatio, height: height * originalRatio
        }
      } else {
        this.dom.BBoxHit.width = this.width * originalRatio
        this.dom.BBoxHit.height = this.height * originalRatio
      }
      onClear(ctx)
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
      root.updateBBox()
      execute()
    }
    root.resize = function () {
      let width = this.container.clientWidth
      let height = this.container.clientHeight
      let newWidthRatio = (width / this.width)
      let newHeightRatio = (height / this.height)
      this.scale([newWidthRatio, newHeightRatio])
      this.domEl.setAttribute('height', height * originalRatio)
      this.domEl.setAttribute('width', width * originalRatio)
      this.domEl.style.height = `${height}px`
      this.domEl.style.width = `${width}px`
    }

    root.destroy = function () {
      queueInstance.removeVdom(vDomInstance)
    }

    root.type = 'CANVAS'

    vDomInstance.root(root)

    if (config.events || config.events === undefined) {
      res.addEventListener('mousemove', (e) => {
        e.preventDefault()

        if (selectedNode && selectedNode.dom.drag && selectedNode.dom.drag.dragStartFlag && selectedNode.dom.drag.onDrag) {
          let event = selectedNode.dom.drag.event
          if (selectedNode.dom.drag.event) {
            event.dx = e.offsetX - event.x
            event.dy = e.offsetY - event.y
          }
          event.x = e.offsetX
          event.y = e.offsetY
          selectedNode.dom.drag.event = event
          selectedNode.dom.drag.onDrag.call(selectedNode, selectedNode.dataObj, event)
        } else {
          const tselectedNode = vDomInstance.eventsCheck([root], { x: e.offsetX, y: e.offsetY })
          if (selectedNode && tselectedNode !== selectedNode) {
            // console.log('i am out')
            // console.log(selectedNode.hovered)
            if ((selectedNode.dom.mouseout || selectedNode.dom.mouseleave) && selectedNode.hovered) {
              if (selectedNode.dom.mouseout) { selectedNode.dom.mouseout.call(selectedNode, selectedNode.dataObj, e) }
              if (selectedNode.dom.mouseleave) { selectedNode.dom.mouseleave.call(selectedNode, selectedNode.dataObj, e) }
            }
            selectedNode.hovered = false
            if (selectedNode.dom.drag && selectedNode.dom.drag.dragStartFlag) {
              selectedNode.dom.drag.dragStartFlag = false
              selectedNode.dom.drag.onDragEnd.call(selectedNode, selectedNode.dataObj, e)
              selectedNode.dom.drag.event = null
            }
          }
          if (selectedNode && tselectedNode === selectedNode) {
            // console.log(selectedNode)
            if (selectedNode.dom.drag && selectedNode.dom.drag.dragStartFlag && selectedNode.dom.drag.onDrag) {
              let event = selectedNode.dom.drag.event
              if (selectedNode.dom.drag.event) {
                event.dx = e.offsetX - event.x
                event.dy = e.offsetY - event.y
              }
              event.x = e.offsetX
              event.y = e.offsetY
              selectedNode.dom.drag.event = event
              selectedNode.dom.drag.onDrag.call(selectedNode, selectedNode.dataObj, event)
            }
          }
          if (tselectedNode) {
            selectedNode = tselectedNode
            if ((selectedNode.dom.mouseover || selectedNode.dom.mouseenter) &&
                !selectedNode.hovered) {
              if (selectedNode.dom.mouseover) { selectedNode.dom.mouseover.call(selectedNode, selectedNode.dataObj, e) }
              if (selectedNode.dom.mouseenter) { selectedNode.dom.mouseenter.call(selectedNode, selectedNode.dataObj, e) }
              selectedNode.hovered = true
            }
            if (selectedNode.dom.mousemove) {
              selectedNode.dom.mousemove.call(selectedNode, selectedNode.dataObj, e)
            }
          } else {
            selectedNode = undefined
          }
        }
      })
      res.addEventListener('click', (e) => {
        console.log('click')
        e.preventDefault()
        if (selectedNode && selectedNode.dom.click) { selectedNode.dom.click.call(selectedNode, selectedNode.dataObj, e) }
      })
      res.addEventListener('dblclick', (e) => {
        if (selectedNode && selectedNode.dom.dblclick) { selectedNode.dom.dblclick.call(selectedNode, selectedNode.dataObj, e) }
      })
      res.addEventListener('mousedown', (e) => {
        console.log('down')
        e.preventDefault()
        if (selectedNode && selectedNode.dom.mousedown) {
          selectedNode.dom.mousedown.call(selectedNode, selectedNode.dataObj, e)
          selectedNode.down = true
        }
        if (selectedNode && selectedNode.dom.drag && selectedNode.dom.drag.onDragStart) {
          selectedNode.dom.drag.dragStartFlag = true
          selectedNode.dom.drag.onDragStart.call(selectedNode, selectedNode.dataObj, e)
          let event = {}
          event.x = e.offsetX
          event.y = e.offsetY
          event.dx = 0
          event.dy = 0
          selectedNode.dom.drag.event = event
        }
      })
      res.addEventListener('mouseup', (e) => {
        e.preventDefault()
        if (selectedNode && selectedNode.dom.mouseup && selectedNode.down) {
          selectedNode.dom.mouseup.call(selectedNode, selectedNode.dataObj)
          selectedNode.down = false
        }
        if (selectedNode && selectedNode.dom.drag && selectedNode.dom.drag.dragStartFlag && selectedNode.dom.drag.onDragEnd) {
          selectedNode.dom.drag.dragStartFlag = false
          selectedNode.dom.drag.event = null
          selectedNode.dom.drag.onDragEnd.call(selectedNode, selectedNode.dataObj, e)
        }
      })
      res.addEventListener('mouseleave', (e) => {
        e.preventDefault()
        if (selectedNode && selectedNode.dom.mouseleave) {
          selectedNode.dom.mouseleave.call(selectedNode, selectedNode.dataObj, e)
        }
        if (selectedNode && selectedNode.dom.onDragEnd && selectedNode.dom.drag.dragStartFlag) {
          selectedNode.dom.drag.dragStartFlag = false
          selectedNode.dom.drag.event = null
          selectedNode.dom.drag.onDragEnd.call(selectedNode, selectedNode.dataObj, e)
        }
      })
      res.addEventListener('contextmenu', (e) => {
        e.preventDefault()
        if (selectedNode && selectedNode.dom.contextmenu) { selectedNode.dom.contextmenu.call(selectedNode, selectedNode.dataObj) }
      })
    }

    if (config.resize) {
      window.addEventListener('resize', function () {
        root.resize()
      })
    }
    queueInstance.execute()
    return root
  }

  i2d.SVGLayer = function SVGLayer (context, config) {
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

    root.container = res
    root.type = 'SVG'
    root.width = width
    root.height = height
    vDomInstance.root(root)

    root.resize = function () {
      let width = this.container.clientWidth
      let height = this.container.clientHeight
      let newWidthRatio = (width / this.width)
      let newHeightRatio = (height / this.height)
      this.scale([newWidthRatio, newHeightRatio])
      this.dom.setAttribute('height', height)
      this.dom.setAttribute('width', width)
    }

    root.destroy = function () {
      queueInstance.removeVdom(vDomInstance)
    }

    if (config && config.resize) {
      window.addEventListener('resize', function () {
        root.resize()
      })
    }

    queueInstance.execute()
    return root
  }

  i2d.Path = path.instance
  i2d.queue = queueInstance
  i2d.geometry = t2DGeometry
  i2d.chain = chain

  return i2d
}))