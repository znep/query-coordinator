import _ from 'lodash';

export const UP = 38;
export const DOWN = 40;
export const ENTER = 13;
export const ESCAPE = 27;
export const SPACE = 32;

/**
 * Don't bubble up or run default keystrokes
 * if the last-pressed key is within the array of keys.
 */
export const isolateEventByKeys = (event, keys) => {
  if (_.includes(keys, event.keyCode)) {
    event.stopPropagation();
    event.preventDefault();
  }
};

export default {
  UP,
  DOWN,
  ENTER,
  ESCAPE
};
