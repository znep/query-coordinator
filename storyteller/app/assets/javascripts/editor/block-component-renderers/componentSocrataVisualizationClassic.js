import $ from 'jquery';
import _ from 'lodash';

import '../componentBase';
import Constants from '../Constants';
import StorytellerUtils from '../../StorytellerUtils';
import { assert, assertInstanceOf, assertHasProperties, assertHasProperty } from 'common/js_utils';

const COMPONENT_VALUE_CACHE_ATTR_NAME = 'classic-visualization-component-value';

$.fn.componentSocrataVisualizationClassic = componentSocrataVisualizationClassic;

export default function componentSocrataVisualizationClassic(props) {
  props = _.extend({}, props, {
    resizeSupported: true,
    resizeOptions: {
      minHeight: Constants.MINIMUM_COMPONENT_HEIGHTS_PX.VISUALIZATION
    }
  });

  const $this = $(this);
  let { componentData } = props;

  assertHasProperties(componentData, 'type');
  assert(
    componentData.type === 'socrata.visualization.classic',
    `componentSocrataVisualizationClassic: Unsupported component type ${componentData.type}`
  );
  assertHasProperty(componentData, 'value.visualization');

  componentData = _.cloneDeep(componentData);
  _.set(componentData, 'value.visualization.displayFormat.disableZoomWheel', true);

  if ($this.children().length === 0) {
    _renderVisualization($this, componentData);
  } else {
    _updateVisualization($this, componentData);
  }

  $this.componentBase(props);

  return $this;
}

function _renderVisualization($element, componentData) {
  assertHasProperty(componentData, 'type');

  const className = StorytellerUtils.typeToClassNameForComponentType(componentData.type);
  const $iframeElement = $(
    '<iframe>',
    {
      'src': '/component/visualization/v0/show',
      'frameborder': '0',
      'allowfullscreen': true
    }
  );

  $iframeElement.one('load', () => {
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

  const $iframe = $element.find('iframe');
  const oldValue = $iframe.data(COMPONENT_VALUE_CACHE_ATTR_NAME);
  const newValue = componentData.value.visualization;

  assertInstanceOf($iframe, $);

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
