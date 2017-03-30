import _ from 'lodash';
import $ from 'jquery';

import I18n from '../I18n';
import Actions from '../Actions';
import StorytellerUtils from '../../StorytellerUtils';

$.fn.componentAssetSelector = componentAssetSelector;

export default function componentAssetSelector(props) {
  props = _.extend({}, props, { editButtonSupported: false });

  const { componentData } = props;

  StorytellerUtils.assertHasProperties(componentData, 'type');
  StorytellerUtils.assert(
    componentData.type === 'assetSelector',
    `componentAssetSelector: Unsupported component type ${componentData.type}`
  );

  if (this.children().length === 0) {
    _renderSelector(this, componentData);
  }

  this.componentBase(props);

  return this;
}

function _renderSelector($element, componentData) {
  const className = StorytellerUtils.typeToClassNameForComponentType(componentData.type);
  const $controlsInsertButton = $('<button>', {
    class: 'btn btn-primary asset-selector-insert-btn'
  }).text(I18n.t('editor.components.asset_selector.insert_btn'));

  $element.
    addClass(className).
    attr('data-action', Actions.ASSET_SELECTOR_SELECT_ASSET_FOR_COMPONENT).
    append($controlsInsertButton);
}
