;(function($) {
    var chartConfigNS = blist.namespace.fetch('blist.configs.chart');

    /*** Common configuration options ***/

    var isNextGen = blist.feature_flags.charts === 'nextgen' || $.deepGet(blist, 'dataset', 'displayFormat', 'nextgen') === true;
    var nextGenReady = ['stackedbar', 'stackedcolumn', 'bar', 'column', 'pie', 'donut', 'line', 'area'];

    var defaultColors;
    if (isNextGen){
        defaultColors = blist.defaultColors;
    }
    else{
        defaultColors = ['#042656', '#19538b', '#6a9feb', '#bed6f7', '#495969', '#bbc3c9'];
    }

    var axisTitles = [
        {text: $.t('screens.ds.grid_sidebar.chart.axes.x_axis_title'), name: 'displayFormat.titleX',
            type: 'text', prompt: $.t('screens.ds.grid_sidebar.chart.axes.x_axis_title_prompt')},
        {text: $.t('screens.ds.grid_sidebar.chart.axes.y_axis_title'), name: 'displayFormat.titleY',
            type: 'text', prompt: $.t('screens.ds.grid_sidebar.chart.axes.y_axis_title_prompt')}
    ];

    var legendPos = {text: $.t('screens.ds.grid_sidebar.chart.legend.position'), type: 'select', prompt: $.t('screens.ds.grid_sidebar.chart.legend.position_prompt'),
        defaultValue: 'bottom', name: 'displayFormat.legend',
        options: [
            {text: $.t('screens.ds.grid_sidebar.chart.legend.positions.bottom'), value: 'bottom'},
            {text: $.t('screens.ds.grid_sidebar.chart.legend.positions.top'), value: 'top'},
            {text: $.t('screens.ds.grid_sidebar.chart.legend.positions.right'), value: 'right'},
            {text: $.t('screens.ds.grid_sidebar.chart.legend.positions.left'), value: 'left'},
            {text: $.t('screens.ds.grid_sidebar.chart.legend.positions.none'), value: 'none'}
        ]
    };

    if (isNextGen)
    {
        var origLegendPos = legendPos;
        legendPos = { onlyIf: false };
    }

    var renderOther = {text: $.t('screens.ds.grid_sidebar.chart.group_extra'), type: 'checkbox', defaultValue: false,
            name: 'displayFormat.renderOther'};

    // this should really be a SODA feature anyway, not a display feature
    if (isNextGen)
    {
        renderOther = { onlyIf: false };
    }

    var colorOption = {type: 'color', name: 'color', defaultValue: defaultColors,
        lineClass: 'colorCollapse'};

    var showLines = {text: $.t('screens.ds.grid_sidebar.chart.show_lines'), name: 'displayFormat.lineSize',
        type: 'checkbox', trueValue: '2', falseValue: '0', defaultValue: '2'};

    var showPoints = {text: $.t('screens.ds.grid_sidebar.chart.show_points'), name: 'displayFormat.pointSize',
        type: 'checkbox', trueValue: '3', falseValue: '0', defaultValue: '3'};

    var pieJoinAngle = {text: $.t('screens.ds.grid_sidebar.chart.min_angle'), name: 'displayFormat.pieJoinAngle',
        type: 'slider', minimum: 0, maximum: 10, defaultValue: 1};


    var advLegend = function() { return { onlyIf: { func: function() { return false; } } } };

    if (isNextGen)
    {
        advLegend = function(chart, options)
        {
            var needsSeries = _.contains(['line', 'area', 'stackedbar', 'stackedcolumn', 'bar', 'column'], chart.value);
            var needsValueMarkers = _.contains(['line', 'area', 'stackedbar', 'stackedcolumn', 'bar', 'column'], chart.value);
            var needsValues = _.contains(['pie', 'donut'], chart.value);
            var needsConditional = true;
            var needsCustom = true;

            var fields = [$.extend({}, origLegendPos, { text: $.t('screens.ds.grid_sidebar.chart.legend.display') })];

            if (needsValues)
            {
                fields.push(
                    { text: $.t('screens.ds.grid_sidebar.chart.legend.values'), type: 'checkbox', inputFirst: true,
                      name: 'displayFormat.legendDetails.showValues', defaultValue: true,
                      lineClass: 'advLegendCheck' });
            }

            if (needsSeries)
            {
                fields.push(
                    { text: $.t('screens.ds.grid_sidebar.chart.legend.series'), type: 'checkbox', inputFirst: true,
                      name: 'displayFormat.legendDetails.showSeries', defaultValue: true,
                      lineClass: 'advLegendCheck' });
            }

            if (needsConditional)
            {
                fields.push(
                    { text: $.t('screens.ds.grid_sidebar.chart.legend.conditional_formats'), type: 'checkbox', inputFirst: true,
                      name: 'displayFormat.legendDetails.showConditional', defaultValue: true,
                      lineClass: 'advLegendCheck' });
            }

            if (needsValueMarkers)
            {
                fields.push(
                    { text: $.t('screens.ds.grid_sidebar.chart.legend.value_markers'), type: 'checkbox', inputFirst: true,
                      name: 'displayFormat.legendDetails.showValueMarkers', defaultValue: true,
                      lineClass: 'advLegendCheck' });
            }

            if (needsCustom)
            {
                fields.push(
                    /*{ text: 'Custom Entries', type: 'selectable',
                      name: 'customLegendEntries', defaultValue: false, fields: [*/
                        { type: 'repeater', minimum: 0, initialRepeatCount: 0, addText: $.t('screens.ds.grid_sidebar.chart.legend.new_custom_entry_button'),
                          name: 'displayFormat.legendDetails.customEntries',
                          field: {
                              type: 'group', options: [
                                  colorOption,
                                  { text: $.t('screens.ds.grid_sidebar.chart.legend.custom_entry'), type: 'text',
                                    name: 'label', required: true }
                              ]
                        } }
                    //] }
                    );
            }

            return  {
                title: $.t('screens.ds.grid_sidebar.chart.legend.title'),
                type: 'selectable',
                name: 'advLegend',
                onlyIf: onlyIfForChart(chart, options, false),
                fields: fields
            };
        };
    }


    var pointSize = function(options)
    {
        return {text: $.t('screens.ds.grid_sidebar.chart.point_size'), name: 'displayFormat.pointSize',
            type: 'columnSelect', useFieldName: true,
            columns: {type: ['number', 'money', 'percent'], hidden: options.isEdit}};
    };

    var pointColor = function(options)
    {
        return {text: $.t('screens.ds.grid_sidebar.chart.point_color'), name: 'displayFormat.pointColor',
            type: 'columnSelect', useFieldName: true,
            columns: {type: ['number', 'money', 'percent'], hidden: options.isEdit}};
    };

    var baseColor = {text: $.t('screens.ds.grid_sidebar.chart.base_color'), name: 'displayFormat.color', type: 'color',
        defaultValue: "#042656"};

    var showLine = {text: $.t('screens.ds.grid_sidebar.chart.draw_line'), name: 'displayFormat.showLine', type: 'checkbox' };

    var dataLabels = {text: $.t('screens.ds.grid_sidebar.chart.data_labels'), name: 'displayFormat.dataLabels', type: 'checkbox' };

    var conditionalFormattingWarning = {type: 'note',
        value: $.t('screens.ds.grid_sidebar.chart.color_override_html') };
    var treemapRandomColorWarning = {type: 'note',
        value: $.t('screens.ds.grid_sidebar.chart.treemap_color_html') };

    var flyoutControls = function(options)
    {
        return {type: 'repeater', name: 'displayFormat.descriptionColumns',
            onlyIf: {field: 'displayFormat.pointSize', value: '0', negate: true},
            field: {text: $.t('screens.ds.grid_sidebar.chart.flyout.title'), name: 'fieldName', otherNames: 'tableColumnId',
                   type: 'columnSelect', useFieldName: true, columns: {hidden: options.isEdit}},
            minimum: 1, addText: $.t('screens.ds.grid_sidebar.chart.flyout.new_details_button')
        };
    };

    var yAxisFormatting = function(chart, options)
    {
        return {
            title: $.t('screens.ds.grid_sidebar.chart.y_axis_formatting.title'), onlyIf: onlyIfForChart(chart, options, false),
            type: 'selectable', name: 'yAxisFormatting',
            fields: [
                {text: $.t('screens.ds.grid_sidebar.chart.y_axis_formatting.axis_min'), type: 'radioGroup', defaultValue: 'yAxisMinAuto', name: 'yAxisMin',
                    options: [ { type: 'static', name: 'yAxisMinAuto', value: $.t('screens.ds.grid_sidebar.chart.y_axis_formatting.auto') },
                               { type: 'text', name: 'displayFormat.yAxis.min', prompt: $.t('screens.ds.grid_sidebar.chart.y_axis_formatting.axis_prompt'),
                                    extraClass: 'number' }] },
                {text: $.t('screens.ds.grid_sidebar.chart.y_axis_formatting.axis_max'), type: 'radioGroup', defaultValue: 'yAxisMaxAuto', name: 'yAxisMax',
                    options: [ { type: 'static', name: 'yAxisMaxAuto', value: $.t('screens.ds.grid_sidebar.chart.y_axis_formatting.auto') },
                               { type: 'text', name: 'displayFormat.yAxis.max', prompt: $.t('screens.ds.grid_sidebar.chart.y_axis_formatting.axis_prompt'),
                                    extraClass: 'number' }] },
                isNextGen ?
                    { text: $.t('screens.ds.grid_sidebar.chart.y_axis_formatting.precision'), type: 'radioGroup', name: 'yAxisDecimalPlaces',
                        defaultValue: 'yAxisDecimalPlacesAuto',
                        options: [ { type: 'static', value: 'Auto', name: 'yAxisDecimalPlacesAuto' },
                                   { type: 'slider', minimum: 0, maximum: 10, defaultValue: 2,
                                     name: 'displayFormat.yAxis.formatter.decimalPlaces' } ] } :
                    { text: $.t('screens.ds.grid_sidebar.chart.y_axis_formatting.precision'), type: 'slider', minimum: 0, maximum: 10, defaultValue: 2,
                         name: 'displayFormat.yAxis.formatter.decimalPlaces' },
                {text: $.t('screens.ds.grid_sidebar.chart.y_axis_formatting.abbreviate'), type: 'checkbox', defaultValue: true,
                    name: 'displayFormat.yAxis.formatter.abbreviate'},
                {text: $.t('screens.ds.grid_sidebar.chart.y_axis_formatting.no_decimals'), type: 'checkbox', defaultValue: false,
                    name: 'displayFormat.yAxis.noDecimals'}
            ]
        };
    };

    var _marker = function(which, chart, options)
    {
        return {
            title: $.t('screens.ds.grid_sidebar.chart.marker.marker_title', { axis: $.capitalize(which) }), onlyIf: onlyIfForChart(chart, options, false),
            type: 'selectable', name: which + 'Marker',
            fields: [
                {type: 'repeater', name: 'displayFormat.' + which + 'Marker', addText: $.t('screens.ds.grid_sidebar.chart.marker.new_marker_button'), minimum: 0,
                    field: {type: 'group', options: [
                        {type: 'group', options: [
                            {type: 'color', name: 'color',
                                lineClass: 'colorCollapse', defaultValue: '#000000'},
                            {text: $.t('screens.ds.grid_sidebar.chart.marker.value'), type: 'text', name: 'atValue'}]},
                        {text: $.t('screens.ds.grid_sidebar.chart.marker.caption'), type: 'text', name: 'caption'}
                    ]}
                }
            ]
        };
    };

    var valueMarker =  _marker.curry('value');
    var domainMarker = function() { return { onlyIf: { func: function() { return false; } } }; };
    // var domainMarker = _marker.curry('domain');

    var showPercentages = { type: 'checkbox', name: 'displayFormat.showPercentages', text: $.t('screens.ds.grid_sidebar.chart.show_percent'), 
                            inputFirst: true, lineClass: 'indentedFormSection' };
    var showActualValues = { type: 'checkbox', name: 'displayFormat.showActualValues', text: $.t('screens.ds.grid_sidebar.chart.show_values'),
                            inputFirst: true, lineClass: 'indentedFormSection' };

    var errorBars = function(chart, options)
    {
        return { title: $.t('screens.ds.grid_sidebar.chart.error_bars.title'), onlyIf: onlyIfForChart(chart, options, false),
            type: 'selectable', name: 'errorBars',
            fields: [
                {text: $.t('screens.ds.grid_sidebar.chart.error_bars.low'), name: 'displayFormat.plot.errorBarLow', required: true,
                    type: 'columnSelect', useFieldName: true, notequalto: 'errorBar',
                    columns: {type: Dataset.chart.numericTypes, hidden: options.isEdit}
                },
                {text: $.t('screens.ds.grid_sidebar.chart.error_bars.high'), name: 'displayFormat.plot.errorBarHigh', required: true,
                    type: 'columnSelect', useFieldName: true, notequalto: 'errorBar',
                    columns: {type: Dataset.chart.numericTypes, hidden: options.isEdit}
                },
                {text: $.t('screens.ds.grid_sidebar.chart.error_bars.color'), name: 'displayFormat.errorBarColor',
                    type: 'color', defaultValue: '#ff0000'}]
        };
    };

    var labelInBar = { text: $.t('screens.ds.grid_sidebar.chart.labelInBar'), type: 'checkbox', name: 'displayFormat.xAxis.labelInBar' };

    var valueInBar = { text: $.t('screens.ds.grid_sidebar.chart.valueInBar'), type: 'checkbox', name: 'displayFormat.xAxis.valueInBar' };

    if (!isNextGen)
    {
        labelInBar = { onlyIf: false };
        valueInBar = { onlyIf: false };
    }

    /*** Helpers ***/

    var getDisabledMessage = function(chartConfig)
    {
        return function()
        {
            var chartName = chartConfig.text.toLowerCase();

            var newTypes = [];
            var copy = chartConfig.requiredColumns.slice();
            while (copy.length > 0)
            {
                var t = copy.shift();
                var oldL = copy.length;
                copy = _.without(copy, t);
                newTypes.push({count: (oldL - copy.length) + 1, types: t});
            }

            var transform = function(title)
            {
                if (title === 'Date & Time (with timezone)')
                { return 'date_time_timezone'; }
                return title.replace(/\(.*\)/, '').replace(' & ', '_')
                            .replace(' ', '_').toLowerCase();
            };
            return $.t('screens.ds.grid_sidebar.chart.validation.required_columns', {
                chart_type: chartName.capitalize(),
                column_types: $.arrayToSentence(_.map(newTypes, function(rc) { return $.t('screens.ds.grid_sidebar.chart.validation.count', { count: rc.count }) + ' ' +
                        $.arrayToSentence(_.map(rc.types, function(t)
                        { return $.t('screens.ds.grid_sidebar.base.datatypes.' + transform(blist.datatypes[t].title)); }),
                            $.t('support.array_or.two_words_connector'), ','); }),
                    $.t('support.array.two_words_connector'), ';', true) })
        };
    };

    var getWarningMessage = function(chartConfig)
    {
        return function()
        {
            if (isNextGen && _.include(nextGenReady, chartConfig.value)) { return ''; }
            var chartName = chartConfig.text.toLowerCase();
            // This is the same as _maxRows in base-visualization.js
            var rowLimit = (chartConfig.displayLimit || {}).points || 500;
            if (chartConfig.renderOther)
            { return $.t('screens.ds.grid_sidebar.chart.pie_other', { chart_type: chartName.capitalize(), row_limit: rowLimit }) }
            else
            { return $.t('screens.ds.grid_sidebar.chart.pie_truncate', { chart_type: chartName.capitalize(), row_limit: rowLimit }); }
        };
    };

    var chartTypeAvailable = function(chartConfig, options)
    {
        return $.isBlank(options.view) ? false : Dataset.chart.hasRequiredColumns(options.view.realColumns,
            chartConfig.requiredColumns, options.isEdit);
    };

    // FIXME: It doesn't seem to matter if this returns true or false.
    var datasetTooLarge = function(chartConfig, options)
    {
        // Limit number of rows
        if ($.isBlank(options.view)) { return false; }
        var tr = options.view.totalRows();
        if (!$.isBlank(tr) && tr > ((chartConfig.displayLimit || {}).points || 500))
        { return false; }
        return true;
    };

    var onlyIfForChart = function(chart, options, disable)
    {
        if (!options.useOnlyIf) { return null; }

        return [{field: 'displayFormat.chartType', value: chart.value},
               {disable: disable, func: function() { return chartTypeAvailable(chart, options); },
                disabledMessage: getDisabledMessage(chart)},
               {warn: disable, func: function() { return datasetTooLarge(chart, options); },
                warningMessage: getWarningMessage(chart)}];
    };

    var basicConfig = function(chart, options, colTypes, axisName)
    {
        return {
            title: $.t('screens.ds.grid_sidebar.chart.configuration'), name: chart.value + 'Basic',
            onlyIf: onlyIfForChart(chart, options, true),
            fields: [
                {text: axisName, name: 'displayFormat.fixedColumns.0',
                    type: 'columnSelect', required: true, useFieldName: true, notequalto: 'valueCol',
                    columns: {type: colTypes, hidden: options.isEdit}
                }
            ].concat(axisTitles)
        };
    };

    var basicData = function(chart, options, colTypes, axisName)
    {
        return {
            title: $.t('screens.ds.grid_sidebar.chart.data_columns.title'), name: chart.value + 'Data',
            onlyIf: onlyIfForChart(chart, options, false),
            fields: [
                conditionalFormattingWarning,
                {type: 'repeater', minimum: 1, addText: $.t('screens.ds.grid_sidebar.chart.data_columns.new_data_column_button'),
                    name: 'displayFormat.valueColumns',
                    field: {type: 'group', options: [
                        colorOption,
                        {text: axisName, required: true, type: 'columnSelect',
                            notequalto: 'valueCol', useFieldName: true,
                            name: 'fieldName', otherNames: 'tableColumnId',
                            columns: {type: colTypes, hidden: options.isEdit}}
                    ]}
                }
            ]
        };
    };

    var seriesData = function(chart, options, colTypes)
    {
        // Using column.cachedContents as a hack because totalRows is rarely available at this time.
        var tooManyRows = isNextGen && _.any(options.view.realColumns,
            function(col) { return $.deepGet(col, 'cachedContents', 'non_null') > 10000; });

        return {
            title: $.t('screens.ds.grid_sidebar.chart.series_group.title'), type: 'selectable', name: chart.value + 'SeriesData',
            onlyIf: onlyIfForChart(chart, options, false),
            fields: [
                {type: 'note', value: $.t('screens.ds.grid_sidebar.chart.series_group.row_limit_warning'), onlyIf: tooManyRows },
                {type: 'repeater', minimum: 1, addText: $.t('screens.ds.grid_sidebar.chart.series_group.new_column_button'),
                    name: 'displayFormat.seriesColumns',
                    field: {text: $.t('screens.ds.grid_sidebar.chart.series_group.group_by'), type: 'columnSelect',
                            notequalto: 'valueCol', useFieldName: true,
                            name: 'fieldName', otherNames: 'tableColumnId',
                            columns: {type: colTypes, hidden: options.isEdit}}
                },
                {type: 'checkbox', text: $.t('screens.ds.grid_sidebar.chart.series_group.alphabetize'),
                    name: 'displayFormat.sortSeries',
                    inputFirst: true,
                    lineClass: 'indentedFormSection',
                    onlyIf: isNextGen},
                {type: 'checkbox', text: $.t('screens.ds.grid_sidebar.chart.series_group.hideLoadingMsg'),
                    name: 'displayFormat.hideDsgMsg',
                    inputFirst: true,
                    lineClass: 'indentedFormSection',
                    onlyIf: isNextGen},
                {type: 'note', value: $.t('screens.ds.grid_sidebar.chart.dsg_color_override_html')},
                {type: 'repeater', text: $.t('screens.ds.grid_sidebar.chart.colors'),
                field: $.extend({}, colorOption, {name: ''}),
                name: 'displayFormat.colors', minimum: 1,
                initialRepeatCount: 5, lineClass: 'colorArray'}
            ]
        };
    };

    var basicAdv = function(chart, options, fields)
    {
        return {
            title: $.t('screens.ds.grid_sidebar.chart.advanced'), type: 'selectable',
            name: chart.value + 'Adv', onlyIf: onlyIfForChart(chart, options, false),
            fields: fields
        };
    };


    /*** Specific configs that need small overrides ***/
    var configBubble = function(options)
    {
        var bc = basicConfig(Dataset.chart.types.bubble, options, Dataset.chart.textualTypes, 'Categories');
        bc.fields[0].required = false;
        return bc;
    };

    var dataBubble = function(options)
    {
        return {
            title: 'Data Columns', name: 'bubbleData',
            onlyIf: onlyIfForChart(Dataset.chart.types.bubble, options, false),
            fields: [ conditionalFormattingWarning,
                      {text: 'Value', required: true, type: 'columnSelect',
                        useFieldName: true, notequalto: 'valueCol',
                        name: 'displayFormat.valueColumns.0.fieldName',
                        otherNames: 'displayFormat.valueColumns.0.tableColumnId',
                        columns: {type: Dataset.chart.numericTypes, hidden: options.isEdit}
                    }, pointSize(options), pointColor(options), baseColor ]
        };
    };


    var configLine = function(options)
    {
        var bc = basicConfig(Dataset.chart.types.line, options, Dataset.chart.textualTypes, $.t('screens.ds.grid_sidebar.chart.categories'));
        bc.fields[0].required = false;
        return bc;
    };

    var getPieDefaultOrderBy = function(options)
    {
        var view = options.view;
        return _.map(view.displayFormat.valueColumns, function(col)
            {
                return {
                    ascending: false,
                    columnFieldName: view.columnForIdentifier(col.fieldName || col.tableColumnId).fieldName
                };
            });
    };

    var hasDefaultPieSort = function(options)
    {
        if ($.subKeyDefined(options.view, 'metadata.jsonQuery.order'))
        {
            var defaultOrderBy = getPieDefaultOrderBy(options);
            return _.isEqual(defaultOrderBy, options.view.metadata.jsonQuery.order);
        }
        return false;
    };

    var shouldEnableAutoPieSortButton = function(options)
    {
        return isNextGen && $.subKeyDefined(options.view, 'displayFormat.valueColumns') && !_.isEmpty(options.view.displayFormat.valueColumns) && !hasDefaultPieSort(options);
    };

    // We automatically apply a default OrderBy to pie-like charts (descending on first value column),
    // but only on the first apply, and only if there isn't a sort already.
    var autoSortButton = function(options)
    {
        var autoPieSortCurrentlyVisible = false;

        var createButton = function($dom)
        {
            var cpObj = this;

            var buttonText = $.t('screens.ds.grid_sidebar.chart.auto_update_sort_button');
            var $button = $("<a href='#' class='button applyDefaultPieSort'>" + buttonText + '</a>');
            $dom.append($button);

            var monitor = false;
            var refreshVisibility = function()
            {
                if (!monitor)
                {
                    monitor = true;
                    if (shouldEnableAutoPieSortButton(options) != autoPieSortCurrentlyVisible)
                    {
                        cpObj.reset();
                    }
                    monitor = false;
                }
            };

            options.view.bind('query_change', refreshVisibility);
            options.view.bind('displayformat_change', refreshVisibility);

            $button.on('click', function()
            {
                var md = $.extend(true, {}, options.view.metadata);
                md.jsonQuery.order = getPieDefaultOrderBy(options);

                options.view.update({ metadata: md }, false, true);
            });

            autoPieSortCurrentlyVisible = shouldEnableAutoPieSortButton(options);
            return autoPieSortCurrentlyVisible;
        };

        return {
            type: 'custom',
            lineClass: 'autoSortButton',
            editorCallbacks:
            {
                create: createButton
            }
        };
    };

    var autoSortButtonInfo = function(options, chartType)
    {
        return {
            type: 'note',
            onlyIf:
            {
                func: function() { return shouldEnableAutoPieSortButton(options); }
            },
            lineClass: 'autoSortInfo flash notice',
            value: $.t('screens.ds.grid_sidebar.chart.auto_update_sort_info_'+chartType)
        };
    };

    var configDonut = function(options)
    {
        var bc = basicConfig(Dataset.chart.types.donut, options, Dataset.chart.textualTypes, $.t('screens.ds.grid_sidebar.chart.label'));
        bc.fields.splice(1, 2);
        bc.fields.push({type: 'repeater', name: 'displayFormat.valueColumns',
                field: {text: $.t('screens.ds.grid_sidebar.chart.values'), name: 'fieldName', otherNames: 'tableColumnId',
                notequalto: 'valueCol', type: 'columnSelect', required: true, useFieldName: true,
                columns: {type: Dataset.chart.numericTypes, hidden: options.isEdit}},
                minimum: 1, addText: $.t('screens.ds.grid_sidebar.chart.data_columns.new_data_column_button')});

        bc.fields.push(autoSortButtonInfo(options, 'donut'));
        bc.fields.push(autoSortButton(options));
        bc.fields.push(conditionalFormattingWarning);
        bc.fields.push({type: 'repeater', text: $.t('screens.ds.grid_sidebar.chart.colors'),
                field: $.extend({}, colorOption, {name: ''}),
                name: 'displayFormat.colors', minimum: 1,
                initialRepeatCount: 5, lineClass: 'colorArray'});

        return bc;
    };

    var configPie = function(options)
    {
        var bc = basicConfig(Dataset.chart.types.pie, options, Dataset.chart.textualTypes, $.t('screens.ds.grid_sidebar.chart.label'));
        bc.fields.splice(1, 2);
        bc.fields.push({text: $.t('screens.ds.grid_sidebar.chart.values'), name: 'displayFormat.valueColumns.0.fieldName',
            otherNames: 'displayFormat.valueColumns.0.tableColumnId',
            notequalto: 'valueCol', type: 'columnSelect', required: true, useFieldName: true,
            columns: {type: Dataset.chart.numericTypes, hidden: options.isEdit}});

        bc.fields.push(autoSortButtonInfo(options, 'pie'));
        bc.fields.push(autoSortButton(options));
        bc.fields.push(conditionalFormattingWarning);
        bc.fields.push({type: 'repeater', text: $.t('screens.ds.grid_sidebar.chart.colors'),
                field: $.extend({}, colorOption, {name: ''}),
                name: 'displayFormat.colors', minimum: 1,
                initialRepeatCount: 5, lineClass: 'colorArray'});
        return bc;
    };

    var configTimeline = function(options)
    {
        var bc = basicConfig(Dataset.chart.types.timeline, options, Dataset.chart.dateTypes, $.t('screens.ds.grid_sidebar.chart.date'));
        bc.fields = _.reject(bc.fields, function(f) { return f.name == 'displayFormat.titleX'; });
        return bc;
    };

    var dataTimeline = function(options)
    {
        var bc = basicData(Dataset.chart.types.timeline, options, Dataset.chart.numericTypes, $.t('screens.ds.grid_sidebar.chart.value'));
        bc.fields[1].field.options.push(
                {text: $.t('screens.ds.grid_sidebar.chart.point_title'), type: 'columnSelect', useFieldName: true,
                    name: 'supplementalColumns.0',
                    columns: {type: 'text', hidden: options.isEdit}},
                {text: $.t('screens.ds.grid_sidebar.chart.annotation'), type: 'columnSelect', useFieldName: true,
                    name: 'supplementalColumns.1',
                    columns: {type: 'text', hidden: options.isEdit}}
        );
        return bc;
    };

    /*** Main config ***/

    chartConfigNS.configForType = function(type, options)
    {
        options = $.extend({isEdit: false, useOnlyIf: false}, options);
        var chart = Dataset.chart.types[type];
        var result = [];
        switch(type)
        {
            // Area chart
            case 'area':
                result.push(
                    basicConfig(chart, options, Dataset.chart.textualTypes, $.t('screens.ds.grid_sidebar.chart.categories')),
                    basicData(chart, options, Dataset.chart.numericTypes, $.t('screens.ds.grid_sidebar.chart.value')),
                    seriesData(chart, options, Dataset.chart.textualTypes),
                    basicAdv(chart, options, [legendPos, showLines, showPoints, flyoutControls(options)]),
                    yAxisFormatting(chart, options),
                    valueMarker(chart, options),
                    advLegend(chart, options),
                    domainMarker(chart, options));
                break;


            // Bar chart
            case 'stackedbar':
            case 'bar':
                result.push(
                    basicConfig(chart, options, Dataset.chart.textAndDateTypes, $.t('screens.ds.grid_sidebar.chart.groups')),
                    basicData(chart, options, Dataset.chart.numericTypes, $.t('screens.ds.grid_sidebar.chart.values')),
                    seriesData(chart, options, Dataset.chart.textualTypes),
                    yAxisFormatting(chart, options),
                    valueMarker(chart, options),
                    domainMarker(chart, options),
                    advLegend(chart, options),
                    errorBars(chart, options),
                    basicAdv(chart, options,
                        [legendPos, renderOther, labelInBar, valueInBar, flyoutControls(options)]));
                break;


            // Bubble chart
            case 'bubble':
                result.push(
                    configBubble(options),
                    dataBubble(options),
                    seriesData(chart, options, Dataset.chart.textualTypes),
                    basicAdv(chart, options, [legendPos, showLine, flyoutControls(options)]),
                    yAxisFormatting(chart, options),
                    valueMarker(chart, options),
                    domainMarker(chart, options));
                break;

            // Column chart
            case 'stackedcolumn':
            case 'column':
                result.push(
                    basicConfig(chart, options, Dataset.chart.textAndDateTypes, $.t('screens.ds.grid_sidebar.chart.groups')),
                    basicData(chart, options, Dataset.chart.numericTypes, $.t('screens.ds.grid_sidebar.chart.values')),
                    seriesData(chart, options, Dataset.chart.textualTypes),
                    yAxisFormatting(chart, options),
                    valueMarker(chart, options),
                    errorBars(chart, options),
                    domainMarker(chart, options),
                    advLegend(chart, options),
                    basicAdv(chart, options,
                        [legendPos, renderOther, labelInBar, valueInBar, flyoutControls(options)]));
                break;


            // Donut chart
            case 'donut':
                result.push(
                    configDonut(options),
                    advLegend(chart, options),
                    basicAdv(chart, options,
                        [legendPos, pieJoinAngle, flyoutControls(options), showPercentages, showActualValues]));
                break;


            // Line chart
            case 'line':
                result.push(
                    configLine(options),
                    basicData(chart, options, Dataset.chart.numericTypes, $.t('screens.ds.grid_sidebar.chart.value')),
                    seriesData(chart, options, Dataset.chart.textualTypes),
                    basicAdv(chart, options, [legendPos, showLines, showPoints, dataLabels,
                            {text: $.t('screens.ds.grid_sidebar.chart.smooth_line'), name: 'displayFormat.smoothLine',
                            type: 'checkbox', defaultValue: false},
                         flyoutControls(options)]),
                    yAxisFormatting(chart, options),
                    valueMarker(chart, options),
                    advLegend(chart, options),
                    domainMarker(chart, options));
                break;


            // Pie chart
            case 'pie':
                result.push(
                    configPie(options),
                    advLegend(chart, options),
                    basicAdv(chart, options,
                        [legendPos, pieJoinAngle, flyoutControls(options), showPercentages, showActualValues]));
                break;


            // Time line
            case 'timeline':
                result.push(
                    configTimeline(options),
                    dataTimeline(options),
                    seriesData(chart, options, Dataset.chart.textualTypes),
                    basicAdv(chart, options, [legendPos, flyoutControls(options)]),
                    yAxisFormatting(chart, options),
                    valueMarker(chart, options),
                    domainMarker(chart, options));
                break;


            // Tree Map
            case 'treemap':
                result.push(
                    { title: $.t('screens.ds.grid_sidebar.chart.configuration'), name: 'treemapBasic',
                    onlyIf: onlyIfForChart(chart, options, true),
                    fields: [
                        {text: $.t('screens.ds.grid_sidebar.chart.names'), name: 'displayFormat.fixedColumns.0', notequalto: 'valueCol',
                            type: 'columnSelect', required: true, useFieldName: true,
                            columns: {type: Dataset.chart.textualTypes, hidden: options.isEdit}
                        },
                        {text: $.t('screens.ds.grid_sidebar.chart.values'), name: 'displayFormat.valueColumns.0.fieldName',
                            otherNames: 'displayFormat.valueColumns.0.tableColumnId',
                            notequalto: 'valueCol', type: 'columnSelect', required: true,
                            useFieldName: true,
                            columns: {type: Dataset.chart.numericTypes, hidden: options.isEdit}
                        }
                    ] },
                    { title: $.t('screens.ds.grid_sidebar.chart.details'), name: 'treemapDetails', selectable: true,
                    onlyIf: onlyIfForChart(chart, options, false),
                    fields: [
                        conditionalFormattingWarning,
                        {type: 'repeater', text: $.t('screens.ds.grid_sidebar.chart.colors'),
                            field: $.extend({}, colorOption, {name: ''}),
                            name: 'displayFormat.colors', minimum: 1,
                            initialRepeatCount: 5, lineClass: 'colorArray'},
                        treemapRandomColorWarning
                    ] },
                    basicAdv(chart, options, [flyoutControls(options)]));
                break;
            }
            return result;
        };
})(jQuery);
