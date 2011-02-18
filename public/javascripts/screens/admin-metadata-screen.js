;$(function()
{
    $('.removeFieldsetButton').click(function(event)
    {
        if (!confirm('Are you sure you want to delete this fieldset and all associated fields?'))
        {
            event.preventDefault();
        }
    });

    $('.toggleRequired').adminButton({
        callback: function(response, $line)
        {
            var $link = $line.find('.actions .toggleRequired');
            $link
            .val($link.val() == 'Make Required' ? 'Make Optional' : 'Make Required')
            .closest('.item')
                .find('.required')
                .toggleClass('requiredEnabled');
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
