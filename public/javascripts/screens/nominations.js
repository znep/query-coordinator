$(function()
{
    var friendlyStatus = function(nom)
    {
        if (nom.status == 'pending' &&
            (new Date(nom.createdAt * 1000) > Date.parse('7 days ago')))
        { return 'new'; }
        else if (nom.status == 'pending')
        { return 'open'; }
        return nom.status;
    };

    var $tbody = $('.nominationsList .gridList tbody');
    var addNomination = function(n, beginning)
    {
        if (!(n.user instanceof User)) { n.user = new User(n.user); }
        var $newItem = $.renderTemplate('nominationItem', n,
        {
            '.user a@href': function(n) { return n.context.user.getProfileUrl(); },
            '.user a@title': 'user.displayName!',
            '.user img@src': function(n)
                { return n.context.user.getProfileImageUrl('small'); },
            '.user img@alt': 'user.displayName!',
            '.user .userName': 'user.displayName!',
            '.details .title': 'title!',
            '.details .submitTime .fullTime': function(n)
                { return new Date(n.context.createdAt * 1000).format('F d, Y'); },
            '.details .submitTime .relativeTime': function(n)
                { return blist.util.humaneDate
                    .getFromDate(n.context.createdAt * 1000); },
            '.details .description': 'description!',
            '.details .description@class+': function(n)
                { return $.isBlank(n.context.description) ? 'hide' : ''; },
            '.attachments li':
            {
                'a<-attachments':
                {
                    'a': 'a.filename!',
                    'a@title': 'a.filename!',
                    'a@href': '/api/nominations/#{id}/attachments/#{a.id}'
                }
            },
            '.rating': 'netVotes',
            '.rating@class+': function(n)
                {
                    return n.context.netVotes > 0 ? 'positive' :
                        n.context.netVotes < 0 ? 'negative' : '';
                },
            '.status': function(n)
                { return friendlyStatus(n.context).capitalize(); },
            '.status@class+': function(n)
                { return friendlyStatus(n.context).toLowerCase(); }
        }).find('tr.item')

        if (beginning) { $tbody.prepend($newItem); }
        else { $tbody.append($newItem); }
    };

    _.each(blist.nominations.items, function(n) { addNomination(n); });

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
                addNomination(resp, true);
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
