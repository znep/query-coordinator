import { DOWN, ENTER, SPACE } from './keycodes';

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
