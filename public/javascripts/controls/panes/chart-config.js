;(function($) {
    var chartConfigNS = blist.namespace.fetch('blist.configs.chart');

    /*** Common configuration options ***/

    var defaultColors = ['#042656', '#19538b', '#6a9feb', '#bed6f7', '#495969', '#bbc3c9'];

    var axisTitles = [
        {text: 'X-Axis Title', name: 'displayFormat.titleX',
            type: 'text', prompt: 'Enter a title for the x-axis'},
        {text: 'Y-Axis Title', name: 'displayFormat.titleY',
            type: 'text', prompt: 'Enter a title for the y-axis'}
    ];

    var legendPos = {text: 'Legend', type: 'select', prompt: 'Choose a position',
        defaultValue: 'bottom', name: 'displayFormat.legend',
        options: [
            {text: 'Bottom', value: 'bottom'},
            {text: 'Top', value: 'top'},
            {text: 'Right', value: 'right'},
            {text: 'Left', value: 'left'},
            {text: 'None', value: 'none'}
        ]
    };

    var stacking = function(type)
    { return {text: 'Stacking', type: 'checkbox', defaultValue: false, name: 'displayFormat.stacking' } };

    var renderOther = {text: 'Group Extra Values', type: 'checkbox', defaultValue: false,
        name: 'displayFormat.renderOther'};

    var colorOption = {type: 'color', name: 'color', defaultValue: defaultColors,
        lineClass: 'colorCollapse'};

    var showLines = {text: 'Show Lines', name: 'displayFormat.lineSize',
        type: 'checkbox', trueValue: '2', falseValue: '0', defaultValue: '2'};

    var showPoints = {text: 'Show Points', name: 'displayFormat.pointSize',
        type: 'checkbox', trueValue: '3', falseValue: '0', defaultValue: '3'};

    var pieJoinAngle = {text: 'Min. Angle', name: 'displayFormat.pieJoinAngle',
        type: 'slider', minimum: 0, maximum: 10, defaultValue: 1};

    var pointSize = function(options)
    {
        return {text: 'Point Size', name: 'displayFormat.pointSize',
            type: 'columnSelect', isTableColumn: true,
            columns: {type: ['number', 'money', 'percent'], hidden: options.isEdit}};
    };

    var pointColor = function(options)
    {
        return {text: 'Point Color', name: 'displayFormat.pointColor',
            type: 'columnSelect', isTableColumn: true,
            columns: {type: ['number', 'money', 'percent'], hidden: options.isEdit}};
    };

    var baseColor = {text: 'Base Color', name: 'displayFormat.color', type: 'color',
        defaultValue: "#042656"};

    var showLine = {text: 'Draw a Line', name: 'displayFormat.showLine', type: 'checkbox' };

    var dataLabels = {text: 'Data Labels', name: 'displayFormat.dataLabels', type: 'checkbox' };

    var conditionalFormattingWarning = {type: 'note',
        value: 'Colors may be overridden using <a href="#Conditional Formatting" ' +
               'class="showConditionalFormatting">Conditional Formatting</a>. Click ' +
                '<a href="#Clear Conditional Formatting" ' +
                'class="clearConditionalFormatting">here</a> to clear any current ' +
                'conditional formatting rules.' };
    var treemapRandomColorWarning = {type: 'note',
        value: 'These colors are applied to the treemap randomly only for ' +
               'creating visual distinctions. They do not have a specific meaning ' +
               'by themselves.' };

    var flyoutControls = function(options)
    {
        return {type: 'repeater', name: 'displayFormat.descriptionColumns',
            field: {text: 'Flyout Details', name: 'tableColumnId',
                   type: 'columnSelect', isTableColumn: true, columns: {hidden: options.isEdit}},
            minimum: 1, addText: 'Add Flyout Details'
        };
    };

    var yAxisFormatting = function(chart, options)
    {
        return {
            title: 'Y-Axis Formatting', onlyIf: onlyIfForChart(chart, options, false),
            type: 'selectable', name: 'yAxisFormatting',
            fields: [
                {text: 'Axis Min.', type: 'radioGroup', defaultValue: 'yAxisMinAuto', name: 'yAxisMin',
                    options: [ { type: 'static', name: 'yAxisMinAuto', value: 'Auto' },
                               { type: 'text', name: 'displayFormat.yAxis.min', prompt: 'Enter a number',
                                    extraClass: 'number' }] },
                {text: 'Axis Max.', type: 'radioGroup', defaultValue: 'yAxisMaxAuto', name: 'yAxisMax',
                    options: [ { type: 'static', name: 'yAxisMaxAuto', value: 'Auto' },
                               { type: 'text', name: 'displayFormat.yAxis.max', prompt: 'Enter a number',
                                    extraClass: 'number' }] },
                {text: 'Precision', type: 'slider', minimum: 0, maximum: 10, defaultValue: 2,
                    name: 'displayFormat.yAxis.formatter.decimalPlaces' },
                {text: 'Abbreviate', type: 'checkbox', defaultValue: true,
                    name: 'displayFormat.yAxis.formatter.abbreviate'}
            ]
        };
    };

    var _marker = function(which, chart, options)
    {
        return {
            title: $.capitalize(which) + ' Marker', onlyIf: onlyIfForChart(chart, options, false),
            type: 'selectable', name: which + 'Marker',
            fields: [
                {type: 'repeater', name: 'displayFormat.' + which + 'Marker', addText: 'Add Marker', minimum: 0,
                    field: {type: 'group', options: [
                        {type: 'group', options: [
                            {type: 'color', name: 'color',
                                lineClass: 'colorCollapse', defaultValue: '#000000'},
                            {text: 'At Value', type: 'text', name: 'atValue'}]},
                        {text: 'Caption', type: 'text', name: 'caption'}
                    ]}
                }
            ]
        };
    };

    var valueMarker =  _marker.curry('value');
    var domainMarker = function() { return { onlyIf: { func: function() { return false; } } }; };
    // var domainMarker = _marker.curry('domain');

    var showPercentages = { type: 'checkbox', name: 'displayFormat.showPercentages', text: 'Show %s' };
    var showActualValues = { type: 'checkbox', name: 'displayFormat.showActualValues', text: 'Show values' };

    var errorBars = function(chart, options)
    {
        return { title: 'Error Bars', onlyIf: onlyIfForChart(chart, options, false),
            type: 'selectable', name: 'errorBars',
            fields: [
                {text: 'Low', name: 'displayFormat.plot.errorBarLow', required: true,
                    type: 'columnSelect', isTableColumn: true, notequalto: 'errorBar',
                    columns: {type: Dataset.chart.numericTypes, hidden: options.isEdit}
                },
                {text: 'High', name: 'displayFormat.plot.errorBarHigh', required: true,
                    type: 'columnSelect', isTableColumn: true, notequalto: 'errorBar',
                    columns: {type: Dataset.chart.numericTypes, hidden: options.isEdit}
                },
                {text: 'Color', name: 'displayFormat.errorBarColor',
                    type: 'color', defaultValue: '#ff0000'}]
        };
    };


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

            return chartName.capitalize() + ' requires ' +
                $.arrayToSentence(_.map(newTypes, function(rc) { return $.wordify(rc.count) + ' ' +
                    $.arrayToSentence(_.map(rc.types, function(t)
                    { return blist.datatypes[t].title.toLowerCase(); }),
                        'or', ',') + ' column' + (rc.count == 1 ? '' : 's'); }),
                'and', ';', true) + '.';
        };
    };

    var getWarningMessage = function(chartConfig)
    {
        return function()
        {
            var chartName = chartConfig.text.toLowerCase();
            // This is the same as _maxRows in base-visualization.js
            var rowLimit = (chartConfig.displayLimit || {}).points || 500;
            if (chartConfig.renderOther)
            { return 'Warning: ' + chartName.capitalize() + ' will aggregate ' +
                ' distinct values (rows) past the ' + rowLimit + 'th into an ' +
                'Other category. Try creating a Roll Up or a filter which ' +
                'limits the number of values and then create a' +
                (!_.isNull(chartName.match(/^[aeiou]/)) ? 'n' : '') +
                ' ' + chartName + ' of that.'; }
            else
            { return 'Warning: ' + chartName.capitalize() + ' will truncate ' +
                'datasets with more than ' + rowLimit + ' distinct values ' +
                '(rows). Try creating a Roll Up or a filter which limits the ' +
                'number of values and then create a' +
                (!_.isNull(chartName.match(/^[aeiou]/)) ? 'n' : '') +
                ' ' + chartName + ' of that.'; }
        };
    };

    var chartTypeAvailable = function(chartConfig, options)
    {
        return $.isBlank(options.view) ? false : Dataset.chart.hasRequiredColumns(options.view.realColumns,
            chartConfig.requiredColumns, options.isEdit);
    };

    var datasetTooLarge = function(chartConfig, options)
    {
        // Limit number of rows
        if ($.isBlank(options.view) || !$.isBlank(options.view.totalRows) &&
            options.view.totalRows > ((chartConfig.displayLimit || {}).points || 500))
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
            title: 'Configuration', name: chart.value + 'Basic',
            onlyIf: onlyIfForChart(chart, options, true),
            fields: [
                {text: axisName, name: 'displayFormat.fixedColumns.0',
                    type: 'columnSelect', required: true, isTableColumn: true, notequalto: 'valueCol',
                    columns: {type: colTypes, hidden: options.isEdit}
                }
            ].concat(axisTitles)
        };
    };

    var basicData = function(chart, options, colTypes, axisName)
    {
        return {
            title: 'Data Columns', name: chart.value + 'Data',
            onlyIf: onlyIfForChart(chart, options, false),
            fields: [
                conditionalFormattingWarning,
                {type: 'repeater', minimum: 1, addText: 'Add Data Column',
                    name: 'displayFormat.valueColumns',
                    field: {type: 'group', options: [
                        colorOption,
                        {text: axisName, required: true, type: 'columnSelect',
                            notequalto: 'valueCol', isTableColumn: true,
                            name: 'tableColumnId', columns: {type: colTypes, hidden: options.isEdit}}
                    ]}
                }
            ]
        };
    };

    var seriesData = function(chart, options, colTypes)
    {
        return {
            title: 'Data Series Grouping', type: 'selectable', name: chart.value + 'SeriesData',
            onlyIf: onlyIfForChart(chart, options, false),
            fields: [
                {type: 'repeater', minimum: 1, addText: 'Add Series Column',
                    name: 'displayFormat.seriesColumns',
                    field: {text: 'Group by', type: 'columnSelect',
                            notequalto: 'valueCol', isTableColumn: true,
                            name: 'tableColumnId', columns: {type: colTypes, hidden: options.isEdit}}
                }
            ]
        };
    };

    var basicAdv = function(chart, options, fields)
    {
        return {
            title: 'Advanced Configuration', type: 'selectable',
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
                        isTableColumn: true, notequalto: 'valueCol',
                        name: 'displayFormat.valueColumns.0.tableColumnId',
                        columns: {type: Dataset.chart.numericTypes, hidden: options.isEdit}
                    }, pointSize(options), pointColor(options), baseColor ]
        };
    };


    var configLine = function(options)
    {
        var bc = basicConfig(Dataset.chart.types.line, options, Dataset.chart.textualTypes, 'Categories');
        bc.fields[0].required = false;
        return bc;
    };

    var configDonut = function(options)
    {
        var bc = basicConfig(Dataset.chart.types.donut, options, Dataset.chart.textualTypes, 'Label');
        bc.fields.splice(1, 2);
        bc.fields.push({type: 'repeater', name: 'displayFormat.valueColumns',
                field: {text: 'Values', name: 'tableColumnId', notequalto: 'valueCol',
                type: 'columnSelect', required: true, isTableColumn: true,
                columns: {type: Dataset.chart.numericTypes, hidden: options.isEdit}},
                minimum: 1, addText: 'Add Data Column'});

        bc.fields.push(conditionalFormattingWarning);
        bc.fields.push({type: 'repeater', text: 'Colors',
                field: $.extend({}, colorOption, {name: 'displayFormat.colors.0'}),
                minimum: 5, lineClass: 'colorArray'});

        return bc;
    };

    var configPie = function(options)
    {
        var bc = basicConfig(Dataset.chart.types.pie, options, Dataset.chart.textualTypes, 'Label');
        bc.fields.splice(1, 2);
        bc.fields.push({text: 'Values', name: 'displayFormat.valueColumns.0.tableColumnId',
            notequalto: 'valueCol', type: 'columnSelect', required: true, isTableColumn: true,
            columns: {type: Dataset.chart.numericTypes, hidden: options.isEdit}});
        bc.fields.push(conditionalFormattingWarning);
        bc.fields.push({type: 'repeater', text: 'Colors',
                field: $.extend({}, colorOption, {name: 'displayFormat.colors.0'}),
                minimum: 5, lineClass: 'colorArray'});
        return bc;
    };

    var configTimeline = function(options)
    {
        var bc = basicConfig(Dataset.chart.types.timeline, options, Dataset.chart.dateTypes, 'Date');
        bc.fields = _.reject(bc.fields, function(f) { return f.name == 'displayFormat.titleX'; });
        return bc;
    };

    var dataTimeline = function(options)
    {
        var bc = basicData(Dataset.chart.types.timeline, options, Dataset.chart.numericTypes, 'Value');
        bc.fields[1].field.options.push(
                {text: 'Title', type: 'columnSelect', isTableColumn: true,
                    name: 'supplementalColumns.0',
                    columns: {type: 'text', hidden: options.isEdit}},
                {text: 'Annotation', type: 'columnSelect', isTableColumn: true,
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
                    basicConfig(chart, options, Dataset.chart.textualTypes, 'Categories'),
                    basicData(chart, options, Dataset.chart.numericTypes, 'Value'),
                    seriesData(chart, options, Dataset.chart.textualTypes),
                    basicAdv(chart, options, [legendPos, showLines, showPoints, flyoutControls(options)]),
                    yAxisFormatting(chart, options),
                    valueMarker(chart, options),
                    domainMarker(chart, options));
                break;


            // Bar chart
            case 'bar':
                result.push(
                    basicConfig(chart, options, Dataset.chart.textualTypes, 'Groups'),
                    basicData(chart, options, Dataset.chart.numericTypes, 'Values'),
                    seriesData(chart, options, Dataset.chart.textualTypes),
                    basicAdv(chart, options, [legendPos, stacking('bar'), renderOther,
                        flyoutControls(options)]),
                    yAxisFormatting(chart, options),
                    valueMarker(chart, options),
                    errorBars(chart, options),
                    domainMarker(chart, options));
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
            case 'column':
                result.push(
                    basicConfig(chart, options, Dataset.chart.textualTypes, 'Groups'),
                    basicData(chart, options, Dataset.chart.numericTypes, 'Values'),
                    seriesData(chart, options, Dataset.chart.textualTypes),
                    basicAdv(chart, options,
                        [legendPos, stacking('column'), renderOther, flyoutControls(options)]),
                    yAxisFormatting(chart, options),
                    valueMarker(chart, options),
                    errorBars(chart, options),
                    domainMarker(chart, options));
                break;


            // Donut chart
            case 'donut':
                result.push(
                    configDonut(options),
                    basicAdv(chart, options,
                        [legendPos, pieJoinAngle, flyoutControls(options), showPercentages, showActualValues]));
                break;


            // Line chart
            case 'line':
                result.push(
                    configLine(options),
                    basicData(chart, options, Dataset.chart.numericTypes, 'Value'),
                    seriesData(chart, options, Dataset.chart.textualTypes),
                    basicAdv(chart, options, [legendPos, showLines, showPoints, dataLabels,
                            {text: 'Smooth Line', name: 'displayFormat.smoothLine',
                            type: 'checkbox', defaultValue: false},
                         flyoutControls(options)]),
                    yAxisFormatting(chart, options),
                    valueMarker(chart, options),
                    domainMarker(chart, options));
                break;


            // Pie chart
            case 'pie':
                result.push(
                    configPie(options),
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
                    { title: 'Configuration', name: 'treemapBasic',
                    onlyIf: onlyIfForChart(chart, options, true),
                    fields: [
                        {text: 'Names', name: 'displayFormat.fixedColumns.0', notequalto: 'valueCol',
                            type: 'columnSelect', required: true, isTableColumn: true,
                            columns: {type: Dataset.chart.textualTypes, hidden: options.isEdit}
                        },
                        {text: 'Values', name: 'displayFormat.valueColumns.0.tableColumnId',
                            notequalto: 'valueCol', type: 'columnSelect', required: true,
                            isTableColumn: true,
                            columns: {type: Dataset.chart.numericTypes, hidden: options.isEdit}
                        }
                    ] },
                    { title: 'Details', name: 'treemapDetails', selectable: true,
                    onlyIf: onlyIfForChart(chart, options, false),
                    fields: [
                        conditionalFormattingWarning,
                        {type: 'repeater', text: 'Colors',
                            field: $.extend({}, colorOption, {name: 'displayFormat.colors.0'}),
                            minimum: 5, lineClass: 'colorArray'},
                        treemapRandomColorWarning
                    ] },
                    basicAdv(chart, options, [flyoutControls(options)]));
                break;
            }
            return result;
        };
})(jQuery);
