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
                'https://serverapi.arcgisonline.com/jsapi/arcgis/?v=2.1', false,
                { assets: 'shared-map' }
            ],
            stylesheets: ['https://serverapi.arcgisonline.com/jsapi/arcgis' +
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
                            (settings.view.type == 'blist' ||
                             settings.view.type == 'grouped') &&
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
            defaultTypes: null,
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

                rtmObj.typeInfos = {};

                rtmObj.visibleTypes = {};

                rtmObj._loadedAssets = {};
                rtmObj.settings.view.bind('valid', function()
                {
                    if (!_.isEmpty(rtmObj.visibleTypes))
                    {
                        _.each(rtmObj.visibleTypes, function(t)
                        { rtmObj.show(t); });
                    }
                })
                .bind('displaytype_change', function()
                {
                    var toShow = $.extend({}, rtmObj.settings.view.metadata.renderTypeConfig.visible);

                    _.each(_.keys(rtmObj.visibleTypes), function(vt)
                    {
                        if (!toShow[vt]) { rtmObj.hide(vt); }
                        else { delete toShow[vt]; }
                    });

                    _.each(toShow, function(v, t)
                    {
                        if (v) { rtmObj.show(t); }
                    });
                });

                $domObj.delegate('.renderTypeNode > .divider .close', 'click', function(e)
                {
                    e.preventDefault();
                    rtmObj.hide($(this).closest('.renderTypeNode').data('rendertype'));
                });

                rtmObj._loadedTypes = {};

                var defTypes = rtmObj.settings.defaultTypes ||
                    rtmObj.settings.view.metadata.renderTypeConfig.visible;
                if (_.isString(defTypes))
                {
                    var dt = {};
                    dt[defTypes] = true;
                    defTypes = dt;
                }

                _.each(defTypes, function(v, t) { if (v) { rtmObj.show(t); } });
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
                var typeInfo = getConfig(rtmObj, type);
                $.extend(rtmObj.settings[typeInfo.name], newConfig);
            },

            show: function(type, defArgs)
            {
                var rtmObj = this;
                var typeInfo = getConfig(rtmObj, type);

                rtmObj.visibleTypes[type] = true;
                if (!rtmObj.settings.view.valid) { return; }

                initType(rtmObj, type, defArgs);

                if (typeInfo.$dom.is(':visible')) { return; }

                typeInfo.$dom.removeClass('hide').children('.renderContent').trigger('show');

                rtmObj.$dom().toggleClass('multipleRenderers',
                    rtmObj.$dom().children('.renderTypeNode:visible').length > 1);
                rtmObj.$dom().trigger('render_type_shown', [type]);
                $(window).resize();
            },

            hide: function(type)
            {
                var rtmObj = this;

                var typeInfo = getConfig(rtmObj, type);

                delete rtmObj.visibleTypes[type];

                if (!typeInfo.$dom.is(':visible')) { return; }

                typeInfo.$dom.addClass('hide').children('.renderContent').trigger('hide');

                rtmObj.$dom().toggleClass('multipleRenderers',
                    rtmObj.$dom().children('.renderTypeNode:visible').length > 1);
                rtmObj.$dom().trigger('render_type_hidden', [type]);
                $(window).resize();
            },

            toggle: function(type)
            {
                var rtmObj = this;
                if (rtmObj.visibleTypes[type])
                { rtmObj.hide(type); }
                else
                { rtmObj.show(type); }
            },

            $domForType: function(type)
            {
                var rtmObj = this;
                initDom(rtmObj, type);
                return getConfig(rtmObj, type).$dom.children('.renderContent');
            }
        }
    });

    var getConfig = function(rtmObj, type)
    {
        if (_.isUndefined(rtmObj.typeInfos[type]))
        {
            var typeInfo = $.extend(true, {}, typeConfigs[type])
            if ($.isBlank(typeInfo))
            { throw 'missing type info for ' + type; }
            rtmObj.typeInfos[type] = typeInfo;
        }

        return rtmObj.typeInfos[type];
    };

    var initDom = function(rtmObj, type)
    {
        var typeInfo = getConfig(rtmObj, type);
        var $dom = typeInfo.$dom;
        if ($.isBlank($dom))
        {
            $dom = rtmObj.$dom().find('#' + typeInfo.domId);
            if ($dom.length < 1)
            {
                // We want to create the DOM nodes in the order they appear in
                // availableDisplayTypes. So find the the next existing node after
                // this type. If this type isn't in ADT, stick it at the front
                var adt = rtmObj.settings.view.metadata.availableDisplayTypes;
                var $beforeItem;
                var curIndex = _.indexOf(adt, type);
                var $renderNodes = rtmObj.$dom().children('.renderTypeNode');

                if (curIndex < 0) { $beforeItem = $renderNodes.eq(0); }
                for (var i = curIndex + 1; i < adt.length && $.isBlank($beforeItem); i++)
                {
                    var $r = $renderNodes.filter('[data-renderType=' + adt[i] + ']');
                    if ($r.length > 0) { $beforeItem = $r; }
                }

                var $newNode = $.tag({tagName: 'div', id: typeInfo.domId,
                    'class': ['fullHeight', 'renderTypeNode', 'hide'], 'data-renderType': type});
                if ($.isBlank($beforeItem) || $beforeItem.length < 1)
                { rtmObj.$dom().append($newNode); }
                else
                { $beforeItem.before($newNode); }

                $dom = rtmObj.$dom().find('#' + typeInfo.domId);
            }

            if ($dom.children('.renderContent').length < 1)
            {
                var $content = $.tag({tagName: 'div', 'class': ['renderContent', 'fullHeight']});
                $content.append($dom.children());
                $dom.append($content);
            }

            if ($dom.children('.divider').length < 1)
            {
                $dom.prepend($.tag({tagName: 'div', 'class': 'divider', contents:
                    {tagName: 'a', href: '#Hide', 'class': 'close', title: 'Hide section',
                        contents: {tagName: 'span', 'class': 'icon'}}}));
            }

            typeInfo.$dom = $dom;
        }
    };

    var initType = function(rtmObj, type, defArgs)
    {
        var typeInfo = getConfig(rtmObj, type);
        if (typeInfo._initialized) { return; }
        initDom(rtmObj, type);
        var $dom = typeInfo.$dom;
        var $content = $dom.find('.renderContent');

        var finishCallback = function()
        {
            // Don't load these assets again
            rtmObj._loadedAssets[typeInfo.name] = true;

            if (_.isFunction($.fn[typeInfo.initFunction]))
            {
                $content[typeInfo.initFunction]($.extend({view: rtmObj.settings.view},
                    rtmObj.settings.common, rtmObj.settings[typeInfo.name],
                    defArgs));
            }
            else if (_.isFunction(typeInfo.initFunction))
            {
                typeInfo.initFunction($content, rtmObj.settings);
            }
            // Else: no init function specified!

            $content.trigger('show');
        };

        if (!typeInfo.scrollsInline)
        { $content.removeClass('scrollContent'); }
        else
        { $content.addClass('scrollContent'); }

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
