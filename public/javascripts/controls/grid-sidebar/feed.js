(function($)
{
    var $feed, feedData, comments, views = [];

    var renderFeed = function(sidebarObj)
    {
        sidebarObj.finishProcessing();

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
                                views = views.concat(relatedViews);
                                if (--pendingRequests === 0)
                                { renderFeed(sidebarObj); }
                            });

                        blist.dataset.getParentDataset(function(parDS)
                            {
                                if (!$.isBlank(parDS))
                                { views = views.concat(parDS); }
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
