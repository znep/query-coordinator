//= require jquery
//= require jquery_ujs
//= require_self

(function() {
  'use strict';

  $(function() {

    function flashCallback() {
      $('.alert').fadeOut();
    }
    setTimeout(flashCallback, 3000);

    var googleFontFormInput = $('#theme_google_font_code');
    var googleFontForm = $('label[for="theme_google_font_code"], #theme_google_font_code, #google_font_code_help_text');
    var googleFontCheckbox = $('.google-font-checkbox');

    // Toggle visibility of Google font form field
    googleFontCheckbox.change(function() {
      googleFontForm.toggleClass('visible', this.checked);
      if (!this.checked) {
        googleFontFormInput.val('');
      }
    });

    // Google font checkbox is 'checked' if field has a value
    if ((googleFontFormInput.val() || '').length > 0) {
      googleFontForm.addClass('visible');
      googleFontCheckbox.find('input').prop('checked', true);
    }
  });
})();
