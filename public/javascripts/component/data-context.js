;(function($) {
    $.dataContext = {
        availableContexts: {},
        _contextsQueue: {},

        getContext: function(id, successCallback, errorCallback)
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
            Dataset.createFromViewId(id, function(view)
                {
                    dc.availableContexts[id] = view;
                    _.each(dc._contextsQueue[id], function(f)
                        { if (_.isFunction(f.success)) { f.success(dc.availableContexts[id]); } });
                    delete dc._contextsQueue[id];
                    if (_.isFunction(successCallback)) { successCallback(dc.availableContexts[id]); }
                },
                function(xhr)
                {
                    _.each(dc._contextsQueue[id], function(f)
                        { if (_.isFunction(f.error)) { f.error(xhr); } });
                    delete dc._contextsQueue[id];
                    if (_.isFunction(errorCallback)) { errorCallback(xhr); }
                });
        }
    };
})(jQuery);
