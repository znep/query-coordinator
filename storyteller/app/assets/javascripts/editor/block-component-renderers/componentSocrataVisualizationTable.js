import $ from 'jquery';
import _ from 'lodash';

import '../componentBase';
import Actions from '../Actions';
import Constants from '../Constants';
import StorytellerUtils from '../../StorytellerUtils';
import { assert, assertHasProperty, parseJsonOrEmpty } from 'common/js_utils';
import { storyStore } from '../stores/StoryStore';
import { dispatcher } from '../Dispatcher';
import { flyoutRenderer } from '../FlyoutRenderer';
import { updateVifWithFederatedFromDomain } from 'VifUtils';

$.fn.componentSocrataVisualizationTable = componentSocrataVisualizationTable;

export default function componentSocrataVisualizationTable(props) {
  props = _.extend({}, props, {
    resizeSupported: true,
    resizeOptions: {
      minHeight: Constants.MINIMUM_COMPONENT_HEIGHTS_PX.VISUALIZATION
    },
    defaultHeight: Constants.DEFAULT_TABLE_HEIGHT
  });

  const $this = $(this);
  const { componentData } = props;

  assertHasProperty(componentData, 'type');
  assert(
    componentData.type === 'socrata.visualization.table',
    `componentSocrataVisualizationTable: Unsupported component type ${componentData.type}`
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
  const $componentContent = $('<div>', { class: 'component-content' });

  assertHasProperty(componentData, 'type');

  $element.
    addClass(StorytellerUtils.typeToClassNameForComponentType(componentData.type)).
    // Pass on the destroy event to plugin.
    on('destroy', () => { $componentContent.triggerHandler('destroy'); }).
    on('SOCRATA_VISUALIZATION_FLYOUT', (event) => {
      const payload = event.originalEvent.detail;

      if (payload !== null) {
        flyoutRenderer.render(payload);
      } else {
        flyoutRenderer.clear();
      }
    });

  if (editMode) {

    $element.on('SOCRATA_VISUALIZATION_VIF_UPDATED', function(event) {
      let newValue;
      const newVif = event.originalEvent.detail;
      const { blockId, componentIndex } = StorytellerUtils.findBlockIdAndComponentIndex(this);
      const blockComponent = storyStore.getBlockComponentAtIndex(blockId, componentIndex);

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
  let vif;
  const $componentContent = $element.find('.component-content');
  const renderedVif = parseJsonOrEmpty($element.attr('data-rendered-vif'));

  function getVifType(vifToCheck) {
    let type;
    const version = _.get(vifToCheck, 'format.version', 1);

    if (version === 2) {
      type = _.get(vifToCheck, 'series[0].type');
    } else {
      type = _.get(vifToCheck, 'type');
    }

    return type;
  }

  assertHasProperty(componentData, 'value.vif');
  vif = componentData.value.vif;
  const federatedFromDomain = _.get(componentData, 'value.dataset.federatedFromDomain');

  vif = updateVifWithFederatedFromDomain(vif, federatedFromDomain);

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
