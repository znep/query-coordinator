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
                    balanceNaively: true, columnCount: 3,
                    highlight: rsObj.settings.highlight,
                    config: ((rsObj.settings.view.metadata || {})
                        .richRendererConfigs || {}).fatRow,
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
