(function($)
{
    if (blist.sidebarHidden.visualize &&
        blist.sidebarHidden.visualize.chartCreate) { return; }

    var isEdit = _.include(blist.dataset.metadata.availableDisplayTypes, 'chart');

    /*** Common configuration options ***/

    var defaultColors = ['#042656', '#19538b', '#6a9feb', '#bed6f7',
        '#495969', '#bbc3c9'];

    var axisTitles = [
        {text: 'X-Axis Title', name: 'displayFormat.titleX',
            type: 'text', prompt: 'Enter a title for the x-axis',
            wizard: 'Enter a title for the x-axis'},
        {text: 'Y-Axis Title', name: 'displayFormat.titleY',
            type: 'text', prompt: 'Enter a title for the y-axis',
            wizard: 'Enter a title for the y-axis'}
    ];

    var legendPos = {text: 'Legend', type: 'select', prompt: 'Choose a position',
        defaultValue: 'bottom', name: 'displayFormat.legend',
        options: [
            {text: 'Bottom', value: 'bottom'},
            {text: 'Top', value: 'top'},
            {text: 'Right', value: 'right'},
            {text: 'Left', value: 'left'},
            {text: 'None', value: 'none'}
        ],
        wizard: "Choose the position of the legend; or none if you don't " +
            'want a legend'
    };

    var stacking = function(type)
        { return {text: 'Stacking', type: 'checkbox', defaultValue: false,
        name: 'displayFormat.stacking', wizard: 'Stack values into a single ' + type + '?' } };

    var renderOther = {text: 'Group Extra Values', type: 'checkbox', defaultValue: false,
        name: 'displayFormat.renderOther', wizard: 'Collect extra' +
        'values into Other category?'};

    var colorOption = {type: 'color', name: 'color', defaultValue: defaultColors,
        lineClass: 'colorCollapse'};

    var showLines = {text: 'Show Lines', name: 'displayFormat.lineSize',
        type: 'checkbox', trueValue: '2', falseValue: '0', defaultValue: '2',
        wizard: 'Choose whether or not you want lines drawn for each data set'};

    var showPoints = {text: 'Show Points', name: 'displayFormat.pointSize',
        type: 'checkbox', trueValue: '3', falseValue: '0', defaultValue: '3',
        wizard: 'Choose whether or not you want points drawn for each data point'};

    var pieJoinAngle = {text: 'Min. Angle', name: 'displayFormat.pieJoinAngle',
        type: 'slider', minimum: 0, maximum: 10, defaultValue: 1,
        wizard: 'Slices below this angle in degrees will be ' +
            'combined into an "Other" slice'};

    var pointSize = {text: 'Point Size', name: 'displayFormat.pointSize',
        type: 'columnSelect', isTableColumn: true,
        columns: {type: ['number', 'money', 'percent'], hidden: isEdit},
        wizard: 'Choose a column that contains ' +
            'quantities specifying the size of each point' };

    var pointColor = {text: 'Point Color', name: 'displayFormat.pointColor',
        type: 'columnSelect', isTableColumn: true,
        columns: {type: ['number', 'money', 'percent'], hidden: isEdit},
        wizard: 'Choose a column that contains ' +
                'quantities specifying the color of each point' };

    var baseColor = {text: 'Base Color', name: 'displayFormat.color', type: 'color',
        defaultValue: "#042656"};

    var showLine = {text: 'Draw a Line', name: 'displayFormat.showLine',
        type: 'checkbox' };

    var conditionalFormattingWarning = {type: 'note',
        value: 'Colors may be overridden using <a href="#Conditional Formatting" ' +
               'id="showConditionalFormatting">Conditional Formatting</a>. Click ' +
                '<a href="#Clear Conditional Formatting" ' +
                'id="clearConditionalFormatting">here</a> to clear any current ' +
                'conditional formatting rules.' };
    var treemapRandomColorWarning = {type: 'note',
        value: 'These colors are applied to the treemap randomly only for ' +
               'creating visual distinctions. They do not have a specific meaning ' +
               'by themselves.' };

    var flyoutControls = {type: 'repeater',
        name: 'displayFormat.descriptionColumns',
        field: {text: 'Flyout Details', name: 'tableColumnId',
               type: 'columnSelect', isTableColumn: true,
               columns: {hidden: isEdit}},
        minimum: 1, addText: 'Add Flyout Details'
    };

    var yAxisFormatting = {
        title: 'Y-Axis Formatting', onlyIf: _.map(['treemap', 'pie', 'donut', ''],
            function(type)
            { return {field: 'displayFormat.chartType', value: type, negate: true}; }),
        type: 'selectable', name: 'yAxisFormatting',
        fields: [
            {text: 'Axis Min.', type: 'radioGroup', defaultValue: '', name: 'yAxis.min',
                options: [ { type: 'static', name: '', value: 'Auto' },
                           { type: 'text', name: 'displayFormat.yAxis.min',
                                prompt: 'Enter a number' }] },
            {text: 'Axis Max.', type: 'radioGroup', defaultValue: '', name: 'yAxis.max',
                options: [ { type: 'static', name: '', value: 'Auto' },
                           { type: 'text', name: 'displayFormat.yAxis.max',
                                prompt: 'Enter a number' }] },
            {text: 'Precision', type: 'slider',
                name: 'displayFormat.yAxis.formatter.decimalPlaces',
                minimum: 0, maximum: 10, defaultValue: 2},
            {type: 'group', options: [
                {type: 'color', name: 'displayFormat.yAxis.markerColor',
                    lineClass: 'colorCollapse', defaultValue: '#000000'},
                {text: 'Value Marker', type: 'text', name: 'displayFormat.yAxis.marker'}]}
        ]
    };

    var showPercentages = {
        type: 'checkbox', name: 'displayFormat.showPercentages', text: 'Show %s'
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
                $.arrayToSentence(_.map(newTypes, function(rc)
                { return $.wordify(rc.count) + ' ' +
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

    var chartTypeAvailable = function(chartConfig)
    {
        return Dataset.chart.hasRequiredColumns(blist.dataset.realColumns,
            chartConfig.requiredColumns, isEdit);
    };

    var datasetTooLarge = function(chartConfig)
    {
        // Limit number of rows
        if (!$.isBlank(blist.dataset.totalRows) &&
            blist.dataset.totalRows > ((chartConfig.displayLimit || {}).points || 500))
        { return false; }
        return true;
    };

    var onlyIfForChart = function(chart, disable)
    {
        return [{field: 'displayFormat.chartType', value: chart.value},
               {disable: disable, func: function()
                   { return chartTypeAvailable(chart); },
                disabledMessage: getDisabledMessage(chart)},
               {warn: disable, func: function()
                   { return datasetTooLarge(chart); },
                warningMessage: getWarningMessage(chart)}];
    };

    var basicConfig = function(chart, colTypes, axisName)
    {
        return {
            title: 'Configuration', name: chart.value + 'Basic',
            onlyIf: onlyIfForChart(chart, true),
            fields: [
                {text: axisName, name: 'displayFormat.fixedColumns.0',
                    type: 'columnSelect', required: true, isTableColumn: true,
                    notequalto: 'valueCol',
                    columns: {type: colTypes, hidden: isEdit},
                    wizard: 'Select a column that contains the data for the x-axis'
                }
            ].concat(axisTitles)
        };
    };

    var basicData = function(chart, colTypes, axisName)
    {
        return {
            title: 'Data Columns', name: chart.value + 'Data',
            onlyIf: onlyIfForChart(chart, false),
            fields: [
                conditionalFormattingWarning,
                {type: 'repeater', minimum: 1, addText: 'Add Data Column',
                    name: 'displayFormat.valueColumns',
                    field: {type: 'group', options: [
                        colorOption,
                        {text: axisName, required: true, type: 'columnSelect',
                            notequalto: 'valueCol', isTableColumn: true,
                            name: 'tableColumnId',
                            columns: {type: colTypes, hidden: isEdit}}
                    ]},
                    wizard: 'Select one or more columns that contain ' +
                        'values for the chart'
                }
            ]
        };
    };

    var basicAdv = function(chart, fields)
    {
        return {
            title: 'Advanced Configuration', type: 'selectable',
            name: chart.value + 'Adv', onlyIf: onlyIfForChart(chart, false),
            fields: fields,
            wizard: 'Do you want to configure more details for this chart?'
        };
    };


    /*** Specific configs that need small overrides ***/
    var configBubble = basicConfig(Dataset.chart.types.bubble,
        Dataset.chart.textualTypes, 'Categories');
    configBubble.fields[0].required = false;

    var dataBubble = {
            title: 'Data Columns', name: 'bubbleData',
            onlyIf: onlyIfForChart(Dataset.chart.types.bubble, false),
            fields: [ conditionalFormattingWarning,
                      {text: 'Value', required: true, type: 'columnSelect',
                        isTableColumn: true, notequalto: 'valueCol',
                        name: 'displayFormat.valueColumns.0.tableColumnId',
                        columns: {type: Dataset.chart.numericTypes, hidden: isEdit},
                        wizard: 'Select a column that contains values for the chart'
                    }, pointSize, pointColor, baseColor ]
        };


    var configLine = basicConfig(Dataset.chart.types.line,
        Dataset.chart.textualTypes, 'Categories');
    configLine.fields[0].required = false;

    var configDonut = basicConfig(Dataset.chart.types.donut,
        Dataset.chart.textualTypes, 'Label');
    configDonut.fields.splice(1, 2);
    configDonut.fields[0].wizard = 'Select a column that contains the categories ' +
        'for the donut slices';
    configDonut.fields.push({type: 'repeater', name: 'displayFormat.valueColumns',
            field: {text: 'Values', name: 'tableColumnId', notequalto: 'valueCol',
            type: 'columnSelect', required: true, isTableColumn: true,
            columns: {type: Dataset.chart.numericTypes, hidden: isEdit},
            wizard: 'Select a column that contains the data for the donut slices'},
            minimum: 1, addText: 'Add Data Column'
        });
    configDonut.fields.push(conditionalFormattingWarning);
    configDonut.fields.push({type: 'repeater', text: 'Colors',
        field: $.extend({}, colorOption, {name: 'displayFormat.colors.0'}),
        minimum: 6, maximum: 6, lineClass: 'colorArray',
        wizard: 'Choose colors for the slices of your donut chart'});

    var configPie = basicConfig(Dataset.chart.types.pie,
        Dataset.chart.textualTypes, 'Label');
    configPie.fields.splice(1, 2);
    configPie.fields[0].wizard = 'Select a column that contains the categories ' +
        'for the pie slices';
    configPie.fields.push({text: 'Values',
            name: 'displayFormat.valueColumns.0.tableColumnId',
            notequalto: 'valueCol',
            type: 'columnSelect', required: true, isTableColumn: true,
            columns: {type: Dataset.chart.numericTypes, hidden: isEdit},
            wizard: 'Select a column that contains the data for the pie slices'});
    configPie.fields.push(conditionalFormattingWarning);
    configPie.fields.push({type: 'repeater', text: 'Colors',
        field: $.extend({}, colorOption, {name: 'displayFormat.colors.0'}),
        minimum: 6, maximum: 6, lineClass: 'colorArray',
        wizard: 'Choose colors for the slices of your pie chart'});

    var configTimeline = basicConfig(Dataset.chart.types.timeline,
        Dataset.chart.dateTypes, 'Date');
    configTimeline.fields = _.reject(configTimeline.fields,
        function(f) { return f.name == 'displayFormat.titleX'; });
    var dataTimeline = basicData(Dataset.chart.types.timeline,
        Dataset.chart.numericTypes, 'Value');
    dataTimeline.fields[1].field.options.push(
        {text: 'Title', type: 'columnSelect', isTableColumn: true,
        name: 'supplementalColumns.0',
        columns: {type: 'text', hidden: isEdit}},
        {text: 'Annotation', type: 'columnSelect', isTableColumn: true,
        name: 'supplementalColumns.1',
        columns: {type: 'text', hidden: isEdit}}
    );

    /*** Main config ***/

    var sidebar;
    var configName = 'visualize.chartCreate';
    var config =
    {
        name: configName,
        priority: 1,
        title: 'Chart',
        subtitle: 'View data can be displayed with a variety of charts',
        dataSource: blist.dataset,
        showCallback: function(sidebarObj) { sidebar = sidebarObj; },
        onlyIf: function()
        {
            return (blist.dataset.valid || isEdit) &&
                (_.include(blist.dataset.metadata.availableDisplayTypes,
                    'chart') || !blist.dataset.isAltView());
        },
        disabledSubtitle: function()
        {
            return !blist.dataset.valid && !isEdit ?
                'This view must be valid' :
                'A view may only have one visualization on it';
        },
        sections: [
            {
                title: 'Chart Setup',
                fields: [
                    {text: 'Chart Type', name: 'displayFormat.chartType',
                        type: 'select', required: true,
                        prompt: 'Select a chart type',
                        options: _.sortBy(Dataset.chart.types, function(ct)
                            { return ct.text; }),
                        wizard: 'Select a chart type'
                    }
                ]
            },


            // Area chart
            basicConfig(Dataset.chart.types.area,
                Dataset.chart.textualTypes, 'Categories'),
            basicData(Dataset.chart.types.area,
                Dataset.chart.numericTypes, 'Value'),
            basicAdv(Dataset.chart.types.area,
                [legendPos, showLines, showPoints, flyoutControls]),


            // Bar chart
            basicConfig(Dataset.chart.types.bar,
                Dataset.chart.textualTypes, 'Groups'),
            basicData(Dataset.chart.types.bar,
                Dataset.chart.numericTypes, 'Values'),
            basicAdv(Dataset.chart.types.bar,
                [legendPos, stacking('bar'), renderOther, flyoutControls]),


            // Bubble chart
            configBubble,
            dataBubble,
            basicAdv(Dataset.chart.types.bubble, [legendPos, showLine, flyoutControls]),

            // Column chart
            basicConfig(Dataset.chart.types.column,
                Dataset.chart.textualTypes, 'Groups'),
            basicData(Dataset.chart.types.column,
                Dataset.chart.numericTypes, 'Values'),
            basicAdv(Dataset.chart.types.column,
                [legendPos, stacking('column'), renderOther, flyoutControls]),


            // Donut chart
            configDonut,
            basicAdv(Dataset.chart.types.donut,
                [legendPos, pieJoinAngle, flyoutControls, showPercentages]),


            // Line chart
            configLine,
            basicData(Dataset.chart.types.line,
                Dataset.chart.numericTypes, 'Value'),
            basicAdv(Dataset.chart.types.line,
                [legendPos, showLines, showPoints,
                    {text: 'Smooth Line', name: 'displayFormat.smoothLine',
                    type: 'checkbox', defaultValue: false,
                    wizard: 'Choose whether or not you want spline smoothing ' +
                        'applied to the line'},
                 flyoutControls
                ]),


            // Pie chart
            configPie,
            basicAdv(Dataset.chart.types.pie,
                [legendPos, pieJoinAngle, flyoutControls, showPercentages]),


            // Time line
            configTimeline,
            dataTimeline,
            basicAdv(Dataset.chart.types.timeline, [legendPos, flyoutControls]),


            // Tree Map
            { title: 'Configuration', name: 'treemapBasic',
            onlyIf: onlyIfForChart(Dataset.chart.types.treemap, true),
            fields: [
                {text: 'Names', name: 'displayFormat.fixedColumns.0',
                    notequalto: 'valueCol',
                    type: 'columnSelect', required: true, isTableColumn: true,
                    columns: {type: Dataset.chart.textualTypes, hidden: isEdit},
                    wizard: 'Select a column that contains the names'
                },
                {text: 'Values', name: 'displayFormat.valueColumns.0.tableColumnId',
                    notequalto: 'valueCol',
                    type: 'columnSelect', required: true, isTableColumn: true,
                    columns: {type: Dataset.chart.numericTypes, hidden: isEdit},
                    wizard: 'Select a column that contains the values'
                }
            ] },
            { title: 'Details', name: 'treemapDetails', selectable: true,
            onlyIf: onlyIfForChart(Dataset.chart.types.treemap, false),
            fields: [
                conditionalFormattingWarning,
                {type: 'repeater', text: 'Colors',
                    field: $.extend({}, colorOption, {name: 'displayFormat.colors.0'}),
                    minimum: 5, maximum: 5, lineClass: 'colorArray'},
                treemapRandomColorWarning
            ] },
            basicAdv(Dataset.chart.types.treemap, [flyoutControls]),

            yAxisFormatting
        ],
        finishBlock: {
            buttons: [$.gridSidebar.buttons.apply, $.gridSidebar.buttons.cancel],
            wizard: "Now you're ready to " +
                (isEdit ? 'update your' : 'create a new') + ' chart'
        }
    };

    config.finishCallback = function(sidebarObj, data, $pane, value)
    {
        if (!sidebarObj.baseFormHandler($pane, value)) { return; }

        var view = $.extend(true, {metadata: {renderTypeConfig: {visible: {chart: true}}}},
            sidebarObj.getFormValues($pane), {metadata: blist.dataset.metadata});

        var addColumn = function(tcid)
        {
            var col = blist.dataset.columnForTCID(tcid);
            if (_.any(col.renderType.aggregates,
                function(a) { return a.value == 'sum'; }))
            col.format.aggregate = 'sum';
        };

        _.each(view.displayFormat.fixedColumns || [], addColumn);

        if (_.include(['pie', 'donut'], view.displayFormat.chartType))
        { view.query = $.extend(view.query, blist.dataset.query,
            { orderBys: _.map(view.displayFormat.valueColumns, function(col)
                {
                    var orderBy = { ascending: false, expression: {
                        columnId: blist.dataset.columnForTCID(col.tableColumnId).id,
                        type: 'column'
                    }};
                    return orderBy;
                }) }
        ); }
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

    $.live('#gridSidebar_chartCreate #showConditionalFormatting', 'click', function(e)
    {
        e.preventDefault();
        blist.datasetPage.sidebar.show('visualize.conditionalFormatting');
    });

    $.live('#gridSidebar_chartCreate #clearConditionalFormatting', 'click', function(e)
    {
        e.preventDefault();
        var metadata = $.extend(true, {}, blist.dataset.metadata);
        delete metadata.conditionalFormatting;
        blist.dataset.update({ metadata: metadata });
    });

    blist.dataset.bind('clear_temporary', function()
        { if (!$.isBlank(sidebar)) { sidebar.refresh(configName); } });

    $.gridSidebar.registerConfig(config, 'chart');

})(jQuery);
