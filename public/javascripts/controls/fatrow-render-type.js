(function($)
{
    $.fn.fatrowRenderType = function(options)
    {
        // Check if object was already created
        var fatrowRenderType = $(this[0]).data("fatrowRenderType");
        if (!fatrowRenderType)
        {
            fatrowRenderType = new fatrowRenderTypeObj(options, this[0]);
        }
        return fatrowRenderType;
    };

    var fatrowRenderTypeObj = function(options, dom)
    {
        this.settings = $.extend({}, fatrowRenderTypeObj.defaults, options);
        this.currentDom = dom;
        this.init();
    };

    $.extend(fatrowRenderTypeObj,
    {
        defaults:
        {
            pageSize: 20,
            view: null
        },

        prototype:
        {
            init: function ()
            {
                var frObj = this;
                var $domObj = frObj.$dom();
                $domObj.data("fatrowRenderType", frObj);

                frObj.richRenderer = frObj.$template().richRenderer({
                    balanceFully: true, columnCount: 3,
                    config: ((frObj.settings.view.metadata || {})
                        .richRendererConfigs || {}).fatRow,
                    view: frObj.settings.view
                });

                frObj.navigation = frObj.$dom().find('.navigation')
                    .bind('page_changed', function()
                        { renderCurrentPage(frObj); })
                    .navigation({pageSize: frObj.settings.pageSize,
                        view: frObj.settings.view});

                hookUpHeaders(frObj);

                $domObj.bind('resize', function(e) { resizeHandle(frObj); });

                frObj._shown = false;
                var mainUpdate = function()
                {
                    if (!frObj._shown) { return; }
                    renderHeaders(frObj);
                    frObj.richRenderer.renderLayout();
                    renderCurrentPage(frObj);
                };
                frObj.settings.view
                    .bind('columns_changed', mainUpdate)
                    .bind('query_change', mainUpdate)
                    .bind('row_change', mainUpdate);

                frObj.$dom().bind('show', function()
                {
                    frObj._shown = true;
                    resizeHandle(frObj);
                    mainUpdate();
                });
                frObj.$dom().bind('hide', function() { frObj._shown = false; });
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

    var resizeHandle = function(frObj)
    {
        frObj.$list().height(frObj.$dom().height() -
            (frObj.$list().outerHeight(true) - frObj.$list().height()) -
            frObj.$dom().find('.columnHeaders').outerHeight(true));
        frObj.richRenderer.adjustLayout();
    };

    var hookUpHeaders = function(frObj)
    {
        var sortHandle = function(e)
        {
            e.preventDefault();
            var $this = $(this);

            var c = $this.closest('.column').data('column');
            if (!c.renderType.sortable) { return; }
            var asc = !c.sortAscending;

            if ($this.isSocrataTip()) { $this.socrataTip().hide(); }

            var isTemp = frObj.settings.view.temporary;
            var query = $.extend(true, {}, frObj.settings.view.query);
            if ($this.hasClass('clearSort'))
            {
                query.orderBys = _.reject(query.orderBys || [], function(ob)
                    { return ob.expression.columnId == c.id; });
                if (query.orderBys.length == 0) { delete query.orderBys; }
            }
            else
            {
                query.orderBys = [{expression: {columnId: c.id, type: 'column'},
                    ascending: asc}];
            }

            frObj.settings.view.update({query: query});

            if ((query.orderBys || []).length < 2 &&
                    frObj.settings.view.hasRight('update_view') && !isTemp)
            { frObj.settings.view.save(); }
        };

        frObj.$dom().find('.columnHeaders .column .info').live('click', sortHandle);
        frObj.$dom().find('.columnHeaders .column .sort').live('click', sortHandle);
        frObj.$dom().find('.columnHeaders .column .clearSort')
            .live('click', sortHandle);
    };

    var renderHeaders = function(frObj)
    {
        var $headerList = frObj.$dom().find('.columnHeaders');
        if ($.isBlank(frObj._colTips)) { frObj._colTips = {}; }

        var newItems = [];
        _.each(frObj.richRenderer.visibleColumns(), function(c)
        {
            var $col = $.renderTemplate('fatRowColumn', c, {
                '.column@class+': 'renderTypeName',
                '.name': 'name!',
                '.sort@title': function(a)
                    { return 'Sort ' + (a.context.sortAscending ?
                        'descending' : 'ascending'); },
                '.sort@class+': function(a)
                    {
                        if (!a.context.renderType.sortable) { return 'hide'; }
                        if ($.isBlank(a.context.sortAscending))
                        { return 'sortAscLight'; }
                        return 'sort' + (a.context.sortAscending ? 'Asc' : 'Desc');
                    },
                '.clearSort@class+': function(a)
                    { return $.isBlank(a.context.sortAscending) ? 'hide' : ''; }
            });
            blist.datasetControls.columnTip(c, $col.find('.info'), frObj._colTips);
            $col.data('column', c);
            newItems.push($col);
        });

        // Wait until the end to empty out the old items; or else they lose their
        // data (meaning socrataTip-ness) and can't be cleaned out by columnTip,
        // resulting in stuck tips
        $headerList.empty();
        _.each(newItems, function(i) { $headerList.append(i); });

        frObj.$dom().trigger('resize');
    };

    var renderCurrentPage = function(frObj)
    {
        if ($.isBlank(frObj.navigation.currentPage())) { return; }

        frObj.$list().empty();

        var rowsLoaded = function(rows)
        {
            _.each(rows, function(r)
            {
                var $item = frObj.$template().clone().removeClass('templateRow');
                frObj.richRenderer.renderRow($item, r);
                frObj.$list().append($item);
            });
        };

        frObj.settings.view.getRows(frObj.navigation.currentPage() *
            frObj.settings.pageSize, frObj.settings.pageSize, rowsLoaded);
    };

})(jQuery);
