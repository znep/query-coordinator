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
            $dialog.loadingSpinner().showHide(false);
            $dialog.find('.mainError')
                .text(JSON.parse(xhr.responseText).message);
            $dialog.find('.fileReadout').val('');
        };
        var success = function(resp)
        {
            $dialog.loadingSpinner().showHide(false);
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
                blist.nominations.updateNomination(editId, nomination);
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
        { return $.t('controls.nominate.new'); }
        else if (nom.status == 'pending')
        { return $.t('controls.nominate.open'); }
        return nom.status;
    };

    blist.nominations.remove = function(id, attachmentId, successCallback)
    {
        var type = $.t('controls.nominate.delete_' + (attachmentId ? 'attachment' : 'suggestion'));
        if (confirm($.t('controls.nominate.delete_confirm', { type: type })))
        {
            blist.nominations.map[id].remove(attachmentId, successCallback,
                function error(xhr)
                {
                    alert($.t('controls.nominate.delete_error', { type: type }) + ': ' +
                        JSON.parse(xhr.responseText).message);
                }
            );
        }
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
                blist.nominations.map[id].status = nom.status;
            },
            function error(xhr)
            {
                alert($.t('controls.nominate.moderate_error') + ': ' +
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
                alert($.t('controls.nominate.rating_error') + ': ' +
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

    $dialog.loadingSpinner({metric: 'nomination', overlay: true});

    $dialog.find('form').validate({errorElement: 'span'});

    // Form Submit
    $dialog.find('.submitAction').click(function(event)
        {
            event.preventDefault();
            $dialog.find('.prompt').val('');
            if (!$dialog.find('form').valid())
            {
                $dialog.find('.mainError').text($.t('controls.nominate.form_error'));
                return;
            }

            $dialog.loadingSpinner().showHide(true);
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
