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
    if (event.keyCode === ENTER || event.keyCode === SPACE) {
      if (preventDefault) {
        event.preventDefault();
      }

      return handler(event);
    }
  };
};

export const handleEnter = (handler, preventDefault) => {
  return (event) => {
    if (event.keyCode === ENTER) {
      if (preventDefault) {
        event.preventDefault();
      }

      return handler(event);
    }
  };
};

export const handleDownArrow = (handler, preventDefault) => {
  return (event) => {
    if (event.keyCode === DOWN) {
      if (preventDefault) {
        event.preventDefault();
      }

      return handler(event);
    }
  };
};
