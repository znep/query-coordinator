(function (root, $) {

  'use strict';

  var socrata = root.socrata;
  var storyteller = socrata.storyteller;
  var utils = socrata.utils;

  // Media plugins are implemented as jQuery plugins.
  // This function maps component data (type, provider) to
  // a jQuery plugin name ('storytellerComponentMediaYoutube').
  function _findAppropriateMediaPlugin(componentData) {
    var mediaType = componentData.value.type;

    if (mediaType === 'embed') {
      var providerName = componentData.value.value.provider;
      if (providerName === 'wizard') {
        return 'storytellerComponentMediaEmbedWizard';
      } else if (providerName === 'youtube') {
        return 'storytellerComponentMediaEmbedYoutube';
      }
    }

    throw new Error('No media plugin to render component: {0}'.format(JSON.stringify(componentData)));
  }

  function _runMediaPlugin(element, pluginName, componentData) {
    var currentlyRenderedProvider = element.attr('data-rendered-media-embed-plugin');
    var pluginWrapper = element.find('.media-plugin');
    var pluginContent;

    if (pluginWrapper.length === 0) {
      pluginWrapper = $('<div>', { 'class': 'media-plugin' });
      pluginWrapper.append($('<div>'));
      element.append(pluginWrapper);
    }

    pluginContent = pluginWrapper.children().eq(0);

    if (currentlyRenderedProvider !== pluginName) {
      // Plugin changed, blow away the old one's DOM.
      element.attr('data-rendered-media-embed-plugin', pluginName);

      pluginWrapper.
        trigger('destroy').
        empty().
        append(pluginContent);
    }

    // Invoke the correct plugin, providing the data.
    pluginContent[pluginName](componentData);
  }

  function storytellerComponentMedia(componentData) {
    var self = $(this);
    var mediaPlugin;

    utils.assertHasProperty(componentData, 'type');
    utils.assertHasProperty(componentData, 'value');
    utils.assertHasProperty(componentData.value, 'type');

    if (componentData.type !== 'media') {
      throw new Error('Cannot render components of type {0} with $.storytellerComponentMedia.'.format(componentData.type));
    }

    mediaPlugin = _findAppropriateMediaPlugin(componentData);
    _runMediaPlugin(self, mediaPlugin, componentData);

    return self;
  }

  $.fn.storytellerComponentMedia = storytellerComponentMedia;
})(window, jQuery);
