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

      var hasCallback = _.isFunction(commonNS.georegionSelected);
      var layerID = _.first(selectedDataset.childViews);

      if (hasCallback && layerID) {
        commonNS.georegionSelected(layerID, selectedDataset.name);
        return true;
      }

      if (!hasCallback) {
        console.error("Can't find the georegionSelected handler in the parent!");
      }
      if (!layerID) {
        console.error('Unable to find a layer ID from the parent geo dataset!');
      }
    });
  });

})(jQuery);
