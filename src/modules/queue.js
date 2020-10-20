/* eslint-disable no-undef */
let animatorInstance = null;
let tweens = [];
const vDoms = {};
const vDomIds = [];
let animeFrameId;
let onFrameExe = [];

if (typeof window === "undefined") {
    global.window = {
        setTimeout: setTimeout,
        clearTimeout: clearTimeout,
    };
    global.performance = {
        now: function () {
            return Date.now();
        },
    };
    global.document = {};
}
window.requestAnimationFrame = (function requestAnimationFrameG() {
    return (
        window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function requestAnimationFrame(callback, element) {
            return window.setTimeout(callback, 1000 / 60);
        }
    );
})();

window.cancelAnimFrame = (function cancelAnimFrameG() {
    return (
        window.cancelAnimationFrame ||
        window.webkitCancelAnimationFrame ||
        window.mozCancelAnimationFrame ||
        window.oCancelAnimationFrame ||
        window.msCancelAnimationFrame ||
        function cancelAnimFrame(id) {
            return window.clearTimeout(id);
        }
    );
})();

function Tween(Id, executable, easying) {
    this.executable = executable;
    this.duration = executable.duration ? executable.duration : 0;
    this.delay = executable.delay ? executable.delay : 0;
    this.lastTime = 0 - (executable.delay ? executable.delay : 0);
    this.loopTracker = 0;
    this.loop = executable.loop ? executable.loop : 0;
    this.direction = executable.direction;
    this.easying = easying;
    this.end = executable.end ? executable.end : null;

    if (this.direction === "reverse") {
        this.factor = 1;
    } else {
        this.factor = 0;
    }
}

Tween.prototype.execute = function execute(f) {
    this.executable.run(f);
};

Tween.prototype.resetCallBack = function resetCallBack(_) {
    if (typeof _ !== "function") return;
    this.callBack = _;
}; // function endExe (_) {
//   this.endExe = _
//   return this
// }

function onRequestFrame(_) {
    if (typeof _ !== "function") {
        throw new Error("Wrong input");
    }

    onFrameExe.push(_);

    if (onFrameExe.length > 0 && !animeFrameId) {
        this.startAnimeFrames();
    }
}

function removeRequestFrameCall(_) {
    if (typeof _ !== "function") {
        throw new Error("Wrong input");
    }

    const index = onFrameExe.indexOf(_);

    if (index !== -1) {
        onFrameExe.splice(index, 1);
    }
}

function add(uId, executable, easying) {
    const exeObj = new Tween(uId, executable, easying);
    exeObj.currTime = performance.now();
    if (executable.target) {
        if (!executable.target.animList) {
            executable.target.animList = [];
        }
        executable.target.animList[executable.target.animList.length] = exeObj;
    }
    tweens[tweens.length] = exeObj;
    this.startAnimeFrames();
}

function remove(exeObj) {
    const index = tweens.indexOf(exeObj);
    if (index !== -1) {
        tweens.splice(index, 1);
    }
}

function startAnimeFrames() {
    if (!animeFrameId) {
        animeFrameId = window.requestAnimationFrame(exeFrameCaller);
    }
}

function stopAnimeFrame() {
    if (animeFrameId) {
        window.cancelAnimFrame(animeFrameId);
        animeFrameId = null;
    }
}

function ExeQueue() {}

ExeQueue.prototype = {
    startAnimeFrames,
    stopAnimeFrame,
    add,
    remove: remove,
    // end: endExe,
    onRequestFrame,
    removeRequestFrameCall,
    clearAll: function () {
        tweens = [];
        onFrameExe = []; // if (this.endExe) { this.endExe() }
        // this.stopAnimeFrame()
    },
};

ExeQueue.prototype.addVdom = function AaddVdom(_) {
    const ind = vDomIds.length + 1;
    vDoms[ind] = _;
    vDomIds.push(ind);
    this.startAnimeFrames();
    return ind;
};

ExeQueue.prototype.removeVdom = function removeVdom(_) {
    const index = vDomIds.indexOf(_);

    if (index !== -1) {
        vDomIds.splice(index, 1);
        vDoms[_].root.destroy();
        delete vDoms[_];
    }

    if (vDomIds.length === 0 && tweens.length === 0 && onFrameExe.length === 0) {
        this.stopAnimeFrame();
    }
};

ExeQueue.prototype.vDomChanged = function AvDomChanged(vDom) {
    if (vDoms[vDom] && vDoms[vDom].stateModified !== undefined) {
        vDoms[vDom].stateModified = true;
        vDoms[vDom].root.stateModified = true;
    } else if (typeof vDom === "string") {
        const ids = vDom.split(":");
        if (vDoms[ids[0]] && vDoms[ids[0]].stateModified !== undefined) {
            vDoms[ids[0]].stateModified = true;
            vDoms[ids[0]].root.stateModified = true;
            const childRootNode = vDoms[ids[0]].root.fetchEl("#" + ids[1]);
            if (childRootNode) {
                childRootNode.stateModified = true;
            }
        }
    }
};

ExeQueue.prototype.execute = function Aexecute() {
    this.startAnimeFrames();
};

ExeQueue.prototype.vDomUpdates = function () {
    for (let i = 0, len = vDomIds.length; i < len; i += 1) {
        if (vDomIds[i] && vDoms[vDomIds[i]] && vDoms[vDomIds[i]].stateModified) {
            vDoms[vDomIds[i]].execute();
            vDoms[vDomIds[i]].stateModified = false;
            // vDoms[vDomIds[i]].onchange();
        } else if (
            vDomIds[i] &&
            vDoms[vDomIds[i]] &&
            vDoms[vDomIds[i]].root &&
            vDoms[vDomIds[i]].root.ENV !== "NODE"
        ) {
            var elementExists = document.getElementById(vDoms[vDomIds[i]].root.container.id);

            if (!elementExists) {
                this.removeVdom(vDomIds[i]);
            }
        }
    }
};

let d;
let t;
const abs = Math.abs;
let counter = 0;
let tweensN = [];

function exeFrameCaller() {
    try {
        tweensN = [];
        counter = 0;
        t = performance.now();

        for (let i = 0; i < tweens.length; i += 1) {
            d = tweens[i];
            d.lastTime += t - d.currTime;
            d.currTime = t;

            if (d.lastTime < d.duration && d.lastTime >= 0) {
                d.execute(abs(d.factor - d.easying(d.lastTime, d.duration)));
                tweensN[counter++] = d;
            } else if (d.lastTime > d.duration) {
                loopCheck(d);
            } else {
                tweensN[counter++] = d;
            }
        }

        tweens = tweensN;

        if (onFrameExe.length > 0) {
            onFrameExeFun();
        }

        animatorInstance.vDomUpdates();
    } catch (err) {
        console.error(err);
    } finally {
        animeFrameId = window.requestAnimationFrame(exeFrameCaller);
    }
}

function loopCheck(d) {
    if (d.loopTracker >= d.loop - 1) {
        d.execute(1 - d.factor);
        if (d.end) {
            d.end();
        }
        if (d.executable.target) {
            const animList = d.executable.target.animList;
            if (animList && animList.length > 0) {
                if (animList.length === 1) {
                    d.executable.target.animList = [];
                } else if (animList.length > 1) {
                    const index = animList.indexOf(d);
                    if (index !== -1) {
                        animList.splice(index, 1);
                    }
                }
            }
        }
    } else {
        d.loopTracker += 1;
        d.lastTime = d.lastTime - d.duration;

        if (d.direction === "alternate") {
            d.factor = 1 - d.factor;
        } else if (d.direction === "reverse") {
            d.factor = 1;
        } else {
            d.factor = 0;
        }

        d.execute(abs(d.factor - d.easying(d.lastTime, d.duration)));
        tweensN[counter++] = d;
    }
}

function onFrameExeFun() {
    for (let i = 0; i < onFrameExe.length; i += 1) {
        onFrameExe[i](t);
    }
}

animatorInstance = new ExeQueue();

export default animatorInstance; // default function animateQueue () {
//   if (!animatorInstance) { animatorInstance = new ExeQueue() }
//   return animatorInstance
// }
