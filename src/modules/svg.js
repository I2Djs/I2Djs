import queue from './queue.js'
import VDom from './VDom.js'
import path from './path.js'
import colorMap from './colorMap.js'
import { NodePrototype, CollectionPrototype } from './coreApi.js'
const queueInstance = queue

let Id = 0
function domId () {
  Id += 1
  return Id
}

let Event = function (x, y) {
  this.x = x
  this.y = y
  this.dx = 0
  this.dy = 0
}

let SVGCollection = function () {
  CollectionPrototype.apply(this, arguments)
}
SVGCollection.prototype = new CollectionPrototype()
SVGCollection.prototype.constructor = SVGCollection
SVGCollection.prototype.createNode = function (ctx, config, vDomIndex) {
  return createDomElement(config, vDomIndex)
}
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

  if (!this.defs) {
    this.defs = this.pDom.createEl({
      el: 'defs'
    })
  }

  this.linearEl = this.defs.join([1], 'linearGradient', {
    action: {
      enter (data) {
        this.createEls(data.linearGradient, {
          el: 'linearGradient'
        }).setAttr({
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
      offset (d, i) {
        return `${d.value}%`
      },

      'stop-color': function stopColor (d, i) {
        return d.color
      }
    }
  })
  return this
}

DomGradients.prototype.radialGradient = function radialGradient () {
  const self = this

  if (!this.defs) {
    this.defs = this.pDom.createEl({
      el: 'defs'
    })
  }

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
      offset (d, i) {
        return `${d.value}%`
      },

      'stop-color': function stopColor (d, i) {
        return d.color
      }
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

  if (obj.dataObj) {
    dom.dataObj = obj.dataObj
  }

  return node
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

  if (config.style) {
    this.setStyle(config.style)
  }

  if (config.attr) {
    this.setAttr(config.attr)
  }
}

DomExe.prototype = new NodePrototype()

DomExe.prototype.node = function node () {
  this.execute()
  return this.dom
}

function updateAttrsToDom (self, key) {
  let ind = key.indexOf(':')
  let value = self.changedAttribute[key]

  if (ind >= 0) {
    self.dom.setAttributeNS(nameSpace[key.slice(0, ind)], key.slice(ind + 1), value)
  } else {
    if (key === 'text') {
      self.dom.textContent = value
    } else if (key === 'd') {
      if (path.isTypePath(value)) {
        self.dom.setAttribute(key, value.fetchPathString())
      } else {
        self.dom.setAttribute(key, value)
      }
    } else {
      if (key === 'onerror' || key === 'onload') {
        self.dom[key] = function fun (e) {
          value.call(self, e)
        }
      } else {
        self.dom.setAttribute(key, value)
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
    if (key !== 'transform') {
      updateAttrsToDom(self, key)
    } else {
      updateTransAttrsToDom(self)
    }
  }

  this.changedAttribute = {}
}

DomExe.prototype.scale = function DMscale (XY) {
  if (!this.attr.transform) {
    this.attr.transform = {}
  }

  this.attr.transform.scale = XY
  this.changedAttribute.transform = this.attr.transform
  this.attrChanged = true
  queueInstance.vDomChanged(this.vDomIndex)
  return this
}

DomExe.prototype.skewX = function DMskewX (x) {
  if (!this.attr.transform) {
    this.attr.transform = {}
  }

  this.attr.transform.skewX = [x]
  this.changedAttribute.transform = this.attr.transform
  this.attrChanged = true
  queueInstance.vDomChanged(this.vDomIndex)
  return this
}

DomExe.prototype.skewY = function DMskewY (y) {
  if (!this.attr.transform) {
    this.attr.transform = {}
  }

  this.attr.transform.skewY = [y]
  this.changedAttribute.transform = this.attr.transform
  this.attrChanged = true
  queueInstance.vDomChanged(this.vDomIndex)
  return this
}

DomExe.prototype.translate = function DMtranslate (XY) {
  if (!this.attr.transform) {
    this.attr.transform = {}
  }

  this.attr.transform.translate = XY
  this.changedAttribute.transform = this.attr.transform
  this.attrChanged = true
  queueInstance.vDomChanged(this.vDomIndex)
  return this
}

DomExe.prototype.rotate = function DMrotate (angle, x, y) {
  if (!this.attr.transform) {
    this.attr.transform = {}
  }

  if (Object.prototype.toString.call(angle) === '[object Array]' && angle.length > 0) {
    this.attr.transform.rotate = [angle[0] || 0, angle[1] || 0, angle[2] || 0]
  } else {
    this.attr.transform.rotate = [angle, x || 0, y || 0]
  }

  this.changedAttribute.transform = this.attr.transform
  this.attrChanged = true
  queueInstance.vDomChanged(this.vDomIndex)
  return this
}

DomExe.prototype.setStyle = function DMsetStyle (attr, value) {
  if (arguments.length === 2) {
    if (typeof value === 'function') {
      value = value.call(this, this.dataObj)
    }

    if (colorMap.RGBAInstanceCheck(value)) {
      value = value.rgba
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
} // DomExe.prototype.getAttr = function DMgetAttribute (_) {
//   return this.attr[_]
// }
// DomExe.prototype.getStyle = function DMgetStyle (_) {
//   return this.style[_]
// }

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

  if (nodes instanceof SVGCollection) {
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
} //   DomExe.prototype.fetchEl = cfetchEl
//   DomExe.prototype.fetchEls = cfetchEls
//   DomExe.prototype.animateTo = animateTo
//   DomExe.prototype.animateExe = animateExe

DomExe.prototype.animatePathTo = path.animatePathTo
DomExe.prototype.morphTo = path.morphTo // DomExe.prototype.exec = function Cexe (exe) {
//   if (typeof exe !== 'function') {
//     console.error('Wrong Exe type')
//   }
//   exe.call(this, this.dataObj)
//   return this
// }

DomExe.prototype.createRadialGradient = function DMcreateRadialGradient (config) {
  const gradientIns = new DomGradients(config, 'radial', this)
  gradientIns.radialGradient()
  return gradientIns
}

DomExe.prototype.createLinearGradient = function DMcreateLinearGradient (config) {
  const gradientIns = new DomGradients(config, 'linear', this)
  gradientIns.linearGradient()
  return gradientIns
} //   DomExe.prototype.join = dataJoin

let dragStack = []

DomExe.prototype.on = function DMon (eventType, hndlr) {
  const self = this

  if (!hndlr) {
    if (self.events && self.events[eventType]) {
      self.dom.removeEventListener(eventType, self.events[eventType])
      delete self.events[eventType]
    }

    if (eventType === 'drag') {
      dragStack.splice(dragStack.indexOf(self), 1)
    }

    return
  }

  if (eventType === 'drag') {
    self.drag = hndlr
    dragStack.push(self)
  } else {
    const hnd = hndlr.bind(self)

    if (self.events) {
      if (self.events[eventType]) {
        self.dom.removeEventListener(eventType, self.events[eventType])
        delete self.events[eventType]
      }
    } else {
      self.events = {}
    }

    self.events[eventType] = function (event) {
      hnd(self.dataObj, event)
    }

    self.dom.addEventListener(eventType, self.events[eventType])
  }

  return this
}

DomExe.prototype.html = function DMhtml (value) {
  if (!arguments.length) {
    return this.dom.innerHTML
  }

  this.dom.innerHTML(value)
  return this
}

DomExe.prototype.text = function DMtext (value) {
  if (!arguments.length) {
    return this.attr.text
  }

  this.attr['text'] = value
  this.changedAttribute['text'] = value
  return this
}

DomExe.prototype.remove = function DMremove () {
  this.parentNode.removeChild(this)
}

DomExe.prototype.createEls = function DMcreateEls (data, config) {
  const e = new SVGCollection({
    type: 'SVG'
  }, data, config, this.vDomIndex)
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
  const {
    children
  } = this
  const index = children.indexOf(obj)

  if (index !== -1) {
    this.dom.removeChild(children.splice(index, 1)[0].dom)
  }
}

function SVGLayer (context, config = {}) {
  const vDomInstance = new VDom()
  const vDomIndex = queueInstance.addVdom(vDomInstance)
  const res = document.querySelector(context)
  let height = config.height ? config.height : res.clientHeight
  let width = config.width ? config.width : res.clientWidth
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
  vDomInstance.root(root) // root.resize = renderVdom

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

  function svgResize () {
    height = config.height ? config.height : res.clientHeight
    width = config.width ? config.width : res.clientWidth
    layer.setAttribute('height', height)
    layer.setAttribute('width', width)
    root.width = width
    root.height = height

    if (config.resize && typeof config.resize === 'function') {
      config.resize()
    }

    renderVdom.call(root)
  }

  function renderVdom () {
    let width = config.width ? config.width : this.container.clientWidth
    let height = config.height ? config.height : this.container.clientHeight
    let newWidthRatio = width / this.width
    let newHeightRatio = height / this.height

    if (config && config.rescale) {
      this.scale([newWidthRatio, newHeightRatio])
    }

    this.dom.setAttribute('height', height)
    this.dom.setAttribute('width', width)
  }

  window.addEventListener('resize', svgResize)

  root.destroy = function () {
    window.removeEventListener('resize', svgResize)
    layer.remove()
    queueInstance.removeVdom(vDomIndex)
  }

  let dragTargetEl = null
  root.dom.addEventListener('mousedown', function (e) {
    if (dragStack.length) {
      dragStack.forEach(function (d) {
        if (e.target === d.dom) {
          dragTargetEl = d
        }
      })

      if (dragTargetEl) {
        let event = new Event(e.offsetX, e.offsetY)
        event.e = e
        dragTargetEl.drag.event = event
        dragTargetEl.drag.dragStartFlag = true
        dragTargetEl.drag.onDragStart.call(dragTargetEl, dragTargetEl.dataObj, event)
      }
    }
  })
  root.dom.addEventListener('mousemove', function (e) {
    if (dragTargetEl) {
      let event = dragTargetEl.drag.event
      event.dx = e.offsetX - event.x
      event.dy = e.offsetY - event.y
      event.x = e.offsetX
      event.y = e.offsetY
      event.e = e
      dragTargetEl.drag.onDrag.call(dragTargetEl, dragTargetEl.dataObj, event)
    }
  })
  root.dom.addEventListener('mouseup', function (e) {
    if (dragTargetEl) {
      let event = dragTargetEl.drag.event
      event.dx = e.offsetX - event.x
      event.dy = e.offsetY - event.y
      event.x = e.offsetX
      event.y = e.offsetY
      event.e = e
      dragTargetEl.drag.onDragEnd.call(dragTargetEl, dragTargetEl.dataObj, event)
      dragTargetEl = null
    }
  })
  root.dom.addEventListener('mouseleave', function (e) {
    if (dragTargetEl) {
      let event = dragTargetEl.drag.event
      event.dx = e.offsetX - event.x
      event.dy = e.offsetY - event.y
      event.x = e.offsetX
      event.y = e.offsetY
      event.e = e
      dragTargetEl.drag.onDragEnd.call(dragTargetEl, dragTargetEl.dataObj, event)
      dragTargetEl = null
    }
  })
  queueInstance.execute()
  return root
}

export default SVGLayer
