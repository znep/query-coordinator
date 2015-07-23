;var MediaComponentRenderer = (function() {
 
  'use strict';

  var _componentTemplateRenderers = {
    'image': _renderImageComponentTemplate,
    'embed': _renderEmbedComponentTemplate
  };
  var _componentDataRenderers = {
    'image': _renderImageComponentData,
    'embed': _renderEmbedComponentData
  };

  var _embedComponentTemplateRenderers = {
    'wizard': _renderEmbedWizardComponentTemplate,
  };
  var _embedComponentDataRenderers = {
    'wizard': _renderEmbedWizardComponentData,
  };

  function _renderTemplate(componentOptions) {

    var type;

    Util.assertHasProperty(componentOptions, 'componentType');
    Util.assertEqual(componentOptions.componentType, 'media');
    Util.assertHasProperty(componentOptions, 'componentValue');
    Util.assertHasProperty(componentOptions.componentValue, 'type');

    type = componentOptions.componentValue.type;

    Util.assertHasProperty(_componentTemplateRenderers, type);

    return _componentTemplateRenderers[type](
      componentOptions
    );
  }

  function _renderData(element, data, editable, renderFn) {

    var type;
    var value;

    Util.assertHasProperty(data, 'value');
    Util.assertHasProperty(data.value, 'type');
    Util.assertHasProperty(data.value, 'value');
    Util.assertIsOneOfTypes(renderFn, 'function');

    type = data.value.type;
    value = data.value.value;

    Util.assertHasProperty(_componentDataRenderers, type);

    _componentDataRenderers[type](
      element,
      value,
      editable,
      renderFn
    );
  }

  /**
   * Component template renderers
   */

  function _renderImageComponentTemplate(componentOptions) {

    var classes;

    Util.assertHasProperty(componentOptions, 'classes');

    classes = componentOptions.classes + ' image';

    return $(
      '<div>',
      {
        class: classes,
        'data-rendered-template': 'media',
        'data-rendered-media-type': 'image'
      }
    ).append(
      $('<img>', { src: 'about:blank' })
    );
  }

  function _renderEmbedComponentTemplate(componentOptions) {

    var provider;

    Util.assertHasProperties(
      componentOptions,
      'componentType',
      'componentValue'
    );

    Util.assertHasProperties(
      componentOptions.componentValue,
      'type',
      'value'
    );

    Util.assertHasProperty(
      componentOptions.componentValue.value,
      'provider'
    );

    provider = componentOptions.componentValue.value.provider;

    return _embedComponentTemplateRenderers[provider](componentOptions);
  }

  function _renderEmbedWizardComponentTemplate(componentOptions) {

    var classes;
    var controlsInsertButton;
    var controlsContainer;

    Util.assertHasProperties(
      componentOptions,
      'classes',
      'blockId',
      'componentIndex'
    );

    classes = componentOptions.classes + ' embed wizard';

    controlsInsertButton = $(
      '<button>',
      {
        class: 'btn accent-btn media-component-embed-wizard-insert-btn',
        'data-embed-action': Constants.EMBED_WIZARD_CHOOSE_PROVIDER,
        'data-block-id': componentOptions.blockId,
        'data-component-index': componentOptions.componentIndex
      }
    ).text(I18n.t('editor.components.media.embed_wizard_insert_btn'));

    controlsContainer = $(
      '<div>',
      { class: 'media-component-embed-wizard-container'}
    ).append(controlsInsertButton);

    return $(
      '<div>',
      {
        class: classes,
        'data-rendered-template': 'media',
        'data-rendered-media-type': 'embed',
        'data-rendered-media-embed-provider': 'wizard',
        'data-block-id': componentOptions.blockId,
        'data-component-index': componentOptions.componentIndex
      }
    ).append(controlsContainer);
  }

  /**
   * Component data renderers
   */

  function _renderImageComponentData(element, data, editable, renderFn) {

    var imageElement;
    var imageSource;

    Util.assertHasProperty(data, 'src');

    imageElement = element.find('img');
    imageSource = window.assetFinder.getRelativeUrlRoot() + data.src;

    imageElement[0].onload = function(e) {
      renderFn();
    };

    if (imageElement.attr('src') !== imageSource) {
      imageElement.attr('src', imageSource);
    }
  }

  function _renderEmbedComponentData(element, value, editable, renderFn) {
    _embedComponentDataRenderers[value.provider](
      element,
      value,
      editable,
      renderFn
    );
  }

  function _renderEmbedWizardComponentData(element, value, editable, renderFn) {
    // NOOP (this component is static)
  }

  return {
    renderTemplate: _renderTemplate,
    renderData: _renderData
  };
})();
