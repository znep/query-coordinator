(function($)
{
    var $feed, feedData, comments, views;

    var renderFeed = function()
    {
        $feed.removeClass('loading');

        $feed.find('.feed').feedList({
            comments: comments,
            mainView: blist.dataset,
            views: views
        });
    };

    var pendingRequests = 3;

    var config =
    {
        name: 'feed',
        title: 'Discuss',
        subtitle: 'The discussion feed shows you the conversation and activity around a dataset',
        sections: [
            {
                customContent: {
                    template: 'feedList',
                    directive: {},
                    data: {},
                    callback: function($elem)
                    {
                        $elem.addClass('loading');
                        $feed = $elem;
                        if (--pendingRequests === 0)
                            renderFeed();
                    }
                }
            }
        ]
    };

    $.gridSidebar.registerConfig(config);

    // Document ready, load data
    $(function()
    {
        _.defer(function()
        {
            blist.dataset.getComments(function(responseData)
                {
                    comments = responseData;
                    if (--pendingRequests === 0)
                        renderFeed();
                });

            blist.dataset.getRelatedViews(function(relatedViews)
                {
                    views = relatedViews.concat(blist.dataset);
                    if (--pendingRequests === 0) { renderFeed(); }
                });
        });
    });

})(jQuery);
