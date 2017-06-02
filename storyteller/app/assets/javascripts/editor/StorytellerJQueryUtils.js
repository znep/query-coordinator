import $ from 'jquery';
import { assertIsOneOfTypes } from 'common/js_utils';

var StorytellerJQueryUtils = {
  /**
   * Updates an attribute on the selection with the given value, but only
   * if the current attribute value is different.
   *
   * @param {string} attributeName: Name of DOM attribute.
   * @param {string} value: New attribute value.
   * @callback {function(string, string)} callback: Invoked if the value needed to be updated.
   *   Arguments: (value, attributeName). `this` is the current selection.
   */
  updateAttributeWithCallbackIfChanged: function(attributeName, value, callback) {
    assertIsOneOfTypes(attributeName, 'string');
    assertIsOneOfTypes(value, 'string');
    assertIsOneOfTypes(callback, 'function');

    if (this.attr(attributeName) !== value) {
      this.attr(attributeName, value);
      callback.call(this, value, attributeName);
    }

    return this;
  }
};

// Assign all of them to jQuery's fn plugin interface.
for (var key in StorytellerJQueryUtils) {
  $.fn[key] = StorytellerJQueryUtils[key];
}

export default StorytellerJQueryUtils;
