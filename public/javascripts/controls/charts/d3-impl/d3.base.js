(function($)
{

// basic setup for d3
$.Control.registerMixin('d3_base', {
    initializeVisualization: function()
    {
        var vizObj = this;
        vizObj._ignoreViewChanges = true;

        var handleQueryChange = function()
        {
            vizObj.getColumns();
            vizObj.getDataForAllViews();
        };

        _.each(vizObj._dataViews, function(view) { view.bind('query_change', handleQueryChange, vizObj); });
    },

    getRequiredJavascripts: function()
    {
        // get d3 stuffs
        return blist.assets.libraries.d3;
    },

    d3: {
        util: {
            text: function(property)
            {
                if ($.browser.msie && ($.browser.majorVersion < 9))
                {
                    return function(d, i) {
                        $(this).text(property ? d[property] : d);
                    };
                }
                else
                {
                    return function(d, i) {
                        this.textContent = (property ? d[property] : d);
                    };
                }
            },

            colorizeRow: function(colDef)
            {
                return function(d)
                {
                    if (d.sessionMeta && d.sessionMeta.highlight &&
                        (!d.sessionMeta.highlightColumn || (d.sessionMeta.highlightColumn == colDef.column.id)))
                    {
                        return '#' + $.rgbToHex($.brighten(colDef.color, -20)); // why the fuck does brighten darken
                    }
                    else
                    {
                        return colDef.color;
                    }
                };
            }
        }
    }
}, null, 'socrataChart');

})(jQuery);
