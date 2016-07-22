/**
 * Returns true if all of the given items are falsy
 * @param {Array} items Array of items
 * @returns {Boolean}
 */
export default (items) => {
  return items.reduce((item, result) => result && !item, true);
};
