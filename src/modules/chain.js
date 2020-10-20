/* eslint-disable no-undef */
// import { queue, ease } from './'
import queue from "./queue.js";
import ease from "./ease.js";

let Id = 0;
let chainId = 0;

function generateRendererId() {
    Id += 1;
    return Id;
}

function generateChainId() {
    chainId += 1;
    return chainId;
}

const easying = ease;

function easeDef(type) {
    this.easying = easying(type);
    this.transition = type;
    return this;
}

function duration(value) {
    if (arguments.length !== 1) {
        throw new Error("arguments mis match");
    }

    this.durationP = value;
    return this;
}

function loopValue(value) {
    if (arguments.length !== 1) {
        throw new Error("arguments mis match");
    }

    this.loopValue = value;
    return this;
}

function direction(value) {
    if (arguments.length !== 1) {
        throw new Error("arguments mis match");
    }

    this.directionV = value;
    return this;
}

function bind(value) {
    if (arguments.length !== 1) {
        throw new Error("arguments mis match");
    }

    this.data = value;

    if (this.data.nodeName === "CANVAS") {
        this.canvasStack = [];
    }

    return this;
}

function callbckExe(exe) {
    if (typeof exe !== "function") {
        return null;
    }

    this.callbckExe = exe;
    return this;
}

function reset(value) {
    this.resetV = value;
    return this;
}

function child(exe) {
    this.end = exe;
    return this;
}

function end(exe) {
    this.endExe = exe;
    return this;
}

function commit() {
    this.start();
}

function SequenceGroup() {
    this.queue = queue;
    this.sequenceQueue = [];
    this.lengthV = 0;
    this.currPos = 0;
    this.ID = generateRendererId();
    this.loopCounter = 0;
}

SequenceGroup.prototype = {
    duration,
    loop: loopValue,
    callbck: callbckExe,
    bind,
    child,
    ease: easeDef,
    end,
    commit,
    reset,
    direction,
};

SequenceGroup.prototype.add = function SGadd(value) {
    const self = this;

    if (!Array.isArray(value) && typeof value !== "function") {
        value = [value];
    }

    if (Array.isArray(value)) {
        value.map((d) => {
            self.lengthV += d.length ? d.length : 0;
            return d;
        });
    }

    this.sequenceQueue = this.sequenceQueue.concat(value);
    return this;
};

SequenceGroup.prototype.easyingGlobal = function SGeasyingGlobal(completedTime, durationV) {
    return completedTime / durationV;
};

SequenceGroup.prototype.start = function SGstart() {
    const self = this;

    if (self.directionV === "alternate") {
        self.factor = self.factor ? -1 * self.factor : 1;
        self.currPos = self.factor < 0 ? this.sequenceQueue.length - 1 : 0;
    } else if (self.directionV === "reverse") {
        for (let i = 0; i < this.sequenceQueue.length; i += 1) {
            const currObj = this.sequenceQueue[i];

            if (!(currObj instanceof SequenceGroup) && !(currObj instanceof ParallelGroup)) {
                currObj.run(1);
            }

            self.currPos = i;
        }

        self.factor = -1;
    } else {
        self.currPos = 0;
        self.factor = 1;
    }

    this.execute();
};

SequenceGroup.prototype.execute = function SGexecute() {
    const self = this;
    let currObj = this.sequenceQueue[self.currPos];
    currObj = typeof currObj === "function" ? currObj() : currObj;

    if (!currObj) {
        return;
    }

    if (currObj instanceof SequenceGroup || currObj instanceof ParallelGroup) {
        currObj.end(self.triggerEnd.bind(self, currObj)).commit();
    } else {
        this.currObj = currObj; // currObj.durationP = tValue

        this.queue.add(
            generateChainId(),
            {
                run(f) {
                    currObj.run(f);
                },
                target: currObj.target,
                delay: currObj.delay !== undefined ? currObj.delay : 0,
                duration: currObj.duration !== undefined ? currObj.duration : self.durationP,
                loop: currObj.loop ? currObj.loop : 1,
                direction: self.factor < 0 ? "reverse" : "default",
                end: self.triggerEnd.bind(self, currObj),
            },
            (c, v) => c / v
        );
    }

    return this;
};

SequenceGroup.prototype.triggerEnd = function SGtriggerEnd(currObj) {
    const self = this;
    self.currPos += self.factor;

    if (currObj.end) {
        self.triggerChild(currObj);
    }

    if (self.sequenceQueue.length === self.currPos || self.currPos < 0) {
        if (self.endExe) {
            self.endExe();
        } // if (self.end) { self.triggerChild(self) }

        self.loopCounter += 1;

        if (self.loopCounter < self.loopValue) {
            self.start();
        }

        return;
    }

    this.execute();
};

SequenceGroup.prototype.triggerChild = function SGtriggerChild(currObj) {
    if (currObj.end instanceof ParallelGroup || currObj.end instanceof SequenceGroup) {
        setTimeout(() => {
            currObj.end.commit();
        }, 0);
    } else {
        currObj.end(); // setTimeout(() => {
        //   currObj.childExe.start()
        // }, 0)
    }
};

function ParallelGroup() {
    this.queue = queue;
    this.group = [];
    this.currPos = 0; // this.lengthV = 0

    this.ID = generateRendererId();
    this.loopCounter = 1; // this.transition = 'linear'
}

ParallelGroup.prototype = {
    duration,
    loop: loopValue,
    callbck: callbckExe,
    bind,
    child,
    ease: easeDef,
    end,
    commit,
    direction,
};

ParallelGroup.prototype.add = function PGadd(value) {
    const self = this;

    if (!Array.isArray(value)) {
        value = [value];
    }

    this.group = this.group.concat(value);
    this.group.forEach((d) => {
        d.durationP = d.durationP ? d.durationP : self.durationP;
    });
    return this;
};

ParallelGroup.prototype.execute = function PGexecute() {
    const self = this;
    self.currPos = 0;

    for (let i = 0, len = self.group.length; i < len; i++) {
        const currObj = self.group[i];

        if (currObj instanceof SequenceGroup || currObj instanceof ParallelGroup) {
            currObj // .duration(currObj.durationP ? currObj.durationP : self.durationP)
                .end(self.triggerEnd.bind(self, currObj))
                .commit();
        } else {
            self.queue.add(
                generateChainId(),
                {
                    run(f) {
                        currObj.run(f);
                    },
                    target: currObj.target,
                    delay: currObj.delay !== undefined ? currObj.delay : 0,
                    duration: currObj.duration !== undefined ? currObj.duration : self.durationP,
                    loop: currObj.loop ? currObj.loop : 1,
                    direction: currObj.direction ? currObj.direction : "default",
                    // self.factor < 0 ? 'reverse' : 'default',
                    end: self.triggerEnd.bind(self, currObj),
                },
                currObj.ease ? easying(currObj.ease) : self.easying
            );
        }
    }

    return self;
};

ParallelGroup.prototype.start = function PGstart() {
    const self = this;

    if (self.directionV === "alternate") {
        self.factor = self.factor ? -1 * self.factor : 1;
    } else if (self.directionV === "reverse") {
        self.factor = -1;
    } else {
        self.factor = 1;
    }

    this.execute();
};

ParallelGroup.prototype.triggerEnd = function PGtriggerEnd(currObj) {
    const self = this; // Call child transition wen Entire parallelChain transition completes

    this.currPos += 1;

    if (currObj.end) {
        this.triggerChild(currObj.end);
    }

    if (this.currPos === this.group.length) {
        // Call child transition wen Entire parallelChain transition completes
        if (this.endExe) {
            this.triggerChild(this.endExe);
        } // if (this.end) { this.triggerChild(this.end) }

        self.loopCounter += 1;

        if (self.loopCounter < self.loopValue) {
            self.start();
        }
    }
};

ParallelGroup.prototype.triggerChild = function PGtriggerChild(exe) {
    if (exe instanceof ParallelGroup || exe instanceof SequenceGroup) {
        exe.commit();
    } else if (typeof exe === "function") {
        exe();
    } else {
        console.log("wrong type");
    }
};

function sequenceChain() {
    return new SequenceGroup();
}

function parallelChain() {
    return new ParallelGroup();
}

export default {
    sequenceChain,
    parallelChain,
};
