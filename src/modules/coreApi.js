/* eslint-disable no-undef */
// import { geometry, queue, ease, chain, colorMap, path } from './'
import geometry from "./geometry.js";
import queue from "./queue.js";
import ease from "./ease.js";
import colorMap from "./colorMap.js";
import { ResizeObserver as resizePolyfill } from "@juggle/resize-observer";
import { canvasStyleMapper, svgStyleMapper } from "./constants.js";

let animeIdentifier = 0;
const t2DGeometry = geometry;
const easing = ease;
const queueInstance = queue;
const ResizeObserver = window.ResizeObserver || resizePolyfill;
// const ResizeObserver = function () {};
function animeId() {
    animeIdentifier += 1;
    return animeIdentifier;
}

const transitionSetAttr = function transitionSetAttr(self, key, value) {
    return function inner(f) {
        self.attr[key] = value.call(self, f);
        // self.setAttr(key, value.call(self, f));
    };
};

const transformTransition = function transformTransition(self, subkey, srcVal, value) {
    const exe = [];

    if (typeof value === "function") {
        return function inner(f) {
            self[subkey](value.call(self, f));
        };
    }

    value.forEach((tV, i) => {
        let val;

        if (srcVal) {
            if (srcVal[i] !== undefined) {
                val = srcVal[i];
            } else {
                val = subkey === "scale" ? 1 : 0;
            }
        } else {
            val = subkey === "scale" ? 1 : 0;
        }

        exe.push(t2DGeometry.intermediateValue.bind(null, val, tV));
    });
    return function inner(f) {
        self[subkey](exe.map((d) => d(f)));
    };
};

const attrTransition = function attrTransition(self, key, srcVal, tgtVal) {
    return function setAttr_(f) {
        self.attr[key] = t2DGeometry.intermediateValue(srcVal, tgtVal, f);
        // self.setAttr(key, t2DGeometry.intermediateValue(srcVal, tgtVal, f));
    };
};

const styleTransition = function styleTransition(self, key, sVal, value) {
    let srcValue;
    let destUnit;
    let destValue;

    if (typeof value === "function") {
        return function inner(f) {
            self.style[key] = value.call(self, self.dataObj, f);
            // self.setStyle(key, value.call(self, self.dataObj, f));
        };
    } else {
        srcValue = sVal;

        if (isNaN(value)) {
            if (colorMap.isTypeColor(value)) {
                const colorExe = colorMap.transition(srcValue, value);
                return function inner(f) {
                    self.style[key] = colorExe(f);
                    // self.setStyle(key, colorExe(f));
                };
            }

            srcValue = srcValue.match(/(\d+)/g);
            destValue = value.match(/(\d+)/g);
            destUnit = value.match(/\D+$/);
            srcValue = parseInt(srcValue.length > 0 ? srcValue[0] : 0, 10);
            destValue = parseInt(destValue.length > 0 ? destValue[0] : 0, 10);
            destUnit = destUnit.length > 0 ? destUnit[0] : "px";
        } else {
            srcValue = sVal !== undefined ? sVal : 1;
            destValue = value;
            destUnit = 0;
        }

        return function inner(f) {
            self.style[key] = t2DGeometry.intermediateValue(srcValue, destValue, f) + destUnit;
            // self.setStyle(key, t2DGeometry.intermediateValue(srcValue, destValue, f) + destUnit);
        };
    }
};

function resolveStyle(style, styleMapper) {
    let resolvedStyle = {};
    let val = null;
    for(let st in style) {
        val = style[st];
        st = styleMapper[st] || st;
        resolvedStyle[st] = val;
    }
    return resolvedStyle;
}

const animate = function animate(self, fromConfig, targetConfig) {
    const tattr = targetConfig.attr || {};
    let tstyles = targetConfig.style || {};
    const sattr = fromConfig.attr || {};
    let sstyles = fromConfig.style || {};
    const runStack = [];
    const styleMapper = ['WEBGL', 'canvas'].includes(self.nodeType) ? canvasStyleMapper : svgStyleMapper;

    sstyles = resolveStyle(sstyles, styleMapper);
    tstyles = resolveStyle(tstyles, styleMapper);

    if (typeof tattr !== "function") {
        for (const key in tattr) {
            if (key !== "transform") {
                const value = tattr[key];

                if (typeof value === "function") {
                    runStack[runStack.length] = function setAttr_(f) {
                        self.attr[key] = value.call(self, f);
                        // self.setAttr(key, value.call(self, f));
                    };
                } else {
                    if (key === "d") {
                        self.morphTo(targetConfig);
                    } else if (key === "points") {
                        console.log("write points mapper");
                    } else {
                        runStack[runStack.length] = attrTransition(
                            self,
                            key,
                            sattr[key],
                            tattr[key]
                        );
                    }
                }
            } else {
                const value = tattr[key];
                if (typeof value === "function") {
                    runStack[runStack.length] = transitionSetAttr(self, key, value);
                } else {
                    let trans = sattr.transform;

                    if (!trans) {
                        self.setAttr("transform", {});
                        trans = {};
                    }

                    const subTrnsKeys = Object.keys(tattr.transform);

                    for (let j = 0, jLen = subTrnsKeys.length; j < jLen; j += 1) {
                        runStack[runStack.length] = transformTransition(
                            self,
                            subTrnsKeys[j],
                            trans[subTrnsKeys[j]],
                            tattr.transform[subTrnsKeys[j]]
                        );
                    }
                }
            }
        }
    } else {
        runStack[runStack.length] = tattr.bind(self);
    }

    if (typeof tstyles !== "function") {
        for (let style in tstyles) {
            // style = styleMapper[style] || style;
            runStack[runStack.length] = styleTransition(
                self,
                style,
                sstyles[style],
                tstyles[style]
            );
        }
    } else {
        runStack[runStack.length] = tstyles.bind(self);
    }

    return {
        run(f) {
            for (let j = 0, len = runStack.length; j < len; j += 1) {
                runStack[j](f);
            }
        },
        target: self,
        duration: targetConfig.duration || 0,
        delay: targetConfig.delay || 0,
        end: targetConfig.end ? targetConfig.end.bind(self, self.dataObj) : null,
        loop: targetConfig.loop || 0,
        direction: targetConfig.direction || "default",
        ease: targetConfig.ease || "default",
    };
};

function performJoin(data, nodes, cond) {
    const dataIds = data.map(cond);
    const res = {
        new: [],
        update: [],
        old: [],
    };

    for (let i = 0; i < nodes.length; i += 1) {
        const index = dataIds.indexOf(cond(nodes[i].dataObj, i));

        if (index !== -1) {
            nodes[i].dataObj = data[index];
            res.update.push(nodes[i]);
            dataIds[index] = null;
        } else {
            // nodes[i].dataObj = data[index]
            res.old.push(nodes[i]);
        }
    }

    res.new = data.filter((d, i) => {
        const index = dataIds.indexOf(cond(d, i));

        if (index !== -1) {
            dataIds[index] = null;
            return true;
        }

        return false;
    });
    return res;
}

const CompositeArray = {};
CompositeArray.push = {
    value: function (data) {
        if (Object.prototype.toString.call(data) !== "[object Array]") {
            data = [data];
        }

        for (let i = 0, len = data.length; i < len; i++) {
            this.data.push(data[i]);
        }

        if (this.config.action.enter) {
            const nodes = {};
            this.selector.split(",").forEach(function (d) {
                nodes[d] = data;
            });
            this.config.action.enter.call(this, nodes);
        }
    },
    enumerable: false,
    configurable: false,
    writable: false,
};
CompositeArray.pop = {
    value: function () {
        const self = this;
        const elData = this.data.pop();

        if (this.config.action.exit) {
            const nodes = {};
            this.selector.split(",").forEach(function (d) {
                nodes[d] = self.fetchEls(d, [elData]);
            });
            this.config.action.exit.call(this, nodes);
        }
    },
    enumerable: false,
    configurable: false,
    writable: false,
};
CompositeArray.remove = {
    value: function (data) {
        if (Object.prototype.toString.call(data) !== "[object Array]") {
            data = [data];
        }

        const self = this;

        for (let i = 0, len = data.length; i < len; i++) {
            if (this.data.indexOf(data[i]) !== -1) {
                this.data.splice(this.data.indexOf(data[i]), 1);
            }
        }

        if (this.config.action.exit) {
            const nodes = {};
            this.selector.split(",").forEach(function (d) {
                nodes[d] = self.fetchEls(d, data);
            });
            this.config.action.exit.call(this, nodes);
        }
    },
    enumerable: false,
    configurable: true,
    writable: false,
};
CompositeArray.update = {
    value: function () {
        const self = this;

        if (this.config.action.update) {
            const nodes = {};
            this.selector.split(",").forEach(function (d) {
                nodes[d] = self.fetchEls(d, self.data);
            });
            this.config.action.update.call(this, nodes);
        }
    },
    enumerable: false,
    configurable: true,
    writable: false,
};
CompositeArray.join = {
    value: function (data) {
        this.data = data;
        dataJoin.call(this, data, this.selector, this.config);
    },
    enumerable: false,
    configurable: true,
    writable: false,
};

var NodePrototype = function () {};

NodePrototype.prototype.getAttr = function (_) {
    return this.attr[_];
};

NodePrototype.prototype.getStyle = function (_) {
    return this.style[_];
};

NodePrototype.prototype.exec = function Cexe(exe) {
    if (typeof exe !== "function") {
        console.error("Wrong Exe type");
    }

    exe.call(this, this.dataObj);
    return this;
};

NodePrototype.prototype.fetchEls = function fetchEls (nodeSelector, dataArray) {

    const nodes = [];
    const wrap = new CollectionPrototype();
    const selectorType = nodeSelector.charAt(0);
    const token = ['.', '#'].includes(selectorType) ? nodeSelector.substring(1) : nodeSelector;

    const isMatch = (node, compareToken) => {
        if (!node) return false;

        const attrValue = selectorType === '.' ? node.attr?.class :
                          selectorType === '#' ? node.attr?.id :
                          node.nodeName;
        const isInDataArray = dataArray ? dataArray.includes(node.dataObj) : true;

        return isInDataArray && attrValue === compareToken;
    };

    for (let i = 0; i < this.children.length; i++) {
        const node = this.children[i];
        if (isMatch(node, token)) {
            nodes.push(node);
        }
    }

    return wrap.wrapper(nodes);
};

NodePrototype.prototype.fetchEl = function fetchEl(nodeSelector, data) {
    let matchedNode = null;

    const selectorType = nodeSelector.charAt(0);
    const token = ['.', '#'].includes(selectorType) ? nodeSelector.substring(1) : nodeSelector

    const isMatch = (node, compareToken) => {
        if (!node) return false;
        const nodeAttr = node.attr || {};
        const compareAgainst = selectorType === '.' ? nodeAttr['class'] : 
                               selectorType === '#' ? nodeAttr['id'] : 
                               node.nodeName;

        return (!data || node.dataObj === data) && compareAgainst === compareToken;
    };

     for (let node of this.children) {
        const compareToken = (selectorType === '.' || selectorType === '#') ? token : 
                             (nodeSelector === 'group' ? 'g' : nodeSelector);

        if (isMatch(node, compareToken)) {
            matchedNode = node;
            break;
        }
    }

    return matchedNode;
};

function dataJoin(data, selector, config) {
    const self = this;
    const selectors = selector.split(",");
    let { joinOn } = config;
    const joinResult = {
        new: {},
        update: {},
        old: {},
    };

    if (!joinOn) {
        joinOn = function (d, i) {
            return i;
        };
    }

    for (let i = 0, len = selectors.length; i < len; i++) {
        const d = selectors[i];
        const nodes = self.fetchEls(d);
        const join = performJoin(data, nodes.stack, joinOn);
        joinResult.new[d] = join.new;
        joinResult.update[d] = new CollectionPrototype().wrapper(join.update);
        joinResult.old[d] = new CollectionPrototype().wrapper(join.old);
    }

    if (config.action) {
        if (config.action.enter) {
            config.action.enter.call(self, joinResult.new);
        }

        if (config.action.exit) {
            config.action.exit.call(self, joinResult.old);
        }

        if (config.action.update) {
            config.action.update.call(self, joinResult.update);
        }
    }

    CompositeArray.config = {
        value: config,
        enumerable: false,
        configurable: true,
        writable: true,
    };
    CompositeArray.selector = {
        value: selector,
        enumerable: false,
        configurable: true,
        writable: false,
    };
    CompositeArray.data = {
        value: data,
        enumerable: false,
        configurable: true,
        writable: true,
    };
    return Object.create(self, CompositeArray);
}

NodePrototype.prototype.join = dataJoin;

NodePrototype.prototype.data = function (data) {
    if (!data) {
        return this.dataObj;
    } else {
        this.dataObj = data;
    }
    return this;
};

NodePrototype.prototype.interrupt = function () {
    if (this.ctx && this.ctx.type_ === "pdf") return;
    queueInstance.interruptNodeAnimations(this);
    return this;
};

NodePrototype.prototype.animateTo = function (toConfig, fromConfig) {
    if (this.ctx && this.ctx.type_ === "pdf") return;
    queueInstance.add(
        animeId(),
        animate(this, fromConfig || this, toConfig),
        easing(toConfig.ease)
    );
    return this;
};

NodePrototype.prototype.animateExe = function (targetConfig, fromConfig) {
    if (this.ctx && this.ctx.type_ === "pdf") return;
    return animate(this, fromConfig || this, targetConfig);
};

function fetchEls(nodeSelector, dataArray) {
    let d;
    const coll = [];

    for (let i = 0; i < this.stack.length; i += 1) {
        d = this.stack[i];
        coll.push(d.fetchEls(nodeSelector, dataArray));
    }

    const collection = new CollectionPrototype();
    collection.wrapper(coll);
    return collection;
}

function join(data, el, arg) {
    let d;
    const coll = [];

    for (let i = 0; i < this.stack.length; i += 1) {
        d = this.stack[i];
        coll.push(d.join(data, el, arg));
    }

    const collection = new CollectionPrototype();
    collection.wrapper(coll);
    return collection;
}

function createEl(config) {
    let d;
    const coll = [];

    for (let i = 0, len = this.stack.length; i < len; i += 1) {
        let cRes = {};
        d = this.stack[i];

        if (typeof config === "function") {
            cRes = config.call(d, d.dataObj, i);
        } else {
            const keys = Object.keys(config);

            for (let j = 0, lenJ = keys.length; j < lenJ; j += 1) {
                const key = keys[j];

                if (typeof config[key] !== "object") {
                    cRes[key] = config[key];
                } else {
                    cRes[key] = JSON.parse(JSON.stringify(config[key]));
                }
            }
        }

        coll.push(d.createEl(cRes));
    }

    const collection = new CollectionPrototype();
    collection.wrapper(coll);
    return collection;
}

function createEls(data, config) {
    let d;
    const coll = [];
    let res = data;

    for (let i = 0, len = this.stack.length; i < len; i += 1) {
        let cRes = {};
        d = this.stack[i];

        if (typeof data === "function") {
            res = data.call(d, d.dataObj, i);
        }

        if (typeof config === "function") {
            cRes = config.call(d, d.dataObj, i);
        } else {
            const keys = Object.keys(config);

            for (let j = 0, lenJ = keys.length; j < lenJ; j += 1) {
                const key = keys[j];
                cRes[key] = config[key];
            }
        }

        coll.push(d.createEls(res, cRes));
    }

    const collection = new CollectionPrototype();
    collection.wrapper(coll);
    return collection;
}

function forEach(callBck) {
    for (let i = 0, len = this.stack.length; i < len; i += 1) {
        callBck.call(this.stack[i], this.stack[i].dataObj, i);
    }

    return this;
}

function setAttribute(key, value) {
    const setAttrHelper = (element, attrKey, attrValue, index) => {
        const resolvedValue = typeof attrValue === 'function' ? attrValue.call(element, element.dataObj, index) : attrValue;
        element.setAttr(attrKey, resolvedValue);
    };

    for (let i = 0, len = this.stack.length; i < len; i += 1) {
        let element = this.stack[i];
        if (arguments.length > 1) {
            setAttrHelper(element, key, value, i);
        } else if (typeof key === 'function') {
            element.setAttr(key.call(element, element.dataObj, i));
        } else if (typeof key === 'object' && key !== null) {
            Object.entries(key).forEach(([attrKey, attrValue]) => {
                setAttrHelper(element, attrKey, attrValue, i);
            });
        }
    }

    return this;
}

function setStyle(key, value) {
    const setStyleHelper = (element, styleKey, styleValue, index) => {
        const resolvedValue = typeof styleValue === 'function' ? styleValue.call(element, element.dataObj, index) : styleValue;
        element.setStyle(styleKey, resolvedValue);
    };

    for (let i = 0, len = this.stack.length; i < len; i += 1) {
        let element = this.stack[i];

        if (arguments.length > 1) {
          setStyleHelper(element, key, value, i);
        } else if (typeof key === 'function') {
          element.setStyle(key.call(element, element.dataObj, i));
        } else if (typeof key === 'object') {
          Object.entries(key).forEach(([styleKey, styleValue]) => {
            setStyleHelper(element, styleKey, styleValue, i);
          });
        }
    }

    return this;
}

function translate(value) {
    let d;

    for (let i = 0, len = this.stack.length; i < len; i += 1) {
        d = this.stack[i];

        if (typeof value === "function") {
            d.translate(value.call(d, d.dataObj, i));
        } else {
            d.translate(value);
        }
    }

    return this;
}

function rotate(value) {
    let d;

    for (let i = 0, len = this.stack.length; i < len; i += 1) {
        d = this.stack[i];

        if (typeof value === "function") {
            d.rotate(value.call(d, d.dataObj, i));
        } else {
            d.rotate(value);
        }
    }

    return this;
}

function scale(value) {
    let d;

    for (let i = 0, len = this.stack.length; i < len; i += 1) {
        d = this.stack[i];

        if (typeof value === "function") {
            d.scale(value.call(d, d.dataObj, i));
        } else {
            d.scale(value);
        }
    }

    return this;
}

function exec(value) {
    let d;

    if (typeof value !== "function") {
        return;
    }

    for (let i = 0, len = this.stack.length; i < len; i += 1) {
        d = this.stack[i];
        value.call(d, d.dataObj, i);
    }

    return this;
}

function on(eventType, hndlr) {
    for (let i = 0, len = this.stack.length; i < len; i += 1) {
        this.stack[i].on(eventType, hndlr);
    }

    return this;
} // function in (coOr) {
//   for (let i = 0, len = this.stack.length; i < len; i += 1) {
//     this.stack[i].in(coOr)
//   }
//   return this
// }

function remove() {
    for (let i = 0, len = this.stack.length; i < len; i += 1) {
        this.stack[i].remove();
    }

    return this;
}

function interrupt() {
    for (let i = 0, len = this.stack.length; i < len; i += 1) {
        this.stack[i].interrupt();
    }

    return this;
}

function resolveObject(config, node, i) {
    const obj = {};
    let key;

    for (key in config) {
        if (key !== "end") {
            if (typeof config[key] === "function") {
                obj[key] = config[key].call(node, node.dataObj, i);
            } else {
                obj[key] = config[key];
            }
        }
    }

    return obj;
}

const animateArrayTo = function animateArrayTo(config) {

    for (let i = 0; i < this.stack.length; i += 1) {
        let node = this.stack[i];
        let newConfig = resolveObject(config, node, i);

        if (config.attr && typeof config.attr !== "function") {
            newConfig.attr = resolveObject(config.attr, node, i);
        }

        if (config.style && typeof config.style !== "function") {
            newConfig.style = resolveObject(config.style, node, i);
        }

        if (config.end) newConfig.end = config.end;

        if (config.ease) newConfig.ease = config.ease;

        node.animateTo(newConfig);
    }

    return this;
};

const animateArrayExe = function animateArrayExe(config) {
    const exeArray = [];

    for (let i = 0; i < this.stack.length; i += 1) {
        let node = this.stack[i];
        let newConfig = resolveObject(config, node, i);

        if (config.attr && typeof config.attr !== "function") {
            newConfig.attr = resolveObject(config.attr, node, i);
        }

        if (config.style && typeof config.style !== "function") {
            newConfig.style = resolveObject(config.style, node, i);
        }

        if (config.end) newConfig.end = config.end;

        if (config.ease) newConfig.ease = config.ease;

        exeArray.push(node.animateExe(newConfig));
    }

    return exeArray;
};

const animatePathArrayTo = function animatePathArrayTo(config) {
    let node;
    const keys = Object.keys(config);

    for (let i = 0, len = this.stack.length; i < len; i += 1) {
        node = this.stack[i];
        const conf = {};

        for (let j = 0; j < keys.length; j++) {
            let value = config[keys[j]];

            if (typeof value === "function") {
                value = value.call(node, node.dataObj, i);
            }

            if (keys[j] === 'attr' && typeof config.attr !== "function") {
                value = resolveObject(config.attr, node, i);
            }

            if (keys[j] === 'style' && typeof config.style !== "function") {
                value = resolveObject(config.style, node, i);
            }

            conf[keys[j]] = value;
        }

        node.animatePathTo(conf);
    }

    return this;
};

const textArray = function textArray(value) {
    let node;

    if (typeof value !== "function") {
        for (let i = 0; i < this.stack.length; i += 1) {
            node = this.stack[i];
            node.text(value);
        }
    } else {
        for (let i = 0; i < this.stack.length; i += 1) {
            node = this.stack[i];
            node.text(value.call(node, node.dataObj, i));
        }
    }

    return this;
};

function CollectionPrototype(contextInfo, data, config, vDomIndex) {
    if (!data) {
        data = [];
    }

    let transform;
    let key;
    const attrKeys = config ? (config.attr ? Object.keys(config.attr) : []) : [];
    const styleKeys = config ? (config.style ? Object.keys(config.style) : []) : [];
    const bbox = config ? (config.bbox !== undefined ? config.bbox : true) : true;
    this.stack = data.map((d, i) => {
        const node = this.createNode(
            contextInfo.ctx,
            {
                el: config.el,
                bbox: bbox,
            },
            vDomIndex
        );

        for (let j = 0, len = styleKeys.length; j < len; j += 1) {
            key = styleKeys[j];

            if (typeof config.style[key] === "function") {
                const resValue = config.style[key].call(node, d, i);
                node.style[key] = resValue;
            } else {
                node.style[key] = config.style[key];
            }
        }

        for (let j = 0, len = attrKeys.length; j < len; j += 1) {
            key = attrKeys[j];

            if (key !== "transform") {
                if (typeof config.attr[key] === "function") {
                    const resValue = config.attr[key].call(node, d, i);
                    node.attr[key] = resValue;

                } else {
                    node.attr[key] = config.attr[key];
                }
            } else {
                if (typeof config.attr.transform === "function") {
                    transform = config.attr[key].call(node, d, i);
                } else {
                    ({ transform } = config.attr);
                }

                for (const trns in transform) {
                    node[trns](transform[trns]);
                }
            }
        }

        node.dataObj = d;
        return node;
    });
    return this;
}

CollectionPrototype.prototype = {
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
    interrupt,
    text: textArray,
    join,
    on,
};

CollectionPrototype.prototype.createNode = function () {};

CollectionPrototype.prototype.wrapper = function wrapper(nodes) {
    const self = this;

    if (nodes) {
        for (let i = 0, len = nodes.length; i < len; i++) {
            const node = nodes[i];
            self.stack.push(node);
        }
    }

    return this;
};

const layerResizeHandler = function (entries) {
    for (const key in entries) {
        const entry = entries[key];
        const cr = entry.contentRect;
        if (entry.target.resizeHandler) {
            entry.target.resizeHandler.forEach(function (exec) {
                exec(cr);
            });
        }
    }
};

function layerResizeBind(layer, handler) {
    if (!layer.ro) {
        layer.ro = new ResizeObserver(layerResizeHandler);
        layer.ro.observe(layer.container);
    }
    if (!layer.container.resizeHandler) {
        layer.container.resizeHandler = [];
    }
    layer.container.resizeHandler.push(handler);
}

function layerResizeUnBind(layer, handler) {
    if (!layer.container.resizeHandler) {
        return;
    }
    const execIndex = layer.container.resizeHandler.indexOf(handler);
    if (execIndex !== -1) {
        layer.container.resizeHandler.splice(execIndex, 1);
    }
    if (layer.container.resizeHandler.length === 0 && layer.ro) {
        layer.ro.disconnect();
    }
}

function prepArrayProxy(arr, context, BBoxUpdate) {
    const handlr = {
        get(target, prop) {
            if (prop === 'push') {
              return (...args) => {
                queueInstance.vDomChanged(context.vDomIndex);
                if (BBoxUpdate) {
                    context.BBoxUpdate = true;
                }
                return target.push(...args);
              };
            } else if (prop === 'pop') {
              return (...args) => {
                queueInstance.vDomChanged(context.vDomIndex);
                if (BBoxUpdate) {
                    context.BBoxUpdate = true;
                }
                return target.pop(...args);
              };
            } else {
              return target[prop];
            }
        },
        set(obj, prop, value) {
            obj[prop] = value;
            queueInstance.vDomChanged(context.vDomIndex);
            if (BBoxUpdate) {
                context.BBoxUpdate = true;
            }
            return true;
        },
        deleteProperty() {
            queueInstance.vDomChanged(context.vDomIndex);
            if (BBoxUpdate) {
                context.BBoxUpdate = true;
            }
            return Reflect.deleteProperty(...arguments);
        }
    };

    return new Proxy(arr || [], handlr);
}

export { NodePrototype, CollectionPrototype, layerResizeBind, layerResizeUnBind, prepArrayProxy };
