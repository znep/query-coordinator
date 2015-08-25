(function(root, $) {

  'use strict';

  var socrata = root.socrata;
  var utils = socrata.utils;

  function _renderTemplate($element, componentData) {
    var $componentContent = $('<div>');

    utils.assertHasProperty(componentData, 'type');

    $element.
      addClass(utils.typeToClassNameForComponentType(componentData.type)).
      on('destroy', function() {
        var destroyVisualizationEvent = new window.CustomEvent(
          Constants.SOCRATA_VISUALIZATION_DESTROY,
          {
            detail: {},
            bubbles: false
          }
        );

        $element[0].dispatchEvent(destroyVisualizationEvent);
      });

    $element.append($componentContent);
  }

  function _updateVisualization($element, componentData) {

    var domain;
    var fourByFour;
    var baseQuery;
    var dataSource;
    var renderedFourByFour = $element.attr('data-rendered-visualization-four-by-four');
    var renderedBaseQuery = $element.attr('data-rendered-visualization-base-query');

    utils.assertHasProperty(componentData, 'value');
    utils.assertHasProperty(componentData.value, 'dataSource');

    dataSource = componentData.value.dataSource;

    utils.assertHasProperty(dataSource, 'type');
    utils.assertHasProperty(dataSource, 'domain');
    utils.assertHasProperty(dataSource, 'fourByFour');
    utils.assertHasProperty(dataSource, 'baseQuery');
    utils.assertEqual(dataSource.type, 'soql');

    domain = dataSource.domain;
    fourByFour = dataSource.fourByFour;
    baseQuery = dataSource.
      baseQuery.
      format(
        Constants.SOQL_DATA_PROVIDER_NAME_ALIAS,
        Constants.SOQL_DATA_PROVIDER_VALUE_ALIAS
      );

    if ((fourByFour !== renderedFourByFour) || (baseQuery !== renderedBaseQuery)) {

      if (renderedFourByFour !== undefined) {

        // Destroy existing visualization.
        $element.trigger('destroy');
      }

      $element.attr('data-rendered-visualization-four-by-four', fourByFour);
      $element.attr('data-rendered-visualization-base-query', baseQuery);

      $element.socrataVisualizationColumnChart(domain, fourByFour, baseQuery);
    }
  }

  function componentSocrataVisualizationColumnChart(componentData) {
    var $this = $(this);

    utils.assertHasProperty(componentData, 'type');
    utils.assert(
      componentData.type === 'socrata.visualization.columnChart',
      'componentSocrataVisualizationColumnChart: Tried to render type: {0}'.format(componentData.type)
    );

    if ($this.children().length === 0) {
      _renderTemplate($this, componentData);
    }

    _updateVisualization($this, componentData);

    return $this;
  }

  $.fn.componentSocrataVisualizationColumnChart = componentSocrataVisualizationColumnChart;
})(window, jQuery);
