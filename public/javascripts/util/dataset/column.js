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

    addColumn: function(column, successCallback, errorCallback)
    {
        var col = this;
        var columnAdded = function(newCol)
        {
            col.childColumns.push(newCol);
            col._updateChildren();
            if (_.isFunction(successCallback))
            { successCallback(col.childForID(newCol.id)); }
        };

        this._makeRequest({url: '/views/' + this.view.id + '/columns/' +
                this.id + '/sub_columns.json',
                type: 'POST', data: JSON.stringify(new Column(column).cleanCopy()),
                success: successCallback, error: errorCallback});
    },

    save: function(successCallback, errorCallback)
    {
        this._makeRequest({url: '/views/' + this.view.id +
                '/columns/' + this.id + '.json', type: 'PUT',
                data: JSON.stringify(this.cleanCopy()),
                success: successCallback, error: errorCallback});
    },

    show: function(successCallback, errorCallback, isBatch)
    {
        this._makeRequest({url: '/views/' + this.view.id + '/columns/' + this.id +
            '.json', type: 'PUT', data: JSON.stringify({hidden: false}),
            batch: isBatch, success: successCallback, error: errorCallback});
    },

    update: function(newCol)
    {
        var col = this;
        this._updateChildren(newCol.childColumns);
        _.each(newCol, function(v, k)
        { if (col._validKeys[k]) { col[k] = v; } });
    },

    cleanCopy: function()
    {
        var col = this._super();
        if (!$.isBlank(col.childColumns))
        {
            col.childColumns = _.reject(col.childColumns,
                function(c) { return c.id == -1; });
        }
        return col;
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
    },

    _validKeys: {
        childColumns: true,
        dataTypeName: true,
        defaultValues: true,
        description: true,
        dropDownList: true,
        flags: true,
        format: true,
        id: true,
        name: true,
        position: true,
        width: true
    }
});

})();
