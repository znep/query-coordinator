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
            _.each(listeners[evName] || [], function(f) { f.apply(that, args); });
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
    }
});

})();
