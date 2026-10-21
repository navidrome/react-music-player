import { cloneElement } from 'react'
import Slider from 'rc-slider/lib/Slider'

// rc-slider starts a drag on focus and commits it on blur. For a moving
// playback position, switching windows would therefore seek to a rounded time.
// Keep native focus and keyboard controls, but do not start a drag on focus.
const renderProgressHandle = (props) => {
  const handle = Slider.defaultProps.handle(props)
  return (
    handle &&
    cloneElement(handle, { onFocus: (event) => event.stopPropagation() })
  )
}

export const PROGRESS_BAR_SLIDER_OPTIONS = {
  min: 0,
  step: 1,
  handle: renderProgressHandle,
}

export const VOLUME_BAR_SLIDER_OPTIONS = {
  min: 0,
  max: 1,
  step: 0.01,
}
