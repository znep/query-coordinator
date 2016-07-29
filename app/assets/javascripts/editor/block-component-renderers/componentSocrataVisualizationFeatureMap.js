import $ from 'jQuery';
import _ from 'lodash';

import '../componentBase';
import I18n from '../I18n';
import Constants from '../Constants';
import Environment from '../../StorytellerEnvironment';
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
  var flyoutEvent = (Environment.ENABLE_SVG_VISUALIZATIONS) ?
    'SOCRATA_VISUALIZATION_FLYOUT' :
    'SOCRATA_VISUALIZATION_FEATURE_MAP_FLYOUT';

  $element.
    addClass(className).
    on('destroy', function() { $componentContent.triggerHandler('destroy'); }).
    on(flyoutEvent, function(event) {
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
  var visualizationImplementation = (Environment.ENABLE_SVG_VISUALIZATIONS) ?
    'socrataSvgFeatureMap' :
    'socrataFeatureMap';

  if (areNotEquivalent) {
    $element.attr('data-rendered-vif', JSON.stringify(vif));

    vif.configuration.localization = {
      'flyout_filter_notice': I18n.t('editor.visualizations.feature_map.flyout_filter_notice'),
      'flyout_filter_or_zoom_notice': I18n.t('editor.visualizations.feature_map.flyout_filter_or_zoom_notice'),
      'flyout_dense_data_notice': I18n.t('editor.visualizations.feature_map.flyout_dense_data_notice'),
      'flyout_click_to_inspect_notice': I18n.t('editor.visualizations.feature_map.flyout_click_to_inspect_notice'),
      'flyout_click_to_locate_user_title': I18n.t('editor.visualizations.feature_map.flyout_click_to_locate_user_title'),
      'flyout_click_to_locate_user_notice': I18n.t('editor.visualizations.feature_map.flyout_click_to_locate_user_notice'),
      'flyout_locating_user_title': I18n.t('editor.visualizations.feature_map.flyout_locating_user_title'),
      'flyout_locate_user_error_title': I18n.t('editor.visualizations.feature_map.flyout_locate_user_error_title'),
      'flyout_locate_user_error_notice': I18n.t('editor.visualizations.feature_map.flyout_locate_user_error_notice'),
      'flyout_pan_zoom_disabled_warning_title': I18n.t('editor.visualizations.feature_map.flyout_pan_zoom_disabled_warning_title'),
      'row_inspector_row_data_query_failed': I18n.t('editor.visualizations.feature_map.row_inspector_row_data_query_failed'),
      'user_current_position': I18n.t('editor.visualizations.feature_map.user_current_position'),
      'column_incompatibility_error': I18n.t('editor.visualizations.feature_map.column_incompatibility_error'),
      'feature_extent_query_error': I18n.t('editor.visualizations.feature_map.feature_extent_query_error')
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
      'https://' + _.get(vif, 'series[0].dataSource.domain', vif.domain)
    ];
    vif.configuration.baseLayerUrl = Constants.SOCRATA_VISUALIZATION_FEATURE_MAP_DEFAULT_BASE_LAYER;
    vif.configuration.baseLayerOpacity = 0.8;
    vif.configuration.hover = true;
    vif.configuration.locateUser = true;
    vif.configuration.panAndZoom = true;

    // EN-7517 - Title and description of VisualizationAddController V1 vifs are not useful.
    //
    // The new viz implementations actually read from title and description and
    // will display them, but the VisualizationAdd controller will set the
    // title to the name of the column or something.
    if (_.get(vif, 'format.version') === 1) {
      vif.title = null;
      vif.description = null;
    }

    // Use triggerHandler since we don't want this to bubble
    $componentContent.triggerHandler('SOCRATA_VISUALIZATION_DESTROY');
    $componentContent[visualizationImplementation](vif);
  }
}
