(function($)
{
    var typeConfigs =
    {
        calendar: {
            name: 'calendar',
            domId: 'calendarRenderType',
            initFunction: 'socrataCalendar',
            javascripts: [{ assets: 'shared-calendar' }],
            stylesheets: ['/styles/individual/screen-calendar.css',
              'fullcalendar.css',
              '/styles/individual/rich-render-types.css'],
            scrollsInline: false
        },

        chart: {
            name: 'chart',
            domId: 'chartRenderType',
            initFunction: 'socrataChart',
            javascripts: [{ assets: 'shared-chart' }],
            stylesheets: ['chart-screen.css',
                          '/styles/individual/rich-render-types.css'],
            scrollsInline: true
        },

        form: {
            name: 'form',
            domId: 'staticRenderType',
            initFunction: function() {},
            styleshets: ['displays-form.css'],
            scrollsInline: false
        },

        map: {
            name: 'map',
            domId: 'mapRenderType',
            initFunction: 'socrataMap',
            javascripts: [
                'http://serverapi.arcgisonline.com/jsapi/arcgis/?v=2.1', false,
                { assets: 'shared-map' }
            ],
            stylesheets: ['http://serverapi.arcgisonline.com/jsapi/arcgis' +
                '/1.5/js/dojo/dijit/themes/tundra/tundra.css',
                '/styles/individual/screen-map.css',
                '/styles/individual/rich-render-types.css'],
            scrollsInline: true
        },

        fatrow: {
            name: 'fatrow',
            domId: 'fatRowRenderType',
            initFunction: function($dom, settings)
            {
                $dom.fatrowRenderType($.extend({view: settings.view,
                        columnDeleteEnabled: settings.editEnabled &&
                            settings.view.type == 'blist' &&
                            settings.view.hasRight('remove_column'),
                        columnPropertiesEnabled: settings.editEnabled},
                        settings.common,
                        settings.fatrow));
            },
            javascripts: [{assets: 'shared-richRenderers'}],
            stylesheets: [{sheet: '/styles/individual/render-type-images.css',
                hasImages: true}, '/styles/individual/rich-render-types.css'],
            scrollsInline: false
        },

        page: {
            name: 'page',
            domId: 'pageRenderType',
            initFunction: 'pageRenderType',
            javascripts: [{assets: 'shared-richRenderers'}],
            stylesheets: [{sheet: '/styles/individual/render-type-images.css',
                hasImages: true}, '/styles/individual/rich-render-types.css'],
            scrollsInline: false
        },

        table: {
            name: 'table',
            domId: 'gridRenderType',
            javascripts: [{ assets: 'shared-table-render' }],
            initFunction: function($dom, settings)
            {
                $dom.datasetGrid($.extend({view: settings.view,
                        columnDeleteEnabled: settings.editEnabled &&
                            settings.view.type == 'blist' &&
                            settings.view.hasRight('remove_column'),
                        columnPropertiesEnabled: settings.editEnabled,
                        columnNameEdit: settings.editEnabled &&
                            settings.view.type == 'blist' &&
                            settings.view.hasRight('update_column'),
                        showAddColumns: settings.editEnabled &&
                            settings.view.type == 'blist' &&
                            settings.view.hasRight('add_column'),
                        editEnabled: settings.editEnabled},
                        settings.common,
                        settings.table));
            },
            scrollsInline: true
        },

        href: {
            name: 'href',
            domId: 'staticRenderType',
            stylesheets: [{sheet: '/styles/individual/about-dataset.css',
                    hasSpecialSelectors: true},
                '/styles/individual/screen-blob.css'],
            javascripts: [{ assets: 'shared-blob' }],
            scrollsInline: false,
            initFunction: function($dom, settings)
            {
                $dom.blobDataset($.extend({view: settings.view,
                    editEnabled: settings.editEnabled}, settings.common,
                    settings.href));
            }
        },

        blob: {
            name: 'blob',
            domId: 'staticRenderType',
            stylesheets: [{sheet: '/styles/individual/about-dataset.css',
                    hasSpecialSelectors: true},
                '/styles/individual/screen-blob.css'],
            javascripts: [{ assets: 'shared-blob' }],
            scrollsInline: false,
            initFunction: function($dom, settings)
            {
                $dom.blobDataset($.extend({view: settings.view,
                    editEnabled: settings.editEnabled}, settings.common,
                    settings.blob));
            }
        }
    };

    $.fn.renderTypeManager = function(options)
    {
        // Check if object was already created
        var renderTypeManager = $(this[0]).data("renderTypeManager");
        if (!renderTypeManager)
        {
            renderTypeManager = new renderTypeManagerObj(options, this[0]);
        }
        return renderTypeManager;
    };

    var renderTypeManagerObj = function(options, dom)
    {
        this.settings = $.extend({}, renderTypeManagerObj.defaults, options);
        this.currentDom = dom;
        this.init();
    };

    $.extend(renderTypeManagerObj,
    {
        defaults:
        {
            defaultType: null,
            view: null
        },

        prototype:
        {
            init: function ()
            {
                var rtmObj = this;
                var $domObj = rtmObj.$dom();
                $domObj.data("renderTypeManager", rtmObj);

                $domObj.find('.renderTypeNode').addClass('hide');

                rtmObj._loadedAssets = {};
                rtmObj.settings.view.bind('valid', function()
                {
                    if (!$.isBlank(rtmObj.currentType))
                    { rtmObj.show(rtmObj.currentType); }
                })
                .bind('displaytype_change', function()
                {
                    rtmObj.show(rtmObj.settings.view.displayType);
                });

                var defType = rtmObj.settings.defaultType ||
                    rtmObj.settings.view.displayType;

                rtmObj.show(defType);
            },

            $dom: function()
            {
                if (!this._$dom)
                { this._$dom = $(this.currentDom); }
                return this._$dom;
            },

            setTypeConfig: function(type, newConfig)
            {
                var rtmObj = this;
                var typeInfo = getConfig(type);
                $.extend(rtmObj.settings[typeInfo.name], newConfig);
            },

            show: function(type, defArgs)
            {
                var rtmObj = this;
                var typeInfo = getConfig(type);

                rtmObj.currentType = type;
                if (!rtmObj.settings.view.valid) { return; }

                initType(rtmObj, type, defArgs);

                if (typeInfo.$dom.is(':visible')) { return; }

                rtmObj.$dom().children('.renderTypeNode:visible').addClass('hide')
                    .trigger('hide');
                typeInfo.$dom.removeClass('hide').trigger('show');
                rtmObj.$dom().trigger('render_type_changed', [type]);
                $(window).resize();
            },

            $domForType: function(type)
            {
                var rtmObj = this;
                initDom(rtmObj, type);
                return getConfig(type).$dom;
            }
        }
    });

    var getConfig = function(type)
    {
        var typeInfo = typeConfigs[type];
        if ($.isBlank(typeInfo))
        { throw 'missing type info for ' + type; }
        return typeInfo;
    };

    var initDom = function(rtmObj, type)
    {
        var typeInfo = getConfig(type);
        var $dom = typeInfo.$dom;
        if ($.isBlank($dom))
        {
            $dom = rtmObj.$dom().find('#' + typeInfo.domId);
            if ($dom.length < 1)
            {
                rtmObj.$dom().append($.tag({tagName: 'div', id: typeInfo.domId,
                    'class': ['fullHeight', 'renderTypeNode', 'hide']}));
                $dom = rtmObj.$dom().find('#' + typeInfo.domId);
            }
            typeInfo.$dom = $dom;
        }
    };

    var initType = function(rtmObj, type, defArgs)
    {
        var typeInfo = getConfig(type);
        if (typeInfo._initialized) { return; }
        initDom(rtmObj, type);
        var $dom = typeInfo.$dom;

        var finishCallback = function()
        {
            // Don't load these assets again
            rtmObj._loadedAssets[typeInfo.name] = true;

            if (_.isFunction($.fn[typeInfo.initFunction]))
            {
                $dom[typeInfo.initFunction]($.extend({view: rtmObj.settings.view},
                    rtmObj.settings.common, rtmObj.settings[typeInfo.name],
                    defArgs));
            }
            else if (_.isFunction(typeInfo.initFunction))
            {
                typeInfo.initFunction($dom, rtmObj.settings);
            }
            // Else: no init function specified!

            $dom.trigger('show');
        };

        if (!typeInfo.scrollsInline)
        { $dom.removeClass('scrollContent'); }
        else
        { $dom.addClass('scrollContent'); }

        if (!rtmObj._loadedAssets[typeInfo.name])
        {
            if (!$.isBlank(typeInfo.stylesheets))
            {
                var sheets = _.map(typeInfo.stylesheets, function(s)
                {
                    var sheet = translateUrls('/stylesheets/', [s.sheet || s]);
                    if ($.isPlainObject(s)) { s.sheet = sheet[0]; }
                    else { s = sheet[0]; }
                    return s;
                });
                $.loadStylesheets(sheets, function() { $(window).resize(); });
            }

            // Lazy-load javascripts
            if (_.isArray(typeInfo.javascripts) &&
                typeInfo.javascripts.length > 0)
            {
                $.loadLibraries(translateUrls('/javascripts/',
                    typeInfo.javascripts), finishCallback);
            }
            else { finishCallback(); }
        }
        else
        { finishCallback(); }

        typeInfo._initialized = true;
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

})(jQuery);
