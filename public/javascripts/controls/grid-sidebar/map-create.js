(function($)
{
    if (blist.sidebarHidden.visualize &&
        blist.sidebarHidden.visualize.mapCreate) { return; }

    var mapTypes = [
        {text: 'Google Maps', value: 'google'},
        {text: 'Bing Maps', value: 'bing'},
        {text: 'ESRI ArcGIS', value: 'esri'}
    ];
    var regionTypes = [
        {text: 'Countries', value: 'countries'},
        {text: 'US States', value: 'state'},
        {text: 'Counties in', value: 'counties'}
    ];
    var plotStyles = function(mapType)
    {
        var plotStyles = [
            {text: 'Point Map', value: 'point'},
            {text: 'Heat Map', value: 'heatmap'}
        ];
        if (mapType == 'esri')
        { plotStyles.push({text: 'Raster Heat Map', value: 'rastermap'}); }
        return plotStyles;
    };

    var isEdit = _.include(blist.dataset.metadata.availableDisplayTypes, 'map');

    var arcgisBaseService = 'https://server.arcgisonline.com/ArcGIS/rest/services/';
    var mapLayers = [
        {text: 'Street Map',
            value: arcgisBaseService + 'World_Street_Map/MapServer',
            data: {type: 'tile'}},
        {text: 'Satellite Imagery',
            value: arcgisBaseService + 'World_Imagery/MapServer',
            data: {type: 'tile'}},
        {text: 'Detailed USA Topographic Map',
            value: arcgisBaseService + 'USA_Topo_Maps/MapServer',
            data: {type: 'tile'}},
        {text: 'Annotated World Topographic Map',
            value: arcgisBaseService + 'World_Topo_Map/MapServer',
            data: {type: 'tile'}},
        {text: 'Natural Earth Map',
            value: arcgisBaseService + 'World_Physical_Map/MapServer',
            data: {type: 'tile'}}
    ];
    var newMapLayers = [
        {text: 'WebApp Layer Set', value: 'webapp', data: {type: null}},
        {text: 'Custom Layer', value: 'custom', data: {type: null}}
    ];

    mapLayers = mapLayers.concat(newMapLayers);

    // keep track that we only get domain map layers once.
    var domainMapLayersCalled = false;

    var normalizeLayerUrl = function($control, event)
    {
        $control.attr('data-custom-validlayerurl', 'unverified');
    };

    var heatmapRegionOptions = function(heatmapType)
    {
        if ($.isBlank(heatmapType)) return null;
        if (heatmapType != 'counties') return null;
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

    var isArcGISDataset    = function() { return  blist.dataset.isArcGISDataset(); };
    var isNotArcGISDataset = function() { return !blist.dataset.isArcGISDataset(); };

    var customHeatmap = function()
    {
        return blist.dataset.displayFormat.heatmap &&
               blist.dataset.displayFormat.heatmap.type == 'custom';
    };
    var notCustomHeatmap = function() { return !customHeatmap(); }

    var mapTypeSelector = {
        text: 'Map Type', name: 'displayFormat.type', type: 'select',
        required: true, prompt: 'Select a map type',
        options: mapTypes,
        wizard: 'Select a map type'
    };
    if (isArcGISDataset())
    {
        mapTypeSelector = {
            text: 'Map Type', name: 'displayFormat.type', type: 'select',
            required: true, prompt: null,
            options: _.select(mapTypes, function(t) { return t.value == 'esri'; }),
            defaultValue: 'esri'
        };
    }

    var sectionOnlyIf = {func: function()
        {
            return blist.dataset.columnsForType('location', isEdit).length > 0
                || blist.dataset.isArcGISDataset();
        }};

    var configLocation = {
            title: 'Location',
            onlyIf: [{field: 'displayFormat.type', value: 'esri', negate: true},
                sectionOnlyIf],
            fields: [
                {text: 'Location', name: 'displayFormat.plot.locationId',
                    required: true, type: 'columnSelect', isTableColumn: true,
                    columns: {type: 'location', hidden: isEdit},
                    wizard: 'Choose a column with location ' +
                        'coordinates to map'
                }
            ]
        };
    var configLocationESRI = {
            title: 'Location',
            onlyIf: [{field: 'displayFormat.type', value: 'esri'},
                     {func: isNotArcGISDataset}, sectionOnlyIf],
            fields: [
                {text: 'Location', type: 'radioGroup',
                    name: 'locationSection',
                    defaultValue: 'displayFormat.plot.locationId',
                    options: [
                        {name: 'displayFormat.plot.locationId',
                            type: 'columnSelect', isTableColumn: true,
                            columns: {type: 'location', hidden: isEdit}
                        },
                        {value: 'No Locations', type: 'static',
                            name: 'displayFormat.noLocations', isInput: true }
                    ],
                    wizard: 'Choose a column with location ' +
                        'coordinates to map'
                }
            ]
        };

    var getDomainMapLayers = function(triggerFieldVal, notUsed, $field, curVal) {

        if (domainMapLayersCalled)
        {
            return mapLayers;
        }

        domainMapLayersCalled = true;
        $.Tache.Get({url: '/api/layers',
            success: function(dmls)
            {
                _.each(dmls, function(ml)
                {
                    mapLayers.push({text: ml.name, value: ml.url, data: {type: 'dynamic'}});
                });

                $field.data('linkedFieldValues', '_reset');
                _.each($field.data('linkedGroup'), function(f) {
                    $(f).trigger('change');
                });

                _.defer(function() { $field.val(curVal); });
            }});

        return mapLayers;
    };

    var configLayers = {
            title: 'Layers',
            onlyIf: [{field: 'displayFormat.type', value: 'esri'},
                     {field: 'displayFormat.plotStyle', value: 'heatmap', negate: true},
                     sectionOnlyIf],
            fields: [
                {type: 'text', name: 'triggerMapLayer', lineClass: 'hide'},

                {type: 'repeater', minimum: 1, addText: 'Add Layer',
                    name: 'displayFormat.layers',
                    field: {type: 'group', options: [
                        {text: 'Layer', type: 'select',
                            name: 'url',
                            defaultValue: mapLayers[0].value,
                            repeaterValue: '',
                            required: true, prompt: 'Select a layer',
                            linkedField: 'triggerMapLayer',
                            options: getDomainMapLayers
                        },
                        {text: 'Webapp ID', type: 'text',
                            name: 'webappid', onlyIf: {field: 'url', value: 'webapp'},
                            required: true },
                        {text: 'Layer URL', type: 'text',
                            name: 'custom_url', onlyIf: {field: 'url', value: 'custom'},
                            defaultValue: 'https://', required: true,
                            data: { 'validlayerurl': 'unverified' },
                            change: normalizeLayerUrl },
                        {text: 'Opacity', type: 'slider',
                            name: 'options.opacity',
                            defaultValue: 1, repeaterValue: 0.6,
                            minimum: 0, maximum: 1}
                    ]},
                    wizard: 'Choose one or more layers to ' +
                        'display for your map; and set their visibility'
                }
            ]
        };
    var configLayersHeatmap = $.extend(true, {}, configLayers);
    configLayersHeatmap.onlyIf = [
        { field: 'displayFormat.plotStyle', value: 'heatmap' },
        { field: 'displayFormat.type', value: 'esri' }, sectionOnlyIf];
    configLayersHeatmap.type = 'selectable';
    configLayersHeatmap.name = 'heatmapLayers';
    configLayersHeatmap.fields[1].minimum = 0;
    configLayersHeatmap.wizard = 'Do you want to add a layer?';
    configLayersHeatmap.fields.push({ text: 'Force Display', type: 'checkbox',
        name: 'displayFormat.forceBasemap', wizard: 'Check this to require the underlying map ' +
        'to display regardless.' });

    var configName = 'visualize.mapCreate';

    var sidebar;
    // Hook up clicks on the disabled message
    // I don't really like hard-coding this ID into the selector; but
    // $section.siblings('.sectionDisabledMessage').find('a').live
    // doesn't seem to work...
    $.live('#gridSidebar_mapCreate .sectionDisabledMessage a',
        'click', function(e)
        {
            e.preventDefault();
            var col = {dataTypeName: 'location', convert: {}};
            var doShow = false;
            switch ($.hashHref($(this).attr('href')))
            {
                case 'convertLatLong':
                    // Makes the 'Use Existing' sections show expanded by
                    // default
                    col.convert.latitudeColumn = true;
                case 'convertLoc':
                    col.convert.addressColumn = true;
                    break;
                case 'showLoc':
                    doShow = true;
                    break;
            }

            // Listen for when they add a column, and then re-show this pane
            blist.dataset.once('columns_changed',
                function()
                {
                    // If they hit Cancel from 'Create column' then this
                    // function might trigger some time later.  Make sure that
                    // it is valid before we re-show it, at least
                    if (sectionOnlyIf.func())
                    { _.defer(function() { sidebar.show(configName); }); }
                });

            if (doShow)
            { sidebar.show('filter.showHide'); }
            else
            { sidebar.show('edit.addColumn', col); }
        });

    // Change disabled message based on whether or not the add column dialog is
    // available
    var disabledMessage = function()
    {
        var msg = 'A location column is required to create a map.';
        var hasHiddenLoc = _.any(blist.dataset.realColumns, function(c)
            { return c.dataTypeName == 'location' && c.hidden; });
        if (!hasHiddenLoc &&
            (!blist.sidebarHidden.edit || !blist.sidebarHidden.edit.addColumn))
        {
            var opts = [];
            if (blist.dataset.columnsForType('number').length > 1)
            {
                opts.push('you can <a href="#convertLatLong" ' +
                    'title="Convert latitude and longitude to a location">' +
                    'convert latitude and longitude data to a location column</a>');
            }
            if (blist.dataset.columnsForType('text').length > 0)
            {
                opts.push('you can <a href="#convertLoc" ' +
                    'title="Convert to a location">' +
                    'convert addresses into a location column</a>');
            }
            opts.push('you can <a href="#createLoc" ' +
                'title="Create a location column">' +
                'create a new location column</a> and add data.');
            msg += ' ' + $.arrayToSentence(opts, 'or', ',', true).capitalize();
        }
        else if (hasHiddenLoc && (!blist.sidebarHidden.filter ||
            !blist.sidebarHidden.filter.showHide))
        {
            msg += ' You can <a href="#showLoc" title="Show a location column">' +
                'show a hidden location column</a>';
            if (!blist.sidebarHidden.edit || !blist.sidebarHidden.edit.addColumn)
            {
                msg += ', or <a href="#createLoc" ' +
                    'title="Create a location column">' +
                    'create a new location column</a>';
            }
            msg += '.';
        }
        return msg;
    };

    var config =
    {
        name: configName,
        priority: 2,
        title: 'Map',
        subtitle: 'Views with locations can be displayed as points on a map',
        dataSource: blist.dataset,
        onlyIf: function()
        {
            return (blist.dataset.valid || isEdit) &&
                (_.include(blist.dataset.metadata.availableDisplayTypes,
                    'map') || !blist.dataset.isAltView());
        },
        disabledSubtitle: function()
        {
            return !blist.dataset.valid && !isEdit ?
                'This view must be valid' :
                'A view may only have one visualization on it';
        },
        showCallback: function(sidebarObj) { sidebar = sidebarObj; },
        sections: [
            {
                title: 'Map Setup',
                onlyIf: $.extend({disable: true, disabledMessage: disabledMessage},
                    sectionOnlyIf),
                fields: [
                    mapTypeSelector,
                    {text: 'Plot Style', name: 'displayFormat.plotStyle', type: 'select',
                        linkedField: 'displayFormat.type',
                        required: true, prompt: 'Select a plot style',
                        options: plotStyles,
                        wizard: 'Select a plotting style'
                    }
                ]
            },
            configLocation,
            configLocationESRI,
            { // General Details section.
                title: 'Details', type: 'selectable', name: 'detailsSection',
                onlyIf: [{field: 'displayFormat.plotStyle', value: 'point'}, sectionOnlyIf],
                fields: [
                    {text: 'Title', name: 'displayFormat.plot.titleId',
                        type: 'columnSelect', isTableColumn: true,
                        columns: {type: ['text', 'location', 'html', 'url',
                            'drop_down_list', 'dataset_link', 'email', 'tag',
                            'percent', 'stars', 'flag', 'phone', 'money',
                            'data', 'calendar_date', 'number'], hidden: isEdit,
                            defaultNames: ['title']},
                        wizard: 'Choose a column that contains ' +
                            'titles for each point'
                    },
                    {type: 'repeater',
                        name: 'displayFormat.plot.descriptionColumns',
                        field: {text: 'Flyout Details', name: 'tableColumnId',
                               type: 'columnSelect', isTableColumn: true,
                               columns: {hidden: isEdit}},
                        minimum: 1, addText: 'Add Flyout Details'
                    },
                    {type: 'note', onlyIf: {field: 'displayFormat.type', value: 'esri'},
                        value: 'Colors may be overridden using ' +
                        '<a href="#Conditional Formatting" ' +
                        'id="showConditionalFormatting">Conditional Formatting</a>. ' +
                        'Click <a href="#Clear Conditional Formatting" ' +
                        'id="clearConditionalFormatting">here</a> to clear any ' +
                        'current conditional formatting rules.' },
                    {text: 'Base Color', name: 'displayFormat.color', type: 'color',
                        onlyIf: {field: 'displayFormat.type', value: 'esri'},
                        defaultValue: "#0000ff"},
                    {text: 'Point Size', name: 'displayFormat.plot.sizeValueId',
                        onlyIf: {field: 'displayFormat.type', value: 'esri'},
                        type: 'columnSelect', isTableColumn: true,
                        columns: {type: ['number', 'money', 'percent'], hidden: isEdit},
                        wizard: 'Choose a column that contains ' +
                            'quantities specifying the size of each point'
                    },
                    {text: 'Point Color', name: 'displayFormat.plot.colorValueId',
                        onlyIf: {field: 'displayFormat.type', value: 'esri'},
                        type: 'columnSelect', isTableColumn: true,
                        columns: {type: ['number', 'money', 'percent'], hidden: isEdit},
                        wizard: 'Choose a column that contains ' +
                                'quantities specifying the color of each point'
                    },
                    {text: 'Icon', name: 'displayFormat.plot.iconId',
                        type: 'columnSelect', isTableColumn: true,
                        columns: {type: ['photo', 'photo_obsolete', 'url'],
                            noDefault: true, hidden: isEdit},
                        wizard: 'Choose a column that contains ' +
                            'an icon for each point'
                    }
                ],
                wizard: 'Do you have titles or descriptions for your points?'
            },
            { // Rastermap Details section.
                title: 'Details', name: 'rmDetailsSection',
                onlyIf: [{field: 'displayFormat.plotStyle', value: 'rastermap'},
                    sectionOnlyIf],
                fields: [
                    {text: 'Quantity', name: 'displayFormat.plot.quantityId',
                        onlyIf: {field: 'displayFormat.plotStyle', value: 'rastermap'},
                        type: 'columnSelect', isTableColumn: true,
                        columns: {type: ['number', 'money', 'percent'], hidden: isEdit},
                        wizard: 'Choose a column that contains ' +
                            'quantities for each point'
                    }
                ],
                wizard: 'Do you have titles or descriptions for your points?'
            },
            { // Heatmap Details section.
                title: 'Details', name: 'hmDetailsSection',
                onlyIf: [{field: 'displayFormat.plotStyle', value: 'heatmap'},
                    sectionOnlyIf],
                fields: [
                    {type: 'repeater',
                        name: 'displayFormat.plot.descriptionColumns',
                        field: {text: 'Flyout Details', name: 'tableColumnId',
                               type: 'columnSelect', isTableColumn: true,
                               columns: {hidden: isEdit}},
                        minimum: 1, addText: 'Add Flyout Details'
                    },
                    {text: 'Quantity', name: 'displayFormat.plot.quantityId',
                        type: 'columnSelect', isTableColumn: true,
                        columns: {type: ['number', 'money', 'percent'], hidden: isEdit},
                        wizard: 'Choose a column that contains ' +
                            'quantities for each point'
                    },
                    {text: 'Region', name: 'displayFormat.heatmap.type', type: 'select',
                        required: notCustomHeatmap(), prompt: 'Select a region level',
                        options: regionTypes,
                        wizard: 'Choose the type of regions the ' +
                            'heat map will display'
                    },
                    {text: '', name: 'displayFormat.heatmap.region', type: 'select',
                        required: true, prompt: 'Select a region',
                        linkedField: 'displayFormat.heatmap.type',
                        options: heatmapRegionOptions,
                        wizard: 'Choose the region in which this dataset is in'
                    },
                    {type: 'color', text: 'Color (Low)', defaultValue: ['#c9c9c9'],
                        name: 'displayFormat.heatmap.colors.low',
                        wizard: 'Color to display for lowest quantity'
                    },
                    {type: 'color', defaultValue: ['#00ff00'], text: 'Color (High)',
                        name: 'displayFormat.heatmap.colors.high',
                        wizard: 'Color to display for highest quantity'
                    }
                ]
            },
            configLayers,
            configLayersHeatmap
        ],
        finishBlock: {
            buttons: [$.gridSidebar.buttons.apply, $.gridSidebar.buttons.cancel],
            wizard: "Now you're ready to " +
                (isEdit ? 'update your' : 'create a new') + ' map'
        }
    };

    config.finishCallback = function(sidebarObj, data, $pane, value)
    {
        if (!sidebarObj.baseFormHandler($pane, value)) { return; }

        var view = $.extend(true, {metadata: {renderTypeConfig: {visible: {map: true}}}},
            sidebarObj.getFormValues($pane), {metadata: blist.dataset.metadata});

        if (customHeatmap())
        {
            view.displayFormat.heatmap.type = 'custom';
            view.displayFormat.heatmap.cache_url =
                blist.dataset.displayFormat.heatmap.cache_url;
        }

        if (view.displayFormat.type == blist.dataset.displayFormat.type)
        { view.displayFormat.viewport = blist.dataset.displayFormat.viewport; }
        else if (blist.dataset.displayFormat.type == 'bing')
        {
            blist.datasetControls.showSaveViewDialog(isEdit ?
                'reloadUpdateDialog' : 'reloadSaveDialog', null, null,
                function()
                {
                    sidebarObj.finishProcessing();
                    sidebarObj.refresh(configName);
                }, view);
            return;
        }

        blist.dataset.update(view);

        if (isEdit)
        {
            // We need to show all columns when editing a view so that
            // any filters/facets work properly
            var colIds = _.pluck(blist.dataset.realColumns, 'id');
            if (colIds.length > 0)
            { blist.dataset.setVisibleColumns(colIds, null, true); }
        }

        sidebarObj.finishProcessing();
        sidebarObj.refresh(configName);
    };

    $.live('#gridSidebar_mapCreate #showConditionalFormatting', 'click', function(e)
    {
        e.preventDefault();
        blist.datasetPage.sidebar.show('visualize.conditionalFormatting');
    });

    $.live('#gridSidebar_mapCreate #clearConditionalFormatting', 'click', function(e)
    {
        e.preventDefault();
        var metadata = $.extend(true, {}, blist.dataset.metadata);
        delete metadata.conditionalFormatting;
        blist.dataset.update({ metadata: metadata });
    });

    blist.dataset.bind('clear_temporary', function()
        { if (!$.isBlank(sidebar)) { sidebar.refresh(configName); } });

    $.gridSidebar.registerConfig(config, 'map');
})(jQuery);
