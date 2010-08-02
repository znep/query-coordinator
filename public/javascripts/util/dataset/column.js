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
        this.dataType = blist.data.types[this.dataTypeName] || {};
        this.renderType = blist.data.types[this.renderTypeName] || {};
        this.isMeta = this.dataTypeName == 'meta_data';

        this.aggregates = {};

        this._updateChildren();
    },

    _update: function(newCol)
    {
        this._updateChildren(newCol.childColumns);
    },

    _updateChildren: function(newChildren)
    {
        if ($.isBlank(this.childColumns) && $.isBlank(newChildren)) { return; }

        var col = this;

        // TODO: fill this in
        if (!$.isBlank(newChildren))
        {
            this.childColumns = this.childColumns || [];
        }

        this.childColumns = _.map(this.childColumns, function(c, i)
            {
                c = new Column(c, col.view, col);
                c.dataIndex = i;
                return c;
            });
        this.realChildren = _.reject(this.childColumns, function(c)
            { return c.isMeta; });
        this.visibleChildren = _(this.realChildren).chain()
            .reject(function(c) { return c.hidden; })
            .sortBy(function(c) { return c.position; })
            .value();
    }
});

})();
