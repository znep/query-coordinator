// Entry point for new maps.
// Requirements:
//  * mapbox-gl.js to be included in the javascript bundle.
//  * mapbog-gl.css to be loaded in the page.
//  * mapbox access token to be set in
//      - window.serverConfig.mapboxAccessToken (frontend)
//      - window.MAPBOX_ACCESS_TOKEN   (storyteller)

import $ from 'jquery';
import _ from 'lodash';
import mapboxgl from 'mapbox-gl';

import { sift } from 'common/js_utils';

import UnifiedMap from './views/UnifiedMap';

export default $.fn.socrataUnifiedMap = function(vif, options) {
  const $element = $(this);

  if (!mapboxgl.accessToken) {
    let mapboxAccessToken = sift(
      window,
      'serverConfig.mapboxAccessToken', 'MAPBOX_ACCESS_TOKEN'
    );

    if (_.isUndefined(mapboxAccessToken)) {
      throw new Error('UnifiedMap requires window.serverConfig.mapboxAccessToken to be defined.');
    } else {
      mapboxgl.accessToken = mapboxAccessToken;
    }
  }

  const unifiedMapInstance = new UnifiedMap($element, vif, options);
  attachEvents($element, unifiedMapInstance);
};

const attachEvents = function($element, unifiedMapInstance) {
  $element.one('SOCRATA_VISUALIZATION_DESTROY', function() {
    unifiedMapInstance.destroy();
    detachEvents($element, unifiedMapInstance);
  });

  // TODO: To be handled in Mouse Interaction and the next set of stories.
  // $element.on('SOCRATA_VISUALIZATION_FLYOUT_SHOW', handleVisualizationFlyoutShow);
  // $element.on('SOCRATA_VISUALIZATION_FLYOUT_HIDE', handleVisualizationFlyoutHide);
  // $element.on('SOCRATA_VISUALIZATION_ROW_INSPECTOR_QUERY', handleRowInspectorQuery);
  // $element.on('SOCRATA_VISUALIZATION_FEATURE_MAP_CENTER_AND_ZOOM_CHANGE', handleMapCenterAndZoomChange);
  $element.on('SOCRATA_VISUALIZATION_INVALIDATE_SIZE', unifiedMapInstance.invalidateSize);
  $element.on('SOCRATA_VISUALIZATION_RENDER_VIF', unifiedMapInstance.onUpdateEvent);
};

const detachEvents = function($element, unifiedMapInstance) {
  // TODO: To be handled in Mouse Interaction and the next set of stories.
  // $element.off('SOCRATA_VISUALIZATION_FLYOUT_SHOW', handleVisualizationFlyoutShow);
  // $element.off('SOCRATA_VISUALIZATION_FLYOUT_HIDE', handleVisualizationFlyoutHide);
  // $element.off('SOCRATA_VISUALIZATION_ROW_INSPECTOR_QUERY', handleRowInspectorQuery);
  // $element.off('SOCRATA_VISUALIZATION_FEATURE_MAP_CENTER_AND_ZOOM_CHANGE', handleMapCenterAndZoomChange);
  $element.off('SOCRATA_VISUALIZATION_INVALIDATE_SIZE', unifiedMapInstance.invalidateSize);
  $element.off('SOCRATA_VISUALIZATION_RENDER_VIF', unifiedMapInstance.onUpdateEvent);
};

$.fn.socrataUnifiedMap.validateVif = function(vif) {
  // TODO: Add validations...
};

module.exports = $.fn.socrataUnifiedMap;
