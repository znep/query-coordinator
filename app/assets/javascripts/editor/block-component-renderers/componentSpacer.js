(function(root, $) {

  'use strict';

  var socrata = root.socrata;
  var utils = socrata.utils;

  function _renderSpacerContent(componentData) {
    return $('<div>', {'class': utils.typeToClassNameForComponentType(componentData.type)});
  }

  /**
   * @function componentSpacer
   * @desc Renders out a <div.spacer>.
   * @param {object} componentData - An object with a type and value attribute
   * @returns {jQuery} - The rendered spacer jQuery element
   */
  function componentSpacer(componentData) {
    var $this = $(this);

    utils.assertHasProperty(componentData, 'type');
    utils.assert(
      componentData.type === 'spacer',
      'componentSpacer: Unsupported component type {0}'.format(
        componentData.type
      )
    );
    utils.assert(
      $this.length === 1,
      'Selection must have exactly one element.'
    );

    $this.empty().append(_renderSpacerContent(componentData));

    return $this;
  }

  $.fn.componentSpacer = componentSpacer;
})(window, jQuery);
