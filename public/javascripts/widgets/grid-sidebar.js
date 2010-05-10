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

            addPane: function(config, data)
            {
                var sidebarObj = this;
                if ($.isBlank(config))
                { throw "Configuration required for gridSidebar"; }

                sidebarObj._$panes = sidebarObj._$panes || {};
                if (!$.isBlank(sidebarObj._$panes[config.name]))
                {
                    sidebarObj._$panes[config.name].remove();
                    delete sidebarObj._$panes[config.name];
                }

                var $pane = renderPane(sidebarObj, config, data);
                sidebarObj._$panes[config.name] = $pane;
                sidebarObj.$dom().append($pane);
                $pane.hide();
            },

            show: function(paneName, isModal)
            {
                var sidebarObj = this;

                // Set up the chosen pane
                sidebarObj.$dom().find('.sidebarPane').hide();
                // Make sure our pane exists
                if ($.isBlank(sidebarObj._$panes[paneName]))
                { throw paneName + ' does not exist'; }
                sidebarObj._$panes[paneName].show();

                // Adjust positions for the sidebar
                setPosition(sidebarObj);

                // The big reveal
                sidebarObj.$dom().show();
                sidebarObj.$grid().css('margin-right',
                    sidebarObj.$dom().outerWidth(true) + 'px');

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
        var adjH = sidebarObj.$dom().outerHeight() - sidebarObj.$dom().height();
        sidebarObj.$dom().css('top', -gridHeight + 'px').height(gridHeight - adjH);
    };

    var handleResize = function(sidebarObj)
    {
        if (sidebarObj.$dom().is(':hidden')) { return; }

        _.defer(function() { setPosition(sidebarObj); });
    };

    var renderPane = function(sidebarObj, config, data)
    {
        var $pane = $('<div id="' +
            sidebarObj.$dom().attr('id') + '_' + config.name +
            '" class="sidebarPane"></div>');
        var rData = {title: config.title, subtitle: config.subtitle,
            sections: config.sections, finishButtons: config.finishButtons};
        var directive = {
            '.title': 'title',
            '.subtitle': 'subtitle',
            '.section': {
                'section<-sections': {
                    '.title': 'section.title'
                }
            },
            '.finishButtons > li': {
                'button<-finishButtons': {
                    'a': 'button.text',
                    'a@value': 'button.value',
                    'a@class+': function(arg)
                    { return arg.item.isDefault ? ' arrowButton' : ''; },
                    'a@href+': function(arg)
                    { return $.urlSafe(arg.item.text || ''); }
                }
            }
        };

        $pane.append($.renderTemplate('sidebarPane', rData, directive));

        return $pane;
    };


    $.gridSidebarConfig = {
        locationCreate: {
            name: 'locationCreate',
            title: 'Create a Location Column',
            subtitle: 'Create a blank column to fill in location data, or fill it with values from existing columns',
            sections: [
                {
                    title: 'Import Latitude/Longitude'
                },
                {
                    title: 'Import US Addresses'
                }
            ],
            finishButtons: [
                {text: 'Create', value: true, isDefault: true},
                {text: 'Cancel', value: false}
            ]
        }
    };

})(jQuery);
