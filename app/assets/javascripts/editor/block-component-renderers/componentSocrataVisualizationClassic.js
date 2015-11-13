(function(root, $) {

  'use strict';

  var socrata = root.socrata;
  var utils = socrata.utils;

  function _renderVisualization($element, componentData) {

    utils.assertHasProperty(componentData, 'type');

    var $iframeElement = $(
      '<iframe>',
      {
        'src': '/component/visualization/v0/show',
        'frameborder': '0',
        'allowfullscreen': true
      }
    );

    $iframeElement.one('load', function() {
      _updateVisualization($element, componentData);
    });

    $element.
      addClass(utils.typeToClassNameForComponentType(componentData.type)).
      append($iframeElement);
  }

  function _updateVisualization($element, componentData) {

    var $iframe = $element.find('iframe');

    utils.assertInstanceOf($iframe, jQuery);

    // This guard is to wait for loading.
    // The iframe load event above should invoke _updateVisualization again.
    if (_.isFunction($iframe[0].contentWindow.renderVisualization)) {

      // Don't re-render if we've already rendered this visualization.
      if ($iframe.data('classic-visualization') !== componentData.value.visualization) {
        $iframe.data('classic-visualization', componentData.value.visualization);

        // The iframe we're using goes to a frontend endpoint: /component/visualization/v0/show.
        // This endpoint contains a function on window called renderVisualization.
        // renderVisualization kicks off a classic visualization rendering using a view
        // metadata object. See the frontend implementation for more information.
        $iframe[0].contentWindow.renderVisualization(componentData.value.visualization);
      }
    }
  }

  function componentSocrataVisualizationClassic(componentData, theme, options) {

    var $this = $(this);

    utils.assertHasProperties(componentData, 'type');
    utils.assert(
      componentData.type === 'socrata.visualization.classic',
      'componentSocrataVisualizationClassic: Unsupported component type {0}'.format(
        componentData.type
      )
    );
    utils.assertHasProperty(componentData, 'value.visualization');

    if ($this.children().length === 0) {
      _renderVisualization($this, componentData);
    } else {
      _updateVisualization($this, componentData);
    }

    $this.componentEditButton();
    $this.toggleClass('editing', _.get(options, 'editMode', false));

    return $this;
  }

  $.fn.componentSocrataVisualizationClassic = componentSocrataVisualizationClassic;
})(window, jQuery);
