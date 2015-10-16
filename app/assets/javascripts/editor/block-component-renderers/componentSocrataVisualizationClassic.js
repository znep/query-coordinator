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

    var iframe = $element.find('iframe')[0];

    utils.assertInstanceOf(iframe, HTMLElement);

    if ($(iframe).data('classic-visualization') !== componentData.value.visualization) {
      iframe.contentWindow.renderVisualization(componentData.value.visualization);
      $(iframe).data('classic-visualization', componentData.value.visualization);
    }
  }

  function componentSocrataVisualizationClassic(componentData) {

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

    return $this;
  }

  $.fn.componentSocrataVisualizationClassic = componentSocrataVisualizationClassic;
})(window, jQuery);
