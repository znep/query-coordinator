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
                case 'dataset':
                    Dataset.createFromViewId(config.datasetId, function(dataset)
                        {
                            addQuery(dataset, config.query);

                            dc.availableContexts[id] = {id: id, type: config.type, dataset: dataset};
                            doneLoading(dc.availableContexts[id]);
                        },
                        function(xhr)
                        { errorLoading(id); });
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
        ds.update({query: $.extend(true, {}, ds.query, query)});
    };
})(jQuery);
