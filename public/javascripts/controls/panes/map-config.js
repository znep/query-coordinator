;(function($) {
    var mapConfigNS = blist.namespace.fetch('blist.configs.map');

    var mapTypes = [
        {text: 'Google Maps', value: 'google'},
        {text: 'Bing Maps', value: 'bing'},
        {text: 'ESRI ArcGIS', value: 'esri'}
    ];
    var regionTypes = [
        {text: 'Countries', value: 'countries'},
        {text: 'US States', value: 'state'},
        {text: 'Canada Provinces', value: 'canada_provinces'},
        {text: 'US Counties in', value: 'counties'}
    ];
    var plotStyles = function(mapType)
    {
        // Yes, the names are kinda inaccurate, but eh. We live with it.
        var plotStyles = [
            {text: 'Point Map', value: 'point'},
            {text: 'Boundary Map', value: 'heatmap'},
            {text: 'Heat Map', value: 'rastermap'}
        ];
        return plotStyles;
    };

    var arcgisBaseService = 'https://server.arcgisonline.com/ArcGIS/rest/services/';
    var mapLayers = [
        {text: 'Street Map', value: arcgisBaseService + 'World_Street_Map/MapServer',
            data: {type: 'tile'}},
        {text: 'Satellite Imagery', value: arcgisBaseService + 'World_Imagery/MapServer',
            data: {type: 'tile'}},
        {text: 'Detailed USA Topographic Map', value: arcgisBaseService + 'USA_Topo_Maps/MapServer',
            data: {type: 'tile'}},
        {text: 'Annotated World Topographic Map', value: arcgisBaseService + 'World_Topo_Map/MapServer',
            data: {type: 'tile'}},
        {text: 'Natural Earth Map', value: arcgisBaseService + 'World_Physical_Map/MapServer',
            data: {type: 'tile'}}
    ];
    var newMapLayers = [
        {text: 'WebApp Layer Set', value: 'webapp', data: {type: null}},
        {text: 'Custom Layer', value: 'custom', data: {type: null}}
    ];

    mapLayers = mapLayers.concat(newMapLayers);

    var normalizeLayerUrl = function($control, event)
    { $control.attr('data-custom-validlayerurl', 'unverified'); };

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

    var customHeatmap = function(options)
    {
        return options.view.displayFormat.heatmap &&
               options.view.displayFormat.heatmap.type == 'custom';
    };

    var sectionOnlyIf = function(options)
    {
        return {func: function()
            {
                return this._view.columnsForType('location', options.isEdit).length > 0
                    || this._view.isArcGISDataset();
            }};
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

    var configLayers = function(options)
    {
        return {
            title: 'Layers',
            onlyIf: [{field: 'displayFormat.type', value: 'esri'},
                     {field: 'displayFormat.plotStyle', value: 'heatmap', negate: true},
                     sectionOnlyIf(options)],
            fields: [
                {type: 'text', name: 'triggerMapLayer', lineClass: 'hide'},

                {type: 'repeater', minimum: 1, addText: 'Add Layer', name: 'displayFormat.layers',
                    field: {type: 'group', options: [
                        {text: 'Layer', type: 'select', name: 'url',
                            defaultValue: mapLayers[0].value, repeaterValue: '',
                            required: true, prompt: 'Select a layer',
                            linkedField: 'triggerMapLayer', options: getDomainMapLayers
                        },
                        {text: 'Webapp ID', type: 'text', name: 'webappid',
                            onlyIf: {field: 'url', value: 'webapp'}, required: true },
                        {text: 'Layer URL', type: 'text', name: 'custom_url',
                            onlyIf: {field: 'url', value: 'custom'}, defaultValue: 'https://',
                            required: true, data: { 'validlayerurl': 'unverified' },
                            change: normalizeLayerUrl },
                        {text: 'Opacity', type: 'slider', name: 'options.opacity',
                            defaultValue: 1, repeaterValue: 0.6, minimum: 0, maximum: 1}
                    ]}
                }
            ]
        };
    };

    var configLayersHeatmap = function(options)
    {
        var conf = configLayers(options);
        conf.onlyIf = [
            { field: 'displayFormat.plotStyle', value: 'heatmap' },
            { field: 'displayFormat.type', value: 'esri' }, sectionOnlyIf(options)];
        conf.type = 'selectable';
        conf.name = 'heatmapLayers';
        conf.fields[1].minimum = 0;
        conf.fields.push({ text: 'Force Display', type: 'checkbox', name: 'displayFormat.forceBasemap' });
        return conf;
    };

    var disabledMessage = function(options)
    {
        return function()
        {
            var cpObj = this;
            var msg = 'A location column is required to create a map.';
            var hasHiddenLoc = _.any(cpObj._view.realColumns, function(c)
                { return c.dataTypeName == 'location' && c.hidden; });
            if (options.useOtherSidebars && hasHiddenLoc && ($.isBlank(blist.sidebarHidden.manage) ||
                !blist.sidebarHidden.manage.showHide))
            {
                msg += ' You can <a href="#showLoc" title="Show a location column">' +
                    'show a hidden location column</a>.';
            }
            return msg;
        };
    };

    /*** Main config ***/

    mapConfigNS.config = function(options)
    {
        options = $.extend({isEdit: false, useOtherSidebars: false}, options);
        return [
            {
                title: 'Map Setup',
                onlyIf: $.extend({disable: true, disabledMessage: disabledMessage(options)},
                        sectionOnlyIf(options)),
                fields: [
                    !options.view.isArcGISDataset() ?
                    {
                        text: 'Map Type', name: 'displayFormat.type', type: 'select',
                        required: true, prompt: 'Select a map type', options: mapTypes
                    } :
                    {
                        text: 'Map Type', name: 'displayFormat.type', type: 'select',
                        required: true, prompt: null,
                        options: _.select(mapTypes, function(t) { return t.value == 'esri'; }),
                        defaultValue: 'esri'
                    },
                    {text: 'Plot Style', name: 'displayFormat.plotStyle', type: 'select',
                        linkedField: 'displayFormat.type', required: true,
                        prompt: 'Select a plot style', options: plotStyles
                    }
                ]
            },

            // Normal location
            {
                title: 'Location',
                onlyIf: [{field: 'displayFormat.type', value: 'esri', negate: true}, sectionOnlyIf(options)],
                fields: [
                    {text: 'Location', name: 'displayFormat.plot.locationId',
                        required: true, type: 'columnSelect', isTableColumn: true,
                        columns: {type: 'location', hidden: options.isEdit}}
                ]
            },

            // ESRI location
            {
                title: 'Location',
                onlyIf: [{field: 'displayFormat.type', value: 'esri'},
                         { func: function() { return !this._view.isArcGISDataset(); } },
                            sectionOnlyIf(options)],
                fields: [
                    {text: 'Location', type: 'radioGroup', name: 'locationSection',
                        defaultValue: 'displayFormat.plot.locationId',
                        options: [
                            {name: 'displayFormat.plot.locationId',
                                type: 'columnSelect', isTableColumn: true,
                                columns: {type: 'location', hidden: options.isEdit}
                            },
                            {value: 'No Locations', type: 'static',
                                name: 'displayFormat.noLocations', isInput: true }
                        ]}
                ]
            },

            // General Details
            {
                title: 'Details', type: 'selectable', name: 'detailsSection',
                onlyIf: [{field: 'displayFormat.plotStyle', value: 'point'}, sectionOnlyIf(options)],
                fields: [
                    {text: 'Title', name: 'displayFormat.plot.titleId',
                        type: 'columnSelect', isTableColumn: true,
                        columns: {type: ['text', 'location', 'html', 'url',
                            'drop_down_list', 'dataset_link', 'email',
                            'percent', 'stars', 'flag', 'phone', 'money',
                            'data', 'calendar_date', 'number'], hidden: options.isEdit,
                            defaultNames: ['title']}},
                    {type: 'repeater', name: 'displayFormat.plot.descriptionColumns',
                        field: {text: 'Flyout Details', name: 'tableColumnId',
                               type: 'columnSelect', isTableColumn: true,
                               columns: {hidden: options.isEdit}},
                        minimum: 1, addText: 'Add Flyout Details'},
                    {text: 'w/o Labels?', type: 'checkbox', name: 'displayFormat.flyoutsNoLabel'},
                    {type: 'note', onlyIf: {field: 'displayFormat.type', value: 'esri'},
                        value: 'Colors may be overridden using ' +
                        '<a href="#Conditional Formatting" ' +
                        'class="showConditionalFormatting">Conditional Formatting</a>. ' +
                        'Click <a href="#Clear Conditional Formatting" ' +
                        'class="clearConditionalFormatting">here</a> to clear any ' +
                        'current conditional formatting rules.' },
                    {text: 'Base Color', name: 'displayFormat.color', type: 'color',
                        defaultValue: "#0000ff"},
                    {text: 'Point Size', name: 'displayFormat.plot.sizeValueId',
                        type: 'columnSelect', isTableColumn: true,
                        columns: {type: ['number', 'money', 'percent'], hidden: options.isEdit}},
                    {text: 'Point Color', name: 'displayFormat.plot.colorValueId',
                        type: 'columnSelect', isTableColumn: true,
                        columns: {type: ['number', 'money', 'percent'], hidden: options.isEdit}},
                    {text: 'Icon', name: 'displayFormat.plot.iconId',
                        type: 'columnSelect', isTableColumn: true,
                        columns: {type: ['photo', 'photo_obsolete', 'url'],
                            noDefault: true, hidden: options.isEdit}}
                ]
            },
            { // Rastermap Details section.
                title: 'Details', name: 'rmDetailsSection',
                onlyIf: [{field: 'displayFormat.plotStyle', value: 'rastermap'}, sectionOnlyIf(options)],
                fields: [
                    {text: 'Quantity', name: 'displayFormat.plot.quantityId',
                        onlyIf: {field: 'displayFormat.plotStyle', value: 'rastermap'},
                        type: 'columnSelect', isTableColumn: true,
                        columns: {type: ['number', 'money', 'percent'], hidden: options.isEdit}
                    }
                ]
            },
            { // Heatmap Details section.
                title: 'Details', name: 'hmDetailsSection',
                onlyIf: [{field: 'displayFormat.plotStyle', value: 'heatmap'}, sectionOnlyIf(options)],
                fields: [
                    {type: 'repeater', name: 'displayFormat.plot.descriptionColumns',
                        field: {text: 'Flyout Details', name: 'tableColumnId',
                               type: 'columnSelect', isTableColumn: true,
                               columns: {hidden: options.isEdit}},
                        minimum: 1, addText: 'Add Flyout Details'},
                    {text: 'Quantity', name: 'displayFormat.plot.quantityId',
                        type: 'columnSelect', isTableColumn: true,
                        columns: {type: ['number', 'money', 'percent'], hidden: options.isEdit}},
                    {text: 'Region', name: 'displayFormat.heatmap.type', type: 'select',
                        required: !customHeatmap(options), prompt: 'Select a region level',
                        options: regionTypes},
                    {text: '', name: 'displayFormat.heatmap.region', type: 'select',
                        required: true, prompt: 'Select a region',
                        linkedField: 'displayFormat.heatmap.type',
                        options: heatmapRegionOptions},
                    {type: 'color', text: 'Color (Low)', defaultValue: ['#c9c9c9'],
                        name: 'displayFormat.heatmap.colors.low'},
                    {type: 'color', defaultValue: ['#00ff00'], text: 'Color (High)',
                        name: 'displayFormat.heatmap.colors.high'}
                ]
            },
            configLayers(options),
            configLayersHeatmap(options)
        ];
    };
})(jQuery);
