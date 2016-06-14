import { ENTER_KEY_CODE, SPACE_KEY_CODE } from './constants';

// Checks if event is a space or an enter
export const handleKeyPress = function(handler, preventDefault) {
  return function(event) {
    // Enter or Space key code
    if (event.keyCode === ENTER_KEY_CODE || event.keyCode === SPACE_KEY_CODE) {
      if (preventDefault) {
        event.preventDefault();
      }

      return handler(event);
    }
  };
};
