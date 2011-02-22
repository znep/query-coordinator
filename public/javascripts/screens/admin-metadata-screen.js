;$(function()
{
    $('.removeFieldsetButton').click(function(event)
    {
        if (!confirm('Are you sure you want to delete this fieldset and all associated fields?'))
        {
            event.preventDefault();
        }
    });

    var buttonMap = {
        'required': {
            'on': 'Required',
            'off': 'Optional'
        },
        'private': {
            'on': 'Private',
            'off': 'Public'
        }
    };

    $('.toggleButton').adminButton({
        callback: function(response, $line, $link)
        {
            $link
            .val('Make ' + buttonMap[response.option][response.value ? 'off' : 'on'])
            .closest('.item')
                .toggleClass(response.option);
        }
    });

    $('.moveButton').adminButton({
        callback: function(response, $line)
        {
            $line.fadeOut(300, function() {
                if (response.direction == 'up')
                {
                    $line.prev().before($line);
                }
                else
                {
                    $line.next().after($line);
                }
                $line.fadeIn();

                $line.closest('tbody')
                    .find('.moveButton')
                        .removeClass('disabled')
                        .end()
                    .find('tr.item:first .upButton')
                        .addClass('disabled')
                        .end()
                    .find('tr.item:last .downButton')
                        .addClass('disabled');
            });
        }
    });

    $('.customFields .requiredCheckbox').uniform();
});
