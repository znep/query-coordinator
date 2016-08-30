$(function() {
  $('.layoutConfig').each(function() {
    var $lc = $(this);

    $lc.find('input[type=submit]').hide();
    $lc.find(':radio').uniform();

    var curVal = $lc.find(':radio:checked').val();

    var $wrapper = $lc.find('.statusTextWrapper');
    var $saving = $wrapper.find('.saving');
    var $saved = $wrapper.find('.saved');

    var valueChanged = function() {
      var $t = $(this);
      _.defer(function() {
        var newVal = $t.val();
        if (newVal != curVal) {
          $saved.hide();
          $saving.show();
          $wrapper.fadeIn();
          $.ajax({
            url: $lc.find('form').attr('action'),
            type: 'POST',
            contentType: 'application/json',
            dataType: 'json',
            data: JSON.stringify($lc.serializeObject()),
            success: function() {
              $saving.fadeOut($saved.fadeIn.bind($saved));
              setTimeout(function() {
                $saved.fadeOut($wrapper.hide.bind($wrapper));
              }, 2000);
            }
          });
          curVal = newVal;
        }
      });
    };

    $lc.find(':radio').change(valueChanged);
  });
});
