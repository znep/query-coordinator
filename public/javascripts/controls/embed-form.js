(function($) {
  $.fn.embedForm = function(options) {
    var opts = $.extend({}, $.fn.embedForm.defaults, options);

    return this.each(function() {
      var $embedForm = $(this);

      var config = $.meta ? $.extend({}, opts, $embedForm.data()) : opts;

      var template = $embedForm.find(config.textareaSelector).text();

      // key input on textboxes
      $embedForm.find(config.widthSelector + ',' + config.heightSelector).keyup(function() {
        var dimensions = updatePublishCode($embedForm, config, template);
        $embedForm.find(config.sizesSelector).
          removeClass('selected').
          filter('[data-width=' + dimensions.width + ']' + '[data-height=' + dimensions.height + ']').
          addClass('selected');
      }).
      keypress(function(event) {
        if ((event.which < 48 || event.which > 57) &&
          !(event.which == 8 || event.which == 0)) {
          // Disallow non-numeric input in width/height fields
          return false;
        }
      });

      $embedForm.find(config.codeSelector).click(function() {
        $(this).select();
      });

      $embedForm.find(config.sizesSelector).click(function() {
        var $this = $(this);

        $this.siblings().removeClass('selected');
        $this.addClass('selected');
        $embedForm.find(config.widthSelector).val($this.attr('data-width'));
        $embedForm.find(config.heightSelector).val($this.attr('data-height'));

        updatePublishCode($embedForm, config, template);
      });

      $embedForm.find(config.templateSelector).change(function() {
        updatePublishCode($embedForm, config, template);
      });

      $embedForm.find(config.createTemplateButtonSelector).click(function(event) {
        event.preventDefault();

        $('.newTemplateModal #newTemplateName').val('');
        $('.newTemplateModal').jqmShow();
      });
      $('.newTemplateModal .submitButton').click(function(event) {
        event.preventDefault();
        $(this).closest('form').submit();
      });
      $('.newTemplateModal form').validate();

      $.uniform.update($embedForm.find(config.templateSelector).val($('#embed_default').val()));

      updatePublishCode($embedForm, config, template);
    });

    // Update copyable publish code and live preview from template/params
    function updatePublishCode($embedForm, config, template) {
      var width = $embedForm.find(config.widthSelector).val();
      var height = $embedForm.find(config.heightSelector).val();
      var variation = $embedForm.find(config.templateSelector).val();
      var text = template.replace('_width_', width).
        replace('_height_', height).
        replace('_variation_', variation || '');
      _.defer(function() {
        $embedForm.find(config.textareaSelector).text(text);
      });

      // Restrict size to >= 425x425 px
      if (parseInt(width, 10) < 425 || parseInt(height, 10) < 425 ||
        width == '' || height == '') {
        $embedForm.find(config.errorMessageSelector).addClass('errorMessage');
        $embedForm.find(config.textareaSelector).attr('disabled', true);
        config.invalidCallback();
      } else {
        $embedForm.find(config.errorMessageSelector).removeClass('errorMessage');
        $embedForm.find(config.textareaSelector).removeAttr('disabled');
        config.validCallback();
      }

      return {
        width: width,
        height: height
      };
    }

  };

  // default options
  $.fn.embedForm.defaults = {
    textareaSelector: '#embed_code',
    widthSelector: '#embed_width',
    heightSelector: '#embed_height',
    templateSelector: '#embed_template',
    errorMessageSelector: '.sizeInformation',
    sizesSelector: '.sizes li',
    codeSelector: '.htmlCode',
    createTemplateButtonSelector: '.createTemplateButton',
    invalidCallback: function() {},
    validCallback: function() {}
  };

})(jQuery);
