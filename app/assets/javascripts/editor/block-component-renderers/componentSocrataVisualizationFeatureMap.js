(function(root, $) {

  'use strict';

  var socrata = root.socrata;
  var storyteller = socrata.storyteller;
  var utils = socrata.utils;

  function _renderTemplate($element, componentData) {
    utils.assertHasProperty(componentData, 'type');

    $element.
      addClass(utils.typeToClassNameForComponentType(componentData.type)).
      on('destroy', function() {
        $element.destroySocrataFeatureMap();
      }).
      on('SOCRATA_VISUALIZATION_FEATURE_MAP_FLYOUT', function(event) {
        var payload = event.originalEvent.detail;

        if (payload !== null) {
          storyteller.flyoutRenderer.render(payload);
        } else {
          storyteller.flyoutRenderer.clear();
        }
      }).
      on('SOCRATA_VISUALIZATION_ROW_INSPECTOR_SHOW', function(event) {

      }).
      on('SOCRATA_VISUALIZATION_ROW_INSPECTOR_UPDATE', function(event) {

      }).
      on('SOCRATA_VISUALIZATION_ROW_INSPECTOR_HIDE', function(event) {

      });
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

      componentData.value.vif.configuration.localization = {
        'FLYOUT_FILTER_NOTICE': 'There are too many points at this location',
        'FLYOUT_FILTER_OR_ZOOM_NOTICE': 'Zoom in to see details',
        'FLYOUT_DENSE_DATA_NOTICE': 'Numerous',
        'FLYOUT_CLICK_TO_INSPECT_NOTICE': 'Click to see details',
        'FLYOUT_CLICK_TO_LOCATE_USER_TITLE': 'Click to show your position on the map',
        'FLYOUT_CLICK_TO_LOCATE_USER_NOTICE': 'You may have to give your browser permission to share your current location',
        'FLYOUT_LOCATING_USER_TITLE': 'Your position is being determined',
        'FLYOUT_LOCATE_USER_ERROR_TITLE': 'There was an error determining your location',
        'FLYOUT_LOCATE_USER_ERROR_NOTICE': 'Click to try again',
        'FLYOUT_PAN_ZOOM_DISABLED_WARNING_TITLE': 'Panning and zooming has been disabled',
        'ROW_INSPECTOR_ROW_DATA_QUERY_FAILED': 'Detailed information about these points cannot be loaded at this time',
        'USER_CURRENT_POSITION': 'Your current location (estimated)',
        'UNIT_ONE': 'record',
        'UNIT_OTHER': 'records'
      };

      componentData.value.vif.domain = 'cml.local';

      componentData.value.vif.configuration.tileserverHosts = ['https://cml.local'];
      componentData.value.vif.configuration.baseLayerUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}.png';
      componentData.value.vif.configuration.baseLayerOpacity = 0.25;
      componentData.value.vif.configuration.hover = true;
      componentData.value.vif.configuration.locateUser = true;
      componentData.value.vif.configuration.panAndZoom = true;

      $element.socrataFeatureMap(componentData.value.vif);

      $element.attr('data-rendered-vif', JSON.stringify(componentData.value.vif));
      $element.attr('data-rendered-visualization-height', componentData.value.layout.height);
    }
  }

  function componentSocrataVisualizationFeatureMap(componentData) {
    var $this = $(this);

    utils.assertHasProperty(componentData, 'type');
    utils.assert(
      componentData.type === 'socrata.visualization.featureMap',
      'componentSocrataVisualizationFeatureMap: Tried to render type: {0}'.format(componentData.type)
    );

    if ($this.children().length === 0) {
      _renderTemplate($this, componentData);
    }

    _updateVisualization($this, componentData);

    return $this;
  }

  $.fn.componentSocrataVisualizationFeatureMap = componentSocrataVisualizationFeatureMap;
})(window, jQuery);
