;(function($) {

    this.DataContext = Model.extend({
        _init: function (v, parSet, initCallback)
        {
            var dc = this;
            initCallback = initCallback || function() {};

            dc._super();
            this.registerEvent([ 'data_change' ]);

            $.extend(dc, v);

            dc._parentSet = parSet;
            if ($.isBlank(dc.type) && !$.isBlank(dc.config))
            { dc.type = dc.config.type; }

            if (!$.isBlank(dc.dataset) && !(dc.dataset instanceof Dataset))
            {
                dc.dataset = new Dataset(dc.dataset);
                dc.dataset.isAnonymous(!blist.configuration.privateData);
            }

            if (!$.isBlank(dc.dataset))
            {
                dc._hookTotals();
                updateGroupedCols(dc.dataset, dc.config.query);
            }

            if (!_.isEmpty(dc.datasetList))
            {
                dc.datasetList = _.map(dc.datasetList, function(dl)
                {
                    var cDc = dl;
                    if (!(dl instanceof DataContext))
                    {
                        cDc = new DataContext({ id: dl.id,
                            config: { type: 'dataset', datasetId: dl.dataset.id }, dataset: dl.dataset },
                            dc._parentSet);
                        cDc._registerContext();
                    }
                    return cDc;
                });
            }

            if (!$.isBlank(dc.column))
            {
                if (!(dc.column instanceof Column))
                {
                    // First find dataset
                    this._loadDataset(function()
                    {
                        dc.column = dc.dataset.columnForIdentifier(dc.config.columnId);
                        dc._hookColumnAggs();
                        initCallback(dc);
                    }, function() {}, $.isBlank(dc.config.query));
                }
                else
                {
                    dc._hookColumnAggs();
                    initCallback(dc);
                }
            }
            else
            { initCallback(dc); }

        },

        updateConfig: function(newConf)
        {
            var dc = this;
            if (!$.isBlank(dc.type) && newConf.type != dc.type)
            {
                // Can't handle type change
                return false;
            }

            var _origConf = dc.config;

            dc.config = newConf;
            dc.type = dc.config.type;

            switch (dc.type)
            {
                case 'dataset':
                    addQuery(dc.dataset, dc.config.query);
                    break;

                case 'datasetList':
                    dc._loadDatasetList(function() { dc.trigger('data_change'); },
                            function() { dc.trigger('data_change'); });
                    break;

                default:
                    // Can't handle other types
                    return false;
            }
            return true;
        },

        load: function(callback, errorCallback)
        {
            var dc = this;
            switch (dc.type)
            {
                case 'row':
                    dc._loadDataset(function()
                    {
                        dc._loadRow(function() { callback(dc); }, errorCallback);
                    }, errorCallback);
                    break;

                case 'column':
                    dc._loadDataset(function()
                    {
                        dc.column = dc.dataset.columnForIdentifier(dc.config.columnId);
                        var finishCol = function() { callback(dc); };

                        if ($.isBlank(dc.column))
                        { errorCallback(dc.id); }
                        else
                        {
                            dc._hookColumnAggs();
                            if (!$.isBlank(dc.config.aggregate))
                            {
                                var aggs = {};
                                aggs[dc.column.id] = $.makeArray(dc.config.aggregate);
                                dc.dataset.getAggregates(finishCol, aggs);
                            }
                            else
                            { finishCol(); }
                        }
                    }, errorCallback, $.isBlank(dc.config.query));
                    break;

                case 'dataset':
                    dc._loadDataset(function() { callback(dc); }, errorCallback);
                    break;

                case 'datasetList':
                    dc._loadDatasetList(function() { callback(dc); }, errorCallback);
                    break;

                case 'goalList':
                    if (!$.subKeyDefined(blist, 'govstat.collections.Goals'))
                    {
                        errorCallback(dc.id);
                        break;
                    }

                    var gl = new blist.govstat.collections.Goals();
                    gl.fetch({ data: $.param(dc.config.search || {}), success: function()
                    {
                        if (gl.length < 1)
                        {
                            errorCallback(dc.id);
                            return;
                        }

                        dc.count = gl.length;
                        dc.goalList = _.map(gl.models, function(goal)
                            {
                                var gDc = new DataContext({ id: dc.id + '_' + goal.id,
                                    config: { type: 'goal', goalId: goal.id },
                                    goal: goal.toJSON() }, dc._parentSet);
                                gDc._registerContext();
                                return gDc;
                            });

                        callback(dc);
                    },
                    error: function()
                    { errorCallback(dc.id); } });
                    break;

                case 'goal':
                    if (!$.subKeyDefined(blist, 'govstat.models.Goal'))
                    {
                        errorCallback(dc.id);
                        break;
                    }

                    var goal = new blist.govstat.models.Goal({id: dc.config.goalId});
                    goal.fetch({ success: function()
                    {
                        dc.goal = goal.toJSON();
                        callback(dc);
                    },
                    error: function()
                    { errorCallback(dc.id); } });
                    break;

                case 'govstatCategoryList':
                    if (!$.subKeyDefined(blist, 'govstat.collections.Categories'))
                    {
                        errorCallback(dc.id);
                        break;
                    }

                    var catList = new blist.govstat.collections.Categories();
                    catList.fetch({ success: function()
                    {
                        if (catList.length < 1)
                        {
                            errorCallback(dc.id);
                            return;
                        }

                        dc.count = catList.length;
                        dc.categoryList = _.map(catList.models, function(cat)
                            {
                                var cDc = new DataContext({ id: dc.id + '_' + cat.id,
                                    config: { type: 'govstatCategory', categoryId: cat.id },
                                    category: cat.toJSON() }, dc._parentSet);
                                cDc._registerContext();
                                return cDc;
                            });

                        callback(dc);
                    },
                    error: function()
                    { errorCallback(dc.id); } });
                    break;

                case 'list':
                    var l = dc.config.list;
                    if (_.isString(l))
                    {
                        l = $.stringSubstitute('{' + l + ' ||}',
                                $.component.rootPropertyResolver).split(', ');
                    }
                    dc.count = l.length;
                    dc.list = l;
                    callback(dc);
                    break;

                default:
                    alert('Unrecognized data context type: ' + dc.type + ' for ' + dc.id);
                    break;
            }
        },

        _registerContext: function()
        {
            if ($.subKeyDefined(this, '_parentSet'))
            { this._parentSet.addContext(this); }
        },

        _loadDatasetList: function(callback, errorCallback)
        {
            var dc = this;
            Dataset.search(dc.config.search, function(results)
                {
                    _.each(results.views, function(ds) { addQuery(ds, dc.config.query); });

                    var setResult = function(viewsList, count)
                    {
                        if (count < 1 && !dc.config.noFail)
                        {
                            errorCallback(dc.id);
                            return;
                        }

                        dc.count = count;
                        dc.datasetList = _.map(viewsList, function(ds)
                            {
                                var childId = dc.id + '_' + ds.id;
                                var dsDc;
                                if ($.subKeyDefined(dc, '_parentSet'))
                                { dsDc = dc._parentSet.availableContexts[childId]; }
                                if ($.isBlank(dsDc))
                                {
                                    dsDc = new DataContext({ id: dc.id + '_' + ds.id,
                                        config: { type: 'dataset', datasetId: ds.id },
                                        dataset: ds }, dc._parentSet);
                                    dsDc._registerContext();
                                }
                                return dsDc;
                            });

                        callback();
                    };

                    if (dc.config.requireData && results.count > 0)
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
                { errorCallback(dc.id); },
                !blist.configuration.privateData);
        },

        _loadDataset: function(callback, errorCallback, keepOriginal)
        {
            var dc = this;
            if (!$.isBlank(dc.config.keepOriginal))
            { keepOriginal = dc.config.keepOriginal; }
            var gotDS = function(ds)
            {
                dc.dataset = ds;
                if (!keepOriginal) { addQuery(dc.dataset, dc.config.query); }
                if (dc.config.getTotal)
                {
                    dc.dataset.getTotalRows(function()
                    {
                        dc._hookTotals();
                        callback();
                    },
                    function() { errorCallback(dc.id); });
                }
                else { callback(); }
            };

            if ($.subKeyDefined(dc.config, 'contextId'))
            {
                if ($.isBlank(dc._parentSet) ||
                        !dc._parentSet.getContext(dc.config.contextId, function(context)
                    {
                        if (context.type != 'dataset')
                        {
                            errorCallback(dc.id);
                            return;
                        }
                        gotDS(keepOriginal ? context.dataset : context.dataset.clone());
                    }, errorCallback))
                {
                    // TODO: don't poke at internals of parentSet
                    // When loading the initial hash, we might have references in
                    // the wrong order; so make an attempt to wait until that one
                    // is loaded (or at least registered)
                    if ($.subKeyDefined(dc, '._parentSet._preLoadQueue.' + dc.config.contextId))
                    {
                        var args = arguments;
                        dc._parentSet._preLoadQueue[dc.config.contextId].push(
                                { success: function() { dc._loadDataset.apply(dc, args); },
                                    error: errorCallback });
                    }
                    else
                    { errorCallback(dc.id); }
                }
            }
            else if ($.subKeyDefined(dc.config, 'datasetId'))
            {
                Dataset.createFromViewId(dc.config.datasetId, function(dataset) { gotDS(dataset); },
                    function(xhr)
                    { errorCallback(dc.id); }, false, !blist.configuration.privateData);
            }
            else if ($.subKeyDefined(dc.config, 'datasetResourceName'))
            {
                Dataset.lookupFromResourceName(dc.config.datasetResourceName,
                    function(dataset) { gotDS(dataset); },
                    function(xhr)
                    { errorCallback(dc.id); }, !blist.configuration.privateData);
            }
            else if ($.subKeyDefined(dc.config, 'search'))
            {
                Dataset.search($.extend({}, dc.config.search, {limit: 1}), function(results)
                {
                    if (results.count < 1)
                    {
                        errorCallback(dc.id);
                        return;
                    }
                    gotDS(_.first(results.views));
                },
                function(xhr)
                { errorCallback(dc.id); },
                !blist.configuration.privateData);
            }
        },

        _hookTotals: function()
        {
            var dc = this;
            if ($.isBlank(dc.dataset) || !dc.config.getTotal) { return; }
            dc.dataset.bind('row_count_change', function()
            {
                _.defer(function()
                {
                    if ($.isBlank(dc.dataset.totalRows()))
                    { dc.dataset.getTotalRows(); }
                });
            });
        },

        _loadRow: function(callback, errorCallback)
        {
            var dc = this;
            if ($.isBlank(dc.dataset))
            {
                errorCallback(dc.id);
                return;
            }

            var rowResult = function(r)
            {
                r = _.first(r);
                if ($.isBlank(r))
                {
                    errorCallback(dc.id);
                    return false;
                }

                // Fake support for row fieldNames
                dc.row = dc.dataset.rowToSODA2(r);
                callback();
            };
            if (!$.isBlank(dc.config.rowId))
            { dc.dataset.getRowsByIds($.makeArray(dc.config.rowId), rowResult); }
            else
            { dc.dataset.getRows(0, 1, rowResult); }
        },

        _hookColumnAggs: function()
        {
            var dc = this;
            if ($.isBlank(dc.config.aggregate)) { return; }
            dc.column.view.bind('column_totals_changed', function()
            {
                _.defer(function()
                {
                    var aggs = {};
                    aggs[dc.column.id] = $.makeArray(dc.config.aggregate);
                    dc.column.view.getAggregates(null, aggs);
                });
            });
        }

    });

    DataContext.loadFromConfig = function(id, config, parSet)
    {
        return new DataContext({ id: id, config: config }, parSet);
    };

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

        addContext: function(context)
        {
            this.availableContexts[context.id] = context;
        },

        load: function(configHash, existingContexts, extraConfig)
        {
            var dc = this;
            if (_.isObject(existingContexts))
            { $.extend(dc._existingContexts, existingContexts); }
            // Initially set up preLoadQueue for each item
            _.each(configHash, function(c, id) { dc._preLoadQueue[id] = dc._preLoadQueue[id] || []; });
            _.each(configHash, function(c, id)
            {
                if ($.subKeyDefined(extraConfig, id))
                { $.extend(c, extraConfig[id]); }
                dc.loadContext(id, c);
            });
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
                dc.addContext(newContext);
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

            var context;
            // If we have an existing item that has all the context data, then short-circuit
            // and do the bit of updating required to use the context
            if (dc._existingContexts.hasOwnProperty(id) && dc._existingContexts[id].type == config.type)
            {
                context = new DataContext($.extend({ id: id, config: config },
                            dc._existingContexts[id]), dc, doneLoading);
            }
            else
            {
                context = DataContext.loadFromConfig(id, config, dc);
                context.load(doneLoading, errorLoading);
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
                config = $.stringSubstitute(config, $.component.rootPropertyResolver);
                if (dc.updateConfig(config))
                { if (_.isFunction(successCallback)) { successCallback(dc); } }
                else
                { if (_.isFunction(errorCallback)) { errorCallback(); } }
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
