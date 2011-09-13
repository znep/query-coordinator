(function($)
{
    $.Control.extend('pane_cellFeed', {
        getTitle: function()
        { return 'Cell Comments'; },

        _getSections: function()
        {
            var cpObj = this;
            return [
                {
                    customContent: {
                        template: 'cellFeedTitle',
                        directive: {
                            '.rowName': function(c)
                            { return cpObj.settings.view.rowForID(c.context.rowId).index + 1; },
                            '.columnName': function(c)
                            {
                                return $.htmlEscape(cpObj.settings.view.
                                    columnForTCID(c.context.tableColumnId).name);
                            }
                        }
                    }
                },
                {
                    customContent: {
                        template: 'feedList',
                        directive: {},
                        data: {},
                        callback: function($elem, paneData)
                        {
                            cpObj._cellPaneData = paneData;
                            cpObj._startProcessing();
                            cpObj.settings.view.getComments(function(responseData)
                            {
                                cpObj._finishProcessing();

                                $elem.find('.feed').feedList({
                                    comments: responseData,
                                    filterCategories: null,
                                    mainView: cpObj.settings.view,
                                    commentCreateData: {rowId: paneData.rowId,
                                        tableColumnId: paneData.tableColumnId}
                                });
                            }, paneData.rowId, paneData.tableColumnId);
                        }
                    }
                }
            ];
        },

        shown: function()
        {
            this._super();
            $(document).trigger('cell_feed_shown',
                [this._cellPaneData.rowId, this._cellPaneData.tableColumnId]);
        },

        hidden: function()
        {
            this._super();
            $(document).trigger('cell_feed_hidden',
                [this._cellPaneData.rowId, this._cellPaneData.tableColumnId]);
        }
    }, {name: 'cellFeed', noReset: true}, 'controlPane');

    if ($.isBlank(blist.sidebarHidden.feed) || !blist.sidebarHidden.feed.cellFeed)
    { $.gridSidebar.registerConfig('cellFeed', 'pane_cellFeed'); }

})(jQuery);
