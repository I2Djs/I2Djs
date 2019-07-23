let Event = function (x, y) {
	this.x = x;
	this.y = y;
	this.dx = 0;
	this.dy = 0;
};

function Events (vDom) {
	this.vDom = vDom;
	this.disable = false;
	this.dragNode = null;
	this.touchNode = null;
}
Events.prototype.getNode = function (e) {};
Events.prototype.mousemoveCheck = function (e) {
	if (this.dragNode) {
		let event = this.dragNode.dom.drag.event;

		if (this.dragNode.dom.drag.event) {
			event.dx = e.offsetX - event.x;
			event.dy = e.offsetY - event.y;
		}

		event.x = e.offsetX;
		event.y = e.offsetY;
		event.e = e;
		this.dragNode.dom.drag.event = event;
		this.dragNode.dom.drag.onDrag.call(this.dragNode, this.dragNode.dataObj, event);
	} else {
		let node = propogateEvent([this.vDom], {
			x: e.offsetX,
			y: e.offsetY
		}, e, 'mousemove');
		if (node && (node.dom['mouseover'] || node.dom['mousein'])) {
			if (this.selectedNode !== node) {
				if (node.dom['mouseover']) {
					node.dom['mouseover'].call(node, node.dataObj, e);
				}
				if (node.dom['mousein']) {
					node.dom['mousein'].call(node, node.dataObj, e);
				}
			}
		}

		if (this.selectedNode && this.selectedNode !== node) {
			if (this.selectedNode.dom['mouseout']) {
				this.selectedNode.dom['mouseout'].call(this.selectedNode, this.selectedNode.dataObj, e);
			}
			if (this.selectedNode.dom['mouseleave']) {
				this.selectedNode.dom['mouseleave'].call(this.selectedNode, this.selectedNode.dataObj, e);
			}
		}

		this.selectedNode = node;
	}
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

	if (node && node.dom.drag && node.dom.drag.onDragStart) {
		node.dom.drag.dragStartFlag = true;
		node.dom.drag.onDragStart.call(node, node.dataObj, e);
		let event = new Event(e.offsetX, e.offsetY);
		event.e = e;
		node.dom.drag.event = event;
		this.dragNode = node;
	}
};
Events.prototype.mouseupCheck = function (e) {
	let node = this.dragNode;

	if (node && node.dom.drag && node.dom.drag.dragStartFlag && node.dom.drag.onDragEnd) {
		node.dom.drag.dragStartFlag = false;
		node.dom.drag.event = null;
		node.dom.drag.onDragEnd.call(node, node.dataObj, node.dom.drag.event);
		node.dom.drag.event = null; // selectedNode = null
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
	if (node && node.dom.drag && node.dom.drag.dragStartFlag && node.dom.drag.onDragEnd) {
		node.dom.drag.dragStartFlag = false;
		node.dom.drag.event = null;
		node.dom.drag.onDragEnd.call(node, node.dataObj, node.dom.drag.event);
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
	}, e, 'touchstart_');

	if (node && node.dom.touch && node.dom.touch.onTouchStart) {
		node.dom.touch.touchStartFlag = true;
		node.dom.touch.onTouchStart.call(node, node.dataObj, e);
		let event = new Event(touches[0].clientX, touches[0].clientY);
		event.e = e;
		node.dom.touch.event = event;
		this.touchNode = node;
	}
};

Events.prototype.touchendCheck = function (e) {
	if (this.touchNode && this.touchNode.dom.touch.touchStartFlag && this.touchNode.dom.touch.onTouchEnd) {
		this.touchNode.dom.touch.onTouchEnd.call(this.touchNode, this.touchNode.dataObj, this.touchNode.dom.touch.event);
		this.touchNode = null;
	}
};

Events.prototype.touchmoveCheck = function (e) {
	let touches = e.touches;
	if (touches.length === 0) {
		return;
	}
	if (this.touchNode) {
		let event = this.touchNode.dom.touch.event;

		if (this.touchNode.dom.touch.event) {
			event.dx = touches[0].clientX - event.x;
			event.dy = touches[0].clientY - event.y;
		}

		event.x = touches[0].clientX;
		event.y = touches[0].clientY;
		event.e = e;
		this.touchNode.dom.touch.event = event;
		this.touchNode.dom.touch.onTouch.call(this.touchNode, this.touchNode.dataObj, event);
	}
};

Events.prototype.touchcancelCheck = function (e) {
	let touches = e.touches;
	if (touches.length === 0) {
		return;
	}

	propogateEvent([this.vDom], {
		x: touches[0].clientX,
		y: touches[0].clientY
	}, e, 'touchcacel');
};

function propogateEvent (nodes, mouseCoor, rawEvent, eventType) {
	let node, temp;
	
	for (var i = nodes.length - 1; i >= 0; i -= 1) {
		var d = nodes[i];
		var coOr = {
			x: mouseCoor.x,
			y: mouseCoor.y
		};
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
			if (d.dom[eventType]) {
				d.dom[eventType].call(d, d.dataObj, rawEvent);
			}
			if (node) {
				break;
			}
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
