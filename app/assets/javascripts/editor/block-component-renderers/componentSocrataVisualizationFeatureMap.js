import $ from 'jQuery';
import _ from 'lodash';

import '../componentBase';
import I18n from '../I18n';
import Constants from '../Constants';
import StorytellerUtils from '../../StorytellerUtils';
import { flyoutRenderer } from '../FlyoutRenderer';

$.fn.componentSocrataVisualizationFeatureMap = componentSocrataVisualizationFeatureMap;

export default function componentSocrataVisualizationFeatureMap(componentData, theme, options) {
  var $this = $(this);

  StorytellerUtils.assertHasProperty(componentData, 'type');
  StorytellerUtils.assert(
    componentData.type === 'socrata.visualization.featureMap',
    StorytellerUtils.format(
      'componentSocrataVisualizationFeatureMap: Tried to render type: {0}',
      componentData.type
    )
  );

  if ($this.children().length === 0) {
    _renderTemplate($this, componentData);
  }

  _updateVisualization($this, componentData);
  $this.componentBase(componentData, theme, _.extend(
    {
      resizeSupported: true,
      resizeOptions: {
        minHeight: Constants.MINIMUM_COMPONENT_HEIGHTS_PX.VISUALIZATION
      }
    },
    options
  ));

  return $this;
}
function _renderTemplate($element, componentData) {
  StorytellerUtils.assertHasProperty(componentData, 'type');

  var className = StorytellerUtils.typeToClassNameForComponentType(componentData.type);
  var $componentContent = $('<div>', { class: 'component-content' });

  $element.
    addClass(className).
    on('destroy', function() { $componentContent.triggerHandler('destroy'); }).
    on('SOCRATA_VISUALIZATION_FEATURE_MAP_FLYOUT', function(event) {
      var payload = event.originalEvent.detail;

      if (payload !== null) {
        flyoutRenderer.render(payload);
      } else {
        flyoutRenderer.clear();
      }
    });

  $element.append($componentContent);
}

function _updateVisualization($element, componentData) {
  StorytellerUtils.assertHasProperty(componentData, 'value.vif');

  var renderedVif = $element.attr('data-rendered-vif') || '{}';
  var $componentContent = $element.find('.component-content');
  var vif = componentData.value.vif;
  var areNotEquivalent = !StorytellerUtils.vifsAreEquivalent(JSON.parse(renderedVif), vif);

  if (areNotEquivalent) {
    $element.attr('data-rendered-vif', JSON.stringify(vif));

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

    // At some point in the future we may want to do a check to see if the
    // datasetUid is available on `tileserver[1..n].api.us.socrata.com` before
    // falling back to the dataset's host domain.
    //
    // For now, this should be sufficient.
    vif.configuration.tileserverHosts = [
      StorytellerUtils.format('https://{0}', vif.domain)
    ];
    vif.configuration.baseLayerUrl = Constants.SOCRATA_VISUALIZATION_FEATURE_MAP_DEFAULT_BASE_LAYER;
    vif.configuration.baseLayerOpacity = 0.8;
    vif.configuration.hover = true;
    vif.configuration.locateUser = true;
    vif.configuration.panAndZoom = true;

    // Use triggerHandler since we don't want this to bubble
    $componentContent.triggerHandler('SOCRATA_VISUALIZATION_DESTROY');
    $componentContent.socrataFeatureMap(vif);
  }
}
