(function(root, $) {

  'use strict';

  var socrata = root.socrata;
  var utils = socrata.utils;

  function _renderSelector($element, componentData) {

    var $controlsInsertButton;

    $element.addClass(utils.typeToClassNameForComponentType(componentData.type));
    $element.attr('data-action', Actions.ASSET_SELECTOR_SELECT_ASSET_FOR_COMPONENT);

    $controlsInsertButton = $(
      '<button>',
      {
        'class': 'btn-primary asset-selector-insert-btn'
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
