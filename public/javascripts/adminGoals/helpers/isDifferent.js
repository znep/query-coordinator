import _ from 'lodash';

/**
 * Checks if right object overrides left object's values.
 * @param {Object} left
 * @param {Object} right
 * @returns {Boolean}
 */
export default (left, right) => {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);

  return _.some(leftKeys, key => {
    return rightKeys.indexOf(key) >= 0 && right[key] != left[key];
  });
};
