import queue from "./queue.js";
import ease from "./ease.js";
import geometry from "./geometry.js";

const queueInstance = queue;
const easing = ease;

let animeIdentifier = 0;

function animeId() {
    animeIdentifier += 1;
    return animeIdentifier;
}

function checkForTranslateBounds(trnsExt, [scaleX, scaleY], newTrns) {
    return (
        newTrns[0] >= trnsExt[0][0] * scaleX &&
        newTrns[0] <= trnsExt[1][0] * scaleX &&
        newTrns[1] >= trnsExt[0][1] * scaleY &&
        newTrns[1] <= trnsExt[1][1] * scaleY
    );
}

function applyTranslate(event, { dx = 0, dy = 0 }, extent) {
    const translate = event.transform.translate;
    const [scaleX, scaleY = scaleX] = event.transform.scale;
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

const DragClass = function () {
    const self = this;
    this.dragStartFlag = false;
    this.dragExtent = [
        [-Infinity, -Infinity],
        [Infinity, Infinity],
    ];
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
        const self = this;
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
        const self = this;
        if (typeof fun === "function") {
            this.onDrag = function (trgt, event) {
                const dx = event.offsetX - self.event.x;
                const dy = event.offsetY - self.event.y;
                self.event.x = event.offsetX;
                self.event.y = event.offsetY;
                self.event = applyTranslate(this.event, { dx, dy }, self.dragExtent);
                fun.call(trgt, self.event);
            };
        }
        return this;
    },
    dragEnd: function (fun) {
        const self = this;
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
        const self = this;
        trgt.dragTo = function (k, point) {
            self.dragTo(trgt, k, point);
        };
    },
    execute: function (trgt, event, eventType) {
        const self = this;
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

const ZoomClass = function () {
    const self = this;
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
    const self = this;
    if (typeof fun === "function") {
        this.zoomStartExe = fun;
        this.onZoomStart = function (trgt, event, eventsInstance) {
            if (eventsInstance.pointers && eventsInstance.pointers.length === 2) {
                const pointers = eventsInstance.pointers;
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
    const self = this;
    if (typeof fun === "function") {
        this.zoomExe = fun;
        this.onZoom = function (trgt, event) {
            const transform = self.event.transform;
            const origScale = transform.scale[0];
            let newScale = origScale;
            const deltaY = event.deltaY;
            const x = event.offsetX;
            const y = event.offsetY;

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
    const self = this;
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
    const pointers = eventsInstance.pointers;
    if (event.preventDefault) {
        event.preventDefault();
    }
    if (eventsInstance.pointers.length === 2) {
        if (!this.zoomStartFlag) {
            this.onZoomStart(trgt, event, eventsInstance);
        } else {
            const distance_ = this.event.distance;
            for (var i = 0; i < pointers.length; i++) {
                if (event.pointerId === pointers[i].pointerId) {
                    pointers[i] = event;
                    break;
                }
            }
            const distance = geometry.getDistance(
                { x: pointers[0].offsetX, y: pointers[0].offsetY },
                { x: pointers[1].offsetX, y: pointers[1].offsetY }
            );
            const pinchEvent = {
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
    const self = this;
    const transform = self.event.transform;
    const newScale = k * transform.scale[0];
    const origScale = transform.scale[0];
    const zoomTrgt = this.zoomTarget_ || point;
    const xdiff = (zoomTrgt[0] - point[0]) * origScale;
    const ydiff = (zoomTrgt[1] - point[1]) * origScale;
    let pf = 0;

    const targetConfig = {
        run(f) {
            const oScale = transform.scale[0];
            const nscale = scaleRangeCheck(
                self.zoomExtent_,
                origScale + (newScale - origScale) * f
            );

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
    queueInstance.add(animeId(), targetConfig, easing(targetConfig.ease));
};

ZoomClass.prototype.zoomTarget = function zoomTarget(point) {
    this.zoomTarget_ = point;
};

ZoomClass.prototype.scaleTo = function scaleTo(trgt, newScale, point) {
    const self = this;
    const transform = self.event.transform;
    const origScale = transform.scale[0];
    const zoomTrgt = this.zoomTarget_ || point;
    const xdiff = (zoomTrgt[0] - point[0]) * origScale;
    const ydiff = (zoomTrgt[1] - point[1]) * origScale;
    let pf = 0;
    const targetConfig = {
        run(f) {
            const oScale = transform.scale[0];
            const nscale = scaleRangeCheck(
                self.zoomExtent_,
                origScale + (newScale - origScale) * f
            );

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
    queueInstance.add(animeId(), targetConfig, easing(targetConfig.ease));
};

ZoomClass.prototype.panTo = function panTo(trgt, point) {
    const self = this;
    const transform = self.event.transform;
    const xdiff = point[0] - self.event.x;
    const ydiff = point[1] - self.event.y;
    let pf = 0;
    const targetConfig = {
        run(f) {
            const [scale] = transform.scale;

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
    queueInstance.add(animeId(), targetConfig, easing(targetConfig.ease));
};

ZoomClass.prototype.bindMethods = function (trgt) {
    const self = this;
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
        const dx = event.offsetX - this.event.x;
        const dy = event.offsetY - this.event.y;

        this.event.x = event.offsetX;
        this.event.y = event.offsetY;

        this.event = applyTranslate(this.event, { dx, dy }, this.panExtent_);
        this.zoomExe.call(trgt, this.event);
    }
    if (event.preventDefault) {
        event.preventDefault();
    }
};

export default {
    drag: function () {
        return new DragClass();
    },
    zoom: function () {
        return new ZoomClass();
    },
};
