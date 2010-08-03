(function(){

this.Dataset = Model.extend({
    _init: function (v)
    {
        this._super();

        $.extend(this, v);

        this.origDisplayType = this.displayType;

        this.displayType = getDisplayType(this);
        this.displayClass = this.displayType.capitalize();
        this.displayName = getDisplayName(this);

        this.displayFormat = this.displayFormat || {};

        this.originalViewId = this.id;

        Dataset.addProperties(this, Dataset.modules[this.displayType] || {},
            Dataset.prototype);

        this._updateColumns();

        if (_.isFunction(this._convertLegacy)) { this._convertLegacy(); }

        this.valid = this._checkValidity();
        this.url = this._generateUrl();

        this._rows = {};
        this._rowIDLookup = {};

        this._aggregatesStale = true;

        this.registerEvent(['start_request', 'finish_request']);
    },

    columnForID: function(id)
    {
        return this._columnIDLookup[parseInt(id)];
    },

    columnForTCID: function(tcId)
    {
        return this._columnTCIDLookup[parseInt(tcId)];
    },

    rowForID: function(id)
    {
        return this._rowIDLookup[parseInt(id)];
    },

    isPublic: function()
    {
        return _.any(this.grants || [], function(grant)
        { return _.include(grant.flags || [], 'public'); });
    },

    hasRight: function(right)
    {
        return _.include(this.rights, right);
    },

    save: function(successCallback, errorCallback)
    {
        this._makeRequest({url: '/views/' + this.id + '.json',
            type: 'PUT', data: JSON.stringify(cleanViewForSave(this)),
            error: errorCallback,
            success: successCallback
        });
    },

    saveNew: function(successCallback, errorCallback)
    {
        this._makeRequest({url: '/views.json', type: 'POST',
            data: JSON.stringify(cleanViewForSave(this)),
            error: errorCallback,
            success: successCallback
        });
    },

    update: function(newDS)
    {
        var ds = this;
        if (!$.isBlank(newDS.columns)) { ds._updateColumns(newDS.columns); }
        delete newDS.columns;

        if (!$.isBlank(newDS.displayFormat))
        {
            ds.displayFormat = newDS.displayFormat;
            if (_.isFunction(ds._convertLegacy)) { ds._convertLegacy(); }

            ds.valid = ds._checkValidity();
        }
        delete newDS.displayFormat;

        // TODO: update other data
    },

    cleanCopy: function()
    {
        return cleanViewForPost(this);
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
            var args = {success: aggResult};
            var params = {method: 'getAggregates'};

            if (!$.isBlank(customAggs))
            {
                var ilViews = [];
                _.each(customAggs, function(aggList, cId)
                {
                    _.each(aggList, function(a, i)
                    {
                        if ($.isBlank(ilViews[i]))
                        { ilViews[i] = cleanViewForPost(ds); }
                        var col = _.detect(ilViews[i].columns, function(c)
                        { return c.id == parseInt(cId); });
                        col.format.aggregate = a;
                    });
                });
                _.each(ilViews, function(v)
                {
                    args = $.extend({}, args, {data: JSON.stringify(v)});
                    ds._makeRequest(args, true, params, true);
                });
                ds._sendBatch(callback);
            }
            else { ds._makeRequest(args, true, params); }
        }
        else
        { callback(); }
    },

    remove: function(successCallback, errorCallback)
    {
        this._makeRequest({url: '/datasets/' + this.id + '.json',
            type: 'DELETE',
            success: successCallback, error: errorCallback});
    },

    registerOpening: function()
    {
        this._makeRequest({url: '/views/' + this.id + '.json?method=opening'});
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

    _updateColumns: function(newCols)
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
                if ($.isBlank(c)) { ds.columns.splice(i, 0, nc); }
                else
                {
                    // If the column existed but not at this index, remove it from
                    // the old spot and put it in the new one
                    if (ci != i)
                    {
                        ds.columns.splice(ci, 1);
                        ds.columns.splice(i, 0, c);
                    }
                    // Update the column object in-place
                    c._update(nc);
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
    },

    _makeRequest: function(req, isInline, inlineParams, isBatch, cacheGet)
    {
        var view = this;
        var finishCallback = function(callback)
        {
            return function()
            {
                view.trigger('finish_request');
                if (_.isFunction(callback)) { callback.apply(this, arguments); }
            };
        };

        this.trigger('start_request');
        $.extend(req, {contentType: 'application/json', dataType: 'json',
                error: finishCallback(req.error),
                success: finishCallback(req.success)});
        if (isInline)
        {
            req.url = '/views/INLINE/rows.json?' + $.param(inlineParams || {});
            req.type = 'POST';
            req.data = req.data || JSON.stringify(cleanViewForPost(this));
        }
        if (req.type == 'GET') { req.cache = false; }

        if (cacheGet) { $.Tache.Get(req); }
        else if (isBatch) { $.socrataServer.addRequest(req); }
        else { $.ajax(req); }
    },

    _sendBatch: function(successCallback)
    {
        $.socrataServer.runRequests({success: successCallback});
    },

    _loadRows: function(start, len, callback, includeMeta)
    {
        var view = this;
        var ilParams = {method: 'getByIds', start: start, 'length': len};
        if (includeMeta) { ilParams.meta = true; }

        var rowsLoaded = function(result)
        {
            if (!$.isBlank(result.meta))
            {
                view.totalRows = result.meta.totalRows;
                view._updateColumns(result.meta.view.columns);
            }

            var rows = view._addRows(result.data.data || result.data, start);

            if (_.isFunction(callback)) { callback(rows); }
        };

        view._makeRequest({success: rowsLoaded}, true, ilParams);
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
                    { return v.displayType == 'blist'; });
            if (!$.isBlank(parDS) && parDS.id != ds.id)
            {
                ds._parent = parDS;
                views = _.without(views, parDS);
            }

            ds._relatedViews = views;

            if (_.isFunction(callback)) { callback(); }
        };

        this._makeRequest({url: '/views.json',
                data: { method: 'getByTableId', tableId: this.tableId },
                success: processDS}, false, null, false, true);
    }
});

Dataset.modules = {};

var VIZ_TYPES = ['chart', 'annotatedtimeline', 'imagesparkline',
    'areachart', 'barchart', 'columnchart', 'linechart', 'piechart'];
var MAP_TYPES = ['geomap', 'intensitymap'];

/* The display type string is not always the simplest thing -- a lot of munging
 * goes on in Rails; we roughly duplicate it here */
function getDisplayType(ds)
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
    var retType = ds.displayType;

    switch (ds.displayType)
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

function cleanViewForPost(ds)
{
    var cleanCopy = function(val)
    {
        var obj = {};
        _.each(val, function(v, k)
                {
                    if (!_.isFunction(v) && !k.startsWith('_'))
                    {
                        if (_.isArray(v))
                        { obj[k] = v.slice(); }
                        else if ($.isPlainObject(v))
                        { obj[k] = $.extend(true, {}, v); }
                        else if (v instanceof Class)
                        { obj[k] = cleanCopy(v); }
                        else
                        { obj[k] = v; }
                    }
                });
        return obj;
    };

    ds = cleanCopy(ds);

    ds.columns = ds.realColumns;
    var cleanColumn = function(col)
    {
        col = cleanCopy(col);
        delete col.options;
        delete col.dropDown;
        delete col.hidden;
        delete col.dataIndex;
        delete col.dataType;
        delete col.renderType;
        delete col.renderTypeName;
        delete col.dataTypeName;
        delete col.isMeta;
        delete col.aggregates;
        delete col.view;
        delete col.parentColumn;
        delete col.realChildren;
        delete col.visibleChildren;
        return col;
    };

    // Clean out dataIndexes, and clean out child metadata columns
    ds.columns = _.map(ds.columns, function(c)
    {
        c = cleanColumn(c);
        if (!$.isBlank(c.childColumns))
        {
            c.childColumns = _.map(c.childColumns,
                function(cc) { return cleanColumn(cc); });
        }
        return c;
    });

    if (!$.isBlank((ds.query || {}).groupBys))
    {
        ds.columns = _.reject(ds.columns, function(c)
        {
            return $.isBlank((c.format || {}).grouping_aggregate) &&
                !_.any(ds.query.groupBys, function(g)
                { return g.columnId == c.id; });
        });
    }

    delete ds.visibleColumns;
    delete ds.realColumns;

    delete ds.origDisplayType;
    delete ds.displayClass;
    delete ds.displayName;
    delete ds.valid;
    delete ds.url;
    delete ds.totalRows;
    delete ds.grants;
    return ds;
};

function cleanViewForSave(ds)
{
    ds = cleanViewForPost(ds);

    if (!_.isUndefined(ds.metadata))
    { delete ds.metadata.facets; }

    return ds;
};

})();
