(function(){

// NOTE: This functionality is for snapshotting ONLY
// If you add something here that should be specific to grouped/non-grouped
// datasets, we should separate these into separate files
Dataset.modules['grouped'] =
Dataset.modules['filter'] =
Dataset.modules['blist'] =
Dataset.modules['table'] =
{
    supportsSnapshotting: function()
    {
        return true;
    },

    _setupSnapshotting: function()
    {
        var ds = this,
            timeout = 500;

        // Give more time for the browser to render images
        if (_.any(ds.columns, function(col)
            {
                return _.include(['checkbox', 'percent', 'stars', 'flag', 'photo'],
                    col.dataTypeName);
            }))
        { timeout = 1500; }

        this._setupDefaultSnapshotting(timeout);
    }
};

})();
