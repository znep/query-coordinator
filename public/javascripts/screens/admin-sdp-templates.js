(function($) {
  var sdpTemplatesNS = blist.namespace.fetch('blist.sdpTemplates');

  var parseColor = function(color) {
    return color.match(/^(rgba|#)/) ? color : ('#' + color);
  };

  $(function() {
    // update visual things
    _.each(sdpTemplatesNS.templates, function(template) {
      if (_.isString(template.customization)) {
        template.customization = JSON.parse(template.customization);
      }
      var customization = template.customization;
      var $row = $('.templatesList tbody tr[data-templateid=' + template.uid + ']');

      // check version
      if (template.customization.version !== 1) {
        $row.find('.previewNotAvailable').fadeIn();
        $row.find('.makeDefaultButton').addClass('disabled');
      } else {
        // sub in styles
        if (!$.isBlank(customization.frame)) {
          $row.find('.previewOuter').
            css('background-color', parseColor(customization.frame.color)).
            css('border-width', customization.frame.border.width.value + customization.frame.border.width.unit).
            css('border-color', parseColor(customization.frame.border.color));
        }

        if (!$.isBlank(customization.logo)) {
          $row.find('.previewLogo').css('background-image', 'url(' + (
            customization.logo.image.type == 'static' ?
            customization.logo.image.href :
            '/assets/' + customization.logo.image.href
          ) + ')');
        }

        if (!$.isBlank(customization.toolbar)) {
          $row.find('.previewSubheader').css('background-color', parseColor(customization.toolbar.color));
        }

        if (!$.isBlank(customization.grid)) {
          $row.find('.previewGridZebra').css('background-color', parseColor(customization.grid.zebra));
        }
      }

      $row.find('.loadingOverlay').fadeOut();
    });

    $('.templatesList').combinationList({
      headerContainerSelector: '.gridListWrapper',
      initialSort: [
        [0, 0]
      ],
      scrollableBody: false,
      selectable: false,
      sortGrouping: false,
      sortHeaders: {
        0: {
          sorter: 'text'
        },
        1: {
          sorter: false
        },
        2: {
          sorter: false
        }
      },
      sortTextExtraction: function(node) {
        return $(node).find('.cellInner').text();
      }
    });

    $('.deleteTemplateButton').adminButton({
      callback: function(response, $row) {
        $row.slideUp().remove();
      }
    });


    $('.makeDefaultButton').adminButton({
      callback: function(response, $row) {
        $('.actions').removeClass('isDefault').find('.deleteTemplateButton').removeClass('disabled');
        $row.find('.actions').addClass('isDefault').find('.deleteTemplateButton').addClass('disabled');
      }
    });

    $('.newTemplateButton').click(function(event) {
      event.preventDefault();

      $('#newTemplateName').val('');
      $('.newTemplateModal').jqmShow();
    });
    $('.newTemplateModal .submitButton').click(function(event) {
      event.preventDefault();
      $(this).closest('form').submit();
    });
    $('.newTemplateModal form').validate();
  });
})(jQuery);
