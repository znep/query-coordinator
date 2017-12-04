// WARNING: keyCode is _DEPRECATED_ and appears to have spotty React support.
// See https://socrata.atlassian.net/browse/EN-20529 and
// https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/keyCode
//
// Consider using KeyboardEvent.key or KeyboardEvent.code, as suggested by Mozilla.
import { DOWN, ENTER, SPACE } from './keycodes_deprecated';

// Checks if event is a space or an enter
export const handleKeyPress = (handler, preventDefault) => {
  return (event) => {
    // Enter or Space key code
    if (event.keyCode === ENTER || event.keyCode === SPACE || event.key === 'Enter' || event.key === ' ') {
      if (preventDefault) {
        event.preventDefault();
      }

      return handler(event);
    }
  };
};

export const handleEnter = (handler, preventDefault) => {
  return (event) => {
    if (event.keyCode === ENTER || event.key === 'Enter') {
      if (preventDefault) {
        event.preventDefault();
      }

      return handler(event);
    }
  };
};

export const handleDownArrow = (handler, preventDefault) => {
  return (event) => {
    // See https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/8860571/
    if (event.keyCode === DOWN || event.key === 'ArrowDown' || event.key === 'Down') {
      if (preventDefault) {
        event.preventDefault();
      }

      return handler(event);
    }
  };
};
