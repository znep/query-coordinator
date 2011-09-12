/**
 * User change management and journaling.
 */
(function($) {
    var registry = {};
    var done = [];
    var undone = [];
    var listeners = [];

    function notifyListener(listener) {
        listener(done.length > 0, undone.length > 0);
    }

    function notifyAll() {
        _.each(listeners, notifyListener);
    }

    $.extend($.cf.edit, {
        registerAction: function(name, config) {
            if (registry[name])
                throw "Duplicate registered action " + name;
            if (!config.commit && config.rollback)
                throw "Edit actions require commit and rollback";
            registry[name] = function(options) {
                if (this.initialize)
                    this.initialize(options || {});
            };
            registry[name].prototype = config;
        },

        registerListener: function(fn) {
            listeners.push(fn);
            notifyListener(fn);
        },

        execute: function(typeName, config) {
            var Action = registry[typeName];
            if (!Action)
                throw "Unsupported action " + typeName;
            var action = new Action(config);
            action.commit();

            var notify = !done.length;
            done.push(action);

            if (undone.length) {
                notify = true;
                undone = [];
            }

            if (notify)
                _.each(listeners, notifyListener);
        },

        undo: function() {
            if (done.length) {
                var action = done.pop();
                action.rollback();
                undone.push(action);
                notifyAll();
            }
        },

        redo: function() {
            if (undone.length) {
                var action = undone.pop();
                action.commit();
                done.push(action);
                notifyAll();
            }
        }
    });
})(jQuery);
