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
            (frObj.$list().outerHeight(true) - frObj.$list().height()));
        frObj.richRenderer.adjustLayout();
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
