;var MediaComponentRenderer = (function() {
 
  'use strict';

  /**
   * This is written as a collection of static methods! Instantiate
   * at your own risk!
   */

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

    var mediaType = componentOptions.componentValue.type;

    return _componentTemplateRenderers[mediaType](
      componentOptions
    );
  }

  function _renderData(element, data, editable, renderFn) {

    var mediaType = data.value.type;
    var mediaValue = data.value.value;

    _componentDataRenderers[mediaType](
      element,
      mediaValue,
      editable,
      renderFn
    );
  }

  /**
   * Component template renderers
   */

  function _renderImageComponentTemplate(componentOptions) {

    var classes = componentOptions.classes + ' image';

    return $(
      '<div>',
      {
        class: classes,
        'data-rendered-template': 'media',
        'data-rendered-media-type': 'image'
      }
    ).append('<img>');
  }

  function _renderEmbedComponentTemplate(componentOptions) {

    if (componentOptions.componentType === 'embed' &&
      (!componentOptions.hasOwnProperty('componentValue') ||
      !componentOptions.componentValue.hasOwnProperty('value') ||
      !componentOptions.componentValue.value.hasOwnProperty('provider'))) {

      throw new Error(
        'provider property is required for embed media type ' +
        '(componentOptions: "' +
        JSON.stringify(componentOptions) +
        ').'
      );
    }

    var provider = componentOptions.componentValue.value.provider;

    return _embedComponentTemplateRenderers[provider](componentOptions);
  }

  function _renderEmbedWizardComponentTemplate(componentOptions) {

    var classes = componentOptions.classes + ' embed wizard';

    var controlsInsertButton = $(
      '<button>',
      {
        class: 'btn accent-btn media-component-embed-wizard-insert-btn',
        'data-embed-action': Constants.EMBED_WIZARD_CHOOSE_PROVIDER,
        'data-block-id': componentOptions.blockId,
        'data-component-index': componentOptions.componentIndex
      }
    ).text(I18n.t('editor.components.media.embed_wizard_insert_btn'));

    var controlsContainer = $(
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

    var imageElement = element.find('img');
    var imageSource = window.assetFinder.getRelativeUrlRoot() + data.src;

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
