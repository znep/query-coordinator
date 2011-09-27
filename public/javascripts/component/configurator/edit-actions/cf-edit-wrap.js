/**
 * "Add container around child" edit action.
 */
$.cf.edit.registerAction('wrap', {
    // The child to wrap, caller must supply via childID or child
    childID: undefined,

    // The container properties to use for wrapping.  Required
    containerTemplate: undefined,

    initialize: function(options) {
        this.childID = options.childID || (options.child && options.child.id);
        if (!this.childID)
            throw "Wrap requires ID of child";
        this.containerTemplate = options.containerTemplate;
        if (!this.containerTemplate)
            throw "Wrap requires template for wrapping container";
    },

    commit: function() {
        var child = $.component(this.childID);
        if (!child)
            throw "Cannot wrap " + this.childID + " because the component has disappeared";
        $.component.Container.wrap(child, this.containerTemplate);
    },

    rollback: function() {
        var child = $.component(this.childID);
        if (!child)
            throw "Cannot unwrap " + this.childID + " because the component has disappeared";
        $.component.Container.unwrap(child);
    }
});
