(function(root, $) {

  'use strict';

  var socrata = root.socrata;
  var utils = socrata.utils;

  function _renderTemplate($element, componentData) {
    var $componentContent = $('<div>');

    utils.assertHasProperty(componentData, 'type');

    $element.
      addClass(utils.typeToClassNameForComponentType(componentData.type)).
      one('destroy', $element.destroySocrataTimelineChart);

    $element.append($componentContent);
  }

  function _updateVisualization($element, componentData) {
    var renderedVif = $element.attr('data-rendered-vif');
    var vif;

    utils.assertHasProperty(componentData, 'value.vif');

    vif = componentData.value.vif;

    if (renderedVif !== JSON.stringify(vif)) {

      vif.configuration.localization = {
        'NO_VALUE': I18n.t('editor.visualizations.no_value_placeholder'),
        'FLYOUT_UNFILTERED_AMOUNT_LABEL': I18n.t('editor.visualizations.flyout.unfiltered_amount_label'),
        'FLYOUT_FILTERED_AMOUNT_LABEL': I18n.t('editor.visualizations.flyout.filtered_amount_label'),
        'FLYOUT_SELECTED_NOTICE': I18n.t('editor.visualizations.flyout.datum_selected_label')
      };

      vif.unit = {
        one: 'record',
        other: 'records'
      };

      $element.socrataTimelineChart(vif).attr('data-rendered-vif', JSON.stringify(vif));
    }
  }

  function componentSocrataVisualizationTimelineChart(componentData) {
    var $this = $(this);

    utils.assertHasProperty(componentData, 'type');
    utils.assert(
      componentData.type === 'socrata.visualization.timelineChart',
      'componentSocrataVisualizationTimelineChart: Tried to render type: {0}'.format(componentData.type)
    );

    if ($this.children().length === 0) {
      _renderTemplate($this, componentData);
    }

    _updateVisualization($this, componentData);

    return $this;
  }

  $.fn.componentSocrataVisualizationTimelineChart = componentSocrataVisualizationTimelineChart;
})(window, jQuery);
