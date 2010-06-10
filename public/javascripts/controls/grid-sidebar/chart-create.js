(function($)
{
    if (blist.sidebarHidden.visualize &&
        blist.sidebarHidden.visualize.chartCreate) { return; }


    /*** Basic types ***/

    var textualTypes = ['text', 'drop_down_list'];
    var numericTypes = ['number', 'percent', 'money'];
    var dateTypes = ['calendar_date', 'date'];

    var chartTypes = {
        area: {value: 'area', text: 'Area Chart',
            requiredColumns: [textualTypes, numericTypes]},
        bar: {value: 'bar', text: 'Bar Chart',
            requiredColumns: [textualTypes, numericTypes]},
        column: {value: 'column', text: 'Column Chart',
            requiredColumns: [textualTypes, numericTypes]},
        line: {value: 'line', text: 'Line Chart',
            requiredColumns: [numericTypes]},
        pie: {value: 'pie', text: 'Pie Chart',
            requiredColumns: [textualTypes, numericTypes]},
        timeline: {value: 'timeline', text: 'Time Line',
            requiredColumns: [dateTypes, numericTypes]}
    };


    /*** Common configuration options ***/

    var defaultColors = ['#164363', '#3d5363', '#505b63', '#203442', '#101a21',
        '#2d3e4a', '#454f56'];

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
        wizard: "Choose the position of the legend; or none if you don't want a legend"
    };

    var colorOption = {type: 'color', name: 'displayFormat.colors.0',
        defaultValue: defaultColors};

    var showLines = {text: 'Show Lines', name: 'displayFormat.lineSize',
        type: 'checkbox', trueValue: 2, falseValue: 0, defaultValue: 2,
        wizard: 'Choose whether or not you want lines drawn for each data set'};

    var showPoints = {text: 'Show Points', name: 'displayFormat.pointSize',
        type: 'checkbox', trueValue: 3, falseValue: 0, defaultValue: 3,
        wizard: 'Choose whether or not you want points drawn for each data point'};



    /*** Helpers ***/

    var getDisabledMessage = function(chartConfig)
    {
        var newTypes = [];
        var copy = chartConfig.requiredColumns.slice();
        while (copy.length > 0)
        {
            var t = copy.shift();
            var oldL = copy.length;
            copy = _.without(copy, t);
            newTypes.push({count: (oldL - copy.length) + 1, types: t});
        }

        return chartConfig.text.toLowerCase().capitalize() + ' requires ' +
            $.arrayToSentence(_.map(newTypes, function(rc)
            { return $.wordify(rc.count) + ' ' +
                $.arrayToSentence(_.map(rc.types, function(t)
                { return blist.data.types[t].title.toLowerCase(); }), 'or', ',') +
                ' column' + (rc.count == 1 ? '' : 's'); }), 'and', ';', true) + '.';
    };

    var chartTypeAvailable = function(chartConfig, view)
    {
        var cols = view.columns.slice();
        return _.all(chartConfig.requiredColumns, function(rc)
        {
            var col = _.detect(cols, function(c)
            {
                return _.include(rc, c.dataTypeName) &&
                    ($.isBlank(c.flags) || !_.include(c.flags, 'hidden'));
            });

            if ($.isBlank(col)) { return false; }
            cols = _.without(cols, col);
            return true;
        });
    };

    var onlyIfForChart = function(chart, disable)
    {
        return [{field: 'displayFormat.chartType', value: chart.value},
               {disable: disable, func: function(view)
                   { return chartTypeAvailable(chart, view); }}];
    };

    var basicConfig = function(chart, colTypes, axisName)
    {
        return {
            title: 'Configuration', name: chart.value + 'Basic',
            onlyIf: onlyIfForChart(chart, true),
            disabledMessage: getDisabledMessage(chart),
            fields: [
                {text: axisName, name: 'displayFormat.dataColumns.0',
                    type: 'columnSelect', required: true, isTableColumn: true,
                    columns: {type: colTypes, hidden: false},
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
                {type: 'repeater', minimum: 1, addText: 'Add Data Column',
                    field: {type: 'group', options: [
                        colorOption,
                        {text: axisName, required: true, type: 'columnSelect',
                            isTableColumn: true,
                            name: 'displayFormat.dataColumns.0',
                            columns: {type: colTypes, hidden: false}}
                    ]},
                    wizard: 'Select one or more columns that contain values for the chart'
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
    var configLine = basicConfig(chartTypes.line, textualTypes, 'Categories');
    configLine.fields[0].required = false;

    var configPie = basicConfig(chartTypes.pie, textualTypes, 'Label');
    configPie.fields.splice(1, 2);
    configPie.fields.push({type: 'repeater', text: 'Colors',
        minimum: 6, maximum: 6, field: colorOption, lineClass: 'colorArray',
        wizard: 'Choose colors for the slices of your pie chart'});

    var configTimeline = basicConfig(chartTypes.timeline, dateTypes, 'Date');
    configTimeline.fields = _.reject(configTimeline.fields,
        function(f) { return f.name == 'displayFormat.titleX'; });
    var dataTimeline = basicData(chartTypes.timeline, numericTypes, 'Value');
    dataTimeline.fields[0].field.options.push(
        {text: 'Title', type: 'columnSelect', isTableColumn: true,
        name: 'displayFormat.dataColumns.1',
        columns: {type: 'text', hidden: false}},
        {text: 'Annotation', type: 'columnSelect', isTableColumn: true,
        name: 'displayFormat.dataColumns.2',
        columns: {type: 'text', hidden: false}}
    );

    /*** Main config ***/

    var config =
    {
        name: 'visualize.chartCreate',
        title: 'Chart',
        subtitle: 'View data can be displayed with a variety of charts',
        sections: [
            {
                title: 'Chart Setup',
                fields: [
                    {text: 'Name', name: 'name', type: 'text', required: true,
                        prompt: 'Enter a name',
                        wizard: 'Enter a name for your chart'
                    },
                    {text: 'Chart Type', name: 'displayFormat.chartType',
                        type: 'select', required: true,
                        prompt: 'Select a chart type',
                        options: _.sortBy(chartTypes, function(ct)
                            { return ct.text; }),
                        wizard: 'Select a chart type'
                    }
                ]
            },


            // Area chart
            basicConfig(chartTypes.area, textualTypes, 'Categories'),
            basicData(chartTypes.area, numericTypes, 'Value'),
            basicAdv(chartTypes.area, [legendPos, showLines, showPoints]),


            // Bar chart
            basicConfig(chartTypes.bar, textualTypes, 'Groups'),
            basicData(chartTypes.bar, numericTypes, 'Values'),
            basicAdv(chartTypes.bar, [legendPos]),


            // Column chart
            basicConfig(chartTypes.column, textualTypes, 'Groups'),
            basicData(chartTypes.column, numericTypes, 'Values'),
            basicAdv(chartTypes.column, [legendPos]),


            // Line chart
            configLine,
            basicData(chartTypes.line, numericTypes, 'Value'),
            basicAdv(chartTypes.line, [legendPos, showLines, showPoints,
                {text: 'Smooth Line', name: 'displayFormat.smoothLine',
                type: 'checkbox', defaultValue: false,
                wizard: 'Choose whether or not you want spline smoothing applied to the line'}
            ]),


            // Pie chart
            configPie,
            basicAdv(chartTypes.pie, [legendPos,
                {text: 'Min. Angle', name: 'displayFormat.pieJoinAngle',
                type: 'slider', minimum: 0, maximum: 10, defaultValue: 1,
                wizard: 'Slices below this angle in degrees will be combined into an "Other" slice'}
            ]),


            // Time line
            configTimeline,
            dataTimeline,
            basicAdv(chartTypes.timeline, [legendPos])

        ],
        finishBlock: {
            buttons: [$.gridSidebar.buttons.create, $.gridSidebar.buttons.cancel],
            wizard: "Now you're ready to create a new chart"
        }
    };

    config.finishCallback = function(sidebarObj, data, $pane, value)
    {
        if (!sidebarObj.baseFormHandler($pane, value)) { return; }

        var model = sidebarObj.$grid().blistModel();
        var view = blist.dataset.baseViewCopy(blist.display.view);
        view.displayType = 'chart';

        $.extend(view, sidebarObj.getFormValues($pane));

        $.ajax({url: '/views.json', type: 'POST', data: JSON.stringify(view),
            dataType: 'json', contentType: 'application/json',
            error: function(xhr) { sidebarObj.genericErrorHandler($pane, xhr); },
            success: function(resp)
            {
                sidebarObj.finishProcessing();
                blist.util.navigation.redirectToView(resp.id);
            }});
    };

    $.gridSidebar.registerConfig(config);

})(jQuery);
