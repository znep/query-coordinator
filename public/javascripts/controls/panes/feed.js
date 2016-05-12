(function($)
{
    $.Control.extend('pane_feed', {
        getTitle: function()
        { return $.t('screens.ds.grid_sidebar.feed.title'); },

        getSubtitle: function()
        { return $.t('screens.ds.grid_sidebar.feed.subtitle'); },

        _getSections: function()
        {
            return [
                {
                    customContent: {
                        template: 'feedList',
                        directive: {},
                        data: {},
                        callback: function($elem)
                        {
                            var cpObj = this;
                            cpObj._startProcessing();

                            var comments;
                            var views = [];
                            doRender = _.after(2, function()
                            {
                                cpObj._finishProcessing();

                                cpObj.$dom().find('.feedList .feed').feedList({
                                    comments: comments,
                                    mainView: cpObj._view,
                                    views: views,
                                    addCommentCallback: function(view, comment)
                                    {
                                        $('.controlPane.about .numberOfComments')
                                            .text(view.numberOfComments);
                                        if (!$.isBlank(blist.datasetPage))
                                        {
                                            blist.datasetPage.$feedTab.contentIndicator()
                                                .setText(view.numberOfComments);
                                        }
                                    }
                                });
                            });

                            cpObj._view.getComments(function(responseData)
                                {
                                    comments = responseData;
                                    doRender();
                                });

                            cpObj._view.getRelatedViews(function(relatedViews)
                                {
                                    views = views.concat(relatedViews);
                                    doRender();
                                });

                            cpObj._view.getParentDataset(function(parDS)
                                {
                                    if (!$.isBlank(parDS))
                                    { views = views.concat(parDS); }
                                    doRender();
                                });
                        }
                    }
                }
            ];
        }
    }, {name: 'feed', noReset: true}, 'controlPane');

    if ($.isBlank(blist.sidebarHidden.feed) || !blist.sidebarHidden.feed.discuss)
    { $.gridSidebar.registerConfig('feed', 'pane_feed'); }

})(jQuery);
