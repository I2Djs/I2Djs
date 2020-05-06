// let Event = function (x, y) {
// 	this.x = x;
// 	this.y = y;
// 	this.dx = 0;
// 	this.dy = 0;
// };

function Events (vDom) {
	this.vDom = vDom;
	this.disable = false;
	this.dragNode = null;
	this.touchNode = null;
	this.wheelNode = null;
	// this.clickDown = false;
	// this.touchDown = false;
}

Events.prototype.getNode = function (e) {};

Events.prototype.mousemoveCheck = function (e) {
	let node;
	if (this.dragNode) {
		node = this.dragNode;
		if (this.dragNode.events.drag) {
			this.dragNode.events.drag.execute(this.dragNode, e, 'mousemove');
		}
		if (this.dragNode.events.zoom) {
			this.dragNode.events.zoom.panExecute(this.dragNode, e, 'mousemove');
		}
	} else {
		node = propogateEvent([this.vDom], {
			x: e.offsetX,
			y: e.offsetY
		}, e, 'mousemove');
	}

	if (node && (node.events['mouseover'] || node.events['mousein'])) {
		if (this.selectedNode !== node) {
			if (node.events['mouseover']) {
				node.events['mouseover'].call(node, e);
			}
			if (node.events['mousein']) {
				node.events['mousein'].call(node, e);
			}
		}
	}

	if (this.selectedNode && this.selectedNode !== node) {
		if (this.selectedNode.events['mouseout']) {
			this.selectedNode.events['mouseout'].call(this.selectedNode, e);
		}
		if (this.selectedNode.events['mouseleave']) {
			this.selectedNode.events['mouseleave'].call(this.selectedNode, e);
		}
	}

	this.selectedNode = node;
};

Events.prototype.clickCheck = function (e) {
	propogateEvent([this.vDom], {
		x: e.offsetX,
		y: e.offsetY
	}, e, 'click');
};

Events.prototype.dblclickCheck = function (e) {
	propogateEvent([this.vDom], {
		x: e.offsetX,
		y: e.offsetY
	}, e, 'dblclick');
};

Events.prototype.mousedownCheck = function (e) {
	let node = propogateEvent([this.vDom], {
		x: e.offsetX,
		y: e.offsetY
	}, e, 'mousedown');

	if (node && node.events.drag) {
		node.events.drag.execute(node, e, 'mousedown');
		this.dragNode = node;
	}

	if (node && node.events.zoom && node.events.zoom.panFlag) {
		node.events.zoom.panExecute(node, e, 'mousedown');
		this.dragNode = node;
	}
};

Events.prototype.mouseupCheck = function (e) {
	let node = this.dragNode;

	if (node) {
		if (node.events.drag) {
			node.events.drag.execute(node, e, 'mouseup');
		}
		if (node.events.zoom && node.events.zoom.panFlag) {
			node.events.zoom.panExecute(node, e, 'mouseup');
		}
		this.dragNode = null;
	} else {
		propogateEvent([this.vDom], {
			x: e.offsetX,
			y: e.offsetY
		}, e, 'mouseup');
	}
};

Events.prototype.mouseleaveCheck = function (e) {
	let node = this.dragNode;
	if (node) {
		if (node.events.drag) {
			node.events.drag.execute(node, e, 'mouseleave');
		}
		if (node.events.zoom && node.events.zoom.panFlag) {
			node.events.zoom.panExecute(node, e, 'mouseleave');
		}
		this.dragNode = null;
	} else {
		propogateEvent([this.vDom], {
			x: e.offsetX,
			y: e.offsetY
		}, e, 'mouseleave');
	}
};
Events.prototype.contextmenuCheck = function (e) {
	propogateEvent([this.vDom], {
		x: e.offsetX,
		y: e.offsetY
	}, e, 'contextmenu');
};

Events.prototype.touchstartCheck = function (e) {
	let touches = e.touches;
	if (touches.length === 0) {
		return;
	}

	let node = propogateEvent([this.vDom], {
		x: touches[0].clientX,
		y: touches[0].clientY
	}, e, 'click');

	if (node.events.drag) {
		node.events.drag.execute(node, e, 'mousedown');
		this.dragNode = node;
	}
	if (node && node.events.zoom && node.events.zoom.panFlag) {
		node.events.zoom.panExecute(node, e, 'mousedown');
		this.dragNode = node;
	}

	// if (node && node.events.touch && node.events.touch.onTouchStart) {
	// 	node.events.touch.touchStartFlag = true;
	// 	node.events.touch.onTouchStart.call(node, e);
	// 	let event = new Event(touches[0].clientX, touches[0].clientY);
	// 	event.e = e;
	// 	node.events.touch.event = event;
	// 	this.touchNode = node;
	// }
};

Events.prototype.touchendCheck = function (e) {
	let node = this.dragNode;
	if (node) {
		if (node.events.drag) {
			node.events.drag.execute(node, e, 'mouseleave');
		}
		if (node.events.zoom && node.events.zoom.panFlag) {
			node.events.zoom.panExecute(node, e, 'mouseleave');
		}
		this.dragNode = null;
	}
};

Events.prototype.touchmoveCheck = function (e) {
	let touches = e.touches;
	if (touches.length === 0) {
		return;
	}

	let node = this.dragNode;
	if (node) {
		if (this.dragNode.events.drag) {
			this.dragNode.events.drag.execute(this.dragNode, e, 'mousemove');
		}
		if (this.dragNode.events.zoom) {
			this.dragNode.events.zoom.panExecute(this.dragNode, e, 'mousemove');
		}
	} else {
		node = propogateEvent([this.vDom], {
			x: touches[0].clientX,
			y: touches[0].clientY
		}, e, 'mousemove');
	}

	if (node && (node.events['mouseover'] || node.events['mousein'])) {
		if (this.selectedNode !== node) {
			if (node.events['mouseover']) {
				node.events['mouseover'].call(node, e);
			}
			if (node.events['mousein']) {
				node.events['mousein'].call(node, e);
			}
		}
	}

	if (this.selectedNode && this.selectedNode !== node) {
		if (this.selectedNode.events['mouseout']) {
			this.selectedNode.events['mouseout'].call(this.selectedNode, e);
		}
		if (this.selectedNode.events['mouseleave']) {
			this.selectedNode.events['mouseleave'].call(this.selectedNode, e);
		}
	}
	this.selectedNode = node;
};

Events.prototype.touchcancelCheck = function (e) {
	let touches = e.touches;
	// if (touches.length === 0) {
	// 	return;
	// }
	let node = this.dragNode;
	if (node) {
		if (node.events.drag) {
			node.events.drag.execute(node, e, 'mouseleave');
		}
		if (node.events.zoom && node.events.zoom.panFlag) {
			node.events.zoom.panExecute(node, e, 'mouseleave');
		}
		this.dragNode = null;
	} else {
		propogateEvent([this.vDom], {
			x: touches[0].clientX,
			y: touches[0].clientY
		}, e, 'touchcacel');
	}
};

let wheelCounter = 0;
let deltaWheel = 0;
Events.prototype.wheelEventCheck = function (e) {
	let self = this;
	if (!this.wheelNode) {
		let node = propogateEvent([this.vDom], {
			x: e.offsetX,
			y: e.offsetY
		}, e, 'wheel');
		node = node || this.vDom;
		if (node && node.events.zoom) {
			if (!node.events.zoom.disableWheel) {
				node.events.zoom.zoomExecute(node, e);
				this.wheelNode = node;
			}
		}
	} else {
		this.wheelNode.events.zoom.zoomExecute(this.wheelNode, e);
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
				self.wheelNode.events.zoom.onZoomEnd(self.wheelNode, e);
				self.wheelNode = null;
				wheelCounter = 0;
			}
		}, 100);
	}
};

function propogateEvent (nodes, mouseCoor, rawEvent, eventType) {
	let node, temp;
	
	for (var i = nodes.length - 1; i >= 0; i -= 1) {
		var d = nodes[i];
		var coOr = {
			x: mouseCoor.x,
			y: mouseCoor.y
		};

		if (!d.bbox) {
			continue;
		}

		transformCoOr(d, coOr);

		if (d.in({ x: coOr.x, y: coOr.y })) {
			if (d.children && d.children.length > 0) {
				temp = propogateEvent(d.children, {
					x: coOr.x,
					y: coOr.y
				}, rawEvent, eventType);

				if (temp) {
					node = temp;
				}
			} else {
				node = d;
			}
			if (d.events[eventType] && typeof d.events[eventType] === 'function') {
				d.events[eventType](rawEvent);
			}
			if (node) {
				break;
			}
		}
	}

	if (!node && d.attr.id === 'rootNode') {
		node = d;
		if (d.events[eventType] && typeof d.events[eventType] === 'function') {
			d.events[eventType](rawEvent);
		}
	}
	return node;
}

function transformCoOr (d, coOr) {
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
			y: d.attr.transform.rotate[2]
		};
		let x = coOrLocal.x;
		let y = coOrLocal.y;
		let cx = cen.x;
		let cy = cen.y;
		var radians = Math.PI / 180 * rotate;
		var cos = Math.cos(radians);
		var sin = Math.sin(radians);
		coOrLocal.x = (cos * (x - cx)) + (sin * (y - cy)) + cx;
		coOrLocal.y = (cos * (y - cy)) - (sin * (x - cx)) + cy;
	}
}

export default Events;
