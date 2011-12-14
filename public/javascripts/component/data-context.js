;(function($) {
    $.dataContext = new (Model.extend({
        availableContexts: {},
        _contextsQueue: {},

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

            dc._contextsQueue[id] = [];
            switch (config.type)
            {
                case 'row':
                    loadDataset(config, function(ds)
                    {
                        ds.getRows(0, 1, function(r)
                        {
                            r = _.first(r);
                            if ($.isBlank(r))
                            {
                                errorLoading(id);
                                return;
                            }

                            // Fake support for row fieldNames
                            var fr = {};
                            _.each(ds.visibleColumns, function(c) { fr[c.fieldName] = r[c.lookup]; });
                            dc.availableContexts[id] = {id: id, type: config.type, row: fr};
                            doneLoading(dc.availableContexts[id]);
                        });
                    });
                    break;

                case 'dataset':
                    loadDataset(config, function(ds)
                    {
                        dc.availableContexts[id] = {id: id, type: config.type, dataset: ds};
                        doneLoading(dc.availableContexts[id]);
                    });
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

        // Translate fieldNames
        if (!$.isBlank(query.orderBys))
        {
            query.orderBys = _.select(query.orderBys, function(ob)
            {
                if ($.subKeyDefined(ob, 'expression.fieldName'))
                {
                    var c = ds.columnForFieldName(ob.expression.fieldName);
                    if ($.isBlank(c)) { return false; }
                    ob.expression.columnId = c.id;
                    delete ob.expression.fieldName;
                    return true;
                }
                return true;
            });
        }

        ds.update({query: $.extend(true, {}, ds.query, query)});
    };

    var loadDataset = function(config, callback)
    {
        if ($.subKeyDefined(config, 'datasetId'))
        {
            Dataset.createFromViewId(config.datasetId, function(dataset)
                {
                    addQuery(dataset, config.query);
                    callback(dataset);
                },
                function(xhr)
                { errorLoading(id); });
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
            { errorLoading(id); });
        }
    };

})(jQuery);
