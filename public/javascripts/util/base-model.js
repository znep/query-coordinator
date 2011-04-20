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
