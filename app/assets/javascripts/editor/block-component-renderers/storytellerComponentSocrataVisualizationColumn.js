(function (root, $) {

  'use strict';

  var socrata = root.socrata;
  var utils = socrata.utils;

  function _renderTemplate($element) {
    var $componentContent = $('<div>');

    $element.
      addClass('socrataVisualization').
      addClass('column').
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

  function _updateVisualization($element, value) {

    var domain;
    var fourByFour;
    var baseQuery;
    var renderedFourByFour = $element.attr('data-rendered-visualization-four-by-four');
    var renderedBaseQuery = $element.attr('data-rendered-visualization-base-query');

    utils.assertHasProperty(value, 'dataSource');
    utils.assertHasProperty(value.dataSource, 'type');
    utils.assertHasProperty(value.dataSource, 'domain');
    utils.assertHasProperty(value.dataSource, 'fourByFour');
    utils.assertHasProperty(value.dataSource, 'baseQuery');
    utils.assertEqual(value.dataSource.type, 'soql');

    domain = value.dataSource.domain;
    fourByFour = value.dataSource.fourByFour;
    baseQuery = value.
      dataSource.
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

  function storytellerComponentSocrataVisualizationColumn(componentData) {
    var $self = $(this);

    utils.assert(
      componentData.type === 'socrataVisualization',
      'storytellerComponentSocrataVisualizationColumn: Tried to render type: {0}'.format(componentData.type)
    );
    utils.assert(
      componentData.value.type === 'column',
      'storytellerComponentSocrataVisualizationColumn: Tried to render visualization type: {0}'.
        format(componentData.value.type)
    );

    if ($self.children().length === 0) {
      _renderTemplate($self);
    }

    // (╯°□°）╯︵ ┻━┻
    _updateVisualization($self, componentData.value.value);

    return $self;
  }

  $.fn.storytellerComponentSocrataVisualizationColumn = storytellerComponentSocrataVisualizationColumn;
})(window, jQuery);
