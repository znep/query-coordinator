;(function($) {
    var mapConfigNS = blist.namespace.fetch('blist.configs.map');

    var mapTypes = _.map(_.pluck(Dataset.map.backgroundLayers, 'name'),
            function(x) { return { text: x, value: x }; });
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

    // proxy/verify_layer_url is unavailable when not logged in.
    if (blist.currentUser)
    { mapTypes = mapTypes.concat({text: 'Custom Layer', value: 'custom', data: {type: null}}); }

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
            var msg = 'A location column is required to create a map.';
            var hasHiddenLoc = !$.isBlank(cpObj._view) && _.any(cpObj._view.realColumns, function(c)
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

    var datasetCreate = function($field, vals, curValue)
    {
        var cpObj = this;

        if (!blist.common.selectedDataset)
        {
            blist.common.selectedDataset = function(ds)
            {
                cpObj._expectingCancel = false;
                $('#selectDataset').jqmHide();
                cpObj._$selectedField.data('uid', ds.id);
                cpObj._$selectedField.makeStatic(ds.name, !validDataset(ds));
                modifySection.call(cpObj, ds, cpObj._$selectedField);
            };
        }

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
                function(col) { return col.renderTypeName == 'location'; });
        };

        $field.makeStatic = function(value, invalid, uneditable)
        {
            $field.empty();
            $field.data('dsName', value);
            $field.append('<span>' + $.htmlEscape(value) + (uneditable ? '' :
                        ' (<span class="edit">edit</span>)') + '</span>');
            $field.find('span.edit').click(openSelectDataset)
                .css({ cursor: 'pointer', color: '#0000ff' });
            if (invalid)
            { $field.append('<span class="error">This dataset has no location column.</span>')
                .find('span.error').css({ marginLeft: 0, paddingLeft: 0 }); }
        };

        if (!$.isBlank(curValue))
        {
            $field.data('uid', curValue);
            var handle = function(dataset)
            {
                $field.makeStatic(dataset.name, !validDataset(dataset), cpObj._view.id == dataset.id);
                modifySection.call(cpObj, dataset, $field);
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
                title: 'Dataset Summary',
                fields: [
                    { type: 'repeater', name: 'displayFormat.viewDefinitions', addText: 'Add Data',
                        field: {type: 'group', options: [
                            { text: 'Dataset', type: 'custom', name: 'uid', required: true,
                              defaultValue: options.view.id, repeaterValue: '',
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
                title: 'Base Maps',
                fields: [
                    { type: 'note', value: 'Select from a list of map services ' +
                        'and configure how it will appear.' },
                    { type: 'repeater', name: 'displayFormat.bkgdLayers', addText: 'Add Base Map',
                        minimum: 0, field: {type: 'group', options: [
                        {text: 'Layer', type: 'select', name: 'layerName',
                            required: true, prompt: 'Select a layer',
                            options: mapTypes, defaultValue: 'World Street Map (ESRI)'
                        },
                        {text: 'Layer URL', type: 'text', name: 'custom_url',
                            onlyIf: {field: 'layerName', value: 'custom'}, defaultValue: 'https://',
                            required: true, data: { 'validlayerurl': 'unverified' },
                            change: normalizeLayerUrl },
                        {text: 'Alias', type: 'text', name: 'alias'},
                        {text: 'Opacity', type: 'slider', name: 'opacity',
                            defaultValue: 1, minimum: 0, maximum: 1}
                    ]}
                    }
                ]
            },
            {
                title: 'Advanced Configuration',
                fields: [
                    { type: 'note', value: 'Select \'Exclusive\' if only one base map should ' +
                        'display at a time.' },
                    { text: 'Exclusive', name: 'displayFormat.exclusiveLayers', type: 'checkbox' },
                    { text: 'Use Legend', type: 'checkbox', name: 'displayFormat.distinctLegend' }
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
            {text: 'Plot Style', type: 'select', name: prefix+'plotStyle',
                options: plotStyles, required: true, prompt: 'Select a plot style' },
            {text: 'Location', name: prefix+'plot.locationId',
                type: 'columnSelect', isTableColumn: true, required: true,
                columns: {type: ['location'], hidden: options.isEdit }},
            {text: 'Region', name: prefix+'heatmap.type', type: 'select', onlyIf: boundaryOnly,
                required: !customHeatmap(options), prompt: 'Select a region level',
                options: regionTypes},
            {text: '', name: prefix+'heatmap.region', type: 'select', onlyIf: boundaryOnly,
                required: true, prompt: 'Select a region', linkedField: prefix+'heatmap.type',
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
            {text: 'Base Color', name: prefix+'color', type: 'color', onlyIf: pointOnly,
                defaultValue: "#0000ff"},

            {type: 'note', value: 'Point Customization', onlyIf: pointOnly},
            {text: 'Point Size', name: prefix+'plot.sizeValueId', onlyIf: pointOnly,
                type: 'columnSelect', isTableColumn: true,
                columns: {type: ['number', 'money', 'percent'], noDefault: true, hidden: options.isEdit}},
            {text: 'Point Color', name: prefix+'plot.colorValueId', onlyIf: pointOnly,
                type: 'columnSelect', isTableColumn: true,
                columns: {type: ['number', 'money', 'percent'], noDefault: true, hidden: options.isEdit}},
            {text: 'Icon', name: prefix+'plot.iconId', onlyIf: pointOnly,
                type: 'columnSelect', isTableColumn: true,
                columns: {type: ['photo', 'photo_obsolete', 'url'],
                    noDefault: true, hidden: options.isEdit}},

            {type: 'color', text: 'Color (Low)', defaultValue: ['#c9c9c9'], onlyIf: boundaryOnly,
                name: prefix+'heatmap.colors.low'},
            {type: 'color', defaultValue: ['#00ff00'], text: 'Color (High)', onlyIf: boundaryOnly,
                name: prefix+'heatmap.colors.high'},

            {text: 'Quantity', name: prefix+'plot.quantityId', onlyIf: quantity,
                type: 'columnSelect', isTableColumn: true,
                columns: {type: ['number', 'money', 'percent'], noDefault: true, hidden: options.isEdit}},

            {type: 'note', value: 'Flyout Configuration', onlyIf: flyouts},
            {text: 'Title', name: prefix+'plot.titleId', onlyIf: flyouts,
                type: 'columnSelect', isTableColumn: true,
                columns: {type: ['text', 'location', 'html', 'url',
                    'drop_down_list', 'dataset_link', 'email',
                    'percent', 'stars', 'flag', 'phone', 'money',
                    'data', 'calendar_date', 'number'], hidden: options.isEdit,
                    defaultNames: ['title']}},
            {type: 'repeater', name: prefix+'plot.descriptionColumns', onlyIf: flyouts,
                field: {text: 'Flyout Details', name: 'tableColumnId',
                       type: 'columnSelect', isTableColumn: true,
                       columns: {hidden: options.isEdit}},
                minimum: 1, addText: 'Add Flyout Details'},
            {text: 'w/o Labels?', type: 'checkbox', name: prefix+'flyoutsNoLabel', onlyIf: flyouts}
        ];
    };
    mapConfigNS.dataLayer.mondara = function(options)
    { return [
        { type: 'note', value: 'Mondara layers are currently not customizable.' },
        { type: 'note', value: 'Warning: Mondara layers cannot be stacked on top of Socrata layers.',
             onlyIf: { func: function() { return options.willRestack; } } }
        ];
    };
    mapConfigNS.dataLayer.esri = function(options)
    {
        var prefix = options.prefix;
        return [
            {text: 'Title', name: prefix+'plot.titleId',
                type: 'columnSelect', isTableColumn: true,
                columns: {type: ['text', 'location', 'html', 'url',
                    'drop_down_list', 'dataset_link', 'email',
                    'percent', 'stars', 'flag', 'phone', 'money',
                    'data', 'calendar_date', 'number'], hidden: options.isEdit,
                    defaultNames: ['title']}},
            {type: 'repeater', name: prefix+'plot.descriptionColumns',
                field: {text: 'Flyout Details', name: 'tableColumnId',
                       type: 'columnSelect', isTableColumn: true,
                       columns: {hidden: options.isEdit}},
                minimum: 1, addText: 'Add Flyout Details'},
            {text: 'w/o Labels?', type: 'checkbox', name: prefix+'flyoutsNoLabel'}
        ];
    };

})(jQuery);
