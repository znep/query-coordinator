import $ from 'jquery';
import _ from 'lodash';

import './StorytellerJQueryUtils';

var CACHE_ATTRIBUTE_NAME = 'data-layout-height';

/**
 * Applies `value.layout.height` from componentData to the selection.
 * If the height was changed, trigger `invalidateSize` on any children
 * of class `component-content`.
 *
 * If `value.layout.height` is not defined, defaultHeight is used. If
 * defaultHeight is not provided or is blank, the height is removed and
 * the component will be allowed to layout normally.
 *
 * @param {object} componentData - The component's data blob from the database.
 * @param {number} defaultHeight - Optional. The default height.
 */
$.fn.withLayoutHeightFromComponentData = withLayoutHeightFromComponentData;

export default function withLayoutHeightFromComponentData(componentData, defaultHeight) {
  var self = this;
  var height = _.get(
    componentData,
    'value.layout.height',
    _.isFinite(defaultHeight) ? defaultHeight : ''
  );

  this.updateAttributeWithCallbackIfChanged(
    CACHE_ATTRIBUTE_NAME,
    String(height),
    function() {
      var renderedVif = self[0].getAttribute('data-rendered-vif');

      self.outerHeight(height);

      if (renderedVif === null) {
        // If there is no `data-rendered-vif` attribute on the element, then
        // we should use the 'invalidateSize' handler.
        self.find('.component-content').triggerHandler('invalidateSize');
      } else {
        // Otherwise, use the standard invalidate size API used by
        // visualizations.
        self.find('.component-content').triggerHandler('SOCRATA_VISUALIZATION_INVALIDATE_SIZE');
      }
    }
  );

  return this;
}
