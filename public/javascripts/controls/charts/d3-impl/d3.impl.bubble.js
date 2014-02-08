(function($)
{

var d3ns = blist.namespace.fetch('blist.d3');

$.Control.registerMixin('d3_impl_bubble', {

    // It's probably worth forcing a sort on cc.fixedColumn
    //initializeVisualization: function() {
    columnsLoaded: function() {
        this._super.apply(this, arguments);

        var vizObj = this,
            cc = vizObj._chartConfig;
        cc.fixedColumn = vizObj._fixedColumns[0];

        if (vizObj._pointColor)
        {
            // This is gutting color.js#$.gradient and taking its essentials.
            // d3 scales are fundamentally better.
            var colorRange = [ vizObj._displayFormat.color || '#042656' ];
            var hsv = $.rgbToHsv($.hexToRgb(colorRange[0]));
            hsv.s = hsv.s > 50 ? 0 : 100;
            hsv.v = hsv.v > 50 ? 0 : 80;
            colorRange.unshift('#' + $.rgbToHex($.hsvToRgb(hsv)));

            cc.colorScale = d3.scale.linear()
                                    .domain([ vizObj._pointColor.aggregates.minimum,
                                              vizObj._pointColor.aggregates.maximum ])
                                    .range(colorRange);
        }

        if (vizObj._pointSize)
        {
            cc.sizeScale  = d3.scale.linear()
                                    .domain([ vizObj._pointSize.aggregates.minimum,
                                              vizObj._pointSize.aggregates.maximum ])
                                    .range([ 4, 40 ]);
        }
    },

    _lineType: function()
    { return 'none'; },

    _d3_getColor: function(colDef, d)
    {
        var vizObj = this,
            cc = this._chartConfig;

        if (d && vizObj._pointColor)
        { return d.color || cc.colorScale(d.data[vizObj._pointColor.lookup]); }
        else
        { return this._super.apply(this, arguments); }
    },

    _sizifyRow: function(colDef)
    {
        var vizObj = this,
            cc = this._chartConfig;

        if (!vizObj._pointSize) { return this._super.apply(this, arguments); }

        return function(d) { return cc.sizeScale(d.data[vizObj._pointSize.lookup]); };
    }

}, null, 'socrataChart', [ 'd3_impl_line', 'd3_virt_scrolling', 'd3_base', 'd3_base_dynamic', 'd3_base_legend' ]);

})(jQuery);
