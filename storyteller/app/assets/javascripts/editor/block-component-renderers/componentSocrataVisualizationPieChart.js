import $ from 'jquery';
import _ from 'lodash';

import '../componentBase';
import Constants from '../Constants';
import StorytellerUtils from '../../StorytellerUtils';
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

  StorytellerUtils.assertHasProperty(props, 'componentData.type');
  StorytellerUtils.assert(
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
  StorytellerUtils.assertHasProperty(props, 'componentData.type');

  const { componentData } = props;
  const className = StorytellerUtils.typeToClassNameForComponentType(componentData.type);
  const flyoutEvent = 'SOCRATA_VISUALIZATION_FLYOUT';

  $element.
    addClass(className).
    on('destroy', () => { $element.triggerHandler('SOCRATA_VISUALIZATION_DESTROY'); }).
    on(flyoutEvent, (event) => {
      const payload = event.originalEvent.detail;

      if (payload !== null) {
        flyoutRenderer.render(payload);
      } else {
        flyoutRenderer.clear();
      }
    });
}

function _updateVisualization($element, props) {
  StorytellerUtils.assertHasProperty(props, 'componentData.value.vif');

  const { componentData, editMode } = props;
  const vif = componentData.value.vif;

  $element.attr('data-rendered-vif', JSON.stringify(vif));

  vif.unit = {
    one: 'record',
    other: 'records'
  };

  if ($element.find('.pie-chart').length) {
    $element[0].dispatchEvent(
      new CustomEvent(
        'SOCRATA_VISUALIZATION_RENDER_VIF',
        {
          detail: vif
        }
      )
    );
  } else {
    // Use triggerHandler since we don't want this to bubble
    $element.triggerHandler('SOCRATA_VISUALIZATION_DESTROY');
    $element.socrataSvgPieChart(vif, { displayFilterBar: !editMode });
  }
}
