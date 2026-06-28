// use by https://github.com/ustbhuangyi/lyric-parser

const timeExp = /\[(\d{2,}):(\d{2})(?:\.(\d{2,3}))?]/g

const STATE_PAUSE = 0
const STATE_PLAYING = 1

const tagRegMap = {
  title: 'ti',
  artist: 'ar',
  album: 'al',
  offset: 'offset',
  by: 'by',
}

export default class Lyric {
  constructor(lrc, handler = () => {}) {
    this.lrc = lrc
    this.tags = {}
    this.lines = []
    this.handler = handler
    this.state = STATE_PAUSE
    this.curLine = 0
    // Sentinel distinct from -1 so the first update() always emits.
    this._lastActive = -2

    this._init()
  }

  _init() {
    this._initTag()

    this._initLines()
  }

  _initTag() {
    for (const tag in tagRegMap) {
      const matches = this.lrc.match(
        new RegExp(`\\[${tagRegMap[tag]}:([^\\]]*)]`, 'i'),
      )
      this.tags[tag] = (matches && matches[1]) || ''
    }
  }

  _initLines() {
    const lines = this.lrc.split('\n')
    const offset = parseInt(this.tags.offset, 10) || 0
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const result = timeExp.exec(line)
      if (result) {
        const txt = line.replace(timeExp, '').trim()
        if (txt) {
          this.lines.push({
            time:
              result[1] * 60 * 1000 +
              result[2] * 1000 +
              (result[3] || 0) * 10 +
              offset,
            txt,
          })
        }
      }
    }

    this.lines.sort((a, b) => {
      return a.time - b.time
    })
  }

  _findCurNum(time) {
    for (let i = 0; i < this.lines.length; i++) {
      if (time <= this.lines[i].time) {
        return i
      }
    }
    return this.lines.length - 1
  }

  _callHandler(i) {
    if (i < 0) {
      return
    }
    this.handler({
      txt: this.lines[i].txt,
      lineNum: i,
    })
  }

  _playRest() {
    const line = this.lines[this.curNum]
    const delay = line.time - (+new Date() - this.startStamp)

    this.timer = setTimeout(() => {
      this._callHandler(this.curNum++)
      if (this.curNum < this.lines.length && this.state === STATE_PLAYING) {
        this._playRest()
      }
    }, delay)
  }

  play(startTime = 0, skipLast) {
    if (!this.lines.length) {
      return
    }
    this.state = STATE_PLAYING

    this.curNum = this._findCurNum(startTime)
    this.startStamp = +new Date() - startTime

    if (!skipLast) {
      this._callHandler(this.curNum - 1)
    }

    if (this.curNum < this.lines.length) {
      clearTimeout(this.timer)
      this._playRest()
    }
  }

  togglePlay() {
    const now = +new Date()
    if (this.state === STATE_PLAYING) {
      this.stop()
      this.pauseStamp = now
    } else {
      this.state = STATE_PLAYING
      this.play((this.pauseStamp || now) - (this.startStamp || now), true)
      this.pauseStamp = 0
    }
  }

  stop() {
    this.state = STATE_PAUSE
    clearTimeout(this.timer)
  }

  seek(offset) {
    this.play(offset)
  }

  // Position the lyric purely from an externally supplied time (the audio
  // element's real currentTime), independent of any setTimeout clock. Called on
  // every timeupdate so the display self-corrects after seeks and buffering.
  // Emits an empty line before the first lyric so stale text is never left on
  // screen. Only fires the handler when the active line actually changes.
  update(timeMs) {
    if (!this.lines.length) {
      return
    }
    let lo = 0
    let hi = this.lines.length - 1
    let active = -1
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2)
      if (this.lines[mid].time <= timeMs) {
        active = mid
        lo = mid + 1
      } else {
        hi = mid - 1
      }
    }
    if (active === this._lastActive) {
      return
    }
    this._lastActive = active
    if (active < 0) {
      this.handler({ txt: '', lineNum: -1 })
    } else {
      this.handler({ txt: this.lines[active].txt, lineNum: active })
    }
  }
}
