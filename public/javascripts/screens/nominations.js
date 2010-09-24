$(function()
{
    var $dialog = $('.nominateDialog');
    $('.nominateLink').click(function(e)
    {
        e.preventDefault();
        $dialog.find('input, textarea').val('').blur();
        $dialog.find('.mainError').text('');
        $dialog.jqmShow();
    });

    var createNomination = function(attachmentId)
    {
        var nomination = {
            title: $dialog.find('#nominateTitle').val(),
            description: $dialog.find('#nominateDescription').val()
        };

        var url = '/api/nominations.json';
        if (!$.isBlank(attachmentId))
        { url += '?attachmentIds=' + attachmentId; }
        $.ajax({url: url, type: 'POST',
            dataType: 'json', contentType: 'application/json',
            data: JSON.stringify(nomination),
            error: function(xhr)
            {
                $dialog.find('.loadingSpinner, .loadingOverlay').addClass('hide');
                $dialog.find('.mainError')
                    .text(JSON.parse(xhr.responseText).message);
                $dialog.find('.fileReadout').val('');
            },
            success: function(resp)
            {
                $dialog.find('.loadingSpinner, .loadingOverlay').addClass('hide');
                $dialog.jqmHide();
            }});
    };

    $dialog.find('form').validate({errorElement: 'span'});
    var $uploadButton = $dialog.find('.fileBrowseButton');
    var $uploader = new AjaxUpload($uploadButton,
    {
        action: '/nominations/INLINE/attachments.txt',
        autoSubmit: false,
        name: 'nominateFileInput',
        responseType: 'json',
        onChange: function (file, ext)
        {
            $dialog.find('input[name="file_upload"]').val(file);
            $dialog.find('.mainError').text('');
        },
        onComplete: function (file, response)
        {
            if (response.error == true)
            {
                $dialog.find('.loadingSpinner, .loadingOverlay').addClass('hide');
                // New input created; re-hook mousedown
                $($uploader._input)
                    .mousedown(function(e) { e.stopPropagation(); });
                $dialog.find('.mainError').text(response.message);
                return false;
            }

            createNomination(response.id);
        }
    });

    $($uploader._input).mousedown(function(e) { e.stopPropagation(); });

    // Form Submit
    $dialog.find('.submitAction').click(function(event)
        {
            event.preventDefault();
            $dialog.find('.prompt').val('');
            if (!$dialog.find('form').valid())
            {
                $dialog.find('.mainError').text('Please correct the errors above');
                return;
            }

            $dialog.find('.loadingSpinner, .loadingOverlay').removeClass('hide');
            if (!$.isBlank($dialog.find('.fileReadout').val()))
            {
                $uploader.submit();
            }
            else
            {
                createNomination();
            }
        });
});
