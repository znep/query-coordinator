import $ from 'jQuery';
import _ from 'lodash';

import '../componentBase';
import Actions from '../Actions';
import Constants from '../Constants';
import StorytellerUtils from '../../StorytellerUtils';
import { storyStore } from '../stores/StoryStore';
import { dispatcher } from '../Dispatcher';
import { flyoutRenderer } from '../FlyoutRenderer';

$.fn.componentSocrataVisualizationTable = componentSocrataVisualizationTable;

export default function componentSocrataVisualizationTable(componentData, theme, options) {
  var $this = $(this);

  StorytellerUtils.assertHasProperty(componentData, 'type');
  StorytellerUtils.assert(
    componentData.type === 'socrata.visualization.table',
    StorytellerUtils.format(
      'componentSocrataVisualizationTable: Tried to render type: {0}',
      componentData.type
    )
  );

  if ($this.children().length === 0) {
    _renderTemplate($this, componentData, options);
  }

  _updateVisualization($this, componentData);
  $this.componentBase(componentData, theme, _.extend(
    {
      resizeSupported: true,
      resizeOptions: {
        minHeight: Constants.MINIMUM_COMPONENT_HEIGHTS_PX.VISUALIZATION
      },
      defaultHeight: Constants.DEFAULT_TABLE_HEIGHT
    },
    options
  ));

  return $this;
}

function _renderTemplate($element, componentData, options) {
  var $componentContent = $('<div>', { class: 'component-content' });

  StorytellerUtils.assertHasProperty(componentData, 'type');

  $element.
    addClass(StorytellerUtils.typeToClassNameForComponentType(componentData.type)).
    // Pass on the destroy event to plugin.
    on('destroy', function() { $componentContent.triggerHandler('destroy'); }).
    on('SOCRATA_VISUALIZATION_FLYOUT', function(event) {
      var payload = event.originalEvent.detail;

      if (payload !== null) {
        flyoutRenderer.render(payload);
      } else {
        flyoutRenderer.clear();
      }
    });

  if (_.get(options, 'editMode')) {

    $element.on('SOCRATA_VISUALIZATION_VIF_UPDATED', function(event) {
      var newVif = event.originalEvent.detail;
      var blockId = StorytellerUtils.findClosestAttribute(this, 'data-block-id');
      var componentIndex = parseInt(
        StorytellerUtils.findClosestAttribute(this, 'data-component-index'),
        10
      );
      var newValue;

      StorytellerUtils.assertIsOneOfTypes(blockId, 'string');
      StorytellerUtils.assert(_.isFinite(componentIndex));

      var blockComponent = storyStore.getBlockComponentAtIndex(blockId, componentIndex);

      newValue = _.cloneDeep(componentData.value);
      newValue.vif = newVif;

      if (_.has(blockComponent, 'value.layout.height') && _.isFinite(blockComponent.value.layout.height)) {
        newValue.layout = newValue.layout || {};
        newValue.layout.height = blockComponent.value.layout.height;
      }

      if (!_.isEqual(newValue, componentData.value)) {
        dispatcher.dispatch({
          action: Actions.BLOCK_UPDATE_COMPONENT,
          blockId: blockId,
          componentIndex: componentIndex,
          type: componentData.type,
          value: newValue
        });
      }
    });
  }

  $element.append($componentContent);
}

function _updateVisualization($element, componentData) {
  var $componentContent = $element.find('.component-content');
  var renderedVif = JSON.parse($element.attr('data-rendered-vif') || '{}');
  var vif;

  function getVifType(vifToCheck) {
    var version = _.get(vifToCheck, 'format.version', 1);
    var type;

    if (version === 2) {
      type = _.get(vifToCheck, 'series[0].type');
    } else {
      type = _.get(vifToCheck, 'type');
    }

    return type;
  }

  StorytellerUtils.assertHasProperty(componentData, 'value.vif');
  vif = componentData.value.vif;

  $element.attr('data-rendered-vif', JSON.stringify(vif));

  // If both the previously-rendered and the new vifs are for tables, we can
  // just attempt to render the new vif and the table implementation should
  // do the right thing.
  if (getVifType(renderedVif) === 'table' && getVifType(vif) === 'table') {

    $componentContent[0].dispatchEvent(
      new CustomEvent(
        'SOCRATA_VISUALIZATION_RENDER_VIF',
        {
          detail: vif
        }
      )
    );
  // Otherwise, we should destroy whatever used to be in the component and
  // create a new table in its place.
  } else {

    // Use triggerHandler since we don't want this to bubble
    $componentContent.triggerHandler('SOCRATA_VISUALIZATION_DESTROY');
    $componentContent.socrataTable(vif);
  }
}
