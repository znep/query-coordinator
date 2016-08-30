(function($)
{

$(function()
{
    var $bgField = $('.colorLine #story_backgroundColor');
    $bgField.ColorPicker({
        color: $bgField.val(),
        onChange: function(hsb, hex, rgb) {
            $bgField.val('#' + hex);
        }
    });

    $('input').uniform();

    $('form').validate();
});

})(jQuery);
