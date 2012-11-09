(function($)
{

// basic setup for d3
$.Control.registerMixin('d3_base', {
    /*
    the world ain't ready for this. the default method is more brute force than d3 needs.
    but the events are too crazy to detangle and unbind.
    so, use safe strats for now.
    ready: function()
    {
        var vizObj = this;

        var wereEventsBound = vizObj._boundViewEvents;
        vizObj._super();

        // this will definitely be called before _super, so just rely on that to
        // mark this flag appropriately
        if (!wereEventsBound)
        {
            var handleQueryChange = function()
            {
                debugger;
                vizObj.getColumns();
                vizObj.getDataForAllViews();
            };

            _.each(vizObj._dataViews, function(view)
            {
                view.unbind('query_change')
                view.bind('query_change', handleQueryChange, vizObj);
            });
        }
    },*/

    getRequiredJavascripts: function()
    {
        // get d3 stuffs
        return blist.assets.libraries.d3;
    },

    // Handle rendering values for different column types here
    _renderCellText: function(row, col)
    {
        var renderer = row.invalid[col.lookup] ? blist.datatypes.invalid.renderer :
            col.renderType.renderer;
        return renderer(row[col.lookup], col, true, false, {}, true);
    },

    _d3_text: function(transform)
    {
        var hasTransform = _.isFunction(transform);
        if ($.browser.msie && ($.browser.majorVersion < 9))
        {
            return function(d, i) {
                $(this).text(hasTransform ? transform(d) : d);
            };
        }
        else
        {
            return function(d, i) {
                this.textContent = (hasTransform ? transform(d) : d);
            };
        }
    },

    _d3_colorizeRow: function(colDef, colIdentFinder)
    {
        var vizObj = this;
        var isFunc = _.isFunction(colIdentFinder);
        return function(d)
        {
            if (vizObj._primaryView.highlights && vizObj._primaryView.highlights[d.id] &&
                (!vizObj._primaryView.highlightsColumn[d.id] ||
                 (vizObj._primaryView.highlightsColumn[d.id] ==
                    (isFunc ? colIdentFinder(colDef) : colDef.column.id))))
            {
                return '#' + $.rgbToHex($.brighten(d.color || colDef.color, 20)); // why the fuck does brighten darken
            }
            else
            {
                return d.color || colDef.color;
            }
        };
    },

    _d3_px: function(f)
    {
        if (_.isNumber(f))
        {
            return f + 'px';
        }
        else if (_.isFunction(f))
        {
            return function()
            {
                return f.apply(this, arguments) + 'px';
            };
        }
    }
}, null, 'socrataChart');

})(jQuery);
