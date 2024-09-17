import queue from "./../queue.js";
import VDom from "./../VDom.js";
import { CheckPathType, AnimatePathTo, MorphTo} from "./../path.js";
import colorMap from "./../colorMap.js";
import Events from "./../events.js";
import {
    CollectionPrototype,
    NodePrototype,
    layerResizeBind,
    layerResizeUnBind,
    // prepObjProxy,
    // prepArrayProxy
} from "./../coreApi.js";

const queueInstance = queue;

let Id = 0;

function domId() {
    Id += 1;
    return Id;
}

const SVGCollection = function () {
    CollectionPrototype.apply(this, arguments);
};
SVGCollection.prototype = new CollectionPrototype();
SVGCollection.prototype.constructor = SVGCollection;
SVGCollection.prototype.createNode = function (ctx, config, vDomIndex) {
    return createDomElement(config, vDomIndex);
};

function SVGMasking(self, config = {}) {
    this.pDom = self;
    const maskId = config.id ? config.id : "mask-" + Math.ceil(Math.random() * 1000);
    this.id = config.id || maskId;
    config.id = maskId;
    if (!this.defs) {
        this.defs = self.createEl({
            el: "defs",
        });
    }

    this.mask = this.defs.createEl({
        el: "mask",
        attr: config,
        style: {},
    });
}

SVGMasking.prototype.exe = function exe() {
    return `url(#${this.id})`;
};

function SVGClipping(self, config = {}) {
    this.pDom = self;
    const clipId = config.id ? config.id : "clip-" + Math.ceil(Math.random() * 1000);
    this.id = config.id || clipId;
    config.id = clipId;
    if (!this.defs) {
        this.defs = self.createEl({
            el: "defs",
        });
    }

    this.clip = this.defs.createEl({
        el: "clipPath",
        attr: config,
        style: {},
    });
}

SVGClipping.prototype.exe = function exe() {
    return `url(#${this.id})`;
};

function SVGPattern(self, config = {}) {
    this.pDom = self;
    const patternId = config.id ? config.id : "pattern-" + Math.ceil(Math.random() * 1000);
    this.id = config.id || patternId;
    config.id = patternId;
    if (!this.defs) {
        this.defs = self.createEl({
            el: "defs",
        });
    }

    this.pattern = this.defs.createEl({
        el: "pattern",
        attr: config,
        style: {},
    });
}
SVGPattern.prototype.exe = function exe() {
    return `url(#${this.id})`;
};

function transformToString(trns) {
    let cmd = "";

    for (const trnX in trns) {
        if (trnX === "rotate") {
            cmd += `${trnX}(${
                trns.rotate[0] + " " + (trns.rotate[1] || 0) + " " + (trns.rotate[2] || 0)
            }) `;
        } else if (trnX === "skew") {
            if (trns.skew[0]) {
                cmd += `skewX(${trns[trnX][0]}) `;
            }
            if (trns.skew[1]) {
                cmd += `skewY(${trns[trnX][1]}) `;
            }
        } else {
            if (trns[trnX].length > 1) {
                cmd += `${trnX}(${trns[trnX].join(" ")}) `;
            } else {
                cmd += `${trnX}(${trns[trnX]}) `;
            }
        }
    }
    return cmd;
}

function prepObjProxySvg(type, attr, context) {
    const handlr = {
        set(obj, prop, value) {
            if (value !== null) {
                if (prop === 'points') {
                    value = pointsToString(value);
                }
                
                if (type === 'attr') {
                    if (prop === 'transform') {
                        value = prepObjProxySvg("transform", value, context);
                    }
                    context.changedAttribute[prop] = value;
                    context.attrChanged = true;
                } else if (type === 'style') {
                    if (colorMap.RGBAInstanceCheck(value)) {
                        value = value.rgba;
                    }
                    context.changedStyles[prop] = value;
                    context.styleChanged = true;
                } else if (type === 'transform') {
                    if (prop === 'translate' || prop === 'scale' || prop === 'skew') {
                        value = Array.isArray(value) && value.length > 0 ? [value[0], value[1] ? value[1] : value[0]] : [0, 0];
                    } else if (prop === 'rotate') {
                        value = Array.isArray(value) && value.length > 0 ? [value[0] || 0, value[1] || 0, value[2] || 0] : [0, 0, 0]
                    }

                    context.changedStyles['transform'] = obj;
                    context.attrChanged = true;
                }

                obj[prop] = value;
                queueInstance.vDomChanged(context.vDomIndex);
            } else {
                delete obj[prop];
            }
            return true;
        },
        deleteProperty(obj, prop) {
            if (prop in obj) {
                delete obj[prop];
                queueInstance.vDomChanged(context.vDomIndex);
            }
            return true;
        },
    };

    return new Proxy(Object.assign({}, attr), handlr);
}


function DomGradients(config, type, pDom) {
    this.config = config;
    this.type = type || "linear";
    this.pDom = pDom;
    this.defs = this.pDom.createEl({
        el: "defs",
    });
}

DomGradients.prototype.exe = function exe() {
    return `url(#${this.config.id})`;
};

DomGradients.prototype.linearGradient = function linearGradient() {
    const self = this;

    this.linearEl = this.defs.join([1], "linearGradient", {
        action: {
            enter(data) {
                const gredEl = this.createEls(data.linearGradient, {
                    el: "linearGradient",
                }).setAttr({
                    id: self.config.id,
                    x1: `${self.config.x1}%`,
                    y1: `${self.config.y1}%`,
                    x2: `${self.config.x2}%`,
                    y2: `${self.config.y2}%`,
                    spreadMethod: self.config.spreadMethod || "pad",
                    gradientUnits: self.config.gradientUnits || "objectBoundingBox",
                });

                if (self.config.gradientTransform) {
                    gredEl.setAttr(
                        "gradientTransform",
                        transformToString(self.config.gradientTransform)
                    );
                }
            },

            exit(oldNodes) {
                oldNodes.linearGradient.remove();
            },

            update(nodes) {
                nodes.linearGradient.setAttr({
                    id: self.config.id,
                    x1: `${self.config.x1}%`,
                    y1: `${self.config.y1}%`,
                    x2: `${self.config.x2}%`,
                    y2: `${self.config.y2}%`,
                    spreadMethod: self.config.spreadMethod || "pad",
                    gradientUnits: self.config.gradientUnits || "objectBoundingBox",
                });
                if (self.config.gradientTransform) {
                    nodes.linearGradient.setAttr(
                        "gradientTransform",
                        transformToString(self.config.gradientTransform)
                    );
                }
            },
        },
    });
    this.linearEl = this.linearEl.fetchEl("linearGradient");
    this.linearEl.fetchEls("stop").remove();
    this.linearEl.createEls(this.config.colorStops, {
        el: "stop",
        attr: {
            "offset"(d) {
                return `${d.offset}%`;
            },

            "stop-color": function stopColor(d) {
                return d.color;
            },
        },
    });
    return this;
};

DomGradients.prototype.radialGradient = function radialGradient() {
    const self = this;
    const { innerCircle = {}, outerCircle = {} } = this.config;
    if (!this.defs) {
        this.defs = this.pDom.createEl({
            el: "defs",
        });
    }

    this.radialEl = this.defs.join([1], "radialGradient", {
        action: {
            enter(data) {
                const gredEl = this.createEls(data.radialGradient, {
                    el: "radialGradient",
                }).setAttr({
                    id: self.config.id,
                    cx: `${innerCircle.x}%`,
                    cy: `${innerCircle.y}%`,
                    r: `${innerCircle.r}%`,
                    fx: `${outerCircle.x}%`,
                    fy: `${outerCircle.y}%`,
                    spreadMethod: self.config.spreadMethod || "pad",
                    gradientUnits: self.config.gradientUnits || "objectBoundingBox",
                });

                if (self.config.gradientTransform) {
                    gredEl.setAttr(
                        "gradientTransform",
                        transformToString(self.config.gradientTransform)
                    );
                }
            },

            exit(oldNodes) {
                oldNodes.radialGradient.remove();
            },

            update(nodes) {
                nodes.radialGradient.setAttr({
                    id: self.config.id,
                    cx: `${innerCircle.x}%`,
                    cy: `${innerCircle.y}%`,
                    r: `${innerCircle.r}%`,
                    fx: `${outerCircle.x}%`,
                    fy: `${outerCircle.y}%`,
                    spreadMethod: self.config.spreadMethod || "pad",
                    gradientUnits: self.config.gradientUnits || "objectBoundingBox",
                });

                if (self.config.gradientTransform) {
                    nodes.radialGradient.setAttr(
                        "gradientTransform",
                        transformToString(self.config.gradientTransform)
                    );
                }
            },
        },
    });
    this.radialEl = this.radialEl.fetchEl("radialGradient");
    this.radialEl.fetchEls("stop").remove();
    this.radialEl.createEls(this.config.colorStops, {
        el: "stop",
        attr: {
            "offset"(d) {
                return `${d.offset}%`;
            },

            "stop-color": function stopColor(d) {
                return d.color;
            },
        },
    });
    return this;
};

DomGradients.prototype.colorStops = function colorStops(colorSts) {
    if (Object.prototype.toString.call(colorSts) !== "[object Array]") {
        return false;
    }

    this.config.colorStops = colorSts;

    if (this.type === "linear") {
        return this.linearGradient();
    } else if (this.type === "radial") {
        return this.radialGradient();
    }

    return false;
};

const nameSpace = {
    svg: "http://www.w3.org/2000/svg",
    xlink: "http://www.w3.org/1999/xlink",
    xhtml: "http://www.w3.org/1999/xhtml",
};

const buildDom = function buildSVGElement(ele) {
    return document.createElementNS(nameSpace.svg, ele);
};

const buildNamespaceDom = function buildNamespaceDom(ns, ele) {
    return document.createElementNS(nameSpace[ns], ele);
};

function createDomElement(obj, vDomIndex) {
    let dom = null;
    const ind = obj.el.indexOf(":");

    if (ind >= 0) {
        dom = buildNamespaceDom(obj.el.slice(0, ind), obj.el.slice(ind + 1));
    } else {
        switch (obj.el) {
            case "group":
                dom = buildDom("g");
                break;

            default:
                dom = buildDom(obj.el);
                break;
        }
    }

    const node = new DomExe(dom, obj, domId(), vDomIndex);

    if (obj.dataObj) {
        dom.dataObj = obj.dataObj;
    }

    return node;
}

const DomExe = function DomExe(dom, config, id, vDomIndex) {
    this.dom = dom;
    this.nodeName = dom.nodeName;
    this.changedAttribute = {};
    this.changedStyles = {};
    this.id = id;
    this.nodeType = "svg";
    this.dom.nodeId = id;
    this.children = [];
    this.vDomIndex = vDomIndex;
    this.events = {};
    this.style = prepObjProxySvg('style', {}, this);
    this.attr = prepObjProxySvg('attr',{}, this);

    if (config.style) {
        this.setStyle(config.style);
    }

    if (config.attr) {
        this.setAttr(config.attr);
    }
};

DomExe.prototype = new NodePrototype();

DomExe.prototype.node = function node() {
    this.execute();
    return this.dom;
};

function updateAttrsToDom(self, key) {
    const ind = key.indexOf(":");
    const value = self.changedAttribute[key];

    if (ind >= 0) {
        self.dom.setAttributeNS(nameSpace[key.slice(0, ind)], key.slice(ind + 1), value);
    } else {
        if (key === "text") {
            self.dom.textContent = value;
        } else if (key === "d") {
            if (CheckPathType(value)) {
                self.dom.setAttribute(key, value.fetchPathString());
            } else {
                self.dom.setAttribute(key, value);
            }
        } else {
            if (key === "onerror" || key === "onload") {
                self.dom[key] = function fun(e) {
                    value.call(self, e);
                };
            } else {
                self.dom.setAttribute(key, value);
            }
        }
    }
}

function updateTransAttrsToDom(self) {
    // let cmd = "";
    // // let trns = ['scale', 'translate', 'rotate'];
    // for (const trnX in self.attr.transform) {
    //     if (trnX === "rotate") {
    //         cmd += `${trnX}(${
    //             self.attr.transform.rotate[0] +
    //             " " +
    //             (self.attr.transform.rotate[1] || 0) +
    //             " " +
    //             (self.attr.transform.rotate[2] || 0)
    //         }) `;
    //     } else {
    //         cmd += `${trnX}(${self.attr.transform[trnX].join(" ")}) `;
    //     }
    // }

    self.dom.setAttribute("transform", transformToString(self.attr.transform));
}

DomExe.prototype.transFormAttributes = function transFormAttributes() {
    const self = this;

    for (const key in self.changedAttribute) {
        if (key !== "transform") {
            updateAttrsToDom(self, key);
        } else {
            updateTransAttrsToDom(self);
        }
    }

    this.changedAttribute = {};
};

DomExe.prototype.scale = function DMscale(XY) {
    if (!this.attr.transform) {
        this.attr.transform = prepObjProxySvg('transform', {}, this);
    }

    this.attr.transform.scale = XY;
    // this.changedAttribute.transform = this.attr.transform;
    // this.attrChanged = true;
    // queueInstance.vDomChanged(this.vDomIndex);
    return this;
};

DomExe.prototype.skew = function DMskewX(XY) {
    if (!this.attr.transform) {
        this.attr.transform = prepObjProxySvg('transform', {}, this);
    }

    this.attr.transform.skew = XY;
    return this;
};

DomExe.prototype.translate = function DMtranslate(XY) {
    if (!this.attr.transform) {
        this.attr.transform = prepObjProxySvg('transform', {}, this);
    }

    this.attr.transform.translate = XY;
    return this;
};

DomExe.prototype.rotate = function DMrotate(angleXY) {
    if (!this.attr.transform) {
        this.attr.transform = prepObjProxySvg('transform', {}, this);
    }

    this.attr.transform.rotate = angleXY;
    return this;
};

DomExe.prototype.setStyle = function DMsetStyle(attr, value) {
    if (arguments.length === 2) {
        this.style[attr] = value;
    } else if (arguments.length === 1 && typeof attr === "object") {
        for (const key in attr) {
            this.style[key] = attr[key];
        }
    }
    return this;
};

function pointsToString(points) {
    if (Object.prototype.toString.call(points) !== "[object Array]") {
        return;
    }

    return points.reduce(function (p, c) {
        return p + c.x + "," + c.y + " ";
    }, "");
}

DomExe.prototype.setAttr = function DMsetAttr(attr, value) {
    if (arguments.length === 2) {
        this.attr[attr] = value;
    } else if (arguments.length === 1 && typeof attr === "object") {
        for (const key in attr) {
            this.attr[key] = attr[key];
        }
    }
    return this;
};

DomExe.prototype.execute = function DMexecute() {
    if (!this.styleChanged && !this.attrChanged) {
        for (let i = 0, len = this.children.length; i < len; i += 1) {
            this.children[i].execute();
        }

        return;
    }

    this.transFormAttributes();

    for (let i = 0, len = this.children.length; i < len; i += 1) {
        this.children[i].execute();
    }

    for (const style in this.changedStyles) {
        if (typeof this.changedStyles[style] === "object") {
            if (
                this.changedStyles[style] instanceof DomGradients ||
                this.changedStyles[style] instanceof SVGPattern ||
                this.changedStyles[style] instanceof SVGClipping ||
                this.changedStyles[style] instanceof SVGMasking
            ) {
                this.changedStyles[style] = this.changedStyles[style].exe();
            }
        }

        this.dom.style.setProperty(style, this.changedStyles[style], "");
    }

    this.changedStyles = {};
};

DomExe.prototype.child = function DMchild(nodes) {
    const parent = this.dom;
    const self = this;

    if (nodes instanceof SVGCollection) {
        var fragment = document.createDocumentFragment();

        for (let i = 0, len = nodes.stack.length; i < len; i++) {
            fragment.appendChild(nodes.stack[i].dom);
            nodes.stack[i].parentNode = self;
            nodes.stack[i].vDomIndex = self.vDomIndex;
            this.children[this.children.length] = nodes.stack[i];
        }

        parent.appendChild(fragment);
    } else if (nodes instanceof DomExe) {
        parent.appendChild(nodes.dom);
        nodes.parentNode = self;
        this.children.push(nodes);
    } else {
        console.log("wrong node type");
    }

    return this;
};

DomExe.prototype.animatePathTo = AnimatePathTo;
DomExe.prototype.morphTo = MorphTo;

DomExe.prototype.createRadialGradient = function DMcreateRadialGradient(config) {
    const gradientIns = new DomGradients(config, "radial", this);
    gradientIns.radialGradient();
    return gradientIns;
};

DomExe.prototype.createLinearGradient = function DMcreateLinearGradient(config) {
    const gradientIns = new DomGradients(config, "linear", this);
    gradientIns.linearGradient();
    return gradientIns;
};

// DomExe.prototype

// let dragStack = [];

DomExe.prototype.on = function DMon(eventType, hndlr) {
    const self = this;

    if (self.events[eventType] && eventType !== "drag" && eventType !== "zoom") {
        self.dom.removeEventListener(eventType, self.events[eventType]);
        delete self.events[eventType];
    }

    if (eventType === "drag") {
        delete self.dom.drag_;
    }

    if (eventType === "zoom") {
        self.dom.removeEventListener("wheel", self.events[eventType]);
        delete self.dom.drag_;
    }

    if (!hndlr) {
        return;
    }

    if (eventType === "drag") {
        self.dom.drag_ = function (event, eventType) {
            hndlr.execute(self, event, eventType);
        };
    } else if (eventType === "zoom") {
        let wheelCounter = 0;
        let deltaWheel = 0;
        let wheelHndl;

        self.events[eventType] = function (event) {
            if (hndlr.disableWheel) {
                return;
            }
            hndlr.zoomExecute(self, event);
            wheelCounter += 1;
            if (wheelHndl) {
                clearTimeout(wheelHndl);
                wheelHndl = null;
                deltaWheel = wheelCounter;
            }
            wheelHndl = setTimeout(function () {
                if (deltaWheel !== wheelCounter) {
                    deltaWheel = wheelCounter;
                } else {
                    wheelHndl = null;
                    hndlr.onZoomEnd(self, event);
                    wheelCounter = 0;
                }
            }, 100);
        };

        self.dom.addEventListener("wheel", self.events[eventType]);
        self.dom.drag_ = function (event, eventType, eventsInstance) {
            if (hndlr.panFlag) {
                hndlr.panExecute(self, event, eventType, eventsInstance);
            }
        };
    } else {
        const hnd = hndlr.bind(self);
        self.events[eventType] = function (event) {
            hnd(event);
        };

        self.dom.addEventListener(eventType, self.events[eventType]);
    }

    return this;
};

DomExe.prototype.html = function DMhtml(value) {
    if (!arguments.length) {
        return this.dom.innerHTML;
    }

    this.dom.innerHTML(value);
    return this;
};

DomExe.prototype.text = function DMtext(value) {
    if (!arguments.length) {
        return this.attr.text;
    }

    this.attr.text = value;
    this.changedAttribute.text = value;
    return this;
};



DomExe.prototype.createEls = function DMcreateEls(data, config) {
    const e = new SVGCollection(
        {
            type: "SVG",
        },
        data,
        config,
        this.vDomIndex
    );
    this.child(e);
    queueInstance.vDomChanged(this.vDomIndex);
    return e;
};

DomExe.prototype.createEl = function DMcreateEl(config) {
    const e = createDomElement(config, this.vDomIndex);
    this.child(e);
    queueInstance.vDomChanged(this.vDomIndex);
    return e;
};

DomExe.prototype.remove = function DMremove() {
    if (this.parentNode) {
        this.parentNode.removeChild(this);
    }
};

DomExe.prototype.removeChild = function DMremoveChild(obj) {
    const { children } = this;
    const index = children.indexOf(obj);

    if (index !== -1) {
        const removedNode = children[index];
        const dom = children.splice(index, 1)[0].dom;
        if (!this.dom.contains(dom)) {
            return;
        }
        this.dom.removeChild(dom);
        markForDeletion(removedNode);
    }
};

function markForDeletion(removedNode) {
    removedNode.deleted = true;
    if (!removedNode.deleted) {
        for(let i = 0; i < removedNode.children.length; i++) {
            markForDeletion(removedNode[i]);
        }
    }
}

function svgLayer(container, layerSettings = {}) {

    const res = typeof container === 'string' ? document.querySelector(container) : container instanceof HTMLElement ? container : null;
    
    let height = res?.clientHeight || 0;
    let width = res?.clientWidth || 0;

    const { autoUpdate = true, enableResize = true } = layerSettings;
    const layer = document.createElementNS(nameSpace.svg, "svg");
    layer.setAttribute("height", height);
    layer.setAttribute("width", width);
    // layer.style.position = "absolute";

    let vDomInstance;
    let vDomIndex = 999999;
    let cHeight;
    let cWidth;
    let resizeCall;
    let onChangeExe;

    if (res) {
        res.appendChild(layer);
        vDomInstance = new VDom();
        if (autoUpdate) {
            vDomIndex = queueInstance.addVdom(vDomInstance);
        }
    }

    const root = new DomExe(layer, {}, domId(), vDomIndex);
    root.container = res;
    root.type = "SVG";
    root.width = width;
    root.height = height;
    root.domEl = layer;

    const eventsInstance = new Events(root);

    if (vDomInstance) {
        vDomInstance.rootNode(root);
    }

    root.setLayerId = function (id) {
        layer.setAttribute("id", id);
    };

    const resize = function (cr) {
        if (
            (container instanceof HTMLElement && !document.body.contains(container)) ||
            (container instanceof String && !document.querySelector(container))
        ) {
            layerResizeUnBind(root);
            root.destroy();
            return;
        }
        height = cHeight || cr.height;
        width = cWidth || cr.width;
        layer.setAttribute("height", height);
        layer.setAttribute("width", width);
        root.width = width;
        root.height = height;

        if (resizeCall) {
            resizeCall();
        }

        root.update();
    };

    root.onResize = function (exec) {
        resizeCall = exec;
    };

    root.onChange = function (exec) {
        onChangeExe = exec;
    };

    root.invokeOnChange = function () {
        if (onChangeExe) {
            onChangeExe();
        }
    };

    root.setSize = function (width, height) {
        this.dom.setAttribute("height", height);
        this.dom.setAttribute("width", width);
        this.width = width;
        this.height = height;
        cHeight = height;
        cWidth = width;
    };

    root.update = function () {
        this.execute();
    };

    root.setViewBox = function (x, y, height, width) {
        this.dom.setAttribute("viewBox", x + "," + y + "," + width + "," + height);
    };

    root.destroy = function () {
        const res = document.body.contains(this.container);
        if (res && this.container.contains(this.domEl)) {
            this.container.removeChild(this.domEl);
        }
        queueInstance.removeVdom(vDomIndex);
        layerResizeUnBind(root, resize);
    };

    root.createPattern = function (config) {
        return new SVGPattern(this, config);
    };

    root.createClip = function (config) {
        return new SVGClipping(this, config);
    };

    root.createMask = function (config) {
        return new SVGMasking(this, config);
    };

    let dragNode = null;
    root.dom.addEventListener("pointerdown", (e) => {
        // e.preventDefault();
        eventsInstance.addPointer(e);
        if (e.target.drag_) {
            e.target.drag_(e, "pointerdown", eventsInstance);
            dragNode = e.target;
        }
    });
    root.dom.addEventListener("pointerup", (e) => {
        // e.preventDefault();
        if (dragNode) {
            dragNode.drag_(e, "pointerup", eventsInstance);
            dragNode = null;
        }
        eventsInstance.removePointer(e);
    });
    root.dom.addEventListener("pointermove", (e) => {
        e.preventDefault();
        if (dragNode) {
            dragNode.drag_(e, "pointermove", eventsInstance);
        }
    });
    queueInstance.execute();

    if (enableResize) {
        layerResizeBind(root, resize);
    }

    return root;
}

export default svgLayer;
