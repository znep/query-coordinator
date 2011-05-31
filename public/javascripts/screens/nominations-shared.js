;blist.namespace.fetch('blist.nominations');

$(function()
{
    var saveNomination = function(attachmentId)
    {
        var nomination = {
            title: $dialog.find('#nominateTitle').val(),
            description: $dialog.find('#nominateDescription').val()
        };
        var editId = $dialog.attr('data-editId');

        var error = function(xhr)
        {
            $dialog.find('.loadingSpinner, .loadingOverlay').addClass('hide');
            $dialog.find('.mainError')
                .text(JSON.parse(xhr.responseText).message);
            $dialog.find('.fileReadout').val('');
        };
        var success = function(resp)
        {
            $dialog.find('.loadingSpinner, .loadingOverlay').addClass('hide');
            $dialog.jqmHide();
            if ($.isBlank(editId))
            {
                if (resp.status == 'unmoderated')
                $('.moderationNotice').fadeIn();
                else
                blist.nominations.addNomination(resp, true);
            }
            else
            {
                blist.nominations.updateNomination(editId ,nomination);
            }
        };
        if ($.isBlank(editId))
        {
            Nomination.create(nomination, attachmentId, success, error);
        }
        else
        {
            var nom = $.extend(blist.nominations.map[editId], nomination);
            nom.save(success, error);
        }
    };

    blist.nominations.friendlyStatus = function(nom)
    {
        if (nom.status == 'pending' &&
            (new Date(nom.createdAt * 1000) > Date.parse('7 days ago')))
        { return 'new'; }
        else if (nom.status == 'pending')
        { return 'open'; }
        return nom.status;
    };

    blist.nominations.moderate = function(id, status, $container)
    {
        blist.nominations.map[id].moderate(status,
            function success(nom)
            {
                var fStat = blist.nominations.friendlyStatus(nom).toLowerCase();
                $container
                    .removeClass('open new rejected approved unmoderated')
                    .addClass(fStat).find('.currentStatus')
                    .text(fStat.capitalize())
                    .closest('tr.item').removeClass('pending rejected approved')
                    .addClass(nom.status);
            },
            function error(xhr)
            {
                alert('Error changing status: ' +
                    JSON.parse(xhr.responseText).message);
            }
        );
    };

    blist.nominations.rate = function(id, $link, $container, success)
    {
        var isUp = $link.hasClass('rateUp');

        $link.addClass(isUp ? 'ratedUp' : 'ratedDown');
        $link.siblings('.rateLink').removeClass('ratedUp ratedDown');

        blist.nominations.map[id].rate(isUp,
            function (response)
            {
                var $value = $container.find('.value');
                var newVal = response.netVotes;
                $value.text(newVal);
                $container.removeClass('positive negative');
                if (newVal > 0) { $container.addClass('positive'); }
                else if (newVal < 0) { $container.addClass('negative'); }
                success(isUp);
            },
            function (xhr)
            {
                alert('Error rating suggestion: ' +
                    JSON.parse(xhr.responseText).message);
            }
        );
    };

    var $dialog = $('.editNominationDialog');
    blist.nominations.showNomDialog = function(nomId, title, desc)
    {
        $dialog.find('#nominateTitle').val(title || '')
            .toggleClass('prompt', $.isBlank(title)).blur();
        $dialog.find('#nominateDescription').val(desc || '')
            .toggleClass('prompt', $.isBlank(desc)).blur();
        $dialog.toggleClass('isEdit', !$.isBlank(nomId))
            .attr('data-editId', nomId || '');
        $dialog.find('.mainError').text('');

        $dialog.jqmShow();
    };

    $dialog.find('form').validate({errorElement: 'span'});
    var $uploadButton = $dialog.find('.fileBrowseButton');
    if ($uploadButton.length > 0)
    {
        var $uploader = new AjaxUpload($uploadButton,
        {
            action: '/api/nominations/INLINE/attachments.txt',
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
                    $dialog.find('.mainError').text(response.message);
                    return false;
                }

                saveNomination(response.id);
            }
        });
    }

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
                saveNomination();
            }
        });
});
