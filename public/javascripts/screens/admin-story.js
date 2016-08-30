(function($) {

  $(function() {
    var $bgField = $('.colorLine #story_backgroundColor');
    $bgField.ColorPicker({ // eslint-disable-line new-cap
      color: $bgField.val(),
      onChange: function(hsb, hex) {
        $bgField.val('#' + hex);
      }
    });

    $('input').uniform();
    $('form').validate();
  });

})(jQuery);
