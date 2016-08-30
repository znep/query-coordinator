/**
 * User change management and journaling.
 */
(function($) {
    var registry = {};
    var done = [];
    var undone = [];
    var listeners = [];
    var transaction = undefined;

    function notifyListener(listener) {
        listener(done.length > 0, undone.length > 0);
    }

    function notifyAll() {
        $.cf.edit.dirty = !!done.length;
        _.each(listeners, notifyListener);
    }

    function createAction(typeName, config) {
        var Action = registry[typeName];
        if (!Action)
            throw "Unsupported action " + typeName;
        return new Action(config);
    }

    $.extend($.cf.edit, {
        /**
         * Register a new journal operation.  We handle operations via registry (vs. having components simply pass in
         * functions) so we can potentially serialize undo/redo history in the future.
         */
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

        /**
         * Register a listener that is invoked when undo/redo state changes.
         */
        registerListener: function(fn) {
            listeners.push(fn);
            notifyListener(fn);
        },

        /**
         * Execute an action.  If a transaction is in effect the operation becomes part of the transaction.  Otherwise
         * it becomes a unary "batch".
         */
        execute: function(typeName, config) {
            var action = createAction(typeName, config);
            if (action.noop === true) { return; }
            action.commit();

            if (transaction) {
                transaction.push(action);
                return;
            }

            var notify = !done.length;
            action.checkpoint = true;
            done.push(action);

            if (undone.length) {
                notify = true;
                undone = [];
            }

            if (notify)
                notifyAll();
        },

        /**
         * Add an action to the undo queue that executed in an external context.  Requires active transaction.
         */
        executed: function(typeName, config) {
            if (!transaction)
                throw "Illegal executed outside of transaction";

            var action = createAction(typeName, config);
            transaction.push(action);
        },

        /**
         * Call rollback() on the most recent batch of actions.
         */
        undo: function() {
            if (done.length) {
                do {
                    var action = done.pop();
                    action.rollback();
                    undone.push(action);
                } while (done.length && !done[done.length - 1].checkpoint);
                notifyAll();
            }
        },

        /**
         * Call commit() on the most recent batch of undone actions.
         */
        redo: function() {
            if (undone.length) {
                do {
                    var action = undone.pop();
                    action.commit();
                    done.push(action);
                } while (!action.checkpoint && undone.length);
                notifyAll();
            }
        },

        /**
         * Begin an operational transaction.  While a transaction is in effect, all calls to execute() are queued in
         * a temporary holding bin.  The bin is emptied in response to either commit() or rollback().
         */
        beginTransaction: function() {
            if (transaction)
                this.rollback();
            transaction = [];
        },

        /**
         * Undo all transactional actions and clear the transaction.
         */
        rollback: function() {
            if (!transaction)
                return;
            while (transaction.length)
                transaction.pop().rollback();
            transaction = undefined;
        },

        /**
         * Apply all transactional actions.
         */
        commit: function() {
            if (!transaction)
                return;
            if (transaction.length) {
                var notify = !done.length;
                done = done.concat(transaction);
                done[done.length - 1].checkpoint = true;

                if (undone.length) {
                    notify = true;
                    undone = [];
                }

                if (notify)
                    notifyAll();
            }
            transaction = undefined;
        },

        /**
         * Erase all edit state, optionally reverting to un-edited state.
         */
        reset: function() {
            done = [];
            undone = [];
            notifyAll();
        },

        _localeChange: function() {
            notifyAll();
        }
    });
})(jQuery);
