(function(root, $) {

  'use strict';

  var socrata = root.socrata;
  var storyteller = socrata.storyteller;
  var utils = socrata.utils;

  function _renderTemplate($element, componentData) {
    var $componentContent = $('<div>');

    utils.assertHasProperty(componentData, 'type');

    $element.
      addClass(utils.typeToClassNameForComponentType(componentData.type)).
      on('destroy', function() {
        $element.destroySocrataColumnChart();
      }).
      on('SOCRATA_VISUALIZATION_COLUMN_CHART_FLYOUT', function(event) {
        var payload = event.originalEvent.detail;

        if (payload !== null) {
          storyteller.flyoutRenderer.render(payload);
        } else {
          storyteller.flyoutRenderer.clear();
        }
      });

    $element.append($componentContent);
  }

  function _updateVisualization($element, componentData) {
    var renderedHeight = parseInt($element.attr('data-rendered-visualization-height'), 10);
    var renderedVif = $element.attr('data-rendered-vif');

    utils.assertHasProperty(componentData, 'value');
    utils.assertHasProperties(componentData.value, 'layout', 'vif');
    utils.assertHasProperty(componentData.value.layout, 'height');

    if (renderedVif !== JSON.stringify(componentData.value.vif) ||
      renderedHeight !== componentData.value.layout.height) {

      $element.height(componentData.value.layout.height);

      componentData.value.vif.localization = {
        'NO_VALUE': I18n.t('editor.visualizations.no_value_placeholder'),
        'FLYOUT_UNFILTERED_AMOUNT_LABEL': I18n.t('editor.visualizations.flyout.unfiltered_amount_label'),
        'FLYOUT_FILTERED_AMOUNT_LABEL': I18n.t('editor.visualizations.flyout.filtered_amount_label'),
        'FLYOUT_SELECTED_NOTICE': I18n.t('editor.visualizations.flyout.datum_selected_label')
      };

      $element.socrataColumnChart(componentData.value.vif);

      $element.attr('data-rendered-vif', JSON.stringify(componentData.value.vif));
      $element.attr('data-rendered-visualization-height', componentData.value.layout.height);
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
