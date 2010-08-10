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
            'set_temporary', 'clear_temporary']);

        $.extend(this, v);

        this.type = getType(this);
        this.styleClass = this.type.capitalize();
        this.displayName = getDisplayName(this);

        this.displayFormat = this.displayFormat || {};

        this.originalViewId = this.id;

        Dataset.addProperties(this, Dataset.modules[this.type] || {},
            Dataset.prototype);

        this._updateColumns();

        if (_.isFunction(this._convertLegacy)) { this._convertLegacy(); }

        this.temporary = false;
        this.valid = this._checkValidity();
        this.url = this._generateUrl();

        this._rows = {};
        this._rowIDLookup = {};

        this._aggregatesStale = true;
    },

    columnForID: function(id)
    {
        return this._columnIDLookup[parseInt(id)];
    },

    columnForTCID: function(tcId)
    {
        return this._columnTCIDLookup[parseInt(tcId)];
    },

    columnsForType: function(type, includeHidden)
    {
        var cols = includeHidden ? this.realColumns : this.visibleColumns;
        if (!$.isBlank(type))
        {
            cols = _.select(cols, function(c)
                { return _.include($.makeArray(type), c.renderTypeName); });
        }
        return cols;
    },

    setVisibleColumns: function(visColIds, callback)
    {
        var ds = this;

        if (!ds.hasRight('update_view'))
        { throw 'No permissions to update columns'; }

        var vizCols = [];
        _.each(visColIds, function(colId)
        {
            var col = ds.columnForID(colId);
            if (!$.isBlank(col))
            {
                col.show(null, null, true);
                vizCols.push({id: col.id, name: col.name});
            }
        });

        this._makeRequest({url: '/views/' + ds.id + '.json', type: 'PUT',
            data: JSON.stringify({columns: vizCols}), batch: true});

        ds._sendBatch(function()
        {
            ds._reload();
            if (_.isFunction(callback)) { callback(); }
        });
    },

    rowForID: function(id)
    {
        return this._rowIDLookup[parseInt(id)];
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

    save: function(successCallback, errorCallback)
    {
        var ds = this;
        if (!ds.hasRight('update_view')) { return false; }

        var dsSaved = function(newDS)
        {
            ds._update(newDS, true);
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

    update: function(newDS)
    {
        this._update(newDS);
        this.temporary = true;
        this.trigger('set_temporary');
    },

    reload: function()
    {
        var ds = this;
        ds._invalidateRows();
        ds._loadRows(0, 1, null, true, true);
    },

    cleanCopy: function()
    {
        var ds = this._super();
        ds.columns = _.reject(ds.columns, function(c) { return c.id == -1; });
        return ds;
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

    addColumn: function(column, successCallback, errorCallback, customParams)
    {
        if (!$.isBlank((column || {}).parentId))
        {
            var par = this.columnForID(column.parentId);
            if ($.isBlank(par))
            { throw 'Column ' + column.parentId + ' not found'; }
            par.addColumn(column, successCallback, errorCallback);
            return;
        }

        var ds = this;
        var columnAdded = function(newCol)
        {
            ds.columns.push(newCol);
            ds._updateColumns();
            if (_.isFunction(successCallback))
            { successCallback(ds.columnForID(newCol.id)); }
        };

        var req = {url: '/views/' + this.id + '/columns.json', type: 'POST',
                success: columnAdded, error: errorCallback};

        if (!$.isBlank(column))
        { req.data = JSON.stringify(new Column(column).cleanCopy()); }

        if (!$.isBlank(customParams))
        { req.params = customParams; }

        this._makeRequest(req);
    },

    // Callback may be called multiple times with smaller batches of rows
    getRows: function(start, len, callback)
    {
        var view = this;

        var pageSize = 100;
        var reqs = [];
        var curReq;
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
            ($.isBlank(view.totalRows) || start < view.totalRows))
        {
            var r = view._rows[start];
            if ($.isBlank(r))
            {
                doLoaded();
                if ($.isBlank(curReq)) { curReq = {start: start, finish: start}; }
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
            else
            {
                if (!$.isBlank(curReq))
                {
                    reqs.push(curReq);
                    curReq = null;
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
                    if (req.start >= view.totalRows) { return false; }
                    if (req.finish >= view.totalRows)
                    { req.finish = view.totalRows - 1; }
                    view._loadRows(req.start, req.finish - req.start + 1, callback);
                });
            };

            if ($.isBlank(view.totalRows))
            {
                // Need to make init req to get all the meta
                var initReq = reqs.shift();
                view._loadRows(initReq.start, initReq.finish - initReq.start + 1,
                    function(rows)
                    {
                        callback(rows);
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

    setRowValue: function(value, rowId, columnId)
    {
        var row = this.rowForID(rowId);
        if ($.isBlank(row)) { throw 'Row ' + rowId + ' not found'; }
        var col = this.columnForID(columnId)
        if ($.isBlank(col)) { throw 'Column ' + columnId + ' not found'; }
        row[col._lookup] = value;
    },

    saveRow: function(rowId, successCallback, errorCallback)
    {
        var ds = this;

        var row = this.rowForID(rowId);
        if ($.isBlank(row)) { throw 'Row ' + rowId + ' not found'; }

        var sendRow = $.extend(true, {}, row);
        if (!$.isBlank(sendRow.tags))
        {
            sendRow._tags = sendRow.tags;
            delete sendRow.tags;
        }
        if (!$.isBlank(sendRow.meta))
        { sendRow.meta = JSON.stringify(sendRow.meta); }

        ds._makeRequest({url: '/views/' + ds.id + '/rows/' + sendRow.id + '.json',
            type: 'PUT', data: JSON.stringify(sendRow),
            success: successCallback, error: errorCallback});
        ds._aggregatesStale = true;
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


    // Private methods

    _checkValidity: function()
    {
        return $.isBlank(this.message);
    },

    _clearTemporary: function()
    {
        this.temporary = false;
        this.trigger('clear_temporary');
    },

    _update: function(newDS, forceFull, updateColOrder)
    {
        var ds = this;

        // Back-update the ID, because we don't want the new temporary one
        newDS.id = ds.id;

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

        if (forceFull)
        {
            // If we are updating the entire dataset, then clean out all the
            // valid keys; then the next lines will copy all the new ones over
            _.each(ds._validKeys, function(v, k)
            { if (k != 'columns') { delete ds[k]; } });
        }

        if (!$.isBlank(newDS.columns))
        { ds._updateColumns(newDS.columns, forceFull, updateColOrder); }
        delete newDS.columns;

        _.each(newDS, function(v, k) { if (ds._validKeys[k]) { ds[k] = v; } });

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

        if (!_.isEqual(oldQuery, ds.query))
        {
            // Clear out the rows, since the data is different now
            ds._rows = {};
            ds._rowIDLookup = {};
            ds.trigger('query_change');
        }
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

        ds._updateColumns();
    },

    _updateColumns: function(newCols, forceFull, updateOrder)
    {
        var ds = this;

        if (!$.isBlank(newCols))
        {
            ds.columns = ds.columns || [];
            _.each(newCols, function(nc, i)
            {
                // Columns may or may not be in the list already; they may
                // also be at the wrong spot.  So find the column and index
                // if it already exists
                var c = nc.dataTypeName != 'meta_data' ? ds.columnForID(nc.id) :
                    _.detect(ds.columns, function(mc)
                        { return mc.dataTypeName == 'meta_data' &&
                            mc.name == nc.name; });
                var ci = _.indexOf(ds.columns, c);

                // If it is new, just splice it in
                if ($.isBlank(c))
                {
                    if (updateOrder) { ds.columns.splice(i, 0, nc); }
                    else { ds.columns.push(nc); }
                }
                else
                {
                    // If the column existed but not at this index, remove it from
                    // the old spot and put it in the new one
                    if (updateOrder && ci != i)
                    {
                        ds.columns.splice(ci, 1);
                        ds.columns.splice(i, 0, c);
                    }
                    // Update the column object in-place
                    c.update(nc, forceFull);
                }
            });
        }

        this._columnIDLookup = {};
        this._columnTCIDLookup = {};
        this.columns = _.map(this.columns, function(c, i)
            {
                if (!(c instanceof Column))
                { c = new Column(c, ds); }
                c.dataIndex = i;
                ds._columnIDLookup[c.id] = c;
                ds._columnTCIDLookup[c.tableColumnId] = c;
                return c;
            });
        this.realColumns = _.reject(this.columns, function(c) { return c.isMeta; });
        this.visibleColumns = _(this.realColumns).chain()
            .reject(function(c) { return c.hidden; })
            .sortBy(function(c) { return c.position; })
            .value();

        this.trigger('columns_changed');
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
        this._rows = {};
        this._rowIDLookup = {};
    },

    _loadRows: function(start, len, callback, includeMeta, fullLoad)
    {
        var ds = this;
        var params = {method: 'getByIds', start: start, 'length': len};
        if (includeMeta) { params.meta = true; }

        var rowsLoaded = function(result)
        {
            if (!$.isBlank(result.meta))
            {
                ds.totalRows = result.meta.totalRows;
                ds._update(result.meta.view, true, true);
            }

            if (fullLoad) { ds._clearTemporary(); }

            var rows = ds._addRows(result.data.data || result.data, start);

            if (_.isFunction(callback)) { callback(rows); }
        };

        var req = {success: rowsLoaded, params: params, inline: !fullLoad};
        if (fullLoad)
        {
            req.url = '/views/' + ds.id + '/rows.json';
            req.type = 'GET';
        }
        ds._makeRequest(req);
    },

    _addRows: function(newRows, start)
    {
        var view = this;
        var translateRow = function(r)
        {
            var tr = {};
            _.each(view.columns, function(c)
            {
                var val = r[c.dataIndex];
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

                tr[c._lookup] = val;
            });
            return tr;
        };

        var adjRows = [];
        _.each(newRows, function(nr, i)
        {
            var r = translateRow(nr);
            r.index = start + i;
            view._rows[r.index] = r;
            view._rowIDLookup[r.id] = r;
            adjRows.push(r);
        });

        return adjRows;
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
