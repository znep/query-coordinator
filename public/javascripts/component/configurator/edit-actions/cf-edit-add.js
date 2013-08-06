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
        this.containerID = options.containerID || (options.container && options.container.id);
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

    commit: function()
    {
        var editObj = this;
        // Obtain container
        var containers = $.component(editObj.containerID, true);
        if (_.isEmpty(containers))
        { throw new Error("Cannot commit add because container " + this.containerID + " has disappeared"); }

        var children = _.map(containers, function(container)
        {
            // Obtain position
            if (editObj.positionID)
            {
                var position = $.component(editObj.positionID, container._componentSet);
                if (!position)
                {
                    throw new Error("Cannot commit add because following sibling " +
                        editObj.positionID + " has disappeared");
                }
            }

            // Instantiate child and record ID if necessary (ID must persist
            // across undo/redo for later stages to work)
            var childTemplate = editObj.childTemplate;
            var child = $.component.create(childTemplate, container._componentSet);
            if (!childTemplate.id)
            { childTemplate.id = child.id; }

            // Perform the actual add operation
            container.add(child, position);
            return child;
        });

        // Make sure a delayed-visible component is rendered
        $.component.sizeRenderRefresh();
        $.cf.focus(_.find(children, function(c) { return c._componentSet == 'edit'; }), true);
    },

    rollback: function()
    {
        var editObj = this;
        var children = $.component(editObj.childTemplate.id, true);
        if (_.isEmpty(children))
        { throw new Error("Cannot undo because component " + this.childTemplate.id + " has disappeared"); }
        _.each(children, function(child) { child.destroy(); });
    }
});
