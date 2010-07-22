(function($)
{
    var $feed, feedData, comments, views;

    var renderFeed = function()
    {
        $feed.removeClass('loading');

        $feed.find('.feed').feedList({
            comments: comments,
            mainViewId: blist.display.view.id,
            views: views
        });
    };

    var pendingRequests = 3;

    var config =
    {
        name: 'feed',
        title: 'Feed',
        subtitle: 'The feed shows you the discussion and activity around a dataset',
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
            $.Tache.Get({
                url: '/views/' + blist.display.view.id + '/comments.json',
                dataType: 'json', cache: false,
                success: function(responseData)
                {
                    comments = responseData;
                    if (--pendingRequests === 0)
                        renderFeed();
                }
            });

            $.Tache.Get({ url: '/views.json', data: { method: 'getByTableId',
                    tableId: blist.display.view.tableId }, cache: false,
                dataType: 'json', contentType: 'application/json',
                success: function(responseData)
                {
                    views = responseData;
                    if (--pendingRequests === 0)
                        renderFeed();
                }
            });
        });
    });

})(jQuery);
