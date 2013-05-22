// future improvements:
// * make chartArea margins more like named filters rather than depending on css
// * make d3 element rendering more like composing functions; create an object that contains
//   the create/update/remove components of a selection, have a small army of functions that
//   operate on those objects. Makes the different kinds of rerenders less stupid to manage.
// * kill seriesgrouping and remove its weird timing and oo injection hacks
// * possible major perf boost out of moving bar rendering back into an html div-based solution.
//   i tried to do this at one point but ran into z-index issues with error markers. now that
//   there is the canonical chartRenderArea to render html components in, it should be possible
//   to try it again.
// * if ie8 support is ever dropped, i had a working prototype with absolutely no svg at all;
//   just use css rotation for the text labels. you can wrangle divs into being value markers too.

(function($)
{

var d3ns = blist.namespace.fetch('blist.d3');

$.Control.registerMixin('d3_impl_bar', {

    defaults: {
        barWidthBounds: [ 20, 200 ], // width of the bar, of course
        barSpacingBounds: [ 0, 20 ], // within row (between series) spacing
        rowSpacingBounds: [ 30, 100 ], // between row spacing
        sidePaddingBounds: [ 20, 200 ], // sides of window
        rowBuffer: 30, // additional rows to fetch on either side of the actual visible area
        valueLabelBuffer: 100, // amount of room to leave for each row' label
        dataMaxBuffer: 30, // amount of room to leave in actual chart area past the max bar
        smallModeThreshold: 400 // Height below which small mode is triggered.
    },

    // call this if the active set of data has changed
    _renderData: function(data)
    {
        var vizObj = this,
            cc = vizObj._chartConfig,
            defaults = vizObj.defaults,
            valueColumns = vizObj.getValueColumns(),
            $chartArea = cc.$chartArea,
            view = vizObj._primaryView;

        // figure out how far out our value axis line is
        var yAxisPos = vizObj._yAxisPos();

        // set up our scales. oldYScale is used to init bars so they appear
        // in the old spot and transitions are less jarring.
        var newYScale = vizObj._currentYScale();
        var oldYScale = cc.yScale || newYScale;

        // render our bars per series
        _.each(valueColumns, function(colDef, seriesIndex)
        {
            var col = colDef.column;

            // figure out what data we can actually render
            var splitData = _.groupBy(data, function(row)
            {
                if ($.isBlank(row[col.lookup]) ||
                    row.invalid[col.lookup])
                {
                    return 'null';
                }
                else
                {
                    return 'present';
                }
            });
            var presentData = splitData['present'] || [], nullData = splitData['null'] || [];

            // render our actual bars
            var seriesClass = 'dataBar_series' + col.lookup;

            // UPDATE
            var bars = cc.chartD3.selectAll('.' + seriesClass)
                .data(presentData, function(row) { return row.id; });

            // ENTER
            bars
                .enter().append('rect')
                    .classed('dataBar', true)
                    .classed(seriesClass, true)
                    .attr('stroke', '#fff')
                    .attr(cc.dataDim.width, cc.barWidth)
                    .attr(cc.dataDim.height, vizObj._yBarHeight(col.lookup, oldYScale))

                    .each(function() { this.__dataColumn = col; })

                    // don't mousey on dragging because event/renderspam breaks charts
                    // check for d because sometimes there's a race condition between unbind and remove
                    .on('mouseover', function(d)
                    {
                        if (d && !cc._isDragging)
                        {
                            vizObj.handleMouseOver(this, colDef, d, vizObj._currentYScale());
                        }
                    })
                    .on('mouseout', function(d)
                    {
                        // for perf, only call unhighlight if highlighted.
                        if (d && !cc._isDragging && view.highlights && view.highlights[d.id])
                        {
                            vizObj.handleMouseOut(this, colDef, d, vizObj._currentYScale());
                        }
                    })
                    .on('click', function(d)
                    {
                        if ($.isBlank(d)) { return; }
                        if ($.subKeyDefined(vizObj._primaryView, 'highlightTypes.select.' + d.id))
                        {
                            vizObj._primaryView.unhighlightRows(d, 'select');
                            vizObj.$dom().trigger('display_row', [{row: null}]);
                        }
                        else
                        {
                            vizObj._primaryView.highlightRows(d, 'select',  col);
                            vizObj.$dom().trigger('display_row', [{row: d}]);
                        }
                    });

            // ENTER + UPDATE
            bars
                    .attr('fill', vizObj._d3_colorizeRow(colDef))

                    // D3 won't re-execute these dynamic property values when
                    // our internal state changes, so we must re-set them here
                    // (as opposed to on enter only).
                    .attr(cc.dataDim.xAxis, vizObj._xBarPosition(seriesIndex))
                    .attr(cc.dataDim.yAxis, vizObj._yBarPosition(col.lookup, oldYScale))
                    .attr('fill', function(d) { return d.color || colDef.color; })

                    .each(function(d)
                    {
                        // kill tip if not highlighted. need to check here because
                        // unhighlight gets spammed when the grid gets stuck in weird
                        // states (really a grid bug workaround)
                        if (this.tip && (!view.highlights || !view.highlights[d.id]))
                        {
                            this.tip.destroy();
                            delete this.tip;
                        }
                    })
                .transition()
                    .duration(1000)
                    .attr(cc.dataDim.yAxis, vizObj._yBarPosition(col.lookup, newYScale))
                    .attr(cc.dataDim.height, vizObj._yBarHeight(col.lookup, newYScale));

            // EXIT
            bars
                .exit()
                    .each(function(d)
                    {
                        if (this.tip)
                        {
                            this.tip.destroy();
                            delete this.tip;
                        }
                    })
                // need to call transition() here as it accounts for the animation ticks;
                // otherwise you get npe's
                .transition()
                    .remove();

            // render null bars
            var nullSeriesClass = 'nullDataBar_series' + col.lookup;
            var nullBars = cc.chartHtmlD3.selectAll('.' + nullSeriesClass)
                .data(nullData, function(row) { return row.id; });
            var height = cc.dataDim.pluckY(vizObj._d3_px(cc.chartWidth - yAxisPos),
                                           vizObj._d3_px(yAxisPos));
            var position = cc.dataDim.pluckX(0,
                                             vizObj._d3_px(yAxisPos));
            nullBars
                .enter().append('div')
                    .classed('nullDataBar', true)
                    .classed(nullSeriesClass, true)
                    .style(cc.dataDim.pluckY('left', 'top'), position)
                    .style(cc.dataDim.width, vizObj._d3_px(cc.barWidth));
            nullBars
                    .style(cc.dataDim.position, vizObj._d3_px(vizObj._xBarPosition(seriesIndex)))
                    .style(cc.dataDim.pluckY('left', 'top'), position)
                    .style(cc.dataDim.height, height);
            nullBars
                .exit()
                    .remove();
        });

        // render our labels per row
        // 3.5 is a somewhat arbitrary number to bring the label's center rather than
        // baseline closer to the row's center
        var rowLabels = cc.chartD3.selectAll('.rowLabel')
            .data(data, function(row) { return row.id; });
        rowLabels
            .enter().append('text')
                .classed('rowLabel', true)
                .attr({ x: 0,
                        y: 0,
                        'text-anchor': cc.orientation == 'right' ? 'start' : 'end',
                        'font-size': 13 });
        rowLabels
                // TODO: make a transform-builder rather than doing this concat
                // 10 is to bump the text off from the actual axis
                .attr('transform', vizObj._labelTransform())
                .attr('font-weight', function(d)
                        { return (view.highlights && view.highlights[d.id]) ? 'bold' : 'normal'; })
                .text(function(d)
                {
                    var fixedColumn = vizObj._fixedColumns[0]; // WHY IS THIS AN ARRAY
                    // render plaintext representation of the data
                    return fixedColumn.renderType.renderer(d[fixedColumn.lookup], fixedColumn, true, null, null, true);
                });
        rowLabels
            .exit()
            .transition()
                .remove();

        // render error markers if applicable
        if ($.subKeyDefined(vizObj, '_displayFormat.plot.errorBarLow'))
        {
            var errorMarkers = cc.chartD3.selectAll('.errorMarker')
                .data(data, function(row) { return row.id; });
            errorMarkers
                .enter().append('path')
                    .classed('errorMarker', true)
                    .attr({ stroke: vizObj._displayFormat.errorBarColor,
                            'stroke-width': '3' })
                    .attr('d', vizObj._errorBarPath(oldYScale));
            errorMarkers
                .attr('transform', vizObj._errorBarTransform())
                .transition()
                    .duration(1000)
                    .attr('d', vizObj._errorBarPath(newYScale));
            errorMarkers
                .exit()
                    .remove();
        }

        vizObj._renderTicks(oldYScale, newYScale, true);
        vizObj._renderValueMarkers(oldYScale, newYScale, true);

        // save off our yScale
        cc.yScale = newYScale;
    },

    // call this if the yAxisPos has changed
    // you'll also need to call _renderData to make the dataBars the correct height
    _rerenderAxis: function()
    {
        var vizObj = this,
            cc = vizObj._chartConfig,
            data = cc.currentData,
            yScale = vizObj._currentYScale(),
            yAxisPos = vizObj._yAxisPos();

        cc.chartD3.selectAll('.dataBar')
            .transition()
                .duration(1000)
                .attr(cc.dataDim.yAxis, vizObj._yBarPosition(function() { return this.__dataColumn.lookup; }, yScale))
                .attr(cc.dataDim.height, vizObj._yBarHeight(function() { return this.__dataColumn.lookup; }, yScale));

        cc.chartD3.selectAll('.rowLabel')
                .attr('transform', vizObj._labelTransform());

        cc.chartHtmlD3.selectAll('.nullDataBar')
            .style(cc.dataDim.height, vizObj._d3_px(yAxisPos));

        vizObj._renderTicks(yScale, yScale, false);
        vizObj._renderValueMarkers(yScale, yScale, false);
    },

    // call this if spacings/widths changed
    _rerenderPositions: function()
    {
        var vizObj = this,
            cc = vizObj._chartConfig,
            valueColumns = vizObj.getValueColumns(),
            yAxisPos = vizObj._yAxisPos();

        // render our bars per series
        _.each(valueColumns, function(colDef, seriesIndex)
        {
            var dataBars = cc.chartD3.selectAll('.dataBar_series' + colDef.column.lookup)
                    .attr(cc.dataDim.width, cc.barWidth)
                    .attr(cc.dataDim.xAxis, vizObj._xBarPosition(seriesIndex));

            cc.chartHtmlD3.selectAll('.nullDataBar_series' + colDef.column.lookup)
                    .style(cc.dataDim.width, vizObj._d3_px(cc.barWidth))
                    .style(cc.dataDim.xAxis, vizObj._d3_px(vizObj._xBarPosition(seriesIndex)));
        });
        cc.chartD3.selectAll('.rowLabel')
                .attr('transform', vizObj._labelTransform());
    }

}, null, 'socrataChart', [ 'd3_virt_scrolling', 'd3_base', 'd3_base_dynamic', 'd3_base_legend' ]);

})(jQuery);
