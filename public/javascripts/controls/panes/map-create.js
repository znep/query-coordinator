(function($)
{
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
            {text: 'Boundary Map', value: 'heatmap'}
        ];
        if (mapType == 'esri')
        { plotStyles.push({text: 'Heat Map', value: 'rastermap'}); }
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

    var customHeatmap = function(cpObj)
    {
        return cpObj.settings.view.displayFormat.heatmap &&
               cpObj.settings.view.displayFormat.heatmap.type == 'custom';
    };

    var sectionOnlyIf = {func: function()
        {
            return this.settings.view.columnsForType('location', isEdit(this)).length > 0
                || this.settings.view.isArcGISDataset();
        }};

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

    var configLayers = {
            title: 'Layers',
            onlyIf: [{field: 'displayFormat.type', value: 'esri'},
                     {field: 'displayFormat.plotStyle', value: 'heatmap', negate: true}, sectionOnlyIf],
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
    var configLayersHeatmap = $.extend(true, {}, configLayers);
    configLayersHeatmap.onlyIf = [
        { field: 'displayFormat.plotStyle', value: 'heatmap' },
        { field: 'displayFormat.type', value: 'esri' }, sectionOnlyIf];
    configLayersHeatmap.type = 'selectable';
    configLayersHeatmap.name = 'heatmapLayers';
    configLayersHeatmap.fields[1].minimum = 0;
    configLayersHeatmap.fields.push({ text: 'Force Display', type: 'checkbox',
        name: 'displayFormat.forceBasemap' });

    // Change disabled message based on whether or not the add column dialog is
    // available
    var disabledMessage = function()
    {
        var cpObj = this;
        var msg = 'A location column is required to create a map.';
        var hasHiddenLoc = _.any(cpObj.settings.view.realColumns, function(c)
            { return c.dataTypeName == 'location' && c.hidden; });
        if (!hasHiddenLoc &&
            ($.isBlank(blist.sidebarHidden.edit) || !blist.sidebarHidden.edit.addColumn))
        {
            var opts = [];
            if (cpObj.settings.view.columnsForType('number').length > 1)
            {
                opts.push('you can <a href="#convertLatLong" ' +
                    'title="Convert latitude and longitude to a location">' +
                    'convert latitude and longitude data to a location column</a>');
            }
            if (cpObj.settings.view.columnsForType('text').length > 0)
            {
                opts.push('you can <a href="#convertLoc" title="Convert to a location">' +
                    'convert addresses into a location column</a>');
            }
            opts.push('you can <a href="#createLoc" title="Create a location column">' +
                'create a new location column</a> and add data.');
            msg += ' ' + $.arrayToSentence(opts, 'or', ',', true).capitalize();
        }
        else if (hasHiddenLoc && ($.isBlank(blist.sidebarHidden.manage) ||
            !blist.sidebarHidden.manage.showHide))
        {
            msg += ' You can <a href="#showLoc" title="Show a location column">' +
                'show a hidden location column</a>';
            if ($.isBlank(blist.sidebarHidden.edit) || !blist.sidebarHidden.edit.addColumn)
            {
                msg += ', or <a href="#createLoc" title="Create a location column">' +
                    'create a new location column</a>';
            }
            msg += '.';
        }
        return msg;
    };

    $.Control.extend('pane_mapCreate', {
        _init: function()
        {
            var cpObj = this;
            cpObj._super.apply(cpObj, arguments);
            cpObj.settings.view.bind('clear_temporary', function() { cpObj.reset(); });

            cpObj.$dom().delegate('.showConditionalFormatting', 'click', function(e)
            {
                e.preventDefault();
                if ($.subKeyDefined(blist, 'datasetPage.sidebar'))
                { blist.datasetPage.sidebar.show('visualize.conditionalFormatting'); }
            });

            cpObj.$dom().delegate('.clearConditionalFormatting', 'click', function(e)
            {
                e.preventDefault();
                var metadata = $.extend(true, {}, cpObj.settings.view.metadata);
                delete metadata.conditionalFormatting;
                cpObj.settings.view.update({ metadata: metadata });
            });

            // Hook up clicks on the disabled message
            cpObj.$dom().delegate('.sectionDisabledMessage a', 'click', function(e)
            {
                e.preventDefault();
                if (!$.subKeyDefined(blist, 'datasetPage.sidebar')) { return; }

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
                cpObj.settings.view.once('columns_changed', function()
                {
                    // If they hit Cancel from 'Create column' then this
                    // function might trigger some time later.  Make sure that
                    // it is valid before we re-show it, at least
                    if (sectionOnlyIf.func.call(cpObj))
                    { _.defer(function() { cpObj.show(); }); }
                });

                if (doShow)
                { blist.datasetPage.sidebar.show('manage.showHide'); }
                else
                { blist.datasetPage.sidebar.show('edit.addColumn', col); }
            });

        },

        getTitle: function()
        { return 'Map'; },

        getSubtitle: function()
        { return 'Views with locations can be displayed as points on a map'; },

        _getCurrentData: function()
        { return this._super() || this.settings.view; },

        isAvailable: function()
        {
            return (this.settings.view.valid || isEdit(this)) &&
                (_.include(this.settings.view.metadata.availableDisplayTypes, 'map') ||
                !this.settings.view.isAltView());
        },

        getDisabledSubtitle: function()
        {
            return !this.settings.view.valid && !isEdit(this) ?
                'This view must be valid' :
                'A view may only have one visualization on it';
        },

        _getSections: function()
        {
            return [
                {
                    title: 'Map Setup',
                    onlyIf: $.extend({disable: true, disabledMessage: disabledMessage}, sectionOnlyIf),
                    fields: [
                        !this.settings.view.isArcGISDataset() ?
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
                    onlyIf: [{field: 'displayFormat.type', value: 'esri', negate: true}, sectionOnlyIf],
                    fields: [
                        {text: 'Location', name: 'displayFormat.plot.locationId',
                            required: true, type: 'columnSelect', isTableColumn: true,
                            columns: {type: 'location', hidden: isEdit(this)}}
                    ]
                },

                // ESRI location
                {
                    title: 'Location',
                    onlyIf: [{field: 'displayFormat.type', value: 'esri'},
                             { func: function() { return !this.settings.view.isArcGISDataset(); } },
                                sectionOnlyIf],
                    fields: [
                        {text: 'Location', type: 'radioGroup', name: 'locationSection',
                            defaultValue: 'displayFormat.plot.locationId',
                            options: [
                                {name: 'displayFormat.plot.locationId',
                                    type: 'columnSelect', isTableColumn: true,
                                    columns: {type: 'location', hidden: isEdit(this)}
                                },
                                {value: 'No Locations', type: 'static',
                                    name: 'displayFormat.noLocations', isInput: true }
                            ]}
                    ]
                },

                // General Details
                {
                    title: 'Details', type: 'selectable', name: 'detailsSection',
                    onlyIf: [{field: 'displayFormat.plotStyle', value: 'point'}, sectionOnlyIf],
                    fields: [
                        {text: 'Title', name: 'displayFormat.plot.titleId',
                            type: 'columnSelect', isTableColumn: true,
                            columns: {type: ['text', 'location', 'html', 'url',
                                'drop_down_list', 'dataset_link', 'email',
                                'percent', 'stars', 'flag', 'phone', 'money',
                                'data', 'calendar_date', 'number'], hidden: isEdit(this),
                                defaultNames: ['title']}},
                        {type: 'repeater', name: 'displayFormat.plot.descriptionColumns',
                            field: {text: 'Flyout Details', name: 'tableColumnId',
                                   type: 'columnSelect', isTableColumn: true,
                                   columns: {hidden: isEdit(this)}},
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
                            onlyIf: {field: 'displayFormat.type', value: 'esri'},
                            defaultValue: "#0000ff"},
                        {text: 'Point Size', name: 'displayFormat.plot.sizeValueId',
                            onlyIf: {field: 'displayFormat.type', value: 'esri'},
                            type: 'columnSelect', isTableColumn: true,
                            columns: {type: ['number', 'money', 'percent'], hidden: isEdit(this)}},
                        {text: 'Point Color', name: 'displayFormat.plot.colorValueId',
                            onlyIf: {field: 'displayFormat.type', value: 'esri'},
                            type: 'columnSelect', isTableColumn: true,
                            columns: {type: ['number', 'money', 'percent'], hidden: isEdit(this)}},
                        {text: 'Icon', name: 'displayFormat.plot.iconId',
                            type: 'columnSelect', isTableColumn: true,
                            columns: {type: ['photo', 'photo_obsolete', 'url'],
                                noDefault: true, hidden: isEdit(this)}}
                    ]
                },
                { // Rastermap Details section.
                    title: 'Details', name: 'rmDetailsSection',
                    onlyIf: [{field: 'displayFormat.plotStyle', value: 'rastermap'}, sectionOnlyIf],
                    fields: [
                        {text: 'Quantity', name: 'displayFormat.plot.quantityId',
                            onlyIf: {field: 'displayFormat.plotStyle', value: 'rastermap'},
                            type: 'columnSelect', isTableColumn: true,
                            columns: {type: ['number', 'money', 'percent'], hidden: isEdit(this)}
                        }
                    ]
                },
                { // Heatmap Details section.
                    title: 'Details', name: 'hmDetailsSection',
                    onlyIf: [{field: 'displayFormat.plotStyle', value: 'heatmap'}, sectionOnlyIf],
                    fields: [
                        {type: 'repeater', name: 'displayFormat.plot.descriptionColumns',
                            field: {text: 'Flyout Details', name: 'tableColumnId',
                                   type: 'columnSelect', isTableColumn: true,
                                   columns: {hidden: isEdit(this)}},
                            minimum: 1, addText: 'Add Flyout Details'},
                        {text: 'Quantity', name: 'displayFormat.plot.quantityId',
                            type: 'columnSelect', isTableColumn: true,
                            columns: {type: ['number', 'money', 'percent'], hidden: isEdit(this)}},
                        {text: 'Region', name: 'displayFormat.heatmap.type', type: 'select',
                            required: !customHeatmap(this), prompt: 'Select a region level',
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
                configLayers,
                configLayersHeatmap
            ];
        },

        _getFinishButtons: function()
        { return [$.controlPane.buttons.apply, $.controlPane.buttons.cancel]; },

        _finish: function(data, value)
        {
            var cpObj = this;
            if (!cpObj._super.apply(cpObj, arguments)) { return; }

            var view = $.extend(true, {metadata: {renderTypeConfig: {visible: {map: true}}}},
                cpObj._getFormValues(), {metadata: cpObj.settings.view.metadata});

            if (customHeatmap(cpObj))
            {
                view.displayFormat.heatmap.type = 'custom';
                view.displayFormat.heatmap.cache_url = cpObj.settings.view.displayFormat.heatmap.cache_url;
            }

            if (view.displayFormat.type == cpObj.settings.view.displayFormat.type)
            { view.displayFormat.viewport = cpObj.settings.view.displayFormat.viewport; }
            else if (cpObj.settings.view.displayFormat.type == 'bing')
            {
                blist.datasetControls.showSaveViewDialog(isEdit(cpObj) ?
                    'reloadUpdateDialog' : 'reloadSaveDialog', null, null,
                    function()
                    {
                        cpObj._finishProcessing();
                        cpObj.reset();
                    }, view);
                return;
            }

            cpObj.settings.view.update(view);

            if (isEdit(cpObj))
            {
                // We need to show all columns when editing a view so that
                // any filters/facets work properly
                var colIds = _.pluck(cpObj.settings.view.realColumns, 'id');
                if (colIds.length > 0)
                { cpObj.settings.view.setVisibleColumns(colIds, null, true); }
            }

            cpObj._finishProcessing();
            cpObj.reset();
        }
    }, {name: 'mapCreate'}, 'controlPane');

    var isEdit = function(cpObj)
    { return _.include(cpObj.settings.view.metadata.availableDisplayTypes, 'map'); };

    if ($.isBlank(blist.sidebarHidden.visualize) || !blist.sidebarHidden.visualize.mapCreate)
    { $.gridSidebar.registerConfig('visualize.mapCreate', 'pane_mapCreate', 2, 'map'); }

})(jQuery);
