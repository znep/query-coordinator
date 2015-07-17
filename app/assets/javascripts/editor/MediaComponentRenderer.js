;var MediaComponentRenderer = (function() {
 
  'use strict';

  /**
   * This is written as a collection of static methods! Instantiate
   * at your own risk!
   */

  var componentTemplateRenderers = {
    'image': _renderImageComponentTemplate,
    'embed': _renderEmbedComponentTemplate
  };
  var componentDataRenderers = {
    'image': _renderImageComponentData,
    'embed': _renderEmbedComponentData
  };

  var embedComponentTemplateRenderers = {
    'wizard': _renderWizardEmbedComponentTemplate,
    'youtube': _renderYoutubeEmbedComponentTemplate
  };
  var embedComponentDataRenderers = {
    'wizard': _renderWizardEmbedComponentData,
    'youtube': _renderYoutubeEmbedComponentData
  };

  function _renderTemplate(componentOptions) {
    return componentTemplateRenderers[componentOptions.componentValue.type](componentOptions);
  };

  function _renderData(element, data, renderFn) {
    componentDataRenderers[data.type](element, data.value, renderFn);
  };

  function _renderImageComponentTemplate(componentOptions) {
    var classes = componentOptions.classes + ' image';

    return $('<div>', { class: classes }).append('<img>');
  }

  function _renderImageComponentData(element, data, renderFn) {
    var imageElement = element.find('img');
    var imageSource = window.assetFinder.getRelativeUrlRoot() + data.src;

    imageElement[0].onload = function(e) {
      renderFn();
    };

    if (imageElement.attr('src') !== imageSource) {
      imageElement.attr('src', imageSource);
    }
  }

  function _renderEmbedComponentTemplate(componentOptions) {
    var embedValue = componentOptions.componentValue.value;
    var provider;
    var template;

    if (embedValue === null) {
      provider = 'wizard';
    } else {
      provider = componentOptions.componentValue.value.provider;
    }

    return embedComponentTemplateRenderers[provider](componentOptions);;
  }

  function _renderEmbedComponentData(element, value, renderFn) {
    var provider;

    if (value === null) {
      provider = 'wizard';
    } else {
      provider = value.provider;
    }

    embedComponentDataRenderers[provider](element, value, renderFn);
  }

  function _renderWizardEmbedComponentTemplate(componentOptions) {
    var classes = componentOptions.classes + ' embed wizard';

    var controlsInsertButton = $(
      '<button>',
      { class: 'btn accent-btn media-component-embed-wizard-insert-btn' }
    ).text(
      I18n.t('editor.components.media.embed_wizard_insert_btn')
    );

    var controlsContainer = $(
      '<div>',
      { class: 'media-component-embed-wizard-container' }
    ).append(controlsInsertButton);

    return $('<div>', { class: classes }).append(controlsContainer);
  }

  function _renderWizardEmbedComponentData(element, value, renderFn) {
    // Do nothing
  }

  function _renderYoutubeEmbedComponentTemplate(componentOptions) {
    var classes = componentOptions.classes + ' embed youtube';

    return $('<div>', { class: classes }).append(
      $('<iframe>', { frameborder: '0', allowfullscreen: true, autoplay: true }).css('width', '100%')
    ).append(
      $('<div>', { class: 'flypaper' })
    );
  }

  function _renderYoutubeEmbedComponentData(element, value, renderFn) {
    var iframeElement = element.find('iframe');
    var youtubeSource = 'https://www.youtube.com/embed/' + value.id + '?rel=0&showinfo=0&autoplay=true';

    if (iframeElement.attr('src') !== youtubeSource) {
      iframeElement.attr('src', youtubeSource);
    }
  }

  return {
    renderTemplate: _renderTemplate,
    renderData: _renderData
  };
})();
