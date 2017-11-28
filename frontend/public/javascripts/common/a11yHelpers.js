import { ENTER, SPACE } from 'common/dom_helpers/keycodes_deprecated';

// Checks if event is a space or an enter
export const handleKeyPress = (handler, preventDefault) => (
  (event) => {
    // Enter or Space key code
    if (event.keyCode === ENTER || event.keyCode === SPACE) {
      if (preventDefault) {
        event.preventDefault();
      }

      return handler(event);
    }
  }
);
