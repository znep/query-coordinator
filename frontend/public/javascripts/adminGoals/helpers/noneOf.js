/**
 * Returns true if all of the given items are falsy
 * @param {Array} items Array of items
 * @returns {Boolean}
 */
export default (items) => {
  return items.reduce((result, item) => result && !item, true);
};
