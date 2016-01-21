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
      // Pass on the destroy event to plugin.
      on('destroy', function() { $componentContent.triggerHandler('destroy'); }).
      on('SOCRATA_VISUALIZATION_TABLE_FLYOUT', function(event) {
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
    var renderedVif = $element.attr('data-rendered-vif') || '{}';
    var vif;

    utils.assertHasProperty(componentData, 'value.vif');
    vif = componentData.value.vif;

    if (!storyteller.vifsAreEquivalent(JSON.parse(renderedVif), vif)) {

      $element.attr('data-rendered-vif', JSON.stringify(vif));

      vif.configuration = vif.configuration || {};
      vif.configuration.localization = {
        'PREVIOUS': 'Previous',// TODO actually get from I18n
        'NEXT': 'Next',
        'NO_ROWS': 'No {unitOther}',
        'ONLY_ROW': 'Showing {unitOne} {firstRowOrdinal} of {datasetRowCount}',
        'MANY_ROWS': 'Showing {unitOther} {firstRowOrdinal}-{lastRowOrdinal} out of {datasetRowCount}',
        'LATITUDE': 'Latitude',
        'LONGITUDE': 'Longitude'
      };

      vif.unit = {
        one: 'record',
        other: 'records'
      };

      // Use triggerHandler since we don't want this to bubble
      $componentContent.triggerHandler('SOCRATA_VISUALIZATION_DESTROY');
      $componentContent.socrataTable(vif);
    }
  }

  function componentSocrataVisualizationTable(componentData, theme, options) {
    var $this = $(this);

    utils.assertHasProperty(componentData, 'type');
    utils.assert(
      componentData.type === 'socrata.visualization.table',
      'componentSocrataVisualizationTable: Tried to render type: {0}'.format(componentData.type)
    );

    if ($this.children().length === 0) {
      _renderTemplate($this, componentData);
    }

    _updateVisualization($this, componentData);
    $this.componentBase(componentData, theme, _.extend(
      {
        resizeSupported: true,
        resizeOptions: {
          minHeight: Constants.MINIMUM_COMPONENT_HEIGHTS_PX.visualization
        },
        defaultHeight: Constants.DEFAULT_TABLE_HEIGHT
      },
      options
    ));

    return $this;
  }

  $.fn.componentSocrataVisualizationTable = componentSocrataVisualizationTable;
})(window, jQuery);
