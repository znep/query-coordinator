(function($)
{
    var $feed, feedData, comments, views;

    var renderFeed = function(sidebarObj)
    {
        sidebarObj.finishProcessing();

        $feed.find('.feed').feedList({
            comments: comments,
            mainView: blist.dataset,
            views: views
        });
    };

    var pendingRequests = 2;

    var config =
    {
        name: 'feed',
        title: 'Discuss',
        subtitle: 'The discussion feed shows you the conversation and activity around a dataset',
        resizable: true,
        sections: [
            {
                customContent: {
                    template: 'feedList',
                    directive: {},
                    data: {},
                    callback: function($elem, sidebarObj)
                    {
                        sidebarObj.startProcessing();
                        $feed = $elem;
                        blist.dataset.getComments(function(responseData)
                            {
                                comments = responseData;
                                if (--pendingRequests === 0)
                                { renderFeed(sidebarObj); }
                            });

                        blist.dataset.getRelatedViews(function(relatedViews)
                            {
                                views = relatedViews.concat(blist.dataset);
                                if (--pendingRequests === 0)
                                { renderFeed(sidebarObj); }
                            });
                    }
                }
            }
        ]
    };

    $.gridSidebar.registerConfig(config);

})(jQuery);
