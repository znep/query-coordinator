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

            dc._contextsQueue[id] = [];
            switch (config.type)
            {
                case 'view':
                    Dataset.createFromViewId(config.viewId, function(view)
                        {
                            dc.availableContexts[id] = {id: id, view: view};
                            _.each(dc._contextsQueue[id], function(f)
                                { if (_.isFunction(f.success)) { f.success(dc.availableContexts[id]); } });
                            delete dc._contextsQueue[id];
                            if (_.isFunction(successCallback)) { successCallback(dc.availableContexts[id]); }
                            $.dataContext.trigger('available', [ id, view ]);
                        },
                        function(xhr)
                        {
                            _.each(dc._contextsQueue[id], function(f)
                                { if (_.isFunction(f.error)) { f.error(xhr); } });
                            delete dc._contextsQueue[id];
                            if (_.isFunction(errorCallback)) { errorCallback(xhr); }
                            $.dataContext.trigger('error', [ id, view ]);
                        });
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
})(jQuery);
