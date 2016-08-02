import _ from 'lodash';

/**
 * Checks if right object overrides left object's values.
 * @param {Object} left
 * @param {Object} right
 * @returns {Boolean}
 */
export default function isDifferent(left, right) {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);

  return _.some(leftKeys, key => {
    const isObject = _.isObject(right[key]);
    return rightKeys.indexOf(key) >= 0 && (isObject ? isDifferent(left[key], right[key]) : right[key] != left[key]);
  });
}
