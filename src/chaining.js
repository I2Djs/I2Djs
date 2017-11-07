(function chain (root, factory) {
  const i2d = root
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./easing.js'), require('./queue.js'))
  } else if (typeof define === 'function' && define.amd) {
    define('chain', ['./easing.js', './queue.js'], (easing, queue) => factory(easing, queue))
  } else {
    i2d.chain = factory(root.easing, root.queue)
  }
}(this, (easing, queue) => {
  let Id = 0
  let chainId = 0

  function generateRendererId () {
    Id += 1
    return Id
  }

  function generateChainId () {
    chainId += 1
    return chainId
  }

  const easying = easing()

  function transitionType (type) {
    this.easying = easying(type)
    this.transition = type
    return this
  }
  function duration (value) {
    if (arguments.length !== 1) { throw new Error('arguments mis match') }
    this.durationP = value
    return this
  }
  function loopValue (value) {
    if (arguments.length !== 1) { throw new Error('arguments mis match') }
    this.loopValue = value
    return this
  }
  function direction (value) {
    if (arguments.length !== 1) { throw new Error('arguments mis match') }
    this.directionV = value
    return this
  }

  function bind (value) {
    if (arguments.length !== 1) { throw new Error('arguments mis match') }
    this.data = value

    if (this.data.nodeName === 'CANVAS') { this.canvasStack = [] }

    return this
  }
  function callbckExe (exe) {
    if (typeof exe !== 'function') { return null }
    this.callbckExe = exe
    return this
  }
  function reset (value) {
    this.resetV = value
    return this
  }
  function child (exe) {
    this.childExe = exe
    return this
  }

  function end (exe) {
    this.endExe = exe
    return this
  }

  function commit () {
    this.start()
  }

  function SequenceGroup () {
    this.queue = queue()
    this.sequenceQueue = []
    this.lengthV = 0
    this.currPos = 0
    this.ID = generateRendererId()
    this.loopCounter = 1
    // this.factor = 1;
    // this.direction = 'alternate';
    // this.completedTime = 0;
    // this.percentCompletion = 0;
    // this.previousFactor = 0;
    // this.previousLocalFactor = 0;
    // this.cumilativeLength = 0;
  }

  SequenceGroup.prototype = {
    duration,
    loop: loopValue,
    callbck: callbckExe,
    bind,
    child,
    transitionType,
    end,
    commit,
    reset,
    direction
  }

  SequenceGroup.prototype.add = function SGadd (value) {
    const self = this

    if (!Array.isArray(value)) {
      value = [value]
    }
    value.map((d) => {
      self.lengthV += d.length
      return d
    })
    this.sequenceQueue = this.sequenceQueue.concat(value)

    return this
  }

  SequenceGroup.prototype.easyingGlobal = function SGeasyingGlobal (completedTime, durationV) {
    return completedTime / durationV
  }

  SequenceGroup.prototype.start = function SGstart () {
    const self = this
    if (self.directionV === 'alternate') {
      self.factor = self.factor ? -1 * self.factor : 1
      self.currPos = self.factor < 0 ? this.sequenceQueue.length - 1 : 0
    } else if (self.directionV === 'reverse') {
      for (let i = 0; i < this.sequenceQueue.length; i += 1) {
        const currObj = this.sequenceQueue[i]
        if (!(currObj instanceof SequenceGroup) && !(currObj instanceof ParallelGroup)) {
          currObj.run(1)
        }
        self.currPos = i
      }
      self.factor = -1
    } else {
      self.currPos = 0
      self.factor = 1
    }
    this.execute()
  }

  SequenceGroup.prototype.execute = function SGexecute () {
    const self = this
    const currObj = this.sequenceQueue[self.currPos]

    if (!currObj) { return }
    if (currObj instanceof SequenceGroup || currObj instanceof ParallelGroup) {
      currObj.duration(currObj.durationP ? currObj.durationP
        : (currObj.length / self.lengthV) * self.durationP)
      currObj.end(self.triggerEnd.bind(self, currObj)).commit()
    } else {
      const tValue = currObj.durationP ? currObj.durationP
        : ((currObj.length / self.lengthV) * self.durationP)
      // const data_ = currObj.data ? currObj.data : self.data

      this.currObj = currObj
      currObj.durationP = tValue
      this.queue.add(generateChainId(), {
        run (f) {
          currObj.run(f)
        },
        duration: tValue,
        // ,
        // loop: self.loopValue,
        direction: self.factor < 0 ? 'reverse' : 'default',
        end: self.triggerEnd.bind(self, currObj)
      }, (c, v) =>
        c / v)
    }
    return this
  }

  SequenceGroup.prototype.triggerEnd = function SGtriggerEnd (currObj) {
    const self = this
    self.currPos += self.factor
    if (currObj.childExe) {
      self.triggerChild(currObj)
    }
    if (self.sequenceQueue.length === self.currPos || self.currPos < 0) {
      if (self.endExe) { self.endExe() }
      if (self.childExe) { self.triggerChild(self) }

      self.loopCounter += 1
      if (self.loopCounter < self.loopValue) {
        self.start()
      }
      return
    }

    this.execute()
  }

  SequenceGroup.prototype.triggerChild = function SGtriggerChild (currObj) {
    if (currObj.childExe instanceof ParallelGroup || currObj.childExe instanceof SequenceGroup) {
      setTimeout(() => {
        currObj.childExe.commit()
      }, 0)
    } else {
      setTimeout(() => {
        currObj.childExe.start()
      }, 0)
    }
  }

  function ParallelGroup () {
    this.queue = queue()
    this.group = []
    this.currPos = 0
    this.lengthV = 0
    this.ID = generateRendererId()
    this.loopCounter = 1
    // this.transition = 'linear'
  }

  ParallelGroup.prototype = {
    duration,
    loop: loopValue,
    callbck: callbckExe,
    bind,
    child,
    transitionType,
    end,
    commit,
    direction
  }

  ParallelGroup.prototype.add = function PGadd (value) {
    const self = this

    if (!Array.isArray(value)) { value = [value] }

    value.map((d) => {
      self.lengthV += d.lengthV
      return d
    })

    this.group = this.group.concat(value)

    this.group.forEach((d) => {
      d.durationP = d.durationP ? d.durationP : self.durationP
      // d.easying = self.easying;
    })

    return this
  }

  ParallelGroup.prototype.execute = function PGexecute () {
    const self = this

    self.currPos = 0
    self.group.forEach((d, i) => {
      const currObj = d

      if (currObj instanceof SequenceGroup || currObj instanceof ParallelGroup) {
        currObj
          .duration(currObj.durationP ? currObj.durationP : self.durationP)
          .end(self.triggerEnd.bind(self, currObj)).commit()
      } else {
        self.queue.add(generateChainId(), {
          run (f) {
            d.run(f)
          },
          duration: self.durationP,
          loop: 1,
          direction: self.factor < 0 ? 'reverse' : 'default',
          end: self.triggerEnd.bind(self, currObj)
        }, self.easying)
      }
    })

    return self
  }

  ParallelGroup.prototype.start = function PGstart () {
    const self = this
    if (self.directionV === 'alternate') {
      self.factor = self.factor ? -1 * self.factor : 1
    } else if (self.directionV === 'reverse') {
      self.factor = -1
    } else {
      self.factor = 1
    }

    this.execute()
  }

  ParallelGroup.prototype.triggerEnd = function PGtriggerEnd (currObj) {
    const self = this
    // Call child transition wen Entire parallelChain transition completes
    this.currPos += 1

    if (currObj.childExe) {
      this.triggerChild(currObj)
    }
    if (this.currPos === this.group.length) {
      // Call child transition wen Entire parallelChain transition completes
      if (this.endExe) { this.endExe() }
      if (this.childExe) { this.triggerChild(this) }

      self.loopCounter += 1
      if (self.loopCounter < self.loopValue) {
        self.start()
      }
    }
  }

  ParallelGroup.prototype.triggerChild = function PGtriggerChild (currObj) {
    if (currObj.childExe instanceof ParallelGroup || currObj.childExe instanceof SequenceGroup) {
      setTimeout(() => {
        currObj.childExe.commit()
      }, 0)
    } else {
      setTimeout(() => {
        currObj.childExe.start()
      }, 0)
    }
  }

  const chain = {}

  chain.sequenceChain = function sequenceChain () {
    return new SequenceGroup()
  }
  chain.parallelChain = function parallelChain () {
    return new ParallelGroup()
  }

  return chain
}))
