;(function($) {
    var chartConfigNS = blist.namespace.fetch('blist.configs.chart');

    /*** Common configuration options ***/

    var isNextGen = (blist.configuration.newChartsEnabled ||
        $.urlParam(window.location.href, 'charts') == 'nextgen') && $.urlParam(window.location.href, 'charts') != 'old';
    var nextGenReady = ['bar', 'column', 'pie', 'donut', 'line', 'area'];
    var isNewVisulize =  (blist.configuration.newChartConfig || $.urlParam(window.location.href, 'visualize') == 'nextgen');

    var defaultColors;
    if (isNextGen){
        defaultColors = ['#003366', '#D95F02', '#1B9E77', '#e6ab02', '#7570b3'];
    }
    else{
        defaultColors = ['#042656', '#19538b', '#6a9feb', '#bed6f7', '#495969', '#bbc3c9'];
    }
    var typeOrder = ['column', 'stackedcolumn', 'bar', 'stackedbar', 'pie', 'donut', 'line' , 'area', 'timeline', 'bubble', 'treemap'];


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
        type: 'text', spinner: true, minimum: 0, maximum: 10, defaultValue: 1};

    var smoothLine = {text: $.t('screens.ds.grid_sidebar.chart.smooth_line'), name: 'displayFormat.smoothLine',
        type: 'checkbox', defaultValue: false};


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
                      name: 'displayFormat.legendDetails.showConditional', defaultValue: false,
                      lineClass: 'advLegendCheck' });
            }

            if (needsValueMarkers)
            {
                fields.push(
                    { text: $.t('screens.ds.grid_sidebar.chart.legend.value_markers'), type: 'checkbox', inputFirst: true,
                      name: 'displayFormat.legendDetails.showValueMarkers', defaultValue: false,
                      lineClass: 'advLegendCheck' });
            }

            if (needsCustom)
            {
                fields.push(
                    { type: 'repeater', minimum: 0, initialRepeatCount: 0, addText: $.t('screens.ds.grid_sidebar.chart.legend.new_custom_entry_button'),
                      name: 'displayFormat.legendDetails.customEntries',
                      field: {
                          type: 'group', options: [
                              colorOption,
                              { text: $.t('screens.ds.grid_sidebar.chart.legend.custom_entry'), type: 'text',
                                name: 'label', required: true }
                          ]
                    } }
                );
            }

            return subheading(chart, options, $.t('screens.ds.grid_sidebar.chart.legend.title'), fields);
        };
    }


    var pointSize = function(options)
    {
        return {text: $.t('screens.ds.grid_sidebar.chart.point_size'), name: 'displayFormat.pointSize',
            type: 'columnSelect', useFieldName: true, lineClass: 'hasIcon pointSize',
            columns: {type: ['number', 'money', 'percent'], hidden: options.isEdit}};
    };

    var pointColor = function(options)
    {
        return {text: $.t('screens.ds.grid_sidebar.chart.point_color'), name: 'displayFormat.pointColor',
            type: 'columnSelect', useFieldName: true, lineClass: 'hasIcon pointColor',
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

    var _marker = function(which, chart, options)
    {
        return subheading(chart, options, $.t('screens.ds.grid_sidebar.chart.marker.title', { axis: $.capitalize(which) }),
            [
                {type: 'repeater', name: 'displayFormat.' + which + 'Marker', addText: $.t('screens.ds.grid_sidebar.chart.marker.new_marker_button'),
                 minimum: 0, lineClass: 'hasIcon valueMarker',
                    field: {type: 'group', options: [
                        {type: 'group', options: [
                            {type: 'color', name: 'color',
                                lineClass: 'colorCollapse', defaultValue: '#000000'},
                            {text: $.t('screens.ds.grid_sidebar.chart.marker.value'), type: 'text', name: 'atValue'}]},
                        {text: $.t('screens.ds.grid_sidebar.chart.marker.caption'), type: 'text', name: 'caption'}
                    ]}
                }
            ]
        );
    };

    var valueMarker =  _marker.curry('value');
    var domainMarker = function() { return { onlyIf: { func: function() { return false; } } }; };
    // var domainMarker = _marker.curry('domain');

    var showPercentages = { type: 'checkbox', name: 'displayFormat.showPercentages', text: $.t('screens.ds.grid_sidebar.chart.show_percent') };
    var showActualValues = { type: 'checkbox', name: 'displayFormat.showActualValues', text: $.t('screens.ds.grid_sidebar.chart.show_values') };

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

    var labelInBar = { text: $.t('screens.ds.grid_sidebar.chart.labelInBar'), type: 'checkbox',
                       name: 'displayFormat.xAxis.labelInBar', lineClass: 'hasIcon labelInBar', inputFirst: true };

    var valueInBar = { text: $.t('screens.ds.grid_sidebar.chart.valueInBar'), type: 'checkbox',
                       name: 'displayFormat.xAxis.valueInBar', lineClass: 'hasIcon valueInBar', inputFirst: true };

    if (!isNextGen)
    {
        labelInBar = { onlyIf: false };
        valueInBar = { onlyIf: false };
    }

    /*** Helpers ***/

   var getDisabledMessage = function(chartConfig)
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

            var result = [];
            _.each(newTypes, function(rc) { 
                var count = rc.count
                var and;
                if(rc==newTypes[0]){
                    and='';
                    result.push({tagName: 'span', 'class': 'title', contents:
                        $.t('screens.ds.grid_sidebar.chart.validation.chart_requires', {chart_type : chartName.capitalize()})+
                        $.t('screens.ds.grid_sidebar.chart.validation.chart_requires2', {and: and, count: count})
                    });
                }
                else{
                    and = 'and';
                    result.push({tagName: 'span', 'class': 'title', contents:
                        $.t('screens.ds.grid_sidebar.chart.validation.chart_requires2', {and: and, count: count})
                    });
                }
                _.each(rc.types, function(t){
                    result.push({tagName: 'div', 'class': blist.datatypes[t].name+' flyoutIcon',
                       contents: [{tagName: 'span', 'class': 'blist-th-icon'}, 
                                  {tagName: 'span', contents: $.t('screens.ds.grid_sidebar.base.datatypes.' 
                                    + transform(blist.datatypes[t].title).toLowerCase()).capitalize()} ] 
                    });                    
                })
            })
            
            return $.tag(result);

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
                disabledMessage: function(){getDisabledMessage(chart)}},
               {warn: disable, func: function() { return datasetTooLarge(chart, options); },
                warningMessage: getWarningMessage(chart)}];
    };

    var header = function(chart, options, name)
    {
        return {
            title: name,
            customClasses: 'sectionHeading'
        }
    }

    var subheading = function(chart, options, sectionTitle, content, show)
    {
        return { title: sectionTitle, type: 'selectable',
            customClasses: 'sectionSubheading', fields: content, validateCollapsed: true, initShow: (show || false)
        }
    }



    /// Functions for creating individual sections ///


    //Data selection
        //Chart Definition
        //Advanced data selection

    //Data presentation
        //Colors & shapes
        //Labels & values
        //Value markers

    //Chart details
        //Legend
        //Flyout config
        //Value axis options


    var dataSelection = function(chart, options, categoryColTypes, valueColTypes, axisName)
    {
        var selectionConfig = subheading(chart, options, 'Chart Definition',
            [
                {text: 'Choose data for label axis', name: 'displayFormat.fixedColumns.0', lineClass: 'hasIcon ' + chart.value + 'LabelSelection',
                    type: 'columnSelect', required: true, useFieldName: true, notequalto: 'valueCol',
                    columns: {type: categoryColTypes, hidden: options.isEdit}
                },
                {type: 'repeater', minimum: 1, addText: $.t('screens.ds.grid_sidebar.chart.data_columns.new_data_column_button'),
                    name: 'displayFormat.valueColumns', lineClass: 'hasIcon ' + chart.value + 'ValueSelection',
                    field:{ required: true, type: 'columnSelect', text: 'Choose data for value axis',
                            notequalto: 'valueCol', useFieldName: true,
                            name: 'fieldName', otherNames: 'tableColumnId',
                            columns: {type: valueColTypes, hidden: options.isEdit}
                    }
                }
            ]
        , true);
        return selectionConfig;
    };


    var advancedDataSelection = function(chart, options, colTypes)
    {
        // Using column.cachedContents as a hack because totalRows is rarely available at this time.
        var tooManyRows = isNextGen && _.any(options.view.realColumns,
            function(col) { return $.deepGet(col, 'cachedContents', 'non_null') > 10000; });

        var result = subheading(chart, options, 'Advanced Data Selection',
            [
                //Data Series Grouping
                {type: 'group', extraClass: 'subsection dsg', options: [
                    {type: 'note', value: $.t('screens.ds.grid_sidebar.chart.series_group.title')},
                    {type: 'note', value: $.t('screens.ds.grid_sidebar.chart.series_group.row_limit_warning'), onlyIf: tooManyRows },
                    {type: 'repeater', minimum: 1, addText: $.t('screens.ds.grid_sidebar.chart.series_group.new_column_button'),
                        lineClass: 'dataSeriesGrouping',
                        name: 'displayFormat.seriesColumns',
                        field: {text: $.t('screens.ds.grid_sidebar.chart.series_group.group_by'), type: 'columnSelect',
                                notequalto: 'valueCol', useFieldName: true,
                                name: 'fieldName', otherNames: 'tableColumnId',
                                columns: {type: colTypes, hidden: options.isEdit}
                        }
                    },
                    {type: 'checkbox', text: $.t('screens.ds.grid_sidebar.chart.series_group.alphabetize'),
                        name: 'displayFormat.sortSeries',
                        inputFirst: true,
                        lineClass: 'indentedFormSection'
                    },
                    {type: 'checkbox', text: $.t('screens.ds.grid_sidebar.chart.series_group.hideLoadingMsg'),
                        name: 'displayFormat.hideDsgMsg',
                        inputFirst: true,
                        lineClass: 'indentedFormSection'
                    }
                ]}
            ]
        );

        if(chart.value != 'line' && chart.value != 'area' && chart.value != 'timeline')
        {
            //Error Bars
            result.fields = result.fields.concat(
                [{type: 'group', extraClass: 'subsection errorBars', options: [
                    {type: 'note', value: $.t('screens.ds.grid_sidebar.chart.error_bars.title')},
                    {type: 'color', defaultValue: '#ff0000', name: 'displayFormat.errorBarColor'},
                    {text: $.t('screens.ds.grid_sidebar.chart.error_bars.low'), name: 'displayFormat.plot.errorBarLow',
                        type: 'columnSelect', useFieldName: true, notequalto: 'errorBar',
                        columns: {type: Dataset.chart.numericTypes, hidden: options.isEdit}, lineClass: 'hasIcon errorBarsLow'
                    },
                    {text: $.t('screens.ds.grid_sidebar.chart.error_bars.high'), name: 'displayFormat.plot.errorBarHigh',
                        type: 'columnSelect', useFieldName: true, notequalto: 'errorBar',
                        columns: {type: Dataset.chart.numericTypes, hidden: options.isEdit}, lineClass: 'hasIcon errorBarsHigh'
                    }

                ]}]
            )
        }
        return result;
    }


    var colors = function(chart, options)
    {
        var result = subheading(chart, options, 'Colors', []);

        result.fields.push({type: 'repeater', text: $.t('screens.ds.grid_sidebar.chart.colors'),
            field: $.extend({}, colorOption, {name: ''}),
            name: 'displayFormat.colors', minimum: 1,
            initialRepeatCount: 5, lineClass: 'colorArray'
        });

        if (!_.contains(['bubble', 'donut', 'treemap', 'pie'], chart.value)) 
        {

            result.fields[0].onlyIf =
                { field: 'displayFormat.seriesColumns',
                    func: function(val) { 
                        return _.compact(val).length > 0;

                    }
                }; 

            result.fields.push({ text: 'Column colors', type: 'custom',linkedField: ['displayFormat.valueColumns'], 
                                 name: 'displayFormat.valueColumns', lineClass: 'colors',
            editorCallbacks: {
                create: function($field, val, curVal) {
                    //validate valueColumns that may be passed du\plicates or null values
                    var fieldNames = {};
                    val = _.reject(val, function(col) {
                        if (!fieldNames[col] && col != null) {
                            fieldNames[col] = true;
                            return false;
                        }
                        return true;
                    });

                    //MAKE HIDDEN INPUT TO HANDLE CHANGE

                    var cols = {tagName: 'div', contents: []};
                    _.each(val, function(col, i) {

                        var valueCols = options.view.displayFormat.valueColumns;
                        var assignedColor = (valueCols && valueCols[i] ? valueCols[i].color : null) || defaultColors[i] || '#FF0000';

                        var readableName = $.htmlEscape(options.view.columnForFieldName(col).name);

                        var colorGroup = {tagName: 'div', 'class': 'colorGroup', contents: []};
                        colorGroup.contents.push({ tagName: 'div', 'class': 'columnColorControl', 'data-colorpicker-color': assignedColor},
                                                 { tagName: 'div', contents: readableName})
                        cols.contents.push(colorGroup);
                    });
                    $field.append($.tag(cols));

                    var $pickers = $field.find('.columnColorControl');

                    $pickers.each( function(i, p) {
                        var $p = $(p);
                        $p.css('background-color', $p.attr('data-colorpicker-color'));
                        $p.bind('color_change', function(e, newColor)
                        {
                            var $t = $(this);
                            $t.css('background-color', newColor);
                            $t.attr('data-colorpicker-color', newColor);
                        })
                        .one('mousedown', function() { $p.colorPicker(); });
                    });
                    return true;
                },
                value: function($field) {
                    var result = [];
                    $field.find('.columnColorControl').each(
                        function(index, cs) {
                            result.push({color: $(cs).data('colorpicker-color')});
                        });
                    return result;
                }
              }});
        }

        return result;
    }


    var labelsAndValues = function(chart, options, extraFields)
    {
         return subheading(chart, options, 'Labels and Values', extraFields);
    }


    //Value Marker

    //Legend Configuration


    var flyoutConfig = function(chart, options)
    {
        return subheading(chart, options, 'Flyouts',
            [
                {type: 'repeater', name: 'displayFormat.descriptionColumns', lineClass: 'hasIcon flyout',
                    onlyIf: {field: 'displayFormat.pointSize', value: '0', negate: true},
                    field: {type: 'group', options: [{text: $.t('screens.ds.grid_sidebar.chart.flyout.title'), name: 'fieldName', otherNames: 'tableColumnId',
                           type: 'columnSelect', useFieldName: true, columns: {hidden: options.isEdit}}]},
                    minimum: 1, addText: $.t('screens.ds.grid_sidebar.chart.flyout.new_details_button')
                }
            ]
        );
    }


    var axisOptions = function(chart, options)
    {
        var result = subheading(chart, options, 'Axis Options',
            [
                {text: $.t('screens.ds.grid_sidebar.chart.axes.x_axis_title'), name: 'displayFormat.titleX',
                    type: 'text', prompt: $.t('screens.ds.grid_sidebar.chart.axes.x_axis_title_prompt')},
                {text: $.t('screens.ds.grid_sidebar.chart.axes.y_axis_title'), name: 'displayFormat.titleY',
                    type: 'text', prompt: $.t('screens.ds.grid_sidebar.chart.axes.y_axis_title_prompt')},
                {text: $.t('screens.ds.grid_sidebar.chart.y_axis_formatting.axis_min'), type: 'radioGroup', defaultValue: 'yAxisMinAuto', name: 'yAxisMin',
                    options: [ { type: 'static', name: 'yAxisMinAuto', value: $.t('screens.ds.grid_sidebar.chart.y_axis_formatting.auto') },
                               { type: 'text', name: 'displayFormat.yAxis.min', prompt: $.t('screens.ds.grid_sidebar.chart.y_axis_formatting.axis_prompt'),
                                    extraClass: 'number' }] },
                {text: $.t('screens.ds.grid_sidebar.chart.y_axis_formatting.axis_max'), type: 'radioGroup', defaultValue: 'yAxisMaxAuto', name: 'yAxisMax',
                    options: [ { type: 'static', name: 'yAxisMaxAuto', value: $.t('screens.ds.grid_sidebar.chart.y_axis_formatting.auto') },
                               { type: 'text', name: 'displayFormat.yAxis.max', prompt: $.t('screens.ds.grid_sidebar.chart.y_axis_formatting.axis_prompt'),
                                    extraClass: 'number' }] },
                isNextGen ?
                    { text: 'Decimal Places', type: 'radioGroup', name: 'yAxisDecimalPlaces',
                        defaultValue: 'yAxisDecimalPlacesAuto',
                        options: [ { type: 'static', value: 'Auto', name: 'yAxisDecimalPlacesAuto' },
                                   { type: 'text', spinner: true, minimum: 0, maximum: 10, defaultValue: 0,
                                     name: 'displayFormat.yAxis.formatter.decimalPlaces' } ] } :
                    { text: $.t('screens.ds.grid_sidebar.chart.y_axis_formatting.precision'), type: 'text', spinner: true, minimum: 0, maximum: 10, defaultValue: 2,
                         name: 'displayFormat.yAxis.formatter.decimalPlaces' },
                {text: $.t('screens.ds.grid_sidebar.chart.y_axis_formatting.abbreviate'), type: 'checkbox', defaultValue: false,
                    name: 'displayFormat.yAxis.formatter.abbreviate'}
            ]
        );

        if (chart.value == 'timeline')
        { result.fields.splice(0, 1); }

        return result;
    };


    /*** Tweaks and overrides for specific types ***/

    var dataSelectionBubble = function(chart, options)
    {
        return subheading(chart, options, 'Data Columns',
                [
                    {text: 'Categories', name: 'displayFormat.fixedColumns.0', lineClass: 'hasIcon bubbleLabelSelection',
                        type: 'columnSelect', required: false, useFieldName: true, notequalto: 'valueCol',
                        columns: {type: Dataset.chart.textualTypes, hidden: options.isEdit}
                    },
                    {text: 'Value', required: true, type: 'columnSelect',
                        useFieldName: true, notequalto: 'valueCol', lineClass: 'hasIcon bubbleValueSelection',
                        name: 'displayFormat.valueColumns.0.fieldName',
                        otherNames: 'displayFormat.valueColumns.0.tableColumnId',
                        columns: {type: Dataset.chart.numericTypes, hidden: options.isEdit}
                    },
                    pointSize(options),
                    pointColor(options)
                ]
        , true);
    };

    var dataSelectionLine = function(options)
    {
        var bc = dataSelection(Dataset.chart.types.line, options, Dataset.chart.textualTypes, Dataset.chart.numericTypes, $.t('screens.ds.grid_sidebar.chart.categories'));
        bc.fields[0].required = false;
        return bc;
    };

    // We automatically apply a default OrderBy to pie-like charts (descending on first value column).
    // However, there are cases where users want to set a custom sort. In order to allow them to preserve
    // such a sort when they update the chart config, we provide this checkmark to disable the auto-sort
    // feature.
    var autoSortCheckbox = function(options)
    {
        // In absence of a set value for this option, provide a sensible default.
        var defaultValue = true;
        if ($.subKeyDefined(options.view, 'query.orderBys'))
        {
            // To handle charts that were created before this checkmark existed:
            // If the sort looks like it was added by us, default the checkmark to true.
            // Otherwise, default to false.
            var orderBys =  options.view.query.orderBys;
            var hasDefaultSort =  orderBys.length == 1 &&
                                  orderBys[0].ascending === false &&
                                  $.subKeyDefined(orderBys[0], 'expression.columnId') &&
                                  $.subKeyDefined(options.view, 'displayFormat.valueColumns') &&
                                  options.view.displayFormat.valueColumns.length > 0 &&
                                  options.view.columnForIdentifier(options.view.displayFormat.valueColumns[0].fieldName || options.view.displayFormat.valueColumns[0].tableColumnId).id === orderBys[0].expression.columnId;

            defaultValue = hasDefaultSort;
        }

        return { type: 'checkbox',  text: $.t('screens.ds.grid_sidebar.chart.auto_update_sort'),
                                    name: 'displayFormat.autoUpdateSort',
                                    inputFirst: true,
                                    defaultValue: defaultValue,
                                    lineClass: 'indentedFormSection',
                                    onlyIf: isNextGen };
    };

    var dataSelectionPie = function(options)
    {
        var bc = dataSelection(Dataset.chart.types.pie, options, Dataset.chart.textualTypes, Dataset.chart.numericTypes, $.t('screens.ds.grid_sidebar.chart.label'));
        bc.fields.splice(1, 2);
        bc.fields.push({text: 'Value Data', name: 'displayFormat.valueColumns.0.fieldName',
            otherNames: 'displayFormat.valueColumns.0.tableColumnId', lineClass: 'hasIcon pieValueSelection',
            notequalto: 'valueCol', type: 'columnSelect', required: true, useFieldName: true,
            columns: {type: Dataset.chart.numericTypes, hidden: options.isEdit}});
        bc.fields.push(autoSortCheckbox(options));
        return bc;
    };

    var dataSelectionDonut = function(options)
    {
        var bc = dataSelection(Dataset.chart.types.donut, options, Dataset.chart.textAndDateTypes, Dataset.chart.numericTypes, 'Data Selection');
        bc.fields.push(autoSortCheckbox(options));
        return bc;
    };

    var dataSelectionTimeline = function(options)
    {
        var bc = dataSelection(Dataset.chart.types.timeline, options, Dataset.chart.dateTypes, Dataset.chart.numericTypes, $.t('screens.ds.grid_sidebar.chart.label'));
        return bc;
    };


    /*** Main config ***/
    chartConfigNS.configChartSelector = function(options) {
        //getting rid of "Chart" at the end of the charttype string
        var chartTypesCopy = $.extend({}, Dataset.chart.types);
        for (var type in chartTypesCopy)
        {
            chartTypesCopy[type].text = chartTypesCopy[type].text.replace(' Chart','');
        }

        //Order the chart types in a custom order
        var chartTypesSorted = {};
        for (var i=0; i<typeOrder.length; i++)
        {

            chartTypesSorted[typeOrder[i]] = chartTypesCopy[typeOrder[i]];
            var currentType = chartTypesSorted[typeOrder[i]];

            //Disable chart types not available with current dataset
            if(!chartTypeAvailable(currentType, options)){
                currentType.lineClass = 'unavailable';
                currentType.disabled = 'disabled';
            }
            //add custom message to the different chart types
            currentType.prompt = getDisabledMessage(currentType);
        }

        var result = [{
                title: $.t('screens.ds.grid_sidebar.chart.setup.title'),
                type: 'selectable',
                initShow: true,
                validateCollapsed: true,
                customClasses: 'sectionSubheading chartTypeSelection',
                fields: [{
                        text: $.t('screens.ds.grid_sidebar.chart.setup.type'),
                        name: 'displayFormat.chartType',
                        type: 'radioGroup',
                        required: true,
                        extraClass: 'option-icons',
                        sectionSelector: true,
                        defaultValue: '',
                        prompt: $.t('screens.ds.grid_sidebar.chart.setup.type_prompt'),
                        options: chartTypesSorted
                    }
                ]
            }];
        return result;
    }


    chartConfigNS.newConfigForType = function(type, options)
    {
        options = $.extend({isEdit: false, useOnlyIf: false}, options);
        var chart = Dataset.chart.types[type];

        var headerDataSelect = header(chart, options, 'Data Selection'),
            headerPresentation = header(chart, options, 'Data Presentation'),
            headerDetails = header(chart, options, 'Chart Details');

        var result = [];
        switch(type)
        {
            // Area chart
            case 'area':
                result.push(
                    headerDataSelect,
                    dataSelection(chart, options, Dataset.chart.textualTypes, Dataset.chart.numericTypes, 'Data Selection'),
                    advancedDataSelection(chart, options, Dataset.chart.textualTypes),

                    headerPresentation,
                    colors(chart, options),
                    labelsAndValues(chart, options, [showLines, showPoints]),
                    valueMarker(chart, options),

                    headerDetails,
                    advLegend(chart, options),
                    flyoutConfig(chart, options),
                    axisOptions(chart, options),
                    domainMarker(chart, options));
                break;


            // Bar chart
            case 'stackedbar':
            case 'bar':
                result.push(
                    headerDataSelect,
                    dataSelection(chart, options, Dataset.chart.textAndDateTypes, Dataset.chart.numericTypes, 'Data Selection'),
                    advancedDataSelection(chart, options, Dataset.chart.textualTypes),

                    headerPresentation,
                    colors(chart, options),
                    labelsAndValues(chart, options, [labelInBar, valueInBar]),
                    valueMarker(chart, options),

                    headerDetails,
                    advLegend(chart, options),
                    flyoutConfig(chart, options),
                    axisOptions(chart, options),
                    domainMarker(chart, options));
                break;


            // Bubble chart
            case 'bubble':
                result.push(
                    headerDataSelect,
                    dataSelectionBubble(chart, options),
                    advancedDataSelection(chart, options, Dataset.chart.textualTypes),

                    headerPresentation,
                    colors(chart, options),
                    labelsAndValues(chart, options, [showLine]),
                    valueMarker(chart, options),

                    headerDetails,
                    flyoutConfig(chart, options),
                    axisOptions(chart, options),
                    domainMarker(chart, options));
                break;

            // Column chart
            case 'stackedcolumn':
            case 'column':
                result.push(
                    headerDataSelect,
                    dataSelection(chart, options, Dataset.chart.textAndDateTypes, Dataset.chart.numericTypes, 'Data Selection'),
                    advancedDataSelection(chart, options, Dataset.chart.textualTypes),

                    headerPresentation,
                    colors(chart, options),
                    labelsAndValues(chart, options, [labelInBar, valueInBar]),
                    valueMarker(chart, options),

                    headerDetails,
                    advLegend(chart, options),
                    flyoutConfig(chart, options),
                    axisOptions(chart, options),
                    domainMarker(chart, options));
                break;


            // Donut chart
            case 'donut':
                result.push(
                    headerDataSelect,
                    dataSelectionDonut(options),

                    headerPresentation,
                    colors(chart, options),
                    labelsAndValues(chart, options, [showPercentages, showActualValues, pieJoinAngle]),

                    headerDetails,
                    advLegend(chart, options),
                    flyoutConfig(chart, options));
                break;


            // Line chart
            case 'line':
                result.push(
                    headerDataSelect,
                    dataSelectionLine(options),
                    advancedDataSelection(chart, options, Dataset.chart.textualTypes),

                    headerPresentation,
                    colors(chart, options),
                    labelsAndValues(chart, options, [showLines, showPoints, dataLabels, smoothLine]),
                    valueMarker(chart, options),

                    headerDetails,
                    advLegend(chart, options),
                    flyoutConfig(chart, options),
                    axisOptions(chart, options),
                    domainMarker(chart, options));
                break;


            // Pie chart
            case 'pie':
                result.push(
                    headerDataSelect,
                    dataSelectionPie(options),

                    headerPresentation,
                    colors(chart, options),
                    labelsAndValues(chart, options, [showPercentages, showActualValues, pieJoinAngle]),

                    headerDetails,
                    advLegend(chart, options),
                    flyoutConfig(chart, options));
                break;


            // Time line
            case 'timeline':
                result.push(
                    headerDataSelect,
                    dataSelectionTimeline(options),
                    advancedDataSelection(chart, options, Dataset.chart.textualTypes),

                    headerPresentation,
                    colors(chart, options),
                    valueMarker(chart, options),

                    headerDetails,
                    flyoutConfig(chart, options),
                    axisOptions(chart, options));
                break;


            // Tree Map
            case 'treemap':
                var treemapColors = colors(chart, options);
                treemapColors.fields.push(treemapRandomColorWarning);

                result.push(

                    headerDataSelect,
                    subheading(chart, options, $.t('screens.ds.grid_sidebar.chart.configuration'),
                    [
                        {text: $.t('screens.ds.grid_sidebar.chart.names'), name: 'displayFormat.fixedColumns.0', notequalto: 'valueCol',
                            type: 'columnSelect', required: true, useFieldName: true, lineClass: 'hasIcon treemapLabelSelection',
                            columns: {type: Dataset.chart.textualTypes, hidden: options.isEdit}
                        },
                        {text: $.t('screens.ds.grid_sidebar.chart.values'), name: 'displayFormat.valueColumns.0.fieldName',
                            otherNames: 'displayFormat.valueColumns.0.tableColumnId', lineClass: 'hasIcon treemapValueSelection',
                            notequalto: 'valueCol', type: 'columnSelect', required: true,
                            useFieldName: true,
                            columns: {type: Dataset.chart.numericTypes, hidden: options.isEdit}
                        }
                    ], true),

                    headerPresentation,
                    treemapColors,

                    headerDetails,
                    flyoutConfig(chart, options));
                break;
            }
            return result;
        };
})(jQuery);
