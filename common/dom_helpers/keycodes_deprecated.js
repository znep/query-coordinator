// WARNING: keyCode is _DEPRECATED_ and appears to have spotty React support.
// See https://socrata.atlassian.net/browse/EN-20529 and
// https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/keyCode
//
// Consider using KeyboardEvent.key or KeyboardEvent.code, as suggested by Mozilla.
import _ from 'lodash';

export const UP = 38;
export const DOWN = 40;
export const ENTER = 13;
export const ESCAPE = 27;
export const SPACE = 32;
export const TAB = 9;

/**
 * **WARNING**: See deprecation notice at top of file.
 * Determine if the last-pressed key is within
 * the array of keys
 */
export const isOneOfKeys = (event, keys) => {
  return _.includes(keys, event.keyCode);
};

/**
 * **WARNING**: See deprecation notice at top of file.
 * Don't bubble up or run default keystrokes
 * if the last-pressed key is within the array of keys.
 */
export const isolateEventByKeys = (event, keys) => {
  if (isOneOfKeys(event, keys)) {
    event.stopPropagation();
    event.preventDefault();
  }
};

export default {
  DOWN,
  ENTER,
  ESCAPE,
  SPACE,
  TAB,
  UP
};
