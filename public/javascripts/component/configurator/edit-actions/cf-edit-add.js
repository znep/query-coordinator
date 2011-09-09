/**
 * "Add child component" action.
 */
$.cf.edit.registerAction('add', {
    // Caller must supply via containerID or container
    containerID: undefined,

    // Caller must supply via childTemplate or type
    childTemplate: undefined,

    // Optional ID of following sibling, caller may supply via positionID or position
    positionID: undefined,

    initialize: function(options) {
        this.containerID = options.containerID || (options.container && options.container.properties().id);
        if (!this.containerID)
            throw "Cannot perform add without container reference";
        this.positionID = options.positionID || (options.position && options.position.id);
        this.childTemplate = options.childTemplate;
        if (!options.childTemplate) {
            var type = options.type;
            if (!type)
                throw "Cannot perform add without child definition";
            this.childTemplate = $.extend({
                type: type.typeName
            }, type.defaults);
        }
    },

    commit: function() {
        // Obtain container
        var container = $.component(this.containerID);
        if (!container)
            throw "Cannot commit add because container " + this.containerID + " has disappeared";

        // Obtain position
        if (this.positionID) {
            var position = $.component(this.positionID);
            if (!position)
                throw "Cannot commit add because following sibling " + this.positionID + " has disappeared";
        }

        // Instantiate child and record ID if necessary (ID must persist across undo/redo for later stages to work)
        var childTemplate = this.childTemplate;
        var child = $.component.create(childTemplate);
        if (!childTemplate.id)
            childTemplate.id = child.id;

        // Perform the actual add operation
        container.add(child, position);
    },

    rollback: function() {
        var child = $.component(this.childTemplate.id);
        if (!child)
            throw "Cannot undo because component " + this.childTemplate.id + " has disappeared";
        child.destroy();
    }
});
