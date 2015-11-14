(function(root, $) {

  'use strict';

  var socrata = root.socrata;
  var storyteller = socrata.storyteller;
  var utils = socrata.utils;

  function _renderTemplate($element, componentData) {
    var $componentContent = $('<div>', { class: 'component-content' });

    utils.assertHasProperty(componentData, 'type');

    $element.
      addClass(utils.typeToClassNameForComponentType(componentData.type)).
      // Pass on the destroy event to SocrataColumnChart plugin.
      on('destroy', function() { $componentContent.triggerHandler('destroy'); }).
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
    var $componentContent = $element.find('.component-content');
    var renderedVif = $element.attr('data-rendered-vif');

    utils.assertHasProperty(componentData, 'value');

    if (renderedVif !== JSON.stringify(componentData.value.vif)) {

      var vif = componentData.value.vif;

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

      $componentContent.trigger('destroy');
      $componentContent.socrataColumnChart(vif);

      $element.attr('data-rendered-vif', JSON.stringify(vif));
    }
  }

  function componentSocrataVisualizationColumnChart(componentData, theme, options) {
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
    $this.componentEditButton();
    $this.toggleClass('editing', _.get(options, 'editMode', false));

    return $this;
  }

  $.fn.componentSocrataVisualizationColumnChart = componentSocrataVisualizationColumnChart;
})(window, jQuery);
