;window.socrata.storyteller.SocrataVisualizationComponentRenderer = (function(socrata) {

  'use strict';

  var storyteller = socrata.storyteller;
  var utils = socrata.utils;

  var _componentTemplateRenderers = {
    'column': _renderSocrataVisualizationColumnComponentTemplate
  };
  var _componentDataRenderers = {
    'column': _renderSocrataVisualizationColumnComponentData
  };

  function _renderTemplate(componentOptions) {

    var type;

    utils.assertHasProperty(componentOptions, 'componentType');
    utils.assertEqual(componentOptions.componentType, 'socrataVisualization');
    utils.assertHasProperty(componentOptions, 'componentValue');
    utils.assertHasProperty(componentOptions.componentValue, 'type');

    type = componentOptions.componentValue.type;

    utils.assertHasProperty(_componentTemplateRenderers, type);

    return _componentTemplateRenderers[type](
      componentOptions
    );
  }

  function _renderData(element, data, editable, renderFn) {

    var type;
    var value;

    utils.assertHasProperty(data, 'value');
    utils.assertHasProperty(data.value, 'type');
    utils.assertHasProperty(data.value, 'value');
    utils.assertIsOneOfTypes(renderFn, 'function');

    type = data.value.type;
    value = data.value.value;

    utils.assertHasProperty(_componentDataRenderers, type);

    _componentDataRenderers[type](
      element,
      value,
      editable,
      renderFn
    );
  }

  /**
   * Component template renderers
   */

  function _renderSocrataVisualizationComponentTemplate(componentOptions) {

    var provider;

    utils.assertHasProperties(
      componentOptions,
      'componentType',
      'componentValue'
    );

    utils.assertHasProperties(
      componentOptions.componentValue,
      'type',
      'value'
    );

    utils.assertHasProperty(
      componentOptions.componentValue.value,
      'provider'
    );

    provider = componentOptions.componentValue.value.provider;

    return _socrataVisualizationComponentTemplateRenderers[provider](componentOptions);
  }

  function _renderSocrataVisualizationColumnComponentTemplate(componentOptions) {

    var classes;
    var container;
    var fourByFour;
    var baseQuery;

    utils.assertHasProperties(
      componentOptions,
      'classes',
      'blockId',
      'componentIndex'
    );

    classes = componentOptions.classes + ' column';

    return $(
      '<div>',
      {
        'class': classes,
        'data-rendered-template': 'socrataVisualization',
        'data-rendered-visualization': 'column',
        'data-block-id': componentOptions.blockId,
        'data-component-index': componentOptions.componentIndex
      }
    );
  }

  /**
   * Component data renderers
   */

  function _renderSocrataVisualizationComponentData(element, value, editable, renderFn) {
    _socrataVisualizationComponentDataRenderers[value.provider](
      element,
      value,
      editable,
      renderFn
    );
  }

  function _renderSocrataVisualizationColumnComponentData(element, value, editable, renderFn) {

    var domain = value.domain;
    var fourByFour = value.fourByFour;
    var baseQuery = value.
      baseQuery.
      format(
        Constants.SOQL_DATA_PROVIDER_NAME_ALIAS,
        Constants.SOQL_DATA_PROVIDER_VALUE_ALIAS
      );

    var renderedFourByFour = element.attr('data-rendered-visualization-four-by-four');
    var renderedBaseQuery = element.attr('data-rendered-visualization-base-query');
    var visualization;

    if ((fourByFour !== renderedFourByFour) || (baseQuery !== renderedBaseQuery)) {

      if (renderedFourByFour !== undefined) {

        // Destroy existing visualization.
        var destroyVisualizationEvent = new window.CustomEvent(
          Constants.SOCRATA_VISUALIZATION_DESTROY,
          {
            detail: {},
            bubbles: false
          }
        );

        element[0].dispatchEvent(destroyVisualizationEvent);        
      }

      element.attr('data-rendered-visualization-four-by-four', fourByFour);
      element.attr('data-rendered-visualization-base-query', baseQuery);

      visualization = element.socrataVisualizationColumn(domain, fourByFour, baseQuery);
    }
  }

  return {
    renderTemplate: _renderTemplate,
    renderData: _renderData
  };
})(window.socrata);
