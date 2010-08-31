(function(){

/* Properties on Dataset:

    + displayType: from core server, this can be set by the client to tell the
        front-end how to render data.  Available values: 'calendar', 'chart',
        'map', 'form'
    + viewType: set by core server, this defines whether a dataset is tabular data,
        blobby data, or an href.  Possible values: 'tabular', 'blobby', 'href'
    + type: set by this Model, it rolls up several pieces of data to give a simple
        type for the Dataset that code can check against.  Possible values:
        'blist', 'filter', 'grouped', 'visualization', 'map', 'form', 'calendar',
        'blob', 'href'
    + styleClass: set by this Model, this can be set as a class on an HTML element
        to pick up styling for this type of Dataset
    + displayName: set by this Model, a displayable string that should used in the
        UI to indicate this item.  For example, it can be 'dataset',
        'filtered view', 'grouped view', etc.

*/

this.Dataset = Model.extend({
    _init: function (v)
    {
        this._super();

        this.registerEvent(['columns_changed', 'valid', 'query_change',
            'set_temporary', 'clear_temporary', 'row_change',
            'row_count_change', 'column_resized', 'displayformat_change',
            'column_totals_changed']);

        $.extend(this, v);

        // This ID really shouldn't be changing; if it does, this URL
        // will be out-of-date...
        var selfUrl = '/views/' + this.id;
        Dataset.addProperties(this, ColumnContainer('column',
                selfUrl + '.json', selfUrl + '/columns'), Dataset.prototype);

        this.type = getType(this);
        this.styleClass = this.type.capitalize();
        this.displayName = getDisplayName(this);

        this.displayFormat = this.displayFormat || {};

        this.originalViewId = this.id;

        Dataset.addProperties(this, Dataset.modules[this.type] || {},
            Dataset.prototype);

        this.updateColumns();

        if (_.isFunction(this._convertLegacy)) { this._convertLegacy(); }

        this.temporary = false;
        this.valid = this._checkValidity();
        this.url = this._generateUrl();

        this._pendingRowEdits = {};
        this._pendingRowDeletes = {};

        this._rows = {};
        this._rowIDLookup = {};
        this._rowsLoading = {};
        this._pendingRowReqs = [];

        this._aggregatesStale = true;

        this._origQuery = $.extend(true, {}, this.query);
        this._origSearchString = this.searchString;
    },

    rowForID: function(id)
    {
        return this._rowIDLookup[parseInt(id) || id];
    },

    rowForIndex: function(index)
    {
        return this._rows[index];
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
            grant.type == (ds.type == 'form' ? 'contributor' : 'viewer'); });
    },

    hasRight: function(right)
    {
        return _.include(this.rights, right);
    },

    isGrid: function()
    {
        return _.include(['blist', 'filter', 'grouped'], this.type);
    },

    isGrouped: function()
    {
        return ((this.query || {}).groupBys || []).length > 0;
    },

    save: function(successCallback, errorCallback)
    {
        var ds = this;
        if (!ds.hasRight('update_view')) { return false; }

        var dsSaved = function(newDS)
        {
            ds._update(newDS, true, false, true);
            ds._clearTemporary();
            if (_.isFunction(successCallback)) { successCallback(ds); }
        };

        this._makeRequest({url: '/views/' + this.id + '.json',
            type: 'PUT', data: JSON.stringify(cleanViewForSave(this)),
            error: errorCallback,
            success: dsSaved
        });

        return true;
    },

    saveNew: function(successCallback, errorCallback)
    {
        var dsCreated = function(newDS)
        {
            newDS = new Dataset(newDS);
            if (_.isFunction(successCallback)) { successCallback(newDS); }
        };

        var ds = cleanViewForSave(this);
        // Can't handle saving a new view with tags
        if (!$.isBlank(ds.columns))
        {
            ds.columns = _.reject(ds.columns,
                function(c) { return c.dataTypeName == 'tag'; });
        }

        this._makeRequest({url: '/views.json', type: 'POST',
            data: JSON.stringify(ds),
            error: errorCallback,
            success: dsCreated
        });
    },

    update: function(newDS, fullUpdate)
    {
        this._update(newDS, fullUpdate, fullUpdate);
        this.temporary = true;
        this.trigger('set_temporary');
    },

    reload: function()
    {
        var ds = this;
        ds._loadRows(0, 1, function() { ds._invalidateRows(); }, true, true);
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

        ds._makeRequest({url: '/api/views/' + ds.id + '/grants/i',
            params: {method: 'delete'}, type: 'PUT', data: JSON.stringify(grant),
            success: grantDeleted, error: errorCallback});
    },

    createGrant: function(grant, successCallback, errorCallback, isBatch)
    {
        var ds = this;

        var grantCreated = function()
        {
            ds.grants = ds.grants || [];
            ds.grants.push(grant);
            if (_.isFunction(successCallback)) { successCallback(); }
        };

        ds._makeRequest({url: '/api/views/' + ds.id + '/grants/',
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

            ds._makeRequest({url: '/views/' + ds.id + '.json', type: 'GET',
                    data: {method: 'setPermission',
                    value: ds.type == 'form' ? 'public.add' : 'public.read'},
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
                    g.inherited === false; });

            ds._makeRequest({url: '/views/' + ds.id + '.json', type: 'GET',
                    data: {method: 'setPermission', value: 'private'},
                    success: successCallback, error: errorCallback});
        }
        else if (_.isFunction(successCallback)) { successCallback(); }
    },

    notifyUsers: function(successCallback, errorCallback)
    {
        this._makeRequest({url: '/api/views/' + this.id + '.json',
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

    clearColumn: function(col)
    {
        var ds = this;
        var colLookup = col.lookup;
        var childLookup;
        if (!$.isBlank(col.parentColumn))
        {
            childLookup = colLookup;
            colLookup = col.parentColumn.lookup;
            col.parentColumn.clearChildColumn(col);
        }
        _.each(ds._rows, function(r)
        {
            if ($.isBlank(childLookup)) { delete r[colLookup]; }
            else
            {
                _.each(r[colLookup] || [], function(cr)
                    { delete cr[childLookup]; });
            }
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

        var doLoaded = function()
        {
            if (loaded.length > 0)
            {
                callback(loaded);
                loaded = [];
            }
        };

        while (start <= finish &&
            ($.isBlank(ds.totalRows) || start < ds.totalRows))
        {
            var r = ds._rows[start];
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

        if (!$.isBlank(curReq))
        {
            reqs.push(curReq);
            curReq = null;
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

        this.trigger('row_change', [parRow || row]);
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
        ds._sendBatch({success: successCallback, error: errorCallback});
    },

    getAggregates: function(callback, customAggs)
    {
        var ds = this;
        var aggResult = function(aggs)
        {
            _.each(aggs, function(a)
            {
                var c = ds.columnForID(a.columnId);
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
                    ds._makeRequest(args);
                });
                ds._sendBatch(callback);
            }
            else { ds._makeRequest(args); }
        }
        else
        { callback(); }
    },

    aggregatesChanged: function()
    {
        this._aggregatesStale = true;
        this.trigger('column_totals_changed');
    },

    updateRating: function(rating, successCallback, errorCallback)
    {
        this._makeRequest({url: '/views/' + this.id + '/ratings.json',
            type: 'POST', data: JSON.stringify(rating),
            success: successCallback, error: errorCallback});
    },

    remove: function(successCallback, errorCallback)
    {
        this._makeRequest({url: '/datasets/' + this.id + '.json',
            type: 'DELETE',
            success: successCallback, error: errorCallback});
    },

    registerOpening: function(accessType, referrer)
    {
        var params = {method: 'opening'};
        if (!$.isBlank(accessType)) { params.accessType = accessType; }
        if (!$.isBlank(referrer)) { params.referrer = referrer; }
        this._makeRequest({url: '/views/' + this.id + '.json', params: params});
    },

    getComments: function(callback)
    {
        var ds = this;
        if ($.isBlank(ds._comments))
        {
            ds._makeRequest({url: '/views/' + ds.id + '/comments.json',
                type: 'GET', pageCache: true, success: function(comms)
                {
                    ds._comments = comms;
                    callback(ds._comments);
                }});
        }
        else { callback(ds._comments); }
    },

    addComment: function(comment, successCallback, errorCallback)
    {
        var ds = this;

        var addedComment = function(newCom)
        {
            if (!$.isBlank(ds._comments)) { ds._comments.unshift(newCom); }
            if (_.isFunction(successCallback)) { successCallback(newCom); }
        };

        ds._makeRequest({url: '/views/' + ds.id + '/comments.json',
                type: 'POST', data: JSON.stringify(comment),
                success: addedComment, error: errorCallback});
    },

    flagComment: function(commentId, successCallback, errorCallback)
    {
        var ds = this;

        var com = _.detect(ds._comments || [],
            function(c) { return c.id == parseInt(commentId); });
        if (!$.isBlank(com))
        {
            com.flags = com.flags || [];
            if (!_.include(com.flags, 'flag')) { com.flags.push('flag'); }
        }

        ds._makeRequest({url: '/views/' + this.id + '/comments/' +
                commentId + '.json', type: 'PUT',
                data: JSON.stringify({ flags: [ 'flag' ] }),
                success: successCallback, error: errorCallback});
    },

    rateComment: function(commentId, thumbsUp, successCallback, errorCallback)
    {
        var ds = this;

        var com = _.detect(ds._comments || [],
            function(c) { return c.id == parseInt(commentId); });
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

        ds._makeRequest({url: '/views/' + ds.id + '/comments/' +
                commentId + '/ratings.json', params: {thumbsUp: thumbsUp},
                type: 'POST', success: successCallback, error: errorCallback});
    },

    getParentDataset: function(callback)
    {
        var ds = this;
        // Check related views, because this may not have a parent
        if ($.isBlank(ds._relatedViews))
        {
            ds._loadRelatedViews(function()
            { callback(ds._parent); });
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

    redirectTo: function()
    {
        window.location = this.url;
    },

    getSignature: function(successCallback, errorCallback)
    {
        // If not already signed, then we need to create it first
        this._makeRequest({url: '/views/' + this.id + '/signatures.json',
            type: (this.signed === true) ? 'GET' : 'POST',
            success: successCallback, error: errorCallback});
    },

    cleanCopy: function()
    {
        var ds = this._super();
        // If this is grouped, strip out all non-grouped/agged cols
        if (this.isGrouped())
        {
            ds.columns = _.select(ds.columns, function(c)
            {
                return !$.isBlank(c.format.grouping_aggregate) ||
                    _.any(ds.query.groupBys, function(g)
                        { return g.columnId == c.id; });
            });
        }
        return ds;
    },


    // Private methods

    _checkValidity: function()
    {
        return $.isBlank(this.message);
    },

    _clearTemporary: function()
    {
        if (this.temporary)
        {
            this.temporary = false;
            this.trigger('clear_temporary');
        }
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
        var oldGroupAggs = [];
        if ((oldGroupings || []).length > 0)
        {
            _.each(ds.realColumns, function(c)
            {
                if (!$.isBlank(c.format.grouping_aggregate))
                { oldGroupAggs.push(c.id); }
            });
        }

        var oldQuery = ds.query;
        var oldSearch = ds.searchString;
        var oldDispFmt = ds.displayFormat;

        if (forceFull)
        {
            // If we are updating the entire dataset, then clean out all the
            // valid keys; then the next lines will copy all the new ones over
            _.each(ds._validKeys, function(v, k)
            { if (k != 'columns') { delete ds[k]; } });
        }

        _.each(newDS, function(v, k)
        { if (k != 'columns' && ds._validKeys[k]) { ds[k] = v; } });

        ds.originalViewId = ds.id;

        ds.type = getType(ds);
        ds.styleClass = ds.type.capitalize();
        ds.displayName = getDisplayName(ds);

        ds.displayFormat = ds.displayFormat || {};

        if (_.isFunction(ds._convertLegacy)) { ds._convertLegacy(); }
        ds.url = ds._generateUrl();

        ds._updateGroupings(oldGroupings, oldGroupAggs);

        var oldValid = ds.valid;
        ds.valid = ds._checkValidity();
        if (!oldValid && ds.valid) { ds.trigger('valid'); }

        if (!$.isBlank(newDS.columns))
        { ds.updateColumns(newDS.columns, forceFull, updateColOrder); }

        // Update sorts on each column
        _.each(ds.realColumns, function(c)
                { delete c.sortAscending; });
        _.each((ds.query || {}).orderBys || [], function(ob)
        {
            var c = ds.columnForID(ob.expression.columnId);
            if (!$.isBlank(c)) { c.sortAscending = ob.ascending; }
        });

        if (!_.isEqual(oldQuery, ds.query) || oldSearch !== ds.searchString)
        {
            // Clear out the rows, since the data is different now
            ds._invalidateRows();
            if (oldSearch !== ds.searchString ||
                !_.isEqual(oldQuery.filterCondition, ds.query.filterCondition) ||
                !_.isEqual(oldQuery.groupBys, ds.query.groupBys))
            { ds._rowCountInvalid = true; }
            ds.trigger('query_change');
        }

        if (!_.isEqual(oldDispFmt, ds.displayFormat))
        {
            ds.trigger('displayformat_change');
        }

        if (masterUpdate)
        {
            ds._origQuery = $.extend(true, {}, ds.query);
            ds._origSearchString = ds.searchString;
        }
        else if (ds._origSearchString == ds.searchString &&
            _.isEqual(ds._origQuery, ds.query))
        { ds._clearTemporary(); }
    },

    _updateGroupings: function(oldGroupings, oldGroupAggs)
    {
        var ds = this;
        // Do we care if there was a grouping but now there isn't?
        if ($.isBlank((ds.query || {}).groupBys)) { return; }

        var newColOrder = [];
        _.each(ds.query.groupBys, function(g)
        {
            var col = ds.columnForID(g.columnId);

            if (!col.format.drill_down) { col.width += 30; }
            col.format.drill_down = true;

            if (col.hidden && !_.any(oldGroupings, function(og)
                { return og.columnId == col.id; }))
            { col.update({flags: _.without(col.flags, 'hidden')}); }

            newColOrder.push(col.id);
        });

        _(ds.realColumns).chain()
            .select(function(c)
                { return !$.isBlank(c.format.grouping_aggregate); })
            .each(function(c)
            {
                if (c.hidden && !_.include(oldGroupAggs, c.id))
                { c.update({flags: _.without(c.flags, 'hidden')}); }

                newColOrder.push(c.id);
            });

        _.each(ds.realColumns, function(c)
        {
            var i = _.indexOf(newColOrder, c.id);
            if (i < 0) { i = c.position + newColOrder.length; }
            c.position = i + 1;
            if (i < 0 && !c.hidden)
            {
                var f = c.flags || [];
                f.push('hidden');
                c.update({flags: f});
            }
        });

        ds.updateColumns();
    },

    _makeRequest: function(req)
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
        _.each(this.columns, function(c) { c.invalidateData(); });
        this.trigger('row_change', [invRows]);
    },

    _loadRows: function(start, len, callback, includeMeta, fullLoad)
    {
        var ds = this;
        var params = {method: 'getByIds', start: start, 'length': len};

        // If we're not loading the columns with the rows, then store a copy
        // of the columns so we know what order our data will come back in.
        // This is in case columns get changed while we're busy requesting data
        var cols;
        if (includeMeta || ds._rowCountInvalid) { params.meta = true; }
        else { cols = ds.columns.slice(); }

        var rowsLoaded = function(result)
        {
            var oldCount = ds.totalRows;
            if (!$.isBlank(result.meta))
            {
                ds.totalRows = result.meta.totalRows;
                delete ds._rowCountInvalid;
                ds._update(result.meta.view, true, true, fullLoad);
            }

            if (fullLoad) { ds._clearTemporary(); }

            var rows = ds._addRows(result.data.data || result.data, start, cols);

            // Mark all rows as loaded
            for (var i = 0; i < len; i++)
            { delete ds._rowsLoading[i + start]; }

            var pending = ds._pendingRowReqs;
            ds._pendingRowReqs = [];
            _.each(pending, function(p)
            { ds.getRows(p.start, p.length, p.callback); });

            if (oldCount !== ds.totalRows)
            { ds.trigger('row_count_change'); }

            if (_.isFunction(callback)) { callback(rows); }
        };

        // Keep track of rows that are being loaded
        for (var i = 0; i < len; i++)
        { ds._rowsLoading[i + start] = true; }

        var req = {success: rowsLoaded, params: params, inline: !fullLoad};
        if (fullLoad)
        {
            req.url = '/views/' + ds.id + '/rows.json';
            req.type = 'GET';
        }
        ds._makeRequest(req);
    },

    _addRows: function(newRows, start, columns)
    {
        var ds = this;
        var translateRow = function(r, cols, parCol)
        {
            var tr = {invalid: {}, changed: {}, error: {}};
            _.each(cols, function(c, i)
            {
                var val = r[i];
                if (c.isMeta && c.name == 'meta')
                { val = JSON.parse(val || 'null'); }

                if (c.renderType.isObject && _.isArray(val))
                {
                    // First, convert an empty array into a null
                    // Booleans in the array don't count because location type
                    // has a flag that may be set even if there is no data.  If
                    // some type actually cares about only having a boolean,
                    // this will need to be made more specific
                    if (_.all(val, function(v)
                        { return $.isBlank(v) || _.isBoolean(v); }))
                    { val = null; }

                    // Otherwise, turn it into object keyed by sub-type
                    else
                    {
                        var o = {};
                        _.each(val, function(v, k)
                        { o[c.subColumnTypes[k]] = v === '' ? null : v; });
                        val = o;
                    }
                }

                if (c.renderTypeName == 'checkbox' && val === false ||
                        c.renderTypeName == 'stars' && val === 0)
                { val = null; }

                if (c.dataTypeName == 'nested_table' && _.isArray(val))
                {
                    val = _.map(val, function(cr)
                    {
                        return translateRow(cr, c.childColumns, c);
                    });
                }

                tr[c.lookup] = val;
            });

            _.each((tr.meta || {}).invalidCells || {}, function(v, tcId)
            {
                if (!$.isBlank(v))
                {
                    var c = !$.isBlank(parCol) ? parCol.childColumnForTCID(tcId) :
                        ds.columnForTCID(tcId);
                    if (!$.isBlank(c))
                    {
                        tr.invalid[c.id] = true;
                        tr[c.lookup] = v;
                    }
                }
            });

            return tr;
        };

        var adjRows = [];
        _.each(newRows, function(nr, i)
        {
            var r = translateRow(nr, columns || ds.columns);
            r.index = start + i;
            ds._rows[r.index] = r;
            ds._rowIDLookup[r.id] = r;
            adjRows.push(r);
        });

        return adjRows;
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
                        if (!$.isBlank(c)) { req.row[c.lookup] = v; }
                        else { req.row[adjName] = v; }
                    }
                });

            if ($.isBlank(req.parentRow))
            {
                ds._rowIDLookup[req.row.id] = req.row;
                delete ds._rowIDLookup[oldID];
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

            _.each(!$.isBlank(req.parentColumn) ?
                req.parentColumn.realChildColumns : ds.realColumns, function(c)
            { delete req.row.changed[c.lookup]; });

            ds.trigger('row_change', [[{id: oldID}, req.parentRow || req.row]]);
            ds._processPending(req.row.id, (req.parentRow || {}).id,
                (req.parentColumn || {}).id);

            if (_.isFunction(req.success)) { req.success(req.row); }
        };

        var rowErrored = function(xhr)
        {
            _.each(!$.isBlank(req.parentColumn) ?
                req.parentColumn.realChildColumns : ds.realColumns, function(c)
                    { req.row.error[c.id] = true; });
            ds.trigger('row_change', [req.parentRow || req.row]);
            if (_.isFunction(req.error)) { req.error(xhr); }
        };

        // On complete, kick off any pending creates
        var rowCompleted = function()
        {
            if ((ds._pendingRowCreates || []).length > 0)
            {
                while (ds._pendingRowCreates.length > 0)
                { ds._serverCreateRow(ds._pendingRowCreates.shift(), true); }
                ds._sendBatch();
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
        ds._makeRequest({url: url,
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
            ds.trigger('row_change', [r.parentRow || r.row]);
            if (_.isFunction(r.success)) { r.success(r.row); }
        };

        // On error, mark as such and notify
        var rowErrored = function(xhr)
        {
            _.each(r.columnsSaving, function(cId)
                { r.row.error[cId] = true; });
            ds.trigger('row_change', [r.parentRow || r.row]);
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
        ds._makeRequest({url: url, type: 'PUT', data: JSON.stringify(r.rowData),
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
        var url = '/views/' + this.id + '/rows/';
        if (!$.isBlank(parRowId))
        { url += parRowId + '/columns/' + parColId + '/subrows/'; }
        url += rowId + '.json';
        this._makeRequest({batch: isBatch, url: url, type: 'DELETE'});
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
            ds._sendBatch();
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

    _generateUrl: function()
    {
        var ds = this;
        var base = '';

        // federated dataset has nonblank domain cname
        if (!$.isBlank(ds.domainCName))
        {
            var loc = document.location;
            base = loc.protocol + '//' + ds.domainCName;
            if (loc.port != 80) { base += ':' + loc.port; }
        }

        return base + "/" + $.urlSafe(ds.category || "dataset") +
               "/" + $.urlSafe(ds.name) +
               "/" + ds.id;
    },

    _loadRelatedViews: function(callback)
    {
        var ds = this;
        var processDS = function(views)
        {
            views = _.map(views, function(v) { return new Dataset(v); });

            var parDS = _.detect(views, function(v)
                    { return v.type == 'blist'; });
            if (!$.isBlank(parDS) && parDS.id != ds.id)
            {
                ds._parent = parDS;
                views = _.without(views, parDS);
            }

            ds._relatedViews = _.reject(views,
                function(v) { return v.id == ds.id; });

            if (_.isFunction(callback)) { callback(); }
        };

        this._makeRequest({url: '/views.json', pageCache: true, type: 'GET',
                data: { method: 'getByTableId', tableId: this.tableId },
                success: processDS});
    },

    _validKeys: {
        attribution: true,
        attributionLink: true,
        category: true,
        columns: true,
        description: true,
        displayFormat: true,
        displayType: true,
        flags: true,
        iconUrl: true,
        id: true,
        licenseId: true,
        metadata: true,
        name: true,
        originalViewId: true,
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
                cachedLinkedDatasetOptions[viewUid] = [];
                var cldo = cachedLinkedDatasetOptions[viewUid];

                var opt;
                var rdfSubject = linkedDataset && linkedDataset.metadata &&
                        linkedDataset.metadata.rdfSubject ?
                        linkedDataset.metadata.rdfSubject : undefined;

                _.each(linkedDataset.columns || [], function(c)
                {
                    switch (c.dataTypeName)
                    {
                        case 'text':
                            opt = {value: String(c.id), text: c.name};
                            if (useRdfKeyAsDefault && opt.value === rdfSubject)
                            {
                                opt.selected = true;
                            }
                        //TODO: support other datatype like url
                            cldo.push(opt);
                            break;
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

var VIZ_TYPES = ['chart', 'annotatedtimeline', 'imagesparkline',
    'areachart', 'barchart', 'columnchart', 'linechart', 'piechart'];
var MAP_TYPES = ['geomap', 'intensitymap'];

/* The type string is not always the simplest thing -- a lot of munging
 * goes on in Rails; we roughly duplicate it here */
function getType(ds)
{
    var type = ds.displayType || 'blist';

    if (ds.viewType == 'blobby') { type = 'blob'; }
    if (ds.viewType == 'href') { type = 'href'; }

    if (!$.isBlank(ds.query) && !$.isBlank(ds.query.groupBys) &&
        ds.query.groupBys.length > 0)
    { type = 'grouped'; }

    if (_.include(VIZ_TYPES, type)) { type = 'visualization'; }

    if (_.include(MAP_TYPES, type)) { type = 'map'; }

    if (type == 'blist' && !_.include(ds.flags || [], 'default'))
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
        case 'visualization':
            retType = 'chart';
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
    ds = ds.cleanCopy();

    if (!_.isUndefined(ds.metadata))
    { delete ds.metadata.facets; }

    return ds;
};

})();
