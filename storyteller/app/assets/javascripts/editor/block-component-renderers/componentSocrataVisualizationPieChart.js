import $ from 'jquery';
import _ from 'lodash';

import '../componentBase';
import Constants from '../Constants';
import StorytellerUtils from 'StorytellerUtils';
import { updateVifWithDefaults, updateVifWithFederatedFromDomain, vifsAreEquivalent } from 'VifUtils';
import { assert, assertHasProperty, parseJsonOrEmpty } from 'common/js_utils';
import { flyoutRenderer } from '../FlyoutRenderer';

$.fn.componentSocrataVisualizationPieChart = componentSocrataVisualizationPieChart;

export default function componentSocrataVisualizationPieChart(props) {
  props = _.extend({}, props, {
    resizeSupported: true,
    resizeOptions: {
      minHeight: Constants.MINIMUM_COMPONENT_HEIGHTS_PX.PIE_CHART
    },
    defaultHeight: Constants.DEFAULT_PIE_CHART_HEIGHT
  });

  const $this = $(this);

  assertHasProperty(props, 'componentData.type');
  assert(
    props.componentData.type === 'socrata.visualization.pieChart',
    `componentSocrataVisualizationPieChart: Unsupported component type ${props.componentData.type}`
  );

  if ($this.children().length === 0) {
    _renderTemplate($this, props);
  }

  _updateVisualization($this, props);
  $this.componentBase(props);

  return $this;
}

function _renderTemplate($element, props) {
  assertHasProperty(props, 'componentData.type');

  const { componentData } = props;
  const className = StorytellerUtils.typeToClassNameForComponentType(componentData.type);
  const $componentContent = $('<div>', { class: 'component-content' });
  const flyoutEvent = 'SOCRATA_VISUALIZATION_FLYOUT';

  $element.
    addClass(className).
    on('destroy', () => { $componentContent.triggerHandler('SOCRATA_VISUALIZATION_DESTROY'); }).
    on(flyoutEvent, (event) => {
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
  const $componentContent = $element.find('.component-content');
  const renderedVif = $element.attr('data-rendered-vif');
  const federatedFromDomain = _.get(componentData, 'value.dataset.federatedFromDomain');

  let vif = componentData.value.vif;
  vif = updateVifWithFederatedFromDomain(vif, federatedFromDomain);

  const areNotEquivalent = !vifsAreEquivalent(parseJsonOrEmpty(renderedVif), vif);
  if (areNotEquivalent) {
    $element.attr('data-rendered-vif', JSON.stringify(vif));

    vif = updateVifWithDefaults(vif);

    // Use triggerHandler since we don't want this to bubble
    $componentContent.triggerHandler('SOCRATA_VISUALIZATION_DESTROY');
    $componentContent.socrataSvgPieChart(vif, { displayFilterBar: true });
  }
}
