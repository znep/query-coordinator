(function(){

this.Model = Class.extend({
    _init: function()
    {
        var that = this;
        var listeners = {};
        var events = {};

        var verifyEvent = function(evName)
        { if (!events[evName]) { throw 'Event ' + evName + ' not registered'; } };

        this.bind = function (evName, func)
        {
            verifyEvent(evName);
            listeners[evName] = listeners[evName] || [];
            if (!_.include(listeners[evName], func) && _.isFunction(func))
            { listeners[evName].push(func); }
            return that;
        };

        this.once = function(evName, func)
        {
            var wrapper = function()
            {
                this.unbind(evName, wrapper);
                func.apply(this, arguments);
            };
            this.bind(evName, wrapper);
        };

        this.unbind = function (evName, func)
        {
            verifyEvent(evName);
            if (!$.isBlank(func))
            { listeners[evName] = _.without(listeners[evName] || [], func); }
            else
            { listeners[evName] = []; }
            return that;
        };

        this.trigger = function(evName, args)
        {
            verifyEvent(evName);
            // IE requires that if you pass something for args, it must be
            // an array; not null or undefined
            _.each(listeners[evName] || [], function(f)
                { f.apply(that, args || []); });
            return that;
        };

        // Events must be registered before they can be used.  Hopefully this
        // will prevent bugs due to typos, or assuming an event is available
        // that is never fired
        this.registerEvent = function(evName)
        {
            _.each($.makeArray(evName), function(e) { events[e] = true; });
            return that;
        };

        this.availableEvents = function()
        { return _.keys(events).sort(); };

        this.registerEvent(['start_request', 'finish_request']);
        this._reqCount = 0;

        // Assume WEBSITE unless set otherwise
        this.accessType = 'WEBSITE';
    },

    // Return a cleaned copy that has no functions, private keys, or anything
    // not valid outside the Model
    cleanCopy: function()
    {
        var that = this;
        var cleanObj = function(val, key)
        {
            if (val instanceof Model)
            { return val.cleanCopy(); }

            else if (_.isArray(val))
            {
                // Flags are special, because they're not really an array in
                // that order doesn't matter. To keep them consistent, sort them
                if (key == 'flags')
                { return val.slice().sort(); }
                else
                { return _.map(val, function(v) { return cleanObj(v); }); }
            }

            else if ($.isPlainObject(val))
            {
                var obj = {};
                _.each(val, function(v, k) { obj[k] = cleanObj(v, k); });
                return obj;
            }

            else
            { return val; }
        };

        var obj = {};
        _.each(this, function(v, k)
        {
            if (!_.isFunction(v) && !k.startsWith('_') && that._validKeys[k])
            { obj[k] = cleanObj(v, k); }
        });
        return obj;
    },

    setAccessType: function(accessType)
    {
        this.accessType = accessType;
    },

    _makeRequest: function(req)
    {
        var model = this;
        var finishCallback = function(callback)
        {
            return function()
            {
                model._reqCount--;
                if (model._reqCount < 1) { model.trigger('finish_request'); }
                if (_.isFunction(callback)) { callback.apply(this, arguments); }
            };
        };

        if (model._reqCount < 1) { this.trigger('start_request'); }
        model._reqCount++;
        req = $.extend({contentType: 'application/json', dataType: 'json'}, req,
                {error: finishCallback(req.error),
                success: finishCallback(req.success)});

        if (!$.isBlank(model.accessType))
        { req.params = $.extend({accessType: model.accessType}, req.params); }
        else { $.debug('making call without accessType!', req); }

        if (!$.isBlank(req.params))
        {
             req.url += (req.url.indexOf('?') >= 0 ? '&' : '?') +
                $.param(req.params);
        }

        // We never want the browser cache, because our data can change frequently
        if ($.isBlank(req.type) || req.type.toLowerCase() == 'get')
        { req.cache = false; }

        var cleanReq = function()
        {
            delete req.batch;
            delete req.pageCache;
            delete req.params;
        };

        if (req.pageCache)
        {
            cleanReq();
            $.Tache.Get(req);
        }
        else if (req.batch)
        {
            cleanReq();
            $.socrataServer.addRequest(req);
        }
        else
        {
            cleanReq();
            $.ajax(req);
        }
    },

    _sendBatch: function(successCallback)
    {
        if (!$.socrataServer.runRequests({success: successCallback}) &&
            _.isFunction(successCallback))
        { successCallback(); }
    },

    _generateBaseUrl: function(domain, isShort)
    {
        var loc = document.location;
        var domain = $.isBlank(domain) ? loc.hostname : domain;
        if (isShort) { domain = domain.replace(/www\./, ''); }
        var base = (isShort ? '' : (loc.protocol + '//')) + domain;

        if (loc.port && loc.port != 80)
        { base += ':' + loc.port; }

        return base;
    },

    _validKeys: {}
});

})();
