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
      var vif = componentData.value.vif;

      $element.height(componentData.value.layout.height);

      vif.configuration.localization = {
        'FLYOUT_FILTER_NOTICE': I18n.t('editor.visualizations.feature_map.flyout_filter_notice'),
        'FLYOUT_FILTER_OR_ZOOM_NOTICE': I18n.t('editor.visualizations.feature_map.flyout_filter_or_zoom_notice'),
        'FLYOUT_DENSE_DATA_NOTICE': I18n.t('editor.visualizations.feature_map.flyout_dense_data_notice'),
        'FLYOUT_CLICK_TO_INSPECT_NOTICE': I18n.t('editor.visualizations.feature_map.flyout_click_to_inspect_notice'),
        'FLYOUT_CLICK_TO_LOCATE_USER_TITLE': I18n.t('editor.visualizations.feature_map.flyout_click_to_locate_user_title'),
        'FLYOUT_CLICK_TO_LOCATE_USER_NOTICE': I18n.t('editor.visualizations.feature_map.flyout_click_to_locate_user_notice'),
        'FLYOUT_LOCATING_USER_TITLE': I18n.t('editor.visualizations.feature_map.flyout_locating_user_title'),
        'FLYOUT_LOCATE_USER_ERROR_TITLE': I18n.t('editor.visualizations.feature_map.flyout_locate_user_error_title'),
        'FLYOUT_LOCATE_USER_ERROR_NOTICE': I18n.t('editor.visualizations.feature_map.flyout_locate_user_error_notice'),
        'FLYOUT_PAN_ZOOM_DISABLED_WARNING_TITLE': I18n.t('editor.visualizations.feature_map.flyout_pan_zoom_disabled_warning_title'),
        'ROW_INSPECTOR_ROW_DATA_QUERY_FAILED': I18n.t('editor.visualizations.feature_map.row_inspector_row_data_query_failed'),
        'USER_CURRENT_POSITION': I18n.t('editor.visualizations.feature_map.user_current_position')
      };

      vif.unit = {
        one: 'record',
        other: 'records'
      };

      vif.configuration.tileserverHosts = ['https://cml.local'];
      vif.configuration.baseLayerUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}.png';
      vif.configuration.baseLayerOpacity = 0.25;
      vif.configuration.hover = true;
      vif.configuration.locateUser = true;
      vif.configuration.panAndZoom = true;

      $element.socrataFeatureMap(vif);

      $element.attr('data-rendered-vif', JSON.stringify(vif));
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
