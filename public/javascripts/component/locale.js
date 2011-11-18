(function($) {
    DEFAULT_LOCALE = 'en_us';

    currentValues = {};

    $.locale = function(token) {
        var parsed = /^([^:]+)(?::(.*))?$/.exec(token);
        var name = parsed[1];
        var defaultValue = parsed[2];

        return currentValues[name] || defaultValue;
    }

    /**
     * This class represents a bundle of locales.  A "locale" is a simple hash of tokens to insertion values.
     */
    function Bundle(values) {
        if (!values)
            values = {};
        var changes;

        $.extend(this, {
            get: function(locale) {
                locale = locale.split(/[_\-]/g);
                var result = {};
                var key;
                for (var i = 0; i < locale.length; i++) {
                    if (key)
                        key += '-' + locale[i];
                    else
                        key = locale[i];
                    $.extend(result, values[key]);
                    if (changes)
                        $.extend(result, changes[key]);
                }
                return result;
            },

            set: function(locale, token, value) {
                if (!changes)
                    changes = {};
                if (!changes[locale])
                    changes[locale] = {};
                if (!value)
                    value = undefined;
                if (values[locale] && values[locale][token] === value) {
                    delete changes[locale][token];
                    if (_.isEmpty(changes[locale])) {
                        delete changes[locale];
                        if (_.isEmpty(changes))
                            changes = undefined;
                    }
                } else {
                    if (changes[locale][token] === value)
                        return;
                    changes[locale][token] = value;
                }
                $.cf.edit._localeChange();
            },

            available: function() {
                return _.keys(values);
            },

            isDirty: function() {
                return !!changes;
            },

            reset: function() {
                changes = undefined;
            },

            updated: function() {
                var updated = {};
                _.each(values, function(locale, id) {
                    updated[id] = $.extend({}, locale);
                });
                _.each(changes, function(localeChanges, id) {
                    var locale = updated[id] || (updated[id] = {});
                    _.each(localeChanges, function(value, token) {
                        if (!value)
                            delete locale[token];
                        else
                            locale[token] = value;
                    });
                    if (_.isEmpty(locale))
                        delete updated[id];
                });
                return updated;
            }
        });
    }

    $.extend($.locale, {
        current: DEFAULT_LOCALE,
        fallback: DEFAULT_LOCALE,
        globals: new Bundle(),
        locals: new Bundle(),

        initialize: function(options) {
            if (!options)
                options = {};

            if (options.current)
                this.current = options.current || this.current || DEFAULT_LOCALE;
            if (options.fallback)
                this.fallback = options.fallback || this.fallback || DEFAULT_LOCALE;
            if (options.globals)
                this.globals = new Bundle(options.globals);
            if (options.locals)
                this.locals = new Bundle(options.locals);

            currentValues = $.extend({},
                this.globals.get(this.fallback),
                this.locals.get(this.fallback),
                this.globals.get(this.current),
                this.locals.get(this.current)
            );
        },

        isDirty: function() {
            return this.globals.isDirty() || this.locals.isDirty();
        },

        reset: function() {
            this.globals.reset();
            this.locals.reset();
        },

        updated: function() {
            return {
                globals: this.globals.updated(),
                locals: this.locals.updated()
            };
        }
    });
})(jQuery);
