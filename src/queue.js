(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define('queue', [], () => factory())
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory()
  } else {
    root.queue = factory()
  }
}(this, () => {
  let animatorInstance = null
  // const currentTime = Date.now()
  let tweens = []
  const vDoms = []
  let animeFrameId

  const onFrameExe = []

  window.requestAnimationFrame = (function requestAnimationFrameG () {
    return window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function requestAnimationFrame (callback, element) {
              return window.setTimeout(callback, 1000 / 60)
            }
  })()
  window.cancelAnimFrame = (function cancelAnimFrameG () {
    return (
      window.cancelAnimationFrame ||
            window.webkitCancelAnimationFrame ||
            window.mozCancelAnimationFrame ||
            window.oCancelAnimationFrame ||
            window.msCancelAnimationFrame ||
            function cancelAnimFrame (id) {
              return window.clearTimeout(id)
            }
    )
  })()

  function Tween (executable, ID, easying) {
    this.executable = executable
    this.ID = ID
    this.duration = executable.duration ? executable.duration : 0
    this.currTime = Date.now()
    this.lastTime = 0 - (executable.delay ? executable.delay : 0)
    this.loopTracker = 0
    this.loop = executable.loop ? executable.loop : 0
    this.direction = executable.direction
    this.easying = easying
    this.end = executable.end ? executable.end : null

    if (this.direction === 'reverse') { this.factor = 1 } else { this.factor = 0 }
  }

  Tween.prototype.execute = function execute (f) {
    this.executable.run(f)
  }

  Tween.prototype.resetCallBack = function resetCallBack (_) {
    if (typeof _ !== 'function') return
    this.callBack = _
  }

  function endExe (_) {
    this.endExe = _
    return this
  }

  function onRequestFrame (_) {
    // const self = this

    if (typeof _ !== 'function') {
      throw new Error('Wrong input')
    }

    onFrameExe.push(_)

    if (onFrameExe.length > 0 && !animeFrameId) {
      this.startAnimeFrames()
    }
  }
  function add (Id, executable, easying) {
    tweens[tweens.length] = new Tween(executable, Id, easying)
  }
  // var remove = function(id) {
  //     for(var i=0;i<tweens.length;i++){
  //         if (id === tweens[i].ID) {
  //             tweens.splice(i, 1)[0];
  //             break;
  //         }
  //     }
  //     return this;
  // };
  function startAnimeFrames () {
    if (!animeFrameId) {
      animeFrameId = window.requestAnimationFrame(exeFrameCaller)
    }
  }
  function stopAnimeFrame () {
    if (animeFrameId) {
      window.cancelAnimFrame(animeFrameId)
      animeFrameId = null
    }
  }

  function Animator () {
    this.vDoms = []
  }

  Animator.prototype = {
    startAnimeFrames,
    stopAnimeFrame,
    add,
    // remove: remove,
    end: endExe,
    onRequestFrame,
    destroy () {
      if (this.endExe) { this.endExe() }
      this.stopAnimeFrame()
    }
  }

  Animator.prototype.addVdom = function AaddVdom (_) {
    vDoms.push(_)
    return vDoms.length - 1
  }
  Animator.prototype.vDomChanged = function AvDomChanged (vDom) {
    vDoms[vDom].stateModified = true
  }
  Animator.prototype.execute = function Aexecute () {
    if (!animeFrameId) { animeFrameId = window.requestAnimationFrame(exeFrameCaller) }
  }

  let d
  let t
  function exeFrameCaller () {
    animeFrameId = window.requestAnimationFrame(exeFrameCaller)

    for (let i = 0; i < tweens.length; i += 1) {
      d = tweens[i]
      t = Date.now()
      d.lastTime += (t - d.currTime)
      d.currTime = t
      if (d.lastTime < d.duration && d.lastTime >= 0) {
        d.execute(Math.abs(d.factor - d.easying(d.lastTime, d.duration)))
      } else if (d.lastTime > d.duration) {
        d.execute(1 - d.factor)
        if (d.loopTracker >= d.loop - 1) {
          d.removed = true
        } else {
          d.loopTracker += 1
          d.lastTime = 0
          if (d.direction === 'alternate') { d.factor = 1 - d.factor } else if (d.direction === 'reverse') { d.factor = 1 } else { d.factor = 0 }
        }
      }
    }

    if (onFrameExe.length > 0) {
      for (let i = 0; i < onFrameExe.length; i += 1) {
        onFrameExe[i](t)
      }
    }

    const newTween = []
    for (let i = 0; i < tweens.length; i += 1) {
      if (!tweens[i].removed) { newTween[newTween.length] = tweens[i] } else if (typeof tweens[i].end === 'function') {
        tweens[i].end()
        tweens[i] = undefined
      }
    }
    tweens = newTween

    for (let i = 0; i < vDoms.length; i += 1) {
      if (vDoms[i].stateModified) {
        vDoms[i].execute()
        vDoms[i].stateModified = false
      }
    }

    return true
  }

  function animateQueue () {
    if (!animatorInstance) { animatorInstance = new Animator() }
    return animatorInstance
  }

  return animateQueue
}))
