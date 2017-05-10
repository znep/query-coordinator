import $ from 'jquery';
import _ from 'lodash';

import '../componentBase';
import Constants from '../Constants';
import StorytellerUtils from '../../StorytellerUtils';
import { flyoutRenderer } from '../FlyoutRenderer';

$.fn.componentSocrataVisualizationHistogram = componentSocrataVisualizationHistogram;

export default function componentSocrataVisualizationHistogram(props) {
  props = _.extend({}, props, {
    resizeSupported: true,
    resizeOptions: {
      minHeight: Constants.MINIMUM_COMPONENT_HEIGHTS_PX.VISUALIZATION
    }
  });

  const $this = $(this);

  StorytellerUtils.assertHasProperty(props, 'componentData.type');
  StorytellerUtils.assert(
    props.componentData.type === 'socrata.visualization.histogram',
    `componentSocrataVisualizationHistogram: Unsupported component type ${props.componentData.type}`
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
  const $componentContent = $('<div>', { class: 'component-content' });

  $element.
    addClass(className).
    on('destroy', () => { $componentContent.triggerHandler('SOCRATA_VISUALIZATION_DESTROY'); }).
    on('SOCRATA_VISUALIZATION_FLYOUT', (event) => {
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
  StorytellerUtils.assertHasProperty(props, 'componentData.value.vif');

  const { componentData, editMode } = props;
  const $componentContent = $element.find('.component-content');
  const renderedVif = $element.attr('data-rendered-vif') || '{}';
  const vif = componentData.value.vif;
  const areNotEquivalent = !StorytellerUtils.vifsAreEquivalent(JSON.parse(renderedVif), vif);

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
    $componentContent.socrataSvgHistogram(vif, { displayFilterBar: !editMode });
  }
}
