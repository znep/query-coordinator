(function($)
{
    if (_.isUndefined(blist.display.view.metadata) ||
        _.isUndefined(blist.display.view.metadata.facets)) { return; }

    var configName = 'filter.guidedFilter';
    var config = {
        name: configName,
        priority: 1,
        title: 'Guided Filter',
        subtitle: 'If you want to explore this dataset, but aren\'t entirely ' +
            'certain what you\'re looking for, you can use the Guided ' +
            'Filter to help find interesting trends',
        onlyIf: function(view)
        {
            // disallow groupbys
            return (_.isUndefined(view.query) || _.isUndefined(view.query.groupBys));
        },
        disabledSubtitle: 'Grouped views cannot be used with the guided filter.',
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
                    { value: 'No Filter', name: '', type: 'static', data: { facetClear: 'true' } }
                ]
            }]
        };

        return sectionConfig;
    });

    var originalFilter = (blist.display.view.query || {}).filterCondition,
        facetedFilters = {};
    var mergeAndPostFilter = function(dsGrid)
    {
        if (_.isEmpty(facetedFilters))
        {
            dsGrid.clearTempView();
        }
        else
        {
            var mergedFilter = {
                type: 'operator',
                value: 'AND',
                children: _.compact(_.values(facetedFilters).concat(originalFilter))
            };

            dsGrid.updateFilter(mergedFilter, false, false);
        }
    };

    var findSectionForColumn = function(column)
    {
        return _.detect(config.sections, function(section)
            {
                return section.tableColumnId == column.tableColumnId;
            });
    };

    var formatForColumn = function(value, column)
    {
        return blist.data.types[column.renderTypeName].filterRender(value, column);
    };

    var changeProxy = function(sidebarObj, column, callback)
    {
        return function($field, event)
        {
            var $fieldLabel = $field.closest('.radioLine')
                                    .children('label');
            if (!$.isBlank($fieldLabel.children('span').attr('data-custom-facetClear')))
            {
                delete facetedFilters[column.tableColumnId];
            }
            else
            {
                callback($fieldLabel, event);
            }
            mergeAndPostFilter(sidebarObj.$grid().datasetGrid());
            
        }
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
                $.extend(true, {}, blist.display.view), true);
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
                    // put together the data; this renders relevant ui
                    // and wires up the events.

                    _.each(facets, function(facet)
                    {
                        var column = blist.dataset.columnForTCID(blist.display.view, facet.tableColumnId);
                        var field = findSectionForColumn(column).fields[0];
                        var options = field.options;

                        if (facet.type == 'discrete')
                        {
                            // render
                            if (_.isArray(facet.values))
                            {
                                _.each(facet.values, function(value)
                                {
                                    options.push({ value: value, type: 'static', data: {
                                        facetValue: value } });
                                });
                            }
                            else
                            {
                                _.each(aggregatedData[column.id], function(freq)
                                {
                                    options.push({ value: formatForColumn(freq.value, column) +
                                        ' <em>(' + freq.count + ')</em>', type: 'static',
                                        data: { facetValue: freq.value } });
                                });
                            }

                            // events
                            field.change = changeProxy(sidebarObj, column, function($fieldLabel, event)
                            {
                                facetedFilters[column.tableColumnId] =
                                    { type: 'operator',
                                      value: 'EQUALS',
                                      children: [
                                        { columnId: column.id,
                                          type: 'column' },
                                        { value: $fieldLabel.children('span')
                                                            .attr('data-custom-facetValue'),
                                          type: 'literal' } ]
                                    };
                            });
                        }
                        else if (facet.type == 'ranges')
                        {
                            // render
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
                                    var exp = (min > 999) ? 1 : Math.pow(10, Math.ceil(Math.log(Math.abs(min))) - 3);
                                    renderedRanges.push(Math.round(min * exp) / exp);
                                    min += (range / buckets);
                                }
                                renderedRanges.push(max);
                            }

                            // okay, now render those ranges.
                            while (renderedRanges.length > 1)
                            {
                                options.push({ value: formatForColumn(renderedRanges[0], column) +
                                    ' &mdash; ' + formatForColumn(renderedRanges[1], column),
                                    type: 'static', data: { facetRangeMin: renderedRanges[0],
                                    facetRangeMax: renderedRanges[1] } });
                                renderedRanges.shift();
                            }

                            // events
                            field.change = changeProxy(sidebarObj, column, function($fieldLabel, event)
                            {
                                var $span = $fieldLabel.children('span');
                                facetedFilters[column.tableColumnId] =
                                    { type: 'operator',
                                      value: 'AND',
                                      children: [
                                        { type: 'operator',
                                          value: 'GREATER_THAN_OR_EQUALS',
                                          children: [
                                            { columnId: column.id,
                                              type: 'column' },
                                            { value: $fieldLabel.children('span')
                                                                .attr('data-custom-facetRangeMin'),
                                              type: 'literal' } ]
                                        },
                                        { type: 'operator',
                                          value: 'LESS_THAN_OR_EQUALS',
                                          children: [
                                            { columnId: column.id,
                                              type: 'column' },
                                            { value: $fieldLabel.children('span')
                                                                .attr('data-custom-facetRangeMax'),
                                              type: 'literal' } ]
                                        }
                                      ] };
                            });
                        }
                        else if (facet.type == 'range')
                        {
                            // render
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
                                    { type: 'text', prompt: 'Maximum', name: 'range_facet_max',
                                      data: {test: 'aoeu'}, change: function() { alert('aoeu'); }}
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
