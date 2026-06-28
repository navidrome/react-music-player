import Lyric from '../../src/lyric'

const LRC = ['[00:19.38] L1', '[00:24.68] L2', '[00:30.11] L3'].join('\n')

describe('Lyric parser', () => {
  describe('update() drives position from an external clock', () => {
    it('clears the display before the first line', () => {
      const calls = []
      const p = new Lyric(LRC, (a) => calls.push(a))
      p.update(5000) // before first line at 19.38s
      expect(calls[calls.length - 1]).toEqual({ txt: '', lineNum: -1 })
    })

    it('shows the active line for the current time', () => {
      const calls = []
      const p = new Lyric(LRC, (a) => calls.push(a))
      p.update(26000) // between L2 (24.68s) and L3 (30.11s) -> L2 active
      expect(calls[calls.length - 1]).toEqual({ txt: 'L2', lineNum: 1 })
    })

    it('does not re-fire when the active line is unchanged', () => {
      const calls = []
      const p = new Lyric(LRC, (a) => calls.push(a))
      p.update(26000)
      const n = calls.length
      p.update(27000) // still within L2
      expect(calls.length).toBe(n)
    })

    it('re-selects the earlier line when seeking backward (no drift)', () => {
      const calls = []
      const p = new Lyric(LRC, (a) => calls.push(a))
      p.update(31000) // L3 active
      p.update(20000) // rewind -> L1 active
      expect(calls[calls.length - 1]).toEqual({ txt: 'L1', lineNum: 0 })
    })

    it('is a no-op when there are no lines', () => {
      const calls = []
      const p = new Lyric('', (a) => calls.push(a))
      p.update(5000)
      expect(calls).toHaveLength(0)
    })
  })

  describe('stop() halts the parser', () => {
    it('does not throw and leaves no pending timer', () => {
      const p = new Lyric(LRC)
      expect(() => p.stop()).not.toThrow()
    })
  })
})
