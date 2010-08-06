(function(){

this.Column = Model.extend({
    _init: function (c, view, parentCol)
    {
        this._super();

        $.extend(this, c);

        this.view = view;
        this.parentColumn = parentCol;

        this._setUpColumn();

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
        var col = this;
        var colSaved = function(newCol)
        {
            col.update(newCol, true);
            if (_.isFunction(successCallback)) { successCallback(col); }
        };

        this._makeRequest({url: '/views/' + this.view.id +
                '/columns/' + this.id + '.json', type: 'PUT',
                data: JSON.stringify(this.cleanCopy()),
                success: colSaved, error: errorCallback});
    },

    show: function(successCallback, errorCallback, isBatch)
    {
        var col = this;

        var columnShown = function()
        {
            col.hidden = false;
            col.flags = _.without(col.flags || [], 'hidden');
            if (!isBatch) { col.view.trigger('columns_changed'); }
        };

        this._makeRequest({url: '/views/' + this.view.id + '/columns/' + this.id +
            '.json', type: 'PUT', data: JSON.stringify({hidden: false}),
            batch: isBatch, success: columnShown, error: errorCallback});
    },

    update: function(newCol, forceFull)
    {
        var col = this;
        if (forceFull)
        {
            // If we are updating the entire column, then clean out all the
            // valid keys; then the next lines will copy all the new ones over
            _.each(col._validKeys, function(v, k) { delete col[k]; });
        }

        this._updateChildren(newCol.childColumns);
        _.each(newCol, function(v, k)
        { if (col._validKeys[k]) { col[k] = v; } });
        this._setUpColumn();
    },

    convert: function(newType, successCallback, errorCallback)
    {
        var col = this;
        var columnConverted = function(newCol)
        {
            col.update(newCol, true);
            col.view._invalidateRows();
            if (_.isFunction(successCallback)) { successCallback(col); }
        };

        this._makeRequest({url: '/views/' + this.view.id + '/columns/' +
            this.id + '.json', data: {method: 'convert', type: newType},
            type: 'POST', success: columnConverted, error: errorCallback});
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


    _setUpColumn: function()
    {
        this.format = this.format || {};
        this.dropDownList = this.dropDown;
        delete this.dropDown;
        this.hidden = _.include(this.flags || [], 'hidden');
        this.dataType = blist.data.types[this.dataTypeName] || {};
        this.renderType = blist.data.types[this.renderTypeName] || {};
        this.isMeta = this.dataTypeName == 'meta_data';

        this._lookup = this.isMeta ? this.name : this.id;
        if (this.dataTypeName == 'tag') { this._lookup = 'tags'; }
        else if (this.isMeta && this.name == 'sid') { this._lookup = 'id'; }
        else if (this.isMeta && this.name == 'id') { this._lookup = 'uuid'; }

        this.aggregates = {};
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
