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

        load: function(configHash)
        {
            var dc = this;
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
                _.each(dc._contextsQueue[id], function(f) { if (_.isFunction(f.error)) { f.error(xhr); } });
                delete dc._contextsQueue[id];
                if (_.isFunction(errorCallback)) { errorCallback(xhr); }
                $.dataContext.trigger('error', [ id ]);
            };

            dc._contextsQueue[id] = dc._preLoadQueue[id] || [];
            delete dc._preLoadQueue[id];
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

        var q = $.extend(true, {orderBys: []}, ds.query);
        _.each(query, function(v, k) { if (k != 'orderBys') { q[k] = $.extend(true, {}, q[k], v); } });

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

        ds.update({query: q});
    };

    var loadDataset = function(dc, id, config, callback, errorCallback)
    {
        config = $.template(config, $.component.rootPropertyResolver);
        if ($.subKeyDefined(config, 'contextId'))
        {
            if (!dc.getContext(config.contextId, function(context)
            {
                if (context.type != 'dataset')
                {
                    errorCallback(id);
                    return;
                }
                var ds = context.dataset;
                if (!$.isBlank(config.query))
                {
                    ds = ds.clone();
                    addQuery(ds, config.query);
                }
                callback(ds);
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
            Dataset.createFromViewId(config.datasetId, function(dataset)
                {
                    addQuery(dataset, config.query);
                    callback(dataset);
                },
                function(xhr)
                { errorCallback(id); });
        }
        else if ($.subKeyDefined(config, 'search'))
        {
            Dataset.search($.extend({}, config.search, {limit: 1}), function(results)
            {
                if (results.count < 1) { return; }
                var ds = _.first(results.views);
                addQuery(ds, config.query);
                callback(ds);
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
