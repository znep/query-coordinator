(function($)
{
    $.Control.extend('pane_feed', {
        getTitle: function()
        { return 'Discuss'; },

        getSubtitle: function()
        { return 'The discussion feed shows you the conversation and activity around a dataset'; },

        _getSections: function()
        {
            return [
                {
                    customContent: {
                        template: 'feedList',
                        directive: {},
                        data: {},
                        callback: function($elem, sidebarObj)
                        {
                            var cpObj = this;
                            cpObj._startProcessing();

                            var comments;
                            var views = [];
                            doRender = _.after(3, function()
                            {
                                cpObj._finishProcessing();

                                cpObj.$dom().find('.feedList .feed').feedList({
                                    comments: comments,
                                    mainView: cpObj.settings.view,
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

                            cpObj.settings.view.getComments(function(responseData)
                                {
                                    comments = responseData;
                                    doRender();
                                });

                            cpObj.settings.view.getRelatedViews(function(relatedViews)
                                {
                                    views = views.concat(relatedViews);
                                    doRender();
                                });

                            cpObj.settings.view.getParentDataset(function(parDS)
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
