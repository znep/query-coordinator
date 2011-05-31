(function(){

/* Properties on Dataset:

    + displayType: from core server, this can be set by the client to tell the
        front-end how to render data.  Available values: 'calendar', 'chart',
        'map', 'form'
    + viewType: set by core server, this defines whether a dataset is tabular data,
        blobby data, or an href.  Possible values: 'tabular', 'blobby', 'href'
    + type: set by this Model, it rolls up several pieces of data to give a simple
        type for the Dataset that code can check against.  Possible values:
        'blist', 'filter', 'grouped', 'chart', 'map', 'form', 'calendar',
        'blob', 'href'
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

this.Dataset = ServerModel.extend({
    _init: function (v)
    {
        this._super();

        this.registerEvent(['columns_changed', 'valid', 'query_change',
            'set_temporary', 'clear_temporary', 'row_change', 'blob_change',
            'row_count_change', 'column_resized', 'displayformat_change',
            'displaytype_change', 'column_totals_changed', 'removed']);

        $.extend(this, v);

        // This ID really shouldn't be changing; if it does, this URL
        // will be out-of-date...
        var selfUrl = '/views/' + this.id;
        Dataset.addProperties(this, ColumnContainer('column',
                selfUrl + '.json', selfUrl + '/columns'), Dataset.prototype);

        if (!$.isBlank(this.approvalHistory))
        {
            Dataset.addProperties(this, Dataset.modules.approvalHistory,
                Dataset.prototype);
        }

        this.updateColumns();

        this._adjustProperties();

        this.temporary = false;
        this.minorChange = true;
        this.valid = this._checkValidity();

        this._pendingRowEdits = {};
        this._pendingRowDeletes = {};

        this._rows = {};
        this._rowIDLookup = {};
        this._rowsLoading = {};
        this._pendingRowReqs = [];

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
        return this._rowIDLookup[parseInt(id) || id];
    },

    rowForIndex: function(index)
    {
        return this._rows[index];
    },

    rowIndex: function(id, successCallback)
    {
        var ds = this;
        if (!$.isBlank(ds.rowForID(id)))
        { successCallback(ds.rowForID(id).index); }
        else
        {
            var gotID = function(data) { successCallback(data[id]); };
            ds.makeRequest({url: '/views/' + ds.id + '/rows.json',
                params: {method: 'getByIds', indexesOnly: true, ids: id},
                success: gotID, type: 'POST'});
        }
    },

    _childRowForID: function(id, parRow, parCol)
    {
        // Someday an actual lookup for child rows might be good; but these
        // should be rare and small, so don't bother yet
        var cell = parRow[parCol.lookup];
        return _.detect(cell || {}, function(sr) { return sr.id == id; });
    },

    isPublic: function()
    {
        var ds = this;
        return _.any(this.grants || [], function(grant)
        { return _.include(grant.flags || [], 'public') &&
            ((ds.type == 'form' && grant.type == 'contributor') ||
                ds.type != 'form'); });
    },

    hasRight: function(right)
    {
        return _.include(this.rights, right);
    },

    isGrid: function()
    {
        return _.include(['blist', 'filter', 'grouped'], this.type);
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

    save: function(successCallback, errorCallback)
    {
        var ds = this;
        if (!ds.hasRight('update_view')) { return false; }

        var vizIds = $.isBlank(ds.visibleColumns) ? null :
            _.pluck(ds.visibleColumns, 'id');
        var dsSaved = function(newDS)
        {
            ds._update(newDS, true, false, true);
            ds._clearTemporary();
            if (!$.isBlank(vizIds) &&
                !_.isEqual(vizIds, _.pluck(ds.visibleColumns, 'id')))
            { ds.setVisibleColumns(vizIds); }
            if (_.isFunction(successCallback)) { successCallback(ds); }
        };

        this.makeRequest({url: '/views/' + this.id + '.json',
            type: 'PUT', data: JSON.stringify(cleanViewForSave(this)),
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

        var ds = cleanViewForCreate(this);
        // Can't handle saving a new view with tags
        if (!$.isBlank(ds.columns))
        {
            ds.columns = _.reject(ds.columns,
                function(c) { return c.dataTypeName == 'tag'; });
        }

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
        this._markTemporary(minorUpdate);
        this._update(newDS, fullUpdate, fullUpdate);
    },

    reload: function(successCallback)
    {
        var ds = this;
        if (ds.type == 'blob')
        {
            ds.trigger('blob_change');
            return;
        }
        ds._aggregatesStale = true;
        ds._loadRows(0, 1, function()
            {
                ds._invalidateRows();
                if (_.isFunction(successCallback)) { successCallback(); }
            }, true, true);
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

        if (!ds.isPublic())
        {
            ds.grants = ds.grants || [];
            ds.grants.push({type: (ds.type == 'form' ? 'contributor' : 'viewer'),
                flags: ['public']});

            ds.makeRequest({url: '/views/' + ds.id,
                      params: {method: 'setPermission', value:
                         (ds.type == 'form' ? 'public.add' : 'public.read')},
                    type: 'PUT',
                    success: successCallback, error: errorCallback});
        }
        else if (_.isFunction(successCallback)) { successCallback(); }
    },

    makePrivate: function(successCallback, errorCallback)
    {
        var ds = this;

        if (ds.isPublic())
        {
            ds.grants = _.reject(ds.grants,
                function(g) { return _.include(g.flags || [], 'public') &&
                    g.inherited !== true; });

            ds.makeRequest({url: '/views/' + ds.id + '.json', type: 'PUT',
                    params: {method: 'setPermission', value: 'private'},
                    success: successCallback, error: errorCallback});
        }
        else if (_.isFunction(successCallback)) { successCallback(); }
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

    getTotalRows: function(callback)
    {
        this.getRows(0, 1, callback);
    },

    getClusters: function(callback)
    {
        var ds = this;

        ds.makeRequest({
            params: {method: 'clustered'},
            inline: true,
            success: callback
        });
    },

    // Callback may be called multiple times with smaller batches of rows
    getRows: function(start, len, callback)
    {
        var ds = this;

        var pageSize = 100;
        var reqs = [];
        var curReq;
        var pendReq;
        var finish = start + len - 1;
        var loaded = [];
        var pendingRemoved = [];
        var now = new Date().getTime();

        var doLoaded = function()
        {
            if (loaded.length > 0 || ds.totalRows == 0)
            {
                callback(loaded);
                loaded = [];
            }
        };

        while (start <= finish &&
            ($.isBlank(ds.totalRows) || start < ds.totalRows))
        {
            var r = ds._rows[start];
            // If this is an expired pending orw, clean it out and mark
            // it null so it gets reloaded
            if (!$.isBlank(r) && r.pending && now > r.expires)
            {
                delete ds._rows[r.index];
                delete ds._rowIDLookup[r.id];
                pendingRemoved.push(r);
                r = null;
            }

            if ($.isBlank(r))
            {
                doLoaded();
                if (ds._rowsLoading[start])
                {
                    if (!$.isBlank(curReq))
                    {
                        reqs.push(curReq);
                        curReq = null;
                    }

                    if ($.isBlank(pendReq))
                    {
                        pendReq = {start: start, length: 1,
                            callback: callback};
                    }
                    else
                    { pendReq.length++; }
                }
                else
                {
                    if (!$.isBlank(pendReq))
                    {
                        ds._pendingRowReqs.push(pendReq);
                        pendReq = null;
                    }

                    if ($.isBlank(curReq))
                    { curReq = {start: start, finish: start}; }
                    else
                    {
                        if (start - curReq.start + 1 > pageSize)
                        {
                            reqs.push(curReq);
                            curReq = {start: start};
                        }
                        else { curReq.finish = start; }
                    }
                }
            }
            else
            {
                if (!$.isBlank(curReq))
                {
                    reqs.push(curReq);
                    curReq = null;
                }
                if (!$.isBlank(pendReq))
                {
                    ds._pendingRowReqs.push(pendReq);
                    pendReq = null;
                }
                loaded.push(r);
            }
            start++;
        }

        doLoaded();

        if (pendingRemoved.length > 0)
        { ds.trigger('row_change', [pendingRemoved, true]); }

        if (!$.isBlank(curReq))
        {
            if (_.isUndefined(curReq.finish))
            {
                curReq.finish = curReq.start;
            }
            reqs.push(curReq);
            curReq = null;
        }
        if (!$.isBlank(pendReq))
        {
            ds._pendingRowReqs.push(pendReq);
            pendReq = null;
        }

        if (reqs.length > 0)
        {
            var loadAllRows = function()
            {
                _.each(reqs, function(req)
                {
                    if (req.start >= ds.totalRows) { return false; }
                    if (req.finish >= ds.totalRows)
                    { req.finish = ds.totalRows - 1; }
                    ds._loadRows(req.start, req.finish - req.start + 1, callback);
                });
            };

            if ($.isBlank(ds.totalRows))
            {
                // Need to make init req to get all the meta
                var initReq = reqs.shift();
                ds._loadRows(initReq.start, initReq.finish - initReq.start + 1,
                    function(rows)
                    {
                        if (_.isFunction(callback)) { callback(rows); }
                        loadAllRows();
                    }, true);
            }
            else
            {
                // Just request rows
                loadAllRows();
            }
        }
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

        if ($.isBlank(parRow))
        {
            newRow.index = data.index || ds.totalRows;
            $.addItemsToObject(ds._rows, newRow, newRow.index);
            ds._rowIDLookup[newRow.id] = newRow;
            ds.totalRows++;
            ds.trigger('row_count_change');
        }
        else
        {
            parRow[parCol.lookup] = parRow[parCol.lookup] || [];
            if (!$.isBlank(data.index))
            { parRow[parCol.lookup].splice(data.index, 0, newRow); }
            else { parRow[parCol.lookup].push(newRow); }
            ds.trigger('row_change', [[parRow], true]);
        }


        _.each(!$.isBlank(parCol) ? parCol.realChildColumns : ds.realColumns,
            function(c) { newRow.changed[c.lookup] = true; });

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
            row = this._childRowForID(rowId, parRow, parCol);
        }
        else
        { row = this.rowForID(rowId); }
        if ($.isBlank(row))
        { throw 'Row ' + rowId + ' not found while setting value'; }

        row[col.lookup] = value;

        delete row.error[col.lookup];

        row.changed[col.lookup] = true;

        row.invalid[col.lookup] = isInvalid || false;

        this._setRowFormatting(row);

        this.trigger('row_change', [[parRow || row]]);
    },

    saveRow: function(rowId, parRowId, parColId, successCallback, errorCallback)
    {
        var ds = this;
        var parCol;
        if (!$.isBlank(parColId)) { parCol = this.columnForID(parColId); }

        var parRow;
        var row;
        if (!$.isBlank(parRowId))
        {
            parRow = this.rowForID(parRowId);
            row = this._childRowForID(rowId, parRow, parCol);
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
        ds._serverSaveRow(reqObj);
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
                $.removeItemsFromObject(ds._rows, r.index, 1);
                delete ds._rowIDLookup[rId];
                ds.totalRows--;
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
        ds.sendBatch({success: successCallback, error: errorCallback});
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
                if (!$.isBlank(c)) { c.aggregates[a.name] = parseFloat(a.value); }
            });

            if ($.isBlank(customAggs))
            {
                ds._aggregatesStale = false;
                if (_.isFunction(callback)) { callback(); }
            }
        };

        var isStale = ds._aggregatesStale ||
            _.any(customAggs || {}, function(aList, cId)
            {
                var col = ds.columnForID(cId);
                if ($.isBlank(col)) { return true; }
                return _.any($.makeArray(aList),
                    function(a) { return $.isBlank(col.aggregates[a]); });
            });

        if (isStale)
        {
            var args = {success: aggResult, params: {method: 'getAggregates'},
                inline: true};

            if (!$.isBlank(customAggs))
            {
                var ilViews = [];
                _.each(customAggs, function(aggList, cId)
                {
                    _.each(aggList, function(a, i)
                    {
                        if ($.isBlank(ilViews[i]))
                        { ilViews[i] = ds.cleanCopy(); }
                        var col = _.detect(ilViews[i].columns, function(c)
                        { return c.id == parseInt(cId); });
                        col.format.aggregate = a;
                    });
                });
                _.each(ilViews, function(v)
                {
                    args = $.extend({}, args,
                        {data: JSON.stringify(v), batch: true});
                    ds.makeRequest(args);
                });
                ds.sendBatch(callback);
            }
            else { ds.makeRequest(args); }
        }
        else
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
                    ds.trigger('row_change', [[r]]);
                }
            }

            if (_.isFunction(successCallback)) { successCallback(newCom); }
        };

        ds.makeRequest({url: '/views/' + ds.id + '/comments.json',
                type: 'POST', data: JSON.stringify(comment),
                success: addedComment, error: errorCallback});
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

        if ($.isBlank(ds._cachedLinkedColumnOptions[viewUid]))
        {
            ds.makeRequest({url: '/api/views/{0}.json'.format(viewUid),
                pageCache: true, type: 'GET',
                error: function(req)
                {
                    alert('Fail to get columns from dataset {0}.'.format(viewUid));
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
                            opt = {value: String(c.id), text: c.name,
                                dataType: c.dataTypeName};
                            cldo.push(opt);
                        }
                    });
                    if (ds._cachedLinkedColumnOptions[viewUid].length <= 0)
                    {
                        alert('Dataset {0} does not have any column.'
                            .format(viewUid));
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
                return { value: dt, text: blist.data.types[dt].title };
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
                if (!$.isBlank(nf.displayTypes) &&
                    !_.include(nf.displayTypes, ds.displayType)) { return; }
                nf = $.extend(true, {}, nf);
                delete nf.temporary;
                delete nf.displayTypes;
                newFilters.push(nf);
            });
            if (newFilters.length > 0)
            {
                if ($.isBlank(filters))
                { filters = {children: [], type: 'operator', value: 'AND'}; }
                else if (filters.type != 'operator' || filters.value != 'AND')
                {
                    filters = {type: 'operator', value: 'AND',
                        children: [filters]};
                }
                filters.children = filters.children.concat(newFilters);
            }
        }
        return filters;
    },

    cleanCopy: function()
    {
        var dsCopy = this._super();
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
        ds.styleClass = ds.type.capitalize();
        if ($.isBlank(ds.displayType))
        {
            ds.displayType = {
                'tabular': 'table',
                'blobby': 'blob',
                'href': 'href'
            }[ds.viewType];
        }
        ds.displayName = getDisplayName(ds);

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
            {
                Dataset.addProperties(ds, Dataset.modules[t] || {},
                    Dataset.prototype);
            });
            ds._addedProperties = true;
        }

        ds.displayFormat = ds.displayFormat || {};

        if (_.isFunction(ds._convertLegacy)) { ds._convertLegacy(); }

        if (!$.subKeyDefined(ds, 'metadata.availableDisplayTypes'))
        {
            ds.metadata = ds.metadata || {};
            var adt;
            if (_.include(['blob', 'href', 'form'], ds.type))
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

        ds.url = ds._generateUrl();
        ds.fullUrl = ds._generateUrl(true);
        ds.shortUrl = ds._generateShortUrl(true);
        ds.apiUrl = ds._generateApiUrl();
        ds.domainUrl = ds._generateBaseUrl(ds.domainCName);
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
        var oldDispFmt = ds.displayFormat;
        var oldDispType = ds.displayType;
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
        _.each(['namedFilters', 'filterCondition', 'sortBys', 'groupBys'],
            function(k) { if (_.isEmpty(ds.query[k])) { delete ds.query[k]; } });

        var needQueryChange = oldDispType != ds.displayType &&
                _.any(ds.query.namedFilters || [], function(nf)
                    { return _.any(nf.displayTypes || [], function(nd)
                        { return nd == oldDispType || nd == ds.displayType; }); });

        if (needQueryChange || (oldSearch !== ds.searchString) ||
                !_.isEqual(oldQuery, ds.query))
        {
            if (needQueryChange || oldSearch !== ds.searchString ||
                !_.isEqual(oldQuery.filterCondition, ds.query.filterCondition) ||
                !_.isEqual(oldQuery.namedFilters, ds.query.namedFilters) ||
                !_.isEqual(oldQuery.groupBys, ds.query.groupBys))
            { ds._rowCountInvalid = true; }
            ds.trigger('query_change');
            ds._aggregatesStale = true;
            // Clear out the rows, since the data is different now
            ds._invalidateRows();
        }
        else if (!_.isEqual(oldCondFmt, ds.metadata.conditionalFormatting))
        {
            // If we aren't invalidating all the rows, but conditional formatting
            // changed, then redo all the colors and re-render
            _.each(ds._rows, function(r) { ds._setRowFormatting(r); });
            ds.trigger('row_change', [_.values(ds._rows)]);
        }

        if (oldDispType != ds.displayType)
        {
            // If we're given a displayType not in our list, then add it
            if (!$.isBlank(ds.displayType) &&
                !_.include(ds.metadata.availableDisplayTypes, ds.displayType))
            { ds.metadata.availableDisplayTypes.unshift(ds.displayType); }
            ds.trigger('displaytype_change');
        }

        if (!_.isEqual(oldDispFmt, ds.displayFormat))
        { ds.trigger('displayformat_change'); }

        if (masterUpdate)
        { ds._origObj = ds.cleanCopy(); }
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
                if (c.hidden && !oldGroupAggs[c.id])
                { c.update({flags: _.without(c.flags, 'hidden')}); }
                newGroupAggs[c.id] = c.format.grouping_aggregate;

                newColOrder.push(c.id);
            });

        if ($.isBlank(ds.query.groupBys))
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
            ds._columnsInvalid = true;
            ds._invalidateRows();
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

        this._super(req);
    },

    _invalidateRows: function()
    {
        var invRows = _.values(this._rows);
        this._rows = {};
        this._rowsLoading = {};
        this._pendingRowReqs = [];
        this._rowIDLookup = {};
        delete this.totalRows;
        _.each(this.columns || [], function(c) { c.invalidateData(); });
        this.trigger('row_change', [invRows, true]);
    },

    _loadRows: function(start, len, callback, includeMeta, fullLoad)
    {
        var ds = this;
        var params = {method: 'getByIds', start: start, 'length': len, asHashes: true};

        if (includeMeta || ds._rowCountInvalid || ds._columnsInvalid)
        { params.meta = true; }

        var rowsLoaded = function(result)
        {
            var oldCount = ds.totalRows;
            if (!$.isBlank(result.meta))
            {
                ds.totalRows = result.meta.totalRows;
                delete ds._rowCountInvalid;
                delete ds._columnsInvalid;
                if (!fullLoad)
                {
                    result.meta.view.query.filterCondition =
                        ds.query.filterCondition;
                    if (!$.isBlank(ds.query.namedFilters))
                    {
                        result.meta.view.query.namedFilters =
                            ds.query.namedFilters;
                    }
                }
                ds._update(result.meta.view, true, true, fullLoad);
            }

            if (fullLoad) { ds._clearTemporary(); }

            var rows;
            // If this result is marked pending, then we got no data, and we need
            // placeholder rows
            if (result.pending)
            {
                rows = [];
                var oldRows = [];
                // Make them expire after a short time, which will force a reload
                // the next time something wants to render them
                var expires = new Date().getTime() + 30000;
                for (var i = 0; i < len; i++)
                {
                    var newRow = {invalid: {}, error: {}, changed: {},
                        index: i + start, pending: true, expires: expires,
                        id: 'pending_' + _.uniqueId()};

                    // If an existing row, clean it out
                    if (!$.isBlank(ds._rows[newRow.index]))
                    {
                        var oldRow = ds._rows[newRow.index];
                        oldRows.push(oldRow);
                        delete ds._rowIDLookup[oldRow.id];
                    }

                    ds._rows[newRow.index] = newRow;
                    ds._rowIDLookup[newRow.id] = newRow;
                    rows.push(newRow);
                }
                if (oldRows.length > 0)
                { ds.trigger('row_change', [oldRows, true]); }
            }
            // Normal load
            else
            { rows = ds._addRows(result.data || result, start); }

            // Mark all rows as loaded
            for (var i = 0; i < len; i++)
            { delete ds._rowsLoading[i + start]; }

            if (oldCount !== ds.totalRows)
            { ds.trigger('row_count_change'); }

            if (_.isFunction(callback)) { callback(rows); }

            var pending = ds._pendingRowReqs;
            ds._pendingRowReqs = [];
            _.each(pending, function(p)
            { ds.getRows(p.start, p.length, p.callback); });
        };

        // Keep track of rows that are being loaded
        for (var i = 0; i < len; i++)
        { ds._rowsLoading[i + start] = true; }

        var req = {success: rowsLoaded, params: params, inline: !fullLoad, type: 'POST'};
        if (fullLoad)
        { req.url = '/views/' + ds.id + '/rows.json'; }
        ds.makeRequest(req);
    },

    _addRows: function(newRows, start)
    {
        var ds = this;
        var translateRow = function(r, parCol)
        {
            var adjVals = {invalid: {}, changed: {}, error: {}};
            _.each(r, function(val, id)
            {
                var newVal;
                // A few columns don't have original lookups
                var lId = {sid: 'id', 'id': 'uuid'}[id] || id;
                var c = $.isBlank(parCol) ? ds.columnForID(lId) : parCol.childColumnForID(lId);

                if (c.isMeta && c.name == 'meta')
                { newVal = JSON.parse(val || 'null'); }

                if ($.isPlainObject(val))
                {
                    // First, convert an empty array into a null
                    // Booleans in the array don't count because location type
                    // has a flag that may be set even if there is no data.  If
                    // some type actually cares about only having a boolean,
                    // this will need to be made more specific
                    if (_.all(val, function(v)
                        { return $.isBlank(v) || _.isBoolean(v); }))
                    { newVal = null; }
                }

                if (c.renderTypeName == 'checkbox' && val === false ||
                        c.renderTypeName == 'stars' && val === 0)
                { newVal = null; }

                if (c.renderTypeName == 'geospatial' && r.sid)
                { newVal = $.extend({}, val, {row_id: r.sid}); }

                if (c.dataTypeName == 'nested_table' && _.isArray(val))
                {
                    _.each(val, function(cr) { translateRow(cr, c); });
                }

                // A few columns have different ids we use than the core server gives us
                if (id != c.lookup) { newVal = newVal || val; }

                if (!_.isUndefined(newVal))
                { adjVals[c.lookup] = newVal; }
            });
            $.extend(r, adjVals);

            _.each((r.meta || {}).invalidCells || {}, function(v, tcId)
            {
                if (!$.isBlank(v))
                {
                    var c = !$.isBlank(parCol) ? parCol.childColumnForTCID(tcId) :
                        ds.columnForTCID(tcId);
                    if (!$.isBlank(c))
                    {
                        r.invalid[c.id] = true;
                        r[c.lookup] = v;
                    }
                }
            });
            delete (r.meta || {}).invalidCells;

            _.each((ds._commentLocations || {})[r.id] || {}, function(v, tcId)
            {
                var c = ds.columnForTCID(tcId);
                if (!$.isBlank(c))
                {
                    r.annotations = r.annotations || {};
                    r.annotations[c.lookup] =  'comments';
                }
            });

            ds._setRowFormatting(r);
        };

        var adjRows = [];
        var oldRows = [];
        _.each(newRows, function(r, i)
        {
            translateRow(r);
            r.index = start + i;

            // If a row already exists at this index, clean it out
            if (!$.isBlank(ds._rows[r.index]) && r.id != ds._rows[r.index].id)
            {
                var oldRow = ds._rows[r.index];
                oldRows.push(oldRow);
                delete ds._rowIDLookup[oldRow.id];
            }

            ds._rows[r.index] = r;
            ds._rowIDLookup[r.id] = r;
            adjRows.push(r);
        });

        if (oldRows.length > 0)
        { ds.trigger('row_change', [oldRows, true]); }

        return adjRows;
    },

    _setRowFormatting: function(row)
    {
        // This reads metadata.conditionalFormatting, which is an ordered
        // array of conditions & colors. The row will get the color of the
        // first condition that it matches, or no color if it matches none
        // of them.
        // metadata.conditionalFormatting is an array. Each entry is an object
        // with two keys: color and condition.
        // * color: String of CSS color, such as '#ffffff' or
        //          'rgba(255, 255, 255, 1)'
        // * condition: Can be true, in which case any row will match this
        //          condition. This is a good way to make a default as the
        //          last item in the list. Otherwise it is an object. In the basic
        //          case, this has three keys:
        //   * tableColumnId: Identifies a column to look up the cell value in this
        //          row to use for comparision
        //   * operator: How to do the comparison; operators available are the same
        //          as for filter conditions
        //   * value: Value to compare against
        //   Alternately, you can have more complex expressions by providing
        //   a key of children which has an array of condition objects.
        //   In this case, operator is still required, but should be either
        //   'and' or 'or' to control how the multiple conditions are combined
        //
        // Simple example to mark rows that have too high a measurement, too low,
        // or within range:
        // metadata.conditionalFormatting: [
        //   {
        //     color: '#ff9999',
        //     condition: {
        //       tableColumnId: 123,
        //       operator: 'greater_than',
        //       value: 100
        //     }
        //   },
        //   {
        //     color: '#9999ff',
        //     condition: {
        //       tableColumnId: 123,
        //       operator: 'less_than',
        //       value: 20
        //     }
        //   },
        //   {
        //     color: '#99ff99',
        //     condition: true
        //   }
        // ]

        // First clear color & icon, as they will be set properly later
        row.color = row.icon = null;

        var ds = this;
        var cf = ds.metadata.conditionalFormatting;
        if (!_.isArray(cf)) { return null; }

        var matchesCondition;
        matchesCondition = function(c)
        {
            if (c === true) { return true; }
            if (!$.subKeyDefined(c, 'operator') ||
                !$.subKeyDefined(c, 'tableColumnId') &&
                !$.subKeyDefined(c, 'children')) { return false; }

            // Handle array of sub-conditions
            if (!$.isBlank(c.children))
            {
                var func = c.operator.toLowerCase() == 'or' ? 'any' : 'all';
                return _[func](c.children, function(cc)
                { return matchesCondition(cc); });
            }

            var col = ds.columnForTCID(c.tableColumnId);
            if ($.isBlank(col)) { return false; }
            // Make sure this type of condition is supported for this column
            if (!_.any(col.renderType.filterConditions, function(fc)
                { return c.operator.toUpperCase() == fc.value; }))
            { return false; }

            var rowVal = row[col.lookup];
            if ($.isPlainObject(rowVal) && !$.isBlank(c.subColumn))
            { rowVal = rowVal[c.subColumn]; }

            var condVal = c.value;
            // Need to translate some values in a more comparable format
            if (col.renderTypeName == 'drop_down_list')
            {
                // This is a numeric comparison, so use indices
                _.each(col.dropDownList.values, function(ddv, i)
                {
                    if (ddv.id == rowVal) { rowVal = i; }
                    condVal = _.map($.makeArray(condVal), function(cv)
                        { return ddv.id == cv ? i : cv; });
                });
                if (condVal.length == 1) { condVal = condVal[0]; }
            }
            if (col.renderTypeName == 'dataset_link' && !$.isBlank(col.dropDownList))
            {
                // Assume condVal is already in the displayable version
                _.each(col.dropDownList.values, function(ddv)
                { if (ddv.id == rowVal) { rowVal = ddv.description; } });
            }

            if (col.renderTypeName == 'location')
            {
                // human_address in a location column is a JSON string; but we really want to compare
                // the objects, without any of the blank keys. So munge it
                var mungeLoc = function(v)
                {
                    if (_.isString((v || {}).human_address))
                    {
                        v = $.extend({}, v, {human_address: $.deepCompact(JSON.parse(v.human_address))});
                        _.each(_.keys(v.human_address), function(k)
                            { v.human_address[k] = v.human_address[k].toLowerCase(); });
                    }
                    return v;
                };
                condVal = mungeLoc(condVal);
                rowVal = mungeLoc(rowVal);
            }

            if (_.isNumber(condVal)) { rowVal = parseFloat(rowVal); }

            var getResult = function(v, cv)
            {
                if (_.isString(v)) { v = v.toLowerCase(); }
                if (_.isString(cv)) { cv = cv.toLowerCase(); }

                switch (c.operator.toLowerCase())
                {
                    case 'equals':
                        return _.isEqual(v, cv);
                        break;
                    case 'not_equals':
                        return !_.isEqual(v, cv);
                        break;
                    case 'greater_than':
                        return v > cv;
                        break;
                    case 'greater_than_or_equals':
                        return v >= cv;
                        break;
                    case 'less_than':
                        return v < cv;
                        break;
                    case 'less_than_or_equals':
                        return v <= cv;
                        break;
                    case 'starts_with':
                        return (v || '').startsWith(cv);
                        break;
                    case 'contains':
                        return (v || '').indexOf(cv) > -1;
                        break;
                    case 'not_contains':
                        return (v || '').indexOf(cv) < 0;
                        break;
                    case 'is_blank':
                        return $.isBlank(v);
                        break;
                    case 'is_not_blank':
                        return !$.isBlank(v);
                        break;
                    case 'between':
                        if (!_.isArray(cv)) { return false; }
                        return cv[0] <= v && v <= cv[1];
                        break;
                }
                return false;
            };

            if (_.isArray(rowVal))
            {
                return _.any(rowVal, function(v)
                    { return getResult(v, condVal); });
            }
            else if ($.isPlainObject(rowVal))
            {
                var func = c.operator.toLowerCase() == 'is_not_blank' ? 'any' : 'all';
                return _[func](rowVal, function(v, k)
                    {
                        var cv = $.isPlainObject(condVal) ? condVal[k] : condVal;
                        if (!$.isBlank(cv) ||
                            c.operator.toLowerCase().endsWith('_blank'))
                        { return getResult(v, cv); }
                        return true;
                    });
            }
            else { return getResult(rowVal, condVal); }
        };

        var relevantCondition = _.detect(cf, function(c)
            { return matchesCondition(c.condition); }) || {};

        if (relevantCondition.color)
        { row.color = relevantCondition.color; }

        if (relevantCondition.icon)
        { row.icon = relevantCondition.icon; }
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

        // Tags has to be sent as a special key
        if (!$.isBlank(data.tags))
        {
            data._tags = data.tags;
            delete data.tags;
        }

        // Copy over desired metadata columns
        data.position = row.position;
        data.meta = row.meta;

        // Invalid values need to be saved into metadata
        _.each(row.invalid, function(isI, cId)
        {
            if (isI)
            {
                var c = !$.isBlank(parCol) ? parCol.childColumnForID(cId) :
                    ds.columnForID(cId);
                data.meta = data.meta || {};
                data.meta.invalidCells = data.meta.invalidCells || {};
                data.meta.invalidCells[c.tableColumnId] = data[cId];
                data[cId] = null;
            }
        });

        // Metadata is a JSON sring
        if (!$.isBlank(data.meta))
        { data.meta = JSON.stringify(data.meta); }

        return data;
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
                        // If this value is changed, then don't overwrite it
                        // with what comes back from the server. This probably
                        // only applies to creating a row via tags
                        if (!req.row.changed[l])
                        { req.row[l] = v; }
                    }
                });
            if (req.row.underlying)
            {
                req.row.noMatch = true;
                delete req.row.underlying;
            }

            if ($.isBlank(req.parentRow))
            {
                ds._rowIDLookup[req.row.id] = req.row;
                delete ds._rowIDLookup[oldID];
            }

            ds._setRowFormatting(req.row);

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
                ds.sendBatch();
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

            if (!newRow._underlying) { delete r.row.noMatch; }

            ds.trigger('row_change', [[r.parentRow || r.row]]);
            ds.aggregatesChanged();
            if (_.isFunction(r.success)) { r.success(r.row); }
        };

        // On error, mark as such and notify
        var rowErrored = function(xhr)
        {
            _.each(r.columnsSaving, function(cId)
                { r.row.error[cId] = true; });
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
            ds.sendBatch();
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

        return base + "/" + $.urlSafe(ds.category || "dataset") +
               "/" + $.urlSafe(ds.name) +
               "/" + ds.id;
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

    _setupDefaultSnapshotting: function(delay)
    {
        // by default, just wait til the rows are loaded
        this.bind('finish_request', function()
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
        query: true,
        queryString: true,
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
        $.Tache.Get({url: '/api/views/{0}.json'.format(viewUid),
            error: function(req)
            {
                alert('Fail to get columns from dataset {0}.'.format(viewUid));
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
                        opt = {value: String(c.id), text: c.name};
                        if (useRdfKeyAsDefault && opt.value === rdfSubject)
                        {
                            opt.selected = true;
                        }
                        cldo.push(opt);
                    }
                });

                if (cachedLinkedDatasetOptions[viewUid].length <= 0)
                {
                    alert('Dataset {0} does not have any column.'.format(viewUid));
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

Dataset.createFromViewId = function(id, successCallback, errorCallback)
{
    $.Tache.Get({
        url: '/api/views/' + id + '.json',
        success: function(view)
            {
                if(_.isFunction(successCallback))
                { successCallback(new Dataset(view)) }
            },
        error: errorCallback});
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
            retType = 'dataset';
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
    }

    return retType;
};

function cleanViewForSave(ds)
{
    var dsCopy = ds.cleanCopy();

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

    if (!$.isBlank(dsCopy.query))
    { dsCopy.query.filterCondition = ds.cleanFilters(true); }

    return dsCopy;
};

})();
