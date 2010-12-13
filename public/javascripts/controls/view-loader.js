;(function($)
{
    var requiredAssets = {
        calendar: {
            name: 'calendar',
            initFunction: 'socrataCalendar',
            javascripts: [{ assets: 'shared-calendar' }],
            stylesheets: ['fullcalendar.css'],
            scrollsInline: false
        },

        chart: {
            name: 'chart',
            initFunction: 'socrataChart',
            javascripts: [{ assets: 'shared-chart' }],
            stylesheets: ['chart-screen.css'],
            scrollsInline: true
        },

        // NOTE: This display needs a partial, so this won't really work.
        // Just putting the info in here for the future
        form: {
            name: 'form',
            initFunction: function() {},
            styleshets: ['displays-form.css'],
            scrollsInline: false
        },

        map: {
            name: 'map',
            initFunction: 'socrataMap',
            javascripts: [
                'http://serverapi.arcgisonline.com/jsapi/arcgis/?v=2.1', false,
                { assets: 'shared-map' }
            ],
            stylesheets: ['/styles/merged/screen-map.css',
                'http://serverapi.arcgisonline.com/jsapi/arcgis/1.5/js/dojo/dijit/themes/tundra/tundra.css'],
            scrollsInline: true
        },

        table: {
            name: 'table',
            javascripts: [{ assets: 'shared-table-render' }],
            initFunction: function() {
                window.tinyMCEPreInit = {base: '/javascripts/tiny_mce',
                  suffix: '', query: ''};

                blist.namespace.fetch('blist.datasetPage');
                if (blist.datasetPage._needsInitGrid)
                { blist.datasetPage.initGrid(); }
            },
            scrollsInline: true
        }
    };

    var loadedAssets = {},
        loadedStyles = {};

    var socrataViewMappings = {
        displayType: {
            'calendar': requiredAssets.calendar,
            'chart': requiredAssets.chart,
            'map': requiredAssets.map,

            /* LEGACY TYPES */
            'annotatedtimeline': requiredAssets.chart,
            'imagesparkline': requiredAssets.chart,
            'areachart': requiredAssets.chart,
            'barchart': requiredAssets.chart,
            'columnchart': requiredAssets.chart,
            'linechart': requiredAssets.chart,
            'piechart': requiredAssets.chart,
            'intensitymap': requiredAssets.chart,
            'geomap': requiredAssets.chart
        }
    };

    var getViewTypeInfo = function(view)
    {
        var info = socrataViewMappings.displayType[view.displayType];

        // No display type? TABLE!
        if ($.isBlank(info))
        { info = requiredAssets.table; }

        return info;
    };

    var translateUrls = function(prefix, array)
    {
        return _.map(array, function(item)
        {
            if (item && !$.isBlank(item.assets))
            { return blist.assets[item.assets]; }
            else
            {
              // Preserve false/null/external links
              if (item && ! item.startsWith('http') && !item.startsWith('/'))
              { return prefix + item; }
              return item;
            }
        });
    };

    $.fn.socrataView = function(options)
    {
        var initInfo = getViewTypeInfo(options.view),
            that = this,
            finishCallback = function()
            {
                // Don't load these assets again
                loadedAssets[initInfo.name] = true;

                if (_.isFunction($.fn[initInfo.initFunction]))
                {
                    that[initInfo.initFunction](options);
                }
                else if (_.isFunction(initInfo.initFunction))
                {
                    initInfo.initFunction();
                }
                // Else: no init function specified!
            };

        if (!initInfo.scrollsInline)
        { blist.$display.removeClass('scrollContent'); }
        else
        { blist.$display.addClass('scrollContent'); }

        if (!loadedAssets[initInfo.name])
        {
            if (!$.isBlank(initInfo.stylesheets))
            {
                $.loadStylesheets(translateUrls('/stylesheets/', initInfo.stylesheets));
            }

            // Lazy-load javascripts
            if (!$.isBlank(initInfo.javascripts) &&
                initInfo.javascripts.length > 0)
            {
                $.loadLibraries(translateUrls('/javascripts/', initInfo.javascripts),
                    finishCallback);
            }
        }
        else
        { finishCallback(); }
    };

})(jQuery);
