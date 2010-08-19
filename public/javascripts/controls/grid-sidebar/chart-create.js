(function($)
{
    if (blist.sidebarHidden.visualize &&
        blist.sidebarHidden.visualize.chartCreate) { return; }

    var isEdit = blist.dataset.getDisplayType(blist.display.view) ==
        'Visualization';

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

        return blist.dataset.chart.hasRequiredColumns(view.columns,
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
    var configLine = basicConfig(blist.dataset.chart.types.line,
        blist.dataset.chart.textualTypes, 'Categories');
    configLine.fields[0].required = false;

    var configDonut = basicConfig(blist.dataset.chart.types.donut,
        blist.dataset.chart.textualTypes, 'Label');
    configDonut.fields.splice(1, 2);
    configDonut.fields[0].wizard = 'Select a column that contains the categories ' +
        'for the donut slices';
    configDonut.fields.push({type: 'repeater', name: 'displayFormat.valueColumns',
            field: {text: 'Values', name: 'tableColumnId',
            type: 'columnSelect', required: true, isTableColumn: true,
            columns: {type: blist.dataset.chart.numericTypes, hidden: isEdit},
            wizard: 'Select a column that contains the data for the donut slices'},
            minimum: 1, addText: 'Add Data Column'
        });
    configDonut.fields.push({type: 'repeater', text: 'Colors',
        field: $.extend({}, colorOption, {name: 'displayFormat.colors.0'}),
        minimum: 6, maximum: 6, lineClass: 'colorArray',
        wizard: 'Choose colors for the slices of your donut chart'});

    var configPie = basicConfig(blist.dataset.chart.types.pie,
        blist.dataset.chart.textualTypes, 'Label');
    configPie.fields.splice(1, 2);
    configPie.fields[0].wizard = 'Select a column that contains the categories ' +
        'for the pie slices';
    configPie.fields.push({text: 'Values',
            name: 'displayFormat.valueColumns.0.tableColumnId',
            type: 'columnSelect', required: true, isTableColumn: true,
            columns: {type: blist.dataset.chart.numericTypes, hidden: isEdit},
            wizard: 'Select a column that contains the data for the pie slices'});
    configPie.fields.push({type: 'repeater', text: 'Colors',
        field: $.extend({}, colorOption, {name: 'displayFormat.colors.0'}),
        minimum: 6, maximum: 6, lineClass: 'colorArray',
        wizard: 'Choose colors for the slices of your pie chart'});

    var configTimeline = basicConfig(blist.dataset.chart.types.timeline,
        blist.dataset.chart.dateTypes, 'Date');
    configTimeline.fields = _.reject(configTimeline.fields,
        function(f) { return f.name == 'displayFormat.titleX'; });
    var dataTimeline = basicData(blist.dataset.chart.types.timeline,
        blist.dataset.chart.numericTypes, 'Value');
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
        { return !blist.display.isInvalid || isEdit; },
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
                        options: _.sortBy(blist.dataset.chart.types, function(ct)
                            { return ct.text; }),
                        wizard: 'Select a chart type'
                    }
                ]
            },


            // Area chart
            basicConfig(blist.dataset.chart.types.area,
                blist.dataset.chart.textualTypes, 'Categories'),
            basicData(blist.dataset.chart.types.area,
                blist.dataset.chart.numericTypes, 'Value'),
            basicAdv(blist.dataset.chart.types.area,
                [legendPos, showLines, showPoints]),


            // Bar chart
            basicConfig(blist.dataset.chart.types.bar,
                blist.dataset.chart.textualTypes, 'Groups'),
            basicData(blist.dataset.chart.types.bar,
                blist.dataset.chart.numericTypes, 'Values'),
            basicAdv(blist.dataset.chart.types.bar, [legendPos]),


            // Column chart
            basicConfig(blist.dataset.chart.types.column,
                blist.dataset.chart.textualTypes, 'Groups'),
            basicData(blist.dataset.chart.types.column,
                blist.dataset.chart.numericTypes, 'Values'),
            basicAdv(blist.dataset.chart.types.column, [legendPos]),


            // Donut chart
            configDonut,


            // Line chart
            configLine,
            basicData(blist.dataset.chart.types.line,
                blist.dataset.chart.numericTypes, 'Value'),
            basicAdv(blist.dataset.chart.types.line,
                [legendPos, showLines, showPoints,
                    {text: 'Smooth Line', name: 'displayFormat.smoothLine',
                    type: 'checkbox', defaultValue: false,
                    wizard: 'Choose whether or not you want spline smoothing ' +
                        'applied to the line'}
                ]),


            // Pie chart
            configPie,
            basicAdv(blist.dataset.chart.types.pie, [legendPos,
                {text: 'Min. Angle', name: 'displayFormat.pieJoinAngle',
                type: 'slider', minimum: 0, maximum: 10, defaultValue: 1,
                wizard: 'Slices below this angle in degrees will be ' +
                    'combined into an "Other" slice'}
            ]),


            // Time line
            configTimeline,
            dataTimeline,
            basicAdv(blist.dataset.chart.types.timeline, [legendPos]),


            // Tree Map
            { title: 'Configuration', name: 'treemapBasic',
            onlyIf: onlyIfForChart(blist.dataset.chart.types.treemap, true),
            fields: [
                {text: 'Names', name: 'displayFormat.fixedColumns.0',
                    type: 'columnSelect', required: true, isTableColumn: true,
                    columns: {type: blist.dataset.chart.textualTypes, hidden: isEdit},
                    wizard: 'Select a column that contains the names'
                },
                {text: 'Values', name: 'displayFormat.valueColumns.0.tableColumnId',
                    type: 'columnSelect', required: true, isTableColumn: true,
                    columns: {type: blist.dataset.chart.numericTypes, hidden: isEdit},
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
        if (!isEdit) { return null; }

        return blist.dataset.chart.convertLegacy(
            $.extend(true, {}, blist.display.view), isEdit);
    };

    config.finishCallback = function(sidebarObj, data, $pane, value)
    {
        if (!sidebarObj.baseFormHandler($pane, value)) { return; }

        var view = blist.dataset.baseViewCopy(blist.display.view);
        view.displayType = 'chart';

        $.extend(view, sidebarObj.getFormValues($pane));
        view.columns = [];
        var addColumn = function(tcid)
        {
            var col = _.detect(blist.display.view.columns, function(c)
            { return c.tableColumnId == tcid; });

            var fmt = $.extend({}, col.format);
            if (_.include(blist.dataset.chart.numericTypes, col.renderTypeName))
            { $.extend(fmt, {aggregate: 'sum'}); }

            view.columns.push({id: col.id, name: col.name, format: fmt});
        };

        _.each(view.displayFormat.fixedColumns || [], addColumn);

        _.each(view.displayFormat.valueColumns || [], function(vc)
        {
            addColumn(vc.tableColumnId);
            _.each(vc.supplementalColumns || [], function(sc)
            { addColumn(sc); });
        });

        var url = '/views' + (isEdit ? '/' + blist.display.view.id : '') + '.json';
        $.ajax({url: url, type: isEdit ? 'PUT' : 'POST', dataType: 'json',
            data: JSON.stringify(view), contentType: 'application/json',
            error: function(xhr) { sidebarObj.genericErrorHandler($pane, xhr); },
            success: function(resp)
            {
                sidebarObj.finishProcessing();
                if (!isEdit)
                { blist.util.navigation.redirectToView(resp); }
                else
                {
                    $.syncObjects(blist.display.view, resp);

                    $('.currentViewName').text(blist.display.view.name);

                    var finishUpdate = function()
                    {
                        sidebarObj.$dom().socrataAlert(
                            {message: 'Your chart has been updated',
                                overlay: true});

                        sidebarObj.hide();

                        sidebarObj.addPane(configName);

                        _.defer(function()
                        {
                            $(document).trigger(blist.events.VALID_VIEW);

                            blist.$display.socrataChart()
                                .reload(blist.display.view.displayFormat);
                        });
                    };

                    var tcIds = (view.displayFormat.fixedColumns || []).slice();
                    tcIds = tcIds.concat(_(view.displayFormat.valueColumns || [])
                        .chain()
                        .map(function(vc)
                        {
                            return $.makeArray(vc.tableColumnId).concat(
                                vc.supplementalColumns || []);
                        }).flatten().value());
                    _.each(tcIds, function(tcId)
                    {
                        var col = _.detect(blist.display.view.columns, function(c)
                            { return c.tableColumnId == tcId; });
                        if (_.include(col.flags || [], 'hidden'))
                        {
                            $.socrataServer.addRequest({url: '/views/' +
                                blist.display.view.id + '/columns/' + col.id +
                                '.json', type: 'PUT',
                                data: JSON.stringify({hidden: false})});
                        }
                    });
                    if (!$.socrataServer.runRequests({success: finishUpdate}))
                    { finishUpdate(); }
                }
            }});
    };

    $.gridSidebar.registerConfig(config, 'Visualization');

})(jQuery);
