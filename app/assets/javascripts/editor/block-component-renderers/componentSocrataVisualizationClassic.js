import $ from 'jQuery';
import _ from 'lodash';

import '../componentBase';
import Constants from '../Constants';
import StorytellerUtils from '../../StorytellerUtils';

var COMPONENT_VALUE_CACHE_ATTR_NAME = 'classic-visualization-component-value';

$.fn.componentSocrataVisualizationClassic = componentSocrataVisualizationClassic;

export default function componentSocrataVisualizationClassic(componentData, theme, options) {
  var $this = $(this);

  StorytellerUtils.assertHasProperties(componentData, 'type');
  StorytellerUtils.assert(
    componentData.type === 'socrata.visualization.classic',
    StorytellerUtils.format(
      'componentSocrataVisualizationClassic: Unsupported component type {0}',
      componentData.type
    )
  );
  StorytellerUtils.assertHasProperty(componentData, 'value.visualization');

  if ($this.children().length === 0) {
    _renderVisualization($this, componentData);
  } else {
    _updateVisualization($this, componentData);
  }

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

function _renderVisualization($element, componentData) {
  StorytellerUtils.assertHasProperty(componentData, 'type');

  var className = StorytellerUtils.typeToClassNameForComponentType(componentData.type);
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

    $element[0].dispatchEvent(
      new CustomEvent(
        'component::visualization-loaded',
        { detail: {}, bubbles: true }
      )
    );
  });

  $element.
    addClass(className).
    append($iframeElement);
}

function _updateVisualization($element, componentData) {

  var $iframe = $element.find('iframe');
  var oldValue = $iframe.data(COMPONENT_VALUE_CACHE_ATTR_NAME);
  var newValue = componentData.value.visualization;

  StorytellerUtils.assertInstanceOf($iframe, $);

  // This guard is to wait for loading.
  // The iframe load event above should invoke _updateVisualization again.
  if (_.isFunction($iframe[0].contentWindow.renderVisualization)) {

    // Don't re-render if we've already rendered this visualization.
    if (!_.isEqual(oldValue, newValue)) {
      $iframe.data(COMPONENT_VALUE_CACHE_ATTR_NAME, componentData.value.visualization);

      // The iframe we're using goes to a frontend endpoint: /component/visualization/v0/show.
      // This endpoint contains a function on window called renderVisualization.
      // renderVisualization kicks off a classic visualization rendering using a view
      // metadata object. See the frontend implementation for more information.
      $iframe[0].contentWindow.renderVisualization(componentData.value.visualization);
    }
  }
}
