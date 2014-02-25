(function($)
{

var d3ns = blist.namespace.fetch('blist.d3');

$.Control.registerMixin('d3_impl_timeline', {

    // It's probably worth forcing a sort on cc.fixedColumn
    columnsLoaded: function() {
        this._super.apply(this, arguments);
        this._chartConfig.fixedColumn = this._fixedColumns[0];
    },

    _lineType: function()
    { return 'line'; },

    // The purpose of cc.dateScale is to allow us to convert between row index and date.
    // Suddenly, a wild numeric x-axis appears!
    _interpolateMissingDates: function(data)
    {
        if (_.isEmpty(data)) { return; }

        var vizObj = this,
            cc = vizObj._chartConfig,
            allDates = _.map($.deepPluck(data, 'data.' + cc.fixedColumn.lookup), function(date)
                { return _.isNumber(date) ? new Date(date * 1000) : Date.parse(date); }),
            extent = d3.extent(allDates);

        var sortFunc = function(a, b) { return a.isBefore(b); };
        var moments = _.map(allDates, function(date) { return moment(date); }).sort(sortFunc),
            durations = _(_.range(0, allDates.length-1, 1)).chain()
                        .map(function(i) { return moments[i+1].diff(moments[i]); })
                        .groupBy(_.identity).value(),
            inaccuracyIndex = _.size(durations) / _.size(data),
            guesstimatedTotalRows;

        // Guessing the increment basically failed. 60% inaccuracy comes out of thin air.
        // I'd be willing to drop this down to 20% or even 10%. It's arbitrary. -- michael.chui
        if (inaccuracyIndex > 0.60)
        {
            guesstimatedTotalRows = _.size(data);
        }
        else
        {
            var mostLikelyIncrement = _.max(durations, function(ary) { return ary.length; })[0];
            guesstimatedTotalRows = (extent[1] - extent[0])/Math.abs(mostLikelyIncrement);
        }

        if (vizObj.debugEnabled)
        {
            vizObj.debugOut('unique durations:', _.size(durations), 'inaccuracy:', inaccuracyIndex);
            vizObj.debugOut('mli:', mostLikelyIncrement);
        }

        var lowestIndex = _.min(_.pluck(data, 'index'));

        if (!cc.dateScale)
        { cc.dateScale = d3.time.scale(); }

        // It is almost certainly worth calling nice() this.
        cc.dateScale = cc.dateScale
                         .domain(extent)
                         .range([ lowestIndex, lowestIndex + guesstimatedTotalRows ]);
    
        if (vizObj.debugEnabled)
        { vizObj.debugOut('dateScale:', cc.dateScale.domain(), cc.dateScale.range()); }
    },

    _renderData: function(data)
    {
        this._interpolateMissingDates(data);
        return this._super.apply(this, arguments);
    },

    _numVisibleRows: function()
    {
        if (!this._chartConfig.dateScale) { return; }
        var range = this._chartConfig.dateScale.range();
        return range[1] - range[0] + 1;
    },

    getTotalRows: function()
    {
        return d3.max([this._numVisibleRows(), this._super()]);
    },

    getRenderRange: function()
    {
        //return this._super.apply(this, arguments);
        var vizObj = this,
            cc = vizObj._chartConfig;

        var range = vizObj._super.apply(vizObj, arguments);
        if (!cc.dateScale) { return range; }

        range.start = Math.max(Math.floor(vizObj._indexFromXPos(cc.scrollPos)), 0);
        if (vizObj.debugEnabled)
        { vizObj.debugOut('index:', range.start, 'date:', cc.dateScale.invert(range.start)); }
        return range;
    },

    _xDatumPosition: function()
    {
        var vizObj = this,
            cc = this._chartConfig;

        var staticParts = cc.sidePadding - 0.5 - cc.drawElementPosition - cc.dataOffset
                          + (cc.barWidth / 2);

        return function(d)
        {
            if (!vizObj._chartInitialized) { return 0; }
            var xValue = d.data ? cc.dateScale(Date.parse(d.data[cc.fixedColumn.lookup]))
                                : d.index;
            return staticParts + (xValue * cc.rowWidth);
        };
    },

    _indexFromXPos: function(xPos)
    {
        var vizObj = this,
            cc = this._chartConfig;

        var staticParts = cc.sidePadding - 0.5 - cc.drawElementPosition - cc.dataOffset
                          + (cc.barWidth / 2);

        return (xPos - staticParts) / cc.rowWidth;
    },

    _renderRowLabels: function(data)
    {
        var vizObj = this,
            cc = vizObj._chartConfig;

        var chartWidth = cc.$chartContainer.width(),
            idealTicks = d3.min([
                vizObj._numVisibleRows(),
                chartWidth /
                    (vizObj._fontMetricsForRowLabels().heightForString('0') / 0.965), // cos 50
                chartWidth / (cc.rowWidth + cc.rowSpacing)
            ]);

        var labels = cc.dateScale.ticks(idealTicks)
            .map(function(d) {
                var datum = { data: {}};
                datum.data[cc.fixedColumn.lookup] = d.getTime() / 1000;
                return datum;
            });

        if (vizObj.debugEnabled)
        { vizObj.debugOut('idealTicks:', idealTicks, 'actualTicks:', labels.length); }

        return this._super(labels);
    },

    _labelTransform: function()
    {
        var vizObj = this,
            cc = this._chartConfig;
        var xPositionStaticParts = cc.sidePadding + ((cc.rowWidth - cc.rowSpacing) / 2) -
                                   cc.drawElementPosition - cc.dataOffset;
        var yPositionStaticParts = vizObj._yAxisPos();
        return this._super(function(d)
        {
            var datum = d.data[cc.fixedColumn.lookup];
            var xValue = _.isString(datum) ? Date.parse(datum) : (datum * 1000);
            return [xPositionStaticParts + (cc.dateScale(xValue) * cc.rowWidth) - 3.5,
                    yPositionStaticParts + 10 ];
        });
    }

}, null, 'socrataChart', [ 'd3_impl_line', 'd3_virt_scrolling', 'd3_base', 'd3_base_dynamic', 'd3_base_legend' ]);

})(jQuery);

