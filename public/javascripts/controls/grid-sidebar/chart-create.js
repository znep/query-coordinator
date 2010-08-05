(function($)
{
    if (blist.sidebarHidden.visualize &&
        blist.sidebarHidden.visualize.chartCreate) { return; }

    var isEdit = blist.dataset.type == 'visualization';

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

    var colorOption = {type: 'color', name: 'color', defaultValue: defaultColors,
        lineClass: 'colorCollapse'};

    var showLines = {text: 'Show Lines', name: 'displayFormat.lineSize',
        type: 'checkbox', trueValue: '2', falseValue: '0', defaultValue: '2',
        wizard: 'Choose whether or not you want lines drawn for each data set'};

    var showPoints = {text: 'Show Points', name: 'displayFormat.pointSize',
        type: 'checkbox', trueValue: '3', falseValue: '0', defaultValue: '3',
        wizard: 'Choose whether or not you want points drawn for each data point'};

    var rowLimit = 100;
    var hitRowLimit = false;


    /*** Helpers ***/

    var getDisabledMessage = function(chartConfig)
    {
        return function()
        {
            var chartName = chartConfig.text.toLowerCase();
            if (hitRowLimit)
            {
                return chartName.capitalize() + ' requires ' +
                    'less than ' + rowLimit + ' distinct values (rows). ' +
                    'Try creating a Roll Up or a filter which limits the ' +
                    'number of values and then create a' +
                    (!_.isNull(chartName.match(/^[aeiou]/)) ? 'n' : '') +
                    ' ' + chartName + ' of that.';
            }

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
                    { return blist.data.types[t].title.toLowerCase(); }),
                        'or', ',') + ' column' + (rc.count == 1 ? '' : 's'); }),
                'and', ';', true) + '.';
        };
    };

    var chartTypeAvailable = function(chartConfig, view)
    {
        // Limit number of rows
        if (!$.isBlank(view.totalRows) && view.totalRows > rowLimit)
        {
            hitRowLimit = true;
            return false;
        }
        hitRowLimit = false;

        return blist.datasetUtil.chart.hasRequiredColumns(view.columns,
            chartConfig.requiredColumns, isEdit);
    };

    var onlyIfForChart = function(chart, disable)
    {
        return [{field: 'displayFormat.chartType', value: chart.value},
               {disable: disable, func: function(m)
                   { return chartTypeAvailable(chart, m); },
                disabledMessage: getDisabledMessage(chart)}];
    };

    var basicConfig = function(chart, colTypes, axisName)
    {
        return {
            title: 'Configuration', name: chart.value + 'Basic',
            onlyIf: onlyIfForChart(chart, true),
            fields: [
                {text: axisName, name: 'displayFormat.fixedColumns.0',
                    type: 'columnSelect', required: true, isTableColumn: true,
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
                {type: 'repeater', minimum: 1, addText: 'Add Data Column',
                    name: 'displayFormat.valueColumns',
                    field: {type: 'group', options: [
                        colorOption,
                        {text: axisName, required: true, type: 'columnSelect',
                            isTableColumn: true,
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
    var configLine = basicConfig(blist.datasetUtil.chart.types.line,
        blist.datasetUtil.chart.textualTypes, 'Categories');
    configLine.fields[0].required = false;

    var configDonut = basicConfig(blist.datasetUtil.chart.types.donut,
        blist.datasetUtil.chart.textualTypes, 'Label');
    configDonut.fields.splice(1, 2);
    configDonut.fields[0].wizard = 'Select a column that contains the categories ' +
        'for the donut slices';
    configDonut.fields.push({type: 'repeater', name: 'displayFormat.valueColumns',
            field: {text: 'Values', name: 'tableColumnId',
            type: 'columnSelect', required: true, isTableColumn: true,
            columns: {type: blist.datasetUtil.chart.numericTypes, hidden: isEdit},
            wizard: 'Select a column that contains the data for the donut slices'},
            minimum: 1, addText: 'Add Data Column'
        });
    configDonut.fields.push({type: 'repeater', text: 'Colors',
        field: $.extend({}, colorOption, {name: 'displayFormat.colors.0'}),
        minimum: 6, maximum: 6, lineClass: 'colorArray',
        wizard: 'Choose colors for the slices of your donut chart'});

    var configPie = basicConfig(blist.datasetUtil.chart.types.pie,
        blist.datasetUtil.chart.textualTypes, 'Label');
    configPie.fields.splice(1, 2);
    configPie.fields[0].wizard = 'Select a column that contains the categories ' +
        'for the pie slices';
    configPie.fields.push({text: 'Values',
            name: 'displayFormat.valueColumns.0.tableColumnId',
            type: 'columnSelect', required: true, isTableColumn: true,
            columns: {type: blist.datasetUtil.chart.numericTypes, hidden: isEdit},
            wizard: 'Select a column that contains the data for the pie slices'});
    configPie.fields.push({type: 'repeater', text: 'Colors',
        field: $.extend({}, colorOption, {name: 'displayFormat.colors.0'}),
        minimum: 6, maximum: 6, lineClass: 'colorArray',
        wizard: 'Choose colors for the slices of your pie chart'});

    var configTimeline = basicConfig(blist.datasetUtil.chart.types.timeline,
        blist.datasetUtil.chart.dateTypes, 'Date');
    configTimeline.fields = _.reject(configTimeline.fields,
        function(f) { return f.name == 'displayFormat.titleX'; });
    var dataTimeline = basicData(blist.datasetUtil.chart.types.timeline,
        blist.datasetUtil.chart.numericTypes, 'Value');
    dataTimeline.fields[0].field.options.push(
        {text: 'Title', type: 'columnSelect', isTableColumn: true,
        name: 'supplementalColumns.0',
        columns: {type: 'text', hidden: isEdit}},
        {text: 'Annotation', type: 'columnSelect', isTableColumn: true,
        name: 'supplementalColumns.1',
        columns: {type: 'text', hidden: isEdit}}
    );

    /*** Main config ***/

    var configName = 'visualize.chartCreate';
    var config =
    {
        name: configName,
        priority: 1,
        title: 'Chart',
        subtitle: 'View data can be displayed with a variety of charts',
        onlyIf: function(view)
        { return blist.dataset.valid || isEdit; },
        disabledSubtitle: 'This view must be valid',
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
                        options: _.sortBy(blist.datasetUtil.chart.types, function(ct)
                            { return ct.text; }),
                        wizard: 'Select a chart type'
                    }
                ]
            },


            // Area chart
            basicConfig(blist.datasetUtil.chart.types.area,
                blist.datasetUtil.chart.textualTypes, 'Categories'),
            basicData(blist.datasetUtil.chart.types.area,
                blist.datasetUtil.chart.numericTypes, 'Value'),
            basicAdv(blist.datasetUtil.chart.types.area,
                [legendPos, showLines, showPoints]),


            // Bar chart
            basicConfig(blist.datasetUtil.chart.types.bar,
                blist.datasetUtil.chart.textualTypes, 'Groups'),
            basicData(blist.datasetUtil.chart.types.bar,
                blist.datasetUtil.chart.numericTypes, 'Values'),
            basicAdv(blist.datasetUtil.chart.types.bar, [legendPos]),


            // Column chart
            basicConfig(blist.datasetUtil.chart.types.column,
                blist.datasetUtil.chart.textualTypes, 'Groups'),
            basicData(blist.datasetUtil.chart.types.column,
                blist.datasetUtil.chart.numericTypes, 'Values'),
            basicAdv(blist.datasetUtil.chart.types.column, [legendPos]),


            // Donut chart
            configDonut,


            // Line chart
            configLine,
            basicData(blist.datasetUtil.chart.types.line,
                blist.datasetUtil.chart.numericTypes, 'Value'),
            basicAdv(blist.datasetUtil.chart.types.line,
                [legendPos, showLines, showPoints,
                    {text: 'Smooth Line', name: 'displayFormat.smoothLine',
                    type: 'checkbox', defaultValue: false,
                    wizard: 'Choose whether or not you want spline smoothing ' +
                        'applied to the line'}
                ]),


            // Pie chart
            configPie,
            basicAdv(blist.datasetUtil.chart.types.pie, [legendPos,
                {text: 'Min. Angle', name: 'displayFormat.pieJoinAngle',
                type: 'slider', minimum: 0, maximum: 10, defaultValue: 1,
                wizard: 'Slices below this angle in degrees will be ' +
                    'combined into an "Other" slice'}
            ]),


            // Time line
            configTimeline,
            dataTimeline,
            basicAdv(blist.datasetUtil.chart.types.timeline, [legendPos]),


            // Tree Map
            { title: 'Configuration', name: 'treemapBasic',
            onlyIf: onlyIfForChart(blist.datasetUtil.chart.types.treemap, true),
            fields: [
                {text: 'Names', name: 'displayFormat.fixedColumns.0',
                    type: 'columnSelect', required: true, isTableColumn: true,
                    columns: {type: blist.datasetUtil.chart.textualTypes, hidden: isEdit},
                    wizard: 'Select a column that contains the names'
                },
                {text: 'Values', name: 'displayFormat.valueColumns.0.tableColumnId',
                    type: 'columnSelect', required: true, isTableColumn: true,
                    columns: {type: blist.datasetUtil.chart.numericTypes, hidden: isEdit},
                    wizard: 'Select a column that contains the values'
                }
            ] }

        ],
        finishBlock: {
            buttons: [isEdit ? $.gridSidebar.buttons.update :
                $.gridSidebar.buttons.create, $.gridSidebar.buttons.cancel],
            wizard: "Now you're ready to " +
                (isEdit ? 'update your' : 'create a new') + ' chart'
        }
    };

    config.dataSource = function()
    {
        return isEdit ? blist.dataset : null;
    };


    config.finishCallback = function(sidebarObj, data, $pane, value)
    {
        if (!sidebarObj.baseFormHandler($pane, value)) { return; }

        var view = $.extend({displayType: 'chart'},
            sidebarObj.getFormValues($pane));

        var addColumn = function(tcid)
        {
            var col = blist.dataset.columnForTCID(tcid);
            if (_.any(col.renderType.aggregates,
                function(a) { return a.value == 'sum'; }))
            col.format.aggregate = 'sum';
        };

        _.each(view.displayFormat.fixedColumns || [], addColumn);

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
                        {message: 'Your chart has been updated', overlay: true});

                    sidebarObj.hide();

                    sidebarObj.addPane(configName);

                    _.defer(function()
                    {
                        $(document).trigger(blist.events.VALID_VIEW);

                        blist.$display.socrataChart().reload();
                    });
                };

                var tcIds = (newView.displayFormat.fixedColumns || []).slice();
                tcIds = tcIds.concat(_(newView.displayFormat.valueColumns || [])
                    .chain()
                    .map(function(vc)
                    {
                        return $.makeArray(vc.tableColumnId).concat(
                            vc.supplementalColumns || []);
                    }).flatten().value());
                _.each(tcIds, function(tcId)
                {
                    var col = newView.columnForTCID(tcId);
                    if (col.hidden) { col.show(null, null, true); }
                });
                if (!$.socrataServer.runRequests({success: finishUpdate}))
                { finishUpdate(); }
            },
            function(xhr) { sidebarObj.genericErrorHandler($pane, xhr); });
        }
    };

    $.gridSidebar.registerConfig(config, 'Visualization');

})(jQuery);
