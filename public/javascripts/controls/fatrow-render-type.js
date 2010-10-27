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

                frObj._curPageIndex = 0;
                frObj._totalPages = null;
                hookUpNavigation(frObj);
                hookUpHeaders(frObj);
                frObj.settings.view.bind('row_count_change', function()
                    { updateNavigation(frObj); })
                    .bind('query_change', function()
                    {
                        frObj._curPageIndex = 0;
                        renderCurrentPage(frObj);
                    });

                $domObj.bind('resize', function(e) { resizeHandle(frObj); });

                var mainUpdate = function()
                {
                    renderHeaders(frObj);
                    frObj.richRenderer.renderLayout();
                    renderCurrentPage(frObj);
                };
                frObj.settings.view.bind('columns_changed', mainUpdate);
                frObj.$dom().bind('show', mainUpdate);
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

            $nav: function()
            {
                if (!this._$nav)
                { this._$nav = this.$dom().find('.navigation'); }
                return this._$nav;
            },

            $template: function()
            {
                if (!this._$template)
                { this._$template = this.$dom().find('.templateRow'); }
                return this._$template;
            },

            displayPage: function(index)
            {
                var frObj = this;

                var pageCount = Math.ceil(frObj.settings.view.totalRows /
                        frObj.settings.pageSize);
                if (index < 0)
                { index = pageCount + index + 1; }
                if (index >= pageCount)
                { index = pageCount - 1; }

                frObj._curPageIndex = index;
                renderCurrentPage(frObj);
                updateNavigation(frObj);
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
            if ($this.isSocrataTip()) { $this.socrataTip().hide(); }

            var c = $this.closest('.column').data('column');
            var asc = !c.sortAscending;

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

        // If we remove the children here, then the socrataTip data gets
        // blown away, and calling columnTip below won't properly detach
        // the old tip
        var $oldChildren = $headerList.find('.column').detach();

        _.each(frObj.richRenderer.visibleColumns(), function(c)
        {
            var $col = $.renderTemplate('fatRowColumn', c, {
                '.column@class+': 'renderTypeName',
                '.name': 'name',
                '.sort@title': function(a)
                    { return 'Sort ' + (a.context.sortAscending ?
                        'descending' : 'ascending'); },
                '.sort@class+': function(a)
                    { return 'sort' + (a.context.sortAscending ?
                        'Asc' : !$.isBlank(a.context.sortAscending) ?
                            'Desc' : 'AscLight'); },
                '.clearSort@class+': function(a)
                    { return $.isBlank(a.context.sortAscending) ? 'hide' : ''; }
            });
            blist.datasetControls.columnTip(c, $col.find('.info'), frObj._colTips);
            $col.data('column', c);
            $headerList.append($col);
        });
        frObj.$dom().trigger('resize');

        // Even though the children are not in the DOM, we call remove() to kill
        // off data & event handlers
        $oldChildren.remove();
    };

    var renderCurrentPage = function(frObj)
    {
        if ($.isBlank(frObj._curPageIndex)) { return; }

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

        frObj.settings.view.getRows(frObj._curPageIndex * frObj.settings.pageSize,
            frObj.settings.pageSize, rowsLoaded);
    };

    var hookUpNavigation = function(frObj)
    {
        frObj.$nav().find('.button').click(function(e)
        {
            e.preventDefault();
            var $a = $(this);
            if ($a.hasClass('disabled')) { return; }

            switch ($.hashHref($a.attr('href')))
            {
                case 'start':
                    frObj.displayPage(0);
                    break;
                case 'end':
                    frObj.displayPage(-1);
                    break;
                case 'previous':
                    frObj.displayPage(frObj._curPageIndex - 1);
                    break;
                case 'next':
                    frObj.displayPage(frObj._curPageIndex + 1);
                    break;
            }
        });

        frObj.$nav().find('.page a').click(function(e)
        {
            e.preventDefault();
            var $a = $(this);
            if ($a.parent().hasClass('active')) { return; }
            frObj.displayPage($a.data('pageNum'));
        });
    };

    var updateNavigation = function(frObj)
    {
        var pageCount = Math.ceil(frObj.settings.view.totalRows /
            frObj.settings.pageSize);

        frObj.$nav().find('.start, .previous')
            .toggleClass('disabled', frObj._curPageIndex <= 0);
        frObj.$nav().find('.end, .next')
            .toggleClass('disabled', frObj._curPageIndex >= pageCount - 1);

        if (pageCount != frObj._totalPages)
        {
            var $templLink = frObj.$nav().find('.page:first');
            frObj.$nav().find('.page:not(:first)').remove();
            var $newSet = $();
            for (var i = 0; i < pageCount; i++)
            {
                var $newL = $templLink.clone(true).removeClass('active');
                $newL.find('a').text(i + 1).data('pageNum', i);
                $newSet = $newSet.add($newL);
            }
            $templLink.replaceWith($newSet);
            frObj._totalPages = pageCount;
        }

        frObj.$nav().find('.page').removeClass('active');
        frObj.$nav().find('.page').eq(frObj._curPageIndex).addClass('active');
    };

})(jQuery);
