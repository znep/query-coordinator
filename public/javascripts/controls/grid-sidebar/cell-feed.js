(function($)
{
    if (blist.sidebarHidden.feed &&
        blist.sidebarHidden.feed.cellFeed) { return; }

    var renderFeed = function($feed, sidebarObj, paneData)
    {
        sidebarObj.finishProcessing();

        $feed.find('.feed').feedList({
            comments: paneData.comments,
            filterCategories: null,
            mainView: blist.dataset,
            commentCreateData: {rowId: paneData.rowId, tableColumnId: paneData.tableColumnId}
        });
    };

    var config =
    {
        name: 'cellFeed',
        title: 'Cell Comments',
        noReset: true,
        sections: [
            {
                customContent: {
                    template: 'cellFeedTitle',
                    directive: {
                        '.rowName': function(c)
                        { return blist.dataset.rowForID(c.context.rowId).index + 1; },
                        '.columnName': function(c)
                        { return $.htmlEscape(blist.dataset.columnForTCID(c.context.tableColumnId).name); }
                    }
                }
            },
            {
                customContent: {
                    template: 'feedList',
                    directive: {},
                    data: {},
                    callback: function($elem, sidebarObj, paneData)
                    {
                        sidebarObj.startProcessing();
                        $elem.closest('.sidebarPane').data('paneData', paneData);
                        blist.dataset.getComments(function(responseData)
                        {
                            renderFeed($elem, sidebarObj, $.extend({}, paneData, {comments: responseData}));
                        }, paneData.rowId, paneData.tableColumnId);
                    }
                }
            }
        ],
        showCallback: function(sidebarObj, $pane)
        {
            var data = $pane.data('paneData');
            $(document).trigger('cell_feed_shown', [data.rowId, data.tableColumnId]);
        },
        hideCallback: function(sidebarObj, $pane)
        {
            var data = $pane.data('paneData');
            $(document).trigger('cell_feed_hidden', [data.rowId, data.tableColumnId]);
        }
    };

    $.gridSidebar.registerConfig(config);

})(jQuery);
