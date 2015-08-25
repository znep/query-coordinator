(function(root, $) {

  'use strict';

  var socrata = root.socrata;
  var utils = socrata.utils;

  function _renderHorizontalRuleContent(componentData) {
    return $('<hr>', utils.typeToClassNameForComponentType(componentData.type));
  }

  /**
   * @function componentHorizontalRule
   * @desc Renders out a <hr>.
   * @param {object} componentData - An object with a type and value attribute
   * @returns {jQuery} - The rendered horizontal rule jQuery element
   */
  function componentHorizontalRule(componentData) {
    var $this = $(this);

    utils.assertHasProperty(componentData, 'type');
    utils.assert(
      componentData.type === 'horizontalRule',
      'componentHorizontalRule: Unsupported component type {0}'.format(
        componentData.type
      )
    );
    utils.assert(
      $this.length === 1,
      'Selection must have exactly one element.'
    );

    $this.empty().append(_renderHorizontalRuleContent(componentData));

    return $this;
  }

  $.fn.componentHorizontalRule = componentHorizontalRule;
})(window, jQuery);
