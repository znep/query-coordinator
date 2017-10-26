import _ from 'lodash';
import $ from 'jquery';

function fireEvent(target, name, opts) {
  var evt = document.createEvent('HTMLEvents');
  evt.initEvent(name, true, true);
  evt.clientX = 0;
  evt.clientY = 0;
  if (opts) {
    $.extend(evt, opts);
  }
  if (!target) {
    throw new Error(
      'Cannot dispatchEvent on undefined target. name: {0}, opts: {1}'.
        format(name, opts)
    );
  }
  target.dispatchEvent(evt);
}

// D3 doesn't have a jQuery-like trigger. So if you want to simulate mouse events,
// we need to use real browser events.
function fireMouseEvent(elem, evtName, eventProps) {

  var evt = document.createEvent('MouseEvents');
  var params = _.extend(
    {
      type: evtName,
      canBubble: true,
      cancelable: true,
      view: window,
      detail: 0,
      screenX: 0,
      screenY: 0,
      clientX: 0,
      clientY: 0,
      ctrlKey: false,
      altKey: false,
      shiftKey: false,
      metaKey: false,
      button: 0,
      relatedTarget: null
    },
    eventProps
  );

  evt.initMouseEvent(
    params.type,
    params.canBubble,
    params.cancelable,
    params.view,
    params.detail,
    params.screenX,
    params.screenY,
    params.clientX,
    params.clientY,
    params.ctrlKey,
    params.altKey,
    params.shiftKey,
    params.metaKey,
    params.button,
    params.relatedTarget
  );

  elem.dispatchEvent(evt);
}

function fireKeyboardEvent(elem, evtName, eventProps) {

  var params = _.extend(
    {
      key: '',
      code: '',
      location: 0,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      repeat: false,
      isComposing: false,
      charCode: 0,
      keyCode: 0,
      which: 0
    },
    eventProps
  );

  var evt = new KeyboardEvent(evtName, params);

  elem.dispatchEvent(evt);
}

export default {
  fireEvent,
  fireMouseEvent,
  fireKeyboardEvent
};
