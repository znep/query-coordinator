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

        this._lookup = this.isMeta ? this.name : this.id;
        if (this.dataTypeName == 'tag') { this._lookup = 'tags'; }
        else if (this.isMeta && this.name == 'sid') { this._lookup = 'id'; }
        else if (this.isMeta && this.name == 'id') { this._lookup = 'uuid'; }

        this.aggregates = {};

        this._updateChildren();
    },

    childForID: function(id)
    {
        return this._childIDLookup[parseInt(id)];
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

        this._childIDLookup = {};
        this.childColumns = _.map(this.childColumns, function(c, i)
            {
                if (!(c instanceof Column))
                { c = new Column(c, col.view, col); }
                c.dataIndex = i;
                col._childIDLookup[c.id] = c;
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
