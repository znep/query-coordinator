(function($)
{

// basic setup for d3
$.Control.registerMixin('d3_base', {
    getRequiredJavascripts: function()
    {
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
