(function($)
{
    $.fn.rowSearchRenderType = function(options)
    {
        // Check if object was already created
        var rowSearchRenderType = $(this[0]).data("rowSearchRenderType");
        if (!rowSearchRenderType)
        {
            rowSearchRenderType = new rowSearchRenderTypeObj(options, this[0]);
        }
        return rowSearchRenderType;
    };

    var rowSearchRenderTypeObj = function(options, dom)
    {
        this.settings = $.extend({}, rowSearchRenderTypeObj.defaults, options);
        this.currentDom = dom;
        this.init();
    };

    $.extend(rowSearchRenderTypeObj,
    {
        defaults:
        {
            columnCount: 3,
            highlight: null,
            rows: null,
            view: null,
            query: null,
            usingTemplate: '.rowSearchRenderType'
        },

        prototype:
        {
            init: function ()
            {
                var rsObj = this;
                var $domObj = rsObj.$dom();
                $domObj.data("rowSearchRenderType", rsObj);

                if (rsObj.settings.usingTemplate)
                {
                    $domObj.append($('#templates')
                        .find(rsObj.settings.usingTemplate).clone());
                }

                rsObj.richRenderer = rsObj.$template().richRenderer({
                    balanceNaively: true, columnCount: rsObj.settings.columnCount,
                    highlight: rsObj.settings.highlight, clipByHighlight: true,
                    config: getConfig(rsObj),
                    view: rsObj.settings.view
                });

                rsObj.richRenderer.renderLayout();
                rsObj.richRenderer.adjustLayout();
                renderCurrentPage(rsObj);
            },

            $dom: function()
            {
                if (!this._$dom)
                { this._$dom = $(this.currentDom); }
                return this._$dom;
            },

            $list: function()
            {
                if (!this._$list)
                { this._$list = this.$dom().find('.rowList'); }
                return this._$list;
            },

            $template: function()
            {
                if (!this._$template)
                { this._$template = this.$dom().find('.templateRow'); }
                return this._$template;
            }
        }
    });

    var getConfig = function(rsObj)
    {
        var config = ((rsObj.settings.view.metadata || {})
                        .richRendererConfigs || {}).fatRow;

        var cols = _(rsObj.settings.rows).chain()
            .reduce(function(memo, row)
        {
            // Grab the ones with a highlight.
            return memo.concat(_.select(rsObj.settings.view.visibleColumns,
                function(rcol)
                { return rsObj.settings.highlight.test(row[rcol.lookup]); }));
        }, [])
            .uniq().value();

        // Fill up any more slots with remaining columns if available.
        if (cols.length < rsObj.settings.columnCount)
        {
            cols = cols.concat(
                _.difference(rsObj.settings.view.visibleColumns, cols)
                    .slice(0, rsObj.settings.columnCount - cols.length));
        }

        // Convert into richRenderer readable format.
        cols = _.map(cols, function(col)
        {
            return { rows: [{ fields: [
                        { type: 'columnLabel', fieldName: col.fieldName },
                        { type: 'columnData',  fieldName: col.fieldName }]
                   }]};
        });

        return $.extend({}, config, { columns: cols });
    };

    var renderNewRow = function(rsObj, r)
    {
        var $item = rsObj.$template().clone().removeClass('templateRow');
        rsObj.richRenderer.renderRow($item, r);
        rsObj.$list().append($item);
    };

    var renderCurrentPage = function(rsObj)
    {
        rsObj.$dom()
            .find('.rowResultCountText')
                .text((rsObj.settings.rows || []).length).end()
            .find('.totalResultCountText')
                .text(rsObj.settings.totalRowResults).end()
            .find('.rowSearchLink')
                .attr('href', rsObj.settings.view.fullUrl + '?q=' + rsObj.settings.query);

        _.each(rsObj.settings.rows, function(r) { renderNewRow(rsObj, r); });
    };

})(jQuery);
