(function(root, $) {

  'use strict';

  var socrata = root.socrata;
  var utils = socrata.utils;
  var storyteller = socrata.storyteller;

  function componentEditButton(componentData, theme, options) {
    var $this = $(this);
    var $editControls = $this.find('.component-edit-controls');
    var isEditModeEnabled = _.get(options, 'editMode');

    if (isEditModeEnabled) {
      if ($editControls.length === 0) {
        $editControls = $('<div>', { 'class': 'component-edit-controls' }).
          append(
            $('<button>', { 'class': 'component-edit-controls-edit-btn' }).
            click(_handleClick).
            text(I18n.t('editor.components.edit_controls.button'))
          );

        $this.append($editControls);
      }
    } else {
      $editControls.remove();
    }
    return $this;
  }

  function _handleClick() {
    var blockId = utils.findClosestAttribute(this, 'data-block-id');
    var componentIndex = parseInt(
      utils.findClosestAttribute(this, 'data-component-index'),
      10);

    utils.assertIsOneOfTypes(blockId, 'string');
    utils.assert(_.isFinite(componentIndex));

    storyteller.dispatcher.dispatch({
      action: Actions.ASSET_SELECTOR_UPDATE_COMPONENT,
      blockId: blockId,
      componentIndex: componentIndex
    });
  }

  $.fn.componentEditButton = componentEditButton;
})(window, jQuery);
