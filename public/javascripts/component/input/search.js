$.component.Component.extend('Search', 'input', {
    _init: function()
    {
        this._needsOwnContext = true;
        this._super.apply(this, arguments);
    },

    _initDom: function()
    {
        var cObj = this;
        cObj._super.apply(cObj, arguments);
        cObj.$contents.empty();
        cObj.$contents.append($.tag({ tagName: 'input', type: 'text', name: 'q' }));
        cObj.$contents.append($.tag({ tagName: 'a', 'class': 'button', contents: 'Search' }));

        var handler = function()
        {
            var q;
            if (_.isEmpty(q = cObj.$contents.find('input').val())) { return; }

            _.each(cObj._getDatasetListFromContext(cObj._dataContext), function(ds)
            { ds.update({ searchString: q }); });
        };
        cObj.$contents.find('input').example('Search the dataset')
                                    .keypress(function(eObj)
                                    { if (eObj.keyCode == 13) { handler(); } });
        cObj.$contents.find('a.button').click(handler);
    },

    _render: function()
    {
        var cObj = this;
        if (!cObj._super.apply(cObj, arguments)) { return false; }

        cObj._updateDataSource(cObj._properties);

        return true;
    }
});
