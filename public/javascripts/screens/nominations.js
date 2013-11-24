;blist.namespace.fetch('blist.nominations');

$(function()
{
    var ratedNom = {};
    blist.nominations.map = {}
    _.each(blist.nominations.items, function(n)
        { blist.nominations.map[n.id] = new Nomination(n); });

    $.live('.nominationsList .gridList .rating .rateLink', 'click', function(e)
    {
        e.preventDefault();
        var $t = $(this);
        var $td = $t.closest('td');
        var id = $t.closest('tr.item').attr('data-nominationId');
        var isUp = $t.hasClass('rateUp');
        if (ratedNom[id] === isUp) { return; }

        blist.nominations.rate(id, $t, $td,
            function success()
            {
                ratedNom[id] = isUp;
            });
    });

    $.live('.nominationsList .gridList a.delete', 'click', function(e)
    {
        e.preventDefault();
        var $t = $(this);
        var $item = $t.closest('tr.item');
        var id = $item.attr('data-nominationId');
        if (isFile)
        {
            blist.nominations.remove(id, $t.closest('li').attr('data-attachmentId'),
                function() {
                    $t.closest('li').remove();
                }
            );
        }
        else
        {
            blist.nominations.remove(id, null, function() {
                $item.remove();
            });
        }
    });

    $.live('.nominationsList .gridList .status .moderateLink', 'click', function(e)
    {
        e.preventDefault();
        var $t = $(this);
        var status = $t.attr('data-status');
        var id = $t.closest('tr.item').attr('data-nominationId');

        blist.nominations.moderate(id, status, $t.closest('td'));
    });

    blist.nominations.updateNomination = function(editId, nomination)
    {
        var $item =
            $('.nominationsList .gridList .item[data-nominationid=' +
                editId + ']');
        $item.find('.details .title').text(nomination.title);
        $item.find('.details .description')
            .text(nomination.description)
            .toggleClass('hide', $.isBlank(nomination.description));
    };

    var $tbody = $('.nominationsList .gridList tbody');
    blist.nominations.addNomination = function(n, beginning)
    {
        if (!(n.user instanceof User)) { n.user = new User(n.user); }
        blist.nominations.map[n.id] = new Nomination(n);
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
            '.details .titleLink@href': function(n)
               { return $.path('/nominate/' + n.context.id); },
            '.details .title': 'title!',
            '.details .submitTime .fullTime': function(n)
                { return new Date(n.context.createdAt * 1000).format('F d, Y'); },
            '.details .submitTime .relativeTime': function(n)
                { return blist.util.humaneDate
                    .getFromDate(n.context.createdAt * 1000); },
            '.details .description': 'description!',
            '.details .description@class+': function(n)
                { return $.isBlank(n.context.description) ? 'hide' : ''; },
            '.rating .value': 'netVotes',
            '.rating@class+': function(n)
                {
                    return n.context.netVotes > 0 ? 'positive' :
                        n.context.netVotes < 0 ? 'negative' : '';
                },
            '.status .currentStatus': function(n)
                { return blist.nominations.friendlyStatus(n.context).capitalize(); },
            '.status@class+': function(n)
                { return blist.nominations.friendlyStatus(n.context).toLowerCase(); },
            '.item@class+': 'status'
        }).find('tr.item');

        if (beginning) { $tbody.prepend($newItem); }
        else { $tbody.append($newItem); }

        blist.nominations.map[n.id].getComments(function(comments)
        {
            var $commentsSection = $newItem.find('.details .comments');
            $commentsSection.empty();
            if (comments.length > 0)
            {
                var flattenedComments = $.flattenChildren(comments);

                var phrase = [];

                var officialComments = _.select(flattenedComments, function(c)
                {
                    return _.include(c.user.rights || [], 'approve_nominations');
                });

                if (officialComments.length > 0)
                {
                    phrase.push($.tag({
                        tagName: 'strong',
                        contents: [
                            $.pluralize(officialComments.length, 'official response')
                        ]
                    }, true));
                }

                var nonOfficialCommentsLength = flattenedComments.length - officialComments.length;
                if (nonOfficialCommentsLength > 0)
                {
                    phrase.push($.pluralize(nonOfficialCommentsLength, 'comment'));
                }

                $commentsSection.append($.tag({
                    tagName: 'a',
                    'class': 'commentsLink comment',
                    href: $.path('/nominate/' + n.id),
                    contents: [{
                            tagName: 'span',
                            'class': 'icon'
                        },
                        $.arrayToSentence(_.compact(phrase), 'and', ','),
                        ' on this suggestion'
                    ]
                }));
            }
        });
    };

    _.each(blist.nominations.items, function(item) { blist.nominations.addNomination(item); });


    $('.nominateLink.hasUser').click(function(e)
    {
        e.preventDefault();
        blist.nominations.showNomDialog();
    });

    $.live('.nominationsList .gridList .details .edit', 'click', function(e)
    {
        e.preventDefault();
        var $item = $(this).closest('tr.item');
        blist.nominations.showNomDialog($item.attr('data-nominationId'),
            $item.find('.details .title').text(),
            $item.find('.details .description').text());
    });

});
