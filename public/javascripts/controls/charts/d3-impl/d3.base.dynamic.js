(function($)
{

// dynamic/slice loading isn't really something that base-visualization
// accounts for. here we mangle it a bit to make it do what we want.
$.Control.registerMixin('d3_base_dynamic', {
    // getDataForView normally just fetches up to _maxRows rows and dumps them
    // all on the renderer. we need to be gentler.
    getDataForView: function(view)
    {
        var vizObj = this;
        var viewConfig = vizObj._byView[view.id];

        var renderRange;
        if ($.isBlank(view.totalRows()))
        {
            // we don't know the total row count, so let the system do
            // its first row fetch and then we'll be able to use that.
            // ask for 50 anyway for good measure
            renderRange = { start: 0, length: 50 };
        }
        else
        {
            renderRange = vizObj.getRenderRange(view);
        }

        vizObj._lastRowCount = view.totalRows();
        vizObj._currentRenderRange = renderRange; // keep track of what row set we care about at the moment

        var rangeData = []; // aggregate all the callbacks we get for this range into one array

        view.getRows(renderRange.start, renderRange.length, function(data)
        {
            if (renderRange !== vizObj._currentRenderRange)
            {
                return; // we don't care about this callback fire. the user has moved on.
            }

            if (vizObj._lastRowCount !== view.totalRows())
            {
                vizObj.handleRowCountChange();
            }
            if ($.isBlank(vizObj._lastRowCount))
            {
                // we got a first row, which is cute and all, but we have
                // to go fetch the rest now that we know how many to grab.
                _.defer(function() { vizObj.getDataForView(view) });
            }

            rangeData = rangeData.concat(data);
            vizObj._lastRowCount = view.totalRows();
            _.defer(function() { vizObj.handleRowsLoaded(rangeData, view); });

            delete vizObj._initialLoad;
            delete vizObj._loadDelay;
        },
        function(errObj)
        {
            // If we were cancelled, and didn't respond to the event that caused a cancel,
            // then re-try this request. Otherwise just clear initialLoad, and it will
            // respond normally.
            if ($.subKeyDefined(errObj, 'cancelled') && errObj.cancelled &&
                (vizObj._initialLoad || !vizObj._boundViewEvents))
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

    getRenderRange: function(view)
    {
        // implement me to indicate what the range of rows should be
        // that's rendered. should call back with { start: #, length: # }.
        console.error('implement me!');
    },

    renderData: function()
    {
        // we definitely don't want to use the default renderer because
        // it doesn't account for batches and such.
        console.error('implement me!');
    },

    handleRowCountChange: function()
    {
        // implement me to set dom width or height in accordance with the
        // row count changing
    }
}, null, 'socrataChart');

})(jQuery);
