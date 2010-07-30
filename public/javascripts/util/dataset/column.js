(function(){

this.Column = Model.extend({
    _init: function (c, view, parentCol)
    {
        this._super();

        $.extend(this, c);

        this.view = view;
        this.parentColumn = parentCol;

        this.format = this.format || {};
        this.hidden = _.include(this.flags || [], 'hidden');
        this.dataType = blist.data.types[this.dataTypeName];
        this.renderType = blist.data.types[this.renderTypeName];

        this._updateColumns();
    },

    _updateColumns: function()
    {
        if ($.isBlank(this.childColumns)) { return; }

        var col = this;
        this.childColumns = _.map(this.childColumns, function(c, i)
            {
                c = new Column(c, col.view, col);
                c.dataIndex = i;
                return c;
            });
        this.realChildren = _.reject(this.childColumns, function(c)
            { return c.dataTypeName == 'meta_data'; });
        this.visibleChildren = _(this.realChildren).chain()
            .reject(function(c) { return c.hidden; })
            .sortBy(function(c) { return c.position; })
            .value();
    }
});

})();
