$(function()
{
    $('.layoutConfig').each(function()
    {
        var $lc = $(this);

        $lc.find('input[type=submit]').hide();
        $lc.find(':radio').uniform();

        var curVal = $lc.find(':radio:checked').val();

        var $saving = $lc.find('.statusText.saving');
        var $saved = $lc.find('.statusText.saved');

        var valueChanged = function(e)
        {
            var $t = $(this);
            _.defer(function()
            {
                var newVal = $t.val();
                if (newVal != curVal)
                {
                    $saved.hide();
                    $saving.show();
                    $.ajax({url: $lc.find('form').attr('action'), type: 'POST',
                        dataType: 'json', contentType: 'application/json',
                        data: JSON.stringify($lc.serializeObject()),
                        success: function()
                        {
                            $saving.fadeOut();
                            $saved.fadeIn();
                            setTimeout(function() { $saved.fadeOut(); }, 5000);
                        }});
                    curVal = newVal;
                }
            });
        };

        $lc.find(':radio').change(valueChanged);
    });
});
