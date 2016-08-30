/**
 * 'Remove component' edit action.
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
    if (options.componentTemplate) {
      this.componentTemplate = options.componentTemplate;
    } else {
      if (!component)
        throw 'Cannot remove component without template';
      this.componentTemplate = component.properties();
    }

    this.containerID = options.containerID || (options.container && options.container.id);
    if (!this.containerID)
      throw 'Cannot remove component without parent';

    this.positionID = options.positionID || (options.position && options.position.id);
  },

  commit: function() {
    var components = $.component(this.componentTemplate.id, true);
    if (_.isEmpty(components)) {
      throw new Error('Cannot remove component ' + this.componentTemplate.id +
        ' because it has disappeared');
    }
    _.each(components, function(c) {
      c.destroy();
    });
  },

  rollback: function() {
    var editObj = this;
    var containers = $.component(editObj.containerID, true);
    if (_.isEmpty(containers)) {
      throw new Error('Cannot add component to container ' + editObj.containerID +
        ' because container has disappeared');
    }

    _.each(containers, function(container) {
      var component = $.component.create(editObj.componentTemplate, container._componentSet);
      if (editObj.positionID) {
        var position = $.component(editObj.positionID, container._componentSet);
        if (!position) {
          throw new Error('Cannot add component because following sibling ' +
            editObj.positionID + ' has disappeared');
        }
      }
      container.add(component, position);
    });
  }
});
