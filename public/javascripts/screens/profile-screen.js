;blist.namespace.fetch('blist.profile');

(function($)
{
    var user = new User({id: blist.profile.profileUserId}),
        $feedContainer = $('.newsFeed .feed');

    var renderFeed = function(views)
    {
        $feedContainer.find('.loadingSpinner').remove();
        $feedContainer.feedList({
            allowComments: false,
            pageSize: 5,
            views: views,
        });
    };

    // Render the feed template
    $feedContainer.append(
        $.renderTemplate('feedList')
            // No commenting from the profile page
            .find('.feedNewCommentButton').remove()
            .end());

    $feedContainer.append('<div class="loadingSpinner"></div>');

    // Get the user's views for the news feed
    // TODO: Get activity on child views of their datasets?
    user.getDatasets(function(views)
    { renderFeed(views); });

    // Follow/unfollow a user
    $('.followButton').click(function(event)
    {
        event.preventDefault();
        var $link = $(event.target).closest('a'),
            newText = 'Follow',
            origHref = $link.attr('href'),
            isCreate = false;

        if ($link.is('.add'))
        { newText = 'Unfollow'; isCreate = true; }

        $.ajax({
            url: origHref,
            type: 'GET',
            success: function(responseText) {
                var newHref = isCreate ?
                    origHref.replace("create", "delete") :
                    origHref.replace("delete", "create");

                $link
                    .find('.linkText')
                        .text(newText)
                    .end()
                    .attr('href', newHref)
                    .toggleClass('add remove');
            }
        });

    });

    $('.showMoreContacts').click(function(event)
    {
        event.preventDefault();
        var $link    = $(event.target),
            expanded = $link.text() == 'View All',
            newText  = (expanded ? 'Hide' : 'View All');

        $link
            .text(newText)
            .closest('.userList')
                .find('.hiddenContacts')
                    .slideToggle();
    });


})(jQuery);
