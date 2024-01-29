import {MODE_PANNING, MODE_ZOOMING, TOOL_AUTO, TOOL_NONE, TOOL_PAN, TOOL_ZOOM_IN, TOOL_ZOOM_OUT,} from '../constants';
import {getSVGPoint, setFocus} from './common';
import {autoPanIfNeeded, startPanning, stopPanning, updatePanning} from './pan';
import {startZooming, stopZooming, updateZooming, zoom} from './zoom';
import mapRange from '../utils/mapRange';

export function getMousePosition(event, ViewerDOM) {
  let {left, top} = ViewerDOM.getBoundingClientRect();
  let x = event.clientX - Math.round(left);
  let y = event.clientY - Math.round(top);
  return {x, y}
}

export function onMouseDown(event, ViewerDOM, tool, value, props, coords = null) {
  const {x, y} = coords || getMousePosition(event, ViewerDOM)

  let nextValue = value;

  switch (tool) {
    case TOOL_ZOOM_OUT:
      let SVGPoint = getSVGPoint(value, x, y);
      nextValue = zoom(value, SVGPoint.x, SVGPoint.y, 1 / props.scaleFactor, props);
      break;

    case TOOL_ZOOM_IN:
      nextValue = startZooming(value, x, y);
      break;

    case TOOL_AUTO:
    case TOOL_PAN:
      nextValue = startPanning(value, x, y);
      break;

    default:
      return value;
  }

  event.preventDefault();
  return nextValue;
}

export function onMouseMove(event, ViewerDOM, tool, value, props, coords = null) {
  const {x, y} = coords || getMousePosition(event, ViewerDOM)

  let forceExit = (event.buttons === 0); //the mouse exited and reentered into svg
  let nextValue = value;

  switch (tool) {
    case TOOL_ZOOM_IN:
      if (value.mode === MODE_ZOOMING)
        nextValue = forceExit ? stopZooming(value, x, y, props.scaleFactor, props) : updateZooming(value, x, y);
      break;

    case TOOL_AUTO:
    case TOOL_PAN:
      if (value.mode === MODE_PANNING)
        nextValue = forceExit ? stopPanning(value) : updatePanning(value, x, y, props.preventPanOutside ? 20 : undefined);
      break;

    default:
      return value;
  }

  event.preventDefault();
  return nextValue;
}

export function onMouseUp(event, ViewerDOM, tool, value, props, coords = null) {
  const {x, y} = coords || getMousePosition(event, ViewerDOM)

  let nextValue = value;

  switch (tool) {
    case TOOL_ZOOM_OUT:
      if (value.mode === MODE_ZOOMING)
        nextValue = stopZooming(value, x, y, 1 / props.scaleFactor, props);
      break;

    case TOOL_ZOOM_IN:
      if (value.mode === MODE_ZOOMING)
        nextValue = stopZooming(value, x, y, props.scaleFactor, props);
      break;

    case TOOL_AUTO:
    case TOOL_PAN:
      if (value.mode === MODE_PANNING)
        nextValue = stopPanning(value);
      break;

    default:
      return value;
  }

  event.preventDefault();
  return nextValue;
}

export function onDoubleClick(event, ViewerDOM, tool, value, props, coords = null) {
  const {x, y} = coords || getMousePosition(event, ViewerDOM)

  let nextValue = value;

  if (tool === TOOL_AUTO && !props.disableDoubleClickZoomWithToolAuto) {
    const {modifierKeys = []} = props;
    let SVGPoint = getSVGPoint(value, x, y);
    let modifierKeysReducer = (current, modifierKey) => current || event.getModifierState(modifierKey);
    let modifierKeyActive = modifierKeys.reduce(modifierKeysReducer, false);
    let scaleFactor = modifierKeyActive ? 1 / props.scaleFactor : props.scaleFactor;
    nextValue = zoom(value, SVGPoint.x, SVGPoint.y, scaleFactor, props);
  }

  event.preventDefault();
  return nextValue;
}

export function onWheel(event, ViewerDOM, tool, value, props, coords = null) {
  const {x, y} = coords || getMousePosition(event, ViewerDOM)

  if (!props.detectWheel) return value;

  const z = normalizeWheel(event)[2];
  const delta = z;
  const scaleFactor = mapRange(delta, -10, 10, props.scaleFactorOnWheel, 1 / props.scaleFactorOnWheel);


  let SVGPoint = getSVGPoint(value, x, y);
  let nextValue = zoom(value, SVGPoint.x, SVGPoint.y, scaleFactor, props);

  event.preventDefault();
  return nextValue;
}

export function onMouseEnterOrLeave(event, ViewerDOM, tool, value, props, coords = null) {
  let nextValue = setFocus(value, event.type === 'mouseenter');

  event.preventDefault();
  return nextValue;
}

export function onInterval(event, ViewerDOM, tool, value, props, coords = null) {
  let {x, y} = coords;

  if (!([TOOL_NONE, TOOL_AUTO].indexOf(tool) >= 0)) return value;
  if (!props.detectAutoPan) return value;
  if (!value.focus) return value;

  return autoPanIfNeeded(value, x, y);
}

// Reasonable defaults
const MAX_ZOOM_STEP = 10

// Adapted from https://stackoverflow.com/a/13650579
function normalizeWheel(event) {
  const { deltaY, deltaX } = event

  let deltaZ = 0

  const signY = Math.sign(event.deltaY)
  const absDeltaY = Math.abs(event.deltaY)

  let dy = deltaY

  if (absDeltaY > MAX_ZOOM_STEP) {
    dy = MAX_ZOOM_STEP * signY
  }

  deltaZ = dy

  return [deltaX, deltaY, deltaZ]
}
