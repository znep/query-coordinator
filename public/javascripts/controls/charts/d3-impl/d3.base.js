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

    requiresSeriesGrouping: this.Model.pureVirtual,

    // Sets a DOM element to overlay the chart.
    // Takes a single argument, the dom node.
    _setChartOverlay: this.Model.pureVirtual,

    // Hides or shows the chart render area.
    // Takes a boolean.
    _setChartVisible: this.Model.pureVirtual,

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
        if (this._isIE8())
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

    _d3_getColor: function(colDef, d)
    {
        var vizObj = this;

        var color = d ? d.color : undefined;

        if (!color)
        {
            var index = -1;
            var found = _.find(vizObj.getValueColumns(), function(value, i)
            {
                if (value.column.id == colDef.column.id)
                {
                    index = i;
                    return true;
                }
                return false;
            });


            var explicitColors = vizObj._displayFormat.colors;

            // Color priority is:
            // 1) Explicitly provided colors array.
            // 2) colDef.color.
            // 3) default colors.

            if (found && !_.isUndefined(explicitColors) && explicitColors.length > index)
            {
                color = explicitColors[index];
            }
            else if (colDef.color)
            {
                color = colDef.color;

                // Some legacy case where colDef.color is '#hex,#hex,#hex,#hex,#hex,#hex'.
                if (color.indexOf(',') > -1)
                { color = color.split(',')[0]; }
            }
            else
            {
                // Fallback to default colors.
                var fallbackColors =  ['#042656', '#19538b', '#6a9feb', '#bed6f7', '#495969', '#bbc3c9'];
                // Even if we didn't find the column, return something.
                index = found ? index : 0;

                color = fallbackColors[index % fallbackColors.length];
            }
        }

        return color;
    },

    _d3_colorizeRow: function(colDef, colIdentFinder)
    {
        var vizObj = this;
        var isFunc = _.isFunction(colIdentFinder);
        return function(d)
        {
            var color = vizObj._d3_getColor(colDef, d);

            if (vizObj._primaryView.highlights && vizObj._primaryView.highlights[d.id] &&
                (!vizObj._primaryView.highlightsColumn[d.id] ||
                 (vizObj._primaryView.highlightsColumn[d.id] ==
                    (isFunc ? colIdentFinder(colDef) : colDef.column.id))))
            {
                return '#' + $.rgbToHex($.brighten(color, 20)); // why the fuck does brighten darken
            }
            else
            {
                return color;
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
    },

    // Arguments are expected to be a series of 2-length arrays.
    _d3_line_path: function ()
    {
        var r = '';
        _.each(arguments, function(p, i)
        {
            r += (i==0?'M ':' L ')+p[0]+' '+p[1];
        });

        return r;
    },

    // Handles the mouse entering a datum visual (bar, point, etc).
    // MUST always be called when the mouse enters, as this method
    // does some internal bookkeeping that must be kept consistent at
    // all times.
    // If you want to prevent the main behavior of this method (=showing
    // the flyout and highlighting rows), pass false for enableProcessing.
    handleDataMouseOver: function(visual, colDef, row, flyoutConfigs, enableProcessing)
    {
        var vizObj = this,
            view = vizObj._primaryView;

        if (row && enableProcessing)
        {
            var col = colDef.column;
            var configs = {
                content: vizObj.renderFlyout(row, col.tableColumnId, view),
                trigger: 'now'
            };

            $.extend(configs, flyoutConfigs);

            visual.tip = $(visual.node).socrataTip(configs);


            // We have to listen on mouse events for both the tip
            // and the slice, as the tip isn't actually a child
            // of the slice (if we didn't, w accidentally close
            // the tip if the tip shows up under the mouse).
            var mouseCount = 0;
            var localMouseIn = function()
            {
                mouseCount ++;
            };

            var localMouseOut = function(delay)
            {
                mouseCount --;

                var cleanup = function()
                {
                    if (mouseCount == 0)
                    {
                        // for perf, only call unhighlight if highlighted.
                        if (view.highlights && view.highlights[row.id])
                        {
                            view.unhighlightRows(row);
                        }

                        if (visual.tip)
                        {
                            visual.tip.destroy();
                            delete visual.tip;
                            delete visual.localMouseOut;
                        }
                    }
                };
                if (delay) { _.delay(cleanup, delay); }
                else { cleanup(); }
            };

            visual.localMouseOut = localMouseOut;

            var $btWrapper = $(visual.tip._tipBox);

            localMouseIn();
            $btWrapper.hover(localMouseIn, localMouseOut);

            if (!vizObj.requiresSeriesGrouping())
            { view.highlightRows(row, null, col); }
        }
    },

    // Handles the mouse leaving a datum visual (bar, point, etc).
    // MUST always be called when the mouse leaves, as this method
    // does some internal bookkeeping that must be kept consistent at
    // all times.
    handleDataMouseOut: function(visual, delay)
    {
        if (visual.localMouseOut)
        {
            visual.localMouseOut(delay);
        }
    },

    _isIE8: function()
    {
        return $.browser.msie && parseFloat($.browser.version) < 9;
    }
}, null, 'socrataChart');

})(jQuery);
