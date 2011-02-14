(function($)
{
    var typeConfigs =
    {
        calendar: {
            name: 'calendar',
            domId: 'calendarRenderType',
            initFunction: 'socrataCalendar',
            javascripts: [{ assets: 'shared-calendar' }],
            stylesheets: ['/styles/merged/screen-calendar.css',
              'fullcalendar.css'],
            scrollsInline: false
        },

        chart: {
            name: 'chart',
            domId: 'chartRenderType',
            initFunction: 'socrataChart',
            javascripts: [{ assets: 'shared-chart' }],
            stylesheets: ['chart-screen.css'],
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
                '/styles/merged/screen-map.css'],
            scrollsInline: true
        },

        fatrow: {
            name: 'fatrow',
            domId: 'fatRowRenderType',
            initFunction: 'fatrowRenderType',
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
                            blist.dataset.type == 'blist' &&
                            blist.dataset.hasRight('remove_column'),
                        columnPropertiesEnabled: settings.editEnabled,
                        columnNameEdit: settings.editEnabled &&
                            blist.dataset.type == 'blist' &&
                            blist.dataset.hasRight('update_column'),
                        showAddColumns: settings.editEnabled &&
                            blist.dataset.type == 'blist' &&
                            blist.dataset.hasRight('add_column'),
                        editEnabled: settings.editEnabled},
                        settings.table));
            },
            scrollsInline: true
        },

        href: {
            name: 'href',
            domId: 'staticRenderType',
            stylesheets: ['blists-blob-screen.css',
                '/styles/individual/about-dataset.css',
                '/styles/individual/screen-href.css'],
            javascripts: [{ assets: 'shared-href' }],
            scrollsInline: false,
            initFunction: function($dom, settings)
            {
                $dom.hrefDataset($.extend({view: settings.view,
                    editEnabled: settings.editEnabled}, settings.href));
            }
        },

        blob: {
            name: 'blob',
            domId: 'staticRenderType',
            stylesheets: ['blists-blob-screen.css'],
            scrollsInline: false,
            initFunction: function($dom, opts)
            {
                if (!$.isBlank(((blist.renderTypes || {}).blob || {}).href))
                {
                    var embedHtml;
                    if (opts.view.blobMimeType.indexOf('application/pdf')
                        !== -1 && $.browser.msie)
                    {
                        embedHtml = '<object data="' +
                            blist.renderTypes.blob.href +
                            '" type="application/pdf" classid="clsid:' +
                            'CA8A9780-280D-11CF-A24D-444553540000" ' +
                            'width="100%" height="99%"></object>';
                    }
                    else
                    {
                        embedHtml = '<iframe id="blobIFrame" ' +
                            'src="http://docs.google.com/gview?url=' +
                            blist.renderTypes.blob.href +
                            '&embedded=true" width="100%" height="99%" ' +
                            'frameborder="0" scrolling="no"></iframe>';
                    }
                    $dom.addClass('scrollContent').html(embedHtml);
                }
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
            $dom = rtmObj.$dom().children('#' + typeInfo.domId);
            if ($dom.length < 1)
            {
                rtmObj.$dom().append($.tag({tagName: 'div', id: typeInfo.domId,
                    'class': ['fullHeight', 'renderTypeNode', 'hide']}));
                $dom = rtmObj.$dom().children('#' + typeInfo.domId);
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
                    rtmObj.settings[typeInfo.name], defArgs));
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
                $.loadStylesheets(sheets, function() { $dom.trigger('resize'); });
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
