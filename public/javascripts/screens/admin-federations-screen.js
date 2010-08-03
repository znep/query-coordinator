$(function()
{
    var submitForm = function(event)
    {
        event.preventDefault();
        var $form = $(this).closest('form');
        $.ajax({
            url: $form.attr('action'),
            type: 'PUT',
            data: $form.find(':input'),
            dataType: 'json',
            success: function(responseData)
            {
                if (responseData['error'] !== undefined)
                {
                    $form.closest('div').find('.errorMessage').text(responseData['error']);
                }
                else
                {
                    var append = '';
                    if (window.location.href.indexOf('added=1') < 0)
                    {
                        append = (window.location.href.indexOf('?') < 0 ? '?' : '&') + 'added=1';
                    }

                    window.location.href = window.location.href + append;
                }
            },
            error: function(request, status, error)
            {
                $form.closest('div').find('.errorMessage')
                    .text("An error was encountered creating federation.  Please try later");
            }
        });
    };

    $('.publishDomainSubmit').click(submitForm);
});

