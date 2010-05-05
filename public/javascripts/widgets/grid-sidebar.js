(function($)
{
    $.fn.gridSidebar = function(options)
    {
        // Check if object was already created
        var gridSidebar = $(this[0]).data("gridSidebar");
        if (!gridSidebar)
        {
            gridSidebar = new gridSidebarObj(options, this[0]);
        }
        return gridSidebar;
    };

    var gridSidebarObj = function(options, dom)
    {
        this.settings = $.extend({}, gridSidebarObj.defaults, options);
        this.currentDom = dom;
        this.init();
    };

    $.extend(gridSidebarObj,
    {
        defaults:
        {
            dataGrid: null,
            modalHiddenSelector: null
        },

        prototype:
        {
            init: function ()
            {
                var sidebarObj = this;
                var $domObj = sidebarObj.$dom();
                $domObj.data("gridSidebar", sidebarObj);

                $domObj.find('a.close').click(function(e)
                {
                    e.preventDefault();
                    sidebarObj.hide();
                });

                $(window).resize(function() { handleResize(sidebarObj); });
            },

            $dom: function()
            {
                if (!this._$dom)
                { this._$dom = $(this.currentDom); }
                return this._$dom;
            },

            $grid: function()
            {
                if (!this._$grid)
                { this._$grid = $(this.settings.dataGrid); }
                return this._$grid;
            },

            show: function(isModal)
            {
                var sidebarObj = this;
                setPosition(sidebarObj);
                sidebarObj.$dom().show();
                sidebarObj.$grid().css('margin-right',
                    sidebarObj.$dom().width() + 'px');

                if (isModal)
                {
                    sidebarObj._isModal = true;
                    if (!_.isNull(sidebarObj.settings.modalHiddenSelector))
                    { $(sidebarObj.settings.modalHiddenSelector).hide(); }
                    sidebarObj._bodyOverflow = $('body').css('overflow');
                    $('body').css('overflow', 'hidden');

                    var $overlay = modalOverlay(sidebarObj);
                    sidebarObj._origZIndex = sidebarObj.$dom().css('z-index');
                    sidebarObj._origGridZIndex = sidebarObj.$grid().css('z-index');
                    var zIndex = parseInt($overlay.css('z-index')) + 1;
                    sidebarObj.$dom().css('z-index', zIndex);
                    sidebarObj.$grid().css('z-index', zIndex);
                    $overlay.show();

                    sidebarObj.$grid().datasetGrid().disable();
                }
                else { sidebarObj._isModal = false; }

                $(window).resize();
            },

            hide: function()
            {
                var sidebarObj = this;
                sidebarObj.$dom().hide();
                sidebarObj.$grid().css('margin-right', 0);

                if (sidebarObj._isModal)
                {
                    sidebarObj._isModal = false;
                    if (!_.isNull(sidebarObj.settings.modalHiddenSelector))
                    { $(sidebarObj.settings.modalHiddenSelector).show(); }
                    $('body').css('overflow', sidebarObj._bodyOverflow);
                    modalOverlay(sidebarObj).hide();
                    sidebarObj.$dom().css('z-index', sidebarObj._origZIndex);
                    sidebarObj.$grid().css('z-index', sidebarObj._origGridZIndex);

                    sidebarObj.$grid().datasetGrid().enable();
                }

                $(window).resize();
            }
        }
    });

    var modalOverlay = function(sidebarObj)
    {
        if (!sidebarObj._$overlay)
        {
            $('body').append('<div id="gridSidebarOverlay"></div>');
            sidebarObj._$overlay = $('#gridSidebarOverlay');
        }
        return sidebarObj._$overlay;
    };

    var setPosition = function(sidebarObj)
    {
        var gridHeight = sidebarObj.$grid().height();
        sidebarObj.$dom().css('top', -gridHeight + 'px').height(gridHeight);
    };

    var handleResize = function(sidebarObj)
    {
        if (sidebarObj.$dom().is(':hidden')) { return; }

        _.defer(function() { setPosition(sidebarObj); });
    };

})(jQuery);
