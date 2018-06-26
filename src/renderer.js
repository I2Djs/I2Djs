(function renderer (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./geometry.js'), require('./queue.js'), require('./easing.js'), require('./chaining.js'), require('./vDom.js'), require('./colorMap.js'), require('./path.js'), require('./shaders.js'), require('earcut'))
  } else if (typeof define === 'function' && define.amd) {
    define('i2d', ['./geometry.js', './queue.js', './easing.js', './chaining.js', './vDom.js', './colorMap.js', './path.js', './shaders.js', 'earcut'], (geometry, queue, easing, chain, vDom, colorMap, path, shaders, earcut) => factory(geometry, queue, easing, chain, vDom, colorMap, path, shaders, earcut))
  } else {
    root.i2d = factory(root.geometry, root.queue, root.easing, root.chain, root.vDom, root.colorMap, root.path, root.shaders, root.earcut)
  }
}(this, (geometry, queue, easing, chain, VDom, colorMap, path, shaders, earcut) => {
  'use strict'
  const i2d = {}
  const t2DGeometry = geometry('2D')
  const easying = easing()
  const queueInstance = queue()
  let Id = 0
  let animeIdentifier = 0
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

  function exec (value) {
    let d
    if (typeof value !== 'function') {
      return
    }
    for (let i = 0, len = this.stack.length; i < len; i += 1) {
      d = this.stack[i]
      value.call(d, d.dataObj, i)
    }
    return this
  }
  
  function on (eventType, hndlr) {
    for (let i = 0, len = this.stack.length; i < len; i += 1) {
      this.stack[i].on(eventType, hndlr)
    }
    return this
  }

  // function in (coOr) {
  //   for (let i = 0, len = this.stack.length; i < len; i += 1) {
  //     this.stack[i].in(coOr)
  //   }
  //   return this
  // }
  function remove () {
    for (let i = 0, len = this.stack.length; i < len; i += 1) {
      this.stack[i].remove()
    }
    return this
  }

  function addListener (eventType, hndlr) {
    this[eventType] = hndlr
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
      if (this.config.action.enter) {
        let nodes = {}
        this.selector.split(',').forEach(function (d) {
          nodes[d] = data
        })
        this.config.action.enter.call(this, nodes)
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
      if (this.config.action.exit) {
        let nodes = {}
        this.selector.split(',').forEach(function (d) {
          nodes[d] = self.fetchEls(d, [elData])
        })
        this.config.action.exit.call(this, nodes)
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
      if (this.config.action.exit) {
        let nodes = {}
        this.selector.split(',').forEach(function (d) {
          nodes[d] = self.fetchEls(d, data)
        })
        this.config.action.exit.call(this, nodes)
      }
      for (let i = 0, len = data.length; i < len; i++) {
        if (this.data.indexOf(data[i]) !== -1) {
          this.data.splice(this.data.indexOf(data[i]), 1)
        }
      }
    },
    enumerable: false,
    configurable: true,
    writable: false
  }
  CompositeArray.update = {
    value: function () {
      let self = this
      if (this.config.action.update) {
        let nodes = {}
        this.selector.split(',').forEach(function (d) {
          nodes[d] = self.fetchEls(d, self.data)
        })
        this.config.action.update.call(this, nodes)
      }
    },
    enumerable: false,
    configurable: true,
    writable: false
  }
  CompositeArray.join = {
    value: function (data) {
      dataJoin.call(this, data, this.selector, this.config)
    },
    enumerable: false,
    configurable: true,
    writable: false
  }

  function dataJoin (data, selector, config) {
    const self = this
    const selectors = selector.split(',')
    let { joinOn } = config
    let joinResult = {
      new: {},
      update: {},
      old: {}
    }
    if (!joinOn) { joinOn = function (d, i) { return i } }
    for (let i = 0, len = selectors.length; i < len; i++) {
      let d = selectors[i]
      const nodes = self.fetchEls(d)
      const join = performJoin(data, nodes.stack, joinOn)
      joinResult.new[d] = join.new
      joinResult.update[d] = (new CreateElements()).wrapper(join.update)
      joinResult.old[d] = (new CreateElements()).wrapper(join.old)
    }

    if (config.action) {
      if (config.action.enter) {
        config.action.enter.call(self, joinResult.new)
      }
      if (config.action.exit) {
        config.action.exit.call(self, joinResult.old)
      }
      if (config.action.update) {
        config.action.update.call(self, joinResult.update)
      }
    }
    // this.joinOn = joinOn
    CompositeArray.config = {
      value: config,
      enumerable: false,
      configurable: true,
      writable: true
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
      writable: true
    }
    return Object.create(self, CompositeArray)
  }

  const animate = function animate (self, targetConfig) {
    const tattr = targetConfig.attr ? targetConfig.attr : {}
    const tstyles = targetConfig.style ? targetConfig.style : {}
    const runStack = []
    let value

    if (typeof tattr !== 'function') {
      for (let key in tattr) {
        if (key !== 'transform') {
          let value = tattr[key]
          if (typeof value === 'function') {
            runStack[runStack.length] = function setAttr_ (f) {
              self.setAttr(key, value.call(self, f))
            }
          } else {
            if (key === 'd') {
              self.morphTo(targetConfig)
            } else {
              runStack[runStack.length] = attrTransition(self, key, tattr[key])
            }
          }
        } else {
          value = tattr[key]
          if (typeof value === 'function') {
            runStack[runStack.length] = transitionSetAttr(self, key, value)
          } else {
            const trans = self.attr.transform
            if (!trans) {
              self.attr.transform = {}
            }
            const subTrnsKeys = Object.keys(tattr.transform)
            for (let j = 0, jLen = subTrnsKeys.length; j < jLen; j += 1) {
              runStack[runStack.length] = transformTransition(
                self,
                subTrnsKeys[j],
                tattr.transform[subTrnsKeys[j]]
              )
            }
          }
        }
      }
    } else {
      runStack[runStack.length] = tattr.bind(self)
    }

    if (typeof tstyles !== 'function') {
      for (let style in tstyles) {
        runStack[runStack.length] = styleTransition(self, style, tstyles[style])
      }
    } else {
      runStack[runStack.length] = tstyles.bind(self)
    }

    return {
      run (f) {
        for (let j = 0, len = runStack.length; j < len; j += 1) {
          runStack[j](f)
        }
      },
      duration: targetConfig.duration,
      delay: targetConfig.delay ? targetConfig.delay : 0,
      end: targetConfig.end ? targetConfig.end.bind(self, self.dataObj) : null,
      loop: targetConfig.loop ? targetConfig.loop : 0,
      direction: targetConfig.direction ? targetConfig.direction : 'default',
      ease: targetConfig.ease ? targetConfig.ease : 'default'
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
    let srcVal = self.attr[key]
    // if (typeof value === 'function') {
    //   return function setAttr_ (f) {
    //     self.setAttr(key, value.call(self, f))
    //   }
    // }
    return function setAttr_ (f) {
      self.setAttr(key, t2DGeometry.intermediateValue(srcVal, value, f))
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
    } else {
      srcValue = self.style[key]
      if (isNaN(value)) {
        if (colorMap.isTypeColor(value)) {
          const colorExe = self instanceof WebglNodeExe ? colorMap.transitionObj(srcValue, value) : colorMap.transition(srcValue, value)
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
    let key
    for (key in config) {
      if (key !== 'end') {
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
      if (config.attr && typeof config.attr !== 'function') { newConfig.attr = resolveObject(config.attr, node, i) }
      if (config.style && typeof config.style !== 'function') { newConfig.style = resolveObject(config.style, node, i) }
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
      if (config.attr && typeof config.attr !== 'function') { newConfig.attr = resolveObject(config.attr, node, i) }
      if (config.style && typeof config.style !== 'function') { newConfig.style = resolveObject(config.style, node, i) }
      if (config.end) { newConfig.end = config.end }
      if (config.ease) { newConfig.ease = config.ease }

      exeArray.push(node.animateExe(newConfig))
    }
    return exeArray
  }

  const animatePathArrayTo = function animatePathArrayTo (config) {
    let node
    let keys = Object.keys(config)
    for (let i = 0, len = this.stack.length; i < len; i += 1) {
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

  const DomExe = function DomExe (dom, config, id, vDomIndex) {
    this.dom = dom
    this.nodeName = dom.nodeName
    this.attr = {}
    this.style = {}
    this.changedAttribute = {}
    this.changedStyles = {}
    this.id = id
    this.nodeType = 'svg'
    this.dom.nodeId = id
    this.children = []
    this.vDomIndex = vDomIndex
    
    if (config.style) { this.setStyle(config.style) }
    if (config.attr) { this.setAttr(config.attr) }
  }
  DomExe.prototype.node = function node () {
    this.execute()
    return this.dom
  }

  function updateAttrsToDom (self, key) {
    if (key !== 'transform') {
      let ind = key.indexOf(':')
      if (ind >= 0) {
        self.dom.setAttributeNS(nameSpace[key.slice(0, ind)], key.slice(ind + 1), self.changedAttribute[key])
      } else {
        if (key === 'text') {
          self.dom.textContent = self.changedAttribute[key]
        } else {
          self.dom.setAttribute(key, self.changedAttribute[key])
        }
      }
    }
  }

  function updateTransAttrsToDom (self) {
    let cmd = ''
    for (let trnX in self.attr.transform) {
      if (trnX === 'rotate') {
        cmd += `${trnX}(${self.attr.transform.rotate[0] + ' ' + (self.attr.transform.rotate[1] || 0) + ' ' + (self.attr.transform.rotate[2] || 0)}) `
      } else {
        cmd += `${trnX}(${self.attr.transform[trnX].join(' ')}) `
      }
    }
    self.dom.setAttribute('transform', cmd)
  }

  DomExe.prototype.transFormAttributes = function transFormAttributes () {
    let self = this
    for (let key in self.changedAttribute) {
      updateAttrsToDom(self, key)
    }
    if (this.changedAttribute.transform) {
      updateTransAttrsToDom(self)
    }
    this.changedAttribute = {}
  }
  DomExe.prototype.scale = function DMscale (XY) {
    if (!this.attr.transform) { this.attr.transform = {} }
    this.attr.transform.scale = XY
    this.changedAttribute.transform = this.attr.transform
    queueInstance.vDomChanged(this.vDomIndex)
    return this
  }
  DomExe.prototype.skewX = function DMskewX (x) {
    if (!this.attr.transform) { this.attr.transform = {} }
    this.attr.transform.skewX = [x]
    this.changedAttribute.transform = this.attr.transform
    queueInstance.vDomChanged(this.vDomIndex)
    return this
  }
  DomExe.prototype.skewY = function DMskewY (y) {
    if (!this.attr.transform) { this.attr.transform = {} }
    this.attr.transform.skewY = [y]
    this.changedAttribute.transform = this.attr.transform
    queueInstance.vDomChanged(this.vDomIndex)
    return this
  }

  DomExe.prototype.translate = function DMtranslate (XY) {
    if (!this.attr.transform) { this.attr.transform = {} }
    this.attr.transform.translate = XY
    this.changedAttribute.transform = this.attr.transform
    queueInstance.vDomChanged(this.vDomIndex)
    return this
  }
  DomExe.prototype.rotate = function DMrotate (angle, x, y) {
    if (!this.attr.transform) { this.attr.transform = {} }
    if (Object.prototype.toString.call(angle) === '[object Array]' && angle.length > 0) {
      this.attr.transform.rotate = [angle[0] || 0, angle[1] || 0, angle[2] || 0]
    } else {
      this.attr.transform.rotate = [angle, x || 0, y || 0]
    }
    this.changedAttribute.transform = this.attr.transform
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
      let key
      for (key in attr) {
        this.style[key] = attr[key]
        this.changedStyles[key] = attr[key]
      }
    }

    this.styleChanged = true
    queueInstance.vDomChanged(this.vDomIndex)
    return this
  }
  function pointsToString (points) {
    if (Object.prototype.toString.call(points) !== '[object Array]') {
      return
    }
    return points.reduce(function (p, c) {
      return p + c.x + ',' + c.y + ' '
    }, '')
  }
  DomExe.prototype.setAttr = function DMsetAttr (attr, value) {
    if (arguments.length === 2) {
      if (attr === 'points') {
        value = pointsToString(value)
      }
      this.attr[attr] = value
      this.changedAttribute[attr] = value
    } else if (arguments.length === 1 && typeof attr === 'object') {
      for (let key in attr) {
        if (key === 'points') {
          attr[key] = pointsToString(attr[key])
        }
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
  DomExe.prototype.getStyle = function DMgetStyle (_) {
    return this.style[_]
  }
  DomExe.prototype.execute = function DMexecute () {
    if (!this.styleChanged && !this.attrChanged) {
      for (let i = 0, len = this.children.length; i < len; i += 1) {
        this.children[i].execute()
      }
      return
    }
    this.transFormAttributes()

    for (let i = 0, len = this.children.length; i < len; i += 1) {
      this.children[i].execute()
    }

    for (let style in this.changedStyles) {
      if (this.changedStyles[style] instanceof DomGradients) {
        this.changedStyles[style] = this.changedStyles[style].exe()
      }
      this.dom.style.setProperty(style, this.changedStyles[style], '')
    }

    this.changedStyles = {}
  }
  DomExe.prototype.child = function DMchild (nodes) {
    const parent = this.dom
    const self = this
    if (nodes instanceof CreateElements) {
      var fragment = document.createDocumentFragment()
      for (let i = 0, len = nodes.stack.length; i < len; i++) {
        fragment.appendChild(nodes.stack[i].dom)
        nodes.stack[i].parentNode = self
        this.children[this.children.length] = nodes.stack[i]
      }
      parent.appendChild(fragment)
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
  DomExe.prototype.animatePathTo = path.animatePathTo
  DomExe.prototype.morphTo = path.morphTo

  DomExe.prototype.exec = function Cexe (exe) {
    if (typeof exe !== 'function') {
      console.Error('Wrong Exe type')
    }
    exe.call(this, this.dataObj)
    return this
  }

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
    if (!arguments.length) { return this.attr.text }
    this.attr['text'] = value
    this.changedAttribute['text'] = value
    return this
  }

  DomExe.prototype.remove = function DMremove () {
    this.parentNode.removeChild(this)
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
    const { children } = this
    const index = children.indexOf(obj)
    if (index !== -1) {
      this.dom.removeChild(children.splice(index, 1)[0].dom)
    }
  }

  function createDomElement (obj, vDomIndex) {
    let dom = null

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
        self.ctx.translate(transform.rotate[1] || 0, transform.rotate[2] || 0)
        self.ctx.rotate(transform.rotate[0] * (Math.PI / 180))
        self.ctx.translate(-transform.rotate[1] || 0, -transform.rotate[2] || 0)
      }
    }
    for (let i = 0; i < self.stack.length; i += 1) {
      self.stack[i].execute()
    }
  }

  function RPolyupdateBBox () {
    const self = this
    let translateX = 0
    let translateY = 0
    let scaleX = 1
    let scaleY = 1
    const { transform } = self.attr
    if (self.attr.points && self.attr.points.length > 0) {
      let points = self.attr.points

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
      self.BBoxHit = t2DGeometry.rotateBBox(this.BBox, transform)
    } else {
      self.BBoxHit = this.BBox
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
    this.mode = (!this.config.mode || this.config.mode === 'percent') ? 'percent' : 'absolute'
  }
  CanvasGradients.prototype.exe = function GRAexe (ctx, BBox) {
    if (this.type === 'linear' && this.mode === 'percent') {
      return this.linearGradient(ctx, BBox)
    } if (this.type === 'linear' && this.mode === 'absolute') {
      return this.absoluteLinearGradient(ctx)
    } else if (this.type === 'radial' && this.mode === 'percent') {
      return this.radialGradient(ctx, BBox)
    } else if (this.type === 'radial' && this.mode === 'absolute') {
      return this.absoluteRadialGradient(ctx)
    }
    console.Error('wrong Gradiant type')
  }
  CanvasGradients.prototype.linearGradient = function GralinearGradient (ctx, BBox) {
    const lGradient = ctx.createLinearGradient(
      BBox.x + BBox.width * (this.config.x1 / 100), BBox.y + BBox.height * (this.config.y1 / 100),
      BBox.x + BBox.width * (this.config.x2 / 100), BBox.y + BBox.height * (this.config.y2 / 100)
    )

    this.config.colorStops.forEach((d) => {
      lGradient.addColorStop((d.value / 100), d.color)
    })

    return lGradient
  }
  CanvasGradients.prototype.absoluteLinearGradient = function absoluteGralinearGradient (ctx) {
    const lGradient = ctx.createLinearGradient(
      this.config.x1, this.config.y1,
      this.config.x2, this.config.y2
    )

    this.config.colorStops.forEach((d) => {
      lGradient.addColorStop(d.value, d.color)
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
  CanvasGradients.prototype.absoluteRadialGradient = function absoluteGraradialGradient (ctx, BBox) {
    const cGradient = ctx.createRadialGradient(
      this.config.innerCircle.x,
      this.config.innerCircle.y,
      this.config.innerCircle.r,
      this.config.outerCircle.x,
      this.config.outerCircle.y,
      this.config.outerCircle.r
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
    canvas.style.height = `${height}px`
    canvas.style.width = `${width}px`
    return canvas
  }

  function createCanvasPattern (patternObj, repeatInd) {
  }
  createCanvasPattern.prototype = {
  }
  createCanvasPattern.prototype.setAttr = function CPsetAttr (attr, value) {
    // this.attr[attr] = value
  }
  createCanvasPattern.prototype.execute = function CPexecute () {
  }

  function applyStyles () {
    if (this.ctx.fillStyle !== '#000000') { this.ctx.fill() }
    if (this.ctx.strokeStyle !== '#000000') { this.ctx.stroke() }
  }

  function CanvasDom () {
    this.BBox = { x: 0, y: 0, width: 0, height: 0 }
    this.BBoxHit = { x: 0, y: 0, width: 0, height: 0 }
  }
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
      width: (width || 0) * scaleX,
      height: (height || 0) * scaleY
    }

    if (transform && transform.rotate) {
      self.BBoxHit = t2DGeometry.rotateBBox(this.BBox, transform)
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
    this.attr.text = value
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
      width: this.ctx.measureText(this.attr.text).width * scaleX,
      height: height * scaleY
    }

    if (transform && transform.rotate) {
      self.BBoxHit = t2DGeometry.rotateBBox(this.BBox, transform)
    } else {
      self.BBoxHit = this.BBox
    }
  }
  RenderText.prototype.execute = function RTexecute () {
    if (this.attr.text !== undefined && this.attr.text !== null) {
      if (this.ctx.fillStyle !== '#000000') {
        this.ctx.fillText(this.attr.text, this.attr.x, this.attr.y)
      }
      if (this.ctx.strokeStyle !== '#000000') {
        this.ctx.strokeText(this.attr.text, this.attr.x, this.attr.y)
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
      self.BBoxHit = t2DGeometry.rotateBBox(this.BBox, transform)
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
      self.BBoxHit = t2DGeometry.rotateBBox(this.BBox, transform)
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

  function RenderPolyline (ctx, props, stylesProps) {
    const self = this
    self.ctx = ctx
    self.attr = props
    self.style = stylesProps
    self.nodeName = 'polyline'

    self.stack = [self]
  }
  RenderPolyline.prototype = new CanvasDom()
  RenderPolyline.constructor = RenderPolyline
  RenderPolyline.prototype.execute = function polylineExe () {
    let self = this
    if (!this.attr.points) return
    this.ctx.beginPath()
    this.attr.points.forEach(function (d, i) {
      if (i === 0) {
        self.ctx.moveTo(d.x, d.y)
      } else {
        self.ctx.lineTo(d.x, d.y)
      }
    })
    this.applyStyles()
    this.ctx.closePath()
  }
  RenderPolyline.prototype.updateBBox = RPolyupdateBBox
  RenderPolyline.prototype.in = function RPolyLinfun (co) {
    let flag = false
    for (let i = 0, len = this.attr.points.length; i <= len - 2; i++) {
      let p1 = this.attr.points[i]
      let p2 = this.attr.points[i + 1]
      flag = flag || parseFloat(t2DGeometry.getDistance({ x: p1.x, y: p1.y }, co) +
        t2DGeometry.getDistance(co, { x: p2.x, y: p2.y })).toFixed(1) ===
      parseFloat(t2DGeometry.getDistance(
        { x: p1.x, y: p1.y },
        { x: p2.x, y: p2.y }
      )).toFixed(1)
    }
    return flag
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
      self.BBoxHit = t2DGeometry.rotateBBox(this.BBox, transform)
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
      if (this.ctx.fillStyle !== '#000000') { this.ctx.fill(this.pathNode) }
      if (this.ctx.strokeStyle !== '#000000') { this.ctx.stroke(this.pathNode) }
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
    points_.push({x: parseFloat(localPoints[0]), y: parseFloat(localPoints[1])})
    for (let i = 2; i < localPoints.length; i += 2) {
      polygon.lineTo(localPoints[i], localPoints[i + 1])
      points_.push({x: parseFloat(localPoints[i]), y: parseFloat(localPoints[i + 1])})
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
      this.attr.points = this.polygon.points
    }
  }
  RenderPolygon.prototype.updateBBox = RPolyupdateBBox
  RenderPolygon.prototype.execute = function RPolyexecute () {
    if (this.attr.points) {
      if (this.ctx.fillStyle !== '#000000') { this.ctx.fill(this.polygon.path) }
      if (this.ctx.strokeStyle !== '#000000') { this.ctx.stroke(this.polygon.path) }
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
      self.BBoxHit = t2DGeometry.rotateBBox(this.BBox, transform)
    } else {
      self.BBoxHit = this.BBox
    }
  }
  RenderEllipse.prototype.execute = function REexecute () {
    const { ctx } = this
    ctx.beginPath()
    ctx.ellipse(this.attr.cx, this.attr.cy, this.attr.rx, this.attr.ry, 0, 0, 2 * Math.PI)
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
      self.BBoxHit = t2DGeometry.rotateBBox(this.BBox, transform)
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
    if (ctx.strokeStyle !== '#000000') {
      ctx.strokeRect(this.attr.x, this.attr.y, this.attr.width, this.attr.height)
    }
    if (ctx.fillStyle !== '#000000') {
      ctx.fillRect(this.attr.x, this.attr.y, this.attr.width, this.attr.height)
    }
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
      self.BBoxHit = t2DGeometry.rotateBBox(this.BBox, this.attr.transform)
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
    this.style = {}
    this.attr = {}
    this.id = id
    this.nodeName = config.el
    this.nodeType = 'CANVAS'
    this.children = []
    this.ctx = context
    this.vDomIndex = vDomIndex
    this.bbox = config['bbox'] !== undefined ? config['bbox'] : true

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
      case 'polyline':
        this.dom = new RenderPolyline(this.ctx, this.attr, this.style)
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

    if (config.style) { this.setStyle(config.style) }
    if (config.attr) { this.setAttr(config.attr) }
  }

  CanvasNodeExe.prototype.node = function Cnode () {
    this.updateBBox()
    return this.dom
  }
  CanvasNodeExe.prototype.stylesExe = function CstylesExe () {
    let value
    let key

    for (key in this.style) {
      if (typeof this.style[key] !== 'function' && !(this.style[key] instanceof CanvasGradients)) {
        value = this.style[key]
      } else if (typeof this.style[key] === 'function') {
        this.style[key] = this.style[key].call(this, this.dataObj)
        value = this.style[key]
      } else if (this.style[key] instanceof CanvasGradients) {
        value = this.style[key].exe(this.ctx, this.dom.BBox)
      } else {
        console.log('unkonwn Style')
      }

      if (typeof this.ctx[key] !== 'function') {
        this.ctx[key] = value
      } else if (typeof this.ctx[key] === 'function') {
        this.ctx[key](value)
      } else { console.log('junk comp') }
    }
  }

  CanvasNodeExe.prototype.remove = function Cremove () {
    const { children } = this.dom.parent
    const index = children.indexOf(this)
    if (index !== -1) {
      children.splice(index, 1)
    }
    this.BBoxUpdate = true
    queueInstance.vDomChanged(this.vDomIndex)
  }

  CanvasNodeExe.prototype.attributesExe = function CattributesExe () {
    this.dom.render(this.attr)
  }
  CanvasNodeExe.prototype.setStyle = function CsetStyle (attr, value) {
    if (arguments.length === 2) {
      this.style[attr] = valueCheck(value)
    } else if (arguments.length === 1 && typeof attr === 'object') {
      const styleKeys = Object.keys(attr)
      for (let i = 0, len = styleKeys.length; i < len; i += 1) {
        this.style[styleKeys[i]] = valueCheck(attr[styleKeys[i]])
      }
    }
    queueInstance.vDomChanged(this.vDomIndex)
    return this
  }

  function valueCheck (value) {
    return (value === '#000' || value === '#000000' || value === 'black') ? 'rgba(0, 0, 0, 0.9)' : value
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
  CanvasNodeExe.prototype.getStyle = function DMgetStyle (_) {
    return this.style[_]
  }
  CanvasNodeExe.prototype.rotate = function Crotate (angle, x, y) {
    if (!this.attr.transform) { this.attr.transform = {} }
    if (Object.prototype.toString.call(angle) === '[object Array]') {
      this.attr.transform.rotate = [angle[0] || 0, angle[1] || 0, angle[2] || 0]
    } else {
      this.attr.transform.rotate = [angle, x || 0, y || 0]
    }
    // this.attr.transform.cx = x
    // this.attr.transform.cy = y
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
    // let fillStyle = this.ctx.fillStyle
    // let strokeStyle = this.ctx.strokeStyle
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
    // this.ctx.fillStyle = fillStyle
    // this.ctx.strokeStyle = strokeStyle
  }

  CanvasNodeExe.prototype.child = function child (childrens) {
    const self = this
    const childrensLocal = childrens
    if (self.dom instanceof RenderGroup) {
      for (let i = 0; i < childrensLocal.length; i += 1) {
        childrensLocal[i].dom.parent = self
        self.children[self.children.length] = childrensLocal[i]
      }
    } else { console.error('Trying to insert child to nonGroup Element') }

    this.BBoxUpdate = true
    queueInstance.vDomChanged(this.vDomIndex)
    return self
  }
  CanvasNodeExe.prototype.fetchEl = cfetchEl
  CanvasNodeExe.prototype.fetchEls = cfetchEls

  CanvasNodeExe.prototype.updateBBox = function CupdateBBox () {
    let status
    for (let i = 0, len = this.children.length; i < len; i += 1) {
      if (this.bbox) {
        status = this.children[i].updateBBox() || status
      }
    }
    if (this.bbox) {
      if (this.BBoxUpdate || status) {
        this.dom.updateBBox(this.children)
        this.BBoxUpdate = false
        return true
      }
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
  CanvasNodeExe.prototype.exec = function Cexe (exe) {
    if (typeof exe !== 'function') {
      console.Error('Wrong Exe type')
    }
    exe.call(this, this.dataObj)
    return this
  }
  CanvasNodeExe.prototype.animateTo = animateTo
  CanvasNodeExe.prototype.animateExe = animateExe
  CanvasNodeExe.prototype.animatePathTo = path.animatePathTo
  CanvasNodeExe.prototype.morphTo = path.morphTo
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
    const bbox = config ? (config['bbox'] !== undefined ? config['bbox'] : true) : true

    this.stack = data.map((d, i) => {
      let node

      if (contextInfo.type === 'SVG') {
        node = createDomElement({
          el: config.el
        }, vDomIndex)
      } else if (contextInfo.type === 'CANVAS') {
        node = new CanvasNodeExe(contextInfo.ctx, {
          el: config.el,
          bbox: bbox
        }, domId(), vDomIndex)
      } else if (contextInfo.type === 'WEBGL') {
        node = new WebglNodeExe(contextInfo.ctx, {
          el: config.el,
          bbox: bbox
        }, domId(), vDomIndex)
      } else {
        console.log('unknow type')
      }

      for (let j = 0, len = attrKeys.length; j < len; j += 1) {
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
      for (let j = 0, len = styleKeys.length; j < len; j += 1) {
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
    exec,
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
      for (let i = 0, len = nodes.length; i < len; i++) {
        let node = nodes[i]
        if (node instanceof DomExe ||
            node instanceof CanvasNodeExe ||
            node instanceof WebglNodeExe ||
            node instanceof CreateElements) {
          self.stack.push(node)
        } else { self.stack.push(new DomExe(node, {}, domId())) }
      }
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

  i2d.CanvasLayer = function CanvasLayer (context, config = {}) {
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

    // ctx.strokeStyle = 'rgba(0, 0, 0, 0)';
    // ctx.fillStyle = 'rgba(0, 0, 0, 0)';

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
    root.type = 'CANVAS'
    root.execute = function executeExe () {
      onClear(ctx)
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
      root.updateBBox()
      execute()
    }

    root.setAttr = function (prop, value) {
      if (arguments.length === 2) {
        config[prop] = value
      } else if (arguments.length === 1 && typeof prop === 'object') {
        const props = Object.keys(prop)
        for (let i = 0, len = props.length; i < len; i += 1) {
          config[props[i]] = prop[props[i]]
        }
      }
      renderVdom.call(this)
    }

    root.resize = renderVdom

    function renderVdom () {
      let width = config.width ? config.width : this.container.clientWidth
      let height = config.height ? config.height : this.container.clientHeight
      this.domEl.setAttribute('height', height * originalRatio)
      this.domEl.setAttribute('width', width * originalRatio)
      this.domEl.style.height = `${height}px`
      this.domEl.style.width = `${width}px`
      if (config.rescale) {
        let newWidthRatio = (width / this.width)
        let newHeightRatio = (height / this.height)
        this.scale([newWidthRatio, newHeightRatio])
      } else {
        this.execute()
      }
      this.height = height
      this.width = width
    }

    function canvasResize () {
      if (config.resize && typeof config.resize === 'function') {
        config.resize()
      }
      root.resize()
    }

    window.addEventListener('resize', canvasResize)

    root.destroy = function () {
      window.removeEventListener('resize', canvasResize)
      layer.remove()
      queueInstance.removeVdom(vDomInstance)
    }

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
        e.preventDefault()
        if (selectedNode && selectedNode.dom.click) { selectedNode.dom.click.call(selectedNode, selectedNode.dataObj, e) }
      })
      res.addEventListener('dblclick', (e) => {
        if (selectedNode && selectedNode.dom.dblclick) { selectedNode.dom.dblclick.call(selectedNode, selectedNode.dataObj, e) }
      })
      res.addEventListener('mousedown', (e) => {
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

    queueInstance.execute()
    return root
  }

  i2d.SVGLayer = function SVGLayer (context, config = {}) {
    const vDomInstance = new VDom()
    const vDomIndex = queueInstance.addVdom(vDomInstance)
    const res = document.querySelector(context)
    const height = config.height ? config.height : res.clientHeight
    const width = config.width ? config.width : res.clientWidth
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

    // root.resize = renderVdom

    root.setAttr = function (prop, value) {
      if (arguments.length === 2) {
        config[prop] = value
      } else if (arguments.length === 1 && typeof prop === 'object') {
        const props = Object.keys(prop)
        for (let i = 0, len = props.length; i < len; i += 1) {
          config[props[i]] = prop[props[i]]
        }
      }
      renderVdom.call(this)
    }

    function renderVdom () {
      let width = config.width ? config.width : this.container.clientWidth
      let height = config.height ? config.height : this.container.clientHeight
      let newWidthRatio = (width / this.width)
      let newHeightRatio = (height / this.height)
      if (config && config.rescale) {
        this.scale([newWidthRatio, newHeightRatio])
      }
      this.dom.setAttribute('height', height)
      this.dom.setAttribute('width', width)
    }

    function svgResize () {
      if (config.resize && typeof config.resize === 'function') {
        config.resize()
      }
      renderVdom.call(root)
    }

    window.addEventListener('resize', svgResize)

    root.destroy = function () {
      window.removeEventListener('resize', svgResize)
      layer.remove()
      queueInstance.removeVdom(vDomInstance)
    }

    queueInstance.execute()
    return root
  }

  function loadShader (ctx, shaderSource, shaderType) {
    var shader = ctx.createShader(shaderType)
    ctx.shaderSource(shader, shaderSource)
    ctx.compileShader(shader)
    var compiled = ctx.getShaderParameter(shader, ctx.COMPILE_STATUS)
    if (!compiled) {
      var lastError = ctx.getShaderInfoLog(shader)
      console.error("*** Error compiling shader '" + shader + "':" + lastError)
      ctx.deleteShader(shader)
      return null
    }
    return shader
  }

  function createProgram (ctx, shaders) {
    var program = ctx.createProgram()
    shaders.forEach(function (shader) {
      ctx.attachShader(program, shader)
    })
    ctx.linkProgram(program)

    var linked = ctx.getProgramParameter(program, ctx.LINK_STATUS)
    if (!linked) {
      var lastError = ctx.getProgramInfoLog(program)
      console.error('Error in program linking:' + lastError)
      ctx.deleteProgram(program)
      return null
    }
    return program
  }

  function getProgram (ctx, shaderCode) {
    var shaders = [
      loadShader(ctx, shaderCode.vertexShader, ctx.VERTEX_SHADER),
      loadShader(ctx, shaderCode.fragmentShader, ctx.FRAGMENT_SHADER)
    ]
    return createProgram(ctx, shaders)
  }

  function PointNode (attr, style) {
    this.attr = attr || {}
    this.style = style || {}
  }
  PointNode.prototype.setAttr = function (prop, value) {
    this.attr[prop] = value
  }
  // PointNode.prototype.getAttr = function (key) {
  //   return this.attr[key]
  // }
  // PointNode.prototype.setStyle = function (prop, value) {
  //   this.attr[prop] = value
  // }
  // PointNode.prototype.getStyle = function (key) {
  //   return this.style[key]
  // }

  function RectNode (attr, style) {
    this.attr = attr || {}
    this.style = style || {}
  }
  RectNode.prototype.setAttr = function (key, value) {
    this.attr[key] = value
    // this.nodeExe.parent.shader.updatePosition(this.nodeExe.parent.children.indexOf(this.nodeExe), this.nodeExe)
  }
  // RectNode.prototype.getAttr = function (key) {
  //   return this.attr[key]
  // }
  // RectNode.prototype.setStyle = function (key, value) {
  //   this.style[key] = value
  // }
  // RectNode.prototype.getStyle = function (key) {
  //   return this.style[key]
  // }

  function PolyLineNode (attr, style) {
    this.attr = attr || {}
    this.style = style || {}
  }
  PolyLineNode.prototype.setAttr = function (key, value) {
    this.attr[key] = value
  }
  PolyLineNode.prototype.getAttr = function (key) {
    return this.attr[key]
  }
  PolyLineNode.prototype.setStyle = function (key, value) {
    this.style[key] = value
  }
  PolyLineNode.prototype.getStyle = function (key) {
    return this.style[key]
  }

  function LineNode (attr, style) {
    this.attr = attr || {}
    this.style = style || {}
  }
  LineNode.prototype.setAttr = function (key, value) {
    this.attr[key] = value
  }
  LineNode.prototype.getAttr = function (key) {
    return this.attr[key]
  }
  LineNode.prototype.setStyle = function (key, value) {
    this.style[key] = value
  }
  LineNode.prototype.getStyle = function (key) {
    return this.style[key]
  }

  function polygonPointsMapper (value) {
    return earcut(value.reduce(function (p, c) {
      p.push(c.x)
      p.push(c.y)
      return p
    }, [])).map(function (d) {
      return value[d]
    })
  }

  function PolygonNode (attr, style) {
    this.attr = attr
    this.style = style
    if (this.attr['points']) {
      this.attr.triangulatedPoints = polygonPointsMapper(this.attr['points'])
    }
  }
  PolygonNode.prototype.setAttr = function (key, value) {
    if (key === 'points') {
      this.attr.triangulatedPoints = polygonPointsMapper(value)
    }
  }
  PolygonNode.prototype.getAttr = function (key) {
    return this.attr[key]
  }
  PolygonNode.prototype.getStyle = function (key) {
    return this.style[key]
  }

  function CircleNode (attr, style) {
    this.attr = attr
    this.style = style
  }
  CircleNode.prototype.setAttr = function (key, value) {
    this.attr[key] = value
  }
  CircleNode.prototype.getAttr = function (key) {
    return this.attr[key]
  }
  CircleNode.prototype.getStyle = function (key) {
    return this.style[key]
  }

  let webGLImageTextures = {}

  function isPowerOf2 (value) {
    return (value & (value - 1)) === 0
  }

  function ImageNode (ctx, attr, style) {
    let self = this
    this.attr = attr
    this.style = style
    this.image = new Image()
    // self.image.crossOrigin="anonymous"
    // self.image.setAttribute('crossOrigin', '*');

    this.image.onload = function onload () {
      this.crossOrigin = 'anonymous'
      queueInstance.vDomChanged(self.nodeExe.vDomIndex)
      if (!webGLImageTextures[self.attr.src]) {
        let texture = ctx.createTexture()
        ctx.bindTexture(ctx.TEXTURE_2D, texture)
        ctx.texImage2D(ctx.TEXTURE_2D, 0, ctx.RGBA, ctx.RGBA, ctx.UNSIGNED_BYTE, self.image)
        if (isPowerOf2(self.image.width) && isPowerOf2(self.image.height)) {
          // Yes, it's a power of 2. Generate mips.
          console.log('mips')
          ctx.generateMipmap(ctx.TEXTURE_2D)
          ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.NEAREST_MIPMAP_LINEAR)
          ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.NEAREST)
        } else {
          ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_S, ctx.CLAMP_TO_EDGE)
          ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_T, ctx.CLAMP_TO_EDGE)
          ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.NEAREST)
          ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.NEAREST)
        }
        webGLImageTextures[self.attr.src] = texture
      }
      // self.loadStatus = true
    }
    this.image.onerror = function onerror (onerrorExe) {
      if (onerrorExe && typeof onerrorExe === 'function') {
        // onerrorExe.call(nodeExe)
      }
    }
    if (this.attr.src) { this.image.src = this.attr.src }
  }
  ImageNode.prototype.setAttr = function (key, value) {
    this.attr[key] = value
    if (key === 'src') {
      this.image.src = this.attr.src
    }
  }
  ImageNode.prototype.getAttr = function (key) {
    return this.attr[key]
  }
  ImageNode.prototype.getStyle = function (key) {
    return this.style[key]
  }


  function writeDataToShaderAttributes (ctx, data) {
    let d
    for (let i = 0, len = data.length; i < len; i++) {
      d = data[i]
      ctx.bindBuffer(d.bufferType, d.buffer)
      ctx.bufferData(d.bufferType, d.data, d.drawType)
      ctx.enableVertexAttribArray(d.attribute)
      ctx.vertexAttribPointer(d.attribute, d.size, d.valueType, true, 0, 0)
    }
  }

  let defaultColor = {r: 0, g: 0, b: 0, a: 255.0}

  function webGlAttrMapper (ctx, program, attr, attrObj) {
    return {
      bufferType: ctx[attrObj.bufferType],
      buffer: ctx.createBuffer(),
      drawType: ctx[attrObj.drawType],
      valueType: ctx[attrObj.valueType],
      size: attrObj.size,
      attribute: ctx.getAttribLocation(program, attr),
      data: attrObj.data
    }
  }

  function webGlUniformMapper (ctx, program, uniform, uniObj) {
    return {
      type: uniObj.type,
      data: uniObj.data,
      attribute: ctx.getUniformLocation(program, uniform)
    }
  }

  function RenderWebglShader (ctx, shader, vDomIndex) {
    this.ctx = ctx
    this.dom = {}
    this.shader = shader
    this.vDomIndex = vDomIndex
    this.program = getProgram(ctx, shader)
    this.uniforms = {}
    this.drawArrays = shader.drawArrays
    for (let uniform in shader.uniforms) {
      this.uniforms[uniform] = webGlUniformMapper(ctx, this.program, uniform, shader.uniforms[uniform])
    }
    this.inputs = []
    for (let attr in shader.attributes) {
      this.inputs.push(webGlAttrMapper(ctx, this.program, attr, shader.attributes[attr]))
    }
  }

  RenderWebglShader.prototype.execute = function () {
    this.ctx.useProgram(this.program)
    for (let uniform in this.uniforms) {
      this.ctx[this.uniforms[uniform].type](this.uniforms[uniform].attribute, this.uniforms[uniform].data)
    }
    writeDataToShaderAttributes(this.ctx, this.inputs)
    for (let item in this.drawArrays) {
      this.ctx.drawArrays(this.ctx[this.drawArrays[item].type], this.drawArrays[item].start, this.drawArrays[item].end)
    }
  }

  RenderWebglShader.prototype.addUniform = function (key, value) {
    this.uniforms[key] = value
  }
  RenderWebglShader.prototype.addAttribute = function (key, value) {
    this.attribute[key] = value
  }
  RenderWebglShader.prototype.setAttribute = function (key, value) {

  }
  RenderWebglShader.prototype.setUniformData = function (key, value) {
    this.uniforms[key].data = value
    queueInstance.vDomChanged(this.vDomIndex)
  }

  function RenderWebglPoints (ctx, attr, style, vDomIndex) {
    this.ctx = ctx
    this.dom = {}
    this.attr = attr || {}
    this.style = style || {}
    this.vDomIndex = vDomIndex
    this.program = getProgram(ctx, shaders('point'))
    this.colorBuffer = ctx.createBuffer()
    this.sizeBuffer = ctx.createBuffer()
    this.positionBuffer = ctx.createBuffer()
    this.positionAttributeLocation = ctx.getAttribLocation(this.program, 'a_position')
    this.colorAttributeLocation = ctx.getAttribLocation(this.program, 'a_color')
    this.sizeAttributeLocation = ctx.getAttribLocation(this.program, 'a_size')
    this.resolutionUniformLocation = ctx.getUniformLocation(this.program, 'u_resolution')
    this.translationUniformLocation = ctx.getUniformLocation(this.program, 'u_translate')
    this.scaleUniformLocation = ctx.getUniformLocation(this.program, 'u_scale')
    // this.ctx.uniform2f(this.resolutionUniformLocation, this.ctx.canvas.width, this.ctx.canvas.height)
    this.positionArray = []
    this.colorArray = []
    this.pointsSize = []
    this.inputs = [{
      bufferType: this.ctx.ARRAY_BUFFER,
      buffer: this.colorBuffer,
      drawType: this.ctx.STATIC_DRAW,
      valueType: this.ctx.UNSIGNED_BYTE,
      size: 4,
      attribute: this.colorAttributeLocation
    }, {
      bufferType: this.ctx.ARRAY_BUFFER,
      buffer: this.sizeBuffer,
      drawType: this.ctx.STATIC_DRAW,
      valueType: this.ctx.FLOAT,
      size: 1,
      attribute: this.sizeAttributeLocation
    }, {
      bufferType: this.ctx.ARRAY_BUFFER,
      buffer: this.positionBuffer,
      drawType: this.ctx.STATIC_DRAW,
      valueType: this.ctx.FLOAT,
      size: 2,
      attribute: this.positionAttributeLocation
    }]

    if (!this.attr.transform) {
      this.attr.transform = {
        translate: [0.0, 0.0],
        scale: [1.0, 1.0]
      }
    }
  }
  RenderWebglPoints.prototype.remove = function (position) {
    this.positionArray.splice(position * 2, 2)
    this.pointsSize.splice(position, 1)
    this.colorArray.splice(position * 4, 4)
  }
  RenderWebglPoints.prototype.execute = function (stack) {
    let positionArray = this.positionArray
    let colorArray = this.colorArray
    let pointsSize = this.pointsSize
    let node
    let fill
    let styleFlag = false
    let attrFlag = false
    for (var i = 0, len = stack.length; i < len; i++) {
      node = stack[i]
      if (node.propChanged) {
        positionArray[i * 2] = node.attr.x
        positionArray[i * 2 + 1] = node.attr.y
        pointsSize[i] = (node.attr.size || 1.0) * ratio
        attrFlag = true
        node.propChanged = false
      }
      if (node.styleChanged) {
        fill = node.style.fill || defaultColor
        colorArray[i * 4] = fill.r
        colorArray[i * 4 + 1] = fill.g
        colorArray[i * 4 + 2] = fill.b
        colorArray[i * 4 + 3] = (fill.a === undefined ? 255 : fill.a)
        styleFlag = true
        node.styleChanged = false
      }
    }

    if (attrFlag) {
      this.inputs[2].data = new Float32Array(positionArray)
      this.inputs[1].data = new Float32Array(pointsSize)
    }

    if (styleFlag) {
      this.inputs[0].data = new Uint8Array(colorArray)
    }
    if (!this.attr.transform.scale) {
      this.attr.transform.scale = [1.0, 1.0]
    }
    if (!this.attr.transform.translate) {
      this.attr.transform.translate = [0.0, 0.0]
    }
    this.ctx.useProgram(this.program)
    writeDataToShaderAttributes(this.ctx, this.inputs)
    this.ctx.uniform2f(this.resolutionUniformLocation, this.ctx.canvas.width / ratio, this.ctx.canvas.height / ratio)
    this.ctx.uniform2fv(this.translationUniformLocation, [this.attr.transform.translate[0], this.attr.transform.translate[1]])
    this.ctx.uniform2fv(this.scaleUniformLocation, [this.attr.transform.scale[0], this.attr.transform.scale[1]])
    this.ctx.drawArrays(this.ctx.POINTS, 0, positionArray.length / 2)
  }

  function RenderWebglRects (ctx, attr, style, vDomIndex) {
    this.ctx = ctx
    this.dom = {}
    this.attr = attr || {}
    this.style = style || {}
    this.vDomIndex = vDomIndex
    this.program = getProgram(ctx, shaders('rect'))
    this.colorBuffer = ctx.createBuffer()
    this.positionBuffer = ctx.createBuffer()
    this.positionAttributeLocation = ctx.getAttribLocation(this.program, 'a_position')
    this.colorAttributeLocation = ctx.getAttribLocation(this.program, 'a_color')
    this.resolutionUniformLocation = ctx.getUniformLocation(this.program, 'u_resolution')
    this.translationUniformLocation = ctx.getUniformLocation(this.program, 'u_translate')
    this.scaleUniformLocation = ctx.getUniformLocation(this.program, 'u_scale')
    this.positionArray = []
    this.colorArray = []
    this.inputs = [{
      data: this.colorArray,
      bufferType: this.ctx.ARRAY_BUFFER,
      buffer: this.colorBuffer,
      drawType: this.ctx.STATIC_DRAW,
      valueType: this.ctx.UNSIGNED_BYTE,
      size: 4,
      attribute: this.colorAttributeLocation
    }, {
      data: new Float32Array(this.positionArray),
      bufferType: this.ctx.ARRAY_BUFFER,
      buffer: this.positionBuffer,
      drawType: this.ctx.STATIC_DRAW,
      valueType: this.ctx.FLOAT,
      size: 2,
      attribute: this.positionAttributeLocation
    }]
    if (!this.attr.transform) {
      this.attr.transform = {
        translate: [0.0, 0.0],
        scale: [1.0, 1.0]
      }
    }
  }
  RenderWebglRects.prototype.remove = function (position) {
    this.positionArray.splice(position * 12, 12)
    this.colorArray.splice(position * 24, 24)
  }
  RenderWebglRects.prototype.execute = function (stack) {
    let positionArray = this.positionArray
    let colorArray = this.colorArray
    let fill, r, g, b, a, x1, x2, y1, y2
    let node
    let ti
    let posi
    for (var i = 0, len = stack.length; i < len; i++) {
      node = stack[i]
      if (node.propChanged) {
        x1 = node.attr.x
        x2 = x1 + node.attr.width
        y1 = node.attr.y
        y2 = y1 + node.attr.height
        posi = i * 12
        positionArray[posi] = positionArray[posi + 4] = positionArray[posi + 6] = x1
        positionArray[posi + 1] = positionArray[posi + 3] = positionArray[posi + 9] = y1
        positionArray[posi + 2] = positionArray[posi + 8] = positionArray[posi + 10] = x2
        positionArray[posi + 5] = positionArray[posi + 7] = positionArray[posi + 11] = y2
        node.propChanged = false
      }
      if (node.styleChanged) {
        fill = node.style.fill || defaultColor
        r = fill.r
        g = fill.g
        b = fill.b
        a = (fill.a === undefined ? 255 : fill.a)
        ti = i * 24
        colorArray[ti] = colorArray[ti + 4] = colorArray[ti + 8] = colorArray[ti + 12] = colorArray[ti + 16] = colorArray[ti + 20] = r
        colorArray[ti + 1] = colorArray[ti + 5] = colorArray[ti + 9] = colorArray[ti + 13] = colorArray[ti + 17] = colorArray[ti + 21] = g
        colorArray[ti + 2] = colorArray[ti + 6] = colorArray[ti + 10] = colorArray[ti + 14] = colorArray[ti + 18] = colorArray[ti + 22] = b
        colorArray[ti + 3] = colorArray[ti + 7] = colorArray[ti + 11] = colorArray[ti + 15] = colorArray[ti + 19] = colorArray[ti + 23] = a
        node.styleChanged = false
      }
    }
    if (!this.attr.transform.scale) {
      this.attr.transform.scale = [1.0, 1.0]
    }
    if (!this.attr.transform.translate) {
      this.attr.transform.translate = [0.0, 0.0]
    }
    this.inputs[0].data = new Uint8Array(this.colorArray)
    this.inputs[1].data = new Float32Array(this.positionArray)
    writeDataToShaderAttributes(this.ctx, this.inputs)

    this.ctx.useProgram(this.program)
    this.ctx.uniform2f(this.resolutionUniformLocation, this.ctx.canvas.width / ratio, this.ctx.canvas.height / ratio)
    this.ctx.uniform2fv(this.translationUniformLocation, [this.attr.transform.translate[0], this.attr.transform.translate[1]])
    this.ctx.uniform2fv(this.scaleUniformLocation, [this.attr.transform.scale[0], this.attr.transform.scale[1]])
    this.ctx.drawArrays(this.ctx.TRIANGLES, 0, positionArray.length / 2)
  }

  function RenderWebglLines (ctx, attr, style, vDomIndex) {
    this.ctx = ctx
    this.dom = {}
    this.attr = attr || {}
    this.style = style || {}
    this.vDomIndex = vDomIndex
    this.program = getProgram(ctx, shaders('line'))
    this.colorBuffer = ctx.createBuffer()
    this.positionBuffer = ctx.createBuffer()
    this.positionAttributeLocation = ctx.getAttribLocation(this.program, 'a_position')
    this.colorAttributeLocation = ctx.getAttribLocation(this.program, 'a_color')
    this.resolutionUniformLocation = ctx.getUniformLocation(this.program, 'u_resolution')
    this.translationUniformLocation = ctx.getUniformLocation(this.program, 'u_translate')
    this.scaleUniformLocation = ctx.getUniformLocation(this.program, 'u_scale')
    this.positionArray = []
    this.colorArray = []
    this.inputs = [{
      bufferType: this.ctx.ARRAY_BUFFER,
      buffer: this.colorBuffer,
      drawType: this.ctx.STATIC_DRAW,
      valueType: this.ctx.UNSIGNED_BYTE,
      size: 4,
      attribute: this.colorAttributeLocation
    }, {
      bufferType: this.ctx.ARRAY_BUFFER,
      buffer: this.positionBuffer,
      drawType: this.ctx.DYNAMIC_DRAW,
      valueType: this.ctx.FLOAT,
      size: 2,
      attribute: this.positionAttributeLocation
    }]
    if (!this.attr.transform) {
      this.attr.transform = {
        translate: [0.0, 0.0],
        scale: [1.0, 1.0]
      }
    }
  }
  RenderWebglLines.prototype.remove = function (position) {
    this.positionArray.splice(position * 4, 4)
    this.colorArray.splice(position * 8, 8)
  }
  RenderWebglLines.prototype.execute = function (stack) {
    let positionArray = this.positionArray
    let colorArray = this.colorArray
    let node, r, g, b, a, stroke
    for (var i = 0, len = stack.length; i < len; i++) {
      node = stack[i]
      if (node.propChanged) {
        positionArray[i * 4] = node.attr.x1
        positionArray[i * 4 + 1] = node.attr.y1
        positionArray[i * 4 + 2] = node.attr.x2
        positionArray[i * 4 + 3] = node.attr.y2
      }

      if (node.styleChanged) {
        stroke = node.style.stroke || defaultColor
        r = stroke.r
        g = stroke.g
        b = stroke.b
        a = (stroke.a === undefined ? 255 : stroke.a)
        colorArray[i * 8] = r
        colorArray[i * 8 + 1] = g
        colorArray[i * 8 + 2] = b
        colorArray[i * 8 + 3] = a
        colorArray[i * 8 + 4] = r
        colorArray[i * 8 + 5] = g
        colorArray[i * 8 + 6] = b
        colorArray[i * 8 + 7] = a
        node.styleChanged = false
      }
    }
    if (!this.attr.transform.scale) {
      this.attr.transform.scale = [1.0, 1.0]
    }
    if (!this.attr.transform.translate) {
      this.attr.transform.translate = [0.0, 0.0]
    }
    this.inputs[0].data = new Uint8Array(this.colorArray)
    this.inputs[1].data = new Float32Array(this.positionArray)
    writeDataToShaderAttributes(this.ctx, this.inputs)

    this.ctx.useProgram(this.program)
    this.ctx.uniform2f(this.resolutionUniformLocation, this.ctx.canvas.width / ratio, this.ctx.canvas.height / ratio)
    this.ctx.drawArrays(this.ctx.LINES, 0, positionArray.length / 2)
  }

  function RenderWebglPolyLines (ctx, attr, style, vDomIndex) {
    this.ctx = ctx
    this.dom = {}
    this.attr = attr || {}
    this.style = style || {}
    this.vDomIndex = vDomIndex
    this.program = getProgram(ctx, shaders('line'))
    this.colorBuffer = ctx.createBuffer()
    this.positionBuffer = ctx.createBuffer()
    this.positionAttributeLocation = ctx.getAttribLocation(this.program, 'a_position')
    this.colorAttributeLocation = ctx.getAttribLocation(this.program, 'a_color')
    this.resolutionUniformLocation = ctx.getUniformLocation(this.program, 'u_resolution')
    this.translationUniformLocation = ctx.getUniformLocation(this.program, 'u_translate')
    this.scaleUniformLocation = ctx.getUniformLocation(this.program, 'u_scale')
    this.polyLineArray= []
    // this.colorArray = []
    this.inputs = [{
      bufferType: this.ctx.ARRAY_BUFFER,
      buffer: this.colorBuffer,
      drawType: this.ctx.STATIC_DRAW,
      valueType: this.ctx.UNSIGNED_BYTE,
      size: 4,
      attribute: this.colorAttributeLocation
    }, {
      bufferType: this.ctx.ARRAY_BUFFER,
      buffer: this.positionBuffer,
      drawType: this.ctx.DYNAMIC_DRAW,
      valueType: this.ctx.FLOAT,
      size: 2,
      attribute: this.positionAttributeLocation
    }]
    if (!this.attr.transform) {
      this.attr.transform = {
        translate: [0.0, 0.0],
        scale: [1.0, 1.0]
      }
    }
  }
  RenderWebglPolyLines.prototype.remove = function (position) {
    this.polyLineArray.splice(position, 1)
  }
  RenderWebglPolyLines.prototype.execute = function (stack) {
    let node
    let fill
    let points

    if (!this.attr.transform.scale) {
      this.attr.transform.scale = [1.0, 1.0]
    }
    if (!this.attr.transform.translate) {
      this.attr.transform.translate = [0.0, 0.0]
    }

    this.ctx.useProgram(this.program)
    this.ctx.uniform2f(this.resolutionUniformLocation, this.ctx.canvas.width / ratio, this.ctx.canvas.height / ratio)
    this.ctx.uniform2fv(this.translationUniformLocation, [this.attr.transform.translate[0], this.attr.transform.translate[1]])
    this.ctx.uniform2fv(this.scaleUniformLocation, [this.attr.transform.scale[0], this.attr.transform.scale[1]])

    for (let i = 0, len = stack.length; i < len; i++) {
      node = stack[i]
      fill = node.style.stroke
      points = node.attr.points
      fill = fill || defaultColor
      if (node.propChanged) {
        let positionArray = []
        for (let j = 0, jlen = points.length; j < jlen; j++) {
          positionArray[j * 2] = points[j].x
          positionArray[j * 2 + 1] = points[j].y
        }
        if (!this.polyLineArray[i]) {
          this.polyLineArray[i] = {}
        }
        this.polyLineArray[i].positionArray = new Float32Array(positionArray)
      }

      if (node.styleChanged) {
        let colorArray = []
        let r = fill.r || 0
        let g = fill.g || 0
        let b = fill.b || 0
        let a = (fill.a === undefined ? 255 : fill.a)
        for (let j = 0, jlen = points.length; j < jlen; j++) {
          colorArray[j * 4] = r
          colorArray[j * 4 + 1] = g
          colorArray[j * 4 + 2] = b
          colorArray[j * 4 + 3] = a
        }
        this.polyLineArray[i].colorArray = new Uint8Array(colorArray)
      }
      
      this.inputs[0].data = this.polyLineArray[i].colorArray
      this.inputs[1].data = this.polyLineArray[i].positionArray
      writeDataToShaderAttributes(this.ctx, this.inputs)
      this.ctx.drawArrays(this.ctx.LINE_STRIP, 0, this.polyLineArray[i].positionArray.length / 2)
    }
  }

  function RenderWebglPolygons (ctx, attr, style, vDomIndex) {
    this.ctx = ctx
    this.dom = {}
    this.attr = attr || {}
    this.style = style || {}
    this.vDomIndex = vDomIndex
    this.program = getProgram(ctx, shaders('line'))
    this.colorBuffer = ctx.createBuffer()
    this.positionBuffer = ctx.createBuffer()
    this.positionAttributeLocation = ctx.getAttribLocation(this.program, 'a_position')
    this.colorAttributeLocation = ctx.getAttribLocation(this.program, 'a_color')
    this.resolutionUniformLocation = ctx.getUniformLocation(this.program, 'u_resolution')
    this.translationUniformLocation = ctx.getUniformLocation(this.program, 'u_translate')
    this.scaleUniformLocation = ctx.getUniformLocation(this.program, 'u_scale')
    this.polygonArray = []
    this.inputs = [{
      bufferType: this.ctx.ARRAY_BUFFER,
      buffer: this.colorBuffer,
      drawType: this.ctx.STATIC_DRAW,
      valueType: this.ctx.UNSIGNED_BYTE,
      size: 4,
      attribute: this.colorAttributeLocation
    }, {
      bufferType: this.ctx.ARRAY_BUFFER,
      buffer: this.positionBuffer,
      drawType: this.ctx.DYNAMIC_DRAW,
      valueType: this.ctx.FLOAT,
      size: 2,
      attribute: this.positionAttributeLocation
    }]
    if (!this.attr.transform) {
      this.attr.transform = {
        translate: [0.0, 0.0],
        scale: [1.0, 1.0]
      }
    }
  }
  RenderWebglPolygons.prototype.remove = function (position) {
    this.polygonArray.splice(position, 1)
  }
  RenderWebglPolygons.prototype.execute = function (stack) {
    this.ctx.useProgram(this.program)

    if (!this.attr.transform.scale) {
      this.attr.transform.scale = [1.0, 1.0]
    }
    if (!this.attr.transform.translate) {
      this.attr.transform.translate = [0.0, 0.0]
    }
    this.ctx.uniform2f(this.resolutionUniformLocation, this.ctx.canvas.width / ratio, this.ctx.canvas.height / ratio)
    this.ctx.uniform2fv(this.translationUniformLocation, [this.attr.transform.translate[0], this.attr.transform.translate[1]])
    this.ctx.uniform2fv(this.scaleUniformLocation, [this.attr.transform.scale[0], this.attr.transform.scale[1]])

    for (var i = 0, len = stack.length; i < len; i++) {
      let node = stack[i]
      let points = node.attr.triangulatedPoints
      if (node.propChanged) {
        let positionArray = []
        for (let j = 0, jlen = points.length; j < jlen; j++) {
          positionArray[j * 2] = points[j].x
          positionArray[j * 2 + 1] = points[j].y
        }
        if (!this.polygonArray[i]) {
          this.polygonArray[i] = {}
        }
        this.polygonArray[i].positionArray = new Float32Array(positionArray)
      }

      if (node.styleChanged) {
        let colorArray = []
        let fill = node.style.fill
        fill = fill || defaultColor
        let r = fill.r || 0
        let g = fill.g || 0
        let b = fill.b || 0
        let a = (fill.a === undefined ? 255 : fill.a)
        for (let j = 0, jlen = points.length; j < jlen; j++) {
          colorArray[j * 4] = r
          colorArray[j * 4 + 1] = g
          colorArray[j * 4 + 2] = b
          colorArray[j * 4 + 3] = a
        }
        this.polygonArray[i].colorArray = new Uint8Array(colorArray)
      }
      this.inputs[0].data = this.polygonArray[i].colorArray
      this.inputs[1].data = this.polygonArray[i].positionArray
      writeDataToShaderAttributes(this.ctx, this.inputs)

      this.ctx.drawArrays(this.ctx.TRIANGLES, 0, this.polygonArray[i].positionArray.length / 2)
    }
  }

  function RenderWebglCircles (ctx, attr, style, vDomIndex) {
    this.ctx = ctx
    this.dom = {}
    this.attr = attr || {}
    this.style = style || {}
    this.vDomIndex = vDomIndex
    this.program = getProgram(ctx, shaders('circle'))
    this.colorBuffer = ctx.createBuffer()
    this.radiusBuffer = ctx.createBuffer()
    this.positionBuffer = ctx.createBuffer()
    this.positionAttributeLocation = ctx.getAttribLocation(this.program, 'a_position')
    this.colorAttributeLocation = ctx.getAttribLocation(this.program, 'a_color')
    this.radiusAttributeLocation = ctx.getAttribLocation(this.program, 'a_radius')
    this.resolutionUniformLocation = ctx.getUniformLocation(this.program, 'u_resolution')
    this.translationUniformLocation = ctx.getUniformLocation(this.program, 'u_translate')
    this.scaleUniformLocation = ctx.getUniformLocation(this.program, 'u_scale')
    this.positionArray = []
    this.colorArray = []
    this.radius = []
    this.inputs = [{
      bufferType: this.ctx.ARRAY_BUFFER,
      buffer: this.colorBuffer,
      drawType: this.ctx.STATIC_DRAW,
      valueType: this.ctx.UNSIGNED_BYTE,
      size: 4,
      attribute: this.colorAttributeLocation
    }, {
      bufferType: this.ctx.ARRAY_BUFFER,
      buffer: this.radiusBuffer,
      drawType: this.ctx.STATIC_DRAW,
      valueType: this.ctx.FLOAT,
      size: 1,
      attribute: this.radiusAttributeLocation
    }, {
      bufferType: this.ctx.ARRAY_BUFFER,
      buffer: this.positionBuffer,
      drawType: this.ctx.DYNAMIC_DRAW,
      valueType: this.ctx.FLOAT,
      size: 2,
      attribute: this.positionAttributeLocation
    }]
    if (!this.attr.transform) {
      this.attr.transform = {
        translate: [0.0, 0.0],
        scale: [1.0, 1.0]
      }
    }
  }
  RenderWebglCircles.prototype.remove = function (position) {
    this.positionArray.splice(position * 2, 2)
    this.radius.splice(position, 1)
    this.colorArray.splice(position * 4, 4)
  }
  RenderWebglCircles.prototype.execute = function (stack) {
    this.ctx.useProgram(this.program)
    if (!this.attr.transform.scale) {
      this.attr.transform.scale = [1.0, 1.0]
    }
    if (!this.attr.transform.translate) {
      this.attr.transform.translate = [0.0, 0.0]
    }
    this.ctx.uniform2f(this.resolutionUniformLocation, this.ctx.canvas.width / ratio, this.ctx.canvas.height / ratio)
    this.ctx.uniform2fv(this.translationUniformLocation, [this.attr.transform.translate[0], this.attr.transform.translate[1]])
    this.ctx.uniform2fv(this.scaleUniformLocation, [this.attr.transform.scale[0], this.attr.transform.scale[1]])
    let positionArray = this.positionArray
    let colorArray = this.colorArray
    let radius = this.radius
    let attrFlag
    let styleFlag
    for (var i = 0, len = stack.length; i < len; i++) {
      let node = stack[i]
      let fill = node.style.fill
      fill = fill || defaultColor
      if (node.propChanged) {
        positionArray[i * 2] = node.attr.cx
        positionArray[i * 2 + 1] = node.attr.cy
        radius[i] = node.attr.r * ratio
        node.propChanged = false
        attrFlag = true
      }
      if (node.styleChanged) {
        colorArray[i * 4] = fill.r
        colorArray[i * 4 + 1] = fill.g
        colorArray[i * 4 + 2] = fill.b
        colorArray[i * 4 + 3] = (fill.a === undefined ? 255 : fill.a)
        node.styleChanged = false
        styleFlag = true
      }
    }

    if (attrFlag) {
      this.inputs[2].data = new Float32Array(positionArray)
      this.inputs[1].data = new Float32Array(radius)
    }

    if (styleFlag) {
      this.inputs[0].data = new Uint8Array(colorArray)
    }
    writeDataToShaderAttributes(this.ctx, this.inputs)
    this.ctx.drawArrays(this.ctx.POINTS, 0, positionArray.length / 2)
  }

  function RenderWebglImages (ctx, attr, style, vDomIndex) {
    this.ctx = ctx
    this.dom = {}
    this.attr = attr || {}
    this.style = style || {}
    this.vDomIndex = vDomIndex
    this.program = getProgram(ctx, shaders('image'))
    this.texture = ctx.createTexture()
    this.texCoordBuffer = ctx.createBuffer()
    this.positionBuffer = ctx.createBuffer()
    this.positionAttributeLocation = ctx.getAttribLocation(this.program, 'a_position')
    this.texCoordAttributeLocation = ctx.getAttribLocation(this.program, 'a_texCoord')
    this.resolutionUniformLocation = ctx.getUniformLocation(this.program, 'u_resolution')
    this.translationUniformLocation = ctx.getUniformLocation(this.program, 'u_translate')
    this.scaleUniformLocation = ctx.getUniformLocation(this.program, 'u_scale')
    this.imagesArray = []
    this.texArray = new Float32Array([
      0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0
    ])
    this.inputs = [{
      bufferType: this.ctx.ARRAY_BUFFER,
      buffer: this.positionBuffer,
      drawType: this.ctx.DYNAMIC_DRAW,
      valueType: this.ctx.FLOAT,
      size: 2,
      attribute: this.positionAttributeLocation
    }]
    if (!this.attr.transform) {
      this.attr.transform = {
        translate: [0.0, 0.0],
        scale: [1.0, 1.0]
      }
    }
  }
  RenderWebglImages.prototype.remove = function (position) {
    this.imagesArray.splice(position, 1)
  }
  RenderWebglImages.prototype.execute = function (stack) {
    this.ctx.enable(this.ctx.BLEND)
    this.ctx.blendFunc(this.ctx.ONE, this.ctx.ONE_MINUS_SRC_ALPHA)
    this.ctx.useProgram(this.program)
    if (!this.attr.transform.scale) {
      this.attr.transform.scale = [1.0, 1.0]
    }
    if (!this.attr.transform.translate) {
      this.attr.transform.translate = [0.0, 0.0]
    }
    this.ctx.uniform2f(this.resolutionUniformLocation, this.ctx.canvas.width / ratio, this.ctx.canvas.height / ratio)
    this.ctx.uniform2fv(this.translationUniformLocation, [this.attr.transform.translate[0], this.attr.transform.translate[1]])
    this.ctx.uniform2fv(this.scaleUniformLocation, [this.attr.transform.scale[0], this.attr.transform.scale[1]])
    writeDataToShaderAttributes(this.ctx, [{
      bufferType: this.ctx.ARRAY_BUFFER,
      data: this.texArray,
      buffer: this.texCoordBuffer,
      drawType: this.ctx.STATIC_DRAW,
      valueType: this.ctx.FLOAT,
      size: 2,
      attribute: this.texCoordAttributeLocation
    }])
    let x1, x2, y1, y2
    let activeTexture = null

    for (var i = 0, len = stack.length; i < len; i++) {
      if (!this.imagesArray[i]) {
        this.imagesArray[i] = {
          positionArray: new Float32Array(12)
        }
      }
      let positionArray = this.imagesArray[i].positionArray
      let node = stack[i]
      if (node.propChanged) {
        x1 = node.attr.x
        x2 = x1 + node.attr.width
        y1 = node.attr.y
        y2 = y1 + node.attr.height
        positionArray[0] = positionArray[4] = positionArray[6] = x1
        positionArray[1] = positionArray[3] = positionArray[9] = y1
        positionArray[2] = positionArray[8] = positionArray[10] = x2
        positionArray[5] = positionArray[7] = positionArray[11] = y2
        node.propChanged = false
      }
      if (!webGLImageTextures[node.attr.src]) {
        continue
      }
      this.inputs[0].data = this.imagesArray[i].positionArray
      writeDataToShaderAttributes(this.ctx, this.inputs)
      if (activeTexture !== webGLImageTextures[node.attr.src]) {
        this.ctx.bindTexture(this.ctx.TEXTURE_2D, webGLImageTextures[node.attr.src])
        activeTexture = webGLImageTextures[node.attr.src]
      }
      this.ctx.drawArrays(this.ctx.TRIANGLES, 0, this.imagesArray[i].positionArray.length / 2)
    }
  }

  function RenderWebglGroup (ctx, attr, style, shader, vDomIndex, shaderObject) {
    let e
    this.ctx = ctx
    switch (shader) {
      case 'rects':
        e = new RenderWebglRects(ctx, attr, style, vDomIndex)
        break
      case 'points':
        e = new RenderWebglPoints(ctx, attr, style, vDomIndex)
        break
      case 'lines':
        e = new RenderWebglLines(ctx, attr, style, vDomIndex)
        break
      case 'polylines':
        e = new RenderWebglPolyLines(ctx, attr, style, vDomIndex)
        break
      case 'polygons':
        e = new RenderWebglPolygons(ctx, attr, style, vDomIndex)
        break
      case 'circles':
        e = new RenderWebglCircles(ctx, attr, style, vDomIndex)
        break
      case 'images':
        e = new RenderWebglImages(ctx, attr, style, vDomIndex)
        break
      default:
        e = null
        break
    }
    this.shader = e
  }
  RenderWebglGroup.prototype.execute = function (stack) {
    this.shader.execute(stack)
  }

  function WebglNodeExe (ctx, config, id, vDomIndex) {
    this.ctx = ctx
    this.style = config.style ? config.style : {}
    this.attr = config.attr ? config.attr : {}
    this.id = id
    this.nodeName = config.el
    this.nodeType = 'WEBGL'
    this.children = []
    this.ctx = ctx
    this.vDomIndex = vDomIndex
    this.el = config.el
    this.shaderType = config.shaderType

    switch (config.el) {
      case 'point':
        this.dom = new PointNode(this.attr, this.style)
        break
      case 'rect':
        this.dom = new RectNode(this.attr, this.style)
        break
      case 'line':
        this.dom = new LineNode(this.attr, this.style)
        break
      case 'polyline':
        this.dom = new PolyLineNode(this.attr, this.style)
        break
      case 'polygon':
        this.dom = new PolygonNode(this.attr, this.style)
        break
      case 'circle':
        this.dom = new CircleNode(this.attr, this.style)
        break
      case 'image':
        this.dom = new ImageNode(ctx, this.attr, this.style)
        break
      case 'group':
        this.dom = new RenderWebglGroup(this.ctx, this.attr, this.style, this.shaderType, this.vDomIndex, config.shaderObject)
        break
      default:
        this.dom = null
        break
    }
    this.dom.nodeExe = this
    this.propChanged = true
  }

  WebglNodeExe.prototype.setAttr = function WsetAttr (attr, value) {
    if (arguments.length === 2) {
      this.attr[attr] = value
      this.dom.setAttr(attr, value)
    } else if (arguments.length === 1 && typeof attr === 'object') {
      for (let key in attr) {
        this.attr[key] = attr[key]
        this.dom.setAttr(key, attr[key])
      }
    }
    this.propChanged = true
    queueInstance.vDomChanged(this.vDomIndex)
    return this
  }
  WebglNodeExe.prototype.setStyle = function WsetStyle (attr, value) {
    if (arguments.length === 2) {
      if (attr === 'fill' || attr === 'stroke') {
        value = colorMap.colorToRGB(value)
      }
      this.style[attr] = value
    } else if (arguments.length === 1 && typeof attr === 'object') {
      for (let key in attr) {
        value = attr[key]
        if (key === 'fill' || key === 'stroke') {
          value = colorMap.colorToRGB(attr[key])
        }
        this.style[key] = value
      }
    }
    this.styleChanged = true
    queueInstance.vDomChanged(this.vDomIndex)
    return this
  }
  WebglNodeExe.prototype.getAttr = function WgetAttribute (_) {
    return this.attr[_]
  }
  WebglNodeExe.prototype.getStyle = function WgetStyle (_) {
    return this.style[_]
  }
  WebglNodeExe.prototype.animateTo = animateTo
  WebglNodeExe.prototype.animateExe = animateExe

  WebglNodeExe.prototype.execute = function Cexecute () {
    // this.stylesExe()
    // this.attributesExe()
    if (!this.dom.shader && this.dom instanceof RenderWebglGroup) {
      for (let i = 0, len = this.children.length; i < len; i += 1) {
        this.children[i].execute()
      }
    } else if (this.dom.shader) {
      this.dom.execute(this.children)
    }
  }

  WebglNodeExe.prototype.child = function child (childrens) {
    const self = this
    if (self.dom instanceof RenderWebglGroup) {
      for (let i = 0; i < childrens.length; i += 1) {
        childrens[i].dom.parent = self
        childrens[i].nindex = self.children.length
        self.children[self.children.length] = childrens[i]
      }
    } else { console.log('Error') }

    this.BBoxUpdate = true
    queueInstance.vDomChanged(this.vDomIndex)
    return self
  }
  WebglNodeExe.prototype.fetchEl = cfetchEl
  WebglNodeExe.prototype.fetchEls = cfetchEls
  WebglNodeExe.prototype.join = dataJoin
  WebglNodeExe.prototype.createEls = function CcreateEls (data, config) {
    const e = new CreateElements({ type: 'WEBGL', ctx: this.dom.ctx }, data, config, this.vDomIndex)
    this.child(e.stack)
    queueInstance.vDomChanged(this.vDomIndex)
    return e
  }

  WebglNodeExe.prototype.createEl = function WcreateEl (config) {
    const e = new WebglNodeExe(this.ctx, config, domId(), this.vDomIndex)
    this.child([e])
    queueInstance.vDomChanged(this.vDomIndex)
    return e
  }

  WebglNodeExe.prototype.createShaderEl = function createShader (shaderObject) {
    const e = new RenderWebglShader(this.ctx, shaderObject, this.vDomIndex)
    this.child([e])
    queueInstance.vDomChanged(this.vDomIndex)
    return e
  }


  WebglNodeExe.prototype.remove = function Wremove () {
    const { children } = this.dom.parent
    const index = children.indexOf(this)
    if (index !== -1) {
      children.splice(index, 1)
      if (this.dom.parent.dom.shader) {
        this.dom.parent.dom.shader.remove(index)
      }
    }
    this.BBoxUpdate = true
    queueInstance.vDomChanged(this.vDomIndex)
  }
  WebglNodeExe.prototype.removeChild = function WremoveChild (obj) {
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

  i2d.WebglLayer = function WebGLLayer (context, config) {
    const res = document.querySelector(context)
    const height = config.height ? config.height : res.clientHeight
    const width = config.width ? config.width : res.clientWidth
    const clearColor = config.clearColor ? color.colorToRGB(config.clearColor) : {r: 0, g: 0, b: 0, a: 0}
    const layer = document.createElement('canvas')
    const ctx = layer.getContext('webgl', {
      premultipliedAlpha: false,
      depth: false,
      antialias: true,
      alpha: true
    })
    ratio = getPixlRatio(ctx)

    layer.setAttribute('height', height * ratio)
    layer.setAttribute('width', width * ratio)
    layer.style.height = `${height}px`
    layer.style.width = `${width}px`
    layer.style.position = 'absolute'
    res.appendChild(layer)

    const vDomInstance = new VDom()
    const vDomIndex = queueInstance.addVdom(vDomInstance)

    const root = new WebglNodeExe(ctx, {
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
    root.type = 'WEBGL'
    root.pixelRatio = ratio

    ctx.clearColor(clearColor.r, clearColor.g, clearColor.b, clearColor.a)
    root.execute = function executeExe () {
      this.ctx.viewport(0, 0, this.ctx.canvas.width, this.ctx.canvas.height)
      this.ctx.clear(this.ctx.COLOR_BUFFER_BIT | this.ctx.DEPTH_BUFFER_BIT)
      execute()
    }
    root.destroy = function () {
      queueInstance.removeVdom(vDomInstance)
    }
    vDomInstance.root(root)

    if (config.resize) {
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
  i2d.color = colorMap
  // i2d.shader = shader

  return i2d
}))
