import { DOWN_ARROW_KEY_CODE, ENTER_KEY_CODE, SPACE_KEY_CODE } from '../constants';

// Checks if event is a space or an enter
export const handleKeyPress = (handler, preventDefault) => {
  return (event) => {
    // Enter or Space key code
    if (event.keyCode === ENTER_KEY_CODE || event.keyCode === SPACE_KEY_CODE) {
      if (preventDefault) {
        event.preventDefault();
      }

      return handler(event);
    }
  };
};

export const handleEnter = (handler, preventDefault) => {
  return (event) => {
    if (event.keyCode === ENTER_KEY_CODE) {
      if (preventDefault) {
        event.preventDefault();
      }

      return handler(event);
    }
  };
};

export const handleDownArrow = (handler, preventDefault) => {
  return (event) => {
    if (event.keyCode === DOWN_ARROW_KEY_CODE) {
      if (preventDefault) {
        event.preventDefault();
      }

      return handler(event);
    }
  };
};
