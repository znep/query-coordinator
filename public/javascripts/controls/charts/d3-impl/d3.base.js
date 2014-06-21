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

    initialRenderDone: _.once(function()
    {
        $.metrics.measure('domain-intern', 'js-chart-' + this._chartType + '-page-load-time');
        this.takeSnapshot();
    }),

    takeSnapshot: _.once(function()
    {
        if (this._primaryView.snapshotting)
        { setTimeout(function() { this._primaryView.takeSnapshot(); }, 1000); }
    }),

    _animationLengthMillisec: 600,

    // Handle rendering values for different column types here
    _renderCellText: function(row, col)
    {
        var renderer = row.invalid[col.lookup] ? blist.datatypes.invalid.renderer :
            col.renderType.renderer;
        return renderer(row.data[col.lookup], col, true, false, {}, true);
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

    _getDisplayFormatColors: function()
    {
        var colors = _.filter(this._displayFormat.colors, _.isString);
        return (_.isEmpty(colors) && $.isPresent(this._displayFormat.color)) ?
            [ this._displayFormat.color ] : colors;
    },

    _getFallbackColors: function()
    {
        return ['#042656', '#19538b', '#6a9feb', '#bed6f7', '#495969', '#bbc3c9'];
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


            var explicitColors = vizObj._getDisplayFormatColors();

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
                var fallbackColors = vizObj._getFallbackColors();
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

            if (!vizObj.requiresSeriesGrouping())
            { view.highlightRows(row, 'hover', col); }

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

            var mouseCleanup = function(forceCleanup)
            {
                if (forceCleanup === true || mouseCount == 0)
                {
                    if (visual.tip)
                    {
                        visual.tip.destroy();
                        delete visual.tip;
                        delete visual.localMouseOut;
                    }

                    // Only unhighlight if we're actually the column that caused
                    // the highlight. This may not be true if the user quickly (within the delay)
                    // mouses over to another datum from the same row, but a different column.
                    // The mouse in handler will create the new flyout, then this code will
                    // run for the old column (because of the _.delay), and cause us to
                    // unhighlight the row, which should still be highlighted.
                    // Also, for perf, only call unhighlight if highlighted.
                    if (view.highlights && view.highlights[row.id] &&
                        _.contains(view.highlightsColumn, colDef.column.id))
                    {
                        view.unhighlightRows(row, 'hover');
                    }

                }
            };

            var localMouseIn = function()
            {
                mouseCount ++;
            };

            var localMouseOut = function(delay)
            {
                mouseCount --;

                if (delay) { _.delay(mouseCleanup, delay); }
                else { mouseCleanup(); }
            };

            visual.localMouseOut = localMouseOut;
            visual.mouseCleanup = mouseCleanup;

            var $btWrapper = $(visual.tip._tipBox);

            localMouseIn();
            $btWrapper.hover(localMouseIn, localMouseOut);

            // Clicking on the flyout is the same as clicking on the slice/bar/whatever.
            $btWrapper.click(function()
            {
                vizObj.handleDataClick(visual, row, colDef);
            });
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

    // Called when a data visual leaves the DOM.
    handleDataLeaveDOM: function(visual)
    {
        if (visual.mouseCleanup)
        {
            visual.mouseCleanup(true /* forceCleanup*/);
        }
    },

    handleDataClick: function(visual, row, colDef)
    {
        var vizObj = this;

        if (!vizObj._chartInitialized) { return; }

        var alreadySelected = $.subKeyDefined(vizObj._primaryView, 'highlightTypes.select.' + row.id);
        var alreadyHovered = $.subKeyDefined(vizObj._primaryView, 'highlightTypes.hover.' + row.id);

        // If we're highlighted via hover and we're about to become selected, unhover ourselves
        // first so people using event connectors, etc get a notification.
        if (alreadyHovered && !alreadySelected)
        {
            vizObj._primaryView.unhighlightRows(row, 'hover');
        }

        if (alreadySelected)
        {
            vizObj._primaryView.unhighlightRows(row, 'select');
            vizObj.$dom().trigger('display_row', [{row: null}]);
        }
        else
        {
            vizObj._primaryView.highlightRows(row, 'select',  colDef.column);
            vizObj.$dom().trigger('display_row', [{row: row}]);
        }
    },

    _isIE8: function()
    {
        return $.browser.msie && parseFloat($.browser.version) < 9;
    },

    // See Redmine 11915.
    // In short, .exit().transition().remove()
    // will often become un-preemptible in IE8, meaning we accidentally
    // delete some display nodes if we later decide to interrupt the transition
    // and reuse those nodes (i.e. if we get more data).
    // The real fix is in the guts of D34Raphael (unknown at this time where specifically).
    _transitionExitWorkaroundActive: function()
    {
        return this._isIE8();
    }

}, null, 'socrataChart');

})(jQuery);
