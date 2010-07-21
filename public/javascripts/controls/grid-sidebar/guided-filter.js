(function($)
{
    if (_.isUndefined(blist.display.view.metadata) &&
        _.isUndefined(blist.display.view.metadata.facets)) { return; }

    var configName = 'filter.guidedFilter';
    var config = {
        name: configName,
        priority: 1,
        title: 'Guided Filter',
        subtitle: 'If you want to explore this dataset, but aren\'t entirely ' +
            'certain what you\'re looking for, you can use the Guided ' +
            'Filter to help find interesting trends',
        // TODO: onlyIf
        disabledSubtitle: 'This view must be valid',
        noReset: true,
        finishBlock: {
            buttons: [
                $.gridSidebar.buttons.done
            ]
        }
    };

    config.sections = _.map(blist.display.view.metadata.facets, function(facet)
    {
        var column = blist.dataset.columnForTCID(blist.display.view, facet.tableColumnId);
        var sectionConfig = {
            title: column.name,
            name: 'facet_' + column.name,
            tableColumnId: facet.tableColumnId,
            fields: [{
                name: column.name,
                defaultValue: '',
                type: 'radioGroup',
                lineClass: 'noLabel facet' + facet.type.capitalize(),
                options: [
                    { value: 'No Filter', name: '', type: 'static' }
                ]
            }]
        };

        return sectionConfig;
    });

    var findSectionForColumn = function(column)
    {
        return _.detect(config.sections, function(section)
            {
                return section.tableColumnId == column.tableColumnId;
            });
    };

    var dataGotten = false, 
        aggregatedData = {};
    config.showCallback = function(sidebarObj, $pane)
    {
        if (!dataGotten)
        {
            dataGotten = true;
            sidebarObj.startProcessing();

            var facets = blist.display.view.metadata.facets;

            // get required aggregate/freq data from core server
            var cleanedData = blist.dataset.cleanViewForPost(
                $.extend({}, blist.display.view), true);
            var columnsToPush = [];

            _.each(facets, function(facet)
            {
                var column = blist.dataset.columnForTCID(cleanedData, facet.tableColumnId);

                if (facet.type == 'discrete') // CR: check for predef
                {
                    $.socrataServer.addRequest({
                        url: '/views/INLINE/rows.json?method=getSummary&limit=' +
                            facet.top + '&columnId=' + column.id,
                        type: 'POST',
                        data: JSON.stringify(cleanedData),
                        success: function(result)
                        {
                            aggregatedData[column.id] = result.columnSummaries[0].topFrequencies;
                        }
                    });
                }
                if ((facet.type == 'ranges') && !_.isArray(facet.ranges))
                {
                    columnsToPush.push(column);
                }
            });

            _.each(['maximum', 'minimum'], function(aggregateType)
            {
                $.socrataServer.addRequest({
                    url: '/views/INLINE/rows.json?method=getAggregates',
                    type: 'POST',
                    data: JSON.stringify($.extend({}, cleanedData, { columns:
                        _.map(columnsToPush, function(column)
                        {
                            return $.extend({}, column, { format: { aggregate: aggregateType } });
                        })})),
                    success: function(result)
                    {
                        _.each(result, function(summary)
                        {
                            aggregatedData[summary.columnId] = aggregatedData[summary.columnId] || {};
                            aggregatedData[summary.columnId][summary.name] = summary.value;
                        });
                    }
                });
            });

            // fire off req's and deal with rendering what we get back
            $.socrataServer.runRequests({
                success: function()
                {
                    // this runs after the individual handlers; they
                    // put together the data; this renders relevant ui.

                    _.each(facets, function(facet)
                    {
                        var column = blist.dataset.columnForTCID(blist.display.view, facet.tableColumnId);
                        var options = findSectionForColumn(column).fields[0].options;

                        if (facet.type == 'discrete')
                        {
                            if (_.isArray(facet.values))
                            {
                                _.each(facet.values, function(value)
                                {
                                    options.push({ value: value, type: 'static' });
                                });
                            }
                            else
                            {
                                _.each(aggregatedData[column.id], function(freq)
                                {
                                    options.push({ value: freq.value + ' <em>(' + freq.count + ')</em>',
                                        type: 'static' });
                                });
                            }
                        }
                        if (facet.type == 'ranges')
                        {
                            var renderedRanges = facet.ranges;
                            if (!_.isArray(renderedRanges))
                            {
                                // we don't have prespecified ranges; calculate
                                // from the data we got back
                                var min = parseFloat(aggregatedData[column.id]['minimum']);
                                var max = parseFloat(aggregatedData[column.id]['maximum']);
                                var range = max - min;
                                var buckets = facet.buckets * 1.0;
                                renderedRanges = [];

                                while (renderedRanges.length < buckets)
                                {
                                    // If the number is less than 4 digits, give 4 sig figs
                                    var exp = Math.pow(10, Math.max(Math.ceil(Math.log(Math.abs(min))) - 3, 0));
                                    renderedRanges.push(Math.round(min * exp) / exp);
                                    min += (range / buckets);
                                }
                                renderedRanges.push(max);
                            }

                            // okay, now render those ranges.
                            while (renderedRanges.length > 1)
                            {
                                options.push({ value: renderedRanges[0] + ' &mdash; ' +
                                    renderedRanges[1], type: 'static' });
                                    renderedRanges.shift();
                            }
                        }
                        if (facet.type == 'range')
                        {
                            if ((column.dataTypeName == 'calendar_date') ||
                                (column.dataTypeName == 'date'))
                            {
                                // date range picker here.
                            }
                            else
                            {
                                options.push({ type: 'group', options: [
                                    { type: 'text', prompt: 'Minimum', name: 'range_facet_min' },
                                    { type: 'static', value: ' &mdash; ' },
                                    { type: 'text', prompt: 'Maximum', name: 'range_facet_max' }
                                ]});
                            }
                        }
                    });

                    sidebarObj.finishProcessing();
                    sidebarObj.refresh($pane.name);
                }
            });
        }
    };

    $.gridSidebar.registerConfig(config);

})(jQuery);


/*{
    title: 'LOCATION', name: 'facet_LOCATION',
    fields: [{
        name: 'LOCATION',
        defaultValue: '',
        type: 'radioGroup',
        lineClass: 'noLabel',
        options: [
            { text: 'No Filter', value: '', type: 'static' },
            { text: 'V03 <em>(3159)</em>', value: 'V03', type: 'static' },
            { text: 'V02 <em>(3016)</em>', value: 'V02', type: 'static' },
            { text: 'V05 <em>(1782)</em>', value: 'V05', type: 'static' },
            { text: 'C05 <em>(1669)</em>', value: 'C05', type: 'static' },
            { text: 'C02 <em>(1597)</em>', value: 'C02', type: 'static' },
            { prompt: 'Other', value: '_other_', type: 'text' }
        ]
    }]
},
{
    title: 'DATE', name: 'facet_DATE',
    fields: [{
        text: 'From',
        name: 'DATE_from',
        defaultValue: '06/01/2010',
        type: 'text'
    },
    {
        text: 'To',
        name: 'DATE_to',
        defaultValue: '06/08/2010',
        type: 'text'
    }]
},
{
    title: 'SUBSTANCE', name: 'facet_SUBSTANCE',
    fields: [{
        name: 'SUBSTANCE',
        defaultValue: '',
        type: 'radioGroup',
        lineClass: 'noLabel',
        options: [
            { text: 'No Filter', value: '', type: 'static' },
            { text: 'PM 10 <em>(11399)</em>', value: 'V03', type: 'static' },
            { text: 'VOC <em>(6729)</em>', value: 'V02', type: 'static' },
            { text: 'H2S <em>(2741)</em>', value: 'V05', type: 'static' },
            { text: 'Particulates <em>(125)</em>', value: 'C05', type: 'static' }
        ]
    }]
},
{
    title: 'RESULTS', name: 'facet_RESULTS',
    fields: [{
        name: 'RESULTS',
        defaultValue: '',
        type: 'radioGroup',
        lineClass: 'noLabel',
        options: [
            { text: 'No Filter', value: '', type: 'static' },
            { text: '0 — 5', value: '0,5', type: 'static' },
            { text: '5 — 10', value: '5,10', type: 'static' },
            { text: '10 — 25', value: '10,25', type: 'static' },
            { text: '25 — 200', value: '25,200', type: 'static' },
            { text: '200 — 542.7', value: '200,542.7', type: 'static' }
        ]
    }]
}*/


/*
[
    { columnId: 334,
      type: 'discrete',
      top: 6 },
    { columnId: 335,
      type: 'range',
      defaultRange: [ 1279152519, 1279152527 ] },
    { columnId: 336,
      type: 'discrete',
      top: 5 },
    { columnId: 337,
      type: 'ranges',
      ranges: [0, 5, 25, 100, 550] }
]
*/