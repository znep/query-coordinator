import $ from 'jQuery';
import _ from 'lodash';

import '../componentBase';
import Constants from '../Constants';
import StorytellerUtils from '../../StorytellerUtils';
import { flyoutRenderer } from '../FlyoutRenderer';

$.fn.componentSocrataVisualizationHistogram = componentSocrataVisualizationHistogram;

export default function componentSocrataVisualizationHistogram(componentData, theme, options) {
  var $this = $(this);

  StorytellerUtils.assertHasProperty(componentData, 'type');
  StorytellerUtils.assert(
    componentData.type === 'socrata.visualization.histogram',
    StorytellerUtils.format(
      'componentSocrataVisualizationHistogram: Tried to render type: {0}',
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
  var $componentContent = $('<div>', { class: 'component-content' });

  StorytellerUtils.assertHasProperty(componentData, 'type');

  $element.
    addClass(className).
    on('destroy', function() { $componentContent.triggerHandler('SOCRATA_VISUALIZATION_DESTROY'); }).
    on('SOCRATA_VISUALIZATION_FLYOUT', function(event) {
      var payload = event.originalEvent.detail;

      if (payload !== null) {
        flyoutRenderer.render(payload);
      } else {
        flyoutRenderer.clear();
      }
    });

  $element.append($componentContent);
}

function _updateVisualization($element, componentData) {
  StorytellerUtils.assertHasProperty(componentData, 'value.vif');

  var $componentContent = $element.find('.component-content');
  var renderedVif = $element.attr('data-rendered-vif') || '{}';
  var vif = componentData.value.vif;
  var areNotEquivalent = !StorytellerUtils.vifsAreEquivalent(JSON.parse(renderedVif), vif);

  if (areNotEquivalent) {
    $element.attr('data-rendered-vif', JSON.stringify(vif));

    if (!vif.unit) {
      vif.unit = {
        one: 'record',
        other: 'records'
      };
    }

    // Use triggerHandler since we don't want this to bubble
    $componentContent.triggerHandler('SOCRATA_VISUALIZATION_DESTROY');
    $componentContent.socrataSvgHistogram(vif);
  }
}
