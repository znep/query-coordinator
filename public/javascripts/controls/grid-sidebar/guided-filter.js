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
            tableColumnId: facet.tableColumnId
        };

        if (facet.multiSelect === true)
        {
            sectionConfig.fields = [];
        }
        else
        {
            sectionConfig.fields = [{
                name: column.name,
                defaultValue: '',
                type: 'radioGroup',
                lineClass: 'noLabel facetFilterRow facet' + facet.type.capitalize(),
                options: [
                    { value: 'No Filter', name: '', type: 'static', data: { facetClear: 'true' } }
                ]
            }];
        }

        return sectionConfig;
    });

    var originalFilter = (blist.display.view.query || {}).filterCondition,
        facetedFilters = {};
    var mergeAndPostFilter = function(dsGrid)
    {
        if (_.isEmpty(facetedFilters))
        {
            dsGrid.updateFilter(originalFilter, false, false);
        }
        else
        {
            var filterChildren = [];
            _.each(_.values(facetedFilters), function(filterCondition)
            {
                if (_.isArray(filterCondition) && (filterCondition.length > 0))
                {
                    filterChildren.push({
                        type: 'operator',
                        value: 'OR',
                        children: filterCondition
                    });
                }
                else
                {
                    filterChildren.push(filterCondition);
                }
            });

            var mergedFilter = {
                type: 'operator',
                value: 'AND',
                children: _.compact(filterChildren.concat(originalFilter))
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
            var $dataTarget;

            var $fieldLine = $field.closest('.radioLine');
            if ($fieldLine.length === 0)
            {
                $dataTarget = $field.closest('.line').find(':checkbox');
            }
            else
            {
                $dataTarget = $fieldLine.children('label');
                if ($fieldLine.is('.static'))
                {
                    $dataTarget = $dataTarget.children('span');
                }
                else if ($fieldLine.is('.text'))
                {
                    $dataTarget = $dataTarget.children('input[type=text]');
                }
            }

            if (!$.isBlank($fieldLine.find('> label > span').attr('data-custom-facetClear')))
            {
                delete facetedFilters[column.tableColumnId];
            }
            else
            {
                callback($dataTarget, event);
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

            sidebarObj.$grid().bind('clear_temp_view', function()
            {
                // I have NO idea why this works to reset the values
                $pane.find(':radio').remove();

                facetedFilters = {};
            });

            var facets = blist.display.view.metadata.facets;

            // get required aggregate/freq data from core server
            var cleanedData = blist.dataset.cleanViewForPost(
                $.extend(true, {}, blist.display.view), true);
            var columnsToPush = [];

            _.each(facets, function(facet)
            {
                var column = blist.dataset.columnForTCID(cleanedData, facet.tableColumnId);

                if ((facet.type == 'discrete') && !_.isArray(facet.values))
                {
                    $.socrataServer.addRequest({
                        url: '/views/INLINE/rows.json?method=getSummary&limit=' +
                            facet.top + '&columnId=' + column.id,
                        type: 'POST',
                        data: JSON.stringify($.extend(true, {}, cleanedData, {query: {}})),
                        success: function(result)
                        {
                            aggregatedData[column.id] = result.columnSummaries[0].topFrequencies;
                        }
                    });
                }
                if (((facet.type == 'ranges') && !_.isArray(facet.ranges))/* ||
                    TEMPORARY HACK: Why does calendar_date not support min/max?
                    ((facet.type == 'dateRanges') && !_.isArray(facet.ranges))*/)
                {
                    columnsToPush.push(column);
                }
            });

            _.each(['maximum', 'minimum'], function(aggregateType)
            {
                $.socrataServer.addRequest({
                    url: '/views/INLINE/rows.json?method=getAggregates',
                    type: 'POST',
                    data: JSON.stringify($.extend({}, $.extend(true, {}, cleanedData, {query: {}}),
                        { columns:
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
                        var fields = findSectionForColumn(column).fields;
                        var field = fields[0];

                        var fieldTarget = (facet.multiSelect === true) ? fields : field.options;
                        var fieldType = (facet.multiSelect === true) ? 'checkbox' : 'static';

                        if (facet.type == 'discrete')
                        {
                            // render
                            if (_.isArray(facet.values))
                            {
                                _.each(facet.values, function(value)
                                {
                                    fieldTarget.push({
                                        value: value, type: fieldType, text: value,
                                        data: { facetValue: value }, inputFirst: true
                                    });
                                });
                            }
                            else
                            {
                                _.each(aggregatedData[column.id], function(freq)
                                {
                                    var labelText = formatForColumn(freq.value, column) +
                                        ' <em>(' + freq.count + ')</em>';
                                    fieldTarget.push({ value: labelText, text: labelText,
                                        type: fieldType, data: { facetValue: freq.value },
                                        inputFirst: true });
                                });
                            }

                            // events
                            var changeHandler = changeProxy(sidebarObj, column, function($dataTarget, event)
                            {
                                var selectedValue;
                                if ($dataTarget.is('input[type=text]'))
                                {
                                    selectedValue = $dataTarget.val();
                                }
                                else
                                {
                                    selectedValue = $dataTarget.attr('data-custom-facetValue');
                                }

                                var filterCondition = {
                                    type: 'operator',
                                    value: 'EQUALS',
                                    children: [
                                      { columnId: column.id,
                                        type: 'column' },
                                      { value: selectedValue,
                                        type: 'literal' } ]
                                };

                                if (facet.multiSelect)
                                {
                                    var filterArray =
                                        facetedFilters[column.tableColumnId] =
                                        facetedFilters[column.tableColumnId] || [];

                                    if ($dataTarget.is(':checked'))
                                    {
                                        filterArray.push(filterCondition);
                                    }
                                    else
                                    {
                                        // dig into the array to find the one we want
                                        for (var i = 0; i < filterArray.length; i++)
                                        {
                                            if (_.any(filterArray[i].children, function(child) {
                                                return (child.value == selectedValue) && (child.type == 'literal');
                                            }))
                                            {
                                                filterArray.splice(i, 1);
                                                break;
                                            }
                                        }
                                    }
                                }
                                else
                                {
                                    facetedFilters[column.tableColumnId] = filterCondition;
                                }
                            });

                            // will only be one field for single-select, but
                            // many for multi-select
                            _.each(fields, function(field)
                            {
                                field.change = changeHandler;
                            });

                            if (facet.includeOther === true)
                            {
                                fieldTarget.push({ type: 'text', prompt: 'Other...', name: 'facet_other',
                                    change: field.change });
                            }
                        }
                        else if ((facet.type == 'ranges') || (facet.type == 'dateRanges'))
                        {
                            // render
                            var renderedRanges = facet.ranges;
                            if (!_.isArray(renderedRanges))
                            {
                                // date ranges are slightly special, but a
                                // lot of it carries over.
                                if (facet.type == 'ranges')
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
                                else if (facet.type == 'dateRanges')
                                {
                                    /*var min = parseInt(aggregatedData[column.id]['minimum']);
                                    var max = parseInt(aggregatedData[column.id]['maximum']);
                                    TEMPORARY HACK: Why does calendar_date not support min/max?*/
                                    var min = Date.parse(facet.dateMin) / 1000;
                                    var max = Date.parse(facet.dateMax) / 1000;

                                    var minDate = new Date(min * 1000);
                                    var maxDate = new Date(max * 1000);

                                    // Round to extremes of scale zone; figure out
                                    // unit size.
                                    var unitSize = 1;
                                    switch (facet.dateRangeScale)
                                    {
                                        case 'decades':
                                            minDate.setYear(minDate.getYear() / 10 * 10);
                                            maxDate.setYear(maxDate.getYear() / 10 * 10 + 9);
                                            unitSize *= 10;
                                        case 'years':
                                            minDate.setMonth(0);
                                            maxDate.setMonth(11);
                                            unitSize *= 365;
                                        case 'months':
                                            minDate.setDate(1);
                                            // This will round to the first day of next month
                                            // in the worst case scenario
                                            maxDate.setDate(31);
                                            // account for unitSize specially in a bit
                                        case 'days':
                                            minDate.setHours(0);
                                            maxDate.setHours(23);
                                            unitSize *= 24;
                                        default:
                                            minDate.setMinutes(0);
                                            maxDate.setMinutes(59);
                                            unitSize *= 60;

                                            minDate.setSeconds(0)
                                            maxDate.setSeconds(59);
                                            unitSize *= 60;
                                    }
                                    if (facet.dateRangeScale == 'months')
                                    {
                                        // set this to 30 and hope it's all double rainbow in the end
                                        unitSize *= 30;
                                    }

                                    // Figure out bucket size
                                    var bucketSize = Math.ceil(
                                        ((max - min) / unitSize) / facet.buckets) * unitSize;

                                    // Aggregate points
                                    renderedRanges = [];
                                    var oneDay = 60 * 60 * 24;
                                    while (min < max)
                                    {
                                        renderedRanges.push(min);
                                        min += bucketSize + oneDay;
                                    }
                                    renderedRanges.push(max);
                                }
                            }

                            // okay, now render those ranges.
                            while (renderedRanges.length > 1)
                            {
                                var labelText = formatForColumn(renderedRanges[0], column) +
                                    ' &mdash; ' + formatForColumn(renderedRanges[1], column);
                                fieldTarget.push({ value: labelText, text: labelText,
                                    type: fieldType, data: { facetRangeMin: renderedRanges[0],
                                    facetRangeMax: renderedRanges[1] }, inputFirst: true });
                                renderedRanges.shift();
                            }

                            // events
                            var changeHandler = changeProxy(sidebarObj, column, function($dataTarget, event)
                            {
                                var selectedMinValue = $dataTarget.attr('data-custom-facetRangeMin');
                                var selectedMaxValue = $dataTarget.attr('data-custom-facetRangeMax');

                                var filterCondition =
                                    { type: 'operator',
                                      value: 'AND',
                                      children: [
                                        { type: 'operator',
                                          value: 'GREATER_THAN_OR_EQUALS',
                                          children: [
                                            { columnId: column.id,
                                              type: 'column' },
                                            { value: selectedMinValue,
                                              type: 'literal' } ]
                                        },
                                        { type: 'operator',
                                          value: 'LESS_THAN_OR_EQUALS',
                                          children: [
                                            { columnId: column.id,
                                              type: 'column' },
                                            { value: selectedMaxValue,
                                              type: 'literal' } ]
                                        }
                                      ] };

                                if (facet.multiSelect)
                                {
                                    var filterArray =
                                        facetedFilters[column.tableColumnId] =
                                        facetedFilters[column.tableColumnId] || [];

                                    if ($dataTarget.is(':checked'))
                                    {
                                        filterArray.push(filterCondition);
                                    }
                                    else
                                    {
                                        // dig into the array to find the one we want
                                        for (var i = 0; i < filterArray.length; i++)
                                        {
                                            if(_.all(filterArray[i].children, function(subCondition)
                                            {
                                                var compareValue = (subCondition.value == 'GREATER_THAN_OR_EQUALS') ?
                                                    selectedMinValue : selectedMaxValue;

                                                return _.any(subCondition.children, function(child)
                                                {
                                                    return (child.value == compareValue) && (child.type == 'literal');
                                                });
                                            }))
                                            {
                                                filterArray.splice(i, 1);
                                                break;
                                            }
                                        }
                                    }
                                }
                                else
                                {
                                    facetedFilters[column.tableColumnId] = filterCondition;
                                }
                            });

                            _.each(fields, function(field)
                            {
                                field.change = changeHandler;
                            });
                        }
                    });

                    sidebarObj.finishProcessing();
                    sidebarObj.refresh(configName);
                }
            });
        }
    };

    $.gridSidebar.registerConfig(config);

})(jQuery);
