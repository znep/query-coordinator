(function(){

var RowSet = ServerModel.extend({
    _init: function(ds, query, parRS, initRows)
    {
        this._super();

        this._dataset = ds;

        this.registerEvent(['row_change', 'row_count_change', 'metadata_update']);

        this._rows = {};
        this._rowIDLookup = {};
        this._rowsLoading = {};
        this._pendingRowReqs = [];

        this._parent = parRS;
        this._query = query || {};
        this._translatedQuery =
            $.extend({}, this._query, { filterCondition: Dataset.translateFilterCondition(
                    this._query.filterCondition, this._dataset),
                groupBys: Dataset.translateGroupBys(this._query.groupBys, this._dataset,
                    this._query.groupFuncs ) });
        this._loadedCount = 0;
        this._isComplete = false;
        var fc = this._translatedQuery.filterCondition || {};
        this._matchesExpr = { where: blist.filter.matchesExpression(fc.where, this._dataset),
            having: blist.filter.matchesExpression(fc.having, this._dataset) };

        if (!_.isEmpty(initRows))
        {
            this._addRows(initRows.rows, initRows.start);
            if (!$.isBlank(initRows.total))
            { this._totalCount = initRows.total; }
        }

        this.formattingChanged();
    },

    getKey: function()
    {
        if ($.isBlank(this._key))
        { this._key = RowSet.getQueryKey(this._translatedQuery); }
        return this._key;
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
        var rs = this;
        if (!$.isBlank(rs.rowForID(id)))
        { successCallback(rs.rowForID(id).index); }
        else
        {
            var gotID = function(data) { successCallback(data[id]); };
            if (rs._dataset._useSODA2)
            {
                // FIXME: Doesn't work for SODA2
                successCallback(0);
            }
            else
            {
                rs.makeRequest({inline: true,
                    params: {method: 'getByIds', indexesOnly: true, ids: id},
                    success: gotID});
            }
        }
    },

    childRowForID: function(id, parRow, parCol)
    {
        // Someday an actual lookup for child rows might be good; but these
        // should be rare and small, so don't bother yet
        var cell = parRow.data[parCol.lookup];
        return _.detect(cell || {}, function(sr) { return sr.id == id; });
    },

    getTotalRows: function(successCallback, errorCallback)
    {
        var rs = this;
        if ($.isBlank(rs._totalCount))
        { rs.getRows(0, 1, successCallback, errorCallback); }
        else if (_.isFunction(successCallback))
        { successCallback(); }
    },

    totalRows: function()
    { return this._totalCount; },

    getRows: function(startOrIds, len, successCallback, errorCallback)
    {
        var rs = this;

        // If we aren't complete, but can grab data from our parent, pre-emptively do so
        // Also exclude client side filtering on the catalog dataset because its filtering is somewhat unusual.
        if (rs._dataset.resourceName !== "datasets" && !rs._isComplete && (rs._parent || {})._isComplete &&
                _.isEmpty(rs._translatedQuery.groupBys) && _.isEmpty(rs._parent._translatedQuery.groupBys))
        {
            var newRows = _.map(_.select(rs._parent._rows, function(r)
                    { return rs._doesBelong(r); }), function(r) { return $.extend({}, r); });
            rs._totalCount = newRows.length;

            var sortVals = _.map(newRows, function(r)
            {
                return { sorts: [r.id], row: r };
            });

            _.each((rs._translatedQuery.orderBys || []).slice().reverse(), function(ob)
            {
                var col = rs._dataset.columnForIdentifier(ob.expression.columnId);
                if ($.isBlank(col)) { return; }
                _.each(sortVals, function(sv)
                {
                    var v = sv.row.data[col.lookup];
                    if ($.isBlank(v))
                    { v = null; }
                    else
                    {
                        if (_.isFunction(col.renderType.matchValue))
                        { v = col.renderType.matchValue(v, col); }
                    }
                    sv.sorts.unshift(v);
                });
            });

            var sorts = (rs._translatedQuery.orderBys || []).slice();
            // Add fake sort for position
            sorts.push({ ascending: true });
            newRows = _.pluck(sortVals.sort(function(l, r)
            {
                var a = l.sorts;
                var b = r.sorts;
                var i = 0;
                while (i < a.length && a[i] == b[i])
                { i++; }
                return (i == a.length ? 0 : ((a[i] < b[i] ? -1 : 1) * (sorts[i].ascending ? 1 : -1)));
            }), 'row');
            rs._addRows(newRows, 0, true);
        }

        var ids;
        var start;
        if (_.isNumber(startOrIds) && _.isNumber(len))
        { start = startOrIds; }
        else if (_.isArray(startOrIds))
        { ids = startOrIds; }
        else
        {
            if (_.isFunction(errorCallback))
            { errorCallback({message: "Missing start and length or ids"}); }
            return;
        }

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
            if (loaded.length > 0 || rs._totalCount == 0)
            {
                if (_.isFunction(successCallback))
                { successCallback(loaded); }
                loaded = [];
            }
        };

        if (len && !$.isBlank(start))
        {
            while (start <= finish &&
                ($.isBlank(rs._totalCount) || start < rs._totalCount))
            {
                var r = rs._rows[start];
                // If this is an expired pending row, clean it out and mark
                // it null so it gets reloaded
                if (!$.isBlank(r) && r.pending && now > r.expires)
                {
                    delete rs._rows[r.index];
                    delete rs._rowIDLookup[r.id];
                    pendingRemoved.push(r);
                    r = null;
                }

                if ($.isBlank(r))
                {
                    doLoaded();
                    if (rs._rowsLoading[start])
                    {
                        if (!$.isBlank(curReq))
                        {
                            reqs.push(curReq);
                            curReq = null;
                        }

                        if ($.isBlank(pendReq))
                        {
                            pendReq = {start: start, length: 1,
                                successCallback: successCallback, errorCallback: errorCallback};
                        }
                        else
                        { pendReq.length++; }
                    }
                    else
                    {
                        if (!$.isBlank(pendReq))
                        {
                            rs._pendingRowReqs.push(pendReq);
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
                        rs._pendingRowReqs.push(pendReq);
                        pendReq = null;
                    }
                    loaded.push(r);
                }
                start++;
            }
        }
        else
        {
            ids = _.reject(ids || [], function(id)
            {
                var r = rs._rowIDLookup[id];
                if (r)
                { return loaded.push(r); }
            });
            for (var i = 0; i < ids.length; i += 100)
            { reqs.push({ ids: ids.slice(i, i + 100) }); }
        }

        doLoaded();

        if (pendingRemoved.length > 0)
        { rs.trigger('row_change', [pendingRemoved, true]); }

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
            rs._pendingRowReqs.push(pendReq);
            pendReq = null;
        }

        if (reqs.length > 0)
        {
            var loadAllRows = function()
            {
                // If we got here, and totalRows is still blank, bail, because something
                // has changed in the meantime and this load is just invalid
                if ($.isBlank(rs._totalCount))
                {
                    if (_.isFunction(errorCallback)) { errorCallback({cancelled: true}); }
                    return;
                }
                _.each(reqs, function(req)
                {
                    var reqLen;
                    if (req.finish && !$.isBlank(req.start))
                    {
                        if (req.start >= rs._totalCount) { return; }
                        if (req.finish >= rs._totalCount)
                        { req.finish = rs._totalCount - 1; }
                        reqLen = req.finish - req.start + 1;
                    }
                    rs._loadRows(req.ids || req.start, reqLen, successCallback, errorCallback);
                });
            };

            if ($.isBlank(rs._totalCount))
            {
                // Need to make init req to get all the meta
                var initReq = reqs.shift();
                var initReqLen;
                if (!$.isBlank(initReq.finish) && !$.isBlank(initReq.start))
                { initReqLen = initReq.finish - initReq.start + 1; }
                rs._loadRows(initReq.ids || initReq.start, initReqLen,
                    function(rows)
                    {
                        if (_.isFunction(successCallback)) { successCallback(rows); }
                        loadAllRows();
                    }, errorCallback, true);
            }
            else
            {
                // Just request rows
                loadAllRows();
            }
        }
    },

    getAllRows: function(successCallback, errorCallback)
    {
        var rs = this;
        rs.getTotalRows(function()
        {
            var loadedRows = 0;
            rs.getRows(0, rs._totalCount, function(rows)
            {
                loadedRows += rows.length;
                if (loadedRows >= rs._totalCount)
                {
                    rs.getRows(0, rs._totalCount, successCallback, errorCallback);
                }
            }, errorCallback);
        }, errorCallback);
    },

    loadedRows: function()
    {
        return this._rows;
    },

    addRow: function(newRow, idx)
    {
        if (!this._doesBelong(newRow)) { return; }

        var row = $.extend({}, newRow);
        row.index = $.isBlank(idx) ? this._totalCount : idx;
        this._setRowFormatting(row);
        $.addItemsToObject(this._rows, row, row.index);
        this._rowIDLookup[row.id] = row;
        delete this._aggCache;
        // Not going to change isComplete
        this._loadedCount++;
        this._totalCount++;
        this.trigger('row_count_change');
    },

    updateRow: function(row, oldID)
    {
        var curRow = this._rowIDLookup[$.isBlank(oldID) ? row.id : oldID];
        $.extend(curRow, row, {index: curRow.index});
        this._setRowFormatting(curRow);
        delete this._aggCache;
        if (!$.isBlank(oldID))
        {
            this._rowIDLookup[curRow.id] = curRow;
            delete this._rowIDLookup[oldID];
        }
        if (!this._doesBelong(curRow)) { this.removeRow(curRow); }
    },

    removeRow: function(origRow)
    {
        var row = this.rowForID(origRow.id);
        if ($.isBlank(row)) { return; }
        $.removeItemsFromObject(this._rows, row.index, 1);
        delete this._rowIDLookup[row.id];
        delete this._aggCache;
        // Not going to change isComplete
        this._loadedCount--;
        this._totalCount--;
    },

    markRow: function(markType, value, origRow)
    {
        var row = this.rowForID((origRow || {}).id);
        if ($.isBlank(row) || (row.sessionMeta || {})[markType] == value) { return; }

        row.sessionMeta = row.sessionMeta || {};
        row.sessionMeta[markType] = value;
    },

    reload: function(successCallback, errorCallback)
    {
        var rs = this;
        delete rs._totalCount;
        delete rs._rows;
        delete rs._rowIDLookup;
        delete rs._aggCache;
        rs._loadRows(0, 1, successCallback, errorCallback, true, true);
    },

    getAggregates: function(callback, customAggs)
    {
        var rs = this;

        var aggs = [];
        var callResults = function() { callback(aggs); };

        var gotAggs = function(recAggs)
        {
            rs._aggCache = rs._aggCache || {};
            _.each(recAggs, function(agg)
            {
                rs._aggCache[agg.columnIdent] = rs._aggCache[agg.columnIdent] || {};
                rs._aggCache[agg.columnIdent][agg.name] = agg.value;
                aggs.push(agg);
            });
        };

        rs._aggCache = rs._aggCache || {};

        var args = {params: {method: 'getAggregates'}, inline: true};
        var needReq = false;
        var soda2Aggs = [];
        if (!$.isBlank(customAggs))
        {
            var ilViews = [];
            _.each(customAggs, function(aggList, cId)
            {
                var curCol = rs._dataset.columnForIdentifier(cId);
                if ($.isBlank(curCol)) { return; }
                _.each($.makeArray(aggList), function(a, i)
                {
                    if ($.subKeyDefined(rs._aggCache, curCol.fieldName + '.' + a))
                    {
                        aggs.push({columnIdent: curCol.fieldName, name: a,
                            value: rs._aggCache[curCol.fieldName][a]});
                    }
                    else if (rs._isComplete)
                    {
                        gotAggs([{columnIdent: curCol.fieldName, name: a,
                            value: rs._calculateAggregate(curCol.fieldName, a)}]);
                    }

                    else
                    {
                        if (rs._dataset._useSODA2)
                        {
                            soda2Aggs.push({ method: blist.datatypes.soda2Aggregate(a),
                                             column: curCol.fieldName });
                        }
                        else
                        {
                            needReq = true;
                            if ($.isBlank(ilViews[i]))
                            { ilViews[i] = rs._dataset.cleanCopy(); }
                            var col = _.detect(ilViews[i].columns, function(c)
                            { return c.fieldName == curCol.fieldName; });
                            col.format.aggregate = a;
                        }
                    }
                });
            });

            if (!rs._dataset._useSODA2)
            {
                if (needReq)
                {
                    args.success = function(resAggs)
                    {
                        gotAggs(_.map(resAggs, function(ra)
                                { return { columnIdent: ra.fieldName, name: ra.name, value: ra.value }; }));
                    };
                    _.each(ilViews, function(v)
                    {
                        if ($.isBlank(v)) { return; }
                        var req = $.extend({}, args, {data: v, batch: true});
                        rs.makeRequest(req);
                    });
                    ServerModel.sendBatch(callResults);
                }
                else
                { callResults(); }
            }
        }
        else
        {
            var checkAgg = function(c)
            {
                if ($.subKeyDefined(c, 'format.aggregate'))
                {
                    if ($.subKeyDefined(rs._aggCache, c.fieldName + '.' + c.format.aggregate))
                    {
                        aggs.push({columnIdent: c.fieldName, name: c.format.aggregate,
                            value: rs._aggCache[c.fieldName][c.format.aggregate]});
                    }
                    else if (rs._isComplete)
                    {
                        gotAggs([{columnIdent: c.fieldName, name: c.format.aggregate,
                            value: rs._calculateAggregate(c.fieldName, c.format.aggregate)}]);
                    }
                    else if (rs._dataset._useSODA2)
                    {
                        soda2Aggs.push({ method: blist.datatypes.soda2Aggregate(c.format.aggregate),
                            column: c.fieldName });
                    }
                    else
                    { needReq = true; }
                }
            };

            _.each(rs._dataset.realColumns, function(c)
            {
                checkAgg(c);
                _.each(c.realChildColumns, function(cc) { checkAgg(cc); });
            });

            if (!rs._dataset._useSODA2)
            {
                if (needReq)
                {
                    aggs = [];
                    args.success = function(recAggs)
                    {
                        gotAggs(recAggs);
                        gotAggs(_.map(recAggs, function(ra)
                                { return { columnIdent: ra.fieldName, name: ra.name, value: ra.value }; }));
                        callResults();
                    };
                    rs.makeRequest(args);
                }
                else
                { callResults(); }
            }
        }

        if (soda2Aggs.length > 0)
        {
            var sel = _.map(soda2Aggs, function(a) { return a.method + '(' + a.column + ')'; }).join(',');
            rs.makeRequest({ params: { '$select': sel },
                success: function(resp)
                {
                    gotAggs(_.map(resp[0], function(v, k)
                    {
                        var i = k.indexOf('_');
                        return { columnIdent: k.slice(i+1),
                            name: blist.datatypes.aggregateFromSoda2(k.slice(0, i)), value: v };
                    }));
                    callResults();
                }
            });
        }
        else if (rs._dataset._useSODA2)
        { callResults(); }
    },

    activate: function()
    {
        var rs = this;
        rs._isActive = true;
        rs.trigger('row_change', [_.values(rs._rows), true]);
        _.defer(function() { rs.trigger('row_count_change'); });
    },

    deactivate: function()
    {
        this._isActive = false;
        var pending = this._pendingRowReqs;
        this._pendingRowReqs = [];
        // Tell pending requests they are being cancelled
        _.each(pending, function(p)
            { if (_.isFunction(p.errorCallback)) { p.errorCallback({cancelled: true}); } });
        delete this._curMetaReq;
        delete this._curMetaReqMeta;
        this.trigger('row_change', [_.values(this._rows), true]);
    },

    invalidate: function(rowCountChanged, columnsChanged)
    {
        var invRows = _.values(this._rows);
        this._rows = {};
        this._rowsLoading = {};
        var pending = this._pendingRowReqs;
        this._pendingRowReqs = [];
        // Tell pending requests they are being cancelled
        _.each(pending, function(p)
            { if (_.isFunction(p.errorCallback)) { p.errorCallback({cancelled: true}); } });
        delete this._curMetaReq;
        delete this._curMetaReqMeta;
        this._rowIDLookup = {};
        this._loadedCount = 0;
        this._isComplete = false;
        delete this._aggCache;
        if (rowCountChanged) { delete this._totalCount; }
        if (columnsChanged) { this._columnsInvalid = true; }
        _.each(this._dataset.columns || [], function(c) { c.invalidateData(); });
        this.trigger('row_change', [invRows, true]);
    },

    formattingChanged: function(condFmt)
    {
        var rs = this;
        var condFmt = condFmt || ($.subKeyDefined(rs, '_dataset.metadata.conditionalFormatting')
            && rs._dataset.metadata.conditionalFormatting);
        if (!_.isArray(condFmt))
        { rs._condFmt = null; }
        else
        {
            rs._condFmt = _.map(condFmt, function(c)
            {
                return $.extend({}, c,
                    { matches: blist.filter.matchesExpression(c.condition, rs._dataset) });
            });
        }
        _.each(rs._rows, function(r) { rs._setRowFormatting(r); });
    },

    canDerive: function(otherQ)
    {
        var fc = this._translatedQuery.filterCondition || {};
        var otherFC = Dataset.translateFilterCondition(otherQ.filterCondition, this._dataset) || {};
        return canDeriveExpr(fc.where, otherFC.where) && canDeriveExpr(fc.having, otherFC.having) &&
            _.isEqual(this._translatedQuery.groupBys,
                    Dataset.translateGroupBys(otherQ.groupBys, this._dataset, otherQ.groupFuncs));
    },

    makeRequest: function(args)
    {
        // Always get federated datasets cross-domain
        args.headers = $.extend(args.headers, {'X-Socrata-Federation': 'Honey Badger'});
        var rs = this;
        if (rs._dataset._useSODA2)
        {
            rs._makeSODA2Request(args);
        }
        else
        {
            if (args.inline)
            {
                var d;
                if (!$.isBlank(args.data))
                { d = _.isString(args.data) ? JSON.parse(args.data) : args.data; }
                else
                { d = rs._dataset.cleanCopy(); }
                if (!_.isEmpty(rs._query))
                {
                    d.query = d.query || {};
                    d.query.orderBys = rs._query.orderBys;
                    d.query.groupBys = rs._query.groupBys;
                    d.query.filterCondition = rs._query.filterCondition;
                }
                args.data = JSON.stringify(d);
            }
            rs._dataset.makeRequest(args);
        }
    },

    _makeSODA2Request: function(args)
    {
        var rs = this;
        if ($.isBlank(rs._dataset._queryBase))
        {
            rs._dataset.getQueryBase(function() { rs._makeSODA2Request(args); });
            return;
        }

        args.isSODA = true;
        args.url = args.url || '/api/id/' + rs._dataset._queryBase.id + '.json';
        args.params = args.params || {};
        args.params['$$version'] = '2.0';

        // Need to take the difference from queryBase, and adjust columns if necessary
        var adjSearchString = rs._dataset.searchString == rs._dataset._queryBase.searchString ?
            '' : rs._dataset.searchString;
        if (!$.isBlank(adjSearchString))
        { args.params['$q'] = adjSearchString; }

        if (!_.isEmpty(rs._query.orderBys))
        {
            // Just apply all orderBys, because they can safely be applied on top without harm
            args.params['$order'] = _.compact(_.map(rs._query.orderBys, function(ob)
            {
                var c = rs._dataset.columnForIdentifier(ob.expression.columnId);
                if ($.isBlank(c)) { return null; }
                var qbC = Dataset.translateColumnToQueryBase(c, rs._dataset);
                if ($.isBlank(qbC)) { return null; }
                return qbC.fieldName + (ob.ascending ? '' : ' desc');
            })).join(',');
            if ($.isBlank(args.params['$order']))
            { delete args.params['$order']; }
        }

        if (!_.isEmpty(rs._translatedQuery.filterCondition))
        {
            var baseFilter = Dataset.translateFilterCondition(rs._dataset._queryBase.cleanFilters(), rs._dataset._queryBase);
            // Can't apply a where on top of a group by
            if (_.isEmpty(rs._dataset._queryBase.query.groupBys))
            {
                var soqlWhere = blist.filter.generateSOQLWhere(
                        blist.filter.subtractQueries(Dataset.translateFilterColumnsToBase(
                                rs._translatedQuery.filterCondition.where, rs._dataset),
                            baseFilter.where), rs._dataset._queryBase);
                args.params['$where'] = !$.isBlank(args.params['$where']) ?
                    (args.params['$where'] + ' and ' + soqlWhere) : soqlWhere;
            }
            var soqlHaving = blist.filter.generateSOQLWhere(
                    blist.filter.subtractQueries(Dataset.translateFilterColumnsToBase(
                            rs._translatedQuery.filterCondition.having, rs._dataset),
                        baseFilter.having), rs._dataset._queryBase);
            args.params['$having'] = !$.isBlank(args.params['$having']) ?
                (args.params['$having'] + ' and ' + soqlHaving) : soqlHaving;
        }

        // If queryBase has any group bys, we can't add more
        if (!_.isEmpty(rs._translatedQuery.groupBys) && _.isEmpty(rs._dataset._queryBase.query.groupBys))
        {
            var soqlGroup = [];
            var groupSelect = [];
            _.each(rs._translatedQuery.groupBys, function(gb)
            {
                var qbCF = Dataset.translateColumnToQueryBase(gb.columnFieldName, rs._dataset);
                if ($.isBlank(qbCF)) { return; }
                if ($.isBlank(gb.groupFunction))
                {
                    soqlGroup.push(qbCF);
                    groupSelect.push(qbCF);
                }
                else
                {
                    var k = qbCF + '__' + gb.groupFunction;
                    soqlGroup.push(k);
                    groupSelect.push(gb.groupFunction + '(' + qbCF + ') as ' + k);
                }
            });
            soqlGroup = soqlGroup.join(',');
            args.params['$group'] = !$.isBlank(args.params['$group']) ?
                (args.params['$group'] + ',' + soqlGroup) : soqlGroup;
            groupSelect = groupSelect.concat(
                    _.compact(_.map(rs._dataset.realColumns, function(c)
                        {
                            if (!$.isBlank(c.format.grouping_aggregate))
                            {
                                var qbCF = Dataset.translateColumnToQueryBase(c.fieldName, rs._dataset);
                                if ($.isBlank(qbCF)) { return null; }
                                return blist.datatypes.soda2Aggregate(c.format.grouping_aggregate)
                                    + '(' + qbCF + ')';
                            }
                            return null;
                        }))).join(',');
            var sel = (args.params['$select'] || '').replace(/,\*/, '');
            args.params['$select'] = !$.isBlank(sel) ?
                (sel + ',count(:id),' + groupSelect) : groupSelect;
        }
        rs._dataset.makeRequest(args);
    },

    clone: function()
    {
        return new RowSet(this._dataset, this._query, this._parent);
    },


    _loadRows: function(startOrIds, len, successCallback, errorCallback, includeMeta, fullLoad)
    {
        var rs = this;

        var params = rs._dataset.newBackend ? { '$select': ':*,*' } :
            rs._dataset._useSODA2 ? { '$$exclude_system_fields': false } :
                { method: 'getByIds', asHashes: true };

        var start;
        if (_.isNumber(startOrIds) && _.isNumber(len))
        {
            start = startOrIds;
            $.extend(params, rs._dataset._useSODA2 ? { '$offset': start, '$limit': len } :
                    { start: start, length: len });
        }
        else if (_.isArray(startOrIds))
        {
            if (rs._dataset._useSODA2)
            { params['$where'] = 'any_of(:id,' + startOrIds.join(',') + ')'; }
            else
            { params.ids = startOrIds; }
        }
        else
        {
            if (_.isFunction(errorCallback))
            { errorCallback({message: "Missing start and length, or ids"}); }
            return;
        }

        var reqData = rs._dataset.cleanCopy();
        if (!_.isEmpty(rs._query))
        {
            reqData.query = reqData.query || {};
            reqData.query.orderBys = rs._query.orderBys;
            reqData.query.groupBys = rs._query.groupBys;
            reqData.query.filterCondition = rs._query.filterCondition;
        }

        if ((fullLoad || (includeMeta || $.isBlank(rs._totalCount) || rs._columnsInvalid) &&
            !_.isEqual(reqData, rs._curMetaReqMeta)) && !rs._dataset._useSODA2)
        { params.meta = true; }
        if ($.isBlank(rs._totalCount) && rs._dataset._useSODA2)
        { params['$$row_count'] = 'approximate'; } // really gives the exact count

        var reqId = _.uniqueId();
        var rowsLoaded = function(result, ___, xhr)
        {
            if (len && !$.isBlank(start))
            {
                // Mark all rows as not in-process
                for (var i = 0; i < len; i++)
                { delete rs._rowsLoading[i + start]; }
            }

            var oldCount = rs._totalCount;
            if (!$.isBlank(result.meta))
            {
                // If another meta request started while this was loading, then
                // skip this one, and only use the latest
                if (rs._curMetaReq != reqId)
                {
                    if (_.isFunction(errorCallback))
                    { _.defer(function() { errorCallback({cancelled: true}); }); }
                    return;
                }
                delete rs._curMetaReq;
                delete rs._curMetaReqMeta;
                rs._totalCount = result.meta.totalRows;
                delete rs._columnsInvalid;
                var metaToUpdate;
                if (rs._dataset._useSODA2)
                {
                    metaToUpdate = { columns: result.meta.view.columns };
                    // If we're grouped, then filter out fake columns
                    if (rs._dataset.isGrouped())
                    {
                        metaToUpdate.columns = _.reject(metaToUpdate.columns, function(c)
                        {
                            if ($.subKeyDefined(c, 'format.grouping_aggregate'))
                            { return true; }

                            // Is it a group function column?
                            var i = c.fieldName.indexOf('__');
                            var realC;
                            if (!$.isBlank(realC = rs._dataset.columnForFieldName(
                                        c.fieldName.slice(0, i))) &&
                                realC.format.group_function ==
                                    blist.datatypes.groupFunctionFromSoda2(c.fieldName.slice(i + 2)))
                            { return true; }
                            return false;
                        });
                    }
                }
                else
                { metaToUpdate = result.meta.view; }
                if (!fullLoad && !rs._dataset._useSODA2)
                {
                    // I would rather get rid of triggering a metadata_update
                    // all the time, since if this isn't a full load, I don't
                    // think any relevant metadata has changed. But various UI
                    // already depends on events triggered from a metadata
                    // update, so we're stuck with this for the moment.
                    // Mitigate race conditions by using the current version of
                    // data on the dataset for items that are known to cause
                    // problems
                    metaToUpdate.query.filterCondition = rs._dataset.query.filterCondition;
                    if (!$.isBlank(rs._dataset.query.namedFilters))
                    { metaToUpdate.query.namedFilters = rs._dataset.query.namedFilters; }
                    metaToUpdate.metadata = rs._dataset.metadata;
                }
                rs.trigger('metadata_update', [metaToUpdate, !rs._dataset._useSODA2,
                        !rs._dataset._useSODA2, fullLoad]);
            }
            // In SODA2 we get basic columns back in the header
            else if (rs._dataset._useSODA2)
            {
                var rowCount = JSON.parse(xhr.getResponseHeader('X-SODA2-Row-Count') || 'null');
                if (_.isNumber(rowCount))
                { rs._totalCount = rowCount; }

                var fields = JSON.parse(xhr.getResponseHeader('X-SODA2-Fields'));
                //var types = xhr.getResponseHeader('X-SODA2-Types');
                var newCols = _.map(fields, function(f)
                {
                    var c = rs._dataset.findColumnForServerName(f);
                    if ($.isBlank(c))
                    {
                        if (f.startsWith(':'))
                        {
                            // metadata column, add it
                            c = { id: -1, name: f.slice(1), fieldName: f,
                                dataTypeName: 'meta_data', renderTypeName: 'meta_data' };
                        }
                        else
                        {
                            // uh-oh, a column we don't know about
                            $.debug('!!!!!!!!!!!! Unknown column: ' + f);
                        }
                    }
                    return c;
                });
                rs.trigger('metadata_update', [ { columns: newCols } ]);
            }
            // If we loaded without meta but don't have meta available, bail
            else if ($.isBlank(rs._totalCount))
            {
                if (_.isFunction(errorCallback))
                { _.defer(function() { errorCallback({cancelled: true}); }); }
                return;
            }

            var rows;
            // If this result is marked pending, then we got no data, and we need
            // placeholder rows
            if (result.pending && len && !$.isBlank(start))
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
                    if (!$.isBlank(rs._rows[newRow.index]))
                    {
                        var oldRow = rs._rows[newRow.index];
                        oldRows.push(oldRow);
                        delete rs._rowIDLookup[oldRow.id];
                    }

                    rs._rows[newRow.index] = newRow;
                    rs._rowIDLookup[newRow.id] = newRow;
                    rows.push(newRow);
                }
                if (oldRows.length > 0)
                { rs.trigger('row_change', [oldRows, true]); }
            }
            // Normal load
            else
            { rows = rs._addRows(result.data || result, start); }

            if (oldCount !== rs._totalCount)
            { rs.trigger('row_count_change'); }

            if (!rs._isActive)
            {
                if (_.isFunction(errorCallback))
                { _.defer(function() { errorCallback({cancelled: true}); }); }
                return;
            }

            if (_.isFunction(successCallback)) { successCallback(rows); }

            var pending = rs._pendingRowReqs;
            rs._pendingRowReqs = [];
            _.each(pending, function(p)
            { rs.getRows(p.start, p.length, p.successCallback, p.errorCallback); });
        };

        if (len && !$.isBlank(start))
        {
            // Keep track of rows that are being loaded
            for (var i = 0; i < len; i++)
            { rs._rowsLoading[i + start] = true; }
        }

        var req = { success: rowsLoaded, params: params, inline: !rs._dataset._useSODA2 && !fullLoad,
            type: rs._dataset._useSODA2 || fullLoad ? 'GET' : 'POST' };
        if (!rs._dataset._useSODA2 && fullLoad)
        { req.url = '/views/' + rs._dataset.id + '/rows.json'; }
        if (params.meta)
        {
            rs._curMetaReq = reqId;
            rs._curMetaReqMeta = reqData;
        }

        rs.makeRequest(req);
    },

    _addRows: function(newRows, start, skipTranslate)
    {
        var rs = this;
        var adjRows = [];
        var oldRows = [];
        var hasIndex = !$.isBlank(start);
        _.each(newRows, function(r, i)
        {
            var newRow = skipTranslate ? r : RowSet.translateRow(r, rs._dataset, rs);
            var ind;
            if (hasIndex)
            { ind = start + i; }

            // If a row already exists at this index, clean it out
            if (hasIndex)
            {
                if (!$.isBlank(rs._rows[ind]) && ($.isBlank(newRow) || newRow.id != rs._rows[ind].id))
                {
                    var oldRow = rs._rows[ind];
                    oldRows.push(oldRow);
                    delete rs._rows[ind];
                    delete rs._rowIDLookup[oldRow.id];
                    rs._loadedCount--;
                }
            }
            else
            {
                var oldRow = rs._rowIDLookup[newRow.id];
                if (!$.isBlank(oldRow))
                {
                    oldRows.push(oldRow);
                    delete rs._rowIDLookup[oldRow.id];
                    rs._loadedCount--;
                }
            }

            if ($.isBlank(newRow)) { return; }

            if (hasIndex)
            {
                newRow.index = ind;
                rs._rows[newRow.index] = newRow;
            }
            rs._rowIDLookup[newRow.id] = newRow;
            rs._loadedCount++;
            adjRows.push(newRow);
        });

        rs._isComplete = rs._totalCount == rs._loadedCount;
        if (oldRows.length > 0)
        { rs.trigger('row_change', [oldRows, true]); }

        return adjRows;
    },

    _doesBelong: function(row)
    {
        // If is grouped, assume where matches, since that is processed pre-aggregate.
        // But always evaluate having
        return (this._dataset.isGrouped() ? true : this._matchesExpr.where(row)) &&
            this._matchesExpr.having(row);
    },

    _calculateAggregate: function(cId, aggName)
    {
        var rs = this;
        var col = rs._dataset.columnForIdentifier(cId);
        var parCol;
        // Might be a child column...
        if ($.isBlank(col))
        {
            // Look through each nested table, and find if it has a child
            // column -- find the first real one
            _.any(rs._dataset.columnsForType('nested_table', true), function(pc)
            {
                col = pc.childColumnForID(cId);
                if (!$.isBlank(col))
                {
                    parCol = pc;
                    return true;
                }
                return false;
            });
        }
        if ($.isBlank(col)) { return null; }

        var agg = _.detect(col.renderType.aggregates, function(a) { return a.value == aggName; });
        if ($.isBlank(agg)) { return null; }

        var valuesForRows = function(rows)
        {
            var processRows = function(memo, row, idx, list)
            {
                if (row.invalid[col.lookup] !== true)
                {
                                                             // If this is a nested table, recurse,
                    if (!$.isBlank(parCol) && list === rows) // but don't go more than one level.
                    {
                        _.reduce(row.data[parCol.lookup], processRows, memo);
                    }
                    else
                    {
                        memo.push(row.data[col.lookup]);
                    }
                }
                return memo;
            };

            return _.reduce(rows, processRows, []);
        };

        return agg.calculate(valuesForRows(rs._rows));
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
        //   * subColumn: Identifies a sub-column to check for a value
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

        var rs = this;

        // First clear color & icon, as they will be set properly later
        row.color = row.icon = null;

        if (!_.isArray(rs._condFmt)) { return null; }

        var relevantCondition = _.detect(rs._condFmt, function(c) { return c.matches(row); }) || {};

        if (relevantCondition.color)
        { row.color = relevantCondition.color; }

        if (relevantCondition.icon)
        { row.icon = relevantCondition.icon; }
    }
});

RowSet.translateRow = function(r, dataset, rowSet, parCol, skipMissingCols)
{
    var adjVals = { invalid: {}, changed: {}, error: {}, sessionMeta: {}, data: {}, metadata: {} };
    if (_.any(r, function(val, id)
    {
        var newVal = val;
        var c = dataset.findColumnForServerName(id, parCol);

        if ($.isBlank(c))
        { return !skipMissingCols; }

        if (c.isMeta && c.name == 'meta' && _.isString(newVal))
        { newVal = JSON.parse(newVal || 'null'); }

        if ($.isPlainObject(newVal))
        {
            // First, convert an empty array into a null
            // Booleans in the array don't count because location type
            // has a flag that may be set even if there is no data.  If
            // some type actually cares about only having a boolean,
            // this will need to be made more specific
            if (_.all(newVal, function(v) { return $.isBlank(v) || _.isBoolean(v); }))
            { newVal = null; }
        }

        if (dataset._useSODA2 && $.subKeyDefined(c, 'renderType.fromSoQLValue'))
        { newVal = c.renderType.fromSoQLValue(newVal, c); }

        if (c.renderTypeName == 'checkbox' && newVal === false ||
                c.renderTypeName == 'stars' && newVal === 0)
        { newVal = null; }

        if (c.renderTypeName == 'geospatial' && r[dataset._useSODA2 ? ':id' : 'sid'])
        { newVal = $.extend({}, newVal, {row_id: r[dataset._useSODA2 ? ':id' : 'sid']}); }

        if (c.dataTypeName == 'nested_table' && _.isArray(newVal))
        {
            newVal = _.map(newVal, function(cr) { return RowSet.translateRow(cr, dataset, rowSet, c); });
            if (_.any(newVal, function(cr) { return _.isNull(cr); }))
            { return true; }
        }

        if (!_.isUndefined(newVal))
        {
            adjVals.data[c.lookup] = newVal;
            if (c.isMeta)
            { adjVals.metadata[c.lookup.startsWith(':') ?  c.lookup.slice(1) : c.lookup] = newVal; }
        }

        return false;
    })) { return null; }

    adjVals.id = adjVals.metadata.id;

    _.each((adjVals.metadata.meta || {}).invalidCells || {}, function(v, cId)
    {
        if (!$.isBlank(v))
        {
            var c = !$.isBlank(parCol) ? parCol.childColumnForIdentifier(cId) :
                dataset.columnForIdentifier(cId);
            if (!$.isBlank(c) && $.isBlank(adjVals.data[c.lookup]))
            {
                adjVals.invalid[c.lookup] = true;
                adjVals.data[c.lookup] = v;
            }
        }
    });
    delete (adjVals.metadata.meta || {}).invalidCells;

    _.each((dataset._commentLocations || {})[adjVals.id] || {}, function(v, tcId)
    {
        var c = dataset.columnForTCID(tcId);
        if (!$.isBlank(c))
        {
            adjVals.annotations = adjVals.annotations || {};
            adjVals.annotations[c.lookup] =  'comments';
        }
    });

    if (!$.isBlank(rowSet))
    {
        rowSet._setRowFormatting(adjVals);

        if ($.subKeyDefined(dataset, 'highlights.' + adjVals.id))
        { rowSet.markRow('highlight', true, adjVals); }
    }

    return adjVals;
};

RowSet.getQueryKey = function(query)
{
    return getSortKey(query.orderBys) + '/' + getGroupKey(query.groupBys) +
        '/' + blist.filter.getFilterKey((query.filterCondition || {}).where) +
        '/' + blist.filter.getFilterKey((query.filterCondition || {}).having);
};

function getSortKey(ob)
{
    if (_.isEmpty(ob)) { return ''; }
    return '(' + _.map(ob, function(o)
                { return o.expression.columnId + ':' + o.ascending; }).join('|') + ')';
};

function getGroupKey(gb)
{
    if (_.isEmpty(gb)) { return ''; }
    return '(' + _.map(gb, function(g)
                { return g.columnFieldName + ': ' + g.groupFunction; }).join('|') + ')';
};

function canDeriveExpr(baseFC, otherFC)
{
    if (_.isEmpty(baseFC)) { return true; }
    if (_.isEmpty(otherFC)) { return false; }

    // Find all leaves in both, and try to match them up on:
    // value, columnFieldName, tableColumnId, operator, subColumn (actually by key)
    var curLeaves = [];
    var processLeaves = function(expr)
    {
        if (_.isArray(expr.children))
        { _.each(expr.children, processLeaves); }
        else
        {
            if ($.isBlank(expr._key)) { expr._key = blist.filter.getFilterKey(expr); }
            curLeaves.push(expr);
        }
    };
    processLeaves(baseFC);

    var leftoverLeaves = [];
    var parDeriveCache = {};
    var processOther = function(expr)
    {
        if (_.isArray(expr.children))
        {
            var leftoverChildren = _.select(expr.children, processOther);
            // If all children are added, then just add this expr, not each child
            if (leftoverChildren.length == expr.children.length)
            { return true; }
            else if (leftoverChildren.length > 0)
            {
                leftoverLeaves = leftoverLeaves.concat(leftoverChildren);
                return false;
            }
            // If all children matched, then check parents
        }

        if ($.isBlank(expr._key)) { expr._key = blist.filter.getFilterKey(expr); }
        var matchExpr;
        curLeaves = _.reject(curLeaves, function(cl)
        {
            // If we found a matching leaf, make sure the parents of each have
            // the proper relationship
            if (cl._key == expr._key)
            {
                var parMatch = cl._parent == baseFC && expr._parent == otherFC &&
                        baseFC.operator == otherFC.operator ||
                    $.isBlank(cl._parent) && $.isBlank(expr._parent) ||
                    $.isBlank(cl._parent) && expr._parent.operator.toLowerCase() == 'and' ||
                    $.isBlank(expr._parent) && cl._parent.operator.toLowerCase() == 'or';
                var k;
                if (!parMatch)
                {
                    if ($.isBlank(cl._parent) || $.isBlank(expr._parent) ||
                        cl._parent.operator != expr._parent.operator)
                    { return false; }
                    if ($.isBlank(cl._parent._key))
                    { cl._parent._key = blist.filter.getFilterKey(cl._parent); }
                    if ($.isBlank(expr._parent._key))
                    { expr._parent._key = blist.filter.getFilterKey(expr._parent); }
                    k = cl._parent._key + '::' + expr._parent._key;
                    if ($.isBlank(parDeriveCache[k]))
                    { parDeriveCache[k] = canDeriveExpr(cl._parent, expr._parent); }
                }
                if (parMatch || parDeriveCache[k])
                {
                    matchExpr = cl;
                    return true;
                }
            }
            return false;
        });
        return $.isBlank(matchExpr);
    };
    // If none of the leaves in otherQ matched, filter condition is completely different
    if (processOther(otherFC)) { return false; }

    // Reduce each set to highest common expr that completely changed
    // Combine removed items into higher-level ops if possible
    var reduceNodes = function(nodes)
    {
        var result = [];
        var madeChange = false;
        while (nodes.length > 0)
        {
            var n = nodes[0];
            if ($.isBlank(n._parent))
            {
                result.push(nodes.shift());
                continue;
            }
            var p = n._parent;
            var found = [];
            nodes = _.reject(nodes, function(nn)
            {
                if (nn._parent == p)
                {
                    found.push(nn);
                    return true;
                }
                return false;
            });
            if (found.length == p.children.length)
            {
                result.push(p);
                madeChange = true;
            }
            else
            { result = result.concat(found); }
        }
        return madeChange ? reduceNodes(result) : result;
    };
    curLeaves = reduceNodes(curLeaves);

    // Added operator under AND, removed under OR are good
    return _.all(curLeaves, function(cl)
            { return !$.isBlank(cl._parent) && cl._parent.operator.toLowerCase() == 'or'; }) &&
        _.all(leftoverLeaves, function(ll)
            { return $.isBlank(ll._parent) || ll._parent.operator.toLowerCase() == 'and'; });
};

if (blist.inBrowser)
{ this.RowSet = RowSet; }
else
{ module.exports = RowSet; }

})();
