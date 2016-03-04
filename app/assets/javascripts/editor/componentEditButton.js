import $ from 'jQuery';
import _ from 'lodash';

import I18n from './I18n';
import Actions from './Actions';
import StorytellerUtils from '../StorytellerUtils';
import { dispatcher } from './Dispatcher';

$.fn.componentEditButton = componentEditButton;

export default function componentEditButton() {
  var $this = $(this);
  var $editControls = $this.find('.component-edit-controls');

  if ($editControls.length === 0) {
    $editControls = $('<div>', { 'class': 'component-edit-controls' }).
      append(
        $('<button>', { 'class': 'component-edit-controls-edit-btn' }).
        click(_handleClick).
        text(I18n.t('editor.components.edit_controls.button'))
      );

    $this.append($editControls);
  }

  return $this;
}

function _handleClick() {
  var blockId = StorytellerUtils.findClosestAttribute(this, 'data-block-id');
  var componentIndex = StorytellerUtils.findClosestAttribute(this, 'data-component-index');
  componentIndex = parseInt(componentIndex, 10);

  StorytellerUtils.assertIsOneOfTypes(blockId, 'string');
  StorytellerUtils.assert(_.isFinite(componentIndex));

  dispatcher.dispatch({
    action: Actions.ASSET_SELECTOR_EDIT_EXISTING_ASSET_EMBED,
    blockId: blockId,
    componentIndex: componentIndex
  });
}
