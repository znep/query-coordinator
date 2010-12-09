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
    var plotStyles = [
        {text: 'Point Map', value: 'point'},
        {text: 'Heat Map', value: 'heatmap'}
    ];

    var isEdit = blist.dataset.type == 'map';

    var arcgisBaseService = 'http://server.arcgisonline.com/ArcGIS/rest/services/';
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

    var configLocation = {
            title: 'Location',
            onlyIf: {field: 'displayFormat.type', value: 'esri', negate: true},
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
                     {func: isNotArcGISDataset}],
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
        $.Tache.Get({url: '/api/domains?method=findMapLayers',
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
                     {field: 'displayFormat.plotStyle', value: 'point'}],
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
                            defaultValue: 'http://', required: true,
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
        { field: 'displayFormat.type', value: 'esri' }];
    configLayersHeatmap.type = 'selectable';
    configLayersHeatmap.name = 'heatmapLayers';
    configLayersHeatmap.fields[0].minimum = 0;
    configLayersHeatmap.wizard = 'Do you want to add a layer?';

    var configName = 'visualize.mapCreate';
    var config =
    {
        name: configName,
        priority: 2,
        title: 'Map',
        subtitle: 'Views with locations can be displayed as points on a map',
        onlyIf: function()
        {
            return (_.select(blist.dataset.realColumns, function(c)
                {
                    return c.dataTypeName == 'location' && (isEdit || !c.hidden);
                }).length > 0 || blist.dataset.isArcGISDataset())
                && (blist.dataset.valid || isEdit);
        },
        disabledSubtitle: function()
        {
            return !blist.dataset.valid && !isEdit ? 'This view must be valid' :
                'This view must have a location column';
        },
        sections: [
            {
                title: 'Map Setup',
                fields: [
                    {text: 'Name', name: 'name', type: 'text', required: true,
                        prompt: 'Enter a name',
                        wizard: 'Enter a name for your map'
                    },
                    mapTypeSelector,
                    {text: 'Plot Style', name: 'displayFormat.plotStyle', type: 'select',
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
                onlyIf: {field: 'displayFormat.plotStyle', value: 'heatmap', negate: true},
                fields: [
                    {text: 'Title', name: 'displayFormat.plot.titleId',
                        type: 'columnSelect', isTableColumn: true,
                        columns: {type: ['text', 'location'], hidden: isEdit},
                        wizard: 'Choose a column that contains ' +
                            'titles for each point'
                    },
                    {text: 'Description', name: 'displayFormat.plot.descriptionId',
                        type: 'columnSelect', isTableColumn: true,
                        columns: {type: ['text', 'html', 'number', 'percent', 'money', 'location'],
                            hidden: isEdit},
                        wizard: 'Choose a column that contains ' +
                            'descriptions for each point'
                    },
                    {text: 'Group Pins?', type: 'checkbox',
                        onlyIf: {field: 'displayFormat.type', value: 'google'},
                        name: 'displayFormat.clusterMarkers'},
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
                            hidden: isEdit},
                        wizard: 'Choose a column that contains ' +
                            'an icon for each point'
                    }
                ],
                wizard: 'Do you have titles or descriptions for your points?'
            },
            { // Heatmap Details section.
                title: 'Details', name: 'hmDetailsSection',
                onlyIf: {field: 'displayFormat.plotStyle', value: 'heatmap'},
                fields: [
                    {text: 'Description', name: 'displayFormat.plot.descriptionId',
                        type: 'columnSelect', isTableColumn: true,
                        columns: {type: ['text', 'html', 'location'],
                            hidden: isEdit},
                        wizard: 'Choose a column that contains ' +
                            'descriptions for each point'
                    },
                    {text: 'Quantity', name: 'displayFormat.plot.quantityId',
                        required: true, type: 'columnSelect', isTableColumn: true,
                        columns: {type: ['number', 'money', 'percent'], hidden: isEdit},
                        wizard: 'Choose a column that contains ' +
                            'quantities for each point'
                    },
                    {text: 'Region', name: 'displayFormat.heatmap.type', type: 'select',
                        required: true, prompt: 'Select a region level',
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
            buttons: [isEdit ? $.gridSidebar.buttons.update :
                $.gridSidebar.buttons.create, $.gridSidebar.buttons.cancel],
            wizard: "Now you're ready to " +
                (isEdit ? 'update your' : 'create a new') + ' map'
        }
    };

    config.dataSource = function()
    {
        return isEdit ? blist.dataset : null;
    };

    config.finishCallback = function(sidebarObj, data, $pane, value)
    {
        if (!sidebarObj.baseFormHandler($pane, value)) { return; }

        var view = $.extend({displayType: 'map'}, sidebarObj.getFormValues($pane));

        if (view.displayFormat.type == blist.dataset.displayFormat.type)
        { view.displayFormat.viewport = blist.dataset.displayFormat.viewport; }

        blist.dataset.update(view);

        if (!isEdit)
        {
            blist.dataset.saveNew(function(newView)
            {
                sidebarObj.finishProcessing();
                newView.redirectTo();
            },
            function(xhr) { sidebarObj.genericErrorHandler($pane, xhr); });
        }
        else
        {
            blist.dataset.save(function(newView)
            {
                sidebarObj.finishProcessing();

                $('.currentViewName').text(newView.name);

                var finishUpdate = function()
                {
                    sidebarObj.$dom().socrataAlert(
                        {message: 'Your map has been updated', overlay: true});

                    sidebarObj.hide();
                    sidebarObj.addPane(configName);

                    _.defer(function() { $(window).resize(); });
                };

                var colIds = _.pluck(newView.realColumns, 'id');

                if (colIds.length > 0)
                { newView.setVisibleColumns(colIds, finishUpdate); }
                else { finishUpdate(); }
            });
        }
    };

    $.gridSidebar.registerConfig(config, 'map');
})(jQuery);
