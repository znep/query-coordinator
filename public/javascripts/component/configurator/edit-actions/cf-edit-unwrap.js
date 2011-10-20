/**
 * "Remove container from child" edit action.
 */
$.cf.edit.registerAction('unwrap', {
    // The child to unwrap, caller must supply via childID or child
    childID: undefined,

    // The container class to use for wrapping, required
    containerTemplate: undefined,

    initialize: function(options) {
        this.childID = options.childID || (options.child && options.child._properties.id);
        if (!this.childID)
            throw "Unwrap requires ID of child";
        this.containerTemplate = options.containerTemplate || (options.child && options.child.parent && options.child.properties());
        if (!this.containerTemplate)
            throw "Unwrap requires template for wrapping container";
    },

    commit: function() {
        var child = $.component(this.childID);
        if (!child)
            throw "Cannot unwrap " + this.childID + " because the component has disappeared";
        var parent = child.parent;
        if (!parent)
            throw "Cannot unwrap " + this.childID + " because it is unparented";
        $.component.Container.unwrap(child);
    },

    rollback: function() {
        var child = $.component(this.childID);
        if (!child)
            throw "Cannot wrap " + this.childID + " because the component has disappeared";
        $.component.Container.wrap(child, this.containerTemplate);
    }
});
