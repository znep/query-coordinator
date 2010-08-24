(function(){

this.Column = Model.extend({
    _init: function (c, parent)
    {
        this._super();

        $.extend(this, c);

        if (parent instanceof Column)
        {
            this.parentColumn = parent;
            this.view = parent.view;
        }
        else if (parent instanceof Dataset)
        { this.view = parent; }

        if (this.dataTypeName == 'nested_table')
        {
            // This ID really shouldn't be changing; if it does, this URL
            // will be out-of-date...
            Column.addProperties(this, ColumnContainer('childColumn',
                    '/views/' + this.view.id + '/columns/' + this.id +
                    '/sub_columns'), Column.prototype);
        }

        this._setUpColumn();

        this.updateChildColumns();
    },

    baseUrl: function()
    {
        return '/views/' + this.view.id + '/' +
            (this.renderTypeName.endsWith('_obsolete') ?
                'obsolete_' : '') + 'files/';
    },

    getSummary: function(successCallback)
    {
        var col = this;

        var colSumLoaded = function(resp)
        {
            col._summary = {};
            _(resp.columnSummaries || []).chain()
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

    save: function(successCallback, errorCallback)
    {
        var col = this;
        if (!col.view.hasRight('update_view')) { return false; }

        var colSaved = function(newCol)
        {
            col.update(newCol, true);
            if (!$.isBlank(col.parentColumn))
            { col.parentColumn.updateChildColumns(); }
            else { col.view.updateColumns(); }
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

        if (!isBatch)
        {
            if (!$.isBlank(col.parentColumn))
            { col.parentColumn.updateChildColumns(); }
            else { col.view.updateColumns(); }
        }

        if (col.view.hasRight('update_view'))
        {
            this._makeRequest({url: '/views/' + this.view.id + '/columns/' +
                this.id + '.json', type: 'PUT',
                data: JSON.stringify({hidden: !isVisible}),
                batch: isBatch, success: successCallback, error: errorCallback});
        }

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

        this.updateChildColumns(newCol.childColumns, forceFull, forceFull);

        // dropDown is special, because it only comes from the server; it isn't
        // posted back, so it isn't considered valid
        if (!$.isBlank(newCol.dropDown)) { col.dropDown = newCol.dropDown; }

        this._setUpColumn();

        if (oldWidth !== col.width) { col.view.trigger('column_resized', [col]); }
    },

    filter: function(value, subColumnType)
    {
        var col = this;
        var query = $.extend(true, {}, col.view.query);

        // If there is already a filter for this column, clear it out
        col._clearFilterData(query);

        // Update the parent view with the new filter
        var filterItem = { type: 'operator', value: 'EQUALS', children: [
            { type: 'column', columnId: col.id,
                value: subColumnType.toUpperCase() },
            { type: 'literal', value: value } ] };

        if ($.isBlank(query.filterCondition))
        {
            // Make it the top-level filter, wrapped in an AND section
            query.filterCondition = { type: 'operator', value: 'AND',
                children: [filterItem] };
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
        var query = $.extend(true, {}, col.view.query);
        col._clearFilterData(query);
        col.view.update({query: query});
    },

    remove: function(successCallback, errorCallback, isBatch)
    {
        var col = this;

        var colRemoved = function()
        {
            col.view.clearColumn(col);
            if (!isBatch)
            {
                if (!$.isBlank(col.parentColumn))
                { col.parentColumn.updateChildColumns(); }
                else { col.view.updateColumns(); }
            }
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
            if (!$.isBlank(col.parentColumn))
            { col.parentColumn.updateChildColumns(); }
            else { col.view.updateColumns(); }
            if (_.isFunction(successCallback)) { successCallback(col); }
        };

        this._makeRequest({url: '/views/' + this.view.id + '/columns/' +
            this.id + '.json', data: {method: 'convert', type: newType},
            type: 'POST', success: columnConverted, error: errorCallback});
    },

    cleanCopy: function()
    {
        var col = this._super();
        // Support for picklists
        if (col.dataTypeName == 'picklist') { delete col.dropDownList; }
        return col;
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

        this.lookup = this.isMeta ? this.name : this.id;
        if (this.dataTypeName == 'tag') { this.lookup = 'tags'; }
        else if (this.isMeta && this.name == 'sid') { this.lookup = 'id'; }
        else if (this.isMeta && this.name == 'id') { this.lookup = 'uuid'; }

        // Wouldn't mind getting rid of this; currently req for rendering the grid
        this.dataLookupExpr = _.isString(this.lookup) ?
            ('.' + this.lookup ) : ('[' + this.lookup + ']');
        if (!$.isBlank(this.parentColumn))
        {
            this.directLookupExpr = this.dataLookupExpr;
            this.dataLookupExpr = this.parentColumn.dataLookupExpr +
                this.dataLookupExpr;
        }

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

    updateChildColumns: function()
    {
        // Do nothing; provided for fallback
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
            { delete query.filterCondition; }
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
