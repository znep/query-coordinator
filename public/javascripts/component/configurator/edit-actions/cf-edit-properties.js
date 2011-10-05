;(function($) {
/**
 * "Edit properties" action.
 */
$.cf.edit.registerAction('properties', {
    // Must supply component
    componentID: null,

    // Previous properties
    oldProperties: null,

    // Must supply newly-applied properties
    properties: null,

    initialize: function(options)
    {
        this.properties = options.properties;
        if ($.isBlank(this.properties))
        { throw new Error("Need properties to apply"); }

        this.componentID = options.componentID;
        if ($.isBlank(this.componentID))
        { throw new Error("Need componentID to apply properties to"); }

        this.oldProperties = options.oldProperties;
        if ($.isBlank(this.oldProperties))
        {
            var component = $.component(this.componentID);
            if ($.isBlank(component))
            {
                throw new Error("Component " + this.componentID +
                        " doesn't exist, and no oldProperties provided");
            }
            this.oldProperties = objInvert(this.properties, component.properties());
        }
    },

    commit: function()
    {
        var component = $.component(this.componentID);
        if ($.isBlank(component))
        { throw new Error("Component " + this.componentID + " doesn't exist"); }
        component.properties(this.properties);
    },

    rollback: function()
    {
        var component = $.component(this.componentID);
        if ($.isBlank(component))
        { throw new Error("Component " + this.componentID + " doesn't exist"); }
        component.properties(this.oldProperties);
    }
});

var objInvert = function(newObj, refObj)
{
    if (_.isUndefined(refObj)) { return null; }
    if (!(refObj instanceof Object) || _.isEqual(newObj, refObj)) { return refObj; }
    var invObj = {};
    _.each(newObj, function(v, k)
            { invObj[k] = objInvert(newObj[k], refObj[k]); });
    return invObj;
};
})(jQuery);
