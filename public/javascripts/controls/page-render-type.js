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

                hookUpNavigation(prtObj);
                prtObj.settings.view.bind('row_count_change', function()
                    { updateNavigation(prtObj); })
                    .bind('query_change', function()
                    {
                        prtObj._curRowIndex = 0;
                        renderCurrentRow(prtObj);
                    });

                prtObj._curRowIndex = 0;

                var mainUpdate = function()
                {
                    prtObj.richRenderer.renderLayout();
                    renderCurrentRow(prtObj);
                };
                prtObj.settings.view.bind('columns_changed', mainUpdate);
                prtObj.$dom().bind('show', mainUpdate);

                $(document).bind(blist.events.DISPLAY_ROW, function(e, rowIndex)
                        { prtObj.displayRowByIndex(rowIndex); });
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

            $nav: function()
            {
                if (!this._$nav)
                { this._$nav = this.$dom().find('.navigation'); }
                return this._$nav;
            },

            displayRowByIndex: function(index)
            {
                var prtObj = this;

                if (index < 0)
                { index = prtObj.settings.view.totalRows + index + 1; }
                if (index >= prtObj.settings.view.totalRows)
                { index = prtObj.settings.view.totalRows - 1; }

                prtObj._curRowIndex = index;
                renderCurrentRow(prtObj);
                updateNavigation(prtObj);
            },

            displayRowByID: function(rowId)
            {
                var prtObj = this;

                prtObj.settings.view.rowIndex(rowId, function(rowIndex)
                {
                    if ($.isBlank(rowIndex)) { throw 'No row for ' + rowId; }
                    prtObj._curRowIndex = rowIndex;
                    renderCurrentRow(prtObj);
                    updateNavigation(prtObj);
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

    var hookUpNavigation = function(prtObj)
    {
        prtObj.$nav().find('.button').click(function(e)
        {
            var $a = $(this);
            if ($a.parent().hasClass('edit')) { return; }

            e.preventDefault();
            if ($a.is('.disabled')) { return; }

            switch ($.hashHref($a.attr('href')))
            {
                case 'start':
                    prtObj.displayRowByIndex(0);
                    break;
                case 'end':
                    prtObj.displayRowByIndex(-1);
                    break;
                case 'previous':
                    prtObj.displayRowByIndex(prtObj._curRowIndex - 1);
                    break;
                case 'next':
                    prtObj.displayRowByIndex(prtObj._curRowIndex + 1);
                    break;
            }
        });
    };

    var updateNavigation = function(prtObj)
    {
        var $info = prtObj.$nav().find('.info');
        $info.find('.curRow').text(prtObj._curRowIndex + 1);
        var rowCount = prtObj.settings.view.totalRows;
        $info.find('.totalRows').text(rowCount);

        prtObj.$nav().find('.start, .previous')
            .toggleClass('disabled', prtObj._curRowIndex <= 0);
        prtObj.$nav().find('.end, .next')
            .toggleClass('disabled', prtObj._curRowIndex >= rowCount - 1);
    };

    var renderCurrentRow = function(prtObj)
    {
        if ($.isBlank(prtObj._curRowIndex)) { return; }

        var rowLoaded = function(rows)
        {
            if (rows.length != 1) { return; }
            var row = rows[0];

            prtObj.richRenderer.renderRow(prtObj.$content(), row);
            prtObj.richRenderer.adjustLayout();
        };
        prtObj.settings.view.getRows(prtObj._curRowIndex, 1, rowLoaded);
    };

})(jQuery);
