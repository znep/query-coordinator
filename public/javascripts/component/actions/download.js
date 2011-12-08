$.component.Component.extend('Download', 'actions', {
    _initDom: function()
    {
        this._super.apply(this, arguments);
        if ($.isBlank(this.$link))
        {
            this.$link = $.tag({tagName: 'a', 'class': 'button', ref: 'external'});
            this.$contents.append(this.$link);
        }
    },

    _render: function()
    {
        var cObj = this;
        if (!cObj._super.apply(cObj, arguments)) { return false; }

        cObj._updateDataSource(cObj._properties, function()
        {
            var ds = cObj._dataContext.dataset;
            cObj.$link.text('Download this data');
            cObj.$link.attr('href', ds.downloadUrl('csv'));
        });
    },

    _propWrite: function(properties)
    {
        this._super.apply(this, arguments);
        if (!_.isEmpty(properties)) { this._render(); }
    }
});
