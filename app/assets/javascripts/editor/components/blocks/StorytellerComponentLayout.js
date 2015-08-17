(function ($, utils) {

  function _renderLayoutContent(componentOptions) {
    var element;

    if(componentOptions.value === 'spacer') {
      element = $('<div>', { 'class': 'spacer'});
    } else if (componentOptions.value === 'horizontalRule') {
      element = $('<hr>');
    } else {
      throw new Error(
        'Attempted to render a layoutComponet with value: `' +
        componentOptions.value + '` which has no template definition.'
      );
    }

    return element;
  }

  $.fn.storytellerComponentLayout = function (componentOptions) {
    var self = $(this);

    utils.assertIsOneOfTypes(componentOptions, 'object');

    if (self.length !== 1) {
      throw new Error('Selection must have exactly one element.');
    }

    self.empty().append(_renderLayoutContent(componentOptions));

    return this;
  };
})(jQuery, window.socrata.utils);
