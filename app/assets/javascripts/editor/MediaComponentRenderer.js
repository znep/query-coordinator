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

  var embedTemplateRenderers = {
    'youtube': _renderYoutubeEmbedComponentTemplate
  };
  var embedDataRenderers = {
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

  }

  function _renderEmbedComponentData(element, value, renderFn) {

  }

  function _renderYoutubeEmbedComponentTemplate(componentOptions) {

  }

  function _renderYoutubeEmbedComponentData(element, value, renderFn) {

  }

  return {
    renderTemplate: _renderTemplate,
    renderData: _renderData
  };

})();
