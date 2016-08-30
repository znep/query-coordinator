/**
 * This is a special component, used for things like generating
 * URLs and page titles where we may require certain parts of
 * the value to be fixed, but allow others as freeform or
 * based on the value of another component.
 */
;(function($) {

$.component.FunctionalComponent.extend('StringResolver', 'functional', {
    _init: function() {
        var cObj = this;
        cObj._super.apply(cObj, arguments);

        cObj.registerEvent({'child_updated': ['componentID']});
        cObj._stringCache = {};

        // listen to each child for updates
        _.each(cObj._properties.template || [], function(child) {
            if (!child.id)
                return;

            var comp = $.component(child.id, cObj._componentSet);
            if (!comp)
                throw new Error("No component registered with ID " + child.id);

            comp.bind('update_properties', function(args) {
                delete cObj._stringCache[child.id];
                delete cObj._resolved;
                cObj.trigger('child_updated', [{componentID: child.id}]);
            });
        });
    },

    _resolve: function(component) {
        var cObj = this;
        if (_.isString(component))
            return cObj._stringSubstitute(component);
        if (component.id) {
            if (!cObj._stringCache[component.id]) {
                var comp = $.component(component.id, cObj._componentSet),
                    val;
                if (_.isFunction(comp.asString)) {
                    val = comp.asString();
                }
                else {
                    // todo: more intelligent fallback
                    throw new Error("Component " + component.id + " doesn't support asString");
                }
                cObj._stringCache[component.id] = cObj._properties.url ?
                    $.urlSafe(val) : val;

            }
            return cObj._stringCache[component.id];
        }
        return resolve(component);
    },

    asString: function(force) {
        var cObj = this;
        if (!cObj._resolved || force) {
            cObj._resolved = _.map($.makeArray(cObj._properties.template), function(c) {
                return cObj._resolve(c);
            }).join("") || '';
        }
        return cObj._resolved;
    }
});

var resolve = function(component) {
    switch(component.type) {
        case 'date':
            var date = Date.parse(component.date || 'today');
            return date.toString(component.format);
        default:
            throw new Error("Don't know how to resolve type " + component.type);
    }
};

})(jQuery);
