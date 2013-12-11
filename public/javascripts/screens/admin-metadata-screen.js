;$(function()
{
    var t = function(str, props) { return $.t('screens.admin.metadata.' + str, props); };

    $('.removeFieldsetButton').click(function(event)
    {
        if (!confirm(t('are_you_sure')))
        {
            event.preventDefault();
        }
    });

    var buttonMap = {
        'required': {
            'on': 'required',
            'off': 'optional'
        },
        'private': {
            'on': 'private',
            'off': 'public'
        }
    };

    $('.toggleButton').adminButton({
        callback: function(response,$line, $link)
        {
            $link
            .val(t('make_' + buttonMap[response.option][response.value ? 'off' : 'on']))
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

    $('.metadataFieldTable td.options').editableList({saveCallback:
        function($container, data)
        {
            var $row  = $container.closest('tr');
            var error = function(text) {
                $container.removeClass('modified').addClass('error')
                    .find('.errorText').text(text);
            };
            $.socrataServer.makeRequest({url: '/admin/metadata/save_field',
                type: 'PUT', data: JSON.stringify({
                    fieldset: $row.data('fieldset'),
                    field:    $row.data('fieldname'),
                    options:  data
                }),
                success: function(response) {
                    $container.removeClass('modified error');
                    if (response.error)
                    { error(response.message); }
                },
                error: error
            });
        }
    });

    $('.customFields .requiredCheckbox').uniform();
});
