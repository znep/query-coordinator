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
            hideCallback: function() {},
            showCallback: function() {},
            view: null
        },

        prototype:
        {
            init: function ()
            {
                var prtObj = this;
                var $domObj = prtObj.$dom();
                $domObj.data("pageRenderType", prtObj);

                $domObj.bind('resize', function(e)
                    { resizeHandle(prtObj); });

                hookUpNavigation(prtObj);
                prtObj.settings.view.bind('row_count_change', function()
                    { updateNavigation(prtObj); });
                prtObj._visible = false;

                prtObj._curRowIndex = 0;
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

            show: function()
            {
                var prtObj = this;
                prtObj._visible = true;
                prtObj.$dom().removeClass('hide');

                renderCurrentRow(prtObj);
                updateNavigation(prtObj);

                prtObj.settings.showCallback();
            },

            hide: function()
            {
                var prtObj = this;
                prtObj._visible = false;
                prtObj.$dom().addClass('hide');
                prtObj.settings.hideCallback();
            },

            displayRowByIndex: function(index)
            {
                var prtObj = this;

                if (index < 0)
                { index = prtObj.settings.view.totalRows + index + 1; }
                if (index >= prtObj.settings.view.totalRows)
                { index = prtObj.settings.view.totalRows - 1; }

                prtObj._curRowIndex = index;
                if (!prtObj._visible) { prtObj.show(); }
                else
                {
                    renderCurrentRow(prtObj);
                    updateNavigation(prtObj);
                }
            },

            displayRowByID: function(rowId)
            {
                var prtObj = this;

                var row = prtObj.settings.view.getRowByID(rowId);
                if ($.isBlank(row)) { throw 'No row for ' + rowId; }
                prtObj._curRowIndex = row.index;

                if (!prtObj._visible) { prtObj.show(); }
                else
                {
                    renderCurrentRow(prtObj);
                    updateNavigation(prtObj);
                }
            }
        }
    });

    var resizeHandle = function(prtObj)
    {
        prtObj.$content().height(prtObj.$dom().height() -
            (prtObj.$content().outerHeight(true) - prtObj.$content().height()));
    };

    var hookUpNavigation = function(prtObj)
    {
        prtObj.$nav().find('.button').click(function(e)
        {
            e.preventDefault();
            var $a = $(this);
            if ($a.is('.disabled')) { return; }

            switch ($.hashHref($a.attr('href')))
            {
                case 'first':
                    prtObj.displayRowByIndex(0);
                    break;
                case 'last':
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

        prtObj.$nav().find('.first, .previous')
            .toggleClass('disabled', prtObj._curRowIndex <= 0);
        prtObj.$nav().find('.last, .next')
            .toggleClass('disabled', prtObj._curRowIndex >= rowCount - 1);
    };

    var renderCurrentRow = function(prtObj)
    {
        var rowLoaded = function(rows)
        {
            if (rows.length != 1) { return; }
            var row = rows[0];
        };
        prtObj.settings.view.getRows(prtObj._curRowIndex, 1, rowLoaded);
    };

})(jQuery);
