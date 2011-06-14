;blist.namespace.fetch('blist.profile');

(function($)
{
    var user = new User({id: blist.profile.profileUserId});

    // var $feedContainer = $('.newsFeed .feed');

    // var renderFeed = function(views)
    // {
    //     $feedContainer.find('.loadingSpinner').remove();
    //     $feedContainer.feedList({
    //         allowComments: false,
    //         pageSize: 5,
    //         views: views
    //     });
    // };

    // // Render the feed template
    // $feedContainer.append(
    //     $.renderTemplate('feedList')
    //         // No commenting from the profile page
    //         .find('.feedNewCommentButton').remove()
    //         .end());

    // $feedContainer.append('<div class="loadingSpinner"></div>');

    // Get the user's views for the news feed
    // TODO: Get activity on child views of their datasets?
    // TEMP: disable the feed until it's more interesting
    //   user.getDatasets(function(views)
    //   { renderFeed(views); });

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

    var $contactDialog = $('.contactUserDialog');
    var $contactForm   = $contactDialog.find('form');
    var $contactError  = $contactDialog.find('.mainError');
    var $mainFlash     = $('.mainFlash .flash');
    $('.contactUserButton').click(function(event)
    {
        event.preventDefault();
        $contactForm[0].reset();
        $contactDialog.jqmShow();
    });
    $contactDialog.find('.submitAction').click(function(event)
    {
        event.preventDefault();

        $contactForm.find('.prompt.required').val('');
        $contactError.removeClass('error').text('');
        if (!$contactForm.valid()) { return; }

        $.socrataServer.makeRequest({
            type: 'POST', url: $contactForm.attr('action'),
            data: JSON.stringify($contactForm.serializeObject()),
            success: function() {
                $contactDialog.jqmHide();
                $mainFlash.text('Your message has been sent').addClass('notice');
                setTimeout(function() { $mainFlash.fadeOut(); }, 5000);
            }, error: function() {
                $contactError
                    .text('There was a problem sending your email. Please try again later.')
                    .addClass('error');
            }
        });
    });
    $contactForm.validate();

})(jQuery);
