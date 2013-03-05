(function(){

/* Properties on Dataset:

    + displayType: from core server, this can be set by the client to tell the
        front-end how to render data.  Available values: 'calendar', 'chart',
        'map', 'form', 'api'
    + viewType: set by core server, this defines whether a dataset is tabular data,
        blobby data, or an href.  Possible values: 'tabular', 'blobby', 'href', 'geo'
    + type: set by this Model, it rolls up several pieces of data to give a simple
        type for the Dataset that code can check against.  Possible values:
        'blist', 'filter', 'grouped', 'chart', 'map', 'form', 'calendar',
        'blob', 'href', 'api'
    + styleClass: set by this Model, this can be set as a class on an HTML element
        to pick up styling for this type of Dataset
    + displayName: set by this Model, a displayable string that should used in the
        UI to indicate this item.  For example, it can be 'dataset',
        'filtered view', 'grouped view', etc.

    + temporary: True if the dataset has been modified and not saved
    + minorChange: Only valid when temporary is set.  If this is true, it is a
        minor update (such as a map viewport being changed) and doesn't
        really invalidate most actions like sharing, embedding, etc.
*/

var Dataset = ServerModel.extend({
    _init: function (v)
    {
        this._super();

        this.registerEvent(['columns_changed', 'valid', 'query_change',
            'set_temporary', 'clear_temporary', 'row_change', 'blob_change',
            'row_count_change', 'column_resized', 'displayformat_change',
            'displaytype_change', 'column_totals_changed', 'removed',
            'permissions_changed', 'new_comment', 'reloaded']);

        var cObj = this;
        // Avoid overwriting functions with static values from Rails (e.g., totalRows)
        _.each(v, function(curVal, key)
            { if (!_.isFunction(cObj[key])) { cObj[key] = curVal; } });

        if (!(blist.viewCache[this.id] instanceof Dataset))
        { blist.viewCache[this.id] = this; }

        // This ID really shouldn't be changing; if it does, this URL
        // will be out-of-date...
        var selfUrl = '/views/' + this.id;
        Dataset.addProperties(this, ColumnContainer('column',
                selfUrl + '.json', selfUrl + '/columns'), $.extend({}, this));

        if (!$.isBlank(this.approvalHistory))
        { Dataset.addProperties(this, Dataset.modules.approvalHistory, $.extend({}, this)); }

        this.updateColumns(this.initialMetaColumns, false, true);
        delete this.initialMetaColumns;

        this._adjustProperties();
        this._updateGroupings();

        this.temporary = false;
        this.minorChange = true;
        this.valid = this._checkValidity();

        // We need an active row set to start
        this._savedRowSet = new RowSet(this, {orderBys: (this.query || {}).orderBys,
            filterCondition: this.cleanFilters()}, null, this.initialRows);
        delete this.initialRows;
        this._activateRowSet(this._savedRowSet);

        this._pendingRowEdits = {};
        this._pendingRowDeletes = {};

        this._aggregatesStale = true;

        this._origObj = this.cleanCopy();

        this._commentCache = {};
        this._commentByID = {};

        if (!$.isBlank(blist.snapshot) && blist.snapshot.takeSnapshot)
        {
            this.snapshotting = true;

            if (!$.isBlank(blist.snapshot.forcedTimeout))
            {
                this._setupDefaultSnapshotting(blist.snapshot.forcedTimeout * 1000);
            }
            else if (_.isFunction(this.supportsSnapshotting) && this.supportsSnapshotting())
            {
                if (_.isFunction(this._setupSnapshotting))
                {
                    this._setupSnapshotting();
                }
            }
            else
            {
                this._setupDefaultSnapshotting(5000);
            }
        }
    },

    rowForID: function(id)
    {
        return this._activeRowSet.rowForID(id);
    },

    rowForIndex: function(index)
    {
        return this._activeRowSet.rowForIndex(index);
    },

    rowIndex: function(id, successCallback)
    {
        this._activeRowSet.rowIndex(id, successCallback);
    },

    totalRows: function()
    { return this._activeRowSet.totalRows(); },

    isDefault: function() { return _.include(this.flags || [], 'default'); },

    isPublic: function()
    {
        var ds = this;
        return _.any(this.grants || [], function(grant)
        { return _.include(grant.flags || [], 'public') &&
            ((ds.type == 'form' && grant.type == 'contributor') ||
                ds.type != 'form'); });
    },

    isAnonymous: function(isAnon)
    {
        if (!$.isBlank(isAnon)) { this._isAnon = isAnon; }
        if ($.isBlank(this._isAnon)) { this._isAnon = false; }
        return this._isAnon;
    },

    hasRight: function(right)
    {
        return _.include(this.rights, right);
    },

    canEdit: function()
    {
        return (this.hasRight('write') || this.hasRight('add') || this.hasRight('delete')) &&
            !this.isGrouped() && !this.isAPI();
    },

    canUpdate: function()
    {
        return (this.isUnpublished() || !this.isDefault()) && this.hasRight('update_view');
    },

    isGrid: function()
    {
        return this.metadata.renderTypeConfig.visible.table;
    },

    isAltView: function()
    {
        return !_.isEqual(['table', 'fatrow', 'page'],
            this.metadata.availableDisplayTypes);
    },

    isGrouped: function()
    {
        return ((this.query || {}).groupBys || []).length > 0;
    },

    isFederated: function()
    {
        return !$.isBlank(this.domainCName);
    },

    isArcGISDataset: function()
    {
        if (this.metadata && this.metadata.custom_fields
            && this.metadata.custom_fields.Basic
            && this.metadata.custom_fields.Basic.Source)
        {
            return true;
        }
        return false;
    },

    isGeoDataset: function()
    {
        return (this.metadata && this.metadata.geo);
    },

    isBlobby: function()
    {
        return (this.type == 'blob');
    },

    isTabular: function()
    {
        return (this.viewType == 'tabular');
    },

    isAPI: function()
    {
        return (this.type == 'api');
    },

    isPublished: function()
    {
        return this.publicationStage == 'published';
    },

    isUnpublished: function()
    {
        return this.publicationStage == 'unpublished';
    },

    isSnapshot: function()
    {
        return this.publicationStage == 'snapshotted';
    },

    isImmutable: function()
    {
        return (this.isBlobby() || this.isGeoDataset());
    },

    renderWithArcGISServer: function()
    {
        // Render everything using ArcGIS Server since we can't preemptively tell
        // if something is more than 500 rows or not.
        return this.isArcGISDataset();
    },

    invalidMessage: function()
    {
        return this.message || 'Columns required for this view are missing';
    },

    save: function(successCallback, errorCallback, allowedKeys)
    {
        var ds = this;
        if (!ds.hasRight('update_view')) { return false; }

        var vizIds = $.isBlank(ds.visibleColumns) ? null :
            _.pluck(ds.visibleColumns, 'id');
        var dsSaved = function(newDS)
        {
            ds._savedRowSet = ds._activeRowSet;
            ds._update(newDS, true, false, true);
            if (!$.isBlank(vizIds) &&
                !_.isEqual(vizIds, _.pluck(ds.visibleColumns, 'id')))
            { ds.setVisibleColumns(vizIds); }
            if (_.isFunction(successCallback)) { successCallback(ds); }
        };

        this.makeRequest({url: '/views/' + this.id + '.json',
            type: 'PUT', data: JSON.stringify(cleanViewForSave(this, allowedKeys)),
            error: errorCallback,
            success: dsSaved
        });

        return true;
    },

    saveNew: function(successCallback, errorCallback)
    {
        var dsOrig = this;
        var dsCreated = function(newDS)
        {
            newDS = new Dataset(newDS);
            if (!$.isBlank(dsOrig.accessType))
            { newDS.setAccessType(dsOrig.accessType); }
            if (_.isFunction(successCallback)) { successCallback(newDS); }
        };

        if (dsOrig.displayType == 'map' && $.deepGet(dsOrig, 'childViews', '0') == dsOrig.id)
        {
            // Creating a map from table. CF needs a hack to be saved correctly from here. Bug 8320
            if (_.isArray((dsOrig.metadata || {}).conditionalFormatting))
            {
                dsOrig.metadata = dsOrig.metadata || {};
                var cf = dsOrig.metadata.conditionalFormatting.slice();
                dsOrig.metadata.conditionalFormatting = {};
                dsOrig.metadata.conditionalFormatting[dsOrig.id] = cf;
            }
            // Same problem, but filters. Bug 8287
            if (_.isUndefined((dsOrig.metadata || {}).query))
            {
                dsOrig.metadata = dsOrig.metadata || {};
                dsOrig.metadata.query = {};
                dsOrig.metadata.query[dsOrig.id] = $.extend(true, {}, { filterCondition: dsOrig.cleanFilters(true) });
            }
        }

        var ds = cleanViewForCreate(this);

        // Munge permissions for forms, since those don't get carried over
        // or inherited
        if (dsOrig.isPublic() && dsOrig.type == 'form')
        {
            ds.flags = ds.flags || [];
            ds.flags.push('dataPublicAdd');
        }

        this.makeRequest({url: '/views.json', type: 'POST',
            data: JSON.stringify(ds),
            error: errorCallback,
            success: dsCreated
        });
    },

    update: function(newDS, fullUpdate, minorUpdate)
    {
        var ds = this;
        // If any updated key exists but is set to invalid, then we can't save
        // it on this dataset; so make minorUpdate false
        if (!_.isEqual(newDS, ds._cleanUnsaveable(newDS)))
        { minorUpdate = false; }
        var copyFunc = minorUpdate ? cleanViewForSave : cleanViewForCreate;
        var origCopy = copyFunc(this);
        this._update(newDS, fullUpdate, fullUpdate);
        if (!_.isEqual(origCopy, copyFunc(this)))
        { this._markTemporary(minorUpdate); }
    },

    reload: function(reloadData, successCallback, errorCallback)
    {
        var ds = this;
        if (ds.isBlobby())
        {
            ds.trigger('blob_change');
            return;
        }
        ds._aggregatesStale = true;
        ds._activateRowSet(ds._savedRowSet);
        if (reloadData) { ds._invalidateAll(); }
        ds._activeRowSet.reload(successCallback, errorCallback);
        ds.trigger('reloaded');
    },

    simpleSort: function(colId, ascending)
    {
        var ds = this;
        var query = $.extend(true, {}, ds.query);
        var col = ds.columnForIdentifier(colId);
        if ($.isBlank(col))
        { delete query.orderBys; }
        else
        {
            query.orderBys = [{ expression:
                { columnId: col.id, type: 'column' }, ascending: ascending === true }];
        }

        ds.update({query: query}, false, (query.orderBys || []).length < 2);
    },

    showRenderType: function(rt, activeUid, force)
    {
        var ds = this;
        if (!force && ds.metadata.renderTypeConfig.visible[rt]) { return; }
        var md = $.extend(true, {}, ds.metadata);
        md.renderTypeConfig.visible[rt] = true;
        activeUid && $.deepSet(md, activeUid, 'renderTypeConfig', 'active', rt, 'id');
        ds.update({metadata: md}, false, true);
    },

    hideRenderType: function(rt)
    {
        var ds = this;
        if (!ds.metadata.renderTypeConfig.visible[rt]) { return; }
        var md = $.extend(true, {}, ds.metadata);
        delete md.renderTypeConfig.visible[rt];
        ds.update({metadata: md}, false, true);
    },

    toggleRenderType: function(rt)
    {
        if (this.metadata.renderTypeConfig.visible[rt])
        { this.hideRenderType(rt); }
        else
        { this.showRenderType(rt); }
    },

    userGrants: function()
    {
        return _.reject(this.grants || [],
                function(g) { return _.include(g.flags || [], 'public'); });
    },

    removeGrant: function(grant, successCallback, errorCallback)
    {
        var ds = this;

        var grantDeleted = function()
        {
            ds.grants = _.reject(ds.grants || [], function(g)
            {
                return (!$.isBlank(grant.userId) && grant.userId == g.userId) ||
                    (!$.isBlank(grant.userEmail) && grant.userEmail == g.userEmail);
            });
            if (_.isFunction(successCallback)) { successCallback(); }
        }

        ds.makeRequest({url: '/api/views/' + ds.id + '/grants/i',
            params: {method: 'delete'}, type: 'PUT', data: JSON.stringify(grant),
            success: grantDeleted, error: errorCallback});
    },

    createGrant: function(grant, successCallback, errorCallback, isBatch)
    {
        var ds = this;

        var grantCreated = function(response)
        {
            ds.grants = ds.grants || [];
            ds.grants.push(response);
            if (_.isFunction(successCallback)) { successCallback(); }
        };

        ds.makeRequest({url: '/api/views/' + ds.id + '/grants/',
                type: 'POST', data: JSON.stringify(grant), batch: isBatch,
                success: grantCreated, error: errorCallback});
    },

    replaceGrant: function(oldGrant, newGrant, successCallback, errorCallback)
    {
        var ds = this;

        var grantDeleted = function()
        {
            ds.createGrant(newGrant, successCallback, errorCallback);
        };

        // Core server only accepts creation or deletion for grants, so...
        ds.removeGrant(oldGrant, grantDeleted, errorCallback);
    },

    makePublic: function(successCallback, errorCallback)
    {
        var ds = this;

        var success = function()
        {
            ds.trigger('permissions_changed');
            if (_.isFunction(successCallback)) { successCallback.apply(ds, arguments); }
        };

        if (!ds.isPublic())
        {
            ds.grants = ds.grants || [];
            ds.grants.push({type: (ds.type == 'form' ? 'contributor' : 'viewer'),
                flags: ['public']});

            ds.makeRequest({url: '/views/' + ds.id, type: 'PUT',
                      params: {method: 'setPermission', value:
                         (ds.type == 'form' ? 'public.add' : 'public.read')},
                    success: success, error: errorCallback});
        }
        else { success(); }
    },

    makePrivate: function(successCallback, errorCallback)
    {
        var ds = this;

        var success = function()
        {
            ds.trigger('permissions_changed');
            if (_.isFunction(successCallback)) { successCallback.apply(ds, arguments); }
        };

        if (ds.isPublic())
        {
            ds.grants = _.reject(ds.grants,
                function(g) { return _.include(g.flags || [], 'public') &&
                    g.inherited !== true; });

            ds.makeRequest({url: '/views/' + ds.id + '.json', type: 'PUT',
                    params: {method: 'setPermission', value: 'private'},
                    success: success, error: errorCallback});
        }
        else { success(); }
    },

    notifyUsers: function(successCallback, errorCallback)
    {
        this.makeRequest({url: '/api/views/' + this.id + '.json',
            params: {method: 'notifyUsers'}, type: 'POST',
            success: successCallback, error: errorCallback});
    },

    addColumn: function(column, successCallback, errorCallback, customParams)
    {
        if (!$.isBlank((column || {}).parentId))
        {
            var par = this.columnForID(column.parentId);
            if ($.isBlank(par))
            { throw 'Column ' + column.parentId + ' not found'; }
            par.addChildColumn(column, successCallback, errorCallback);
            // True means abort (don't handle)
            return true;
        }
    },

    getTotalRows: function(successCallback, errorCallback)
    {
        this._activeRowSet.getTotalRows(successCallback, errorCallback);
    },

    getClusters: function(viewport, displayFormat, minDistance, successCallback, errorCallback)
    {
        var ds = this;
        if (!ds._clusters)
        { ds._clusters = {}; }
        if (!ds._rowClusterParents)
        { ds._rowClusterParents = {}; }

        if (!($.subKeyDefined(displayFormat, 'plot.locationId')
            && (ds.columnForIdentifier(displayFormat.plot.locationId) || {})
                .renderTypeName == 'location'))
        { errorCallback(); return; }

        var params = {method: 'clustered2'};
        _.each({ 'xmin': 'min_lon',
                 'xmax': 'max_lon',
                 'ymin': 'min_lat',
                 'ymax': 'max_lat'}, function(new_prop, old_prop)
        { params[new_prop] = viewport[old_prop] });

        params['target_node_clusters'] = 250;
        params['min_distance_between_clusters'] = minDistance;
        if (!params['min_distance_between_clusters'])
        {
            params['min_distance_between_clusters'] = Math.min(viewport.xmax - viewport.xmin,
                                                               viewport.ymax - viewport.ymin) / 10;
            if (params['min_distance_between_clusters'] > 5)
            { params['min_distance_between_clusters'] = 5; }
            else if (params['min_distance_between_clusters'] > 1)
            { params['min_distance_between_clusters'] = 1; }
        }

        var translateCluster = function(c)
        {
            c.parent   = ds._clusters[c.pathToRoot[0]];
            ds._clusters[c.id] = c;
            _.each(c.points, function(point) { ds._rowClusterParents[point] = c; });
            _.each(c.children, function(child)
            {
                if (ds._clusters[child] && !ds._clusters[child].parent)
                { ds._clusters[child].parent = ds._clusters[ds._clusters[child].pathToRoot[0]]; }
            });
            _.each(c.polygon, function(vertex)
            { if (vertex.lat == 90)        { vertex.lat -= 0.000001; }
              else if (vertex.lat == -90)  { vertex.lat += 0.000001; }
              if (vertex.lon == 180)       { vertex.lon -= 0.000001; }
              else if (vertex.lon == -180) { vertex.lon += 0.000001; }
            });
            c.leafNode = (c.points || []).length > 0;
        };

        var useInline = ds.isDefault()
                        || $.subKeyDefined(ds, 'query.filterCondition')
                        || ds.cleanFilters()
                        || !$.isBlank(ds.searchString)
                        || (!$.isBlank(displayFormat) && !_.isEqual(displayFormat, ds.displayFormat));

        var reqData;
        if (useInline)
        {
            if ($.subKeyDefined(ds, 'query.namedFilters.viewport'))
            {
                var tmp = ds.query.namedFilters.viewport;
                delete ds.query.namedFilters.viewport;
                reqData = ds.cleanCopy();
                ds.query.namedFilters.viewport = tmp;
            }
            else
            { reqData = ds.cleanCopy(); }

            if (!$.isBlank(displayFormat)) { reqData.displayFormat = displayFormat; }
            reqData = JSON.stringify(reqData);
        }
        if (params['max_lon'] < params['min_lon'])
        {
            var viewportsLeft = 2;
            var totalData = [];
            var callback = function(data)
            {
                viewportsLeft--;
                totalData = totalData.concat(data);
                ds.trigger('row_count_change');
                if (viewportsLeft == 0)
                { successCallback(totalData); }
            };
            ds.makeRequest({
                url: '/views/' + ds.id + '/rows.json',
                params: $.extend({}, params, { 'min_lon': -179.999999 }),
                data: reqData, inline: useInline,
                success: function(data) { _.each(data, translateCluster); callback(data); },
                error: errorCallback
            });
            ds.makeRequest({
                url: '/views/' + ds.id + '/rows.json',
                params: $.extend({}, params, { 'max_lon': 179.999999 }),
                data: reqData, inline: useInline,
                success: function(data) { _.each(data, translateCluster); callback(data); },
                error: errorCallback
            });
        }
        else
        { ds.makeRequest({
            url: '/views/' + ds.id + '/rows.json',
            params: params, data: reqData, inline: useInline,
            success: function(data)
            {
                _.each(data, translateCluster);
                ds.trigger('row_count_change');
                successCallback(data);
            },
            error: errorCallback
        }); }
    },

    // Callback may be called multiple times with smaller batches of rows
    getRows: function(start, len, successCallback, errorCallback)
    {
        this._activeRowSet.getRows(start, len, successCallback, errorCallback);
    },

    getAllRows: function(successCallback, errorCallback)
    {
        this._activeRowSet.getAllRows(successCallback, errorCallback);
    },

    getRowsByIds: function(ids, successCallback, errorCallback)
    {
        this._activeRowSet.getRows(ids, null, successCallback, errorCallback);
    },

    loadedRows: function()
    {
        return this._activeRowSet.loadedRows();
    },

    // Assume it goes at the end
    createRow: function(data, parRowId, parColId, successCallback, errorCallback)
    {
        var ds = this;

        var parCol;
        if (!$.isBlank(parColId)) { parCol = this.columnForID(parColId); }
        var parRow;
        if (!$.isBlank(parRowId)) { parRow = this.rowForID(parRowId); }

        data = data || {};
        var newRow = {invalid: {}, error: {}, changed: {}};
        _.each(!$.isBlank(parCol) ? parCol.childColumns : ds.columns, function(c)
        {
            if (!$.isBlank(data[c.lookup]))
            { newRow[c.lookup] = data[c.lookup]; }
        });
        newRow.id = 'saving' + _.uniqueId();
        delete newRow.uuid;

        _.each(!$.isBlank(parCol) ? parCol.realChildColumns : ds.realColumns,
            function(c) { newRow.changed[c.lookup] = true; });

        if ($.isBlank(parRow))
        {
            ds._addRow(newRow, data.index);
        }
        else
        {
            parRow[parCol.lookup] = parRow[parCol.lookup] || [];
            if (!$.isBlank(data.index))
            { parRow[parCol.lookup].splice(data.index, 0, newRow); }
            else { parRow[parCol.lookup].push(newRow); }
            ds._updateRow(parRow);
            ds.trigger('row_change', [[parRow], true]);
        }

        var key = newRow.id;
        if (!$.isBlank(parRow)) { key += ':' + parRow.id +  ':' + parCol.id; }
        ds._pendingRowEdits[key] = [];

        var reqObj = {row: newRow, rowData: ds._rowData(newRow,
            _.pluck(_.reject(!$.isBlank(parCol) ? parCol.realChildColumns :
                ds.realColumns, function(c)
                { return c.dataTypeName == 'nested_table'; }), 'id'), parCol),
            parentRow: parRow, parentColumn: parCol,
            success: successCallback, error: errorCallback};
        if ($.isBlank(ds._pendingRowCreates))
        {
            ds._serverCreateRow(reqObj);
            ds._pendingRowCreates = [];
        }
        else
        { ds._pendingRowCreates.push(reqObj); }

        return newRow.id;
    },


    setRowValue: function(value, rowId, columnId, isInvalid, parRowId, parColId)
    {
        var parCol;
        var col;
        if (!$.isBlank(parColId))
        {
            parCol = this.columnForID(parColId);
            col = parCol.childColumnForID(columnId);
        }
        else { col = this.columnForID(columnId); }

        if ($.isBlank(col)) { throw 'Column ' + columnId + ' not found'; }
        if (col.isMeta) { throw 'Cannot modify metadata on rows: ' + columnId; }

        var row;
        if (!$.isBlank(parRowId))
        {
            var parRow = this.rowForID(parRowId);
            row = this._activeRowSet.childRowForID(rowId, parRow, parCol);
        }
        else
        { row = this.rowForID(rowId); }
        if ($.isBlank(row))
        { throw 'Row ' + rowId + ' not found while setting value ' + value; }

        row[col.lookup] = value;

        delete row.error[col.lookup];

        row.changed[col.lookup] = true;

        row.invalid[col.lookup] = isInvalid || false;

        this._activeRowSet.updateRow(parRow || row);

        this.trigger('row_change', [[parRow || row]]);
    },

    saveRow: function(rowId, parRowId, parColId, successCallback, errorCallback, useBatch)
    {
        var ds = this;
        var parCol;
        if (!$.isBlank(parColId)) { parCol = this.columnForID(parColId); }

        var parRow;
        var row;
        if (!$.isBlank(parRowId))
        {
            parRow = this.rowForID(parRowId);
            row = this._activeRowSet.childRowForID(rowId, parRow, parCol);
        }
        else
        { row = this.rowForID(rowId); }
        if ($.isBlank(row))
        { throw 'Row ' + rowId + ' not found while saving'; }

        // Keep track of which columns need to be saved, and only use those values
        var saving = _.keys(row.changed);

        var sendRow = ds._rowData(row, saving, parCol);

        var reqObj = {row: row, rowData: sendRow, columnsSaving: saving,
            parentRow: parRow, parentColumn: parCol,
            success: successCallback, error: errorCallback};

        var key = row.id;
        if (!$.isBlank(parRow)) { key += ':' + parRow.id + ':' + parCol.id; }
        if (!$.isBlank(ds._pendingRowEdits[key]))
        {
            ds._pendingRowEdits[key].push(reqObj);
            return;
        }

        ds._pendingRowEdits[key] = [];
        ds._serverSaveRow(reqObj, useBatch);
    },

    removeRows: function(rowIds, parRowId, parColId,
        successCallback, errorCallback)
    {
        var ds = this;
        rowIds = $.makeArray(rowIds);

        var parCol;
        if (!$.isBlank(parColId)) { parCol = this.columnForID(parColId); }
        var parRow;
        if (!$.isBlank(parRowId)) { parRow = this.rowForID(parRowId); }

        _.each(rowIds, function(rId)
        {
            // Subrows need UUID
            var uuid;
            if ($.isBlank(parRow))
            {
                var r = ds.rowForID(rId);
                if ($.isBlank(r)) { return; }
                uuid = r.uuid;
                ds._removeRow(r);
            }
            else
            {
                parRow[parCol.lookup] = _.reject(parRow[parCol.lookup],
                    function(cr)
                    {
                        if (cr.id == rId)
                        {
                            uuid = cr.uuid;
                            return true;
                        }
                        return false;
                    });
                ds._updateRow(parRow);
            }

            var key = rId;
            if (!$.isBlank(parRow)) { key += ':' + parRow.id + ':' + parCol.id; }
            if (!$.isBlank(ds._pendingRowEdits[key]))
            {
                ds._pendingRowDeletes[key] = {rowId: uuid, parRowId: parRowId,
                    parColId: parColId};
                return;
            }

            ds._serverRemoveRow(uuid, parRowId, parColId, true);
        });

        if (!$.isBlank(parRow)) { ds.trigger('row_change', [[parRow], true]); }
        else { ds.trigger('row_count_change'); }
        ds._aggregatesStale = true;
        _.each(!$.isBlank(parCol) ? parCol.realChildColumns : ds.realColumns,
            function(c) { c.invalidateData(); });
        ServerModel.sendBatch({success: successCallback, error: errorCallback});
    },

    markRow: function(markType, value, row)
    {
        _.each(this._availableRowSets, function(rs) { rs.markRow(markType, value, row); });
    },

    highlightRows: function(rows, type, column, isAdd)
    {
        var ds = this;
        rows = $.makeArray(rows);

        type = type || 'default';
        ds.highlightTypes = ds.highlightTypes || {};
        ds.highlightsColumn = ds.highlightsColumn || {};
        if (!isAdd)
        {
            if (!$.isBlank(ds.highlightTypes[type]))
            {
                var newIds = {};
                _.each(rows, function(r) { newIds[r.id] = true; });
                ds.unhighlightRows(_.reject(ds.highlightTypes[type],
                    function(row, rId)
                    {
                        return newIds[rId] && ($.isBlank(column) && $.isBlank(ds.highlightsColumn[rId]) ||
                                (column || {}).id == ds.highlightsColumn[rId]);
                    }), type);
            }
            else
            { ds.highlightTypes[type] = {}; }
        }

        ds.highlights = ds.highlights || {};
        var rowChanges = [];
        for (var i = 0; i < rows.length; i++)
        {
            var row = rows[i];
            ds.highlightTypes[type][row.id] = row;
            if (!ds.highlights[row.id])
            {
                ds.highlights[row.id] = true;
                if (!$.isBlank(column))
                { ds.highlightsColumn[row.id] = column.id; }
                var realRow = ds.rowForID(row.id);
                if (!$.isBlank(realRow))
                {
                    ds.markRow('highlight', true, realRow);
                    if (!$.isBlank(column))
                    { ds.markRow('highlightColumn', column.id, realRow); }
                }
                rowChanges.push(realRow || row);
            }
        }
        if (rowChanges.length > 0)
        { ds.trigger('row_change', [rowChanges]); }
    },

    unhighlightRows: function(rows, type)
    {
        var ds = this;
        rows = $.makeArray(rows);
        type = type || 'default';
        ds.highlightTypes = ds.highlightTypes || {};

        ds.highlights = ds.highlights || {};
        ds.highlightsColumn = ds.highlightsColumn || {};
        var rowChanges = [];
        for (var i = 0; i < rows.length; i++)
        {
            var row = rows[i];
            if (!$.isBlank(ds.highlightTypes[type]))
            { delete ds.highlightTypes[type][row.id]; }

            if (_.any(ds.highlightTypes, function(hHash)
                { return !$.isBlank(hHash[row.id]); }))
            { continue; }

            if (ds.highlights[row.id])
            {
                delete ds.highlights[row.id];
                delete ds.highlightsColumn[row.id];
                var realRow = ds.rowForID(row.id);
                if (!$.isBlank(realRow))
                {
                    ds.markRow('highlight', false, realRow);
                    ds.markRow('highlightColumn', null, realRow);
                }
                rowChanges.push(realRow || row);
            }
        }
        if (rowChanges.length > 0)
        { ds.trigger('row_change', [rowChanges]); }
    },

    rowToSODA2: function(row)
    {
        var r = {};
        _.each(this.columns, function(c)
        {
            r[c.fieldName] = row[c.lookup];
            if (c.renderTypeName == 'location' && $.subKeyDefined(r[c.fieldName], 'human_address') &&
                _.isString(r[c.fieldName].human_address))
            { r[c.fieldName].human_address = JSON.parse(r[c.fieldName].human_address); }
            // Do we expect SODA2 to actually return real values or not? For
            // current use cases, this is valid; but maybe not forever
            if (c.renderTypeName == 'drop_down_list' && !$.isBlank(r[c.fieldName]))
            { r[c.fieldName] = c.renderType.renderer(r[c.fieldName], c, true); }
        });
        return r;
    },

    getAggregates: function(callback, customAggs)
    {
        var ds = this;
        var aggResult = function(aggs)
        {
            _.each(aggs, function(a)
            {
                var c = ds.columnForID(a.columnId);
                // Might be a child column...
                if ($.isBlank(c))
                {
                    // Look through each nested table, and find if it has a child
                    // column -- find the first real one
                    _.each(ds.columnsForType('nested_table', true), function(pc)
                    { c = c || pc.childColumnForID(a.columnId); });
                }
                if (!$.isBlank(c))
                { c.aggregates[a.name] = $.isBlank(a.value) ? null : parseFloat(a.value); }
            });

            ds._aggregatesStale = false;
            ds.trigger('column_totals_changed');
            if (_.isFunction(callback)) { callback(); }
        };

        // If aggregates are stale, clear them all out to avoid confusion
        if (ds._aggregatesStale)
        { _.each(ds.realColumns, function(c) { c.aggregates = {}; }); }

        var isStale = ds._aggregatesStale ||
            _.any(customAggs || {}, function(aList, cId)
            {
                var col = ds.columnForID(cId);
                if ($.isBlank(col)) { return true; }
                return _.any($.makeArray(aList),
                    function(a) { return $.isBlank(col.aggregates[a]); });
            }) || $.isBlank(customAggs) &&
            _.any(ds.visibleColumns, function(c)
            {
                return $.subKeyDefined(c.format.aggregate) &&
                    $.isBlank(c.aggregates[c.format.aggregate]);
            });

        if (isStale)
        { ds._activeRowSet.getAggregates(aggResult, customAggs); }
        else if (_.isFunction(callback))
        { callback(); }
    },

    aggregatesChanged: function(skipStale)
    {
        if (!skipStale) { this._aggregatesStale = true; }
        this.trigger('column_totals_changed');
    },

    updateRating: function(rating, successCallback, errorCallback)
    {
        this.makeRequest({url: '/views/' + this.id + '/ratings.json',
            type: 'POST', data: JSON.stringify(rating),
            success: successCallback, error: errorCallback});
    },

    remove: function(successCallback, errorCallback)
    {
        var ds = this;
        var dsRemoved = function()
        {
            ds.trigger('removed');
            if (_.isFunction(successCallback)) { successCallback(); }
        };

        ds.makeRequest({url: '/views/' + ds.id + '.json',
            type: 'DELETE', success: dsRemoved, error: errorCallback});
    },

    registerOpening: function(referrer)
    {
        var params = {method: 'opening'};
        if (!$.isBlank(referrer)) { params.referrer = referrer; }
        this.makeRequest({url: '/views/' + this.id + '.json', params: params, type: 'POST'});
    },

    downloadUrl: function(type)
    {
        if (this.isGeoDataset())
        {
            return this.metadata.geo.owsUrl + '?method=export&format=' + type;
        }
        return '/api/views/' + this.id + '/rows.' + type.toLowerCase() + '?accessType=DOWNLOAD';
    },

    _getCommentCacheKey: function(comment)
    {
        return $.isBlank(comment.rowId) ? this.id :
            _.compact([comment.rowId, comment.tableColumnId]).join('_');
    },

    getComments: function(callback, rowId, tcId)
    {
        var ds = this;
        var cacheId = ds._getCommentCacheKey({rowId: rowId, tableColumnId: tcId});
        if ($.isBlank(ds._commentCache[cacheId]))
        {
            ds.makeRequest({url: '/views/' + ds.id + '/comments.json',
                params: !$.isBlank(rowId) ? {r: rowId} : null,
                type: 'GET', pageCache: true, success: function(comms)
                {
                    ds._commentCache[cacheId] = ds._commentCache[cacheId] || [];
                    _.each(comms, function(c)
                    {
                        ds._commentByID[c.id] = c;
                        var ccId = ds._getCommentCacheKey(c);
                        ds._commentCache[ccId] = ds._commentCache[ccId] || [];
                        ds._commentCache[ccId].push(c);
                    });
                    callback(ds._commentCache[cacheId]);
                }});
        }
        else { callback(ds._commentCache[cacheId]); }
    },

    getCommentLocations: function(callback)
    {
        var ds = this;
        if ($.isBlank(ds._commentLocations))
        {
            ds.makeRequest({url: '/views/' + ds.id + '/comments.json',
                params: {method: 'getCellsWithComments'}, type: 'GET', pageCache: true,
                success: function(ci)
                {
                    ds._commentLocations = {};
                    var rowChanges = {};
                    _.each(ci, function(item)
                    {
                        var c = ds.columnForTCID(item.tablecolumnid);
                        if ($.isBlank(c)) { return; }

                        ds._commentLocations[item.rowid] = ds._commentLocations[item.rowid] || {};
                        ds._commentLocations[item.rowid][item.tablecolumnid] = true;
                        var r = ds.rowForID(item.rowid);
                        if (!$.isBlank(r))
                        {
                            r.annotations = r.annotations || {};
                            r.annotations[c.lookup] = 'comments';
                            ds._updateRow(r);
                            rowChanges[item.rowid] = r;
                        }
                    });
                    ds.trigger('row_change', [_.values(rowChanges)]);
                    if (_.isFunction(callback))
                    { callback(ds._commentLocations); }
                }});
        }
        else { if(_.isFunction(callback)) { callback(ds._commentLocations); } }
    },

    addComment: function(comment, successCallback, errorCallback)
    {
        var ds = this;

        var cacheId = ds._getCommentCacheKey(comment);
        var addedComment = function(newCom)
        {
            if ($.isBlank(newCom.rowId))
            { ds.numberOfComments++; }
            if (!$.isBlank(ds._commentCache[cacheId])) { ds._commentCache[cacheId].unshift(newCom); }
            ds._commentByID[newCom.id] = newCom;

            if (!$.isBlank(ds._commentLocations) && !$.isBlank(newCom.rowId))
            {
                ds._commentLocations[newCom.rowId] = ds._commentLocations[newCom.rowId] || {};
                ds._commentLocations[newCom.rowId][newCom.tableColumnId] = true;
                var r = ds.rowForID(newCom.rowId);
                var c = ds.columnForTCID(newCom.tableColumnId);
                if (!$.isBlank(r) && !$.isBlank(c))
                {
                    r.annotations = r.annotations || {};
                    r.annotations[c.lookup] = 'comments';
                    ds._updateRow(r);
                    ds.trigger('row_change', [[r]]);
                }
            }

            ds.trigger('new_comment', [newCom, comment.parent]);
            if (_.isFunction(successCallback)) { successCallback(newCom); }
        };

        ds.makeRequest({url: '/views/' + ds.id + '/comments.json',
                type: 'POST', data: JSON.stringify(comment),
                success: addedComment, error: errorCallback});
    },

    removeComment: function(commentId, successCallback, errorCallback)
    {
        var ds = this;
        var com = ds._commentByID[commentId];

        if ($.isBlank(com)) return;

        ds.makeRequest({url: '/views/' + this.id + '/comments/' +
                commentId + '.json', type: 'DELETE',
                success: successCallback, error: errorCallback});
    },

    flagComment: function(commentId, successCallback, errorCallback)
    {
        var ds = this;

        var com = ds._commentByID[commentId];
        if (!$.isBlank(com))
        {
            com.flags = com.flags || [];
            if (!_.include(com.flags, 'flag')) { com.flags.push('flag'); }
        }

        ds.makeRequest({url: '/views/' + this.id + '/comments/' +
                commentId + '.json', type: 'PUT',
                data: JSON.stringify({ flags: [ 'flag' ] }),
                success: successCallback, error: errorCallback});
    },

    rateComment: function(commentId, thumbsUp, successCallback, errorCallback)
    {
        var ds = this;

        var com = ds._commentByID[commentId];
        if (!$.isBlank(com))
        {
            if ((com.currentUserRating || {}).thumbUp !== thumbsUp)
            {
                var dir = thumbsUp ? 'up' : 'down';
                com[dir + 'Ratings']++;
                if (!$.isBlank(com.currentUserRating))
                { com[(thumbsUp ? 'down' : 'up') + 'Ratings']--; }
                com.currentUserRating = com.currentUserRating || {};
                com.currentUserRating.thumbUp = thumbsUp;
            }
        }

        ds.makeRequest({url: '/views/' + ds.id + '/comments/' +
                commentId + '/ratings.json', params: {thumbsUp: thumbsUp},
                type: 'POST', success: successCallback, error: errorCallback});
    },

    getRelatedViewCount: function(callback)
    {
        var ds = this;
        if ($.isBlank(ds._relatedViews) && $.isBlank(ds._relViewCount))
        { ds._loadRelatedViews(function(c) { callback(c); }, true); }
        else if (!$.isBlank(ds._relViewCount))
        { callback(ds._relViewCount); }
        else
        { callback(ds._relatedViews.length); }
    },

    getParentDataset: function(callback)
    {
        var ds = this;
        if (($.isBlank(ds._parent) || $.isBlank(ds._parent.columns)) &&
            $.isBlank(ds.noParentAvailable))
        {
            ds.makeRequest({url: '/views/' + this.id + '.json',
                params: {method: 'getDefaultView'},
                success: function(parDS)
                {
                    if (parDS.id == ds.id)
                    { ds._parent = ds; }
                    else
                    {
                        ds._parent = new Dataset(parDS);
                        if (!$.isBlank(ds.accessType))
                        { ds._parent.setAccessType(ds.accessType); }
                    }
                    callback(ds._parent);
                },
                error: function(xhr)
                {
                    if (JSON.parse(xhr.responseText).code == 'permission_denied')
                    { ds.noParentAvailable = true; }
                    callback();
                }});
        }
        else { callback(ds._parent); }
    },

    // account for modifyingLens
    getParentView: function(callback)
    {
        var ds = this;

        if (($.isBlank(ds._modifyingView) || $.isBlank(ds._modifyingView.columns)) &&
            $.isBlank(ds.noModifyingViewAvailable))
        {
            if (!_.isUndefined(ds.modifyingViewUid))
            {
                Dataset.createFromViewId(ds.modifyingViewUid,
                    function(modifyingView)
                    {
                        ds._modifyingView = modifyingView;
                        if (!$.isBlank(ds.accessType))
                        { ds._modifyingView.setAccessType(ds.accessType); }
                        callback(ds._modifyingView);
                    },
                    function(xhr)
                    {
                        // doesn't seem possible but let's be safe
                        if (JSON.parse(xhr.responseText).code == 'permission_denied')
                        { ds.noModifyingViewAvailable = true; }
                        callback();
                    });
            }
            else
            {
                ds.getParentDataset(callback);
            }
        }
        else { callback(ds._modifyingView); }
    },

    getRelatedViews: function(callback)
    {
        var ds = this;
        if ($.isBlank(ds._relatedViews))
        {
            ds._loadRelatedViews(function()
            { callback(ds._relatedViews); });
        }
        else { callback(ds._relatedViews); }
    },

    getViewForDisplay: function(type, callback)
    {
        // in most cases, it's just the dataset
        var vft = this._childViewsForType(type);
        if (!vft)
        {
            callback(this);
            return;
        }

        // figure out which underlying view to show
        var typeDisplay = $.deepGet(true, this, 'metadata',
                'renderTypeConfig', 'active', type);
        if (!typeDisplay.id)
        { typeDisplay.id = vft[0]; }

        this._getChildView(typeDisplay.id, callback);
    },

    getChildOptionsForType: function(type, callback)
    {
        var ds = this;
        var children = ds._childViewsForType(type);
        if (!children)
        { callback([ds]); }
        else
        {
            var options = [];
            _.each(children, function(childUid) {
                ds._getChildView(childUid, function(child) {
                    options.push(child);
                }, true);
            });
            ServerModel.sendBatch(function() {
                // success
                callback(options);
            });
        }
    },

    redirectTo: function(urlparams)
    {
        var qs = '';
        if (!$.isBlank(urlparams))
        {
            qs = '?' + $.toParam(urlparams);
        }
        window.location = this.url + qs;
    },

    getSignature: function(successCallback, errorCallback)
    {
        // If not already signed, then we need to create it first
        this.makeRequest({url: '/views/' + this.id + '/signatures.json',
            type: (this.signed === true) ? 'GET' : 'POST',
            success: successCallback, error: errorCallback});
    },

    _cachedLinkedColumnOptions: {},

    getLinkedColumnOptions: function(keyCol, notUsed, $field, curVal)
    {
        var ds = this;
        var localKeyColumnId = keyCol && keyCol["format.linkedKey"] ?
            keyCol["format.linkedKey"] : keyCol;

        if ($.isBlank(localKeyColumnId) || isNaN(localKeyColumnId))
        {
            return [];
        }

        var viewUid = ds.columnForID(localKeyColumnId).format.linkedDataset;

        if ($.isBlank(viewUid) || !viewUid.match(blist.util.patterns.UID))
        {
            return [];
        }

        if ($.isBlank(ds._cachedLinkedColumnOptions[viewUid]))
        {
            ds.makeRequest({url: '/api/views/' + viewUid + '.json',
                pageCache: true, type: 'GET',
                error: function(req)
                {
                    alert(JSON.parse(req.responseText).message);
                },
                success: function(linkedDataset)
                {
                    var lds = new Dataset(linkedDataset);
                    if (!$.isBlank(ds.accessType))
                    { lds.setAccessType(ds.accessType); }
                    ds._cachedLinkedColumnOptions[viewUid] = [];
                    var cldo = ds._cachedLinkedColumnOptions[viewUid];
                    var opt;

                    _.each(lds.columns || [], function(c)
                    {
                        if (c.canBeLinkSource())
                        {
                            opt = {value: String(c.fieldName), text: c.name,
                                dataType: c.dataTypeName};
                            cldo.push(opt);
                        }
                    });
                    if (ds._cachedLinkedColumnOptions[viewUid].length <= 0)
                    {
                        alert('Dataset ' + viewUid + ' does not have any columns.');
                    }
                    else
                    {
                        $field.data('linkedFieldValues', '_reset');
                        _.each($field.data('linkedGroup'), function(f) {
                            $(f).trigger('change');
                        });
                        _.defer(function() { $field.val(curVal); });
                    }
                }});
             return [];
        }

        // set up another key to get the remote columns.  used by add new
        // column dialog.
        ds._cachedLinkedColumnOptions[localKeyColumnId] =
            ds._cachedLinkedColumnOptions[viewUid];

        return ds._cachedLinkedColumnOptions[viewUid];
    },

    getLinkSourceDataType: function(col, linkSrcColId, keyColId)
    {
        var localKeyColId = col && col.format ? col.format['linkedKey'] : keyColId;
        var ds = blist.dataset;
        var keyCol = ds.columnForID(localKeyColId);
        if (keyCol == undefined) { return null; }
        var viewUid = keyCol.format.linkedDataset;
        var remoteColumns = ds._cachedLinkedColumnOptions[viewUid];
        if (remoteColumns == null) { return null; }

        for (var n = remoteColumns.length - 1; n >= 0; n--)
        {
            if (remoteColumns[n].value == linkSrcColId)
            {
                var dt = remoteColumns[n].dataType;
                return { value: dt, text: blist.datatypes[dt].title };
            }
        }

        return null;
    },

    hasDatasetLinkColumn: function()
    {
        // no link column in bnb
        var ds = this;
        if (ds && ds.parentId) { return false; }
        return _.any(ds.columns,
            function(c)
            {
                return (c.dataTypeName == 'dataset_link');
            });
    },

    supportsSnapshotting: function()
    {
        // if you don't override me, you don't know how to be snapshotted
        return false;
    },

    takeSnapshot: function()
    {
        var name = blist.snapshot.name;
        // use the current viewport
        setTimeout(function()
                   {
                       socrataScreenshot.defineRegion(name, 0, 0, window.innerWidth, window.innerHeight);
                       socrataScreenshot.snap(name);
                       socrataScreenshot.done();
                   }, 1000);
    },


    getFullSnapshotUrl: function(name)
    {
        name = this._getThumbNameOrDefault(name);

        if ($.isBlank(this._getCroppedThumbnailMeta(name)))
        { return null; }

        return this.getSnapshotNamed(name);
    },

    getSnapshotNamed: function(name)
    {
        return '/api/views/' + this.id + '/snapshots/' + escape(name);
    },

    getCroppedSnapshotUrl: function(name)
    {
        name = this._getThumbNameOrDefault(name);
        // make sure the crop has been created
        var meta = this._getCroppedThumbnailMeta(name);
        if ($.isBlank(meta))
        {
            return null;
        }

        return this.getSnapshotNamed(meta.filename);
    },

    // ask the core server to take a new picture
    requestSnapshot: function(name, callback)
    {
        this._updateSnapshot('snapshot', name, callback);
    },

    cropSnapshot: function(name, callback)
    {
        this._updateSnapshot('cropExisting', name, callback);
    },

    // Publishing
    makeUnpublishedCopy: function(successCallback, pendingCallback, errorCallback)
    {
        var ds = this;
        if (ds.isDefault())
        {
            ds.makeRequest({url: '/api/views/' + ds.id + '/publication.json',
                params: {method: 'copy'}, type: 'POST',
                pending: function()
                {
                    ds.copyPending = true;
                    if (_.isFunction(pendingCallback)) { pendingCallback(); }
                },
                error: errorCallback,
                success: function(r)
                {
                    delete ds.copyPending;
                    ds._unpublishedView = new Dataset(r);
                    if (_.isFunction(successCallback))
                    { successCallback(ds._unpublishedView); }
                }});
        }
        else
        {
            ds.getParentDataset(function(parDS)
            {
                ds._startRequest();
                parDS.makeUnpublishedCopy(function()
                {
                    ds._finishRequest();
                    if (_.isFunction(successCallback))
                    { successCallback.apply(ds, arguments); }
                }, pendingCallback, errorCallback);
            });
        }
    },

    publish: function(successCallback, errorCallback)
    {
        var ds = this;
        ds.makeRequest({url: '/api/views/' + ds.id + '/publication.json', type: 'POST',
            error: errorCallback,
            success: function(r)
            {
                var pubDS = new Dataset(r);
                if (_.isFunction(successCallback))
                { successCallback(pubDS); }
            }});
    },

    getPublishedDataset: function(callback)
    {
        var ds = this;
        if ($.isBlank(ds._publishedViews))
        {
            ds._loadPublicationViews(function()
            {
                callback(_.detect(ds._publishedViews, function(v) { return v.isDefault(); }));
            });
        }
        else
        {
            callback(_.detect(ds._publishedViews, function(v) { return v.isDefault(); }));
        }
    },

    getUnpublishedDataset: function(callback)
    {
        var ds = this;
        if ($.isBlank(ds._publishedViews))
        {
            ds._loadPublicationViews(function()
            { callback(ds._unpublishedView); });
        }
        else
        {
            callback(ds._unpublishedView);
        }
    },
    getPredeployApiView: function(successCallback, errorCallback){
      var ds = this;
      ds.makeRequest({url: '/api/views/' + ds.id + '/publication.json',
          params: {method: 'getOrMakePredeployApiView'}, type: 'GET',
          success: function(view)
          {
              successCallback(new Dataset(view));
          },
          error: errorCallback});
    },
    getPublishingAvailable: function(successCallback)
    {
        var ds = this;
        if (ds.columnsForType('location').length < 1)
        {
            successCallback(true);
            return;
        }

        ds.makeRequest({url: '/api/geocoding/' + ds.id + '.json', params: {method: 'pending'},
            success: function(results)
            {
                successCallback(results.view < 1,
                    'Rows in the location column are still geocoding. ' +
                    'Please wait until they are finished to publish this dataset');
            }});
    },

    waitForPublishingAvailable: function(successCallback, timeout)
    {
        var ds = this;

        var waitForSuccess = function()
        {
            ds.getPublishingAvailable(function(available)
            {
                if (!available)
                {
                    setTimeout(waitForSuccess, timeout || 5000);
                }
                else
                {
                    successCallback();
                }
            });
        };
        waitForSuccess();
    },

    getSnapshotDatasets: function(callback)
    {
        var ds = this;
        if ($.isBlank(ds._snapshotViews))
        {
            ds._loadPublicationViews(function()
            {
                callback(_.select(ds._snapshotViews, function(v) { return v.isDefault(); }));
            });
        }
        else
        {
            callback(_.select(ds._snapshotViews, function(v) { return v.isDefault(); }));
        }
    },

    getOperationStatuses: function(callback)
    {
        var ds = this;
        ds.makeRequest({
            url: '/views/' + ds.id,
            params: {method: 'operationStatuses'},
            success: callback
        });
    },

    cleanFilters: function(excludeTemporary)
    {
        var ds = this;
        var filters;
        if (!$.isBlank((ds.query || {}).filterCondition))
        { filters = $.extend(true, {}, ds.query.filterCondition); }
        if (!$.isBlank((ds.query || {}).namedFilters))
        {
            var newFilters = [];
            _.each(ds.query.namedFilters, function(nf)
            {
                if (excludeTemporary && nf.temporary) { return; }
                // Named filter keys off of main type; so just check displayType and
                // not renderTypeConfig.visible
                if (!$.isBlank(nf.displayTypes) &&
                    !_.include(nf.displayTypes, ds.displayType)) { return; }
                nf = $.extend(true, {}, nf);
                delete nf.temporary;
                delete nf.displayTypes;
                newFilters.push(nf);
            });
            if (newFilters.length > 0)
            {
                if ($.isBlank(filters) && newFilters.length == 1)
                {
                    filters = _.first(newFilters);
                }
                else
                {
                    if ($.isBlank(filters))
                    { filters = {children: [], type: 'operator', value: 'AND'}; }
                    else if (filters.type != 'operator' || filters.value != 'AND')
                    {
                        filters = {type: 'operator', value: 'AND',
                            children: [filters]};
                    }
                    filters.children = (filters.children || []).concat(newFilters);
                }
            }
        }
        return filters;
    },

    cleanCopy: function(allowedKeys)
    {
        var dsCopy = this._super(allowedKeys);
        if (!$.isBlank(dsCopy.query))
        {
            dsCopy.query.filterCondition = this.cleanFilters();
            delete dsCopy.query.namedFilters;
        }
        return dsCopy;
    },

    changeOwner: function(userId, successCallback, errorCallback)
    {
        var ds = this;

        ds.makeRequest({
            url: '/views/' + ds.id + '?method=plagiarize&userId=' + userId,
            type: 'PUT',
            success: successCallback,
            error: errorCallback
        });
    },

    getShareTypes: function()
    {
        var stypes = ['Contributor', 'Owner'];
        if (this.type != 'form') { stypes.unshift('Viewer'); }
        return stypes;
    },

	preferredImage: function(size)
	{
		var ds = this;

		if ($.isBlank(size)) { size = 'thumb'; }

		var filename;
		if (!$.isBlank(ds.iconUrl))
		{
			return '/assets/' + escape(ds.iconUrl) + '?s=thumb';
		}
		else if (filename = $.deepGet(ds, 'metadata', 'thumbnail', 'page', 'filename'))
		{
			var result = '';
			if (ds.isFederated()) { result += '//' + this.domainCName; }

			result += '/api/views/' + ds.id + '/snapshots/page?size=thumb';
			return result;
		}
	},

    // Private methods

    _checkValidity: function()
    {
        return $.isBlank(this.message);
    },

    _markTemporary: function(minorChange)
    {
        var oldMinor = this.minorChange;
        this.minorChange = this.minorChange && (minorChange || false);
        if (!this.temporary || oldMinor !== this.minorChange)
        {
            this.temporary = true;
            this.trigger('set_temporary');
        }
    },

    _clearTemporary: function()
    {
        if (this.temporary)
        {
            this.temporary = false;
            this.minorChange = true;
            this.trigger('clear_temporary');
        }
    },

    _adjustProperties: function()
    {
        var ds = this;
        ds.originalViewId = ds.id;

        ds.type = getType(ds);

        if (ds.isUnpublished())
        { ds.styleClass = 'Unpublished'; }
        else if (ds.type == 'blist' && ds.isSnapshot())
        { ds.styleClass = 'Snapshotted'; }
        else
        { ds.styleClass = ds.type.capitalize(); }

        if ($.isBlank(ds.displayType))
        {
            ds.displayType = {
                'tabular': 'table',
                'blobby': 'blob',
                'href': 'href'
            }[ds.viewType || 'tabular'];
        }
        ds.displayName = getDisplayName(ds);

        // We always need searchString, or else it can re-appear due to the saved view
        // having it set, and the temp view not having the key at all
        ds.searchString = ds.searchString || null;

        // If we are an invalid filter, we're not really that invalid, because
        // the core server has already removed the offending clause. So just
        // ignore the message, and the view will load fine without the clause
        // on the non-existant column
        if (!$.isBlank(ds.message) && ds.type == 'filter')
        { delete ds.message; }

        if (!ds._addedProperties)
        {
            var types = [ds.type];
            if ($.subKeyDefined(ds, 'metadata.availableDisplayTypes'))
            {
                // Make sure main type is last so that those functions get
                // priority. Yes, this is a hack; we should probably redo
                // the module system sometime soon...
                types = _.without(ds.metadata.availableDisplayTypes, ds.type);
                types.push(ds.type);
            }
            _.each(types, function(t)
            { Dataset.addProperties(ds, Dataset.modules[t] || {}, $.extend({}, ds)); });
            ds._addedProperties = true;
        }

        ds.displayFormat = ds.displayFormat || {};

        if (_.isFunction(ds._convertLegacy)) { ds._convertLegacy(); }

        if (!$.subKeyDefined(ds, 'metadata.availableDisplayTypes'))
        {
            ds.metadata = ds.metadata || {};
            var adt;
            if (_.include(['blob', 'href', 'form', 'api'], ds.type))
            { adt = [ds.type]; }
            else
            {
                adt = ['table', 'fatrow', 'page'];
                if (!$.isBlank(ds.displayType) &&
                    !_.include(['blist', 'filter', 'grouped'], ds.type))
                { adt.unshift(ds.displayType); }
            }
            ds.metadata.availableDisplayTypes = adt;
        }
        if (!$.subKeyDefined(ds, 'metadata.renderTypeConfig.visible'))
        {
            ds.metadata = $.extend(true, {renderTypeConfig: {visible: {}}}, ds.metadata);
            ds.metadata.renderTypeConfig.visible[ds.displayType] = true;
        }

        // Update sorts on each column
        _.each(ds.realColumns || [], function(c)
                { delete c.sortAscending; });
        _.each((ds.query || {}).orderBys || [], function(ob)
        {
            var c = ds.columnForID(ob.expression.columnId);
            if (!$.isBlank(c)) { c.sortAscending = ob.ascending; }
        });

        ds.url = ds._generateUrl();
        ds.fullUrl = ds._generateUrl(true);
        ds.shortUrl = ds._generateShortUrl(true);
        ds.apiUrl = ds._generateApiUrl();
        ds.domainUrl = ds._generateBaseUrl(ds.domainCName);
    },

    _activateRowSet: function(newRS)
    {
        var ds = this;
        if (newRS == ds._activeRowSet) { return; }

        if (!$.isBlank(ds._activeRowSet))
        {
            ds._activeRowSet.deactivate();
            _.each(['row_change', 'row_count_change', 'metadata_update'], function(evName)
                    { ds._activeRowSet.unbind(evName, null, ds); });
        }

        ds._activeRowSet = newRS;
        ds._availableRowSets = ds._availableRowSets || {};
        var k = ds._activeRowSet.getKey();
        if (ds._availableRowSets[k] != ds._activeRowSet)
        { ds._availableRowSets[k] = ds._activeRowSet; }

        if (!$.isBlank(ds._activeRowSet))
        {
            _.each(['row_change', 'row_count_change'], function(evName)
            {
                ds._activeRowSet.bind(evName, function() { ds.trigger(evName, arguments); }, ds);
            });
            ds._activeRowSet.bind('metadata_update', function()
                    { ds._update.apply(ds, arguments); });
            ds._activeRowSet.activate();
        }
    },

    _getChildView: function(uid, callback, isBatch)
    {
        if (!this.childViews)
        { throw "No such child view"; }

        this._childViews || (this._childViews = {});
        if (!this._childViews[uid])
        {
            var self = this;
            Dataset.lookupFromViewId(uid, function(child) {
                self._childViews[uid] = child;
                if (child != self)
                {
                    child.unbind(null, null, self);
                    child.bind('displaytype_change',
                        function() { self.trigger('displaytype_change'); }, self);
                }
                callback(child);
            }, undefined, isBatch);
        }
        else
        {
            callback(this._childViews[uid]);
        }
    },

    _childViewsForType: function(type)
    {
        // but if we're displaying it as a map, there's only one
        // map to show
        if (type == 'map')
        { return false; }

        // we can only switch if they're trying to display a tabular-ish
        // grid thing
        if (!_.include(['table', 'fatrow', 'page'], type))
        { return false; }

        return this.childViews;
    },

    _update: function(newDS, forceFull, updateColOrder, masterUpdate)
    {
        var ds = this;

        // Back-update the ID, because we don't want the new temporary one
        newDS.id = ds.id;

        // Don't care about unsaved, want to keep default
        newDS.flags = _.without(newDS.flags || [], 'unsaved');
        if (_.include(ds.flags || [], 'default') &&
            !_.include(newDS.flags || [], 'default'))
        {
            newDS.flags = newDS.flags || [];
            newDS.flags.push('default');
        }

        var oldGroupings = (ds.query || {}).groupBys;
        var oldGroupAggs = {};
        if ((oldGroupings || []).length > 0)
        {
            _.each(ds.realColumns, function(c)
            {
                if (!$.isBlank(c.format.grouping_aggregate))
                { oldGroupAggs[c.id] = c.format.grouping_aggregate; }
            });
        }

        var oldQuery = ds.query || {};
        var oldSearch = ds.searchString;
        var oldDispFmt = $.extend(true, {}, ds.displayFormat);
        var oldDispType = ds.displayType;
        var oldRTConfig = $.extend(true, {}, ds.metadata.renderTypeConfig);
        var oldCondFmt = ds.metadata.conditionalFormatting;

        if (forceFull)
        {
            // If we are updating the entire dataset, then clean out all the
            // valid keys; then the next lines will copy all the new ones over
            _.each(ds._validKeys, function(v, k)
            { if (k != 'columns') { delete ds[k]; } });
        }

        _.each(newDS, function(v, k)
        { if (k != 'columns' && ds._validKeys[k]) { ds[k] = v; } });

        ds._adjustProperties();

        if (!$.isBlank(newDS.columns))
        { ds.updateColumns(newDS.columns, forceFull, updateColOrder); }

        // Update sorts on each column
        _.each(ds.realColumns || [], function(c)
                { delete c.sortAscending; });
        _.each((ds.query || {}).orderBys || [], function(ob)
        {
            var c = ds.columnForID(ob.expression.columnId);
            if (!$.isBlank(c)) { c.sortAscending = ob.ascending; }
        });

        // the core server will do this anyway.
        ds.query = ds.query || {};

        ds._updateGroupings(oldGroupings, oldGroupAggs);

        // Clean out any empty keys in the query
        _.each(['namedFilters', 'filterCondition', 'orderBys', 'groupBys'],
            function(k) { if (_.isEmpty(ds.query[k])) { delete ds.query[k]; } });

        var needsDTChange;
        if (!_.isEqual(oldRTConfig.visible, ds.metadata.renderTypeConfig.visible)
            || !_.isEqual(oldRTConfig.active, ds.metadata.renderTypeConfig.active))
        {
            // If we have a visible type that's not available, add it
            _.each(ds.metadata.renderTypeConfig.visible, function(v, type)
            {
                if (v && !_.include(ds.metadata.availableDisplayTypes, type))
                { ds.metadata.availableDisplayTypes.unshift(type); }
            });
            // Can't hide everything
            if (_.isEmpty(ds.metadata.renderTypeConfig.visible))
            { ds.metadata.renderTypeConfig.visible[ds.displayType] = true; }
            // displayType should always be the most important visible availableDisplayType
            ds.displayType = _.detect(ds.metadata.availableDisplayTypes,
                function(adt) { return ds.metadata.renderTypeConfig.visible[adt]; });
            needsDTChange = true;
        }
        else if (oldDispType != ds.displayType)
        {
            // displayType changed without rtConfig.visible being updated
            // If we're given a displayType not in our list, then add it
            if (!$.isBlank(ds.displayType) &&
                !_.include(ds.metadata.availableDisplayTypes, ds.displayType))
            { ds.metadata.availableDisplayTypes.unshift(ds.displayType); }
            // Make only this type visible
            ds.metadata.renderTypeConfig.visible = {};
            ds.metadata.renderTypeConfig.visible[ds.displayType] = true;
            needsDTChange = true;
        }

        var needQueryChange = !_.isEqual(oldRTConfig.visible,
                    ds.metadata.renderTypeConfig.visible) &&
                _.any(ds.query.namedFilters || [], function(nf)
                    { return _.any(nf.displayTypes || [], function(nd)
                        { return oldRTConfig.visible[nd] ||
                            ds.metadata.renderTypeConfig.visible[nd]; }); });

        if (needQueryChange || (oldSearch != ds.searchString) ||
                !_.isEqual(oldQuery, ds.query))
        {
            ds.aggregatesChanged();
            var filterChanged = needQueryChange ||
                !_.isEqual(oldQuery.filterCondition, ds.query.filterCondition) ||
                !_.isEqual(oldQuery.namedFilters, ds.query.namedFilters);
            var nonFilterChanged = oldSearch != ds.searchString ||
                !_.isEqual(oldQuery.groupBys, ds.query.groupBys) ||
                // Group-bys suck, since there may be pre-process filtering
                // that happens before we have the data. So if they exist, we
                // always have to talk to the server
                !_.isEmpty(ds.query.groupBys);
            if ((filterChanged || !_.isEqual(oldQuery.orderBys, ds.query.orderBys)) && !nonFilterChanged)
            {
                var newQ = {orderBys: ds.query.orderBys, filterCondition: ds.cleanFilters()};
                var newKey = RowSet.getQueryKey({orderBys: ds.query.orderBys,
                    filterCondition: Dataset.translateFilterCondition(newQ.filterCondition, ds)});
                if (!$.isBlank(ds._availableRowSets[newKey]))
                { ds._activateRowSet(ds._availableRowSets[newKey]); }
                else
                {
                    // Find existing set to derive from
                    var parRS = _.detect(_.sortBy(ds._availableRowSets,
                                function(rs, key) { return -(rs._isComplete ? 1000000 : 1) * key.length; }),
                            function(rs) { return rs.canDerive(newQ); });
                    ds._activateRowSet(new RowSet(ds, newQ, parRS));
                }
            }
            else
            {
                // Clear out the rows, since the data is different now
                ds._invalidateAll(filterChanged || nonFilterChanged);
            }
            ds.trigger('query_change');
        }
        else if (!_.isEqual(oldCondFmt, ds.metadata.conditionalFormatting))
        {
            // If we aren't invalidating all the rows, but conditional formatting
            // changed, then redo all the colors and re-render
            _.each(ds._availableRowSets, function(rs) { rs.formattingChanged(); });
            ds.trigger('row_change', [_.values(ds._activeRowSet._rows)]);
        }

        if (needsDTChange)
        { ds.trigger('displaytype_change'); }

        if (!_.isEqual(oldDispFmt, ds.displayFormat))
        { ds.trigger('displayformat_change'); }

        if (masterUpdate)
        {
            ds._clearTemporary();
            ds._origObj = ds.cleanCopy();
        }
        else if (_.isEqual(ds._origObj, ds.cleanCopy()))
        { ds._clearTemporary(); }

        var oldValid = ds.valid;
        ds.valid = ds._checkValidity();
        if (!oldValid && ds.valid) { ds.trigger('valid'); }
    },

    _updateGroupings: function(oldGroupings, oldGroupAggs)
    {
        var ds = this;
        // Do we care if there was a grouping but now there isn't?
        // Yes
        if ($.isBlank((ds.query || {}).groupBys) &&
            $.isBlank(oldGroupings)) { return; }

        // Save off original column order to restore later
        var isNewOrder = $.isBlank(oldGroupings);
        if (isNewOrder) { ds._origColOrder = _.pluck(ds.visibleColumns, 'id'); }

        var curGrouped = {};
        _.each(ds.realColumns, function(c)
        {
            if (c.format.drill_down) { curGrouped[c.id] = true; }
            delete c.format.drill_down;
        });

        var newColOrder = [];
        _.each(ds.query.groupBys || [], function(g)
        {
            var col = ds.columnForID(g.columnId);
            if ($.isBlank(col)) { return; }

            if ($.isBlank(col.format.grouping_aggregate))
            {
                if (!curGrouped[col.id]) { col.width += 30; }
                col.format.drill_down = 'true';
            }

            if (col.hidden && !_.any(oldGroupings || [], function(og)
                { return og.columnId == col.id; }))
            { col.update({flags: _.without(col.flags, 'hidden')}); }

            newColOrder.push(col.id);
        });

        var newGroupAggs = {};
        _(ds.realColumns).chain()
            .select(function(c)
                { return !$.isBlank(c.format.grouping_aggregate); })
            .each(function(c)
            {
                if (c.hidden && !$.isBlank(oldGroupAggs) && !oldGroupAggs[c.id])
                { c.update({flags: _.without(c.flags, 'hidden')}); }
                newGroupAggs[c.id] = c.format.grouping_aggregate;

                newColOrder.push(c.id);
            });
        if ($.isBlank(oldGroupAggs))
        { oldGroupAggs = newGroupAggs; }

        if (_.isEmpty(ds.query.groupBys))
        {
            if (!$.isBlank(ds._origColOrder))
            { ds.setVisibleColumns(ds._origColOrder, null, true) }
        }
        else
        {
            _.each(ds.realColumns, function(c)
            {
                var i = _.indexOf(newColOrder, c.id);
                if (i < 0 && !c.hidden)
                {
                    var f = c.flags || [];
                    f.push('hidden');
                    c.update({flags: f});
                }
                if (isNewOrder)
                {
                    if (i < 0) { i = c.position + newColOrder.length; }
                    c.position = i + 1;
                }
            });

            ds.updateColumns();
        }

        if (!_.isEqual(oldGroupAggs, newGroupAggs))
        {
            ds._invalidateAll(false, true);
        }
    },

    _adjustVisibleColumns: function(visColIds)
    {
        var ds = this;
        if (ds.isGrouped())
        {
            // Hide columns not grouped or rolled-up
            visColIds = _.select(visColIds, function(cId)
            {
                var c = ds.columnForID(cId);
                return !$.isBlank(c.format.grouping_aggregate) ||
                    _.any(ds.query.groupBys, function(g)
                        { return g.columnId == c.id; });
            });
        }
        return visColIds;
    },

    makeRequest: function(req)
    {
        if (req.inline)
        {
            req.url = '/views/INLINE/rows.json';
            req.type = 'POST';
            req.data = req.data || JSON.stringify(this.cleanCopy());
        }
        delete req.inline;
        if (this.isAnonymous()) { req.anonymous = true; }

        this._super(req);
    },

    _updateLinkedColumns: function(keyCol, row, newRow)
    {
        var ds = this;
        if (keyCol.dataTypeName == "dataset_link")
        {
            for (var n = ds.columns.length - 1; n >= 0; n--)
            {
                var col = ds.columns[n];
                if (!col.isLinked()) continue;
                var uname = col.underscoreName(ds);
                row[col.id] = newRow[uname];
            }
        }
    },

    _rowData: function(row, savingIds, parCol)
    {
        var ds = this;
        var data = {};
        _.each(savingIds, function(cId)
        {
            var c = !$.isBlank(parCol) ? parCol.childColumnForID(cId) :
                ds.columnForID(cId);
            data[c.lookup] = row[c.lookup];
        });

        var fieldMeta = ":meta";
        var fieldPosition = ":position";

        // Copy over desired metadata columns
        data[fieldPosition] = row.position;
        data[fieldMeta] = row.meta;

        // Invalid values need to be saved into metadata
        _.each(row.invalid, function(isI, cId)
        {
            if (isI)
            {
                var c = !$.isBlank(parCol) ? parCol.childColumnForID(cId) :
                    ds.columnForID(cId);
                data[fieldMeta] = data[fieldMeta] || {};
                data[fieldMeta].invalidCells = data[fieldMeta].invalidCells || {};
                data[fieldMeta].invalidCells[c.tableColumnId] = data[cId];
                data[cId] = null;
            }
        });

        // Metadata is a JSON sring
        if (!$.isBlank(data[fieldMeta]))
        { data[fieldMeta] = JSON.stringify(data[fieldMeta]); }

        return data;
    },

    _addRow: function(newRow, idx)
    {
        var ds = this;
        _.each(ds._availableRowSets, function(rs)
                { rs.addRow(newRow, rs == ds._activeRowSet ? idx : null); });
    },

    _updateRow: function(row, oldID)
    {
        _.each(this._availableRowSets, function(rs) { rs.updateRow(row, oldID); });
    },

    _removeRow: function(row)
    {
        _.each(this._availableRowSets, function(rs) { rs.removeRow(row); });
    },

    _invalidateAll: function(rowCountChanged, columnsChanged)
    {
        delete this._availableRowSets;
        this._activateRowSet(new RowSet(this, {orderBys: (this.query || {}).orderBys,
            filterCondition: this.cleanFilters()}));
    },

    _serverCreateRow: function(req, isBatch)
    {
        var ds = this;
        var rowCreated = function(rr)
        {
            var oldID = req.row.id;
            // Add metadata to new row
            // FIXME: The server response for this should be changing; we can
            // run into problems if there is a user column named something like
            // '_id'
            _.each(rr, function(v, k)
                {
                    if (k.startsWith('_'))
                    {
                        var adjName = k.slice(1);
                        var c = !$.isBlank(req.parentColumn) ?
                            req.parentColumn.childColumnForID(adjName) :
                            ds.columnForID(adjName);
                        var l = $.isBlank(c) ? adjName : c.lookup;
                        req.row[l] = v;
                    }
                });
            if (req.row.underlying)
            {
                req.row.noMatch = true;
                req.row.underlying = null;
            }

            var oldKey = oldID;
            var newKey = req.row.id;
            if (!$.isBlank(req.parentRow))
            {
                oldKey += ':' + req.parentRow.id + ':' + req.parentColumn.id;
                newKey += ':' + req.parentRow.id + ':' + req.parentColumn.id;
            }
            ds._pendingRowEdits[newKey] = ds._pendingRowEdits[oldKey];
            delete ds._pendingRowEdits[oldKey];
            ds._pendingRowDeletes[newKey] = ds._pendingRowDeletes[oldKey];
            delete ds._pendingRowDeletes[oldKey];

            // We can have old IDs embedded in child row keys; so messy cleanup...
            if ($.isBlank(req.parentRow))
            {
                var updateKeys = function(pendingItems)
                {
                    _.each(_.keys(pendingItems), function(k)
                    {
                        var nk = k.replace(':' + oldKey + ':', ':' + newKey + ':');
                        if (nk != k)
                        {
                            pendingItems[nk] = pendingItems[k];
                            delete pendingItems[k];
                        }
                    });
                };
                updateKeys(ds._pendingRowEdits);
                updateKeys(ds._pendingRowDeletes);
            }

            _.each(!$.isBlank(req.parentColumn) ?
                req.parentColumn.realChildColumns : ds.realColumns, function(c)
            { delete req.row.changed[c.lookup]; });

            if ($.isBlank(req.parentRow))
            { ds._updateRow(req.row, oldID); }
            else
            { ds._updateRow(req.parentRow); }
            ds.trigger('row_change', [[{id: oldID}, req.parentRow || req.row]]);
            ds._processPending(req.row.id, (req.parentRow || {}).id,
                (req.parentColumn || {}).id);

            ds.aggregatesChanged();
            if (_.isFunction(req.success)) { req.success(req.row); }
        };

        var rowErrored = function(xhr)
        {
            _.each(!$.isBlank(req.parentColumn) ?
                req.parentColumn.realChildColumns : ds.realColumns, function(c)
                    { req.row.error[c.id] = true; });
            ds._updateRow(req.parentRow || req.row);
            ds.trigger('row_change', [[req.parentRow || req.row]]);
            if (_.isFunction(req.error)) { req.error(xhr); }
        };

        // On complete, kick off any pending creates
        var rowCompleted = function()
        {
            if ((ds._pendingRowCreates || []).length > 0)
            {
                while (ds._pendingRowCreates.length > 0)
                { ds._serverCreateRow(ds._pendingRowCreates.shift(), true); }
                ServerModel.sendBatch();
            }
            else
            {
                delete ds._pendingRowCreates;
            }
        };

        var url = '/views/' + ds.id + '/rows';
        if (!$.isBlank(req.parentRow))
        {
            url += '/' + req.parentRow.id + '/columns/' + req.parentColumn.id +
                '/subrows';
        }
        url += '.json';
        ds.makeRequest({url: url,
            type: 'POST', data: JSON.stringify(req.rowData), batch: isBatch,
            success: rowCreated, error: rowErrored, complete: rowCompleted});
    },

    _serverSaveRow: function(r, isBatch)
    {
        var ds = this;
        // On save, unmark each item, and fire an event
        var rowSaved = function(newRow)
        {
            _.each(r.columnsSaving, function(cId)
                { delete r.row.changed[cId]; });

            _.each(r.columnsSaving, function(cId)
            {
                var col = !$.isBlank(r.parentColumn) ?
                    r.parentColumn.childColumnForID(cId) :
                    ds.columnForID(cId);
                ds._updateLinkedColumns(col, r.row, newRow);
            });

            if (!newRow._underlying) { r.row.noMatch = null; }

            ds._updateRow(r.parentRow || r.row);
            ds.trigger('row_change', [[r.parentRow || r.row]]);
            ds.aggregatesChanged();
            if (_.isFunction(r.success)) { r.success(r.row); }
        };

        // On error, mark as such and notify
        var rowErrored = function(xhr)
        {
            _.each(r.columnsSaving, function(cId)
                { r.row.error[cId] = true; });
            ds._updateRow(r.parentRow || r.row);
            ds.trigger('row_change', [[r.parentRow || r.row]]);
            if (_.isFunction(r.error)) { r.error(xhr); }
        };

        // On complete, kick off any pending saves/deletes
        var rowCompleted = function()
        {
            ds._processPending(r.row.id, (r.parentRow || {}).id,
                (r.parentColumn || {}).id);
        };


        var url = '/views/' + ds.id + '/rows/';
        if (!$.isBlank(r.parentRow))
        { url += r.parentRow.id + '/columns/' + r.parentColumn.id + '/subrows/'; }
        url += r.row.uuid + '.json';
        ds.makeRequest({url: url, type: 'PUT', data: JSON.stringify(r.rowData),
            batch: isBatch,
            success: rowSaved, error: rowErrored, complete: rowCompleted});

        ds._aggregatesStale = true;
        _.each(r.columnsSaving, function(cId)
        {
            (!$.isBlank(r.parentColumn) ? r.parentColumn.childColumnForID(cId) :
                ds.columnForID(cId)).invalidateData();
        });
    },

    _serverRemoveRow: function(rowId, parRowId, parColId, isBatch)
    {
        var ds = this;
        var rowRemoved = function() { ds.aggregatesChanged(); };

        var url = '/views/' + ds.id + '/rows/';
        if (!$.isBlank(parRowId))
        { url += parRowId + '/columns/' + parColId + '/subrows/'; }
        url += rowId + '.json';
        ds.makeRequest({batch: isBatch, url: url, type: 'DELETE',
            success: rowRemoved});
    },

    _processPending: function(rowId, parRowId, parColId)
    {
        var ds = this;
        var key = rowId;
        if (!$.isBlank(parRowId)) { key += ':' + parRowId + ':' + parColId; }

        // Are there any pending edits to this row?
        // If so, save the next one
        if (ds._pendingRowEdits[key] &&
            ds._pendingRowEdits[key].length > 0)
        {
            while (ds._pendingRowEdits[key].length > 0)
            {
                // Do save
                ds._serverSaveRow(ds._pendingRowEdits[key].shift(), true);
            }
            ServerModel.sendBatch();
        }
        else
        {
            delete ds._pendingRowEdits[key];
            if (ds._pendingRowDeletes[key])
            {
                var pd = ds._pendingRowDeletes[key];
                ds._serverRemoveRow(pd.rowId, pd.parRowId, pd.parColId);
                delete ds._pendingRowDeletes[key];
            }
        }
    },

    _generateUrl: function(includeDomain)
    {
        var ds = this;
        var base = '';

        // federated dataset has nonblank domain cname
        if (includeDomain || !$.isBlank(ds.domainCName))
        { base = ds._generateBaseUrl(ds.domainCName); }

        var urlParts;
        if (ds.displayName === 'api-predeploy')
        {
          urlParts = [base, 'api_foundry/forge', ds.id];
        }
        else if (ds.displayName === 'api')
        {
          urlParts = [base, 'developers/docs', ds.resourceName];
        }
        else
        {
          urlParts = [base, $.urlSafe(ds.category || "dataset"), $.urlSafe(ds.name), ds.id];
        }
        return urlParts.join('/');
    },

    _generateShortUrl: function(includeDomain)
    {
        var ds = this;
        var base = '';

        // federated dataset has nonblank domain cname
        if (includeDomain || !$.isBlank(ds.domainCName))
        { base = ds._generateBaseUrl(ds.domainCName, true); }

        return base + '/d/' + ds.id;
    },

    _generateApiUrl: function()
    {
        return this._generateBaseUrl() + '/api/views/' + this.id;
    },

    _viewRemoved: function(view)
    {
        var ds = this;
        if (!$.isBlank(ds._relatedViews))
        { ds._relatedViews = _.without(ds._relatedViews, view); }
        if (!$.isBlank(ds._relViewCount)) { ds._relViewCount--; }
        if (!$.isBlank(ds._parent) && ds._parent.id == view.id)
        { delete ds._parent; }
    },

    _loadRelatedViews: function(callback, justCount)
    {
        var ds = this;
        var processDS = function(views)
        {
            views = _.map(views, function(v)
            {
                if (v.id == ds.id) { v = ds; }
                if (v instanceof Dataset) { return v; }

                var nv = new Dataset(v);
                nv.bind('removed', function() { ds._viewRemoved(this); });
                if (!$.isBlank(ds.accessType)) { nv.setAccessType(ds.accessType); }
                return nv;
            });

            var parDS = _.detect(views, function(v)
                    { return _.include(v.flags || [], 'default'); });
            if (!$.isBlank(parDS))
            {
                ds._parent = parDS;
                views = _.without(views, parDS);
            }

            ds._relatedViews = views;

            if (_.isFunction(callback)) { callback(); }
        };

        var processCount = function(count)
        {
            // Subtract one for dataset
            ds._relViewCount = Math.max(0, count - 1);
            if (_.isFunction(callback)) { callback(ds._relViewCount); }
        };

        this.makeRequest({url: '/views.json', pageCache: true, type: 'GET',
                data: { method: justCount ? 'getCountForTableId' : 'getByTableId',
                tableId: this.tableId },
                success: justCount ? processCount : processDS});
    },

    _loadPublicationViews: function(callback)
    {
        var ds = this;
        var processDS = function(views)
        {
            views = _.map(views, function(v)
            {
                if (v instanceof Dataset) { return v; }

                var nv = new Dataset(v);
                if (!$.isBlank(ds.accessType)) { nv.setAccessType(ds.accessType); }
                return nv;
            });

            ds._publishedViews = _.select(views, function(v) { return v.isPublished(); });
            ds._snapshotViews = _.select(views, function(v) { return v.isSnapshot(); });
            // There should be only one
            ds._unpublishedView = _.detect(views, function(v) { return v.isUnpublished(); });

            if (_.isFunction(callback)) { callback(); }
        };

        ds.makeRequest({url: '/api/views/' + ds.id + '.json', pageCache: true, type: 'GET',
                params: { method: 'getPublicationGroup' }, success: processDS});
    },

    _setupDefaultSnapshotting: function(delay)
    {
        // by default, just wait til the rows are loaded
        this.bind('request_finish', function()
        {
            var ds = this;
            // if there was already a return call, e.g. aggregates
            if (!$.isBlank(ds._snapshotTimer))
            { clearTimeout(ds._snapshotTimer); }

            ds._snapshotTimer = setTimeout(function()
                { _.defer(ds.takeSnapshot); }, (delay  || 1000));
        });
    },

    _getThumbNameOrDefault: function(name)
    {
        return name || "page";
    },

    _getCroppedThumbnailMeta: function(name)
    {
        return ((this.metadata || {}).thumbnail || {})[name];
    },

    _updateSnapshot: function(method, name, callback)
    {
        var ds = this;
        ds.makeRequest({
            success: function(response) {
                ds._updateThumbnailCallback(response, callback);
            },
            error: callback,
            type: 'POST',
            url: '/views/' + ds.id + '/snapshots?method=' + method + '&name=' +
                ds._getThumbNameOrDefault(name)
        });
    },

    _updateThumbnailCallback: function(response, callback)
    {
        if ((response.metadata || {}).thumbnail)
        {
            this.metadata.thumbnail = response.metadata.thumbnail;
        }
        callback(response);
    },

    _cleanUnsaveable: function(md)
    {
        var ds = this;
        var adjMD = md;
        if (ds.isPublished() && ds.isDefault())
        {
            adjMD = $.extend(true, {}, md);
            // Can't save columns or any query but a sort-by on published datasets
            delete adjMD.columns;

            // If they give us a blank query obj, don't do unnecessary modifications
            if (!$.isBlank(adjMD.query) && _.isEmpty(adjMD.query))
            { /* nothing */ }
            else if ($.subKeyDefined(adjMD, 'query.orderBys'))
            {
                adjMD.query = {orderBys: adjMD.query.orderBys};
            }
            else { delete adjMD.query; }
        }
        return adjMD;
    },

    _validKeys: {
        attribution: true,
        attributionLink: true,
        category: true,
        columns: true,
        description: true,
        disabledFeatureFlags: true,
        displayFormat: true,
        displayType: true,
        flags: true,
        iconUrl: true,
        id: true,
        licenseId: true,
        message: true,
        metadata: true,
        moderationStatus: true,
        name: true,
        originalViewId: true,
        privateMetadata: true,
        publicationAppendEnabled: true,
        query: true,
        queryString: true,
        resourceName: true,
        rowIdentifierColumnId: true,
        searchString: true,
        tags: true,
        termsAndConditions: true
    }

});

Dataset.modules = {};

var cachedLinkedDatasetOptions = {};

Dataset.getLinkedDatasetOptions = function(linkedDatasetUid, col, $field, curVal,
    useRdfKeyAsDefault)
{
    var viewUid = linkedDatasetUid;
    if ($.isBlank(viewUid) || !viewUid.match(blist.util.patterns.UID))
    {
        return [];
    }

    if (cachedLinkedDatasetOptions[viewUid] == null)
    {
        $.Tache.Get({url: '/api/views/' + viewUid + '.json',
            error: function(req)
            {
                alert(JSON.parse(req.responseText).message);
           },
            success: function(linkedDataset)
            {
                var lds = new Dataset(linkedDataset);
                cachedLinkedDatasetOptions[viewUid] = [];
                var cldo = cachedLinkedDatasetOptions[viewUid];

                var opt;
                var rdfSubject = linkedDataset && linkedDataset.metadata &&
                        linkedDataset.metadata.rdfSubject ?
                        linkedDataset.metadata.rdfSubject : undefined;

                _.each(lds.columns || [], function(c)
                {
                    if (c.canBeDatasetLink())
                    {
                        opt = {value: String(c.fieldName), text: c.name};
                        if (useRdfKeyAsDefault && opt.value === rdfSubject)
                        {
                            opt.selected = true;
                        }
                        cldo.push(opt);
                    }
                });

                if (cachedLinkedDatasetOptions[viewUid].length <= 0)
                {
                    alert('Dataset ' + viewUid + ' does not have any columns.');
                }
                else
                {
                    $field.data('linkedFieldValues', '_reset');
                    _.each($field.data('linkedGroup'), function(f) {
                        $(f).trigger('change');
                    });
                    _.defer(function() { $field.val(curVal); });
                }
            }});
         return [];
    }

    return cachedLinkedDatasetOptions[viewUid];
};

Dataset.getLinkedDatasetOptionsDefault = function(linkedDatasetUid, col, $field,
    curVal)
{
    return Dataset.getLinkedDatasetOptions(linkedDatasetUid, col, $field, curVal,
        true);
};

Dataset.getLinkedDatasetOptionsNoDefault = function(linkedDatasetUid, col, $field,
    curVal)
{
    return Dataset.getLinkedDatasetOptions(linkedDatasetUid, col, $field, curVal,
        false);
};

Dataset.createFromMapLayerUrl = function(url, successCallback, errorCallback)
{
    $.ajax({url: '/api/layers.json?method=createMapLayerDataset&url='
        + escape(url), type: 'POST', contentType: 'application/json',
        dataType: 'json', success: function(view)
        {
            if(_.isFunction(successCallback))
            { successCallback(new Dataset(view)) }
        }, error: errorCallback});
};

Dataset.lookupFromResourceName = function(resourceName, successCallback, errorCallback, isAnonymous)
{
    $.socrataServer.makeRequest({
        url: '/api/views.json?method=getByResourceName&name=' + resourceName,
        success: function(view)
        {
            var ds = new Dataset(view);
            if (isAnonymous) { ds.isAnonymous(isAnonymous); }
            successCallback(ds);
        },
        batch: false,
        anonymous: isAnonymous,
        pageCache: false,
        error: errorCallback
    });
}


Dataset.lookupFromViewId = function(id, successCallback, errorCallback, isBatch, isAnonymous)
{ Dataset._create(false, id, successCallback, errorCallback, isBatch, isAnonymous); };

Dataset.createFromViewId = function(id, successCallback, errorCallback, isBatch, isAnonymous)
{ Dataset._create(true, id, successCallback, errorCallback, isBatch, isAnonymous); };

Dataset._create = function(clone, id, successCallback, errorCallback, isBatch, isAnonymous)
{
    var cachedView = blist.viewCache[id];
    isAnonymous = !!isAnonymous;

    if (!_.isUndefined(cachedView))
    {
        if ((cachedView === false) && _.isFunction(errorCallback))
        {
            errorCallback({
                responseText: JSON.stringify({
                    code: 'permission_denied',
                    message: 'You do not have access to this view.'
                })
            });
        }
        else if ((cachedView !== false) && _.isFunction(successCallback))
        {
            var ds;
            if (blist.viewCache[id] instanceof Dataset)
            {
                if (clone || blist.viewCache[id].isAnonymous() != isAnonymous)
                { ds = blist.viewCache[id].clone(); }
                else { ds = blist.viewCache[id]; }
            }
            else
            { ds = new Dataset(blist.viewCache[id]); }
            if (isAnonymous) { ds.isAnonymous(isAnonymous); }
            successCallback(ds);
        }
    }
    else
    {
        $.socrataServer.makeRequest({
            url: '/api/views/' + id + '.json',
            success: function(view)
                {
                    if (_.isUndefined(blist.viewCache[id]))
                    { blist.viewCache[id] = new Dataset(view); }

                    if (_.isFunction(successCallback))
                    {
                        var ds = clone || blist.viewCache[id].isAnonymous() != isAnonymous ?
                            new Dataset(view) : blist.viewCache[id];
                        if (isAnonymous) { ds.isAnonymous(isAnonymous); }
                        successCallback(ds);
                    }
                },
            batch: isBatch,
            anonymous: isAnonymous,
            pageCache: !isBatch,
            error: errorCallback});
    }
};

Dataset.search = function(params, successCallback, errorCallback, isAnonymous)
{
    $.socrataServer.makeRequest({pageCache: true, url: '/api/search/views.json', params: params,
        anonymous: isAnonymous,
        success: function(results)
        {
            if (_.isFunction(successCallback))
            {
                successCallback({count: results.count, views: _.map(results.results, function(v)
                    {
                        var ds = new Dataset(v.view);
                        if (isAnonymous) { ds.isAnonymous(isAnonymous); }
                        return ds;
                    })});
            }
        }, error: errorCallback});
};

Dataset.translateFilterCondition = function(fc, ds)
{
    if ($.isBlank(fc) || fc.type != 'operator' || !_.isArray(fc.children) ||
            fc.children.length == 0)
    { return null; }

    var filterQ = { operator: fc.value };

    if (filterQ.operator == 'AND' || filterQ.operator == 'OR')
    {
        filterQ.children = _.compact(_.map(fc.children, function(c)
        {
            var fcc = Dataset.translateFilterCondition(c, ds);
            if (!$.isBlank(fcc)) { fcc._parent = filterQ; }
            return fcc;
        }));
        if (filterQ.children.length == 0)
        { return null; }
        else if (filterQ.children.length == 1)
        {
            var cf = filterQ.children[0];
            cf._parent = filterQ._parent;
            filterQ = cf;
        }
    }
    else
    {
        var col;
        _.each(fc.children, function(c)
        {
            if (c.type == 'column')
            {
                if (!$.isBlank(ds))
                { col = ds.columnForID(c.columnFieldName || c.columnId); }

                if (!$.isBlank(c.columnFieldName))
                { filterQ.columnFieldName = c.columnFieldName; }
                else if (!$.isBlank(col))
                { filterQ.columnFieldName = col.fieldName; }

                if (!$.isBlank(c.value)) { filterQ.subColumn = c.value; }
            }
            else if (c.type == 'literal')
            {
                var v = c.value;
                if (!$.isBlank(col) && _.isFunction(col.renderType.matchValue))
                { v = col.renderType.matchValue(v, col); }
                if ($.isBlank(filterQ.value))
                { filterQ.value = v; }
                else
                {
                    filterQ.value = $.makeArray(filterQ.value);
                    filterQ.value.push(v);
                }
            }
        });
    }

    return filterQ;
};

var VIZ_TYPES = ['chart', 'annotatedtimeline', 'imagesparkline',
    'areachart', 'barchart', 'columnchart', 'linechart', 'piechart'];
var MAP_TYPES = ['map', 'geomap', 'intensitymap'];

/* The type string is not always the simplest thing -- a lot of munging
 * goes on in Rails; we roughly duplicate it here */
function getType(ds)
{
    var type = ds.displayType || 'table';

    if (ds.viewType == 'blobby') { type = 'blob'; }
    else if (ds.viewType == 'href') { type = 'href'; }
    else if (ds.displayType == 'api') { type = 'api'; }
    else if (_.include(['table', 'fatrow', 'page'], type) &&
        _.include(ds.flags || [], 'default')) { type = 'blist'; }

    else if (_.include(VIZ_TYPES, type)) { type = 'chart'; }
    else if (_.include(MAP_TYPES, type)) { type = 'map'; }
    else if (type == 'calendar') {} // Do nothing; but avoid the else cases

    // We have to inspect the message because if it is invalid, the groupBy is gone
    else if (!$.isBlank(ds.query) && !$.isBlank(ds.query.groupBys) &&
        ds.query.groupBys.length > 0 || (ds.message || '').indexOf('roll up') >= 0)
    { type = 'grouped'; }
    else if (_.include(['table', 'fatrow', 'page'], type) &&
        !_.include(ds.flags || [], 'default'))
    { type = 'filter'; }

    return type;
};

function getDisplayName(ds)
{
    var retType = ds.type;

    switch (ds.type)
    {
        case 'blist':
            retType = ds.isPublished() ? 'dataset' : 'working copy';
            break;
        case 'filter':
            retType = 'filtered view';
            break;
        case 'grouped':
            retType = 'grouped view';
            break;
        case 'blob':
            retType = 'embedded file';
            break;
        case 'href':
            retType = 'linked dataset';
            break;
        case 'api':
            retType = 'API';
            break;
    }

    return retType;
};

function cleanViewForSave(ds, allowedKeys)
{
    var dsCopy = ds.cleanCopy(allowedKeys);
    dsCopy = ds._cleanUnsaveable(dsCopy);

    if (!$.isBlank(dsCopy.query))
    { dsCopy.query.filterCondition = ds.cleanFilters(true); }

    return dsCopy;
};

function cleanViewForCreate(ds)
{
    var dsCopy = ds.cleanCopy();

    if (!_.isUndefined(dsCopy.metadata))
    {
        delete dsCopy.metadata.facets;
        delete dsCopy.metadata.filterCondition;
    }
    delete dsCopy.resourceName;
    delete dsCopy.rowIdentifierColumnId;

    if (!$.isBlank(dsCopy.query))
    { dsCopy.query.filterCondition = ds.cleanFilters(true); }

    return dsCopy;
};

if (blist.inBrowser)
{ this.Dataset = Dataset; }
else
{ module.exports = Dataset; }

})();
