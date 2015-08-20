(function (root, $) {

  'use strict';

  var socrata = root.socrata;
  var utils = socrata.utils;

  function _renderEmbedWizard($element) {

    var $controlsInsertButton;
    var $controlsContainer;

    $element.
      addClass('embed').
      addClass('wizard').
      attr('data-rendered-media-type', 'embed').
      attr('data-rendered-media-embed-provider', 'wizard');

    $controlsInsertButton = $(
      '<button>',
      {
        'class': 'btn accent-btn media-component-embed-wizard-insert-btn',
        'data-embed-action': Constants.EMBED_WIZARD_CHOOSE_PROVIDER
      }
    ).text(I18n.t('editor.components.media.embed_wizard_insert_btn'));

    $controlsContainer = $(
      '<div>',
      {
        'class': 'media-component-embed-wizard-container'
      }
    ).append($controlsInsertButton);

    $element.append($controlsContainer);
  }

  function storytellerComponentMediaEmbedWizard(componentData) {
    var $self = $(this);

    utils.assertHasProperty(componentData, 'type');
    utils.assertHasProperty(componentData, 'value');
    utils.assertHasProperty(componentData.value, 'type');

    if (componentData.value.value.provider !== 'wizard') {
      throw new Error('storytellerComponentMediaEmbedWizard: Unsupported componentData {0}'.format(
            componentData
      ));
    }

    if ($self.children().length === 0) {
      _renderEmbedWizard($self);
    }

    return $self;
  }

  $.fn.storytellerComponentMediaEmbedWizard = storytellerComponentMediaEmbedWizard;
})(window, jQuery);
