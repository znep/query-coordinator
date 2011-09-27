(function($)
{
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

    var pointSize = function(cpObj)
    {
        return {text: 'Point Size', name: 'displayFormat.pointSize',
            type: 'columnSelect', isTableColumn: true,
            columns: {type: ['number', 'money', 'percent'], hidden: isEdit(cpObj)}};
    };

    var pointColor = function(cpObj)
    {
        return {text: 'Point Color', name: 'displayFormat.pointColor',
            type: 'columnSelect', isTableColumn: true,
            columns: {type: ['number', 'money', 'percent'], hidden: isEdit(cpObj)}};
    };

    var baseColor = {text: 'Base Color', name: 'displayFormat.color', type: 'color',
        defaultValue: "#042656"};

    var showLine = {text: 'Draw a Line', name: 'displayFormat.showLine', type: 'checkbox' };

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

    var flyoutControls = function(cpObj)
    {
        return {type: 'repeater', name: 'displayFormat.descriptionColumns',
            field: {text: 'Flyout Details', name: 'tableColumnId',
                   type: 'columnSelect', isTableColumn: true, columns: {hidden: isEdit(cpObj)}},
            minimum: 1, addText: 'Add Flyout Details'
        };
    };

    var yAxisFormatting = {
        title: 'Y-Axis Formatting', onlyIf: _.map(['treemap', 'pie', 'donut', ''],
            function(type)
            { return {field: 'displayFormat.chartType', value: type, negate: true}; }),
        type: 'selectable', name: 'yAxisFormatting',
        fields: [
            {text: 'Axis Min.', type: 'radioGroup', defaultValue: '', name: 'yAxis.min',
                options: [ { type: 'static', name: '', value: 'Auto' },
                           { type: 'text', name: 'displayFormat.yAxis.min', prompt: 'Enter a number' }] },
            {text: 'Axis Max.', type: 'radioGroup', defaultValue: '', name: 'yAxis.max',
                options: [ { type: 'static', name: '', value: 'Auto' },
                           { type: 'text', name: 'displayFormat.yAxis.max', prompt: 'Enter a number' }] },
            {text: 'Precision', type: 'slider', name: 'displayFormat.yAxis.formatter.decimalPlaces',
                minimum: 0, maximum: 10, defaultValue: 2}
        ]
    };

    var valueMarker = {
        title: 'Value Marker', onlyIf: _.map(['treemap', 'pie', 'donut', ''],
            function(type)
            { return {field: 'displayFormat.chartType', value: type, negate: true}; }),
        type: 'selectable', name: 'valueMarker',
        fields: [
            {type: 'repeater', name: 'displayFormat.valueMarker', addText: 'Add Marker', minimum: 0,
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

    var showPercentages = { type: 'checkbox', name: 'displayFormat.showPercentages', text: 'Show %s' };


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

    var chartTypeAvailable = function(cpObj, chartConfig)
    {
        return Dataset.chart.hasRequiredColumns(cpObj.settings.view.realColumns,
            chartConfig.requiredColumns, isEdit(cpObj));
    };

    var datasetTooLarge = function(cpObj, chartConfig)
    {
        // Limit number of rows
        if (!$.isBlank(cpObj.settings.view.totalRows) &&
            cpObj.settings.view.totalRows > ((chartConfig.displayLimit || {}).points || 500))
        { return false; }
        return true;
    };

    var onlyIfForChart = function(cpObj, chart, disable)
    {
        return [{field: 'displayFormat.chartType', value: chart.value},
               {disable: disable, func: function() { return chartTypeAvailable(cpObj, chart); },
                disabledMessage: getDisabledMessage(chart)},
               {warn: disable, func: function() { return datasetTooLarge(cpObj, chart); },
                warningMessage: getWarningMessage(chart)}];
    };

    var basicConfig = function(cpObj, chart, colTypes, axisName)
    {
        return {
            title: 'Configuration', name: chart.value + 'Basic',
            onlyIf: onlyIfForChart(cpObj, chart, true),
            fields: [
                {text: axisName, name: 'displayFormat.fixedColumns.0',
                    type: 'columnSelect', required: true, isTableColumn: true, notequalto: 'valueCol',
                    columns: {type: colTypes, hidden: isEdit(cpObj)}
                }
            ].concat(axisTitles)
        };
    };

    var basicData = function(cpObj, chart, colTypes, axisName)
    {
        return {
            title: 'Data Columns', name: chart.value + 'Data',
            onlyIf: onlyIfForChart(cpObj, chart, false),
            fields: [
                conditionalFormattingWarning,
                {type: 'repeater', minimum: 1, addText: 'Add Data Column',
                    name: 'displayFormat.valueColumns',
                    field: {type: 'group', options: [
                        colorOption,
                        {text: axisName, required: true, type: 'columnSelect',
                            notequalto: 'valueCol', isTableColumn: true,
                            name: 'tableColumnId', columns: {type: colTypes, hidden: isEdit(cpObj)}}
                    ]}
                }
            ]
        };
    };

    var basicAdv = function(cpObj, chart, fields)
    {
        return {
            title: 'Advanced Configuration', type: 'selectable',
            name: chart.value + 'Adv', onlyIf: onlyIfForChart(cpObj, chart, false),
            fields: fields
        };
    };


    /*** Specific configs that need small overrides ***/
    var configBubble = function(cpObj)
    {
        var bc = basicConfig(cpObj, Dataset.chart.types.bubble, Dataset.chart.textualTypes, 'Categories');
        bc.fields[0].required = false;
        return bc;
    };

    var dataBubble = function(cpObj)
    {
        return {
            title: 'Data Columns', name: 'bubbleData',
            onlyIf: onlyIfForChart(cpObj, Dataset.chart.types.bubble, false),
            fields: [ conditionalFormattingWarning,
                      {text: 'Value', required: true, type: 'columnSelect',
                        isTableColumn: true, notequalto: 'valueCol',
                        name: 'displayFormat.valueColumns.0.tableColumnId',
                        columns: {type: Dataset.chart.numericTypes, hidden: isEdit(cpObj)}
                    }, pointSize(cpObj), pointColor(cpObj), baseColor ]
        };
    };


    var configLine = function(cpObj)
    {
        var bc = basicConfig(cpObj, Dataset.chart.types.line, Dataset.chart.textualTypes, 'Categories');
        bc.fields[0].required = false;
        return bc;
    };

    var configDonut = function(cpObj)
    {
        var bc = basicConfig(cpObj, Dataset.chart.types.donut, Dataset.chart.textualTypes, 'Label');
        bc.fields.splice(1, 2);
        bc.fields.push({type: 'repeater', name: 'displayFormat.valueColumns',
                field: {text: 'Values', name: 'tableColumnId', notequalto: 'valueCol',
                type: 'columnSelect', required: true, isTableColumn: true,
                columns: {type: Dataset.chart.numericTypes, hidden: isEdit(cpObj)}},
                minimum: 1, addText: 'Add Data Column'});

        bc.fields.push(conditionalFormattingWarning);
        bc.fields.push({type: 'repeater', text: 'Colors',
                field: $.extend({}, colorOption, {name: 'displayFormat.colors.0'}),
                minimum: 5, lineClass: 'colorArray'});

        return bc;
    };

    var configPie = function(cpObj)
    {
        var bc = basicConfig(cpObj, Dataset.chart.types.pie, Dataset.chart.textualTypes, 'Label');
        bc.fields.splice(1, 2);
        bc.fields.push({text: 'Values', name: 'displayFormat.valueColumns.0.tableColumnId',
            notequalto: 'valueCol', type: 'columnSelect', required: true, isTableColumn: true,
            columns: {type: Dataset.chart.numericTypes, hidden: isEdit(cpObj)}});
        bc.fields.push(conditionalFormattingWarning);
        bc.fields.push({type: 'repeater', text: 'Colors',
                field: $.extend({}, colorOption, {name: 'displayFormat.colors.0'}),
                minimum: 5, lineClass: 'colorArray'});
        return bc;
    };

    var configTimeline = function(cpObj)
    {
        var bc = basicConfig(cpObj, Dataset.chart.types.timeline, Dataset.chart.dateTypes, 'Date');
        bc.fields = _.reject(bc.fields, function(f) { return f.name == 'displayFormat.titleX'; });
        return bc;
    };

    var dataTimeline = function(cpObj)
    {
        var bc = basicData(cpObj, Dataset.chart.types.timeline, Dataset.chart.numericTypes, 'Value');
        bc.fields[1].field.options.push(
                {text: 'Title', type: 'columnSelect', isTableColumn: true,
                    name: 'supplementalColumns.0',
                    columns: {type: 'text', hidden: isEdit(cpObj)}},
                {text: 'Annotation', type: 'columnSelect', isTableColumn: true,
                    name: 'supplementalColumns.1',
                    columns: {type: 'text', hidden: isEdit(cpObj)}}
        );
        return bc;
    };

    /*** Main config ***/

    $.Control.extend('pane_chartCreate', {
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
        },

        getTitle: function()
        { return 'Chart'; },

        getSubtitle: function()
        { return 'View data can be displayed with a variety of charts'; },

        _getCurrentData: function()
        { return this._super() || this.settings.view; },

        isAvailable: function()
        {
            return (this.settings.view.valid || isEdit(this)) &&
                (_.include(this.settings.view.metadata.availableDisplayTypes, 'chart') ||
                    !this.settings.view.isAltView());
        },

        getDisabledSubtitle: function()
        {
            return !this.settings.view.valid && !isEdit(this) ?
                'This view must be valid' : 'A view may only have one visualization on it';
        },

        _getSections: function()
        {
            var cpObj = this;
            return [
                {
                    title: 'Chart Setup',
                    fields: [
                        {text: 'Chart Type', name: 'displayFormat.chartType',
                            type: 'select', required: true, prompt: 'Select a chart type',
                            options: _.sortBy(Dataset.chart.types, function(ct) { return ct.text; })
                        }
                    ]
                },


                // Area chart
                basicConfig(cpObj, Dataset.chart.types.area, Dataset.chart.textualTypes, 'Categories'),
                basicData(cpObj, Dataset.chart.types.area, Dataset.chart.numericTypes, 'Value'),
                basicAdv(cpObj, Dataset.chart.types.area, [legendPos, showLines, showPoints,
                    flyoutControls(cpObj)]),


                // Bar chart
                basicConfig(cpObj, Dataset.chart.types.bar, Dataset.chart.textualTypes, 'Groups'),
                basicData(cpObj, Dataset.chart.types.bar, Dataset.chart.numericTypes, 'Values'),
                basicAdv(cpObj, Dataset.chart.types.bar, [legendPos, stacking('bar'), renderOther,
                    flyoutControls(cpObj)]),


                // Bubble chart
                configBubble(cpObj),
                dataBubble(cpObj),
                basicAdv(cpObj, Dataset.chart.types.bubble, [legendPos, showLine, flyoutControls(cpObj)]),

                // Column chart
                basicConfig(cpObj, Dataset.chart.types.column, Dataset.chart.textualTypes, 'Groups'),
                basicData(cpObj, Dataset.chart.types.column, Dataset.chart.numericTypes, 'Values'),
                basicAdv(cpObj, Dataset.chart.types.column,
                    [legendPos, stacking('column'), renderOther, flyoutControls(cpObj)]),


                // Donut chart
                configDonut(cpObj),
                basicAdv(cpObj, Dataset.chart.types.donut,
                    [legendPos, pieJoinAngle, flyoutControls(cpObj), showPercentages]),


                // Line chart
                configLine(cpObj),
                basicData(cpObj, Dataset.chart.types.line, Dataset.chart.numericTypes, 'Value'),
                basicAdv(cpObj, Dataset.chart.types.line,
                    [legendPos, showLines, showPoints,
                        {text: 'Smooth Line', name: 'displayFormat.smoothLine',
                        type: 'checkbox', defaultValue: false},
                     flyoutControls(cpObj)]),


                // Pie chart
                configPie(cpObj),
                basicAdv(cpObj, Dataset.chart.types.pie,
                    [legendPos, pieJoinAngle, flyoutControls(cpObj), showPercentages]),


                // Time line
                configTimeline(cpObj),
                dataTimeline(cpObj),
                basicAdv(cpObj, Dataset.chart.types.timeline, [legendPos, flyoutControls(cpObj)]),


                // Tree Map
                { title: 'Configuration', name: 'treemapBasic',
                onlyIf: onlyIfForChart(cpObj, Dataset.chart.types.treemap, true),
                fields: [
                    {text: 'Names', name: 'displayFormat.fixedColumns.0', notequalto: 'valueCol',
                        type: 'columnSelect', required: true, isTableColumn: true,
                        columns: {type: Dataset.chart.textualTypes, hidden: isEdit(cpObj)}
                    },
                    {text: 'Values', name: 'displayFormat.valueColumns.0.tableColumnId',
                        notequalto: 'valueCol', type: 'columnSelect', required: true, isTableColumn: true,
                        columns: {type: Dataset.chart.numericTypes, hidden: isEdit(cpObj)}
                    }
                ] },
                { title: 'Details', name: 'treemapDetails', selectable: true,
                onlyIf: onlyIfForChart(cpObj, Dataset.chart.types.treemap, false),
                fields: [
                    conditionalFormattingWarning,
                    {type: 'repeater', text: 'Colors',
                        field: $.extend({}, colorOption, {name: 'displayFormat.colors.0'}),
                        minimum: 5, lineClass: 'colorArray'},
                    treemapRandomColorWarning
                ] },
                basicAdv(cpObj, Dataset.chart.types.treemap, [flyoutControls(cpObj)]),

                yAxisFormatting,
                valueMarker
            ];
        },

        _getFinishButtons: function()
        { return [$.controlPane.buttons.apply, $.controlPane.buttons.cancel]; },

        _finish: function(data, value)
        {
            var cpObj = this;
            if (!cpObj._super.apply(this, arguments)) { return; }

            var view = $.extend(true, {metadata: {renderTypeConfig: {visible: {chart: true}}}},
                cpObj._getFormValues(), {metadata: cpObj.settings.view.metadata});

            var addColumn = function(tcid)
            {
                var col = cpObj.settings.view.columnForTCID(tcid);
                if (_.any(col.renderType.aggregates, function(a) { return a.value == 'sum'; }))
                col.format.aggregate = 'sum';
            };

            _.each(view.displayFormat.fixedColumns || [], addColumn);

            if (_.include(['pie', 'donut'], view.displayFormat.chartType))
            { view.query = $.extend(view.query, cpObj.settings.view.query,
                { orderBys: _.map(view.displayFormat.valueColumns, function(col)
                    {
                        var orderBy = { ascending: false, expression: {
                            columnId: cpObj.settings.view.columnForTCID(col.tableColumnId).id,
                            type: 'column'
                        }};
                        return orderBy;
                    }) }
            ); }
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
    }, {name: 'chartCreate'}, 'controlPane');

    var isEdit = function(cpObj)
    { return _.include(cpObj.settings.view.metadata.availableDisplayTypes, 'chart'); };

    if ($.isBlank(blist.sidebarHidden.visualize) || !blist.sidebarHidden.visualize.chartCreate)
    { $.gridSidebar.registerConfig('visualize.chartCreate', 'pane_chartCreate', 1, 'chart'); }

})(jQuery);
