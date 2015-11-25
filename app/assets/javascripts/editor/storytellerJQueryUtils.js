(function(root) {

  'use strict';

  var socrata = root.socrata = root.socrata || {};
  var utils = socrata.utils = socrata.utils || {};

  /**
   * Updates an attribute on the selection with the given value, but only
   * if the current attribute value is different.
   *
   * @param {string} attributeName: Name of DOM attribute.
   * @param {string} value: New attribute value.
   * @callback {function(string, string)} callback: Invoked if the value needed to be updated.
   *   Arguments: (value, attributeName). `this` is the current selection.
   */
  $.fn.updateAttrAndCallbackIfWasChanged = function(attributeName, value, callback) {
    utils.assertIsOneOfTypes(attributeName, 'string');
    utils.assertIsOneOfTypes(value, 'string');
    utils.assertIsOneOfTypes(callback, 'function');

    if (this.attr(attributeName) !== value) {
      this.attr(attributeName, value);
      callback.call(this, value, attributeName);
    }

    return this;
  };
})(window);
