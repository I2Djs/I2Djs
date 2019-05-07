/* eslint-disable no-undef */
;(function vDom (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory()
  } else if (typeof define === 'function' && define.amd) {
    define('vDom', [], geometry => factory())
  } else {
    root.vDom = factory(geometry)
  }
}(this, (geometry) => {
  'use strict'
  function VDom () {}
  VDom.prototype.execute = function execute () {
    this.root.execute()
    this.stateModified = false
  }
  VDom.prototype.root = function root (_) {
    this.root = _
    this.stateModified = true
  }
  VDom.prototype.eventsCheck = function eventsCheck (nodes, mouseCoor, rawEvent) {
    const self = this
    let node,
      temp

    for (var i = 0; i <= nodes.length - 1; i += 1) {
      var d = nodes[i]
      var coOr = { x: mouseCoor.x, y: mouseCoor.y }
      transformCoOr(d, coOr)
      if (d.in({ x: coOr.x, y: coOr.y })) {
        if (d.children && d.children.length > 0) {
          temp = self.eventsCheck(d.children, { x: coOr.x, y: coOr.y }, rawEvent)
          if (temp) {
            node = temp
          }
        } else {
          node = d
        }
      // callInEvents(d, rawEvent)
      }
    // else {
    //   // callOutEvents(d, rawEvent)
    // }
    }
    return node
  }

  VDom.prototype.transformCoOr = transformCoOr

  // function callInEvents (node, e) {
  //   if ((node.dom.mouseover || node.dom.mouseenter) && !node.hovered) {
  //     if (node.dom.mouseover) {
  //       node.dom.mouseover.call(node, node.dataObj, e)
  //     }
  //     if (node.dom.mouseenter) {
  //       node.dom.mouseenter.call(node, node.dataObj, e)
  //     }
  //     node.hovered = true

  //     if (selectedNode && selectedNode.dom.drag && selectedNode.dom.drag.onDragStart) {
  //       selectedNode.dom.drag.dragStartFlag = true
  //       selectedNode.dom.drag.onDragStart.call(selectedNode, selectedNode.dataObj, e)
  //       let event = {}
  //       event.x = e.offsetX
  //       event.y = e.offsetY
  //       event.dx = 0
  //       event.dy = 0
  //       selectedNode.dom.drag.event = event
  //     }

  //     if (node && node.dom.drag && node.dom.drag.dragStartFlag && node.dom.drag.onDrag) {
  //       let event = node.dom.drag.event
  //       if (node.dom.drag.event) {
  //         event.dx = e.offsetX - event.x
  //         event.dy = e.offsetY - event.y
  //       }
  //       event.x = e.offsetX
  //       event.y = e.offsetY
  //       node.dom.drag.event = event
  //       node.dom.drag.onDrag.call(node, node.dataObj, event)
  //     }
  //   }
  // }

  // function callOutEvents (node, e) {
  //   if ((node.dom.mouseout || node.dom.mouseleave) && node.hovered) {
  //     if (node.dom.mouseout) {
  //       node.dom.mouseout.call(node, node.dataObj, e)
  //     }
  //     if (node.dom.mouseleave) {
  //       node.dom.mouseleave.call(node, node.dataObj, e)
  //     }
  //     node.hovered = false
  //   }
  //   if (node.dom.drag && node.dom.drag.dragStartFlag) {
  //     node.dom.drag.dragStartFlag = false
  //     node.dom.drag.onDragEnd.call(node, node.dataObj, e)
  //     node.dom.drag.event = null
  //   }
  // }

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
      // const { BBox } = d.dom
      const cen = {
        x: d.attr.transform.rotate[1],
        y: d.attr.transform.rotate[2]
      }
      // {
      //   x: (BBox.x + (BBox.width / 2) - hozMove) / scaleX,
      //   y: (BBox.y + (BBox.height / 2) - verMove) / scaleY
      // }
      // const dis = t2DGeometry.getDistance(cen, coOr)
      // const angle = Math.atan2(coOr.y - cen.y, coOr.x - cen.x)

      let x = coOrLocal.x
      let y = coOrLocal.y
      let cx = cen.x
      let cy = cen.y

      var radians = (Math.PI / 180) * rotate
      var cos = Math.cos(radians)
      var sin = Math.sin(radians)

      coOrLocal.x = (cos * (x - cx)) + (sin * (y - cy)) + cx
      coOrLocal.y = (cos * (y - cy)) - (sin * (x - cx)) + cy
    }
  }

  const vDomInstance = function vDomInstance () {
    return new VDom()
  }

  return vDomInstance
}))
