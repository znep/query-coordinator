(function(root, $) {

  'use strict';

  var CACHE_ATTRIBUTE_NAME = 'data-layout-height';

  /**
   * Applies `value.layout.height` from componentData to the selection.
   * If the height was changed, trigger `invalidateSize` on any children
   * of class `component-content`.
   *
   * If `value.layout.height` is not defined, the height is removed and
   * the component will be allowed to layout normally.
   */
  function withLayoutHeightFromComponentData(componentData) {
    var self = this;
    var height = _.get(componentData, 'value.layout.height', '');

    this.updateAttributeWithCallbackIfChanged(
      CACHE_ATTRIBUTE_NAME,
      String(height),
      function() {
        self.height(height);
        self.find('.component-content').triggerHandler('invalidateSize');
      }
    );

    return this;
  }

  $.fn.withLayoutHeightFromComponentData = withLayoutHeightFromComponentData;
})(window, jQuery);
