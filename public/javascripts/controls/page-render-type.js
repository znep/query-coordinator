(function($)
{
    $.fn.pageRenderType = function(options)
    {
        // Check if object was already created
        var pageRenderType = $(this[0]).data("pageRenderType");
        if (!pageRenderType)
        {
            pageRenderType = new pageRenderTypeObj(options, this[0]);
        }
        return pageRenderType;
    };

    var pageRenderTypeObj = function(options, dom)
    {
        this.settings = $.extend({}, pageRenderTypeObj.defaults, options);
        this.currentDom = dom;
        this.init();
    };

    $.extend(pageRenderTypeObj,
    {
        defaults:
        {
            defaultRowId: null,
            view: null
        },

        prototype:
        {
            init: function ()
            {
                var prtObj = this;
                var $domObj = prtObj.$dom();
                $domObj.data("pageRenderType", prtObj);

                prtObj.richRenderer = prtObj.$content().richRenderer({
                    columnCount: 2,
                    config: ((prtObj.settings.view.metadata || {})
                        .richRendererConfigs || {}).page,
                    view: prtObj.settings.view
                });

                $domObj.bind('resize', function(e)
                    { resizeHandle(prtObj); });

                prtObj.navigation = $domObj.find('.navigation')
                    .bind('page_changed', function()
                        { renderCurrentRow(prtObj); })
                    .navigation({pageSize: 1, view: prtObj.settings.view});

                prtObj._shown = false;
                var mainUpdate = function()
                {
                    if (!prtObj._shown) { return; }
                    prtObj.richRenderer.renderLayout();
                    renderCurrentRow(prtObj);
                };
                var rowChange = function(rows, fullReset)
                {
                    if (!prtObj._shown) { return; }
                    if (fullReset)
                    { mainUpdate(); }
                    else
                    {
                        var cp = prtObj.navigation.currentPage();
                        if ($.isBlank(cp)) { return; }
                        _.each(rows, function(r)
                        {
                            var realRow = prtObj.settings.view.rowForID(r.id);
                            if (!$.isBlank(realRow) && realRow.index == cp)
                            { renderCurrentRow(prtObj); }
                        });
                    }
                };
                prtObj.settings.view
                    .bind('columns_changed', mainUpdate)
                    .bind('query_change', mainUpdate)
                    .bind('row_change', rowChange);

                prtObj.$dom().bind('show', function()
                {
                    prtObj._shown = true;
                    resizeHandle(prtObj);
                    mainUpdate();
                });
                prtObj.$dom().bind('hide', function() { prtObj._shown = false; });

                $(document).bind(blist.events.DISPLAY_ROW, function(e, rowId)
                        { prtObj.displayRowByID(rowId); });

                if (!$.isBlank(prtObj.settings.defaultRowId))
                { prtObj.displayRowByID(prtObj.settings.defaultRowId); }

                prtObj.$content().bind(
                    {'mouseenter': function(e)
                        {
                            var row = $(this).data('renderrow');
                            if (!row.sessionMeta || !row.sessionMeta.highlight)
                            { prtObj.settings.view.markRow('highlight', true, row.id); }
                        },
                    'mouseleave': function(e)
                        {
                            var row = $(this).data('renderrow');
                            if (row.sessionMeta && row.sessionMeta.highlight)
                            { prtObj.settings.view.markRow('highlight', false, row.id); }
                        }});
            },

            $dom: function()
            {
                if (!this._$dom)
                { this._$dom = $(this.currentDom); }
                return this._$dom;
            },

            $content: function()
            {
                if (!this._$content)
                { this._$content = this.$dom().find('.content'); }
                return this._$content;
            },

            displayRowByID: function(rowId)
            {
                var prtObj = this;

                prtObj.settings.view.rowIndex(rowId, function(rowIndex)
                {
                    if ($.isBlank(rowIndex)) { throw 'No row for ' + rowId; }
                    prtObj.navigation.displayPage(rowIndex);
                });
            }
        }
    });

    var resizeHandle = function(prtObj)
    {
        prtObj.$content().height(prtObj.$dom().height() -
            (prtObj.$content().outerHeight(true) - prtObj.$content().height()));
        prtObj.richRenderer.adjustLayout();
    };

    var renderCurrentRow = function(prtObj)
    {
        if ($.isBlank(prtObj.navigation.currentPage())) { return; }

        var rowLoaded = function(rows)
        {
            if (rows.length != 1) { return; }
            var row = rows[0];

            prtObj.richRenderer.renderRow(prtObj.$content(), row, true);
            prtObj.richRenderer.adjustLayout();
        };
        var loadRows;
        loadRows = function()
        { prtObj.settings.view.getRows(prtObj.navigation.currentPage(), 1, rowLoaded, loadRows); };
        loadRows();
    };

})(jQuery);
