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

    var ratedNom = {};
    $.live('.nominationsList .gridList .rating .rateLink', 'click', function(e)
    {
        e.preventDefault();
        var $t = $(this);
        var id = $t.closest('tr.item').attr('data-nominationId');
        var isUp = $t.hasClass('rateUp');
        if (ratedNom[id] === isUp) { return; }

        $t.addClass(isUp ? 'ratedUp' : 'ratedDown');
        $t.siblings('.rateLink').removeClass('ratedUp ratedDown');
        $.ajax({url: '/api/nominations/' + id + '/ratings.json' +
            '?thumbsUp=' + isUp,
            type: 'POST', contentType: 'application/json', dataType: 'json',
            error: function(xhr)
            {
                alert('Error rating suggestion: ' +
                    JSON.parse(xhr.responseText).message);
            },
            success: function()
            {
                var $td = $t.closest('td');
                var $value = $td.find('.value');
                var adj = (isUp ? 1 : -1);
                if (!$.isBlank(ratedNom[id])) { adj *= 2; }
                var newVal = parseInt($value.text()) + adj;
                $value.text(newVal);
                $td.removeClass('positive negative');
                if (newVal > 0) { $td.addClass('positive'); }
                else if (newVal < 0) { $td.addClass('negative'); }
                ratedNom[id] = isUp;
            }});
    });

    $.live('.nominationsList .gridList a.delete', 'click', function(e)
    {
        e.preventDefault();
        var $t = $(this);
        var isFile = $t.closest('.attachments').length > 0;
        var type = isFile ? 'attachment' : 'suggestion';
        if (confirm('Are you sure you want to delete this ' + type + '?'))
        {
            var $item = $t.closest('tr.item');
            var id = $item.attr('data-nominationId');
            var url = '/api/nominations/' + id;
            if (isFile)
            { url += '/attachments/' + $t.closest('li').attr('data-attachmentId'); }
            url += '.json';
            $.ajax({url: url, type: 'DELETE',
                error: function(xhr)
                {
                    alert('Error deleting ' + type + ': ' +
                        JSON.parse(xhr.responseText).message);
                },
                success: function()
                {
                    if (isFile) { $t.closest('li').remove(); }
                    else { $item.remove(); }
                }});
        }
    });

    $.live('.nominationsList .gridList .status .moderateLink', 'click', function(e)
    {
        e.preventDefault();
        var $t = $(this);
        var status = $t.attr('data-status');
        $.ajax({url: '/api/nominations/' +
            $t.closest('tr.item').attr('data-nominationId') + '.json',
            data: JSON.stringify({status: status}),
            type: 'PUT', dataType: 'json', contentType: 'application/json',
            error: function(xhr)
            {
                alert('Error changing status: ' +
                    JSON.parse(xhr.responseText).message);
            },
            success: function(nom)
            {
                var fStat = friendlyStatus(nom).toLowerCase();
                $t.closest('td')
                    .removeClass('open new rejected approved unmoderated')
                    .addClass(fStat).find('.currentStatus')
                    .text(fStat.capitalize())
                    .closest('tr.item').removeClass('pending rejected approved')
                    .addClass(nom.status);
            }});
    });

    var $tbody = $('.nominationsList .gridList tbody');
    var addNomination = function(n, beginning)
    {
        if (!(n.user instanceof User)) { n.user = new User(n.user); }
        var $newItem = $.renderTemplate('nominationItem', n,
        {
            '.item@data-nominationId': 'id',
            '.user a.userLink@href': function(n)
                { return n.context.user.getProfileUrl(); },
            '.user a.userLink@title': 'user.displayName!',
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
                    '@data-attachmentId': 'a.id',
                    '.fileLink': 'a.filename!',
                    '.fileLink@title': 'a.filename!',
                    '.fileLink@href': '/api/nominations/#{id}/attachments/#{a.id}'
                }
            },
            '.rating .value': 'netVotes',
            '.rating@class+': function(n)
                {
                    return n.context.netVotes > 0 ? 'positive' :
                        n.context.netVotes < 0 ? 'negative' : '';
                },
            '.status .currentStatus': function(n)
                { return friendlyStatus(n.context).capitalize(); },
            '.status@class+': function(n)
                { return friendlyStatus(n.context).toLowerCase(); },
            '.item@class+': 'status'
        }).find('tr.item');

        if (beginning) { $tbody.prepend($newItem); }
        else { $tbody.append($newItem); }
    };

    _.each(blist.nominations.items, function(n) { addNomination(n); });

    var $dialog = $('.nominateDialog');
    var showNomDialog = function(nomId, title, desc)
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

    var saveNomination = function(attachmentId)
    {
        var nomination = {
            title: $dialog.find('#nominateTitle').val(),
            description: $dialog.find('#nominateDescription').val()
        };
        var editId = $dialog.attr('data-editId');

        var url = '/api/nominations';
        if (!$.isBlank(editId)) { url += '/' + editId; }
        url += '.json';
        if (!$.isBlank(attachmentId))
        { url += '?attachmentIds=' + attachmentId; }

        $.ajax({url: url, type: !$.isBlank(editId) ? 'PUT' : 'POST',
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
                if ($.isBlank(editId))
                { addNomination(resp, true); }
                else
                {
                    var $item =
                        $('.nominationsList .gridList .item[data-nominationid=' +
                        editId + ']');
                    $item.find('.details .title').text(nomination.title);
                    $item.find('.details .description')
                        .text(nomination.description)
                        .toggleClass('hide', $.isBlank(nomination.description));
                }
            }});
    };

    $dialog.find('form').validate({errorElement: 'span'});
    var $uploadButton = $dialog.find('.fileBrowseButton');
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

    $('.nominateLink.hasUser').click(function(e)
    {
        e.preventDefault();
        showNomDialog();
    });

    $.live('.nominationsList .gridList .details .edit', 'click', function(e)
    {
        e.preventDefault();
        var $item = $(this).closest('tr.item');
        showNomDialog($item.attr('data-nominationId'),
            $item.find('.details .title').text(),
            $item.find('.details .description').text());
    });

});
