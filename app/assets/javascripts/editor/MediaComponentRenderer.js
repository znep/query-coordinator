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
    'youtube': _renderYoutubeEmbedComponentTemplate
  };
  var embedComponentDataRenderers = {
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
    var provider = componentOptions.componentValue.value.provider;

    return embedComponentTemplateRenderers[provider](componentOptions);
  }

  function _renderEmbedComponentData(element, value, renderFn) {
    embedComponentDataRenderers[value.provider](element, value, renderFn);
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
