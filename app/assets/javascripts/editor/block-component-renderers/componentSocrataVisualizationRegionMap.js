import $ from 'jQuery';
import _ from 'lodash';

import '../componentBase';
import Constants from '../Constants';
import StorytellerUtils from '../../StorytellerUtils';
import { flyoutRenderer } from '../FlyoutRenderer';

// Note that this component supports both socrata.visualization.regionMap and socrata.visualization.choroplethMap.
$.fn.componentSocrataVisualizationRegionMap = componentSocrataVisualizationRegionMap;

export default function componentSocrataVisualizationRegionMap(componentData, theme, options) {
  var $this = $(this);

  StorytellerUtils.assertHasProperty(componentData, 'type');
  StorytellerUtils.assert(
    componentData.type === 'socrata.visualization.regionMap' ||
    componentData.type === 'socrata.visualization.choroplethMap',
    StorytellerUtils.format(
      'componentSocrataVisualizationRegionMap: Tried to render type: {0}',
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
  StorytellerUtils.assertHasProperty(componentData, 'type');

  var $componentContent = $('<div>', { class: 'component-content' });
  var className = StorytellerUtils.typeToClassNameForComponentType(componentData.type);
  var flyoutEvent = 'SOCRATA_VISUALIZATION_FLYOUT';

  $element.
    addClass(className).
    on('destroy', function() { $componentContent.triggerHandler('destroy'); }).
    on(flyoutEvent, function(event) {
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
    $componentContent.socrataSvgRegionMap(vif);
  }
}
