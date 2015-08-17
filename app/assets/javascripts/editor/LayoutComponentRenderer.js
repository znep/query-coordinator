(function(root) {

  'use strict';

  var socrata = root.socrata;
  var utils = socrata.utils;

  /**
   * Component template renderers
   */

  function _renderLayoutComponentTemplate(componentOptions) {
    var layoutComponent;

    utils.assertHasProperty(componentOptions, 'componentValue');
    utils.assertEqual(componentOptions.componentType, 'layout');

    layoutComponent = $('<div>', { 'class': componentOptions.classes });

    switch (componentOptions.componentValue) {
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

  function _canReuseTemplate() {

    var canReuseTemplate = true;

    return canReuseTemplate;
  }

  /**
   * Component data renderers
   */

  function _renderLayoutComponentData() {
    // For now, no layout components have changable data, so nothing happens here
    // Leaving the function for consistency and/or future components with data
  }

  root.socrata.storyteller.LayoutComponentRenderer = {
    renderTemplate: _renderLayoutComponentTemplate,
    canReuseTemplate: _canReuseTemplate,
    renderData: _renderLayoutComponentData
  };
})(window);
