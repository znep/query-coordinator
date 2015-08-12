;window.socrata.storyteller.MediaComponentRenderer = (function(socrata) {

  'use strict';

  var storyteller = socrata.storyteller;
  var utils = socrata.utils;

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
    'youtube': _renderEmbedYouTubeComponentTemplate
  };
  var _embedComponentDataRenderers = {
    'wizard': _renderEmbedWizardComponentData,
    'youtube': _renderEmbedYouTubeComponentData
  };

  function _renderTemplate(componentOptions) {

    var type;

    utils.assertHasProperty(componentOptions, 'componentType');
    utils.assertEqual(componentOptions.componentType, 'media');
    utils.assertHasProperty(componentOptions, 'componentValue');
    utils.assertHasProperty(componentOptions.componentValue, 'type');

    type = componentOptions.componentValue.type;

    utils.assertHasProperty(_componentTemplateRenderers, type);

    return _componentTemplateRenderers[type](
      componentOptions
    );
  }

  function _canReuseTemplate(element, data) {

    var canReuseTemplate = false;
    var renderedComponent;

    if (data.type === 'embed') {

      renderedComponent = element.attr('data-rendered-media-embed-provider');

      if (data.value.provider === renderedComponent) {
        canReuseTemplate = true;
      }

    } else {
      canReuseTemplate = true;
    }

    return canReuseTemplate;
  }

  function _renderData(element, data, editable, renderFn) {

    var type;
    var value;

    utils.assertHasProperty(data, 'value');
    utils.assertHasProperty(data.value, 'type');
    utils.assertHasProperty(data.value, 'value');
    utils.assertIsOneOfTypes(renderFn, 'function');

    type = data.value.type;
    value = data.value.value;

    utils.assertHasProperty(_componentDataRenderers, type);

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

    utils.assertHasProperty(componentOptions, 'classes');

    classes = componentOptions.classes + ' image';

    return $(
      '<div>',
      {
        'class': classes,
        'data-rendered-template': 'media',
        'data-rendered-media-type': 'image'
      }
    ).append(
      $('<img>', { src: 'about:blank' })
    );
  }

  function _renderEmbedComponentTemplate(componentOptions) {

    var provider;

    utils.assertHasProperties(
      componentOptions,
      'componentType',
      'componentValue'
    );

    utils.assertHasProperties(
      componentOptions.componentValue,
      'type',
      'value'
    );

    utils.assertHasProperty(
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

    utils.assertHasProperties(
      componentOptions,
      'classes',
      'blockId',
      'componentIndex'
    );

    classes = componentOptions.classes + ' embed wizard';

    controlsInsertButton = $(
      '<button>',
      {
        'class': 'btn accent-btn media-component-embed-wizard-insert-btn',
        'data-embed-action': Constants.EMBED_WIZARD_CHOOSE_PROVIDER,
        'data-block-id': componentOptions.blockId,
        'data-component-index': componentOptions.componentIndex
      }
    ).text(I18n.t('editor.components.media.embed_wizard_insert_btn'));

    controlsContainer = $(
      '<div>',
      {
        'class': 'media-component-embed-wizard-container'
      }
    ).append(controlsInsertButton);

    return $(
      '<div>',
      {
        'class': classes,
        'data-rendered-template': 'media',
        'data-rendered-media-type': 'embed',
        'data-rendered-media-embed-provider': 'wizard'
      }
    ).append(controlsContainer);
  }

  function _renderEmbedYouTubeComponentTemplate(componentOptions) {

    var classes = componentOptions.classes + ' embed youtube';

    var iframeElement = $(
      '<iframe>',
      {
        'src': 'about:blank',
        'frameborder': '0',
        'allowfullscreen': true
      }
    );

    return $(
      '<div>',
      {
        'class': classes,
        'data-rendered-template': 'media',
        'data-rendered-media-type': 'embed',
        'data-rendered-media-embed-provider': 'youtube'
      }
    ).append(iframeElement);
  }

  /**
   * Component data renderers
   */

  function _renderImageComponentData(element, data, editable, renderFn) {

    var imageElement;
    var imageSource;

    utils.assertHasProperty(data, 'src');

    imageElement = element.find('img');
    imageSource = storyteller.assetFinder.getRelativeUrlRoot() + data.src;

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

  function _renderEmbedYouTubeComponentData(element, value, editable, renderFn) {

    var iframeElement = element.find('iframe');
    var youTubeSource = utils.generateYouTubeIframeSrc(value.id);

    if (iframeElement.attr('src') !== youTubeSource) {
      iframeElement.attr('src', youTubeSource);
    }
  }

  return {
    renderTemplate: _renderTemplate,
    canReuseTemplate: _canReuseTemplate,
    renderData: _renderData
  };
})(window.socrata);
