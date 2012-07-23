;(function($) {
    $.dataContext = new (Model.extend({
        availableContexts: {},
        _contextsQueue: {},
        _preLoadQueue: {},

        _init: function() {
            this._super();

            // Note that unavailable isn't used yet as you cannot delete datasets
            this.registerEvent([ 'available', 'unavailable', 'error' ]);
        },

        load: function(configHash, existingContexts)
        {
            var dc = this;
            _.each(configHash, function(c, id) { dc.loadContext(id, c, null, null, existingContexts); });
        },

        loadContext: function(id, config, successCallback, errorCallback, existingContexts)
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
            existingContexts = existingContexts || {};
            if (existingContexts.hasOwnProperty(id) && existingContexts[id].type == config.type)
            {
                var curC = dc.availableContexts[id] = existingContexts[id];
                if (!$.isBlank(curC.dataset) && !(curC.dataset instanceof Dataset))
                { curC.dataset = new Dataset(curC.dataset); }

                if (!_.isEmpty(curC.datasetList))
                {
                    curC.datasetList = _.map(curC.datasetList, function(dl)
                    {
                        var c = {type: 'dataset', dataset: new Dataset(dl.dataset), id: dl.id};
                        dc.availableContexts[c.id] = c;
                        return c;
                    });
                }

                if (!$.isBlank(curC.dataset))
                { hookTotals(config, curC.dataset); }

                if (!$.isBlank(curC.column))
                {
                    if (!(curC.column instanceof Column))
                    { curC.column = new Column(curC.column); }
                    if ($.isBlank(curC.column.view))
                    {
                        loadDataset(dc, id, $.extend({keepOriginal: $.isBlank(config.query)}, config),
                        function(ds)
                        {
                            curC.column.setParent(ds);
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
                        loadRow(ds, function(row)
                        {
                            if ($.isBlank(row))
                            { errorLoading(id); }
                            else
                            {
                                dc.availableContexts[id] = {id: id, type: config.type, row: row};
                                doneLoading(dc.availableContexts[id]);
                            }
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
                            dc.availableContexts[id] = { id: id, type: config.type, column: col };
                            doneLoading(dc.availableContexts[id]);
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
                        dc.availableContexts[id] = {id: id, type: config.type, dataset: ds};
                        doneLoading(dc.availableContexts[id]);
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

                                dc.availableContexts[id] = {id: id, type: config.type,
                                    count: count, datasetList: _.map(viewsList, function(ds)
                                        {
                                            var c = {type: 'dataset', dataset: ds, id: id + '_' + ds.id};
                                            dc.availableContexts[c.id] = c;
                                            return c;
                                        })};

                                doneLoading(dc.availableContexts[id]);
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
                        { errorLoading(id); });
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
        }
    }));

    var addQuery = function(ds, query)
    {
        if ($.isBlank(query)) { return; }
        query = $.extend(true, {}, query);

        var q = $.extend(true, {orderBys: [], groupBys: []}, ds.query);
        _.each(query, function(v, k)
            {
                if (!_.include(['orderBys', 'groupBys'], k))
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

        ds.update({query: q});
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
            }))
            {
                // When loading the initial hash, we might have references in
                // the wrong order; so make an attempt to wait until that one
                // is loaded (or at least registered)
                var args = arguments;
                dc._preLoadQueue[config.contextId] = dc._preLoadQueue[config.contextId] || [];
                dc._preLoadQueue[config.contextId].push(
                    { success: function() { loadDataset.apply(this, args); },
                        error: errorCallback });
            }
        }
        else if ($.subKeyDefined(config, 'datasetId'))
        {
            Dataset.createFromViewId(config.datasetId, function(dataset) { gotDS(dataset); },
                function(xhr)
                { errorCallback(id); });
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
            { errorCallback(id); });
        }
    };

    var loadRow = function(dataset, callback)
    {
        dataset.getRows(0, 1, function(r)
        {
            r = _.first(r);
            if ($.isBlank(r))
            {
                callback(null);
                return false;
            }

            // Fake support for row fieldNames
            var fr = {};
            _.each(dataset.visibleColumns, function(c) { fr[c.fieldName] = r[c.lookup]; });
            callback(fr);
        });
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

})(jQuery);
