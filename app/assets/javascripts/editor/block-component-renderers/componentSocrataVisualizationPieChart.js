import $ from 'jQuery';
import _ from 'lodash';

import '../componentBase';
import I18n from '../I18n';
import Constants from '../Constants';
import StorytellerUtils from '../../StorytellerUtils';
import { flyoutRenderer } from '../FlyoutRenderer';

$.fn.componentSocrataVisualizationPieChart = componentSocrataVisualizationPieChart;

export default function componentSocrataVisualizationPieChart(componentData, theme, options) {
  var $this = $(this);

  StorytellerUtils.assertHasProperty(componentData, 'type');
  StorytellerUtils.assert(
    componentData.type === 'socrata.visualization.pieChart',
    StorytellerUtils.format(
      'componentSocrataVisualizationPieChart: Tried to render type: {0}',
      componentData.type
    )
  );

  if ($this.children().length === 0) {
    _renderTemplate($this, componentData);
  }

  _updateVisualization($this, componentData);
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

function _renderTemplate($element, componentData) {
  var className = StorytellerUtils.typeToClassNameForComponentType(componentData.type);
  var flyoutEvent = 'SOCRATA_VISUALIZATION_FLYOUT';

  StorytellerUtils.assertHasProperty(componentData, 'type');

  $element.
    addClass(className).
    on('destroy', function() { $element.triggerHandler('SOCRATA_VISUALIZATION_DESTROY'); }).
    on(flyoutEvent, function(event) {
      var payload = event.originalEvent.detail;

      if (payload !== null) {
        flyoutRenderer.render(payload);
      } else {
        flyoutRenderer.clear();
      }
    });
}

function _updateVisualization($element, componentData) {
  StorytellerUtils.assertHasProperty(componentData, 'value.vif');

  var vif = componentData.value.vif;

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
    $element.socrataSvgPieChart(vif);
  }
}
