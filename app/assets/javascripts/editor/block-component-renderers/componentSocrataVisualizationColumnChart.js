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
    var uid;
    var baseQuery;
    var dataSource;
    var renderedUid = $element.attr('data-rendered-visualization-uid');
    var renderedBaseQuery = $element.attr('data-rendered-visualization-base-query');

    utils.assertHasProperty(componentData, 'value');
    utils.assertHasProperty(componentData.value, 'dataSource');

    dataSource = componentData.value.dataSource;

    utils.assertHasProperty(dataSource, 'type');
    utils.assertHasProperty(dataSource, 'domain');
    utils.assertHasProperty(dataSource, 'uid');
    utils.assertHasProperty(dataSource, 'baseQuery');
    utils.assertEqual(dataSource.type, 'soql');

    domain = dataSource.domain;
    // Respect uid or uid for backwards compatability.
    uid = dataSource.uid;
    utils.assert(uid.length, 'Dataset uid is required to render a visualization');

    baseQuery = dataSource.
      baseQuery.
      format(
        Constants.SOQL_DATA_PROVIDER_NAME_ALIAS,
        Constants.SOQL_DATA_PROVIDER_VALUE_ALIAS
      );

    if ((uid !== renderedUid) || (baseQuery !== renderedBaseQuery)) {

      if (renderedUid !== undefined) {

        // Destroy existing visualization.
        $element.trigger('destroy');
      }

      $element.attr('data-rendered-visualization-uid', uid);
      $element.attr('data-rendered-visualization-base-query', baseQuery);

      $element.socrataVisualizationColumnChart(domain, uid, baseQuery);
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
