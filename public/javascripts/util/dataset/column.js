(function(){

this.Column = ServerModel.extend({
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
            var selfUrl = '/views/' + this.view.id + '/columns/' + this.id;
            Column.addProperties(this, ColumnContainer('childColumn',
                    selfUrl + '.json', selfUrl + '/sub_columns'), Column.prototype);
        }

        this._setUpColumn();

        this.aggregates = {};

        this.updateChildColumns();
    },

    baseUrl: function()
    {
        if (this.renderTypeName == 'geospatial')
        {
            return '/api/views/' + this.view.id + '/geometry/';
        }
        else
        {
            return '/views/' + this.view.id + '/' +
                (this.renderTypeName.endsWith('_obsolete') ?
                    'obsolete_' : '') + 'files/';
        }
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
            col.view.makeRequest({inline: true,
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

    canUpdate: function()
    {
        return (this.view.isUnpublished() || !this.view.isDefault()) && this.view.hasRight('update_column');
    },

    save: function(successCallback, errorCallback)
    {
        var col = this;

        var colSaved = function(newCol)
        {
            col.update(newCol, true);
            if (!$.isBlank(col.parentColumn))
            { col.parentColumn.updateChildColumns(); }
            else { col.view.updateColumns(); }
            if (_.isFunction(successCallback)) { successCallback(col); }
        };

        if (col.canUpdate())
        {
            this.makeRequest({url: '/views/' + this.view.id +
                    '/columns/' + this.id + '.json', type: 'PUT',
                    data: JSON.stringify(this.cleanCopy()),
                    success: colSaved, error: errorCallback});
            return true;
        }
        else
        {
            if (!$.isBlank(col.parentColumn))
            { col.parentColumn.updateChildColumns(); }
            else { col.view.updateColumns(); }
            col.view._markTemporary();
            return false;
        }
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

        if (col.canUpdate())
        {
            this.makeRequest({url: '/views/' + this.view.id + '/columns/' +
                this.id + '.json', type: 'PUT',
                data: JSON.stringify({hidden: !isVisible}),
                batch: isBatch, success: successCallback, error: errorCallback});
        }
        else { col.view._markTemporary(); }

        return true;
    },

    update: function(newCol, forceFull, updateColOrder)
    {
        var col = this;

        newCol.id = col.id;

        var oldWidth = col.width;
        var oldAgg = col.format.aggregate;

        if (forceFull)
        {
            // If we are updating the entire column, then clean out all the
            // valid keys; then the next lines will copy all the new ones over
            _.each(col._validKeys, function(v, k)
            { if (k != 'childColumns') { delete col[k]; } });
        }

        _.each(newCol, function(v, k)
        { if (k != 'childColumns' && col._validKeys[k]) { col[k] = v; } });

        // renderTypeName is not a valid key to post back, but we want to copy
        // it over if present
        if (!$.isBlank(newCol.renderTypeName))
        { col.renderTypeName = newCol.renderTypeName; }
        // Same for subColumnTypes
        if (!$.isBlank(newCol.subColumnTypes))
        { col.subColumnTypes = newCol.subColumnTypes; }

        this.updateChildColumns(newCol.childColumns, forceFull, updateColOrder);

        // dropDown is special, because it only comes from the server; it isn't
        // posted back, so it isn't considered valid
        if (!$.isBlank(newCol.dropDown)) { col.dropDown = newCol.dropDown; }

        this._setUpColumn();

        if (oldWidth !== col.width) { col.view.trigger('column_resized', [col]); }
        if (!$.isBlank(newCol.updatedAggregate))
        {
            col.aggregates[newCol.updatedAggregate.name] =
                parseFloat(newCol.updatedAggregate.value);
            col.view.aggregatesChanged(true);
        }
        else if (oldAgg !== col.format.aggregate) { col.view.aggregatesChanged(); }
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

        query.namedFilters = query.namedFilters || {};
        query.namedFilters['col' + col.id] = filterItem;

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
            if (!$.isBlank(col.parentColumn))
            { col.parentColumn.clearChildColumn(col); }
            else
            { col.view.clearColumn(col); }

            if (!isBatch)
            {
                if (!$.isBlank(col.parentColumn))
                { col.parentColumn.updateChildColumns(); }
                else { col.view.updateColumns(); }
            }
            if (_.isFunction(successCallback)) { successCallback(col); }
        };

        col.makeRequest({url: '/views/' + col.view.id + '/columns/' +
                col.id + '.json', type: 'DELETE', batch: isBatch,
                success: colRemoved, error: errorCallback});
    },

    convert: function(newType, successCallback, errorCallback)
    {
        var col = this;
        var columnConverted = function(newCol)
        {
            // Got new ID, so manually need to copy that over
            col.id = newCol.id;
            col.tableColumnId = newCol.tableColumnId;
            col.update(newCol, true);
            col.invalidateData();
            if (!$.isBlank(col.parentColumn))
            { col.parentColumn.updateChildColumns(); }
            else { col.view.updateColumns(); }
            // Need to refresh the view
            col.view.reload();
            if (_.isFunction(successCallback)) { successCallback(col); }
        };

        this.makeRequest({url: '/views/' + this.view.id + '/columns/' +
            this.id + '.json', params: {method: 'convert', type: newType},
            type: 'POST', success: columnConverted, error: errorCallback});
    },

    cleanCopy: function()
    {
        var col = this._super();
        // Support for picklists, linked columns
        if (_.include(['dataset_link', 'picklist'], col.dataTypeName))
        { delete col.dropDownList; }
        return col;
    },

    _setUpColumn: function()
    {
        var col = this;
        this.format = this.format || {};
        this.metadata = this.metadata || {};
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

        if (!$.isBlank(this.format.grouping_aggregate) &&
            !$.isBlank(this.format.drill_down))
        {
            delete this.format.drill_down;
            this.width -= 30;
        }

        if (!$.isBlank(this.currentFilter) &&
            $.isBlank(((this.view.query || {}).namedFilters ||
                {})['col' + this.id]))
        { delete this.currentFilter; }
    },

    updateChildColumns: function()
    {
        // Do nothing; provided for fallback
    },

    isLinked: function()
    {
        var col = this;
        return (col.format && col.format.linkedKey != null);
    },

    _sanitizeName: function(colName)
    {
        var sname = colName.toLowerCase()
        // refer to core server ViewColumn.underscoreName
        sname = sname.replace(/^[^A-z]+/gi, "_");
        sname = sname.replace(/[^A-z0-9]+/gi, "_");
        sname = sname.replace(/^xml/gi, "_");
        sname = sname.replace(/_+/gi, "_");
        return sname;
    },

    underscoreName: function(ds)
    {
        var col = this;
        var otherCol;
        var otherUname;
        var uname = this._sanitizeName(col.name);

        for (var n = 0; n < ds.columns.length; n++)
        {
            otherCol = ds.columns[n];
            if (otherCol.id == col.id) { continue; }
            otherUname = this._sanitizeName(otherCol.name);
            if (uname == otherUname)
            {
                uname += "_" + col.position;
                break;
            }
        }

        return uname;
    },

    _clearFilterData: function(query)
    {
        var col = this;
        if ($.isBlank(col.currentFilter)) { return; }
        delete query.namedFilters['col' + col.id];
        delete col.currentFilter;
    },

    canBeDatasetLink: function()
    {
        if (this.dataTypeName != 'text') { return false; }
        if (this.format && this.format.drill_down == true) { return false; }
        if (this.hidden) { return false; }
        return true;
    },

    canBeLinkSource: function()
    {
        if (_.include(['dataset_link', 'nested_table', 'drop_down_list', 'tag'],
            this.dataTypeName)) { return false; }
        if (this.hidden) { return false; }
        if (this.dataTypeName.indexOf('obsolete') >= 0) { return false; }
        return true;
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
        metadata: true,
        name: true,
        position: true,
        tableColumnId: true,
        width: true
    }
});

})();
