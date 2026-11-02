import React from 'react'
import { mount } from 'enzyme'
import { act } from 'react-dom/test-utils'
import Slider from 'rc-slider/lib/Slider'
import { PROGRESS_BAR_SLIDER_OPTIONS } from '../../src/config/slider'

describe('progress slider focus', () => {
  let container
  let wrapper
  let onChange
  let onBeforeChange
  let onAfterChange

  const handle = () => wrapper.find('[role="slider"]').getDOMNode()

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    onChange = jest.fn()
    onBeforeChange = jest.fn()
    onAfterChange = jest.fn()
    wrapper = mount(
      <Slider
        {...PROGRESS_BAR_SLIDER_OPTIONS}
        max={120}
        value={14}
        onChange={onChange}
        onBeforeChange={onBeforeChange}
        onAfterChange={onAfterChange}
      />,
      { attachTo: container },
    )
    wrapper.find('.rc-slider').getDOMNode().getBoundingClientRect = () => ({
      left: 0,
      width: 240,
    })
    wrapper.find('[role="slider"]').getDOMNode().getBoundingClientRect =
      () => ({
        left: Number(handle().getAttribute('aria-valuenow')) * 2 - 5,
        width: 10,
      })
  })

  afterEach(() => {
    wrapper.unmount()
    container.remove()
  })

  it('keeps the handle focusable without starting or committing a seek', () => {
    act(() => handle().focus())
    expect(document.activeElement).toBe(handle())
    expect(handle().getAttribute('tabindex')).toBe('0')
    expect(onBeforeChange).not.toHaveBeenCalled()
    expect(onChange).not.toHaveBeenCalled()
    act(() => handle().blur())
    expect(onAfterChange).not.toHaveBeenCalled()
  })

  it('does not seek from layout rounding when the handle gains focus', () => {
    handle().getBoundingClientRect = () => ({ left: 24.8, width: 10 })
    act(() => handle().focus())
    expect(onChange).not.toHaveBeenCalled()
    act(() => handle().blur())
    expect(onAfterChange).not.toHaveBeenCalled()
  })

  it('does not commit playback updates when focus leaves the handle', () => {
    act(() => handle().focus())
    wrapper.setProps({ value: 37 })
    act(() => handle().blur())
    expect(onChange).not.toHaveBeenCalled()
    expect(onAfterChange).not.toHaveBeenCalled()
  })

  it('does not seek across repeated window focus restoration', () => {
    for (let value = 15; value < 20; value += 1) {
      act(() => handle().focus())
      wrapper.setProps({ value })
      act(() => handle().blur())
    }
    expect(onChange).not.toHaveBeenCalled()
    expect(onAfterChange).not.toHaveBeenCalled()
  })

  it.each([
    [39, 15],
    [37, 13],
    [36, 0],
    [35, 120],
  ])('preserves keyboard seeking for key %s', (keyCode, value) => {
    act(() => handle().focus())
    wrapper.find('[role="slider"]').simulate('keyDown', { keyCode })
    expect(onChange).toHaveBeenCalledWith(value)
    expect(onAfterChange).toHaveBeenCalledTimes(1)
    expect(onAfterChange).toHaveBeenCalledWith(value)
    onAfterChange.mockClear()
    act(() => handle().blur())
    expect(onAfterChange).not.toHaveBeenCalled()
  })

  it('preserves mouse seeking and does not commit again on blur', () => {
    wrapper.find('.rc-slider').simulate('mouseDown', {
      button: 0,
      clientX: 120,
      pageX: 120,
    })
    wrapper.setProps({ value: 60 })
    act(() => {
      document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
    })
    expect(onChange).toHaveBeenCalledWith(60)
    expect(onAfterChange).toHaveBeenCalledWith(60)
    onAfterChange.mockClear()
    act(() => handle().focus())
    act(() => handle().blur())
    expect(onAfterChange).not.toHaveBeenCalled()
  })

  it('preserves touch seeking', () => {
    wrapper.find('.rc-slider').simulate('touchStart', {
      touches: [{ pageX: 120 }],
    })
    expect(onChange).toHaveBeenCalledWith(60)
    wrapper.setProps({ value: 60 })
    act(() => {
      document.dispatchEvent(new Event('touchend', { bubbles: true }))
    })
    expect(onAfterChange).toHaveBeenCalledTimes(1)
    expect(onAfterChange).toHaveBeenCalledWith(60)
  })

  it('still commits a real drag interrupted by loss of focus', () => {
    act(() => handle().focus())
    wrapper.find('.rc-slider').simulate('mouseDown', {
      button: 0,
      pageX: 120,
    })
    wrapper.setProps({ value: 60 })
    act(() => handle().blur())
    expect(onAfterChange).toHaveBeenCalledTimes(1)
    expect(onAfterChange).toHaveBeenCalledWith(60)
  })
})
