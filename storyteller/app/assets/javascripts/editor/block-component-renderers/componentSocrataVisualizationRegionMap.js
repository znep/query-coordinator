import $ from 'jquery';
import _ from 'lodash';

import '../componentBase';
import '../componentWithMapBounds';
import Constants from '../Constants';
import StorytellerUtils from '../../StorytellerUtils';
import { flyoutRenderer } from '../FlyoutRenderer';

// Note that this component supports both socrata.visualization.regionMap and socrata.visualization.choroplethMap.
$.fn.componentSocrataVisualizationRegionMap = componentSocrataVisualizationRegionMap;

export default function componentSocrataVisualizationRegionMap(props) {
  props = _.extend({}, props, {
    resizeSupported: true,
    resizeOptions: {
      minHeight: Constants.MINIMUM_COMPONENT_HEIGHTS_PX.VISUALIZATION
    }
  });

  const $this = $(this);
  const { componentData } = props;

  StorytellerUtils.assertHasProperty(componentData, 'type');
  StorytellerUtils.assert(
    componentData.type === 'socrata.visualization.regionMap' ||
    componentData.type === 'socrata.visualization.choroplethMap',
    `componentSocrataVisualizationRegionMap: Unsupported component type ${componentData.type}`
  );

  if ($this.children().length === 0) {
    _renderTemplate($this, props);
  }

  _updateVisualization($this, componentData);
  $this.componentBase(props);

  return $this;
}

function _renderTemplate($element, props) {
  const { componentData, editMode } = props;

  StorytellerUtils.assertHasProperty(componentData, 'type');

  const $componentContent = $('<div>', { class: 'component-content' });
  const className = StorytellerUtils.typeToClassNameForComponentType(componentData.type);
  const flyoutEvent = 'SOCRATA_VISUALIZATION_FLYOUT';

  $element.
    addClass(className).
    on('destroy', () => { $componentContent.triggerHandler('destroy'); }).
    on(flyoutEvent, (event) => {
      const payload = event.originalEvent.detail;

      if (payload !== null) {
        flyoutRenderer.render(payload);
      } else {
        flyoutRenderer.clear();
      }
    });

  if (editMode) {
    $element.componentWithMapBounds(componentData);
  }

  $element.append($componentContent);
}

function _updateVisualization($element, componentData) {
  StorytellerUtils.assertHasProperty(componentData, 'value.vif');

  const $componentContent = $element.find('.component-content');
  const renderedVif = $element.attr('data-rendered-vif') || '{}';
  const vif = componentData.value.vif;
  const areNotEquivalent = !StorytellerUtils.vifsAreEquivalent(JSON.parse(renderedVif), vif);

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

    // If it looks like the map has already been rendered once, we can just update it instead of
    // destroying it and rendering from scratch
    const isRegionMap = _.includes(['regionMap', 'choroplethMap'], _.get(vif, 'series[0].type'));
    if (isRegionMap && $componentContent.find('svg').length > 0) {
      $componentContent[0].dispatchEvent(
        new CustomEvent('SOCRATA_VISUALIZATION_RENDER_VIF', { detail: vif })
      );
    // Otherwise, we should destroy whatever used to be in the component and
    // create a new feature map in its place.
    } else {
      // Use triggerHandler since we don't want this to bubble
      $componentContent.triggerHandler('SOCRATA_VISUALIZATION_DESTROY');
      $componentContent.socrataSvgRegionMap(vif);
    }
  }
}
