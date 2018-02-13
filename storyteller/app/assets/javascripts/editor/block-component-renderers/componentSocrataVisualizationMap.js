import $ from 'jquery';
import _ from 'lodash';

import '../componentBase';
import '../componentWithMapBounds';
import Constants from '../Constants';
import StorytellerUtils from 'StorytellerUtils';
import { updateVifWithFederatedFromDomain, vifsAreEquivalent } from 'VifUtils';
import { assert, assertHasProperty, parseJsonOrEmpty } from 'common/js_utils';
import { flyoutRenderer } from '../FlyoutRenderer';

$.fn.componentSocrataVisualizationMap = componentSocrataVisualizationMap;

export default function componentSocrataVisualizationMap(props) {
  props = _.extend({}, props, {
    resizeSupported: true,
    resizeOptions: {
      minHeight: Constants.MINIMUM_COMPONENT_HEIGHTS_PX.VISUALIZATION
    }
  });

  const $this = $(this);
  const { componentData, editMode } = props;

  assertHasProperty(props, 'componentData.type');
  assert(
    props.componentData.type === 'socrata.visualization.map',
    `componentSocrataVisualizationMap: Unsupported component type ${props.componentData.type}`
  );

  if ($this.children().length === 0) {
    _renderTemplate($this, componentData);
  }

  if (editMode) {
    $this.componentWithMapBounds(componentData);
  }

  _updateVisualization($this, props);
  $this.componentBase(props);

  return $this;
}

function _renderTemplate($element, componentData) {
  assertHasProperty(componentData, 'type');

  const className = StorytellerUtils.typeToClassNameForComponentType(componentData.type);
  const $componentContent = $('<div>', { class: 'component-content' });
  const flyoutEvent = 'SOCRATA_VISUALIZATION_FLYOUT';

  $element.
    addClass(className).
    on('destroy', () => { $componentContent.triggerHandler('destroy'); }).
    on(flyoutEvent, (event) => {
      // TODO: Flyouts will/should be handled on the mouse interaction story.
      const payload = event.originalEvent.detail;

      if (payload !== null) {
        flyoutRenderer.render(payload);
      } else {
        flyoutRenderer.clear();
      }
    });

  $element.append($componentContent);
}

function _updateVisualization($element, props) {
  assertHasProperty(props, 'componentData.value.vif');

  const { componentData } = props;
  const renderedVif = $element.attr('data-rendered-vif');
  const $componentContent = $element.find('.component-content');
  const federatedFromDomain = _.get(componentData, 'value.dataset.federatedFromDomain');

  let vif = componentData.value.vif;
  vif = updateVifWithFederatedFromDomain(vif, federatedFromDomain);

  const areNotEquivalent = !vifsAreEquivalent(parseJsonOrEmpty(renderedVif), vif);
  if (areNotEquivalent) {
    $element.attr('data-rendered-vif', JSON.stringify(vif));

    // If it looks like the map has already been rendered once, we can just update it instead of
    // destroying it and rendering from scratch
    const isMap = _.isEqual(_.get(vif, 'series[0].type'), 'map');
    if (isMap && $componentContent.find('canvas').length > 0) {
      $componentContent[0].dispatchEvent(
        new CustomEvent('SOCRATA_VISUALIZATION_RENDER_VIF', { detail: vif })
      );
    // Otherwise, we should destroy whatever used to be in the component and
    // create a new map in its place.
    } else {

      // Use triggerHandler since we don't want this to bubble
      $componentContent.triggerHandler('SOCRATA_VISUALIZATION_DESTROY');
      $componentContent.socrataUnifiedMap(vif, { displayFilterBar: true });
    }
  }
}
