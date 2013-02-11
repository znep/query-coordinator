;(function($) {
    $.dataContext = new (Model.extend({
        availableContexts: {},
        _contextsQueue: {},
        _preLoadQueue: {},
        _existingContexts: {},

        _init: function() {
            this._super();

            // Note that unavailable isn't used yet as you cannot delete datasets
            this.registerEvent([ 'available', 'unavailable', 'error' ]);
        },

        load: function(configHash, existingContexts)
        {
            var dc = this;
            if (_.isObject(existingContexts))
            { $.extend(dc._existingContexts, existingContexts); }
            // Initially set up preLoadQueue for each item
            _.each(configHash, function(c, id) { dc._preLoadQueue[id] = dc._preLoadQueue[id] || []; });
            _.each(configHash, function(c, id) { dc.loadContext(id, c); });
        },

        loadContext: function(id, config, successCallback, errorCallback)
        {
            var dc = this;
            if (!$.isBlank(dc.availableContexts[id]))
            {
                if (_.isFunction(successCallback)) { successCallback(dc.availableContexts[id]); }
                return;
            }

            if (!$.isBlank(dc._contextsQueue[id]))
            {
                dc._contextsQueue[id].push({success: successCallback, error: errorCallback});
                return;
            }

            var doneLoading = function(newContext)
            {
                _.each(dc._contextsQueue[newContext.id], function(f)
                    { if (_.isFunction(f.success)) { f.success(dc.availableContexts[newContext.id]); } });
                delete dc._contextsQueue[newContext.id];
                if (_.isFunction(successCallback)) { successCallback(dc.availableContexts[newContext.id]); }
                $.dataContext.trigger('available', [ newContext ]);
            };
            var errorLoading = function(id)
            {
                _.each(dc._contextsQueue[id], function(f) { if (_.isFunction(f.error)) { f.error(); } });
                delete dc._contextsQueue[id];
                if (_.isFunction(errorCallback)) { errorCallback(); }
                $.dataContext.trigger('error', [ id ]);
            };

            dc._contextsQueue[id] = dc._preLoadQueue[id] || [];
            delete dc._preLoadQueue[id];
            config = $.stringSubstitute(config, $.component.rootPropertyResolver);

            // If we have an existing item that has all the context data, then short-circuit
            // and do the bit of updating required to use the context
            if (dc._existingContexts.hasOwnProperty(id) && dc._existingContexts[id].type == config.type)
            {
                var curC = addContext(dc, id, config, dc._existingContexts[id]);
                if (!$.isBlank(curC.dataset) && !(curC.dataset instanceof Dataset))
                {
                    curC.dataset = new Dataset(curC.dataset);
                    curC.dataset.isAnonymous(!blist.configuration.privateData);
                }

                if (!_.isEmpty(curC.datasetList))
                {
                    curC.datasetList = _.map(curC.datasetList, function(dl)
                    {
                        var ds = new Dataset(dl.dataset);
                        ds.isAnonymous(!blist.configuration.privateData);
                        return addContext(dc, dl.id, {type: 'dataset', datasetId: dl.dataset.id},
                            {dataset: ds});
                    });
                }

                if (!$.isBlank(curC.dataset))
                {
                    hookTotals(config, curC.dataset);
                    updateGroupedCols(curC.dataset, config.query);
                }

                if (!$.isBlank(curC.column))
                {
                    if (!(curC.column instanceof Column))
                    {
                        // First find dataset
                        loadDataset(dc, id, $.extend({keepOriginal: $.isBlank(config.query)}, config),
                        function(ds)
                        {
                            curC.column = ds.columnForIdentifier(config.columnId);
                            hookColumnAggs(config, curC.column);
                            doneLoading(curC);
                        });
                    }
                    else
                    {
                        hookColumnAggs(config, curC.column);
                        doneLoading(curC);
                    }
                }
                else
                { doneLoading(curC); }

                return;
            }

            switch (config.type)
            {
                case 'row':
                    loadDataset(dc, id, config, function(ds)
                    {
                        loadRow(ds, config, function(row)
                        {
                            if ($.isBlank(row))
                            { errorLoading(id); }
                            else
                            { doneLoading(addContext(dc, id, config, { row: row })); }
                        });
                    }, errorLoading);
                    break;

                case 'column':
                    loadDataset(dc, id, $.extend({keepOriginal: $.isBlank(config.query)}, config),
                    function(ds)
                    {
                        var col = ds.columnForIdentifier(config.columnId);
                        var finishCol = function()
                        {
                            doneLoading(addContext(dc, id, config, { column: col }));
                        };

                        if ($.isBlank(col))
                        { errorLoading(id); }
                        else
                        {
                            hookColumnAggs(config, col);
                            if (!$.isBlank(config.aggregate))
                            {
                                var aggs = {};
                                aggs[col.id] = $.makeArray(config.aggregate);
                                ds.getAggregates(finishCol, aggs);
                            }
                            else
                            { finishCol(); }
                        }
                    }, errorLoading);
                    break;

                case 'dataset':
                    loadDataset(dc, id, config, function(ds)
                    {
                        doneLoading(addContext(dc, id, config, { dataset: ds }));
                    }, errorLoading);
                    break;

                case 'datasetList':
                    Dataset.search(config.search, function(results)
                        {
                            _.each(results.views, function(ds) { addQuery(ds, config.query); });

                            var setResult = function(viewsList, count)
                            {
                                if (count < 1)
                                {
                                    errorLoading(id);
                                    return;
                                }

                                doneLoading(addContext(dc, id, config, { count: count,
                                    datasetList: _.map(viewsList, function(ds)
                                    {
                                        return addContext(dc, id + '_' + ds.id,
                                            { type: 'dataset', datasetId: ds.id },
                                            { dataset: ds });
                                    })
                                }));
                            };

                            if (config.requireData && results.count > 0)
                            {
                                var trCallback = _.after(results.views.length, function()
                                {
                                    var vl = _.reject(results.views, function(ds)
                                        { return ds.totalRows() < 1; });
                                    var c = results.count - (results.views.length - vl.length);
                                    setResult(vl, c);
                                });
                                _.each(results.views, function(ds) { ds.getTotalRows(trCallback); });
                            }
                            else
                            { setResult(results.views, results.count); }
                        },
                        function(xhr)
                        { errorLoading(id); },
                        !blist.configuration.privateData);
                    break;
                default:
                    alert('Unrecognized data context type: ' + config.type + ' for ' + id);
                    break;
            }
        },

        getContext: function(id, successCallback, errorCallback)
        {
            var dc = this;
            if (!$.isBlank(dc.availableContexts[id]))
            {
                if (_.isFunction(successCallback))
                { _.defer(function() { successCallback(dc.availableContexts[id]); }); }
                return true;
            }

            if (!$.isBlank(dc._contextsQueue[id]))
            {
                dc._contextsQueue[id].push({success: successCallback, error: errorCallback});
                return true;
            }

            return false;
        },

        updateContext: function(config, successCallback, errorCallback)
        {
            var gotDC = function(dc)
            {
                dc.config = $.stringSubstitute(config, $.component.rootPropertyResolver);
                if (dc.config.type != dc.type)
                {
                    // Can't handle type change
                    if (_.isFunction(errorCallback)) { errorCallback(); }
                    return;
                }

                switch (dc.type)
                {
                    case 'dataset':
                        addQuery(dc.dataset, dc.config.query);
                        if (_.isFunction(successCallback)) { successCallback(dc); }
                        break;
                    default:
                        // Can't handle other types
                        if (_.isFunction(errorCallback)) { errorCallback(); }
                        break;
                }
            };

            return $.dataContext.getContext(config.id, gotDC, errorCallback);
        },

        currentContexts: function()
        {
            var res = {};
            _.each(this.availableContexts, function(dc, id)
            { res[id] = dc.config; });
            return res;
        }
    }));

    var addContext = function(dc, id, config, context)
    {
        context.config = config;
        context.id = id;
        context.type = config.type;
        dc.availableContexts[id] = context;
        return context;
    };

    var addQuery = function(ds, query)
    {
        if ($.isBlank(query)) { return; }
        query = $.extend(true, {}, query);

        var q = $.extend(true, {orderBys: [], groupBys: []}, ds.query);
        _.each(query, function(v, k)
            {
                if (!_.include(['orderBys', 'groupBys', 'groupedColumns',
                        'searchString'], k))
                { q[k] = $.extend(true, _.isArray(v) ? [] : {}, q[k], v); }
            });

        // Translate fieldNames
        if (!$.isBlank(query.orderBys))
        {
            _.each(query.orderBys, function(ob)
            {
                if ($.subKeyDefined(ob, 'expression.fieldName'))
                {
                    var c = ds.columnForFieldName(ob.expression.fieldName);
                    if ($.isBlank(c)) { return false; }
                    ob.expression.columnId = c.id;
                    delete ob.expression.fieldName;
                }
                q.orderBys.push(ob);
            });
        }
        if (_.isEmpty(q.orderBys)) { delete q.orderBys; }

        if (!$.isBlank(query.groupBys))
        {
            _.each(query.groupBys, function(gb)
            {
                if ($.subKeyDefined(gb, 'fieldName'))
                {
                    var c = ds.columnForFieldName(gb.fieldName);
                    if ($.isBlank(c)) { return false; }
                    gb.columnId = c.id;
                    delete gb.fieldName;
                }
                q.groupBys.push(gb);
            });
        }
        if (_.isEmpty(q.groupBys)) { delete q.groupBys; }

        var props = { query: q };
        if (!$.isBlank(query.searchString))
        { props.searchString = query.searchString; }
        ds.update(props);
        updateGroupedCols(ds, query);
    };

    var loadDataset = function(dc, id, config, callback, errorCallback)
    {
        var gotDS = function(ds)
        {
            if (!config.keepOriginal) { addQuery(ds, config.query); }
            if (config.getTotal)
            {
                ds.getTotalRows(function()
                {
                    hookTotals(config, ds);
                    callback(ds);
                },
                function() { errorCallback(id); });
            }
            else { callback(ds); }
        };

        if ($.subKeyDefined(config, 'contextId'))
        {
            if (!dc.getContext(config.contextId, function(context)
            {
                if (context.type != 'dataset')
                {
                    errorCallback(id);
                    return;
                }
                gotDS(config.keepOriginal ? context.dataset : context.dataset.clone());
            }, errorCallback))
            {
                // When loading the initial hash, we might have references in
                // the wrong order; so make an attempt to wait until that one
                // is loaded (or at least registered)
                if ($.subKeyDefined(dc._preLoadQueue, config.contextId))
                {
                    var args = arguments;
                    dc._preLoadQueue[config.contextId].push(
                            { success: function() { loadDataset.apply(this, args); },
                                error: errorCallback });
                }
                else
                { errorCallback(id); }
            }
        }
        else if ($.subKeyDefined(config, 'datasetId'))
        {
            Dataset.createFromViewId(config.datasetId, function(dataset) { gotDS(dataset); },
                function(xhr)
                { errorCallback(id); }, false, !blist.configuration.privateData);
        }
        else if ($.subKeyDefined(config, 'datasetResourceName'))
        {
            Dataset.lookupFromResourceName(config.datasetResourceName, function(dataset) { gotDS(dataset); },
                function(xhr)
                { errorCallback(id); }, !blist.configuration.privateData);
        }
        else if ($.subKeyDefined(config, 'search'))
        {
            Dataset.search($.extend({}, config.search, {limit: 1}), function(results)
            {
                if (results.count < 1)
                {
                    errorCallback(id);
                    return;
                }
                gotDS(_.first(results.views));
            },
            function(xhr)
            { errorCallback(id); },
            !blist.configuration.privateData);
        }
    };

    var loadRow = function(dataset, config, callback)
    {
        var rowResult = function(r)
        {
            r = _.first(r);
            if ($.isBlank(r))
            {
                callback(null);
                return false;
            }

            // Fake support for row fieldNames
            callback(dataset.rowToSODA2(r));
        };
        if (!$.isBlank(config.rowId))
        { dataset.getRowsByIds($.makeArray(config.rowId), rowResult); }
        else
        { dataset.getRows(0, 1, rowResult); }
    };

    var hookTotals = function(config, ds)
    {
        if (!config.getTotal) { return; }
        ds.bind('row_count_change', function()
        {
            _.defer(function()
            {
                if ($.isBlank(ds.totalRows()))
                { ds.getTotalRows(); }
            });
        });
    };

    var hookColumnAggs = function(config, col)
    {
        if ($.isBlank(config.aggregate)) { return; }
        col.view.bind('column_totals_changed', function()
        {
            _.defer(function()
            {
                var aggs = {};
                aggs[col.id] = $.makeArray(config.aggregate);
                col.view.getAggregates(null, aggs);
            });
        });
    };

    var updateGroupedCols = function(ds, query)
    {
        if ($.isBlank(ds.query.groupBys) || $.isBlank(query) || _.isEmpty(query.groupedColumns))
        { return; }

        var cols = [];
        // First all grouped columns
        _.each(ds.query.groupBys, function(g)
                { cols.push((ds.columnForIdentifier(g.columnId) || {}).id); });
        // Then aggregated columns
        _.each(query.groupedColumns, function(gc)
        {
            var c = ds.columnForIdentifier(gc.columnId);
            if ($.isBlank(c)) { return; }
            var fmt = $.extend({}, c.format);
            fmt.grouping_aggregate = gc.aggregate;
            c.update({format: fmt});
            cols.push(c.id);
        });
        ds.setVisibleColumns(_.compact(cols), null, true);
    };

})(jQuery);
