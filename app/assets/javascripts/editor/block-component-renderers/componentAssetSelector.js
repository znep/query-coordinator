(function(root, $) {

  'use strict';

  var socrata = root.socrata;
  var utils = socrata.utils;

  function _renderSelector($element, componentData) {

    var $controlsInsertButton;

    $element.addClass(utils.typeToClassNameForComponentType(componentData.type));

    $controlsInsertButton = $(
      '<button>',
      {
        'class': 'btn btn-primary asset-selector-insert-btn',
        'data-action': Actions.ASSET_SELECTOR_CHOOSE_PROVIDER
      }
    ).text(I18n.t('editor.components.asset_selector.insert_btn'));

    $element.append($controlsInsertButton);
  }

  function componentAssetSelector(componentData) {
    var $this = $(this);

    utils.assertHasProperties(componentData, 'type');
    utils.assert(
      componentData.type === 'assetSelector',
      'componentAssetSelector: Unsupported component type {0}'.format(
        componentData.type
      )
    );

    if ($this.children().length === 0) {
      _renderSelector($this, componentData);
    }

    return $this;
  }

  $.fn.componentAssetSelector = componentAssetSelector;
})(window, jQuery);
