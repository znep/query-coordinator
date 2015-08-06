;window.socrata.storyteller.LayoutComponentRenderer = (function(socrata) {

  'use strict';

  var storyteller = socrata.storyteller;
  var utils = socrata.utils;

  /**
   * Component template renderers
   */

  function _renderLayoutComponentTemplate(componentOptions) {
    var layoutComponent;

    utils.assertHasProperty(componentOptions, 'componentValue');
    utils.assertEqual(componentOptions.componentType, 'layout');

    layoutComponent = $('<div>', { 'class': componentOptions.classes });

    switch(componentOptions.componentValue) {
      case 'spacer':
        layoutComponent.append($('<div>', { 'class': 'spacer'}));
        break;
      case 'horizontalRule':
        layoutComponent.append($('<hr>'));
        break;
      default:
        throw new Error(
          'Attempted to render a layoutComponet with value: `' +
          componentOptions.componentValue + '` which has no template definition.'
        );
    }

    return layoutComponent;
  }

  /**
   * Component data renderers
   */

  function _renderLayoutComponentData(element, value, editable, renderFn) {
    // For now, no layout components have changable data, so nothing happens here
    // Leaving the function for consistency and/or future components with data
  }

  return {
    renderTemplate: _renderLayoutComponentTemplate,
    renderData: _renderLayoutComponentData
  };
})(window.socrata);
