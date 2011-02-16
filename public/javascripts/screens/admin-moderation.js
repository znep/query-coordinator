;$(function()
{
    var moderationNS = blist.namespace.fetch('blist.moderation');

    // rendering
    var directive = {
        'tbody .item': {
            'comment<-': {
                '.@data-commentid': 'comment.id',
                '.@data-commentstatus': 'comment.status',
                '.author a@href': function(c) { return c.item.user.getProfileUrl(); },
                '.author img@src': function(c) { return c.item.user.getProfileImageUrl('small'); },
                '.author img@alt': 'comment.user.displayName!',
                '.author .cellInner': 'comment.user.displayName!',
                '.comment .cellInner': function(c) { return (new Date(c.item.createdAt * 1000)).toLocaleString(); },
                '.comment .commentBody': 'comment.body!',
                '.dataset .cellInner@href': 'comment.view.url',
                '.dataset .cellInner': 'comment.view.name!',
                '.status .cellInner': 'comment.status',
                '.status .approveComment@class+': function(c) { return (c.item.status == 'approved') ? 'disabled' : '' },
                '.status .rejectComment@class+': function(c) { return (c.item.status == 'rejected') ? 'disabled' : '' }
            }
        }
    };

    // get the data
    var comments = {};
    $.ajax({
        url: moderationNS.servicePath,
        dataType: 'json',
        success: function(response)
        {
            _.each(response, function(comment)
            {
                comments[comment.id] = $.extend({}, comment, { user: new User(comment.user),
                                                               view: new Dataset(comment.view) });
            });
            $('.tableContainer').append(
                $.renderTemplate('moderationsTable', _.values(comments), directive));

            $('.commentModerationList.gridList').combinationList({
                headerContainerSelector: '.gridListWrapper',
                initialSort: [[1, 1]],
                scrollableBody: false,
                selectable: false,
                sortGrouping: false,
                sortHeaders: {0: {sorter: 'text'}, 1: {sorter: 'autoDateTime'},
                    2: {sorter: 'text'}, 3: {sorter: 'text'}},
                sortTextExtraction: function(node) {
                    return $(node).find('.cellInner').text();
                }
            });
        }
    });

    // events
    var updateCommentStatus = function(commentId, status)
    {
        var comment = comments[commentId];
        var $rows = $('[data-commentid=' + commentId + '] .status');

        $rows.find('.cellInner').html('<span class="loading"></span>');
        $.ajax({
            url: '/views/' + comment.view.id + '/comments?method=moderate' +
                 '&id=' + comment.id + '&status=' + status.toUpperCase(),
            type: 'POST',
            dataType: 'json',
            success: function(response)
            {
                var buttonMap = {
                    'approved': 'approveComment',
                    'rejected': 'rejectComment'
                };
                $rows
                    .closest('tr').attr('data-commentstatus', status).end()
                    .find('.cellInner').text(status).end()
                    .find('.button').removeClass('disabled')
                        .filter('.' + buttonMap[status]).addClass('disabled');
            }
        });
    };

    $.live('.approveComment, .rejectComment', 'click', function(event)
    {
        event.preventDefault();

        var $this = $(this);
        if ($this.is('.disabled'))
        {
            return;
        }

        updateCommentStatus($this.closest('.item').attr('data-commentid'), $this.attr('data-action'));
    });

    $('#commentStatusDropdown')
        .change(function()
        {
            var value = $(this).val();
            if (value == 'all')
            {
                $('.commentModerationList tbody tr').show();
                $('.noResultsMessage').hide();
                return;
            }
            else
            {
                $('.commentModerationList tbody tr').hide()
                    .filter('[data-commentstatus=' + value + ']').show();

                if ($('.commentModerationList tbody tr:visible').length === 0)
                {
                    $('.noResultsMessage').fadeIn();
                }
                else
                {
                    $('.noResultsMessage').hide();
                }
            }
        })
        .uniform();
});
