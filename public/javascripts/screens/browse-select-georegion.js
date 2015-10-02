(function($) {

  if (_.isUndefined(window.parent)) {
    throw "Not in an iFrame! Not sure what you're expecting.";
  }


  $(function() {
    $('.expander').replaceWith($.tag({
      tagName: 'a',
      'class': ['button', 'chooseDatasetButton'],
      contents: [$.t('controls.common.dataset_picker.button')]
    }, true));

    $('.chooseDatasetButton').on('click', function(event) {
      event.preventDefault();
      var selectedDataset = blist.browse.getDS($(this));
      var commonNS = window.parent.blist.namespace.fetch('blist.common');

      if (_.isFunction(commonNS.georegionSelected)) {
        commonNS.georegionSelected(selectedDataset.id);
      } else {
        throw "Can't find the georegionSelected handler in the parent!";
      }
    });
  });

})(jQuery);
