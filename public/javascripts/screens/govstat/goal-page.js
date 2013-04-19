(function($) { $(function() {

    var $container = $('.goalDescription');
    if ($container.height() > 600)
    { $container.columnize({ width: 400, lastNeverTallest: true }); }

    var govstatNS = blist.namespace.fetch('blist.govstat');

    var nextgen = blist.namespace.fetch('blist.nextgen');

    if (nextgen.leafChart === true)
    {
        var goal = new govstatNS.models.Goal({ id: $('.goalUid').text() });
        goal.fetch({
            success: function()
            {
                if (!prepareChart(goal, 0, $('.goalBox .chartArea .content-wrapper'), $('.titleContainer').css('border-color')))
                {
                    $('.goalBox .chartArea').remove();
                }
            },
            error: function()
            {
                $('.goalBox .chartArea').remove();
            }
        });
    }

    // main code for initializing and rendering a chart
    var prepareChart = function(goal, idx, $container, color)
    {
        // get our data
        var metric = goal.get('metrics').at(idx);
        if ($.isBlank(metric)) { return false; } // we don't have anything to show here

        var computedValues = metric.get('computed_values');
        if ($.isBlank(computedValues)) { return false; } // we still don't have anything to show

        var dataSeries = computedValues.values;
        var projectionSeries = computedValues.projected_values;

        if ($.isBlank(dataSeries)) { return false; } // stilllll nothing interesting to show.
        if ($.isBlank(projectionSeries)) { return false; } // and again.

        var projection = computedValues.projected_value;

        // time formats
        var timeParse = d3.time.format('%Y-%m-%dT%H:%M:%S.000').parse;
        var timeParseZ = d3.time.format('%Y-%m-%dT%H:%M:%S.000Z').parse; // ugh.
        var timeFormat = d3.time.format('%b %Y');
        _.each([ dataSeries, projectionSeries ], function(series)
        {
            _.each(series, function(point) { point.x = timeParse(point.x); });
        });

        var startDate = timeParseZ(goal.get('start_date'));
        var endDate = timeParseZ(goal.get('end_date'));

        // scales
        var xScale = d3.time.scale().domain([ startDate, endDate ]);

        var allYValues = _.pluck(dataSeries
                .concat(projectionSeries)
                .concat([ { y: computedValues.target_value } ]),
            'y');
        var yScale = d3.scale.linear().domain([ d3.min(allYValues), d3.max(allYValues) ]);
        var yScaleInv = yScale.copy();




        // d3/svg init
        var svg = d3.select($container.get(0)).append('svg:svg');
        var container = d3.select($container.get(0));

        // dataSeries area generator
        var dataSeriesArea = d3.svg.area()
            .interpolate('linear')
            .x(function(d) { return xScale(d.x); })
            .y0(function() { return $container.height(); })
            .y1(function(d) { return yScale(d.y); });

        svg.append('svg:path').attr('class', 'dataSeriesArea');

        var dataSeriesAreaPath = svg.select('path.dataSeriesArea');
        dataSeriesAreaPath.data([ dataSeries ]);
        if (color) { dataSeriesAreaPath.style('fill', color); };

        // dataSeries line generator
        var dataSeriesLine = d3.svg.line()
            .interpolate('linear')
            .x(function(d) { return xScale(d.x) })
            .y(function(d) { return yScale(d.y) });

        svg.append('svg:path').attr('class', 'dataSeriesLine');

        var dataSeriesLinePath = svg.select('path.dataSeriesLine');
        dataSeriesLinePath.data([ dataSeries ]);
        if (color) { dataSeriesLinePath.style('stroke', color); };

        // projection line shadow
        var projectionLineShadow = d3.svg.line()
            .interpolate('linear')
            .x(function(d) { return xScale(d.x) })
            .y(function(d) { return yScale(d.y) });

        svg.append('svg:path').attr('class', 'projectionLineShadow');

        var projectionLineShadowPath = svg.select('path.projectionLineShadow');
        projectionLineShadowPath.data([ projectionSeries ]);

        // projection line
        var projectionLine = d3.svg.line()
            .interpolate('linear')
            .x(function(d) { return xScale(d.x) })
            .y(function(d) { return yScale(d.y) });

        svg.append('svg:path').attr('class', 'projectionLine');

        var projectionLinePath = svg.select('path.projectionLine');
        projectionLinePath.data([ projectionSeries ]);
        projectionLinePath.classed('progress-' + (computedValues.progress || 'none'), true);

        // meter
        var computeProgress;
        if (metric.get('comparison_function') == '>')
        {
            $container.find('.meter')
                .find('.rangeTop').addClass('progress-good').end()
                .find('.rangeBottom').addClass('progress-bad').end();
            computeProgress = function(val) { return val > computedValues.target_value ? 'good' : 'bad'; };
        }
        else
        {
            $container.find('.meter')
                .find('.rangeTop').addClass('progress-bad').end()
                .find('.rangeBottom').addClass('progress-good').end();
            computeProgress = function(val) { return val < computedValues.target_value ? 'good' : 'bad'; };
        }




        // for some reason i keep needing the last elem
        var last = function(arr)
        {
            return arr[arr.length - 1];
        }

        // process date ticks
        var minDist = 40;
        var processXTicks = function(proposed, scale)
        {
            // weed out subsequent ticks that are same-month
            var ticks = [ startDate ]; // we definitely want the start date tick
            _.each(proposed, function(tick, i)
            {
                var lastTick = last(ticks);
                if (((tick.getMonth() !== lastTick.getMonth())
                        || (tick.getFullYear() !== lastTick.getFullYear()))
                    && (scale(tick) - scale(lastTick) > minDist))
                {
                    ticks.push(tick);
                }
            });

            // we definitely want the last tick. purge from before if necessary.
            if (scale(endDate) - scale(last(ticks)) < minDist)
            {
                ticks.pop();
            }

            // now add the last tick.
            ticks.push(endDate);

            return ticks;
        };

        // actual render
        var render = function()
        {
            // plot areas
            var width = $container.width();
            var height = $container.height();

            // update scales
            xScale.range([ 0, width ]);
            yScale.range([ height - 10, 10 ]);
            yScaleInv.range([ 10, height - 10 ]);

            // render !

            // dataSeries
            svg.select('path.dataSeriesArea').attr('d', dataSeriesArea);
            svg.select('path.dataSeriesLine').attr('d', dataSeriesLine);

            // dataSeries buffers
            $container.find('.dataSeriesLeftBuffer')
                .css('width', xScale(dataSeries[0].x))
                .css('height', height - yScale(dataSeries[0].y));
            $container.find('.dataSeriesRightBuffer')
                .css('width', width - xScale(last(dataSeries).x))
                .css('height', yScaleInv(last(dataSeries).y));

            // projectionSeries
            svg.select('path.projectionLineShadow').attr('d', projectionLineShadow);
            svg.select('path.projectionLine').attr('d', projectionLine);

            // y ticks
            var yTicks = yScale.ticks(height / 50);
            container.selectAll('.yTick')
                .data(yTicks)
                .enter().append('div')
                    .classed('yTick', true)
                    .style('top', function(d) { return yScale(d) + 'px'; })
                    .append('div')
                        .classed('bubble', true)
                        .text(function(d) { return $.commaify(d); })
                        .append('div')
                            .classed('tip', true);

            // x ticks
            var xTicks = processXTicks(xScale.ticks(width / 150), xScale);
            xTicks.push(timeParseZ(goal.get('end_date'))); // always render end date
            var xTickDivs = container.selectAll('.xTick')
                .data(xTicks);
            xTickDivs
                .enter().append('div')
                    .classed('xTick', true)
                    .classed('bubble', true)
                    .text(function(d) { return timeFormat(d); })
                    .append('div')
                        .classed('tip', true);
            xTickDivs
                    .style('left', function(d) { return xScale(d) + 'px'; });

            // meter
            $container.find('.meter')
                .find('.rangeTop').css('height', yScale(computedValues.target_value)).end()
                .find('.rangeBottom').css('height', yScaleInv(computedValues.target_value));

            // projection marker
            $container.find('.projectionMarker')
                .addClass('progress-' + (computedValues.progress || 'none'))
                .css('top', yScale(last(projectionSeries).y));

            // current marker
            $container.find('.currentMarker')
                .addClass('progress-' + computeProgress(last(dataSeries).y))
                .css('top', yScale(last(dataSeries).y));

            // target marker
            $container.find('.targetMarker')
                .css('top', yScale(computedValues.target_value));

            // no tip, do you eat em?
            $container.find('.nowTip')
                .css('left', xScale(last(dataSeries).x));
        };

        render();
        $(window).on('resize', render);

        return true;
    };

}) })(jQuery);

