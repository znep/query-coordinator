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
                if (_.isFunction(errorCallback)) { errorCallback(xhr); }
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

                doneLoading(curC);
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
                            if (results.count < 1)
                            {
                                errorLoading(id);
                                return;
                            }
                            dc.availableContexts[id] = {id: id, type: config.type,
                                count: results.count, datasetList: _.map(results.views, function(ds)
                                    {
                                        addQuery(ds, config.query);
                                        var c = {type: 'dataset', dataset: ds, id: id + '_' + ds.id};
                                        dc.availableContexts[c.id] = c;
                                        return c;
                                    })};
                            doneLoading(dc.availableContexts[id]);
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
            addQuery(ds, config.query);
            if (config.getTotal)
            { ds.getTotalRows(function() { callback(ds); }, function() { errorCallback(id); }) }
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
                gotDS(context.dataset.clone());
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

})(jQuery);
