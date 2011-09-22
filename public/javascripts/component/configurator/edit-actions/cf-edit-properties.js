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
        { throw "Need properties to apply"; }

        this.componentID = options.componentID;
        if ($.isBlank(this.componentID))
        { throw "Need componentID to apply properties to"; }

        this.oldProperties = options.oldProperties;
        if ($.isBlank(this.oldProperties))
        {
            var component = $.component(this.componentID);
            if ($.isBlank(component))
            { throw "Component " + this.componentID + " doesn't exist, and no oldProperties provided"; }
            this.oldProperties = component.properties();
        }
    },

    commit: function()
    {
        var component = $.component(this.componentID);
        if ($.isBlank(component))
        { throw "Component " + this.componentID + " doesn't exist"; }
        component.properties(this.properties);
    },

    rollback: function()
    {
        var component = $.component(this.componentID);
        if ($.isBlank(component))
        { throw "Component " + this.componentID + " doesn't exist"; }
        component.properties(this.oldProperties);
    }
});
