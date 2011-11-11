

(function() {
    var _ = require('underscore');
    var $ = require('blist-util');
    var blist = require('blist-compat');

    var Class = require('class');
    var env = require('environment');

    var document = {
        location: {
            toString: function() { return env.base.url; },
            hostname: env.base.hostname,
            protocol: env.base.protocol,
            port: env.base.port
        }
    };

(function(){

var Model = Class.extend({
    _init: function()
    {
        var that = this;
        var listeners = {};
        var events = {};
        var modelEvents = [];

        var verifyEvent = function(evName)
        { if (!events[evName]) { throw 'Event ' + evName + ' not registered'; } };

        this.bind = function (evName, func, model)
        {
            verifyEvent(evName);
            listeners[evName] = listeners[evName] || [];
            if (!_.include(listeners[evName], func) && _.isFunction(func))
            {
                listeners[evName].push(func);
                if (!$.isBlank(model))
                { modelEvents.push({name: evName, func: func, model: model}); }
            }
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

        this.unbind = function (evName, func, model)
        {
            if (!$.isBlank(evName))
            { verifyEvent(evName); }

            if (!$.isBlank(func))
            { listeners[evName] = _.without(listeners[evName] || [], func); }
            else if (!$.isBlank(model))
            {
                modelEvents = _.reject(modelEvents, function(obj)
                {
                    if (obj.model === model && ($.isBlank(evName) || evName === obj.name))
                    {
                        listeners[obj.name] = _.without(listeners[obj.name] || [], obj.func);
                        return true;
                    }
                    return false;
                });
            }
            else if (!$.isBlank(evName))
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
    cleanCopy: function(allowedKeys)
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

        if (_.isArray(allowedKeys))
        {
            var ak = {};
            _.each(allowedKeys, function(a) { ak[a] = true; });
            allowedKeys = ak;
        }

        var obj = {};
        _.each(this, function(v, k)
        {
            if (!_.isFunction(v) && !k.startsWith('_') && that._validKeys[k] &&
                ($.isBlank(allowedKeys) || allowedKeys[k]))
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

if (blist.inBrowser)
{ this.Model = Model; }
else
{ module.exports = Model; }

})();
})();
