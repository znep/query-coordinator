(function (root, $) {

  var socrata = root.socrata;
  var utils = socrata.utils;

  function _renderLayoutContent(componentData) {
    var $element;

    if(componentData.value === 'spacer') {
      $element = $('<div>', { 'class': 'spacer'});
    } else if (componentData.value === 'horizontalRule') {
      $element = $('<hr>');
    } else {
      throw new Error(
        'Attempted to render a layoutComponet with value: `' +
        componentData.value + '` which has no template definition.'
      );
    }

    return $element;
  }

  /**
   * @function storytellerComponentLayout
   * @description
   * Renders out a Layout.
   *
   * Current types:
   * - spacer
   * - horizontalRule
   *
   * @param {object} componentData - An object with a type and value attribute
   * @returns {jQuery} - The rendered layout jQuery element
   */
  function storytellerComponentLayout(componentData) {
    var $self = $(this);

    utils.assertHasProperty(componentData, 'type');
    utils.assertHasProperty(componentData, 'value');

    if ($self.length !== 1) {
      throw new Error('Selection must have exactly one element.');
    }

    $self.empty().append(_renderLayoutContent(componentData));

    return $self;
  }

  $.fn.storytellerComponentLayout = storytellerComponentLayout;
})(window, jQuery);
