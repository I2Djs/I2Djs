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

export default Events;
