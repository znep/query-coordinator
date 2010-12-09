$(function()
{
    $('.layoutConfig input[type=submit]').hide();
    $('.layoutConfig :radio').uniform();

    var curPosition = $('.layoutConfig :radio:checked').val();

    var $saving = $('.layoutConfig .statusText.saving');
    var $saved = $('.layoutConfig .statusText.saved');

    var valueChanged = function(e)
    {
        var $t = $(this);
        _.defer(function()
        {
            var newPos = $t.val();
            if (newPos != curPosition)
            {
                $saved.hide();
                $saving.show();
                $.ajax({url: '/admin/datasets/sidebar_config', type: 'POST',
                    dataType: 'json', contentType: 'application/json',
                    data: JSON.stringify({sidebar: {position: newPos}}),
                    success: function()
                    {
                        $saving.hide();
                        $saved.show();
                        setTimeout(function() { $saved.hide(); }, 5000);
                    }});
                curPosition = newPos;
            }
        });
    };

    $('.layoutConfig :radio').change(valueChanged);
});
