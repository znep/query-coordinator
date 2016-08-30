(function($)
{

// dynamic/slice loading isn't really something that base-visualization
// accounts for. here we mangle it a bit to make it do what we want.
$.Control.registerMixin('d3_base_dynamic', {

    // need to have columns accessible to us for our code to work
    initializeVisualization: function()
    {
        var vizObj = this;
        vizObj.debugEnabled = $.urlParam(window.location.href, 'debug') == 'true';
        vizObj._currentRangeData = [];
        vizObj.getColumns();
        vizObj.cleanDisplayFormat();
        vizObj._super();
        vizObj._chartInitialized = true;
    },

    debugOut: function()
    {
        if (this.debugEnabled && window.console)
        {
            if (console.log.apply)
            {
                console.log.apply(console, arguments);
            }
            else
            {
                console.log(_.flatten(arguments).join('')); //IE8's arguments doesn't have join()...!
            }
        }
    },

    cleanDisplayFormat: function()
    {
    },

    // clear out our flag
    cleanVisualization: function()
    {
        var vizObj = this;
        delete vizObj._chartInitialized;
        delete vizObj._dynamicSizingCalculated;
        delete vizObj._lastRowCount;
        delete vizObj._currentRenderRange;
        delete vizObj._currentRangeData;
        if ($.subKeyDefined(vizObj, '_primaryView'))
        { vizObj._primaryView.unbind(null, null, vizObj); }
        vizObj._super();
    },

    // getDataForView normally just fetches up to _maxRows rows and dumps them
    // all on the renderer. we need to be gentler.
    getDataForView: function(view)
    {
        var vizObj = this;

        var renderRange;
        if (vizObj._dynamicSizingCalculated === true)
        {
            renderRange = vizObj.getRenderRange(view);
        }
        else if (!$.isBlank(view.totalRows()))
        {
            // we haven't calculated our sizing stuff, but on the other hand
            // someone's already went and gotten the total row count for us.
            // recalculate and use.
            vizObj.handleDataChange();
            vizObj._dynamicSizingCalculated = true;

            renderRange = vizObj.getRenderRange(view);
        }
        else
        {
            // we don't know the total row count, so let the system do
            // its first row fetch and then we'll be able to use that.
            // ask for 50 anyway for good measure
            renderRange = { start: 0, length: 50 };
        }

        if (vizObj.debugEnabled)
        {
            vizObj.debugOut('getData: @'+renderRange.start+' L'+renderRange.length);
        }

        vizObj._currentRenderRange = renderRange; // keep track of what row set we care about at the moment

        vizObj._currentRangeData = vizObj._currentRangeData || [];
        vizObj._currentRangeData.length = 0; //Clear the array.

        view.getRows(renderRange.start, renderRange.length, function(data)
        {
            if (renderRange !== vizObj._currentRenderRange)
            {
                return; // we don't care about this callback fire. the user has moved on.
            }

            if (vizObj._lastRowCount !== view.totalRows())
            {
                vizObj.handleDataChange();
                vizObj._dynamicSizingCalculated = true;
            }
            if ($.isBlank(vizObj._lastRowCount))
            {
                // we got a first row, which is cute and all, but we have
                // to go fetch the rest now that we know how many to grab.
                _.defer(function() { vizObj.getDataForView(view) });
            }

            vizObj._lastRowCount = view.totalRows();
            _.defer(function() { vizObj.handleRowsLoaded(data, view); });

            delete vizObj._initialLoad;
            delete vizObj._loadDelay;
        },
        function(errObj)
        {
            // If we were cancelled, and didn't respond to the event that caused a cancel,
            // then re-try this request. Otherwise just clear initialLoad, and it will
            // respond normally.
            if ($.subKeyDefined(errObj, 'cancelled') && errObj.cancelled && !vizObj._initialLoad)
            {
                // Exponential back-off in case we're waiting on something that needs to finish
                if ($.isBlank(vizObj._loadDelay) || vizObj._loadDelay == 0)
                { vizObj._loadDelay = 500; }
                setTimeout(function()
                    { vizObj.getDataForView(view); }, vizObj._loadDelay);
                vizObj._loadDelay *= 2;
            }
            else if (vizObj._boundViewEvents) { delete vizObj._initialLoad; }
        });
    },

    _sortedSetInsert: function(dest, src)
    {
        var didInsertData = false;
        if (src.length > 0)
        {
            var insertIndex = _.sortedIndex(dest, src[0], function(a) { return a.index; });
            var srcIndex = 0;

            while(srcIndex < src.length)
            {
                if (dest.length <= insertIndex || dest[insertIndex].index > src[srcIndex].index)
                {
                    dest.splice(insertIndex, 0, src[srcIndex]);
                    srcIndex ++;
                    didInsertData = true;
                }
                else
                {
                    if (dest[insertIndex].index == src[srcIndex].index)
                    {
                        srcIndex ++;
                    }
                    insertIndex ++;
                }
            };
        }
        return didInsertData;
    },

    handleRowsLoaded: function(data, view)
    {
        // handleRowsLoaded gets some weird call abuse with random subsections
        // of the data. so, maintain our current slice and just update into our
        // full visible set where appropriate
        if (!this._chartInitialized) { return; }

        var didInsertData = this._sortedSetInsert(this._currentRangeData, data);

        if (this.debugEnabled)
        {
            if (!_.isEmpty(this._currentRangeData))
            {
                this.debugOut('rData: idx: ' +
                              _.first(this._currentRangeData).index +
                              '-' +
                              _.last(this._currentRangeData).index +
                              ', count: ' +
                              this._currentRangeData.length +
                              ', insert: ' +
                              didInsertData);
            }
            else
            {
                this.debugOut('rData(empty)');
            }
        }

        this.renderData(this._currentRangeData, view, didInsertData);
    },

    handleRowsRemoved: function(data, view)
    {
        var vizObj = this;

        vizObj._super.apply(vizObj, arguments);
        vizObj.renderData(vizObj._currentRangeData, view);
    },

    // implement me to indicate what the range of rows should be
    // that's rendered. should call back with { start: #, length: # }.
    getRenderRange: this.Model.pureVirtual,

    // we definitely don't want to use the default renderer because
    // it doesn't account for batches and such.
    renderData: this.Model.pureVirtual,

    removeRow: function(row, view)
    {
        this._currentRangeData.splice(row.index, 1);
    },

    handleDataChange: function()
    {
        // implement me to set dom width or height in accordance with the
        // row count changing
    }
}, null, 'socrataChart');

})(jQuery);
