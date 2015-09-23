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

    var timeoutId;
    var $spinner = $('.select-georegion-spinner');
    var $flash = $('.flash').get(0);
    if (_.isUndefined($flash)) {
      $flash = $('<div />', {'class': 'flash hide'}).appendTo('#noticeContainer');
    }

    $('.chooseDatasetButton').on('click', function(event) {
      event.preventDefault();
      var selectedDataset = blist.browse.getDS($(this));
      $spinner.show();

      function handleError(errorMessage) {
        $flash.
          html(errorMessage).
          toggleClass('hide', false).
          toggleClass('error', true);
        clearTimeout(timeoutId);
        timeoutId = setTimeout(function() {
          $flash.fadeOut(400, function() {
            $flash.toggleClass('hide', true).show();
          });
        }, 5000);
      }

      function handleSuccess(successMessage) {
        var commonNS = window.parent.blist.namespace.fetch('blist.common');

        if (_.isFunction(commonNS.georegionSelected)) {
          commonNS.georegionSelected(successMessage);
        } else {
          throw "Can't find the georegionSelected handler in the parent!"
        }
      }

      try {
        selectedDataset.makeCustomGeoregion(
          function(response) {
            $spinner.hide();
            if (response.error) {
              handleError(response.message);
            } else {
              handleSuccess(response.message);
            }
          },
          function() {
            $spinner.hide();
            handleError('Error!');
          }
        );
      } catch (err) {
        $spinner.hide();
        handleError(err);
      }
    });
  });

})(jQuery);
