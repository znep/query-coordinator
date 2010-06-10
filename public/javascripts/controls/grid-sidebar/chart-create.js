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



    /*** Common configuration options ***/

    var axisTitles = [
        {text: 'X-Axis Title', name: 'displayFormat.titleX',
            type: 'text', prompt: 'Enter a title for the x-axis',
            wizard: 'Enter a title for the x-axis'},
        {text: 'Y-Axis Title', name: 'displayFormat.titleY',
            type: 'text', prompt: 'Enter a title for the y-axis',
            wizard: 'Enter a title for the y-axis'}
    ];

    var legendPos = {
        text: 'Legend', type: 'select', prompt: 'Choose a position',
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

    var defaultColors = ['#164363', '#3d5363', '#505b63', '#203442', '#101a21',
        '#2d3e4a', '#454f56'];

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
            {
                title: 'Configuration', name: 'areaBasic',
                onlyIf: onlyIfForChart(chartTypes.area, true),
                disabledMessage: getDisabledMessage(chartTypes.area),
                fields: [
                    {text: 'Categories', name: 'displayFormat.dataColumns.0',
                        type: 'columnSelect', required: true, isTableColumn: true,
                        columns: {type: textualTypes, hidden: false},
                        wizard: 'Select a column that contains the data for the x-axis'
                    }
                ].concat(axisTitles)
            },
            {
                title: 'Data Columns', name: 'areaData',
                onlyIf: onlyIfForChart(chartTypes.area, false),
                fields: [
                    {type: 'repeater', minimum: 1, addText: 'Add Data Column',
                        field: {type: 'group', options: [
                            {type: 'color', name: 'displayFormat.colors.0',
                                defaultValue: defaultColors},
                            {text: 'Value', required: true, type: 'columnSelect',
                                isTableColumn: true,
                                name: 'displayFormat.dataColumns.1',
                                columns: {type: numericTypes, hidden: false}}
                        ]},
                        wizard: 'Select one or more columns that contain values for the chart'
                    }
                ]
            },
            {
                title: 'Advanced Configuration', type: 'selectable',
                name: 'areaAdv', onlyIf: onlyIfForChart(chartTypes.area, false),
                fields: [
                    legendPos,
                    {text: 'Show Lines', name: 'displayFormat.lineSize',
                        type: 'checkbox', trueValue: 2, falseValue: 0,
                        defaultValue: 2,
                        wizard: 'Choose whether or not you want lines drawn for each data set'},
                    {text: 'Show Points', name: 'displayFormat.pointSize',
                        type: 'checkbox', trueValue: 3, falseValue: 0,
                        defaultValue: 3,
                        wizard: 'Choose whether or not you want points drawn for each data point'}
                ],
                wizard: 'Do you want to configure more details for this chart?'
            }
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
