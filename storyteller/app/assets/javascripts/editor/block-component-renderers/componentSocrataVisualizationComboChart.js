import $ from 'jquery';
import _ from 'lodash';

import '../componentBase';
import Constants from '../Constants';
import StorytellerUtils from 'StorytellerUtils';
import { vifsAreEquivalent } from 'VifUtils';
import { assert, assertHasProperty } from 'common/js_utils';
import { flyoutRenderer } from '../FlyoutRenderer';

$.fn.componentSocrataVisualizationComboChart = componentSocrataVisualizationComboChart;

export default function componentSocrataVisualizationComboChart(props) {
  props = _.extend({}, props, {
    resizeSupported: true,
    resizeOptions: {
      minHeight: Constants.MINIMUM_COMPONENT_HEIGHTS_PX.VISUALIZATION
    }
  });

  const $this = $(this);

  assertHasProperty(props, 'componentData.type');
  assert(
    props.componentData.type === 'socrata.visualization.comboChart',
    `componentSocrataVisualizationComboChart: Unsupported component type ${props.componentData.type}`
  );

  if ($this.children().length === 0) {
    _renderTemplate($this, props);
  }

  _updateVisualization($this, props);
  $this.componentBase(props);

  return $this;
}

function _renderTemplate($element, props) {
  const { componentData } = props;
  const className = StorytellerUtils.typeToClassNameForComponentType(componentData.type);
  const $componentContent = $('<div>', { class: 'component-content' });
  const flyoutEvent = 'SOCRATA_VISUALIZATION_FLYOUT';

  assertHasProperty(componentData, 'type');

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
  const renderedVif = $element.attr('data-rendered-vif') || '{}';
  const vif = componentData.value.vif;
  const areNotEquivalent = !vifsAreEquivalent(JSON.parse(renderedVif), vif);

  if (areNotEquivalent) {
    $element.attr('data-rendered-vif', JSON.stringify(vif));

    vif.unit = {
      one: 'record',
      other: 'records'
    };

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
    $componentContent.socrataSvgComboChart(vif, { displayFilterBar: true });
  }
}
