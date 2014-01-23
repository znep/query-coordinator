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
        this.origProperties = options.properties;
        if ($.isBlank(this.origProperties))
        { throw new Error("Need properties to apply"); }

        var comp = this.origComp = options.component;
        if ($.isBlank(comp))
        { throw new Error("Need component to apply properties to"); }
        while (comp._designSubsidiary && !$.isBlank(comp.parent))
        { comp = comp.parent; }
        this.origParent = comp;

        if (comp == this.origComp)
        {
            this.properties = this.origProperties;
            delete this.origProperties;
            delete this.origComp;
            delete this.origParent;
        }

        this.componentID = comp.id;

        this.oldProperties = options.oldProperties;
        if ($.isBlank(this.oldProperties))
        {
            if (!$.isBlank(this.origParent))
            { this.origParentProperties = this.origParent.properties(); }
            else
            { this.oldProperties = objInvert(this.properties, comp.properties()); }
        }

        this.noop = _.isEqual(this.properties, this.oldProperties);
    },

    commit: function()
    {
        var editObj = this;
        var components = $.component(editObj.componentID, true);
        if (_.isEmpty(components))
        { throw new Error("Component " + editObj.componentID + " doesn't exist"); }

        if (!$.isBlank(this.origProperties) && !$.isBlank(this.origComp))
        {
            this.origComp.properties(this.origProperties);
            this.properties = this.origParent.properties();
            this.oldProperties = objInvert(this.properties, this.origParentProperties);
            delete this.origComp;
            delete this.origParent;
            delete this.origProperties;
            delete this.origParentProperties;
        }

        _.each(components, function(c) { c.properties(editObj.properties); });
    },

    rollback: function()
    {
        var editObj = this;
        var components = $.component(editObj.componentID, true);
        if (_.isEmpty(components))
        { throw new Error("Component " + editObj.componentID + " doesn't exist"); }
        _.each(components, function(c) { c.properties(editObj.oldProperties); });
    }
});

var objInvert = function(newObj, refObj)
{
    if (_.isUndefined(refObj)) { return null; }
    if (!(refObj instanceof Object) || _.isEqual(newObj, refObj)) { return refObj; }
    var invObj = _.isArray(newObj) ? [] : {};
    _.each(newObj, function(v, k)
            { invObj[k] = objInvert(newObj[k], refObj[k]); });
    return invObj;
};
})(jQuery);
