/**
 * "Remove component" edit action.
 */
$.cf.edit.registerAction('remove', {
    /**
     * Template used to delete (via .id) and recreate the component.  Caller must supply via component or
     * componentTemplate.
     */
    componentTemplate: undefined,

    /**
     * Container into which the component is inserted.  Inferred from component if not supplied.
     */
    containerID: undefined,

    /**
     * Position in container.  Inferred from component if not supplied.
     */
    positionID: undefined,

    initialize: function(options) {
        var component = options.component;
        if (options.componentTemplate)
            this.componentTemplate = options.componentTemplate;
        else {
            if (!component)
                throw "Cannot remove component without template";
            this.componentTemplate = component.properties();
        }

        this.containerID = options.containerID || (options.container && options.container.id);
        if (!this.containerID)
            throw "Cannot remove component without parent";

        this.positionID = options.positionID || (options.position && options.position.id);
    },

    commit: function() {
        var component = $.component(this.componentTemplate.id);
        if (!component)
            throw "Cannot remove component " + component.id + " because it has disappeared";
        component.destroy();
    },

    rollback: function() {
        var component = $.component.create(this.componentTemplate);
        var container = $.component(this.containerID);
        if (!container)
            throw "Cannot add component to container " + this.containerID + " because container has disappeared";
        if (this.positionID) {
            var position = $.component(this.positionID);
            if (!position)
                throw "Cannot add component because following sibling " + this.positionID + " has disappeared";
        }
        container.add(component, position);
    }
});
