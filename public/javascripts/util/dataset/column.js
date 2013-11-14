(function(){

var Column = ServerModel.extend({
    _init: function (c, parent)
    {
        this._super();

        $.extend(this, c);

        // Calls _setUpColumn & updateChildColumns
        this.setParent(parent);

        this.aggregates = this.aggregates || {};

        $.extend(this._cloneExclude, {_ntInit: true});
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

    getSummary: function(successCallback, limit)
    {
        var col = this;

        limit = limit || 100;
        var colSumLoaded = function(resp)
        {
            col._summary = {};
            col._summaryLimit = limit;
            _(resp.columnSummaries || []).chain()
                .select(function(s) { return s.columnId == col.id; })
                .each(function(s)
                {
                    if ((s.topFrequencies || []).length > 0)
                    { col._summary[s.subColumnType] = s; }
                });

            if (_.isFunction(successCallback)) { successCallback(col._summary); }
        };

        if ($.isBlank(col._summary) || limit > col._summaryLimit)
        {
            col.view.makeRequest({inline: true,
                params: {method: 'getSummary', columnId: col.id, limit: limit},
                success: colSumLoaded});
        }
        else
        { if (_.isFunction(successCallback)) { successCallback(col._summary); } }
    },

    invalidateData: function()
    {
        delete this._summary;
        delete this._summaryLimit;
    },

    canUpdate: function()
    {
        return (this.view.isUnpublished() || !this.view.isDefault() || this.newBackend) &&
            this.view.hasRight('update_column');
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

    hide: function(successCallback, errorCallback, isBatch, skipReq)
    {
        return this.setVisible(false, successCallback, errorCallback, isBatch, skipReq);
    },

    setVisible: function(isVisible, successCallback, errorCallback, isBatch, skipReq)
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

        if (col.canUpdate() && !skipReq)
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
        if ($.subKeyDefined(newCol, 'updatedAggregate.value'))
        {
            col.aggregates[newCol.updatedAggregate.name] =
                parseFloat(newCol.updatedAggregate.value);
            col.view.aggregatesChanged(true);
        }
        else if (oldAgg !== col.format.aggregate) { col.view.aggregatesChanged(); }
    },

    setParent: function(parent)
    {
        if (parent instanceof Column)
        {
            this.parentColumn = parent;
            this.view = parent.view;
        }
        else // if (parent instanceof Dataset) // NOTE: if this ever becomes not the case, fixme for Node
        { this.view = parent; }

        this._setUpColumn();

        this.updateChildColumns();
    },

    filter: function(value, subColumnType, operator)
    {
        var col = this;
        if ($.isBlank(value))
        {
            col.clearFilter();
            return;
        }

        var md = $.extend(true, {}, col.view.metadata);
        var query = md.jsonQuery;

        // If there is already a filter for this column, clear it out
        col._clearFilterData(query);

        var colItem = { columnFieldName: col.fieldName };
        if (!$.isBlank(subColumnType) && _.isString(subColumnType))
        {
            if (col.view._useSODA2)
            { colItem.subColumn = subColumnType.toLowerCase(); }
            else
            { colItem.subColumn = subColumnType.toUpperCase(); }
        }

        // Special handling for human_address in location
        if (col.renderTypeName == 'location' && !$.isBlank(subColumnType) && $.isPlainObject(value))
        { value = JSON.stringify(value); }

        // Update the parent view with the new filter
        var filterItem = $.extend({ operator: operator || 'EQUALS', value: value }, colItem);

        query.namedFilters = query.namedFilters || {};
        query.namedFilters['col' + col.id] = { where: filterItem };

        // Store the filter in an easier format to deal with elsewhere;
        //  also keep a pointer back to the viewFilter
        col.currentFilter = { value: value, viewFilter: filterItem };

        col.view.update({ metadata: md });
    },

    clearFilter: function()
    {
        var col = this;
        var md = $.extend(true, {}, col.view.metadata);
        col._clearFilterData(md.jsonQuery);
        col.view.update({ metadata: md });
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
            col.view.reload(true);
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
        this.dataType = blist.datatypes[this.dataTypeName] || {};
        this.renderType = blist.datatypes[this.renderTypeName] || {};
        this.isMeta = this.dataTypeName == 'meta_data';

        if (!$.isBlank(col.view))
        {
            col.lookup = col.view._useSODA2 ? col.fieldName : (col.isMeta ? col.name : col.id);
            // The use of id and uuid potentially causes collision with user column field names.
            // We already do in the catalog dataset because it has another id column.
            // Not fixing this yet.  Suggest to use prefix ":" for system columns.
            if (!col.view._useSODA2 && col.isMeta && col.name == 'sid') { col.lookup = 'id'; }
            else if (!col.view._useSODA2 && col.isMeta && col.name == 'id') { col.lookup = 'uuid'; }
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
            $.isBlank(((this.view.metadata.jsonQuery || {}).namedFilters ||
                {})['col' + this.id]))
        { delete this.currentFilter; }

        if (this.dataTypeName == 'nested_table' && !this._ntInit && !$.isBlank(this.view))
        {
            // This ID really shouldn't be changing; if it does, this URL
            // will be out-of-date...
            var selfUrl = '/views/' + this.view.id + '/columns/' + this.id;
            Column.addProperties(this, ColumnContainer('childColumn',
                    selfUrl + '.json', selfUrl + '/sub_columns'), Column.prototype);
            this._ntInit = true;
        }
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

    underscoreName: function(ds)
    {
        var col = this;
        var otherCol;
        var otherUname;
        var uname = Column.sanitizeName(col.name);

        for (var n = 0; n < ds.columns.length; n++)
        {
            otherCol = ds.columns[n];
            if (otherCol.id == col.id) { continue; }
            otherUname = Column.sanitizeName(otherCol.name);
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
        if (_.include(['dataset_link', 'nested_table', 'drop_down_list'],
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
        fieldName: true,
        flags: true,
        format: true,
        id: true,
        metadata: true,
        name: true,
        position: true,
        tableColumnId: true,
        width: true,
        fieldName: true
    }
});


Column.sanitizeName = function(colName)
{
    var sname = colName.toLowerCase()
    // refer to core server ViewColumn.underscoreName
    sname = sname.replace(/^[^A-z]+/gi, "_");
    sname = sname.replace(/[^A-z0-9]+/gi, "_");
    sname = sname.replace(/^xml/gi, "_");
    sname = sname.replace(/_+/gi, "_");
    return sname;
};

Column.closestViewFormat = function(realCol, funcOrLocalCol)
{
    var groupFunc = _.isString(funcOrLocalCol) || $.isBlank(funcOrLocalCol) ?
        funcOrLocalCol : funcOrLocalCol.format.group_function;
    if (groupFunc != realCol.format.group_function)
    {
        // Fix up view format
        var vt = realCol.renderType.viewTypes;
        if (_.isFunction(vt)) { vt = vt(groupFunc, true); }
        if (!_.any(vt, function(v) { return v.value == realCol.format.view; }))
        {
            if ($.isBlank(realCol.format.view))
            { return _.first(vt).value; }

            // None found! Find a reasonable default
            // Prefer longest matching substring; otherwise use levenshtein distance
            return _.first(_.sortBy(_.map(vt, function(v)
                { return { value: v.value,
                             distance: v.value.startsWith(realCol.format.view) ?
                                1/realCol.format.view.length :
                                realCol.format.view.startsWith(v.value) ? 1/v.value.length :
                                realCol.format.view.heuristicDistance(v.value) }; }),
                    'distance')).value;
        }
    }
    return null;
};

if (blist.inBrowser)
{ this.Column = Column; }
else
{ module.exports = Column; }

})();
