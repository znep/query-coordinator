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

    baseUrl: function()
    {
        return '/views/' + this.view.id + '/' +
            (this.renderTypeName.endsWith('_obsolete') ?
                'obsolete_' : '') + 'files/';
    },

    childForID: function(id)
    {
        return this._childIDLookup[parseInt(id)];
    },

    getSummary: function(successCallback)
    {
        var col = this;

        var colSumLoaded = function(resp)
        {
            col._summary = {};
            _(resp.columnSummaries).chain()
                .select(function(s) { return s.columnId == col.id; })
                .each(function(s)
                {
                    if ((s.topFrequencies || []).length > 0)
                    { col._summary[s.subColumnType] = s; }
                });

            if (_.isFunction(successCallback)) { successCallback(col._summary); }
        };

        if ($.isBlank(col._summary))
        {
            col.view._makeRequest({inline: true,
                params: {method: 'getSummary', columnId: col.id},
                success: colSumLoaded});
        }
        else
        { if (_.isFunction(successCallback)) { successCallback(col._summary); } }
    },

    invalidateData: function()
    {
        delete this._summary;
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
        if (!col.view.hasRight('update_view')) { return false; }

        var colSaved = function(newCol)
        {
            col.update(newCol, true);
            col.view.trigger('columns_changed');
            if (_.isFunction(successCallback)) { successCallback(col); }
        };

        this._makeRequest({url: '/views/' + this.view.id +
                '/columns/' + this.id + '.json', type: 'PUT',
                data: JSON.stringify(this.cleanCopy()),
                success: colSaved, error: errorCallback});
        return true;
    },

    show: function(successCallback, errorCallback, isBatch)
    {
        return this.setVisible(true, successCallback, errorCallback, isBatch);
    },

    hide: function(successCallback, errorCallback, isBatch)
    {
        return this.setVisible(false, successCallback, errorCallback, isBatch);
    },

    setVisible: function(isVisible, successCallback, errorCallback, isBatch)
    {
        var col = this;
        if (col.hidden !== isVisible) { return false; }

        col.hidden = !isVisible;
        if (isVisible)
        { col.flags = _.without(col.flags || [], 'hidden'); }
        else
        {
            col.flags = col.flags || [];
            col.flags.push('hidden');
        }

        var columnShown = function()
        {
            if (!isBatch) { col.view.trigger('columns_changed'); }
        };

        if (col.view.hasRight('update_view'))
        {
            this._makeRequest({url: '/views/' + this.view.id + '/columns/' +
                this.id + '.json', type: 'PUT',
                data: JSON.stringify({hidden: !isVisible}),
                batch: isBatch, success: columnShown, error: errorCallback});
        }
        else { columnShown(); }

        return true;
    },

    update: function(newCol, forceFull)
    {
        var col = this;

        newCol.id = col.id;

        var oldWidth = col.width;

        if (forceFull)
        {
            // If we are updating the entire column, then clean out all the
            // valid keys; then the next lines will copy all the new ones over
            _.each(col._validKeys, function(v, k)
            { if (k != 'childColumns') { delete col[k]; } });
        }

        _.each(newCol, function(v, k)
        { if (k != 'childColumns' && col._validKeys[k]) { col[k] = v; } });

        this._updateChildren(newCol.childColumns);

        // dropDown is special, because it only comes from the server; it isn't
        // posted back, so it isn't considered valid
        if (!$.isBlank(newCol.dropDown)) { col.dropDown = newCol.dropDown; }

        this._setUpColumn();

        if (oldWidth !== col.width) { col.view.trigger('column_resized', [col]); }
    },

    filter: function(value, subColumnType)
    {
        var col = this;
        var query = $.extend({}, col.view.query);

        // If there is already a filter for this column, clear it out
        col._clearFilterData(query);

        // Update the parent view with the new filter
        var filterItem = { type: 'operator', value: 'EQUALS', children: [
            { type: 'column', columnId: col.id,
                value: subColumnType.toUpperCase() },
            { type: 'literal', value: value } ] };

        if ($.isBlank(query.filterCondition))
        {
            // Make it the top-level filter
            query.filterCondition = filterItem;
        }
        else if (query.filterCondition.type == 'operator' &&
                query.filterCondition.value == 'AND')
        {
            // Add it to the top-level filter
            if (!query.filterCondition.children)
            { query.filterCondition.children = []; }
            query.filterCondition.children.push(filterItem);
        }
        else
        {
            // Else push the top-level filter down one level, and
            //  add this to the new top-level filter
            var topF = { type: 'operator', value: 'AND', children: [
                col.view.query.filterCondition, filterItem
                    ] };
            query.filterCondition = topF;
        }

        // Store the filter in an easier format to deal with elsewhere;
        //  also keep a pointer back to the viewFilter
        col.currentFilter = {value: value, viewFilter: filterItem};

        col.view.update({query: query});
    },

    clearFilter: function()
    {
        var col = this;
        var query = $.extend({}, col.view.query);
        col._clearFilterData(query);
        col.view.update({query: query});
    },

    remove: function(successCallback, errorCallback, isBatch)
    {
        var col = this;

        var colRemoved = function()
        {
            col.view.clearColumn(col.id);
            if (!isBatch) { col.view._updateColumns(); }
            if (_.isFunction(successCallback)) { successCallback(col); }
        };

        col._makeRequest({url: '/views/' + col.view.id + '/columns/' +
                col.id + '.json', type: 'DELETE', batch: isBatch,
                success: colRemoved, error: errorCallback});
    },

    convert: function(newType, successCallback, errorCallback)
    {
        var col = this;
        var columnConverted = function(newCol)
        {
            col.update(newCol, true);
            col.view._invalidateRows();
            col.invalidateData();
            col.view.trigger('columns_changed');
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

    removeRows: function(rowIds)
    {
        $.makeArray(rowIds);
        // TODO: implement me
    },

    _setUpColumn: function()
    {
        var col = this;
        this.format = this.format || {};
        if (!$.isBlank(this.dropDown))
        { this.dropDownList = this.dropDown; }
        delete this.dropDown;
        this.hidden = _.include(this.flags || [], 'hidden');
        this.dataType = blist.data.types[this.dataTypeName] || {};
        this.renderType = blist.data.types[this.renderTypeName] || {};
        this.isMeta = this.dataTypeName == 'meta_data';

        this._lookup = this.isMeta ? this.name : this.id;
        if (this.dataTypeName == 'tag') { this._lookup = 'tags'; }
        else if (this.isMeta && this.name == 'sid') { this._lookup = 'id'; }
        else if (this.isMeta && this.name == 'id') { this._lookup = 'uuid'; }

        // Wouldn't mind getting rid of this; currently req for rendering the grid
        this.dataLookupExpr = _.isString(this._lookup) ?
            ('.' + this._lookup ) : ('[' + this._lookup + ']');

        // Set up min width and default
        this.minWidth = 50;
        this.width = Math.max(this.minWidth, this.width || 100);

        this.aggregates = {};

        if (!$.isBlank(this.currentFilter) &&
                !_.any(((this.view.query || {}).filterCondition || {})
                    .children || [], function(fc)
                    { return _.isEqual(fc, col.currentFilter.viewFilter); }))
        { delete this.currentFilter; }
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
                col._childIDLookup[c.id] = c;
                return c;
            });
        this.realChildren = _.reject(this.childColumns, function(c)
            { return c.isMeta; });
        this.visibleChildren = _(this.realChildren).chain()
            .reject(function(c) { return c.hidden; })
            .sortBy(function(c) { return c.position; })
            .value();

        _.defer(function() { col.view.trigger('columns_changed'); });
    },

    _clearFilterData: function(query)
    {
        var col = this;
        if ($.isBlank(col.currentFilter)) { return; }

        // First check if this is the only viewFilter; if so, clear it
        if (query.filterCondition == col.currentFilter.viewFilter)
        { query.filterCondition = null; }

        else
        {
            // Else it is a child of the top-level filter; splice it out
            query.filterCondition.children =
                _.reject(query.filterCondition.children, function(fc)
                        { return _.isEqual(fc, col.currentFilter.viewFilter); });
            // If the top-level filter is empty, get rid of it
            if (query.filterCondition.children.length < 1)
            { query.filterCondition = null; }
        }

        delete col.currentFilter;
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
