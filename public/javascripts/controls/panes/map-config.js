;(function($) {
    var mapConfigNS = blist.namespace.fetch('blist.configs.map');

    var mapTypes = _.map(_.pluck(Dataset.map.backgroundLayers, 'key'),
            function(x) { return { text: x, value: x }; });
    var regionTypes = [
        {text: $.t('screens.ds.grid_sidebar.map.regions.countries'), value: 'countries'},
        {text: $.t('screens.ds.grid_sidebar.map.regions.state'), value: 'state'},
        {text: $.t('screens.ds.grid_sidebar.map.regions.canada_provinces'), value: 'canada_provinces'},
        {text: $.t('screens.ds.grid_sidebar.map.regions.counties'), value: 'counties'}
    ];
    var plotStyles = function(mapType)
    {
        // Yes, the names are kinda inaccurate, but eh. We live with it.
        var plotStyles = [
            {text: $.t('screens.ds.grid_sidebar.map.plots.point'), value: 'point'},
            {text: $.t('screens.ds.grid_sidebar.map.plots.heatmap'), value: 'heatmap'},
            {text: $.t('screens.ds.grid_sidebar.map.plots.rastermap'), value: 'rastermap'}
        ];
        return plotStyles;
    };

    // proxy/verify_layer_url is unavailable when not logged in.
    if (blist.currentUser)
    { mapTypes = mapTypes.concat({text: $.t('screens.ds.grid_sidebar.map.layers.custom'), value: 'custom', data: {type: null}}); }

    var normalizeLayerUrl = function($control, event)
    { $control.attr('data-custom-validlayerurl', 'unverified'); };

    var heatmapRegionOptions = function(heatmapType)
    {
        if ($.isBlank(heatmapType)
            || (_.isString(heatmapType) && heatmapType != 'counties')
            || !_.include(heatmapType, 'counties')) // heatmapType appears to be an object. weird.
        { return null; }
        return [
            {value:'ak',text:'Alaska'},         {value:'al',text:'Alabama'},
            {value:'ar',text:'Arkansas'},       {value:'az',text:'Arizona'},
            {value:'ca',text:'California'},     {value:'co',text:'Colorado'},
            {value:'ct',text:'Connecticut'},    {value:'de',text:'Delaware'},
            {value:'fl',text:'Florida'},        {value:'ga',text:'Georgia'},
            {value:'hi',text:'Hawaii'},         {value:'ia',text:'Iowa'},
            {value:'id',text:'Idaho'},          {value:'il',text:'Illinois'},
            {value:'in',text:'Indiana'},        {value:'ks',text:'Kansas'},
            {value:'ky',text:'Kentucky'},       {value:'la',text:'Louisiana'},
            {value:'ma',text:'Massachusetts'},  {value:'md',text:'Maryland'},
            {value:'me',text:'Maine'},          {value:'mi',text:'Michigan'},
            {value:'mn',text:'Minnesota'},      {value:'mo',text:'Missouri'},
            {value:'ms',text:'Mississippi'},    {value:'mt',text:'Montana'},
            {value:'nc',text:'North Carolina'}, {value:'nd',text:'North Dakota'},
            {value:'ne',text:'Nebraska'},       {value:'nh',text:'New Hampshire'},
            {value:'nj',text:'New Jersey'},     {value:'nm',text:'New Mexico'},
            {value:'nv',text:'Nevada'},         {value:'ny',text:'New York'},
            {value:'oh',text:'Ohio'},           {value:'ok',text:'Oklahoma'},
            {value:'or',text:'Oregon'},         {value:'pa',text:'Pennsylvania'},
            {value:'ri',text:'Rhode Island'},   {value:'sc',text:'South Carolina'},
            {value:'sd',text:'South Dakota'},   {value:'tn',text:'Tennessee'},
            {value:'tx',text:'Texas'},          {value:'ut',text:'Utah'},
            {value:'va',text:'Virginia'},       {value:'vt',text:'Vermont'},
            {value:'wa',text:'Washington'},     {value:'wi',text:'Wisconsin'},
            {value:'wv',text:'West Virginia'},  {value:'wy',text:'Wyoming'}
        ];
    };

    var customHeatmap = function(options)
    {
        return !$.isBlank(options.view) && options.view.displayFormat.heatmap &&
               options.view.displayFormat.heatmap.type == 'custom';
    };

    // keep track that we only get domain map layers once.
    var domainMapLayersCalled = false;
    var getDomainMapLayers = function(triggerFieldVal, notUsed, $field, curVal)
    {
        if (domainMapLayersCalled) { return mapLayers; }

        domainMapLayersCalled = true;
        $.Tache.Get({url: '/api/layers',
            success: function(dmls)
            {
                _.each(dmls, function(ml)
                {
                    mapLayers.push({text: ml.name, value: ml.url, data: {type: 'dynamic'}});
                });

                $field.data('linkedFieldValues', '_reset');
                _.each($field.data('linkedGroup'), function(f) { $(f).trigger('change'); });

                _.defer(function() { $field.val(curVal); });
            }});

        return mapLayers;
    };

    var disabledMessage = function(options)
    {
        return function()
        {
            var cpObj = this;
            var msg = $.t('screens.ds.grid_sidebar.map.validation.location_column');
            var hasHiddenLoc = !$.isBlank(cpObj._view) && _.any(cpObj._view.realColumns, function(c)
                { return _.include(c.dataTypeName, ['location', 'point']) && c.hidden; });
            if (options.useOtherSidebars && hasHiddenLoc && ($.isBlank(blist.sidebarHidden.manage) ||
                !blist.sidebarHidden.manage.showHide))
            {
                msg += ' ' + $.t('screens.ds.grid_sidebar.map.validation.hidden_location_html');
            }
            return msg;
        };
    };

    var datasetCreate = function($field, vals, curValue)
    {
        var cpObj = this;

        blist.common.selectedDataset = function(ds)
        {
            cpObj._expectingCancel = false;
            $('#selectDataset').jqmHide();
            cpObj._$selectedField.data('uid', ds.id);

            var valid = validDataset(ds);
            cpObj._$selectedField.makeStatic(ds.name, !valid);
            if (valid) { modifySection.call(cpObj, ds, cpObj._$selectedField); }
        };

        var openSelectDataset = function(e)
        {
            if (e) { e.preventDefault(); }
            cpObj._$selectedField = $field;
            $("#selectDataset").jqmShow();
            cpObj._expectingCancel = true;
        };

        var validDataset = function(ds)
        {
            return ds.isArcGISDataset() || ds.isGeoDataset()
                || _.any(ds.realColumns,
                function(col) { return _.include(col.renderTypeName, ['location', 'point']); });
        };

        $field.makeStatic = function(value, invalid, uneditable)
        {
            $field.empty();
            $field.data('dsName', value);
            $field.append('<span>' + $.htmlEscape(value) + (uneditable ? '' :
                        ' (<span class="edit">' + $.t('screens.ds.grid_sidebar.map.layers.edit') + '</span>)') + '</span>');
            $field.find('span.edit').click(openSelectDataset)
                .css({ cursor: 'pointer', color: '#0000ff' });
            if (invalid)
            { $field.append('<span class="error">' + $.t('screens.ds.grid_sidebar.map.validation.location_column') + '</span>')
                .find('span.error').css({ marginLeft: 0, paddingLeft: 0 }); }
        };

        if (!$.isBlank(curValue))
        {
            $field.data('uid', curValue);
            var handle = function(dataset)
            {
                var valid = validDataset(dataset);
                $field.makeStatic(dataset.name, !valid, cpObj._view.id == dataset.id);
                if (valid) { modifySection.call(cpObj, dataset, $field); }
            };
            if (curValue == 'self')
            { handle(cpObj._view); }
            else
            { Dataset.lookupFromViewId(curValue, handle); }
        }
        else
        { openSelectDataset(); cpObj._selectingEmpty = true; }

        if (!$field.data('hookedCleanupEvent'))
        {
            $field.parents('.line.group').find('.removeLink').click(function()
            { modifySection.call(cpObj, null, $field); });
            $field.data('hookedCleanupEvent', true);

            $(document).bind(blist.events.MODAL_HIDDEN, function()
            {
                if (cpObj._expectingCancel)
                {
                    cpObj._$selectedField.makeStatic(cpObj._$selectedField.data('dsName'));
                    cpObj._expectingCancel = false;
                    if (cpObj._selectingEmpty)
                    {
                        cpObj._$selectedField.parents('.line.group').find('.removeLink').click();
                        delete cpObj._selectingEmpty;
                    }
                }
            });
        }

        return true;
    };

    var modifySection = function(dataset, $field)
    {
        var cpObj = this;

        var index = $field.parents('.repeater').children('.line.group')
                                               .index($field.parents('.line.group'))
        if (!dataset)
        {
            if (cpObj.childPanes.length <= index) { return; }
            cpObj.childPanes.splice(index, 1)[0].$dom().remove();
            _.each(cpObj.childPanes.slice(index), function(cp, i) { cp.setIndex(index + i); });
            return;
        }

        var insertPane = function(pane)
        {
            var container = cpObj.$dom().find('.dataLayerContainer');
            if (container.length == 0)
            {
                $field.parents('.formSection').after('<div class="dataLayerContainer" />');
                container = cpObj.$dom().find('.dataLayerContainer');
            }
            if (container.children().length <= index)
            { container.append(pane.$dom()); }
            else
            { container.find('> div:eq(' + index + ')').before(pane.$dom()); }
        };

        var childPane = cpObj.childPanes[index];
        if (!childPane)
        {
            var displayFormat = $.extend(true, {}, cpObj._view.displayFormat);
            if (!$.subKeyDefined(displayFormat, 'viewDefinitions.0.uid'))
            { $.deepSet(displayFormat, $.extend(true, {}, dataset.displayFormat),
                'viewDefinitions', index); }
            childPane = cpObj.childPanes[index] = $('<div />')
                .pane_mapDataLayerCreate({
                    data: { displayFormat: displayFormat },
                    'parent': cpObj, view: dataset, index: index });
            insertPane(childPane);
            childPane.render();
        }
        else
        {
            // When the parent is re-rendered, attach the childPane to the new DOM.
            if (cpObj._childrenDirty
                && childPane.$dom().parents('.controlPane').length == 0)
            { insertPane(childPane); }
            childPane.setView(dataset);
            childPane.reset();
        }
        childPane.$dom().find('div.required').remove();
    };

    /*** Main config ***/
    mapConfigNS.config = function(options)
    {
        options = $.extend({isEdit: false, useOtherSidebars: false}, options);
        var config = [];
        if (!options.canvas)
        { config.push({
                title: $.t('screens.ds.grid_sidebar.map.layers.title'),
                fields: [
                    { type: 'repeater', name: 'displayFormat.viewDefinitions', addText: $.t('screens.ds.grid_sidebar.map.layers.new_data_button'),
                        field: {type: 'group', options: [
                            { text: $.t('screens.ds.grid_sidebar.map.layers.dataset'), type: 'custom', name: 'uid', required: true,
                              defaultValue: 'self', repeaterValue: '',
                              editorCallbacks: {
                                create: datasetCreate,
                                value: function($field) { return $field.data('uid'); }
                              }
                            }
                        ]}, minimum: 1
                    }
                ]
            }); }
        config.push({
                title: $.t('screens.ds.grid_sidebar.map.base_layers.title'),
                fields: [
                    { type: 'note', value: $.t('screens.ds.grid_sidebar.map.base_layers.subtitle') },
                    { type: 'repeater', name: 'displayFormat.bkgdLayers', addText: $.t('screens.ds.grid_sidebar.map.base_layers.new_base_map_button'),
                        minimum: 0, field: {type: 'group', options: [
                        {text: $.t('screens.ds.grid_sidebar.map.base_layers.layer'), type: 'select', name: 'layerKey',
                            required: true, prompt: $.t('screens.ds.grid_sidebar.map.base_layers.layer_prompt'),
                            options: mapTypes, defaultValue: 'World Street Map (ESRI)'
                        },
                        {text: $.t('screens.ds.grid_sidebar.map.base_layers.layer_url'), type: 'text', name: 'custom_url',
                            onlyIf: {field: 'layerKey', value: 'custom'}, defaultValue: 'https://',
                            required: true, data: { 'validlayerurl': 'unverified' },
                            change: normalizeLayerUrl },
                        {text: $.t('screens.ds.grid_sidebar.map.base_layers.alias'), type: 'text', name: 'alias'},
                        {text: $.t('screens.ds.grid_sidebar.map.base_layers.opacity'), type: 'slider', name: 'opacity',
                            defaultValue: 1, minimum: 0, maximum: 1}
                    ]}
                    }
                ]
            },
            {
                title: $.t('screens.ds.grid_sidebar.map.advanced.title'),
                fields: [
                    { type: 'note', value: $.t('screens.ds.grid_sidebar.map.advanced.subtitle') },
                    { text: $.t('screens.ds.grid_sidebar.map.advanced.exclusive'), name: 'displayFormat.exclusiveLayers', type: 'checkbox' },
                    { text: $.t('screens.ds.grid_sidebar.map.advanced.hide_geolocator'), name: 'displayFormat.disableGeolocator', type: 'checkbox' }
                ]
            },
            {
                title: $.t('screens.ds.grid_sidebar.map.legend.title'), type: 'selectable',
                fields: [
                    {text: $.t('screens.ds.grid_sidebar.map.legend.position'), type: 'select', prompt: $.t('screens.ds.grid_sidebar.map.legend.position_prompt'),
                        defaultValue: 'bottom', name: 'displayFormat.legendDetails.position',
                        options: [
                            {text: $.t('screens.ds.grid_sidebar.map.legend.positions.top_right'), value: 'topRight'},
                            {text: $.t('screens.ds.grid_sidebar.map.legend.positions.bottom_left'), value: 'bottomLeft'},
                            {text: $.t('screens.ds.grid_sidebar.map.legend.positions.none'), value: 'none'}
                        ]
                    },
                    { text: $.t('screens.ds.grid_sidebar.map.legend.conditional_formats'), type: 'checkbox', inputFirst: true,
                      name: 'displayFormat.legendDetails.showConditional', defaultValue: true,
                      lineClass: 'advLegendCheck' },
                    { type: 'repeater', minimum: 0, initialRepeatCount: 0,
                      addText: $.t('screens.ds.grid_sidebar.map.legend.custom_entry'),
                      name: 'displayFormat.legendDetails.customEntries',
                      field: {
                          type: 'group', options: [
                              { type: 'color', name: 'color', defaultValue: blist.defaultColors,
                                lineClass: 'colorCollapse' },
                              { text: $.t('screens.ds.grid_sidebar.map.legend.entry_label'), type: 'text',
                                name: 'label', required: true }
                          ]
                    } }
                ]
            });
        return config;
    };

    mapConfigNS.dataLayer = {};
    mapConfigNS.dataLayer.socrataBase = function(options)
    {
        var prefix = options.prefix || 'displayFormat.';
        var boundaryOnly = {field: prefix+'plotStyle', value: 'heatmap' };
        return [
            {text: $.t('screens.ds.grid_sidebar.map.data_layer.alias'), type: 'text', name: prefix+'alias',
                prompt: $.t('screens.ds.grid_sidebar.map.data_layer.alias_prompt') },
            {text: $.t('screens.ds.grid_sidebar.map.data_layer.plot_style'), type: 'select', name: prefix+'plotStyle',
                options: plotStyles, required: true, prompt: $.t('screens.ds.grid_sidebar.map.data_layer.plot_style') },
            {text: $.t('screens.ds.grid_sidebar.map.data_layer.location'), name: prefix+'plot.locationId',
                type: 'columnSelect', isTableColumn: true, required: true,
                columns: {type: ['location', 'point'], hidden: options.isEdit }},
            {text: $.t('screens.ds.grid_sidebar.map.data_layer.region'), name: prefix+'heatmap.type', type: 'select', onlyIf: boundaryOnly,
                required: !customHeatmap(options), prompt: $.t('screens.ds.grid_sidebar.map.data_layer.region_level_prompt'),
                options: regionTypes},
            {text: '', name: prefix+'heatmap.region', type: 'select', onlyIf: boundaryOnly,
                required: true, prompt: $.t('screens.ds.grid_sidebar.map.data_layer.region_prompt'), linkedField: prefix+'heatmap.type',
                options: heatmapRegionOptions}
        ];
    };
    mapConfigNS.dataLayer.socrata = function(options)
    {
        var prefix = options.prefix || 'displayFormat.';
        var pointOnly = {field: prefix+'plotStyle', value: 'point' };
        var quantity = {field: prefix+'plotStyle', value: 'point', negate: true };
        var flyouts = {field: prefix+'plotStyle', value: 'rastermap', negate: true };
        var boundaryOnly = {field: prefix+'plotStyle', value: 'heatmap' };
        return [
            {text: $.t('screens.ds.grid_sidebar.map.data_layer.base_color'), name: prefix+'color', type: 'color', onlyIf: pointOnly,
                defaultValue: "#0000ff"},
            {text: $.t('screens.ds.grid_sidebar.map.data_layer.highlight_color'), name: prefix+'highlightColor', type: 'color', onlyIf: pointOnly,
                defaultValue: "#ddeaf0"},

            {type: 'note', value: $.t('screens.ds.grid_sidebar.map.data_layer.point'), onlyIf: pointOnly},
            {text: $.t('screens.ds.grid_sidebar.map.data_layer.point_size'), name: prefix+'plot.sizeValueId', onlyIf: pointOnly,
                type: 'columnSelect', isTableColumn: true,
                columns: {type: ['number', 'money', 'percent'], noDefault: true, hidden: options.isEdit}},
            {text: $.t('screens.ds.grid_sidebar.map.data_layer.point_color'), name: prefix+'plot.colorValueId', onlyIf: pointOnly,
                type: 'columnSelect', isTableColumn: true,
                columns: {type: ['number', 'money', 'percent'], noDefault: true, hidden: options.isEdit}},
            {text: $.t('screens.ds.grid_sidebar.map.data_layer.icon'), name: prefix+'plot.iconId', onlyIf: pointOnly,
                type: 'columnSelect', isTableColumn: true,
                columns: {type: ['photo', 'photo_obsolete', 'url'],
                    noDefault: true, hidden: options.isEdit}},

            {type: 'color', text: $.t('screens.ds.grid_sidebar.map.data_layer.color_low'), defaultValue: ['#c9c9c9'], onlyIf: boundaryOnly,
                name: prefix+'heatmap.colors.low'},
            {type: 'color', defaultValue: ['#00ff00'], text: $.t('screens.ds.grid_sidebar.map.data_layer.color_high'), onlyIf: boundaryOnly,
                name: prefix+'heatmap.colors.high'},

            {text: $.t('screens.ds.grid_sidebar.map.data_layer.quantity'), name: prefix+'plot.quantityId', onlyIf: quantity,
                type: 'columnSelect', isTableColumn: true,
                columns: {type: ['number', 'money', 'percent'], noDefault: true, hidden: options.isEdit}},

            {type: 'note', value: $.t('screens.ds.grid_sidebar.map.data_layer.flyout.title'), onlyIf: flyouts},
            {text: $.t('screens.ds.grid_sidebar.map.data_layer.flyout.title_column'), name: prefix+'plot.titleId', onlyIf: flyouts,
                type: 'columnSelect', isTableColumn: true,
                columns: {type: ['text', 'location', 'html', 'url',
                    'drop_down_list', 'dataset_link', 'email',
                    'percent', 'stars', 'flag', 'phone', 'money',
                    'data', 'calendar_date', 'number'], hidden: options.isEdit,
                    defaultNames: ['title']}},
            {type: 'repeater', name: prefix+'plot.descriptionColumns', onlyIf: flyouts,
                field: {text: $.t('screens.ds.grid_sidebar.map.data_layer.flyout.details'), name: 'tableColumnId',
                       type: 'columnSelect', isTableColumn: true,
                       columns: {hidden: options.isEdit}},
                minimum: 1, addText: $.t('screens.ds.grid_sidebar.map.data_layer.flyout.new_details_button')},
            {text: $.t('screens.ds.grid_sidebar.map.data_layer.flyout.labels'), type: 'checkbox', name: prefix+'flyoutsNoLabel', onlyIf: flyouts},

            {text: $.t('screens.ds.grid_sidebar.map.data_layer.flyout.opacity'), type: 'slider', name: prefix+'opacity',
                defaultValue: 1, minimum: 0, maximum: 1}
        ];
    };
    mapConfigNS.dataLayer.mondara = function(options)
    {
        var prefix = options.prefix || 'displayFormat.';

        return [
            {text: $.t('screens.ds.grid_sidebar.map.data_layer.alias'), type: 'text', name: prefix+'alias',
                prompt: $.t('screens.ds.grid_sidebar.map.data_layer.alias_prompt') },
            {text: $.t('screens.ds.grid_sidebar.map.data_layer.opacity'), type: 'slider', name: prefix+'opacity',
                defaultValue: 1, minimum: 0, maximum: 1},
            { type: 'note', value: $.t('screens.ds.grid_sidebar.map.data_layer.mondara_note') }
        ];
    };
    mapConfigNS.dataLayer.esri = function(options)
    {
        var prefix = options.prefix;
        return [
            {text: $.t('screens.ds.grid_sidebar.map.data_layer.alias'), type: 'text', name: prefix+'alias',
                prompt: $.t('screens.ds.grid_sidebar.map.data_layer.alias_prompt') },
            {text: $.t('screens.ds.grid_sidebar.map.data_layer.flyout.title_column'), name: prefix+'plot.titleId',
                type: 'columnSelect', isTableColumn: true,
                columns: {type: ['text', 'location', 'html', 'url',
                    'drop_down_list', 'dataset_link', 'email',
                    'percent', 'stars', 'flag', 'phone', 'money',
                    'data', 'calendar_date', 'number'], hidden: options.isEdit,
                    defaultNames: ['title']}},
            {type: 'repeater', name: prefix+'plot.descriptionColumns',
                field: {text: $.t('screens.ds.grid_sidebar.map.data_layer.flyout.details'), name: 'tableColumnId',
                       type: 'columnSelect', isTableColumn: true,
                       columns: {hidden: options.isEdit}},
                minimum: 1, addText: $.t('screens.ds.grid_sidebar.map.data_layer.flyout.new_details_button')},
            {text: $.t('screens.ds.grid_sidebar.map.data_layer.flyout.labels'), type: 'checkbox', name: prefix+'flyoutsNoLabel'},

            {text: $.t('screens.ds.grid_sidebar.map.data_layer.flyout.opacity'), type: 'slider', name: prefix+'opacity',
                defaultValue: 1, minimum: 0, maximum: 1}
        ];
    };

})(jQuery);
