import $ from 'jQuery';

import I18n from '../I18n';
import Actions from '../Actions';
import StorytellerUtils from '../../StorytellerUtils';

$.fn.componentAssetSelector = componentAssetSelector;

export default function componentAssetSelector(componentData) {
  var $this = $(this);

  StorytellerUtils.assertHasProperties(componentData, 'type');
  StorytellerUtils.assert(
    componentData.type === 'assetSelector',
    StorytellerUtils.format(
      'componentAssetSelector: Unsupported component type {0}',
      componentData.type
    )
  );

  if ($this.children().length === 0) {
    _renderSelector($this, componentData);
  }

  return $this;
}

function _renderSelector($element, componentData) {
  var $controlsInsertButton;
  var className = StorytellerUtils.typeToClassNameForComponentType(componentData.type);

  $element.addClass(className);
  $element.attr('data-action', Actions.ASSET_SELECTOR_SELECT_ASSET_FOR_COMPONENT);

  $controlsInsertButton = $(
    '<button>',
    {
      'class': 'btn-primary asset-selector-insert-btn'
    }
  ).text(I18n.t('editor.components.asset_selector.insert_btn'));

  $element.append($controlsInsertButton);
}
