/**
 * "Add child component" action.
 */
$.cf.edit.registerAction('move', {
    // Caller must supply via childID or child
    childID: undefined,

    // Caller must supply via newContainerID or container
    newContainerID: undefined,

    // Optional ID of new following sibling, caller may supply via newPositionID or position
    newPositionID: undefined,

    // Rollback container, caller must supply via oldContainerID or oldContainer
    oldContainerID: undefined,

    // Optional rollback position, supplied via oldPositionID or oldPosition
    oldPositionID: undefined,

    initialize: function(options) {
        var child = options.child;
        this.childID = (child && child._properties.id) || options.childID;
        if (!this.childID)
            throw "Cannot perform move without child reference";

        this.newContainerID = options.newContainerID || (options.newContainer && options.newContainer._properties.id);
        if (!this.newContainerID)
            throw "Cannot perform move without new container reference";
        this.newPositionID = options.newPositionID || (options.newPosition && options.newPosition._properties.id);

        this.oldContainerID = options.oldContainerID || (options.oldContainer && options.oldContainer._properties.id);
        if (!this.oldContainerID)
            throw "Cannot perform move without old container reference";
        this.oldPositionID = options.oldPositionID || (options.oldPosition && options.oldPosition._properties.id);
    },

    commit: function() {
        // Obtain the child
        var child = $.component(this.childID);
        if (!child)
            throw "Cannot commit move because component " + this.childID + " has disappeared";

        // Obtain new container
        var container = $.component(this.newContainerID);
        if (!container)
            throw "Cannot commit move because container " + this.newContainerID + " has disappeared";

        // Obtain position
        if (this.newPositionID) {
            var position = $.component(this.newPositionID);
            if (!position)
                throw "Cannot commit add because following sibling " + this.positionID + " has disappeared";
        }

        // Perform the actual move
        container.add(child, position);
    },

    rollback: function() {
        // Obtain the child
        var child = $.component(this.childID);
        if (!child)
            throw "Cannot undo move because component " + this.childID + " has disappeared";

        // Obtain new container
        var container = $.component(this.oldContainerID);
        if (!container)
            throw "Cannot undo move because container " + this.oldContainerID + " has disappeared";

        // Obtain position
        if (this.oldPositionID) {
            var position = $.component(this.oldPositionID);
            if (!position)
                throw "Cannot undo move because following sibling " + this.oldPositionID + " has disappeared";
        }

        // Perform the actual move
        container.add(child, position);
    }
});
